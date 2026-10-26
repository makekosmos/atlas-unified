//! AppKit-native adapter for the same JSON command/event contract as GPUI.

use std::{rc::Rc, sync::mpsc, thread, time::Duration};

use nsh_platform_macos::objc2::MainThreadOnly;
use nsh_platform_macos::{AppView, ComponentContext, ComponentFactory, NativeComponent};
use serde_json::{json, Value};

use crate::{
    appearance::{Response, APP_ID},
    model::{new_todo, Status},
    store::{Engine, JournalEntry},
};

enum Request {
    Route(String),
    Complete(String),
    Create(String),
    JournalCreate(String),
    JournalUpdate(String, String),
    JournalDelete(String),
    Appearance(Value),
    Reload,
}

pub(crate) fn register(view: &AppView) {
    let factory: ComponentFactory = Rc::new(|context| Box::new(AtlasBridge::new(context)));
    view.register_component("atlas.bridge", factory);
}

pub(crate) fn initial_snapshot() -> Value {
    let palette = &crate::palettes::THEMES[0].dark;
    let color = |value: u32| format!("#{value:06x}");
    let themes: Vec<Value> = crate::palettes::THEMES
        .iter()
        .map(|theme| json!({"key": theme.key, "name": theme.name}))
        .collect();
    json!({
        "route": "journal",
        "title": "Дневник",
        "todos": [],
        "journalEntries": [],
        "version": env!("CARGO_PKG_VERSION"),
        "appearanceEditable": false,
        "themes": themes,
        "colors": {
            "background": color(palette.bg),
            "foreground": color(palette.fg),
            "muted": color(palette.muted_fg),
            "border": color(palette.border),
            "accent": color(palette.accent),
            "card": color(palette.card),
        },
        "sidebarVisible": true,
        "chrome": "native"
    })
}

struct AtlasBridge {
    route: String,
    requests: mpsc::Sender<Request>,
}

impl AtlasBridge {
    fn new(context: ComponentContext) -> Self {
        let (requests, receiver) = mpsc::channel();
        thread::spawn(move || {
            let engine = Engine::default();
            let mut route = "journal".to_owned();
            let mut entries = engine.journal_list().unwrap_or_default();
            publish(&engine, &context, &route, &entries);
            loop {
                let mut refresh = false;
                match receiver.recv_timeout(Duration::from_millis(30)) {
                    Ok(Request::Route(next)) => {
                        route = next;
                        refresh = true;
                    }
                    Ok(Request::Complete(id)) => {
                        complete(&engine, &id);
                        refresh = true;
                    }
                    Ok(Request::Create(title)) => {
                        create_task(&engine, &title);
                        refresh = true;
                    }
                    Ok(Request::JournalCreate(text)) => {
                        match engine.journal_create(&text) {
                            Ok(entry) => {
                                entries.push(entry);
                                entries.sort_by(|a, b| {
                                    a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id))
                                });
                            }
                            Err(error) => {
                                eprintln!("[atlas-journal] create failed: {error:?}");
                            }
                        }
                        refresh = true;
                    }
                    Ok(Request::JournalUpdate(id, text)) => {
                        match update_journal(&engine, &id, &text, &entries) {
                            Ok(updated) => replace_entry(&mut entries, updated),
                            Err(error) => eprintln!("[atlas-journal] update failed: {error}"),
                        }
                        refresh = true;
                    }
                    Ok(Request::JournalDelete(id)) => {
                        match delete_journal(&engine, &id, &entries) {
                            Ok(()) => entries.retain(|entry| entry.id != id),
                            Err(error) => eprintln!("[atlas-journal] delete failed: {error}"),
                        }
                        refresh = true;
                    }
                    Ok(Request::Appearance(patch)) => {
                        let _ =
                            engine.rpc("appearance.set", json!({"app_id": APP_ID, "patch": patch}));
                        refresh = true;
                    }
                    Ok(Request::Reload) => {
                        refresh = true;
                        entries = engine.journal_list().unwrap_or(entries);
                    }
                    Err(mpsc::RecvTimeoutError::Disconnected) => break,
                    Err(mpsc::RecvTimeoutError::Timeout) => {}
                }
                for picked in imago_window_macos::sidebar_presses() {
                    if matches!(picked.as_str(), "journal" | "tasks" | "settings" | "about") {
                        route = picked.clone();
                        context.emit("navigate", json!({"route": picked}));
                        refresh = true;
                    }
                }
                if refresh {
                    publish(&engine, &context, &route, &entries);
                }
            }
        });
        Self {
            route: "journal".into(),
            requests,
        }
    }
}

impl NativeComponent for AtlasBridge {
    fn view(
        &self,
    ) -> nsh_platform_macos::objc2::rc::Retained<nsh_platform_macos::objc2_app_kit::NSView> {
        let mtm = nsh_platform_macos::objc2::MainThreadMarker::new()
            .expect("Atlas bridge is created on AppKit thread");
        let frame = objc2_foundation::NSRect::new(
            objc2_foundation::NSPoint::new(0.0, 0.0),
            objc2_foundation::NSSize::new(0.0, 0.0),
        );
        nsh_platform_macos::objc2_app_kit::NSView::initWithFrame(
            nsh_platform_macos::objc2_app_kit::NSView::alloc(mtm),
            frame,
        )
    }

    fn set_prop(&mut self, name: &str, value: Option<&Value>) {
        if name == "route" {
            let route = value.and_then(Value::as_str).unwrap_or("journal");
            if route != self.route {
                self.route = route.to_owned();
                let _ = self.requests.send(Request::Route(self.route.clone()));
            }
        }
    }

    fn command(&mut self, name: &str, args: &Value) {
        let string = |key| args.get(key).and_then(Value::as_str).map(str::to_owned);
        let request = match name {
            "complete" => string("id").map(Request::Complete),
            "create" => string("title").map(Request::Create),
            "journal.create" => string("text").map(Request::JournalCreate),
            "journal.update" => match (string("id"), string("text")) {
                (Some(id), Some(text)) => Some(Request::JournalUpdate(id, text)),
                _ => None,
            },
            "journal.delete" => string("id").map(Request::JournalDelete),
            "appearance.set" => Some(Request::Appearance(args.clone())),
            "reload" => Some(Request::Reload),
            "toggle-sidebar" => None,
            _ => None,
        };
        if let Some(request) = request {
            let _ = self.requests.send(request);
        }
    }
}

fn publish(engine: &Engine, context: &ComponentContext, route: &str, entries: &[JournalEntry]) {
    let loaded = engine.load();
    let todos = loaded.map(|value| value.todos).unwrap_or_default();
    let appearance = engine.rpc("appearance.get", json!({"app_id": APP_ID})).ok();
    let response = appearance
        .as_ref()
        .and_then(|value| Response::parse(value).ok());
    let dark = response.as_ref().is_none_or(|appearance| {
        !matches!(&appearance.settings.mode, crate::appearance::Mode::Light)
    });
    let theme_idx = response
        .as_ref()
        .map(|appearance| appearance.theme_index(dark))
        .unwrap_or(0);
    let theme = &crate::palettes::THEMES[theme_idx];
    let palette = if dark { &theme.dark } else { &theme.light };
    let color = |value: u32| format!("#{value:06x}");
    let accent = response
        .as_ref()
        .and_then(Response::accent)
        .unwrap_or(palette.accent);
    let colors = json!({
        "background": color(palette.bg),
        "foreground": color(palette.fg),
        "muted": color(palette.muted_fg),
        "border": color(palette.border),
            "accent": color(accent),
        "card": color(palette.card),
    });
    let theme_choices: Vec<Value> = crate::palettes::THEMES
        .iter()
        .map(|theme| json!({"key": theme.key, "name": theme.name}))
        .collect();
    let title = match route {
        "tasks" => "Задачи",
        "settings" => "Настройки",
        "about" => "О приложении",
        _ => "Дневник",
    };
    let state = json!({
        "route": route,
        "title": title,
        "todos": todos,
        "journalEntries": entries.iter().map(journal_json).collect::<Vec<_>>(),
        "version": env!("CARGO_PKG_VERSION"),
        "appearance": appearance,
        "appearanceEditable": response.as_ref().is_some_and(|value| value.policy.editable),
        "themes": theme_choices,
        "colors": colors,
        "sidebarVisible": !imago_window_macos::sidebar_collapsed(),
        "chrome": "native"
    });
    context.emit(
        "journal",
        json!(entries.iter().map(journal_json).collect::<Vec<_>>()),
    );
    context.emit("state", state);
}

fn journal_json(entry: &JournalEntry) -> Value {
    json!({"id": entry.id, "text": entry.text, "createdAt": entry.created_at})
}

fn complete(engine: &Engine, id: &str) {
    let Ok(snapshot) = engine.load() else { return };
    let Some(before) = snapshot.todos.into_iter().find(|todo| todo.id == id) else {
        return;
    };
    let mut todo = before.clone();
    todo.is_completed = !before.is_completed;
    todo.status = if todo.is_completed {
        Status::Done
    } else {
        Status::Inbox
    };
    todo.completed_at = todo.is_completed.then(|| chrono::Utc::now().to_rfc3339());
    if let Err(error) = engine.save(Some(&before), &todo) {
        eprintln!("[atlas-tasks] complete failed: {error:?}");
    }
}

fn create_task(engine: &Engine, title: &str) {
    let title = title.trim();
    if title.is_empty() {
        return;
    }
    let Ok(snapshot) = engine.load() else { return };
    let mut todo = new_todo(uuid::Uuid::new_v4().to_string(), title);
    todo.sort_order = snapshot.todos.len() as i32;
    todo.created_at = chrono::Utc::now().to_rfc3339();
    if let Err(error) = engine.save(None, &todo) {
        eprintln!("[atlas-tasks] create failed: {error:?}");
    }
}

fn update_journal(
    engine: &Engine,
    id: &str,
    text: &str,
    entries: &[JournalEntry],
) -> Result<JournalEntry, String> {
    let entry = entries
        .iter()
        .find(|entry| entry.id == id)
        .cloned()
        .ok_or("journal entry not found")?;
    engine
        .journal_update(&entry, text)
        .map_err(|error| format!("{error:?}"))
}

fn delete_journal(engine: &Engine, id: &str, entries: &[JournalEntry]) -> Result<(), String> {
    let entry = entries
        .iter()
        .find(|entry| entry.id == id)
        .cloned()
        .ok_or("journal entry not found")?;
    engine
        .journal_delete(&entry)
        .map_err(|error| format!("{error:?}"))?;
    Ok(())
}

fn replace_entry(entries: &mut [JournalEntry], updated: JournalEntry) {
    if let Some(entry) = entries.iter_mut().find(|entry| entry.id == updated.id) {
        *entry = updated;
    }
}

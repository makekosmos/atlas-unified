use std::{cell::RefCell, rc::Rc, sync::mpsc, thread};

use gpui::{App, Entity, Subscription, Window};
use imago_nsh::{ComponentContext, NativeComponent};
use serde_json::{json, Value};

use crate::{
    app::Atlas,
    model::Todo,
    store::{Engine, JournalEntry},
};

pub(crate) struct AtlasBridge {
    context: ComponentContext,
    agenda: Entity<Atlas>,
    route: Rc<RefCell<String>>,
    journal_commands: mpsc::Sender<JournalRequest>,
    subscription: Option<Subscription>,
}

impl AtlasBridge {
    pub(crate) fn new(context: ComponentContext, agenda: Entity<Atlas>) -> Self {
        let journal_commands = start_journal_bridge(context.clone());
        Self {
            context,
            agenda,
            route: Rc::new(RefCell::new("journal".into())),
            journal_commands,
            subscription: None,
        }
    }

    fn publish(&self, cx: &App) {
        let agenda = self.agenda.read(cx);
        let route = self.route.borrow().clone();
        self.context.emit("state", snapshot(agenda, &route));
    }
}

pub(crate) fn initial_snapshot(agenda: &Atlas) -> Value {
    snapshot(agenda, "journal")
}

fn snapshot(agenda: &Atlas, route: &str) -> Value {
    let todos: Vec<&Todo> = if route == "tasks" {
        agenda.todos.iter().collect()
    } else {
        Vec::new()
    };
    let title = match route {
        "journal" => "Дневник",
        "tasks" => "Задачи",
        "settings" => "Настройки",
        _ => "Дневник",
    };
    let theme_idx = agenda
        .appearance
        .as_ref()
        .map(|appearance| appearance.theme_index(agenda.theme_sel != 0))
        .unwrap_or(agenda.theme_idx);
    let theme = crate::palettes::THEMES
        .get(theme_idx)
        .unwrap_or(&crate::palettes::THEMES[0]);
    let palette = if agenda.theme_sel == 0 {
        &theme.light
    } else {
        &theme.dark
    };
    let color = |value: u32| format!("#{value:06x}");
    let accent = agenda
        .appearance
        .as_ref()
        .and_then(|appearance| appearance.accent())
        .unwrap_or(palette.accent);
    json!({
        "route": route,
        "title": title,
        "todos": todos,
        "journalEntries": [],
        "version": env!("CARGO_PKG_VERSION"),
        "appearance": agenda.appearance,
        "appearanceEditable": agenda.appearance_editable(),
        "themes": crate::palettes::choices_json(),
        "colors": {
            "background": color(palette.bg),
            "foreground": color(palette.fg),
            "muted": color(palette.muted_fg),
            "border": color(palette.border),
            "accent": color(accent),
            "card": color(palette.card),
        },
        "sidebarVisible": agenda.sidebar_visible,
        "chrome": "tsx"
    })
}

enum JournalRequest {
    Create(String),
    Update(String, String),
    Delete(String),
    Reload,
}

fn start_journal_bridge(context: ComponentContext) -> mpsc::Sender<JournalRequest> {
    let (sender, requests) = mpsc::channel();
    thread::spawn(move || {
        let engine = Engine::default();
        let mut entries = engine.journal_list().unwrap_or_default();
        emit_journal_entries(&context, &entries);
        while let Ok(request) = requests.recv() {
            match request {
                JournalRequest::Create(text) => match engine.journal_create(&text) {
                    Ok(entry) => {
                        entries.push(entry);
                        entries
                            .sort_by(|a, b| a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id)));
                    }
                    Err(error) => eprintln!("[atlas-journal] create failed: {error}"),
                },
                JournalRequest::Update(id, text) => {
                    match entries.iter().find(|entry| entry.id == id) {
                        Some(before) => match engine.journal_update(before, &text) {
                            Ok(updated) => replace_journal_entry(&mut entries, updated),
                            Err(error) => eprintln!("[atlas-journal] update failed: {error}"),
                        },
                        None => {
                            eprintln!("[atlas-journal] update failed: entry is no longer visible")
                        }
                    }
                }
                JournalRequest::Delete(id) => match entries.iter().find(|entry| entry.id == id) {
                    Some(before) => match engine.journal_delete(before) {
                        Ok(()) => entries.retain(|entry| entry.id != id),
                        Err(error) => eprintln!("[atlas-journal] delete failed: {error}"),
                    },
                    None => {
                        eprintln!("[atlas-journal] delete failed: entry is no longer visible")
                    }
                },
                JournalRequest::Reload => entries = engine.journal_list().unwrap_or(entries),
            }
            emit_journal_entries(&context, &entries);
        }
    });
    sender
}

fn replace_journal_entry(entries: &mut [JournalEntry], updated: JournalEntry) {
    if let Some(entry) = entries.iter_mut().find(|entry| entry.id == updated.id) {
        *entry = updated;
    }
}

fn emit_journal_entries(context: &ComponentContext, entries: &[JournalEntry]) {
    context.emit(
        "journal",
        json!(entries
            .iter()
            .map(|entry| json!({"id": entry.id, "text": entry.text, "createdAt": entry.created_at}))
            .collect::<Vec<_>>()),
    );
}

impl NativeComponent for AtlasBridge {
    fn render(&mut self, _window: &mut Window, cx: &mut App) -> Option<gpui::AnyElement> {
        if self.subscription.is_none() {
            let context = self.context.clone();
            let route = self.route.clone();
            self.subscription = Some(cx.observe(&self.agenda, move |agenda, cx| {
                let state = agenda.read(cx);
                context.emit("state", snapshot(state, &route.borrow()));
            }));
            self.publish(cx);
        }
        None
    }

    fn set_prop(&mut self, name: &str, value: Option<&Value>, _window: &mut Window, cx: &mut App) {
        if name != "route" {
            return;
        }
        let route = value
            .and_then(Value::as_str)
            .unwrap_or("journal")
            .to_owned();
        if *self.route.borrow() == route {
            return;
        }
        *self.route.borrow_mut() = route;
        let route = self.route.borrow().clone();
        self.agenda.update(cx, |agenda, cx| {
            agenda.current_route = route;
            cx.notify();
        });
        self.publish(cx);
    }

    fn command(&mut self, name: &str, args: &Value, _window: &mut Window, cx: &mut App) {
        match name {
            "journal.create" => {
                if let Some(text) = args.get("text").and_then(Value::as_str) {
                    let _ = self
                        .journal_commands
                        .send(JournalRequest::Create(text.to_owned()));
                }
            }
            "journal.update" => {
                if let (Some(id), Some(text)) = (
                    args.get("id").and_then(Value::as_str),
                    args.get("text").and_then(Value::as_str),
                ) {
                    let _ = self
                        .journal_commands
                        .send(JournalRequest::Update(id.to_owned(), text.to_owned()));
                }
            }
            "journal.delete" => {
                if let Some(id) = args.get("id").and_then(Value::as_str) {
                    let _ = self
                        .journal_commands
                        .send(JournalRequest::Delete(id.to_owned()));
                }
            }
            "complete" => {
                if let Some(id) = args.get("id").and_then(Value::as_str) {
                    let id = id.to_owned();
                    self.agenda
                        .update(cx, |agenda, _| agenda.complete_todo(&id));
                    self.publish(cx);
                }
            }
            "create" => {
                if let Some(title) = args.get("title").and_then(Value::as_str) {
                    let title = title.to_owned();
                    self.agenda
                        .update(cx, |agenda, _| agenda.create_nsh_todo(&title));
                    self.publish(cx);
                }
            }
            "appearance.set" => {
                if let Some(patch) = args.as_object() {
                    self.agenda.update(cx, |agenda, cx| {
                        agenda.persist_appearance_patch(Value::Object(patch.clone()), cx);
                    });
                    self.publish(cx);
                }
            }
            // The shell already painted the new width. Notifying here would
            // emit a snapshot and start that motion over.
            "toggle-sidebar" => {
                self.agenda.update(cx, |agenda, _| agenda.toggle_sidebar());
            }
            "reload" => {
                self.agenda.update(cx, |agenda, _| agenda.reload_storage());
                let _ = self.journal_commands.send(JournalRequest::Reload);
            }
            _ => {}
        }
    }
}

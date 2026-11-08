use std::{
    cell::RefCell,
    rc::Rc,
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc,
    },
    thread,
    time::Duration,
};

use gpui::{App, Entity, Subscription, Window};
use imago_nsh::{ComponentContext, NativeComponent};
use serde_json::{json, Value};

use crate::{
    app::Atlas,
    audio,
    model::Todo,
    store::{Engine, JournalEntry},
};

pub(crate) struct AtlasBridge {
    context: ComponentContext,
    agenda: Entity<Atlas>,
    route: Rc<RefCell<String>>,
    journal_commands: mpsc::Sender<JournalRequest>,
    subscription: Option<Subscription>,
    _journal_subscription: Option<crate::store::live::Subscription>,
    journal_reload_pending: Arc<AtomicBool>,
    voice: Voice,
}

/// The microphone and the speaker, one of each at a time.
#[derive(Default)]
struct Voice {
    recorder: Option<audio::Recorder>,
    level_stop: Option<Arc<AtomicBool>>,
    player: Option<audio::Player>,
}

impl Voice {
    /// Ends the recording; the caller encodes and reports it.
    fn take_recorder(&mut self) -> Option<audio::Recorder> {
        if let Some(flag) = self.level_stop.take() {
            flag.store(true, Ordering::Release);
        }
        self.recorder.take()
    }

    fn stop_playback(&mut self) {
        if let Some(player) = self.player.take() {
            player.stop();
        }
    }
}

impl AtlasBridge {
    pub(crate) fn new(context: ComponentContext, agenda: Entity<Atlas>, demo: bool) -> Self {
        let (journal_commands, journal_subscription, journal_reload_pending) =
            start_journal_bridge(context.clone(), demo);
        Self {
            context,
            agenda,
            route: Rc::new(RefCell::new("journal".into())),
            journal_commands,
            subscription: None,
            _journal_subscription: journal_subscription,
            journal_reload_pending,
            voice: Voice::default(),
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
    CreateVoice(String, Value),
    Update(String, String),
    Delete(String),
    Reload,
}

type JournalChannel = (
    mpsc::Sender<JournalRequest>,
    Option<crate::store::live::Subscription>,
    Arc<AtomicBool>,
);

fn start_journal_bridge(context: ComponentContext, demo: bool) -> JournalChannel {
    let (sender, requests) = mpsc::channel();
    let reload_pending = Arc::new(AtomicBool::new(false));
    if demo {
        emit_journal_entries(&context, &[]);
        return (sender, None, reload_pending);
    }
    let changes = sender.clone();
    let pending = reload_pending.clone();
    let subscription = crate::store::live::spawn(crate::store::JOURNAL_TYPES, move || {
        if !pending.swap(true, Ordering::AcqRel) {
            let _ = changes.send(JournalRequest::Reload);
        }
    });
    let pending = reload_pending.clone();
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
                JournalRequest::CreateVoice(text, voice) => {
                    match engine.journal_create_voice(&text, voice) {
                        Ok(entry) => {
                            entries.push(entry);
                            entries.sort_by(|a, b| {
                                a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id))
                            });
                        }
                        Err(error) => eprintln!("[atlas-journal] voice create failed: {error}"),
                    }
                }
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
                JournalRequest::Reload => {
                    pending.store(false, Ordering::Release);
                    entries = engine.journal_list().unwrap_or(entries);
                }
            }
            emit_journal_entries(&context, &entries);
        }
    });
    (sender, Some(subscription), reload_pending)
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
            .map(|entry| json!({
                "id": entry.id,
                "text": entry.text,
                "createdAt": entry.created_at,
                "voice": entry.voice
            }))
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
            "journal.createVoice" => {
                if let Some(voice) = args.get("voice").filter(|voice| voice.is_object()) {
                    let text = args
                        .get("text")
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_owned();
                    let _ = self
                        .journal_commands
                        .send(JournalRequest::CreateVoice(text, voice.clone()));
                }
            }
            "voice.start" => self.start_recording(),
            "voice.stop" => self.stop_recording(),
            "voice.play" => self.play_voice(args),
            "voice.pause" => self.voice.stop_playback(),
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
                if !self.journal_reload_pending.swap(true, Ordering::AcqRel) {
                    let _ = self.journal_commands.send(JournalRequest::Reload);
                }
            }
            _ => {}
        }
    }
}

impl AtlasBridge {
    /// Opens the microphone and streams its loudness to the composer.
    fn start_recording(&mut self) {
        self.voice.stop_playback();
        let _ = self.voice.take_recorder();
        match audio::Recorder::start() {
            Ok(recorder) => {
                let context = self.context.clone();
                let level = recorder.level_flag();
                let stop = Arc::new(AtomicBool::new(false));
                let flag = stop.clone();
                thread::spawn(move || {
                    while !flag.load(Ordering::Acquire) {
                        context.emit(
                            "voiceLevel",
                            json!({"level": level.load(Ordering::Relaxed)}),
                        );
                        thread::sleep(Duration::from_millis(60));
                    }
                    context.emit("voiceLevel", json!({"level": 0}));
                });
                self.voice.level_stop = Some(stop);
                self.voice.recorder = Some(recorder);
            }
            Err(error) => {
                eprintln!("[atlas-voice] record failed: {error}");
                self.context.emit("voiceFailed", json!({"reason": error}));
            }
        }
    }

    /// Stops the microphone and hands the encoded clip back to the UI.
    fn stop_recording(&mut self) {
        let Some(recorder) = self.voice.take_recorder() else {
            return;
        };
        let context = self.context.clone();
        // Encoding a minute takes milliseconds, but never on the UI thread.
        thread::spawn(move || match recorder.stop() {
            Ok(clip) if !clip.is_empty() => {
                context.emit(
                    "voiceRecorded",
                    json!({
                        "durationMs": clip.duration_ms,
                        "peaks": clip.peaks,
                        "data": clip.to_base64(),
                    }),
                );
            }
            Ok(_) => context.emit("voiceFailed", json!({"reason": "empty"})),
            Err(error) => {
                eprintln!("[atlas-voice] encode failed: {error}");
                context.emit("voiceFailed", json!({"reason": error}));
            }
        });
    }

    fn play_voice(&mut self, args: &Value) {
        self.voice.stop_playback();
        let Some(data) = args.get("data").and_then(Value::as_str) else {
            return;
        };
        let clip = match audio::Clip::from_base64(data) {
            Ok(clip) => clip,
            Err(error) => {
                eprintln!("[atlas-voice] play refused: {error}");
                self.context.emit("voiceFailed", json!({"reason": error}));
                return;
            }
        };
        let context = self.context.clone();
        match audio::Player::play(&clip, move || {
            context.emit("voicePlayed", json!({}));
        }) {
            Ok(player) => self.voice.player = Some(player),
            Err(error) => {
                eprintln!("[atlas-voice] play failed: {error}");
                self.context.emit("voiceFailed", json!({"reason": error}));
            }
        }
    }
}

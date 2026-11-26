mod benchmark;
mod benchmark_session;
mod games;
pub(crate) mod toggle;

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
    store::{Engine, JournalEntry, Note},
};

pub(crate) struct AtlasBridge {
    context: ComponentContext,
    agenda: Entity<Atlas>,
    route: Rc<RefCell<String>>,
    journal_commands: mpsc::Sender<JournalRequest>,
    notes_commands: mpsc::Sender<NotesRequest>,
    games: games::Bridge,
    subscription: Option<Subscription>,
    _journal_subscription: Option<crate::store::live::Subscription>,
    _notes_subscription: Option<crate::store::live::Subscription>,
    journal_reload_pending: Arc<AtomicBool>,
    _notes_reload_pending: Arc<AtomicBool>,
    voice: Voice,
    #[cfg(target_os = "windows")]
    benchmark_baseline: Option<gpui::FrameDurationSnapshot>,
    benchmark_session: benchmark_session::Session,
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
        let (notes_commands, notes_subscription, notes_reload_pending) =
            start_notes_bridge(context.clone(), demo);
        let games = games::Bridge::new(context.clone());
        Self {
            context,
            agenda,
            route: Rc::new(RefCell::new(start_route())),
            journal_commands,
            notes_commands,
            games,
            subscription: None,
            _journal_subscription: journal_subscription,
            _notes_subscription: notes_subscription,
            journal_reload_pending,
            _notes_reload_pending: notes_reload_pending,
            voice: Voice::default(),
            #[cfg(target_os = "windows")]
            benchmark_baseline: None,
            benchmark_session: benchmark_session::session(),
        }
    }

    fn publish(&self, cx: &App) {
        let agenda = self.agenda.read(cx);
        let route = self.route.borrow().clone();
        self.context.emit("state", snapshot(agenda, &route));
    }
}

pub(crate) fn initial_snapshot(agenda: &Atlas) -> Value {
    snapshot(agenda, &start_route())
}

/// The page the window opens on: `ATLAS_ROUTE` for a demo run that has to start
/// somewhere else (the demo screen cannot be clicked from a script), the
/// journal otherwise.
/// The note a demo run opens on: `ATLAS_NOTE` names it, so a screenshot can be
/// taken of one page without a click the script cannot make.
fn start_note() -> Option<String> {
    match std::env::var("ATLAS_NOTE") {
        Ok(note) if !note.trim().is_empty() => Some(note),
        _ => None,
    }
}

fn start_route() -> String {
    match std::env::var("ATLAS_ROUTE") {
        Ok(route) if !route.trim().is_empty() => route,
        _ => "journal".into(),
    }
}

fn snapshot(agenda: &Atlas, route: &str) -> Value {
    let todos: Vec<&Todo> = if route == "tasks" {
        agenda.todos.iter().collect()
    } else {
        Vec::new()
    };
    let title = match route {
        "journal" => "Дневник",
        "notes" => "Заметки",
        "tasks" => "Задачи",
        "games" => "Игры",
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
    let mut value = json!({
        "route": route,
        "openNote": start_note(),
        "title": title,
        "todos": todos,
        "journalEntries": [],
        "version": env!("CARGO_PKG_VERSION"),
        "appearance": agenda.appearance,
        "appearanceEditable": agenda.appearance_editable(),
        "themes": crate::palettes::choices_json(),
        "nshTheme": crate::palettes::nsh_theme(&theme.light, &theme.dark, Some(accent)),
        "colors": {
            "background": color(palette.bg),
            "foreground": color(palette.fg),
            "muted": color(palette.muted_fg),
            "border": color(palette.border),
            "accent": color(accent),
            "card": color(palette.card),
        },
        "sidebarVisible": agenda.sidebar_visible,
        "chrome": "tsx",
        "demo": agenda.demo
    });
    if std::env::var("ATLAS_BENCH_ROLE").as_deref() == Ok("guest") {
        value["benchRole"] = json!("guest");
    }
    value
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
        // The demo journal keeps its entries in memory: writing them is enough
        // to show how the page behaves with a few days of notes.
        let mut entries = crate::model::seed_journal();
        entries.sort_by(|a, b| a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id)));
        emit_journal_entries(&context, &entries);
        let demo_context = context.clone();
        thread::spawn(move || {
            let mut made = 0usize;
            while let Ok(request) = requests.recv() {
                match request {
                    JournalRequest::Create(text) => {
                        made += 1;
                        let id = format!("demo:journal-new-{made}");
                        entries.push(JournalEntry::demo(&id, &text, &now_iso()));
                    }
                    JournalRequest::CreateVoice(text, voice) => {
                        made += 1;
                        let id = format!("demo:journal-new-{made}");
                        let mut entry = JournalEntry::demo(&id, &text, &now_iso());
                        entry.voice = Some(voice);
                        entries.push(entry);
                    }
                    JournalRequest::Update(id, text) => {
                        if let Some(entry) = entries.iter_mut().find(|entry| entry.id == id) {
                            entry.text = text;
                            entry.updated_at = now_iso();
                        }
                    }
                    JournalRequest::Delete(id) => entries.retain(|entry| entry.id != id),
                    JournalRequest::Reload => {}
                }
                entries.sort_by(|a, b| a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id)));
                emit_journal_entries(&demo_context, &entries);
            }
        });
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
        emit_usage(&context, &engine);
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
                    emit_usage(&context, &engine);
                }
            }
            emit_journal_entries(&context, &entries);
        }
    });
    (sender, Some(subscription), reload_pending)
}

fn now_iso() -> String {
    crate::store::now_iso()
}

fn replace_journal_entry(entries: &mut [JournalEntry], updated: JournalEntry) {
    if let Some(entry) = entries.iter_mut().find(|entry| entry.id == updated.id) {
        *entry = updated;
    }
}

fn emit_usage(context: &ComponentContext, engine: &Engine) {
    context.emit("usage", json!(engine.program_usage()));
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

enum NotesRequest {
    Create(String, Value),
    Save(String, String, Value),
    Delete(String),
    Reload,
    /// Fills the demo store with `count` small notes, for the load tests.
    Stress(usize),
    /// Empties the demo store back to its demo notes.
    Reset,
}

type NotesChannel = (
    mpsc::Sender<NotesRequest>,
    Option<crate::store::live::Subscription>,
    Arc<AtomicBool>,
);

fn start_notes_bridge(context: ComponentContext, demo: bool) -> NotesChannel {
    let (sender, requests) = mpsc::channel();
    let reload_pending = Arc::new(AtomicBool::new(false));
    if demo {
        // No Engine in the demo: the command thread keeps the notes in memory so
        // the screen reacts to its own writes.
        let mut notes = demo_notes();
        emit_notes(&context, &notes);
        let demo_context = context.clone();
        thread::spawn(move || {
            let mut created = 0usize;
            while let Ok(request) = requests.recv() {
                // Only a change to what the library holds goes back over the
                // bridge: a save's text is already on screen, and a library of
                // a hundred thousand notes is twenty megabytes to send again.
                let mut fresh = None;
                match request {
                    NotesRequest::Create(title, doc) => {
                        created += 1;
                        let id = format!("demo:note-{created}");
                        let note = Note::demo_doc(&id, &title, &doc, "");
                        fresh = Some(note.clone());
                        notes.insert(0, note);
                    }
                    NotesRequest::Save(id, title, doc) => {
                        if let Some(note) = notes.iter_mut().find(|note| note.id == id) {
                            let updated_at = note.updated_at.clone();
                            *note = Note::demo_doc(&id, &title, &doc, &updated_at);
                        }
                        continue;
                    }
                    NotesRequest::Delete(id) => {
                        notes.retain(|note| note.id != id);
                        continue;
                    }
                    NotesRequest::Reload => {
                        emit_notes(&demo_context, &notes);
                        continue;
                    }
                    NotesRequest::Stress(count) => {
                        notes = demo_notes();
                        notes.splice(0..0, stress_notes(count));
                    }
                    NotesRequest::Reset => notes = demo_notes(),
                }
                match fresh {
                    Some(note) => demo_context.emit("notesCreated", note_json(&note)),
                    None => emit_notes(&demo_context, &notes),
                }
            }
        });
        return (sender, None, reload_pending);
    }
    let changes = sender.clone();
    let pending = reload_pending.clone();
    let subscription = crate::store::live::spawn(crate::store::NOTE_TYPES, move || {
        if !pending.swap(true, Ordering::AcqRel) {
            let _ = changes.send(NotesRequest::Reload);
        }
    });
    let pending = reload_pending.clone();
    thread::spawn(move || {
        let engine = Engine::default();
        let mut notes = match engine.notes_list() {
            Ok(notes) => notes,
            Err(error) => {
                eprintln!("[atlas-notes] list failed: {error}");
                Vec::new()
            }
        };
        emit_notes(&context, &notes);
        while let Ok(request) = requests.recv() {
            // A save sends back the note it saved, not the library around it: a
            // library of a hundred thousand notes is twenty megabytes, and the
            // text on screen is already the text that was saved.
            let mut created = None;
            match request {
                NotesRequest::Create(title, doc) => match engine.notes_create(&title, &doc) {
                    Ok(note) => {
                        created = Some(note.clone());
                        notes.push(note);
                    }
                    Err(error) => eprintln!("[atlas-notes] create failed: {error}"),
                },
                NotesRequest::Save(id, title, doc) => {
                    match notes.iter().find(|note| note.id == id) {
                        Some(before) => match engine.notes_save(before, &title, &doc) {
                            Ok(saved) => {
                                if let Some(note) =
                                    notes.iter_mut().find(|note| note.id == saved.id)
                                {
                                    *note = saved;
                                }
                            }
                            Err(error) => eprintln!("[atlas-notes] save failed: {error}"),
                        },
                        None => eprintln!("[atlas-notes] save failed: note is no longer visible"),
                    }
                    continue;
                }
                NotesRequest::Stress(_) | NotesRequest::Reset => {
                    eprintln!("[atlas-notes] load tests only run in the demo store")
                }
                NotesRequest::Delete(id) => match notes.iter().find(|note| note.id == id) {
                    Some(before) => match engine.notes_delete(before) {
                        Ok(()) => notes.retain(|note| note.id != id),
                        Err(error) => eprintln!("[atlas-notes] delete failed: {error}"),
                    },
                    None => eprintln!("[atlas-notes] delete failed: note is no longer visible"),
                },
                NotesRequest::Reload => {
                    pending.store(false, Ordering::Release);
                    notes = match engine.notes_list() {
                        Ok(notes) => notes,
                        Err(error) => {
                            eprintln!("[atlas-notes] list failed: {error}");
                            notes
                        }
                    };
                }
            }
            notes.sort_by(|left, right| {
                right
                    .updated_at
                    .cmp(&left.updated_at)
                    .then(left.id.cmp(&right.id))
            });
            if let Some(note) = created {
                // The created note is enough. The list behind it would open the
                // page a second time.
                context.emit("notesCreated", note_json(&note));
            } else {
                // The page asks again after it mounts. The first list can leave
                // before that ask is heard, so a reload has to send the list too.
                emit_notes(&context, &notes);
            }
        }
    });
    (sender, Some(subscription), reload_pending)
}

fn emit_notes(context: &ComponentContext, notes: &[Note]) {
    context.emit(
        "notes",
        json!(notes.iter().map(note_json).collect::<Vec<_>>()),
    );
}

fn note_json(note: &Note) -> Value {
    json!({
        "id": note.id,
        "title": note.title,
        "doc": note.doc,
        "text": note.text,
        "createdAt": note.created_at,
        "updatedAt": note.updated_at
    })
}

/// Notes the demo screen shows; nothing is stored. Twelve of them, so the
/// library, the previews, the table of contents and the long page all have
/// something to show.
fn demo_notes() -> Vec<Note> {
    let mut notes = vec![
        Note::demo_doc(
            "demo:welcome",
            "Как устроены заметки",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Заметка живёт в Engine как объект "}, {"type": "text", "marks": [{"type": "code"}], "text": "core.note"}, {"type": "text", "text": ". Другие приложения видят те же заметки."}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Что внутри"}]},
                    {"type": "bulletList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "текст — документ, не Markdown"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "таблицы разрешены с версии 0.2.0"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "слэш открывает блоки на месте курсора"}]}]}
                    ]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Разделы объекта"}]},
                    {"type": "table", "content": [
                        {"type": "tableRow", "content": [
                            {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Раздел"}]}]},
                            {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Что хранит"}]}]}
                        ]},
                        {"type": "tableRow", "content": [
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "propsJson"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "описание и расширения"}]}]}
                        ]},
                        {"type": "tableRow", "content": [
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "contentJson"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "документ с блоки"}]}]}
                        ]}
                    ]},
                    {"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Заголовки этой страницы видны справа: засечки открывают нужный раздел."}]}]}
                ]
            }),
            "2026-11-09T12:00:00.000Z",
        ),
        Note::demo_doc(
            "demo:guide",
            "Руководство по редактору",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Короткая шпаргалка: что умеет редактор и как этим пользоваться."}]},
                    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Блоки"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Текст и списки"}]},
                    {"type": "paragraph", "content": [{"type": "text", "text": "Абзац, "}, {"type": "text", "marks": [{"type": "bold"}], "text": "жирный"}, {"type": "text", "text": ", "}, {"type": "text", "marks": [{"type": "italic"}], "text": "курсив"}, {"type": "text", "text": ", "}, {"type": "text", "marks": [{"type": "code"}], "text": "код"}, {"type": "text", "text": " и "}, {"type": "text", "marks": [{"type": "strike"}], "text": "зачёркнутый"}, {"type": "text", "text": "."}]},
                    {"type": "orderedList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Нумерованный список"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Второй пункт"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Третий пункт"}]}]}
                    ]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Код"}]},
                    {"type": "codeBlock", "attrs": {"language": "rust"}, "content": [{"type": "text", "text": "fn main() {\n    println!(\"привет\");\n}"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Цитата"}]},
                    {"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Пиши коротко. Одна мысль — один абзац."}]}]},
                    {"type": "horizontalRule"},
                    {"type": "paragraph", "content": [{"type": "text", "text": "Разделитель выше закрывает тему."}]}
                ]
            }),
            "2026-11-09T10:40:00.000Z",
        ),
        Note::demo_doc(
            "demo:ideas",
            "Идеи",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Что стоит попробовать в этом году."}]},
                    {"type": "bulletList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Быстрый поиск по заметкам"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Связи между заметками"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Экспорт в папку "}, {"type": "text", "marks": [{"type": "code"}], "text": ".md"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Рельсы оглавления справа"}]}]},
                    ]},
                ]
            }),
            "2026-11-09T11:20:00.000Z",
        ),
        Note::demo_doc(
            "demo:week",
            "План недели",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Четыре дела, дальше — как пойдёт."}]},
                    {"type": "orderedList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Разобрать входящие"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Свести макеты"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Проверить долгую заметку на прокрутку"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Созвон в четверг"}]}]},
                    ]},
                ]
            }),
            "2026-11-08T18:05:00.000Z",
        ),
        Note::demo_doc(
            "demo:table",
            "Расходы за ноябрь",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Таблица в колонке заметки: границы, заголовок и числа по столбцам."}]},
                    {"type": "table", "content": [
                        {"type": "tableRow", "content": [
                            {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Статья"}]}]},
                            {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "План"}]}]},
                            {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Факт"}]}]}
                        ]},
                        {"type": "tableRow", "content": [
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Дом"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "40 000"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "38 200"}]}]}
                        ]},
                        {"type": "tableRow", "content": [
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Еда"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "25 000"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "27 640"}]}]}
                        ]},
                        {"type": "tableRow", "content": [
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Транспорт"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "6 000"}]}]},
                            {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "5 100"}]}]}
                        ]}
                    ]}
                ]
            }),
            "2026-11-07T09:12:00.000Z",
        ),
        Note::demo_doc(
            "demo:borscht",
            "Борщ",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "На четыре порции, полтора часа."}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Продукты"}]},
                    {"type": "bulletList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "свёкла — 2 шт"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "капуста — 300 г"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "говядина — 500 г"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "сметана и зелень"}]}]}
                    ]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Как готовить"}]},
                    {"type": "orderedList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Сварить бульон, снять пену."}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Свёклу потушить с томатом."}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Добавить капусту и картофель."}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Дать настояться полчаса."}]}]}
                    ]},
                    {"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Свёклу не варить, а тушить: цвет остаётся ярким."}]}]}
                ]
            }),
            "2026-11-06T20:30:00.000Z",
        ),
        Note::demo_doc(
            "demo:parser",
            "Разбор парсера",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Как устроен разбор: токены, затем дерево блоков."}]},
                    {"type": "codeBlock", "attrs": {"language": "rust"}, "content": [{"type": "text", "text": "pub fn parse(input: &str) -> Vec<Block> {\n    let mut blocks = Vec::new();\n    for line in input.lines() {\n        blocks.push(classify(line));\n    }\n    blocks\n}"}]},
                    {"type": "paragraph", "content": [{"type": "text", "text": "Классификатор смотрит только на начало строки: это дёшево и покрывает весь Markdown."}]},
                    {"type": "codeBlock", "attrs": {"language": "text"}, "content": [{"type": "text", "text": "# заголовок\n- пункт\n> цитата\n```код```"}]}
                ]
            }),
            "2026-11-05T14:00:00.000Z",
        ),
        Note::demo_doc(
            "demo:code",
            "Код: языки",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Одна заметка, семь языков: так видно, как красится код. Блок без языка остаётся простым."}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Rust"}]},
                    {"type": "codeBlock", "attrs": {"language": "rust"}, "content": [{"type": "text", "text": "use std::collections::HashMap;\n\n/// Считает слова: ключ — слово, значение — сколько раз.\npub fn count_words(text: &str) -> HashMap<String, usize> {\n    let mut counts = HashMap::new();\n    for word in text.split_whitespace() {\n        *counts.entry(word.to_lowercase()).or_insert(0) += 1;\n    }\n    counts\n}\n\nfn main() {\n    let counts = count_words(\"раз два раз\");\n    assert_eq!(counts[\"раз\"], 2);\n    println!(\"{counts:?}\");\n}"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "TypeScript"}]},
                    {"type": "codeBlock", "attrs": {"language": "ts"}, "content": [{"type": "text", "text": "type Note = { id: string; title: string; tags: string[] };\n\nconst byTag = (notes: Note[], tag: string): Note[] =>\n  notes.filter((note) => note.tags.includes(tag));\n\nexport function titles(notes: Note[]): string[] {\n  // Пустое имя не показываем.\n  return notes.map((note) => note.title.trim()).filter(Boolean);\n}"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Python"}]},
                    {"type": "codeBlock", "attrs": {"language": "python"}, "content": [{"type": "text", "text": "from dataclasses import dataclass\n\n@dataclass\nclass Block:\n    kind: str\n    text: str = \"\"\n\ndef headings(blocks: list[Block]) -> list[str]:\n    # Только заголовки, по порядку.\n    return [b.text for b in blocks if b.kind == \"heading\"]"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "JSON"}]},
                    {"type": "codeBlock", "attrs": {"language": "json"}, "content": [{"type": "text", "text": "{\n  \"id\": \"demo:code\",\n  \"title\": \"Код: языки\",\n  \"pinned\": true,\n  \"tags\": [\"пример\", \"код\"],\n  \"size\": 1280\n}"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Bash"}]},
                    {"type": "codeBlock", "attrs": {"language": "bash"}, "content": [{"type": "text", "text": "#!/bin/sh\nset -euo pipefail\n\nfor file in notes/*.md; do\n  echo \"читаю $file\"   # каждый файл\n  wc -l \"$file\"\ndone"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "SQL"}]},
                    {"type": "codeBlock", "attrs": {"language": "sql"}, "content": [{"type": "text", "text": "SELECT n.id, n.title, COUNT(t.id) AS tags\nFROM notes AS n\nLEFT JOIN tags AS t ON t.note_id = n.id\nWHERE n.updated_at > '2026-01-01'\nGROUP BY n.id, n.title\nORDER BY tags DESC\nLIMIT 20;"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "HTML и CSS"}]},
                    {"type": "codeBlock", "attrs": {"language": "html"}, "content": [{"type": "text", "text": "<article class=\"card\" data-id=\"demo:code\">\n  <h2>Код: языки</h2>\n  <p>Одна заметка, семь языков.</p>\n</article>"}]},
                    {"type": "codeBlock", "attrs": {"language": "css"}, "content": [{"type": "text", "text": ".card {\n  display: flex;\n  padding: 16px;\n  border-radius: 12px;\n  background: #17181c; /* тёмный фон */\n}\n\n.card h2 {\n  font-size: 17px;\n  color: #e6e6e6;\n}"}]},
                    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Без языка"}]},
                    {"type": "codeBlock", "content": [{"type": "text", "text": "обычный текст\nбез подсветки\nи с отступами"}]}
                ]
            }),
            "2026-11-10T09:00:00.000Z",
        ),
        Note::demo_doc(
            "demo:quotes",
            "Цитаты",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Две фразы, которые стоит держать под рукой."}]},
                    {"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Простота — это не отсутствие сложности, а её порядок."}]}]},
                    {"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "Пиши так, как будто читатель устал."}]}]},
                ]
            }),
            "2026-11-04T21:15:00.000Z",
        ),
        // A real checklist: a press on a square marks its task done.
        Note::demo_doc(
            "demo:moving",
            "Переезд: чек-лист",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Две недели до переезда. Отметка ставится по квадрату."}]},
                    {"type": "taskList", "content": [
                        {"type": "taskItem", "attrs": {"checked": true}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Выбрать район"}]}]},
                        {"type": "taskItem", "attrs": {"checked": true}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Посчитать расходы"}]}]},
                        {"type": "taskItem", "attrs": {"checked": false}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Собрать коробки"}]}]},
                        {"type": "taskItem", "attrs": {"checked": false}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Отключить интернет"}]}]},
                        {"type": "taskItem", "attrs": {"checked": false}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Передать показания"}]}]},
                    ]},
                ]
            }),
            "2026-11-03T08:45:00.000Z",
        ),
        Note::demo_doc(
            "demo:links",
            "Ссылки и закладки",
            &json!({
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Куда смотреть, когда что-то не сходится."}]},
                    {"type": "bulletList", "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [
                            {"type": "text", "text": "Документация ProseMirror — "},
                            {"type": "text", "marks": [{"type": "link", "attrs": {"href": "https://prosemirror.net", "target": "_blank"}}], "text": "prosemirror.net"}
                        ]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [
                            {"type": "text", "text": "Любой тип — "},
                            {"type": "text", "marks": [{"type": "link", "attrs": {"href": "https://anytype.io", "target": "_blank"}}], "text": "anytype.io"}
                        ]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [
                            {"type": "text", "text": "Markdown — "},
                            {"type": "text", "marks": [{"type": "link", "attrs": {"href": "https://spec.commonmark.org", "target": "_blank"}}], "text": "spec.commonmark.org"}
                        ]}]},
                    ]},
                ]
            }),
            "2026-11-02T17:20:00.000Z",
        ),
        Note::demo_doc(
            "demo:empty",
            "Пустая заметка",
            &json!({"type": "doc", "content": [{"type": "paragraph"}]}),
            "2026-11-01T10:00:00.000Z",
        ),
        Note::demo_doc(
            "demo:long",
            "Долгая заметка",
            &long_demo_doc(),
            "2026-10-30T12:00:00.000Z",
        ),
    ];
    notes.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    notes
}

/// Notes for the load tests: a small document each, so a hundred thousand of
/// them stay a list of rows rather than a hundred thousand pages.
fn stress_notes(count: usize) -> Vec<Note> {
    let mut notes = Vec::with_capacity(count);
    for index in 1..=count {
        // One short line: the number of notes is what is under test, not their
        // size, and a hundred thousand of them cross the bridge as one value.
        let doc = json!({
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": format!("Строка нагрузки {index}")}]}
            ]
        });
        notes.push(Note::demo_doc(
            &format!("stress:{index}"),
            &format!("Заметка нагрузки {index}"),
            &doc,
            "2026-10-01T00:00:00.000Z",
        ));
    }
    notes
}

/// A page of about two hundred blocks: enough to scroll, to see the table of
/// contents fill up and to feel how the editor behaves on a long document.
fn long_demo_doc() -> Value {
    let mut content: Vec<Value> = Vec::new();
    content.push(json!({"type": "paragraph", "content": [{"type": "text", "text": "Ниже двадцать один раздел. Страница длинная: по ней удобно смотреть рельсы оглавления, прокрутку и то, как редактор держит большие документы."}]}));
    for section in 1..=21 {
        content.push(json!({"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": format!("Раздел {section}. Заголовок первого уровня")}]}));
        content.push(json!({"type": "paragraph", "content": [{"type": "text", "text": format!("Начало раздела {section}. Здесь обычный абзац: он показывает межстрочный интервал, отступы и ширину колонки. Текст длиной в две или три строки проверяет перенос.")}]}));
        content.push(json!({"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": format!("Раздел {section}.1. Вложенный заголовок")}]}));
        content.push(json!({
            "type": "bulletList",
            "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": format!("пункт {section}.1")}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": format!("пункт {section}.2")}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": format!("пункт {section}.3")}]}]}
            ]
        }));
        content.push(json!({"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": format!("Раздел {section}.2. Мелкий заголовок")}]}));
        content.push(json!({"type": "paragraph", "content": [{"type": "text", "text": "Ещё абзац с "}, {"type": "text", "marks": [{"type": "bold"}], "text": "жирным"}, {"type": "text", "text": ", "}, {"type": "text", "marks": [{"type": "italic"}], "text": "курсивом"}, {"type": "text", "text": " и "}, {"type": "text", "marks": [{"type": "code"}], "text": "кодом"}, {"type": "text", "text": " внутри строки."}]}));
        content.push(json!({"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "text": format!("Цитата раздела {section}: короткая мысль для проверки полосы слева.")}]}]}));
        if section % 5 == 0 {
            content.push(json!({"type": "codeBlock", "attrs": {"language": "rust"}, "content": [{"type": "text", "text": format!("fn section_{section}() {{\n    println!(\"раздел {section}\");\n}}")}]}));
        }
        if section % 7 == 0 {
            content.push(json!({"type": "horizontalRule"}));
        }
    }
    json!({"type": "doc", "content": content})
}

impl NativeComponent for AtlasBridge {
    fn render(&mut self, _window: &mut Window, cx: &mut App) -> Option<gpui::AnyElement> {
        if self.subscription.is_none() {
            // The workers tell the screen what they hold once, when they start;
            // a screen that loads after that hears nothing. Ask for the day's
            // entries again, so a reloaded page is never blank.
            let _ = self.journal_commands.send(JournalRequest::Reload);
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

    fn command(&mut self, name: &str, args: &Value, window: &mut Window, cx: &mut App) {
        match name {
            "benchmark.sample" => {
                if let Some(run_id) = args["runId"].as_u64() {
                    // An immediate reply, before the sampler starts: JS learns
                    // that the command arrived even when the sampler's own
                    // `ready` never does.
                    self.context.emit(
                        "benchmarkReady",
                        json!({"runId": run_id, "data": {"command": true}}),
                    );
                    benchmark::sample(self.context.clone(), run_id);
                }
            }
            "benchmark.begin" => {
                #[cfg(target_os = "windows")]
                {
                    self.benchmark_baseline = Some(window.frame_duration_snapshot());
                }
            }
            "benchmark.dock" => {
                let reply = self.benchmark_session.command_dock(window, cx);
                self.context.emit("benchmarkDock", reply);
            }
            "benchmark.status" => {
                let reply = self.benchmark_session.command_status();
                self.benchmark_session.command_restore(window);
                self.context.emit("benchmarkStatus", reply);
            }
            "benchmark.cancel" => {
                self.benchmark_session.command_cancel(window);
                self.context
                    .emit("benchmarkStatus", self.benchmark_session.command_status());
            }
            "benchmark.progress" => self.benchmark_session.command_progress(args),
            "benchmark.frames" => {
                let Some(run_id) = args["runId"].as_u64() else {
                    return;
                };
                #[cfg(target_os = "windows")]
                benchmark::frames(
                    &self.context,
                    window,
                    self.benchmark_baseline.take(),
                    run_id,
                );
                #[cfg(not(target_os = "windows"))]
                benchmark::frames(&self.context, run_id);
            }
            "notes.create" => {
                let title = args
                    .get("title")
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                let doc = args.get("doc").cloned().unwrap_or(Value::Null);
                let _ = self
                    .notes_commands
                    .send(NotesRequest::Create(title.to_owned(), doc));
            }
            "notes.stress" => {
                let count = args
                    .get("count")
                    .and_then(Value::as_u64)
                    .unwrap_or(0)
                    .min(200_000);
                let _ = self
                    .notes_commands
                    .send(NotesRequest::Stress(count as usize));
            }
            "notes.reset" => {
                let _ = self.notes_commands.send(NotesRequest::Reset);
            }
            "notes.save" => {
                if let Some(id) = args.get("id").and_then(Value::as_str) {
                    let title = args
                        .get("title")
                        .and_then(Value::as_str)
                        .unwrap_or_default();
                    let doc = args.get("doc").cloned().unwrap_or(Value::Null);
                    let _ = self.notes_commands.send(NotesRequest::Save(
                        id.to_owned(),
                        title.to_owned(),
                        doc,
                    ));
                }
            }
            "notes.reload" => {
                let _ = self.notes_commands.send(NotesRequest::Reload);
            }
            "notes.delete" => {
                if let Some(id) = args.get("id").and_then(Value::as_str) {
                    let _ = self
                        .notes_commands
                        .send(NotesRequest::Delete(id.to_owned()));
                }
            }
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
            "appearance.import" => {
                let context = self.context.clone();
                let demo = self.agenda.read(cx).demo;
                std::thread::spawn(move || {
                    let imported = if demo {
                        None
                    } else {
                        crate::appearance::import_legacy()
                    };
                    context.emit("appearanceImported", imported.unwrap_or(Value::Null));
                });
            }
            "appearance.set" => {
                if let Some(patch) = args.as_object() {
                    self.agenda.update(cx, |agenda, cx| {
                        agenda.apply_local_appearance(Value::Object(patch.clone()), cx);
                    });
                    self.publish(cx);
                }
            }
            // The shell already painted the new width. Notifying here would
            // emit a snapshot and start that motion over.
            "toggle-sidebar" => {
                self.agenda.update(cx, |agenda, _| agenda.toggle_sidebar());
            }
            "games.pick"
            | "games.browse"
            | "games.browse-folder"
            | "games.launch"
            | "games.clear-pick"
            | "games.load"
            | "games.discover"
            | "games.import"
            | "games.import-legacy"
            | "games.metadata.choose"
            | "games.metadata.set-image" => {
                self.games.command(name, args, cx);
            }
            "reload" => {
                self.agenda.update(cx, |agenda, _| agenda.reload_storage());
                if !self.journal_reload_pending.swap(true, Ordering::AcqRel) {
                    let _ = self.journal_commands.send(JournalRequest::Reload);
                }
            }
            "window.drag" => crate::win_chrome::drag(window),
            "window.titlebar-double-click" => crate::win_chrome::titlebar_double_click(window),
            "window.minimize" => window.minimize_window(),
            "window.zoom" => crate::win_chrome::toggle_zoom(window),
            "window.close" => crate::win_chrome::request_close(window),
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

#[cfg(test)]
mod demo_tests {
    use super::*;

    /// The editor draws the blocks its schema names and flattens the rest into
    /// plain paragraphs: a note built from another block kind (a task list, a
    /// block from a newer schema) opens as a bare page of text, and the save
    /// writes that flattened page back. The mocks stay inside the list above.
    #[test]
    fn demo_notes_use_blocks_the_editor_draws() {
        const KNOWN: [&str; 16] = [
            "doc",
            "paragraph",
            "heading",
            "bulletList",
            "orderedList",
            "listItem",
            "blockquote",
            "codeBlock",
            "horizontalRule",
            "table",
            "tableRow",
            "tableHeader",
            "tableCell",
            "text",
            "taskList",
            "taskItem",
        ];
        fn walk(node: &Value, unknown: &mut Vec<String>) {
            let Some(kind) = node.get("type").and_then(Value::as_str) else {
                return;
            };
            if !KNOWN.contains(&kind) {
                unknown.push(kind.to_owned());
            }
            for child in node
                .get("content")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                walk(child, unknown);
            }
        }
        for note in demo_notes() {
            let mut unknown = Vec::new();
            walk(&note.doc, &mut unknown);
            assert!(
                unknown.is_empty(),
                "{} holds blocks the editor drops: {unknown:?}",
                note.id
            );
        }
    }

    /// The demo library is what the screens are checked against: every block
    /// kind present, one long page, one with a table, one empty.
    #[test]
    fn demo_notes_cover_every_screen() {
        let notes = demo_notes();
        assert_eq!(notes.len(), 13);
        assert!(notes.iter().any(|note| !note.title.is_empty()));
        let long = notes
            .iter()
            .find(|note| note.id == "demo:long")
            .expect("the long note is there");
        let blocks = long.doc["content"].as_array().expect("a document").len();
        assert!(blocks > 150, "the long page has {blocks} blocks");
        let headings = long.doc["content"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|block| block["type"] == "heading")
            .count();
        assert!(headings >= 40, "the rails need headings: {headings}");
        let welcome = notes
            .iter()
            .find(|note| note.id == "demo:welcome")
            .expect("the welcome note is there");
        let kinds: Vec<&str> = welcome.doc["content"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|block| block["type"].as_str())
            .collect();
        assert!(kinds.contains(&"table"));
        assert!(kinds.contains(&"blockquote"));
        let parser = notes
            .iter()
            .find(|note| note.id == "demo:parser")
            .expect("the code note is there");
        assert!(parser.doc["content"]
            .as_array()
            .unwrap()
            .iter()
            .any(|block| block["type"] == "codeBlock"));
    }

    /// The load tests: a hundred thousand notes have to be cheap to make, or
    /// the generator itself becomes the thing under test.
    #[test]
    fn stress_notes_are_cheap_and_numbered() {
        let started = std::time::Instant::now();
        let notes = stress_notes(100_000);
        let spent = started.elapsed();
        assert_eq!(notes.len(), 100_000);
        assert_eq!(notes[0].id, "stress:1");
        assert_eq!(notes[99_999].title, "Заметка нагрузки 100000");
        assert!(spent < std::time::Duration::from_secs(5), "took {spent:?}");
        // The whole library crosses the bridge as one value: keep it small
        // enough to parse.
        let bytes = serde_json::to_vec(&json!(notes
            .iter()
            .map(|note| json!({
                "id": note.id,
                "title": note.title,
                "doc": note.doc,
                "text": note.text,
            }))
            .collect::<Vec<_>>()))
        .unwrap()
        .len();
        assert!(bytes < 40 * 1024 * 1024, "the payload is {bytes} bytes");
    }

    #[test]
    fn the_demo_journal_has_six_entries() {
        let entries = crate::model::seed_journal();
        assert_eq!(entries.len(), 6);
        assert!(entries
            .windows(2)
            .all(|pair| pair[0].created_at < pair[1].created_at));
    }
}

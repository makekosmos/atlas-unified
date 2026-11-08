use std::{path::PathBuf, sync::mpsc::Sender};

use nsh_platform_macos::{objc2::MainThreadMarker, ComponentContext};
use objc2_app_kit::{NSModalResponseOK, NSOpenPanel};
use serde_json::{json, Value};

use super::super::games;
use crate::{
    model::{new_todo, Status},
    store::{Engine, JournalEntry},
};

pub(super) fn games_command(
    name: &str,
    args: &Value,
    requests: &Sender<games::Request>,
    context: &ComponentContext,
) -> bool {
    if !name.starts_with("games.") {
        return false;
    }
    let result = match name {
        "games.pick" => args
            .get("path")
            .and_then(Value::as_str)
            .map(|path| {
                requests
                    .send(games::Request::PickPath(path.to_owned()))
                    .map_err(|error| error.to_string())
            })
            .unwrap_or(Ok(())),
        "games.clear-pick" => requests
            .send(games::Request::ClearPick)
            .map_err(|error| error.to_string()),
        "games.browse" => browse_for_game(requests),
        _ => games::enqueue(requests, name, args),
    };
    if let Err(error) = result {
        context.emit(
            "imported",
            json!({"ok":false,"legacy":name == "games.import-legacy","error":error}),
        );
    }
    true
}

fn browse_for_game(requests: &Sender<games::Request>) -> Result<(), String> {
    let marker = MainThreadMarker::new()
        .ok_or_else(|| "Системный выбор файла требует главного потока AppKit".to_owned())?;
    let panel = NSOpenPanel::openPanel(marker);
    panel.setCanChooseFiles(true);
    panel.setCanChooseDirectories(false);
    panel.setAllowsMultipleSelection(false);
    if panel.runModal() != NSModalResponseOK {
        return Ok(());
    }
    let path = panel
        .URLs()
        .firstObject()
        .and_then(|url| url.path())
        .map(|path| PathBuf::from(path.to_string()));
    let Some(path) = path else { return Ok(()) };
    requests
        .send(games::Request::PickPaths(vec![path]))
        .map_err(|error| error.to_string())
}

pub(super) fn complete(engine: &Engine, id: &str) {
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

pub(super) fn create_task(engine: &Engine, title: &str) {
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

pub(super) fn update_journal(
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

pub(super) fn delete_journal(
    engine: &Engine,
    id: &str,
    entries: &[JournalEntry],
) -> Result<(), String> {
    let entry = entries
        .iter()
        .find(|entry| entry.id == id)
        .cloned()
        .ok_or("journal entry not found")?;
    engine
        .journal_delete(&entry)
        .map_err(|error| format!("{error:?}"))
}

pub(super) fn replace_entry(entries: &mut [JournalEntry], updated: JournalEntry) {
    if let Some(entry) = entries.iter_mut().find(|entry| entry.id == updated.id) {
        *entry = updated;
    }
}

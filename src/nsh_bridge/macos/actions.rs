use crate::{
    model::{new_todo, Status},
    store::{Engine, JournalEntry},
};

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

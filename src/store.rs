//! Engine is the only owner of task persistence. No database or local task mirror.
#[cfg(test)]
mod engine_e2e_tests;
mod journal;
pub(crate) mod live;
pub mod mapping;
#[cfg(test)]
mod mapping_tests;
mod notes;
mod ops;
#[cfg(test)]
mod payload_fixtures;
pub use journal::{now_iso, JournalEntry};
pub use notes::Note;
#[cfg(test)]
mod journal_tests;
mod projects;
#[cfg(test)]
mod recurrence_tests;
#[cfg(test)]
mod restart_tests;
#[cfg(test)]
mod tests;
mod transport;
#[cfg(test)]
mod transport_tests;
mod types;
mod usage;

use crate::model::Project;
use crate::model::Todo;
pub use imago_nsh::mundus_gpui_kit::engine_error::{EngineError, ErrorKind};
use serde_json::{json, Value};
pub use transport::Engine;

#[derive(Default)]
pub struct Snapshot {
    pub todos: Vec<Todo>,
    pub projects: Vec<Project>,
}

/// Note types the journal screens read; the live watcher relays their changes.
pub(crate) static JOURNAL_TYPES: &[&str] = &journal::NOTE_TYPES;
/// The shared note type the notes screen reads and writes.
pub(crate) static NOTE_TYPES: &[&str] = &notes::NOTE_TYPES;

mod worker;
pub use worker::{Command, Mutation, Reply, Worker};

impl Engine {
    fn save_with_next(
        &self,
        before: Option<&Todo>,
        todo: &Todo,
        next: Option<&Todo>,
    ) -> Result<(), EngineError> {
        self.save(before, todo)?;
        let Some(next) = next else {
            return Ok(());
        };
        let Err(write_error) = self.save(None, next) else {
            return Ok(());
        };
        // A lost acknowledgement may still mean the next occurrence was saved.
        let stored = self
            .rpc(ops::OBJECTS_GET, json!({"id":next.id}))
            .and_then(|object| {
                if object.is_null() {
                    Ok(None)
                } else {
                    self.read_task(&object).map(Some)
                }
            });
        let confirmation = match stored {
            Ok(Some(task)) if task == *next => return Ok(()),
            Ok(Some(_)) => return Err(Self::recurrence_error(format!(
                "partial application: successor differs from the intended task; original was not rolled back ({write_error})"
            ))),
            Ok(None) => "successor is absent".to_owned(),
            Err(error) => format!("successor readback failed: {error}; successor may exist"),
        };
        let recovery = match before {
            Some(before) => match self.save(Some(todo), before) {
                Ok(()) => "original occurrence restored".to_owned(),
                Err(error) => format!("partial application: original rollback failed: {error}"),
            },
            None => "partial application: no original occurrence available for rollback".to_owned(),
        };
        Err(Self::recurrence_error(format!(
            "successor write unconfirmed: {write_error}; {confirmation}; {recovery}"
        )))
    }

    fn recurrence_error(detail: String) -> EngineError {
        EngineError {
            kind: ErrorKind::Unavailable,
            detail: format!("recurrence: {detail}"),
        }
    }

    /// `mapping::read` plus the task's project from its `project` link.
    fn read_task(&self, object: &Value) -> Result<Todo, EngineError> {
        let mut todo = mapping::read(object).map_err(Self::mapping_err)?;
        todo.project_id = self
            .project_links()?
            .remove(&todo.id)
            .map(|(_, project)| project);
        Ok(todo)
    }

    fn mapping_err(error: String) -> EngineError {
        EngineError {
            kind: ErrorKind::InvalidRequest,
            detail: format!("mapping: {error}"),
        }
    }

    pub fn load(&self) -> Result<Snapshot, EngineError> {
        // Atlas declares its own types before it reads anything; `core.task`
        // objects written before that keep loading under their old id.
        types::ensure_registered(self);
        let links = self.project_links()?;
        let mut snapshot = Snapshot::default();
        for type_id in mapping::TASK_TYPES {
            let list = self.rpc(ops::OBJECTS_LIST, json!({"typeId":type_id}))?;
            let list = list
                .as_array()
                .ok_or_else(|| Self::mapping_err("list not an array".into()))?;
            for object in list {
                if !mapping::is_task(object) {
                    continue;
                }
                let mut todo = mapping::read(object).map_err(Self::mapping_err)?;
                todo.project_id = links.get(&todo.id).map(|(_, project)| project.clone());
                snapshot.todos.push(todo);
            }
        }
        snapshot.todos.sort_by_key(|t| t.sort_order);
        snapshot.projects = self.projects()?;
        snapshot.projects.sort_by_key(|p| p.sort_order);
        Ok(snapshot)
    }

    pub fn save(&self, before: Option<&Todo>, todo: &Todo) -> Result<(), EngineError> {
        // Read the guard before the object: a concurrent write after this point
        // must make the commit fail, never overwrite a newer legacy task.
        let snapshot = self.rpc(ops::OBJECTS_SNAPSHOT, json!({"id":todo.id}))?;
        let current = self.rpc(ops::OBJECTS_GET, json!({"id":todo.id}))?;
        if let Some(before) = before {
            if current.is_null() || self.read_task(&current)? != *before {
                return Err(EngineError {
                    kind: ErrorKind::Conflict,
                    detail: "local: precondition failed (stale or missing)".into(),
                });
            }
        } else if !current.is_null() {
            return Err(EngineError {
                kind: ErrorKind::Conflict,
                detail: "local: object already exists".into(),
            });
        }
        let object = mapping::write(current, before, todo).map_err(Self::mapping_err)?;
        self.upsert_with_snapshot(object, Some(snapshot))?;
        // The link needs the task to exist, so it is written after the object.
        let project_changed = before.map_or(todo.project_id.is_some(), |before| {
            before.project_id != todo.project_id
        });
        if project_changed {
            self.set_project(&todo.id, todo.project_id.as_deref())?;
        }
        Ok(())
    }

    #[cfg(test)]
    fn upsert(&self, object: Value) -> Result<(), EngineError> {
        self.upsert_with_snapshot(object, None)
    }

    fn upsert_with_snapshot(
        &self,
        object: Value,
        snapshot: Option<Value>,
    ) -> Result<(), EngineError> {
        // A new object may be the first thing written after a start that
        // happened before the Engine came up.
        types::ensure_registered(self);
        let mut request = json!({"object":object});
        if let Some(snapshot) = snapshot {
            request["expectedSnapshot"] = snapshot;
        }
        let result = self.rpc(ops::OBJECTS_UPSERT, request)?;
        if result != true {
            return Err(EngineError {
                kind: ErrorKind::Transport,
                detail: "objects.upsert returned non-true data".into(),
            });
        }
        Ok(())
    }
}

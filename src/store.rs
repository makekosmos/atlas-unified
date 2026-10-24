//! Engine is the only owner of task persistence. No database or local task mirror.
pub mod mapping;
#[cfg(test)]
mod mapping_tests;
#[cfg(test)]
mod payload_fixtures;
mod projects;
#[cfg(test)]
mod restart_tests;
#[cfg(test)]
mod tests;
mod transport;
#[cfg(test)]
mod transport_tests;

use crate::model::Todo;
pub use imago_nsh::mundus_gpui_kit::engine_error::{EngineError, ErrorKind};
use serde_json::{json, Value};
pub use transport::Engine;
mod worker;
pub use worker::{Command, Mutation, Reply, Snapshot, Worker};

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
        if self.save(None, next).is_ok() {
            return Ok(());
        }
        // A lost acknowledgement may still mean the next occurrence was saved.
        let stored = self.rpc("get_object", json!({"id":next.id}))?;
        if !stored.is_null() && self.read_task(&stored)? == *next {
            return Ok(());
        }
        if stored.is_null() {
            if let Some(before) = before {
                self.save(Some(todo), before)?;
            }
        }
        Err(EngineError {
            kind: ErrorKind::Unavailable,
            detail: "local: save_with_next unconfirmed".into(),
        })
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
        let list = self.rpc(
            "list_objects_by_type",
            json!({"type_id":mapping::TASK_TYPE}),
        )?;
        let list = list
            .as_array()
            .ok_or_else(|| Self::mapping_err("list not an array".into()))?;
        let links = self.project_links()?;
        let mut snapshot = Snapshot::default();
        for object in list {
            if object["typeId"] == mapping::TASK_TYPE {
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
        let current = self.rpc("get_object", json!({"id":todo.id}))?;
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
        self.upsert(object)?;
        // The link needs the task to exist, so it is written after the object.
        let project_changed = before.map_or(todo.project_id.is_some(), |before| {
            before.project_id != todo.project_id
        });
        if project_changed {
            self.set_project(&todo.id, todo.project_id.as_deref())?;
        }
        Ok(())
    }

    fn upsert(&self, object: Value) -> Result<(), EngineError> {
        let result = self.rpc("upsert_object", json!({"object":object}))?;
        if result != true {
            return Err(EngineError {
                kind: ErrorKind::Transport,
                detail: "upsert_object returned non-true data".into(),
            });
        }
        Ok(())
    }
}

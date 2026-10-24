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
        if !stored.is_null() && mapping::read(&stored).map_err(Self::mapping_err)? == *next {
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
        let mut snapshot = Snapshot::default();
        for object in list {
            if object["typeId"] == mapping::TASK_TYPE {
                snapshot
                    .todos
                    .push(mapping::read(object).map_err(Self::mapping_err)?);
            }
        }
        snapshot.todos.sort_by_key(|t| t.sort_order);
        snapshot.projects = self.projects()?.0;
        snapshot.projects.sort_by_key(|p| p.sort_order);
        Ok(snapshot)
    }

    pub fn save(&self, before: Option<&Todo>, todo: &Todo) -> Result<(), EngineError> {
        let current = self.rpc("get_object", json!({"id":todo.id}))?;
        if let Some(before) = before {
            if current.is_null() || mapping::read(&current).map_err(Self::mapping_err)? != *before {
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

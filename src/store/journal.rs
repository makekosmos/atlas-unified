//! Journal entries are individual Engine-owned `core.note` objects. The only
//! Atlas-specific data is `propsJson.extensions.entry_kind = "journal"`.
use super::{Engine, EngineError, ErrorKind};
use serde_json::{json, Value};

const NOTE_TYPE: &str = "core.note";
const NOTE_VERSION: &str = "0.1.0";

/// A journal note plus the Engine revision it was read from. Mutations use
/// that exact revision as `expectedSnapshot`, so stale drafts cannot overwrite
/// newer edits.
#[derive(Clone, Debug, PartialEq)]
pub struct JournalEntry {
    pub id: String,
    pub text: String,
    pub created_at: String,
    pub updated_at: String,
    snapshot: Value,
}

impl Engine {
    /// Lists only journal notes, ordered by their Engine creation time.
    /// Each object is bracketed by matching write snapshots so the revision
    /// travels with the exact content the caller sees.
    pub fn journal_list(&self) -> Result<Vec<JournalEntry>, EngineError> {
        let objects = self.rpc("list_objects_by_type", json!({"type_id": NOTE_TYPE}))?;
        let objects = objects
            .as_array()
            .ok_or_else(|| invalid("list_objects_by_type did not return an array"))?;
        let mut entries = Vec::new();
        for object in objects {
            if object["typeId"] != NOTE_TYPE || !is_active_journal(object) {
                continue;
            }
            let id = object["id"]
                .as_str()
                .ok_or_else(|| invalid("core.note has no id"))?;
            if let Some(entry) = self.stable_journal_read(id)? {
                entries.push(entry);
            }
        }
        entries.sort_by(|a, b| a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id)));
        Ok(entries)
    }

    /// Creates a distinct note object. Existing daily journal notes remain
    /// readable but are never reused as the destination for a new entry.
    pub fn journal_create(&self, text: &str) -> Result<JournalEntry, EngineError> {
        if text.trim().is_empty() {
            return Err(invalid("journal entry is empty"));
        }
        let id = format!("journal:{}", uuid::Uuid::new_v4());
        let expected = self.snapshot(&id)?;
        if expected["exists"] == true {
            return Err(conflict("generated journal id already exists"));
        }
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let object = json!({
            "id": id,
            "typeId": NOTE_TYPE,
            "typeVersion": NOTE_VERSION,
            "title": "Запись",
            "createdAt": now,
            "updatedAt": now,
            "contentJson": document(text),
            "propsJson": {"extensions": {"entry_kind": "journal"}},
            "deletedAt": null
        });
        self.upsert_journal(object, expected)?;
        self.stable_journal_read(&id)?
            .ok_or_else(|| EngineError::local(ErrorKind::Malformed, "created journal note missing"))
    }

    /// Updates an entry only if it still has the revision captured by the
    /// caller's list/read. Other canonical and extension fields are preserved.
    pub fn journal_update(
        &self,
        before: &JournalEntry,
        text: &str,
    ) -> Result<JournalEntry, EngineError> {
        if text.trim().is_empty() {
            return Err(invalid("journal entry is empty"));
        }
        let current = self.rpc("get_object", json!({"id": before.id}))?;
        if current.is_null() || !is_active_journal(&current) {
            return Err(conflict(
                "journal note is missing or no longer a journal entry",
            ));
        }
        let mut object = current;
        object["contentJson"] = document(text);
        object["updatedAt"] =
            json!(chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true));
        let mut props = object["propsJson"].as_object().cloned().unwrap_or_default();
        let mut extensions = props
            .get("extensions")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        extensions.insert("entry_kind".into(), json!("journal"));
        props.insert("extensions".into(), Value::Object(extensions));
        object["propsJson"] = Value::Object(props);
        self.upsert_journal(object, before.snapshot.clone())?;
        self.stable_journal_read(&before.id)?
            .ok_or_else(|| EngineError::local(ErrorKind::Malformed, "updated journal note missing"))
    }

    /// Deletes an entry with the revision that was visible to the caller.
    pub fn journal_delete(&self, entry: &JournalEntry) -> Result<(), EngineError> {
        let result = self.rpc(
            "delete_object",
            json!({"id": entry.id, "expectedSnapshot": entry.snapshot}),
        )?;
        if result == true {
            Ok(())
        } else {
            Err(EngineError::local(
                ErrorKind::Transport,
                "delete_object returned non-true data",
            ))
        }
    }

    fn snapshot(&self, id: &str) -> Result<Value, EngineError> {
        self.rpc("get_object_write_snapshot", json!({"id": id}))
    }

    fn stable_journal_read(&self, id: &str) -> Result<Option<JournalEntry>, EngineError> {
        for _ in 0..3 {
            let before = self.snapshot(id)?;
            let object = self.rpc("get_object", json!({"id": id}))?;
            let after = self.snapshot(id)?;
            if before != after {
                continue;
            }
            if object.is_null() || !is_active_journal(&object) {
                return Ok(None);
            }
            return Ok(Some(JournalEntry {
                id: id.to_owned(),
                text: content_text(&object["contentJson"]),
                created_at: object["createdAt"].as_str().unwrap_or_default().to_owned(),
                updated_at: object["updatedAt"].as_str().unwrap_or_default().to_owned(),
                snapshot: after,
            }));
        }
        Err(conflict("journal note changed while being read"))
    }

    fn upsert_journal(&self, object: Value, expected: Value) -> Result<(), EngineError> {
        let result = self.rpc(
            "upsert_object",
            json!({"object": object, "expectedSnapshot": expected}),
        )?;
        if result == true {
            Ok(())
        } else {
            Err(EngineError::local(
                ErrorKind::Transport,
                "upsert_object returned non-true data",
            ))
        }
    }
}

fn is_journal(object: &Value) -> bool {
    object["propsJson"]["extensions"]["entry_kind"] == "journal"
}

fn is_active_journal(object: &Value) -> bool {
    is_journal(object) && object.get("deletedAt").map_or(true, Value::is_null)
}

fn document(text: &str) -> Value {
    json!({"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":text}]}]})
}

fn content_text(content: &Value) -> String {
    fn collect(value: &Value, output: &mut String) {
        match value {
            Value::Object(object) => {
                if let Some(text) = object.get("text").and_then(Value::as_str) {
                    output.push_str(text);
                } else if let Some(children) = object.get("content").and_then(Value::as_array) {
                    for child in children {
                        collect(child, output);
                    }
                }
            }
            Value::Array(children) => {
                for child in children {
                    collect(child, output);
                }
            }
            _ => {}
        }
    }
    let mut output = String::new();
    collect(content, &mut output);
    output
}

fn invalid(detail: &str) -> EngineError {
    EngineError::local(ErrorKind::InvalidRequest, detail)
}

fn conflict(detail: &str) -> EngineError {
    EngineError::local(ErrorKind::Conflict, detail)
}

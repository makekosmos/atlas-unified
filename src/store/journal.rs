//! Journal entries are notes: `com.mundus.atlas.journal` objects, plus the
//! `core.note` daily notes other clients write with
//! `propsJson.extensions.entry_kind = "journal"`. A `core.note` without that
//! marker is somebody else's note and stays out of the journal.
use super::{ops, types, Engine, EngineError, ErrorKind};
use serde_json::{json, Value};

const NOTE_TYPE: &str = types::JOURNAL_TYPE;
const NOTE_VERSION: &str = types::JOURNAL_VERSION;
/// Journal notes written before Atlas declared its own type.
const LEGACY_NOTE_TYPE: &str = "core.note";
pub(super) const NOTE_TYPES: [&str; 2] = [NOTE_TYPE, LEGACY_NOTE_TYPE];

#[derive(Clone, Debug, PartialEq)]
pub struct JournalEntry {
    pub id: String,
    pub text: String,
    pub created_at: String,
    pub updated_at: String,
    /// A voice note: `{durationMs, peaks, data}` with Opus in base64.
    pub voice: Option<Value>,
    snapshot: Value,
}

impl JournalEntry {
    /// An entry the demo screen shows; nothing is stored.
    pub fn demo(id: &str, text: &str, created_at: &str) -> Self {
        Self {
            id: id.to_owned(),
            text: text.to_owned(),
            created_at: created_at.to_owned(),
            updated_at: created_at.to_owned(),
            voice: None,
            snapshot: Value::Null,
        }
    }
}

/// The current time as an RFC 3339 stamp in UTC, the shape Engine writes.
pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

impl Engine {
    /// Entries under either note type: `objects.list` takes one `typeId`.
    pub fn journal_list(&self) -> Result<Vec<JournalEntry>, EngineError> {
        let mut entries = Vec::new();
        for type_id in NOTE_TYPES {
            let objects = self.rpc(ops::OBJECTS_LIST, json!({"typeId":type_id}))?;
            let objects = objects
                .as_array()
                .ok_or_else(|| invalid("objects.list did not return an array"))?;
            for object in objects {
                if object["typeId"] != *type_id || !is_active_journal(object) {
                    continue;
                }
                let id = object["id"]
                    .as_str()
                    .ok_or_else(|| invalid("note has no id"))?;
                if let Some(entry) = self.stable_journal_read(id)? {
                    entries.push(entry);
                }
            }
        }
        entries.sort_by(|a, b| a.created_at.cmp(&b.created_at).then(a.id.cmp(&b.id)));
        Ok(entries)
    }

    pub fn journal_create(&self, text: &str) -> Result<JournalEntry, EngineError> {
        self.journal_create_with(text, None)
    }

    /// A voice note: the text may stay empty, the clip carries the entry.
    pub fn journal_create_voice(
        &self,
        text: &str,
        voice: Value,
    ) -> Result<JournalEntry, EngineError> {
        self.journal_create_with(text, Some(voice))
    }

    fn journal_create_with(
        &self,
        text: &str,
        voice: Option<Value>,
    ) -> Result<JournalEntry, EngineError> {
        if text.trim().is_empty() && voice.is_none() {
            return Err(invalid("journal entry is empty"));
        }
        // A write may be the first thing after a start that happened before the
        // Engine came up, so the declaration is retried here.
        types::ensure_registered(self);
        let id = format!("journal:{}", uuid::Uuid::new_v4());
        let expected = self.snapshot(&id)?;
        if expected["exists"] == true {
            return Err(conflict("generated journal id already exists"));
        }
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let mut extensions = serde_json::Map::new();
        extensions.insert("entry_kind".into(), json!("journal"));
        if let Some(voice) = voice {
            extensions.insert("voice".into(), voice);
        }
        let object = json!({
            "id": id,
            "typeId": NOTE_TYPE,
            "typeVersion": NOTE_VERSION,
            "title": "Запись",
            "createdAt": now,
            "updatedAt": now,
            "contentJson": document(text),
            "propsJson": {
                "description": text,
                "extensions": Value::Object(extensions)
            },
            "deletedAt": null
        });
        self.upsert_journal(object, expected)?;
        self.stable_journal_read(&id)?
            .ok_or_else(|| EngineError::local(ErrorKind::Malformed, "created journal note missing"))
    }

    pub fn journal_update(
        &self,
        before: &JournalEntry,
        text: &str,
    ) -> Result<JournalEntry, EngineError> {
        if text.trim().is_empty() {
            return Err(invalid("journal entry is empty"));
        }
        let current = self.rpc(ops::OBJECTS_GET, json!({"id": before.id}))?;
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
        props.insert("description".into(), json!(text));
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

    pub fn journal_delete(&self, entry: &JournalEntry) -> Result<(), EngineError> {
        let result = self.rpc(
            ops::OBJECTS_DELETE,
            json!({"id": entry.id, "expectedSnapshot": entry.snapshot}),
        )?;
        if result == true {
            Ok(())
        } else {
            Err(EngineError::local(
                ErrorKind::Transport,
                "objects.delete returned non-true data",
            ))
        }
    }

    pub(super) fn snapshot(&self, id: &str) -> Result<Value, EngineError> {
        self.rpc(ops::OBJECTS_SNAPSHOT, json!({"id": id}))
    }

    fn stable_journal_read(&self, id: &str) -> Result<Option<JournalEntry>, EngineError> {
        for _ in 0..3 {
            let before = self.snapshot(id)?;
            let object = self.rpc(ops::OBJECTS_GET, json!({"id": id}))?;
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
                voice: object["propsJson"]["extensions"]
                    .get("voice")
                    .filter(|voice| !voice.is_null())
                    .cloned(),
                snapshot: after,
            }));
        }
        Err(conflict("journal note changed while being read"))
    }

    fn upsert_journal(&self, object: Value, expected: Value) -> Result<(), EngineError> {
        let result = self.rpc(
            ops::OBJECTS_UPSERT,
            json!({"object": object, "expectedSnapshot": expected}),
        )?;
        if result == true {
            Ok(())
        } else {
            Err(EngineError::local(
                ErrorKind::Transport,
                "objects.upsert returned non-true data",
            ))
        }
    }
}

/// The type says journal, or a legacy note carries the marker.
fn is_journal(object: &Value) -> bool {
    object["typeId"] == NOTE_TYPE || object["propsJson"]["extensions"]["entry_kind"] == "journal"
}

fn is_active_journal(object: &Value) -> bool {
    is_journal(object) && object.get("deletedAt").is_none_or(Value::is_null)
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

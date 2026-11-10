//! Notes are `core.note` objects: the kernel's own note type, not one Atlas
//! declares. That is what makes a note readable by another application, and it
//! keeps the body under the kernel's rich-text contract.
//!
//! The screen is a rich text editor, so the body is a document of the
//! contract's shape (`application/vnd.kosmos.richtext+json`: `doc`,
//! paragraphs, headings, lists, tables, the common marks) and rides in
//! `contentJson`. `propsJson.description` keeps the same content as plain text:
//! the contract's required field, and what the note list shows.

use super::{ops, Engine, EngineError, ErrorKind};
use serde_json::{json, Value};

/// The kernel's note type. Its 0.2.0 version is the one whose body contract
/// knows tables; objects written earlier keep their version on update.
pub(super) const NOTE_TYPE: &str = "core.note";
pub(super) const NOTE_VERSION: &str = "0.2.0";
/// The type ids the live watcher subscribes to.
pub(super) const NOTE_TYPES: [&str; 1] = [NOTE_TYPE];
/// Journal entries written before the journal had a type of its own are notes
/// carrying this marker. The notes screen leaves them to the Journal screen.
const JOURNAL_MARKER: &str = "entry_kind";

#[derive(Clone, Debug, PartialEq)]
pub struct Note {
    pub id: String,
    pub title: String,
    /// The rich text document (`contentJson`), the shape the editor speaks.
    pub doc: Value,
    /// The same content as plain text, for the list and for search.
    pub text: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Note {
    /// A note that never reaches an Engine: what the demo screen shows.
    pub fn demo(id: &str, title: &str, text: &str, updated_at: &str) -> Self {
        Self::demo_doc(id, title, &document(text), updated_at)
    }

    /// A demo note over a document the demo thread received from the screen.
    pub fn demo_doc(id: &str, title: &str, doc: &Value, updated_at: &str) -> Self {
        let doc = body_doc(doc);
        Self {
            id: id.to_owned(),
            title: title.to_owned(),
            text: plain_text(&doc),
            doc,
            created_at: updated_at.to_owned(),
            updated_at: updated_at.to_owned(),
        }
    }
}

impl Engine {
    pub fn notes_list(&self) -> Result<Vec<Note>, EngineError> {
        let objects = self.rpc(ops::OBJECTS_LIST, json!({"typeId": NOTE_TYPE}))?;
        let objects = objects
            .as_array()
            .ok_or_else(|| invalid("objects.list did not return an array"))?;
        let mut notes = Vec::new();
        for object in objects {
            if !is_note(object) {
                continue;
            }
            let note = self.note_from(object)?;
            notes.push(note);
        }
        notes.sort_by(|left, right| {
            right
                .updated_at
                .cmp(&left.updated_at)
                .then(left.id.cmp(&right.id))
        });
        Ok(notes)
    }

    pub fn notes_create(&self, title: &str, doc: &Value) -> Result<Note, EngineError> {
        let title = clean_title(title);
        let id = format!("note:{}", uuid::Uuid::new_v4());
        let expected = self.snapshot(&id)?;
        if expected["exists"] == true {
            return Err(conflict("generated note id already exists"));
        }
        let now = now();
        let object = json!({
            "id": id,
            "typeId": NOTE_TYPE,
            "typeVersion": NOTE_VERSION,
            "title": title,
            "createdAt": now,
            "updatedAt": now,
            "contentJson": body_doc(doc),
            "propsJson": {"description": plain_text(doc), "extensions": {}},
            "deletedAt": null
        });
        self.upsert_note(object, expected)?;
        let (created, _) = self
            .stable_note_read(&id)?
            .ok_or_else(|| EngineError::local(ErrorKind::InvalidRequest, "created note missing"))?;
        self.note_from(&created)
    }

    pub fn notes_save(&self, before: &Note, title: &str, doc: &Value) -> Result<Note, EngineError> {
        let (mut object, expected) = self
            .stable_note_read(&before.id)?
            .ok_or_else(|| conflict("note is missing or no longer a note"))?;
        object["title"] = json!(clean_title(title));
        object["contentJson"] = body_doc(doc);
        object["updatedAt"] = json!(now());
        let mut props = object["propsJson"].as_object().cloned().unwrap_or_default();
        props.insert("description".into(), json!(plain_text(doc)));
        props
            .entry("extensions".to_owned())
            .or_insert_with(|| json!({}));
        object["propsJson"] = Value::Object(props);
        self.upsert_note(object, expected)?;
        let (saved, _) = self.stable_note_read(&before.id)?.ok_or_else(|| {
            EngineError::local(ErrorKind::InvalidRequest, "saved note is missing")
        })?;
        self.note_from(&saved)
    }

    pub fn notes_delete(&self, note: &Note) -> Result<(), EngineError> {
        let expected = self.snapshot(&note.id)?;
        let result = self.rpc(
            ops::OBJECTS_DELETE,
            json!({"id": note.id, "expectedSnapshot": expected}),
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

    /// Reads a note twice around the read so a concurrent write cannot pair a
    /// body with someone else's snapshot. Returns the object with the snapshot
    /// a write has to expect.
    fn stable_note_read(&self, id: &str) -> Result<Option<(Value, Value)>, EngineError> {
        for _ in 0..3 {
            let before = self.snapshot(id)?;
            let object = self.rpc(ops::OBJECTS_GET, json!({"id": id}))?;
            let after = self.snapshot(id)?;
            if before != after {
                continue;
            }
            if object.is_null() || !is_note(&object) {
                return Ok(None);
            }
            return Ok(Some((object, after)));
        }
        Err(conflict("note changed while being read"))
    }

    fn note_from(&self, object: &Value) -> Result<Note, EngineError> {
        let id = object["id"]
            .as_str()
            .ok_or_else(|| invalid("note has no id"))?;
        Ok(Note {
            id: id.to_owned(),
            title: object["title"].as_str().unwrap_or_default().to_owned(),
            doc: body_doc(&object["contentJson"]),
            text: note_text(object),
            created_at: object["createdAt"].as_str().unwrap_or_default().to_owned(),
            updated_at: object["updatedAt"].as_str().unwrap_or_default().to_owned(),
        })
    }

    fn upsert_note(&self, object: Value, expected: Value) -> Result<(), EngineError> {
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

fn is_note(object: &Value) -> bool {
    object["typeId"] == NOTE_TYPE
        && object.get("deletedAt").is_none_or(Value::is_null)
        && object["propsJson"]["extensions"]
            .get(JOURNAL_MARKER)
            .is_none_or(Value::is_null)
}

/// The plain text of a note: the field the contract requires, else the text
/// the document holds.
fn note_text(object: &Value) -> String {
    object["propsJson"]["description"]
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| plain_text(&object["contentJson"]))
}

/// A document the contract accepts: the editor's own, or an empty one when the
/// app sent nothing.
fn body_doc(doc: &Value) -> Value {
    if is_document(doc) {
        doc.clone()
    } else {
        document("")
    }
}

fn is_document(doc: &Value) -> bool {
    doc.get("type").and_then(Value::as_str) == Some("doc")
}

/// Lines to a `doc`: one paragraph per line, blank lines dropped. Used for an
/// empty body and for the demo notes.
fn document(body: &str) -> Value {
    let mut content = Vec::new();
    for line in body.lines() {
        if line.trim().is_empty() {
            continue;
        }
        content.push(json!({
            "type": "paragraph",
            "content": [{"type": "text", "text": line}]
        }));
    }
    json!({"type": "doc", "content": content})
}

fn plain_text(content: &Value) -> String {
    fn collect(value: &Value, output: &mut String) {
        match value {
            Value::Object(object) => {
                if let Some(text) = object.get("text").and_then(Value::as_str) {
                    output.push_str(text);
                } else if let Some(children) = object.get("content").and_then(Value::as_array) {
                    for child in children {
                        collect(child, output);
                    }
                    // Blocks end their line: a paragraph, a heading, a row, a
                    // list item and the list around it all end somewhere.
                    if object.get("type").and_then(Value::as_str) != Some("text") {
                        output.push('\n');
                    }
                }
            }
            Value::Array(values) => {
                for value in values {
                    collect(value, output);
                }
            }
            _ => {}
        }
    }
    let mut text = String::new();
    collect(content, &mut text);
    text.trim_end().to_owned()
}

fn clean_title(title: &str) -> String {
    let title = title.trim();
    if title.is_empty() {
        "Без названия".to_owned()
    } else {
        title.to_owned()
    }
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

fn invalid(detail: &str) -> EngineError {
    EngineError::local(ErrorKind::InvalidRequest, detail)
}

fn conflict(detail: &str) -> EngineError {
    EngineError::local(ErrorKind::Conflict, detail)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn document_keeps_every_line_as_a_paragraph() {
        let doc = document("# Заголовок\n\nтекст\n| a | b |");
        let content = doc["content"].as_array().expect("paragraphs");
        assert_eq!(content.len(), 3);
        assert_eq!(content[0]["content"][0]["text"], "# Заголовок");
        assert_eq!(content[2]["content"][0]["text"], "| a | b |");
    }

    #[test]
    fn plain_text_returns_the_lines_back() {
        let text = plain_text(&document("первая\nвторая"));
        assert_eq!(text, "первая\nвторая");
    }

    #[test]
    fn note_text_prefers_the_field_the_contract_requires() {
        let object = json!({
            "propsJson": {"description": "Заметка"},
            "contentJson": document("Заметка")
        });
        assert_eq!(note_text(&object), "Заметка");
        let object = json!({
            "propsJson": {},
            "contentJson": document("из документа")
        });
        assert_eq!(note_text(&object), "из документа");
    }

    #[test]
    fn a_body_that_is_not_a_document_becomes_an_empty_one() {
        assert_eq!(body_doc(&json!(null)), document(""));
        let doc = json!({"type": "doc", "content": [{"type": "paragraph"}]});
        assert_eq!(body_doc(&doc), doc);
    }

    #[test]
    fn a_demo_note_keeps_the_document_the_screen_sent() {
        let doc = json!({
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Заголовок"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "текст"}]}
            ]
        });
        let note = Note::demo_doc("demo:one", "Заметка", &doc, "2026-11-09T12:00:00.000Z");
        assert_eq!(note.doc, doc);
        assert!(note.text.contains("Заголовок"));
        assert!(note.text.contains("текст"));
    }

    #[test]
    fn journal_entries_are_not_notes() {
        let object = json!({
            "id": "n1",
            "typeId": NOTE_TYPE,
            "deletedAt": null,
            "propsJson": {"extensions": {"entry_kind": "journal"}}
        });
        assert!(!is_note(&object));
        let note = json!({"id": "n2", "typeId": NOTE_TYPE, "propsJson": {}});
        assert!(is_note(&note));
        let deleted = json!({"id": "n3", "typeId": NOTE_TYPE, "deletedAt": "2026-01-01"});
        assert!(!is_note(&deleted));
    }
}

//! Atlas projects stored as core.note objects with an explicit extension kind.
use super::{Engine, EngineError};
use crate::model::Project;
use serde_json::{json, Value};
use std::collections::HashSet;

pub(super) const NOTE_TYPE: &str = "core.note";
const PROJECT_KIND: &str = "project";
const PROJECT_STATUS: [&str; 3] = ["active", "someday", "completed"];

impl Engine {
    /// Projects are notes distinguished by `propsJson.extensions.entry_kind`.
    #[cfg(test)]
    pub(super) fn save_project(&self, project: &Project) -> Result<(), EngineError> {
        let current = self.rpc("get_object", json!({"id":project.id}))?;
        let now = chrono::Utc::now().to_rfc3339();
        self.upsert(project_object(current, project, &now))
    }

    /// Live project notes and all known ids, including soft-deleted notes.
    pub(super) fn projects(&self) -> Result<(Vec<Project>, HashSet<String>), EngineError> {
        let list = self.rpc("list_objects_by_type", json!({"type_id":NOTE_TYPE}))?;
        let list = list
            .as_array()
            .ok_or_else(|| Self::mapping_err("note list not an array".into()))?;
        let all: Vec<&Value> = list
            .iter()
            .filter(|v| {
                v["typeId"] == NOTE_TYPE
                    && v["propsJson"]["extensions"]["entry_kind"] == PROJECT_KIND
            })
            .collect();
        let known = all
            .iter()
            .filter_map(|v| v["id"].as_str().map(str::to_string))
            .collect();
        let live = all
            .into_iter()
            .filter(|v| !v["deletedAt"].is_string())
            .map(read_project)
            .collect();
        Ok((live, known))
    }
}

#[cfg(test)]
fn project_object(current: Value, project: &Project, now: &str) -> Value {
    let mut object = if current.is_null() {
        json!({"id":project.id,"typeId":NOTE_TYPE,"typeVersion":"0.1.0","createdAt":now,
            "propsJson":{"description":null,"extensions":{}},
            "contentJson":{"type":"doc","content":[{"type":"paragraph"}]},"deletedAt":null})
    } else {
        current
    };
    object["title"] = json!(project.title);
    object["updatedAt"] = json!(now);
    let props = &mut object["propsJson"];
    if !props["extensions"].is_object() {
        props["extensions"] = json!({});
    }
    props["extensions"]["entry_kind"] = json!(PROJECT_KIND);
    props["extensions"]["status"] = json!(PROJECT_STATUS
        .get(usize::from(project.status))
        .unwrap_or(&"active"));
    props["extensions"]["sortOrder"] = json!(project.sort_order);
    object
}

fn read_project(object: &Value) -> Project {
    let ext = &object["propsJson"]["extensions"];
    Project {
        id: object["id"].as_str().unwrap_or_default().to_string(),
        title: object["title"].as_str().unwrap_or_default().to_string(),
        status: PROJECT_STATUS
            .iter()
            .position(|s| ext["status"] == *s)
            .unwrap_or(0) as u8,
        sort_order: ext["sortOrder"].as_i64().unwrap_or(0) as i32,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_round_trips_as_core_note() {
        let project = Project {
            id: "p1".into(),
            title: "Ремонт".into(),
            status: 1,
            sort_order: 3,
        };
        let object = project_object(Value::Null, &project, "2026-10-05T00:00:00Z");
        assert_eq!(object["typeId"], "core.note");
        assert_eq!(object["typeVersion"], "0.1.0");
        assert_eq!(object["propsJson"]["extensions"]["entry_kind"], "project");
        assert_eq!(read_project(&object), project);
    }

    #[test]
    fn note_fixtures_pin_project_and_today_journal_kinds() {
        for (name, kind) in [
            ("project-note.json", "project"),
            ("today-journal-note.json", "journal"),
        ] {
            let path = format!("{}/fixtures/engine/{name}", env!("CARGO_MANIFEST_DIR"));
            let object: Value = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
            assert_eq!(object["typeId"], NOTE_TYPE, "{name}");
            assert_eq!(object["typeVersion"], "0.1.0", "{name}");
            assert_eq!(
                object["propsJson"]["extensions"]["entry_kind"], kind,
                "{name}"
            );
            assert!(
                object["propsJson"]["description"].is_string()
                    || object["propsJson"]["description"].is_null(),
                "{name}"
            );
        }
    }
}

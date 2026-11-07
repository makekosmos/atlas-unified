//! Atlas projects are `com.mundus.atlas.project` objects (see `types`). A task
//! belongs to a project through its outbound `project` link (max 1).
use super::{ops, types, Engine, EngineError};
use crate::model::Project;
use serde_json::{json, Value};
use std::collections::HashMap;

pub(super) const PROJECT_TYPE: &str = types::PROJECT_TYPE;
/// Only the fixture helper writes a project, so the versions stay test-side.
#[cfg(test)]
const PROJECT_VERSION: &str = types::PROJECT_VERSION;
/// Projects created before Atlas declared its own type stay `core.project`.
pub(super) const LEGACY_PROJECT_TYPE: &str = "core.project";
#[cfg(test)]
const LEGACY_PROJECT_VERSION: &str = "0.1.0";
const PROJECT_TYPES: [&str; 2] = [PROJECT_TYPE, LEGACY_PROJECT_TYPE];
const PROJECT_LINK: &str = "project";
const PROJECT_STATUS: [&str; 3] = ["active", "someday", "completed"];

impl Engine {
    #[cfg(test)]
    pub(super) fn save_project(&self, project: &Project) -> Result<(), EngineError> {
        let current = self.rpc(ops::OBJECTS_GET, json!({"id":project.id}))?;
        let now = chrono::Utc::now().to_rfc3339();
        self.upsert(project_object(current, project, &now))
    }

    /// Live (not soft-deleted) projects, under either id — `objects.list` takes
    /// one `typeId`, so the list is asked for twice.
    pub(super) fn projects(&self) -> Result<Vec<Project>, EngineError> {
        let mut projects = Vec::new();
        for type_id in PROJECT_TYPES {
            let list = self.rpc(ops::OBJECTS_LIST, json!({"typeId":type_id}))?;
            let list = list
                .as_array()
                .ok_or_else(|| Self::mapping_err("project list not an array".into()))?;
            projects.extend(
                list.iter()
                    .filter(|v| v["typeId"] == *type_id && !v["deletedAt"].is_string())
                    .map(read_project),
            );
        }
        Ok(projects)
    }

    /// Every `project` link as task id → (link id, project id).
    pub(super) fn project_links(&self) -> Result<HashMap<String, (String, String)>, EngineError> {
        let links = self.rpc(ops::LINKS_LIST, json!({}))?;
        let links = links
            .as_array()
            .ok_or_else(|| Self::mapping_err("link list not an array".into()))?;
        Ok(links
            .iter()
            .filter(|link| link["linkType"] == PROJECT_LINK)
            .filter_map(|link| {
                Some((
                    link["sourceObjectId"].as_str()?.to_owned(),
                    (
                        link["id"].as_str()?.to_owned(),
                        link["targetObjectId"].as_str()?.to_owned(),
                    ),
                ))
            })
            .collect())
    }

    /// Point `task` at `project`, or drop its project link when `None`.
    pub(super) fn set_project(&self, task: &str, project: Option<&str>) -> Result<(), EngineError> {
        match project {
            // Replace drops any other `project` link of this task in the same
            // transaction, so a task never ends up in two projects.
            Some(project) => {
                let now = chrono::Utc::now().to_rfc3339();
                self.rpc(
                    ops::LINKS_REPLACE,
                    json!({"object_link":project_link(task, project, &now)}),
                )?;
            }
            None => {
                if let Some((id, _)) = self.project_links()?.remove(task) {
                    self.rpc(ops::LINKS_DELETE, json!({"id":id}))?;
                }
            }
        }
        Ok(())
    }
}

fn project_link(task: &str, project: &str, now: &str) -> Value {
    json!({"id":format!("{task}:project"),"sourceObjectId":task,"targetObjectId":project,
        "linkType":PROJECT_LINK,"createdAt":now})
}

#[cfg(test)]
fn project_object(current: Value, project: &Project, now: &str) -> Value {
    let mut object = if current.is_null() {
        json!({"id":project.id,"typeId":PROJECT_TYPE,"typeVersion":PROJECT_VERSION,
            "createdAt":now,
            "propsJson":{"status":"active","scheduledAt":null,"dueAt":null,"color":null,
                "extensions":{}},
            "contentJson":{"type":"doc","content":[{"type":"paragraph"}]},"deletedAt":null})
    } else {
        current
    };
    object["title"] = json!(project.title);
    object["updatedAt"] = json!(now);
    // The stored object keeps the type it already has; only a new project is
    // written under the Atlas type.
    object["typeVersion"] = json!(if object["typeId"] == LEGACY_PROJECT_TYPE {
        LEGACY_PROJECT_VERSION
    } else {
        PROJECT_VERSION
    });
    let props = &mut object["propsJson"];
    props["status"] = json!(PROJECT_STATUS
        .get(usize::from(project.status))
        .unwrap_or(&"active"));
    if !props["extensions"].is_object() {
        props["extensions"] = json!({});
    }
    props["extensions"]["sortOrder"] = json!(project.sort_order);
    object
}

fn read_project(object: &Value) -> Project {
    let props = &object["propsJson"];
    Project {
        id: object["id"].as_str().unwrap_or_default().to_string(),
        title: object["title"].as_str().unwrap_or_default().to_string(),
        status: PROJECT_STATUS
            .iter()
            .position(|s| props["status"] == *s)
            .unwrap_or(0) as u8,
        sort_order: props["extensions"]["sortOrder"].as_i64().unwrap_or(0) as i32,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(name: &str) -> Value {
        let path = format!("{}/fixtures/engine/{name}", env!("CARGO_MANIFEST_DIR"));
        serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap()
    }

    #[test]
    fn project_round_trips_as_an_atlas_type() {
        let project = Project {
            id: "p1".into(),
            title: "Ремонт".into(),
            status: 1,
            sort_order: 3,
        };
        let object = project_object(Value::Null, &project, "2026-10-05T00:00:00Z");
        assert_eq!(object["typeId"], "com.mundus.atlas.project");
        assert_eq!(object["typeVersion"], "0.1.0");
        assert_eq!(object["propsJson"]["status"], "someday");
        assert_eq!(read_project(&object), project);
    }

    #[test]
    fn project_fixture_matches_write_output() {
        let committed = fixture("project.json");
        let project = read_project(&committed);
        let written = project_object(
            Value::Null,
            &project,
            committed["createdAt"].as_str().unwrap(),
        );
        assert_eq!(written, committed);
    }

    #[test]
    fn task_project_link_fixture_matches_write_output() {
        let committed = fixture("task-project-link.json");
        let written = project_link(
            committed["sourceObjectId"].as_str().unwrap(),
            committed["targetObjectId"].as_str().unwrap(),
            committed["createdAt"].as_str().unwrap(),
        );
        assert_eq!(written, committed);
        assert_eq!(committed["linkType"], "project");
    }

    #[test]
    fn today_journal_stays_a_core_note() {
        let object = fixture("today-journal-note.json");
        assert_eq!(object["typeId"], "core.note");
        assert_eq!(object["typeVersion"], "0.1.0");
        assert_eq!(object["propsJson"]["extensions"]["entry_kind"], "journal");
    }
}

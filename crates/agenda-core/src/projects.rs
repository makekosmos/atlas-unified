//! Atlas projects as Engine `core.project` 0.1.0 objects. A task belongs to a
//! project through an outbound `project` link (`core.task` relation, max 1).
use crate::types::Project;
use serde_json::{json, Value};

pub const PROJECT_TYPE: &str = "core.project";
pub const PROJECT_VERSION: &str = "0.1.0";
/// `core.task` relation type that points a task at its `core.project`.
pub const PROJECT_LINK: &str = "project";
const PROJECT_STATUS: [&str; 3] = ["active", "someday", "completed"];

pub fn project_object(current: &Value, project: &Project, now: &str) -> Value {
    let mut object = if current.is_null() {
        json!({"id":project.id,"typeId":PROJECT_TYPE,"typeVersion":PROJECT_VERSION,
            "createdAt":now,
            "propsJson":{"status":"active","scheduledAt":null,"dueAt":null,"color":null,
                "extensions":{}},
            "contentJson":{"type":"doc","content":[{"type":"paragraph"}]},"deletedAt":null})
    } else {
        current.clone()
    };
    object["title"] = json!(project.title);
    object["updatedAt"] = json!(now);
    let props = &mut object["propsJson"];
    props["status"] = json!(PROJECT_STATUS
        .get(usize::from(project.status))
        .unwrap_or(&"active"));
    if !props["extensions"].is_object() {
        props["extensions"] = json!({});
    }
    props["extensions"]["sortOrder"] = json!(project.sort_order);
    props["extensions"]["areaId"] = json!(project.area_id);
    object
}

pub fn read_project(object: &Value) -> Project {
    let props = &object["propsJson"];
    Project {
        id: object["id"].as_str().unwrap_or_default().to_string(),
        title: object["title"].as_str().unwrap_or_default().to_string(),
        status: PROJECT_STATUS
            .iter()
            .position(|s| props["status"] == *s)
            .unwrap_or(0) as u8,
        sort_order: props["extensions"]["sortOrder"].as_i64().unwrap_or(0) as i32,
        area_id: props["extensions"]["areaId"].as_str().map(str::to_string),
    }
}

/// The Engine `ObjectLink` that puts `task` into `project`.
pub fn project_link(task: &str, project: &str, now: &str) -> Value {
    json!({"id":format!("{task}:project"),"sourceObjectId":task,"targetObjectId":project,
        "linkType":PROJECT_LINK,"createdAt":now})
}

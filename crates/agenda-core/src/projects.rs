//! Atlas project notes encoded using the shared `core.note` contract.
use crate::types::Project;
use serde_json::{json, Value};

pub const NOTE_TYPE: &str = "core.note";
const PROJECT_KIND: &str = "project";
const PROJECT_STATUS: [&str; 3] = ["active", "someday", "completed"];

pub fn project_object(current: &Value, project: &Project, now: &str) -> Value {
    let mut object = if current.is_null() {
        json!({"id":project.id,"typeId":NOTE_TYPE,"typeVersion":"0.1.0","createdAt":now,
            "propsJson":{"description":null,"extensions":{}},
            "contentJson":{"type":"doc","content":[{"type":"paragraph"}]},"deletedAt":null})
    } else {
        current.clone()
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
    props["extensions"]["areaId"] = json!(project.area_id);
    object
}

pub fn read_project(object: &Value) -> Project {
    let ext = &object["propsJson"]["extensions"];
    Project {
        id: object["id"].as_str().unwrap_or_default().to_string(),
        title: object["title"].as_str().unwrap_or_default().to_string(),
        status: PROJECT_STATUS
            .iter()
            .position(|s| ext["status"] == *s)
            .unwrap_or(0) as u8,
        sort_order: ext["sortOrder"].as_i64().unwrap_or(0) as i32,
        area_id: ext["areaId"].as_str().map(str::to_string),
    }
}

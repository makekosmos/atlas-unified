use serde::Serialize;
use serde_json::{json, Value};

use super::Engine;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgramUsage {
    pub name: String,
    pub process: String,
    pub path: String,
    pub foreground_ms: i64,
    pub sessions: i64,
    pub last_seen_at: String,
}

impl Engine {
    /// Cortex foreground time. A failed read leaves the games page without numbers.
    pub fn program_usage(&self) -> Vec<ProgramUsage> {
        let Ok(value) = self.rpc(
            "get_usage_analytics",
            json!({
                "range_days": 3650,
                "top_apps_limit": 500,
                "recent_sessions_limit": 1,
            }),
        ) else {
            return Vec::new();
        };
        value
            .get("topApps")
            .and_then(Value::as_array)
            .map(|rows| rows.iter().filter_map(from_row).collect())
            .unwrap_or_default()
    }
}

fn from_row(row: &Value) -> Option<ProgramUsage> {
    Some(ProgramUsage {
        name: row.get("displayName")?.as_str()?.to_owned(),
        process: row.get("processName")?.as_str().unwrap_or("").to_owned(),
        path: row.get("normalizedPath")?.as_str().unwrap_or("").to_owned(),
        foreground_ms: row.get("foregroundMs")?.as_i64().unwrap_or(0),
        sessions: row.get("sessions")?.as_i64().unwrap_or(0),
        last_seen_at: row
            .get("lastSeenAt")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_owned(),
    })
}

#[cfg(test)]
mod tests {
    use super::from_row;
    use serde_json::json;

    #[test]
    fn reads_a_top_app_row() {
        let row = json!({
            "displayName": "Hades",
            "processName": "Hades.exe",
            "normalizedPath": "D:\\Games\\Hades.exe",
            "foregroundMs": 60000,
            "sessions": 2,
            "lastSeenAt": "2026-01-01T00:00:00Z"
        });
        let usage = from_row(&row).unwrap();
        assert_eq!(usage.name, "Hades");
        assert_eq!(usage.process, "Hades.exe");
        assert_eq!(usage.foreground_ms, 60000);
        assert_eq!(usage.sessions, 2);
    }
}

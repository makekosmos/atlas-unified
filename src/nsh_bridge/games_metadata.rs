use serde_json::{json, Value};

use super::{ImageOverride, ImportCandidate, MetadataChoice};
use crate::store::Engine;

pub(super) fn enrich_candidate(engine: &Engine, candidate: &ImportCandidate) -> Result<Value, String> {
    let response = engine.rpc("games.metadata.resolve", json!({
        "title": candidate.title,
        "source": candidate.source,
        "sourceAppId": candidate.source_app_id,
    })).map_err(|error| error.to_string())?;
    apply_metadata(engine, &candidate.exe_path, &response)?;
    Ok(response)
}

pub(super) fn choose_metadata(engine: &Engine, choice: &MetadataChoice) -> Result<Value, String> {
    let response = engine.rpc("games.metadata.resolve", json!({
        "title": choice.title,
        "provider": choice.provider,
        "providerId": choice.provider_id,
    })).map_err(|error| error.to_string())?;
    apply_metadata(engine, &choice.exe_path, &response)?;
    Ok(response)
}

pub(super) fn override_image(engine: &Engine, request: &ImageOverride) -> Result<Value, String> {
    let record = find_record(engine, &request.exe_path)?;
    let id = record.get("id").and_then(Value::as_str).ok_or("game-id-missing")?;
    let result = engine.rpc("games.metadata.set-image", json!({"id":id,"source":request.source}))
        .map_err(|error| error.to_string())?;
    apply_image(engine, &request.exe_path, &result)?;
    Ok(result)
}

fn apply_metadata(engine: &Engine, exe_path: &str, response: &Value) -> Result<(), String> {
    let mut record = find_record(engine, exe_path)?;
    let status = response.get("status").and_then(Value::as_str).unwrap_or("error");
    ensure_atlas_extension(&mut record);
    record["extensions"]["atlas"]["metadataStatus"] = json!(status);
    if status == "matched" {
        let metadata = response.get("metadata").ok_or("metadata-response-missing")?;
        if let Some(name) = metadata.get("name").and_then(Value::as_str).filter(|name| !name.trim().is_empty()) {
            record["title"] = json!(name);
        }
        record["description"] = metadata.get("description").cloned().unwrap_or(Value::Null);
        record["genres"] = metadata.get("genres").cloned().unwrap_or(json!([]));
        record["platforms"] = metadata.get("platforms").cloned().unwrap_or(json!([]));
        let raw_date = metadata.get("releaseDate").cloned().unwrap_or(Value::Null);
        record["released"] = raw_date.as_str().and_then(canonical_date).map(Value::String).unwrap_or(Value::Null);
        record["extensions"]["atlas"]["releaseDateText"] = raw_date;
        record["extensions"]["atlas"]["developers"] = metadata.get("developers").cloned().unwrap_or(json!([]));
        record["extensions"]["atlas"]["publishers"] = metadata.get("publishers").cloned().unwrap_or(json!([]));
        record["extensions"]["atlas"]["metadataProvider"] = response.get("provider").cloned().unwrap_or(Value::Null);
        record["extensions"]["atlas"]["metadataProviderGameId"] = response.get("providerGameId").cloned().unwrap_or(Value::Null);
        if record.pointer("/extensions/atlas/headerImageOverride").and_then(Value::as_bool) != Some(true) {
            record["extensions"]["atlas"]["headerImagePath"] = response.get("headerImagePath").cloned().unwrap_or(Value::Null);
            record["extensions"]["atlas"]["headerImageUrl"] = response.get("headerImageUrl").cloned().unwrap_or(Value::Null);
        }
    }
    upsert(engine, record)
}

fn apply_image(engine: &Engine, exe_path: &str, response: &Value) -> Result<(), String> {
    let mut record = find_record(engine, exe_path)?;
    ensure_atlas_extension(&mut record);
    record["extensions"]["atlas"]["headerImagePath"] = response.get("headerImagePath").cloned().unwrap_or(Value::Null);
    record["extensions"]["atlas"]["headerImageUrl"] = Value::Null;
    record["extensions"]["atlas"]["headerImageOverride"] = json!(true);
    record["extensions"]["atlas"]["metadataStatus"] = json!("matched");
    upsert(engine, record)
}

fn find_record(engine: &Engine, exe_path: &str) -> Result<Value, String> {
    let records = engine.rpc("canonical.game.list", json!({})).map_err(|error| error.to_string())?;
    let expected = normalize_path(exe_path);
    records.as_array().into_iter().flatten().find(|record| {
        record.pointer("/local/exePath").and_then(Value::as_str).is_some_and(|path| normalize_path(path) == expected)
    }).cloned().ok_or_else(|| "game-not-found".to_owned())
}

fn upsert(engine: &Engine, record: Value) -> Result<(), String> {
    engine.rpc("canonical.game.upsert", json!({"game":record})).map(|_| ()).map_err(|error| error.to_string())
}

fn ensure_atlas_extension(record: &mut Value) {
    if !record.get("extensions").is_some_and(Value::is_object) { record["extensions"] = json!({}); }
    if !record.pointer("/extensions/atlas").is_some_and(Value::is_object) { record["extensions"]["atlas"] = json!({}); }
}

fn canonical_date(value: &str) -> Option<String> {
    for format in ["%Y-%m-%d", "%Y/%m/%d"] {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(value, format) { return Some(date.format("%Y-%m-%d").to_string()); }
    }
    None
}

fn normalize_path(path: &str) -> String { path.replace('/', "\\").to_lowercase() }

#[cfg(test)]
mod tests {
    use super::canonical_date;

    #[test]
    fn only_persists_exact_dates_as_canonical_dates() {
        assert_eq!(canonical_date("2024-03-17").as_deref(), Some("2024-03-17"));
        assert_eq!(canonical_date("Mar 17, 2024"), None);
        assert_eq!(canonical_date("2024"), None);
    }
}

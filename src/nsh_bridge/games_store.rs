use std::{collections::HashSet, path::Path};

use serde_json::{json, Value};

use super::ImportCandidate;
use crate::store::Engine;

/// The demo library: three cards that show the grid, the covers and the
/// details dialog. Their files do not exist, so a launch does nothing.
pub(super) fn demo_cards() -> Vec<Value> {
    vec![
        json!({
            "id": "demo:game-1",
            "title": "Полночный порт",
            "exePath": "/Демо/Полночный порт.exe",
            "hidden": false,
            "rating": 4.5,
            "note": "Тихая игра про ночной город и письма.",
            "description": "Проводите письма по ночному порту: короткие главы, спокойная музыка.",
            "genres": ["Приключение", "Инди"],
            "released": "2024-03-14",
            "developers": ["Тихая студия"],
            "publishers": ["Тихая студия"],
            "releaseDateText": "14 марта 2024",
            "headerImagePath": null,
            "metadataStatus": "ready"
        }),
        json!({
            "id": "demo:game-2",
            "title": "Северный сад",
            "exePath": "/Демо/Северный сад.exe",
            "hidden": false,
            "rating": 4.0,
            "note": "Строю сад третий вечер подряд.",
            "description": "Сад на скалах: растите, собирайте, слушайте ветер.",
            "genres": ["Симулятор", "Спокойная"],
            "released": "2023-09-01",
            "developers": ["Сад на скалах"],
            "publishers": ["Сад на скалах"],
            "releaseDateText": "1 сентября 2023",
            "headerImagePath": null,
            "metadataStatus": "ready"
        }),
        json!({
            "id": "demo:game-3",
            "title": "Счётчик шагов",
            "exePath": "/Демо/Счётчик шагов.exe",
            "hidden": false,
            "rating": null,
            "note": "",
            "description": "Головоломка про комнаты, которые двигаются, пока вы идёте.",
            "genres": ["Головоломка"],
            "released": "2025-01-20",
            "developers": ["Мастерская шагов"],
            "publishers": [],
            "releaseDateText": "20 января 2025",
            "headerImagePath": null,
            "metadataStatus": "pending"
        }),
    ]
}

pub(super) fn emit_library(engine: &Engine, emit: &impl Fn(&str, Value)) {
    match load_cards(engine) {
        Ok(cards) => emit("games", json!(cards)),
        Err(error) => emit("games", json!({"error":error})),
    }
}

fn load_cards(engine: &Engine) -> Result<Vec<Value>, String> {
    let value = engine
        .rpc("canonical.game.list", json!({}))
        .map_err(|error| error.to_string())?;
    let records = value
        .as_array()
        .ok_or_else(|| "Engine вернул неверный список игр".to_owned())?;
    let mut cards: Vec<Value> = records.iter().filter_map(card_from_record).collect();
    cards.sort_by(|left, right| {
        left["title"]
            .as_str()
            .unwrap_or_default()
            .to_lowercase()
            .cmp(&right["title"].as_str().unwrap_or_default().to_lowercase())
    });
    Ok(cards)
}

fn card_from_record(record: &Value) -> Option<Value> {
    if !record.get("deletedAt")?.is_null() {
        return None;
    }
    let exe_path = record.pointer("/local/exePath")?.as_str()?.trim();
    if exe_path.is_empty() {
        return None;
    }
    let atlas = record.pointer("/extensions/atlas");
    Some(json!({
        "id": record.get("id")?.as_str()?,
        "title": record.get("title")?.as_str()?,
        "exePath": exe_path,
        "hidden": atlas.and_then(|value| value.get("hidden")).and_then(Value::as_bool).unwrap_or(false),
        "rating": record.get("userRating").and_then(Value::as_f64),
        "note": atlas.and_then(|value| value.get("note")).and_then(Value::as_str).unwrap_or(""),
        "description": record.get("description").and_then(Value::as_str),
        "genres": record.get("genres").cloned().unwrap_or(json!([])),
        "released": record.get("released").and_then(Value::as_str),
        "developers": atlas.and_then(|value| value.get("developers")).cloned().unwrap_or(json!([])),
        "publishers": atlas.and_then(|value| value.get("publishers")).cloned().unwrap_or(json!([])),
        "releaseDateText": atlas.and_then(|value| value.get("releaseDateText")).and_then(Value::as_str),
        "headerImagePath": atlas.and_then(|value| value.get("headerImagePath")).and_then(Value::as_str),
        "metadataStatus": atlas.and_then(|value| value.get("metadataStatus")).and_then(Value::as_str)
    }))
}

pub(super) fn import_candidates(
    engine: &Engine,
    candidates: Vec<ImportCandidate>,
) -> Result<(), String> {
    let records = engine
        .rpc("canonical.game.list", json!({}))
        .map_err(|error| error.to_string())?;
    let mut paths: HashSet<String> = records
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|record| record.pointer("/local/exePath").and_then(Value::as_str))
        .map(normalized_path)
        .collect();
    for candidate in candidates {
        let exe_path = candidate.exe_path.trim();
        let path = Path::new(exe_path);
        if !is_importable_game_path(path) {
            return Err(format!("Ожидался exe-файл или ярлык: {exe_path}"));
        }
        if !paths.insert(normalized_path(exe_path)) {
            continue;
        }
        let title = candidate.title.trim();
        let title = if title.is_empty() {
            path.file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or("Игра")
        } else {
            title
        };
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let install_dir = if candidate.install_dir.trim().is_empty() {
            path.parent()
                .unwrap_or_else(|| Path::new(""))
                .to_string_lossy()
                .into_owned()
        } else {
            candidate.install_dir.trim().to_owned()
        };
        let game = json!({
            "id": uuid::Uuid::new_v4().to_string(), "title": title, "playStatus": null,
            "userRating": candidate.rating.map(|rating| rating.clamp(0.0, 10.0)),
            "genres": [], "platforms": [], "released": null, "description": null,
            "extensions": {"atlas":{"hidden":candidate.hidden.unwrap_or(false),"note":candidate.note.unwrap_or_default(),"metadataStatus":"loading"}},
            "createdAt": now, "updatedAt": now, "deletedAt": null, "links": [],
            "local": {"source":candidate.source.filter(|source| !source.trim().is_empty()).unwrap_or_else(|| "manual".to_owned()),"sourceAppId":candidate.source_app_id,"installDir":install_dir,"exePath":exe_path,"savePaths":[]},
            "quarantine": {"providerRefs":[],"fields":[]}
        });
        engine
            .rpc("canonical.game.upsert", json!({"game":game}))
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub(super) fn is_exe(path: &Path) -> bool {
    path.extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("exe"))
}

fn is_importable_game_path(path: &Path) -> bool {
    path.extension().is_some_and(|extension| {
        extension.eq_ignore_ascii_case("exe") || extension.eq_ignore_ascii_case("lnk")
    })
}

fn normalized_path(path: &str) -> String {
    path.replace('/', "\\").to_lowercase()
}

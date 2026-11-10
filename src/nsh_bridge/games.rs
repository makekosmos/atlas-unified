#[path = "games_discovery.rs"]
mod discovery;
#[path = "games_metadata.rs"]
mod metadata;
#[path = "games_store.rs"]
mod store;
#[path = "games_worker.rs"]
mod worker;
use metadata::{choose_metadata, enrich_candidate, override_image};
use store::{emit_library, import_candidates, is_exe};
pub(super) use worker::start_worker;

use std::{path::PathBuf, sync::mpsc::Sender};

use gpui::{App, PathPromptOptions};
use imago_nsh::ComponentContext;
use serde::Deserialize;
use serde_json::{json, Value};

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ImportCandidate {
    title: String,
    exe_path: String,
    #[serde(default)]
    install_dir: String,
    #[serde(default)]
    source: Option<String>,
    #[serde(default)]
    source_app_id: Option<String>,
    #[serde(default)]
    hidden: Option<bool>,
    #[serde(default)]
    rating: Option<f64>,
    #[serde(default)]
    note: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImportRequest {
    candidates: Vec<ImportCandidate>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct MetadataChoice {
    exe_path: String,
    title: String,
    provider: String,
    provider_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ImageOverride {
    exe_path: String,
    source: String,
}

pub(super) enum Request {
    Load,
    Discover,
    Import {
        candidates: Vec<ImportCandidate>,
        legacy: bool,
    },
    MetadataChoice(MetadataChoice),
    ImageOverride(ImageOverride),
    PickPath(String),
    PickPaths(Vec<PathBuf>),
    ClearPick,
    Launch(PathBuf),
}

pub(super) struct Bridge {
    context: ComponentContext,
    requests: Sender<Request>,
}

impl Bridge {
    pub(super) fn new(context: ComponentContext) -> Self {
        let event_context = context.clone();
        let requests = start_worker(move |event, value| event_context.emit(event, value));
        Self { context, requests }
    }

    pub(super) fn command(&self, name: &str, args: &Value, cx: &mut App) {
        match name {
            "games.pick" => {
                if let Some(path) = args.get("path").and_then(Value::as_str) {
                    let _ = self.requests.send(Request::PickPath(path.to_owned()));
                }
            }
            "games.browse" => pick_paths(cx, false, self.requests.clone(), self.context.clone()),
            "games.browse-folder" => {
                eprintln!("atlas: games.browse-folder asked");
                pick_paths(cx, true, self.requests.clone(), self.context.clone())
            }
            "games.launch" => {
                if let Some(path) = args.get("path").and_then(Value::as_str) {
                    let _ = self.requests.send(Request::Launch(PathBuf::from(path)));
                }
            }
            "games.clear-pick" => {
                let _ = self.requests.send(Request::ClearPick);
            }
            _ => {
                if let Err(error) = enqueue(&self.requests, name, args) {
                    self.context.emit(
                        "imported",
                        json!({"ok":false,"legacy":name == "games.import-legacy","error":error}),
                    );
                }
            }
        }
    }
}

/// Asks for a game file, or for the folder it lives in; the folder is then
/// searched by [`crate::games::exes_in`] and every executable found becomes a
/// pick for the "which file launches it" dialog.
fn pick_paths(cx: &mut App, folder: bool, requests: Sender<Request>, context: ComponentContext) {
    eprintln!(
        "atlas: opening the {} prompt",
        if folder { "folder" } else { "file" }
    );
    let receiver = cx.prompt_for_paths(PathPromptOptions {
        files: !folder,
        directories: folder,
        multiple: false,
        prompt: Some(
            if folder {
                "Выберите папку с игрой"
            } else {
                "Выберите exe-файл игры"
            }
            .into(),
        ),
    });
    cx.spawn(async move |_cx| match receiver.await {
        Ok(Ok(Some(paths))) => {
            eprintln!("atlas: path prompt returned {} path(s)", paths.len());
            if folder {
                if let Some(path) = paths.first() {
                    let _ = requests.send(Request::PickPath(path.display().to_string()));
                }
            } else {
                let _ = requests.send(Request::PickPaths(paths));
            }
        }
        Ok(Ok(None)) => eprintln!("atlas: path prompt cancelled"),
        Ok(Err(error)) => {
            eprintln!("atlas: path prompt failed: {error}");
            context.emit(
                "imported",
                json!({"ok":false,"legacy":false,"error":error.to_string()}),
            );
        }
        Err(error) => {
            eprintln!("atlas: path prompt channel failed: {error}");
            context.emit(
                "imported",
                json!({"ok":false,"legacy":false,"error":error.to_string()}),
            );
        }
    })
    .detach();
}

pub(super) fn enqueue(requests: &Sender<Request>, name: &str, args: &Value) -> Result<(), String> {
    let request = match name {
        "games.load" => Request::Load,
        "games.discover" => Request::Discover,
        "games.import" | "games.import-legacy" => {
            let request = serde_json::from_value::<ImportRequest>(args.clone())
                .map_err(|error| format!("Некорректный список игр: {error}"))?;
            Request::Import {
                candidates: request.candidates,
                legacy: name == "games.import-legacy",
            }
        }
        "games.metadata.choose" => Request::MetadataChoice(
            serde_json::from_value(args.clone()).map_err(|error| error.to_string())?,
        ),
        "games.metadata.set-image" => Request::ImageOverride(
            serde_json::from_value(args.clone()).map_err(|error| error.to_string())?,
        ),
        _ => return Ok(()),
    };
    requests.send(request).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::ImportRequest;
    use serde_json::json;

    #[test]
    fn import_request_accepts_candidate_shape_without_api_keys() {
        let request: ImportRequest = serde_json::from_value(json!({
            "candidates": [{"title":"Game", "exePath":"C:\\Game.exe", "installDir":"", "source":"manual"}]
        })).unwrap();
        assert_eq!(request.candidates[0].exe_path, "C:\\Game.exe");
    }
}

use std::{
    path::PathBuf,
    sync::mpsc::{self, Sender},
    thread,
    time::Duration,
};

use serde_json::{json, Value};

use crate::store::Engine;

use super::{choose_metadata, discovery, emit_library, enrich_candidate, import_candidates, is_exe, override_image, Request};

type EventSender = Sender<(String, Value)>;

pub(in crate::nsh_bridge) fn start_worker(
    emit: impl Fn(&str, Value) + Send + 'static,
) -> Sender<Request> {
    let (requests, receiver) = mpsc::channel();
    let (events, event_receiver) = mpsc::channel::<(String, Value)>();
    thread::spawn(move || {
        while let Ok((event, value)) = event_receiver.recv() {
            emit(&event, value);
        }
    });
    thread::spawn(move || {
        let engine = Engine::default();
        while let Ok(request) = receiver.recv() {
            match request {
                Request::Load => {
                    let events = events.clone();
                    emit_library(&engine, &|event, value| send_event(&events, event, value));
                }
                Request::Discover => {
                    let events = events.clone();
                    thread::spawn(move || {
                        discovery::run(&Engine::default(), &|event, value| {
                            send_event(&events, event, value);
                        });
                    });
                }
                Request::Import { candidates, legacy } => {
                    let pending_metadata = candidates.clone();
                    let result = import_candidates(&engine, candidates);
                    let events = events.clone();
                    emit_library(&engine, &|event, value| send_event(&events, event, value));
                    let succeeded = result.is_ok();
                    send_event(
                        &events,
                        "imported",
                        json!({"ok":succeeded,"legacy":legacy,"error":result.err()}),
                    );
                    if succeeded {
                        let events = events.clone();
                        thread::spawn(move || {
                            let engine = Engine::with_timeout(Duration::from_secs(90));
                            for candidate in pending_metadata {
                                let result = enrich_candidate(&engine, &candidate);
                                let event = result.as_ref().map(|value| value.clone()).unwrap_or_else(|error| json!({"status":"error","error":error}));
                                send_event(&events, "metadata", json!({"exePath":candidate.exe_path,"result":event}));
                                emit_library(&engine, &|name, value| send_event(&events, name, value));
                            }
                        });
                    }
                }
                Request::MetadataChoice(choice) => {
                    let events = events.clone();
                    thread::spawn(move || {
                        let engine = Engine::with_timeout(Duration::from_secs(90));
                        let result = choose_metadata(&engine, &choice);
                        let event = result.as_ref().map(|value| value.clone()).unwrap_or_else(|error| json!({"status":"error","error":error}));
                        send_event(&events, "metadata", json!({"exePath":choice.exe_path,"result":event}));
                        emit_library(&engine, &|name, value| send_event(&events, name, value));
                    });
                }
                Request::ImageOverride(image) => {
                    let events = events.clone();
                    thread::spawn(move || {
                        let engine = Engine::with_timeout(Duration::from_secs(30));
                        let result = override_image(&engine, &image);
                        let event = result.as_ref().map(|value| value.clone()).unwrap_or_else(|error| json!({"status":"error","error":error}));
                        send_event(&events, "metadata", json!({"exePath":image.exe_path,"result":event}));
                        emit_library(&engine, &|name, value| send_event(&events, name, value));
                    });
                }
                Request::PickPath(path) => {
                    let events = events.clone();
                    send_event(&events, "picked", json!(crate::games::exes_in(&path)));
                }
                Request::PickPaths(paths) => {
                    let picked = selected_manual_exes(paths);
                    let events = events.clone();
                    if picked.is_empty() {
                        send_event(
                            &events,
                            "imported",
                            json!({"ok":false,"legacy":false,"error":"Выберите существующий exe-файл игры"}),
                        );
                    }
                    send_event(&events, "picked", json!(picked));
                }
                Request::ClearPick => {
                    let events = events.clone();
                    send_event(&events, "picked", json!([]));
                }
                Request::Launch(path) => {
                    let events = events.clone();
                    let result = launch_game(&path);
                    send_event(
                        &events,
                        "launched",
                        json!({
                            "ok": result.is_ok(),
                            "path": path.display().to_string(),
                            "error": result.err(),
                        }),
                    );
                }
            }
        }
    });
    requests
}

fn send_event(events: &EventSender, name: &str, value: Value) {
    let _ = events.send((name.to_owned(), value));
}

/// Starts the game's executable in its own directory, so relative assets and
/// launchers resolve. The Engine counts the play time from the process window.
fn launch_game(path: &std::path::Path) -> Result<(), String> {
    if !path.is_file() {
        return Err(format!("Файл игры не найден: {}", path.display()));
    }
    let directory = path.parent().unwrap_or_else(|| std::path::Path::new("."));
    std::process::Command::new(path)
        .current_dir(directory)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Не удалось запустить {}: {error}", path.display()))
}

fn selected_manual_exes(paths: Vec<PathBuf>) -> Vec<String> {
    let valid_paths: Vec<_> = paths
        .into_iter()
        .filter(|path| path.is_file() && is_exe(path))
        .collect();
    crate::games::exes_in_paths(&valid_paths)
        .into_iter()
        .take(1)
        .collect()
}

#[cfg(test)]
mod tests {
    use std::{error::Error, fs};

    use super::selected_manual_exes;

    #[test]
    fn manual_picker_accepts_one_existing_exe_but_rejects_folders_and_other_files(
    ) -> Result<(), Box<dyn Error>> {
        let root = std::env::temp_dir().join(format!("atlas-manual-game-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&root)?;
        let exe = root.join("game.exe");
        let text = root.join("readme.txt");
        fs::write(&exe, b"exe")?;
        fs::write(&text, b"text")?;
        assert!(selected_manual_exes(vec![root.clone()]).is_empty());
        assert!(selected_manual_exes(vec![text]).is_empty());
        assert_eq!(
            selected_manual_exes(vec![exe.clone()]),
            vec![exe.display().to_string()]
        );
        fs::remove_dir_all(root)?;
        Ok(())
    }
}

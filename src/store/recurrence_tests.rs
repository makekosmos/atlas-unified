use super::*;
use crate::model::{new_todo, Status};
use std::{
    collections::HashMap,
    io::{BufRead, BufReader, Read, Write},
    net::{TcpListener, TcpStream},
    sync::{Arc, Mutex},
};

#[derive(Clone, Copy)]
enum Failure {
    Missing,
    Readback,
    LinksReadback,
    Rollback,
    LostAck,
    DifferentSuccessor,
}

struct State {
    objects: HashMap<String, Value>,
    revisions: HashMap<String, String>,
    successor_failed: bool,
    rollback_attempted: bool,
    links_readback_failed: bool,
}

fn run(failure: Failure) {
    let mut before = new_todo("original", "repeat");
    before.created_at = "2026-11-07T00:00:00Z".into();
    let mut completed = before.clone();
    completed.status = Status::Done;
    completed.is_completed = true;
    completed.completed_at = Some(before.created_at.clone());
    let mut next = before.clone();
    next.id = "successor".into();
    let original = mapping::write(Value::Null, None, &before).unwrap();
    let shared = Arc::new(Mutex::new(State {
        objects: HashMap::from([(before.id.clone(), original)]),
        revisions: HashMap::from([(before.id.clone(), "r0".into())]),
        successor_failed: false,
        rollback_attempted: false,
        links_readback_failed: false,
    }));
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    let directory = std::env::temp_dir().join(format!("atlas-recurrence-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&directory).unwrap();
    std::fs::write(directory.join("engine.lock.json"), json!({
        "format_version":1,"api_version":{"major":1},"http_port":port,"auth_token":"a".repeat(64)
    }).to_string()).unwrap();
    let state = shared.clone();
    let server = std::thread::spawn(move || {
        for socket in listener.incoming() {
            let mut socket = socket.unwrap();
            let mut reader = BufReader::new(socket.try_clone().unwrap());
            let mut first = String::new();
            reader.read_line(&mut first).unwrap();
            if first.contains("/stop") {
                break;
            }
            let mut length = 0;
            loop {
                let mut line = String::new();
                reader.read_line(&mut line).unwrap();
                if line == "\r\n" {
                    break;
                }
                if let Some(value) = line.to_lowercase().strip_prefix("content-length:") {
                    length = value.trim().parse().unwrap();
                }
            }
            let mut bytes = vec![0; length];
            reader.read_exact(&mut bytes).unwrap();
            let request: Value = serde_json::from_slice(&bytes).unwrap();
            let mut state = state.lock().unwrap();
            let id = request["id"].as_str().unwrap_or_default();
            let response = match request["operation"].as_str().unwrap() {
                "types.register" => json!({"ok":true,"data":{}}),
                "links.list" if state.successor_failed && !state.links_readback_failed && matches!(failure, Failure::LinksReadback) => {
                    state.links_readback_failed = true;
                    json!({"ok":false,"error":"injected project-link readback outage"})
                }
                "links.list" => json!({"ok":true,"data":[]}),
                "objects.snapshot" => {
                    if id == "original" && state.successor_failed {
                        state.rollback_attempted = true;
                    }
                    if id == "original" && state.successor_failed && matches!(failure, Failure::Rollback) {
                        json!({"ok":false,"error":"injected rollback outage"})
                    } else {
                        json!({"ok":true,"data":super::tests::snapshot(state.objects.get(id), state.revisions.get(id).map(String::as_str))})
                    }
                }
                "objects.get" if id == "successor" && state.successor_failed && matches!(failure, Failure::Readback | Failure::Rollback) => {
                    json!({"ok":false,"error":"injected readback outage"})
                }
                "objects.get" => json!({"ok":true,"data":state.objects.get(id)}),
                "objects.upsert" => {
                    let mut object = request["object"].clone();
                    let id = object["id"].as_str().unwrap().to_owned();
                    assert_eq!(request["expectedSnapshot"], super::tests::snapshot(state.objects.get(&id), state.revisions.get(&id).map(String::as_str)));
                    if id == "successor" {
                        state.successor_failed = true;
                        if matches!(failure, Failure::LostAck | Failure::DifferentSuccessor | Failure::LinksReadback) {
                            if matches!(failure, Failure::DifferentSuccessor) { object["title"] = json!("someone else's successor"); }
                            state.objects.insert(id.clone(), object);
                            state.revisions.insert(id, "r1".into());
                        }
                        json!({"ok":false,"error":"injected successor timeout"})
                    } else {
                        let revision = format!("r{}", state.revisions.len() + 1);
                        state.objects.insert(id.clone(), object);
                        state.revisions.insert(id, revision);
                        json!({"ok":true,"data":true})
                    }
                }
                operation => panic!("unexpected operation {operation}"),
            }.to_string();
            write!(socket, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", response.len(), response).unwrap();
        }
    });
    let mut engine = Engine::default();
    engine.data_dir = Some(directory.clone());
    let result = engine.save_with_next(Some(&before), &completed, Some(&next));
    let mut stop = TcpStream::connect(("127.0.0.1", port)).unwrap();
    stop.write_all(b"GET /stop HTTP/1.1\r\n\r\n").unwrap();
    server.join().unwrap();
    let state = shared.lock().unwrap();
    match failure {
        Failure::LostAck => {
            assert!(result.is_ok(), "{result:?}");
            assert!(!state.rollback_attempted);
            assert_eq!(
                mapping::read(&state.objects["original"]).unwrap(),
                completed
            );
        }
        Failure::DifferentSuccessor => {
            assert!(result.unwrap_err().detail.contains("partial application"));
            assert!(!state.rollback_attempted);
        }
        Failure::Rollback => {
            let detail = result.unwrap_err().detail;
            assert!(detail.contains("partial application"), "{detail}");
            assert!(detail.contains("readback failed"), "{detail}");
            assert!(state.rollback_attempted);
            assert_eq!(
                mapping::read(&state.objects["original"]).unwrap(),
                completed
            );
        }
        Failure::Missing | Failure::Readback | Failure::LinksReadback => {
            assert!(result
                .unwrap_err()
                .detail
                .contains("original occurrence restored"));
            assert!(state.rollback_attempted);
            assert_eq!(mapping::read(&state.objects["original"]).unwrap(), before);
        }
    }
    std::fs::remove_dir_all(directory).unwrap();
}

#[test]
fn missing_successor_rolls_back() {
    run(Failure::Missing);
}
#[test]
fn failed_successor_readback_still_attempts_rollback() {
    run(Failure::Readback);
}
#[test]
fn failed_successor_link_readback_still_attempts_rollback() {
    run(Failure::LinksReadback);
}
#[test]
fn unavailable_rollback_reports_partial_application() {
    run(Failure::Rollback);
}
#[test]
fn lost_ack_confirms_successor_without_rollback() {
    run(Failure::LostAck);
}
#[test]
fn different_existing_successor_does_not_rollback() {
    run(Failure::DifferentSuccessor);
}

use super::Engine;
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    io::{BufRead, BufReader, Read, Write},
    net::{TcpListener, TcpStream},
    sync::{Arc, Mutex},
    time::Duration,
};

#[test]
fn journal_filter_order_and_crud_use_expected_snapshots() {
    let fixture: Value = serde_json::from_str(include_str!(
        "../../fixtures/engine/today-journal-note.json"
    ))
    .unwrap();
    let mut old = fixture.clone();
    old["id"] = json!("journal:2026-10-23");
    old["createdAt"] = json!("2026-10-23T09:00:00.000Z");
    old["updatedAt"] = json!("2026-10-23T09:00:00.000Z");
    let regular_note = json!({
        "id":"note:unrelated", "typeId":"core.note", "typeVersion":"0.1.0",
        "title":"Not a journal", "createdAt":"2026-10-22T09:00:00.000Z",
        "updatedAt":"2026-10-22T09:00:00.000Z", "contentJson":{"type":"doc","content":[]},
        "propsJson":{"extensions":{"entry_kind":"meeting"}}, "deletedAt":null
    });
    let fake = FakeEngine::start(vec![fixture, old, regular_note]);
    let engine = fake.client();

    let entries = engine.journal_list().unwrap();
    assert_eq!(
        entries.len(),
        2,
        "only notes tagged entry_kind=journal are shown"
    );
    assert_eq!(entries[0].id, "journal:2026-10-23");
    assert_eq!(entries[1].id, "journal:2026-10-24");
    assert_eq!(entries[1].text, "Запись за сегодня");

    let created = engine.journal_create("Первая запись").unwrap();
    assert!(created.id.starts_with("journal:"));
    assert_ne!(
        created.id, "journal:2026-10-24",
        "new entries do not reuse daily-note ids"
    );
    let stored = fake.object(&created.id);
    assert_eq!(stored["typeId"], "core.note");
    assert_eq!(
        stored["contentJson"]["content"][0]["content"][0]["text"],
        "Первая запись"
    );
    assert_eq!(stored["propsJson"]["extensions"]["entry_kind"], "journal");
    assert_eq!(stored["propsJson"]["description"], "Первая запись");
    assert_eq!(stored["propsJson"].as_object().unwrap().len(), 2);

    let mut with_extension = stored;
    with_extension["propsJson"]["extensions"]["foreign"] = json!({"keep":true});
    fake.replace_object(&created.id, with_extension);
    let base = engine
        .journal_list()
        .unwrap()
        .into_iter()
        .find(|entry| entry.id == created.id)
        .unwrap();
    let updated = engine.journal_update(&base, "Изменённая запись").unwrap();
    assert_eq!(updated.text, "Изменённая запись");
    assert_eq!(
        fake.object(&created.id)["propsJson"]["extensions"]["foreign"]["keep"],
        true
    );

    engine.journal_delete(&updated).unwrap();
    let entries = engine.journal_list().unwrap();
    assert_eq!(entries.len(), 2);
    assert!(!entries.iter().any(|entry| entry.id == created.id));
    fake.stop();
}

struct FakeEngine {
    directory: std::path::PathBuf,
    state: Arc<Mutex<State>>,
    port: u16,
    server: Option<std::thread::JoinHandle<()>>,
}

#[derive(Default)]
struct State {
    objects: HashMap<String, Value>,
    revisions: HashMap<String, u64>,
    sequence: u64,
}

impl FakeEngine {
    fn start(objects: Vec<Value>) -> Self {
        let directory =
            std::env::temp_dir().join(format!("atlas-journal-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&directory).unwrap();
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        std::fs::write(
            directory.join("engine.lock.json"),
            json!({"format_version":1,"api_version":{"major":1},"http_port":port,"auth_token":"a".repeat(64)}).to_string(),
        ).unwrap();
        let state = Arc::new(Mutex::new(State::default()));
        {
            let mut state = state.lock().unwrap();
            for object in objects {
                let id = object["id"].as_str().unwrap().to_owned();
                state.sequence += 1;
                let sequence = state.sequence;
                state.revisions.insert(id.clone(), sequence);
                state.objects.insert(id, object);
            }
        }
        let shared = state.clone();
        let server = std::thread::spawn(move || {
            for connection in listener.incoming() {
                let Ok(socket) = connection else { break };
                if !serve(socket, &shared) {
                    break;
                }
            }
        });
        Self {
            directory,
            state,
            port,
            server: Some(server),
        }
    }

    fn client(&self) -> Engine {
        let mut engine = Engine::with_timeout(Duration::from_secs(3));
        engine.data_dir = Some(self.directory.clone());
        engine
    }

    fn object(&self, id: &str) -> Value {
        self.state.lock().unwrap().objects[id].clone()
    }

    fn replace_object(&self, id: &str, object: Value) {
        let mut state = self.state.lock().unwrap();
        state.sequence += 1;
        let sequence = state.sequence;
        state.revisions.insert(id.to_owned(), sequence);
        state.objects.insert(id.to_owned(), object);
    }

    fn stop(mut self) {
        let _ = TcpStream::connect(("127.0.0.1", self.port))
            .and_then(|mut socket| socket.write_all(b"GET /stop HTTP/1.1\r\n\r\n"));
        if let Some(server) = self.server.take() {
            server.join().unwrap();
        }
        std::fs::remove_dir_all(&self.directory).unwrap();
    }
}

fn serve(mut socket: TcpStream, shared: &Arc<Mutex<State>>) -> bool {
    let mut reader = BufReader::new(socket.try_clone().unwrap());
    let mut first = String::new();
    reader.read_line(&mut first).unwrap();
    if first.contains("/stop") {
        return false;
    }
    let mut length = 0usize;
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
    let response = {
        let mut state = shared.lock().unwrap();
        let id = request["id"].as_str().unwrap_or_default().to_owned();
        let snapshot = |state: &State, id: &str| match state.objects.get(id) {
            Some(object) => {
                json!({"exists":true,"typeId":object["typeId"],"typeVersion":object["typeVersion"],"revision":format!("r{}", state.revisions[id])})
            }
            None => json!({"exists":false,"typeId":null,"typeVersion":null,"revision":null}),
        };
        match request["operation"].as_str().unwrap() {
            "list_objects_by_type" => {
                json!({"ok":true,"data":state.objects.values().filter(|o| o["typeId"] == request["type_id"]).cloned().collect::<Vec<_>>()})
            }
            "get_object_write_snapshot" => json!({"ok":true,"data":snapshot(&state, &id)}),
            "get_object" => json!({"ok":true,"data":state.objects.get(&id)}),
            "upsert_object" => {
                let object = request["object"].clone();
                let id = object["id"].as_str().unwrap().to_owned();
                if request["expectedSnapshot"] != snapshot(&state, &id) {
                    json!({"ok":false,"error":"object_conflict:stale_snapshot"})
                } else {
                    state.sequence += 1;
                    let sequence = state.sequence;
                    state.revisions.insert(id.clone(), sequence);
                    state.objects.insert(id, object);
                    json!({"ok":true,"data":true})
                }
            }
            "delete_object" => {
                if request["expectedSnapshot"] != snapshot(&state, &id) {
                    json!({"ok":false,"error":"object_conflict:stale_snapshot"})
                } else {
                    state.objects.remove(&id);
                    state.revisions.remove(&id);
                    json!({"ok":true,"data":true})
                }
            }
            operation => panic!("unexpected RPC {operation}"),
        }
    };
    let response = response.to_string();
    write!(socket, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", response.len(), response).unwrap();
    true
}

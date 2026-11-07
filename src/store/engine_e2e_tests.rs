//! End-to-end against a real Engine, ignored by default because it needs one:
//!
//! ```text
//! # in the cortex checkout, on the branch Atlas is written against
//! MUNDUS_DATA_DIR=<dir> ./target/debug/mundus-engine.exe
//! ATLAS_E2E_DATA_DIR=<dir> cargo test --bin atlas -- --ignored --nocapture
//! ```
//!
//! What it pins, end to end: the three `types.register` calls are accepted and
//! repeatable, a `core.task` object still loads and keeps its id when saved, a
//! new object is written and read back as `com.mundus.atlas.task`, and a second
//! connection — a WebSocket subscriber — is told about that write and about
//! nothing else.
use super::{mapping, ops, Engine};
use crate::model::{new_todo, Status};
use serde_json::{json, Value};
use std::time::Duration;

const NOW: &str = "2026-11-07T00:00:00.000Z";
/// Every test object carries this prefix so leftovers are recognisable.
const TAG: &str = "atlas-e2e";

fn test_engine() -> Engine {
    let directory = std::env::var("ATLAS_E2E_DATA_DIR")
        .expect("set ATLAS_E2E_DATA_DIR to a running Engine data dir (see this module's docs)");
    let mut engine = Engine::default();
    engine.data_dir = Some(directory.into());
    engine
}

fn event_socket(engine: &Engine) -> tungstenite::WebSocket<std::net::TcpStream> {
    let lock = engine.lock().unwrap();
    let port = lock.ws_port.expect("Engine advertises ws_port");
    let stream = std::net::TcpStream::connect(("127.0.0.1", port)).unwrap();
    stream
        .set_read_timeout(Some(Duration::from_secs(1)))
        .unwrap();
    stream
        .set_write_timeout(Some(Duration::from_secs(1)))
        .unwrap();
    let (mut socket, _) = tungstenite::client(format!("ws://127.0.0.1:{port}"), stream).unwrap();
    socket
        .send(tungstenite::Message::Text(
            json!({
                "kind": "hello", "apiVersion": "1.0.0", "token": lock.auth_token,
                "pid": std::process::id(), "clientClass": "atlas-e2e",
                "clientVersion": env!("CARGO_PKG_VERSION")
            })
            .to_string()
            .into(),
        ))
        .unwrap();
    let reply = socket.read().unwrap().into_text().unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(&reply).unwrap()["kind"],
        "hello_ok"
    );
    socket
}

#[test]
#[ignore = "needs a running Engine: set ATLAS_E2E_DATA_DIR"]
fn registers_types_saves_both_object_eras_and_a_socket_hears_it() {
    let engine = test_engine();

    // 1. Registration is idempotent: the same version and schema pass twice.
    engine.register_types().expect("first registration");
    engine.register_types().expect("registration repeats");

    // 2. The Engine kept what was announced.
    let types = engine.rpc("types.list", json!({})).unwrap();
    for (id, version) in [
        (super::types::TASK_TYPE, super::types::TASK_VERSION),
        (super::types::PROJECT_TYPE, super::types::PROJECT_VERSION),
        (super::types::JOURNAL_TYPE, super::types::JOURNAL_VERSION),
    ] {
        let listed = types
            .as_array()
            .and_then(|list| list.iter().find(|item| item["typeId"] == id))
            .unwrap_or_else(|| panic!("{id} is missing from types.list: {types}"));
        assert_eq!(listed["currentVersion"], version, "{id}");
        assert_eq!(listed["ownerId"], super::types::APP_ID, "{id}");
    }

    // A separate authenticated socket is ready before either write. Inspect the
    // actual event ID, not a reload callback (which also fires after greeting).
    let mut events = event_socket(&engine);

    // 4. A task created before Atlas declared its type: it loads, and a save
    //    keeps the stored `core.task` instead of migrating it.
    let run = uuid::Uuid::new_v4();
    let legacy_id = format!("{TAG}-{run}-legacy");
    let mut legacy = new_todo(&legacy_id, "Старая задача");
    legacy.created_at = NOW.into();
    let mut legacy_object = mapping::write_at(Value::Null, None, &legacy, NOW).unwrap();
    legacy_object["typeId"] = json!(mapping::LEGACY_TASK_TYPE);
    legacy_object["typeVersion"] = json!(mapping::LEGACY_TASK_VERSION);
    engine
        .rpc(
            ops::OBJECTS_UPSERT,
            json!({"object": legacy_object.clone()}),
        )
        .unwrap();

    let loaded = engine.load().unwrap();
    let stored_legacy = loaded
        .todos
        .iter()
        .find(|todo| todo.id == legacy_id)
        .expect("a core.task object still loads");
    let mut edited = stored_legacy.clone();
    edited.title = "Старая задача, переименованная".into();
    engine.save(Some(stored_legacy), &edited).unwrap();
    let after_save = engine
        .rpc(ops::OBJECTS_GET, json!({"id": legacy_id}))
        .unwrap();
    assert_eq!(
        after_save["typeId"],
        mapping::LEGACY_TASK_TYPE,
        "no silent migration"
    );
    assert_eq!(after_save["title"], edited.title);

    // 5. A new task is written under the Atlas type and reads back through the
    //    same mapping.
    let fresh_id = format!("{TAG}-{run}-fresh");
    let mut fresh = new_todo(&fresh_id, "Новая задача");
    fresh.created_at = NOW.into();
    fresh.status = Status::Done;
    fresh.is_completed = true;
    fresh.completed_at = Some(NOW.into());
    engine.save(None, &fresh).unwrap();
    let written = engine
        .rpc(ops::OBJECTS_GET, json!({"id": fresh_id}))
        .unwrap();
    assert_eq!(written["typeId"], super::types::TASK_TYPE);
    assert_eq!(written["typeVersion"], super::types::TASK_VERSION);
    let loaded = engine.load().unwrap();
    assert!(
        loaded.todos.iter().any(|todo| todo.id == fresh_id),
        "the new object loads: {:?}",
        loaded.todos.iter().map(|todo| &todo.id).collect::<Vec<_>>()
    );

    // 6. Only the exact fresh-object event satisfies this assertion. Greeting,
    // reconnect, unrelated writes, and periodic reloads cannot produce it.
    let deadline = std::time::Instant::now() + Duration::from_secs(10);
    loop {
        assert!(
            std::time::Instant::now() < deadline,
            "fresh task event missing"
        );
        let text = match events.read() {
            Ok(tungstenite::Message::Text(text)) => text,
            Ok(_) => continue,
            Err(tungstenite::Error::Io(error))
                if matches!(
                    error.kind(),
                    std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut
                ) =>
            {
                continue
            }
            Err(error) => panic!("event socket: {error}"),
        };
        let event: Value = serde_json::from_str(&text).unwrap();
        if event["event"] == "objects.changed" && event["id"] == fresh_id {
            assert_eq!(event["typeId"], super::types::TASK_TYPE);
            assert!(super::live::relevant(&text, &[super::types::TASK_TYPE]));
            assert!(!super::live::relevant(&text, &["core.note"]));
            break;
        }
    }

    // 7. Leave the scratch database as it was found. A delete carries the
    //    snapshot it expects to drop, so a concurrent edit cannot be lost.
    for id in [legacy_id, fresh_id] {
        let snapshot = engine
            .rpc(ops::OBJECTS_SNAPSHOT, json!({"id": id}))
            .unwrap();
        engine
            .rpc(
                ops::OBJECTS_DELETE,
                json!({"id": id, "expectedSnapshot": snapshot}),
            )
            .unwrap();
    }
}

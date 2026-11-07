use super::*;
use std::net::TcpListener;

const WATCHED: &[&str] = &["com.mundus.atlas.task", "core.task"];

/// The server side of a plain TCP socket: no TLS wrapper in the way.
type Server = WebSocket<std::net::TcpStream>;

#[test]
fn only_the_two_change_events_of_watched_types_are_relayed() {
    let watched = |raw: Value| relevant(&raw.to_string(), WATCHED);
    assert!(watched(
        json!({"event":"objects.changed","id":"a","typeId":"core.task","op":"upsert"})
    ));
    assert!(watched(
        json!({"event":"objects.changed","id":"a","typeId":"com.mundus.atlas.task","op":"delete"})
    ));
    // No type id: could be one of ours.
    assert!(watched(
        json!({"event":"objects.changed","id":"a","typeId":null,"op":"merge"})
    ));
    assert!(watched(
        json!({"event":"links.changed","id":"l","sourceId":"a","targetId":"p",
            "linkType":"project","op":"replace"})
    ));
    // Other types, and the events this app does not read (old or new).
    assert!(!watched(
        json!({"event":"objects.changed","id":"a","typeId":"core.note","op":"upsert"})
    ));
    assert!(!watched(json!({"event":"object_upserted","id":"a"})));
    assert!(!watched(json!({"event":"commands_changed","commands":[]})));
    assert!(!watched(json!({"kind":"hello_ok"})));
    assert!(!relevant("not json at all", WATCHED));
}

/// The whole hop against a socket that speaks the Engine protocol:
/// hello → hello_ok → events → close.
#[test]
fn subscribes_reports_changes_and_survives_the_close() {
    let server = FakeSocket::start(|greeting, socket| {
        assert_eq!(greeting["kind"], "hello");
        assert_eq!(greeting["apiVersion"], "1.0.0");
        assert_eq!(greeting["token"], "a".repeat(64));
        assert_eq!(greeting["pid"], std::process::id());
        let _ = socket.send(Message::Text(
            json!({"kind":"hello_ok","apiVersion":"1.0.0","compatibility":"compatible"})
                .to_string()
                .into(),
        ));
        // Irrelevant, relevant, link — then the Engine goes away.
        for event in [
            json!({"event":"objects.changed","id":"n","typeId":"core.note","op":"upsert"}),
            json!({"event":"objects.changed","id":"t","typeId":"core.task","op":"upsert"}),
            json!({"event":"links.changed","id":"l","sourceId":"t","targetId":"p",
                "linkType":"project","op":"replace"}),
        ] {
            let _ = socket.send(Message::Text(event.to_string().into()));
        }
        let _ = socket.close(None);
        let _ = socket.flush();
    });
    let mut seen = 0;
    let result = relay(
        &server.lock(),
        WATCHED,
        &AtomicBool::new(false),
        &mut || seen += 1,
    );
    assert!(result.is_ok(), "{result:?}");
    assert_eq!(
        seen, 3,
        "subscription acceptance, the relevant object and the link"
    );
    server.join();
}

#[test]
fn a_refused_greeting_is_an_error_not_a_silent_wait() {
    let server = FakeSocket::start(|_greeting, socket| {
        let _ = socket.send(Message::Text(
            json!({"kind":"hello_error","code":"INVALID_TOKEN","message":"nope"})
                .to_string()
                .into(),
        ));
        let _ = socket.flush();
    });
    let error = relay(&server.lock(), WATCHED, &AtomicBool::new(false), &mut || {}).unwrap_err();
    assert!(error.contains("INVALID_TOKEN"), "{error}");
    server.join();
}

#[test]
fn idle_timeout_keeps_the_subscription_and_delivers_later_events() {
    let server = FakeSocket::start(|_, socket| {
        socket
            .send(Message::Text(json!({"kind":"hello_ok"}).to_string().into()))
            .unwrap();
        thread::sleep(IO_TIMEOUT + Duration::from_millis(200));
        socket
            .send(Message::Text(
                json!({"event":"objects.changed", "typeId":"core.task"})
                    .to_string()
                    .into(),
            ))
            .unwrap();
        socket.close(None).unwrap();
    });
    let mut seen = 0;
    relay(
        &server.lock(),
        WATCHED,
        &AtomicBool::new(false),
        &mut || seen += 1,
    )
    .unwrap();
    assert_eq!(seen, 2, "hello and the event after an idle read timeout");
    server.join();
}

#[test]
fn dropping_subscription_stops_an_idle_connection() {
    let (closed, observed) = std::sync::mpsc::channel();
    let server = FakeSocket::start(move |_, socket| {
        socket
            .send(Message::Text(json!({"kind":"hello_ok"}).to_string().into()))
            .unwrap();
        socket
            .get_ref()
            .set_read_timeout(Some(Duration::from_secs(3)))
            .unwrap();
        let error = socket.read().unwrap_err();
        assert!(!timed_out(&error), "client must close, not merely time out");
        closed.send(()).unwrap();
    });
    let directory =
        std::env::temp_dir().join(format!("atlas-live-{}-{}", std::process::id(), server.port));
    std::fs::create_dir_all(&directory).unwrap();
    std::fs::write(
        directory.join("engine.lock.json"),
        json!({
            "format_version": 1, "api_version": {"major": 1}, "http_port": 1,
            "ws_port": server.port, "auth_token": "a".repeat(64),
        })
        .to_string(),
    )
    .unwrap();
    let mut engine = Engine::default();
    engine.data_dir = Some(directory.clone());
    let (notify, notices) = std::sync::mpsc::channel();
    let subscription = spawn_for(engine, WATCHED, move || {
        let _ = notify.send(());
    });
    notices.recv_timeout(Duration::from_secs(3)).unwrap();
    drop(subscription);
    observed.recv_timeout(Duration::from_secs(3)).unwrap();
    assert!(notices.recv_timeout(Duration::from_secs(2)).is_err());
    server.join();
    std::fs::remove_dir_all(directory).unwrap();
}

#[test]
fn dropping_subscription_interrupts_retry_backoff() {
    let mut engine = Engine::default();
    engine.data_dir =
        Some(std::env::temp_dir().join(format!("atlas-live-missing-{}", std::process::id())));
    let (notify, notices) = std::sync::mpsc::channel();
    let subscription = spawn_for(engine, WATCHED, move || {
        let _ = notify.send(());
    });
    notices.recv_timeout(Duration::from_secs(3)).unwrap();
    drop(subscription);
    assert_eq!(
        notices.recv_timeout(Duration::from_millis(500)),
        Err(std::sync::mpsc::RecvTimeoutError::Disconnected)
    );
}

/// A WebSocket server for exactly one client.
struct FakeSocket {
    port: u16,
    server: Option<std::thread::JoinHandle<()>>,
}

impl FakeSocket {
    fn start(scenario: impl FnOnce(Value, &mut Server) + Send + 'static) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let server = std::thread::spawn(move || {
            let (stream, _) = listener.accept().unwrap();
            let mut socket = tungstenite::accept(stream).unwrap();
            let greeting = match socket.read().unwrap() {
                Message::Text(text) => serde_json::from_str(&text).unwrap(),
                other => panic!("expected a text hello, got {other:?}"),
            };
            scenario(greeting, &mut socket);
        });
        Self {
            port,
            server: Some(server),
        }
    }

    fn lock(&self) -> Lock {
        Lock {
            http_port: 1,
            ws_port: Some(self.port),
            auth_token: "a".repeat(64),
        }
    }

    fn join(mut self) {
        if let Some(server) = self.server.take() {
            server.join().unwrap();
        }
    }
}

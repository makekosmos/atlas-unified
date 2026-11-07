//! Engine events invalidate snapshots; consumers always reload authoritative data.
use super::{transport::Lock, Engine};
use serde_json::{json, Value};
use std::{
    net::{SocketAddr, TcpStream},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::{Duration, Instant},
};
use tungstenite::{HandshakeError, Message, WebSocket};

const API_VERSION: &str = "1.0.0";
const FIRST_PAUSE: Duration = Duration::from_secs(1);
const MAX_PAUSE: Duration = Duration::from_secs(30);
const IO_TIMEOUT: Duration = Duration::from_secs(1);
const GREETING_TIMEOUT: Duration = Duration::from_secs(5);
const RELOAD_INTERVAL: Duration = Duration::from_secs(30);
type Socket = WebSocket<TcpStream>;

/// Dropping the owner interrupts backoff immediately and reads within one timeout.
pub(crate) struct Subscription {
    cancelled: Arc<AtomicBool>,
    thread: thread::Thread,
}

impl Drop for Subscription {
    fn drop(&mut self) {
        self.cancelled.store(true, Ordering::Release);
        self.thread.unpark();
    }
}

pub(crate) fn spawn(
    types: &'static [&'static str],
    notify: impl FnMut() + Send + 'static,
) -> Subscription {
    spawn_for(Engine::default(), types, notify)
}

pub(crate) fn spawn_for(
    engine: Engine,
    types: &'static [&'static str],
    mut notify: impl FnMut() + Send + 'static,
) -> Subscription {
    let cancelled = Arc::new(AtomicBool::new(false));
    let stop = cancelled.clone();
    let worker = thread::spawn(move || {
        let mut pause = FIRST_PAUSE;
        while !stop.load(Ordering::Acquire) {
            let result = engine
                .lock()
                .map_err(|error| error.message())
                .and_then(|lock| relay(&lock, types, &stop, &mut notify));
            if stop.load(Ordering::Acquire) {
                break;
            }
            match result {
                Ok(()) => pause = FIRST_PAUSE,
                Err(error) => eprintln!("[storage] live events: {error}"),
            }
            notify();
            thread::park_timeout(pause);
            pause = (pause * 2).min(MAX_PAUSE);
        }
    });
    Subscription {
        cancelled,
        thread: worker.thread().clone(),
    }
}

fn connect(lock: &Lock, stop: &AtomicBool) -> Result<Socket, String> {
    let port = lock.ws_port.ok_or("engine.lock.json has no ws_port")?;
    let address = SocketAddr::from(([127, 0, 0, 1], port));
    let stream = TcpStream::connect_timeout(&address, IO_TIMEOUT)
        .map_err(|error| format!("connect: {error}"))?;
    stream
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;
    let deadline = Instant::now() + GREETING_TIMEOUT;
    let mut handshake = tungstenite::client(format!("ws://127.0.0.1:{port}"), stream);
    loop {
        match handshake {
            Ok((socket, _)) => {
                let stream = socket.get_ref();
                stream
                    .set_nonblocking(false)
                    .map_err(|error| error.to_string())?;
                stream
                    .set_read_timeout(Some(IO_TIMEOUT))
                    .map_err(|error| error.to_string())?;
                stream
                    .set_write_timeout(Some(IO_TIMEOUT))
                    .map_err(|error| error.to_string())?;
                return Ok(socket);
            }
            Err(HandshakeError::Interrupted(pending)) => {
                if stop.load(Ordering::Acquire) || Instant::now() >= deadline {
                    return Err("WebSocket handshake cancelled or timed out".into());
                }
                thread::park_timeout(Duration::from_millis(10));
                handshake = pending.handshake();
            }
            Err(HandshakeError::Failure(error)) => return Err(format!("handshake: {error}")),
        }
    }
}

fn relay(
    lock: &Lock,
    types: &[&str],
    stop: &AtomicBool,
    notify: &mut impl FnMut(),
) -> Result<(), String> {
    let mut socket = connect(lock, stop)?;
    socket
        .send(Message::Text(hello(lock).to_string().into()))
        .map_err(|error| format!("hello: {error}"))?;
    greet(&mut socket, stop)?;
    if stop.load(Ordering::Acquire) {
        return Ok(());
    }
    // The first snapshot may predate subscription acceptance.
    notify();
    let mut reload_at = Instant::now() + RELOAD_INTERVAL;
    while !stop.load(Ordering::Acquire) {
        let message = socket.read();
        if stop.load(Ordering::Acquire) {
            break;
        }
        match message {
            Ok(Message::Text(text)) if relevant(&text, types) => notify(),
            Ok(Message::Close(_)) => return Ok(()),
            Ok(Message::Ping(_)) => {
                socket.flush().map_err(|error| format!("pong: {error}"))?;
            }
            Ok(_) => {}
            Err(error) if timed_out(&error) => {}
            Err(error) => return Err(format!("read: {error}")),
        }
        // Engine broadcast lag is silent, so even a healthy stream needs repair.
        if Instant::now() >= reload_at {
            notify();
            reload_at = Instant::now() + RELOAD_INTERVAL;
        }
    }
    Ok(())
}

fn timed_out(error: &tungstenite::Error) -> bool {
    matches!(error, tungstenite::Error::Io(error)
        if matches!(error.kind(), std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut))
}

fn hello(lock: &Lock) -> Value {
    json!({
        "kind": "hello",
        "apiVersion": API_VERSION,
        "token": lock.auth_token,
        "pid": std::process::id(),
        "clientClass": "atlas-gpui",
        "clientVersion": env!("CARGO_PKG_VERSION"),
    })
}

fn greet(socket: &mut Socket, stop: &AtomicBool) -> Result<(), String> {
    let deadline = Instant::now() + GREETING_TIMEOUT;
    while !stop.load(Ordering::Acquire) && Instant::now() < deadline {
        match socket.read() {
            Ok(Message::Text(text)) => {
                let reply: Value = serde_json::from_str(&text)
                    .map_err(|error| format!("hello reply is not json: {error}"))?;
                return match reply["kind"].as_str() {
                    Some("hello_ok") => Ok(()),
                    Some("hello_error") => Err(format!(
                        "Engine refused the subscription: {}: {}",
                        reply["code"].as_str().unwrap_or("hello_error"),
                        reply["message"].as_str().unwrap_or_default()
                    )),
                    other => Err(format!("unexpected greeting {other:?}")),
                };
            }
            Ok(Message::Ping(_)) => {
                socket.flush().map_err(|error| format!("pong: {error}"))?;
            }
            Ok(Message::Close(_)) => return Err("Engine closed the socket during hello".into()),
            Ok(_) => {}
            Err(error) if timed_out(&error) => {}
            Err(error) => return Err(format!("hello reply: {error}")),
        }
    }
    Err("Engine greeting cancelled or timed out".into())
}

pub(super) fn relevant(text: &str, types: &[&str]) -> bool {
    let Ok(event) = serde_json::from_str::<Value>(text) else {
        return false;
    };
    match event["event"].as_str() {
        Some("objects.changed") => match event["typeId"].as_str() {
            Some(type_id) => types.contains(&type_id),
            None => true,
        },
        Some("links.changed") => true,
        _ => false,
    }
}

#[cfg(test)]
#[path = "live_tests.rs"]
mod tests;

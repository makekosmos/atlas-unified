//! The types Atlas itself writes.
//!
//! Atlas is an application, not the kernel: it declares the types it owns at
//! startup with `types.register` instead of riding on `core.*`. The schemas
//! live next to this module as JSON and are compiled in, so a release always
//! announces exactly the shape it writes — adding an optional field to a type
//! is an edit here (`types/<name>.json` + a new additive `version`), nothing in
//! the kernel.
//!
//! Objects created before these types existed keep their `core.*` id: they are
//! read through the same mapping and saved back under the type they already
//! have. Rewriting their `typeId` would be a copy-migration of user data to
//! gain a name, which this app does not do.
use super::{ops, Engine, EngineError, ErrorKind};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicBool, Ordering};

/// Owner of every type here. `types.register` requires `typeId` to sit under
/// `{appId}.`, so `core.*` cannot be claimed even by mistake.
pub(super) const APP_ID: &str = "com.mundus.atlas";

pub const TASK_TYPE: &str = "com.mundus.atlas.task";
pub const TASK_VERSION: &str = "0.1.0";
pub const PROJECT_TYPE: &str = "com.mundus.atlas.project";
pub const PROJECT_VERSION: &str = "0.1.0";
pub const JOURNAL_TYPE: &str = "com.mundus.atlas.journal";
pub const JOURNAL_VERSION: &str = "0.1.0";

/// One `types.register` call: the props schema (what lives in `propsJson`) and
/// the version it is announced under.
struct Declaration {
    id: &'static str,
    version: &'static str,
    name: &'static str,
    schema: &'static str,
}

const DECLARATIONS: [Declaration; 3] = [
    Declaration {
        id: TASK_TYPE,
        version: TASK_VERSION,
        name: "Задача Atlas",
        schema: include_str!("types/task.json"),
    },
    Declaration {
        id: PROJECT_TYPE,
        version: PROJECT_VERSION,
        name: "Проект Atlas",
        schema: include_str!("types/project.json"),
    },
    Declaration {
        id: JOURNAL_TYPE,
        version: JOURNAL_VERSION,
        name: "Запись дневника",
        schema: include_str!("types/journal.json"),
    },
];

/// Set once the Engine accepted the declarations. A failed attempt is retried
/// on the next call, because Atlas may well start before the Engine does.
static REGISTERED: AtomicBool = AtomicBool::new(false);

impl Engine {
    /// Declare every type in [`DECLARATIONS`]. Idempotent: the Engine answers
    /// an unchanged `(typeId, version, schema)` triple with ok, and an additive
    /// new version is accepted on top of the stored one.
    pub(super) fn register_types(&self) -> Result<(), EngineError> {
        for declaration in &DECLARATIONS {
            let schema: Value = serde_json::from_str(declaration.schema).map_err(|error| {
                EngineError::local(
                    ErrorKind::Malformed,
                    format!("{} schema: {error}", declaration.id),
                )
            })?;
            self.rpc(
                ops::TYPES_REGISTER,
                json!({"typeId":declaration.id,"version":declaration.version,
                    "name":declaration.name,"appId":APP_ID,"schema":schema}),
            )?;
        }
        Ok(())
    }
}

/// Register the types unless this process already did. Called before the first
/// object load and before a write that may introduce a type, so a start that
/// happened before the Engine came up heals on the next attempt.
pub(super) fn ensure_registered(engine: &Engine) {
    if REGISTERED.load(Ordering::Relaxed) {
        return;
    }
    match engine.register_types() {
        Ok(()) => REGISTERED.store(true, Ordering::Relaxed),
        // Not fatal: `core.*` objects still load, and the next attempt retries.
        Err(error) => eprintln!("[storage] types.register failed: {error}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_declaration_sits_in_the_app_namespace() {
        for declaration in &DECLARATIONS {
            assert!(
                declaration.id.starts_with("com.mundus.atlas."),
                "{} is outside {APP_ID}",
                declaration.id
            );
            assert!(
                !declaration.id["com.mundus.atlas.".len()..]
                    .split('.')
                    .any(str::is_empty),
                "{} has an empty segment",
                declaration.id
            );
            assert_eq!(
                declaration.version, "0.1.0",
                "{} starts at a fresh version",
                declaration.id
            );
        }
    }

    /// The Engine validates what it is given (`validate_type_schema`,
    /// `register_application_type`) — this pins the parts it is strict about so
    /// a broken schema fails here instead of at every startup.
    #[test]
    fn schemas_are_object_schemas_the_engine_accepts() {
        for declaration in &DECLARATIONS {
            let schema: Value = serde_json::from_str(declaration.schema).unwrap();
            assert_eq!(
                schema["$schema"], "https://json-schema.org/draft/2020-12/schema",
                "{}",
                declaration.id
            );
            assert_eq!(schema["type"], "object", "{}", declaration.id);
            let required = schema["required"].as_array().unwrap();
            for name in required {
                let name = name.as_str().unwrap();
                assert!(
                    schema["properties"].get(name).is_some(),
                    "{}: required `{name}` has no schema",
                    declaration.id
                );
            }
            // `extensions` is the one open bag: other clients and older Atlas
            // builds keep their fields there and Atlas must not reject them.
            assert_eq!(
                schema["properties"]["extensions"]["additionalProperties"],
                json!(true),
                "{}",
                declaration.id
            );
        }
    }

    #[test]
    fn registration_announces_ids_versions_and_schemas() {
        let engine = Recorder::start();
        engine.client.register_types().unwrap();
        let requests = engine.stop();
        assert_eq!(requests.len(), 3);
        for (request, expected) in requests.iter().zip([TASK_TYPE, PROJECT_TYPE, JOURNAL_TYPE]) {
            assert_eq!(request["operation"], "types.register");
            assert_eq!(request["typeId"], expected);
            assert_eq!(request["version"], "0.1.0");
            assert_eq!(request["appId"], APP_ID);
            assert_eq!(request["schema"]["type"], "object");
            assert!(request["name"].is_string());
        }
    }

    /// A JSON body, one connection per request: enough to pin the wire shape.
    struct Recorder {
        directory: std::path::PathBuf,
        client: Engine,
        server: Option<std::thread::JoinHandle<Vec<Value>>>,
    }

    impl Recorder {
        fn start() -> Self {
            use std::io::{BufRead, BufReader, Read, Write};
            use std::net::TcpListener;
            let directory =
                std::env::temp_dir().join(format!("atlas-types-test-{}", uuid::Uuid::new_v4()));
            std::fs::create_dir_all(&directory).unwrap();
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            let port = listener.local_addr().unwrap().port();
            std::fs::write(
                directory.join("engine.lock.json"),
                json!({"format_version":1,"api_version":{"major":1},"http_port":port,
                    "auth_token":"a".repeat(64)})
                .to_string(),
            )
            .unwrap();
            let server = std::thread::spawn(move || {
                let mut seen = Vec::new();
                for connection in listener.incoming() {
                    let Ok(mut socket) = connection else { break };
                    let mut reader = BufReader::new(socket.try_clone().unwrap());
                    let mut first = String::new();
                    if reader.read_line(&mut first).unwrap() == 0 || first.contains("/stop") {
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
                    seen.push(serde_json::from_slice::<Value>(&bytes).unwrap());
                    let body = r#"{"ok":true,"data":{"typeId":"x","version":"0.1.0"}}"#;
                    write!(
                        socket,
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\
                        Content-Length: {}\r\nConnection: close\r\n\r\n{body}",
                        body.len()
                    )
                    .unwrap();
                }
                seen
            });
            let mut client = Engine::with_timeout(std::time::Duration::from_secs(3));
            client.data_dir = Some(directory.clone());
            Self {
                directory,
                client,
                server: Some(server),
            }
        }

        fn stop(mut self) -> Vec<Value> {
            use std::io::Write;
            let _ = std::net::TcpStream::connect(("127.0.0.1", self.port()))
                .and_then(|mut socket| socket.write_all(b"GET /stop HTTP/1.1\r\n\r\n"));
            let seen = self.server.take().unwrap().join().unwrap();
            std::fs::remove_dir_all(&self.directory).unwrap();
            seen
        }

        fn port(&self) -> u16 {
            let bytes = std::fs::read(self.directory.join("engine.lock.json")).unwrap();
            let lock: Value = serde_json::from_slice(&bytes).unwrap();
            lock["http_port"].as_u64().unwrap() as u16
        }
    }
}

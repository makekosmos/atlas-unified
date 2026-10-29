use std::sync::Arc;

use engine_mobile::MobileEngine;

uniffi::setup_scaffolding!();

#[derive(Debug, thiserror::Error, uniffi::Error)]
pub enum AtlasMobileError {
    #[error("{0}")]
    Engine(String),
    #[error("{0}")]
    Invalid(String),
}

#[derive(uniffi::Object)]
pub struct AtlasMobileEngine {
    store: store::Engine,
}

#[uniffi::export]
impl AtlasMobileEngine {
    #[uniffi::constructor]
    pub fn open(data_dir: String) -> Result<Arc<Self>, AtlasMobileError> {
        let engine = MobileEngine::open(data_dir)
            .map_err(|error| AtlasMobileError::Engine(error.to_string()))?;
        Ok(Arc::new(Self {
            store: store::Engine::new(engine),
        }))
    }

    pub fn journal_list(&self) -> Result<String, AtlasMobileError> {
        self.store
            .journal_list_json()
            .map_err(AtlasMobileError::Engine)
    }

    pub fn journal_create(&self, text: String) -> Result<String, AtlasMobileError> {
        self.store
            .journal_create_json(&text)
            .map_err(AtlasMobileError::Engine)
    }

    pub fn journal_update(&self, id: String, text: String) -> Result<String, AtlasMobileError> {
        self.store
            .journal_update_json(&id, &text)
            .map_err(AtlasMobileError::Engine)
    }

    pub fn journal_delete(&self, id: String) -> Result<String, AtlasMobileError> {
        self.store
            .journal_delete_json(&id)
            .map_err(AtlasMobileError::Engine)
    }

    pub fn sync_status(&self) -> Result<String, AtlasMobileError> {
        self.store.sync_status().map_err(AtlasMobileError::Engine)
    }

    pub fn start_sync(&self, config_json: String) -> Result<String, AtlasMobileError> {
        self.store
            .start_sync(&config_json)
            .map_err(AtlasMobileError::Engine)
    }

    pub fn stop_sync(&self) -> Result<String, AtlasMobileError> {
        self.store.stop_sync().map_err(AtlasMobileError::Engine)
    }

    pub fn show_pairing_code(&self) -> Result<String, AtlasMobileError> {
        self.store
            .show_pairing_code()
            .map_err(AtlasMobileError::Engine)
    }

    pub fn own_iroh_ticket(&self) -> Result<String, AtlasMobileError> {
        self.store
            .own_iroh_ticket()
            .map_err(AtlasMobileError::Engine)
    }

    pub fn connect_with_pairing_code(&self, code: String) -> Result<String, AtlasMobileError> {
        self.store
            .connect_with_pairing_code(&code)
            .map_err(AtlasMobileError::Engine)
    }

    pub fn sync_action(
        &self,
        operation: String,
        params_json: String,
    ) -> Result<String, AtlasMobileError> {
        self.store
            .sync_action(&operation, &params_json)
            .map_err(AtlasMobileError::Engine)
    }

    pub fn shutdown(&self) {
        self.store.shutdown();
    }
}

mod store {
    use std::sync::Arc;

    use engine_mobile::MobileEngine;
    use serde_json::{json, Value};

    #[derive(Clone, Copy)]
    pub(super) enum ErrorKind {
        Malformed,
        InvalidRequest,
        Conflict,
        Transport,
        Unavailable,
    }

    #[derive(Debug)]
    pub(super) struct EngineError(String);

    impl EngineError {
        pub(super) fn local(_kind: ErrorKind, detail: impl Into<String>) -> Self {
            Self(detail.into())
        }

        pub(super) fn engine(detail: &str) -> Self {
            Self(detail.to_owned())
        }
    }

    pub(super) struct Engine {
        mobile: Arc<MobileEngine>,
    }

    impl Engine {
        pub(super) fn new(mobile: Arc<MobileEngine>) -> Self {
            Self { mobile }
        }

        fn rpc(&self, operation: &str, params: Value) -> Result<Value, EngineError> {
            let response = self
                .mobile
                .call(operation.to_owned(), params.to_string())
                .map_err(|error| EngineError::local(ErrorKind::Unavailable, error.to_string()))?;
            let response: Value = serde_json::from_str(&response)
                .map_err(|error| EngineError::local(ErrorKind::Malformed, error.to_string()))?;
            if response["ok"] != true {
                return Err(EngineError::engine(
                    response["error"].as_str().unwrap_or("unknown"),
                ));
            }
            response
                .get("data")
                .cloned()
                .ok_or_else(|| EngineError::local(ErrorKind::Malformed, "response missing data"))
        }

        pub(super) fn journal_list_json(&self) -> Result<String, String> {
            let entries = self.journal_list().map_err(|error| error.0)?;
            serde_json::to_string(
                &entries
                    .iter()
                    .map(|entry| {
                        json!({
                            "id": entry.id,
                            "text": entry.text,
                            "createdAt": entry.created_at,
                        })
                    })
                    .collect::<Vec<_>>(),
            )
            .map_err(|error| error.to_string())
        }

        pub(super) fn journal_create_json(&self, text: &str) -> Result<String, String> {
            let entry = self.journal_create(text).map_err(|error| error.0)?;
            serde_json::to_string(
                &json!({"id":entry.id,"text":entry.text,"createdAt":entry.created_at}),
            )
            .map_err(|error| error.to_string())
        }

        pub(super) fn journal_update_json(&self, id: &str, text: &str) -> Result<String, String> {
            let before = self
                .journal_list()
                .map_err(|error| error.0)?
                .into_iter()
                .find(|entry| entry.id == id)
                .ok_or_else(|| "journal entry is no longer available".to_owned())?;
            let entry = self
                .journal_update(&before, text)
                .map_err(|error| error.0)?;
            serde_json::to_string(
                &json!({"id":entry.id,"text":entry.text,"createdAt":entry.created_at}),
            )
            .map_err(|error| error.to_string())
        }

        pub(super) fn journal_delete_json(&self, id: &str) -> Result<String, String> {
            let entry = self
                .journal_list()
                .map_err(|error| error.0)?
                .into_iter()
                .find(|entry| entry.id == id)
                .ok_or_else(|| "journal entry is no longer available".to_owned())?;
            self.journal_delete(&entry).map_err(|error| error.0)?;
            Ok("{}".to_owned())
        }

        pub(super) fn sync_status(&self) -> Result<String, String> {
            self.mobile.sync_status().map_err(|error| error.to_string())
        }

        pub(super) fn start_sync(&self, config_json: &str) -> Result<String, String> {
            self.mobile
                .start_sync(config_json.to_owned())
                .map_err(|error| error.to_string())
        }

        pub(super) fn stop_sync(&self) -> Result<String, String> {
            self.mobile.stop_sync().map_err(|error| error.to_string())
        }

        pub(super) fn show_pairing_code(&self) -> Result<String, String> {
            self.mobile
                .show_pairing_code()
                .map_err(|error| error.to_string())
        }

        pub(super) fn own_iroh_ticket(&self) -> Result<String, String> {
            self.mobile
                .own_iroh_ticket()
                .map_err(|error| error.to_string())
        }

        pub(super) fn connect_with_pairing_code(&self, code: &str) -> Result<String, String> {
            self.mobile
                .connect_with_pairing_code(code.to_owned())
                .map_err(|error| error.to_string())
        }

        pub(super) fn sync_action(
            &self,
            operation: &str,
            params_json: &str,
        ) -> Result<String, String> {
            if !matches!(
                operation,
                "accept_pairing" | "decline_pairing" | "cancel_pairing" | "disconnect_peer"
            ) {
                return Err(format!("unsupported sync operation: {operation}"));
            }
            self.mobile
                .call(operation.to_owned(), params_json.to_owned())
                .map_err(|error| error.to_string())
        }

        pub(super) fn shutdown(&self) {
            self.mobile.shutdown();
        }
    }

    mod journal {
        include!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../src/store/journal.rs"
        ));
    }
}

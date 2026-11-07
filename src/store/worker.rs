//! The background thread that owns the Engine client. The UI sends a `Command`
//! and reads a `Reply`; no Engine call runs on the UI thread. A second thread
//! watches the Engine's events (`live`) and reports a stale snapshot through the
//! same channel, so the UI has one thing to read either way.
use super::Snapshot;
use super::{live, mapping, projects, Engine, EngineError};
use crate::model::Todo;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    mpsc::{self, Receiver, Sender},
    Arc,
};

/// Types this worker's snapshot is built from: a change to any of them makes the
/// task list and its projects stale.
static WATCHED: &[&str] = &[
    mapping::TASK_TYPE,
    mapping::LEGACY_TASK_TYPE,
    projects::PROJECT_TYPE,
    projects::LEGACY_PROJECT_TYPE,
];

pub struct Mutation {
    pub before: Option<Todo>,
    pub todo: Todo,
    pub next: Option<Todo>,
}

pub enum Command {
    Load,
    Save(Box<Mutation>),
}

pub enum Reply {
    Loaded(Result<Snapshot, EngineError>),
    Saved(Box<Mutation>, Result<(), EngineError>),
    /// Something this app reads changed in the Engine (or the event stream was
    /// lost): reload the snapshot.
    Changed,
}

pub struct Worker {
    pub commands: Sender<Command>,
    pub replies: Receiver<Reply>,
    change_pending: Arc<AtomicBool>,
    _subscription: live::Subscription,
}

impl Worker {
    pub fn start() -> Self {
        let (commands, requests) = mpsc::channel();
        let (results, replies) = mpsc::channel();
        let events = results.clone();
        let change_pending = Arc::new(AtomicBool::new(false));
        let pending = change_pending.clone();
        let subscription = live::spawn(WATCHED, move || {
            if !pending.swap(true, Ordering::AcqRel) {
                let _ = events.send(Reply::Changed);
            }
        });
        std::thread::spawn(move || {
            let engine = Engine::default();
            for request in requests {
                let reply = match request {
                    Command::Load => Reply::Loaded(engine.load()),
                    Command::Save(mutation) => {
                        let result = engine.save_with_next(
                            mutation.before.as_ref(),
                            &mutation.todo,
                            mutation.next.as_ref(),
                        );
                        Reply::Saved(mutation, result)
                    }
                };
                if results.send(reply).is_err() {
                    break;
                }
            }
        });
        Self {
            commands,
            replies,
            change_pending,
            _subscription: subscription,
        }
    }

    /// Clear before processing `Changed` so edits during reload queue another pass.
    pub fn acknowledge_change(&self) {
        self.change_pending.store(false, Ordering::Release);
    }
}

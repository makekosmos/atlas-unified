mod actions;
mod appearance;
mod engine;

use crate::appearance::{Poller, Response, Writer};
use crate::model::Todo;
use crate::store::Worker;
use gpui::Context;

pub(crate) struct Atlas {
    pub(crate) demo: bool,
    pub(crate) storage: Option<Worker>,
    pub(crate) storage_ready: bool,
    pub(crate) storage_busy: bool,
    pub(crate) storage_error: Option<String>,
    pub(crate) todos: Vec<Todo>,
    pub(crate) current_route: String,
    pub(crate) sidebar_visible: bool,
    pub(crate) appearance: Option<Response>,
    pub(crate) appearance_poller: Option<Poller>,
    pub(crate) appearance_writer: Option<Writer>,
    pub(crate) theme_sel: u8,
    pub(crate) theme_idx: usize,
}

impl Atlas {
    pub(crate) fn new(cx: &mut Context<Self>) -> Self {
        let demo = std::env::var("ATLAS_DEMO").as_deref() == Ok("1")
            || std::env::var("ATLAS_DEVTASKS")
                .ok()
                .and_then(|value| value.parse::<usize>().ok())
                .is_some()
            || cfg!(test);
        let appearance = demo.then(Self::demo_appearance);
        let mut agenda = Self {
            demo,
            storage: None,
            storage_ready: demo,
            storage_busy: false,
            storage_error: None,
            todos: if demo {
                crate::model::seed_todos()
            } else {
                Vec::new()
            },
            current_route: "journal".into(),
            sidebar_visible: true,
            appearance,
            appearance_poller: None,
            appearance_writer: (!demo).then(Writer::start),
            theme_sel: 1,
            theme_idx: 0,
        };
        agenda.start_storage(cx);
        agenda.start_appearance(cx);
        agenda
    }
}

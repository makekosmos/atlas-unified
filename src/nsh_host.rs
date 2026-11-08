use gpui::{div, Context, IntoElement, ParentElement, Render, Styled, Window};
use imago_nsh::AppView;

use crate::app::Atlas;

pub(crate) struct AtlasShell {
    pub(crate) agenda: gpui::Entity<Atlas>,
    pub(crate) nsh: gpui::Entity<AppView>,
    pub(crate) close_handler_installed: bool,
}

impl Render for AtlasShell {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        if !self.close_handler_installed {
            self.close_handler_installed = true;
            let agenda = self.agenda.clone();
            let opened = std::time::Instant::now();
            window.on_window_should_close(cx, move |_, cx| {
                let allow = agenda.update(cx, |state, _| !state.storage_busy);
                let age = opened.elapsed().as_secs();
                crate::win_chrome::trace(&format!("should_close allow={allow} age={age}"));
                age >= 15 && allow
            });
        }
        div().size_full().child(self.nsh.clone())
    }
}

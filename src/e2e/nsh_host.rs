use gpui::{
    AppContext as _, AsyncApp, Modifiers, MouseButton, MouseDownEvent, MouseUpEvent, PlatformInput,
};

use super::Run;

impl Run {
    pub(super) async fn click_at(&self, cx: &mut AsyncApp, x: f32, y: f32) {
        cx.update_window(self.window, |_, window, cx| {
            let position = gpui::point(gpui::px(x), gpui::px(y));
            let modifiers = Modifiers::default();
            window.dispatch_event(
                PlatformInput::MouseDown(MouseDownEvent {
                    position,
                    modifiers,
                    button: MouseButton::Left,
                    click_count: 1,
                    first_mouse: false,
                }),
                cx,
            );
            window.dispatch_event(
                PlatformInput::MouseUp(MouseUpEvent {
                    position,
                    modifiers,
                    button: MouseButton::Left,
                    click_count: 1,
                }),
                cx,
            );
            window.refresh();
            window.draw(cx).clear(cx);
        })
        .expect("window alive");
        self.sleep(cx, 250).await;
        cx.update_window(self.window, |_, window, cx| {
            for _ in 0..3 {
                window.refresh();
                window.draw(cx).clear(cx);
            }
        })
        .expect("window alive");
        self.sleep(cx, 100).await;
    }

    pub(super) async fn navigate_nsh(&self, cx: &mut AsyncApp, name: &str) {
        let position = match name {
            "journal" => (100.0, 60.0),
            "tasks" => (100.0, 100.0),
            "settings" => (100.0, 820.0),
            _ => panic!("unknown nsh route {name}"),
        };
        self.click_at(cx, position.0, position.1).await;
        let navigated = self
            .wait_until(cx, std::time::Duration::from_secs(3), |agenda| {
                agenda.current_route == name
            })
            .await;
        self.check(&format!("nsh navigation reached {name}"), navigated);
    }
}

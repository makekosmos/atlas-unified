use gpui::AsyncApp;

use crate::appearance::{AccentSource, Mode};

use super::Run;

pub(super) async fn run(run: &Run, cx: &mut AsyncApp) {
    let task_count = run.read(cx, |agenda| agenda.todos.len());
    run.check(
        &format!("demo data loaded: {task_count} tasks"),
        task_count > 0,
    );
    run.shot(cx, "journal").await;
    run.navigate_nsh(cx, "tasks").await;
    run.shot(cx, "tasks").await;
    run.check("captured nsh tasks", run.out.join("tasks.png").exists());
    run.navigate_nsh(cx, "settings").await;
    run.shot(cx, "settings").await;
    run.check(
        "captured nsh settings",
        run.out.join("settings.png").exists(),
    );
    run.click_at(cx, 670.0, 160.0).await;
    let light = run.read(cx, |agenda| {
        agenda
            .appearance
            .as_ref()
            .is_some_and(|appearance| appearance.settings.mode == Mode::Light)
    });
    run.check("Settings changed appearance mode", light);
    run.shot(cx, "settings-theme").await;
    run.click_at(cx, 755.0, 160.0).await;
    run.click_at(cx, 578.0, 452.0).await;
    let accent = run.read(cx, |agenda| {
        agenda.appearance.as_ref().is_some_and(|appearance| {
            appearance.settings.accent_source == AccentSource::Custom
                && appearance.settings.accent_color.as_deref() == Some("#d79921")
        })
    });
    run.check("Settings changed custom accent", accent);
    run.shot(cx, "settings-accent").await;
    run.click_at(cx, 578.0, 622.0).await;
    let density = run.read(cx, |agenda| {
        agenda
            .appearance
            .as_ref()
            .is_some_and(|appearance| appearance.settings.font_size == 12.0)
    });
    run.check("Settings changed density", density);
    run.shot(cx, "settings-density").await;
    run.click_at(cx, 1200.0, 740.0).await;
    run.shot(cx, "settings-hotkeys").await;
}

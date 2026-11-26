//! The benchmark's two processes. The director is the window the person clicked:
//! it shrinks to a checklist and spawns the guest. The guest is a second Atlas
//! on a throwaway data directory; it runs the pages and writes the report.

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};

use serde_json::{json, Value};

use crate::bench_cli::{self, RunPaths};

pub struct Desk {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

pub struct Pane {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

pub fn split_desk(desk: Desk) -> (Pane, Pane) {
    let margin = 8.0;
    let gap = 12.0;
    let x = desk.x + margin;
    let y = desk.y + margin;
    let w = (desk.w - margin * 2.0).max(gap + 2.0);
    let h = (desk.h - margin * 2.0).max(1.0);
    let mut director_w = 460.0_f32;
    let mut guest_w = w - gap - director_w;
    if guest_w < 800.0 {
        guest_w = 800.0_f32.min((w - gap) * 0.62);
        director_w = (w - gap - guest_w).max(320.0);
    }
    if director_w + guest_w + gap > w {
        let scale = w / (director_w + guest_w + gap);
        director_w *= scale;
        guest_w = w - gap - director_w;
    }
    (
        Pane {
            x,
            y,
            w: director_w,
            h,
        },
        Pane {
            x: x + director_w + gap,
            y,
            w: guest_w,
            h,
        },
    )
}

pub fn disposable(path: &Path) -> bool {
    path.components().any(|component| {
        component
            .as_os_str()
            .to_string_lossy()
            .starts_with("mundus-atlas-bench-")
    })
}

pub(super) enum Session {
    Idle,
    Director(Director),
    Guest(Guest),
}

pub(super) struct Saved {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    maximized: bool,
}

pub(super) struct Director {
    child: Option<Child>,
    exited: bool,
    paths: RunPaths,
    saved: Saved,
    restored: bool,
    report_sent: bool,
    cancelled: bool,
    last: Value,
}

pub(super) struct Guest {
    progress: PathBuf,
    data_dir: Option<PathBuf>,
    finished: bool,
}

impl Session {
    fn from_env() -> Self {
        if std::env::var("ATLAS_BENCH_ROLE").as_deref() != Ok("guest") {
            return Session::Idle;
        }
        let progress = std::env::var("ATLAS_BENCH_PROGRESS")
            .map(PathBuf::from)
            .unwrap_or_else(|_| std::env::temp_dir().join("atlas-bench-progress.json"));
        let data_dir = std::env::var("MUNDUS_DATA_DIR").ok().map(PathBuf::from);
        Session::Guest(Guest {
            progress,
            data_dir,
            finished: false,
        })
    }

    fn dock(&mut self, window: &mut gpui::Window, cx: &mut gpui::App) -> Value {
        if let Session::Director(director) = self {
            if !director.exited && !director.cancelled {
                return json!({"ok": true});
            }
        }
        if matches!(self, Session::Guest(_)) {
            return json!({"ok": false, "error": "Это окно само выполняет проверку"});
        }
        match Director::open(window, cx) {
            Ok(director) => {
                *self = Session::Director(director);
                json!({"ok": true})
            }
            Err(error) => json!({"ok": false, "error": error}),
        }
    }

    fn progress(&mut self, value: &Value) {
        let Session::Guest(guest) = self else {
            return;
        };
        if guest.finished {
            return;
        }
        let status = value.get("status").and_then(Value::as_str).unwrap_or("");
        if let Err(error) = write_json(&guest.progress, value) {
            crate::bench_cli::console_line(&format!("отчёт не записался: {error}"));
            return;
        }
        if status != "done" && status != "error" {
            return;
        }
        bench_cli::publish_latest(&guest.progress);
        scrub(guest.data_dir.as_deref());
        guest.data_dir = None;
        guest.finished = true;
        if std::env::var_os("ATLAS_BENCH_EXIT").is_none() {
            return;
        }
        let summary = value
            .get("summary")
            .and_then(Value::as_str)
            .unwrap_or("готово");
        bench_cli::console_line(&format!("report={}", guest.progress.display()));
        bench_cli::console_line(summary);
        let code = if status == "error" { 1 } else { 0 };
        std::process::exit(code);
    }

    fn status(&mut self) -> Value {
        let Session::Director(director) = self else {
            return json!({"status": "idle", "stages": []});
        };
        director.refresh();
        let mut value = if director.cancelled {
            director.last.clone()
        } else {
            read_json(&director.paths.progress)
                .unwrap_or_else(|| json!({"status": "running", "stages": []}))
        };
        if director.exited && value.get("status").and_then(Value::as_str) == Some("running") {
            value["status"] = json!("error");
            value["error"] = json!("Окно проверки закрылось до конца прогона");
        }
        value["reportPath"] = json!(director.paths.progress.display().to_string());
        if value.get("status").and_then(Value::as_str) == Some("done") && !director.report_sent {
            if let Ok(text) = std::fs::read_to_string(&director.paths.progress) {
                value["reportText"] = json!(text);
                director.report_sent = true;
            }
        }
        if let Some(object) = value.as_object_mut() {
            object.remove("report");
        }
        director.last = value.clone();
        value
    }

    fn restore_if_settled(&mut self, window: &mut gpui::Window) {
        let Session::Director(director) = self else {
            return;
        };
        director.refresh();
        let status = director
            .last
            .get("status")
            .and_then(Value::as_str)
            .unwrap_or("running");
        if director.exited || matches!(status, "done" | "error" | "cancelled") {
            director.restore(window);
        }
    }

    fn cancel(&mut self, window: &mut gpui::Window) {
        let Session::Director(director) = self else {
            return;
        };
        director.refresh();
        director.kill();
        scrub(Some(&director.paths.data_dir));
        director.cancelled = true;
        director.exited = true;
        if director.last.get("status").and_then(Value::as_str) != Some("done") {
            director.last["status"] = json!("cancelled");
            director.last["error"] = json!("Остановлено");
        }
        director.restore(window);
    }
}

impl Director {
    fn open(window: &mut gpui::Window, cx: &mut gpui::App) -> Result<Self, String> {
        let paths = bench_cli::prepare_run().map_err(|error| error.to_string())?;
        let show = std::env::var_os("ATLAS_OFFSCREEN").is_none();
        let desk = desk_of(window, cx);
        let (director, guest) = split_desk(desk);
        let saved = Saved {
            x: f32::from(window.bounds().origin.x),
            y: f32::from(window.bounds().origin.y),
            w: f32::from(window.bounds().size.width),
            h: f32::from(window.bounds().size.height),
            maximized: window.is_maximized(),
        };
        let child = spawn_guest(&paths, guest, show)?;
        if show {
            crate::win_chrome::place_window(window, director.x, director.y, director.w, director.h);
        }
        Ok(Self {
            child: Some(child),
            exited: false,
            paths,
            saved,
            restored: false,
            report_sent: false,
            cancelled: false,
            last: json!({"status": "running", "stages": []}),
        })
    }

    fn refresh(&mut self) {
        let finished = self
            .child
            .as_mut()
            .and_then(|child| child.try_wait().ok())
            .flatten()
            .is_some();
        if finished {
            self.child = None;
            self.exited = true;
            scrub(Some(&self.paths.data_dir));
        }
    }

    fn kill(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }

    fn restore(&mut self, window: &mut gpui::Window) {
        if self.restored {
            return;
        }
        self.restored = true;
        if self.saved.maximized {
            crate::win_chrome::maximize_window(window);
            return;
        }
        crate::win_chrome::place_window(
            window,
            self.saved.x,
            self.saved.y,
            self.saved.w,
            self.saved.h,
        );
    }
}

impl Drop for Director {
    fn drop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
        }
        scrub(Some(&self.paths.data_dir));
    }
}

fn spawn_guest(paths: &RunPaths, guest: Pane, show: bool) -> Result<Child, String> {
    let exe = std::env::current_exe().map_err(|error| error.to_string())?;
    let mut command = Command::new(exe);
    command
        .env("ATLAS_ALLOW_MULTIPLE", "1")
        .env("ATLAS_DEMO", "1")
        .env("ATLAS_BENCH_ROLE", "guest")
        .env("ATLAS_BENCH_EXIT", "1")
        .env("MUNDUS_DATA_DIR", &paths.data_dir)
        .env("KOSMOS_DATA_DIR", "")
        .env("ATLAS_BENCH_PROGRESS", &paths.progress)
        .env_remove("ATLAS_ROUTE")
        .env_remove("ATLAS_NOTE")
        .env_remove("ATLAS_BENCH_CLI")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    if show {
        command
            .env_remove("ATLAS_OFFSCREEN")
            .env("ATLAS_BENCH_NO_FOCUS", "1")
            .env(
                "ATLAS_WINDOW",
                format!("{},{},{},{}", guest.x, guest.y, guest.w, guest.h),
            );
    } else {
        command
            .env("ATLAS_OFFSCREEN", "1")
            .env_remove("ATLAS_WINDOW");
    }
    command
        .spawn()
        .map_err(|error| format!("Не удалось открыть окно проверки: {error}"))
}

fn desk_of(window: &gpui::Window, cx: &gpui::App) -> Desk {
    let bounds = window
        .display(cx)
        .map(|display| display.visible_bounds())
        .unwrap_or_else(|| window.bounds());
    Desk {
        x: f32::from(bounds.origin.x),
        y: f32::from(bounds.origin.y),
        w: f32::from(bounds.size.width),
        h: f32::from(bounds.size.height),
    }
}

fn scrub(path: Option<&Path>) {
    let Some(path) = path else {
        return;
    };
    if !disposable(path) {
        return;
    }
    let _ = std::fs::remove_dir_all(path);
    if let Some(parent) = path.parent() {
        if disposable(parent) {
            let _ = std::fs::remove_dir(parent);
        }
    }
}

fn write_json(path: &Path, value: &Value) -> std::io::Result<()> {
    let bytes = serde_json::to_vec(value).map_err(std::io::Error::other)?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let temporary = path.with_extension("tmp");
    std::fs::write(&temporary, bytes)?;
    let _ = std::fs::remove_file(path);
    std::fs::rename(&temporary, path)
}

fn read_json(path: &Path) -> Option<Value> {
    let bytes = std::fs::read(path).ok()?;
    serde_json::from_slice(&bytes).ok()
}

pub(super) fn session() -> Session {
    Session::from_env()
}

impl Session {
    pub(super) fn command_dock(&mut self, window: &mut gpui::Window, cx: &mut gpui::App) -> Value {
        self.dock(window, cx)
    }

    pub(super) fn command_progress(&mut self, value: &Value) {
        self.progress(value);
    }

    pub(super) fn command_status(&mut self) -> Value {
        self.status()
    }

    pub(super) fn command_restore(&mut self, window: &mut gpui::Window) {
        self.restore_if_settled(window);
    }

    pub(super) fn command_cancel(&mut self, window: &mut gpui::Window) {
        self.cancel(window);
    }
}

#[cfg(test)]
mod tests {
    use super::{disposable, split_desk, Desk};
    use std::path::Path;

    #[test]
    fn guest_sits_to_the_right_of_the_director() {
        let (director, guest) = split_desk(Desk {
            x: 10.0,
            y: 20.0,
            w: 1920.0,
            h: 1080.0,
        });
        assert!(guest.x >= director.x + director.w);
        assert!(director.w > 300.0);
        assert!(guest.w > 800.0);
        assert_eq!(director.y, guest.y);
        assert!(director.x + director.w + guest.w < 1920.0 + 10.0);
    }

    #[test]
    fn scrub_only_touches_a_bench_directory() {
        assert!(disposable(Path::new(r"C:\Temp\mundus-atlas-bench-1\data")));
        assert!(!disposable(Path::new(r"C:\Users\a\AppData\Roaming\Mundus")));
    }
}

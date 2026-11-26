//! `atlas benchmark` runs the guest window and leaves the report on disk.
//! `list` and `show` read that directory without opening a window.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub enum Boot {
    Run,
    Exit(i32),
}

pub struct RunPaths {
    pub progress: PathBuf,
    pub data_dir: PathBuf,
}

pub fn boot() -> Boot {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        Some("benchmark") => benchmark(&args[1..]),
        _ => Boot::Run,
    }
}

pub fn reports_dir() -> PathBuf {
    config_base()
        .unwrap_or_else(std::env::temp_dir)
        .join("Mundus")
        .join("benchmarks")
}

fn config_base() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        std::env::var_os("APPDATA").map(PathBuf::from)
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var_os("HOME").map(|home| {
            PathBuf::from(home)
                .join("Library")
                .join("Application Support")
        })
    }
    #[cfg(not(any(windows, target_os = "macos")))]
    {
        std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".config")))
    }
}

pub fn prepare_run() -> std::io::Result<RunPaths> {
    let stamp = stamp();
    let root = std::env::temp_dir().join(format!("mundus-atlas-bench-{stamp}"));
    let data_dir = root.join("data");
    std::fs::create_dir_all(&data_dir)?;
    let dir = reports_dir();
    std::fs::create_dir_all(&dir)?;
    Ok(RunPaths {
        progress: dir.join(format!("{stamp}.json")),
        data_dir,
    })
}

pub fn publish_latest(progress: &Path) {
    let Some(dir) = progress.parent() else {
        return;
    };
    let _ = std::fs::copy(progress, dir.join("latest.json"));
}

pub fn console_line(text: &str) {
    #[cfg(windows)]
    {
        attach_console();
        if let Ok(mut file) = std::fs::OpenOptions::new().write(true).open(r"\\.\CONOUT$") {
            let _ = writeln!(file, "{text}");
            return;
        }
        if let Ok(mut file) = std::fs::OpenOptions::new().write(true).open("CONOUT$") {
            let _ = writeln!(file, "{text}");
        }
    }
    #[cfg(not(windows))]
    {
        println!("{text}");
    }
}

fn benchmark(args: &[String]) -> Boot {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        console_line(
            "atlas benchmark [--window]\n  \
             прогон в отдельном процессе, отчёт в %APPDATA%\\Mundus\\benchmarks\n\
             atlas benchmark list\n\
             atlas benchmark show [--json] [файл]",
        );
        return Boot::Exit(0);
    }
    if args.first().map(String::as_str) == Some("list") {
        return Boot::Exit(list_reports());
    }
    if args.first().map(String::as_str) == Some("show") {
        return Boot::Exit(show_report(&args[1..]));
    }
    match prepare_run() {
        Ok(paths) => {
            std::env::set_var("ATLAS_ALLOW_MULTIPLE", "1");
            std::env::set_var("ATLAS_DEMO", "1");
            std::env::set_var("ATLAS_BENCH_ROLE", "guest");
            std::env::set_var("ATLAS_BENCH_CLI", "1");
            std::env::set_var("ATLAS_BENCH_EXIT", "1");
            std::env::set_var("MUNDUS_DATA_DIR", &paths.data_dir);
            std::env::set_var("ATLAS_BENCH_PROGRESS", &paths.progress);
            if !args.iter().any(|arg| arg == "--window") {
                std::env::set_var("ATLAS_OFFSCREEN", "1");
            }
            Boot::Run
        }
        Err(error) => {
            console_line(&format!("не удалось подготовить прогон: {error}"));
            Boot::Exit(1)
        }
    }
}

fn list_reports() -> i32 {
    let dir = reports_dir();
    let mut files = std::fs::read_dir(&dir)
        .map(|entries| {
            entries
                .flatten()
                .map(|entry| entry.path())
                .filter(|path| {
                    path.extension().is_some_and(|ext| ext == "json")
                        && path.file_name().is_some_and(|name| name != "latest.json")
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    files.sort();
    if files.is_empty() {
        console_line("отчётов пока нет");
        return 0;
    }
    for path in files.iter().rev().take(20) {
        let summary = std::fs::read_to_string(path)
            .ok()
            .and_then(|text| serde_json::from_str::<serde_json::Value>(&text).ok())
            .and_then(|value| {
                value
                    .get("summary")
                    .and_then(serde_json::Value::as_str)
                    .map(str::to_owned)
            })
            .unwrap_or_else(|| "без сводки".into());
        console_line(&format!("{}  {summary}", path.display()));
    }
    0
}

fn show_report(args: &[String]) -> i32 {
    let json = args.iter().any(|arg| arg == "--json");
    let path = args
        .iter()
        .find(|arg| *arg != "--json")
        .map(PathBuf::from)
        .unwrap_or_else(|| reports_dir().join("latest.json"));
    let text = match std::fs::read_to_string(&path) {
        Ok(text) => text,
        Err(error) => {
            console_line(&format!("{}: {error}", path.display()));
            return 1;
        }
    };
    if !json {
        let summary = serde_json::from_str::<serde_json::Value>(&text)
            .ok()
            .and_then(|value| {
                value
                    .get("summary")
                    .and_then(serde_json::Value::as_str)
                    .map(str::to_owned)
            })
            .unwrap_or_else(|| "без сводки".into());
        console_line(&format!("report={}", path.display()));
        console_line(&summary);
        return 0;
    }
    let report = serde_json::from_str::<serde_json::Value>(&text)
        .ok()
        .and_then(|value| value.get("report").cloned())
        .unwrap_or(serde_json::Value::Null);
    match serde_json::to_string_pretty(&report) {
        Ok(pretty) => console_line(&pretty),
        Err(error) => {
            console_line(&error.to_string());
            return 1;
        }
    }
    0
}

fn stamp() -> String {
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0);
    format!("{ms}-{}", std::process::id())
}

#[cfg(windows)]
fn attach_console() {
    unsafe {
        AttachConsole(0xFFFF_FFFF);
    }
}

#[cfg(windows)]
unsafe extern "system" {
    fn AttachConsole(process_id: u32) -> i32;
}

#[cfg(test)]
mod tests {
    use super::reports_dir;

    #[test]
    fn reports_live_under_mundus() {
        let path = reports_dir();
        assert!(path.ends_with(std::path::Path::new("Mundus").join("benchmarks")));
    }
}

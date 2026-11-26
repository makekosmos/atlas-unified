use imago_nsh::ComponentContext;
use serde_json::json;

#[cfg(target_os = "windows")]
pub(super) fn frames(
    context: &ComponentContext,
    window: &gpui::Window,
    baseline: Option<gpui::FrameDurationSnapshot>,
    run_id: u64,
) {
    let report = if let Some(baseline) = baseline {
        let mut snapshot = window.frame_duration_snapshot();
        let _ = snapshot
            .present_interval_histogram
            .subtract(&baseline.present_interval_histogram);
        let _ = snapshot
            .draw_duration_histogram
            .subtract(&baseline.draw_duration_histogram);
        let _ = snapshot
            .dirty_to_present_histogram
            .subtract(&baseline.dirty_to_present_histogram);
        macro_rules! describe {
            ($histogram:expr) => {{
                let histogram = &$histogram;
                let ms = |ns: u64| ns as f64 / 1_000_000.0;
                if histogram.is_empty() {
                    json!({"count": 0})
                } else {
                    json!({
                        "count": histogram.len(),
                        "meanMs": histogram.mean() / 1_000_000.0,
                        "p50Ms": ms(histogram.value_at_quantile(0.50)),
                        "p95Ms": ms(histogram.value_at_quantile(0.95)),
                        "p99Ms": ms(histogram.value_at_quantile(0.99)),
                        "maxMs": ms(histogram.max()),
                    })
                }
            }};
        }
        json!({
            "presentIntervals": describe!(snapshot.present_interval_histogram),
            "fpsWhileAnimating": (!snapshot.present_interval_histogram.is_empty())
                .then(|| 1_000_000_000.0 / snapshot.present_interval_histogram.mean()),
            "draw": describe!(snapshot.draw_duration_histogram),
            "invalidationToPresent": describe!(snapshot.dirty_to_present_histogram),
        })
    } else {
        json!({"unavailable": "No baseline for this run"})
    };
    context.emit("benchmarkFrames", json!({"runId": run_id, "data": report}));
}

#[cfg(not(target_os = "windows"))]
pub(super) fn frames(context: &ComponentContext, run_id: u64) {
    context.emit(
        "benchmarkFrames",
        json!({"runId": run_id, "data": {"unavailable": "Presented-frame profiling requires Windows"}}),
    );
}

pub(super) fn sample(context: ComponentContext, run_id: u64) {
    #[cfg(target_os = "windows")]
    std::thread::spawn(move || {
        use std::{
            io::{BufRead, BufReader, Read},
            os::windows::process::CommandExt,
            process::{Command, Stdio},
        };

        let script = format!(
            "$atlasPid = {};\n{}",
            std::process::id(),
            include_str!("../../scripts/benchmark-sample.ps1")
        );
        let child = Command::new("powershell.exe")
            .args([
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                &script,
            ])
            .creation_flags(0x0800_0000)
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn();
        let result = child
            .ok()
            .and_then(|mut child| {
                let mut stdout = BufReader::new(child.stdout.take()?);
                let mut first = String::new();
                stdout.read_line(&mut first).ok()?;
                if first.trim() == "ready" {
                    context.emit("benchmarkReady", json!({"runId": run_id, "data": null}));
                }
                let mut data = Vec::new();
                stdout.read_to_end(&mut data).ok()?;
                child.wait().ok()?.success().then_some(())?;
                serde_json::from_slice(&data).ok()
            })
            .unwrap_or_else(|| json!({"unavailable": "Windows resource sampler failed"}));
        context.emit("benchmark", json!({"runId": run_id, "data": result}));
    });

    #[cfg(not(target_os = "windows"))]
    {
        context.emit("benchmarkReady", json!({"runId": run_id, "data": null}));
        context.emit(
            "benchmark",
            json!({"runId": run_id, "data": {"unavailable": "Resource sampling requires Windows"}}),
        );
    }
}

use gpui::AsyncApp;

use super::Run;

/// The record button, at the right end of the composer on the 1280x770 window
/// the test display gives.
const RECORD: (f32, f32) = (1066.0, 728.0);

/// Records a voice note through the host and checks that the bubble arrives.
///
/// Needs a microphone; the host asks for the permission once.
pub(super) async fn run(run: &Run, cx: &mut AsyncApp) {
    run.shot(cx, "voice-idle").await;
    run.click_at(cx, RECORD.0, RECORD.1).await;
    run.sleep(cx, 300).await;
    run.shot(cx, "voice-recording").await;
    run.sleep(cx, 1500).await;
    run.click_at(cx, RECORD.0, RECORD.1).await;
    // Catch the compartment mid-fold: it hands over to the message.
    run.sleep(cx, 100).await;
    run.shot(cx, "voice-folding").await;
    run.sleep(cx, 1100).await;
    run.shot(cx, "voice-recorded").await;
    run.check(
        "recorded a voice note",
        run.out.join("voice-recorded.png").exists(),
    );
    // A fast second take must reopen the compartment the first one folded.
    run.click_at(cx, RECORD.0, RECORD.1).await;
    run.sleep(cx, 150).await;
    run.click_at(cx, RECORD.0, RECORD.1).await;
    run.sleep(cx, 120).await;
    run.click_at(cx, RECORD.0, RECORD.1).await;
    run.sleep(cx, 400).await;
    run.shot(cx, "voice-retake").await;
    run.click_at(cx, RECORD.0, RECORD.1).await;
    run.sleep(cx, 900).await;
}

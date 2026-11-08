//! Native actions for Atlas's custom window controls. Empty drag regions start
//! a system move on Windows and use GPUI's window move elsewhere.
use gpui::Window;

pub(crate) fn trace(message: &str) {
    use std::io::Write;
    let line = format!("{:?} {message}\n", std::time::SystemTime::now());
    let path = std::path::Path::new(r"C:\Users\kirill\Coding\kosmos-rs\.dev-logs\atlas-life.log");
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
    {
        let _ = file.write_all(line.as_bytes());
    }
}

pub(crate) fn drag(window: &Window) {
    trace("drag");
    #[cfg(windows)]
    drag_windows(window);
    #[cfg(not(windows))]
    window.start_window_move();
}

pub(crate) fn toggle_zoom(window: &Window) {
    #[cfg(windows)]
    zoom_windows(window);
    #[cfg(not(windows))]
    window.zoom_window();
}

pub(crate) fn request_close(window: &mut Window) {
    trace("request_close");
    #[cfg(windows)]
    close_windows(window);
    #[cfg(not(windows))]
    window.remove_window();
}

#[cfg(windows)]
fn hwnd(window: &Window) -> Option<*mut std::ffi::c_void> {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    match HasWindowHandle::window_handle(window).ok()?.as_raw() {
        RawWindowHandle::Win32(handle) => Some(handle.hwnd.get() as *mut std::ffi::c_void),
        _ => None,
    }
}

#[cfg(windows)]
fn drag_windows(window: &Window) {
    let Some(hwnd) = hwnd(window) else {
        trace("drag: no window handle");
        return;
    };
    unsafe {
        let released = ReleaseCapture();
        let posted = PostMessageW(hwnd, WM_SYSCOMMAND, SC_MOVE | HTCAPTION, 0);
        trace(&format!("drag: release={released} posted={posted}"));
    }
}

#[cfg(windows)]
fn zoom_windows(window: &Window) {
    let Some(hwnd) = hwnd(window) else {
        return;
    };
    let command = if window.is_maximized() {
        SW_RESTORE
    } else {
        SW_MAXIMIZE
    };
    unsafe {
        ShowWindowAsync(hwnd, command);
    }
}

#[cfg(windows)]
fn close_windows(window: &Window) {
    let Some(hwnd) = hwnd(window) else {
        return;
    };
    unsafe {
        PostMessageW(hwnd, WM_CLOSE, 0, 0);
    }
}

#[cfg(windows)]
const WM_CLOSE: u32 = 0x0010;
#[cfg(windows)]
const WM_SYSCOMMAND: u32 = 0x0112;
#[cfg(windows)]
const SC_MOVE: usize = 0xF010;
#[cfg(windows)]
const HTCAPTION: usize = 2;
#[cfg(windows)]
const SW_MAXIMIZE: i32 = 3;
#[cfg(windows)]
const SW_RESTORE: i32 = 9;

#[cfg(windows)]
unsafe extern "system" {
    fn ReleaseCapture() -> i32;
    fn PostMessageW(hwnd: *mut std::ffi::c_void, msg: u32, wparam: usize, lparam: isize) -> i32;
    fn ShowWindowAsync(hwnd: *mut std::ffi::c_void, cmd: i32) -> i32;
}

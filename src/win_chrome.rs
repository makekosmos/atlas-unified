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

/// Keeps one Atlas window: a second launch focuses the running window and
/// exits instead of stacking another one on top of it (two windows look like
/// two sets of title-bar controls). `ATLAS_ALLOW_MULTIPLE=1` opts out.
///
/// The name is scoped to this executable, so an installed Atlas and a debug
/// build do not fight over it.
pub(crate) fn claim_single_instance() -> bool {
    if std::env::var("ATLAS_ALLOW_MULTIPLE").is_ok() {
        return true;
    }
    #[cfg(windows)]
    {
        windows_instance::claim()
    }
    #[cfg(not(windows))]
    {
        true
    }
}

#[cfg(windows)]
mod windows_instance {
    use std::ffi::c_void;

    const ERROR_ALREADY_EXISTS: u32 = 183;
    const SW_RESTORE: i32 = 9;

    fn mutex_name() -> Vec<u16> {
        // One mutex per executable: a debug build and an installed one are
        // different apps for this purpose.
        let path = std::env::current_exe()
            .map(|path| path.to_string_lossy().to_lowercase())
            .unwrap_or_else(|_| "atlas".into());
        let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
        for byte in path.as_bytes() {
            hash ^= u64::from(*byte);
            hash = hash.wrapping_mul(0x100_0000_01b3);
        }
        let mut name: Vec<u16> = format!("Local\\MundusAtlas-{hash:016x}")
            .encode_utf16()
            .collect();
        name.push(0);
        name
    }

    fn title() -> Vec<u16> {
        let mut title: Vec<u16> = "Atlas".encode_utf16().collect();
        title.push(0);
        title
    }

    pub(super) fn claim() -> bool {
        let name = mutex_name();
        unsafe {
            let handle = CreateMutexW(std::ptr::null_mut(), 0, name.as_ptr());
            if handle.is_null() {
                return true;
            }
            if GetLastError() != ERROR_ALREADY_EXISTS {
                // Stays open for the life of the process, which is the point.
                return true;
            }
            let window = FindWindowW(std::ptr::null(), title().as_ptr());
            if !window.is_null() {
                ShowWindowAsync(window, SW_RESTORE);
                SetForegroundWindow(window);
            }
            false
        }
    }

    unsafe extern "system" {
        fn CreateMutexW(attributes: *mut c_void, owner: i32, name: *const u16) -> *mut c_void;
        fn GetLastError() -> u32;
        fn FindWindowW(class: *const u16, window: *const u16) -> *mut c_void;
        fn ShowWindowAsync(window: *mut c_void, command: i32) -> i32;
        fn SetForegroundWindow(window: *mut c_void) -> i32;
    }
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

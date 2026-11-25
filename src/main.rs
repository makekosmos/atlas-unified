#![windows_subsystem = "windows"]
mod app;
mod appearance;
mod assets;
mod audio;
mod brand;
#[cfg(feature = "e2e")]
mod e2e;
mod games;
#[cfg(target_os = "macos")]
mod macos_menu;
mod model;
mod nsh_bridge;
mod nsh_host;
mod nsh_scope;
mod palettes;
mod scope;
mod store;
mod win_chrome;
use gpui::{
    actions, px, size, App, AppContext, Bounds, KeyBinding, Styled, WindowBounds, WindowOptions,
};
#[cfg(target_os = "windows")]
use gpui_fast_backend as _;
use imago_nsh::{Bundle, NshApp};

/// `ATLAS_OFFSCREEN=1` parks the window far outside the desktop so automated
/// soak runs (FPS/scroll benchmarks) don't pop a window on the user's screen.
/// DWM still composes it, so frame pacing stays representative. The window
/// never takes the focus either: the person keeps the keyboard and the front
/// window while an agent drives the app behind them.
fn window_bounds(cx: &mut App) -> Bounds<gpui::Pixels> {
    if offscreen() {
        gpui::bounds(
            gpui::point(px(-20000.), px(-20000.)),
            size(px(1440.), px(900.)),
        )
    } else {
        Bounds::centered(None, size(px(1440.), px(900.)), cx)
    }
}

fn offscreen() -> bool {
    #[cfg(feature = "e2e")]
    if e2e::requested() {
        return true;
    }
    std::env::var("ATLAS_OFFSCREEN").is_ok()
}

use app::Atlas;
use assets::font_bytes;

const WINDOW_TITLE: &str = "Atlas";

actions!(atlas, [Quit, CloseWindow, MinimizeWindow, HideApp]);

/// Standard macOS/desktop window shortcuts. The GPUI window sees keys before
/// AppKit's menu bar, so these bindings ensure ⌘Q, ⌘W, ⌘M and ⌘H always work.
fn install_window_keys(cx: &mut App) {
    cx.bind_keys([
        KeyBinding::new("cmd-q", Quit, None),
        KeyBinding::new("ctrl-q", Quit, None),
        KeyBinding::new("cmd-w", CloseWindow, None),
        KeyBinding::new("cmd-m", MinimizeWindow, None),
        KeyBinding::new("cmd-h", HideApp, None),
    ]);
    cx.on_action(|_: &Quit, cx: &mut App| cx.quit());
    cx.on_action(|_: &HideApp, cx: &mut App| cx.hide());
    cx.on_action(|_: &MinimizeWindow, cx: &mut App| {
        if let Some(handle) = cx.active_window() {
            let _ = handle.update(cx, |_, window, _| window.minimize_window());
        }
    });
    cx.on_action(|_: &CloseWindow, cx: &mut App| {
        #[cfg(target_os = "macos")]
        {
            let _ = cx;
            macos_menu::perform_close_key_window();
        }
        #[cfg(not(target_os = "macos"))]
        if let Some(handle) = cx.active_window() {
            let _ = handle.update(cx, |_, window, _| window.remove_window());
        }
    });
}

fn atlas_window_options(cx: &mut App) -> WindowOptions {
    WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(window_bounds(cx))),
        // The page is a rounded card with a sidebar beside it: squeezed past
        // this, it stops being a page and becomes a stripe.
        window_min_size: Some(size(px(800.), px(600.))),
        focus: !offscreen(),
        // Windows adaptive pacing owns the background cap and input wakeup.
        // A second focus-only cap would throttle unfocused interaction.
        inactive_frame_interval: if cfg!(target_os = "windows")
            || std::env::var("ATLAS_FPS").is_ok()
        {
            None
        } else {
            Some(std::time::Duration::from_micros(33_333))
        },
        titlebar: Some(gpui::TitlebarOptions {
            // Same as Manager (KOS-368): a title at creation goes through
            // changeWindowsItem: before AppKit tracks the window, so the
            // Dock gets a phantom entry and the real window's close,
            // minimize and zoom stop being the system's buttons.
            title: None,
            appears_transparent: true,
            // Inset symmetrically from the corner so the 14pt lights align
            // vertically (center y = 21pt) with the sidebar toggle button.
            traffic_light_position: Some(gpui::point(px(14.), px(14.))),
        }),
        // Atlas claims the titlebar strip so interactive controls sit on the
        // traffic-light line without AppKit double-click delay; empty bar
        // double-clicks route to `window.titlebar_double_click()`.
        app_owns_titlebar_drag: true,
        ..Default::default()
    }
}

fn open_atlas_window(cx: &mut App) -> (gpui::AnyWindowHandle, gpui::Entity<Atlas>) {
    let created = std::rc::Rc::new(std::cell::RefCell::new(None));
    let slot = created.clone();
    let options = atlas_window_options(cx);
    let window = cx
        .open_window(options, |window, cx| {
            // The platform window is already ordered in when this closure runs,
            // so set_title only renames the entry AppKit added itself.
            window.set_window_title(WINDOW_TITLE);
            let agenda = cx.new(Atlas::new);
            *slot.borrow_mut() = Some(agenda.clone());
            // Shell keeps the FPS meter outside Atlas's subtree; the
            // sidebar and content own their independent caches.
            let nsh = cx.new(|cx| {
                let initial = nsh_bridge::initial_snapshot(agenda.read(cx));
                let demo = agenda.read(cx).demo;
                let view =
                    imago_nsh::AppView::new(nsh_platform_gpui::AppOptions::default(), window, cx);
                view.register_component(
                    "atlas.bridge",
                    std::rc::Rc::new({
                        let agenda = agenda.clone();
                        move |context| {
                            Box::new(nsh_bridge::AtlasBridge::new(context, agenda.clone(), demo))
                        }
                    }),
                );
                view.register_component(
                    "atlas.toggle",
                    std::rc::Rc::new(|context| {
                        Box::new(nsh_bridge::toggle::ToggleSwitch::new(context))
                    }),
                );
                view.register_component(
                    "atlas.scope",
                    std::rc::Rc::new(|context| Box::new(nsh_scope::AtlasScope::new(context))),
                );
                view.on_error(|message| eprintln!("Atlas nsh: {message}"));
                if let Ok(url) = std::env::var("ATLAS_NSH_DEV_SERVER") {
                    // Dev server: the UI comes from `nsh dev` and hot reloads;
                    // the initial snapshot still rides in as a host param.
                    let mut params = serde_json::Map::new();
                    params.insert("atlas".into(), initial.clone());
                    view.host().set_params(params);
                    view.connect_dev_server(url, cx);
                } else {
                    let initial =
                        serde_json::to_string(&initial).expect("serialize initial Atlas state");
                    let source = format!(
                        "globalThis.__MUNDUS_ATLAS_INITIAL__={initial};\n{}",
                        include_str!("../ui/bundle.js")
                    );
                    view.load(NshApp::Js(Bundle::source(source)));
                }
                view
            });
            let view = cx.new(|_| nsh_host::AtlasShell {
                agenda,
                nsh,
                close_handler_installed: false,
            });
            // gpui-component widgets (Input, menus) require a ui::Root window layer.
            let root = cx.new(|cx| gpui_component::Root::new(view, window, cx));
            // Root paints an opaque theme background over the whole window;
            // Atlas's own root owns the window background so the sidebar
            // acrylic/mica material can show through.
            root.update(cx, |root, _| {
                root.style().background = Some(gpui::transparent_black().into());
            });
            root
        })
        .unwrap();
    let agenda = created.borrow_mut().take().expect("window builder ran");
    (window.into(), agenda)
}

fn main() {
    std::panic::set_hook(Box::new(|info| {
        win_chrome::trace(&format!("panic {info}"));
    }));
    win_chrome::trace("start");
    if !win_chrome::claim_single_instance() {
        win_chrome::trace("start: another Atlas is already running");
        return;
    }
    // NSH 0.6 defaults to nsh/base's core part only (for Rust-only apps);
    // JS hosts register the full nsh/base set so RichEditor, Popover, etc. load.
    nsh_platform_gpui::set_ui_sets(vec![imago_nsh::nsh_base_registry()]);
    let app = gpui::application();
    app.on_reopen(|cx: &mut App| {
        if cx.windows().is_empty() {
            let _ = open_atlas_window(cx);
        }
        cx.activate(true);
    });
    app.run(|cx: &mut App| {
        gpui_component::init(cx);
        cx.text_system()
            .add_fonts(font_bytes())
            .expect("failed to load embedded fonts");

        install_window_keys(cx);
        let (window, agenda) = open_atlas_window(cx);
        // After the window exists: AppKit draws the menu bar for the app, and
        // the items it carries (⌘Q, ⌘W, ⌘H) are the system's own.
        #[cfg(target_os = "macos")]
        macos_menu::install();
        #[cfg(feature = "e2e")]
        if e2e::requested() {
            e2e::run(window, agenda, cx);
        }
        #[cfg(not(feature = "e2e"))]
        let _ = (window, agenda);
        if !offscreen() {
            cx.activate(true);
        }
    });
}

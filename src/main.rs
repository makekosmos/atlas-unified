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

actions!(atlas, [Quit]);

/// ⌘Q has to end the process. The menu carries the same item for the pointer,
/// but the window takes the key first, so the key has its own way out.
fn install_quit_key(cx: &mut App) {
    cx.bind_keys([
        KeyBinding::new("cmd-q", Quit, None),
        KeyBinding::new("ctrl-q", Quit, None),
    ]);
    cx.on_action(|_: &Quit, cx: &mut App| cx.quit());
}

fn atlas_window_options(cx: &mut App) -> WindowOptions {
    WindowOptions {
        window_bounds: Some(WindowBounds::Windowed(window_bounds(cx))),
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
            // Leave AppKit to place the buttons. A custom
            // traffic_light_position moves the views by hand and on
            // macOS 27 that keeps the pre-Tahoe flat lights.
            traffic_light_position: None,
        }),
        // Zeron claims the titlebar strip. Otherwise AppKit zooms the window
        // on a double click anywhere in that band, including the sidebar
        // buttons that sit on the traffic-light line.
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
    gpui::application().run(|cx: &mut App| {
        gpui_component::init(cx);
        cx.text_system()
            .add_fonts(font_bytes())
            .expect("failed to load embedded fonts");

        install_quit_key(cx);
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

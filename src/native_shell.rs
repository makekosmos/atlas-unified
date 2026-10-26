//! AppKit window for macOS; the screen inside it is the same built TSX bundle
//! the GPUI host runs on Windows and Linux.

use std::{process::ExitCode, rc::Rc};

use imago_native_sidebar::Row;
use nsh_core::ui::prelude::*;
use nsh_platform_macos::{App, AppOptions, AppView, Bundle, NativeComponent};

#[component]
fn AtlasNativeRoot() -> impl IntoElement {
    view().flex_1().child(native("atlas.content").flex_1())
}

struct BundleHost {
    view: Rc<AppView>,
}

impl BundleHost {
    fn new(_context: nsh_platform_macos::ComponentContext) -> Self {
        let mtm = nsh_platform_macos::objc2::MainThreadMarker::new()
            .expect("native Atlas component is on AppKit thread");
        let view = AppView::new(
            mtm,
            AppOptions {
                app_id: "com.mundus.atlas".into(),
                title: "Atlas".into(),
                size: (1440, 900),
                ..Default::default()
            },
        );
        crate::nsh_bridge::macos::register(&view);
        let initial = crate::nsh_bridge::macos::initial_snapshot();
        let source = format!(
            "globalThis.__MUNDUS_ATLAS_INITIAL__={};\n{}",
            serde_json::to_string(&initial).expect("serialize initial Atlas state"),
            include_str!("../ui/bundle.js")
        );
        view.load(App::Js(Bundle::source(source)));
        Self { view }
    }
}

impl Drop for BundleHost {
    fn drop(&mut self) {
        self.view.stop();
    }
}

impl NativeComponent for BundleHost {
    fn view(
        &self,
    ) -> nsh_platform_macos::objc2::rc::Retained<nsh_platform_macos::objc2_app_kit::NSView> {
        self.view.view()
    }

    fn set_prop(&mut self, _name: &str, _value: Option<&serde_json::Value>) {}
}

fn register_components(view: &AppView) {
    view.register_component(
        "atlas.content",
        Rc::new(|context| Box::new(BundleHost::new(context))),
    );
}

pub(crate) fn run(rows: Vec<Row>) -> ExitCode {
    imago_window_macos::run(
        "Atlas",
        (1440.0, 900.0),
        rows,
        nsh_platform_macos::Root::of::<AtlasNativeRoot>,
        nsh_platform_macos::Root::of::<AtlasNativeRoot>,
        register_components,
    )
}

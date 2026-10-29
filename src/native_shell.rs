//! AppKit window for macOS; the screen inside it is the same built TSX bundle
//! the GPUI host runs on Windows and Linux.

use std::{process::ExitCode, rc::Rc};

use imago_native_sidebar::Row;
use nsh_core::prelude::*;
use nsh_platform_macos::objc2::{
    define_class, msg_send, rc::Retained, runtime::AnyObject, sel, DefinedClass, MainThreadOnly,
};
use nsh_platform_macos::objc2_app_kit::{
    NSApplication, NSBezelStyle, NSButton, NSButtonType, NSCellImagePosition, NSImage, NSMenu,
    NSMenuItem, NSView,
};
use nsh_platform_macos::objc2_foundation::{MainThreadMarker, NSObject, NSString};
use nsh_platform_macos::{App, AppOptions, AppView, Bundle, ComponentContext, NativeComponent};
use serde_json::Value;

#[component]
fn AtlasNativeRoot() -> impl IntoElement {
    view().flex_1().child(native("atlas.content").flex_1())
}

struct BundleHost {
    view: Rc<AppView>,
}

struct CalendarToggleTargetIvars {
    context: ComponentContext,
}

define_class!(
    #[unsafe(super(NSObject))]
    #[thread_kind = MainThreadOnly]
    #[ivars = CalendarToggleTargetIvars]
    struct CalendarToggleTarget;

    impl CalendarToggleTarget {
        #[unsafe(method(pressed:))]
        fn pressed(&self, _sender: Option<&NSButton>) {
            self.ivars().context.emit("press", serde_json::json!({}));
        }
    }
);

impl CalendarToggleTarget {
    fn new(mtm: MainThreadMarker, context: ComponentContext) -> Retained<Self> {
        let allocated = Self::alloc(mtm).set_ivars(CalendarToggleTargetIvars { context });
        // SAFETY: initialize a freshly allocated NSObject subclass.
        unsafe { msg_send![super(allocated), init] }
    }
}

struct CalendarToggle {
    button: Retained<NSButton>,
    _target: Retained<CalendarToggleTarget>,
}

impl CalendarToggle {
    fn new(context: ComponentContext) -> Self {
        let mtm = MainThreadMarker::new().expect("native calendar button is on AppKit thread");
        let target = CalendarToggleTarget::new(mtm, context);
        let target_object: &AnyObject = &target;
        let button = unsafe {
            NSButton::buttonWithTitle_target_action(
                &NSString::new(),
                Some(target_object),
                Some(sel!(pressed:)),
                mtm,
            )
        };
        button.setButtonType(NSButtonType::Toggle);
        button.setBezelStyle(NSBezelStyle::AccessoryBar);
        button.setBordered(true);
        button.setImagePosition(NSCellImagePosition::ImageOnly);
        button.setImage(
            NSImage::imageWithSystemSymbolName_accessibilityDescription(
                &NSString::from_str("sidebar.right"),
                Some(&NSString::from_str("Показать календарь")),
            )
            .as_deref(),
        );
        Self {
            button,
            _target: target,
        }
    }
}

impl NativeComponent for CalendarToggle {
    fn view(&self) -> Retained<NSView> {
        Retained::into_super(Retained::into_super(self.button.clone()))
    }

    fn set_prop(&mut self, name: &str, value: Option<&Value>) {
        match name {
            "expanded" => {
                self.button
                    .setState(if value.and_then(Value::as_bool).unwrap_or(false) {
                        1
                    } else {
                        0
                    })
            }
            "label" => {
                let tooltip = value.and_then(Value::as_str).map(NSString::from_str);
                self.button.setToolTip(tooltip.as_deref());
            }
            _ => {}
        }
    }
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
        view.register_component(
            "atlas.journalCalendarToggle",
            Rc::new(|context| Box::new(CalendarToggle::new(context))),
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
    install_edit_menu();
    view.register_component(
        "atlas.content",
        Rc::new(|context| Box::new(BundleHost::new(context))),
    );
}

fn install_edit_menu() {
    let mtm = MainThreadMarker::new().expect("edit menu is installed on the AppKit thread");
    let app = NSApplication::sharedApplication(mtm);
    let Some(main) = app.mainMenu() else {
        return;
    };
    let title = NSString::from_str("Правка");
    if main.itemWithTitle(&title).is_some() {
        return;
    }

    let edit = NSMenu::initWithTitle(NSMenu::alloc(mtm), &title);
    add_edit_item(mtm, &edit, "Отменить", sel!(undo:), "z");
    add_edit_item(mtm, &edit, "Повторить", sel!(redo:), "Z");
    edit.addItem(&NSMenuItem::separatorItem(mtm));
    add_edit_item(mtm, &edit, "Вырезать", sel!(cut:), "x");
    add_edit_item(mtm, &edit, "Скопировать", sel!(copy:), "c");
    add_edit_item(mtm, &edit, "Вставить", sel!(paste:), "v");
    add_edit_item(mtm, &edit, "Выбрать всё", sel!(selectAll:), "a");

    let menu_item = unsafe {
        NSMenuItem::initWithTitle_action_keyEquivalent(
            NSMenuItem::alloc(mtm),
            &title,
            None,
            &NSString::from_str(""),
        )
    };
    menu_item.setSubmenu(Some(&edit));
    main.insertItem_atIndex(&menu_item, 1);
    app.setMainMenu(Some(&main));
}

fn add_edit_item(
    mtm: MainThreadMarker,
    menu: &NSMenu,
    title: &str,
    action: nsh_platform_macos::objc2::runtime::Sel,
    key: &str,
) {
    let item = unsafe {
        NSMenuItem::initWithTitle_action_keyEquivalent(
            NSMenuItem::alloc(mtm),
            &NSString::from_str(title),
            Some(action),
            &NSString::from_str(key),
        )
    };
    menu.addItem(&item);
}

pub(crate) fn run(rows: Vec<Row>, footer: Vec<Row>) -> ExitCode {
    imago_window_macos::run_with_sidebar_sections_and_traffic_light_position(
        "Atlas",
        (1440.0, 900.0),
        imago_window_macos::SidebarSections { rows, footer },
        Vec::new(),
        Some((14.0, 14.0)),
        nsh_platform_macos::Root::of::<AtlasNativeRoot>,
        nsh_platform_macos::Root::of::<AtlasNativeRoot>,
        register_components,
    )
}

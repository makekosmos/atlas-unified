use std::{
    cell::{Cell, RefCell},
    rc::Rc,
};

use nsh_platform_macos::{
    objc2::{
        define_class, msg_send, rc::Retained, runtime::AnyObject, sel, DefinedClass,
        MainThreadMarker, MainThreadOnly,
    },
    objc2_app_kit::{
        NSButton, NSImage, NSLayoutAttribute, NSTitlebarAccessoryViewController, NSView,
    },
    objc2_foundation::{NSObject, NSObjectProtocol, NSRect, NSSize, NSString},
    ComponentContext, NativeComponent,
};

struct CalendarTargetIvars(ComponentContext);

define_class!(
    #[unsafe(super(NSObject))]
    #[thread_kind = MainThreadOnly]
    #[ivars = CalendarTargetIvars]
    struct CalendarTarget;

    unsafe impl NSObjectProtocol for CalendarTarget {}

    impl CalendarTarget {
        #[unsafe(method(toggleCalendar:))]
        fn toggle_calendar(&self, _sender: Option<&AnyObject>) {
            self.ivars().0.emit("press", serde_json::json!({}));
        }
    }
);

struct CalendarAnchorIvars {
    target: Retained<CalendarTarget>,
    accessory: RefCell<Option<Retained<NSTitlebarAccessoryViewController>>>,
    visible: Cell<bool>,
}

define_class!(
    #[unsafe(super(NSView))]
    #[thread_kind = MainThreadOnly]
    #[ivars = CalendarAnchorIvars]
    struct CalendarAnchor;

    unsafe impl NSObjectProtocol for CalendarAnchor {}

    impl CalendarAnchor {
        #[unsafe(method(viewDidMoveToWindow))]
        fn moved_to_window(&self) {
            let () = unsafe { msg_send![super(self), viewDidMoveToWindow] };
            if self.ivars().accessory.borrow().is_some() {
                return;
            }
            let Some(window) = self.window() else { return };
            let mtm = MainThreadMarker::from(self);
            let Some(image) = NSImage::imageWithSystemSymbolName_accessibilityDescription(
                &NSString::from_str("calendar"),
                Some(&NSString::from_str("Календарь дневника")),
            ) else { return };
            let view = NSView::initWithFrame(
                NSView::alloc(mtm),
                NSRect::new(Default::default(), NSSize::new(34.0, 30.0)),
            );
            let target: &AnyObject = &self.ivars().target;
            let button = unsafe {
                NSButton::buttonWithImage_target_action(
                    &image,
                    Some(target),
                    Some(sel!(toggleCalendar:)),
                    mtm,
                )
            };
            button.setBordered(false);
            button.setToolTip(Some(&NSString::from_str("Календарь дневника")));
            button.setFrame(NSRect::new(Default::default(), NSSize::new(34.0, 30.0)));
            view.addSubview(&button);

            let accessory = NSTitlebarAccessoryViewController::new(mtm);
            accessory.setLayoutAttribute(NSLayoutAttribute::Right);
            accessory.setView(&view);
            accessory.setHidden(!self.ivars().visible.get());
            window.addTitlebarAccessoryViewController(&accessory);
            *self.ivars().accessory.borrow_mut() = Some(accessory);
        }
    }
);

pub struct CalendarTitlebar(Retained<CalendarAnchor>);

impl CalendarTitlebar {
    pub fn new(context: ComponentContext) -> Self {
        let mtm = MainThreadMarker::new().expect("titlebar component is on AppKit thread");
        let target = CalendarTarget::alloc(mtm).set_ivars(CalendarTargetIvars(context));
        let target = unsafe { msg_send![super(target), init] };
        let view = CalendarAnchor::alloc(mtm).set_ivars(CalendarAnchorIvars {
            target,
            accessory: RefCell::new(None),
            visible: Cell::new(false),
        });
        let view = unsafe { msg_send![super(view), init] };
        Self(view)
    }
}

impl NativeComponent for CalendarTitlebar {
    fn view(&self) -> Retained<NSView> {
        Retained::into_super(self.0.clone())
    }

    fn set_prop(&mut self, name: &str, value: Option<&serde_json::Value>) {
        if name != "visible" {
            return;
        }
        let visible = value.and_then(serde_json::Value::as_bool).unwrap_or(false);
        self.0.ivars().visible.set(visible);
        if let Some(accessory) = self.0.ivars().accessory.borrow().as_ref() {
            accessory.setHidden(!visible);
        }
    }
}

pub fn register(view: &nsh_platform_macos::AppView) {
    view.register_component(
        "atlas.titlebar-calendar",
        Rc::new(|context| Box::new(CalendarTitlebar::new(context))),
    );
}

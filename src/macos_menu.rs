//! The macOS menu bar, made by AppKit itself.
//!
//! GPUI can build a menu, but the system's own items carry the behaviours a
//! person expects from a Mac app — ⌘Q terminating, ⌘H hiding, ⌘W closing the
//! window, ⌘M minimising it — and the Edit items reaching the focused text
//! field through the responder chain. Those are `terminate:`, `hide:` and
//! friends: selectors AppKit already implements, so nothing here reimplements
//! them, and no key is taken away from the system.

use objc2::rc::Retained;
use objc2::runtime::Sel;
use objc2::{sel, MainThreadOnly};
use objc2_app_kit::{NSApplication, NSEventModifierFlags, NSMenu, NSMenuItem};
use objc2_foundation::{MainThreadMarker, NSString};

/// Installs the menu bar. Called once, on the main thread, after the app has
/// started: AppKit owns `mainMenu` from then on.
pub(crate) fn install() {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let app = NSApplication::sharedApplication(mtm);

    let main = NSMenu::new(mtm);

    // The application menu: its title is drawn from the bundle name.
    let app_menu = NSMenu::new(mtm);
    app_menu.addItem(&item(mtm, "Завершить Atlas", Some(sel!(terminate:)), "q"));
    app_menu.addItem(&NSMenuItem::separatorItem(mtm));
    app_menu.addItem(&item(mtm, "Скрыть Atlas", Some(sel!(hide:)), "h"));
    app_menu.addItem(&item(
        mtm,
        "Скрыть остальные",
        Some(sel!(hideOtherApplications:)),
        "h",
    ));
    app_menu.addItem(&item(
        mtm,
        "Показать все",
        Some(sel!(unhideAllApplications:)),
        "",
    ));
    main.addItem(&submenu(mtm, "Atlas", &app_menu));

    // Edit: the items act on whatever holds the keyboard, through the chain.
    let edit = titled(mtm, "Правка");
    edit.addItem(&item(mtm, "Отменить", Some(sel!(undo:)), "z"));
    edit.addItem(&shift_item(mtm, "Повторить", sel!(redo:), "z"));
    edit.addItem(&NSMenuItem::separatorItem(mtm));
    edit.addItem(&item(mtm, "Вырезать", Some(sel!(cut:)), "x"));
    edit.addItem(&item(mtm, "Скопировать", Some(sel!(copy:)), "c"));
    edit.addItem(&item(mtm, "Вставить", Some(sel!(paste:)), "v"));
    edit.addItem(&item(mtm, "Выбрать всё", Some(sel!(selectAll:)), "a"));
    main.addItem(&submenu(mtm, "Правка", &edit));

    // Window: what the traffic lights do, with the keys a Mac app answers to.
    let window = titled(mtm, "Окно");
    window.addItem(&item(mtm, "Свернуть", Some(sel!(performMiniaturize:)), "m"));
    window.addItem(&item(mtm, "Закрыть", Some(sel!(performClose:)), "w"));
    main.addItem(&submenu(mtm, "Окно", &window));

    app.setMainMenu(Some(&main));
}

fn item(
    mtm: MainThreadMarker,
    title: &str,
    action: Option<Sel>,
    key: &str,
) -> Retained<NSMenuItem> {
    unsafe {
        NSMenuItem::initWithTitle_action_keyEquivalent(
            NSMenuItem::alloc(mtm),
            &NSString::from_str(title),
            action,
            &NSString::from_str(key),
        )
    }
}

/// A submenu with its title: AppKit keeps the title on the menu itself.
fn titled(mtm: MainThreadMarker, title: &str) -> Retained<NSMenu> {
    let menu = NSMenu::new(mtm);
    menu.setTitle(&NSString::from_str(title));
    menu
}

/// The same item with Shift added to its command key (⌘Z undone, ⇧⌘Z redone).
fn shift_item(mtm: MainThreadMarker, title: &str, action: Sel, key: &str) -> Retained<NSMenuItem> {
    let item = item(mtm, title, Some(action), key);
    item.setKeyEquivalentModifierMask(NSEventModifierFlags::Command | NSEventModifierFlags::Shift);
    item
}

fn submenu(mtm: MainThreadMarker, title: &str, menu: &NSMenu) -> Retained<NSMenuItem> {
    let holder = unsafe {
        NSMenuItem::initWithTitle_action_keyEquivalent(
            NSMenuItem::alloc(mtm),
            &NSString::from_str(title),
            None,
            &NSString::from_str(""),
        )
    };
    holder.setSubmenu(Some(menu));
    holder
}

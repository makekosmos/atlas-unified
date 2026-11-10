//! `atlas.toggle`: imago's own settings switch for the TSX screens.
//!
//! nsh-base's `Switch` owns only the behaviour and leaves the look to the app,
//! so this component draws imago's `Toggle` instead: the 44.8 x 28.8 geometry,
//! the travelling thumb, the dash and ring marks, and the macOS haptic tick on
//! every activation. The palette arrives as props because Atlas owns its theme.

use std::sync::atomic::{AtomicUsize, Ordering};

use gpui::{prelude::*, AnyElement, App, Window};
use gpui_component::Disableable;
use imago_nsh::{
    imago_gpui::toggle::{Toggle, ToggleColors},
    ComponentContext, NativeComponent,
};
use serde_json::{json, Value};

/// Imago keys the thumb's travel by element id, so every mounted switch needs
/// its own. The id is a `&'static str`, hence the one small leak per switch.
static NEXT_ID: AtomicUsize = AtomicUsize::new(0);

pub(crate) struct ToggleSwitch {
    context: ComponentContext,
    id: &'static str,
    checked: bool,
    disabled: bool,
    label: String,
    colors: ToggleColors,
}

impl ToggleSwitch {
    pub(crate) fn new(context: ComponentContext) -> Self {
        let id = Box::leak(
            format!("atlas.toggle.{}", NEXT_ID.fetch_add(1, Ordering::Relaxed)).into_boxed_str(),
        );
        Self {
            context,
            id,
            checked: false,
            disabled: false,
            label: String::new(),
            colors: ToggleColors::default(),
        }
    }
}

impl NativeComponent for ToggleSwitch {
    fn render(&mut self, _window: &mut Window, _cx: &mut App) -> Option<AnyElement> {
        let context = self.context.clone();
        let disabled = self.disabled;
        let mut toggle = Toggle::new(self.id, self.checked).colors(self.colors);
        if !self.label.is_empty() {
            toggle = toggle.accessibility_label(self.label.clone());
        }
        toggle = toggle
            .disabled(self.disabled)
            .on_change(move |next, _window, _cx| {
                if !disabled {
                    context.emit("change", json!({ "checked": next }));
                }
            });
        Some(toggle.into_any_element())
    }

    fn set_prop(&mut self, name: &str, value: Option<&Value>, _window: &mut Window, _cx: &mut App) {
        match name {
            "checked" => self.checked = value.and_then(Value::as_bool).unwrap_or(false),
            "disabled" => self.disabled = value.and_then(Value::as_bool).unwrap_or(false),
            "label" => {
                self.label = value.and_then(Value::as_str).unwrap_or_default().to_owned();
            }
            "accent" => set_color(&mut self.colors.accent, value),
            "foreground" => set_color(&mut self.colors.foreground, value),
            "surface" => set_color(&mut self.colors.surface, value),
            _ => {}
        }
    }
}

/// `#rrggbb` from the app's palette, the shape imago's toggle takes.
fn set_color(target: &mut u32, value: Option<&Value>) {
    let Some(text) = value.and_then(Value::as_str) else {
        return;
    };
    let digits = text.trim_start_matches('#');
    if digits.len() == 6 {
        if let Ok(rgb) = u32::from_str_radix(digits, 16) {
            *target = rgb;
        }
    }
}

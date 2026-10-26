//! Re-exported from imago-gpui (KOS-132). The theme table moved to
//! `imago_nsh::imago_gpui::palettes::THEMES` — same zeron oklch→sRGB values, now
//! maintained by hand in the imago repo (no codegen pipeline here).
pub use imago_nsh::imago_gpui::palettes::*;

use imago_nsh::imago_gpui::Palette;
use serde_json::{json, Value};

/// Theme palettes sent to TSX so settings previews and optimistic updates use
/// the same colors as the native host.
pub fn choices_json() -> Vec<Value> {
    THEMES
        .iter()
        .map(|theme| {
            json!({
                "key": theme.key,
                "name": theme.name,
                "light": palette_json(&theme.light),
                "dark": palette_json(&theme.dark),
            })
        })
        .collect()
}

fn palette_json(palette: &Palette) -> Value {
    let color = |value: u32| format!("#{value:06x}");
    json!({
        "background": color(palette.bg),
        "foreground": color(palette.fg),
        "muted": color(palette.muted_fg),
        "border": color(palette.border),
        "accent": color(palette.accent),
        "card": color(palette.card),
    })
}

//! Atlas's theme table: the shared palettes from `imago_nsh::imago_gpui`
//! (zeron oklch→sRGB, maintained by hand in the imago repo, KOS-132) with the
//! scheme Atlas wears by default in front.

use std::sync::LazyLock;

use imago_nsh::imago_gpui::palettes::{ThemeDef, THEMES as SHARED_THEMES};
use imago_nsh::imago_gpui::Palette;
use serde_json::{json, Value};

/// Cobalt Foundry: forged steel greys lit by a cobalt arc — the scheme
/// `imago-nsh/ui/palettes.ts` ships. That palette carries no token for
/// `accent_dim`, `warn`, `qe_chip_bg` or `qe_chip_fg`, so those four are
/// derived here from the accent.
const COBALT_FOUNDRY: ThemeDef = ThemeDef {
    key: "cobalt-foundry",
    name: "Cobalt Foundry",
    desc: "Кобальтовая дуга на литой стали",
    light: Palette {
        bg: 0xf7f8fa,
        fg: 0x111820,
        muted_fg: 0x5f6a7a,
        border: 0xdde2ea,
        accent: 0x1f6df5,
        accent_fg: 0xffffff,
        accent_dim: 0xa8c5fb,
        secondary: 0xeef1f6,
        card: 0xffffff,
        popover: 0xffffff,
        sidebar_bg: 0xeff1f5,
        sidebar_divider: 0xdde2ea,
        destructive: 0xd5373c,
        warn: 0xc9861a,
        success: 0x1f8a5b,
        qe_chip_bg: 0xdbe7fd,
        qe_chip_fg: 0x1a4f9e,
    },
    dark: Palette {
        bg: 0x090c15,
        fg: 0xffffff,
        muted_fg: 0x717580,
        border: 0x1e222b,
        accent: 0x1784fc,
        accent_fg: 0x101318,
        accent_dim: 0x104888,
        secondary: 0x181c25,
        card: 0x101318,
        popover: 0x181c25,
        sidebar_bg: 0x0d1019,
        sidebar_divider: 0x1e222b,
        destructive: 0xe67b71,
        warn: 0xe0a33a,
        success: 0x3fbf7f,
        qe_chip_bg: 0x12304f,
        qe_chip_fg: 0x6ab2ff,
    },
};

/// Cobalt Foundry first: `THEMES[0]` is the default scheme, the shared palettes
/// follow unchanged.
pub static THEMES: LazyLock<Vec<&'static ThemeDef>> =
    LazyLock::new(|| std::iter::once(&COBALT_FOUNDRY).chain(SHARED_THEMES).collect());

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

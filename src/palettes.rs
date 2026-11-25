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
pub static THEMES: LazyLock<Vec<&'static ThemeDef>> = LazyLock::new(|| {
    std::iter::once(&COBALT_FOUNDRY)
        .chain(SHARED_THEMES)
        .collect()
});

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

/// A palette as the component theme NSH draws itself with (`setTheme`): shadcn's
/// tokens, both appearances in one file. A table's grips, a selection, a scroll
/// bar and a menu read these, so the accent chosen here reaches them — the
/// shared `imago-nsh` theme's violet stays out of it.
pub fn nsh_theme(light: &Palette, dark: &Palette, accent: Option<u32>) -> Value {
    fn tokens(palette: &Palette, accent: u32) -> Value {
        let color = |value: u32| format!("#{value:06x}");
        json!({
            "background": color(palette.bg),
            "foreground": color(palette.fg),
            "card": color(palette.card),
            "card-foreground": color(palette.fg),
            "popover": color(palette.popover),
            "popover-foreground": color(palette.fg),
            "primary": color(accent),
            "primary-foreground": color(palette.accent_fg),
            "secondary": color(palette.secondary),
            "secondary-foreground": color(palette.fg),
            "muted": color(palette.secondary),
            "muted-foreground": color(palette.muted_fg),
            "accent": color(palette.accent_dim),
            "accent-foreground": color(palette.fg),
            "destructive": color(palette.destructive),
            "border": color(palette.border),
            "input": color(palette.border),
            "ring": color(accent),
            // What a selection is drawn with: the accent, as a wash.
            "selection": format!("#{accent:06x}38"),
            "sidebar": color(palette.sidebar_bg),
            "sidebar-foreground": color(palette.fg),
            "sidebar-border": color(palette.sidebar_divider),
        })
    }
    json!({
        "cssVars": {
            // Atlas's own typography and corners: NSH components read these
            // instead of borrowing another app's theme.
            "theme": {
                "font-sans": "Inter",
                "font-mono": "Geist Mono",
                "radius": "0.75rem",
                "radius-control": "0.5rem",
            },
            "light": tokens(light, accent.unwrap_or(light.accent)),
            "dark": tokens(dark, accent.unwrap_or(dark.accent)),
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_component_theme_wears_the_palette() {
        let theme = nsh_theme(&COBALT_FOUNDRY.light, &COBALT_FOUNDRY.dark, Some(0x123456));
        let css = &theme["cssVars"];
        // The accent is the app's, in both appearances — the shared violet is
        // nowhere in what NSH draws itself with.
        assert_eq!(css["light"]["primary"], "#123456");
        assert_eq!(css["dark"]["primary"], "#123456");
        assert_eq!(css["dark"]["ring"], "#123456");
        assert_eq!(css["dark"]["selection"], "#12345638");
        // Surfaces come from the palette, each appearance its own.
        assert_eq!(css["light"]["background"], "#f7f8fa");
        assert_eq!(css["dark"]["background"], "#090c15");
        // Without an accent of its own, the palette keeps the one it has.
        let own = nsh_theme(&COBALT_FOUNDRY.light, &COBALT_FOUNDRY.dark, None);
        assert_eq!(own["cssVars"]["dark"]["primary"], "#1784fc");
    }

    /// The theme the app opens with is Atlas's own file, `ui/theme.json`, and it
    /// is generated from the palette the app defaults to: the first frame
    /// already wears the scheme `setTheme` then keeps in sync, and nothing is
    /// borrowed from another app's theme.
    #[test]
    fn the_theme_file_is_generated_from_the_palette() {
        let expected = format!(
            "{}\n",
            serde_json::to_string_pretty(&nsh_theme(
                &COBALT_FOUNDRY.light,
                &COBALT_FOUNDRY.dark,
                None,
            ))
            .unwrap()
        );
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/ui/theme.json");
        if std::env::var_os("ATLAS_THEME_WRITE").is_some() {
            std::fs::write(path, &expected).unwrap();
        }
        let actual = std::fs::read_to_string(path).unwrap_or_default();
        assert_eq!(
            actual, expected,
            "ui/theme.json is stale: regenerate it with `ATLAS_THEME_WRITE=1 cargo test --bin atlas -- theme`"
        );
    }
}

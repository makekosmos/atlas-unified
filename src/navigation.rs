//! One navigation catalog, parsed by the Rust AppKit host and imported by TSX.

use imago_native_sidebar::Row;
use serde::Deserialize;

#[derive(Deserialize)]
struct Item {
    id: String,
    label: String,
    icon: String,
    footer: bool,
    #[serde(default, rename = "devOnly")]
    dev_only: bool,
}

#[cfg(target_os = "macos")]
pub(crate) fn native_rows() -> (Vec<Row>, Vec<Row>) {
    let items: Vec<Item> = serde_json::from_str(include_str!("../ui/navigation.json"))
        .expect("Atlas navigation catalog is valid JSON");
    let items: Vec<Item> = items
        .into_iter()
        .filter(|item| !item.dev_only || cfg!(debug_assertions))
        .collect();
    let (footer, primary): (Vec<_>, Vec<_>) = items.into_iter().partition(|item| item.footer);
    let rows = |items: Vec<Item>| {
        items
            .into_iter()
            .map(|item| Row {
                id: Box::leak(item.id.into_boxed_str()),
                label: item.label,
                symbol: Some(Box::leak(item.icon.into_boxed_str())),
            })
            .collect()
    };
    (rows(primary), rows(footer))
}

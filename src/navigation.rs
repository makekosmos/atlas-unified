//! One navigation catalog, parsed by the Rust AppKit host and imported by TSX.

use imago_native_sidebar::Row;
use serde::Deserialize;

#[derive(Deserialize)]
struct Item {
    id: String,
    label: String,
    icon: String,
    #[allow(dead_code)]
    footer: bool,
}

#[cfg(target_os = "macos")]
pub(crate) fn native_rows() -> Vec<Row> {
    let items: Vec<Item> = serde_json::from_str(include_str!("../ui/navigation.json"))
        .expect("Atlas navigation catalog is valid JSON");
    items
        .into_iter()
        .map(|item| Row {
            id: Box::leak(item.id.into_boxed_str()),
            label: item.label,
            symbol: Some(Box::leak(item.icon.into_boxed_str())),
        })
        .collect()
}

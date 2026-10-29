# Appearance and settings

## Sub-features

- Shared settings UI and accent/color resolution: `ui/AtlasAppearanceSettings.tsx`, `ui/state.ts`.
- macOS reads and writes through Cortex `appearance.get` / `appearance.set` in `src/nsh_bridge/macos.rs`.
- Android starts from bridge defaults and persists user selections in NSH `Storage` under `mundus.atlas.mobile-appearance.v1`; it is a local override, not shared Engine appearance.
- Android Settings contains a sync waiting indicator, which is a placeholder, not an appearance feature or live sync status.

## How to get to it (user POV)

Android: tap “Настройки” on Atlas home. macOS: use the Settings route from shared navigation.

## Driving it with the Atlas ADB harness

From the home screen, tap “Настройки”, capture a screenshot, change the theme/accent control, then leave and return to confirm the local selection persists. Check the Engine status separately on macOS; do not equate Android local persistence with Engine synchronization.

## Gotchas

- Mobile theme list is intentionally reduced in `ui/mobile-themes.ts`.
- Android Kotlin currently hardcodes default appearance/capability values; `appearanceEditable=true` only enables local changes in the UI.
- Verify the requested Inter font asset separately; the current absolute `asset://` import URI did not resolve in the Android 15 APK during this pass.

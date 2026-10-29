# Search

## Sub-features

- The only current artifact is a configurable shortcut row (`mod+k`) in `ui/AtlasAppearanceSettings.tsx` and shortcut storage in `ui/App.tsx`.
- Search shortcut is not included in `keymap.bind`; there is no search screen, query model, Engine command, or Android bridge operation.
- TODO.md records search by journal notes as a shared business feature to add later.

## How to get to it (user POV)

There is no usable search flow on Android or macOS, even though Settings displays a shortcut preference.

## Driving it with the Atlas ADB harness

Confirm Settings shows the shortcut row, then record search as missing. Do not report that “mod+k” searches notes; the shortcut currently has no binding.

## Gotchas

Keep search semantics shared across platforms and put journal lookup/query behavior with the Engine/domain layer; presentation and keyboard/touch entry points can differ.

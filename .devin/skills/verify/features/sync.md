# Synchronization

## Sub-features

- Cortex `engine-mobile` provides `start_sync`, `stop_sync`, `sync_status`, pairing-code, and peer-pairing APIs.
- Atlas's Rust `AtlasMobileEngine` wrapper does not export those Engine APIs. The Android Kotlin bridge has no sync commands or status query, and the Settings indicator remains a placeholder.
- The desktop Atlas bridge also does not surface these sync APIs to the UI.
- The Settings indicator “Ожидает подключения” is a UI placeholder.
- Do not infer account pairing or sync from Cortex Engine journal CRUD; those are separate capabilities.

## How to get to it (user POV)

On Android, open Settings to see the waiting indicator. There is no actionable pairing or sync flow in Atlas today, despite the underlying mobile Engine library having sync APIs.

## Driving it with the Atlas ADB harness

Open Settings, capture what is shown, and inspect the engine-mobile wrapper, platform bridge, and UI before claiming synchronization. Record the UI as a placeholder until Atlas wires a sync API through the wrapper and bridge and an end-to-end transfer is observed.

## Gotchas

Agenda Android has a separate sync flow; its presence does not imply Atlas inherits the same implementation.

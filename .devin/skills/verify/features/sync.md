# Synchronization

## Sub-features

- Atlas has no sync status or sync business command in the Android Kotlin bridge or Atlas desktop bridge.
- The Settings indicator “Ожидает подключения” is a UI placeholder.
- Do not infer account pairing or sync from Cortex Engine journal CRUD; those are separate capabilities.

## How to get to it (user POV)

On Android, open Settings to see the waiting indicator. There is no actionable pairing or sync flow in Atlas today.

## Driving it with the Atlas ADB harness

Open Settings, capture what is shown, and verify code/bridge state before claiming synchronization. Record it as a placeholder until a sync API and observed end-to-end transfer exist.

## Gotchas

Agenda Android has a separate sync flow; its presence does not imply Atlas inherits the same implementation.

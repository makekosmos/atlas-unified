# Journal

## Sub-features

- List, create, edit, and delete entries in the Engine journal store.
- Group by local day, order newest first, format weekday/date, and label the current day “Сегодня”.
- Copy/select text and show entry actions; Android supports the mobile editor and native back path.
- Desktop has an optional calendar side panel; Android hides it.

Business data and operations: `src/store/journal.rs`, `android/rust/src/lib.rs`, `src/nsh_bridge/macos.rs`, `android/app/src/main/java/com/mundus/atlas/AtlasBridge.kt`. Shared UI/model: `ui/JournalPage.tsx`, `ui/journal-model.ts` (desktop mirror under `atlas-unified/ui/journal-model.ts`).

## How to get to it (user POV)

On Android, open Atlas, tap “Открыть дневник”, then use the bottom composer. On macOS, journal is the primary route. Tap/press an entry for its action menu; use edit/delete/copy there.

## Driving it with the Atlas ADB harness

```sh
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py launch
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py tap --label 'Открыть дневник'
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py wait-visible --label 'Записей пока нет'
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py tap --label 'Запись в дневник…'
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py type --text 'verify-entry-20261029'
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py tap --label 'Отправить запись'
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py wait-visible --label 'verify-entry-20261029'
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py capture --path /tmp/atlas-verify/evidence/journal-created.png
```

Afterward, reload/relaunch and verify the entry remains. Use the isolated, disposable AVD so fixture data cannot enter the user's profile.

## Gotchas

- The bridge initially publishes a fallback snapshot and then asynchronously publishes Engine state. Wait for “Открыть дневник” on the home route before tapping; the first transient frame can look like the diary.
- Android bridge only provides clipboard, background, journal CRUD, reload, and state. Do not assume sync or task commands exist there.
- `uiautomator dump` may stall on the Android 15 emulator. The harness caps calls and avoids concurrent dumps.

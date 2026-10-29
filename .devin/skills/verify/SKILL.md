# Atlas Android verification

Use this skill when changing Atlas behavior shared by Android and desktop, or when preparing an Android build. Start with `features/README.md` to find the owner of each behavior. The Engine owns persisted journal data and business operations; `ui/` owns shared presentation and platform-specific interaction; Android's Kotlin bridge exposes the Engine to NSH.

## Prepare an isolated Android run

Build from the repository root in `android/`:

```sh
cd android
ANDROID_HOME=/opt/homebrew/share/android-commandlinetools \
ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools \
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
PATH=/opt/homebrew/opt/openjdk@17/bin:$PATH ./gradlew --no-daemon assembleDebug
```

Use a throwaway AVD and never clear or reinstall into the user's `agenda35` AVD. The proven local device was `emulator-5556` (`atlas-verify`, Android 15, `-wipe-data`). Set `ANDROID_SERIAL=emulator-5556` for every driver command. The first-time AVD was seeded from an existing Pixel 7 `config.ini` because local `avdmanager` image metadata was broken; create a separate AVD with Android Studio Device Manager when setting up a new machine.

```sh
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py install --apk android/app/build/outputs/apk/debug/app-debug.apk
ANDROID_SERIAL=emulator-5556 python3 scripts/atlas_verify.py launch
```

The driver uses Android accessibility labels and ADB input. It serializes hierarchy reads and times out a stuck adb operation. Capture screenshots to `/tmp/atlas-verify/evidence/` and inspect the actual image as well as accessibility state. The isolated AVD's app data can be discarded by wiping that AVD after the run. `cleanup` force-stops only `com.mundus.atlas.dev` and preserves the AVD/evidence.

## Drive and verify

Follow the relevant scenario in `features/`. Prefer user-observable behavior: navigate with its visible action, perform the operation, verify the changed state and persistence after reloading or relaunching when supported. Do not treat compilation as proof of behavior.

Do not invoke project unit tests unless the user asks. A build, ADB/UI scenario, screenshot, and targeted source inspection are allowed when needed to verify behavior.

## Current Android limits

- The mobile Engine opens the real journal store under app-private files and delegates create/update/delete/list operations to the shared journal store implementation.
- Mobile appearance edits are stored locally with NSH `Storage`; they do not call Engine appearance RPC.
- Search is not implemented; the shortcut row is present but does not bind a search action.
- Sync APIs exist in `engine-mobile`, but Atlas does not expose them through its Rust wrapper or Android bridge; Settings shows only a waiting placeholder.
- Task route is allowed in debug only and has no Android task data bridge; the production mobile home does not expose it.
- Check that the Inter font loads in the runtime log for every build. The source import currently produces an absolute `asset://` URI; a generated asset copied to the apparent relative path did not resolve under Android 15. Do not claim the font is fixed until a fresh install shows no `Inter.ttf` asset warning.

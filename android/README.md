# Atlas Android

Atlas Android embeds the shared NSH UI and runs the same journal store against
the in-process `engine-mobile` library. The Engine database lives under the
app's `filesDir`; UI code never opens SQLite. Android tasks are exposed only in
debug builds, matching the dev-only navigation flag.

## Build

The Android host must use the NSH CLI and Android AAR from the same NSH source
revision. Atlas currently uses the split module API from NSH commit
`669b62b11449b2ab787b7c82649a392cbff25b8f`; the machine-wide NSH 0.3 CLI/AAR
does not match these imports. Build an NSH distribution with Android support,
then point Gradle at that CLI and `dist/nsh/embed/android/nsh.aar`:

```sh
export NSH_CLI=/path/to/nsh/target/debug/nsh
export NSH_ANDROID_AAR=/path/to/nsh/dist/nsh/embed/android/nsh.aar
./android/gradlew --project-dir android --no-daemon :app:assembleDebug
```

The Rust wrapper pins the Engine through `android/rust/Cargo.lock` and Rust
1.99.1. An Android SDK with NDK 27.2.12479018, `cargo-ndk`, and the arm64 Rust
target are required. The APK currently targets arm64 devices and the arm64
Android emulator.

## Signed release

Build and sign the release APK with:

```sh
scripts/build-android-release.sh
```

The script reads the `atlas-android-release` / `atlas-release` credential from
macOS Keychain through Security.framework, runs Gradle with release signing
enabled, checks the APK alignment and signing certificate, and writes
`dist/Atlas-Android-arm64.apk`. Gradle rejects a direct unsigned release build;
use the script so signing credentials stay out of command arguments and logs.

To replace the Android APK and its checksum in an existing GitHub release, run:

```sh
scripts/publish-android-release.sh v0.0.1
```

The publisher checks that `versionCode` increases, uploads the APK and updated
`SHA256SUMS.txt`, then downloads both and verifies the published checksum and
release certificate.

## Data and package footprint

The Engine database stays in app-private `filesDir`, so an in-place app update
keeps it. Atlas has no in-app APK updater and does not save previous APKs in
`cache/updates`; build outputs and Gradle caches are ignored by Git. The
Android build keeps only `libatlas_mobile.so` from the Rust dependency graph:
`engine-mobile` is statically linked into it, so shipping its separate
dependency `.so` would duplicate Engine code. AGP uses the pinned NDK to strip
native debug symbols from the installed APK.

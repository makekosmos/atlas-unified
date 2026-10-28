#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/android/app/build/rust}"
BINDINGS="${2:-$ROOT/android/app/build/generated/uniffi}"
RUST_DIR="$ROOT/android/rust"
TARGET_DIR="$ROOT/target/android-rust"
RUST_PROFILE="${3:-release}"
ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
ANDROID_NDK_HOME="${ANDROID_NDK_HOME:-${ANDROID_HOME}/ndk/27.2.12479018}"
case "$(uname -s)" in
  Darwin) NDK_HOST="darwin-x86_64" ;;
  Linux) NDK_HOST="linux-x86_64" ;;
  *) echo "Unsupported Android build host: $(uname -s)" >&2; exit 1 ;;
esac

if [[ ! -x "$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/$NDK_HOST/bin/clang" ]]; then
  echo "Android NDK not found at $ANDROID_NDK_HOME; set ANDROID_NDK_HOME" >&2
  exit 1
fi
command -v cargo-ndk >/dev/null || { echo "Install cargo-ndk first" >&2; exit 1; }

export ANDROID_NDK_HOME CARGO_TARGET_DIR="$TARGET_DIR"
rm -rf "$OUT/jniLibs"
mkdir -p "$OUT/jniLibs" "$BINDINGS"
find "$BINDINGS" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

cd "$RUST_DIR"
export RUSTC="${RUSTC:-$(rustup which rustc)}"
cargo build --lib
HOST_LIB="$TARGET_DIR/debug/libatlas_mobile.dylib"
cargo run --features cli --bin uniffi-bindgen -- \
  generate --library "$HOST_LIB" --crate atlas_mobile --language kotlin --config "$RUST_DIR/uniffi.toml" --out-dir "$BINDINGS"

cargo ndk -t arm64-v8a --link-libcxx-shared -o "$OUT/jniLibs" \
  build --manifest-path "$RUST_DIR/Cargo.toml" --lib --profile "$RUST_PROFILE"

# cargo-ndk copies every cdylib built in the dependency graph. The wrapper
# statically links engine-mobile, so only its own cdylib belongs in the APK;
# shipping the dependency cdylib duplicates the Engine and network libraries.
find "$OUT/jniLibs" -name '*.so' \
  ! -name 'libatlas_mobile.so' \
  ! -name 'libc++_shared.so' \
  -delete

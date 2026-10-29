#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ]]; then
    JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  elif [[ -x /usr/libexec/java_home ]]; then
    JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  else
    echo "Java 17 is required to build the Android release." >&2
    exit 1
  fi
fi

export JAVA_HOME
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/homebrew/share/android-commandlinetools}}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export ANDROID_NDK_HOME="${ANDROID_NDK_HOME:-$ANDROID_HOME/ndk/27.2.12479018}"
export NSH_CLI="${NSH_CLI:-$HOME/.nsh-0.3.0-atlas/bin/nsh}"
export NSH_ANDROID_AAR="${NSH_ANDROID_AAR:-$HOME/.nsh-0.3.0-atlas/embed/android/nsh.aar}"
export PATH="$JAVA_HOME/bin:$HOME/.cargo/bin:/opt/homebrew/opt/rustup/bin:$ANDROID_HOME/platform-tools:$PATH"

exec swift "$repo_root/scripts/build-android-release.swift" "$repo_root" "$@"

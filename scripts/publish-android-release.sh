#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: scripts/publish-android-release.sh <tag>" >&2
  echo "Example: scripts/publish-android-release.sh v0.0.1" >&2
  exit 2
}

[[ $# -eq 1 ]] || usage
tag="$1"
[[ "$tag" =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || usage

repo="makekosmos/atlas-unified"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ]]; then
    JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  elif [[ -x /usr/libexec/java_home ]]; then
    JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  else
    echo "Java 17 is required to inspect Android APK metadata." >&2
    exit 1
  fi
fi
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"
sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/homebrew/share/android-commandlinetools}}"
aapt="$sdk_root/build-tools/35.0.0/aapt"
apksigner="$sdk_root/build-tools/35.0.0/apksigner"

command -v gh >/dev/null || { echo "GitHub CLI (gh) is required." >&2; exit 1; }
[[ -x "$aapt" && -x "$apksigner" ]] || { echo "Android build-tools 35.0.0 were not found under $sdk_root." >&2; exit 1; }
gh release view "$tag" --repo "$repo" >/dev/null

work="$(mktemp -d "${TMPDIR:-/tmp}/atlas-android-release.XXXXXX")"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/current" "$work/verify"

gh release download "$tag" --repo "$repo" --pattern Atlas-Android-arm64.apk --pattern SHA256SUMS.txt --dir "$work/current"
old_apk="$work/current/Atlas-Android-arm64.apk"
checksums="$work/current/SHA256SUMS.txt"
old_code="$("$aapt" dump badging "$old_apk" | sed -n "s/.*versionCode='\([0-9][0-9]*\)'.*/\1/p")"
[[ "$old_code" =~ ^[0-9]+$ ]] || { echo "Could not read the existing release APK versionCode." >&2; exit 1; }

"$repo_root/scripts/build-android-release.sh"
new_apk="$repo_root/dist/Atlas-Android-arm64.apk"
new_code="$("$aapt" dump badging "$new_apk" | sed -n "s/.*versionCode='\([0-9][0-9]*\)'.*/\1/p")"
[[ "$new_code" =~ ^[0-9]+$ ]] || { echo "Could not read the new APK versionCode." >&2; exit 1; }
(( new_code > old_code )) || { echo "New APK versionCode ($new_code) must be greater than the published APK ($old_code)." >&2; exit 1; }

python3 - "$checksums" "$new_apk" <<'PY'
from hashlib import sha256
from pathlib import Path
import sys

checksums = Path(sys.argv[1])
apk = Path(sys.argv[2])
name = "Atlas-Android-arm64.apk"
lines = checksums.read_text(encoding="utf-8").splitlines()
digest = sha256(apk.read_bytes()).hexdigest()
for index, line in enumerate(lines):
    if line.endswith(f"  {name}"):
        lines[index] = f"{digest}  {name}"
        break
else:
    raise SystemExit(f"{name} checksum entry is missing from {checksums}")
checksums.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

gh release upload "$tag" "$new_apk" "$checksums" --repo "$repo" --clobber
gh release download "$tag" --repo "$repo" --pattern Atlas-Android-arm64.apk --pattern SHA256SUMS.txt --dir "$work/verify"

python3 - "$work/verify/SHA256SUMS.txt" "$work/verify/Atlas-Android-arm64.apk" <<'PY'
from hashlib import sha256
from pathlib import Path
import sys

checksums = Path(sys.argv[1]).read_text(encoding="utf-8").splitlines()
apk = Path(sys.argv[2])
expected = next((line.split()[0] for line in checksums if line.endswith("  Atlas-Android-arm64.apk")), None)
actual = sha256(apk.read_bytes()).hexdigest()
if expected != actual:
    raise SystemExit(f"Published APK checksum mismatch: expected {expected}, got {actual}")
PY

"$apksigner" verify --print-certs "$work/verify/Atlas-Android-arm64.apk" | rg -q '7464a378a701bef4528f6ae3d2fbca709f6fd528ca24df2b3d600c016cb01ca0'
echo "Published and verified https://github.com/$repo/releases/download/$tag/Atlas-Android-arm64.apk (versionCode $new_code; replaced $old_code)."

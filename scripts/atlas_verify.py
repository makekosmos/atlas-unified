#!/usr/bin/env python3
"""Drive the Atlas Android app by accessibility labels over adb."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = "com.mundus.atlas.dev"
REMOTE_XML = "/sdcard/atlas-verify-window.xml"


def run(command: list[str], *, binary: bool = False) -> str | bytes:
    try:
        result = subprocess.run(command, capture_output=True, text=not binary, timeout=20)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"command timed out after 20s: {' '.join(command)}") from error
    if result.returncode:
        error = result.stderr if not binary else result.stderr.decode(errors="replace")
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(command)}\n{error}")
    return result.stdout


def adb(args: list[str], *, binary: bool = False) -> str | bytes:
    serial = os.environ.get("ANDROID_SERIAL")
    if not serial:
        raise RuntimeError("Set ANDROID_SERIAL to the isolated emulator serial, for example emulator-5556")
    return run(["adb", "-s", serial, *args], binary=binary)


def hierarchy() -> ET.Element:
    adb(["shell", "uiautomator", "dump", REMOTE_XML])
    output = adb(["shell", "cat", REMOTE_XML])
    if not isinstance(output, str):
        raise RuntimeError("uiautomator returned a binary hierarchy")
    return ET.fromstring(output)


def matches(label: str) -> list[ET.Element]:
    root = hierarchy()
    return [node for node in root.iter("node") if node.get("content-desc") == label or node.get("text") == label]


def wait_visible(label: str, timeout: float = 30) -> ET.Element:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        found = matches(label)
        if found:
            return found[0]
        # uiautomator owns a single process-wide accessibility connection; rapid
        # dumps can race its service registration on Android 15 emulators.
        time.sleep(2)
    raise RuntimeError(f"visible label not found after {timeout:g}s: {label!r}")


def tap_label(label: str, *, hold_ms: int = 0) -> None:
    found = matches(label)
    if len(found) != 1:
        raise RuntimeError(f"expected one clickable node for {label!r}, found {len(found)}")
    bounds = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", found[0].get("bounds", ""))
    if not bounds:
        raise RuntimeError(f"node has no usable bounds: {label!r}")
    left, top, right, bottom = map(int, bounds.groups())
    x, y = (left + right) // 2, (top + bottom) // 2
    if hold_ms:
        adb(["shell", "input", "swipe", str(x), str(y), str(x), str(y), str(hold_ms)])
    else:
        adb(["shell", "input", "tap", str(x), str(y)])
    print(f"action: {'long press' if hold_ms else 'tap'} {label!r} at {x},{y}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)
    install = sub.add_parser("install", help="install a built debug APK")
    install.add_argument("--apk", required=True)
    sub.add_parser("launch", help="launch Atlas and wait for its usable home screen")
    sub.add_parser("doctor", help="read-only check of the selected device and running Atlas build")
    for name in ("assert-visible", "assert-absent", "wait-visible", "tap", "long-press"):
        command = sub.add_parser(name)
        command.add_argument("--label", required=True)
        if name == "wait-visible":
            command.add_argument("--timeout", type=float, default=30)
    type_text = sub.add_parser("type", help="type into the currently focused field")
    type_text.add_argument("--text", required=True)
    capture = sub.add_parser("capture", help="save an emulator screenshot")
    capture.add_argument("--path", required=True)
    sub.add_parser("cleanup", help="stop only the Atlas debug package started by this run")
    args = parser.parse_args()

    try:
        if args.action == "install":
            apk = Path(args.apk).resolve(strict=True)
            adb(["install", "-r", str(apk)])
            print(f"installed {PACKAGE} from {apk}")
        elif args.action == "launch":
            adb(["shell", "am", "start", "-n", f"{PACKAGE}/com.mundus.atlas.MainActivity"])
            wait_visible("Открыть дневник", 45)
            print("ready: Atlas home exposes the Открыть дневник action")
        elif args.action == "doctor":
            serial = os.environ["ANDROID_SERIAL"]
            state = run(["adb", "-s", serial, "get-state"])
            if state.strip() != "device":
                raise RuntimeError(f"device is not ready: {state.strip()}")
            version = adb(["shell", "dumpsys", "package", PACKAGE])
            if not isinstance(version, str) or "versionName=" not in version:
                raise RuntimeError(f"{PACKAGE} is not installed")
            pid = adb(["shell", "pidof", PACKAGE])
            if not isinstance(pid, str) or not pid.strip():
                raise RuntimeError(f"{PACKAGE} is not running")
            match = re.search(r"versionName=([^\s]+)", version)
            print(f"device={serial} package={PACKAGE} version={match.group(1) if match else 'unknown'} pid={pid.strip()}")
            print("ready: " + (wait_visible("Открыть дневник", 10).get("content-desc") or "Atlas home is visible"))
        elif args.action == "assert-visible":
            node = wait_visible(args.label)
            print(f"visible: {args.label!r} bounds={node.get('bounds')}")
        elif args.action == "assert-absent":
            if matches(args.label):
                raise RuntimeError(f"label should be absent: {args.label!r}")
            print(f"absent: {args.label!r}")
        elif args.action == "wait-visible":
            node = wait_visible(args.label, args.timeout)
            print(f"visible: {args.label!r} bounds={node.get('bounds')}")
        elif args.action == "tap":
            tap_label(args.label)
        elif args.action == "long-press":
            tap_label(args.label, hold_ms=600)
        elif args.action == "type":
            if not args.text or re.search(r"[^A-Za-z0-9._-]", args.text):
                raise RuntimeError("type accepts ASCII letters, digits, dot, underscore, and hyphen only")
            adb(["shell", "input", "text", args.text])
            print(f"typed {len(args.text)} characters into the focused field")
        elif args.action == "capture":
            path = Path(args.path)
            path.parent.mkdir(parents=True, exist_ok=True)
            image = adb(["exec-out", "screencap", "-p"], binary=True)
            if not isinstance(image, bytes):
                raise RuntimeError("screencap returned text")
            path.write_bytes(image)
            print(f"screenshot saved: {path.resolve()}")
        elif args.action == "cleanup":
            adb(["shell", "am", "force-stop", PACKAGE])
            print(f"stopped only {PACKAGE}; emulator and evidence are preserved")
        return 0
    except (OSError, RuntimeError, KeyError, ET.ParseError) as error:
        print(f"atlas_verify: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

"""Nightly release versioning and archives (Python 3.11+, standard library only)."""

import argparse
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import tarfile
import tomllib


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def version_tuple(value):
    if not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", value):
        raise ValueError(f"Expected a stable MAJOR.MINOR.PATCH version, got {value!r}")
    return tuple(map(int, value.split(".")))


def next_version(current, previous, changed):
    current_parts = version_tuple(current)
    if previous is None:
        return current
    previous_parts = version_tuple(previous)
    if current_parts < previous_parts:
        raise ValueError(f"Cargo.toml version {current} is below released {previous}")
    if not changed:
        return None
    if current_parts > previous_parts:
        return current
    major, minor, patch = current_parts
    return f"{major}.{minor}.{patch + 1}"


def set_version(version, root=Path(".")):
    version_tuple(version)
    manifest_path, lock_path = root / "Cargo.toml", root / "Cargo.lock"
    manifest, lock = manifest_path.read_text("utf-8"), lock_path.read_text("utf-8")
    package = tomllib.loads(manifest)["package"]["name"]
    manifest, count = re.subn(
        r'(?ms)(^\[package\]\s*.*?^version\s*=\s*")[^"]+("[^\n]*)',
        lambda match: match[1] + version + match[2], manifest, count=1,
    )
    if count != 1:
        raise ValueError("Cannot find package version in Cargo.toml")
    lock, count = re.subn(
        rf'(?m)(^name = "{re.escape(package)}"\nversion = ")[^"]+("[^\n]*)',
        lambda match: match[1] + version + match[2], lock,
    )
    if count != 1:
        raise ValueError("Expected exactly one application package in Cargo.lock")
    assert tomllib.loads(manifest)["package"]["version"] == version
    assert next(p for p in tomllib.loads(lock)["package"] if p["name"] == package)["version"] == version
    manifest_path.write_text(manifest, encoding="utf-8", newline="\n")
    lock_path.write_text(lock, encoding="utf-8", newline="\n")


def plan():
    # Published releases, not tags, are the baseline: a failed publication can retry.
    pages = json.loads(run(
        "gh", "api", "--paginate", "--slurp",
        f"repos/{os.environ['GITHUB_REPOSITORY']}/releases?per_page=100",
    ))
    tags = [
        release["tag_name"] for page in pages for release in page
        if not release["draft"] and not release["prerelease"]
        and re.fullmatch(r"v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", release["tag_name"])
    ]
    previous_tag = max(tags, key=lambda tag: version_tuple(tag[1:]), default=None)
    changed = True
    if previous_tag:
        # Missing tags, rewritten history and Git errors must fail, never look like no changes.
        subprocess.run(["git", "merge-base", "--is-ancestor", previous_tag, "HEAD"], check=True)
        diff = subprocess.run(["git", "diff", "--quiet", previous_tag, "HEAD", "--"])
        if diff.returncode not in (0, 1):
            diff.check_returncode()
        changed = diff.returncode == 1
    current = tomllib.loads(Path("Cargo.toml").read_text("utf-8"))["package"]["version"]
    version = next_version(current, previous_tag[1:] if previous_tag else None, changed)
    values = {"version": version or "", "release": str(version is not None).lower(), "sha": run("git", "rev-parse", "HEAD"), "previous_tag": previous_tag or ""}
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        for key, value in values.items():
            print(f"{key}={value}", file=output)
    print(f"Release v{version}" if version else "No changes since the last release")


def package(target):
    version = tomllib.loads(Path("Cargo.toml").read_text("utf-8"))["package"]["version"]
    version_tuple(version)
    dist = Path("dist")
    dist.mkdir(exist_ok=True)
    name = f"atlas-{version}-{target}"
    target_dir = Path(os.environ.get("CARGO_TARGET_DIR", "target"))
    binary = target_dir / target / "release" / ("atlas.exe" if "windows" in target else "atlas")
    if "windows" in target:
        subprocess.run(
            ["makensis", f"-DOUT={dist / 'Atlas-Setup.exe'}", f"-DEXE={binary}",
             f"-DVERSION={version}", str(Path(__file__).resolve().parent / "atlas.nsi")],
            check=True,
        )
    elif "apple" in target:
        app = dist / "Atlas.app"
        contents = app / "Contents"
        (contents / "MacOS").mkdir(parents=True, exist_ok=True)
        executable = contents / "MacOS" / "atlas"
        shutil.copy2(binary, executable)
        executable.chmod(0o755)
        # CFBundleIconFile + Contents/Resources/atlas.icns — without them the
        # app shows the generic blank icon. windows/app-icon.png is already
        # squircle-masked full-canvas art, so sips + iconutil suffice.
        iconset = dist / "atlas.iconset"
        iconset.mkdir(exist_ok=True)
        for size in (16, 32, 128, 256, 512):
            for scale, pixels in ((1, size), (2, size * 2)):
                icon_name = f"icon_{size}x{size}{'@2x' if scale == 2 else ''}.png"
                subprocess.run(
                    ["sips", "-z", str(pixels), str(pixels), "windows/app-icon.png",
                     "--out", str(iconset / icon_name)],
                    check=True, capture_output=True,
                )
        resources = contents / "Resources"
        resources.mkdir(exist_ok=True)
        subprocess.run(
            ["iconutil", "-c", "icns", str(iconset), "-o", str(resources / "atlas.icns")],
            check=True,
        )
        shutil.rmtree(iconset)
        with (contents / "Info.plist").open("wb") as plist:
            plistlib.dump({
                "CFBundleName": "Atlas", "CFBundleDisplayName": "Atlas",
                "CFBundleIdentifier": "com.mundus.atlas",
                "CFBundleExecutable": "atlas", "CFBundlePackageType": "APPL",
                "CFBundleIconFile": "atlas",
                "CFBundleShortVersionString": version, "CFBundleVersion": version,
                "NSHighResolutionCapable": True,
            }, plist)
        subprocess.run(["codesign", "--force", "--deep", "--sign", "-", str(app)], check=True)
        root = dist / "dmg-root"
        shutil.rmtree(root, ignore_errors=True)
        root.mkdir()
        shutil.copytree(app, root / "Atlas.app", symlinks=True)
        (root / "Applications").symlink_to("/Applications")
        subprocess.run(
            ["hdiutil", "create", "-volname", "Atlas", "-srcfolder", str(root),
             "-ov", "-format", "UDZO", str(dist / "Atlas.dmg")],
            check=True,
        )
        shutil.rmtree(root)
    else:
        with tarfile.open(dist / f"{name}.tar.gz", "w:gz") as archive:
            archive.add(binary, arcname=binary.name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("plan")
    commands.add_parser("set").add_argument("version")
    commands.add_parser("package").add_argument("target", choices=[
        "x86_64-pc-windows-msvc", "x86_64-unknown-linux-gnu", "aarch64-apple-darwin",
    ])
    args = parser.parse_args()
    if args.command == "plan":
        plan()
    elif args.command == "set":
        set_version(args.version)
    else:
        package(args.target)

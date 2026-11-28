<div align="center">

# Atlas

A native journal, notes, and tasks app for [Mundus](https://github.com/ksanrse/mundus).

![release](https://shieldcn.dev/github/ksanrse/atlas/release.svg?variant=secondary&size=sm)
![ci](https://shieldcn.dev/github/ksanrse/atlas/ci.svg?variant=secondary&size=sm)
![rust](https://shieldcn.dev/badge/rust-stable-black.svg?variant=secondary&size=sm&logo=rust)
![gpui](https://shieldcn.dev/badge/ui-GPUI%20%2B%20NSH-black.svg?variant=secondary&size=sm&logo=false)

</div>

---

## Overview

Atlas is a client app. It keeps no database of its own. It reads and writes all data through the local Mundus Engine API, and the Engine owns storage, the OS, and sync.

- **Journal.** A stream of entries.
- **Notes and tasks.** Over the same Mundus data.
- **Native UI.** Rust and GPUI, with screens written in TSX through NSH.

## Download

Nightly builds are published to [GitHub Releases](https://github.com/ksanrse/atlas/releases/latest):

- **Windows x86_64:** a ZIP and an installer.
- **macOS Apple Silicon:** `Atlas.app` in a `.tar.gz`, ad-hoc signed.
- **Android:** an APK.

Atlas needs a running Mundus Engine. Without one, it shows a "not connected" banner.

## Development

Run the Engine from the `mundus` repo, then point Atlas at the same data folder:

```sh
# in mundus
pnpm run dev -- --engine-only --data-dir /tmp/mundus-dev

# in atlas
MUNDUS_DATA_DIR=/tmp/mundus-dev cargo run
```

To run without an Engine, with demo data and UI hot reload:

```sh
pnpm demo
```

Contributor and agent rules are in [`AGENTS.md`](AGENTS.md).

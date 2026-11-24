// The whole cargo part of the pre-commit hook, in one process.
//
// hk runs the steps of a hook concurrently, and two cargo builds at once are not
// safe here: the cargo fork keeps intermediates in `~/.cargo/targets/shared-deps`
// and gpui-fast-windows' build script (0.1.14) appends to its generated
// `out/shaders_bytes.rs` after an `exists()` check instead of truncating it. Two
// builds that both miss the file each append a full set of shader constants, so
// the workspace stops compiling with
//
//   error[E0428]: the name `QUAD_VERTEX_BYTES` is defined multiple times
//
// Dropping a corrupted binding file first (the next build regenerates it) and
// running the gate and the compile check one after another keeps commits working.
import { spawnSync } from "node:child_process";
import { globSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const shaderBuildDir = join(
  homedir(),
  ".cargo",
  "targets",
  "shared-deps",
  "debug",
  "build",
  "gpui-fast-windows",
);

function dropCorruptShaderBindings() {
  let bindings = [];
  try {
    bindings = globSync("*/build/script/out/shaders_bytes.rs", {
      cwd: shaderBuildDir,
    });
  } catch {
    return; // no build yet
  }
  for (const rel of bindings) {
    const path = join(shaderBuildDir, rel);
    const text = readFileSync(path, "latin1");
    const duplicated = text.split("const QUAD_VERTEX_BYTES").length > 2;
    if (duplicated || text.includes("\u0000")) {
      rmSync(path);
      console.log(
        `removed a corrupted ${rel}; the next cargo build recreates it`,
      );
    }
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

dropCorruptShaderBindings();
// Warns past 300 lines, fails past 500 (src/bin/check-source-size.rs).
run("cargo", ["run", "-q", "--bin", "check-source-size"]);
run("cargo", ["check", "--quiet"]);

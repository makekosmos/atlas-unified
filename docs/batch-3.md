# Atlas batch 3 integration

Atlas owns its schemas and uses Cortex's generic object operations and live events. Merge Cortex [PR #290](https://github.com/makekosmos/cortex/pull/290) before this Atlas change. Neither PR is merged as part of this work.

## Contract

- Atlas registers `com.mundus.atlas.task`, `com.mundus.atlas.project`, and `com.mundus.atlas.journal` at version `0.1.0`, with `appId` `com.mundus.atlas`.
- Schemas live in `src/store/types/`. Registration precedes non-demo loads and writes. Registration failures are retried.
- Reads include legacy tasks, projects, and journal-marked notes. Updates preserve existing type IDs. New objects use Atlas-owned types.
- All requests pass through `Engine::rpc`. Operation names live in `src/store/ops.rs`.
- Task saves read `objects.snapshot` before reading the object and send `expectedSnapshot` to `objects.upsert`. This also satisfies the legacy `core.task` optimistic-write guard. Conflicts remain errors rather than overwriting concurrent edits.
- WebSocket discovery uses the same lock directory as RPC. Authentication uses API `1.0.0`, the lock token, and the client PID. No events are accepted before `hello_ok`.
- Object and link events invalidate authoritative snapshots. Subscriptions reconnect with bounded backoff, invalidate after greeting, and reload every 30 seconds to recover from silent server broadcast lag. Pending reloads are coalesced.
- Dropping the consumer cancels its live subscription. Demo mode starts neither the task Engine worker nor the journal Engine worker.

## Run the integration test

Start `cortex-batch3/target/debug/mundus-engine.exe` from Cortex branch `refactor/cortex-batch-3`, with `MUNDUS_DATA_DIR` pointing to an isolated test directory. The verified Cortex source revision is `b1f58b9ab225eab97860b28915cf543e2d0f994c`.

In Atlas, point `ATLAS_E2E_DATA_DIR` to the same directory and run:

```text
cargo test --bin atlas engine_e2e -- --ignored --nocapture
```

The test repeats schema registration, edits a legacy task without changing its type, creates an Atlas-owned task, and reads both back. A separate authenticated WebSocket waits for `hello_ok` before writes. The test checks the exact new object's event ID, its type, and Atlas's type filter, so greeting and repair notifications cannot satisfy the assertion. Unique IDs allow repeated runs. It deletes only the objects it creates, using their snapshots.

## Verification record

- Real Engine integration test passed twice against the isolated data directory.
- `cargo nextest run --workspace --all-features` passed 77 tests, with two ignored tests skipped. The Engine integration test is one of those ignored tests and was run separately.
- Clippy passed for all targets and features with warnings denied.
- Formatting and the source-size gate passed. The existing `ui/JournalPage.tsx` exception remains at 364 lines.
- `cargo deny check advisories bans sources` passed. `cargo shear` reported three pre-existing unlinked files, `src/native_shell.rs`, `src/navigation.rs`, and `src/nsh_bridge/macos.rs`.
- Automated socket tests cover filtering, greeting acceptance and rejection, idle timeouts, subscription cancellation, and retry cancellation.

- `nsh test .` in `ui/` passed all 26 tests.
- `nsh check .` reports three `color` style type errors at `AtlasAppearanceSettings.tsx:39`, `AtlasAppearanceSettings.tsx:149`, and `chrome.tsx:191`. Running the same check on the `4b93f49` UI with the same installed dependencies reproduces the same three errors. No UI source changes are included here.

These checks verify the transport and store integration. They do not constitute a manual desktop UI walkthrough or Linux and macOS runtime verification.

## Existing recurrence limitation

Review also identified an existing failure path in `Engine::save_with_next`. If Engine becomes unavailable between completing an occurrence and creating its successor, failed readback can abandon recovery and leave no next occurrence. The same code exists before batch 3. This change does not make those two writes atomic or retain unresolved mutations across reconnects. Recurrence recovery needs a separate change and a failure-injection test; live invalidation does not solve it.


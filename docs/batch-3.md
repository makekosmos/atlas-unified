# Atlas batch 3 integration

Atlas owns its schemas and uses Cortex's generic object operations and live events. Merge Cortex [PR #290](https://github.com/makekosmos/cortex/pull/290) before Atlas [PR #4](https://github.com/makekosmos/atlas-unified/pull/4). Both remain draft. Neither PR is merged as part of this work.

## Review follow-up

The original steps 9–11 remain unchanged in history. Commit `390ff80` (`fix: close Atlas batch 3 review leftovers`) closes all five requested follow-ups.

| Review item | Commit | Change |
| --- | --- | --- |
| 1. Busy storage drops edits | `390ff80` | Queue full mutations and drain after the current reply. |
| 2. Process-wide registration flag | `390ff80` | Cache success for the discovered directory and lock token. |
| 3. Recurrence recovery | `390ff80` | Confirm the successor or attempt guarded rollback without an early readback exit. |
| 4. Snapshot test fake | `390ff80` | Return `exists`, `typeId`, `typeVersion`, and `revision`, and validate guards against them. |
| 5. UI style type errors | `390ff80` | Use supported hover text-color classes at the three existing sites, with the same colors. |

### Pending edits

When storage is ready but a load or save is busy, `save_todo` retains the complete `Mutation`, including `before`, `todo`, and `next`. Different task IDs remain FIFO. A new mutation for an already pending task replaces that entry in place, keeping its queue position and its latest intent.

`on_storage_reply` first handles the reply, including `load_snapshot`, and then sends the next queued mutation through the existing `Command::Save` path. Queued saves run before another dirty reload. Their original `before` values are not rebased onto the loaded snapshot. A concurrent server edit therefore follows the existing conflict and reload path. Storage that is not ready still rejects edits with a visible error. Demo saves remain immediate and Engine-free.

### Registration identity

The registration cache records the resolved data directory and the current lock's `auth_token`, rather than a process-wide boolean. A different identity triggers all three registrations again. A mutex serializes cache lookup, registration, and publication. Failed registrations remain uncached and retry on the next call. The identity is checked again after the batch, so an Engine restart during registration cannot cache an incomplete batch as successful.

### Recurrence recovery

`save_with_next` still performs two writes. If the successor write fails, it reads and decodes the successor, including its project links. An exact match confirms a lost acknowledgement and returns success. A confirmed different successor returns a partial-application error without rolling back the original.

If the successor is absent, or its readback or decoding fails, Atlas attempts `save(Some(todo), before)` to restore the original occurrence. This uses the existing concurrency guards. Failed rollback returns an explicit partial-application error. Successful rollback still returns an error for the failed recurrence operation. If readback failed, that error also states that the successor may exist. There is no distributed transaction or persisted recovery log.

## Preserved contract

- Atlas registers `com.mundus.atlas.task`, `com.mundus.atlas.project`, and `com.mundus.atlas.journal` at version `0.1.0`, with `appId` `com.mundus.atlas`.
- Schemas live in `src/store/types/`. Registration precedes non-demo loads and writes.
- Reads include legacy tasks, projects, and journal-marked notes. Updates preserve existing type IDs. New objects, including the next occurrence of a legacy task, use Atlas-owned types.
- All requests pass through `Engine::rpc`. Dotted operation names live in `src/store/ops.rs`. No legacy operation names or wire key `type_id` were restored.
- Task saves read `objects.snapshot` before reading the object and send `expectedSnapshot` to `objects.upsert`. This satisfies the legacy `core.task` optimistic-write guard without changing Engine.
- WebSocket discovery uses the same lock directory as RPC. Authentication uses API `1.0.0`, the lock token, and the client PID. No events are accepted before `hello_ok`.
- The task worker and journal bridge keep separate subscriptions through `store::live`. Object and link events invalidate authoritative snapshots. Reconnects and the 30-second reload remain unchanged because Engine broadcast lag has no explicit signal.
- Consumer lifetime owns subscription cancellation. Demo mode starts neither the task Engine worker nor the journal Engine worker.
- `X-Kosmos-*` headers and legacy discovery fallbacks remain unchanged. No Cortex source, fixtures, PR state, or history was changed in this follow-up. SQLite, focus, and mobile paths are outside its scope.

## Run the integration test

The integration test requires an already running Engine from Cortex branch `refactor/cortex-batch-3`, using an isolated data directory. The verified Cortex source revision is `b1f58b9ab225eab97860b28915cf543e2d0f994c`.

In Atlas, point `ATLAS_E2E_DATA_DIR` to that directory and run:

```text
cargo test --bin atlas engine_e2e -- --ignored --nocapture
```

The test repeats schema registration, edits a legacy task without changing its type, creates an Atlas-owned task, and reads both back. A second authenticated WebSocket waits for `hello_ok` before writes. It checks the exact new object's event ID and type, so greeting and repair notifications cannot satisfy the assertion. Unique IDs allow repeated runs. Cleanup deletes only test-created objects, using their snapshots.

## Verification record

After the review fixes:

- `cargo nextest run --workspace --all-features` passed 88 tests, with two ignored tests skipped.
- New regression tests cover edits during load and save, FIFO and same-ID replacement, server conflicts, not-ready rejection, and immediate demo saves.
- Registration tests verify that changing the lock token triggers another complete registration batch.
- Six injected recurrence cases cover absent successor, failed object readback, failed project-link readback, failed rollback, confirmed lost acknowledgement, and a differing existing successor.
- Workspace all-target/all-feature clippy passed with `-D warnings`. Formatting and the source-size gate passed. The existing `ui/JournalPage.tsx` exception remains at 364 lines.
- `nsh check .` passed. `nsh test .` passed all 26 tests.
- The real Engine integration test passed again after the fixes, against the existing isolated Engine. No Engine restart or Cortex modification was needed.
- Normal commits were used. No hook bypass was needed.

These checks do not constitute a manual desktop visual comparison or Linux and macOS runtime verification. The UI change uses the supported NSH hover-color API without changing color values, layout, or screen structure.

# Journal and native shell run

## Figure it out
- [x] Read the Principles section of the poteto-mode skill.
- [x] Phase A: Frame the objective and blockers.
- [x] Phase B: Design the workflow before code.
- [x] Phase C: Run small verified units.
- [x] Phase D: Keep the decision trail current.
- [x] Phase E: Verify the real product against the finish predicate.

## Feature playbook
- [x] `how` over the affected subsystem.
- [x] `architect` for parallel design exploration.
- [x] Blocking first steps. Verify rules, baseline, branch and dependencies before fan-out.
- [x] Independent workstreams. Name what can run separately and isolate writers.
- [x] Shared mutable state. Split writers by worktree; serialize only shared invariants.
- [x] Smallest safe decomposition. Name why one owner or each delegate is needed.
- [x] Delegate code-writing to a subagent using the configured feature model, with a precise scope and acceptance criteria.
- [x] Verify on the matching surface.
- [x] Rebase into small, ordered commits.
- [ ] If the design is contested, run `interrogate` before shipping.
- [x] Run the Opening a PR playbook.

## Architect
- [x] Ground the existing app, Engine, Imago shell and navigation contracts.
- [x] Sketch caller usage, data shapes, signatures and module ownership.
- [x] Synthesize viable candidates and screen them against design red flags.
- [x] Implement against the accepted sketch; reconcile any deviations.
- [ ] Scrap and redesign only if implementation shows the shape is wrong.

## Designed units
- [x] Capture baseline and build an isolated journal Engine transport test harness.
- [x] Implement note parsing, legacy migration-read compatibility and conditional writes.
- [x] Slim TSX navigation and add journal/task workflows using one shared navigation source.
- [x] Add the macOS AppKit shell and non-macOS GPUI-host cfg path.
- [x] Run macOS checks serially with `CARGO_BUILD_JOBS=4`; run live Engine workflow; capture requested screenshots.
- [ ] Push branch, inspect Ubuntu/Windows CI, and open a draft PR without merging.

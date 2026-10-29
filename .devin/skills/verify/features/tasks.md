# Tasks

## Sub-features

- `ui/navigation.json` marks tasks `devOnly`; `ui/state.ts` refuses a task route when `devFeatures` is false.
- `ui/App.tsx` renders task rows and a create dialog; host command handlers provide persistence.
- Android `AtlasBridge` filters the task route outside debug but supplies empty task data and has no create/complete task handler.
- Production mobile home has no task card. Desktop development navigation can expose the route.

## How to get to it (user POV)

On desktop development builds, choose “Задачи”. The production Atlas UI hides this development-only feature. It is not a working Android user feature today.

## Driving it with the Atlas ADB harness

Do not use the Android task route as proof of task business logic: the mobile bridge has no task operations or data. For desktop, verify Engine-backed list/create/complete through a development build and inspect `src/nsh_bridge/macos.rs` before relying on command coverage.

## Gotchas

- A developer-only flag controls visibility and routing; it does not implement persistence.
- The shared UI offers create and complete actions, so verify the host commands rather than inferring implementation from the controls.

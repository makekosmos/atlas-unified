# Atlas feature map

Atlas has one shared journal UI (`ui/JournalPage.tsx`) and one shared journal model (`ui/journal-model.ts`). The host differs by platform: macOS uses the Cortex Engine bridge in `src/nsh_bridge/macos.rs`; Android uses the Kotlin `AtlasBridge` and Rust `AtlasMobileEngine`. See each feature page for exact flows and platform gaps.

| Feature | Business logic / data owner | UI and current status | Android | macOS desktop |
|---|---|---|---|---|
| Journal | Engine `src/store/journal.rs`; mobile FFI under `android/rust`; desktop Cortex RPC | Shared timeline, date grouping, composer, edit/delete/copy in `ui/JournalPage.tsx` | Create/list/update/delete through real mobile Engine | Create/list/update/delete through Engine/RPC |
| Appearance | Cortex appearance service on desktop; local NSH storage on mobile | `ui/AtlasAppearanceSettings.tsx`, token resolution in `ui/state.ts` | Local overrides in `Storage`, default/current hard-coded by bridge | Loads and patches Engine appearance RPC |
| Tasks | Desktop Engine task RPC/store; see desktop task bridge | Development-only route flag in `ui/navigation.json`; route and task rows in `ui/App.tsx` | Not shown in mobile navigation; debug guard exists, but Android bridge returns empty tasks and does not implement task operations | Development route and task list; create/complete commands are exposed by UI, confirm backend support before relying on them |
| Search | No business/search implementation found | Shortcut preference row (`mod+k`) exists; no binding or search screen | Absent | Absent |
| Sync | `engine-mobile` exposes `start_sync`, `stop_sync`, status, and pairing APIs; Atlas does not export or call them | Settings displays “Ожидает подключения”; placeholder only | No sync commands or status bridge | No Atlas sync status surfaced |
| Calendar | Date grouping shared, interactive calendar is presentation-only | Desktop timeline calendar in `ui/JournalPage.tsx`; product asked to hide mobile | Hidden | Present |

The feature UI is not the source of truth for journal persistence. The Android bridge owns platform access/clipboard/window integration but delegates journal operations to Engine. Shared business behavior should remain in Engine and shared formatting/model code; platform differences should stay in host setup and presentation.

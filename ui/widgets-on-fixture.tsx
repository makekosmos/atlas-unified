import { Storage } from "nsh";

// Tests that open a hidden page turn its widget on before the app reads the
// choice. A fresh install leaves tasks and games off.
await Storage.setItem(
  "mundus.atlas.widgets.v1",
  JSON.stringify({ journal: true, notes: true, tasks: true, games: true }),
);
await import("./App.tsx");

import { setTheme } from "nsh";

/// The app's palette, handed to NSH's own theme: what NSH draws for itself — a
/// table's grips and cell selection, a scroll bar, a menu, a switch — reads
/// shadcn's tokens, not the page's colours. Left alone, those wear the shared
/// `imago-nsh` theme (whose `primary` is violet), which is why a table lit up
/// violet while the accent was blue.
///
/// The host sends the palette as `nshTheme` (both appearances, shadcn's shape);
/// applying it here means the accent picked in the settings reaches every
/// component at once.
let applied = "";

export function applyShellTheme(theme: unknown) {
  if (!theme || typeof theme !== "object") return;
  if (typeof setTheme !== "function") return;
  const json = JSON.stringify(theme);
  if (json === applied) return;
  applied = json;
  setTheme(theme as Parameters<typeof setTheme>[0]);
}

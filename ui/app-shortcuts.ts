import { signal, Storage } from "nsh";

export const shortcutNames = ["sidebar", "create", "search", "reload"] as const;
export type ShortcutName = typeof shortcutNames[number];
type Shortcuts = Record<ShortcutName, string>;
const defaultShortcuts: Shortcuts = { sidebar: "mod+b", create: "mod+n", search: "mod+k", reload: "mod+r" };
export const shortcutOptions: Record<ShortcutName, string[]> = {
  sidebar: ["mod+b", "mod+shift+b"],
  create: ["mod+n", "mod+shift+n"],
  search: ["mod+k", "mod+shift+k"],
  reload: ["mod+r", "mod+shift+r"],
};
export const shortcuts = signal<Shortcuts>(defaultShortcuts);
void Storage.getItem("mundus.atlas.shortcuts.v1").then((value) => {
  if (!value) return;
  try {
    const saved = JSON.parse(value) as Partial<Shortcuts>;
    shortcuts.set(Object.fromEntries(shortcutNames.map((name) => [name, shortcutOptions[name].includes(saved[name] ?? "") ? saved[name] : defaultShortcuts[name]])) as Shortcuts);
  } catch { /* A damaged preference falls back to the defaults. */ }
});

export function cycleShortcut(name: ShortcutName) {
  const current = shortcuts();
  const choices = shortcutOptions[name];
  const next = choices[(choices.indexOf(current[name]) + 1) % choices.length];
  const updated = { ...current, [name]: next };
  shortcuts.set(updated);
  void Storage.setItem("mundus.atlas.shortcuts.v1", JSON.stringify(updated));
}

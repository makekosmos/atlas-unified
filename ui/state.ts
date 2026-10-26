import { defaultColors } from "@makekosmos/imago-nsh";
import type { Appearance, ThemeColors } from "@makekosmos/imago-nsh";

export type Route = "journal" | "tasks" | "settings";
export type Todo = { id: string; title: string; is_completed: boolean; scheduled_date?: string; notes?: string };
export type JournalEntry = { id: string; text: string; createdAt: string };
export type AtlasTheme = { key: string; name: string; light: ThemeColors; dark: ThemeColors };
export type Snapshot = { route: Route; title: string; todos: Todo[]; journalEntries: JournalEntry[]; version: string; appearance?: Appearance; appearanceEditable: boolean; themes: AtlasTheme[]; colors: ThemeColors; sidebarVisible: boolean; chrome: "native" | "tsx" };

export const fallback: Snapshot = { route: "journal", title: "Дневник", todos: [], journalEntries: [], version: "", appearance: { settings: { mode: "dark", light_theme: "default", dark_theme: "default", accent_source: "theme", material: "default", font_size: 13, font_family: "Inter" }, policy: { following: false }, capabilities: { materials: ["default", "frosted", "mica"], wallpaper_accent: false } }, appearanceEditable: false, themes: [
  { key: "default", name: "Default", light: defaultColors, dark: defaultColors },
  { key: "claude", name: "Claude", light: defaultColors, dark: defaultColors },
  { key: "graphite", name: "Graphite", light: defaultColors, dark: defaultColors },
], colors: defaultColors, sidebarVisible: true, chrome: "tsx" };

export function resolveAppearanceColors(appearance: Appearance, themes: AtlasTheme[], fallbackColors: ThemeColors): ThemeColors {
  const settings = appearance.settings;
  const dark = settings.mode !== "light";
  const themeKey = dark ? settings.dark_theme : settings.light_theme;
  const themeColors = themes.find((theme) => theme.key === themeKey)?.[dark ? "dark" : "light"] ?? fallbackColors;
  return {
    ...themeColors,
    accent: settings.accent_source === "custom" && settings.accent_color ? settings.accent_color : themeColors.accent,
  };
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== "object" || value === null || !("route" in value) || !isRoute(value.route)) return false;
  if (!("title" in value) || typeof value.title !== "string" || !("todos" in value) || !Array.isArray(value.todos)) return false;
  if (!value.todos.every(isTodo) || !("journalEntries" in value) || !Array.isArray(value.journalEntries) || !value.journalEntries.every(isJournalEntry)) return false;
  return "version" in value && typeof value.version === "string"
    && "appearanceEditable" in value && typeof value.appearanceEditable === "boolean"
    && "themes" in value && Array.isArray(value.themes)
    && "colors" in value && isColors(value.colors)
    && "sidebarVisible" in value && typeof value.sidebarVisible === "boolean"
    && "chrome" in value && (value.chrome === "native" || value.chrome === "tsx");
}

export function isRoute(value: unknown): value is Route {
  return value === "journal" || value === "tasks" || value === "settings";
}

function isTodo(value: unknown): value is Todo {
  return typeof value === "object" && value !== null
    && "id" in value && typeof value.id === "string"
    && "title" in value && typeof value.title === "string"
    && "is_completed" in value && typeof value.is_completed === "boolean";
}

function isJournalEntry(value: unknown): value is JournalEntry {
  return typeof value === "object" && value !== null
    && "id" in value && typeof value.id === "string"
    && "text" in value && typeof value.text === "string"
    && "createdAt" in value && typeof value.createdAt === "string";
}

function isColors(value: unknown): value is ThemeColors {
  if (typeof value !== "object" || value === null) return false;
  return "background" in value && typeof value.background === "string"
    && "foreground" in value && typeof value.foreground === "string"
    && "muted" in value && typeof value.muted === "string"
    && "border" in value && typeof value.border === "string"
    && "accent" in value && typeof value.accent === "string"
    && "card" in value && typeof value.card === "string";
}

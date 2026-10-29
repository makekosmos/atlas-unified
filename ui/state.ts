import type { Appearance, ThemeColors } from "@makekosmos/imago-nsh";
import { previewThemes, systemAccent } from "./themes";

export type Route = "home" | "journal" | "tasks" | "settings" | "connection";
export type Todo = { id: string; title: string; is_completed: boolean; scheduled_date?: string; notes?: string };
export type JournalEntry = { id: string; text: string; createdAt: string };
export type SyncPeer = { device_id: string; device_name?: string | null; last_seen?: string | null; status?: string | null; platform?: string | null; app_version?: string | null };
export type IncomingPairing = { device_id: string; device_name?: string | null; platform?: string | null; app_version?: string | null };
export type SyncSnapshot = { running: boolean; transport?: string | null; peers: SyncPeer[]; local_device?: { device_id: string; device_name?: string | null } | null; incoming_pairing_requests: IncomingPairing[]; outgoing_pairing?: { status: string; expires_in_ms?: number | null } | null; own_iroh_ticket?: string | null; error?: string | null };
export type AtlasTheme = { key: string; name: string; light: ThemeColors; dark: ThemeColors };
export type Snapshot = { route: Route; title: string; todos: Todo[]; journalEntries: JournalEntry[]; version: string; appearance?: Appearance; appearanceEditable: boolean; themes: AtlasTheme[]; colors: ThemeColors; sidebarVisible: boolean; devFeatures: boolean; chrome: "native" | "tsx" | "mobile"; connection?: SyncSnapshot };

export const fallback: Snapshot = { route: "journal", title: "Дневник", todos: [], journalEntries: [], version: "", appearance: { settings: { mode: "dark", light_theme: "default", dark_theme: "default", accent_source: "theme", material: "default", font_size: 13, font_family: "Inter" }, policy: { following: false }, capabilities: { materials: ["default", "frosted", "mica"], wallpaper_accent: false } }, appearanceEditable: false, themes: previewThemes, colors: previewThemes[0].dark, sidebarVisible: true, devFeatures: true, chrome: "tsx" };

export function resolveAppearanceColors(appearance: Appearance, themes: AtlasTheme[], fallbackColors: ThemeColors): ThemeColors {
  const settings = appearance.settings;
  const dark = settings.mode !== "light";
  const theme = themes.find((item) => item.key === "default") ?? themes[0];
  const themeColors = theme?.[dark ? "dark" : "light"] ?? fallbackColors;
  if (settings.accent_source === "wallpaper") return { ...themeColors, accent: fallbackColors.accent };
  const custom = settings.accent_source === "custom" ? systemAccent(settings.accent_color, dark) : undefined;
  return { ...themeColors, accent: custom ?? themeColors.accent };
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
    && "devFeatures" in value && typeof value.devFeatures === "boolean"
    && (value.route !== "tasks" || value.devFeatures)
    && "chrome" in value && (value.chrome === "native" || value.chrome === "tsx" || value.chrome === "mobile");
}

export function canNavigateToRoute(route: Route, devFeatures: boolean): boolean {
  return route !== "tasks" || devFeatures;
}

export function isRoute(value: unknown): value is Route {
  return value === "home" || value === "journal" || value === "tasks" || value === "settings" || value === "connection";
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

import { signal, Storage } from "nsh";

/// What the sidebar shows under the widgets: the last things opened, newest
/// first. It is the app's own memory of the session, not a fact about the data,
/// so it lives in the app's storage and never in Engine. Pages stay out: the
/// list answers "which note was that", not "which tab was I on".

/// Only things a person opens in particular: a note, a game. A widget's page
/// is a way in, not a thing, so it never lands here.
export type RecentKind = "note" | "game";

export type RecentItem = { kind: RecentKind; id: string; title: string; at: number };

/** How many entries the list keeps. */
export const RECENT_LIMIT = 10;

const STORAGE_KEY = "mundus.atlas.recent.v1";
const items = signal<RecentItem[]>([]);
let stamp = 0;

export function recent(): RecentItem[] {
  return items();
}

export function loadRecent() {
  const at = stamp;
  void Storage.getItem(STORAGE_KEY).then((value) => {
    if (at !== stamp) return;
    items.set(readJson(value));
  });
}

/// Puts an entry on top, taking it out of the place it held before.
export function rememberRecent(entry: { kind: RecentKind; id: string; title: string }) {
  const title = entry.title.trim();
  if (!title) return;
  const next = [{ ...entry, title, at: Date.now() }, ...items().filter((item) => !(item.kind === entry.kind && item.id === entry.id))].slice(0, RECENT_LIMIT);
  items.set(next);
  stamp += 1;
  void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/// A note that is gone takes its entry with it, so the list never lies.
export function forgetRecent(kind: RecentKind, id: string) {
  const next = items().filter((item) => !(item.kind === kind && item.id === id));
  if (next.length === items().length) return;
  items.set(next);
  stamp += 1;
  void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function readJson(value: string | null): RecentItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RecentItem => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Partial<RecentItem>;
      return (entry.kind === "note" || entry.kind === "game") && typeof entry.id === "string" && typeof entry.title === "string";
    }).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

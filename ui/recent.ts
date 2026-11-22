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
let staged: { kind: RecentKind; id: string; title: string } | null = null;
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

/// Marks an entry as currently open without reordering it if it is already
/// listed, so the sidebar does not jump while the user is on that page.
/// Call `commitRecent` when leaving the page to move it to the top.
export function stageRecent(entry: { kind: RecentKind; id: string; title: string }) {
  const title = entry.title.trim();
  if (!title) return;
  staged = { kind: entry.kind, id: entry.id, title };
  const list = items();
  const index = list.findIndex((item) => item.kind === entry.kind && item.id === entry.id);
  if (index === -1) {
    const next = [{ ...entry, title, at: Date.now() }, ...list].slice(0, RECENT_LIMIT);
    items.set(next);
    stamp += 1;
    void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else if (list[index].title !== title) {
    const next = list.map((item, i) => (i === index ? { ...item, title } : item));
    items.set(next);
    stamp += 1;
    void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

/// Promotes the staged entry to the top of the list once the user leaves its page.
export function commitRecent(entry?: { kind: RecentKind; id: string; title?: string }) {
  const pending = staged;
  if (!pending) return;
  if (entry && (entry.kind !== pending.kind || entry.id !== pending.id)) return;
  staged = null;
  const title = entry?.title?.trim() || pending.title;
  rememberRecent({ kind: pending.kind, id: pending.id, title });
}

/// A note that is gone takes its entry with it, so the list never lies.
export function forgetRecent(kind: RecentKind, id: string) {
  if (staged && staged.kind === kind && staged.id === id) staged = null;
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

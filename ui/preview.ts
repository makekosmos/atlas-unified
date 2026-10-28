import { Storage } from "nsh";
import type { JournalEntry, Todo } from "./state";

export const PREVIEW_STORAGE_KEY = "mundus.atlas.preview.v1";

export type PreviewStore = {
  journalEntries: JournalEntry[];
  todos: Todo[];
};

export function persistPreview(store: PreviewStore) {
  void Storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(store));
}

export function loadPreview(): Promise<PreviewStore | null> {
  return Storage.getItem(PREVIEW_STORAGE_KEY).then((value) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      return isPreviewStore(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });
}

function isPreviewStore(value: unknown): value is PreviewStore {
  if (typeof value !== "object" || value === null) return false;
  if (!("journalEntries" in value) || !Array.isArray(value.journalEntries)) return false;
  if (!("todos" in value) || !Array.isArray(value.todos)) return false;
  return value.journalEntries.every(isJournalEntry) && value.todos.every(isTodo);
}

function isJournalEntry(value: unknown): value is JournalEntry {
  return typeof value === "object" && value !== null
    && "id" in value && typeof value.id === "string"
    && "text" in value && typeof value.text === "string"
    && "createdAt" in value && typeof value.createdAt === "string";
}

function isTodo(value: unknown): value is Todo {
  return typeof value === "object" && value !== null
    && "id" in value && typeof value.id === "string"
    && "title" in value && typeof value.title === "string"
    && "is_completed" in value && typeof value.is_completed === "boolean";
}

import { signal, Storage } from "nsh";

/// A widget is a type of thing the app can show: the journal, the notes, the
/// tasks, the games. The sidebar lists them, and the settings turn them on and
/// off. The choice is the app's own, so it lives in the app's storage.

export type WidgetId = "journal" | "notes" | "tasks" | "games";

export type Widget = { id: WidgetId; label: string; description: string };

export const WIDGETS: Widget[] = [
  { id: "journal", label: "Дневник", description: "Записи по дням, голосом и текстом" },
  { id: "notes", label: "Заметки", description: "Документы: текст, списки, таблицы, код" },
  { id: "tasks", label: "Задачи", description: "Список дел на сегодня и потом" },
  { id: "games", label: "Игры", description: "Библиотека игр и время в них" },
];

/** What a fresh install shows: the journal and the notes. Tasks and games stay off until a person turns them on. */
export const ALL_WIDGETS: Record<WidgetId, boolean> = { journal: true, notes: true, tasks: false, games: false };

const STORAGE_KEY = "mundus.atlas.widgets.v1";
const shown = signal<Record<WidgetId, boolean>>({ ...ALL_WIDGETS });
let stamp = 0;

export function widgets(): Record<WidgetId, boolean> {
  return shown();
}

export function widgetOn(id: WidgetId): boolean {
  return shown()[id] !== false;
}

export function loadWidgets() {
  const at = stamp;
  void Storage.getItem(STORAGE_KEY).then((value) => {
    if (at !== stamp) return;
    shown.set({ ...ALL_WIDGETS, ...readJson(value) });
  });
}

export function setWidget(id: WidgetId, on: boolean) {
  // One widget stays on: an app with an empty sidebar has nowhere to go.
  if (!on && WIDGETS.filter((widget) => widget.id !== id && shown()[widget.id] !== false).length === 0) return;
  const next = { ...shown(), [id]: on };
  shown.set(next);
  stamp += 1;
  void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function toggleWidget(id: WidgetId) {
  setWidget(id, !widgetOn(id));
}

/** The widgets to put in the sidebar, in their order. */
export function visibleWidgets(): Widget[] {
  return WIDGETS.filter((widget) => widgetOn(widget.id));
}

function readJson(value: string | null): Partial<Record<WidgetId, boolean>> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Partial<Record<WidgetId, boolean>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

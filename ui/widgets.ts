export type WidgetId = "journal" | "notes" | "tasks" | "games";

export type Widget = { id: WidgetId; label: string; description: string };

export const WIDGETS: Widget[] = [
  {
    id: "journal",
    label: "Дневник",
    description: "Записи по дням, голосом и текстом",
  },
  {
    id: "notes",
    label: "Заметки",
    description: "Документы: текст, списки, таблицы, код",
  },
  {
    id: "tasks",
    label: "Задачи",
    description: "Список дел на сегодня и потом",
  },
  { id: "games", label: "Игры", description: "Библиотека игр и время в них" },
];

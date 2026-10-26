import { expect, open, test } from "nsh/test";
import { buildCalendarWeeks, buildJournalDays, closestJournalDay, formatJournalDay } from "./journal-model";

test("shows the shared Atlas navigation and journal composer", async () => {
  const app = await open("./App.tsx");
  expect(app.texts()).toContain("Дневник");
  expect(app.texts()).toContain("Задачи");
  expect(app.texts()).toContain("Настройки");
  expect(app.texts()).toContain("О приложении");
  expect(app.texts()).toContain("Записей пока нет");
  expect(app.texts()).not.toContain("Входящие");
  expect(app.texts()).not.toContain("Эта неделя");
  expect(app.texts()).not.toContain("Быстрый поиск");
});

test("groups journal bubbles by date and omits the current year", () => {
  const entry = (id: string, createdAt: string) => ({ id, text: id, createdAt });
  const groups = buildJournalDays([
    entry("one", new Date(2025, 11, 23, 9).toISOString()),
    entry("two", new Date(2025, 11, 23, 11).toISOString()),
    entry("three", new Date(2024, 8, 17, 8).toISOString()),
  ]);
  expect(groups.length).toEqual(2);
  expect(groups[0].entries.length).toEqual(2);
  expect(formatJournalDay(groups[0], new Date(2025, 11, 31))).toEqual("23 декабря");
  expect(formatJournalDay(groups[1], new Date(2025, 11, 31))).toEqual("17 сентября 2024");
});

test("marks journal dates in the calendar", () => {
  const groups = buildJournalDays([{ id: "one", text: "запись", createdAt: new Date(2025, 11, 23, 9).toISOString() }]);
  const weeks = buildCalendarWeeks(new Date(2025, 11, 1), groups);
  const marked = weeks.flat().find((cell) => cell?.key === "2025-12-23");
  expect(marked?.entryCount).toEqual(1);
});

test("chooses the closest dated group for an empty calendar day", () => {
  const groups = buildJournalDays([
    { id: "before", text: "до", createdAt: new Date(2025, 11, 23, 9).toISOString() },
    { id: "after", text: "после", createdAt: new Date(2025, 11, 27, 9).toISOString() },
  ]);
  expect(closestJournalDay(groups, "2025-12-26")?.key).toEqual("2025-12-27");
});

test("opens the journal calendar and moves between months", async () => {
  const app = await open("./App.tsx", { width: 1100, clock: { time: new Date(2026, 9, 26) } });
  await app.press("Открыть календарь");
  expect(app.texts()).toContain("Календарь дневника");
  expect(app.texts()).toContain("Октябрь 2026");
  await app.press("Предыдущий месяц");
  expect(app.texts()).toContain("Сентябрь 2026");
  await app.press("Следующий месяц");
  expect(app.texts()).toContain("Октябрь 2026");
  await app.press("Закрыть календарь");
  expect(app.texts()).not.toContain("Календарь дневника");
});

test("submits on Enter and accepts multiline text", async () => {
  const app = await open("./App.tsx");
  await app.type("Новая запись в дневник", "первая строка");
  await app.type("Новая запись в дневник", "\nвторая строка");
  expect(app.value("Новая запись в дневник")).toEqual("первая строка\nвторая строка");
  await app.keyboard.press("enter");
  expect(app.value("Новая запись в дневник")).toEqual("");
});
test("routes to the all-tasks screen", async () => {
  const app = await open("./App.tsx");
  await app.press("Задачи");
  expect(app.texts()).toContain("Задач пока нет");
});

test("keeps appearance settings and configurable keyboard shortcuts", async () => {
  const app = await open("./App.tsx");
  await app.press("Настройки");
  expect(app.texts()).toContain("Плотность интерфейса");
  expect(app.texts()).toContain("Светлая тема");
  expect(app.texts()).toContain("Акцентный цвет");
  await app.press("Изменить сочетание: Боковая панель — открыть/скрыть");
  await app.waitUntil(() => app.storage()["mundus.atlas.shortcuts.v1"]?.includes("mod+shift+b") === true);
});

test("opens About from the fixed footer navigation", async () => {
  const app = await open("./App.tsx");
  await app.press("О приложении");
  expect(app.texts()).toContain("Atlas");
  expect(app.texts()).toContain("Диагностика");
});

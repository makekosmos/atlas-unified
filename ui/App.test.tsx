import { expect, open, test } from "nsh/test";

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

import { expect, open, test } from "nsh/test";

test("a supported type opens as a code block under its icon", async () => {
  const app = await open("./App.tsx", { width: 1200, height: 820 });
  await app.press("Для разработчиков");
  expect(app.texts().join("\n")).not.toContain("objects.list");
  await app.press("Тип Дневник");
  const shown = app.texts().join("\n");
  expect(shown).toContain("objects.list");
  expect(shown).toContain("com.mundus.atlas.journal");
  expect(shown).not.toContain("Пример результата");
});

test("developer tools export a full benchmark report", async () => {
  const app = await open("./App.tsx", { width: 1200, height: 820 });
  await app.press("Для разработчиков");
  await app.press("Запустить полный тест");
  await app.waitFor("label:Скопировать отчёт JSON", { timeout: 15000 });
  await app.press("Скопировать отчёт JSON");
  const report = JSON.parse(app.clipboard() ?? "");
  expect(report.stages.length).toBe(12);
  expect(
    report.stages
      .slice(-2)
      .map((stage: { syntheticNotes: number }) => stage.syntheticNotes),
  ).toEqual([10_000, 100_000]);
  expect(report.stages[0].frameIntervalsMs.length).toBeGreaterThan(0);
  expect(report.stages[11].scrollJumps.length).toBe(4);
});

test("quick search opens a matching note from Ctrl+K", async () => {
  const app = await open("./tabs-fixture.tsx", {
    width: 1200,
    height: 820,
    platform: "windows",
  });
  await app.keyboard.press("ctrl+k");
  await app.type("Поисковый запрос", "из недавних");
  await app.press("text:Долгая заметка");
  expect(app.texts()).toContain("Тело заметки, открытой из недавних.");
});

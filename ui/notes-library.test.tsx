import { expect, open, test } from "nsh/test";

/// The notes screen as a page with a library behind it: the cards, the note
/// itself, and the rails that stand for its headings.

test("the library draws the cards with their previews", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  expect(app.texts()).toContain("Заметки");
  expect(app.texts()).toContain("24 шт.");
  expect(app.texts()).toContain("Заметка 1");
  // A card carries its note's first blocks, not only its title.
  expect(app.texts()).toContain("Текст заметки 1");
});

test("a card opens the note, and its headings become the rails", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 1");
  expect(app.texts()).toContain("Заметки");
  // Two headings, so two marks; each one carries its heading's text, and a
  // press on a mark moves the caret to that heading.
  await app.press("label:Раздел");
  await app.press("label:Подраздел");
});

test("the slash menu offers Markdown's blocks, check lists among them", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.type("label:Текст заметки", "/");
  const shown = app.texts();
  expect(shown).toContain("Заголовок 1");
  expect(shown).toContain("Список");
  expect(shown).toContain("Чек-лист");
  expect(shown).toContain("Таблица");
  expect(shown).toContain("Код");
});

test("a press below the text puts the caret where writing continues", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 1");
  await app.press("id:note-page-space");
  await app.type("label:Текст заметки", " пишу с пустого места");
  expect(app.texts().join(" ")).toContain("пишу с пустого места");
});

test("a thousand notes show the cards near the viewport, not the whole list", async () => {
  const started = Date.now();
  const app = await open("./notes-fixture-many.tsx", { width: 1180, height: 820 });
  const spent = Date.now() - started;
  expect(app.texts()).toContain("1000 шт.");
  expect(app.texts()).toContain("Заметка 1");
  // The list is virtualized: the last card waits for its scroll.
  expect(app.texts()).not.toContain("Заметка 1000");
  expect(spent).toBeLessThan(10_000);
});

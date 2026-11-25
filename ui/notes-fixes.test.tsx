import { open, expect, test } from "nsh/test";
import { addNote, gridMetrics, notes, setNotes } from "./notes";
import { NOTE_TITLE_BLOCK, NOTE_TITLE_GAP } from "./notes";
import type { Note } from "./state";
import {
  commitRecent,
  forgetMissingNotes,
  forgetRecent,
  recent,
  rememberRecent,
  stageRecent,
} from "./recent";

test("the title holds two lines before it moves the page", () => {
  // Two 40px lines: a one-line title leaves a line of air above it, a second
  // line fills that air, and only a third one takes the note's text down.
  expect(NOTE_TITLE_BLOCK).toEqual(80);
  expect(NOTE_TITLE_GAP).toEqual(20);
});

/// The four defects the desk showed, each pinned to the rule that fixes it: a
/// card that waits for its place in the queue, a note opened by a save, pages
/// in the list of what was opened, and the text column that took the scroll.

test("the grid keeps a card between its smallest and largest width", () => {
  // A narrow page holds one card, grown to the largest and centred; a wide one
  // never stretches a card past it, nor squeezes one below the smallest.
  const narrow = gridMetrics(420);
  expect(narrow.columns).toBe(1);
  expect(narrow.cardWidth).toBe(260);
  expect(narrow.sidePad).toBe(56);
  let columns = 0;
  for (const width of [300, 420, 700, 900, 1180, 1400, 1600, 2400]) {
    const metrics = gridMetrics(width);
    expect(metrics.cardWidth).toBeGreaterThanOrEqual(196);
    expect(metrics.cardWidth).toBeLessThanOrEqual(260);
    expect(metrics.columns).toBeGreaterThanOrEqual(columns);
    columns = metrics.columns;
  }
  expect(gridMetrics(1180).columns).toBe(5);
  expect(gridMetrics(2400).columns).toBe(5);
});

test("a note the library no longer holds leaves the sidebar", () => {
  for (const item of recent()) forgetRecent(item.kind, item.id);
  rememberRecent({ kind: "note", id: "n1", title: "Живая" });
  rememberRecent({ kind: "note", id: "gone", title: "Удалённая" });
  rememberRecent({ kind: "game", id: "g1", title: "Игра" });
  forgetMissingNotes(new Set(["n1"]));
  // The game stays: the notes library has nothing to say about it.
  expect(recent().map((item) => item.id)).toEqual(["g1", "n1"]);
  forgetRecent("game", "g1");
  forgetRecent("note", "n1");
});

test("the list of what was opened keeps notes and games only", async () => {
  const app = await open("./recent-fixture.tsx");
  await app.waitUntil(() => app.texts().includes("Борщ"), { timeout: 2000 });
  const shown = app.texts();
  expect(shown).toContain("Борщ");
  expect(shown).toContain("Hades");
  expect(shown).not.toContain("Заметки");
  expect(shown).not.toContain("Задачи");
});

test("a note the host makes joins the library alone", () => {
  const note = (id: string, title: string): Note => ({
    id,
    title,
    doc: { type: "doc", content: [] },
    text: "",
    createdAt: "2026-11-09T09:00:00.000Z",
    updatedAt: "2026-11-09T09:00:00.000Z",
  });
  setNotes([note("a", "Старая"), note("b", "Тоже старая")]);
  // A created note comes back by itself: the library gains it on top and keeps
  // what it had, so nothing around it has to be sent again.
  addNote(note("c", "Свежая"));
  expect(notes().map((item) => item.title)).toEqual([
    "Свежая",
    "Старая",
    "Тоже старая",
  ]);
  // The same note twice is one entry: a create that is echoed again is not a
  // second note.
  addNote(note("c", "Свежая"));
  expect(notes().length).toBe(3);
});

test("a code note does not steal focus to its last block on paint or sheet tap", async () => {
  const app = await open("./notes-code-fixture.tsx", {
    width: 1180,
    height: 820,
  });
  await app.press("label:Код: языки");
  // Wait past multiple paintCode / schedulePaint ticks (60 ms each).
  await app.wait(300);
  // Neither syntax painting nor a stray tap on note-page-space may focus the
  // trailing plain-text code block (which would yank scroll to the bottom).
  await app.keyboard.press("x");
  await app.press("id:note-page-space");
  await app.wait(150);
  await app.keyboard.press("y");
  const joined = app.texts().join("\n");
  expect(joined).toContain("обычный текст");
  expect(joined).not.toContain("xобычный текст");
  expect(joined).not.toContain("yобычный текст");
  expect(joined).not.toContain("подсветкиx");
  expect(joined).not.toContain("подсветкиy");
  // Pressing the explicit empty tail below the last block focuses it.
  await app.press("id:split-note-tail");
  await app.wait(100);
  await app.keyboard.press("z");
  expect(app.texts().join("\n")).toContain("z");
});

test("recent notes stay in place while open and move to the top when left", () => {
  for (const item of recent()) forgetRecent(item.kind, item.id);
  rememberRecent({ kind: "note", id: "n3", title: "Третья" });
  rememberRecent({ kind: "note", id: "n2", title: "Вторая" });
  rememberRecent({ kind: "note", id: "n1", title: "Первая" });
  expect(recent().map((item) => item.id)).toEqual(["n1", "n2", "n3"]);

  // Opening a note already in the list highlights it in place without jumping.
  stageRecent({ kind: "note", id: "n3", title: "Третья" });
  expect(recent().map((item) => item.id)).toEqual(["n1", "n2", "n3"]);

  // Leaving the page promotes it to the top (carrying any updated title).
  commitRecent({ kind: "note", id: "n3", title: "Третья (новая)" });
  expect(recent().map((item) => item.id)).toEqual(["n3", "n1", "n2"]);
  expect(recent()[0]?.title).toBe("Третья (новая)");

  // Deleting a staged note keeps it gone even if leave runs afterward.
  stageRecent({ kind: "note", id: "n2", title: "Вторая" });
  forgetRecent("note", "n2");
  commitRecent({ kind: "note", id: "n2", title: "Вторая" });
  expect(recent().map((item) => item.id)).toEqual(["n3", "n1"]);

  // Opening a note not yet in the list adds it so the sidebar can show it active.
  stageRecent({ kind: "note", id: "n4", title: "Четвёртая" });
  expect(recent().map((item) => item.id)).toEqual(["n4", "n3", "n1"]);
});

test("the notes' arrows walk back to the list and forward into the note", async () => {
  const app = await open("./notes-trail-fixture.tsx", {
    width: 1180,
    height: 820,
  });
  await app.press("label:Заметка 2");
  // The list keeps its "Новая заметка" button; a note is the note itself.
  expect(app.texts()).toContain("Текст заметки 2");
  expect(app.texts()).not.toContain("Новая заметка");

  // Back from the first note opened is the list it came from — the arrow is
  // the way out, so a note has no separate "close" — and forward is the note
  // again, as the trail remembers it.
  await app.press("label:Назад");
  expect(app.texts()).toContain("Новая заметка");

  await app.press("label:Вперёд");
  expect(app.texts()).not.toContain("Новая заметка");
  expect(app.texts()).toContain("Текст заметки 2");

  // A note opened from the list drops what was ahead: the trail is the way
  // walked, not everything ever visited.
  await app.press("label:Назад");
  await app.press("label:Заметка 1");
  await app.press("label:Вперёд");
  expect(app.texts()).not.toContain("Новая заметка");
  expect(app.texts()).toContain("Текст заметки 1");
});

test("a note restored without a walk leaves both arrows still", async () => {
  const app = await open("./notes-trail-fixture.tsx", {
    width: 1180,
    height: 820,
  });
  // The page opens with nowhere behind it and nowhere ahead.
  expect(app.texts()).toContain("нет:нет");

  // What the host and the bar's tabs do: bring a note back without walking.
  // A step recorded here would leave back lit wherever the reader stands and
  // forward dark at the end of the trail.
  await app.press("label:Восстановить заметку");
  expect(app.texts()).toContain("Текст заметки 2");
  expect(app.texts()).toContain("нет:нет");
});

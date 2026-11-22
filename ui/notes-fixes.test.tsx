import { open, expect, test } from "nsh/test";
import { addNote, cardDelay, notes, setNotes } from "./notes";
import { commitRecent, forgetRecent, recent, rememberRecent, stageRecent } from "./recent";
import type { Note } from "./state";

/// The four defects the desk showed, each pinned to the rule that fixes it: a
/// card that waits for its place in the queue, a note opened by a save, pages
/// in the list of what was opened, and the text column that took the scroll.

test("a card scrolled into view arrives with the frame", () => {
  // The first screen staggers: 32 ms apart, so the library lands as a row.
  expect(cardDelay(0)).toBe(0);
  expect(cardDelay(3)).toBe(96);
  expect(cardDelay(11)).toBe(352);
  // Past the first screen the wait stops growing: a card at index 105 used to
  // wait 3.4 seconds, and one at 3000 nearly two minutes.
  expect(cardDelay(12)).toBe(352);
  expect(cardDelay(105)).toBe(352);
  expect(cardDelay(3000)).toBe(352);
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
  expect(notes().map((item) => item.title)).toEqual(["Свежая", "Старая", "Тоже старая"]);
  // The same note twice is one entry: a create that is echoed again is not a
  // second note.
  addNote(note("c", "Свежая"));
  expect(notes().length).toBe(3);
});

test("a code note does not steal focus to its last block on paint or sheet tap", async () => {
  const app = await open("./notes-code-fixture.tsx", { width: 1180, height: 820 });
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

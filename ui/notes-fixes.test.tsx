import { open, expect, test } from "nsh/test";
import { addNote, gridMetrics, notes, setNotes } from "./notes";
import {
  bindNoteCommands,
  codeBleedFor,
  noteTopPadFor,
  createOpenNote,
  openNoteById,
  openNoteIsBlank,
  NOTE_PLACEHOLDER,
  NOTE_TITLE_BLOCK,
  NOTE_TITLE_GAP,
  NOTE_TITLE_HINT,
  emptyHint,
} from "./notes";
import { noteLabel } from "./state";
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

// A JSX attribute is a plain string: an escape written there reaches the page as
// text, and a fresh note showed `\u200BБез названия` over its title.
test("a hint carries the zero-width space, not its spelling", () => {
  expect(emptyHint("x")).toEqual("\u200Bx");
  expect(NOTE_TITLE_HINT).toEqual("\u200BБез названия");
  expect(NOTE_TITLE_HINT).not.toContain("\\");
  expect(NOTE_PLACEHOLDER).not.toContain("\\");
});

// `mod+t` leaves one new note, never a stack: the blank note it already opened
// is the new note, so a held key or a second press opens nothing else.
test("a new note is opened once, not once per repeat", () => {
  let created = 0;
  bindNoteCommands({
    create: () => {
      created += 1;
    },
    save() {},
    remove() {},
    reload() {},
  });
  const made = (id: string, text: string): Note => ({
    id,
    title: "",
    doc: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    },
    text,
    createdAt: "2026-11-10T09:00:00.000Z",
    updatedAt: "2026-11-10T09:00:00.000Z",
  });
  setNotes([made("blank:1", "")]);
  openNoteById("blank:1");
  expect(openNoteIsBlank()).toEqual(true);
  createOpenNote();
  expect(created).toEqual(0);
  setNotes([made("blank:2", "слова")]);
  openNoteById("blank:2");
  expect(openNoteIsBlank()).toEqual(false);
  createOpenNote();
  expect(created).toEqual(1);
});

// The rule for every place a note is shown — tab, row, card: a name that reads.
// An empty string is no name, and it used to slip past a `??` fallback and
// leave the tab blank.
test("a note with no name keeps a name that reads", () => {
  expect(noteLabel("")).toEqual("Без названия");
  expect(noteLabel("   ")).toEqual("Без названия");
  expect(noteLabel(null)).toEqual("Без названия");
  expect(noteLabel(" Борщ ")).toEqual("Борщ");
});

// The page opens a fifth of the way down: the name's block keeps one line of
// air over the text by itself, so the padding carries the rest, and the first
// frame of an unmeasured page is not a name against the window's edge.
test("the page opens a fifth of the way down", () => {
  expect(noteTopPadFor(1000)).toEqual(160);
  expect(noteTopPadFor(900)).toEqual(140);
  expect(noteTopPadFor(400)).toEqual(40);
  // Nothing measured yet: a small air, never a negative one.
  expect(noteTopPadFor(0)).toBeGreaterThanOrEqual(0);
});

// A code card runs past the text column, and gives way before the page's own
// edge: the code and the language land on the column's left edge either way.
test("a code card is wider than the column, never wider than the page", () => {
  // A wide page has the room: the card may take its whole margin of 20.
  expect(codeBleedFor(430)).toEqual(20);
  expect(codeBleedFor(40)).toEqual(20);
  // A narrow one keeps its edge: the card stops 8 px short of the page.
  expect(codeBleedFor(16)).toEqual(8);
  expect(codeBleedFor(0)).toEqual(0);
});

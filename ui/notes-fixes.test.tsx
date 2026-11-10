import { open, expect, test } from "nsh/test";
import { addNote, cardDelay, notes, setNotes } from "./notes";
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

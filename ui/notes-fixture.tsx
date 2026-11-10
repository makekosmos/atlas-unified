import { mount, Text, View } from "nsh";
import { bindNoteCommands, NotesPage, setNotes } from "./notes";
import { fallback } from "./state";
import type { Note } from "./state";

/// A notes screen with a library of its own, so the tests can open it without
/// a host: the page draws the same components the app draws.

const colors = fallback.colors;

function body(tag: string) {
  return {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Раздел" }] },
      { type: "paragraph", content: [{ type: "text", text: `Текст заметки ${tag}` }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Подраздел" }] },
      { type: "paragraph", content: [{ type: "text", text: "Ещё строка." }] },
    ],
  };
}

export function fixtureNotes(count: number): Note[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `note-${index}`,
    title: `Заметка ${index + 1}`,
    doc: body(String(index + 1)),
    text: `Текст заметки ${index + 1}`,
    createdAt: "2026-11-01T09:00:00.000Z",
    updatedAt: "2026-11-09T10:00:00.000Z",
  }));
}

const library = fixtureNotes(Number((globalThis as { notesFixtureCount?: number }).notesFixtureCount ?? 24));
setNotes(library);
// The page asks the host for its notes when it opens; here the answer is the
// same library, as if it had just arrived.
bindNoteCommands({
  create() {},
  save() {},
  remove() {},
  reload() { setNotes(library); },
});

function NotesFixture() {
  return <View class="h-full w-full" style={{ backgroundColor: colors.background }}>
    <NotesPage colors={colors} dark={true} titlebarInset={0} />
  </View>;
}

mount(NotesFixture);

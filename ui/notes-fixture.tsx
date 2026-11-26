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
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Раздел" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: `Текст заметки ${tag}` }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Подраздел" }],
      },
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

/// A note the way a hand writes one: a paragraph, a heading, a list, a quote.
/// The tests that add a block to it check the note comes back whole.
function richBody() {
  const line = (text: string) => ({ type: "text", text });
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [line("На четыре порции, полтора часа.")] },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [line("Продукты")],
      },
      {
        type: "bulletList",
        content: ["свёкла — 2 шт", "капуста — 300 г"].map((text) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [line(text)] }],
        })),
      },
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [line("Свёклу не варить, а тушить.")],
          },
        ],
      },
    ],
  };
}

const library = fixtureNotes(
  Number(
    (globalThis as { notesFixtureCount?: number }).notesFixtureCount ?? 24,
  ),
);
library.push({
  id: "note-tasks",
  title: "Задачи",
  doc: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Две недели до переезда." }],
      },
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Выбрать район" }],
              },
            ],
          },
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Собрать коробки" }],
              },
            ],
          },
        ],
      },
    ],
  },
  text: "Две недели до переезда.",
  createdAt: "2026-11-01T09:00:00.000Z",
  updatedAt: "2026-11-09T10:00:00.000Z",
});
library.push({
  id: "note-rich",
  title: "Борщ",
  doc: richBody(),
  text: "На четыре порции, полтора часа.",
  createdAt: "2026-11-01T09:00:00.000Z",
  updatedAt: "2026-11-09T10:00:00.000Z",
});
setNotes(library);
// The page asks the host for its notes when it opens; here the answer is the
// same library, as if it had just arrived.
bindNoteCommands({
  create() {
    library.unshift({
      id: "note-new",
      title: "",
      doc: { type: "doc", content: [{ type: "paragraph" }] },
      text: "",
      createdAt: "2026-11-10T10:00:00.000Z",
      updatedAt: "2026-11-10T10:00:00.000Z",
    });
    setNotes([...library]);
  },
  save(id: string, title: string, doc: unknown) {
    // The page writes the note back through this: the tests read what it sent.
    const log = (
      globalThis as {
        atlasSaves?: { id: string; title: string; doc: unknown }[];
      }
    ).atlasSaves;
    log?.push({ id, title, doc });
  },
  remove() {},
  reload() {
    setNotes(library);
  },
});

function NotesFixture() {
  return (
    <View class="h-full w-full" style={{ backgroundColor: colors.background }}>
      <NotesPage colors={colors} dark={true} titlebarInset={0} />
    </View>
  );
}

mount(NotesFixture);

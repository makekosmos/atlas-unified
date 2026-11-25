// The notes a tab test opens, put in the store before the app mounts: the
// shell's tabs are the app's own, so the test needs a library to open from.
// Imported ahead of `./App.tsx` by `tabs-fixture.tsx`, which is why it is a
// module of its own rather than a call the fixture makes.
import { bindNoteCommands, setNotes } from "./notes";
import type { Note } from "./state";

const note = (id: string, title: string, text: string): Note => ({
  id,
  title,
  doc: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  },
  text,
  createdAt: "2026-11-10T09:00:00.000Z",
  updatedAt: "2026-11-10T09:00:00.000Z",
});

const library: Note[] = [
  note("seed:long", "Долгая заметка", "Тело заметки, открытой из недавних."),
  note("seed:other", "Другая заметка", "Другое тело."),
];
setNotes(library);
bindNoteCommands({
  create() {},
  save() {},
  remove() {},
  reload() {
    setNotes(library);
  },
});

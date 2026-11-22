import { mount, View } from "nsh";
import { bindNoteCommands, NotesPage, setNotes } from "./notes";
import { fallback } from "./state";
import type { Note } from "./state";

/// A notes screen containing a multi-code-block note (mirroring "Код: языки"),
/// used to verify syntax painting and stray sheet taps never hijack focus.

const colors = fallback.colors;

const codeNote: Note = {
  id: "demo:code",
  title: "Код: языки",
  doc: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Одна заметка, несколько языков." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Rust" }] },
      { type: "codeBlock", attrs: { language: "rust" }, content: [{ type: "text", text: "fn main() {\n    println!(\"hi\");\n}" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "CSS" }] },
      { type: "codeBlock", attrs: { language: "css" }, content: [{ type: "text", text: ".card {\n  display: flex;\n}" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Без языка" }] },
      { type: "codeBlock", content: [{ type: "text", text: "обычный текст\nбез подсветки" }] },
    ],
  },
  text: "Одна заметка, несколько языков.",
  createdAt: "2026-11-10T09:00:00.000Z",
  updatedAt: "2026-11-10T09:00:00.000Z",
};

const library: Note[] = [codeNote];
setNotes(library);
bindNoteCommands({
  create() {},
  save() {},
  remove() {},
  reload() { setNotes(library); },
});

function NotesCodeFixture() {
  return <View class="h-full w-full" style={{ backgroundColor: colors.background }}>
    <NotesPage colors={colors} dark={true} titlebarInset={0} />
  </View>;
}

mount(NotesCodeFixture);

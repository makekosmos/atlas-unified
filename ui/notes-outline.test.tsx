import { expect, test } from "nsh/test";
import { headingsOf, markdownOf, nodeSize, rowsOf } from "./notes";
import type { Note } from "./state";

/// The pieces of the notes page that decide how it behaves on long documents:
/// where a heading starts (the outline's marks jump there) and how a library of
/// many notes becomes rows. They are plain functions, so they run here without
/// a window.

function doc(...content: unknown[]) {
  return { type: "doc", content };
}

function heading(level: number, text: string) {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] };
}

function paragraph(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

test("a heading's mark points at the start of its own text", () => {
  const marks = headingsOf(doc(paragraph("привет"), heading(2, "раздел")));
  expect(marks.length).toBe(1);
  expect(marks[0].level).toBe(2);
  expect(marks[0].text).toBe("раздел");
  // "привет" is six positions plus the block's own one; the heading's text
  // starts one position inside the heading.
  expect(marks[0].pos).toBe(9);
});

test("a block is its content plus one position", () => {
  expect(nodeSize({ type: "text", text: "абв" })).toBe(3);
  expect(nodeSize(paragraph("абв"))).toBe(4);
  expect(nodeSize({ type: "horizontalRule" })).toBe(1);
  // Two one-letter paragraphs are two positions each; the list is one more.
  expect(nodeSize({ type: "bulletList", content: [paragraph("а"), paragraph("б")] })).toBe(5);
});

test("a long document keeps every heading, in order and apart", () => {
  const content: unknown[] = [];
  for (let index = 1; index <= 200; index += 1) {
    content.push(heading(index % 3 === 0 ? 3 : 1, `раздел ${index}`));
    content.push(paragraph(`текст раздела ${index}`));
  }
  const marks = headingsOf(doc(...content));
  expect(marks.length).toBe(200);
  for (let index = 1; index < marks.length; index += 1) {
    expect(marks[index].pos).toBeGreaterThan(marks[index - 1].pos);
  }
});

test("a note writes back as Markdown, block for block", () => {
  const markdown = markdownOf(doc(
    heading(1, "Раздел"),
    paragraph("Абзац с кодом в строке."),
    { type: "bulletList", content: [
      { type: "listItem", content: [paragraph("первый")] },
      { type: "listItem", content: [paragraph("второй")] },
    ] },
    { type: "blockquote", content: [paragraph("цитата")] },
    { type: "codeBlock", attrs: { language: "rust" }, content: [{ type: "text", text: "fn main() {}" }] },
    { type: "horizontalRule" },
    { type: "table", content: [
      { type: "tableRow", content: [
        { type: "tableHeader", content: [paragraph("Раздел")] },
        { type: "tableHeader", content: [paragraph("Что хранит")] },
      ] },
      { type: "tableRow", content: [
        { type: "tableCell", content: [paragraph("propsJson")] },
        { type: "tableCell", content: [paragraph("описание")] },
      ] },
    ] },
  ));
  expect(markdown).toContain("# Раздел");
  expect(markdown).toContain("- первый");
  expect(markdown).toContain("> цитата");
  expect(markdown).toContain("```rust");
  expect(markdown).toContain("---");
  expect(markdown).toContain("| Раздел |");
});

test("a document without headings has no rails", () => {
  expect(headingsOf(doc(paragraph("только текст"))).length).toBe(0);
  expect(headingsOf(null).length).toBe(0);
});

test("ten thousand notes become rows of cards without a stall", () => {
  const library = Array.from({ length: 10_000 }, (_, index) => ({ id: `note-${index}`, title: `Заметка ${index}`, doc: null, text: "", createdAt: "", updatedAt: "" })) as unknown as Note[];
  const started = Date.now();
  const rows = rowsOf(library, 5);
  const spent = Date.now() - started;
  expect(rows.length).toBe(2_000);
  expect(rows[0].length).toBe(5);
  expect(spent).toBeLessThan(200);
});

test("a hundred thousand notes stay rows, and the last one is kept", () => {
  const library = Array.from({ length: 100_000 }, (_, index) => ({ id: `note-${index}`, title: `Заметка ${index}`, doc: null, text: "", createdAt: "", updatedAt: "" })) as unknown as Note[];
  const rows = rowsOf(library, 7);
  expect(rows.length).toBe(Math.ceil(100_000 / 7));
  expect(rows[rows.length - 1].length).toBe(100_000 % 7 || 7);
});

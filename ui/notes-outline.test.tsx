import { expect, test } from "nsh/test";
import { cachedByRev, headingsOf, markdownOf, nodeSize, rowsOf } from "./notes";
import {
  activeOutlineIndex,
  activeOutlinePosForCaret,
  outlineRowIndent,
  outlineTickWidth,
} from "./notes-outline";
import type { Note } from "./state";

/// The pieces of the notes page that decide how it behaves on long documents:
/// where a heading starts (the outline's marks jump there) and how a library of
/// many notes becomes rows. They are plain functions, so they run here without
/// a window.

function doc(...content: unknown[]) {
  return { type: "doc", content };
}

function heading(level: number, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
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
  expect(
    nodeSize({ type: "bulletList", content: [paragraph("а"), paragraph("б")] }),
  ).toBe(5);
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
  const markdown = markdownOf(
    doc(
      heading(1, "Раздел"),
      paragraph("Абзац с кодом в строке."),
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [paragraph("первый")] },
          { type: "listItem", content: [paragraph("второй")] },
        ],
      },
      { type: "blockquote", content: [paragraph("цитата")] },
      {
        type: "codeBlock",
        attrs: { language: "rust" },
        content: [{ type: "text", text: "fn main() {}" }],
      },
      { type: "horizontalRule" },
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableHeader", content: [paragraph("Раздел")] },
              { type: "tableHeader", content: [paragraph("Что хранит")] },
            ],
          },
          {
            type: "tableRow",
            content: [
              { type: "tableCell", content: [paragraph("propsJson")] },
              { type: "tableCell", content: [paragraph("описание")] },
            ],
          },
        ],
      },
    ),
  );
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

test("outline preserves heading levels 1..6 and tick widths decrease monotonically from H1 to H6", () => {
  const marks = headingsOf(
    doc(
      heading(1, "H1"),
      heading(2, "H2"),
      heading(3, "H3"),
      heading(4, "H4"),
      heading(5, "H5"),
      heading(6, "H6"),
    ),
  );
  expect(marks.map((mark) => mark.level)).toEqual([1, 2, 3, 4, 5, 6]);
  for (let level = 1; level < 6; level += 1) {
    expect(outlineTickWidth(level)).toBeGreaterThan(
      outlineTickWidth(level + 1),
    );
    expect(outlineRowIndent(level + 1, 1)).toBeGreaterThan(
      outlineRowIndent(level, 1),
    );
  }
  // When a note starts at H2, H2 sits at the base indent while H3 is indented one step.
  expect(outlineRowIndent(2, 2)).toBe(outlineRowIndent(1, 1));
  expect(outlineRowIndent(3, 2)).toBeGreaterThan(outlineRowIndent(2, 2));
});

test("active outline selection follows scroll threshold and caret position", () => {
  expect(activeOutlineIndex([100, 320, 640], 50)).toBe(0);
  expect(activeOutlineIndex([100, 320, 640], 100)).toBe(0);
  expect(activeOutlineIndex([100, 320, 640], 350)).toBe(1);
  expect(activeOutlineIndex([100, 320, 640], 900)).toBe(2);
  expect(activeOutlineIndex([null, 200, 500], 260)).toBe(1);

  const marks = [
    { level: 1, text: "A", pos: 2 },
    { level: 2, text: "B", pos: 20 },
    { level: 3, text: "C", pos: 45 },
  ];
  expect(activeOutlinePosForCaret(marks, 1)).toBe(2);
  expect(activeOutlinePosForCaret(marks, 25)).toBe(20);
  expect(activeOutlinePosForCaret(marks, 100)).toBe(45);
});

test("ten thousand notes become rows of cards without a stall", () => {
  const library = Array.from({ length: 10_000 }, (_, index) => ({
    id: `note-${index}`,
    title: `Заметка ${index}`,
    doc: null,
    text: "",
    createdAt: "",
    updatedAt: "",
  })) as unknown as Note[];
  const started = Date.now();
  const rows = rowsOf(library, 5);
  const spent = Date.now() - started;
  expect(rows.length).toBe(2_000);
  expect(rows[0].length).toBe(5);
  expect(spent).toBeLessThan(200);
});

test("a hundred thousand notes stay rows, and the last one is kept", () => {
  const library = Array.from({ length: 100_000 }, (_, index) => ({
    id: `note-${index}`,
    title: `Заметка ${index}`,
    doc: null,
    text: "",
    createdAt: "",
    updatedAt: "",
  })) as unknown as Note[];
  const rows = rowsOf(library, 7);
  expect(rows.length).toBe(Math.ceil(100_000 / 7));
  expect(rows[rows.length - 1].length).toBe(100_000 % 7 || 7);
});

test("heading positions are read once per document revision", () => {
  // Every pointer move of a selection drag asks for them; a session's JSON is
  // an FFI round trip, so asking the document again only when it changed is
  // what keeps the drag from stalling.
  const cache = new Map<string, { rev: number; value: number[] }>();
  let reads = 0;
  const read = (rev: number) =>
    cachedByRev(cache, "session", rev, () => {
      reads += 1;
      return [rev];
    });
  const first = read(7);
  expect(read(7)).toBe(first);
  expect(reads).toBe(1);
  expect(read(8)).toEqual([8]);
  expect(reads).toBe(2);
  // Another session has its own positions, even at the same revision.
  const other = cachedByRev(cache, "other", 8, () => [99]);
  expect(other).toEqual([99]);
  expect(cachedByRev(cache, "session", 8, () => [0])).toEqual([8]);
});

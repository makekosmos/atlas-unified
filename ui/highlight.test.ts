import { createRichEditor } from "nsh/base";
import { StarterKit } from "nsh/base";
import { TableKit } from "nsh/base";
import { codeBlocksOf } from "./notes";
import { expect, test } from "nsh/test";
import { languageOf, scan, tokenColors } from "./highlight";

const kinds = (code: string, language: string) => scan(code, language).map((token) => `${token.kind}:${code.slice(token.from, token.to)}`);

test("a Rust block marks its words, strings, numbers and comments", () => {
  expect(kinds('fn main() {\n    let n = 42; // счёт\n    println!("привет");\n}', "rust")).toEqual([
    "keyword:fn",
    "function:main",
    "keyword:let",
    "number:42",
    "comment:// счёт",
    "function:println",
    "string:\"привет\"",
  ]);
});

test("a JavaScript block knows its own words and its templates", () => {
  expect(kinds("const total = items.length > 0 ? `yes` : null;", "js")).toEqual([
    "keyword:const",
    "number:0",
    "string:`yes`",
    "literal:null",
  ]);
});

test("a Python block comments with a hash", () => {
  expect(kinds("# шаг\nfor item in items:\n    print(True)", "python")).toEqual([
    "comment:# шаг",
    "keyword:for",
    "keyword:in",
    "function:print",
    "literal:True",
  ]);
});

test("a JSON block tells its keys from its values", () => {
  expect(kinds('{"count": 3, "on": true}', "json")).toEqual([
    "property:\"count\"",
    "number:3",
    "property:\"on\"",
    "literal:true",
  ]);
});

test("a block without a language stays plain", () => {
  expect(scan("fn main() {}", "")).toEqual([]);
  expect(scan("fn main() {}", "text")).toEqual([]);
  expect(languageOf("PlainText")).toEqual("");
});

test("the fence's name is read as one of the scanner's own", () => {
  expect(languageOf("TS")).toEqual("ts");
  expect(languageOf("typescript")).toEqual("ts");
  expect(languageOf("rs")).toEqual("rust");
  expect(languageOf("sh")).toEqual("bash");
  expect(languageOf("cobol")).toEqual("");
});

test("every token kind has a colour in both themes", () => {
  for (const dark of [true, false]) {
    const palette = tokenColors(dark);
    for (const kind of ["comment", "string", "number", "keyword", "literal", "function", "property", "tag"] as const) {
      expect(palette[kind]).toMatch(/^#[0-9a-f]{6}$/);
    }
  }
});

// The menu names a language by its fence: every choice has to be one the
// scanner reads, or the block would stay plain after the pick.
test("every language the menu offers is one the scanner reads", () => {
  for (const name of ["rust", "ts", "js", "python", "json", "bash", "sql", "go", "html", "css", "markdown"]) {
    expect(languageOf(name)).toEqual(name === "js" || name === "ts" ? name : name);
  }
});

// A block's badge needs its first character's position and its text.
test("code blocks are found with their position and language", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "hi" }] },
      { type: "codeBlock", attrs: { language: "rust" }, content: [{ type: "text", text: "fn main() {}" }] },
    ],
  };
  expect(codeBlocksOf(doc)).toEqual([{ node: 4, pos: 5, language: "rust", text: "fn main() {}" }]);
});

// The editor's schema takes a picture inside a paragraph: that is the shape a
// pasted image has to take, not a block of its own.
test("the schema takes an image inside a paragraph", () => {
  const session = createRichEditor({
    extensions: [StarterKit.configure({}), TableKit.configure({})],
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "image", attrs: { src: "data:image/png;base64,iVBORw0KGgo=", alt: "x" } }] }] } as never,
    format: "json",
  });
  try {
    const doc = session.getJSON();
    expect(JSON.stringify(doc)).toContain("\"image\"");
  } finally {
    session.dispose();
  }
});

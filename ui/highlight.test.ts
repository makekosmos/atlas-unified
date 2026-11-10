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

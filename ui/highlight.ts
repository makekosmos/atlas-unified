/// Syntax colouring for the code blocks of a note. The editor has no grammar
/// engine of its own, so this is a small scanner: it walks the block's text once
/// and marks the spans a reader's eye catches first (comments, strings, numbers,
/// keywords, names). Languages differ in their words, not in the shape of a
/// token, so one scanner serves them all.

export type TokenKind = "comment" | "string" | "number" | "keyword" | "literal" | "function" | "property" | "tag";

export type Token = { from: number; to: number; kind: TokenKind };

const WORDS: Record<string, string> = {
  rust: "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while",
  ts: "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends false finally for from function get if implements import in instanceof interface let new null of private protected public readonly return set static super switch this throw true try type typeof undefined var void while yield",
  js: "async await break case catch class const continue debugger default delete do else export extends false finally for function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield",
  python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
  go: "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil",
  sql: "add all alter and as asc between by case cast column create delete desc distinct drop else end exists from group having in index inner insert into is join key left like limit not null off offset on or order outer primary references right select set table then union unique update values when where with",
  bash: "if then else elif fi for while do done case esac function in export local readonly return exit echo cd source set unset",
  json: "true false null",
  css: "important media supports font face keyframes import from to",
  html: "",
  markdown: "",
};

const WORD_SET: Record<string, Set<string>> = {};
function wordsOf(language: string): Set<string> {
  if (!WORD_SET[language]) WORD_SET[language] = new Set((WORDS[language] ?? "").split(/\s+/).filter(Boolean));
  return WORD_SET[language];
}

const ALIASES: Record<string, string> = {
  rs: "rust",
  js: "js", javascript: "js", jsx: "js", mjs: "js", tsx: "ts", typescript: "ts",
  py: "python", python3: "python", sh: "bash", shell: "bash", zsh: "bash", console: "bash",
  golang: "go", postgres: "sql", postgresql: "sql", mysql: "sql", sqlite: "sql",
  yml: "yaml", yaml: "yaml", md: "markdown", markdown: "markdown", text: "", plaintext: "",
  htm: "html", xml: "html", svg: "html", scss: "css", less: "css",
};

/// The language a fence names, as one of the scanner's own names; empty when it
/// is not one it knows (the block then stays plain).
export function languageOf(name: string | null | undefined): string {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return "";
  const mapped = ALIASES[key] ?? key;
  if (!mapped) return "";
  if (mapped === "html" || mapped === "css" || mapped === "markdown" || mapped === "yaml") return mapped;
  return WORDS[mapped] ? mapped : "";
}

const lineComment: Record<string, string[]> = {
  rust: ["//"], ts: ["//"], js: ["//"], go: ["//"], python: ["#"], bash: ["#"], sql: ["--"], yaml: ["#"], css: [], html: [], markdown: [], json: [],
};

const quotePairs: Record<string, string[]> = {
  rust: ['"', "'"], ts: ['"', "'", "`"], js: ['"', "'", "`"], python: ['"', "'"], go: ['"', "'", "`"],
  sql: ["'"], bash: ['"', "'"], json: ['"'], yaml: ['"', "'"], css: ['"', "'"], html: ['"', "'"], markdown: ['"', "'"],
};

const identifier = /[A-Za-z_$\u0400-\u04FF][A-Za-z0-9_$\u0400-\u04FF]*/y;
const number = /(?:0[xXbBoO][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:[a-zA-Z]{0,3})?/y;

/// The tokens of `code`, positions in UTF-16 units from the block's start, as
/// the editor counts them.
export function scan(code: string, language: string): Token[] {
  const lang = languageOf(language);
  const tokens: Token[] = [];
  if (!lang) return tokens;
  const words = wordsOf(lang);
  const comments = lineComment[lang] ?? [];
  const quotes = quotePairs[lang] ?? ['"'];
  const push = (from: number, to: number, kind: TokenKind) => {
    if (to > from) tokens.push({ from, to, kind });
  };

  let i = 0;
  while (i < code.length) {
    const ch = code[i];

    const line = comments.find((mark) => code.startsWith(mark, i));
    if (line) {
      let end = code.indexOf("\n", i);
      if (end === -1) end = code.length;
      push(i, end, "comment");
      i = end;
      continue;
    }
    if (code.startsWith("/*", i)) {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? code.length : end + 2;
      push(i, stop, "comment");
      i = stop;
      continue;
    }
    if (lang === "html" && code.startsWith("<!--", i)) {
      const end = code.indexOf("-->", i + 4);
      const stop = end === -1 ? code.length : end + 3;
      push(i, stop, "comment");
      i = stop;
      continue;
    }

    if (lang === "markdown" && (i === 0 || code[i - 1] === "\n")) {
      const fence = /```\w*/.exec(code.slice(i))?.[0];
      if (fence) {
        push(i, i + fence.length, "keyword");
        i += fence.length;
        continue;
      }
      const heading = /^#{1,6} /.exec(code.slice(i));
      if (heading) {
        let end = code.indexOf("\n", i);
        if (end === -1) end = code.length;
        push(i, end, "function");
        i = end;
        continue;
      }
      const bullet = /^[-*+] /.exec(code.slice(i));
      if (bullet) {
        push(i, i + 2, "keyword");
        i += 2;
        continue;
      }
    }

    if (lang === "html") {
      if (ch === "<") {
        const tag = /^<\/?([A-Za-z][\w:-]*)/.exec(code.slice(i));
        if (tag) {
          push(i, i + tag[0].length, "tag");
          i += tag[0].length;
          continue;
        }
        push(i, i + 1, "comment");
        i += 1;
        continue;
      }
      if (ch === ">") {
        push(i, i + 1, "comment");
        i += 1;
        continue;
      }
      const attr = /^([A-Za-z_:][\w:.-]*)(?==)/.exec(code.slice(i));
      if (attr && /[\s"']/.test(code[i - 1] ?? " ")) {
        push(i, i + attr[1].length, "property");
        i += attr[1].length;
        continue;
      }
    }

    if (lang === "css") {
      if (ch === "@") {
        const at = /^@[A-Za-z-]+/.exec(code.slice(i));
        if (at) {
          push(i, i + at[0].length, "keyword");
          i += at[0].length;
          continue;
        }
      }
      if (ch === "." || ch === "#") {
        const selector = /^[.#][A-Za-z_-][\w-]*/.exec(code.slice(i));
        if (selector) {
          push(i, i + selector[0].length, "function");
          i += selector[0].length;
          continue;
        }
      }
      if (/[A-Za-z-]/.test(ch) && code[i + 1] === "-" || ch === "-") {
        const prop = /^-{0,2}[A-Za-z-]+(?=\s*:)/.exec(code.slice(i));
        if (prop) {
          push(i, i + prop[0].length, "property");
          i += prop[0].length;
          continue;
        }
      }
    }

    if (quotes.includes(ch)) {
      const triple = code.startsWith(ch + ch + ch, i);
      const mark = triple ? ch + ch + ch : ch;
      let j = i + mark.length;
      while (j < code.length) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code.startsWith(mark, j)) {
          j += mark.length;
          break;
        }
        if (!triple && code[j] === "\n" && ch !== "`") break;
        j += 1;
      }
      const stop = Math.min(j, code.length);
      const after = code.slice(stop).match(/^\s*:/);
      push(i, stop, (lang === "json" || lang === "yaml") && after ? "property" : "string");
      i = stop;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      number.lastIndex = i;
      const match = number.exec(code);
      if (match && match.index === i) {
        push(i, i + match[0].length, "number");
        i += match[0].length;
        continue;
      }
    }

    if (/[A-Za-z_$\u0400-\u04FF]/.test(ch)) {
      identifier.lastIndex = i;
      const match = identifier.exec(code);
      if (match && match.index === i) {
        const word = match[0];
        const next = code[i + word.length];
        let kind: TokenKind | null = null;
        const lower = word.toLowerCase();
        if (words.has(word)) kind = lower === "true" || lower === "false" || lower === "null" || lower === "none" ? "literal" : "keyword";
        else if (next === "(") kind = "function";
        // Rust's macros call with a bang: `println!`.
        else if (next === "!" && code[i + word.length + 1] === "(") kind = "function";
        else if (lang === "json" && next === ":") kind = "property";
        else if (lang === "yaml" && next === ":") kind = "property";
        if (kind) push(i, i + word.length, kind);
        i += word.length;
        continue;
      }
    }

    i += 1;
  }
  return tokens;
}

/// The colours of a token, per theme: a comment reads quietly, a string and a
/// number stand apart, and keywords carry the accent the app already uses.
export function tokenColors(dark: boolean): Record<TokenKind, string> {
  return dark
    ? {
      comment: "#7f8b93",
      string: "#b8dc9a",
      number: "#e3b341",
      keyword: "#c9a2f7",
      literal: "#e39a6b",
      function: "#8ec7f5",
      property: "#f0c674",
      tag: "#f29d92",
    }
    : {
      comment: "#8a8f98",
      string: "#4a7d2f",
      number: "#9a5b00",
      keyword: "#7a3fb5",
      literal: "#a1451b",
      function: "#1f5f9e",
      property: "#8a6d1f",
      tag: "#a1322c",
    };
}

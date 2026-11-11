import { Clipboard, Image, createMotion, Easing, effect, List, Scroll, signal, Text, View } from "nsh";
import {
  Input,
  RichEditor,
  RichEditorPlugin,
  StarterKit,
  TableKit,
  chain,
  command,
  createRichEditor,
  deleteRange,
  insertTable,
  setNodeAttribute,
} from "nsh/base";
import Mono from "./fonts/IBMPlexMono-Regular.ttf";
import type { RichCommand, RichEditorRef, RichEditorSession } from "nsh/base";
import type { ViewRef } from "nsh";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import { Menu } from "nsh/desktop";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { colorAlpha, surfaceWash } from "./chrome";
import { Glyph } from "./glyph";
import { languageOf, scan, tokenColors } from "./highlight";
import type { TokenKind } from "./highlight";
import { forgetRecent, rememberRecent } from "./recent";
import type { Note } from "./state";

/// Notes are rich text: one editing surface, no source and no preview. The
/// document the editor holds is what Engine stores in `contentJson` of a
/// `core.note`; the host derives the plain text the list shows.
///
/// nsh runs a component's body once, so everything that follows a signal is
/// read lazily, inside the JSX.
type NoteCommands = {
  create(title: string, doc: unknown): void;
  save(id: string, title: string, doc: unknown): void;
  remove(id: string): void;
  reload(): void;
};

type SlashItem = { id: string; label: string; hint: string; make: () => RichCommand };
type Point = { x: number; y: number };

const idleCommands: NoteCommands = { create() {}, save() {}, remove() {}, reload() {} };
let commands: NoteCommands = idleCommands;
/// The editor's handle, for putting the caret where a press asked for it.
let editorRef: RichEditorRef | null = null;
/// Where the slash menu is placed against: page coordinates are measured
/// from this view's own corner.
let menuAnchor: ViewRef | null = null;
/// The note's headings, in document order, with where they start.
const outline = signal<OutlineMark[]>([]);
let outlineTimer: ReturnType<typeof setTimeout> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DELAY_MS = 700;
/// The library's grid: the card's smallest width, the air between cards, and
/// the page's proportions (quiet.md's card is 236 x 264).
const CARD_MIN = 196;
const CARD_GAP = 16;
const CARD_RATIO = 264 / 236;
/// How many heading marks the rails show, as AnyType's table of contents does.
const OUTLINE_LIMIT = 50;
/// The outline hugs the window's right edge the way AnyType does: a narrow
/// strip of marks, close enough that the pointer finds them without aiming.
const RAIL_INSET = 12;
const RAIL_WIDTH = 22;
/// Beyond five columns a card stops reading as a page.
const CARD_MAX_COLUMNS = 5;
/// How many cards stagger in on the first paint: a card that scrolls into view
/// later arrives with the frame, not after a delay of its own.
const ENTER_STAGGER_CARDS = 11;

/// How long a card waits before it fades in: the first screen staggers, and a
/// card that the list mounts while scrolling does not wait at all — a card at
/// index 105 used to arrive three seconds after the finger.
export function cardDelay(index: number): number {
  return Math.max(0, Math.min(index, ENTER_STAGGER_CARDS)) * 32;
}
/// Below this width the library is a list of rows, the way a phone shows it.
const COMPACT_LIBRARY = 560;
/// Room under the last row for the floating button: it sits over the page, so
/// the page ends above it rather than behind it.
const LIBRARY_BOTTOM = 104;
/// Code is read by its columns. The face is the one the app already ships
/// (IBM Plex Mono), registered by importing the file.

const GRID_PAD = 24;
/// The note itself opens as one column, not as a pane: the text keeps a
/// readable measure however wide the window is.
const PAGE_MAX = 720;
const PAGE_PAD = 40;
/// How many of the note's blocks its card shows.
const PREVIEW_BLOCKS = 14;
/// What the slash menu offers: the blocks the contract of `core.note` allows.
/// Enough of the list to stand for it while placing it: a full list of eleven
/// rows fits, and a longer one scrolls.
const SLASH_MENU_HEIGHT = 320;

const SLASH_ITEMS: SlashItem[] = [
  { id: "text", label: "Текст", hint: "обычный абзац", make: () => command("setParagraph") },
  { id: "h1", label: "Заголовок 1", hint: "крупный раздел", make: () => command("setHeading", { level: 1 }) },
  { id: "h2", label: "Заголовок 2", hint: "раздел", make: () => command("setHeading", { level: 2 }) },
  { id: "h3", label: "Заголовок 3", hint: "подраздел", make: () => command("setHeading", { level: 3 }) },
  { id: "bullet", label: "Список", hint: "маркированный", make: () => command("toggleBulletList") },
  { id: "ordered", label: "Нумерация", hint: "нумерованный список", make: () => command("toggleOrderedList") },
  { id: "task", label: "Чек-лист", hint: "задачи с галочками", make: () => command("toggleTaskList") },
  { id: "quote", label: "Цитата", hint: "выделить блок", make: () => command("toggleBlockquote") },
  { id: "code", label: "Код", hint: "блок кода", make: () => command("toggleCodeBlock") },
  { id: "table", label: "Таблица", hint: "3 на 3 с заголовком", make: () => insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: "rule", label: "Разделитель", hint: "горизонтальная линия", make: () => command("setHorizontalRule") },
];

export const notes = signal<Note[]>([]);
/// The editor is made again for every note, and the view with it: the component
/// takes its session once, when it is made.
const editorVersion = signal(0);

/// Two overlapping sheets: the copy button on a code block.
const COPY_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect x='8.5' y='8.5' width='11' height='11' rx='2' stroke='%23000' stroke-width='1.6'/%3E%3Cpath d='M6.5 15.5H5.2A2.2 2.2 0 0 1 3 13.3V5.2A2.2 2.2 0 0 1 5.2 3h8.1A2.2 2.2 0 0 1 15.5 5.2V6.5' stroke='%23000' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E";

/// One code block as the page draws it. `node` is the position before the
/// block (what `pageNodeRect` and the language attribute take). `pos` is its
/// first character.
type CodeBlock = { node: number; pos: number; language: string; text: string };

/// A block's size in the editor's positions: a text is its letters, a leaf is
/// one, and every other block is its content plus the two positions around it.
function blockSize(node: unknown): number {
  const block = node as { text?: string; content?: unknown[] } | null;
  if (!block) return 1;
  if (typeof block.text === "string") return block.text.length;
  if (!Array.isArray(block.content)) return 1;
  let size = 2;
  for (const child of block.content) size += blockSize(child);
  return size;
}

/// The fence name as the menu and the scanner share it. A plain fence stays
/// empty, so the block says «Простой текст» instead of the fence's own word.
function shownLanguage(named: string): string {
  const known = languageOf(named);
  if (known) return known;
  const key = named.trim().toLowerCase();
  if (!key || key === "text" || key === "plaintext" || key === "plain" || key === "txt") return "";
  return named.trim();
}

/// The code blocks of a document, in order.
export function codeBlocksOf(doc: unknown): CodeBlock[] {
  const root = doc as { content?: unknown[] } | null;
  if (!root || !Array.isArray(root.content)) return [];
  const found: CodeBlock[] = [];
  let pos = 0;
  for (const node of root.content) {
    const block = node as { type?: string; attrs?: { language?: string | null }; content?: { text?: string }[] };
    if (block.type === "codeBlock") {
      const named = typeof block.attrs?.language === "string" ? block.attrs.language : "";
      const text = (block.content ?? []).map((child) => child?.text ?? "").join("");
      found.push({ node: pos, pos: pos + 1, language: shownLanguage(named), text });
    }
    pos += blockSize(node);
  }
  return found;
}

/// The languages the app knows, as a menu names them.
export const codeLanguages: [string, string][] = [
  ["rust", "Rust"], ["ts", "TypeScript"], ["js", "JavaScript"], ["python", "Python"],
  ["json", "JSON"], ["bash", "Bash"], ["sql", "SQL"], ["go", "Go"],
  ["html", "HTML"], ["css", "CSS"], ["markdown", "Markdown"], ["", "Простой текст"],
];

/// What the block's corner says: a known language by its name, anything else
/// by the fence's own word.
export function languageLabel(name: string): string {
  const found = codeLanguages.find(([value]) => value === name);
  return found ? found[1] : (name || "Простой текст");
}

/// Names a code block: the same attribute the scanner reads.
export function pickCodeLanguage(language: string, node: number) {
  const live = editor;
  if (!live) return;
  live.run(setNodeAttribute(node, "language", language));
  paintCode();
}

const copiedId = signal<number | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

function copyBlock(text: string, id: number) {
  void Clipboard.writeText(text);
  copiedId.set(id);
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => { copiedId.set(null); copiedTimer = null; }, 1400);
}

/// The plugin the code block's colours are handed to.
const highlight = new RichEditorPlugin("highlight");
/// The theme the code colours were picked for, so a switch repaints them.
let paintedDark = true;
const selectedId = signal<string | null>(null);
const draftTitle = signal("");
const dirty = signal(false);
const slashOpen = signal(false);
const slashQuery = signal("");
const slashIndex = signal(0);
const slashTop = signal(0);
const slashLeft = signal(0);
/// The room the library's grid has: measured, so the cards keep their shape.
const gridWidth = signal(0);

/// A phone's width: the library and the page take the narrow layout.
function compact() {
  const room = gridWidth() > 0 ? gridWidth() : pageRoom();
  return room > 0 && room < COMPACT_LIBRARY;
}
/// The library shows its skeletons until the host answers with the notes.
const loading = signal(true);
/// The room the note's page has: the column is measured, not stretched.
const pageRoom = signal(0);
const pageTall = signal(0);
/// A note was just asked for: the one that turns up next opens by itself.
let openingNew = false;
let editor: RichEditorSession | null = null;
/// The editor's plugin that takes the list's keys while it is open. The app's
/// `keymap` never sees an arrow: the text field has it first.
let slashKeys: RichEditorPlugin | null = null;
let asked = false;
/// A note with a code block is drawn as a column of pieces: prose stays in an
/// editor, and each code block is a card (a flex header, then the code). The
/// rich editor has no slot for a row inside a code block, so the card is the
/// row. A note with no code stays one editor, which is what scrolling and the
/// slash menu are built on.
type Seg = {
  id: number;
  kind: "prose" | "code";
  session: RichEditorSession;
  keys: RichEditorPlugin;
  paint: RichEditorPlugin | null;
};
type Group = { kind: "prose"; nodes: unknown[] } | { kind: "code"; node: unknown };
let segments: Seg[] = [];
let segSerial = 0;
/// Bumped when the sessions are replaced, so a listener from the previous
/// ones returns without touching a disposed editor.
let epoch = 0;
let split = false;
const codeLayout = signal(false);
const segmentList = signal<{ id: number; kind: "prose" | "code" }[]>([]);
const bodyRev = signal(0);
const segRefs = new Map<number, RichEditorRef>();
let wantFocus: number | null = null;
let reshaping = false;
let splitTimer: ReturnType<typeof setTimeout> | null = null;
let reshapeTimer: ReturnType<typeof setTimeout> | null = null;
let reshapeRuns = 0;

export function bindNoteCommands(next: NoteCommands) {
  commands = next;
}

/// A note the host made: the library gains it, and the request that asked for
/// it opens it. A created note comes back alone, so the library is not resent.
export function addNote(note: Note) {
  loading.set(false);
  const id = text(note.id);
  notes.set([note, ...notes().filter((item) => text(item.id) !== id)]);
  if (openingNew) {
    openingNew = false;
    select(note);
  }
}

export function setNotes(next: Note[]) {
  loading.set(false);
  const before = new Set(notes().map((note) => text(note.id)));
  notes.set(next);
  if (openingNew) {
    const fresh = next.find((note) => !before.has(text(note.id)));
    if (fresh) {
      openingNew = false;
      select(fresh);
      return;
    }
  }
  const current = selectedId();
  if (current && next.some((note) => text(note.id) === current)) return;
  if (current) closeNote();
}

/// Ids and titles cross the host boundary as values of their own type, so they
/// compare by their text, not by identity.
function text(value: unknown): string {
  return String(value);
}

/// Walks the document counting positions the way the editor does, and marks the
/// words inside its code blocks.
function paintNodes(nodes: unknown[], from: number, palette: Record<TokenKind, string>, out: { from: number; to: number; kind: string; attrs: { class: string } }[]): number {
  let at = from;
  for (const node of nodes as { type?: string; text?: string; attrs?: { language?: string }; content?: unknown[] }[]) {
    const kind = node?.type;
    if (kind === "text") {
      at += String(node.text ?? "").length;
      continue;
    }
    if (kind === "codeBlock") {
      const body = (Array.isArray(node.content) ? node.content : []).map((child) => String((child as { text?: string })?.text ?? "")).join("");
      for (const token of scan(body, languageOf(node?.attrs?.language))) {
        // The view takes a decoration's `class`, not its style: the colour is
        // a Tailwind arbitrary value, as everywhere else in the app.
        out.push({ from: at + 1 + token.from, to: at + 1 + token.to, kind: "inline", attrs: { class: `text-[${palette[token.kind]}]` } });
      }
      at += body.length + 2;
      continue;
    }
    if (Array.isArray(node?.content)) {
      at = paintNodes(node.content, at + 1, palette, out) + 1;
      continue;
    }
    at += 1;
  }
  return at;
}

/// Colours the code blocks of the open note, once its text has settled.
function paintCode() {
  const palette = tokenColors(paintedDark);
  if (split) {
    for (const seg of segments) {
      if (!seg.paint) continue;
      const marks: { from: number; to: number; kind: string; attrs: { class: string } }[] = [];
      const doc = seg.session.getJSON() as { content?: unknown[] };
      paintNodes(doc.content ?? [], 0, palette, marks);
      seg.session.setDecorations(seg.paint.key, marks as never);
    }
    return;
  }
  const live = editor;
  if (!live) return;
  const marks: { from: number; to: number; kind: string; attrs: { class: string } }[] = [];
  const doc = live.getJSON() as { content?: unknown[] };
  paintNodes(doc.content ?? [], 0, palette, marks);
  live.setDecorations("highlight", marks as never);
}

let paintTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePaint() {
  if (paintTimer) clearTimeout(paintTimer);
  paintTimer = setTimeout(paintCode, 60);
}

function editorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Markdown's blocks and marks: a task list is `- [ ]`, which the
      // document keeps as a `checked` attribute. The rest — text alignment,
      // highlight, sub- and superscript — has no Markdown spelling and stays
      // off.
      highlight: false,
      subscript: false,
      superscript: false,
      textStyle: false,
      textAlign: false,
    }),
    TableKit.configure({}),
  ];
}

function docOf(nodes: unknown[]): unknown {
  return { type: "doc", content: nodes.length ? nodes : [{ type: "paragraph" }] };
}

function hasCodeBlock(doc: unknown): boolean {
  const content = (doc as { content?: { type?: string }[] } | null)?.content;
  return Array.isArray(content) && content.some((node) => node?.type === "codeBlock");
}

function groupsOf(doc: unknown): Group[] {
  const content = (doc as { content?: unknown[] } | null)?.content;
  const nodes = Array.isArray(content) ? content : [];
  const groups: Group[] = [];
  let prose: unknown[] = [];
  const flush = () => {
    if (!prose.length) return;
    groups.push({ kind: "prose", nodes: prose });
    prose = [];
  };
  for (const node of nodes) {
    if ((node as { type?: string })?.type === "codeBlock") {
      flush();
      groups.push({ kind: "code", node });
    } else prose.push(node);
  }
  flush();
  if (!groups.length) groups.push({ kind: "prose", nodes: [{ type: "paragraph" }] });
  return groups;
}

function groupKinds(doc: unknown): string {
  return groupsOf(doc).map((group) => group.kind).join(",");
}

/// The note as one document: the single editor, or the pieces joined back.
function currentDoc(): unknown {
  if (!split) return editor ? editor.getJSON() : docOf([]);
  const content: unknown[] = [];
  for (const seg of segments) {
    const doc = seg.session.getJSON() as { content?: unknown[] };
    content.push(...(doc.content ?? []));
  }
  return docOf(content);
}

function currentText(): string {
  if (!split) return editor ? editor.getText() : "";
  return segments.map((seg) => seg.session.getText()).filter((part) => part.length > 0).join("\n");
}

function codeOrdinal(doc: unknown, pos: number): number {
  const content = (doc as { content?: unknown[] }).content ?? [];
  let at = 0;
  let ordinal = 0;
  for (const node of content) {
    const size = blockSize(node);
    if ((node as { type?: string }).type === "codeBlock") {
      if (pos >= at && pos <= at + size) return ordinal;
      ordinal += 1;
    }
    at += size;
  }
  return Math.max(0, ordinal - 1);
}

function shapeDrifted(): boolean {
  return groupKinds(currentDoc()) !== segments.map((seg) => seg.kind).join(",");
}

function activeCodeOrdinal(): number {
  const index = segments.findIndex((seg) => seg.session === editor);
  if (index < 0 || segments[index].kind !== "code") return -1;
  return segments.slice(0, index + 1).filter((seg) => seg.kind === "code").length - 1;
}

function retireSeg(seg: Seg) {
  try { seg.session.dispose(); } catch { /* already gone */ }
  try { seg.keys.dispose(); } catch { /* already gone */ }
  try { seg.paint?.dispose(); } catch { /* already gone */ }
  segRefs.delete(seg.id);
}

function bindSeg(session: RichEditorSession, epochAt: number) {
  session.on("revision", () => {
    if (epoch !== epochAt || reshaping) return;
    if (!segments.some((seg) => seg.session === session)) return;
    editor = session;
    const seg = segments.find((item) => item.session === session);
    if (seg?.kind === "prose") slashKeys = seg.keys;
    scheduleSave();
    syncSlash();
    scheduleOutline();
    if (seg?.kind === "code" || session.findParentNode("codeBlock")) schedulePaint();
    bodyRev.set(bodyRev() + 1);
    if (split && shapeDrifted()) scheduleReshape();
  });
}

function createSeg(group: Group): Seg {
  const id = ++segSerial;
  const keys = new RichEditorPlugin(`slash-${id}`);
  keys.captureKeys(["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"], (key) => onSlashKey(key));
  const paint = group.kind === "code" ? new RichEditorPlugin(`paint-${id}`) : null;
  const content = group.kind === "code" ? docOf([group.node]) : docOf(group.nodes);
  const plugins = paint ? [keys, paint] : [keys];
  const epochAt = epoch;
  const make = (body: unknown) => createRichEditor({
    extensions: editorExtensions(),
    plugins,
    content: body as never,
    format: "json",
  });
  let session: RichEditorSession;
  try {
    session = make(content);
  } catch {
    session = make(docOf([{ type: "paragraph" }]));
  }
  bindSeg(session, epochAt);
  return { id, kind: group.kind, session, keys, paint };
}

/// Replaces the open editors with one session per run of prose and per code
/// block. `focusOrdinal` is the code block the caret was in, so typing
/// continues there.
function becomeSplit(doc: unknown, focusOrdinal: number) {
  epoch += 1;
  reshaping = true;
  if (splitTimer) { clearTimeout(splitTimer); splitTimer = null; }
  if (reshapeTimer) { clearTimeout(reshapeTimer); reshapeTimer = null; }
  const retiring = segments.slice();
  const retiringSingle = editor && !retiring.some((seg) => seg.session === editor) ? editor : null;
  let groups = groupsOf(doc);
  let built = groups.map((group) => createSeg(group));
  const flat = docOf(built.flatMap((seg) => ((seg.session.getJSON() as { content?: unknown[] }).content ?? [])));
  if (groupKinds(flat) !== groups.map((group) => group.kind).join(",")) {
    for (const seg of built) retireSeg(seg);
    groups = groupsOf(flat);
    built = groups.map((group) => createSeg(group));
  }
  segments = built;
  split = true;
  codeLayout.set(true);
  const codes = built.filter((seg) => seg.kind === "code");
  const focus = focusOrdinal >= 0 ? codes[focusOrdinal] ?? null : null;
  const active = focus ?? built.find((seg) => seg.kind === "prose") ?? built[0] ?? null;
  editor = active?.session ?? null;
  slashKeys = active?.kind === "prose" ? active.keys : (built.find((seg) => seg.kind === "prose")?.keys ?? null);
  wantFocus = focus?.id ?? null;
  segmentList.set(built.map((seg) => ({ id: seg.id, kind: seg.kind })));
  reshaping = false;
  for (const seg of retiring) retireSeg(seg);
  if (retiringSingle) {
    try { retiringSingle.dispose(); } catch { /* already gone */ }
  }
  paintCode();
}

function scheduleSplit(ordinal: number) {
  if (splitTimer || split) return;
  const epochAt = epoch;
  splitTimer = setTimeout(() => {
    splitTimer = null;
    if (epoch !== epochAt || !editor || split) return;
    const doc = editor.getJSON();
    if (!hasCodeBlock(doc)) return;
    becomeSplit(doc, ordinal);
  }, 0);
}

function scheduleReshape() {
  if (reshapeTimer || reshapeRuns > 8) return;
  const epochAt = epoch;
  reshapeTimer = setTimeout(() => {
    reshapeTimer = null;
    if (epoch !== epochAt || !split || reshaping) return;
    if (!shapeDrifted()) return;
    reshapeRuns += 1;
    becomeSplit(currentDoc(), activeCodeOrdinal());
  }, 0);
}

function teardownEditors() {
  epoch += 1;
  reshaping = true;
  if (splitTimer) { clearTimeout(splitTimer); splitTimer = null; }
  if (reshapeTimer) { clearTimeout(reshapeTimer); reshapeTimer = null; }
  reshapeRuns = 0;
  if (paintTimer) { clearTimeout(paintTimer); paintTimer = null; }
  const retiring = segments.slice();
  const single = editor && !retiring.some((seg) => seg.session === editor) ? editor : null;
  segments = [];
  editor = null;
  slashKeys = null;
  split = false;
  wantFocus = null;
  segRefs.clear();
  codeLayout.set(false);
  segmentList.set([]);
  copiedId.set(null);
  for (const seg of retiring) retireSeg(seg);
  if (single) {
    try { single.dispose(); } catch { /* already gone */ }
  }
  reshaping = false;
}

/// Opens a note: one editor when the note has no code, a column of cards
/// when it does.
function open(note: Note | null) {
  teardownEditors();
  closeSlash();
  slashIndex.set(0);
  if (note) {
    const doc = documentOf(note.doc);
    if (hasCodeBlock(doc)) becomeSplit(doc, -1);
    else mountSingle(doc);
    // What is on disk already: a caret move must not look like an edit and
    // send the library back through the host.
    savedBody = JSON.stringify(currentDoc());
    savedTitle = text(note.title);
    // The rails come from the note's own document: the session's copy is the
    // same one, and this way they are there on the first frame.
    outline.set(headingsOf(doc));
    paintCode();
  } else {
    outline.set([]);
  }
  editorVersion.set(editorVersion() + 1);
}

/// One editor for the whole note. A code block inserted later becomes a card.
function mountSingle(doc: unknown) {
  const epochAt = epoch;
  const keys = new RichEditorPlugin("slash-keys");
  keys.captureKeys(["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"], (key) => onSlashKey(key));
  const made = makeEditor(doc, keys);
  slashKeys = keys;
  made.on("revision", () => {
    if (epoch !== epochAt || editor !== made) return;
    scheduleSave();
    // The suggestion state lands with the transaction: reading it a second
    // time once the update is applied is what keeps `/` from opening the
    // menu every other try.
    syncSlash();
    scheduleOutline();
    // Colouring a page of ten thousand blocks on every keystroke is what
    // made typing stutter: the code is painted while the caret is in it.
    if (made.findParentNode("codeBlock")) schedulePaint();
    if (hasCodeBlock(made.getJSON())) {
      const parent = made.findParentNode("codeBlock") as { pos?: number } | null;
      scheduleSplit(codeOrdinal(made.getJSON(), parent?.pos ?? 0));
    }
  });
  editor = made;
}

/// The editor for a document when the schema takes it, an empty one
/// otherwise, so a broken note still opens.
function makeEditor(doc: unknown, keys: RichEditorPlugin): RichEditorSession {
  const options = (content: unknown) => ({
    extensions: editorExtensions(),
    plugins: [keys, highlight],
    content: content as never,
    format: "json" as const,
  });
  try {
    return createRichEditor(options(doc));
  } catch {
    return createRichEditor(options(documentOf(null)));
  }
}

/// A document that crossed from the host as a value of its own type goes back
/// into the editor as plain JSON; an empty body is a document with one
/// paragraph, which the schema needs.
function documentOf(doc: unknown): unknown {
  if (!doc) return { type: "doc", content: [{ type: "paragraph" }] };
  try {
    return JSON.parse(JSON.stringify(doc));
  } catch {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
}

/// One heading as the rails show it: how deep, what it says, and where it
/// starts in the document's positions.
export type OutlineMark = { level: number; text: string; pos: number };

/// The headings of a document, in order, with their positions. A position is
/// what the editor's selection takes: a node starts after its content and one
/// position per block, so the marks need the sizes of the blocks before them.
/// A note as Markdown, as the editor writes it. The document is the truth; the
/// Markdown spelling is the check that it stays Markdown's shape.
export function markdownOf(doc: unknown): string {
  const session = createRichEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), TableKit.configure({})],
    content: documentOf(doc) as never,
    format: "json",
  });
  try {
    return session.getMarkdown();
  } finally {
    session.dispose();
  }
}

export function headingsOf(doc: unknown): OutlineMark[] {
  const root = doc as { content?: unknown[] } | null;
  if (!root || !Array.isArray(root.content)) return [];
  const marks: OutlineMark[] = [];
  let pos = 1;
  for (const node of root.content) {
    const block = node as { type?: string; attrs?: { level?: number }; content?: { text?: string }[] };
    if (block.type === "heading" && Array.isArray(block.content)) {
      const text = block.content.map((child) => child?.text ?? "").join("").trim();
      marks.push({ level: Math.min(3, Math.max(1, block.attrs?.level ?? 1)), text, pos: pos + 1 });
    }
    pos += nodeSize(node);
  }
  return marks;
}

export function nodeSize(node: unknown): number {
  const block = node as { text?: string; content?: unknown[] } | null;
  if (!block) return 1;
  if (typeof block.text === "string") return block.text.length;
  if (!Array.isArray(block.content)) return 1;
  let size = 1;
  for (const child of block.content) size += nodeSize(child);
  return size;
}

/// Heading edits arrive with every keystroke; the rails can wait a moment.
function scheduleOutline() {
  if (outlineTimer) clearTimeout(outlineTimer);
  outlineTimer = setTimeout(() => {
    outlineTimer = null;
    if (!editor && !split) return;
    const next = headingsOf(currentDoc());
    const current = outline();
    // A caret move fires a revision too: only a changed outline re-renders.
    const same = next.length === current.length && next.every((mark, index) => {
      const old = current[index];
      return mark.pos === old.pos && mark.text === old.text && mark.level === old.level;
    });
    if (!same) outline.set(next);
  }, 320);
}

/// Puts the caret at the end of the note: what a press below the text means.
function caretToEnd() {
  if (split && segments.length) {
    const last = segments[segments.length - 1];
    const ref = segRefs.get(last.id);
    if (!ref) return;
    editor = last.session;
    if (last.kind === "prose") slashKeys = last.keys;
    ref.focus();
    ref.setSelection(headingsEnd(last.session.getJSON()), headingsEnd(last.session.getJSON()));
    return;
  }
  if (!editor || !editorRef) return;
  const end = headingsEnd(editor.getJSON());
  editorRef.focus();
  editorRef.setSelection(end, end);
}

function headingsEnd(doc: unknown): number {
  const root = doc as { content?: unknown[] } | null;
  if (!root || !Array.isArray(root.content) || root.content.length === 0) return 1;
  let pos = 1;
  for (const node of root.content) pos += nodeSize(node);
  // The last position inside the document, where typing continues the last
  // block rather than starting a new one after it.
  return Math.max(1, pos - 1);
}

/// The `/query` typed right before the caret: where it starts, where it ends,
/// and what follows the slash. Read from the text itself, so a transaction the
/// plugin state has not caught up with cannot hide the list.
type SlashMatch = { from: number; to: number; query: string };

let slashRange: SlashMatch | null = null;

function slashMatch(): SlashMatch | null {
  const live = editor;
  if (!live) return null;
  const selection = live.selection as { type?: string; anchor?: number; head?: number } | null;
  const at = selection?.anchor;
  const head = selection?.head ?? at;
  // A cursor, not a selection: the list belongs where the user types.
  if (selection?.type !== "text" || typeof at !== "number" || at !== head) return null;
  // The document's text up to the caret, blocks apart: a block's own start is
  // not always a position the resolver gives back.
  const before = live.textBetween(0, at, "\n");
  // A block's own start or a space before the slash: the same place Tiptap
  // would offer its list, and the only place a slash is not just a character.
  const found = /(?:^|\s)\/([^\s/]*)$/.exec(before);
  if (!found) return null;
  const query = found[1] ?? "";
  return { from: at - (query.length + 1), to: at, query };
}

/// Puts the list by the caret: page coordinates, less the page's own corner.
function placeSlash(pos: number) {
  const live = editor;
  const anchor = menuAnchor;
  if (!live || !anchor) return;
  const page = live.pageCoordsAtPos(pos) as Point | null;
  if (!page) return;
  void anchor.measure().then((box) => {
    if (!box) return;
    const x = page.x - box.pagePosition.x;
    const y = page.y - box.pagePosition.y;
    // The caret sits at the bottom edge as the editor follows it: below it
    // there is no room for the list, so the list goes above.
    const below = y + 24;
    const above = y - SLASH_MENU_HEIGHT - 8;
    slashLeft.set(Math.max(0, x));
    slashTop.set(below + SLASH_MENU_HEIGHT <= box.bounds.size.height ? below : Math.max(0, above));
  });
}

function syncSlash() {
  const match = slashMatch();
  if (!match) {
    closeSlash();
    return;
  }
  slashRange = match;
  slashQuery.set(match.query.toLowerCase());
  if (!slashOpen()) {
    slashIndex.set(0);
    slashOpen.set(true);
    bindSlashKeys();
    // Once, on opening: every later keystroke would measure the page again
    // for a list that has not moved.
    placeSlash(match.from);
  }
  const count = filtered(slashQuery()).length;
  if (slashIndex() > count - 1) slashIndex.set(0);
}

function filtered(query: string): SlashItem[] {
  if (!query) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => item.label.toLowerCase().includes(query) || item.id.includes(query));
}

/// The keys the list takes while it is open: the arrows move, Enter and Tab
/// pick, Escape closes.
function onSlashKey(key: string) {
  if (!slashOpen()) return;
  if (key === "Escape") {
    closeSlash();
    return;
  }
  if (key === "Enter" || key === "Tab") {
    pick();
    return;
  }
  const count = filtered(slashQuery()).length;
  if (count === 0) return;
  if (key === "ArrowDown") slashIndex.set((slashIndex() + 1) % count);
  if (key === "ArrowUp") slashIndex.set((slashIndex() + count - 1) % count);
}

/// Drops the typed `/query` and makes the block in one step, so undo takes both
/// back together.
function pick() {
  const item = filtered(slashQuery())[slashIndex()];
  const range = slashRange;
  closeSlash();
  if (!item || !editor || !range) return;
  editor.run(chain([deleteRange({ from: range.from, to: range.to }), item.make()]));
}

function closeSlash() {
  slashRange = null;
  if (slashOpen()) slashOpen.set(false);
  unbindSlashKeys();
}

/// The list's keys belong to it while it is open: the editor's own keymap
/// would otherwise move the caret under a list that is the app's.
function bindSlashKeys() {
  if (slashKeys) slashKeys.capturing = true;
}

function unbindSlashKeys() {
  if (slashKeys) slashKeys.capturing = false;
}

function select(note: Note | null) {
  flushSave();
  applyPreview();
  selectedId.set(note ? text(note.id) : null);
  draftTitle.set(note ? text(note.title) : "");
  dirty.set(false);
  open(note);
  if (note) rememberRecent({ kind: "note", id: text(note.id), title: text(note.title).trim() || "Без названия" });
}

/// The open note's name, for the window's title bar.
export const openNoteTitle = () => (selectedId() ? draftTitle() : "");
/// Whether a note is open, so the title bar names it instead of the page.
export const hasOpenNote = () => selectedId() !== null;
export const renameOpenNote = (value: string) => editTitle(value);
export const closeOpenNote = () => closeNote();
export const removeOpenNote = () => removeNote();
/// A new note straight from the keyboard, the way the floating button does it.
export const createOpenNote = () => createNote();

/// Opens a note from elsewhere in the app, the sidebar's recent list first.
export function openNoteById(id: string) {
  const note = notes().find((item) => text(item.id) === id);
  if (note) select(note);
}

function selected(): Note | null {
  const id = selectedId();
  if (!id) return null;
  return notes().find((note) => text(note.id) === id) ?? null;
}

function editTitle(value: string) {
  draftTitle.set(value);
  scheduleSave();
}

function scheduleSave() {
  dirty.set(true);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, SAVE_DELAY_MS);
}

/// A saved note's library copy, applied when the page is left.
let pendingPreview: { id: string; title: string; text: string } | null = null;

/// The document and title as they were last written: a revision fires on a
/// caret move too, and saving then would refresh the whole library.
let savedBody = "";
let savedTitle = "";

function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!dirty()) return;
  const note = selected();
  if (!note || (!editor && !split)) return;
  const title = draftTitle().trim() || "Без названия";
  const doc = currentDoc();
  const body = currentText();
  const serialized = JSON.stringify(doc);
  if (serialized === savedBody && title === savedTitle) {
    dirty.set(false);
    return;
  }
  savedBody = serialized;
  savedTitle = title;
  dirty.set(false);
  commands.save(text(note.id), title, doc);
  // The library's copy waits: writing it here re-renders the page under the
  // editor, and the editor loses the caret (the slash menu never opens after a
  // save). It lands when the page is left.
  pendingPreview = { id: text(note.id), title, text: body };
}

function applyPreview() {
  if (!pendingPreview) return;
  const { id, title, text: body } = pendingPreview;
  pendingPreview = null;
  notes.set(notes().map((item) => (text(item.id) === id ? { ...item, title, text: body } : item)));
}

function createNote() {
  flushSave();
  applyPreview();
  openingNew = true;
  commands.create("", null);
}

/// Back to the library: the page is one screen, so leaving it is a step back.
function closeNote() {
  flushSave();
  applyPreview();
  selectedId.set(null);
  draftTitle.set("");
  open(null);
}

function removeNote() {
  const note = selected();
  if (!note) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  dirty.set(false);
  notes.set(notes().filter((item) => text(item.id) !== text(note.id)));
  forgetRecent("note", text(note.id));
  closeNote();
  commands.remove(text(note.id));
}

/// The notes screen has two faces: the library of cards, and the note itself.
/// Picking a card opens the note across the content's whole width.
export function NotesPage(props: { colors: ThemeColors; dark: boolean; titlebarInset: number; onBack?: () => void }) {
  if (!asked) {
    // The page owns the read: the host answers with the current notes.
    asked = true;
    loading.set(true);
    commands.reload();
  }
  return <View class="min-h-0 flex-1 flex-col" style={{ paddingTop: props.titlebarInset }}>
    {selected()
      ? <Each of={[{ id: selectedId() ?? "" }]} key={((row: { id: string }) => row.id) as any}>{(row) => <NoteView colors={props.colors} dark={props.dark} />}</Each>
      : <LibraryView colors={props.colors} dark={props.dark} onBack={props.onBack} />}
  </View>;
}

/// The library: every note as a card shaped like a page, its first blocks in
/// miniature. The cards come in one after another.
function LibraryView(props: { colors: ThemeColors; dark: boolean; onBack?: () => void }) {
  const colors = props.colors;
  return <View class="relative min-h-0 flex-1 flex-col">
    <View class="flex-row items-center" style={{ height: 54, paddingLeft: compact() ? 12 : GRID_PAD, paddingRight: compact() ? 12 : GRID_PAD - 6, gap: 10 }}>
      {compact() && props.onBack
        ? <View onPress={props.onBack} role="button" accessibilityLabel="Назад" class="items-center justify-center" style={{ width: 24, height: 28, cursor: "pointer" }}>
          <Text class="text-[20px]" style={{ color: colors.accent }}>‹</Text>
        </View>
        : null}
      {/* The page's name stays put: this screen is the library, not a count. */}
      <Text class="text-[17px] font-semibold flex-1" style={{ color: colors.foreground }}>Заметки</Text>
    </View>
    <View class="min-h-0 flex-1" onLayout={(event) => gridWidth.set(event.bounds.size.width)}>
      {loading()
        ? skeletonLibrary(colors, props.dark)
        : notes().length === 0
          ? <EmptyLibrary colors={colors} />
          : compact()
            ? libraryList(notes(), colors, props.dark)
            : libraryGrid(notes(), colors, props.dark)}
    </View>
    {/* Out of the header and over the page: the one thing a card list always
        offers stays within reach of the thumb and of the last row. */}
    <View onPress={createNote} role="button" accessibilityLabel="Новая заметка" class="absolute flex-row items-center justify-center" hoverStyle={{ backgroundColor: surfaceWash(props.dark, 0.1) }} style={{ left: "50%", marginLeft: -92, bottom: 24, width: 184, height: 40, gap: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, cursor: "pointer", boxShadow: cardShadow(props.dark) }}>
      <SharedIcon name="plus" size={15} color={colors.foreground} />
      <Text class="text-[13px] font-medium" style={{ color: colors.foreground }}>Новая заметка</Text>
    </View>
  </View>;
}

/// The cards in rows, as many to a row as their smallest width allows. The rows
/// go through a virtualized list: a library of ten thousand notes makes the
/// cards that are in view and no others.
function libraryGrid(items: readonly Note[], colors: ThemeColors, dark: boolean) {
  const room = Math.max(gridWidth() - GRID_PAD * 2, CARD_MIN);
  const columns = Math.max(1, Math.min(CARD_MAX_COLUMNS, Math.floor((room + CARD_GAP) / (CARD_MIN + CARD_GAP))));
  const cardWidth = (room - CARD_GAP * (columns - 1)) / columns;
  const rows = rowsOf(items, columns);
  const rowHeight = Math.round(cardWidth * CARD_RATIO) + CARD_GAP + 8;
  return <List
    each={rows}
    keyExtractor={(row: Note[]) => "row:" + (row[0] ? text(row[0].id) : "empty")}
    estimatedItemSize={rowHeight}
    testID="notes-grid"
    class="min-h-0 flex-1"
    contentStyle={{ paddingLeft: GRID_PAD, paddingRight: GRID_PAD, paddingTop: 4, paddingBottom: LIBRARY_BOTTOM }}
  >
    {(row: () => Note[], rowIndex: () => number) => <View class="flex-row" style={{ gap: CARD_GAP, paddingBottom: CARD_GAP }}>
      {row().map((note, index) => <NoteCard note={note} index={rowIndex() * columns + index} width={cardWidth} colors={colors} dark={dark} />)}
    </View>}
  </List>;
}

export function rowsOf(notes: readonly Note[], columns: number): Note[][] {
  const rows: Note[][] = [];
  for (let index = 0; index < notes.length; index += columns) rows.push(notes.slice(index, index + columns));
  return rows;
}

/// While the host answers with the notes, the library shows the shape of the
/// page it is about to draw: cards without text, pulsing quietly.
function skeletonLibrary(colors: ThemeColors, dark: boolean) {
  const room = Math.max(gridWidth() - GRID_PAD * 2, CARD_MIN);
  const columns = Math.max(1, Math.min(CARD_MAX_COLUMNS, Math.floor((room + CARD_GAP) / (CARD_MIN + CARD_GAP))));
  const cardWidth = (room - CARD_GAP * (columns - 1)) / columns;
  const height = Math.round(cardWidth * CARD_RATIO);
  const fill = surfaceWash(dark, 0.06);
  const line = (width: number) => <View style={{ width, height: 5, borderRadius: 3, backgroundColor: fill }} />;
  const card = <View style={{ width: cardWidth, height, padding: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}>
    <View class="overflow-hidden" style={{ flex: 1, borderRadius: 16, backgroundColor: colors.card, padding: 14, gap: 8 }}>
      <View style={{ width: cardWidth * 0.55, height: 11, borderRadius: 4, backgroundColor: fill }} />
      <View style={{ marginTop: 6, gap: 6 }}>
        {line(cardWidth * 0.72)}
        {line(cardWidth * 0.64)}
        {line(cardWidth * 0.7)}
        {line(cardWidth * 0.4)}
      </View>
    </View>
  </View>;
  const rows: null[][] = [];
  for (let index = 0; index < 3 * columns; index += columns) rows.push(new Array(columns).fill(null));
  return <View class="min-h-0 flex-1" style={{ paddingLeft: GRID_PAD, paddingRight: GRID_PAD, paddingTop: 4 }}>
    <View style={{ gap: CARD_GAP }}>
      {rows.map((row) => <View class="flex-row" style={{ gap: CARD_GAP }}>
        {row.map(() => card)}
      </View>)}
    </View>
  </View>;
}

/// One note as a page: the title, then its blocks in miniature. Hovering lifts
/// it a little on a spring, as quiet.md's cards do.
/// The library on a phone: one row per note, its title and the first line of
/// the text. Rows go through the same virtualized list as the cards.
function libraryList(items: readonly Note[], colors: ThemeColors, dark: boolean) {
  const wash = surfaceWash(dark, 0.07);
  return <List
    each={items}
    keyExtractor={(note: Note) => "note:" + text(note.id)}
    estimatedItemSize={78}
    class="min-h-0 flex-1"
    contentStyle={{ paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: LIBRARY_BOTTOM }}
  >
    {(note: () => Note) => {
      const item = note();
      const title = text(item.title).trim() || "Без названия";
      return <View onPress={() => select(item)} role="button" accessibilityLabel={title} hoverStyle={{ backgroundColor: wash }} style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 12, paddingBottom: 12, gap: 3, borderRadius: 14, cursor: "pointer" }}>
        <Text class="text-[16px] font-semibold" style={{ color: colors.foreground }}>{title}</Text>
        <Text class="text-[13px]" style={{ color: colors.muted }}>{listLine(item)}</Text>
        <Text class="text-[11px]" style={{ color: colors.muted }}>{stamp(item.updatedAt)}</Text>
      </View>;
    }}
  </List>;
}

/// The first line of a note's text, as the phone's list shows it.
function listLine(note: Note): string {
  const blocks = previewOf(note.doc);
  const readable = blocks.filter((block) => block.text.trim() && (block.kind === "text" || block.kind === "item" || block.kind === "quote"));
  const line = text((readable[0] ?? blocks.find((block) => block.text.trim()))?.text).trim();
  if (!line) return "Пустая заметка";
  return line.length > 80 ? `${line.slice(0, 78)}…` : line;
}

function NoteCard(props: { note: Note; index: number; width: number; colors: ThemeColors; dark: boolean }) {
  const colors = props.colors;
  const title = text(props.note.title).trim() || "Без названия";
  const height = Math.round(props.width * CARD_RATIO);
  const blocks = previewOf(props.note.doc);
  const enter = createMotion({
    initial: { opacity: 0, translateY: 10 },
    enter: {
      keyframes: [{ opacity: 0, translateY: 10 }, { opacity: 1, translateY: 0 }],
      duration: 260,
      delay: cardDelay(props.index),
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  });
  const lift = createMotion();
  const rise = (on: boolean) => {
    void lift.play({
      keyframes: [{ translateY: on ? 0 : -3 }, { translateY: on ? -3 : 0 }],
      duration: 150,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  };
  return <View style={enter.style}>
    <View onPress={() => select(props.note)} onMouseEnter={() => rise(true)} onMouseLeave={() => rise(false)} role="button" accessibilityLabel={title} hoverStyle={{ backgroundColor: surfaceWash(props.dark, 0.07) }} style={{ width: props.width, height, padding: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, cursor: "pointer", boxShadow: cardShadow(props.dark), ...lift.style }}>
      <View class="overflow-hidden" style={{ flex: 1, borderRadius: 16, backgroundColor: colors.card, padding: 14 }}>
        <View class="overflow-hidden" style={{ height: 36 }}>
          <Text class="text-[13px] font-semibold" style={{ color: colors.foreground, lineHeight: 18 }}>{title}</Text>
        </View>
        <View style={{ marginTop: 9, gap: 3 }}>
          {blocks.map((block) => <PreviewLine block={block} colors={colors} />)}
        </View>
      </View>
    </View>
  </View>;
}

function EmptyLibrary(props: { colors: ThemeColors }) {
  const colors = props.colors;
  return <View class="items-center" style={{ paddingTop: 96, gap: 10 }}>
    <Text class="text-[15px]" style={{ color: colors.foreground }}>Заметок пока нет</Text>
    <Text class="text-[12px]" style={{ color: colors.muted }}>Первая заметка — как чистый лист.</Text>
    <View onPress={createNote} role="button" accessibilityLabel="Создать заметку" class="flex-row items-center" hoverStyle={{ backgroundColor: surfaceWash(false, 0.07) }} style={{ marginTop: 6, height: 30, paddingLeft: 12, paddingRight: 14, gap: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, cursor: "pointer" }}>
      <SharedIcon name="plus" size={13} color={colors.foreground} />
      <Text class="text-[13px]" style={{ color: colors.foreground }}>Создать заметку</Text>
    </View>
  </View>;
}

/// The note itself, across the content's width: a back chip, the title, then
/// one column of text with the rails of its headings on the right.
function codeFields(id: number, rev?: number): { language: string; text: string } {
  void rev;
  const seg = segments.find((item) => item.id === id);
  const content = (seg?.session.getJSON() as { content?: { type?: string; attrs?: { language?: string | null }; content?: { text?: string }[] }[] } | undefined)?.content ?? [];
  const block = content.find((node) => node?.type === "codeBlock") ?? content[0];
  const named = typeof block?.attrs?.language === "string" ? block.attrs.language : "";
  const text = (block?.content ?? []).map((child) => child?.text ?? "").join("");
  return { language: shownLanguage(named), text };
}

function setCodeLanguage(id: number, language: string) {
  const seg = segments.find((item) => item.id === id && item.kind === "code");
  if (!seg) return;
  const content = (seg.session.getJSON() as { content?: { type?: string }[] }).content ?? [];
  let pos = 0;
  for (const node of content) {
    if (node?.type === "codeBlock") break;
    pos += blockSize(node);
  }
  seg.session.run(setNodeAttribute(pos, "language", language));
  paintCode();
}

function codeLanguageMenu(id: number, at: Point) {
  void Menu.popup(codeLanguages.map(([value, label]) => ({ label, onSelect: () => setCodeLanguage(id, value) })), at);
}

function attachRef(id: number, ref: RichEditorRef | null) {
  if (!ref) {
    segRefs.delete(id);
    return;
  }
  segRefs.set(id, ref);
  if (wantFocus !== id) return;
  wantFocus = null;
  try {
    ref.focus();
    // Only an empty block is put at its start. A block that already has
    // text keeps the caret the session opened with.
    if (!codeFields(id).text) ref.setSelection(1, 1);
  } catch {
    // The session already has a caret. Typing still lands in the block.
  }
}

const TEXT_BLOCKS = new Set(["paragraph", "heading", "listItem", "bulletList", "orderedList", "blockquote", "codeBlock", "table", "tableRow", "taskList", "taskItem"]);

function plainOf(node: unknown): string {
  const block = node as { type?: string; text?: string; content?: unknown[] } | null;
  if (!block) return "";
  if (typeof block.text === "string") return block.text;
  if (!Array.isArray(block.content)) return "";
  const blocky = block.content.some((child) => TEXT_BLOCKS.has(String((child as { type?: string })?.type ?? "")));
  return block.content.map(plainOf).filter((part) => part.length > 0).join(blocky ? "\n" : "");
}

function wrappedLines(text: string, width: number, font: number): number {
  const per = Math.max(8, Math.floor(Math.max(40, width) / (font * 0.62)));
  let lines = 0;
  for (const line of (text || " ").split("\n")) lines += Math.max(1, Math.ceil(line.length / per));
  return lines;
}

function pieceWidth(room: number): number {
  const pad = room > 0 ? (room < COMPACT_LIBRARY ? 16 : Math.max((room - PAGE_MAX) / 2, PAGE_PAD / 2)) : PAGE_PAD;
  return Math.max(220, (room > 0 ? room : 720) - pad * 2);
}

/// The prose piece is as tall as its text. The editor's own scroll collapses
/// when the piece has no height of its own, so the height is the lines.
function proseBoxHeight(id: number, room: number, rev?: number): number {
  void rev;
  const seg = segments.find((item) => item.id === id);
  if (!seg) return 48;
  const width = pieceWidth(room);
  const content = (seg.session.getJSON() as { content?: { type?: string; attrs?: { level?: number }; content?: unknown[] }[] }).content ?? [];
  let height = 8;
  for (const node of content) {
    const type = node?.type;
    const level = node?.attrs?.level ?? 1;
    if (type === "heading") {
      const line = level === 1 ? 32 : level === 2 ? 28 : 26;
      const above = level === 1 ? 22 : 12;
      height += above + wrappedLines(plainOf(node), width, line > 26 ? 28 : 18) * line + 6;
    } else if (type === "horizontalRule") height += 40;
    else if (type === "table") height += 40 * Math.max(1, (node.content ?? []).length) + 16;
    else if (type === "bulletList" || type === "orderedList" || type === "blockquote") height += 12 + wrappedLines(plainOf(node), width - 32, 16) * 24;
    else height += 8 + wrappedLines(plainOf(node), width, 16) * 24;
  }
  return Math.max(36, Math.ceil(height + 20));
}

function codeBoxHeight(text: string, room: number): number {
  const per = Math.max(8, Math.floor(Math.max(80, pieceWidth(room) - 28) / 8));
  const lines = (text.length ? text : " ").split("\n").reduce((count, line) => count + Math.max(1, Math.ceil(line.length / per)), 0);
  return 12 + 14 + lines * 21 + 10;
}

/// A code block as shadcn draws it: a header row, then the code. The row is
/// flex, so the language stays on the left and copy on the right without a
/// measured overlay.
function CodeCard(props: { id: number; colors: ThemeColors; dark: boolean; wash: string }) {
  const seg = segments.find((item) => item.id === props.id);
  if (!seg) return <View />;
  return <View style={{ marginTop: 10, marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: props.colors.border, backgroundColor: surfaceWash(props.dark, 0.06), overflow: "hidden" }}>
    <View class="flex-row items-center justify-between" style={{ height: 36, paddingLeft: 12, paddingRight: 4, borderBottomWidth: 1, borderColor: props.colors.border }}>
      <View onPress={(event) => codeLanguageMenu(props.id, event.pagePosition)} role="button" accessibilityLabel={languageLabel(codeFields(props.id, bodyRev()).language)} hoverStyle={{ backgroundColor: props.wash }} style={{ height: 26, paddingLeft: 8, paddingRight: 8, borderRadius: 6, cursor: "pointer", justifyContent: "center" }}>
        <Text class="text-[12px] font-medium" style={{ color: props.colors.muted }}>{languageLabel(codeFields(props.id, bodyRev()).language)}</Text>
      </View>
      <View onPress={() => copyBlock(codeFields(props.id).text, props.id)} role="button" accessibilityLabel="Скопировать" class="items-center justify-center" hoverStyle={{ backgroundColor: props.wash }} style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer" }}>
        {copiedId() === props.id
          ? <Glyph name="check" size={14} color={props.colors.foreground} />
          : <Image src={COPY_ICON} style={{ width: 14, height: 14, tintColor: props.colors.muted }} />}
      </View>
    </View>
    <RichEditor
      editor={seg.session}
      ref={(ref) => attachRef(props.id, ref)}
      accessibilityLabel="Код"
      style={{ height: codeBoxHeight(codeFields(props.id, bodyRev()).text, pageRoom()) }}
      styles={codeStyles(props.colors, props.dark)}
    />
  </View>;
}

function ProsePiece(props: { id: number; colors: ThemeColors; dark: boolean }) {
  const seg = segments.find((item) => item.id === props.id);
  if (!seg) return <View />;
  return <RichEditor
    editor={seg.session}
    ref={(ref) => attachRef(props.id, ref)}
    accessibilityLabel="Текст заметки"
    placeholder={segmentList()[0]?.id === props.id ? "Пишите. Слэш открывает блоки: заголовок, список, таблица…" : undefined}
    style={{ height: proseBoxHeight(props.id, pageRoom(), bodyRev()) }}
    styles={noteStyles(props.colors, props.dark, 0, 0, true)}
  />;
}

function SplitNote(props: { colors: ThemeColors; dark: boolean; wash: string }) {
  // The sheet is pinned to the page. A flex-1 scroll inside a percentage-height
  // column collapses, and then the cards are gone while the rails stay.
  return <Scroll class="min-h-0 flex-1" contentStyle={{ paddingTop: 2, paddingBottom: 120, paddingLeft: pagePad(), paddingRight: pagePad() }}>
    <Each of={segmentList()} key={((row: { id: number; kind: "prose" | "code" }) => String(row.id)) as any}>{(row) => {
      const item = row();
      return item.kind === "code"
        ? <CodeCard id={item.id} colors={props.colors} dark={props.dark} wash={props.wash} />
        : <ProsePiece id={item.id} colors={props.colors} dark={props.dark} />;
    }}</Each>
  </Scroll>;
}

function slashMenu(colors: ThemeColors, wash: string) {
  return <View class="absolute rounded-lg border" style={{ left: slashLeft(), top: slashTop(), width: 264, backgroundColor: colors.card, borderColor: colors.border, paddingTop: 4, paddingBottom: 4 }}>
    {filtered(slashQuery()).map((item, index) => <View onPress={() => { slashIndex.set(index); pick(); }} role="button" accessibilityLabel={item.label} class="flex-row items-center" hoverStyle={{ backgroundColor: wash }} style={{ height: 28, paddingLeft: 10, paddingRight: 10, gap: 8, cursor: "pointer", backgroundColor: index === slashIndex() ? wash : "transparent" }}>
      <Text class="text-[13px] flex-1" style={{ color: colors.foreground }}>{item.label}</Text>
      <Text class="text-[11px]" style={{ color: colors.muted }}>{item.hint}</Text>
    </View>)}
  </View>;
}

function NoteView(props: { colors: ThemeColors; dark: boolean }) {
  const colors = props.colors;
  const wash = surfaceWash(props.dark, 0.07);
  const note = selected();
  // The session is a plain module variable: a reload of the module drops it,
  // while the chosen note stays. Open the note again instead of a blank page.
  if (note && !editor) open(note);
  // A theme switch repaints the code: the colours are picked for the surface.
  if (paintedDark !== props.dark) {
    paintedDark = props.dark;
    queueMicrotask(paintCode);
  }
  const enter = createMotion({
    enter: {
      keyframes: [{ opacity: 0, translateY: 8 }, { opacity: 1, translateY: 0 }],
      duration: 220,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  });
  return <View class="min-h-0 flex-1 flex-col" style={enter.style}>
    {/* The sheet is the page, not the column: the scroll view takes the whole
        width, so its indicator sits at the page's edge, and the text is inset
        to the column's width instead. */}
    <View class="relative min-h-0 flex-1" onLayout={(event) => { pageRoom.set(event.bounds.size.width); pageTall.set(event.bounds.size.height); }}>
    <View class="min-h-0 flex-col" style={{ height: pageTall() > 0 ? pageTall() : undefined, paddingTop: 4 }}>
      {/* A press on the page below the text belongs to the text: the caret
          goes to the end, the way a word processor takes a click on the
          empty part of a sheet. */}
      <View class="relative min-h-0 flex-1 overflow-hidden" ref={(node) => { menuAnchor = node; }} onPress={caretToEnd} testID="note-page-space">
        {codeLayout()
          ? <SplitNote colors={colors} dark={props.dark} wash={wash} />
          : <Each of={[{ stamp: editorVersion() }]} key={((row: { stamp: number }) => row.stamp) as any}>{(row) => editor
            ? <RichEditor
              editor={editor}
              ref={(ref) => { editorRef = ref; }}
              class="min-h-0 flex-1"
              placeholder="Пишите. Слэш открывает блоки: заголовок, список, таблица…"
              accessibilityLabel="Текст заметки"
              styles={noteStyles(colors, props.dark, Math.max(0, pageTall() - 150), pagePad(), false)}
            />
            : <View class="h-full" />}</Each>}
        {slashOpen() && slashMenu(colors, wash)}
      </View>
    </View>
    <View class="absolute top-0 bottom-0" style={{ right: RAIL_INSET }}>
      {outlineRails(colors, props.dark)}
    </View>
    </View>
  </View>;
}

/// The page's side margin: on a phone it is a phone's margin, on a wide page
/// the text keeps a column and the margin takes the rest.
function pagePad() {
  const room = pageRoom();
  if (!(room > 0)) return PAGE_PAD;
  if (compact()) return 16;
  return Math.max((room - PAGE_MAX) / 2, PAGE_PAD / 2);
}

/// The rails: one short mark per heading, longer the higher the heading. A
/// press puts the caret at that heading, and the editor scrolls it into view.
/// A page with fewer than two headings has no rails to draw.
function outlineRails(colors: ThemeColors, dark: boolean) {
  // AnyType draws at most fifty marks: a rail longer than the page stops
  // pointing anywhere.
  const marks = outline().slice(0, OUTLINE_LIMIT);
  if (marks.length < 2) return null;
  return <View class="h-full items-end justify-center" style={{ width: RAIL_WIDTH, gap: 3 }}>
    {marks.map((mark) => <View
      onPress={() => {
        if (split) {
          const found = segmentAt(mark.pos);
          const ref = found ? segRefs.get(found.id) : null;
          const seg = found ? segments.find((item) => item.id === found.id) : null;
          if (!found || !ref || !seg) return;
          editor = seg.session;
          if (seg.kind === "prose") slashKeys = seg.keys;
          ref.focus();
          ref.setSelection(found.local, found.local);
          return;
        }
        if (!editor || !editorRef) return;
        editorRef.focus();
        editorRef.setSelection(mark.pos, mark.pos);
      }}
      role="button"
      accessibilityLabel={mark.text || "Заголовок"}
      class="items-end justify-center"
      hoverStyle={{ backgroundColor: surfaceWash(dark, 0.06) }}
      style={{ width: RAIL_WIDTH, height: 8, paddingRight: 3, borderRadius: 4, cursor: "pointer" }}
    >
      <View style={{ width: 14 / mark.level, height: 2, borderRadius: 2, backgroundColor: colors.muted }} />
    </View>)}
  </View>;
}

/// The document's scale, taken from AnyType's blocks: body 16 on 24, headings
/// 28/22/18 with air above them, code and tables at 14. It is what makes the
/// page read as a page and not as a form.
/// The same inputs give the same object: a fresh one on every render made the
/// editor take its styles again for no reason at all.
let documentStylesCache: { key: string; styles: unknown } | null = null;

/// Where a heading mark falls once the note is several editors: the same
/// counting `headingsOf` uses, started again inside the piece.
function segmentAt(markPos: number): { id: number; local: number } | null {
  let pos = 1;
  for (let index = 0; index < segments.length; index += 1) {
    const seg = segments[index];
    const start = pos;
    const doc = seg.session.getJSON() as { content?: unknown[] };
    for (const node of doc.content ?? []) pos += nodeSize(node);
    if (markPos < pos || index === segments.length - 1) return { id: seg.id, local: markPos - (start - 1) };
  }
  return null;
}

function noteStyles(colors: ThemeColors, dark: boolean, minHeight: number, pad: number, piece = false) {
  const key = `${piece}|${dark}|${minHeight}|${pad}|${colors.background}|${colors.foreground}|${colors.muted}|${colors.border}`;
  if (documentStylesCache?.key !== key) {
    documentStylesCache = { key, styles: documentStyles(colors, dark, minHeight, pad, piece) };
  }
  return documentStylesCache.styles as ReturnType<typeof documentStyles>;
}

let codeStylesCache: { key: string; styles: unknown } | null = null;

function codeStyles(colors: ThemeColors, dark: boolean) {
  const key = `${dark}|${colors.foreground}|${colors.accent}|${colors.muted}`;
  if (codeStylesCache?.key !== key) {
    codeStylesCache = {
      key,
      styles: {
        content: { color: colors.foreground, backgroundColor: "transparent", paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, minHeight: 0 },
        placeholder: { color: colors.muted },
        caret: { backgroundColor: colors.accent },
        nodes: {
          codeBlock: { fontFamily: Mono, fontSize: 13, lineHeight: 21, paddingTop: 12, paddingBottom: 14, paddingLeft: 14, paddingRight: 14, marginTop: 0, marginBottom: 0, backgroundColor: "transparent" },
          paragraph: { fontFamily: Mono, fontSize: 13, lineHeight: 21, marginTop: 0, marginBottom: 0 },
        },
        marks: {},
      },
    };
  }
  return codeStylesCache.styles as ReturnType<typeof documentStyles>;
}

function documentStyles(colors: ThemeColors, dark: boolean, minHeight: number, pad: number, piece = false) {
  return {
    // The page's text fills at least the room it is in: a press below the last
    // line lands on the editable area, and the caret goes where writing goes.
    // The side margins keep the text in its column while the scroll view keeps
    // the page's whole width. A piece sits in the column's own padding.
    content: { color: colors.foreground, backgroundColor: "transparent", paddingTop: piece ? 0 : 2, paddingBottom: piece ? 4 : 120, paddingLeft: piece ? 0 : pad, paddingRight: piece ? 0 : pad, minHeight: piece ? 0 : minHeight },
    placeholder: { color: colors.muted },
    caret: { backgroundColor: colors.accent },
    nodes: {
      paragraph: { fontSize: 16, lineHeight: 24, marginTop: 2, marginBottom: 4 },
      "heading[level=1]": { fontSize: 28, lineHeight: 32, fontWeight: "bold", marginTop: 22, marginBottom: 1 },
      "heading[level=2]": { fontSize: 22, lineHeight: 28, fontWeight: "bold", marginTop: 12, marginBottom: 1 },
      "heading[level=3]": { fontSize: 18, lineHeight: 26, fontWeight: "bold", marginTop: 12, marginBottom: 2 },
      blockquote: { paddingLeft: 28, marginTop: 6, marginBottom: 6, borderLeftWidth: 2, borderColor: colors.border },
      bulletList: { marginTop: 2, marginBottom: 4, paddingLeft: 6 },
      orderedList: { marginTop: 2, marginBottom: 4, paddingLeft: 6 },
      listItem: { fontSize: 16, lineHeight: 24 },
      codeBlock: { fontFamily: Mono, fontSize: 13, lineHeight: 21, paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14, marginTop: piece ? 0 : 6, marginBottom: piece ? 0 : 6, borderRadius: piece ? 0 : 8, backgroundColor: piece ? "transparent" : surfaceWash(dark, 0.08) },
      horizontalRule: { marginTop: 18, marginBottom: 18, borderColor: colors.border },
      table: { marginTop: 6, marginBottom: 6 },
      tableCell: { fontSize: 14, lineHeight: 22, padding: 8, borderColor: colors.border },
      tableHeader: { fontSize: 14, lineHeight: 22, padding: 8, fontWeight: "bold", backgroundColor: surfaceWash(dark, 0.05) },
    },
    marks: {
      code: { fontFamily: Mono, fontSize: 14, color: colors.foreground, backgroundColor: surfaceWash(dark, 0.08) },
      link: { color: colors.accent, textDecorationLine: "underline" },
    },
  } as const;
}

type PreviewBlock = { kind: "heading" | "text" | "item" | "code" | "quote" | "rule"; text: string; level: number };

/// The first blocks of a note, small enough to stand for the page: the same
/// order, the same kinds, taken far enough to fill a card.
function previewOf(doc: unknown): PreviewBlock[] {
  const body = documentOf(doc) as { content?: unknown };
  const blocks = Array.isArray(body.content) ? body.content : [];
  const out: PreviewBlock[] = [];
  const push = (block: PreviewBlock) => {
    if (out.length < PREVIEW_BLOCKS && (block.text || block.kind === "rule")) out.push(block);
  };
  const walk = (node: unknown, depth: number) => {
    if (out.length >= PREVIEW_BLOCKS || !node || typeof node !== "object") return;
    const value = node as { type?: string; attrs?: { level?: number }; content?: unknown[] };
    const nodes = Array.isArray(value.content) ? value.content : [];
    for (const child of nodes) {
      if (out.length >= PREVIEW_BLOCKS) return;
      const type = String((child as { type?: string })?.type ?? "");
      const text = inlineText(child);
      if (type === "heading") push({ kind: "heading", text, level: Number((child as { attrs?: { level?: number } }).attrs?.level ?? 1) });
      else if (type === "paragraph") push({ kind: depth > 0 ? "item" : "text", text, level: 0 });
      else if (type === "codeBlock") push({ kind: "code", text, level: 0 });
      else if (type === "blockquote") walk(child, depth + 1);
      else if (type === "bulletList" || type === "orderedList") walk(child, depth + 1);
      else if (type === "listItem") walk(child, depth);
      else if (type === "horizontalRule") push({ kind: "rule", text: "", level: 0 });
      else if (type === "table") push({ kind: "rule", text: "", level: 0 });
      else if (Array.isArray((child as { content?: unknown[] }).content)) walk(child, depth);
    }
  };
  walk(body, 0);
  return out;
}

function inlineText(node: unknown): string {
  const value = node as { text?: unknown; content?: unknown[] };
  if (typeof value?.text === "string") return value.text;
  if (!Array.isArray(value?.content)) return "";
  return value.content.map((child) => inlineText(child)).join("");
}

const PREVIEW_SIZES: Record<string, { size: number; line: number; weight: "normal" | "bold"; gap: number }> = {
  h1: { size: 12, line: 16, weight: "bold", gap: 6 },
  h2: { size: 11, line: 15, weight: "bold", gap: 5 },
  h3: { size: 10, line: 14, weight: "bold", gap: 4 },
  text: { size: 8, line: 12, weight: "normal", gap: 2 },
  item: { size: 8, line: 12, weight: "normal", gap: 2 },
  code: { size: 7.5, line: 11, weight: "normal", gap: 2 },
  quote: { size: 8, line: 12, weight: "normal", gap: 2 },
};

function PreviewLine(props: { block: PreviewBlock; colors: ThemeColors }) {
  const block = props.block;
  const colors = props.colors;
  if (block.kind === "rule") {
    return <View style={{ height: 1, marginTop: 4, marginBottom: 2, backgroundColor: colors.border }} />;
  }
  const scale = block.kind === "heading" ? PREVIEW_SIZES[`h${Math.min(Math.max(block.level, 1), 3)}`] ?? PREVIEW_SIZES.h1 : PREVIEW_SIZES[block.kind] ?? PREVIEW_SIZES.text;
  const ink = block.kind === "heading" ? colors.foreground : colorAlpha(colors.foreground, 0.62);
  return <Text class="w-full" style={{ fontSize: scale.size, lineHeight: scale.line, fontWeight: scale.weight, fontFamily: block.kind === "code" ? Mono : undefined, color: ink, marginTop: scale.gap, paddingLeft: block.kind === "item" ? 9 : 0 }}>{block.kind === "item" ? `• ${block.text}` : block.text}</Text>;
}

/// A sheet's shadow: barely there in the light theme, a lifted edge in the dark.
function cardShadow(dark: boolean) {
  return dark
    ? "0 1px 2px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.35)"
    : "0 1px 2px rgba(15,23,42,0.06), 0 10px 26px rgba(15,23,42,0.09)";
}

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/// "9 ноя 2026" from the note's stamp; nothing when it has none.
function stamp(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

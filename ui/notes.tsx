import { createMotion, Easing, effect, List, signal, Text, View } from "nsh";
import {
  Input,
  RichEditor,
  RichEditorPlugin,
  StarterKit,
  TableKit,
  chain,
  command,
  createRichEditor,
  exitSuggestion,
  insertTable,
  replaceSuggestion,
  suggestion,
} from "nsh/base";
import type { RichCommand, RichEditorRef, RichEditorSession } from "nsh/base";
import type { ViewRef } from "nsh";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { colorAlpha, surfaceWash } from "./chrome";
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
let keyTaker: RichEditorPlugin | null = null;
let asked = false;

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
  const live = editor;
  if (!live) return;
  const marks: { from: number; to: number; kind: string; attrs: { class: string } }[] = [];
  const doc = live.getJSON() as { content?: unknown[] };
  paintNodes(doc.content ?? [], 0, tokenColors(paintedDark), marks);
  live.setDecorations("highlight", marks as never);
}

let paintTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePaint() {
  if (paintTimer) clearTimeout(paintTimer);
  paintTimer = setTimeout(paintCode, 60);
}

/// Opens a note: a new editor with that note's document, then the view that
/// shows it.
function open(note: Note | null) {
  editor?.dispose();
  editor = null;
  keyTaker = null;
  slashOpen.set(false);
  if (note) {
    const taker = new RichEditorPlugin("slash-keys");
    taker.captureKeys(["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"], (key) => onSlashKey(key));
    const made = makeEditor(note, taker);
    made.on("revision", () => {
      scheduleSave();
      // The suggestion state lands with the transaction: reading it a second
      // time once the update is applied is what keeps `/` from opening the
      // menu every other try.
      syncSlash();
      scheduleOutline();
      schedulePaint();
    });
    editor = made;
    keyTaker = taker;
    // What is on disk already: a caret move must not look like an edit and
    // send the library back through the host.
    savedBody = JSON.stringify(made.getJSON());
    savedTitle = text(note.title);
    // The rails come from the note's own document: the session's copy is the
    // same one, and this way they are there on the first frame.
    outline.set(headingsOf(documentOf(note.doc)));
    paintCode();
  } else {
    outline.set([]);
  }
  editorVersion.set(editorVersion() + 1);
}

/// The editor for a note: its document when the schema takes it, an empty one
/// otherwise, so a broken note still opens.
function makeEditor(note: Note, taker: RichEditorPlugin): RichEditorSession {
  const options = (content: unknown) => ({
    extensions: [
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
    ],
    plugins: [suggestion({ key: "slash", char: "/", allowSpaces: false }), taker, highlight],
    content: content as never,
    format: "json" as const,
  });
  try {
    return createRichEditor(options(documentOf(note.doc)));
  } catch (error) {
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
    if (!editor) return;
    const next = headingsOf(editor.getJSON());
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

function syncSlash() {
  const state = editor?.suggestion("slash");
  if (!editor || !state || !state.active) {
    closeSlash();
    return;
  }
  slashQuery.set((state.query ?? "").trim().toLowerCase());
  if (!slashOpen()) {
    slashOpen.set(true);
    slashIndex.set(0);
  }
  const count = filtered(slashQuery()).length;
  if (slashIndex() > count - 1) slashIndex.set(0);
  if (keyTaker) keyTaker.capturing = true;
  // Page coordinates, less the anchor's own: the editor reports document
  // coordinates, and a scrolled page put the menu far from the caret.
  const page = editor.pageCoordsAtPos(state.range.from) as Point | null;
  const anchor = menuAnchor;
  if (page && anchor) {
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
    editor?.run(exitSuggestion("slash"));
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
  closeSlash();
  if (!item || !editor) return;
  editor.run(chain([replaceSuggestion("", "slash"), item.make()]));
}

function closeSlash() {
  slashOpen.set(false);
  if (keyTaker) keyTaker.capturing = false;
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
  if (!note || !editor) return;
  const title = draftTitle().trim() || "Без названия";
  const doc = editor.getJSON();
  const body = editor.getText();
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
    <View onPress={createNote} role="button" accessibilityLabel="Новая заметка" class="absolute flex-row items-center" hoverStyle={{ opacity: 0.92 }} style={{ right: compact() ? 16 : 24, bottom: 24, height: 40, paddingLeft: 14, paddingRight: 18, gap: 8, borderRadius: 20, backgroundColor: colors.accent, cursor: "pointer", boxShadow: cardShadow(props.dark) }}>
      <SharedIcon name="plus" size={15} color={colors.background} />
      <Text class="text-[13px] font-medium" style={{ color: colors.background }}>Новая заметка</Text>
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
    contentStyle={{ paddingLeft: GRID_PAD, paddingRight: GRID_PAD, paddingTop: 4, paddingBottom: 32 }}
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
    contentStyle={{ paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 32 }}
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
    <View class="min-h-0 flex-col" style={{ height: "100%", paddingTop: 4 }}>
      {/* A press on the page below the text belongs to the text: the caret
          goes to the end, the way a word processor takes a click on the
          empty part of a sheet. */}
      <View class="relative min-h-0 flex-1" ref={(node) => { menuAnchor = node; }} onPress={caretToEnd} testID="note-page-space">
        <Each of={[{ stamp: editorVersion() }]} key={((row: { stamp: number }) => row.stamp) as any}>{(row) => editor
          ? <RichEditor
            editor={editor}
            ref={(ref) => { editorRef = ref; }}
            class="min-h-0 flex-1"
            placeholder="Пишите. Слэш открывает блоки: заголовок, список, таблица…"
            accessibilityLabel="Текст заметки"
            styles={noteStyles(colors, props.dark, Math.max(0, pageTall() - 150), pagePad())}
          />
          : <View class="h-full" />}</Each>
        {slashOpen() && <View class="absolute rounded-lg border" style={{ left: slashLeft(), top: slashTop(), width: 264, backgroundColor: colors.card, borderColor: colors.border, paddingTop: 4, paddingBottom: 4 }}>
          {filtered(slashQuery()).map((item, index) => <View onPress={() => { slashIndex.set(index); pick(); }} role="button" accessibilityLabel={item.label} class="flex-row items-center" hoverStyle={{ backgroundColor: wash }} style={{ height: 28, paddingLeft: 10, paddingRight: 10, gap: 8, cursor: "pointer", backgroundColor: index === slashIndex() ? wash : "transparent" }}>
            <Text class="text-[13px] flex-1" style={{ color: colors.foreground }}>{item.label}</Text>
            <Text class="text-[11px]" style={{ color: colors.muted }}>{item.hint}</Text>
          </View>)}
        </View>}
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

function noteStyles(colors: ThemeColors, dark: boolean, minHeight: number, pad: number) {
  const key = `${dark}|${minHeight}|${pad}|${colors.background}|${colors.foreground}|${colors.muted}|${colors.border}`;
  if (documentStylesCache?.key !== key) {
    documentStylesCache = { key, styles: documentStyles(colors, dark, minHeight, pad) };
  }
  return documentStylesCache.styles as ReturnType<typeof documentStyles>;
}

function documentStyles(colors: ThemeColors, dark: boolean, minHeight: number, pad: number) {
  return {
    // The page's text fills at least the room it is in: a press below the last
    // line lands on the editable area, and the caret goes where writing goes.
    // The side margins keep the text in its column while the scroll view keeps
    // the page's whole width.
    content: { color: colors.foreground, backgroundColor: "transparent", paddingTop: 2, paddingBottom: 120, paddingLeft: pad, paddingRight: pad, minHeight },
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
      codeBlock: { fontSize: 14, lineHeight: 22, padding: 16, marginTop: 6, marginBottom: 6, borderRadius: 8, backgroundColor: surfaceWash(dark, 0.08) },
      horizontalRule: { marginTop: 18, marginBottom: 18, borderColor: colors.border },
      table: { marginTop: 6, marginBottom: 6 },
      tableCell: { fontSize: 14, lineHeight: 22, padding: 8, borderColor: colors.border },
      tableHeader: { fontSize: 14, lineHeight: 22, padding: 8, fontWeight: "bold", backgroundColor: surfaceWash(dark, 0.05) },
    },
    marks: {
      code: { fontSize: 14, color: colors.foreground, backgroundColor: surfaceWash(dark, 0.08) },
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
  return <Text class="w-full" style={{ fontSize: scale.size, lineHeight: scale.line, fontWeight: scale.weight, color: ink, marginTop: scale.gap, paddingLeft: block.kind === "item" ? 9 : 0 }}>{block.kind === "item" ? `• ${block.text}` : block.text}</Text>;
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

import { mount, safeAreaInsets, Scroll, signal, Storage, Text, View } from "nsh";
import { Input } from "nsh/base";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { previewThemes } from "./themes";
import type { JournalEntry, Note, Todo } from "./state";
import { WIDGETS } from "./widgets";
import { buildJournalDays, formatJournalDay, formatJournalStamp } from "./journal-model";
import { bindNoteCommands, NotesPage, openNoteById, setNotes } from "./notes";
import { forgetRecent, loadRecent, recent, rememberRecent } from "./recent";

/// Atlas on a phone: a home screen of widgets, then one page per type. The
/// widgets are the journal, the notes and the tasks — games live on the desk —
/// and each one shows its last few things before it takes the whole screen.
///
/// State lives in the app's storage: the phone build has no Engine yet, so the
/// demo data below is the app's own and every change is written back.

type Screen = "home" | "journal" | "notes" | "tasks" | "settings";

const colors: ThemeColors = previewThemes[0].light;
const INK = colors.foreground;
const MUTED = colors.muted;
const BORDER = colors.border;
const CARD = colors.card;
const BG = colors.background;
const ACCENT = colors.accent;

const STORAGE_KEY = "mundus.atlas.mobile.v1";
const screen = signal<Screen>("home");
const draft = signal("");
const entries = signal<JournalEntry[]>([]);
const todos = signal<Todo[]>([]);
const library = signal<Note[]>([]);
let saved = false;

function doc(text: string, heading?: string) {
  const content: unknown[] = [];
  if (heading) content.push({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: heading }] });
  for (const line of text.split("\n")) {
    if (line.trim()) content.push({ type: "paragraph", content: [{ type: "text", text: line }] });
  }
  return { type: "doc", content };
}

function demoEntries(): JournalEntry[] {
  const day = (offset: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };
  return [
    { id: "m-j1", text: "Утро началось с тишины. Разобрал входящие, выпил кофе, записал план на день.", createdAt: day(2, 8) },
    { id: "m-j2", text: "Долгий день: сводил макеты, спорил про отступы. В итоге оставил 16 на 24.", createdAt: day(1, 21) },
    { id: "m-j3", text: "Гулял два часа. Придумал, как показать историю открытий на телефоне.", createdAt: day(0, 9) },
  ];
}

function demoNotes(): Note[] {
  const stamp = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toISOString();
  };
  return [
    {
      id: "m-n1",
      title: "Как устроены заметки",
      doc: doc("Заметка живёт в Engine как объект core.note. Другие приложения видят те же заметки.\nТекст — документ, не Markdown. Внутри JSON, снаружи обычный вид.\nТаблицы, код и чек-листы разрешены.", "Заметки"),
      text: "Заметки",
      createdAt: stamp(0),
      updatedAt: stamp(0),
    },
    {
      id: "m-n2",
      title: "Идеи",
      doc: doc("быстрый поиск по заметкам\nсвязи между заметками\nэкспорт в папку .md\nрельсы оглавления справа"),
      text: "Идеи",
      createdAt: stamp(1),
      updatedAt: stamp(1),
    },
    {
      id: "m-n3",
      title: "Борщ",
      doc: doc("Свёкла — 2 шт, капуста — 300 г, говядина — 500 г.\nСварить бульон, потушить свёклу с томатом, добавить капусту.\nДать настояться полчаса.", "Рецепт"),
      text: "Борщ",
      createdAt: stamp(2),
      updatedAt: stamp(2),
    },
    {
      id: "m-n4",
      title: "План недели",
      doc: doc("Разобрать входящие\nСвести макеты\nПроверить долгую заметку\nСозвон в четверг"),
      text: "План недели",
      createdAt: stamp(3),
      updatedAt: stamp(3),
    },
  ];
}

function demoTodos(): Todo[] {
  return [
    { id: "m-t1", title: "Перечитать бриф по лендингу", is_completed: false },
    { id: "m-t2", title: "Созвон по дизайну", is_completed: false },
    { id: "m-t3", title: "Отправить инвойс клиенту", is_completed: false },
    { id: "m-t4", title: "Поливать цветы", is_completed: false },
    { id: "m-t5", title: "Купить подарок Маше", is_completed: false },
    { id: "m-t6", title: "Утренняя планёрка", is_completed: true },
  ];
}

function readStored<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function load() {
  void Storage.getItem(STORAGE_KEY).then((raw) => {
    const stored = readStored<{ entries: JournalEntry[]; todos: Todo[]; notes: Note[] }>(raw);
    entries.set(stored?.entries ?? demoEntries());
    todos.set(stored?.todos ?? demoTodos());
    library.set(stored?.notes ?? demoNotes());
    setNotes(library());
    saved = true;
  });
}

function persist() {
  if (!saved) return;
  const value = JSON.stringify({ entries: entries(), todos: todos(), notes: library() });
  void Storage.setItem(STORAGE_KEY, value);
}

bindNoteCommands({
  create(title: string, body: unknown) {
    const at = new Date().toISOString();
    const note: Note = { id: `m-${Date.now()}`, title, doc: body, text: title, createdAt: at, updatedAt: at };
    library.set([note, ...library()]);
    setNotes(library());
    persist();
  },
  save(id: string, title: string, body: unknown) {
    const at = new Date().toISOString();
    library.set(library().map((note) => (note.id === id ? { ...note, title, doc: body, updatedAt: at } : note)));
    setNotes(library());
    persist();
  },
  remove(id: string) {
    library.set(library().filter((note) => note.id !== id));
    setNotes(library());
    forgetRecent("note", id);
    persist();
  },
  reload() {
    setNotes(library());
  },
});

function addEntry() {
  const text = draft().trim();
  if (!text) return;
  const entry: JournalEntry = { id: `m-${Date.now()}`, text, createdAt: new Date().toISOString() };
  entries.set([...entries(), entry]);
  draft.set("");
  persist();
}

function toggleTodo(id: string) {
  todos.set(todos().map((todo) => (todo.id === id ? { ...todo, is_completed: !todo.is_completed } : todo)));
  persist();
}

function openNote(note: Note) {
  rememberRecent({ kind: "note", id: note.id, title: note.title });
  openNoteById(note.id);
  screen.set("notes");
}

/// One card of the home screen: a widget's page in miniature. It is a plain
/// function, not a component, so it re-renders with the screen it belongs to.
function cardFrame(children: unknown) {
  return <View style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 12 }}>
    {children as never}
  </View>;
}

function cardHead(icon: "book" | "note" | "task", title: string, count: string, onMore: () => void) {
  return <View class="flex-row items-center" style={{ gap: 10 }}>
    {icon === "book" ? <GlyphBook /> : icon === "note" ? <GlyphPage /> : <SharedIcon name="check" size={18} color={INK} />}
    <Text class="text-[16px] font-semibold flex-1" style={{ color: INK }}>{title}</Text>
    <Text class="text-[12px]" style={{ color: MUTED }}>{count}</Text>
    <View onPress={onMore} role="button" accessibilityLabel={`Открыть: ${title}`} style={{ paddingLeft: 8, paddingRight: 2, cursor: "pointer" }}>
      <Text class="text-[16px]" style={{ color: MUTED }}>›</Text>
    </View>
  </View>;
}

function GlyphBook() {
  return <View style={{ width: 18, height: 16, borderRadius: 3, borderWidth: 1.6, borderColor: INK }}>
    <View style={{ position: "absolute", top: 4, left: 2, right: 2, height: 1.6, backgroundColor: INK }} />
    <View style={{ position: "absolute", top: 8, left: 2, right: 5, height: 1.6, backgroundColor: INK }} />
  </View>;
}

function GlyphPage() {
  return <View style={{ width: 16, height: 18, borderRadius: 3, borderWidth: 1.6, borderColor: INK, paddingTop: 3, paddingLeft: 2, gap: 2 }}>
    <View style={{ width: 8, height: 1.6, backgroundColor: INK }} />
    <View style={{ width: 10, height: 1.6, backgroundColor: INK }} />
    <View style={{ width: 6, height: 1.6, backgroundColor: INK }} />
  </View>;
}

function header(title: string, onBack: () => void) {
  return <View class="flex-row items-center" style={{ gap: 8, paddingLeft: 16, paddingRight: 16, height: 52 }}>
    <View onPress={onBack} role="button" accessibilityLabel="Назад" class="flex-row items-center" style={{ gap: 2, height: 36, cursor: "pointer" }}>
      <Text class="text-[22px]" style={{ color: ACCENT }}>‹</Text>
      <Text class="text-[16px]" style={{ color: ACCENT }}>Назад</Text>
    </View>
    <Text class="text-[16px] font-semibold flex-1" style={{ color: INK }}>{title}</Text>
  </View>;
}

function composer(placeholder: string, label: string, onSend: () => void) {
  return <View class="flex-row items-end" style={{ gap: 10 }}>
    <View style={{ flex: 1, backgroundColor: BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingLeft: 14, paddingRight: 14, paddingTop: 12, paddingBottom: 12 }}>
      <Input
        value={draft()}
        onChange={(event) => draft.set(event.value)}
        onSubmit={onSend}
        placeholder={placeholder}
        accessibilityLabel={label}
        class="w-full text-[15px]"
        style={{ color: INK }}
      />
    </View>
    <View onPress={onSend} role="button" accessibilityLabel="Записать" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      <Text class="text-[19px] font-semibold" style={{ color: "#ffffff" }}>↑</Text>
    </View>
  </View>;
}

/// The home screen: the widgets, top to bottom, each with its last few things.
function homeView(onOpen: (screen: Screen) => void) {
  const journalTop = entries().slice(-2).reverse();
  const noteTop = library().slice(0, 3);
  const open = todos().filter((todo) => !todo.is_completed);
  return <Scroll class="min-h-0 flex-1">
    <View style={{ padding: 16, gap: 14 }}>
      <View class="flex-row items-center" style={{ paddingTop: 6, paddingBottom: 2 }}>
        <Text class="text-[30px] font-bold flex-1" style={{ color: INK }}>Атлас</Text>
        <View onPress={() => onOpen("settings")} role="button" accessibilityLabel="Настройки" style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <SharedIcon name="settings" size={18} color={INK} />
        </View>
      </View>

      {cardFrame([
        cardHead("book", "Дневник", `${entries().length}`, () => onOpen("journal")),
        composer("Записать что угодно…", "Новая запись", addEntry),
        ...journalTop.map((entry) => outline({ gap: 3 }, [
          <Text class="text-[12px]" style={{ color: MUTED }}>{formatJournalStamp(entry.createdAt)}</Text>,
          <Text class="text-[14px]" style={{ color: INK, lineHeight: 20 }}>{entry.text}</Text>,
        ])),
      ])}

      {cardFrame([
        cardHead("note", "Заметки", `${library().length}`, () => onOpen("notes")),
        ...noteTop.map((note) => <View onPress={() => openNote(note)} role="button" accessibilityLabel={note.title} style={{ gap: 3, cursor: "pointer" }}>
          <Text class="text-[15px] font-medium" style={{ color: INK }}>{note.title}</Text>
          <Text class="text-[13px]" style={{ color: MUTED }}>{firstLine(note)}</Text>
        </View>),
        noteTop.length === 0 ? <Text class="text-[14px]" style={{ color: MUTED }}>Пока пусто</Text> : <View />,
      ])}

      {cardFrame([
        cardHead("task", "Задачи", open.length > 0 ? `${open.length}` : "готово", () => onOpen("tasks")),
        ...open.slice(0, 4).map((todo) => <View onPress={() => toggleTodo(todo.id)} role="button" accessibilityLabel={todo.title} class="flex-row items-center" style={{ gap: 12, paddingTop: 4, paddingBottom: 4, cursor: "pointer" }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.6, borderColor: BORDER }} />
          <Text class="text-[15px] flex-1" style={{ color: INK }}>{todo.title}</Text>
        </View>),
        open.length === 0 ? <Text class="text-[14px]" style={{ color: MUTED }}>Ничего не осталось</Text> : <View />,
      ])}

      {recent().length > 0 ? <View style={{ gap: 8, paddingTop: 6 }}>
        <Text class="text-[12px] font-medium" style={{ color: MUTED, paddingLeft: 4 }}>Недавно открытые</Text>
        {recent().slice(0, 5).map((entry) => <Text class="text-[13px]" style={{ color: MUTED, paddingLeft: 4 }}>{entry.title}</Text>)}
      </View> : <View />}
    </View>
  </Scroll>;
}

function outline(style: Record<string, unknown>, children: unknown[]) {
  return <View style={style as never}>{children as never}</View>;
}

function journalView(onBack: () => void) {
  const days = buildJournalDays(entries());
  return <View class="min-h-0 flex-1" style={{ backgroundColor: BG }}>
    {header("Дневник", onBack)}
    <Scroll class="min-h-0 flex-1">
      <View style={{ padding: 16, gap: 18 }}>
        {days.map((day) => <View style={{ gap: 8 }}>
          <Text class="text-[12px] font-medium" style={{ color: MUTED }}>{formatJournalDay(day)}</Text>
          {day.entries.map((entry) => <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 4 }}>
            <Text class="text-[11px]" style={{ color: MUTED }}>{formatJournalStamp(entry.createdAt)}</Text>
            <Text class="text-[15px]" style={{ color: INK, lineHeight: 21 }}>{entry.text}</Text>
          </View>)}
        </View>)}
      </View>
    </Scroll>
    <View style={{ padding: 12, borderTopWidth: 1, borderColor: BORDER, backgroundColor: BG }}>
      {composer("Что было сегодня?", "Запись в дневник", addEntry)}
    </View>
  </View>;
}

function tasksView(onBack: () => void) {
  const open = todos().filter((todo) => !todo.is_completed);
  const done = todos().filter((todo) => todo.is_completed);
  const row = (todo: Todo) => <View onPress={() => toggleTodo(todo.id)} role="button" accessibilityLabel={todo.title} class="flex-row items-center" style={{ gap: 12, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderColor: BORDER, cursor: "pointer" }}>
    {todo.is_completed
      ? <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" }}>
        <Text class="text-[13px] font-bold" style={{ color: "#ffffff" }}>✓</Text>
      </View>
      : <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.6, borderColor: BORDER }} />}
    <Text class="text-[16px] flex-1" style={{ color: todo.is_completed ? MUTED : INK }}>{todo.title}</Text>
  </View>;
  return <View class="min-h-0 flex-1" style={{ backgroundColor: BG }}>
    {header("Задачи", onBack)}
    <Scroll class="min-h-0 flex-1">
      <View style={{ padding: 16 }}>
        <Text class="text-[12px] font-medium" style={{ color: MUTED, paddingBottom: 4 }}>Сегодня</Text>
        {open.map(row)}
        {done.length > 0 ? <Text class="text-[12px] font-medium" style={{ color: MUTED, paddingTop: 22, paddingBottom: 4 }}>Готово</Text> : <View />}
        {done.map(row)}
      </View>
    </Scroll>
  </View>;
}

function settingsView(onBack: () => void) {
  return <View class="min-h-0 flex-1" style={{ backgroundColor: BG }}>
    {header("Настройки", onBack)}
    <Scroll class="min-h-0 flex-1">
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 10 }}>
          <Text class="text-[13px] font-medium" style={{ color: MUTED }}>Виджеты</Text>
          {WIDGETS.filter((widget) => widget.id !== "games").map((widget) => <View class="flex-row items-center" style={{ gap: 10, paddingTop: 8, paddingBottom: 8 }}>
            <Text class="text-[15px] flex-1" style={{ color: INK }}>{widget.label}</Text>
            <Text class="text-[13px]" style={{ color: ACCENT }}>на главном</Text>
          </View>)}
        </View>
        <View style={{ backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 8 }}>
          <Text class="text-[13px] font-medium" style={{ color: MUTED }}>О приложении</Text>
          <Text class="text-[14px]" style={{ color: INK, lineHeight: 20 }}>Atlas для Android. Интерфейс и данные пока живут в приложении; Engine и записи на диск — следующий шаг.</Text>
          <Text class="text-[12px]" style={{ color: MUTED }}>Версия 1.0.0</Text>
        </View>
      </View>
    </Scroll>
  </View>;
}

function MobileApp() {
  const insets = safeAreaInsets();
  return <View
    class="h-full w-full"
    style={{
      backgroundColor: BG,
      paddingTop: insets().top,
      paddingBottom: insets().bottom,
      paddingLeft: insets().left,
      paddingRight: insets().right,
    }}
  >
    {screen() === "home" ? homeView((next) => screen.set(next)) : <View />}
    {screen() === "journal" ? journalView(() => screen.set("home")) : <View />}
    {screen() === "tasks" ? tasksView(() => screen.set("home")) : <View />}
    {screen() === "settings" ? settingsView(() => screen.set("home")) : <View />}
    {screen() === "notes" ? notesView(() => screen.set("home")) : <View />}
  </View>;
}

function notesView(onBack: () => void) {
  return <View class="min-h-0 flex-1" style={{ backgroundColor: BG }}>
    <NotesPage colors={colors} dark={false} titlebarInset={0} onBack={onBack} />
  </View>;
}

function firstLine(note: Note): string {
  const root = note.doc as { content?: { type?: string; content?: { text?: string }[] }[] } | null;
  const blocks = root?.content ?? [];
  for (const block of blocks) {
    if (block.type === "paragraph") {
      const text = (block.content ?? []).map((child) => child.text ?? "").join("").trim();
      if (text) return text.length > 90 ? `${text.slice(0, 88)}…` : text;
    }
  }
  return note.text || "";
}

loadRecent();
void Storage.getItem(STORAGE_KEY);
load();
mount(MobileApp);

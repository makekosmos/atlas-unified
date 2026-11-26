import {
  Animated,
  Storage,
  colorScheme,
  setColorScheme,
  batch,
  Easing,
  createAnimatedValue,
  effect,
  host,
  mount,
  Scroll,
  signal,
  Text,
  View,
  nativeComponent,
  keymap,
  untracked,
} from "nsh";
import { Input } from "nsh/base";
import type { Point } from "nsh";
import { Menu, windows } from "nsh/desktop";
import { Button as SharedButton } from "@makekosmos/imago-nsh";
import type { Appearance } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import {
  fallback,
  noteLabel,
  isRoute,
  isSnapshot,
  resolveAppearanceColors,
} from "./state";
import { cycleShortcut, shortcutOptions, shortcuts } from "./app-shortcuts";
import { previewThemes } from "./themes";
import { Glyph } from "./glyph";
import type { GlyphName } from "./icons";
import type {
  JournalEntry,
  JournalVoice,
  Note,
  Route,
  Snapshot,
} from "./state";
import { JournalPage, markJournalArriving } from "./JournalPage";
import {
  addNote,
  bindNoteCommands,
  closeOpenNote,
  createOpenNote,
  hasOpenNote,
  notes,
  NotesPage,
  openNoteById,
  openNoteId,
  openNoteTitle,
  removeOpenNote,
  requestNoteTitleFocus,
  setNotes,
} from "./notes";
import { AtlasAppearanceSettings } from "./AtlasAppearanceSettings";
import { GamesLibrary, livePrograms } from "./games";
import { SettingsPage as SettingsPageScroll } from "./settings";
import {
  DevelopersPage,
  runBenchmark,
  benchmarkHardware,
  benchmarkFrames,
  benchmarkReady,
  benchmarkRunning,
} from "./developer-page";
import type { BenchmarkEvent } from "./developer-page";
import { loadRecent, recent } from "./recent";
import type { ProgramUsage } from "./games";
import {
  CARD_GAP,
  CARD_RADIUS,
  PAGE_SLIDE,
  PAGE_SLIDE_MS,
  SIDEBAR_WIDTH,
  slideDirection,
  TITLEBAR_HEIGHT,
  TitlebarOverlay,
  animateSidebar,
  animateTabs,
  sidebarPaneWidth,
  shellFill,
  RecentRow,
  SidebarRow,
} from "./chrome";
import type { TabView } from "./chrome";
import { loadPreview, persistPreview } from "./preview";
import { gameLibrary } from "./game-library";
import { Modal, ModalGhost } from "./modal";
import { applyShellTheme } from "./shell-theme";
import { QuickSearch } from "./quick-search";
import { interfaceSize } from "./reading-size";

const initialValue: unknown =
  Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__") ?? host.params.atlas;
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
const snapshot = signal(initial);
const appearanceKey = "mundus.atlas.appearance.v1";
const appearanceDefaults = fallback.appearance!;
const inheritedAppearance =
  initial.appearance?.settings ?? appearanceDefaults.settings;
const localAppearance = signal<Appearance>({
  ...appearanceDefaults,
  settings: {
    ...appearanceDefaults.settings,
    mode: inheritedAppearance.mode,
    accent_source:
      inheritedAppearance.accent_source === "custom" ? "custom" : "theme",
    accent_color: inheritedAppearance.accent_color,
    font_size: inheritedAppearance.font_size,
  },
});
let localAppearanceEdited = false;
let importAppearancePending = false;
let importAppearanceTimer: ReturnType<typeof setTimeout> | undefined;
function finishAppearanceImport(legacy?: Appearance) {
  if (!importAppearancePending) return;
  importAppearancePending = false;
  if (importAppearanceTimer !== undefined) clearTimeout(importAppearanceTimer);
  if (localAppearanceEdited) return;
  const current = localAppearance();
  const old = legacy?.settings;
  if (old) {
    localAppearance.set({
      ...current,
      settings: {
        ...current.settings,
        mode: old.mode,
        accent_source: old.accent_source === "custom" ? "custom" : "theme",
        accent_color: old.accent_color,
        font_size: old.font_size,
      },
    });
  }
  void Storage.setItem(
    appearanceKey,
    JSON.stringify(localAppearance().settings),
  );
}
function requestAppearanceImport() {
  if (
    !importAppearancePending ||
    !commandRef ||
    importAppearanceTimer !== undefined
  )
    return;
  importAppearanceTimer = setTimeout(() => finishAppearanceImport(), 2_000);
  askEngine("appearance.import");
}
void Storage.getItem(appearanceKey).then((value) => {
  if (localAppearanceEdited) return;
  if (value) {
    try {
      const settings = JSON.parse(value) as Appearance["settings"];
      if (["light", "dark", "system"].includes(settings.mode)) {
        localAppearance.set({
          ...appearanceDefaults,
          settings: { ...localAppearance().settings, ...settings },
        });
        return;
      }
    } catch {
      /* Use the starting palette for invalid preferences. */
    }
  }
  importAppearancePending = true;
  if (hosted) requestAppearanceImport();
  else finishAppearanceImport();
});
function localColors(appearance: Appearance) {
  const settings = appearance.settings;
  return resolveAppearanceColors(
    {
      ...appearance,
      settings: {
        ...settings,
        mode: settings.mode === "system" ? colorScheme() : settings.mode,
      },
    },
    previewThemes,
    fallback.colors,
  );
}
effect(() => {
  const mode = localAppearance().settings.mode;
  setColorScheme(mode === "light" || mode === "dark" ? mode : "system");
});
effect(() => {
  const appearance = localAppearance();
  interfaceSize.set(appearance.settings.font_size);
  const colors = localColors(appearance);
  untracked(() =>
    snapshot.set({
      ...snapshot(),
      appearance,
      appearanceEditable: true,
      colors,
    }),
  );
});
const benchmarkNotes = signal<Note[] | null>(null);
const route = signal<Route>(initial.route);
/// The note a demo run was asked to open, done once, after the first list.
let startNoteOpened = false;
/// The host's first snapshot carries the route the window opens on; after it
/// the page is the UI's, and an echoed route would only undo a click.
let routeReady = false;
const addTaskOpen = signal(false);
const searchOpen = signal(false);
effect(() => {
  if (searchOpen())
    return keymap.bind("escape", () => searchOpen.set(false), {
      overFocused: true,
    });
});
const newTaskTitle = signal("");
const sidebarVisible = signal(true);
// Voice notes: the recorder runs in the host, the UI only draws it.
const voiceRecording = signal(false);
const voiceLevel = signal(0);
const voiceElapsed = signal(0);
const voicePlaying = signal<string | null>(null);
let voiceStartedAt = 0;
const pickedExes = signal<string[]>([]);
const pickSource = signal("manual");
/// The sidebar's page list. A component body runs once, so the list a
/// setting hides lives in a signal the effect below keeps current.
const pageNavigation = navigation.filter((item) => !item.footer);
loadRecent();
if (!hosted) {
  void loadPreview().then((saved) => {
    if (!saved) return;
    snapshot.set({
      ...snapshot(),
      journalEntries: saved.journalEntries,
      todos: saved.todos,
    });
  });
}

function persistPreviewSnapshot() {
  if (hosted) return;
  persistPreview({
    journalEntries: snapshot().journalEntries,
    todos: snapshot().todos,
  });
}
const Bridge = nativeComponent<
  { route: Route },
  {
    state: Snapshot;
    navigate: { route: Route };
    journal: JournalEntry[];
    notes: Note[];
    notesCreated: Note;
    voiceLevel: { level: number };
    voiceRecorded: JournalVoice & Record<string, unknown>;
    voicePlayed: Record<string, never>;
    voiceFailed: { reason: string };
    usage: ProgramUsage[];
    picked: string[];
    games: unknown;
    discovered: unknown;
    imported: unknown;
    launched: unknown;
    metadata: unknown;
    benchmark: BenchmarkEvent;
    benchmarkFrames: BenchmarkEvent;
    benchmarkReady: BenchmarkEvent;
    appearanceImported: Appearance | null;
  }
>("atlas.bridge", {
  props: ["route"],
  events: [
    "state",
    "navigate",
    "journal",
    "notes",
    "notesCreated",
    "voiceLevel",
    "voiceRecorded",
    "voicePlayed",
    "voiceFailed",
    "usage",
    "picked",
    "games",
    "discovered",
    "imported",
    "launched",
    "metadata",
    "benchmark",
    "benchmarkFrames",
    "benchmarkReady",
    "appearanceImported",
  ],
});

function iconForNavigation(id: string): GlyphName {
  switch (id) {
    case "journal":
      return "journal";
    case "notes":
      return "note";
    case "tasks":
      return "check";
    case "games":
      return "gamepad";
    default:
      return "settings";
  }
}

function TaskRows() {
  return (
    <Each of={snapshot().todos}>
      {(todo) => (
        <View
          class="flex-row items-center border-b px-3"
          style={{
            height:
              (37 * (snapshot().appearance?.settings.font_size ?? 13)) / 13,
            borderColor: snapshot().colors.border,
          }}
        >
          <View
            onPress={() => completeTodo(todo().id)}
            role="checkbox"
            accessibilityLabel={todo().title}
            accessibilityState={{ checked: todo().is_completed }}
            class="mr-3 h-[14px] w-[14px] items-center justify-center rounded-full border"
            style={{
              borderColor: todo().is_completed
                ? snapshot().colors.accent
                : snapshot().colors.muted,
              backgroundColor: todo().is_completed
                ? snapshot().colors.accent
                : "transparent",
            }}
          >
            {todo().is_completed && (
              <Glyph
                name="check"
                size={10}
                color={snapshot().colors.background}
              />
            )}
          </View>
          <Text
            class={todo().is_completed ? "line-through" : ""}
            style={{
              fontSize: snapshot().appearance?.settings.font_size ?? 13,
              color: todo().is_completed
                ? snapshot().colors.muted
                : snapshot().colors.foreground,
            }}
          >
            {todo().title}
          </Text>
        </View>
      )}
    </Each>
  );
}

let commandRef: ((name: string, args?: unknown) => void) | undefined;
effect(() => {
  const settings = localAppearance().settings;
  askEngine("appearance.set", settings);
});

function setAppearance(patch: Record<string, unknown>) {
  localAppearanceEdited = true;
  const appearance = localAppearance();
  const settings = { ...appearance.settings, ...patch };
  localAppearance.set({ ...appearance, settings });
  void Storage.setItem(appearanceKey, JSON.stringify(settings));
}

function TaskPage() {
  return (
    <Scroll
      class="min-h-0 flex-1 px-7 pb-5"
      style={{
        paddingTop: snapshot().chrome === "tsx" ? 0 : TITLEBAR_HEIGHT,
      }}
    >
      <View class="mx-auto w-full max-w-[640px]">
        {snapshot().todos.length === 0 ? (
          <View class="items-center py-12">
            <Text
              class="text-[13px]"
              style={{ color: snapshot().colors.muted }}
            >
              Задач пока нет
            </Text>
          </View>
        ) : (
          <TaskRows />
        )}
      </View>
    </Scroll>
  );
}

function toggleSidebar() {
  const open = !sidebarVisible();
  sidebarVisible.set(open);
  animateSidebar(open);
  askEngine("toggle-sidebar");
}

function askEngine(name: string, args?: unknown) {
  try {
    commandRef?.(name, args);
  } catch {
    /* Preview host has no atlas.bridge. */
  }
}

function createJournal(text: string, id: string) {
  askEngine("journal.create", { text });
  snapshot.set({
    ...snapshot(),
    journalEntries: [
      ...snapshot().journalEntries,
      { id, text, createdAt: new Date().toISOString() },
    ],
  });
  persistPreviewSnapshot();
}

function createVoiceJournal(voice: JournalVoice, id: string) {
  markJournalArriving(id);
  askEngine("journal.createVoice", { text: "", voice });
  snapshot.set({
    ...snapshot(),
    journalEntries: [
      ...snapshot().journalEntries,
      { id, text: "", createdAt: new Date().toISOString(), voice },
    ],
  });
  persistPreviewSnapshot();
}

function startRecording() {
  if (voiceRecording()) return;
  voicePlaying.set(null);
  voiceLevel.set(0);
  voiceElapsed.set(0);
  voiceStartedAt = Date.now();
  voiceRecording.set(true);
  askEngine("voice.start");
  // Fifty frames a second: the live bars follow the dictation pill's wobble.
  const timer = setInterval(() => {
    if (!voiceRecording()) return;
    voiceElapsed.set(Date.now() - voiceStartedAt);
  }, 50);
  stopVoiceTicker = () => clearInterval(timer);
}

let stopVoiceTicker: (() => void) | null = null;

function stopRecording() {
  if (!voiceRecording()) return;
  // The host answers with `voiceRecorded`; the recorder keeps running until then.
  askEngine("voice.stop");
}

function playVoice(entry: JournalEntry) {
  if (!entry.voice) return;
  if (voicePlaying() === entry.id) {
    askEngine("voice.pause");
    voicePlaying.set(null);
    return;
  }
  voicePlaying.set(entry.id);
  askEngine("voice.play", { data: entry.voice.data });
}

function updateJournal(id: string, text: string) {
  askEngine("journal.update", { id, text });
  snapshot.set({
    ...snapshot(),
    journalEntries: snapshot().journalEntries.map((entry) =>
      entry.id === id ? { ...entry, text } : entry,
    ),
  });
  persistPreviewSnapshot();
}

function deleteJournal(id: string) {
  askEngine("journal.delete", { id });
  snapshot.set({
    ...snapshot(),
    journalEntries: snapshot().journalEntries.filter(
      (entry) => entry.id !== id,
    ),
  });
  persistPreviewSnapshot();
}

function createTodo(title: string) {
  const value = title.trim();
  if (!value) return;
  askEngine("create", { title: value });
  snapshot.set({
    ...snapshot(),
    todos: [
      ...snapshot().todos,
      { id: `local-${Date.now()}`, title: value, is_completed: false },
    ],
  });
  persistPreviewSnapshot();
}

function completeTodo(id: string) {
  askEngine("complete", { id });
  snapshot.set({
    ...snapshot(),
    todos: snapshot().todos.map((todo) =>
      todo.id === id ? { ...todo, is_completed: true } : todo,
    ),
  });
  persistPreviewSnapshot();
}

effect(() => {
  const active = shortcuts();
  const unbind = [
    // The sidebar's own key is the shifted one: plain mod+b is the note
    // editor's bold, and a binding the focused editor makes wins over the
    // app's, so the unshifted key would look dead while a note is open.
    keymap.bind(active.sidebar, () => toggleSidebar(), { repeat: true }),
    keymap.bind(
      active.create,
      () => {
        newTaskTitle.set("");
        addTaskOpen.set(true);
      },
      { when: "notEditing" },
    ),
    keymap.bind(active.reload, () => commandRef?.("reload"), {
      when: "notEditing",
    }),
    keymap.bind(active.search, () => searchOpen.set(true), {
      overFocused: true,
    }),
    keymap.bind(
      "mod+t",
      () => {
        route.set("notes");
        createOpenNote();
      },
      // Once per press: a held key must not leave a stack of empty notes.
      { repeat: false },
    ),
  ];
  return () => unbind.forEach((remove) => remove());
});

function SettingsPage() {
  return (
    <SettingsPageScroll colors={snapshot().colors}>
      <Text
        class="mb-6 text-[22px] font-semibold"
        style={{ color: snapshot().colors.foreground }}
      >
        Настройки
      </Text>
      <AtlasAppearanceSettings
        appearance={() => snapshot().appearance}
        editable={() => snapshot().appearanceEditable}
        colors={() => snapshot().colors}
        shortcuts={shortcuts()}
        onPatch={setAppearance}
        onChangeShortcut={cycleShortcut}
      />
    </SettingsPageScroll>
  );
}

function App() {
  // The palette is NSH's own theme too: what NSH draws for itself (a table's
  // grips and cell selection, a scroll bar, a menu) wears the app's accent
  // instead of the shared theme's violet, and follows it when it changes.
  effect(() => applyShellTheme(snapshot().nshTheme));
  // NSH 0.7 asks the window for its title bar: an inline root (a host's
  // window) has none of its own, and then the bar keeps the height it draws.
  effect(() =>
    windows()[0]?.set({
      titleBar: { style: "hidden", height: TITLEBAR_HEIGHT },
    }),
  );
  // The sidebar lists the widgets that are on, in their order.
  const footerNavigation = navigation.filter((item) => item.footer);
  const openNewTask = () => {
    newTaskTitle.set("");
    addTaskOpen.set(true);
  };
  // The page's own box, measured from the layout: the bar's row of tabs starts
  // at its left edge and fits into its width, so it never runs over the list
  // and never guesses. Zero until the first layout.
  const pageLeft = signal(0);
  const pageWidth = signal(0);
  const shell = snapshot().chrome === "tsx";
  const dark = () =>
    (localAppearance().settings.mode === "system"
      ? colorScheme()
      : localAppearance().settings.mode) === "dark";
  // The page arrives the way the row of tabs moves: from the right when the
  // tab picked is to the right of the one being read, from the left when it is
  // to the left. A shift of a third of a finger's width, short enough to read as
  // the same gesture as the press.
  // Only the position moves: a fade would put the page on a layer of its own,
  // and the note's editors — native components — do not survive that, they
  // blink and land in the wrong place. Tabs travel sideways, sidebar rows up
  // and down: the page moves the way the list it was picked from does.
  const pageSlideX = createAnimatedValue(0);
  const pageSlideY = createAnimatedValue(0);
  // The shift lives for the length of the motion and not a frame longer: a
  // transform in the style is a layer over the page for as long as it is there,
  // and the note's native editors are placed by their own frames — an idle
  // layer over them put the note's first line over the title and clipped it.
  const sliding = signal(false);
  // The sidebar picks a row and then hands over to the tab code, which knows
  // nothing of rows: the axis is chosen here once, and the tab's own sideways
  // slide steps aside for it.
  let slidFromSidebar = false;
  const slidePage = (dir: number, axis: "x" | "y" = "x") => {
    const vertical = axis === "y";
    pageSlideX.set(vertical ? 0 : dir * PAGE_SLIDE);
    pageSlideY.set(vertical ? dir * PAGE_SLIDE : 0);
    sliding.set(true);
    void Animated.timing(vertical ? pageSlideY : pageSlideX, {
      toValue: 0,
      duration: PAGE_SLIDE_MS,
      easing: Easing.out(Easing.cubic),
    })
      .start()
      .then(() => sliding.set(false));
  };

  /// What the bar holds: a tab a page, a tab a note opened from the list. They
  /// live for the session only — a start opens the page the host asked for.
  const pageTab = (target: Route) => ({
    key: `page:${target}`,
    route: target as string,
  });
  const pageLabel = (target: string) =>
    navigation.find((item) => item.id === target)?.label ?? target;
  const tabs = signal<TabView[]>([
    { ...pageTab(route()), label: pageLabel(route()), active: true },
  ]);
  const activeTabKey = signal(`page:${route()}`);
  type Destination = { route: Route; noteId: string | null };
  const destination = (): Destination => ({
    route: route(),
    noteId: route() === "notes" ? openNoteId() : null,
  });
  const sameDestination = (left: Destination, right: Destination) =>
    left.route === right.route && left.noteId === right.noteId;
  const history = signal({ entries: [destination()], index: 0 });
  effect(() => {
    const next = destination();
    untracked(() => {
      if (benchmarkRunning()) return;
      const { entries, index } = history();
      if (sameDestination(entries[index], next)) return;
      const kept = [...entries.slice(0, index + 1), next].slice(-40);
      history.set({ entries: kept, index: kept.length - 1 });
    });
  });
  const historyTarget = (step: -1 | 1) => {
    const { entries, index } = history();
    for (let at = index + step; at >= 0 && at < entries.length; at += step) {
      const target = entries[at];
      if (
        sameDestination(entries[index], target) ||
        (target.noteId &&
          !notes().some((note) => String(note.id) === target.noteId))
      )
        continue;
      return at;
    }
    return -1;
  };
  const walkHistory = (step: -1 | 1) =>
    batch(() => {
      const index = historyTarget(step);
      if (index < 0) return;
      const { entries } = history();
      const target = entries[index];
      // Move the cursor before restoring the destination, so the observer
      // recognizes it as the current entry and preserves the forward stack.
      history.set({ entries, index });
      if (target.noteId) {
        route.set("notes");
        openNoteById(target.noteId);
      } else {
        openPageTab(target.route);
      }
    });
  /// The tabs as the bar draws them: labels follow the notes as they are now.
  /// A note's name for its tab: the draft while it is being read, the
  /// library's own title otherwise, and the untitled name for a note that has
  /// no name — an empty string is still no name, not a name that reads blank.
  const noteTabLabel = (tab: TabView) => {
    if (tab.noteId === openNoteId()) return noteLabel(openNoteTitle());
    const note = notes().find((item) => String(item.id) === tab.noteId);
    return noteLabel(note?.title);
  };
  const tabViews = () =>
    tabs().map((tab) => ({
      ...tab,
      active: tab.key === activeTabKey(),
      label: tab.noteId ? noteTabLabel(tab) : pageLabel(tab.route),
    }));
  const activateTab = (key: string) =>
    batch(() => {
      const list = tabs();
      const to = list.findIndex((item) => item.key === key);
      if (to < 0) return;
      const tab = list[to];
      const from = list.findIndex((item) => item.key === activeTabKey());
      const slidByRow = slidFromSidebar;
      slidFromSidebar = false;
      if (from >= 0 && from !== to && !slidByRow)
        slidePage(slideDirection(from, to));
      activeTabKey.set(key);
      if (tab.route !== route()) route.set(tab.route as Route);
      if (openNoteId() === (tab.noteId ?? null)) return;
      if (tab.noteId) openNoteById(tab.noteId);
      else closeOpenNote();
    });
  const openPageTab = (target: string) => {
    if (!isRoute(target)) return;
    const key = `page:${target}`;
    if (!tabs().some((tab) => tab.key === key)) {
      animateTabs();
      tabs.set([
        ...tabs(),
        {
          ...pageTab(target as Route),
          label: pageLabel(target),
          active: false,
        },
      ]);
    }
    activateTab(key);
  };
  const closeTab = (key: string) => {
    const list = tabs();
    // One tab stays: the bar always has somewhere to go.
    if (list.length < 2) return;
    const at = list.findIndex((tab) => tab.key === key);
    if (at < 0) return;
    const rest = list.filter((tab) => tab.key !== key);
    animateTabs();
    // The neighbour takes over first, and the tab leaves the bar after it: a
    // bar without the tab while its note is still open brought the tab
    // straight back — a note that is open is a tab of its own.
    if (activeTabKey() === key) {
      const next = rest[Math.min(at, rest.length - 1)];
      activateTab(next.key);
    }
    tabs.set(rest);
  };
  // A tab's own menu, on the secondary button: what the bar offers for this
  // page, where the pointer is. Renaming puts the caret in the note's name,
  // so it is done in place rather than in a dialog.
  const tabMenu = (key: string, at: Point) => {
    const tab = tabs().find((item) => item.key === key);
    if (!tab) return;
    const note = tab.noteId;
    void Menu.popup(
      [
        ...(note
          ? [
              {
                label: "Переименовать",
                onSelect: () => {
                  activateTab(key);
                  requestNoteTitleFocus();
                },
              },
            ]
          : []),
        { label: "Закрыть", onSelect: () => closeTab(key) },
        ...(tabs().length > 1
          ? [
              {
                label: "Закрыть остальные",
                onSelect: () => closeOtherTabs(key),
              },
            ]
          : []),
        ...(note
          ? [
              {
                label: "Удалить заметку",
                onSelect: () => {
                  activateTab(key);
                  removeOpenNote();
                  closeTab(key);
                },
              },
            ]
          : []),
      ],
      at,
    );
  };
  const closeOtherTabs = (keep: string) => {
    const rest = tabs().filter((tab) => tab.key !== keep);
    if (rest.length === 0) return;
    animateTabs();
    tabs.set(tabs().filter((tab) => tab.key === keep));
    activateTab(keep);
  };
  /// The next tab (or the one before, with -1), around the ends: what
  /// Control+Tab does in every browser.
  const cycleTab = (step: number) => {
    const list = tabs();
    if (list.length < 2) return;
    const at = list.findIndex((tab) => tab.key === activeTabKey());
    const next =
      list[(((at + step) % list.length) + list.length) % list.length];
    if (next) activateTab(next.key);
  };
  // The browser's own way between open pages: Control+Tab goes to the next
  // one and around the last, Control+Shift+Tab the other way.
  effect(
    () =>
      keymap.bind(
        { "ctrl+tab": () => cycleTab(1), "ctrl+shift+tab": () => cycleTab(-1) },
        { overFocused: true },
      ),
    // What closes a tab, as every window with tabs does: the one being read.
    // It lives here, with the tabs, and not with the app's other keys: the bar
    // is the window's, and so is this.
    keymap.bind("mod+w", () => closeTab(activeTabKey()), { repeat: false }),
  );
  // A note opened anywhere — a card, the sidebar, a new one — becomes its own
  // tab beside the list's, and leaving it goes back to the list's.
  effect(() => {
    const id = openNoteId();
    // Only a change to the open note can override the active tab.
    untracked(() => {
      if (!id) {
        if (activeTabKey().startsWith("note:")) openPageTab("notes");
        return;
      }
      const key = `note:${id}`;
      if (activeTabKey() === key) return;
      const list = tabs();
      if (!list.some((tab) => tab.key === key)) {
        animateTabs();
        const at = list.findIndex((tab) => tab.key === activeTabKey());
        const tab: TabView = {
          key,
          route: "notes",
          noteId: id,
          label: noteLabel(openNoteTitle()),
          active: true,
        };
        tabs.set([...list.slice(0, at + 1), tab, ...list.slice(at + 1)]);
      }
      activeTabKey.set(key);
    });
  });
  const changeRoute = (target: string) => {
    if (!isRoute(target)) return;
    openPageTab(target);
  };
  const selectSidebarPage = (target: string) => {
    // The rows run down the sidebar: the page comes in from below when the row
    // picked is below the one being read, from above when it is above it.
    const rows = navigation.map((item) => item.id);
    const fromRow = rows.indexOf(route());
    const toRow = rows.indexOf(target);
    if (fromRow >= 0 && toRow >= 0 && fromRow !== toRow) {
      slidFromSidebar = true;
      slidePage(slideDirection(fromRow, toRow), "y");
    }
    // "Заметки" is the library, not the note last read: a note left open on the
    // way out is put away, so the page always lands on all of them.
    if (target === "notes") {
      if (hasOpenNote()) closeOpenNote();
      openPageTab("notes");
      return;
    }
    changeRoute(target);
  };
  const activeRecentNote = () => {
    if (route() !== "notes") return false;
    const id = openNoteId();
    return (
      id !== null &&
      recent().some((entry) => entry.kind === "note" && entry.id === id)
    );
  };
  const openRecentEntry = (entry: {
    kind: string;
    id: string;
    title: string;
  }) => {
    if (entry.kind !== "note") return;
    // The note's own tab is the one that becomes active — the effect that adds
    // it does that. Going through `changeRoute` would activate the list's page
    // tab and put the note away again, which left the new tab inert.
    batch(() => {
      openNoteById(entry.id);
      if (openNoteId() === entry.id) route.set("notes");
    });
  };
  return (
    <View
      class="relative h-full w-full"
      // The mouse's own back and forward buttons walk the window history, as the
      // bar's arrows do: a desktop's back button is a gesture people already
      // have, and reaching for the title bar for it is what they do not do.
      // Only those two buttons are taken; a click goes where it always went.
      onMouseUp={(event) => {
        if (event.button === "back") walkHistory(-1);
        if (event.button === "forward") walkHistory(1);
      }}
      // The window's own ground: the sidebar's tone, so the page reads as a sheet
      // lying on it rather than as the window's edge.
      style={{
        backgroundColor: shell
          ? shellFill(snapshot().colors, dark())
          : snapshot().colors.background,
      }}
    >
      <Bridge
        class="absolute left-0 top-0 h-px w-px"
        ref={(node) => {
          commandRef = (name, args) => node.command(name, args);
          requestAppearanceImport();
          askEngine("appearance.set", localAppearance().settings);
          gameLibrary.bindCommand((name, args) => node.command(name, args));
          bindNoteCommands({
            create: (title, doc) =>
              node.command("notes.create", { title, doc }),
            save: (id, title, doc) =>
              node.command("notes.save", { id, title, doc }),
            remove: (id) => node.command("notes.delete", { id }),
            reload: () => node.command("notes.reload"),
          });
        }}
        route={route()}
        onState={(next) => {
          // The page is the UI's own state: the host echoes it back a frame
          // late, and taking the echo would unmount the page it names.
          if (!routeReady) {
            routeReady = true;
            batch(() => {
              route.set(next.route);
              history.set({ entries: [destination()], index: 0 });
            });
          }
          const appearance = localAppearance();
          snapshot.set({
            ...next,
            appearance,
            appearanceEditable: true,
            themes: previewThemes,
            journalEntries: snapshot().journalEntries,
            sidebarVisible: sidebarVisible(),
            colors: localColors(appearance),
          });
        }}
        onJournal={(entries) =>
          snapshot.set({ ...snapshot(), journalEntries: entries })
        }
        onNotes={(next) => {
          setNotes(next);
          // A demo run names the note it opens on: the screen cannot take a
          // click from a script, and a screenshot needs one page.
          const first = (snapshot() as { openNote?: string | null }).openNote;
          if (first && !startNoteOpened) {
            startNoteOpened = true;
            batch(() => {
              openNoteById(first);
              history.set({ entries: [destination()], index: 0 });
            });
          }
        }}
        onNotesCreated={(note) => addNote(note as Note)}
        onVoiceLevel={(event) => voiceLevel.set(event.level)}
        onVoiceRecorded={(voice) => {
          voiceRecording.set(false);
          stopVoiceTicker?.();
          stopVoiceTicker = null;
          createVoiceJournal(
            {
              durationMs: voice.durationMs,
              peaks: voice.peaks,
              data: voice.data,
            },
            `local-${Date.now()}`,
          );
        }}
        onVoicePlayed={() => voicePlaying.set(null)}
        onVoiceFailed={() => {
          voiceRecording.set(false);
          voicePlaying.set(null);
          stopVoiceTicker?.();
          stopVoiceTicker = null;
        }}
        onNavigate={(event) => changeRoute(event.route)}
        onBenchmark={benchmarkHardware}
        onBenchmarkFrames={benchmarkFrames}
        onBenchmarkReady={benchmarkReady}
        onAppearanceImported={(appearance) =>
          finishAppearanceImport(appearance ?? undefined)
        }
      />
      <View class="h-full w-full flex-row">
        {shell && (
          <View
            class="h-full shrink-0 overflow-hidden"
            style={{ width: sidebarPaneWidth() }}
          >
            <View
              class="relative box-border h-full"
              style={{
                width: SIDEBAR_WIDTH,
                paddingTop: TITLEBAR_HEIGHT + 8,
                // The card's own gap and no more: the last rows of the list
                // end on the page's bottom edge, not above it.
                paddingBottom: CARD_GAP,
                paddingLeft: 8,
                // The card brings its own gap: the sidebar keeps only the
                // window's, so the page sits as far from the rows as from the
                // window's edge.
                paddingRight: shell ? 0 : 8,
                backgroundColor: shellFill(snapshot().colors, dark()),
              }}
            >
              <View
                onPressDown={() => askEngine("window.drag")}
                class="absolute left-0 right-0 bottom-0"
                style={{ top: TITLEBAR_HEIGHT }}
              />
              {/* The notes' trail moved to the bar, on the toggle's line. */}
              <View style={{ gap: 2, pointerEvents: "box-none" }}>
                {pageNavigation.map((item) => (
                  <SidebarRow
                    label={item.label}
                    icon={iconForNavigation(item.id)}
                    selected={
                      route() === item.id &&
                      !(item.id === "notes" && activeRecentNote())
                    }
                    dark={dark()}
                    colors={snapshot().colors}
                    onPress={() => selectSidebarPage(item.id)}
                  />
                ))}
              </View>
              {recent().length > 0 && (
                <View class="mt-5" style={{ pointerEvents: "box-none" }}>
                  <Text
                    class="mb-1 text-[11px] font-medium"
                    style={{ color: snapshot().colors.muted, paddingLeft: 10 }}
                  >
                    Недавно открытые
                  </Text>
                  <View style={{ gap: 1 }}>
                    {recent().map((entry) => (
                      <RecentRow
                        entry={entry}
                        selected={
                          entry.kind === "note" &&
                          route() === "notes" &&
                          openNoteId() === entry.id
                        }
                        colors={snapshot().colors}
                        dark={dark()}
                        onPress={() => openRecentEntry(entry)}
                      />
                    ))}
                  </View>
                </View>
              )}
              <View
                class="mt-auto"
                style={{ gap: 2, pointerEvents: "box-none" }}
              >
                {footerNavigation.map((item) => (
                  <SidebarRow
                    label={item.label}
                    icon={iconForNavigation(item.id)}
                    selected={route() === item.id}
                    dark={dark()}
                    colors={snapshot().colors}
                    onPress={() => changeRoute(item.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
        <View
          class="relative min-h-0 min-w-0 flex-1"
          // Where the page actually starts, measured rather than computed: the
          // bar's row of tabs keeps to it, so it can never run over the list.
          onLayout={(event) => {
            pageLeft.set(event.bounds.origin.x);
            pageWidth.set(event.bounds.size.width);
          }}
          // Round the page off from the sidebar and the window's edges: the
          // content is a sheet, the shell's tone shows in the gap around it.
          style={{
            ...(shell
              ? {
                  marginLeft: CARD_GAP,
                  marginRight: CARD_GAP,
                  // MonoCode's rhythm: the bar is 48, the page starts right
                  // under it, its own hairline border the only separator.
                  marginTop: TITLEBAR_HEIGHT,
                  marginBottom: CARD_GAP,
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: snapshot().colors.border,
                  backgroundColor: snapshot().colors.background,
                  overflow: "hidden",
                }
              : {}),
          }}
        >
          {/* The swipe is the page's, not the sheet's: the card keeps its own
            ground, so nothing of the window's background flashes through. */}
          <View
            class="min-h-0 min-w-0 flex-col"
            style={{
              flex: 1,
              transform: sliding()
                ? [{ translateX: pageSlideX }, { translateY: pageSlideY }]
                : undefined,
            }}
          >
            {route() === "journal" && (
              <JournalPage
                entries={() => snapshot().journalEntries}
                colors={snapshot().colors}
                onCreate={createJournal}
                onUpdate={updateJournal}
                onDelete={deleteJournal}
                recording={voiceRecording}
                level={voiceLevel}
                elapsed={voiceElapsed}
                playing={voicePlaying}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPlayVoice={playVoice}
                titlebarInset={0}
                dark={dark()}
              />
            )}
            {route() === "notes" && (
              <NotesPage
                colors={snapshot().colors}
                dark={dark()}
                titlebarInset={0}
                benchmarkNotes={benchmarkNotes()}
              />
            )}
            {route() === "tasks" && (
              <View class="min-h-0 flex-1">
                <TaskPage />
                {shell && (
                  <View
                    onPress={openNewTask}
                    role="button"
                    accessibilityLabel="Новая задача"
                    class="absolute items-center justify-center rounded-full"
                    hoverStyle={{ opacity: 0.85 }}
                    style={{
                      right: 16,
                      bottom: 16,
                      width: 32,
                      height: 32,
                      backgroundColor: snapshot().colors.foreground,
                      cursor: "pointer",
                    }}
                  >
                    <Glyph
                      name="plus"
                      size={16}
                      color={snapshot().colors.background}
                    />
                  </View>
                )}
              </View>
            )}
            {route() === "games" && (
              <View class="min-h-0 flex-1">
                <GamesLibrary
                  colors={snapshot().colors}
                  pickedExes={pickedExes()}
                  pickSource={pickSource()}
                  onPick={(path) => askEngine("games.pick", { path })}
                  onBrowse={() => {
                    pickSource.set("manual");
                    askEngine("games.browse");
                  }}
                  onBrowseFolder={() => {
                    pickSource.set("folder");
                    askEngine("games.browse-folder");
                  }}
                  onLaunch={(path) => askEngine("games.launch", { path })}
                  onClearPick={() => {
                    pickedExes.set([]);
                    askEngine("games.clear-pick");
                  }}
                />
              </View>
            )}
            {route() === "settings" && (
              <View class="min-h-0 flex-1">
                <SettingsPage />
              </View>
            )}
            {route() === "developers" && (
              <SettingsPageScroll colors={snapshot().colors}>
                <DevelopersPage
                  colors={snapshot().colors}
                  dark={dark()}
                  demo={Boolean(snapshot().demo)}
                  size={notes().length}
                  run={() =>
                    void runBenchmark({
                      visit: (target) => {
                        if (route() !== target) slidePage(1);
                        route.set(target);
                      },
                      frames: (runId) =>
                        askEngine("benchmark.frames", { runId }),
                      beginFrames: () => askEngine("benchmark.begin"),
                      version: snapshot().version,
                      sample: (runId) => {
                        if (!hosted) return false;
                        askEngine("benchmark.sample", { runId });
                        return true;
                      },
                      fixture: (size) => {
                        const text = "Абзац для проверки списка заметок.";
                        const doc = {
                          type: "doc",
                          content: [
                            {
                              type: "paragraph",
                              content: [{ type: "text", text }],
                            },
                          ],
                        };
                        const date = new Date().toISOString();
                        benchmarkNotes.set(
                          size
                            ? Array.from({ length: size }, (_, index) => ({
                                id: `benchmark:${index}`,
                                title: `Тестовая заметка ${index + 1}`,
                                text,
                                doc,
                                createdAt: date,
                                updatedAt: date,
                              }))
                            : null,
                        );
                      },
                    })
                  }
                  stress={(count) => askEngine("notes.stress", { count })}
                  reset={() => askEngine("notes.reset")}
                />
              </SettingsPageScroll>
            )}
          </View>
          {searchOpen() && (
            <QuickSearch
              colors={snapshot().colors}
              notes={notes()}
              journal={snapshot().journalEntries}
              onDismiss={() => searchOpen.set(false)}
              onNote={(id) => {
                searchOpen.set(false);
                openRecentEntry({ kind: "note", id, title: "" });
              }}
              onJournal={() => {
                searchOpen.set(false);
                openPageTab("journal");
              }}
            />
          )}
          {addTaskOpen() && (
            <Modal
              title="Новая задача"
              colors={snapshot().colors}
              onDismiss={() => addTaskOpen.set(false)}
              footer={
                <View
                  class="flex-row items-center justify-end"
                  style={{ gap: 8 }}
                >
                  <ModalGhost
                    label="Отмена"
                    colors={snapshot().colors}
                    onPress={() => addTaskOpen.set(false)}
                  />
                  <SharedButton
                    label="Добавить"
                    colors={snapshot().colors}
                    onPress={() => {
                      createTodo(newTaskTitle());
                      addTaskOpen.set(false);
                    }}
                    selected
                    className="h-9 items-center justify-center px-3 py-0"
                    style={{
                      backgroundColor: snapshot().colors.accent,
                      borderColor: "transparent",
                    }}
                    textColor={snapshot().colors.background}
                  />
                </View>
              }
            >
              <Input
                value={newTaskTitle()}
                onChange={(e) => newTaskTitle.set(e.value)}
                onSubmit={(event) => {
                  createTodo(event.text);
                  addTaskOpen.set(false);
                }}
                placeholder="Название задачи"
                accessibilityLabel="Название задачи"
                class="h-10 rounded-lg px-3 text-[13px]"
                style={{
                  backgroundColor: snapshot().colors.background,
                  color: snapshot().colors.foreground,
                }}
              />
            </Modal>
          )}
        </View>
      </View>
      {shell && (
        <TitlebarOverlay
          colors={snapshot().colors}
          dark={dark()}
          showAddGame={route() === "games"}
          pageInset={
            pageLeft() > 0 ? pageLeft() : sidebarPaneWidth() + CARD_GAP
          }
          dimmed={
            searchOpen() ||
            addTaskOpen() ||
            gameLibrary.addOpen() ||
            pickedExes().length > 1
          }
          canGoBack={historyTarget(-1) >= 0}
          canGoForward={historyTarget(1) >= 0}
          tabs={tabViews()}
          onSelectTab={activateTab}
          onCloseTab={closeTab}
          onTabMenu={tabMenu}
          onGoBack={() => walkHistory(-1)}
          onGoForward={() => walkHistory(1)}
          onToggleSidebar={toggleSidebar}
          onAddGame={gameLibrary.openAddDialog}
          onChrome={(command) => askEngine(command)}
        />
      )}
    </View>
  );
}

mount(App);

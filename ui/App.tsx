import {
  effect,
  host,
  mount,
  Scroll,
  signal,
  Text,
  View,
  nativeComponent,
  keymap,
} from "nsh";
import { Input } from "nsh/base";
import { currentWindow } from "nsh/desktop";
import { Button as SharedButton } from "@makekosmos/imago-nsh";
import type { Appearance } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import {
  fallback,
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
  canWalkBack,
  canWalkForward,
  closeOpenNote,
  createOpenNote,
  hasOpenNote,
  leaveOpenNote,
  notes,
  NotesPage,
  openNoteById,
  openNoteId,
  openNoteWithoutHistory,
  openNoteTitle,
  removeOpenNote,
  setNotes,
  walkBack,
  walkForward,
} from "./notes";
import { AtlasAppearanceSettings } from "./AtlasAppearanceSettings";
import { GamesLibrary, GamesSettings, livePrograms } from "./games";
import { SettingsPage as SettingsPageScroll, WidgetsSection } from "./settings";
import { DevelopersSection } from "./dev-settings";
import { loadRecent, recent } from "./recent";
import { loadWidgets, widgetOn } from "./widgets";
import type { ProgramUsage } from "./games";
import {
  CARD_GAP,
  CARD_RADIUS,
  SIDEBAR_WIDTH,
  TITLEBAR_HEIGHT,
  TitlebarOverlay,
  animateSidebar,
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

const initialValue: unknown =
  Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__") ?? host.params.atlas;
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
const snapshot = signal(initial);
const route = signal<Route>(initial.route);
/// The note a demo run was asked to open, done once, after the first list.
let startNoteOpened = false;
/// The host's first snapshot carries the route the window opens on; after it
/// the page is the UI's, and an echoed route would only undo a click.
let routeReady = false;
const addTaskOpen = signal(false);
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
const visiblePages = signal(pageNavigation);
loadWidgets();
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

function setAppearance(patch: Record<string, unknown>) {
  const current = snapshot();
  if (current.appearance && !current.appearance.policy.following) {
    const appearance = {
      ...current.appearance,
      settings: {
        ...current.appearance.settings,
        ...patch,
      } as Appearance["settings"],
    };
    snapshot.set({
      ...current,
      appearance,
      colors: resolveAppearanceColors(
        appearance,
        current.themes,
        current.colors,
      ),
    });
  }
  if (current.appearanceEditable) commandRef?.("appearance.set", patch);
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
    keymap.bind("mod+t", () => {
      route.set("notes");
      createOpenNote();
    }),
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
      <WidgetsSection colors={snapshot().colors} />
      {snapshot().demo ? (
        <DevelopersSection
          colors={snapshot().colors}
          dark={snapshot().appearance?.settings.mode !== "light"}
          size={notes().length}
          onStress={(count) => askEngine("notes.stress", { count })}
          onReset={() => askEngine("notes.reset")}
        />
      ) : null}
      {widgetOn("games") && <GamesSettings colors={snapshot().colors} />}
    </SettingsPageScroll>
  );
}

function App() {
  // The palette is NSH's own theme too: what NSH draws for itself (a table's
  // grips and cell selection, a scroll bar, a menu) wears the app's accent
  // instead of the shared theme's violet, and follows it when it changes.
  effect(() => applyShellTheme(snapshot().nshTheme));
  effect(() =>
    currentWindow().set({
      titleBar: { style: "hidden", height: TITLEBAR_HEIGHT },
    }),
  );
  // The sidebar lists the widgets that are on, in their order.
  effect(() =>
    visiblePages.set(
      pageNavigation.filter((item) => widgetOn(item.id as never)),
    ),
  );
  // A widget turned off takes its page with it; the app moves to the first one
  // still on.
  effect(() => {
    const pages = visiblePages();
    // Only a widget's page moves when its widget goes: the settings page is a
    // footer row and is always reachable.
    if (!pageNavigation.some((item) => item.id === route())) return;
    if (pages.some((item) => item.id === route())) return;
    const next = pages[0]?.id;
    if (next) route.set(next as never);
  });
  const footerNavigation = navigation.filter((item) => item.footer);
  const openNewTask = () => {
    newTaskTitle.set("");
    addTaskOpen.set(true);
  };
  const shell = snapshot().chrome === "tsx";
  const dark = snapshot().appearance?.settings.mode !== "light";

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
  /// The tabs as the bar draws them: labels follow the notes as they are now.
  const tabViews = () =>
    tabs().map((tab) => ({
      ...tab,
      active: tab.key === activeTabKey(),
      label: tab.noteId
        ? tab.noteId === openNoteId()
          ? openNoteTitle() || "Без названия"
          : (notes().find((item) => item.id === tab.noteId)?.title ??
            "Без названия")
        : pageLabel(tab.route),
    }));
  // `record` says whether the press walks the notes' trail: a tab the bar
  // brings back by itself restores what was open, it does not walk.
  const activateTab = (key: string, record = true) => {
    const tab = tabs().find((item) => item.key === key);
    if (!tab) return;
    activeTabKey.set(key);
    if (tab.route !== route()) {
      if (route() === "notes" && tab.route !== "notes") leaveOpenNote();
      route.set(tab.route as Route);
    }
    // A note's tab opens the note; the list's tab puts it away.
    if (tab.noteId) {
      if (openNoteId() !== tab.noteId) {
        if (record) openNoteById(tab.noteId);
        else openNoteWithoutHistory(tab.noteId);
      }
    } else if (openNoteId()) {
      closeOpenNote();
    }
  };
  const openPageTab = (target: string) => {
    if (!isRoute(target)) return;
    const key = `page:${target}`;
    if (!tabs().some((tab) => tab.key === key)) {
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
    tabs.set(rest);
    if (activeTabKey() === key) {
      const next = rest[Math.min(at, rest.length - 1)];
      activateTab(next.key);
    }
  };
  // A note opened anywhere — a card, the sidebar, a new one — becomes its own
  // tab beside the list's, and leaving it goes back to the list's.
  effect(() => {
    const id = openNoteId();
    if (!id) {
      if (activeTabKey().startsWith("note:")) activateTab(`page:notes`, false);
      return;
    }
    const key = `note:${id}`;
    if (activeTabKey() === key) return;
    if (!tabs().some((tab) => tab.key === key)) {
      const at = tabs().findIndex((tab) => tab.key === activeTabKey());
      const tab: TabView = {
        key,
        route: "notes",
        noteId: id,
        label: openNoteTitle() || "Без названия",
        active: true,
      };
      const list = tabs();
      tabs.set([...list.slice(0, at + 1), tab, ...list.slice(at + 1)]);
    }
    activeTabKey.set(key);
  });
  const changeRoute = (target: string) => {
    if (!isRoute(target)) return;
    openPageTab(target);
  };
  const selectSidebarPage = (target: string) => {
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
    if (entry.kind === "note") {
      openNoteById(entry.id);
      changeRoute("notes");
    }
  };
  return (
    <View
      class="relative h-full w-full"
      // The window's own ground: the sidebar's tone, so the page reads as a sheet
      // lying on it rather than as the window's edge.
      style={{
        backgroundColor: shell
          ? shellFill(snapshot().colors, dark)
          : snapshot().colors.background,
      }}
    >
      <Bridge
        class="absolute left-0 top-0 h-px w-px"
        ref={(node) => {
          commandRef = (name, args) => node.command(name, args);
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
            route.set(next.route);
          }
          const appearance = next.appearance ?? snapshot().appearance;
          snapshot.set({
            ...next,
            themes: previewThemes,
            journalEntries: snapshot().journalEntries,
            sidebarVisible: sidebarVisible(),
            colors: appearance
              ? resolveAppearanceColors(appearance, previewThemes, next.colors)
              : next.colors,
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
            openNoteWithoutHistory(first);
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
                paddingBottom: 16,
                paddingLeft: 8,
                // The card brings its own gap: the sidebar keeps only the
                // window's, so the page sits as far from the rows as from the
                // window's edge.
                paddingRight: shell ? 0 : 8,
                backgroundColor: shellFill(snapshot().colors, dark),
              }}
            >
              <View
                onPressDown={() => askEngine("window.drag")}
                class="absolute left-0 right-0 bottom-0"
                style={{ top: TITLEBAR_HEIGHT }}
              />
              {/* The notes' trail moved to the bar, on the toggle's line. */}
              <View style={{ gap: 2, pointerEvents: "box-none" }}>
                {visiblePages().map((item) => (
                  <SidebarRow
                    label={item.label}
                    icon={iconForNavigation(item.id)}
                    selected={
                      route() === item.id &&
                      !(item.id === "notes" && activeRecentNote())
                    }
                    dark={dark}
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
                        dark={dark}
                        onPress={() => openRecentEntry(entry)}
                      />
                    ))}
                  </View>
                </View>
              )}
              <View
                class="mt-auto mb-2"
                style={{ gap: 2, pointerEvents: "box-none" }}
              >
                {footerNavigation.map((item) => (
                  <SidebarRow
                    label={item.label}
                    icon={iconForNavigation(item.id)}
                    selected={route() === item.id}
                    dark={dark}
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
          // Round the page off from the sidebar and the window's edges: the
          // content is a sheet, the shell's tone shows in the gap around it.
          style={
            shell
              ? {
                  marginLeft: CARD_GAP,
                  marginRight: CARD_GAP,
                  marginTop: TITLEBAR_HEIGHT + CARD_GAP,
                  marginBottom: CARD_GAP,
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: snapshot().colors.border,
                  backgroundColor: snapshot().colors.background,
                  overflow: "hidden",
                }
              : undefined
          }
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
              dark={dark}
            />
          )}
          {route() === "notes" && (
            <NotesPage
              colors={snapshot().colors}
              dark={dark}
              titlebarInset={0}
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
          {route() === "games" && widgetOn("games") && (
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
          dark={dark}
          showAddGame={route() === "games" && widgetOn("games")}
          pageInset={sidebarPaneWidth()}
          dimmed={
            addTaskOpen() || gameLibrary.addOpen() || pickedExes().length > 1
          }
          noteNav={route() === "notes"}
          canGoBack={canWalkBack()}
          canGoForward={canWalkForward()}
          tabs={tabViews()}
          onSelectTab={activateTab}
          onCloseTab={closeTab}
          noteActive={route() === "notes" && hasOpenNote()}
          onGoBack={walkBack}
          onGoForward={walkForward}
          onDeleteNote={removeOpenNote}
          onToggleSidebar={toggleSidebar}
          onAddGame={gameLibrary.openAddDialog}
          onChrome={(command) => askEngine(command)}
        />
      )}
    </View>
  );
}

mount(App);

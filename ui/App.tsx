import { effect, host, mount, Scroll, signal, Text, View, nativeComponent, keymap } from "nsh";
import { Input } from "nsh/base";
import { Window as DesktopWindow } from "nsh/desktop";
import { Icon as SharedIcon, Button as SharedButton } from "@makekosmos/imago-nsh";
import type { Appearance, IconName } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import { fallback, isRoute, isSnapshot, resolveAppearanceColors } from "./state";
import { cycleShortcut, shortcutOptions, shortcuts } from "./app-shortcuts";
import { previewThemes } from "./themes";
import type { JournalEntry, JournalVoice, Route, Snapshot } from "./state";
import { JournalPage, journalCalendarOpen, markJournalArriving, toggleJournalCalendar } from "./JournalPage";
import { AtlasAppearanceSettings } from "./AtlasAppearanceSettings";
import { ExtensionsPage, GamesLibrary, GamesSettings, gamesOn, livePrograms, loadGamePrefs } from "./games";
import type { ProgramUsage } from "./games";
import { GhostButton, SIDEBAR_WIDTH, SolidButton, TITLEBAR_HEIGHT, TitlebarOverlay, animateSidebar, sidebarPaneWidth, shellFill, surfaceWash, SidebarRow } from "./chrome";
import { loadPreview, persistPreview } from "./preview";
import { gameLibrary } from "./game-library";
import { Modal, ModalGhost, ModalPrimary } from "./modal";

const initialValue: unknown = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__") ?? host.params.atlas;
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
const snapshot = signal(initial);
const route = signal<Route>(initial.route);
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
loadGamePrefs();
if (!hosted) {
  void loadPreview().then((saved) => {
    if (!saved) return;
    snapshot.set({ ...snapshot(), journalEntries: saved.journalEntries, todos: saved.todos });
  });
}

function persistPreviewSnapshot() {
  if (hosted) return;
  persistPreview({ journalEntries: snapshot().journalEntries, todos: snapshot().todos });
}
const Bridge = nativeComponent<{ route: Route }, { state: Snapshot; navigate: { route: Route }; journal: JournalEntry[]; voiceLevel: { level: number }; voiceRecorded: JournalVoice & Record<string, unknown>; voicePlayed: Record<string, never>; voiceFailed: { reason: string }; usage: ProgramUsage[]; picked: string[]; games: unknown; discovered: unknown; imported: unknown; launched: unknown; metadata: unknown }>("atlas.bridge", {
  props: ["route"],
  events: ["state", "navigate", "journal", "voiceLevel", "voiceRecorded", "voicePlayed", "voiceFailed", "usage", "picked", "games", "discovered", "imported", "launched", "metadata"],
});

function iconForNavigation(id: string): IconName | "gamepad" {
  switch (id) {
    case "journal": return "logbook";
    case "tasks": return "week";
    case "games": return "gamepad";
    default: return "settings";
  }
}

function TaskRows() {
  return <Each of={snapshot().todos}>{(todo) => (
    <View class="flex-row items-center border-b px-3" style={{ height: 37 * (snapshot().appearance?.settings.font_size ?? 13) / 13, borderColor: snapshot().colors.border }}>
      <View onPress={() => completeTodo(todo().id)} role="checkbox" accessibilityLabel={todo().title} accessibilityState={{ checked: todo().is_completed }} class="mr-3 h-[14px] w-[14px] items-center justify-center rounded-full border" style={{ borderColor: todo().is_completed ? snapshot().colors.accent : snapshot().colors.muted, backgroundColor: todo().is_completed ? snapshot().colors.accent : "transparent" }}>
        {todo().is_completed && <SharedIcon name="check" size={10} color={snapshot().colors.background} />}
      </View>
      <Text class={todo().is_completed ? "line-through" : ""} style={{ fontSize: snapshot().appearance?.settings.font_size ?? 13, color: todo().is_completed ? snapshot().colors.muted : snapshot().colors.foreground }}>{todo().title}</Text>
    </View>
  )}</Each>;
}

let commandRef: ((name: string, args?: unknown) => void) | undefined;

function setAppearance(patch: Record<string, unknown>) {
  const current = snapshot();
  if (current.appearance && !current.appearance.policy.following) {
    const appearance = {
      ...current.appearance,
      settings: { ...current.appearance.settings, ...patch } as Appearance["settings"],
    };
    snapshot.set({
      ...current,
      appearance,
      colors: resolveAppearanceColors(appearance, current.themes, current.colors),
    });
  }
  if (current.appearanceEditable) commandRef?.("appearance.set", patch);
}

function TaskPage() {
  return <Scroll class="min-h-0 flex-1 px-7 pb-5" style={{ paddingTop: TITLEBAR_HEIGHT + 20 }}>
    <View class="mx-auto w-full max-w-[640px]">
      {snapshot().todos.length === 0
        ? <View class="items-center py-12"><Text class="text-[13px]" style={{ color: snapshot().colors.muted }}>Задач пока нет</Text></View>
        : <TaskRows />}
    </View>
  </Scroll>;
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
  } catch { /* Preview host has no atlas.bridge. */ }
}

function createJournal(text: string, id: string) {
  askEngine("journal.create", { text });
  snapshot.set({
    ...snapshot(),
    journalEntries: [...snapshot().journalEntries, { id, text, createdAt: new Date().toISOString() }],
  });
  persistPreviewSnapshot();
}

function createVoiceJournal(voice: JournalVoice, id: string) {
  markJournalArriving(id);
  askEngine("journal.createVoice", { text: "", voice });
  snapshot.set({
    ...snapshot(),
    journalEntries: [...snapshot().journalEntries, { id, text: "", createdAt: new Date().toISOString(), voice }],
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
    journalEntries: snapshot().journalEntries.map((entry) => entry.id === id ? { ...entry, text } : entry),
  });
  persistPreviewSnapshot();
}

function deleteJournal(id: string) {
  askEngine("journal.delete", { id });
  snapshot.set({
    ...snapshot(),
    journalEntries: snapshot().journalEntries.filter((entry) => entry.id !== id),
  });
  persistPreviewSnapshot();
}

function createTodo(title: string) {
  const value = title.trim();
  if (!value) return;
  askEngine("create", { title: value });
  snapshot.set({
    ...snapshot(),
    todos: [...snapshot().todos, { id: `local-${Date.now()}`, title: value, is_completed: false }],
  });
  persistPreviewSnapshot();
}

function completeTodo(id: string) {
  askEngine("complete", { id });
  snapshot.set({
    ...snapshot(),
    todos: snapshot().todos.map((todo) => todo.id === id ? { ...todo, is_completed: true } : todo),
  });
  persistPreviewSnapshot();
}

effect(() => {
  const active = shortcuts();
  const unbind = [
    keymap.bind(active.sidebar, () => toggleSidebar(), { repeat: true }),
    keymap.bind(active.create, () => { newTaskTitle.set(""); addTaskOpen.set(true); }, { when: "notEditing" }),
    keymap.bind(active.reload, () => commandRef?.("reload"), { when: "notEditing" }),
  ];
  return () => unbind.forEach((remove) => remove());
});

function SettingsPage() {
  return <View>
    <AtlasAppearanceSettings
      appearance={() => snapshot().appearance}
      editable={() => snapshot().appearanceEditable}
      colors={() => snapshot().colors}
      shortcuts={shortcuts()}
      onPatch={setAppearance}
      onChangeShortcut={cycleShortcut}
    />
    <ExtensionsPage colors={snapshot().colors} />
    {gamesOn() && <GamesSettings colors={snapshot().colors} />}
  </View>;
}

function App() {
  effect(() => DesktopWindow.setTitleBar({ style: "hidden", height: TITLEBAR_HEIGHT }));
  const primaryNavigation = navigation.filter((item) => !item.footer && (item.id !== "games" || gamesOn()));
  const footerNavigation = navigation.filter((item) => item.footer);
  const openNewTask = () => { newTaskTitle.set(""); addTaskOpen.set(true); };
  const shell = snapshot().chrome === "tsx";
  const dark = snapshot().appearance?.settings.mode !== "light";
  const changeRoute = (target: string) => {
    if (!isRoute(target)) return;
    if (target !== "journal" && journalCalendarOpen()) toggleJournalCalendar();
    route.set(target);
  };
  return (
    <View class="relative h-full w-full" style={{ backgroundColor: snapshot().colors.background }}>
      <Bridge
        class="absolute left-0 top-0 h-px w-px"
        ref={(node) => {
          commandRef = (name, args) => node.command(name, args);
          gameLibrary.bindCommand((name, args) => node.command(name, args));
          }}
        route={route()}
        onState={(next) => {
          route.set(next.route);
          const appearance = next.appearance ?? snapshot().appearance;
          snapshot.set({
            ...next,
            themes: previewThemes,
            journalEntries: snapshot().journalEntries,
            sidebarVisible: sidebarVisible(),
            colors: appearance ? resolveAppearanceColors(appearance, previewThemes, next.colors) : next.colors,
          });
        }}
        onJournal={(entries) => snapshot.set({ ...snapshot(), journalEntries: entries })}
        onVoiceLevel={(event) => voiceLevel.set(event.level)}
        onVoiceRecorded={(voice) => {
          voiceRecording.set(false);
          stopVoiceTicker?.();
          stopVoiceTicker = null;
          createVoiceJournal({ durationMs: voice.durationMs, peaks: voice.peaks, data: voice.data }, `local-${Date.now()}`);
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
      {shell && <View class="h-full shrink-0 overflow-hidden" style={{ width: sidebarPaneWidth() }}>
        <View class="relative box-border h-full" style={{ width: SIDEBAR_WIDTH, paddingTop: TITLEBAR_HEIGHT + 8, paddingBottom: 16, paddingLeft: 8, paddingRight: 8, backgroundColor: shellFill(snapshot().colors, dark) }}>
          <View onPressDown={() => askEngine("window.drag")} class="absolute left-0 right-0 top-0 bottom-0" desktop={{ windowDrag: false }} />
          <View pointerEvents="box-none" style={{ gap: 2 }}>
            {primaryNavigation.map((item) => <SidebarRow label={item.label} icon={iconForNavigation(item.id)} selected={route() === item.id} dark={dark} colors={snapshot().colors} onPress={() => changeRoute(item.id)} />)}
          </View>
          <View pointerEvents="box-none" class="mt-auto mb-2" style={{ gap: 2 }}>
            {footerNavigation.map((item) => <SidebarRow label={item.label} icon={iconForNavigation(item.id)} selected={route() === item.id} dark={dark} colors={snapshot().colors} onPress={() => changeRoute(item.id)} />)}
          </View>
        </View>
      </View>}
      <View class="relative min-h-0 min-w-0 flex-1">
        {route() === "journal" && <JournalPage
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
          nativeCalendarButton={snapshot().chrome === "native"}
          titlebarInset={shell ? TITLEBAR_HEIGHT : 0}
          dark={dark}
        />}
        {route() === "tasks" && <View class="min-h-0 flex-1">
          <TaskPage />
          {shell && <View onPress={openNewTask} role="button" accessibilityLabel="Новая задача" class="absolute items-center justify-center rounded-full" hoverStyle={{ opacity: 0.85 }} style={{ right: 16, bottom: 16, width: 32, height: 32, backgroundColor: snapshot().colors.foreground, cursor: "pointer" }}><SharedIcon name="plus" size={16} color={snapshot().colors.background} /></View>}
        </View>}
        {route() === "games" && gamesOn() && <View class="min-h-0 flex-1" style={{ paddingTop: shell ? TITLEBAR_HEIGHT : 0 }}>
          <GamesLibrary colors={snapshot().colors} pickedExes={pickedExes()} pickSource={pickSource()} onPick={(path) => askEngine("games.pick", { path })} onBrowse={() => { pickSource.set("manual"); askEngine("games.browse"); }} onBrowseFolder={() => { pickSource.set("folder"); askEngine("games.browse-folder"); }} onLaunch={(path) => askEngine("games.launch", { path })} onClearPick={() => { pickedExes.set([]); askEngine("games.clear-pick"); }} />
        </View>}
        {route() === "settings" && <View class="min-h-0 flex-1" style={{ paddingTop: shell ? TITLEBAR_HEIGHT : 0 }}><SettingsPage /></View>}
        {addTaskOpen() && <Modal title="Новая задача" colors={snapshot().colors} onDismiss={() => addTaskOpen.set(false)} footer={
          <View class="flex-row items-center justify-end" style={{ gap: 8 }}>
            <ModalGhost label="Отмена" colors={snapshot().colors} onPress={() => addTaskOpen.set(false)} />
            <SharedButton label="Добавить" colors={snapshot().colors} onPress={() => { createTodo(newTaskTitle()); addTaskOpen.set(false); }} selected className="h-9 items-center justify-center px-3 py-0" style={{ backgroundColor: snapshot().colors.accent, borderColor: "transparent" }} textColor={snapshot().colors.background} />
          </View>
        }>
          <Input value={newTaskTitle()} onChange={(value) => newTaskTitle.set(value)} onSubmit={(event) => { createTodo(event.text); addTaskOpen.set(false); }} placeholder="Название задачи" accessibilityLabel="Название задачи" class="h-10 rounded-lg px-3 text-[13px]" style={{ backgroundColor: snapshot().colors.background, color: snapshot().colors.foreground }} />
        </Modal>}
      </View>
      </View>
      {shell && <TitlebarOverlay
        colors={snapshot().colors}
        dark={dark}
        showCalendarToggle={route() === "journal"}
        calendarOpen={journalCalendarOpen()}
        showAddGame={route() === "games" && gamesOn()} pageInset={sidebarPaneWidth()}
        dimmed={addTaskOpen() || gameLibrary.addOpen() || pickedExes().length > 1}
        onToggleSidebar={toggleSidebar}
        onToggleCalendar={toggleJournalCalendar}
        onAddGame={gameLibrary.openAddDialog}
        onChrome={(command) => askEngine(command)}
      />}
    </View>
  );
}

mount(App);












import { effect, mount, Scroll, signal, Text, View, nativeComponent, keymap, Storage } from "nsh";
import { Input } from "nsh/base";
import { Window as DesktopWindow } from "nsh/desktop";
import { Icon as SharedIcon, Dialog as SharedDialog } from "@makekosmos/imago-nsh";
import type { Appearance, IconName } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import { fallback, isRoute, isSnapshot, resolveAppearanceColors } from "./state";
import { previewThemes } from "./themes";
import type { JournalEntry, Route, Snapshot } from "./state";
import { JournalPage, journalCalendarOpen, toggleJournalCalendar } from "./JournalPage";
import { AtlasAppearanceSettings } from "./AtlasAppearanceSettings";
import { GhostButton, SIDEBAR_WIDTH, SolidButton, TITLEBAR_HEIGHT, TitlebarOverlay, animateSidebar, sidebarPaneWidth, surfaceWash, SidebarRow } from "./chrome";
import { loadPreview, persistPreview } from "./preview";

const initialValue: unknown = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__");
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
const snapshot = signal(initial);
const route = signal<Route>(initial.route);
const addTaskOpen = signal(false);
const newTaskTitle = signal("");
const sidebarVisible = signal(true);
const shortcutNames = ["sidebar", "create", "search", "reload"] as const;
type ShortcutName = typeof shortcutNames[number];
type Shortcuts = Record<ShortcutName, string>;
const defaultShortcuts: Shortcuts = { sidebar: "mod+b", create: "mod+n", search: "mod+k", reload: "mod+r" };
const shortcutOptions: Record<ShortcutName, string[]> = {
  sidebar: ["mod+b", "mod+shift+b"],
  create: ["mod+n", "mod+shift+n"],
  search: ["mod+k", "mod+shift+k"],
  reload: ["mod+r", "mod+shift+r"],
};
const shortcuts = signal<Shortcuts>(defaultShortcuts);
void Storage.getItem("mundus.atlas.shortcuts.v1").then((value) => {
  if (!value) return;
  try {
    const saved = JSON.parse(value) as Partial<Shortcuts>;
    shortcuts.set(Object.fromEntries(shortcutNames.map((name) => [name, shortcutOptions[name].includes(saved[name] ?? "") ? saved[name] : defaultShortcuts[name]])) as Shortcuts);
  } catch { /* A damaged preference falls back to the defaults. */ }
});
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
const Bridge = nativeComponent<{ route: Route }, { state: Snapshot; navigate: { route: Route }; journal: JournalEntry[] }>("atlas.bridge", {
  props: ["route"],
  events: ["state", "navigate", "journal"],
});

function iconForNavigation(id: string): IconName {
  switch (id) {
    case "journal": return "logbook";
    case "tasks": return "week";
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

function cycleShortcut(name: ShortcutName) {
  const current = shortcuts();
  const choices = shortcutOptions[name];
  const next = choices[(choices.indexOf(current[name]) + 1) % choices.length];
  const updated = { ...current, [name]: next };
  shortcuts.set(updated);
  void Storage.setItem("mundus.atlas.shortcuts.v1", JSON.stringify(updated));
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
  return <AtlasAppearanceSettings
    appearance={() => snapshot().appearance}
    editable={() => snapshot().appearanceEditable}
    colors={() => snapshot().colors}
    shortcuts={shortcuts()}
    onPatch={setAppearance}
    onChangeShortcut={cycleShortcut}
  />;
}

function App() {
  effect(() => DesktopWindow.setTitleBar("hidden", TITLEBAR_HEIGHT));
  const primaryNavigation = navigation.filter((item) => !item.footer);
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
        onNavigate={(event) => changeRoute(event.route)}
      />
      <View class="h-full w-full flex-row">
      {shell && <View class="h-full shrink-0 overflow-hidden" style={{ width: sidebarPaneWidth() }}>
        <View class="h-full border-r px-2" style={{ width: SIDEBAR_WIDTH, paddingTop: TITLEBAR_HEIGHT + 4, backgroundColor: surfaceWash(dark), borderColor: snapshot().colors.border }}>
          <View style={{ gap: 2 }}>
            {primaryNavigation.map((item) => <SidebarRow label={item.label} icon={iconForNavigation(item.id)} selected={route() === item.id} dark={dark} colors={snapshot().colors} onPress={() => changeRoute(item.id)} />)}
          </View>
          <View class="mt-auto mb-2" style={{ gap: 2 }}>
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
          nativeCalendarButton={snapshot().chrome === "native"}
          titlebarInset={shell ? TITLEBAR_HEIGHT : 0}
          dark={dark}
        />}
        {route() === "tasks" && <View class="min-h-0 flex-1">
          <TaskPage />
          {shell && <View onPress={openNewTask} role="button" accessibilityLabel="Новая задача" class="absolute items-center justify-center rounded-full" hoverStyle={{ opacity: 0.85 }} style={{ right: 16, bottom: 16, width: 32, height: 32, backgroundColor: snapshot().colors.foreground, cursor: "pointer" }}><SharedIcon name="plus" size={16} color={snapshot().colors.background} /></View>}
        </View>}
        {route() === "settings" && <View class="min-h-0 flex-1" style={{ paddingTop: shell ? TITLEBAR_HEIGHT : 0 }}><SettingsPage /></View>}
        {addTaskOpen() && <SharedDialog title="Новая задача" colors={snapshot().colors}>
          <Input value={newTaskTitle()} onChange={(value) => newTaskTitle.set(value)} onSubmit={(event) => { createTodo(event.text); addTaskOpen.set(false); }} placeholder="Название задачи" accessibilityLabel="Название задачи" class="h-10 rounded-lg px-3 text-[13px]" style={{ backgroundColor: snapshot().colors.background, color: snapshot().colors.foreground }} />
          <View class="mt-3 flex-row justify-end" style={{ gap: 8 }}>
            <GhostButton label="Отмена" colors={snapshot().colors} dark={dark} onPress={() => addTaskOpen.set(false)} />
            <SolidButton label="Добавить" background={snapshot().colors.accent} foreground={snapshot().colors.background} onPress={() => { createTodo(newTaskTitle()); addTaskOpen.set(false); }} />
          </View>
        </SharedDialog>}
      </View>
      </View>
      {shell && <TitlebarOverlay
        colors={snapshot().colors}
        dark={dark}
        showCalendarToggle={route() === "journal"}
        calendarOpen={journalCalendarOpen()}
        onToggleSidebar={toggleSidebar}
        onToggleCalendar={toggleJournalCalendar}
      />}
    </View>
  );
}

mount(App);

import { effect, mount, Scroll, signal, Text, View, nativeComponent, keymap, Storage } from "nsh";
import { Input } from "nsh/base";
import { Window as DesktopWindow, titleBar } from "nsh/desktop";
import { Icon as SharedIcon, NavigationItem, Button as SharedButton, Dialog as SharedDialog, spacing, typography } from "@makekosmos/imago-nsh";
import type { Appearance, IconName } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import { fallback, isRoute, isSnapshot } from "./state";
import type { JournalEntry, Route, Snapshot } from "./state";
import { JournalPage, journalCalendarOpen, toggleJournalCalendar } from "./JournalPage";
import { AtlasAppearanceSettings } from "./AtlasAppearanceSettings";

const initialValue: unknown = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__");
const initial = isSnapshot(initialValue) ? initialValue : fallback;
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
const Bridge = nativeComponent<{ route: Route }, { state: Snapshot; navigate: { route: Route }; journal: JournalEntry[]; titlebarAction: { id: string } }>("atlas.bridge", {
  props: ["route"],
  events: ["state", "navigate", "journal", "titlebarAction"],
});

function openJournalCalendar() {
  if (route() !== "journal") {
    route.set("journal");
    if (!journalCalendarOpen()) toggleJournalCalendar();
    return;
  }
  toggleJournalCalendar();
}

function iconForNavigation(id: string): IconName {
  switch (id) {
    case "journal": return "logbook";
    case "tasks": return "week";
    default: return "settings";
  }
}

function AtlasTitlebar(props: {
  title: string;
  icon: IconName;
  colors: Snapshot["colors"];
  sidebarVisible: boolean;
  showPageIdentity: boolean;
  onToggleSidebar: () => void;
}) {
  effect(() => DesktopWindow.setTitleBar("hidden", spacing.titlebarHeight));
  const controls = titleBar();
  const customControls = controls.left === 0 && controls.right === 0;
  return <View class="w-full flex-row items-center" style={{ height: controls.height || spacing.titlebarHeight }} desktop={{ windowDrag: true }}>
    <View class="flex-row items-center" style={{ width: (props.sidebarVisible ? spacing.sidebarWidth : 40) + controls.left, height: spacing.titlebarHeight }}>
      <View style={{ width: controls.left }} />
      <View onPress={props.onToggleSidebar} role="button" accessibilityLabel="Боковая панель" class="w-10 items-center justify-center" style={{ height: spacing.titlebarHeight }}>
        <SharedIcon name="sidebar" color={props.colors.muted} />
      </View>
      <View class="flex-1" desktop={{ windowDrag: true }} />
    </View>
    {props.showPageIdentity
      ? <View class="flex-1 flex-row items-center gap-1.5" desktop={{ windowDrag: true }}>
          <SharedIcon name={props.icon} size={15} color={props.colors.muted} />
          <Text class="font-medium" style={{ fontSize: typography.titlebar, color: props.colors.foreground }}>{props.title}</Text>
        </View>
      : <View class="flex-1" desktop={{ windowDrag: true }} />}
    {customControls
      ? <View class="flex-row" style={{ width: 138, height: spacing.titlebarHeight }}>
          <View onPress={() => DesktopWindow.minimize()} role="button" accessibilityLabel="Свернуть окно" class="w-[46px] items-center justify-center" style={{ height: spacing.titlebarHeight }}><SharedIcon name="windowMin" color={props.colors.foreground} size={14} /></View>
          <View onPress={() => DesktopWindow.toggleMaximize()} role="button" accessibilityLabel="Развернуть окно" class="w-[46px] items-center justify-center" style={{ height: spacing.titlebarHeight }}><SharedIcon name="windowMax" color={props.colors.foreground} size={14} /></View>
          <View onPress={() => DesktopWindow.close()} role="button" accessibilityLabel="Закрыть окно" class="w-[46px] items-center justify-center" style={{ height: spacing.titlebarHeight }}><SharedIcon name="windowClose" color={props.colors.foreground} size={14} /></View>
        </View>
      : <View style={{ width: controls.right }} />}
  </View>;
}

function TaskRows() {
  return <Each of={snapshot().todos}>{(todo) => (
    <View class="flex-row items-center border-b px-3" style={{ height: 37 * (snapshot().appearance?.settings.font_size ?? 13) / 13, borderColor: snapshot().colors.border }}>
      <View onPress={() => commandRef?.("complete", { id: todo().id })} role="checkbox" accessibilityLabel={todo().title} accessibilityState={{ checked: todo().is_completed }} class="mr-3 h-[14px] w-[14px] items-center justify-center rounded-full border" style={{ borderColor: todo().is_completed ? snapshot().colors.accent : snapshot().colors.muted, backgroundColor: todo().is_completed ? snapshot().colors.accent : "transparent" }}>
        {todo().is_completed && <SharedIcon name="check" size={10} color={snapshot().colors.background} />}
      </View>
      <Text class={todo().is_completed ? "line-through" : ""} style={{ fontSize: snapshot().appearance?.settings.font_size ?? 13, color: todo().is_completed ? snapshot().colors.muted : snapshot().colors.foreground }}>{todo().title}</Text>
    </View>
  )}</Each>;
}

let commandRef: ((name: string, args?: unknown) => void) | undefined;

function setAppearance(patch: Record<string, unknown>) {
  const current = snapshot();
  if (current.appearance && current.appearanceEditable) {
    snapshot.set({
      ...current,
      appearance: {
        ...current.appearance,
        settings: { ...current.appearance.settings, ...patch } as Appearance["settings"],
      },
    });
  }
  commandRef?.("appearance.set", patch);
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
  return <Scroll class="min-h-0 flex-1 px-7 py-5">
    <View class="mx-auto w-full max-w-[640px]">
      {snapshot().todos.length === 0
        ? <View class="items-center py-12"><Text class="text-[13px]" style={{ color: snapshot().colors.muted }}>Задач пока нет</Text></View>
        : <TaskRows />}
    </View>
  </Scroll>;
}

effect(() => {
  const active = shortcuts();
  const unbind = [
    keymap.bind(active.sidebar, () => commandRef?.("toggle-sidebar"), { when: "notEditing" }),
    keymap.bind(active.create, () => { newTaskTitle.set(""); addTaskOpen.set(true); }, { when: "notEditing" }),
    keymap.bind(active.reload, () => commandRef?.("reload"), { when: "notEditing" }),
  ];
  return () => unbind.forEach((remove) => remove());
});

function SettingsPage() {
  return <AtlasAppearanceSettings
    appearance={snapshot().appearance}
    editable={snapshot().appearanceEditable}
    themes={snapshot().themes}
    colors={snapshot().colors}
    shortcuts={shortcuts()}
    onPatch={setAppearance}
    onChangeShortcut={cycleShortcut}
  />;
}

function App() {
  const primaryNavigation = navigation.filter((item) => !item.footer);
  const footerNavigation = navigation.filter((item) => item.footer);
  const openNewTask = () => { newTaskTitle.set(""); addTaskOpen.set(true); };
  const changeRoute = (target: string) => { if (isRoute(target)) route.set(target); };
  return (
    <View class="relative h-full w-full flex-col" style={{ backgroundColor: snapshot().colors.background }}>
      <Bridge
        class="absolute left-0 top-0 h-px w-px"
        ref={(node) => {
          commandRef = (name, args) => node.command(name, args);
        }}
        route={route()}
        onState={(next) => {
          route.set(next.route);
          snapshot.set({ ...next, journalEntries: snapshot().journalEntries });
          sidebarVisible.set(next.sidebarVisible);
        }}
        onJournal={(entries) => snapshot.set({ ...snapshot(), journalEntries: entries })}
        onNavigate={(event) => changeRoute(event.route)}
        onTitlebarAction={(event) => { if (event.id === "journal.calendar") openJournalCalendar(); }}
      />
      {snapshot().chrome === "tsx" && <AtlasTitlebar
          title={snapshot().title}
          icon={iconForNavigation(route())}
          colors={snapshot().colors}
          onToggleSidebar={() => commandRef?.("toggle-sidebar")}
          sidebarVisible={sidebarVisible()}
          showPageIdentity={route() !== "settings"}
      />}
      <View class="min-h-0 flex-1 flex-row">
      {snapshot().chrome === "tsx" && <View class="w-[240px] shrink-0 border-r px-2 pt-1" style={{ borderColor: snapshot().colors.border, display: sidebarVisible() ? "flex" : "none" }}>
        <View class="gap-0.5">
          {primaryNavigation.map((item) => <NavigationItem label={item.label} icon={iconForNavigation(item.id)} selected={route() === item.id} colors={snapshot().colors} onPress={() => changeRoute(item.id)} />)}
        </View>
        <View class="mt-auto mb-2 gap-0.5">
          {footerNavigation.map((item) => <NavigationItem label={item.label} icon={iconForNavigation(item.id)} selected={route() === item.id} colors={snapshot().colors} onPress={() => changeRoute(item.id)} />)}
        </View>
      </View>}
      <View class="relative min-w-0 flex-1">
        {route() === "journal" && <JournalPage
          entries={snapshot().journalEntries}
          colors={snapshot().colors}
          onCreate={(text) => commandRef?.("journal.create", { text })}
          onUpdate={(id, text) => commandRef?.("journal.update", { id, text })}
          onDelete={(id) => commandRef?.("journal.delete", { id })}
          showCalendarToggle={snapshot().chrome === "tsx"}
        />}
        {route() === "tasks" && <View class="min-h-0 flex-1">
          <TaskPage />
          {snapshot().chrome === "tsx" && <View onPress={openNewTask} role="button" accessibilityLabel="Новая задача" class="absolute right-6 bottom-6 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: snapshot().colors.foreground }}><SharedIcon name="plus" size={20} color={snapshot().colors.background} /></View>}
        </View>}
        {route() === "settings" && <SettingsPage />}
        {addTaskOpen() && <SharedDialog title="Новая задача" colors={snapshot().colors}>
          <Input value={newTaskTitle()} onChange={(value) => newTaskTitle.set(value)} onSubmit={(event) => { commandRef?.("create", { title: event.text }); addTaskOpen.set(false); }} placeholder="Название задачи" class="h-10 rounded-lg px-3 text-[13px]" style={{ backgroundColor: snapshot().colors.background, color: snapshot().colors.foreground }} />
          <View class="mt-3 flex-row justify-end gap-2">
            <SharedButton label="Отмена" colors={snapshot().colors} onPress={() => addTaskOpen.set(false)} className="border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />
            <SharedButton label="Добавить" colors={snapshot().colors} onPress={() => { commandRef?.("create", { title: newTaskTitle() }); addTaskOpen.set(false); }} selected className="h-9 w-[90px] items-center justify-center px-0 py-0" style={{ backgroundColor: snapshot().colors.accent, borderColor: "transparent" }} textColor={snapshot().colors.background} />
          </View>
        </SharedDialog>}
      </View>
      </View>
    </View>
  );
}

mount(App);

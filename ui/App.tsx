import { effect, Input, mount, Scroll, signal, Text, View } from "nsh";
import { nativeComponent } from "nsh/native";
import { keymap } from "nsh/keymap";
import { Storage } from "nsh/storage";
import { Icon as SharedIcon, NavigationItem, Titlebar as SharedTitlebar, AppearanceSettings, Button as SharedButton, Dialog as SharedDialog } from "@makekosmos/imago-nsh";
import type { Appearance, IconName } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import { fallback, isRoute, isSnapshot } from "./state";
import type { JournalEntry, Route, Snapshot } from "./state";

const initialValue: unknown = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__");
const initial = isSnapshot(initialValue) ? initialValue : fallback;
const snapshot = signal(initial);
const route = signal<Route>(initial.route);
const journalDraft = signal("");
const editingJournalId = signal<string | null>(null);
const editingJournalText = signal("");
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
const Bridge = nativeComponent<{ route: Route }, { state: Snapshot; navigate: { route: Route }; journal: JournalEntry[] }>("atlas.bridge", {
  props: ["route"],
  events: ["state", "navigate", "journal"],
});

function iconForNavigation(id: string): IconName {
  switch (id) {
    case "journal": return "logbook";
    case "tasks": return "week";
    case "settings": return "settings";
    default: return "about";
  }
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

function sendJournal(text: string) {
  const value = text.trim();
  if (!value) return;
  commandRef?.("journal.create", { text: value });
  journalDraft.set("");
}

function dayLabel(createdAt: string) {
  const date = new Date(createdAt);
  return Number.isNaN(date.valueOf()) ? createdAt : date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function timeLabel(createdAt: string) {
  const date = new Date(createdAt);
  return Number.isNaN(date.valueOf()) ? "" : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function JournalPage() {
  let feedRef: { scrollToEnd: (options?: { animated?: boolean }) => void } | undefined;
  effect(() => {
    const entries = snapshot().journalEntries;
    if (entries.length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
  });
  let previousDay = "";
  return <View class="min-h-0 flex-1 items-center px-5">
    <Scroll ref={(node) => { feedRef = node; }} class="min-h-0 w-full max-w-[620px] flex-1 py-6">
      <Each of={snapshot().journalEntries}>{(entry) => {
        const label = dayLabel(entry().createdAt);
        const showDay = label !== previousDay;
        previousDay = label;
        return <View class="mb-4">
          {showDay && <View class="mb-3 flex-row items-center justify-center"><View class="h-px flex-1" style={{ backgroundColor: snapshot().colors.border }} /><Text class="mx-3 text-[11px] capitalize" style={{ color: snapshot().colors.muted }}>{label}</Text><View class="h-px flex-1" style={{ backgroundColor: snapshot().colors.border }} /></View>}
          <View class="self-end w-full max-w-[560px] rounded-2xl px-4 py-3" style={{ backgroundColor: snapshot().colors.card }}>
            {editingJournalId() === entry().id
              ? <View>
                  <Input value={editingJournalText()} onChange={(value) => editingJournalText.set(value)} multiline={true} submitBehavior="newline" class="min-h-[56px] w-full rounded-lg px-2 py-1 text-[13px]" style={{ color: snapshot().colors.foreground, backgroundColor: snapshot().colors.background }} />
                  <View class="mt-2 flex-row justify-end gap-2">
                    <SharedButton label="Отмена" colors={snapshot().colors} onPress={() => editingJournalId.set(null)} />
                    <SharedButton label="Сохранить" colors={snapshot().colors} selected onPress={() => { commandRef?.("journal.update", { id: entry().id, text: editingJournalText() }); editingJournalId.set(null); }} />
                  </View>
                </View>
              : <View class="gap-0.5">{entry().text.split("\n").map((line) => <Text class="text-[14px] leading-6" style={{ color: snapshot().colors.foreground }}>{line || " "}</Text>)}</View>}
            <View class="mt-2 flex-row items-center justify-end gap-3">
              <Text class="text-[10px]" style={{ color: snapshot().colors.muted }}>{timeLabel(entry().createdAt)}</Text>
              {editingJournalId() !== entry().id && <View class="flex-row gap-3">
                <View onPress={() => { editingJournalId.set(entry().id); editingJournalText.set(entry().text); }} role="button" accessibilityLabel="Изменить запись"><Text class="text-[11px]" style={{ color: snapshot().colors.muted }}>Изменить</Text></View>
                <View onPress={() => commandRef?.("journal.delete", { id: entry().id })} role="button" accessibilityLabel="Удалить запись"><Text class="text-[11px]" style={{ color: snapshot().colors.muted }}>Удалить</Text></View>
              </View>}
            </View>
          </View>
        </View>;
      }}</Each>
      {snapshot().journalEntries.length === 0 && <View class="flex-1 items-center justify-center py-12"><Text class="text-[13px]" style={{ color: snapshot().colors.muted }}>Записей пока нет</Text></View>}
    </Scroll>
    <View class="w-full max-w-[620px] flex-row items-end gap-2 border-t py-4" style={{ borderColor: snapshot().colors.border }}>
      <Input value={journalDraft()} onChange={(value) => journalDraft.set(value)} onSubmit={(event) => sendJournal(event.text)} multiline={true} submitBehavior="submit" placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="max-h-[150px] min-h-[42px] flex-1 rounded-xl px-3 py-2 text-[13px]" style={{ backgroundColor: snapshot().colors.card, color: snapshot().colors.foreground }} />
      <SharedButton label="Отправить" colors={snapshot().colors} selected onPress={() => sendJournal(journalDraft())} />
    </View>
  </View>;
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
  return <AppearanceSettings
    appearance={snapshot().appearance}
    editable={snapshot().appearanceEditable}
    themes={snapshot().themes}
    colors={snapshot().colors}
    shortcuts={shortcuts()}
    onPatch={setAppearance}
    onChangeShortcut={cycleShortcut}
  />;
}

function InfoPage() {
  return <Scroll class="flex-1 px-7 pt-12">
    <View class="mx-auto w-full max-w-[760px]">
      <View class="mb-16 items-center">
        <SharedIcon name="about" size={88} color={snapshot().colors.accent} />
        <Text class="mb-2 text-[23px] font-bold" style={{ color: snapshot().colors.foreground }}>Atlas</Text>
        <Text class="mb-2 text-[13px]" style={{ color: snapshot().colors.muted }}>Версия {snapshot().version}</Text>
        <Text class="text-[12px]" style={{ color: snapshot().colors.muted }}>© Yoso Industries 2025–2026</Text>
      </View>
      <Text class="mb-3 text-[13px]" style={{ color: snapshot().colors.foreground }}>Диагностика</Text>
      <View class="h-10 flex-row items-center rounded-xl px-4" style={{ backgroundColor: snapshot().colors.card }}>
        <View class="mr-3 h-4 w-4 items-center justify-center rounded-full border" style={{ borderColor: snapshot().colors.accent }}><SharedIcon name="check" size={10} color={snapshot().colors.accent} /></View>
        <Text class="text-[13px]" style={{ color: snapshot().colors.foreground }}>Всё в порядке</Text>
      </View>
    </View>
  </Scroll>;
}

function App() {
  const primaryNavigation = navigation.filter((item) => !item.footer);
  const footerNavigation = navigation.filter((item) => item.footer);
  const openNewTask = () => { newTaskTitle.set(""); addTaskOpen.set(true); };
  const changeRoute = (target: string) => { if (isRoute(target)) route.set(target); };
  return (
    <View class="h-full w-full flex-col" style={{ backgroundColor: snapshot().colors.background }}>
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
      />
      {snapshot().chrome === "tsx" && <SharedTitlebar
          title={snapshot().title}
          icon={iconForNavigation(route())}
          colors={snapshot().colors}
          onToggleSidebar={() => commandRef?.("toggle-sidebar")}
          onAppearance={() => route.set("settings")}
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
        {route() === "journal" && <JournalPage />}
        {route() === "tasks" && <View class="min-h-0 flex-1">
          <TaskPage />
          {snapshot().chrome === "tsx" && <View onPress={openNewTask} role="button" accessibilityLabel="Новая задача" class="absolute right-6 bottom-6 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: snapshot().colors.foreground }}><SharedIcon name="plus" size={20} color={snapshot().colors.background} /></View>}
        </View>}
        {route() === "settings" && <SettingsPage />}
        {route() === "about" && <InfoPage />}
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

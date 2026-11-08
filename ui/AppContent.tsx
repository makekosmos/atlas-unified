import { Scroll, Text, View } from "nsh";
import { Input } from "nsh/base";
import { Dialog as SharedDialog, Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { Appearance, IconName } from "@makekosmos/imago-nsh";
import navigation from "./navigation.json";
import { JournalPage, journalCalendarOpen } from "./JournalPage";
import { MobileJournalPage, mobileJournalEditorOpen } from "./MobileJournalPage";
import { ConnectionPage } from "./ConnectionPage";
import { AtlasAppearanceSettings } from "./AtlasAppearanceSettings";
import { GhostButton, SIDEBAR_WIDTH, SidebarRow, SolidButton, TITLEBAR_HEIGHT, TitlebarOverlay, sidebarPaneWidth, surfaceWash } from "./chrome";
import { MobileHome } from "./MobileHome";
import type { MobileJournalTransition } from "./mobile-journal-transition";
import { mobileJournalTransitionDuration } from "./mobile-journal-transition";
import { mobileThemes } from "./mobile-themes";
import Inter from "../assets/fonts/Inter.ttf";
import type { JournalEntry, Route, Snapshot } from "./state";

export type ShortcutName = "sidebar" | "create" | "search" | "reload";
export type Shortcuts = Record<ShortcutName, string>;

interface AppContentProps {
  snapshot: Snapshot;
  route: Route;
  transition: MobileJournalTransition;
  shortcuts: Shortcuts;
  taskDialogOpen: boolean;
  newTaskTitle: string;
  calendarOpen: boolean;
  onChangeRoute(target: string): void;
  onBack(): void;
  onToggleSidebar(): void;
  onToggleCalendar(): void;
  onCreateJournal(text: string, id: string): void;
  onUpdateJournal(id: string, text: string): void;
  onDeleteJournal(id: string): void;
  onCreateTodo(title: string): void;
  onCompleteTodo(id: string): void;
  onPatchAppearance(patch: Record<string, unknown>): void;
  onChangeShortcut(name: ShortcutName): void;
  onOpenNewTask(): void;
  onSetNewTaskTitle(title: string): void;
  onDismissNewTask(): void;
  onSubmitNewTask(title: string): void;
  command?(name: string, args?: unknown): void;
}

function iconForNavigation(id: string): IconName {
  switch (id) {
    case "journal": return "logbook";
    case "tasks": return "week";
    default: return "settings";
  }
}

function TaskRows(props: { snapshot: Snapshot; onCompleteTodo(id: string): void }) {
  return <Each of={props.snapshot.todos}>{(todo) => (
    <View class="flex-row items-center border-b px-3" style={{ height: 37 * (props.snapshot.appearance?.settings.font_size ?? 13) / 13, borderColor: props.snapshot.colors.border }}>
      <View onPress={() => props.onCompleteTodo(todo().id)} role="checkbox" accessibilityLabel={todo().title} accessibilityState={{ checked: todo().is_completed }} class="mr-3 h-[14px] w-[14px] items-center justify-center rounded-full border" style={{ borderColor: todo().is_completed ? props.snapshot.colors.accent : props.snapshot.colors.muted, backgroundColor: todo().is_completed ? props.snapshot.colors.accent : "transparent" }}>
        {todo().is_completed && <SharedIcon name="check" size={10} color={props.snapshot.colors.background} />}
      </View>
      <Text class={todo().is_completed ? "line-through" : ""} style={{ fontSize: props.snapshot.appearance?.settings.font_size ?? 13, color: todo().is_completed ? props.snapshot.colors.muted : props.snapshot.colors.foreground }}>{todo().title}</Text>
    </View>
  )}</Each>;
}

function TaskPage(props: { snapshot: Snapshot; onCompleteTodo(id: string): void }) {
  return <Scroll class="min-h-0 flex-1 px-7 pb-5" style={{ paddingTop: TITLEBAR_HEIGHT + 20 }}>
    <View class="mx-auto w-full max-w-[640px]">
      {props.snapshot.todos.length === 0
        ? <View class="items-center py-12"><Text class="text-[13px]" style={{ color: props.snapshot.colors.muted }}>Задач пока нет</Text></View>
        : <TaskRows snapshot={props.snapshot} onCompleteTodo={props.onCompleteTodo} />}
    </View>
  </Scroll>;
}

function SettingsPage(props: {
  snapshot: Snapshot;
  shortcuts: Shortcuts;
  onPatch(patch: Record<string, unknown>): void;
  onChangeShortcut(name: ShortcutName): void;
  onConnections?(): void;
}) {
  return <AtlasAppearanceSettings
    appearance={() => props.snapshot.appearance}
    editable={() => props.snapshot.appearanceEditable}
    themes={props.snapshot.chrome === "mobile" ? mobileThemes : props.snapshot.themes}
    colors={() => props.snapshot.colors}
    shortcuts={props.shortcuts}
    onPatch={props.onPatch}
    onChangeShortcut={props.onChangeShortcut}
    connection={props.snapshot.connection}
    onConnections={props.onConnections}
    mobile={props.snapshot.chrome === "mobile"}
  />;
}

export function AppContent(props: AppContentProps) {
  const primaryNavigation = navigation.filter((item) => !item.footer);
  const footerNavigation = navigation.filter((item) => item.footer);
  const shell = () => props.snapshot.chrome === "tsx";
  const dark = () => props.snapshot.appearance?.settings.mode !== "light";
  const transition = props.transition;
  const command = (name: string, args?: unknown) => props.command?.(name, args);
  const desktopSettings = <SettingsPage snapshot={props.snapshot} shortcuts={props.shortcuts} onPatch={props.onPatchAppearance} onChangeShortcut={props.onChangeShortcut} />;
  const mobileSettings = <SettingsPage snapshot={props.snapshot} shortcuts={props.shortcuts} onPatch={props.onPatchAppearance} onChangeShortcut={props.onChangeShortcut} onConnections={() => props.onChangeRoute("connection")} />;

  return <>
    <View class={`h-full w-full ${props.snapshot.chrome === "mobile" ? "flex-col" : "flex-row"}`}>
      {shell() && <View class="h-full shrink-0 overflow-hidden" style={{ width: sidebarPaneWidth() }}>
        <View class="h-full border-r px-2" style={{ width: SIDEBAR_WIDTH, paddingTop: TITLEBAR_HEIGHT + 4, backgroundColor: surfaceWash(dark()), borderColor: props.snapshot.colors.border }}>
          <View style={{ gap: 2 }}>
            {primaryNavigation.map((item) => <SidebarRow label={item.label} icon={iconForNavigation(item.id)} selected={props.route === item.id} dark={dark()} colors={props.snapshot.colors} onPress={() => props.onChangeRoute(item.id)} />)}
          </View>
          <View class="mt-auto mb-2" style={{ gap: 2 }}>
            {footerNavigation.map((item) => <SidebarRow label={item.label} icon={iconForNavigation(item.id)} selected={props.route === item.id} dark={dark()} colors={props.snapshot.colors} onPress={() => props.onChangeRoute(item.id)} />)}
          </View>
        </View>
      </View>}
      <View class="relative min-h-0 min-w-0 flex-1">
        {props.route === "journal" && props.snapshot.chrome !== "mobile" && <JournalPage
          entries={() => props.snapshot.journalEntries}
          colors={props.snapshot.colors}
          onCreate={props.onCreateJournal}
          onUpdate={props.onUpdateJournal}
          onDelete={props.onDeleteJournal}
          nativeCalendarButton={props.snapshot.chrome === "native"}
          titlebarInset={shell() ? TITLEBAR_HEIGHT : 0}
          dark={dark()}
        />}
        {props.snapshot.chrome === "mobile" && props.route === "journal" && <View class="relative h-full min-h-0 flex-col overflow-hidden" style={{ backgroundColor: props.snapshot.colors.background, opacity: transition.kind === "enter" ? (transition.phase === "moving" ? 1 : 0) : transition.kind === "exit" ? 0 : 1, transitionProperty: "opacity", transitionDuration: mobileJournalTransitionDuration / 2, transitionTimingFunction: "ease-in-out" }}>
          {!mobileJournalEditorOpen() && <View class="h-14 flex-row items-center gap-2 px-3">
            <View onPress={props.onBack} role="button" accessibilityLabel="Назад" class="h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: props.snapshot.colors.border, backgroundColor: props.snapshot.colors.card }}><Text class="text-[25px]" style={{ color: props.snapshot.colors.foreground }}>‹</Text></View>
            <View class="h-10 min-w-0 flex-1 items-center justify-center rounded-full border px-4" style={{ borderColor: props.snapshot.colors.border, backgroundColor: props.snapshot.colors.card }}>
              <Text numberOfLines={1} ellipsizeMode="tail" class="min-w-0 text-center text-[16px] font-normal" style={{ color: props.snapshot.colors.foreground, fontFamily: Inter }}>Дневник</Text>
            </View>
          </View>}
          <MobileJournalPage entries={props.snapshot.journalEntries} colors={props.snapshot.colors}
            onCreate={(text) => command("journal.create", { text })}
            onUpdate={(id, text) => command("journal.update", { id, text })}
            onDelete={(id) => command("journal.delete", { id })}
            onCopy={(text) => command("clipboard.copy", { text })}
            nativeCalendarButton={false} mobile={true} />
        </View>}
        {props.route === "tasks" && <View class="min-h-0 flex-1">
          <TaskPage snapshot={props.snapshot} onCompleteTodo={props.onCompleteTodo} />
          {shell() && <View onPress={props.onOpenNewTask} role="button" accessibilityLabel="Новая задача" class="absolute items-center justify-center rounded-full" hoverStyle={{ opacity: 0.85 }} style={{ right: 16, bottom: 16, width: 32, height: 32, backgroundColor: props.snapshot.colors.foreground, cursor: "pointer" }}><SharedIcon name="plus" size={16} color={props.snapshot.colors.background} /></View>}
        </View>}
        {props.route === "settings" && props.snapshot.chrome !== "mobile" && <View class="min-h-0 flex-1" style={{ paddingTop: shell() ? TITLEBAR_HEIGHT : 0 }}>{desktopSettings}</View>}
        {props.snapshot.chrome === "mobile" && props.route === "settings" && <View class="h-full min-h-0 flex-col" style={{ backgroundColor: props.snapshot.colors.background }}>
          <View class="h-14 flex-row items-center px-3">
            <View onPress={props.onBack} role="button" accessibilityLabel="Назад" class="h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: props.snapshot.colors.border, backgroundColor: props.snapshot.colors.card }}><Text class="text-[25px]" style={{ color: props.snapshot.colors.foreground }}>‹</Text></View>
          </View>
          {mobileSettings}
        </View>}
        {props.snapshot.chrome === "mobile" && props.route === "connection" && <ConnectionPage
          colors={props.snapshot.colors} version={props.snapshot.version} sync={props.snapshot.connection} onBack={props.onBack}
          onShowCode={() => command("connection.show-code")}
          onCopy={(text) => command("clipboard.copy", { text })}
          onConnectClipboard={() => command("connection.connect-clipboard")}
          onRestart={() => command("connection.restart")}
          onAccept={(deviceId) => command("connection.accept", { device_id: deviceId })}
          onDecline={(deviceId) => command("connection.decline", { device_id: deviceId })}
          onCancelPairing={() => command("connection.cancel")}
          onDisconnect={(deviceId) => command("connection.disconnect", { device_id: deviceId })}
        />}
        {props.snapshot.chrome === "mobile" && <MobileHome
          colors={props.snapshot.colors}
          mode={() => props.route === "home"
            ? transition.kind === "enter" && transition.phase === "primed" ? "fadeOut" : "home"
            : transition.kind === "exit" && transition.phase === "primed" ? "fadeInStart" : transition.kind === "exit" && transition.phase === "moving" ? "fadeIn" : "hidden"}
          onOpenJournal={() => props.onChangeRoute("journal")}
          onOpenSettings={() => props.onChangeRoute("settings")}
        />}
        {props.taskDialogOpen && <SharedDialog title="Новая задача" colors={props.snapshot.colors}>
          <Input value={props.newTaskTitle} onChange={props.onSetNewTaskTitle} onSubmit={(event) => props.onSubmitNewTask(event.text)} placeholder="Название задачи" accessibilityLabel="Название задачи" class="h-10 rounded-lg px-3 text-[13px]" style={{ backgroundColor: props.snapshot.colors.background, color: props.snapshot.colors.foreground }} />
          <View class="mt-3 flex-row justify-end" style={{ gap: 8 }}>
            <GhostButton label="Отмена" colors={props.snapshot.colors} dark={dark()} onPress={props.onDismissNewTask} />
            <SolidButton label="Добавить" background={props.snapshot.colors.accent} foreground={props.snapshot.colors.background} onPress={() => props.onSubmitNewTask(props.newTaskTitle)} />
          </View>
        </SharedDialog>}
      </View>
    </View>
    {shell() && <TitlebarOverlay
      colors={props.snapshot.colors}
      dark={dark()}
      showCalendarToggle={props.route === "journal"}
      calendarOpen={props.calendarOpen}
      onToggleSidebar={props.onToggleSidebar}
      onToggleCalendar={props.onToggleCalendar}
    />}
  </>;
}

import { effect, PanResponder, Scroll, signal, nativeComponent, Text, View } from "nsh";
import { Input } from "nsh/base";
import { Button as SharedButton, Dialog as SharedDialog, Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { JournalCalendar } from "./JournalCalendar";
import { buildJournalDays, closestJournalDay, formatJournalDay } from "./journal-model";
import type { JournalEntry } from "./state";

export const journalCalendarOpen = signal(false);
const NativeCalendarToggle = nativeComponent<{ expanded: boolean; label: string }, { press: Record<string, never> }>("atlas.journalCalendarToggle", {
  props: ["expanded", "label"],
  events: ["press"],
});
const journalCalendarWidth = signal(260);
const journalDraft = signal("");
const journalDraftContentHeight = signal(20);
const journalDraftMinContentHeight = 20;
const journalDraftMaxContentHeight = 240;
const journalDraftExpandedHeight = journalDraftMinContentHeight * 1.5;
const journalDraftVerticalPadding = 20;
const editingJournalId = signal<string | null>(null);
const editingJournalText = signal("");
const activeJournalEntry = signal<JournalEntry | null>(null);
const journalSelectionEntryId = signal<string | null>(null);
const journalActionsClosing = signal(false);
export const mobileJournalEditorOpen = signal(false);
const mobileJournalEditorDragY = signal(0);
const mobileJournalEditorClosing = signal(false);
const mobileJournalDiscardPrompt = signal(false);
let mobileJournalEditorTimer: number | undefined;
let journalActionsTimer: number | undefined;

function openJournalActions(entry: JournalEntry) {
  journalSelectionEntryId.set(null);
  activeJournalEntry.set(entry);
  journalActionsClosing.set(true);
  if (journalActionsTimer !== undefined) clearTimeout(journalActionsTimer);
  journalActionsTimer = setTimeout(() => {
    journalActionsClosing.set(false);
    journalActionsTimer = undefined;
  }, 16);
}

function closeJournalActions() {
  journalActionsClosing.set(true);
  if (journalActionsTimer !== undefined) clearTimeout(journalActionsTimer);
  journalActionsTimer = setTimeout(() => {
    activeJournalEntry.set(null);
    journalActionsClosing.set(false);
    journalActionsTimer = undefined;
  }, 130);
}

function closeMobileJournalEditor(discard: boolean) {
  mobileJournalDiscardPrompt.set(false);
  mobileJournalEditorClosing.set(true);
  if (mobileJournalEditorTimer !== undefined) clearTimeout(mobileJournalEditorTimer);
  mobileJournalEditorTimer = setTimeout(() => {
    if (discard) {
      journalDraft.set("");
      journalDraftContentHeight.set(journalDraftMinContentHeight);
    }
    mobileJournalEditorOpen.set(false);
    mobileJournalEditorClosing.set(false);
    mobileJournalEditorTimer = undefined;
  }, 180);
}

function openMobileJournalEditor() {
  mobileJournalEditorClosing.set(false);
  mobileJournalEditorDragY.set(0);
  mobileJournalEditorOpen.set(true);
}

export function requestMobileJournalBack() {
  if (!mobileJournalEditorOpen()) return;
  if (mobileJournalDiscardPrompt()) {
    mobileJournalDiscardPrompt.set(false);
    return;
  }
  if (journalDraft().trim()) mobileJournalDiscardPrompt.set(true);
  else closeMobileJournalEditor(false);
}

function timeLabel(createdAt: string) {
  const date = new Date(createdAt);
  return Number.isNaN(date.valueOf()) ? "" : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function MobileJournalPage(props: {
  entries: readonly JournalEntry[];
  colors: ThemeColors;
  onCreate(text: string): void;
  onUpdate(id: string, text: string): void;
  onDelete(id: string): void;
  onCopy?(text: string): void;
  nativeCalendarButton: boolean;
  mobile: boolean;
}) {
  let feedRef: { scrollTo: (options: { y?: number; animated?: boolean }) => void; scrollToEnd: (options?: { animated?: boolean }) => void } | undefined;
  let pageWidth = 0;
  let resizeStartWidth = journalCalendarWidth();
  const resizeCalendar = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { resizeStartWidth = journalCalendarWidth(); },
    onPanResponderMove: (_event: unknown, gesture: { dx: number }) => {
      const minWidth = 220;
      const maxWidth = pageWidth > 0 ? Math.max(minWidth, Math.min(420, pageWidth * 0.42)) : 420;
      journalCalendarWidth.set(Math.max(minWidth, Math.min(maxWidth, resizeStartWidth - gesture.dx)));
    },
    onPanResponderRelease: () => {},
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => false,
  });
  const dismissJournalEditor = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event: unknown, gesture: { dx: number; dy: number }) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_event: unknown, gesture: { dy: number }) => mobileJournalEditorDragY.set(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event: unknown, gesture: { dy: number; vy: number }) => {
      if (gesture.dy > 96 || gesture.vy > 1.5) closeMobileJournalEditor(false);
      else mobileJournalEditorDragY.set(0);
    },
    onPanResponderTerminate: () => mobileJournalEditorDragY.set(0),
  });
  const dayOffsets = new Map<string, number>();
  const groups = () => buildJournalDays(props.entries);
  const mobileDraftNeedsExpand = () => journalDraftContentHeight() > journalDraftMinContentHeight * 3;
  effect(() => {
    const entries = props.entries;
    if (entries.length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
  });
  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    props.onCreate(value);
    journalDraft.set("");
    journalDraftContentHeight.set(journalDraftMinContentHeight);
  };
  const jumpToDay = (key: string) => {
    const target = closestJournalDay(groups(), key);
    if (journalCalendarOpen()) toggleJournalCalendar();
    if (target?.kind === "dated") {
      const offset = dayOffsets.get(target.key);
      if (offset !== undefined) feedRef?.scrollTo({ y: Math.max(0, offset - 12), animated: true });
    }
  };

  return <View onLayout={(bounds) => { pageWidth = bounds.size.width; }} class="min-h-0 flex-1 flex-row overflow-hidden">
    <View class="relative min-w-0 flex-1 flex-col items-center">
      {!props.mobile && (props.nativeCalendarButton
        ? <NativeCalendarToggle expanded={journalCalendarOpen()} label={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} onPress={toggleJournalCalendar} accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} class="absolute right-4 top-4 z-10 h-8 w-8" />
        : <View onPress={toggleJournalCalendar} role="button" accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} accessibilityState={{ selected: journalCalendarOpen() }} class="absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: journalCalendarOpen() ? props.colors.card : "transparent" }}>
            <SharedIcon name="sidebar" color={journalCalendarOpen() ? props.colors.accent : props.colors.muted} />
          </View>)}
      <View class="relative min-h-0 w-full flex-1">
      <Scroll ref={(node) => { feedRef = node; }} class="min-h-0 w-full flex-1 py-4">
        <View class={`mx-auto w-full max-w-[690px] ${props.mobile ? "px-3" : "px-5"}`}>
        {groups().map((group) => <View onLayout={(bounds) => { dayOffsets.set(group.key, bounds.origin.y); }} class="mb-5">
          <Text class="mb-3 text-center text-[14px]" style={{ color: props.colors.muted }}>{formatJournalDay(group)}</Text>
          {group.entries.map((entry) => <View onLongPress={props.mobile ? () => openJournalActions(entry) : undefined} onContextMenu={props.mobile ? () => openJournalActions(entry) : undefined} role={props.mobile ? "button" : undefined} accessibilityLabel={props.mobile ? "Действия с записью" : undefined} delayLongPress={430} class={`mb-3 self-end ${props.mobile ? "w-auto max-w-full" : "w-full max-w-[650px]"} rounded-2xl px-4 py-3`} style={{ backgroundColor: editingJournalId() === entry.id || !props.mobile ? props.colors.card : props.colors.background === "#0d0c10" ? "#1b191f" : "#f7f6f8", width: props.mobile ? "auto" : "100%", maxWidth: props.mobile ? "100%" : 650 }}>
            {editingJournalId() === entry.id
              ? <View>
                  <Input value={editingJournalText()} onChange={(value) => editingJournalText.set(value)} multiline={true} submitBehavior="newline" class={`min-h-[56px] w-full px-1 py-1 ${props.mobile ? "text-[18px]" : "text-[13px]"}`} style={{ color: props.colors.foreground, backgroundColor: "transparent", fontSize: props.mobile ? 18 : 13, lineHeight: props.mobile ? 27 : 20, selectionColor: props.colors.accent }} />
                  <View class="mt-2 flex-row justify-end gap-2">
                    <SharedButton label="Отмена" colors={props.colors} onPress={() => editingJournalId.set(null)} />
                    <SharedButton label="Сохранить" colors={props.colors} onPress={() => { props.onUpdate(entry.id, editingJournalText()); editingJournalId.set(null); }} selected />
                  </View>
                </View>
              : <Text onLongPress={props.mobile ? () => openJournalActions(entry) : undefined} onContextMenu={props.mobile ? () => openJournalActions(entry) : undefined} delayLongPress={430} selectable={props.mobile ? journalSelectionEntryId() === entry.id : true} class={props.mobile ? "text-[18px] leading-7" : "text-[14px] leading-6"} style={{ color: props.colors.foreground, fontSize: props.mobile ? 18 : 14, lineHeight: props.mobile ? 27 : 24, selectionColor: props.colors.accent }}>{entry.text}</Text>}
            {!props.mobile && <View class="mt-2 flex-row items-center justify-end gap-3">
              <Text class="text-[10px]" style={{ color: props.colors.muted }}>{timeLabel(entry.createdAt)}</Text>
              {editingJournalId() !== entry.id && <View class="flex-row gap-3">
                <View onPress={() => { editingJournalId.set(entry.id); editingJournalText.set(entry.text); }} role="button" accessibilityLabel="Изменить запись"><Text class="text-[11px]" style={{ color: props.colors.muted }}>Изменить</Text></View>
                <View onPress={() => props.onDelete(entry.id)} role="button" accessibilityLabel="Удалить запись"><Text class="text-[11px]" style={{ color: props.colors.muted }}>Удалить</Text></View>
              </View>}
            </View>}
          </View>)}
        </View>)}
        {groups().length === 0 && <View class="flex-1 items-center justify-center py-12"><Text class="text-[13px]" style={{ color: props.colors.muted }}>Записей пока нет</Text></View>}
        </View>
      </Scroll>
      </View>
      {props.mobile
        ? <View class="relative mb-4 w-full px-3">
            {mobileDraftNeedsExpand() && <View onPress={openMobileJournalEditor} role="button" accessibilityLabel="Развернуть на весь экран" class="absolute right-5 -top-11 z-10 h-9 w-9 items-center justify-center rounded-full border" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border }}><Text class="text-[20px] font-medium" style={{ color: props.colors.foreground }}>⛶</Text></View>}
            <View class="w-full flex-row gap-2 rounded-[24px] border px-2 py-1.5" style={{ alignItems: mobileDraftNeedsExpand() ? "flex-end" : "center", backgroundColor: props.colors.card, borderColor: props.colors.border }}>
              <Input value={journalDraft()} onChange={(value) => journalDraft.set(value)} onContentSizeChange={({ height }) => journalDraftContentHeight.set(Math.max(journalDraftMinContentHeight, Math.min(journalDraftMaxContentHeight, height)))} onSubmit={(event) => send(event.text)} multiline={true} submitBehavior="newline" placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="min-w-0 flex-1 px-2 py-1 text-[18px]" style={{ placeholderColor: props.colors.muted, selectionColor: props.colors.accent, height: Math.max(44, Math.min(260, journalDraftContentHeight() + 20)), fontSize: 18, lineHeight: 24, paddingHorizontal: 8, paddingVertical: 10, backgroundColor: "transparent", color: props.colors.foreground, transitionProperty: "height", transitionDuration: 120, transitionTimingFunction: "ease-out" }} />
              <View onPress={journalDraft().trim() ? () => send(journalDraft()) : undefined} role="button" accessibilityLabel="Отправить запись" accessibilityState={{ disabled: !journalDraft().trim() }} class="h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: journalDraft().trim() ? props.colors.accent : props.colors.border, opacity: journalDraft().trim() ? 1 : 0.55 }}>
                <Text class="text-[22px] font-semibold" style={{ color: "#ffffff" }}>↑</Text>
              </View>
            </View>
          </View>
        : <View class="mb-4 w-full px-5">
        <View class="mx-auto w-full max-w-[650px] flex-row gap-2 border pl-3 pr-1.5 py-1.5" style={{ alignItems: journalDraftContentHeight() > journalDraftExpandedHeight ? "flex-end" : "center", backgroundColor: props.colors.card, borderColor: props.colors.border, borderRadius: 24 }}>
          <Input value={journalDraft()} onChange={(value) => journalDraft.set(value)} onContentSizeChange={({ height }) => journalDraftContentHeight.set(Math.max(journalDraftMinContentHeight, Math.min(journalDraftMaxContentHeight, height)))} onSubmit={(event) => send(event.text)} multiline={true} submitBehavior="submit" placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="max-h-[120px] flex-1 text-[15px]" style={{ placeholderColor: props.colors.muted, selectionColor: props.colors.accent, height: journalDraftContentHeight() + journalDraftVerticalPadding, fontSize: 15, lineHeight: 20, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "transparent", color: props.colors.foreground }} />
          <View onPress={() => send(journalDraft())} role="button" accessibilityLabel="Отправить запись" class="h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: props.colors.accent }}>
            <Text class="text-[20px] font-semibold" style={{ color: props.colors.foreground }}>↑</Text>
          </View>
        </View>
      </View>}
    </View>
    {!props.mobile && <View class="relative h-full shrink-0" style={{ width: journalCalendarOpen() ? journalCalendarWidth() : 0 }}>
      <View class="h-full w-full overflow-hidden">
        <JournalCalendar width={journalCalendarWidth()} resizeHovered={false} framed={false} dark={props.colors.background === "#0d0c10"} groups={groups()} colors={props.colors} onSelect={jumpToDay} />
      </View>
      {journalCalendarOpen() && resizeCalendar && <View {...resizeCalendar.panHandlers} role="button" accessibilityLabel="Изменить ширину календаря" class="absolute top-0 bottom-0 z-10 w-5" style={{ left: -10, cursor: "col-resize" }} />}
    </View>}
    {props.mobile && mobileJournalEditorOpen() && <View {...dismissJournalEditor.panHandlers} class={`absolute inset-0 z-30 ${mobileJournalEditorClosing() ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`} style={{ backgroundColor: props.colors.background, transform: [{ translateY: mobileJournalEditorDragY() }], transitionProperty: "opacity, transform", transitionDuration: mobileJournalEditorDragY() ? 0 : 180, transitionTimingFunction: "ease-out" }}>
      <View class="absolute right-4 top-3 z-20">
        <View onPress={() => closeMobileJournalEditor(false)} role="button" accessibilityLabel="Свернуть редактор" class="h-10 w-10 items-center justify-center rounded-full border" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border }}>
          <Text class="text-[24px]" style={{ color: props.colors.foreground, transform: [{ rotate: "-90deg" }] }}>‹</Text>
        </View>
      </View>
      <View class="absolute left-5 right-5 top-20 bottom-20">
        <Input value={journalDraft()} onChange={(value) => journalDraft.set(value)} multiline={true} submitBehavior="newline" autoFocus={true} placeholder="О чём вы думаете?" accessibilityLabel="Текст новой заметки" class="h-full w-full text-[32px]" style={{ fontSize: 32, lineHeight: 40, placeholderColor: props.colors.muted, selectionColor: props.colors.accent, backgroundColor: "transparent", color: props.colors.foreground }} />
      </View>
      <View class="absolute right-4 bottom-4 z-20">
        <View onPress={() => { send(journalDraft()); closeMobileJournalEditor(false); }} role="button" accessibilityLabel="Готово, отправить запись" class="h-12 items-center justify-center rounded-full px-6" style={{ backgroundColor: props.colors.accent }}>
          <Text class="text-[16px] font-semibold" style={{ color: "#ffffff" }}>Готово</Text>
        </View>
      </View>
    </View>}
    {props.mobile && mobileJournalDiscardPrompt() && <SharedDialog title="Удалить черновик?" colors={props.colors}>
      <Text class="mb-4 text-[13px]" style={{ color: props.colors.muted }}>Текст заметки ещё не добавлен в дневник.</Text>
      <View class="flex-row justify-end gap-2">
        <SharedButton label="Продолжить" colors={props.colors} onPress={() => mobileJournalDiscardPrompt.set(false)} />
        <SharedButton label="Удалить" colors={props.colors} onPress={() => closeMobileJournalEditor(true)} selected style={{ backgroundColor: props.colors.accent, borderColor: "transparent" }} textColor={props.colors.background} />
      </View>
    </SharedDialog>}
    {props.mobile && activeJournalEntry() && <View class="absolute inset-0 z-40 justify-end" style={{ backgroundColor: "#00000066", opacity: journalActionsClosing() ? 0 : 1, transitionProperty: "opacity", transitionDuration: 130, transitionTimingFunction: "ease-out" }}>
      <View onPress={closeJournalActions} class="absolute inset-0" accessibilityLabel="Закрыть меню записи" />
      <View class={`w-full rounded-t-[26px] border px-5 pt-3 pb-8 ${journalActionsClosing() ? "translate-y-6" : "translate-y-0"}`} style={{ backgroundColor: props.colors.card, borderColor: props.colors.border, opacity: journalActionsClosing() ? 0 : 1, transitionProperty: "opacity, transform", transitionDuration: 130, transitionTimingFunction: "ease-out" }}>
        <View class="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: props.colors.border }} />
        <Text numberOfLines={2} class="mb-3 text-[15px] font-medium" style={{ color: props.colors.foreground }}>{activeJournalEntry()?.text}</Text>
        <View onPress={() => { const entry = activeJournalEntry(); if (entry) props.onCopy?.(entry.text); closeJournalActions(); }} role="button" class="h-12 justify-center border-b" style={{ borderColor: props.colors.border }}><Text class="text-[16px]" style={{ color: props.colors.foreground }}>Копировать текст</Text></View>
        <View onPress={() => { const entry = activeJournalEntry(); journalSelectionEntryId.set(entry?.id ?? null); closeJournalActions(); }} role="button" class="h-12 justify-center border-b" style={{ borderColor: props.colors.border }}><Text class="text-[16px]" style={{ color: props.colors.foreground }}>Выбрать фрагмент</Text></View>
        <View onPress={() => { const entry = activeJournalEntry(); if (entry) { editingJournalId.set(entry.id); editingJournalText.set(entry.text); } closeJournalActions(); }} role="button" class="h-12 justify-center border-b" style={{ borderColor: props.colors.border }}><Text class="text-[16px]" style={{ color: props.colors.foreground }}>Изменить</Text></View>
        <View onPress={() => { const entry = activeJournalEntry(); if (entry) props.onDelete(entry.id); closeJournalActions(); }} role="button" class="h-12 justify-center"><Text class="text-[16px]" style={{ color: "#ef4444" }}>Удалить</Text></View>
      </View>
    </View>}
  </View>;
}

export function toggleJournalCalendar() {
  journalCalendarOpen.update((open) => !open);
}

import { effect, Input, Scroll, signal, Text, View } from "nsh";
import { PanResponder } from "nsh/gesture";
import { nativeComponent } from "nsh/native";
import { Button as SharedButton, Icon as SharedIcon } from "@makekosmos/imago-nsh";
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
const journalDraftMaxContentHeight = 100;
const journalDraftExpandedHeight = journalDraftMinContentHeight * 1.5;
const journalDraftVerticalPadding = 20;
const editingJournalId = signal<string | null>(null);
const editingJournalText = signal("");

function timeLabel(createdAt: string) {
  const date = new Date(createdAt);
  return Number.isNaN(date.valueOf()) ? "" : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function JournalPage(props: {
  entries: readonly JournalEntry[];
  colors: ThemeColors;
  onCreate(text: string): void;
  onUpdate(id: string, text: string): void;
  onDelete(id: string): void;
  nativeCalendarButton: boolean;
  mobile: boolean;
}) {
  let feedRef: { scrollTo: (options: { y?: number; animated?: boolean }) => void; scrollToEnd: (options?: { animated?: boolean }) => void } | undefined;
  let pageWidth = 0;
  let resizeStartWidth = journalCalendarWidth();
  const resizeCalendar = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { resizeStartWidth = journalCalendarWidth(); },
    onPanResponderMove: (_, gesture) => {
      const minWidth = 220;
      const maxWidth = pageWidth > 0 ? Math.max(minWidth, Math.min(420, pageWidth * 0.42)) : 420;
      journalCalendarWidth.set(Math.max(minWidth, Math.min(maxWidth, resizeStartWidth - gesture.dx)));
    },
    onPanResponderRelease: () => {},
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => false,
  });
  const dayOffsets = new Map<string, number>();
  const groups = () => buildJournalDays(props.entries);
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
      {props.nativeCalendarButton
        ? <NativeCalendarToggle expanded={journalCalendarOpen()} label={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} onPress={toggleJournalCalendar} accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} class="absolute right-4 top-4 z-10 h-8 w-8" />
        : <View onPress={toggleJournalCalendar} role="button" accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} accessibilityState={{ selected: journalCalendarOpen() }} class="absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: journalCalendarOpen() ? props.colors.card : "transparent" }}>
            <SharedIcon name="sidebar" color={journalCalendarOpen() ? props.colors.accent : props.colors.muted} />
          </View>}
      <View class="relative min-h-0 w-full flex-1">
      <Scroll ref={(node) => { feedRef = node; }} class="min-h-0 w-full flex-1 py-4">
        <View class="mx-auto w-full max-w-[690px] px-5">
        {groups().map((group) => <View onLayout={(bounds) => { dayOffsets.set(group.key, bounds.origin.y); }} class="mb-5">
          <View class="mb-3 flex-row items-center justify-center"><View class="h-px flex-1" style={{ backgroundColor: props.colors.border }} /><Text class="mx-3 text-[12px] capitalize" style={{ color: props.colors.muted }}>{formatJournalDay(group)}</Text><View class="h-px flex-1" style={{ backgroundColor: props.colors.border }} /></View>
          {group.entries.map((entry) => <View class="mb-3 self-end w-full max-w-[650px] rounded-2xl px-4 py-3" style={{ backgroundColor: props.colors.card }}>
            {editingJournalId() === entry.id
              ? <View>
                  <Input value={editingJournalText()} onChange={(value) => editingJournalText.set(value)} multiline={true} submitBehavior="newline" class="min-h-[56px] w-full rounded-lg px-2 py-1 text-[13px]" style={{ color: props.colors.foreground, backgroundColor: props.colors.background }} />
                  <View class="mt-2 flex-row justify-end gap-2">
                    <SharedButton label="Отмена" colors={props.colors} onPress={() => editingJournalId.set(null)} />
                    <SharedButton label="Сохранить" colors={props.colors} onPress={() => { props.onUpdate(entry.id, editingJournalText()); editingJournalId.set(null); }} selected />
                  </View>
                </View>
              : <Text selectable={true} class="text-[14px] leading-6" style={{ color: props.colors.foreground, selectionColor: props.colors.accent }}>{entry.text}</Text>}
            <View class="mt-2 flex-row items-center justify-end gap-3">
              <Text class="text-[10px]" style={{ color: props.colors.muted }}>{timeLabel(entry.createdAt)}</Text>
              {editingJournalId() !== entry.id && <View class="flex-row gap-3">
                <View onPress={() => { editingJournalId.set(entry.id); editingJournalText.set(entry.text); }} role="button" accessibilityLabel="Изменить запись"><Text class="text-[11px]" style={{ color: props.colors.muted }}>Изменить</Text></View>
                <View onPress={() => props.onDelete(entry.id)} role="button" accessibilityLabel="Удалить запись"><Text class="text-[11px]" style={{ color: props.colors.muted }}>Удалить</Text></View>
              </View>}
            </View>
          </View>)}
        </View>)}
        {groups().length === 0 && <View class="flex-1 items-center justify-center py-12"><Text class="text-[13px]" style={{ color: props.colors.muted }}>Записей пока нет</Text></View>}
        </View>
      </Scroll>
      <View pointerEvents="none" class="absolute right-0 top-0 bottom-0 w-[8px]" style={{ backgroundColor: props.colors.background, opacity: 0.86 }} />
      </View>
      <View class="mb-4 w-full px-5">
        <View class="mx-auto w-full max-w-[650px] flex-row items-end gap-2 border pl-3 pr-1.5 py-1.5" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border, borderRadius: journalDraftContentHeight() > journalDraftExpandedHeight ? 24 : 999, transitionProperty: "borderRadius", transitionDuration: 180, transitionTimingFunction: "ease-out" }}>
          <Input value={journalDraft()} onChange={(value) => journalDraft.set(value)} onContentSizeChange={({ height }) => journalDraftContentHeight.set(Math.max(journalDraftMinContentHeight, Math.min(journalDraftMaxContentHeight, height)))} onSubmit={(event) => send(event.text)} multiline={true} submitBehavior="submit" placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="max-h-[120px] flex-1 text-[15px]" style={{ placeholderColor: props.colors.muted, selectionColor: props.colors.accent, height: journalDraftContentHeight() + journalDraftVerticalPadding, fontSize: 15, lineHeight: 20, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "transparent", color: props.colors.foreground }} />
          <View onPress={() => send(journalDraft())} role="button" accessibilityLabel="Отправить запись" class="h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: props.colors.accent }}>
            <Text class="text-[20px] font-semibold" style={{ color: props.colors.foreground }}>↑</Text>
          </View>
        </View>
      </View>
    </View>
    <View class="relative h-full shrink-0" style={{ width: journalCalendarOpen() ? journalCalendarWidth() : 0, position: props.mobile ? "absolute" : undefined, right: props.mobile ? 0 : undefined, top: props.mobile ? 0 : undefined, bottom: props.mobile ? 0 : undefined, zIndex: props.mobile ? 20 : undefined }}>
      <View class="h-full w-full overflow-hidden">
        <JournalCalendar width={journalCalendarWidth()} resizeHovered={false} groups={groups()} colors={props.colors} onSelect={jumpToDay} />
      </View>
      {journalCalendarOpen() && resizeCalendar && <View {...resizeCalendar.panHandlers} role="button" accessibilityLabel="Изменить ширину календаря" class="absolute top-0 bottom-0 z-10 w-5" style={{ left: -10, cursor: "col-resize" }} />}
    </View>
  </View>;
}

export function toggleJournalCalendar() {
  journalCalendarOpen.update((open) => !open);
}

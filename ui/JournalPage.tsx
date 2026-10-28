import { Clipboard, createMotion, effect, Easing, LayoutAnimation, PanResponder, Scroll, signal, Text, View, nativeComponent } from "nsh";
import { Input } from "nsh/base";
import { Menu } from "nsh/desktop";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { JournalCalendar } from "./JournalCalendar";
import { GhostButton, SolidButton, animatePanes, colorAlpha, hoverWash, surfaceWash } from "./chrome";
import { buildJournalDays, closestJournalDay, formatJournalDay, formatJournalStamp } from "./journal-model";
import type { JournalEntry } from "./state";
import { accentMark, journalBubble } from "./themes";

const COMPOSER_RADIUS = 26;
const COMPOSER_COMPACT_HEIGHT = 49;
const COMPOSER_SEND = 30;
const COMPOSER_LINE = 22;
const COMPOSER_PAD_X = 16;
const COMPOSER_PAD_Y = 12;
const COMPOSER_MAX_CONTENT = 132;
const COMPOSER_MAX_HEIGHT = 168;
const CARET_WIDTH = 2;
const CARET_BLINK_MS = 500;
const COMPOSER_FADE = 20;
const BUBBLE_RADIUS = 18;
const FEED_PAD = 16;
const THREAD_WIDTH = 690;
export const JOURNAL_DATE_DELAY_MS = 2000;
const feedBox = signal({ width: 0, height: 0 });
const journalHoverId = signal<string | null>(null);
const journalDateShown = signal<string | null>(null);
let journalDateWarm = false;
let journalDateTimer: ReturnType<typeof setTimeout> | undefined;

function threadSpan() {
  const width = feedBox().width;
  return width > 0 ? Math.min(width, THREAD_WIDTH) : THREAD_WIDTH;
}

function clearJournalDateTimer() {
  if (journalDateTimer !== undefined) {
    clearTimeout(journalDateTimer);
    journalDateTimer = undefined;
  }
}

export function journalDateDelay(warm: boolean) {
  return warm ? 0 : JOURNAL_DATE_DELAY_MS;
}

function showJournalDate(id: string) {
  journalHoverId.set(id);
  clearJournalDateTimer();
  const delay = journalDateDelay(journalDateWarm);
  if (delay === 0) {
    journalDateShown.set(id);
    return;
  }
  journalDateShown.set(null);
  journalDateTimer = setTimeout(() => {
    journalDateTimer = undefined;
    if (journalHoverId() !== id) return;
    journalDateWarm = true;
    journalDateShown.set(id);
  }, delay);
}

function hideJournalDate(id: string) {
  if (journalHoverId() !== id) return;
  clearJournalDateTimer();
  journalHoverId.set(null);
  journalDateShown.set(null);
}

function leaveJournalDates() {
  clearJournalDateTimer();
  journalDateWarm = false;
  journalHoverId.set(null);
  journalDateShown.set(null);
}

export const journalCalendarOpen = signal(false);
const NativeCalendarToggle = nativeComponent<{ expanded: boolean; label: string }, { press: Record<string, never> }>("atlas.journalCalendarToggle", {
  props: ["expanded", "label"],
  events: ["press"],
});
const journalCalendarWidth = signal(260);
const journalDraft = signal("");
const journalDraftContentHeight = signal(COMPOSER_LINE);
const journalFocused = signal(false);
const journalSelection = signal({ start: 0, end: 0 });
const journalCaret = signal({ x: COMPOSER_PAD_X, y: COMPOSER_PAD_Y, height: COMPOSER_LINE });
const journalCaretOn = signal(true);
const journalCaretTick = signal(0);
const journalScrollY = signal(0);
const journalCalendarMinWidth = 220;
const journalCalendarMaxWidth = 420;
const journalCalendarResizeHovered = signal(false);
const journalCalendarResizeActive = signal(false);
const editingJournalId = signal<string | null>(null);
const editingJournalText = signal("");
const arrivingId = signal<string | null>(null);
let sendSeq = 0;
let composerRef: { focus: () => void; blur: () => void } | undefined;
let editFocus: { focus: () => void } | undefined;

function claimJournalComposer() {
  if (editingJournalId()) return;
  composerRef?.focus();
}

function animateComposer() {
  LayoutAnimation.configureNext({ duration: 180, update: { type: "easeOut", duration: 180 } });
}

function clampDraftHeight(height: number) {
  return Math.round(Math.max(COMPOSER_LINE, Math.min(COMPOSER_MAX_CONTENT, height)));
}

function composerContentHeight() {
  return Math.max(COMPOSER_LINE, journalDraftContentHeight());
}

function composerInputHeight() {
  return composerContentHeight() + COMPOSER_PAD_Y * 2;
}

function composerViewportHeight() {
  return clampDraftHeight(composerContentHeight()) + COMPOSER_PAD_Y * 2;
}

function composerPillHeight() {
  return Math.max(COMPOSER_COMPACT_HEIGHT, Math.min(COMPOSER_MAX_HEIGHT, composerViewportHeight()));
}

export function composerFadeEdges(content: number, viewport: number, scroll: number) {
  const max = Math.max(0, content - viewport);
  if (max <= 1) return { top: false, bottom: false };
  return { top: scroll > 1, bottom: scroll < max - 1 };
}

function composerFadeTop() {
  return composerFadeEdges(composerInputHeight(), composerViewportHeight(), journalScrollY()).top;
}

function composerFadeBottom() {
  return composerFadeEdges(composerInputHeight(), composerViewportHeight(), journalScrollY()).bottom;
}

function composerExpanded() {
  return journalDraftContentHeight() > COMPOSER_LINE + 1;
}

function placeCaret(bounds: { origin: { x: number; y: number }; size: { height: number } }) {
  const height = bounds.size.height;
  if (height <= 0) return;
  journalCaret.set({ x: bounds.origin.x, y: bounds.origin.y, height });
  journalCaretOn.set(true);
  journalCaretTick.update((n) => n + 1);
}

function composerSelecting() {
  const range = journalSelection();
  return range.start !== range.end;
}

function composerCaretShown() {
  return journalFocused() && !composerSelecting() && journalCaretOn();
}

function animateSend() {
  LayoutAnimation.configureNext({
    duration: 280,
    create: { type: "easeOut", property: "opacity", duration: 220 },
    update: { type: "easeOut", duration: 180 },
    delete: { type: "easeOut", property: "opacity", duration: 160 },
  });
}

function nextEntryId() {
  sendSeq += 1;
  return `local-${Date.now()}-${sendSeq}`;
}

function JournalBubble(props: {
  entry: JournalEntry;
  arriving: boolean;
  colors: ThemeColors;
  dark: boolean;
  onUpdate(id: string, text: string): void;
  onDelete(id: string): void;
}) {
  const sendMotion = props.arriving
    ? createMotion({
        enter: {
          keyframes: [
            { opacity: 0, translateY: 40, scale: 0.96 },
            { opacity: 1, translateY: 0, scale: 1 },
          ],
          duration: 280,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        },
      })
    : null;
  const openEntryMenu = (event: { pagePosition: { x: number; y: number } }) => {
    if (editingJournalId() === props.entry.id) return;
    void Menu.popup([{ label: "Копировать", onSelect: () => void Clipboard.writeText(props.entry.text) }, { label: "Изменить", onSelect: () => { editingJournalId.set(props.entry.id); editingJournalText.set(props.entry.text); } }, { label: "Удалить", onSelect: () => props.onDelete(props.entry.id) }], event.pagePosition);
  };
  return <View onHoverIn={() => showJournalDate(props.entry.id)} onHoverOut={() => hideJournalDate(props.entry.id)} class="mb-2 w-full flex-row items-center justify-end">
    {journalDateShown() === props.entry.id && <Text pointerEvents="none" class="mr-2 text-[11px]" style={{ color: props.colors.muted }}>{formatJournalStamp(props.entry.createdAt)}</Text>}
    <View onContextMenu={openEntryMenu} class="max-w-[75%] px-3 py-2" style={{ backgroundColor: editingJournalId() === props.entry.id ? props.colors.card : journalBubble(props.colors.accent), borderRadius: BUBBLE_RADIUS, transformOrigin: "bottom right", ...(sendMotion?.style ?? {}) }}>
      {editingJournalId() === props.entry.id
        ? <View>
            <Input ref={(node) => { editFocus = node; }} autoFocus value={editingJournalText()} onChange={(value) => editingJournalText.set(value)} multiline={true} submitBehavior="newline" accessibilityLabel="Текст записи" class="min-h-[56px] w-full rounded-lg px-2 py-1 text-[15px]" style={{ color: props.colors.foreground, backgroundColor: props.colors.background }} />
            <View class="mt-2 flex-row justify-end" style={{ gap: 8 }}>
              <GhostButton label="Отмена" colors={props.colors} dark={props.dark} onPress={() => editingJournalId.set(null)} />
              <SolidButton label="Сохранить" background={props.colors.accent} foreground={props.colors.background} onPress={() => { props.onUpdate(props.entry.id, editingJournalText()); editingJournalId.set(null); }} />
            </View>
          </View>
        : <Text selectable onContextMenu={openEntryMenu} class="text-[15px] leading-5" style={{ color: "#ffffff", selectionColor: colorAlpha(props.colors.accent, props.dark ? 0.35 : 0.24) }}>{props.entry.text}</Text>}
    </View>
  </View>;
}

export function JournalPage(props: {
  entries: () => readonly JournalEntry[];
  colors: ThemeColors;
  onCreate(text: string, id: string): void;
  onUpdate(id: string, text: string): void;
  onDelete(id: string): void;
  nativeCalendarButton: boolean;
  titlebarInset: number;
  dark: boolean;
}) {
  let feedRef: { scrollTo: (options: { y?: number; animated?: boolean }) => void; scrollToEnd: (options?: { animated?: boolean }) => void } | undefined;
  let composerScrollRef: { scrollTo: (options: { y?: number; animated?: boolean }) => void } | undefined;
  const revealComposer = (caret: { y: number; height: number }) => {
    const viewport = composerViewportHeight();
    const max = Math.max(0, composerInputHeight() - viewport);
    const top = caret.y;
    const bottom = top + Math.max(caret.height, COMPOSER_LINE);
    let next = journalScrollY();
    if (top < next) next = top;
    else if (bottom > next + viewport) next = bottom - viewport;
    next = Math.max(0, Math.min(max, next));
    if (Math.abs(next - journalScrollY()) <= 1) return;
    journalScrollY.set(next);
    composerScrollRef?.scrollTo({ y: next, animated: false });
  };
  let pageWidth = 0;
  let resizeStartWidth = journalCalendarWidth();
  const resizeCalendar = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      resizeStartWidth = journalCalendarWidth();
      journalCalendarResizeActive.set(true);
    },
    onPanResponderMove: (_, gesture) => {
      const maxWidth = pageWidth > 0
        ? Math.max(journalCalendarMinWidth, Math.min(journalCalendarMaxWidth, pageWidth * 0.42))
        : journalCalendarMaxWidth;
      journalCalendarWidth.set(Math.max(journalCalendarMinWidth, Math.min(maxWidth, resizeStartWidth - gesture.dx)));
    },
    onPanResponderRelease: () => journalCalendarResizeActive.set(false),
    onPanResponderTerminate: () => journalCalendarResizeActive.set(false),
    onPanResponderTerminationRequest: () => false,
  });
  const dayOffsets = new Map<string, number>();
  const groups = () => buildJournalDays(props.entries());
  effect(() => {
    const entries = props.entries();
    if (entries.length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
  });
  effect(() => {
    const editing = editingJournalId();
    queueMicrotask(() => {
      if (editing) editFocus?.focus();
      else composerRef?.focus();
    });
    return () => journalFocused.set(false);
  });
  effect(() => {
    if (!journalFocused()) return;
    journalCaretTick();
    journalCaretOn.set(true);
    let timer = setTimeout(function tick() {
      journalCaretOn.update((on) => !on);
      timer = setTimeout(tick, CARET_BLINK_MS);
    }, CARET_BLINK_MS);
    return () => clearTimeout(timer);
  });
  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    const id = nextEntryId();
    arrivingId.set(id);
    animateSend();
    props.onCreate(value, id);
    journalDraft.set("");
    journalDraftContentHeight.set(COMPOSER_LINE);
    journalScrollY.set(0);
    composerScrollRef?.scrollTo({ y: 0, animated: false });
    journalCaret.set({ x: COMPOSER_PAD_X, y: COMPOSER_PAD_Y, height: COMPOSER_LINE });
    journalCaretOn.set(true);
    journalCaretTick.update((n) => n + 1);
    composerRef?.focus();
  };
  const jumpToDay = (key: string) => {
    const target = closestJournalDay(groups(), key);
    if (journalCalendarOpen()) toggleJournalCalendar();
    if (target?.kind === "dated") {
      const offset = dayOffsets.get(target.key);
      if (offset !== undefined) feedRef?.scrollTo({ y: Math.max(0, offset - 12), animated: true });
    }
  };

  return <View onLayout={(bounds) => { pageWidth = bounds.size.width; }} onPress={claimJournalComposer} class="min-h-0 flex-1 flex-row overflow-hidden">
    <View class="relative min-w-0 flex-1 flex-col items-center">
      {props.nativeCalendarButton
        ? <NativeCalendarToggle expanded={journalCalendarOpen()} label={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} onPress={toggleJournalCalendar} accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} class="absolute right-4 z-10 h-8 w-8" style={{ top: props.titlebarInset + 16 }} />
        : props.titlebarInset === 0 && <View onPress={toggleJournalCalendar} role="button" accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} accessibilityState={{ selected: journalCalendarOpen() }} class="absolute z-10 items-center justify-center" hoverStyle={{ backgroundColor: surfaceWash(props.dark, 0.11) }} style={{ top: 16, right: 16, width: 28, height: 28, borderRadius: 6, cursor: "pointer", backgroundColor: journalCalendarOpen() ? surfaceWash(props.dark, 0.09) : "transparent" }}>
            <SharedIcon name="sidebar" size={16} color={journalCalendarOpen() ? props.colors.foreground : props.colors.muted} />
          </View>}
      <View class="relative min-h-0 w-full flex-1">
      <Scroll ref={(node) => { feedRef = node; }} onLayout={(bounds) => feedBox.set({ width: bounds.size.width, height: bounds.size.height })} contentStyle={{ flexGrow: 1 }} class="min-h-0 w-full flex-1 pb-4">
        <View onHoverOut={leaveJournalDates} class="mx-auto justify-end" style={{ width: threadSpan(), minHeight: feedBox().height, paddingTop: props.titlebarInset + 16, paddingLeft: FEED_PAD, paddingRight: FEED_PAD }}>
        <Each of={groups()} key={((group: { key: string }) => group.key) as any}>{(group) => <View onLayout={(bounds) => { dayOffsets.set(group().key, bounds.origin.y); }} class="mb-4">
          <Text class="mb-3 text-center text-[12px]" style={{ color: props.colors.muted }}>{formatJournalDay(group())}</Text>
          <Each of={group().entries} key={((entry: JournalEntry) => entry.id) as any}>{(entry) => <JournalBubble entry={entry()} arriving={arrivingId() === entry().id} colors={props.colors} dark={props.dark} onUpdate={props.onUpdate} onDelete={props.onDelete} />}</Each>
        </View>}</Each>
        {groups().length === 0 && <View class="flex-1 items-center justify-center py-12"><Text class="text-[13px]" style={{ color: props.colors.muted }}>Записей пока нет</Text></View>}
        </View>
      </Scroll>
      <View pointerEvents="none" class="absolute right-0 top-0 bottom-0 w-[8px]" style={{ backgroundColor: props.colors.background, opacity: 0.86 }} />
      </View>
      <View class="mb-4 mx-auto w-full" style={{ maxWidth: THREAD_WIDTH, paddingLeft: FEED_PAD, paddingRight: FEED_PAD }}>
        <View class="w-full flex-row border" style={{ height: composerPillHeight(), alignItems: composerExpanded() ? "flex-end" : "center", backgroundColor: props.colors.card, borderColor: props.colors.border, borderRadius: COMPOSER_RADIUS }}>
          <View class="relative min-w-0 flex-1 overflow-hidden" style={{ height: composerViewportHeight() }}>
            <Scroll ref={(node) => { composerScrollRef = node; }} scrollbar={false} onScroll={(event) => journalScrollY.set(event.offset.y)} class="w-full" style={{ height: composerViewportHeight() }}>
              <View class="relative w-full" style={{ height: composerInputHeight() }}>
                <Input ref={(node) => { composerRef = node; }} autoFocus value={journalDraft()} onChange={(value) => journalDraft.set(value)} onContentSizeChange={({ height }) => { const raw = Math.max(COMPOSER_LINE, Math.round(height)); if (raw === journalDraftContentHeight()) return; if (clampDraftHeight(raw) !== clampDraftHeight(journalDraftContentHeight())) animateComposer(); journalDraftContentHeight.set(raw); revealComposer(journalCaret()); }} onCaretMove={(event) => { placeCaret(event.bounds); revealComposer(journalCaret()); }} onSelectionChange={(range) => journalSelection.set(range)} onFocus={() => journalFocused.set(true)} onBlur={() => journalFocused.set(false)} onSubmit={(event) => send(event.text)} multiline={true} submitBehavior="submit" caret={false} placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="min-w-0 w-full text-[15px]" style={{ height: composerInputHeight(), fontSize: 15, lineHeight: COMPOSER_LINE, paddingLeft: COMPOSER_PAD_X, paddingRight: 8, paddingTop: COMPOSER_PAD_Y, paddingBottom: COMPOSER_PAD_Y, placeholderColor: props.colors.muted, selectionColor: colorAlpha(props.colors.accent, props.dark ? 0.35 : 0.24), backgroundColor: "transparent", color: props.colors.foreground }} />
                <View pointerEvents="none" class="absolute" style={{ left: journalCaret().x, top: journalCaret().y, width: CARET_WIDTH, height: journalCaret().height, backgroundColor: props.colors.accent, opacity: composerCaretShown() ? 1 : 0, zIndex: 1 }} />
              </View>
            </Scroll>
            {composerFadeTop() && <View pointerEvents="none" class="absolute left-0 right-0 top-0" style={{ height: COMPOSER_FADE, backgroundImage: `linear-gradient(to bottom, ${props.colors.card}, ${colorAlpha(props.colors.card, 0)})`, zIndex: 2 }} />}
            {composerFadeBottom() && <View pointerEvents="none" class="absolute left-0 right-0 bottom-0" style={{ height: COMPOSER_FADE, backgroundImage: `linear-gradient(to bottom, ${colorAlpha(props.colors.card, 0)}, ${props.colors.card})`, zIndex: 2 }} />}
          </View>
          <View onPress={() => send(journalDraft())} role="button" accessibilityLabel="Отправить запись" class="shrink-0 items-center justify-center rounded-full" hoverStyle={{ opacity: journalDraft().trim() ? 0.85 : 0.35 }} activeStyle={{ opacity: journalDraft().trim() ? 0.7 : 0.35 }} style={{ width: COMPOSER_SEND, height: COMPOSER_SEND, marginRight: 8, marginBottom: composerExpanded() ? 10 : 0, backgroundColor: journalBubble(props.colors.accent), opacity: journalDraft().trim() ? 1 : 0.35, cursor: journalDraft().trim() ? "pointer" : "default" }}>
            <Text class="text-[14px] font-semibold" style={{ color: accentMark(journalBubble(props.colors.accent)) }}>↑</Text>
          </View>
        </View>
      </View>
    </View>
    <View class="relative h-full shrink-0 overflow-hidden" style={{ width: journalCalendarOpen() ? journalCalendarWidth() : 0 }}>
      <View class="h-full border-l" style={{ width: journalCalendarWidth(), paddingTop: props.titlebarInset, backgroundColor: surfaceWash(props.dark), borderColor: journalCalendarResizeHovered() || journalCalendarResizeActive() ? props.colors.muted : props.colors.border, transitionProperty: "borderColor", transitionDuration: 150, transitionTimingFunction: "ease-out" }}>
        <JournalCalendar width={journalCalendarWidth()} framed={false} resizeHovered={false} groups={groups()} colors={props.colors} dark={props.dark} onSelect={jumpToDay} />
      </View>
      {journalCalendarOpen() && <View {...resizeCalendar.panHandlers} role="button" accessibilityLabel="Изменить ширину календаря" onHoverIn={() => journalCalendarResizeHovered.set(true)} onHoverOut={() => journalCalendarResizeHovered.set(false)} class="absolute top-0 bottom-0 z-10 w-5" style={{ left: -10, cursor: "col-resize" }} />}
    </View>
  </View>;
}

export function toggleJournalCalendar() {
  animatePanes();
  journalCalendarOpen.update((open) => !open);
}

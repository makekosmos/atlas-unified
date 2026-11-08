import { Clipboard, createMotion, effect, Easing, Image, LayoutAnimation, PanResponder, Scroll, signal, Text, View, nativeComponent } from "nsh";
import { Input } from "nsh/base";
import { Menu } from "nsh/desktop";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { JournalCalendar } from "./JournalCalendar";
import { GhostButton, SolidButton, animatePanes, colorAlpha, hoverWash, surfaceWash } from "./chrome";
import { buildJournalDays, closestJournalDay, formatJournalDay, formatJournalStamp } from "./journal-model";
import type { JournalEntry } from "./state";
import { accentMark, journalBubble } from "./themes";

/** Hugeicons `mic-01`, drawn in `currentColor` so a tint applies. */
const DotScope = nativeComponent<{ level: number; active: boolean; done: boolean }, {}>("atlas.scope", {
  props: ["level", "active", "done"],
  events: [],
});

const MIC_ICON = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M12%202C10.3431%202%209%203.34315%209%205V12C9%2013.6569%2010.3431%2015%2012%2015C13.6569%2015%2015%2013.6569%2015%2012V5C15%203.34315%2013.6569%202%2012%202Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M19%2011V12C19%2015.866%2015.866%2019%2012%2019C8.13401%2019%205%2015.866%205%2012V11%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M12%2019V22%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E";

const COMPOSER_RADIUS = 50;
const COMPOSER_COMPACT_HEIGHT = 49;
/** The recording scope sits in its own compartment above the field. */
const SCOPE_HEIGHT = 64;
const SCOPE_RADIUS = 26;
const COMPOSER_SEND = 31;
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
const THREAD_WIDTH = 650;
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
/**
 * The recording compartment hands over to the message: the scope plays its
 * "done" clear, the block fades, and only then does the field close the gap.
 * A plain flag, not a signal, so the effect that drives this subscribes to
 * the recording state alone and a fast second take can cancel the exit.
 */
const scopeShown = signal(false);
/** 0 while recording, 0..1 through the exit. */
const scopeExit = signal(0);
const SCOPE_EXIT_MS = 320;
/** Share of the exit spent fading; the height closes in the rest. */
const SCOPE_FADE_SHARE = 0.7;
let scopeMounted = false;
let scopeExitStep: ReturnType<typeof setTimeout> | null = null;

function stopScopeExit() {
  if (scopeExitStep) {
    clearTimeout(scopeExitStep);
    scopeExitStep = null;
  }
}

function runScopeExit() {
  stopScopeExit();
  const started = Date.now();
  const step = () => {
    const progress = Math.min(1, (Date.now() - started) / SCOPE_EXIT_MS);
    scopeExit.set(progress);
    if (progress < 1) {
      scopeExitStep = setTimeout(step, 16);
      return;
    }
    scopeExitStep = null;
    scopeMounted = false;
    scopeShown.set(false);
    scopeExit.set(0);
  };
  step();
}

function scopeOpacity() {
  const progress = scopeExit();
  if (progress === 0) return 1;
  return Math.max(0, 1 - progress / SCOPE_FADE_SHARE);
}

function scopeHeight() {
  const progress = scopeExit();
  if (progress <= SCOPE_FADE_SHARE) return SCOPE_HEIGHT;
  const closing = (progress - SCOPE_FADE_SHARE) / (1 - SCOPE_FADE_SHARE);
  return SCOPE_HEIGHT * Math.max(0, 1 - closing);
}

export function markJournalArriving(id: string) {
  arrivingId.set(id);
}
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

/** 0:42, the way a voice message shows its length. */
export function formatVoiceDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

const VOICE_BAR_MIN = 3;
const VOICE_BAR_MAX = 20;

/**
 * One recorded bar's height. Peaks arrive on the recorder's decibel scale
 * (0..100), and the 0.55 curve lifts ordinary speech past the floor: a quiet
 * word at 20 still draws half the range.
 */
export function voiceBarHeight(peak: number) {
  const level = Math.pow(Math.max(0, Math.min(100, peak)) / 100, 0.55);
  return VOICE_BAR_MIN + Math.round(level * (VOICE_BAR_MAX - VOICE_BAR_MIN));
}

function VoiceBubble(props: {
  entry: JournalEntry;
  playing: boolean;
  colors: ThemeColors;
  onPlay(entry: JournalEntry): void;
}) {
  const voice = props.entry.voice!;
  return <View class="flex-row items-center" style={{ gap: 10, height: 26 }}>
    <View onPress={() => props.onPlay(props.entry)} role="button" accessibilityLabel={props.playing ? "Остановить голосовую запись" : "Прослушать голосовую запись"} accessibilityState={{ selected: props.playing }} class="shrink-0 items-center justify-center rounded-full" hoverStyle={{ opacity: 0.8 }} activeStyle={{ opacity: 0.6 }} style={{ width: 24, height: 24, backgroundColor: colorAlpha("#ffffff", 0.24), cursor: "pointer" }}>
      <Text class="text-[10px]" style={{ color: "#ffffff" }}>{props.playing ? "■" : "▶"}</Text>
    </View>
    <View class="flex-row items-center" style={{ gap: 2, height: VOICE_BAR_MAX }}>
      <Each of={voice.peaks}>{(peak) => <View style={{ width: 2, borderRadius: 1, backgroundColor: colorAlpha("#ffffff", 0.78), height: voiceBarHeight(peak()) }} />}</Each>
    </View>
    <Text class="text-[12px]" style={{ color: colorAlpha("#ffffff", 0.82), fontVariantNumeric: "tabular-nums" }}>{formatVoiceDuration(voice.durationMs)}</Text>
  </View>;
}

function JournalBubble(props: {
  entry: JournalEntry;
  arriving: boolean;
  colors: ThemeColors;
  dark: boolean;
  playing: boolean;
  onPlay(entry: JournalEntry): void;
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
  return <View onMouseEnter={() => showJournalDate(props.entry.id)} onMouseLeave={() => hideJournalDate(props.entry.id)} class="mb-1 w-full flex-row items-center justify-end">
    {journalDateShown() === props.entry.id && <Text class="mr-2 text-[11px]" style={{ color: props.colors.muted, pointerEvents: "none" }}>{formatJournalStamp(props.entry.createdAt)}</Text>}
    <View onContextMenu={openEntryMenu} class="max-w-[75%] px-3 py-2" style={{ backgroundColor: editingJournalId() === props.entry.id ? props.colors.card : journalBubble(props.colors.accent), borderRadius: BUBBLE_RADIUS, transformOrigin: "bottom right", ...(sendMotion?.style ?? {}) }}>
      {editingJournalId() === props.entry.id
        ? <View>
            <Input ref={(node) => { editFocus = node; }} autoFocus value={editingJournalText()} onChange={(e) => editingJournalText.set(e.value)} multiline={true} submitBehavior="newline" accessibilityLabel="Текст записи" class="min-h-[56px] w-full rounded-lg px-2 py-1 text-[15px]" style={{ color: props.colors.foreground, backgroundColor: props.colors.background }} />
            <View class="mt-2 flex-row justify-end" style={{ gap: 8 }}>
              <GhostButton label="Отмена" colors={props.colors} dark={props.dark} onPress={() => editingJournalId.set(null)} />
              <SolidButton label="Сохранить" background={props.colors.accent} foreground={props.colors.background} onPress={() => { props.onUpdate(props.entry.id, editingJournalText()); editingJournalId.set(null); }} />
            </View>
          </View>
        : props.entry.voice
        ? <VoiceBubble entry={props.entry} playing={props.playing} colors={props.colors} onPlay={props.onPlay} />
        : <Text onContextMenu={openEntryMenu} class="select-text text-[15px] leading-5" style={{ color: "#ffffff", fontWeight: 500, selectionColor: colorAlpha(props.colors.accent, props.dark ? 0.35 : 0.24) }}>{props.entry.text}</Text>}
    </View>
  </View>;
}

export function JournalPage(props: {
  entries: () => readonly JournalEntry[];
  colors: ThemeColors;
  onCreate(text: string, id: string): void;
  onUpdate(id: string, text: string): void;
  onDelete(id: string): void;
  recording: () => boolean;
  level: () => number;
  elapsed: () => number;
  playing: () => string | null;
  onStartRecording(): void;
  onStopRecording(): void;
  onPlayVoice(entry: JournalEntry): void;
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
  effect(() => {
    const recording = props.recording();
    if (recording) {
      stopScopeExit();
      scopeMounted = true;
      scopeExit.set(0);
      scopeShown.set(true);
      return;
    }
    if (!scopeMounted) return;
    runScopeExit();
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

  return <View onLayout={(e) => { pageWidth = e.bounds.size.width; }} onPress={claimJournalComposer} class="min-h-0 flex-1 flex-row overflow-hidden">
    <View class="relative min-w-0 flex-1 flex-col items-center">
      {props.nativeCalendarButton
        ? <NativeCalendarToggle expanded={journalCalendarOpen()} label={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} onPress={toggleJournalCalendar} accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} class="absolute right-4 z-10 h-8 w-8" style={{ top: props.titlebarInset + 16 }} />
        : props.titlebarInset === 0 && <View onPress={toggleJournalCalendar} role="button" accessibilityLabel={journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь"} accessibilityState={{ selected: journalCalendarOpen() }} class="absolute z-10 items-center justify-center" hoverStyle={{ backgroundColor: surfaceWash(props.dark, 0.11) }} style={{ top: 16, right: 16, width: 28, height: 28, borderRadius: 6, cursor: "pointer", backgroundColor: journalCalendarOpen() ? surfaceWash(props.dark, 0.09) : "transparent" }}>
            <SharedIcon name="sidebar" size={16} color={journalCalendarOpen() ? props.colors.foreground : props.colors.muted} />
          </View>}
      <View class="relative min-h-0 w-full flex-1">
      <Scroll ref={(node) => { feedRef = node; }} onLayout={(e) => feedBox.set({ width: e.bounds.size.width, height: e.bounds.size.height })} contentStyle={{ flexGrow: 1 }} class="min-h-0 w-full flex-1 pb-4">
        <View onMouseLeave={leaveJournalDates} class="mx-auto justify-end" style={{ width: threadSpan(), minHeight: feedBox().height, paddingTop: props.titlebarInset + 16, paddingLeft: FEED_PAD, paddingRight: FEED_PAD }}>
        <Each of={groups()} key={((group: { key: string }) => group.key) as any}>{(group) => <View onLayout={(e) => { dayOffsets.set(group().key, e.bounds.origin.y); }} class="mb-4">
          <Text class="mb-3 text-center text-[12px]" style={{ color: props.colors.muted }}>{formatJournalDay(group())}</Text>
          <Each of={group().entries} key={((entry: JournalEntry) => entry.id) as any}>{(entry) => <JournalBubble entry={entry()} arriving={arrivingId() === entry().id} colors={props.colors} dark={props.dark} playing={props.playing() === entry().id} onPlay={props.onPlayVoice} onUpdate={props.onUpdate} onDelete={props.onDelete} />}</Each>
        </View>}</Each>
        {groups().length === 0 && <View class="flex-1 items-center justify-center py-12"><Text class="text-[13px]" style={{ color: props.colors.muted }}>Записей пока нет</Text></View>}
        </View>
      </Scroll>
      <View class="absolute right-0 top-0 bottom-0 w-[8px]" style={{ backgroundColor: props.colors.background, opacity: 0.86, pointerEvents: "none" }} />
      </View>
      <View class="mx-auto w-full" style={{ maxWidth: THREAD_WIDTH, paddingLeft: FEED_PAD, paddingRight: FEED_PAD, marginBottom: 18 }}>
        <View class="w-full overflow-hidden border" style={{ borderRadius: scopeShown() ? SCOPE_RADIUS : COMPOSER_RADIUS, borderColor: props.colors.border, backgroundColor: props.colors.card }}>
        {scopeShown() && <View class="relative w-full overflow-hidden" style={{ height: scopeHeight(), opacity: scopeOpacity() }}>
          <View class="absolute left-0 right-0 top-0 bottom-0">
            <DotScope level={props.level()} active={props.recording()} done={!props.recording()} style={{ width: "100%", height: "100%" }} />
          </View>
        </View>}
        {scopeShown() && <View class="w-full" style={{ height: scopeHeight() > 0.5 ? 1 : 0, backgroundColor: props.colors.border }} />}
        <View class="w-full flex-row" style={{ height: composerPillHeight(), alignItems: composerExpanded() ? "flex-end" : "center", backgroundColor: "transparent" }}>
          {!props.recording() && <View class="relative min-w-0 flex-1 overflow-hidden" style={{ height: composerViewportHeight() }}>
            <Scroll ref={(node) => { composerScrollRef = node; }} scrollbar={false} onScroll={(event) => journalScrollY.set(event.offset.y)} class="w-full" style={{ height: composerViewportHeight() }}>
              <View class="relative w-full" style={{ height: composerInputHeight() }}>
                <Input ref={(node) => { composerRef = node; }} autoFocus value={journalDraft()} onChange={(e) => journalDraft.set(e.value)} onContentSizeChange={({ size }) => { const raw = Math.max(COMPOSER_LINE, Math.round(size.height)); if (raw === journalDraftContentHeight()) return; if (clampDraftHeight(raw) !== clampDraftHeight(journalDraftContentHeight())) animateComposer(); journalDraftContentHeight.set(raw); revealComposer(journalCaret()); }} onCaretMove={(event) => { placeCaret(event.bounds); revealComposer(journalCaret()); }} onSelectionChange={(range) => journalSelection.set(range)} onFocus={() => journalFocused.set(true)} onBlur={() => journalFocused.set(false)} onSubmit={(event) => send(event.text)} multiline={true} submitBehavior="submit" caret={false} placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="min-w-0 w-full text-[15px]" style={{ height: composerInputHeight(), fontSize: 15, lineHeight: COMPOSER_LINE, paddingLeft: COMPOSER_PAD_X, paddingRight: 8, paddingTop: COMPOSER_PAD_Y, paddingBottom: COMPOSER_PAD_Y, placeholderColor: props.colors.muted, selectionColor: colorAlpha(props.colors.accent, props.dark ? 0.35 : 0.24), backgroundColor: "transparent", color: props.colors.foreground }} />
                <View class="absolute" style={{ pointerEvents: "none", left: journalCaret().x, top: journalCaret().y, width: CARET_WIDTH, height: journalCaret().height, backgroundColor: props.colors.accent, opacity: composerCaretShown() ? 1 : 0, zIndex: 1 }} />
              </View>
            </Scroll>
            {composerFadeTop() && <View class="absolute left-0 right-0 top-0" style={{ pointerEvents: "none", height: COMPOSER_FADE, backgroundImage: `linear-gradient(to bottom, ${props.colors.card}, ${colorAlpha(props.colors.card, 0)})`, zIndex: 2 }} />}
            {composerFadeBottom() && <View class="absolute left-0 right-0 bottom-0" style={{ pointerEvents: "none", height: COMPOSER_FADE, backgroundImage: `linear-gradient(to bottom, ${colorAlpha(props.colors.card, 0)}, ${props.colors.card})`, zIndex: 2 }} />}

          </View>}
          {props.recording() && <View class="min-w-0 flex-1 flex-row items-center" style={{ paddingLeft: COMPOSER_PAD_X, gap: 8 }}>
            <View class="shrink-0 rounded-full" style={{ width: 8, height: 8, backgroundColor: "#ff453a" }} />
            <Text class="text-[13px]" style={{ color: props.colors.foreground, fontVariantNumeric: "tabular-nums" }}>{formatVoiceDuration(props.elapsed())}</Text>
          </View>}
          {journalDraft().trim()
            ? <View onPress={() => send(journalDraft())} role="button" accessibilityLabel="Отправить запись" class="shrink-0 items-center justify-center rounded-full" hoverStyle={{ opacity: journalDraft().trim() ? 0.85 : 0.35 }} activeStyle={{ opacity: journalDraft().trim() ? 0.7 : 0.35 }} style={{ width: COMPOSER_SEND, height: COMPOSER_SEND, marginRight: 8, marginBottom: composerExpanded() ? 10 : 0, backgroundColor: journalBubble(props.colors.accent), opacity: journalDraft().trim() ? 1 : 0.35, cursor: journalDraft().trim() ? "pointer" : "default" }}>
            <Text class="text-[14px] font-semibold" style={{ color: accentMark(journalBubble(props.colors.accent)) }}>↑</Text>
          </View>
            : props.recording()
            ? <View onPress={() => { animateComposer(); props.onStopRecording(); }} role="button" accessibilityLabel="Остановить запись" accessibilityState={{ selected: true }} class="shrink-0 items-center justify-center rounded-full" hoverStyle={{ opacity: 0.85 }} activeStyle={{ opacity: 0.7 }} style={{ width: COMPOSER_SEND, height: COMPOSER_SEND, marginRight: 8, marginBottom: composerExpanded() ? 10 : 0, backgroundColor: "#ff453a", cursor: "pointer" }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#ffffff" }} />
              </View>
            : <View onPress={() => { animateComposer(); props.onStartRecording(); }} role="button" accessibilityLabel="Записать голос" class="shrink-0 items-center justify-center rounded-full" hoverStyle={{ opacity: 0.85 }} activeStyle={{ opacity: 0.7 }} style={{ width: COMPOSER_SEND, height: COMPOSER_SEND, marginRight: 8, marginBottom: composerExpanded() ? 10 : 0, backgroundColor: journalBubble(props.colors.accent), cursor: "pointer" }}>
                <Image src={MIC_ICON} style={{ width: 17, height: 17, tintColor: accentMark(journalBubble(props.colors.accent)) }} />
              </View>}
        </View>
        </View>
      </View>
    </View>
    <View class="relative h-full shrink-0 overflow-hidden" style={{ width: journalCalendarOpen() ? journalCalendarWidth() : 0 }}>
      <View class="h-full border-l" style={{ width: journalCalendarWidth(), paddingTop: props.titlebarInset, backgroundColor: surfaceWash(props.dark), borderColor: journalCalendarResizeHovered() || journalCalendarResizeActive() ? props.colors.muted : props.colors.border, transitionProperty: "borderColor", transitionDuration: 150, transitionTimingFunction: "ease-out" }}>
        <JournalCalendar width={journalCalendarWidth()} framed={false} resizeHovered={false} groups={groups()} colors={props.colors} dark={props.dark} onSelect={jumpToDay} />
      </View>
      {journalCalendarOpen() && <View {...resizeCalendar.panHandlers} role="button" accessibilityLabel="Изменить ширину календаря" onMouseEnter={() => journalCalendarResizeHovered.set(true)} onMouseLeave={() => journalCalendarResizeHovered.set(false)} class="absolute top-0 bottom-0 z-10 w-5" style={{ left: -10, cursor: "col-resize" }} />}
    </View>
  </View>;
}

export function toggleJournalCalendar() {
  animatePanes();
  journalCalendarOpen.update((open) => !open);
}

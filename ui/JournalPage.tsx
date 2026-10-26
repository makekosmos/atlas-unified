import { effect, LayoutAnimation, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { Button as SharedButton, Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { JournalCalendar } from "./JournalCalendar";
import { buildJournalDays, closestJournalDay, formatJournalDay } from "./journal-model";
import type { JournalEntry } from "./state";

export const journalCalendarOpen = signal(false);
const journalDraft = signal("");
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
}) {
  let feedRef: { scrollTo: (options: { y?: number; animated?: boolean }) => void; scrollToEnd: (options?: { animated?: boolean }) => void } | undefined;
  const dayOffsets = new Map<string, number>();
  const groups = buildJournalDays(props.entries);
  effect(() => {
    const entries = props.entries;
    if (entries.length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
  });
  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    props.onCreate(value);
    journalDraft.set("");
  };
  const jumpToDay = (key: string) => {
    const target = closestJournalDay(groups, key);
    journalCalendarOpen.set(false);
    if (target?.kind === "dated") {
      const offset = dayOffsets.get(target.key);
      if (offset !== undefined) feedRef?.scrollTo({ y: Math.max(0, offset - 12), animated: true });
    }
  };

  return <View class="relative min-h-0 flex-1 flex-row">
    <View class="min-w-0 flex-1 flex-col items-center">
      <View class="relative min-h-0 w-full flex-1">
      <Scroll ref={(node) => { feedRef = node; }} class="min-h-0 w-full flex-1 py-4">
        <View class="mx-auto w-full max-w-[620px] px-5">
        {groups.map((group) => <View onLayout={(bounds) => { dayOffsets.set(group.key, bounds.origin.y); }} class="mb-5">
          <View class="mb-3 flex-row items-center justify-center"><View class="h-px flex-1" style={{ backgroundColor: props.colors.border }} /><Text class="mx-3 text-[12px] capitalize" style={{ color: props.colors.muted }}>{formatJournalDay(group)}</Text><View class="h-px flex-1" style={{ backgroundColor: props.colors.border }} /></View>
          {group.entries.map((entry) => <View class="mb-3 self-end w-full max-w-[560px] rounded-2xl px-4 py-3" style={{ backgroundColor: props.colors.card }}>
            {editingJournalId() === entry.id
              ? <View>
                  <Input value={editingJournalText()} onChange={(value) => editingJournalText.set(value)} multiline={true} submitBehavior="newline" class="min-h-[56px] w-full rounded-lg px-2 py-1 text-[13px]" style={{ color: props.colors.foreground, backgroundColor: props.colors.background }} />
                  <View class="mt-2 flex-row justify-end gap-2">
                    <SharedButton label="Отмена" colors={props.colors} onPress={() => editingJournalId.set(null)} />
                    <SharedButton label="Сохранить" colors={props.colors} onPress={() => { props.onUpdate(entry.id, editingJournalText()); editingJournalId.set(null); }} selected />
                  </View>
                </View>
              : <View class="gap-0.5">{entry.text.split("\n").map((line) => <Text class="text-[14px] leading-6" style={{ color: props.colors.foreground }}>{line || " "}</Text>)}</View>}
            <View class="mt-2 flex-row items-center justify-end gap-3">
              <Text class="text-[10px]" style={{ color: props.colors.muted }}>{timeLabel(entry.createdAt)}</Text>
              {editingJournalId() !== entry.id && <View class="flex-row gap-3">
                <View onPress={() => { editingJournalId.set(entry.id); editingJournalText.set(entry.text); }} role="button" accessibilityLabel="Изменить запись"><Text class="text-[11px]" style={{ color: props.colors.muted }}>Изменить</Text></View>
                <View onPress={() => props.onDelete(entry.id)} role="button" accessibilityLabel="Удалить запись"><Text class="text-[11px]" style={{ color: props.colors.muted }}>Удалить</Text></View>
              </View>}
            </View>
          </View>)}
        </View>)}
        {groups.length === 0 && <View class="flex-1 items-center justify-center py-12"><Text class="text-[13px]" style={{ color: props.colors.muted }}>Записей пока нет</Text></View>}
        </View>
      </Scroll>
      <View pointerEvents="none" class="absolute right-0 top-0 bottom-0 w-[8px]" style={{ backgroundColor: props.colors.background, opacity: 0.68 }} />
      </View>
      <View class="mb-4 w-full max-w-[960px] flex-row items-center gap-2 rounded-full border px-2 py-2" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border }}>
        <View class="h-9 w-9 shrink-0 items-center justify-center rounded-full border" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border }}>
          <SharedIcon name="plus" size={19} color={props.colors.muted} />
        </View>
        <Input value={journalDraft()} onChange={(value) => journalDraft.set(value)} onSubmit={(event) => send(event.text)} multiline={true} submitBehavior="submit" placeholder="Запись в дневник…" accessibilityLabel="Новая запись в дневник" class="max-h-[150px] min-h-[38px] flex-1 px-2 py-2 text-[14px]" style={{ backgroundColor: "transparent", color: props.colors.foreground }} />
        <View onPress={() => send(journalDraft())} role="button" accessibilityLabel="Отправить запись" class="h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#00a86b" }}>
          <Text class="text-[20px] font-semibold" style={{ color: "#ffffff" }}>↑</Text>
        </View>
      </View>
    </View>
    {journalCalendarOpen() && <View class="absolute right-0 top-0 bottom-0 z-10"><JournalCalendar groups={groups} colors={props.colors} onSelect={jumpToDay} /></View>}
  </View>;
}

export function toggleJournalCalendar() {
  LayoutAnimation.easeInEaseOut();
  journalCalendarOpen.update((open) => !open);
}

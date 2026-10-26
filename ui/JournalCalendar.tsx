import { Text, View } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { buildCalendarWeeks, formatCalendarMonth } from "./journal-model";
import type { JournalDayGroup } from "./journal-model";

const weekdays = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function JournalCalendarIcon(props: { color: string }) {
  return <View class="h-[15px] w-[15px] overflow-hidden rounded-[4px] border" style={{ borderColor: props.color }}>
    <View class="h-[4px] border-b" style={{ borderColor: props.color }} />
    <View class="flex-1 flex-row items-center justify-center gap-[2px]">
      <View class="h-[2px] w-[2px] rounded-full" style={{ backgroundColor: props.color }} />
      <View class="h-[2px] w-[2px] rounded-full" style={{ backgroundColor: props.color }} />
    </View>
  </View>;
}

export function JournalCalendar(props: {
  month: Date;
  groups: readonly JournalDayGroup[];
  colors: ThemeColors;
  onMonthChange(month: Date): void;
  onSelect(dayKey: string): void;
}) {
  const weeks = buildCalendarWeeks(props.month, props.groups);
  const shiftMonth = (amount: number) => props.onMonthChange(new Date(props.month.getFullYear(), props.month.getMonth() + amount, 1));
  return <View class="w-[300px] shrink-0 border-l px-4 pt-4" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border }}>
    <View class="mb-5 flex-row items-center justify-between">
      <Text class="text-[14px] font-semibold" style={{ color: props.colors.foreground }}>Календарь дневника</Text>
      <View class="flex-row gap-1">
        <View onPress={() => shiftMonth(-1)} role="button" accessibilityLabel="Предыдущий месяц" class="h-8 w-8 items-center justify-center rounded-full"><Text class="text-[20px]" style={{ color: props.colors.foreground }}>‹</Text></View>
        <View onPress={() => shiftMonth(1)} role="button" accessibilityLabel="Следующий месяц" class="h-8 w-8 items-center justify-center rounded-full"><Text class="text-[20px]" style={{ color: props.colors.foreground }}>›</Text></View>
      </View>
    </View>
    <View class="mb-3 flex-row items-center justify-between">
      <Text class="text-[13px] capitalize" style={{ color: props.colors.foreground }}>{formatCalendarMonth(props.month)}</Text>
    </View>
    <View class="flex-row">
      {weekdays.map((day) => <View class="h-8 flex-1 items-center justify-center"><Text class="text-[10px]" style={{ color: props.colors.muted }}>{day}</Text></View>)}
    </View>
    <View class="gap-1">
      {weeks.map((week) => <View class="flex-row">
        {week.map((cell) => cell
          ? <View onPress={() => props.onSelect(cell.key)} role="button" accessibilityLabel={`${cell.day} ${formatCalendarMonth(props.month)}, ${cell.entryCount} записей`} class="h-9 flex-1 items-center justify-center rounded-lg">
              <Text class="text-[12px]" style={{ color: cell.entryCount ? props.colors.foreground : props.colors.muted }}>{cell.day}</Text>
              {cell.entryCount > 0 && <View class="mt-0.5 h-1 w-1 rounded-full" style={{ backgroundColor: props.colors.accent }} />}
            </View>
          : <View class="h-9 flex-1" />)}
      </View>)}
    </View>
    <Text class="mt-5 text-[11px] leading-5" style={{ color: props.colors.muted }}>Точки отмечают дни с записями. Выбор любой даты переместит к ближайшей записи.</Text>
  </View>;
}

import { Scroll, Text, View } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { hoverWash } from "./chrome";
import { buildCalendarDays } from "./journal-model";
import type { JournalDayGroup } from "./journal-model";

const weekdays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

export function JournalCalendar(props: {
  width: number;
  resizeHovered: boolean;
  framed: boolean;
  dark: boolean;
  groups: readonly JournalDayGroup[];
  colors: ThemeColors;
  onSelect(dayKey: string): void;
}) {
  const days = buildCalendarDays(props.groups);
  const today = new Date();
  return <View class={props.framed ? "h-full border-l" : "h-full"} style={{ width: props.width, backgroundColor: props.framed ? props.colors.card : "transparent", borderColor: props.resizeHovered ? props.colors.muted : props.colors.border, transitionProperty: "borderColor", transitionDuration: 150, transitionTimingFunction: "ease-out" }}>
    <Scroll class="min-h-0 flex-1 px-3 pb-4">
      {days.map((day) => <View>
        {day.period && <Text class="pt-3 pb-1 pl-1 text-[10px] capitalize" style={{ color: props.colors.muted }}>{day.period}</Text>}
        <View onPress={() => props.onSelect(day.key)} role="button" accessibilityLabel={`${day.date.getDate()} ${months[day.date.getMonth()]}, ${day.count} записей`} class="flex-row items-center justify-end gap-2" hoverStyle={{ backgroundColor: hoverWash(props.dark) }} style={{ height: 24, paddingLeft: 8, paddingRight: 8, borderRadius: 8, cursor: "pointer" }}>
          <View class="max-w-[86px] flex-row flex-wrap justify-end gap-[3px]">
            {Array.from({ length: Math.min(day.count, 24) }, () => <View class="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.muted }} />)}
          </View>
          <View class="h-px w-5" style={{ backgroundColor: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.border }} />
          <Text class="w-5 text-right text-[10px]" style={{ color: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.muted }}>{weekdays[day.date.getDay()]}</Text>
          <Text class="w-5 text-right text-[11px]" style={{ color: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.foreground }}>{day.date.getDate()}</Text>
        </View>
      </View>)}
    </Scroll>
  </View>;
}

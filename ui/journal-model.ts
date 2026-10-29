import type { JournalEntry } from "./state";

export type JournalDayGroup =
  | { kind: "dated"; key: string; date: Date; entries: JournalEntry[] }
  | { kind: "invalid"; key: string; label: string; entries: JournalEntry[] };

const monthNamesInDate = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const monthNamesShort = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const weekdays = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildJournalDays(entries: readonly JournalEntry[]): JournalDayGroup[] {
  const groups = new Map<string, JournalDayGroup>();
  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    if (Number.isNaN(date.valueOf())) {
      const key = `invalid:${entry.createdAt}`;
      const group = groups.get(key);
      if (group) group.entries.push(entry);
      else groups.set(key, { kind: "invalid", key, label: entry.createdAt, entries: [entry] });
      continue;
    }
    const key = localDayKey(date);
    const group = groups.get(key);
    if (group) group.entries.push(entry);
    else groups.set(key, { kind: "dated", key, date, entries: [entry] });
  }
  return [...groups.values()];
}

export function formatJournalDay(group: JournalDayGroup, now = new Date()) {
  if (group.kind === "invalid") return group.label;
  if (localDayKey(group.date) === localDayKey(now)) return "Сегодня";
  const year = group.date.getFullYear() === now.getFullYear() ? "" : ` ${group.date.getFullYear()}`;
  return `${weekdays[group.date.getDay()]}, ${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
}

export type CalendarDay = { key: string; date: Date; count: number; period: string };

export function buildCalendarDays(groups: readonly JournalDayGroup[], now = new Date()): CalendarDay[] {
  const counts = new Map(groups.flatMap((group) => group.kind === "dated" ? [[group.key, group.entries.length] as const] : []));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dated = groups.filter((group) => group.kind === "dated");
  const oldest = dated.reduce((date, group) => group.kind === "dated" && group.date < date ? group.date : date, today);
  const start = dated.length ? new Date(oldest.getFullYear(), oldest.getMonth(), oldest.getDate() - 40) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 40);
  const days: CalendarDay[] = [];
  for (const date = today; date >= start; date.setDate(date.getDate() - 1)) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const key = localDayKey(day);
    const weekLabel = day.getDay() === 0 || day.valueOf() === today.valueOf();
    const period = weekLabel ? `${monthNamesShort[day.getMonth()]} ${day.getFullYear()}` : "";
    days.push({ key, date: day, count: counts.get(key) ?? 0, period });
  }
  return days;
}

export function closestJournalDay(groups: readonly JournalDayGroup[], key: string): JournalDayGroup | undefined {
  const [year, month, day] = key.split("-").map(Number);
  const target = new Date(year, month - 1, day, 12).valueOf();
  return groups.reduce<JournalDayGroup | undefined>((closest, group) => {
    if (group.kind !== "dated") return closest;
    if (!closest || closest.kind !== "dated") return group;
    const distance = Math.abs(group.date.valueOf() - target);
    return distance < Math.abs(closest.date.valueOf() - target) ? group : closest;
  }, undefined);
}

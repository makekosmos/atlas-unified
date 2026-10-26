import type { JournalEntry } from "./state";

export type JournalDayGroup =
  | { kind: "dated"; key: string; date: Date; entries: JournalEntry[] }
  | { kind: "invalid"; key: string; label: string; entries: JournalEntry[] };

export type CalendarCell = { key: string; day: number; entryCount: number } | null;
const monthNames = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const monthNamesInDate = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

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
  const year = group.date.getFullYear() === now.getFullYear() ? "" : ` ${group.date.getFullYear()}`;
  return `${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
}

export function formatCalendarMonth(month: Date) {
  return `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
}

export function buildCalendarWeeks(month: Date, groups: readonly JournalDayGroup[]): CalendarCell[][] {
  const counts = new Map(groups.flatMap((group) => group.kind === "dated" ? [[group.key, group.entries.length] as const] : []));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: CalendarCell[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= dayCount; day += 1) {
    const key = localDayKey(new Date(year, monthIndex, day, 12));
    cells.push({ key, day, entryCount: counts.get(key) ?? 0 });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
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

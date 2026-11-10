import type { JournalEntry } from "./state";

export type JournalDayGroup =
  | { kind: "dated"; key: string; date: Date; entries: JournalEntry[] }
  | { kind: "invalid"; key: string; label: string; entries: JournalEntry[] };

const monthNamesInDate = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
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
  for (const group of groups.values()) group.entries.sort((a, b) => entryTime(a) - entryTime(b));
  return [...groups.values()].sort((a, b) => groupTime(a) - groupTime(b));
}

function entryTime(entry: JournalEntry) {
  const time = new Date(entry.createdAt).valueOf();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function groupTime(group: JournalDayGroup) {
  return group.kind === "dated" ? group.date.valueOf() : Number.POSITIVE_INFINITY;
}

export function formatJournalDay(group: JournalDayGroup, now = new Date()) {
  if (group.kind === "invalid") return group.label;
  const year = group.date.getFullYear() === now.getFullYear() ? "" : ` ${group.date.getFullYear()}`;
  return `${weekdays[group.date.getDay()]}, ${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
}

export function formatJournalStamp(createdAt: string, _now = new Date()) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.valueOf())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}


import { expect, open, test } from "nsh/test";
import { SIDEBAR_MOTION_MS, SIDEBAR_WIDTH, animateSidebar, drawsCaptionButtons, navInk, sidebarFrame, sidebarWidthAt, titlebarControlTop } from "./chrome";
import { composerFadeEdges, journalDateDelay } from "./JournalPage";
import { buildCalendarDays, buildJournalDays, closestJournalDay, formatJournalDay, formatJournalStamp } from "./journal-model";
import { fallback, resolveAppearanceColors } from "./state";
import { journalBubble } from "./themes";

test("shows the shared Atlas navigation and journal composer", async () => {
  const app = await open("./App.tsx");
  expect(app.texts()).toContain("Дневник");
  expect(app.texts()).toContain("Задачи");
  expect(app.texts()).toContain("Настройки");
  expect(app.texts()).not.toContain("О приложении");
  expect(app.texts()).toContain("Записей пока нет");
  expect(app.texts()).not.toContain("Входящие");
  expect(app.texts()).not.toContain("Эта неделя");
  expect(app.texts()).not.toContain("Быстрый поиск");
});

test("groups journal bubbles by date and omits the current year", () => {
  const entry = (id: string, createdAt: string) => ({ id, text: id, createdAt });
  const groups = buildJournalDays([
    entry("one", new Date(2025, 11, 23, 9).toISOString()),
    entry("two", new Date(2025, 11, 23, 11).toISOString()),
    entry("three", new Date(2024, 8, 17, 8).toISOString()),
  ]);
  expect(groups.length).toEqual(2);
  expect(groups[0].entries.length).toEqual(1);
  expect(groups[1].entries.map((entry) => entry.id).join(",")).toEqual("one,two");
  expect(formatJournalDay(groups[0], new Date(2025, 11, 31))).toEqual("вторник, 17 сентября 2024");
  expect(formatJournalDay(groups[1], new Date(2025, 11, 31))).toEqual("вторник, 23 декабря");
});

test("shows recent journal days in reverse chronological order with entry counts", () => {
  const groups = buildJournalDays([{ id: "one", text: "запись", createdAt: new Date(2025, 11, 23, 9).toISOString() }]);
  const days = buildCalendarDays(groups, new Date(2025, 11, 24, 12));
  expect(days[0].key).toEqual("2025-12-24");
  expect(days[1].key).toEqual("2025-12-23");
  expect(days[1].count).toEqual(1);
});

test("chooses the closest dated group for an empty calendar day", () => {
  const groups = buildJournalDays([
    { id: "before", text: "до", createdAt: new Date(2025, 11, 23, 9).toISOString() },
    { id: "after", text: "после", createdAt: new Date(2025, 11, 27, 9).toISOString() },
  ]);
  expect(closestJournalDay(groups, "2025-12-26")?.key).toEqual("2025-12-27");
});

test("keeps macOS traffic lights and leaves page names out of the titlebar", async () => {
  const app = await open("./App.tsx", { platform: "macos", width: 1200, height: 800 });
  expect(app.texts()).toContain("Дневник");
  expect(app.texts()).not.toContain("Свернуть окно");
  expect(app.texts()).not.toContain("Развернуть окно");
  expect(app.texts()).not.toContain("Закрыть окно");
  expect(app.texts().filter((text) => text === "Дневник").length).toEqual(1);
});

test("centers titlebar controls on the same line as the traffic lights", () => {
  expect(titlebarControlTop(24)).toEqual(9);
  expect(titlebarControlTop(28)).toEqual(7);
});

test("draws caption buttons on Windows and Linux only when the system reserves none", () => {
  expect(drawsCaptionButtons("macos", 0)).toEqual(false);
  expect(drawsCaptionButtons("windows", 0)).toEqual(true);
  expect(drawsCaptionButtons("linux", 0)).toEqual(true);
  expect(drawsCaptionButtons("windows", 108)).toEqual(false);
});

test("opens the journal timeline and closes it from the titlebar control", async () => {
  const app = await open("./App.tsx", { width: 1100, clock: { time: new Date(2026, 9, 26) } });
  await app.press("Показать календарь");
  expect(app.texts()).toContain("Окт 2026");
  await app.press("Скрыть календарь");
  expect(app.texts()).not.toContain("Окт 2026");
});

test("formats a journal stamp and waits only before the first hover", () => {
  expect(formatJournalStamp("not-a-date")).toEqual("");
  expect(formatJournalStamp(new Date(2025, 11, 23, 9, 5).toISOString(), new Date(2025, 11, 31))).toEqual("09:05");
  expect(formatJournalStamp(new Date(2024, 8, 17, 8, 0).toISOString(), new Date(2025, 11, 31))).toEqual("08:00");
  expect(journalDateDelay(false)).toEqual(2000);
  expect(journalDateDelay(true)).toEqual(0);
});

test("shows the journal date to the left after a hover", async () => {
  const app = await open("./App.tsx", { platform: "macos", width: 1100, height: 800, clock: { time: new Date(2026, 9, 28, 14, 5) } });
  await app.type("Новая запись в дневник", "первая");
  await app.press("Отправить запись");
  await app.clock.fastForward(60_000);
  await app.type("Новая запись в дневник", "вторая");
  await app.press("Отправить запись");
  expect(app.texts()).toContain("среда, 28 октября");
  expect(app.texts()).not.toContain("14:05");
  await app.hover("первая");
  if (!app.texts().includes("14:05")) await app.wait(2000);
  expect(app.texts()).toContain("14:05");
  expect(app.texts()).not.toContain("14:06");
  await app.hover("вторая");
  expect(app.texts()).toContain("14:06");
  expect(app.texts()).not.toContain("14:05");
});

test("dims the composer edges only where lines are still hidden", () => {
  expect(composerFadeEdges(80, 80, 0)).toEqual({ top: false, bottom: false });
  expect(composerFadeEdges(200, 120, 0)).toEqual({ top: false, bottom: true });
  expect(composerFadeEdges(200, 120, 40)).toEqual({ top: true, bottom: true });
  expect(composerFadeEdges(200, 120, 80)).toEqual({ top: true, bottom: false });
});

test("types into the journal composer from the keyboard", async () => {
  const app = await open("./App.tsx");
  await app.keyboard.press("a");
  expect(app.value("Новая запись в дневник")).toEqual("a");
  await app.press("Задачи");
  await app.press("Дневник");
  await app.keyboard.press("b");
  expect(app.value("Новая запись в дневник")).toEqual("ab");
});

test("leaves the composer while a journal entry is being edited", async () => {
  const app = await open("./App.tsx", { platform: "macos" });
  await app.type("Новая запись в дневник", "текст");
  await app.press("Отправить запись");
  await app.rightClick("текст");
  await app.chooseMenuItem("Изменить");
  await app.keyboard.press("q");
  expect(app.value("Текст записи")).toContain("q");
  expect(app.value("Новая запись в дневник")).toEqual("");
  await app.press("Сохранить");
  await app.keyboard.press("w");
  expect(app.value("Новая запись в дневник")).toEqual("w");
});

test("submits on Enter and accepts multiline text", async () => {
  const app = await open("./App.tsx");
  await app.type("Новая запись в дневник", "первая строка");
  await app.type("Новая запись в дневник", "\nвторая строка");
  await app.type("Новая запись в дневник", "\nтретья строка");
  expect(app.value("Новая запись в дневник")).toEqual("первая строка\nвторая строка\nтретья строка");
  await app.keyboard.press("enter");
  expect(app.value("Новая запись в дневник")).toEqual("");
  expect(app.texts()).toContain("первая строка\nвторая строка\nтретья строка");
});

test("edits and deletes a journal entry from its context menu", async () => {
  const app = await open("./App.tsx", { platform: "macos" });
  await app.type("Новая запись в дневник", "текст меню");
  await app.press("Отправить запись");
  expect(app.texts()).not.toContain("Изменить");
  expect(app.texts()).not.toContain("Удалить");
  await app.rightClick("текст меню");
  expect(app.menu()?.map((item) => item.label).join(",")).toEqual("Копировать,Изменить,Удалить");
  await app.chooseMenuItem("Копировать");
  expect(app.clipboard()).toContain("текст меню");
  await app.rightClick("текст меню");
  await app.chooseMenuItem("Изменить");
  await app.clear("Текст записи");
  await app.type("Текст записи", "новый текст");
  await app.press("Сохранить");
  expect(app.texts()).toContain("новый текст");
  await app.rightClick("новый текст");
  await app.chooseMenuItem("Удалить");
  expect(app.texts()).not.toContain("новый текст");
});

test("sends a journal entry from the composer button without the engine", async () => {
  const app = await open("./App.tsx");
  await app.type("Новая запись в дневник", "текст кнопкой");
  await app.press("Отправить запись");
  expect(app.value("Новая запись в дневник")).toEqual("");
  expect(app.texts()).toContain("текст кнопкой");
});

test("keeps preview journal entries without the engine", async () => {
  const app = await open("./App.tsx");
  await app.type("Новая запись в дневник", "локальная запись");
  await app.press("Отправить запись");
  await app.waitUntil(() => app.storage()["mundus.atlas.preview.v1"]?.includes("локальная запись") === true);
});

test("adds a task in preview without the engine", async () => {
  const app = await open("./App.tsx");
  await app.press("Задачи");
  await app.press("Новая задача");
  await app.type("Название задачи", "купить хлеб");
  await app.press("Добавить");
  expect(app.texts()).toContain("купить хлеб");
  await app.waitUntil(() => app.storage()["mundus.atlas.preview.v1"]?.includes("купить хлеб") === true);
});
test("routes to the all-tasks screen", async () => {
  const app = await open("./App.tsx");
  await app.press("Задачи");
  expect(app.texts()).toContain("Задач пока нет");
});

test("closes the journal calendar and its toggle outside the journal", async () => {
  const app = await open("./App.tsx");
  await app.press("Показать календарь");
  expect(app.texts()).toContain("Окт 2026");
  await app.press("Задачи");
  expect(app.texts()).not.toContain("Окт 2026");
  expect(app.texts()).not.toContain("Показать календарь");
});

test("keeps appearance settings and configurable keyboard shortcuts", async () => {
  const app = await open("./App.tsx", { platform: "macos", width: 1200, height: 800 });
  await app.press("Настройки");
  expect(app.texts()).toContain("Размер текста");
  expect(app.texts()).not.toContain("Светлая тема");
  expect(app.texts()).toContain("Акцент");
  expect(app.texts()).toContain("Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.");
  await app.press("Акцент Красный");
  await app.press("Светлая");
  await app.press("Изменить сочетание: Боковая панель — открыть/скрыть");
  await app.waitUntil(() => app.storage()["mundus.atlas.shortcuts.v1"]?.includes("mod+shift+b") === true);
});

test("keeps every sidebar row on the same ink", () => {
  const colors = { foreground: "#e7e5ea", muted: "#8d8a94" };
  expect(navInk(true, false, colors)).toEqual("#e7e5ea");
  expect(navInk(false, false, colors)).toEqual("#e7e5ea");
  expect(navInk(false, true, colors)).toEqual("#e7e5ea");
});

test("one theme keeps Apple accents saturated in both modes", () => {
  expect(fallback.themes.map((theme) => theme.key).join(",")).toEqual("default");
  const appearance = fallback.appearance;
  if (!appearance) throw new Error("fallback appearance");
  const dark = resolveAppearanceColors(appearance, fallback.themes, fallback.colors);
  const light = resolveAppearanceColors({ ...appearance, settings: { ...appearance.settings, mode: "light" } }, fallback.themes, fallback.colors);
  expect(dark.background).toEqual("#0d0c10");
  expect(light.background).toEqual("#f8f7f9");
  expect(dark.accent).toEqual("#1784fc");
  expect(light.accent).toEqual("#1e86fc");
  const red = { ...appearance, settings: { ...appearance.settings, accent_source: "custom" as const, accent_color: "#e74347" } };
  expect(resolveAppearanceColors(red, fallback.themes, fallback.colors).accent).toEqual("#fc2d3e");
  expect(resolveAppearanceColors({ ...red, settings: { ...red.settings, mode: "light" } }, fallback.themes, fallback.colors).accent).toEqual("#fb2c3f");
  const green = { ...appearance, settings: { ...appearance.settings, accent_source: "custom" as const, accent_color: "#59be77" } };
  const greenDark = resolveAppearanceColors(green, fallback.themes, fallback.colors).accent;
  expect(greenDark).toEqual("#13c370");
  expect(journalBubble(greenDark)).toEqual("#169f5c");
  expect(journalBubble(resolveAppearanceColors({ ...green, settings: { ...green.settings, mode: "light" } }, fallback.themes, fallback.colors).accent)).toEqual("#13c16f");
});

test("reverses the sidebar from wherever the width is", () => {
  expect(sidebarWidthAt(SIDEBAR_WIDTH, 0, 0)).toEqual(SIDEBAR_WIDTH);
  expect(sidebarWidthAt(SIDEBAR_WIDTH, 0, SIDEBAR_MOTION_MS)).toEqual(0);
  const mid = sidebarWidthAt(SIDEBAR_WIDTH, 0, SIDEBAR_MOTION_MS / 2);
  expect(mid).toBeGreaterThan(0);
  expect(mid).toBeLessThan(SIDEBAR_WIDTH);
  expect(sidebarWidthAt(mid, SIDEBAR_WIDTH, 0)).toEqual(mid);
  expect(sidebarWidthAt(mid, SIDEBAR_WIDTH, SIDEBAR_MOTION_MS)).toEqual(SIDEBAR_WIDTH);
  const started = 1_000;
  animateSidebar(false, started);
  const painted = sidebarFrame(started + SIDEBAR_MOTION_MS / 2);
  expect(painted).toEqual(mid);
  animateSidebar(true, started + SIDEBAR_MOTION_MS / 2);
  expect(sidebarFrame(started + SIDEBAR_MOTION_MS / 2)).toEqual(painted);
  expect(sidebarFrame(started + SIDEBAR_MOTION_MS / 2 + SIDEBAR_MOTION_MS)).toEqual(SIDEBAR_WIDTH);
});

test("toggles the sidebar from the keyboard without the engine", async () => {
  const app = await open("./App.tsx", { platform: "macos", width: 1200, height: 800 });
  expect(app.texts().filter((text) => text === "Дневник").length).toEqual(1);
  await app.keyboard.press("mod+b");
  expect(app.texts().filter((text) => text === "Дневник").length).toEqual(0);
  await app.keyboard.press("mod+b");
  expect(app.texts().filter((text) => text === "Дневник").length).toEqual(1);
});

test("keeps appearance controls usable in a narrow window", async () => {
  const app = await open("./App.tsx", { platform: "macos", width: 760, height: 700 });
  await app.press("Настройки");
  await app.press("Выбрать размер текста");
  await app.press("14 px");
  await app.waitUntil(() => app.texts().includes("14 px"));
});

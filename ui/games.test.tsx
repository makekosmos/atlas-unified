import { expect, open, test } from "nsh/test";
import { gameLibrary, visibleGameCards } from "./game-library";

const card = (id: string, title: string, exePath: string, hidden = false) => ({
  id, title, exePath, hidden, rating: null, note: "",
});

const candidate = (title: string, exePath: string, source = "steam") => ({ title, exePath, installDir: "D:\\Games", source });

test("filters hidden Engine cards by title or executable path", () => {
  const visible = visibleGameCards([
    card("hades", "Hades", "D:\\Games\\Hades.exe"),
    card("ori", "Ori and the Blind Forest", "D:\\Games\\Ori.exe"),
    card("hidden", "Hidden Game", "D:\\Games\\Hidden.exe", true),
  ], "d:\\games\\hades.exe");
  expect(visible.map((game) => game.id).join(",")).toEqual("hades");
  expect(visibleGameCards([card("hidden", "Hidden Game", "D:\\Hidden.exe", true)], "").length).toEqual(0);
});

test("reports provider progress and preserves partial discovery results", () => {
  gameLibrary.receiveDiscovery({ progress: { provider: "epic", phase: "scanning", completed: 1, total: 3, found: 2 } });
  expect(gameLibrary.scanProgress()?.provider).toEqual("epic");
  gameLibrary.receiveDiscovery({
    candidates: [candidate("Hades", "D:\\Games\\Hades.exe")],
    errors: [{ provider: "gog", message: "timeout" }],
  });
  expect(gameLibrary.scanState()).toEqual("ready");
  expect(gameLibrary.candidates().length).toEqual(1);
  expect(gameLibrary.scanWarning()).toContain("GOG: timeout");
});

test("shows a fatal error when legacy discovery also fails", () => {
  gameLibrary.receiveDiscovery({
    candidates: [],
    errors: [{ provider: "Engine", message: "games.discover_installed: invalid-request" }],
    fatal: true,
  });
  expect(gameLibrary.scanState()).toEqual("error");
  expect(gameLibrary.scanError()).toContain("Engine: games.discover_installed: invalid-request");
});

test("reviews what the search found one card at a time", () => {
  gameLibrary.receiveDiscovery({
    candidates: [
      candidate("Hades", "D:\\Games\\Hades.exe"),
      candidate("Ori", "D:\\Games\\Ori.exe"),
      candidate("Hollow Knight", "D:\\Games\\Hollow.exe"),
    ],
  });
  expect(gameLibrary.deck().length).toEqual(3);
  expect(gameLibrary.deckTotal()).toEqual(3);
  gameLibrary.decideDeck(true);
  expect(gameLibrary.deck().length).toEqual(2);
  expect(gameLibrary.deckAdded()).toEqual(1);
  gameLibrary.decideDeck(false);
  expect(gameLibrary.deck().length).toEqual(1);
  expect(gameLibrary.deckSkipped()).toEqual(1);
  gameLibrary.decideDeck(false);
  expect(gameLibrary.deck().length).toEqual(0);
  expect(gameLibrary.deckTotal()).toEqual(3);
});

test("keeps the search result on screen when every found game is already in the library", () => {
  gameLibrary.receiveLibrary([card("hades", "Hades", "D:\\Games\\Hades.exe")]);
  gameLibrary.receiveDiscovery({ candidates: [candidate("Hades", "D:\\Games\\Hades.exe")] });
  expect(gameLibrary.scanState()).toEqual("ready");
  expect(gameLibrary.candidates().length).toEqual(1);
  expect(gameLibrary.deck().length).toEqual(0);
  expect(gameLibrary.reviewDone()).toEqual(true);
});

test("closes the add dialog from the backdrop and stays open on presses inside", async () => {
  const app = await open("./widgets-on-fixture.tsx", { platform: "windows", width: 1100, height: 800 });
  await app.press("Игры");
  await app.press("Добавить игру");
  expect(app.texts()).toContain("Найти автоматически");
  await app.press("Найти автоматически");
  expect(app.texts()).toContain("Добавить игры");
  await app.press("Закрыть окно >> nth=0");
  expect(app.texts()).not.toContain("Добавить игры");
});

test("opens the add dialog with the three ways to add games and does not scan by itself", async () => {
  const app = await open("./widgets-on-fixture.tsx", { platform: "windows", width: 1100, height: 800 });
  await app.press("Игры");
  expect(app.texts()).not.toContain("Все");
  expect(app.texts()).not.toContain("Скрытые");
  expect(app.texts()).not.toContain("Найти игру…");

  await app.press("Добавить игру");
  expect(app.texts()).toContain("Добавить игры");
  expect(app.texts()).toContain("Найти автоматически");
  expect(app.texts()).toContain("Просканировать папку");
  expect(app.texts()).toContain("Выбрать exe");
  expect(app.texts()).not.toContain("Отмена");
  expect(app.texts()).not.toContain("Найти игру, папку или exe");
  expect(app.texts()).not.toContain("Проверяем Steam (1 из 3)…");
  expect(app.texts()).not.toContain("Steam · Epic Games · GOG");
});

test("shows ambiguous metadata candidates and lets the user choose one", () => {
  const sent: Array<{ name: string; args: unknown }> = [];
  gameLibrary.bindCommand((name, args) => sent.push({ name, args }));
  sent.length = 0;
  gameLibrary.receiveLibrary([card("hades", "Hades", "D:\\Games\\Hades.exe")]);
  gameLibrary.receiveMetadata({
    exePath: "D:\\Games\\Hades.exe",
    result: { status: "ambiguous", candidates: [
      { provider: "steam", providerId: "1", name: "Hades Remastered", headerImagePath: "C:\\cache\\1.jpg" },
      { provider: "steam", providerId: "2", name: "Hades Definitive Edition" },
    ] },
  });
  expect(gameLibrary.metadataChoices()?.candidates.length).toEqual(2);
  gameLibrary.chooseMetadata(gameLibrary.metadataChoices()!.candidates[1]);
  expect(sent[0].name).toEqual("games.metadata.choose");
  expect((sent[0].args as { providerId: string }).providerId).toEqual("2");
  expect(gameLibrary.metadataChoices()).toEqual(null);
});

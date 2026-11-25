import { expect, open, test } from "nsh/test";
import { titlebarControlTop } from "./chrome";

/// The bar's row of tabs: what a page or a note looks like up there, how wide
/// it is, and what its own menu offers. Split from `App.test.tsx` to keep both
/// files under the size gate.

test("keeps macOS traffic lights and names the open page in its tab", async () => {
  const app = await open("./App.tsx", {
    platform: "macos",
    width: 1200,
    height: 800,
  });
  expect(app.texts()).toContain("Дневник");
  expect(app.texts()).not.toContain("Свернуть окно");
  expect(app.texts()).not.toContain("Развернуть окно");
  expect(app.texts()).not.toContain("Закрыть окно");
  // The page's name comes twice: the sidebar row and the page's own tab.
  expect(app.texts().filter((text) => text === "Дневник").length).toEqual(2);
});

test("a tab is a chip of one width, whatever it is called", async () => {
  const app = await open("./App.tsx", {
    platform: "macos",
    width: 1200,
    height: 800,
  });
  await app.waitFor("label:Дневник");
  expect(app.layout("label:Дневник")?.width).toEqual(300);
});

test("a page opens as a tab and closes back to the one before", async () => {
  const app = await open("./App.tsx", { width: 1200, height: 800 });
  // The window opens on the journal, so its tab is the only one there.
  expect(app.texts()).toContain("Записей пока нет");
  await app.press("text:Заметки");
  expect(app.texts()).not.toContain("Записей пока нет");
  // The tab carries the page's name, and closing it goes back to the journal.
  expect(
    app.texts().filter((text) => text === "Заметки").length,
  ).toBeGreaterThan(1);
  await app.press("label:Закрыть Заметки");
  expect(app.texts()).toContain("Записей пока нет");
});

test("centers titlebar controls on the same line as the traffic lights", () => {
  // The bar is 48: a 24-tall control sits 12 from its top, a 28-tall one 10.
  expect(titlebarControlTop(24)).toEqual(12);
  expect(titlebarControlTop(28)).toEqual(10);
});

// A recent row opens its note in a tab of its own, and that tab is the one
// being read: going through the page tab instead put the note away again and
// left the new chip inert.
test("a recent note opens as the tab being read", async () => {
  const app = await open("./tabs-fixture.tsx", {
    storage: {
      "mundus.atlas.recent.v1": JSON.stringify([
        { kind: "note", id: "seed:long", title: "Долгая заметка", at: 1 },
      ]),
    },
  });
  await app.waitFor("label:Долгая заметка");
  await app.press("label:Долгая заметка");
  await app.wait(400);
  // The note itself, not the list of them.
  expect(app.texts().join(" | ")).toContain(
    "Тело заметки, открытой из недавних.",
  );
});

// A tab carries its own menu on the secondary button, where the note is
// renamed in place and put away; the bar no longer keeps a bin of its own.
test("a tab's menu renames its note and deletes it", async () => {
  const app = await open("./tabs-fixture.tsx", {
    platform: "windows",
    storage: {
      "mundus.atlas.recent.v1": JSON.stringify([
        { kind: "note", id: "seed:long", title: "Долгая заметка", at: 1 },
      ]),
    },
  });
  await app.waitFor("label:Долгая заметка");
  await app.press("label:Долгая заметка");
  await app.waitFor("id:tab-note:seed:long");
  await app.rightClick("id:tab-note:seed:long");
  await app.chooseMenuItem("Переименовать");
  // The caret is in the note's own name, selected whole: typing replaces it.
  await app.type("label:Название заметки", "Новое имя");
  await app.waitUntil(
    () => app.texts().filter((text) => text === "Новое имя").length >= 2,
    { timeout: 3000 },
  );
  await app.rightClick("id:tab-note:seed:long");
  await app.chooseMenuItem("Удалить заметку");
  expect(app.texts()).not.toContain("Тело заметки, открытой из недавних.");
});

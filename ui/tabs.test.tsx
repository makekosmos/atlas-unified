import { expect, open, test } from "nsh/test";
import { slideDirection, tabChipWidth, titlebarControlTop } from "./chrome";

test("window history walks across pages and truncates forward after a new visit", async () => {
  const app = await open("./tabs-fixture.tsx", {
    width: 1200,
    height: 800,
    storage: {
      "mundus.atlas.recent.v1": JSON.stringify([
        { kind: "note", id: "seed:long", title: "Долгая заметка", at: 1 },
        { kind: "note", id: "seed:other", title: "Другая заметка", at: 1 },
      ]),
    },
  });
  expect(app.accessibility("label:Назад")?.disabled).toBe(true);
  expect(app.accessibility("label:Вперёд")?.disabled).toBe(true);
  expect(app.texts()).toContain("Записей пока нет");
  await app.press("text:Заметки");
  await app.press("label:Долгая заметка");
  await app.press("label:Назад");
  expect(app.texts()).toContain("Новая заметка");
  await app.press("label:Назад");
  expect(app.texts()).toContain("Записей пока нет");
  expect(app.accessibility("label:Назад")?.disabled).toBe(true);
  await app.press("label:Вперёд");
  expect(app.texts()).toContain("Новая заметка");
  await app.press("label:Вперёд");
  expect(app.texts()).toContain("Тело заметки, открытой из недавних.");
  await app.press("label:Назад");
  await app.press("label:Другая заметка");
  expect(app.accessibility("label:Вперёд")?.disabled).toBe(true);
  expect(app.texts()).toContain("Другое тело.");
});

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

test("tabs follow the sidebar and stay next to the note arrows", async () => {
  const app = await open("./App.tsx", {
    platform: "windows",
    width: 1440,
    height: 900,
  });
  await app.press("text:Заметки");
  const tab = () => app.layout("id:tab-page:journal")!;
  const forward = () => app.layout("label:Вперёд")!;
  const gap = () => tab().x - (forward().x + forward().width);
  expect(gap()).toEqual(8);
  const expanded = tab().x;
  await app.press("label:Боковая панель");
  await app.waitUntil(() => tab().x < expanded - 100);
  expect(gap()).toEqual(8);
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

for (const withLibrary of [false, true]) {
  test(`journal tab takes over from an open note (library: ${withLibrary})`, async () => {
    const app = await open("./tabs-fixture.tsx", {
      width: 1200,
      height: 800,
      storage: {
        "mundus.atlas.recent.v1": JSON.stringify([
          { kind: "note", id: "seed:long", title: "Долгая заметка", at: 1 },
        ]),
      },
    });
    if (withLibrary) await app.press("text:Заметки");
    await app.press("label:Долгая заметка");
    await app.waitFor("id:tab-note:seed:long");
    expect(app.shows("id:tab-page:notes")).toBe(withLibrary);
    for (let attempt = 0; attempt < 2; attempt++) {
      await app.press("id:tab-page:journal");
      expect(app.texts()).toContain("Записей пока нет");
      await app.press("id:tab-note:seed:long");
      expect(app.texts()).toContain("Тело заметки, открытой из недавних.");
    }
  });
}

// A tab carries its own menu on the secondary button, where the note is
// renamed in place and put away; the bar no longer keeps a bin of its own.
test("a tab's menu renames its note and deletes it", async () => {
  const app = await open("./tabs-fixture.tsx", {
    platform: "windows",
    // Wide enough for a chip to carry a name: in a window this narrow the
    // strip gives the names up and the rename is read in the note itself.
    width: 1200,
    height: 800,
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

// How fast the bar hands over, measured on a clock the test moves a frame at a
// time: a page is on screen when its own words are. The light direction is a
// page the app already has; the heavy one builds a note's editor.
test("a switch between tabs lands in the next frame", async () => {
  const app = await open("./tabs-fixture.tsx", {
    platform: "windows",
    clock: { time: new Date(2026, 10, 25) },
    storage: {
      "mundus.atlas.recent.v1": JSON.stringify([
        { kind: "note", id: "seed:long", title: "Долгая заметка", at: 1 },
      ]),
    },
  });
  const body = "Тело заметки, открытой из недавних.";
  await app.waitFor("label:Долгая заметка");
  await app.press("label:Долгая заметка");
  await app.waitUntil(() => app.texts().includes(body), { timeout: 3000 });

  // From the note to the next tab: nothing to build, the page is there.
  await app.keyboard.press("ctrl+tab");
  let light = 0;
  while (app.texts().includes(body) && light < 40) {
    await app.wait(16);
    light += 1;
  }

  // And back to the note: its editor is built as the tab opens.
  await app.press("id:tab-note:seed:long");
  let heavy = 0;
  while (!app.texts().includes(body) && heavy < 40) {
    await app.wait(16);
    heavy += 1;
  }
  // The page the app already has is there in the frame the key lands; the one
  // whose editor is built takes no more than a frame either, in this renderer.
  expect(light).toBeLessThanOrEqual(1);
  expect(heavy).toBeLessThanOrEqual(2);
});

// The page comes in from the side the tab sits on: to the right of the one
// being read is from the right, to its left is from the left.
test("a page comes in from the side its tab sits on", () => {
  expect(slideDirection(0, 2)).toEqual(1);
  expect(slideDirection(2, 0)).toEqual(-1);
  expect(slideDirection(1, 0)).toEqual(-1);
});

// The strip is one width for all of its chips: the full 300 while they fit,
// then narrower, and at the end just the icon's plate — 6 of air, the 24 plate
// and 6 again — with no name and no cross.
test("a chip gives up its name first and stops at its plate", () => {
  expect(tabChipWidth(1200, 3)).toEqual(300);
  expect(tabChipWidth(500, 10)).toEqual(48);
  expect(tabChipWidth(200, 10)).toEqual(36);
});

// `mod+w` puts the tab being read away, the way every window with tabs does,
// and the page it was opened from comes back.
test("mod+w closes the tab being read", async () => {
  const app = await open("./tabs-fixture.tsx", {
    width: 1200,
    height: 800,
    storage: {
      "mundus.atlas.recent.v1": JSON.stringify([
        { kind: "note", id: "seed:long", title: "Долгая заметка", at: 1 },
      ]),
    },
  });
  await app.waitFor("label:Долгая заметка");
  await app.press("label:Долгая заметка");
  await app.waitFor("id:tab-note:seed:long");
  expect(app.texts()).toContain("Тело заметки, открытой из недавних.");
  await app.keyboard.press("mod+w");
  await app.waitUntil(() => !app.shows("id:tab-note:seed:long"));
  // The tab before it — the page the note was opened over — comes back.
  expect(app.texts()).toContain("Записей пока нет");
  expect(app.texts()).not.toContain("Тело заметки, открытой из недавних.");
});

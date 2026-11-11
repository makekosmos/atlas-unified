import { expect, open, test } from "nsh/test";

async function longPage(app: any) {
  await app.press("label:Заметка 2");
  await app.press("label:Текст заметки");
  await app.keyboard.press("mod+ArrowDown");
  for (let i = 0; i < 40; i += 1) await app.keyboard.press("enter");
}

test("a slash opens the menu on a fresh empty line", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.press("label:Текст заметки");
  await app.keyboard.press("mod+ArrowDown");
  await app.keyboard.press("enter");
  await app.keyboard.press("/");
  expect(app.texts()).toContain("Заголовок 1");
});

// The editor scrolls its own content: a page scrolled far down must still
// place the menu where the caret is, and the menu must take a press.
test("a slash works with the page scrolled to the end", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await longPage(app);
  await app.keyboard.press("/");
  expect(app.texts()).toContain("Список");
  await app.press("label:Список");
  expect(app.texts()).not.toContain("Заголовок 1");
});

// A code block wears its language on the top left and a copy button on the
// top right. The name opens the list of languages.
test("a code block names its language and copies from its corner", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820, platform: "macos" });
  await app.press("label:Заметка 2");
  await app.press("label:Текст заметки");
  await app.keyboard.press("mod+ArrowDown");
  await app.keyboard.press("enter");
  await app.keyboard.press("/");
  await app.press("label:Код");
  await app.waitFor("text:Простой текст");
  await app.keyboard.press("f");
  await app.keyboard.press("n");
  await app.press("label:Скопировать");
  expect(app.clipboard()).toContain("fn");
  await app.press("label:Простой текст");
  expect(app.menu()?.map((item) => item.label)).toContain("Rust");
  await app.chooseMenuItem("Rust");
  await app.waitFor("text:Rust");
});

// Saving used to re-render the page under the editor and drop its focus, so
// the next slash went nowhere. A pause past the save delay proves it stays.
test("a slash still opens after the note has been saved", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.press("label:Текст заметки");
  await app.keyboard.press("mod+ArrowDown");
  await app.keyboard.press("enter");
  await app.wait(1200);
  await app.keyboard.press("/");
  expect(app.texts()).toContain("Список");
});

// The list takes the keyboard from the caret: arrows move, Enter makes the
// block. A focused editor keeps those keys for its caret, so the list hears
// them only once the editor lets go.
test("the arrows and Enter make the block the list shows", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.type("label:Текст заметки", "/");
  await app.wait(300);
  // The fifth row is the bulleted list: text, h1, h2, h3, list.
  for (let step = 0; step < 4; step += 1) await app.keyboard.press("ArrowDown");
  await app.keyboard.press("Enter");
  await app.wait(300);
  expect(app.texts().some((line) => line.includes("•"))).toBe(true);
});

// A keymap names keys by the US layout on every layout: `заг` arrives as
// `pfu`, and the list reads both, so a Russian keyboard filters it too.
test("a query typed on a Russian layout filters the list", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.type("label:Текст заметки", "/");
  await app.wait(300);
  await app.keyboard.press("p");
  await app.keyboard.press("f");
  await app.keyboard.press("u");
  await app.wait(200);
  expect(app.texts()).toContain("Заголовок 1");
  expect(app.texts()).not.toContain("Список");
});

// Escape cancels the typing, not just the list: the `/` goes with it, and the
// caret comes back to the editor.
test("Escape drops the slash and the caret types again", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.type("label:Текст заметки", "/");
  await app.wait(300);
  await app.keyboard.press("Escape");
  await app.wait(200);
  expect(app.texts().join("")).not.toContain("/");
  await app.type("label:Текст заметки", "!");
  expect(app.texts().join("")).toContain("!");
});

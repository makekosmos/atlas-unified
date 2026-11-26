import { expect, open, test } from "nsh/test";

test("code note keeps keyboard editing after syntax painting", async () => {
  const app = await open("./notes-code-fixture.tsx", {
    width: 1180,
    height: 820,
    platform: "windows",
  });
  await app.press("label:Код: языки");
  await app.press('text:fn main() {\n    println!("hi");\n}');
  await app.keyboard.press("ctrl+Home");
  await app.keyboard.press("/");
  await app.wait(150);
  expect(app.texts()).not.toContain("Заголовок 1");
  expect(app.texts().join("\n")).toContain("/fn main");
  const caret = app.viewStyle(
    "id:note-code-card >> nth=0 >> id:rich-editor-caret",
  );
  expect(caret?.effectiveOpacity).toBeGreaterThan(0);
  await app.keyboard.press("Backspace");
  await app.wait(150);
  await app.press("label:Скопировать >> nth=0");
  expect(app.clipboard()).toEqual('fn main() {\n    println!("hi");\n}');
});

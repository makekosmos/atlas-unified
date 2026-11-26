import { expect, open, test } from "nsh/test";

for (const withCode of [false, true]) {
  test(`a note table is wider than the prose (code: ${withCode})`, async () => {
    const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
    await app.press("label:Новая заметка");
    await app.press("label:Без названия");
    const tableText =
      "Абзац перед таблицей\n\n| Ширина | Высота |\n| --- | --- |\n| 100 | 200 |";
    await app.paste("label:Текст заметки", {
      text: withCode
        ? tableText + "\n\n```js\nconst width = 100;\n```"
        : tableText,
    });
    if (withCode) await app.waitFor("id:note-code-card");
    await app.waitFor("id:rich-editor-table-scroll");
    const prose = app.layout("text:Абзац перед таблицей")!;
    const table = app.layout("id:rich-editor-table-scroll")!;
    expect(table.x).toEqual(prose.x - 8);
    expect(table.width).toEqual(prose.width + 16);
  });
}

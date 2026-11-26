import { expect, open, test } from "nsh/test";

for (const withHtml of [false, true]) {
  test(`note formats pasted Markdown (HTML: ${withHtml})`, async () => {
    const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
    await app.press("label:Новая заметка");
    await app.press("label:Без названия");
    const text = "# Раздел\n\n- **Первый**\n- Второй";
    await app.paste("label:Текст заметки", {
      text,
      html: withHtml ? `<pre>${text}</pre>` : undefined,
    });
    await app.wait(150);
    const shown = app.texts().join("\n");
    expect(shown).toContain("Раздел");
    expect(shown).toContain("•");
    expect(shown).not.toContain("# Раздел");
    expect(shown).not.toContain("**Первый**");
  });
}

test("note title scrolls with a new note", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Новая заметка");
  await app.press("label:Без названия");
  await app.type("label:Название заметки", "Новый заголовок");
  expect(app.texts()).toContain("Новый заголовок");
  await app.paste("label:Текст заметки", { text: "Абзац\n".repeat(80) });
  await app.keyboard.press("mod+ArrowUp");
  const top = app.layout("label:Название заметки")?.y;
  expect(typeof top).toBe("number");
  await app.keyboard.press("mod+ArrowDown");
  const scrolled = app.layout("label:Название заметки");
  expect(scrolled?.y).toBeLessThan(top!);
});

test("note list markers stay inside the prose column", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Новая заметка");
  await app.press("label:Без названия");
  await app.paste("label:Текст заметки", {
    text: "Абзац\n\n- Маркер\n\n100. Номер",
  });
  const left = app.layout("text:Абзац")!.x;
  expect(app.layout("text:•")?.x).toBeGreaterThanOrEqual(left - 14);
  expect(app.layout("text:100.")?.x).toBeGreaterThanOrEqual(left);
});

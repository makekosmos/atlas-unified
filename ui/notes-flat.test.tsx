import { expect, open, test } from "nsh/test";

// A note whose document the editor cannot place in its schema comes back as a
// page of plain paragraphs, and the save writes that page over the note. A
// task list is the case in hand: NSH's starter kit carries it, so the note
// must come back with its tasks.
test("a task list survives the editor", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Задачи");
  await app.press("label:Текст заметки");
  await app.keyboard.press("mod+ArrowDown");
  // The editor keeps the tasks a JSON document brings: two boxes, one per
  // item, and the items' words stay where they were.
  expect(app.count("role:checkbox")).toEqual(2);
  expect(app.texts()).toContain("Выбрать район");
  expect(app.texts()).toContain("Собрать коробки");
});

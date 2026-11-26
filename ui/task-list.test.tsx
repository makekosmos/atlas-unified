import { expect, open, test } from "nsh/test";

// Does the editor keep a task list that arrives as a JSON document? A bare
// editor answers it without the note page's styles in the way.
test("a bare editor keeps a task list", async () => {
  const app = await open("./task-fixture.tsx", { width: 900, height: 700 });
  await app.waitFor("text:Собрать коробки");
  expect(app.count("role:checkbox")).toEqual(2);
});

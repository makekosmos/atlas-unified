import { expect, open, test } from "nsh/test";

// A picture pasted from a file manager arrives as a `file:` URL: the note
// takes it as an image node where the caret was.
test("a pasted picture lands where the caret was", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.wait(200);
  await app.paste("label:Текст заметки", { uris: ["file:///tmp/test-picture.png"] });
  await app.wait(600);
  // The editor draws an image as the object replacement character.
  expect(app.texts().join("")).toContain("\uFFFC");
});

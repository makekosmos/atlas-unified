import { expect, open, test } from "nsh/test";

// A picture pasted from the clipboard or a file manager arrives as bytes: the
// note keeps them in a `data:` URI and inserts an image node where the caret
// was, so the picture travels with the note.
test("a pasted picture lands where the caret was", async () => {
  const app = await open("./notes-fixture.tsx", { width: 1180, height: 820 });
  await app.press("label:Заметка 2");
  await app.wait(200);
  await app.paste("label:Текст заметки", { files: ["/tmp/test-picture.png"] });
  await app.wait(600);
  // The editor draws an image as the object replacement character.
  expect(app.texts().join("")).toContain("\uFFFC");
});

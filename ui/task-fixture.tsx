// An editor and nothing else: the note page's own parts stay out of a test
// that asks whether the editor itself keeps a task list.
import { mount, View } from "nsh";
import { createRichEditor, RichEditor, StarterKit } from "nsh/base";
import { fallback } from "./state";

const doc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Две недели до переезда." }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Выбрать район" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Собрать коробки" }],
            },
          ],
        },
      ],
    },
  ],
};

const session = createRichEditor({
  extensions: [StarterKit],
  content: doc as never,
  format: "json",
});

function Tasks() {
  return (
    <View
      class="h-full w-full"
      style={{ backgroundColor: fallback.colors.background }}
    >
      <RichEditor
        editor={session}
        accessibilityLabel="Задачи"
        classes={{ taskCheckbox: "w-4 h-4" }}
        style={{ height: 500 }}
      />
    </View>
  );
}

mount(Tasks);

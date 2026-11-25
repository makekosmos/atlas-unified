import { mount, Text, View } from "nsh";
import { Glyph } from "./glyph";
import {
  bindNoteCommands,
  canWalkBack,
  canWalkForward,
  NotesPage,
  openNoteWithoutHistory,
  setNotes,
  walkBack,
  walkForward,
} from "./notes";
import { fallback } from "./state";
import type { Note } from "./state";

/// The notes with the two arrows the window's title bar draws, so a test can
/// press them: the trail itself is the page's, the arrows only stand where the
/// title bar puts them.

const colors = fallback.colors;

const library: Note[] = [1, 2].map((index) => ({
  id: `note-${index - 1}`,
  title: `Заметка ${index}`,
  doc: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: `Текст заметки ${index}` }],
      },
    ],
  },
  text: `Текст заметки ${index}`,
  createdAt: "2026-11-01T09:00:00.000Z",
  updatedAt: "2026-11-09T10:00:00.000Z",
}));
setNotes(library);
bindNoteCommands({
  create() {},
  save() {},
  remove() {},
  reload() {
    setNotes(library);
  },
});

function Arrow(props: {
  dir: "back" | "forward";
  label: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <View
      onPress={props.onPress}
      role="button"
      accessibilityLabel={props.label}
      class="items-center justify-center"
      style={{ width: 24, height: 24 }}
    >
      <Glyph
        name={props.dir === "back" ? "arrowLeft" : "arrowRight"}
        size={16}
        color={props.enabled ? colors.foreground : colors.muted}
      />
    </View>
  );
}

function TrailFixture() {
  return (
    <View
      class="h-full w-full flex-col"
      style={{ backgroundColor: colors.background }}
    >
      <View class="flex-row" style={{ height: 24, gap: 2 }}>
        <Arrow
          dir="back"
          label="Назад"
          enabled={canWalkBack()}
          onPress={walkBack}
        />
        <Arrow
          dir="forward"
          label="Вперёд"
          enabled={canWalkForward()}
          onPress={walkForward}
        />
        {/* Restoring a note the way the host or a tab does it, and what the
          arrows make of it: a restore must leave the trail where it was. */}
        <View
          onPress={() => openNoteWithoutHistory("note-1")}
          role="button"
          accessibilityLabel="Восстановить заметку"
          style={{ width: 24, height: 24 }}
        />
        <Text class="text-[11px]">{`${canWalkBack() ? "да" : "нет"}:${canWalkForward() ? "да" : "нет"}`}</Text>
      </View>
      <NotesPage colors={colors} dark={true} titlebarInset={0} />
    </View>
  );
}

mount(TrailFixture);

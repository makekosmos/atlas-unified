import { Scroll, Text, View, signal } from "nsh";
import { Input } from "nsh/base";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { Modal, ModalGhost } from "./modal";
import { noteLabel, type Note, type JournalEntry } from "./state";

export function QuickSearch(props: {
  notes: Note[];
  journal: JournalEntry[];
  colors: ThemeColors;
  onNote: (id: string) => void;
  onJournal: () => void;
  onDismiss: () => void;
}) {
  const query = signal("");
  const preview = signal<JournalEntry | null>(null);
  const results = () => {
    const needle = query().trim().toLocaleLowerCase();
    if (!needle) return [];
    const found: { label: string; kind: string; select: () => void }[] = [];
    for (const note of props.notes) {
      const label = noteLabel(note.title);
      if (`${label} ${note.text}`.toLocaleLowerCase().includes(needle))
        found.push({
          label,
          kind: "Заметка",
          select: () => props.onNote(String(note.id)),
        });
      if (found.length === 20) break;
    }
    let count = 0;
    for (const entry of props.journal) {
      if (!entry.text.toLocaleLowerCase().includes(needle)) continue;
      found.push({
        label: entry.text.slice(0, 100),
        kind: "Дневник",
        select: () => preview.set(entry),
      });
      if (++count === 10) break;
    }
    return found;
  };
  return (
    <Modal
      title="Быстрый поиск"
      colors={props.colors}
      onDismiss={props.onDismiss}
      onBack={preview() ? () => preview.set(null) : undefined}
    >
      {preview() ? (
        <View class="gap-3 px-5 pb-5">
          <Scroll style={{ maxHeight: 250 }}>
            <Text
              class="select-text"
              style={{ color: props.colors.foreground }}
            >
              {preview()?.text}
            </Text>
          </Scroll>
          <ModalGhost
            colors={props.colors}
            label="Открыть дневник"
            onPress={props.onJournal}
          />
        </View>
      ) : (
        <View class="gap-2 px-5 pb-5">
          <Input
            autoFocus
            value={query()}
            accessibilityLabel="Поисковый запрос"
            placeholder="Заметки и дневник"
            onChange={(event) => query.set(event.value)}
            onSubmit={() => results()[0]?.select()}
          />
          {!!query().trim() && (
            <Scroll style={{ maxHeight: 300 }}>
              {results().length === 0 && (
                <Text style={{ color: props.colors.muted }}>
                  Ничего не найдено
                </Text>
              )}
              {results().map((result) => (
                <View
                  class="gap-1 rounded-md px-3 py-2"
                  role="button"
                  onPress={result.select}
                  hoverStyle={{ backgroundColor: props.colors.background }}
                >
                  <Text style={{ color: props.colors.foreground }}>
                    {result.label}
                  </Text>
                  <Text
                    class="text-[11px]"
                    style={{ color: props.colors.muted }}
                  >
                    {result.kind}
                  </Text>
                </View>
              ))}
            </Scroll>
          )}
        </View>
      )}
    </Modal>
  );
}

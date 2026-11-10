import { mount, Storage, Text, View } from "nsh";
import { loadRecent, recent } from "./recent";

/// The sidebar's list of what was opened, without the app around it. It starts
/// from a stored list such as an older build wrote — pages included — so the
/// test reads what the list keeps of it.

const stored = JSON.stringify([
  { kind: "note", id: "n1", title: "Борщ", at: 5 },
  { kind: "page", id: "notes", title: "Заметки", at: 4 },
  { kind: "page", id: "tasks", title: "Задачи", at: 3 },
  { kind: "game", id: "g1", title: "Hades", at: 2 },
]);

void Storage.setItem("mundus.atlas.recent.v1", stored).then(() => loadRecent());

mount(() => <View style={{ gap: 4 }}>
  {recent().map((entry) => <Text>{entry.title}</Text>)}
</View>);

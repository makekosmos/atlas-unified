import { Input } from "nsh/base";
import { Text, View } from "nsh";
import { Button as SharedButton } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { gameLibrary } from "./game-library";
import { Modal } from "./modal";

function sourceLabel(source: string) {
  if (source === "steam") return "Steam";
  if (source === "epic") return "Epic Games";
  if (source === "gog") return "GOG";
  if (source === "folder") return "Папка игры";
  return "Выбрано вручную";
}

/// Step two of the add flow: what exactly lands in the library — the guessed
/// name (editable), the exe it will launch, and where it came from — before the
/// Engine gets a write. "Назад" returns to the picker in the same card.
export function ConfirmGameDialog(props: { colors: ThemeColors }) {
  const pending = gameLibrary.pendingAdd();
  if (!pending) return <View />;
  const footer = <View class="flex-row items-center justify-between" style={{ gap: 8 }}>
    <SharedButton label="Назад" colors={props.colors} onPress={gameLibrary.cancelConfirm} className="border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />
    <SharedButton label="Добавить" colors={props.colors} onPress={gameLibrary.confirmAdd} selected className="h-9 items-center justify-center px-3 py-0" style={{ backgroundColor: props.colors.accent, borderColor: "transparent" }} textColor={props.colors.background} />
  </View>;
  return <Modal title="Добавить игру" colors={props.colors} onDismiss={gameLibrary.cancelConfirm} onBack={gameLibrary.cancelConfirm} width={460} footer={footer}>
    <Text class="mb-2 text-[12px]" style={{ color: props.colors.muted }}>Поправь название, если угадалось неверно.</Text>
    <Input value={pending.title} onChange={gameLibrary.editPendingTitle} accessibilityLabel="Название игры" class="h-10 rounded-[10px] px-3 text-[13px]" style={{ backgroundColor: props.colors.background, color: props.colors.foreground }} />
    <View class="mt-3 rounded-[10px] p-3" style={{ backgroundColor: props.colors.background }}>
      <Text class="text-[11px]" style={{ color: props.colors.muted }}>Запускается</Text>
      <Text class="mt-1 text-[12px]" style={{ color: props.colors.foreground }}>{pending.path}</Text>
      <Text class="mt-2 text-[11px]" style={{ color: props.colors.muted }}>Источник · {sourceLabel(pending.source)}</Text>
    </View>
    <Text class="mt-3 text-[11px] leading-[17px]" style={{ color: props.colors.muted }}>После добавления игра появится сразу; метаданные и горизонтальная обложка загрузятся в фоне. Если источники не найдут игру, её можно дополнить вручную.</Text>
  </Modal>;
}


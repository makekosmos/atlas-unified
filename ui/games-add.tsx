import { LayoutAnimation, Text, View } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { gameLibrary } from "./game-library";
import { Glyph } from "./glyph";
import type { GlyphName } from "./icons";
import { Modal } from "./modal";

/// Keep the dialog size stable through menu, scan, and review states.
const DIALOG_WIDTH = 460;

/// A native dialog opened from inside the press handler re-enters GPUI on the
/// same turn; letting the handler return first keeps it on its own turn.
function runAfterPress(run: () => void) {
  setTimeout(run, 0);
}

function providerName(provider: string) {
  return provider === "steam" ? "Steam" : provider === "epic" ? "Epic Games" : "GOG";
}

function scanStage() {
  const progress = gameLibrary.scanProgress();
  if (!progress) return "Подключаемся к Engine…";
  if (progress.aggregate) return `Проверены все библиотеки · найдено ${progress.found}`;
  const provider = providerName(progress.provider);
  if (progress.phase === "complete") return `${provider}: найдено ${progress.providerFound ?? 0}`;
  if (progress.phase === "error") return `${provider}: не удалось проверить`;
  return `Проверяем ${provider} (${Math.min(progress.completed + 1, progress.total)} из ${progress.total})…`;
}

function scanPercent() {
  const progress = gameLibrary.scanProgress();
  return progress ? Math.max(7, Math.round(progress.completed / progress.total * 100)) : 7;
}

/// One way to add a game: an icon, what it does, and the hint under it.
function Action(props: { colors: ThemeColors; icon: GlyphName; title: string; hint: string; onPress: () => void }) {
  return <View onPress={props.onPress} role="button" accessibilityLabel={props.title} class="flex-row items-center rounded-[10px] px-2 py-2" style={{ gap: 12 }} hoverStyle={{ backgroundColor: props.colors.background }}>
    <View class="h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: props.colors.background }}>
      <Glyph name={props.icon} size={18} color={props.colors.foreground} />
    </View>
    <View class="min-w-0 flex-1">
      <Text class="text-[13px]" style={{ color: props.colors.foreground }}>{props.title}</Text>
      <Text class="text-[11px]" style={{ color: props.colors.muted }}>{props.hint}</Text>
    </View>
  </View>;
}

/// Accepting or skipping fades the card; no sideways motion or rotation.
let decisionPending = false;
function decide(accept: boolean) {
  if (decisionPending) return;
  decisionPending = true;
  LayoutAnimation.configureNext({
    duration: 500,
    create: { type: "easeOut", property: "opacity", duration: 500 },
    update: { type: "easeOut", duration: 500 },
    delete: { type: "easeOut", property: "opacity", duration: 500 },
  });
  gameLibrary.decideDeck(accept);
  setTimeout(() => { decisionPending = false; }, 500);
}

function ReviewCard(props: { colors: ThemeColors }) {
  const initial = () => (gameLibrary.deck()[0]?.title ?? "?").trim().charAt(0).toLocaleUpperCase();
  return <View class="w-full">
    <View testID="game-review-card" class="w-full overflow-hidden rounded-[14px] border" style={{
      borderColor: props.colors.border,
      backgroundColor: props.colors.background,
    }}>
      <View class="h-[190px] items-center justify-center overflow-hidden px-7" style={{ backgroundColor: props.colors.card }}>
        <Text class="absolute text-[160px] font-semibold" style={{ color: props.colors.foreground, opacity: 0.05, left: 6, top: -22 }}>{initial()}</Text>
        <Text class="text-center text-[20px] font-semibold" style={{ color: props.colors.foreground }}>{gameLibrary.deck()[0]?.title}</Text>
      </View>
      <View class="flex-row items-center border-t px-4 py-3" style={{ borderColor: props.colors.border, gap: 10 }}>
        <Text class="min-w-0 flex-1 text-[11px]" style={{ color: props.colors.muted }}>{gameLibrary.deck()[0]?.exePath}</Text>
        <Text class="shrink-0 text-[11px]" style={{ color: props.colors.muted }}>{`${gameLibrary.deckTotal() - gameLibrary.deck().length + 1} из ${gameLibrary.deckTotal()}`}</Text>
      </View>
    </View>
    <View class="mt-3 flex-row" style={{ gap: 10 }}>
      <View onPress={() => decide(false)} role="button" accessibilityLabel="Пропустить игру" class="h-10 flex-1 flex-row items-center justify-center rounded-[10px] border" style={{ gap: 8, backgroundColor: props.colors.background, borderColor: props.colors.border }} hoverStyle={{ opacity: 0.88 }}>
        <Glyph name="close" size={15} color={props.colors.muted} />
        <Text class="text-[13px]" style={{ color: props.colors.foreground }}>Пропустить</Text>
      </View>
      <View onPress={() => decide(true)} role="button" accessibilityLabel="Добавить игру в библиотеку" class="h-10 flex-1 flex-row items-center justify-center rounded-[10px]" style={{ gap: 8, backgroundColor: props.colors.accent }} hoverStyle={{ opacity: 0.88 }}>
        <Glyph name="check" size={15} color={props.colors.background} />
        <Text class="text-[13px]" style={{ color: props.colors.background }}>Добавить</Text>
      </View>
    </View>
  </View>;
}

/// What came of the search once the cards are gone: what was added, what was
/// already there, or why nothing could be checked. The dialog never falls back
/// to the menu on its own — a press always ends on its result.
function ReviewSummary(props: { colors: ThemeColors }) {
  const reviewed = () => gameLibrary.deckTotal() > 0;
  const failed = () => !reviewed() && gameLibrary.scanState() === "error";
  const headline = () => reviewed()
    ? `Добавлено ${gameLibrary.deckAdded()} · пропущено ${gameLibrary.deckSkipped()}`
    : failed()
      ? "Не удалось проверить библиотеки"
      : gameLibrary.candidates().length
        ? "Новых игр нет"
        : "Ничего не нашлось";
  const detail = () => {
    if (reviewed()) return gameLibrary.importError() || gameLibrary.scanWarning() || "Игры из списка можно запустить в любой момент";
    if (failed()) return gameLibrary.scanError();
    if (gameLibrary.candidates().length) return `Все ${gameLibrary.candidates().length} найденных игр уже в библиотеке`;
    return "Автоматический поиск не нашёл игр";
  };
  return <View class="w-full items-center py-2">
    <View class="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: props.colors.background }}>
      <Glyph name={failed() ? "close" : "check"} size={20} color={failed() ? props.colors.muted : props.colors.accent} />
    </View>
    <Text class="mt-3 text-center text-[14px]" style={{ color: props.colors.foreground }}>{headline()}</Text>
    <Text class="mt-1 text-center text-[12px]" style={{ color: props.colors.muted }}>{detail()}</Text>
    <View class="mt-4 flex-row self-stretch" style={{ gap: 10 }}>
      {failed() && <View onPress={gameLibrary.scanAutomatically} role="button" accessibilityLabel="Повторить поиск" class="h-9 flex-1 items-center justify-center rounded-[10px] border" style={{ backgroundColor: props.colors.background, borderColor: props.colors.border }} hoverStyle={{ opacity: 0.88 }}>
        <Text class="text-[13px]" style={{ color: props.colors.foreground }}>Повторить</Text>
      </View>}
      <View onPress={gameLibrary.closeAddDialog} role="button" accessibilityLabel="Готово" class="h-9 flex-1 items-center justify-center rounded-[10px]" style={{ backgroundColor: props.colors.accent }} hoverStyle={{ opacity: 0.88 }}>
        <Text class="text-[13px]" style={{ color: props.colors.background }}>Готово</Text>
      </View>
    </View>
  </View>;
}

/// What the automatic search is doing: which library, how much of it, and how
/// many games it has turned up so far.
function ScanPanel(props: { colors: ThemeColors }) {
  return <View class="w-full rounded-[12px] p-4" style={{ backgroundColor: props.colors.background }}>
    <View class="flex-row items-center justify-between">
      <Text class="text-[13px]" style={{ color: props.colors.foreground }}>{scanStage()}</Text>
      <Text class="text-[11px]" style={{ color: props.colors.muted }}>{`${gameLibrary.scanProgress()?.found ?? 0} игр`}</Text>
    </View>
    <View class="mt-3 h-1 overflow-hidden rounded" style={{ backgroundColor: props.colors.border }}>
      <View class="h-full rounded" style={{ width: `${scanPercent()}%`, backgroundColor: props.colors.accent,  }} />
    </View>
    <Text class="mt-3 text-[11px]" style={{ color: props.colors.muted }}>Дальше покажем найденное по одной игре — добавить или пропустить</Text>
  </View>;
}

function reviewing() {
  return gameLibrary.scanState() !== "scanning" && gameLibrary.deck().length > 0;
}

/// A finished search with no cards left: what came of it, instead of the menu.
function settled() {
  return gameLibrary.reviewDone() && gameLibrary.deck().length === 0;
}

function menuHint() {
  if (gameLibrary.scanState() === "error") return gameLibrary.scanError();
  return gameLibrary.importError();
}

/// «Добавить игры»: three ways in, then the review of what the automatic
/// search found, one game at a time.
export function AddGamesDialog(props: { colors: ThemeColors; onBrowse: () => void; onBrowseFolder: () => void }) {
  return <Modal
    title="Добавить игры"
    colors={props.colors}
    onDismiss={gameLibrary.closeAddDialog}
    width={DIALOG_WIDTH}>
    {gameLibrary.scanState() === "scanning"
      ? <ScanPanel colors={props.colors} />
      : reviewing()
        ? <ReviewCard colors={props.colors} />
        : settled()
          ? <ReviewSummary colors={props.colors} />
          : <View class="w-full">
            <Action colors={props.colors} icon="search" title="Найти автоматически" hint="Поиск установленных игр" onPress={gameLibrary.scanAutomatically} />
            <Action colors={props.colors} icon="folder" title="Просканировать папку" hint="Выбрать exe из папки игры" onPress={() => { gameLibrary.beginManualAdd(); runAfterPress(props.onBrowseFolder); }} />
            <Action colors={props.colors} icon="file" title="Выбрать exe" hint="Один файл" onPress={() => { gameLibrary.beginManualAdd(); runAfterPress(props.onBrowse); }} />
            {menuHint() ? <Text class="mt-2 px-2 text-[11px]" style={{ color: props.colors.muted }}>{menuHint()}</Text> : null}
          </View>}
  </Modal>;
}

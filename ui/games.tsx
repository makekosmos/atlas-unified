import { Input } from "nsh/base";
import { effect, signal, Storage, Text, View } from "nsh";
import { Button as SharedButton } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { gameLibrary, guessTitle, visibleGameCards } from "./game-library";
import { AddGamesDialog } from "./games-add";
import { ConfirmGameDialog } from "./game-confirm";
import { Modal } from "./modal";
import { GameDetailsDialog, MetadataChoicesDialog } from "./game-details";

export type ProgramUsage = { name: string; process: string; path: string; foregroundMs: number; sessions: number; lastSeenAt: string };
export type { GameCandidate, GameCard } from "./game-library";
type Extensions = { games: boolean };

const emptyExtensions: Extensions = { games: true };
export const gamesOn = signal(true);
export const livePrograms = signal<ProgramUsage[]>([]);
const searchQuery = signal("");
const fromDrop = signal(false);
const selectedGameId = signal<string | null>(null);
let extensionsStamp = 0;

const extensionsKey = "mundus.atlas.extensions.v1";

export function loadGamePrefs() {
  const extensionsAt = extensionsStamp;
  void Storage.getItem(extensionsKey).then((value) => {
    if (extensionsAt !== extensionsStamp) return;
    const saved = readJson<Partial<Extensions>>(value, emptyExtensions);
    gamesOn.set(saved.games !== false);
  });
}

function readJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function saveExtensions(next: Extensions) {
  extensionsStamp += 1;
  gamesOn.set(next.games);
  void Storage.setItem(extensionsKey, JSON.stringify(next));
}

export function pathFromDrop(uri: string) {
  const decoded = decodeURIComponent(uri);
  const stripped = decoded.replace(/^file:\/*(?=[A-Za-z]:)/, "").replace(/^file:\/\//, "");
  return stripped.replaceAll("/", "\\");
}

function usageFor(path: string, programs: ProgramUsage[]) {
  const key = path.replaceAll("/", "\\").toLowerCase();
  const file = key.split("\\").pop() ?? "";
  const stem = file.replace(/\.exe$/i, "").replace(/\.lnk$/i, "");
  return programs.find((program) => {
    const process = program.process.toLowerCase();
    const programPath = program.path.replaceAll("/", "\\").toLowerCase();
    return programPath === key || process === file || process === stem || process === `${stem}.exe`;
  });
}

function visibleCards() {
  return visibleGameCards(gameLibrary.cards(), searchQuery());
}

function formatTime(ms: number) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "меньше минуты";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours < 1 ? `${rest} мин` : rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

export function GamesLibrary(props: { colors: ThemeColors; pickedExes: string[]; pickSource: string; onPick: (path: string) => void; onBrowse: () => void; onBrowseFolder: () => void; onLaunch: (path: string) => void; onClearPick: () => void }) {
  effect(() => {
    const picked = props.pickedExes;
    if (!picked.length) return;
    gameLibrary.closeAddDialog();
    if (picked.length !== 1) return;
    gameLibrary.beginConfirm(picked[0], props.pickSource, !fromDrop());
    fromDrop.set(false);
    props.onClearPick();
  });
  return <View class="flex-1" onFileDrop={(event) => { const path = pathFromDrop(event.uris[0] ?? ""); if (path) { fromDrop.set(true); props.onPick(path); } }}>
    <View class="flex-row items-center px-7 pt-3">
      <Input value={searchQuery()} onChange={(e) => searchQuery.set(e.value)} placeholder="Поиск игр" accessibilityLabel="Поиск игр" class="h-9 min-w-0 flex-1 rounded-lg px-3 text-[13px]" style={{ backgroundColor: props.colors.card, color: props.colors.foreground, placeholderColor: props.colors.muted }} />
    </View>
    {gameLibrary.launchError() && <Text class="px-7 pt-2 text-[11px]" style={{ color: props.colors.muted }}>{gameLibrary.launchError()}</Text>}
    {visibleCards().length === 0 && <View class="flex-1 items-center justify-center px-7">
      <Text class="mb-2 text-[14px]" style={{ color: props.colors.muted }}>{searchQuery().trim() ? "Игры не найдены" : gameLibrary.libraryState() === "loading" ? "Загружаем библиотеку игр…" : gameLibrary.libraryState() === "error" ? "Не удалось загрузить библиотеку" : "Игр пока нет"}</Text>
      <Text class="text-center text-[12px]" style={{ color: props.colors.muted }}>{gameLibrary.error() || "Нажми + в заголовке, чтобы найти игры или добавить exe вручную"}</Text>
    </View>}
    <Each of={visibleCards()}>{(card) => {
      const item = card();
      const usage = usageFor(item.exePath, livePrograms());
      const byline = item.metadataStatus === "loading" ? "Загружаем метаданные…" : item.developers?.join(" · ") || item.genres?.slice(0, 2).join(" · ");
      return <View class="mx-7 h-14 flex-row items-center border-b" style={{ borderColor: props.colors.border }}>
        <View onPress={() => selectedGameId.set(item.id)} role="button" accessibilityLabel={`Подробнее: ${item.title}`} class="min-w-0 flex-1">
          <Text class="text-[14px]" style={{ color: props.colors.foreground }}>{item.title}</Text>
          <Text class="text-[12px]" style={{ color: props.colors.muted }}>{byline || (usage ? `${formatTime(usage.foregroundMs)} · ${usage.sessions} сесс.` : "Время ещё не посчитано")}</Text>
        </View>
        <SharedButton label="Запустить" colors={props.colors} onPress={() => props.onLaunch(item.exePath)} className="border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />
      </View>;
    }}</Each>
    {gameLibrary.pendingAdd()
      ? <ConfirmGameDialog colors={props.colors} />
      : gameLibrary.addOpen() && <AddGamesDialog colors={props.colors} onBrowse={props.onBrowse} onBrowseFolder={props.onBrowseFolder} />}
    {props.pickedExes.length > 1 && <Modal title="Какой файл запускать" colors={props.colors} onDismiss={props.onClearPick}>
      {props.pickedExes.map((path) => <SharedButton label={guessTitle(path)} colors={props.colors} onPress={() => { gameLibrary.beginConfirm(path, props.pickSource, true); props.onClearPick(); }} className="border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />)}
      <SharedButton label="Отмена" colors={props.colors} onPress={props.onClearPick} className="mt-3 border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />
    </Modal>}
    {selectedGameId() && gameLibrary.cards().find((card) => card.id === selectedGameId()) && <GameDetailsDialog card={gameLibrary.cards().find((card) => card.id === selectedGameId())!} colors={props.colors} onClose={() => selectedGameId.set(null)} onSetImage={(source) => { const card = gameLibrary.cards().find((item) => item.id === selectedGameId()); if (card) gameLibrary.setImage(card.exePath, source); }} />}
    {!selectedGameId() && gameLibrary.metadataChoices() && <MetadataChoicesDialog choices={gameLibrary.metadataChoices()!} colors={props.colors} onChoose={gameLibrary.chooseMetadata} onClose={() => gameLibrary.metadataChoices.set(null)} />}
  </View>;
}

export function ExtensionsPage(props: { colors: ThemeColors }) {
  return <View class="px-7 pt-6">
    <Text class="mb-3 text-[13px]" style={{ color: props.colors.foreground }}>Расширения</Text>
    <SharedButton label={gamesOn() ? "Расширение Игры: включено" : "Расширение Игры"} colors={props.colors} onPress={() => saveExtensions({ games: !gamesOn() })} className="border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />
    <Text class="mt-2 text-[12px]" style={{ color: props.colors.muted }}>Выключение прячет страницу. Записи остаются</Text>
  </View>;
}

export function GamesSettings(props: { colors: ThemeColors }) {
  return <View class="px-7 pt-6">
    <Text class="mb-2 text-[13px]" style={{ color: props.colors.foreground }}>Игры</Text>
    <Text class="mb-4 text-[12px]" style={{ color: props.colors.muted }}>Метаданные игр и обложки загружаются без ключей и кэшируются в каталоге данных Engine.</Text>
    <Text class="text-[12px]" style={{ color: props.colors.muted }}>Источники и порядок загрузки задаются в game-metadata.json.</Text>
  </View>;
}

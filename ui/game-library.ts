import { LayoutAnimation, signal, Storage } from "nsh";
import type { Command, GameCard, GameCandidate, LibraryState, MetadataChoice, PendingAdd, ScanProgress, ScanState } from "./game-library-types";
import { isCandidate, isGameCard, isScanProgress, pathKey, guessTitle, providerLabel } from "./game-library-utils";
import { chooseMetadata, metadataChoices, receiveMetadata as receiveMetadataEvent, setImage as setImageOverride } from "./game-library-metadata";

export type { GameCard, GameCandidate, MetadataChoice, MetadataChoices, PendingAdd, ScanProgress } from "./game-library-types";
export { visibleGameCards, pathKey, guessTitle } from "./game-library-utils";

const legacyCardsKey = "mundus.atlas.games.v1";
const cards = signal<GameCard[]>([]);
const candidates = signal<GameCandidate[]>([]);
const libraryState = signal<LibraryState>("loading");
const scanState = signal<ScanState>("idle");
const scanProgress = signal<ScanProgress | null>(null);
const scanError = signal("");
const scanWarning = signal("");
const importError = signal("");
const error = signal("");
const addOpen = signal(false);

/// The review of what the last automatic search found: one card at a time,
/// added or skipped, as a stack that only shrinks.
const deck = signal<GameCandidate[]>([]);
const deckTotal = signal(0);
const deckAdded = signal(0);
const deckSkipped = signal(0);
/// A search ran to its end (found something, nothing, or failed): the dialog
/// keeps showing what came of it instead of falling back to the menu.
const reviewDone = signal(false);
let sendCommand: Command | undefined;
let loadRequested = false;
let migrationRequested = false;

function readJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function migrateLegacyCards() {
  if (migrationRequested) return;
  migrationRequested = true;
  void Storage.getItem(legacyCardsKey).then((raw) => {
    const legacy = readJson<GameCard[]>(raw, []).filter(isGameCard);
    if (legacy.length) sendCommand?.("games.import-legacy", { candidates: legacy });
  });
}

function bindCommand(command: Command) {
  sendCommand = command;
  if (!loadRequested) {
    loadRequested = true;
    command("games.load");
  }
}

function startDiscovery() {
  candidates.set([]);
  deck.set([]);
  deckTotal.set(0);
  deckAdded.set(0);
  deckSkipped.set(0);
  reviewDone.set(false);
  scanError.set("");
  scanWarning.set("");
  importError.set("");
  if (!sendCommand) {
    scanState.set("error");
    scanError.set("Engine недоступен");
    reviewDone.set(true);
    return;
  }
  scanProgress.set({ provider: "steam", phase: "scanning", completed: 0, total: 3, found: 0 });
  scanState.set("scanning");
  sendCommand("games.discover");
}

function openAddDialog() {
  addOpen.set(true);
  if (!deck().length) {
    deckTotal.set(0);
    reviewDone.set(false);
  }
}

/// What the automatic search found, queued for the review: the cards the
/// library does not have yet.
function startDeck() {
  const items = availableCandidates();
  deck.set(items);
  deckTotal.set(items.length);
  deckAdded.set(0);
  deckSkipped.set(0);
}

/// One card reviewed: added to the Engine at once, or dropped. The stack
/// shrinks either way; an empty stack turns the dialog into its summary.
function decideDeck(accept: boolean) {
  const card = deck()[0];
  if (!card) return;
  deck.set(deck().slice(1));
  if (accept) {
    deckAdded.set(deckAdded() + 1);
    importGames([card]);
  } else {
    deckSkipped.set(deckSkipped() + 1);
  }
}

function beginManualAdd() {
  importError.set("");
}

function importGames(selected: GameCandidate[]) {
  if (!selected.length) return;
  if (!sendCommand) {
    importError.set("Engine недоступен");
    return;
  }
  importError.set("");
  sendCommand("games.import", { candidates: selected });
}

/// Candidates the library does not have yet: the same exe added twice is the
/// one thing the Engine cannot merge for us.
export function availableCandidates(): GameCandidate[] {
  const known = new Set(cards().map((card) => pathKey(card.exePath)));
  return candidates().filter((candidate) => !known.has(pathKey(candidate.exePath)));
}

/// What is about to be added: the picked exe, the name guessed for it, and
/// where it came from — shown for confirmation before the Engine gets a write.
const pendingAdd = signal<PendingAdd | null>(null);
const launchError = signal("");

let confirmFromPicker = false;

function beginConfirm(path: string, source = "manual", fromPicker = true) {
  importError.set("");
  confirmFromPicker = fromPicker;
  addOpen.set(false);
  pendingAdd.set({ path, title: guessTitle(path), source });
}

function editPendingTitle(title: string) {
  const pending = pendingAdd();
  if (pending) pendingAdd.set({ ...pending, title });
}

function cancelConfirm() {
  pendingAdd.set(null);
  if (confirmFromPicker) addOpen.set(true);
}

function confirmAdd() {
  const pending = pendingAdd();
  if (!pending) return;
  pendingAdd.set(null);
  importGames([{
    title: pending.title.trim() || guessTitle(pending.path),
    exePath: pending.path,
    installDir: "",
    source: pending.source,
  }]);
}

function receiveLaunch(value: unknown) {
  const result = value && typeof value === "object" ? value as { ok?: unknown; error?: unknown } : {};
  launchError.set(result.ok === true ? "" : String(result.error ?? "Не удалось запустить игру"));
}

function receiveLibrary(value: unknown) {
  if (!Array.isArray(value)) {
    const message = value && typeof value === "object" ? String((value as { error?: unknown }).error ?? "Не удалось загрузить библиотеку игр") : "Не удалось загрузить библиотеку игр";
    libraryState.set("error");
    error.set(message);
    return;
  }
  cards.set(value.filter(isGameCard));
  libraryState.set("ready");
  error.set("");
  migrateLegacyCards();
}

function receiveDiscovery(value: unknown) {
  if (value && typeof value === "object" && "progress" in value) {
    const progress = (value as { progress?: unknown }).progress;
    if (isScanProgress(progress)) {
      LayoutAnimation.configureNext({ duration: 500, update: { type: "easeOut", duration: 500 } });
      scanProgress.set(progress);
    }
    return;
  }
  const response = value && typeof value === "object" ? value as { candidates?: unknown; errors?: unknown; error?: unknown; fatal?: unknown } : {};
  const items = Array.isArray(value) ? value : Array.isArray(response.candidates) ? response.candidates : null;
  if (!items) {
    scanState.set("error");
    scanError.set(String(response.error ?? "Не удалось проверить библиотеки игр"));
    reviewDone.set(true);
    return;
  }
  const found = items.filter(isCandidate);
  LayoutAnimation.configureNext({
    duration: 500,
    create: { type: "easeOut", property: "opacity", duration: 500 },
    update: { type: "easeOut", duration: 500 },
    delete: { type: "easeOut", property: "opacity", duration: 500 },
  });
  const failures = Array.isArray(response.errors) ? response.errors.map((entry) => {
    const failure = entry && typeof entry === "object" ? entry as { provider?: unknown; message?: unknown } : {};
    return `${providerLabel(failure.provider)}: ${String(failure.message ?? "ошибка")}`;
  }) : [];
  candidates.set(found);
  scanProgress.set({ provider: "gog", phase: "complete", completed: 3, total: 3, found: found.length });
  if ((response.fatal === true || failures.length === 3) && found.length === 0) {
    scanState.set("error");
    scanError.set(failures.join(" · "));
    scanWarning.set("");
  } else {
    scanState.set("ready");
    scanError.set("");
    scanWarning.set(failures.length ? `Не все библиотеки проверены: ${failures.join(" · ")}` : "");
    startDeck();
  }
  reviewDone.set(true);
}

function receiveImport(value: unknown) {
  const result = value && typeof value === "object" ? value as { ok?: unknown; legacy?: unknown; error?: unknown } : {};
  if (result.ok === true) {
    importError.set("");
    // The review keeps the dialog: its cards report their own errors and the
    // summary stays until the user closes it.
    if (result.legacy === true) void Storage.setItem(legacyCardsKey, "[]");
    else if (!deckTotal()) addOpen.set(false);
  } else {
    importError.set(String(result.error ?? "Не удалось добавить игру в Engine"));
    if (!result.legacy && !deckTotal()) addOpen.set(true);
  }
}

export const gameLibrary = {
  cards,
  candidates,
  libraryState,
  scanState,
  scanProgress,
  scanError,
  scanWarning,
  importError,
  error,
  addOpen,
  metadataChoices,
  receiveMetadata: (value: unknown) => receiveMetadataEvent(value, cards()),
  chooseMetadata: (choice: MetadataChoice) => chooseMetadata(choice, sendCommand),
  setImage: (exePath: string, source: string) => setImageOverride(exePath, source, sendCommand),
  deck,
  deckTotal,
  deckAdded,
  deckSkipped,
  reviewDone,
  bindCommand,
  openAddDialog,
  scanAutomatically: startDiscovery,
  beginManualAdd,
  closeAddDialog: () => addOpen.set(false),
  decideDeck,
  importGames,
  receiveLaunch,
  pendingAdd,
  launchError,
  beginConfirm,
  editPendingTitle,
  cancelConfirm,
  confirmAdd,
  receiveLibrary,
  receiveDiscovery,
  receiveImport,
};

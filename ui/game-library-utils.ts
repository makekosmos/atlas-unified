import type { GameCard, GameCandidate, ScanProgress } from "./game-library-types";

export function visibleGameCards(cards: GameCard[], query: string): GameCard[] {
  const search = query.trim().toLocaleLowerCase();
  return cards.filter((card) => !card.hidden
    && (!search || card.title.toLocaleLowerCase().includes(search) || card.exePath.toLocaleLowerCase().includes(search)));
}

export function pathKey(path: string) {
  return path.replaceAll("/", "\\").toLocaleLowerCase();
}

export function guessTitle(path: string) {
  const name = path.split(/[\\/]/).pop() ?? path;
  return name.replace(/\.(exe|lnk)$/i, "").replaceAll(/[._-]+/g, " ").trim();
}

export function isGameCard(value: unknown): value is GameCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<GameCard>;
  return typeof card.id === "string" && typeof card.title === "string" && typeof card.exePath === "string" && !!card.exePath;
}

export function isCandidate(value: unknown): value is GameCandidate {
  if (!value || typeof value !== "object") return false;
  const game = value as Partial<GameCandidate>;
  return typeof game.title === "string" && typeof game.exePath === "string" && !!game.exePath && typeof game.source === "string";
}

export function isScanProgress(value: unknown): value is ScanProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Partial<ScanProgress>;
  return ["steam", "epic", "gog"].includes(progress.provider ?? "")
    && ["scanning", "complete", "error"].includes(progress.phase ?? "")
    && typeof progress.completed === "number"
    && typeof progress.total === "number"
    && typeof progress.found === "number";
}

export function providerLabel(provider: unknown) {
  if (provider === "steam") return "Steam";
  if (provider === "epic") return "Epic Games";
  if (provider === "gog") return "GOG";
  if (provider === "Engine") return "Engine";
  return "Источник";
}

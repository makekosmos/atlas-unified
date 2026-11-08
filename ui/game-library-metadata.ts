import { signal } from "nsh";
import type { Command, GameCard, MetadataChoice, MetadataChoices } from "./game-library-types";
import { guessTitle } from "./game-library-utils";

export const metadataChoices = signal<MetadataChoices | null>(null);

export function receiveMetadata(value: unknown, cards: GameCard[]) {
  if (!value || typeof value !== "object") return;
  const event = value as { exePath?: unknown; result?: unknown };
  if (typeof event.exePath !== "string" || !event.result || typeof event.result !== "object") return;
  const exePath = event.exePath;
  const result = event.result as { status?: unknown; candidates?: unknown };
  if (result.status !== "ambiguous" || !Array.isArray(result.candidates)) {
    if (metadataChoices()?.exePath === exePath) metadataChoices.set(null);
    return;
  }
  const item = cards.find((card) => card.exePath.toLowerCase() === exePath.toLowerCase());
  const candidates = result.candidates.filter((entry): entry is MetadataChoice => !!entry && typeof entry === "object"
    && typeof (entry as MetadataChoice).provider === "string"
    && typeof (entry as MetadataChoice).providerId === "string"
    && typeof (entry as MetadataChoice).name === "string");
  metadataChoices.set({ exePath, title: item?.title ?? guessTitle(exePath), candidates });
}

export function chooseMetadata(choice: MetadataChoice, sendCommand?: Command) {
  const pending = metadataChoices();
  if (!pending) return;
  sendCommand?.("games.metadata.choose", { exePath: pending.exePath, title: pending.title, provider: choice.provider, providerId: choice.providerId });
  metadataChoices.set(null);
}

export function setImage(exePath: string, source: string, sendCommand?: Command) {
  sendCommand?.("games.metadata.set-image", { exePath, source });
}

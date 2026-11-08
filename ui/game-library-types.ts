export type GameCard = {
  id: string; title: string; exePath: string; hidden: boolean; rating: number | null; note: string;
  description?: string | null; genres?: string[]; released?: string | null; developers?: string[]; publishers?: string[];
  releaseDateText?: string | null; headerImagePath?: string | null; metadataStatus?: string | null;
};
export type GameCandidate = { title: string; exePath: string; installDir: string; source: string; sourceAppId?: string | null };
export type MetadataChoice = { provider: string; providerId: string; name: string; headerImagePath?: string | null };
export type MetadataChoices = { exePath: string; title: string; candidates: MetadataChoice[] };
export type ScanProgress = { provider: "steam" | "epic" | "gog"; phase: "scanning" | "complete" | "error"; completed: number; total: number; found: number; providerFound?: number; aggregate?: boolean };
export type PendingAdd = { path: string; title: string; source: string };
export type LibraryState = "loading" | "ready" | "error";
export type ScanState = "idle" | "scanning" | "ready" | "error";
export type Command = (name: string, args?: unknown) => void;

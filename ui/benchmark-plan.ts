// The checklist the original window draws, and the order the guest window runs.
// One list so the rows and the measurements cannot drift apart.

import type { Route } from "./state";

const PAGE_TITLE: Record<Route, string> = {
  journal: "Дневник",
  notes: "Заметки",
  tasks: "Задачи",
  games: "Игры",
  settings: "Настройки",
};

export type PlanItem =
  | {
      id: string;
      label: string;
      kind: "page";
      route: Route;
      round: number;
    }
  | { id: string; label: string; kind: "library"; notes: number };

export type BenchStageView = {
  id: string;
  label: string;
  firstFrameCallbackMs: number;
  callbackFps?: number;
  generatedMs?: number;
  scrollJumps?: { fraction: number; frameCallbackMs: number }[];
  cpuPeakPercentOfMachine: number | null;
  residentPeakBytes: number | null;
};

export type BenchProgress = {
  status: "running" | "done" | "error";
  current: string | null;
  stages: BenchStageView[];
  summary?: string;
  error?: string;
  report?: unknown;
};

export type BenchStatus = {
  status: string;
  current?: string | null;
  stages?: BenchStageView[];
  summary?: string;
  error?: string;
  reportPath?: string;
  reportText?: string;
};

const PAGES: Route[] = ["journal", "notes", "tasks", "games", "settings"];

export function stagePlan(): PlanItem[] {
  const plan: PlanItem[] = [];
  for (const round of [1, 2]) {
    for (const route of PAGES) {
      plan.push({
        id: `${round}:${route}`,
        label: `${PAGE_TITLE[route]} · проход ${round}`,
        kind: "page",
        route,
        round,
      });
    }
  }
  for (const notes of [10_000, 100_000]) {
    const label = notes.toLocaleString("ru-RU");
    plan.push({
      id: `notes:${notes}`,
      label: `Библиотека · ${label} заметок`,
      kind: "library",
      notes,
    });
  }
  return plan;
}

export function stageView(
  item: PlanItem,
  stage: {
    firstFrameCallbackMs: number;
    callbackFps?: number;
    generatedMs?: number;
    scrollJumps?: { fraction: number; frameCallbackMs: number }[];
    load?: {
      cpuPeakPercentOfMachine: number | null;
      residentPeakBytes: number | null;
    };
  },
): BenchStageView {
  return {
    id: item.id,
    label: item.label,
    firstFrameCallbackMs: stage.firstFrameCallbackMs,
    callbackFps: stage.callbackFps,
    generatedMs: stage.generatedMs,
    scrollJumps: stage.scrollJumps,
    cpuPeakPercentOfMachine: stage.load?.cpuPeakPercentOfMachine ?? null,
    residentPeakBytes: stage.load?.residentPeakBytes ?? null,
  };
}

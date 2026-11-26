// Полный прогон по приложению: тайминги по этапам и нагрузка с нативного
// сэмплера. Живёт отдельно от страницы, потому что прогон длинный и в JS
// держит состояние между этапами (`runBenchmark`, ответы хоста).

import { signal } from "nsh";
import type { Route } from "./state";
import { jumpBenchmarkLibrary } from "./notes";
import {
  formatBytes,
  formatPercent,
  runProbes,
  stageLoad,
  type NativeResources,
  type StageLoad,
} from "./benchmark-load";
import {
  stagePlan,
  stageView,
  type BenchProgress,
  type BenchStageView,
} from "./benchmark-plan";

// One stage of the run: a page visit (with its frames) or a synthetic library.
type Stage = {
  route: string;
  round?: number;
  startedAt: number;
  firstFrameCallbackMs: number;
  frameIntervalsMs?: number[];
  callbackFps?: number;
  syntheticNotes?: number;
  generatedMs?: number;
  scrollJumps?: { fraction: number; frameCallbackMs: number }[];
  load?: StageLoad;
};

export const benchmarkRunning = signal(false);
export const report = signal("");
export const summary = signal("");
let hardwareReply: ((data: unknown) => void) | undefined;
let framesReply: ((data: unknown) => void) | undefined;
let readyReply: (() => void) | undefined;
let activeRun = 0;
// When JS saw each native reply (null: it never came), for a run that lost its
// measurements.
const events: {
  ready: number | null;
  hardware: number | null;
  frames: number | null;
} = {
  ready: null,
  hardware: null,
  frames: null,
};
export type BenchmarkEvent = { runId: number; data: unknown };

export function benchmarkHardware(event: BenchmarkEvent) {
  if (event.runId !== activeRun) return;
  // Recorded because a missing reply is otherwise indistinguishable from a
  // reply the bridge never delivered (`nativeEvents` in the report).
  events.hardware = Date.now();
  readyReply?.();
  hardwareReply?.(event.data);
}
export function benchmarkReady(event: BenchmarkEvent) {
  if (event.runId !== activeRun) return;
  events.ready = Date.now();
  readyReply?.();
}
export function benchmarkFrames(event: BenchmarkEvent) {
  if (event.runId !== activeRun) return;
  events.frames = Date.now();
  framesReply?.(event.data);
}

function frame(): Promise<number> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("No animation frame")),
      3_000,
    );
    requestAnimationFrame((time) => {
      clearTimeout(timeout);
      resolve(time);
    });
  });
}

async function withDeadline<T>(
  promise: Promise<T>,
  milliseconds: number,
  fallback: T,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), milliseconds);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function runBenchmark(options: {
  visit: (route: Route) => void;
  sample: (runId: number) => boolean;
  frames: (runId: number) => void;
  beginFrames: () => void;
  fixture: (size: number) => void;
  version: string;
  onProgress?: (progress: BenchProgress) => void;
}) {
  if (benchmarkRunning()) return;
  benchmarkRunning.set(true);
  report.set("");
  summary.set("");
  const runId = ++activeRun;
  events.ready = null;
  events.hardware = null;
  events.frames = null;
  const ready = new Promise<void>((resolve) => {
    readyReply = resolve;
  });
  let startedAt = Date.now();
  let native = false;
  const hardware = new Promise((resolve) => {
    hardwareReply = resolve;
    native = options.sample(runId);
    if (!native) resolve({ unavailable: "native host unavailable" });
  });
  const stages: Stage[] = [];
  const plan = stagePlan();
  const views: BenchStageView[] = [];
  const publish = (progress: BenchProgress) => {
    try {
      options.onProgress?.(progress);
    } catch {
      /* The checklist is optional: a missed update must not abort the run. */
    }
  };
  try {
    if (native) {
      await withDeadline(ready, 8_000, undefined);
      options.beginFrames();
    }
    startedAt = Date.now();
    for (const item of plan) {
      publish({ status: "running", current: item.id, stages: views.slice() });
      if (item.kind === "page") {
        const start = Date.now();
        options.visit(item.route);
        const first = await frame();
        const firstFrameCallbackMs = Date.now() - start;
        const frameIntervalsMs = [];
        let last = first;
        while (last - first < 350) {
          const next = await frame();
          frameIntervalsMs.push(next - last);
          last = next;
        }
        const stage: Stage = {
          route: item.route,
          round: item.round,
          startedAt: start,
          firstFrameCallbackMs,
          frameIntervalsMs,
          callbackFps: (frameIntervalsMs.length * 1000) / (last - first),
        };
        stages.push(stage);
        views.push(stageView(item, stage));
      } else {
        options.visit("settings");
        await frame();
        const start = Date.now();
        options.fixture(item.notes);
        const generatedMs = Date.now() - start;
        options.visit("notes");
        const layoutStart = Date.now();
        await frame();
        const firstFrameCallbackMs = Date.now() - layoutStart;
        const scrollJumps = [];
        for (const fraction of [0.25, 0.5, 0.95, 0]) {
          const jumpStart = Date.now();
          if (jumpBenchmarkLibrary(fraction)) {
            await frame();
            scrollJumps.push({
              fraction,
              frameCallbackMs: Date.now() - jumpStart,
            });
          }
        }
        const stage: Stage = {
          route: "notes",
          syntheticNotes: item.notes,
          startedAt: start,
          generatedMs,
          firstFrameCallbackMs,
          scrollJumps,
        };
        stages.push(stage);
        views.push(stageView(item, stage));
      }
    }
    const endedAt = Date.now();
    const frames = new Promise((resolve) => {
      framesReply = resolve;
      if (native) options.frames(runId);
      else resolve({ unavailable: "native host unavailable" });
    });
    options.visit("developers");
    const [samples, presentedFrames] = await Promise.all([
      withDeadline(hardware, 30_000, { unavailable: "sampler timed out" }),
      withDeadline(frames, 8_000, { unavailable: "frame profiler timed out" }),
    ]);
    const resources = samples as NativeResources;
    const measured = !!resources.samples?.length;
    // Each stage ends where the next one starts: the sampler's timestamps fall
    // inside those windows, so a page's cost is its own, not the run's average.
    const load = measured
      ? {
          baseline: stageLoad(resources, {
            start: resources.samples![0].at,
            end: stages[0]?.startedAt ?? endedAt,
          }),
          run: runProbes(resources, {
            start: resources.samples![0].at,
            end: endedAt,
          }),
          cadenceMilliseconds: resources.cadenceMilliseconds ?? null,
          peaks: {
            cpuPercentOfMachine: 0,
            residentBytes: 0,
          },
        }
      : null;
    if (load) {
      stages.forEach((stage, index) => {
        const end = stages[index + 1]?.startedAt ?? endedAt;
        stage.load = stageLoad(resources, { start: stage.startedAt, end });
      });
      load.peaks.cpuPercentOfMachine = Math.max(
        ...stages.map((stage) => stage.load?.cpuPeakPercentOfMachine ?? 0),
      );
      load.peaks.residentBytes = Math.max(
        ...stages.map((stage) => stage.load?.residentPeakBytes ?? 0),
      );
    }
    views.splice(
      0,
      views.length,
      ...stages.map((stage, index) => stageView(plan[index], stage)),
    );
    report.set(
      JSON.stringify(
        {
          schema: 2,
          atlasVersion: options.version,
          startedAt,
          endedAt,
          timing:
            "Stage timings use animation callbacks. Presented frames are reported separately by GPUI. Resource timestamps are Unix milliseconds: CPU and memory come from 100 ms process samples (per stage), GPU, disk and free RAM from 3 s CIM probes (run-level; nativeMeasurements.resources.cadenceMilliseconds).",
          stages,
          load,
          nativeMeasurements: {
            resources,
            presentedFrames,
            events: { ...events },
          },
        },
        null,
        2,
      ),
    );
    const seconds = ((endedAt - startedAt) / 1000).toFixed(1);
    const lost = resources.unavailable ?? "нет сэмплов";
    const line = load
      ? `${stages.length} этапов · ${seconds} с · CPU до ${formatPercent(load.peaks.cpuPercentOfMachine)} · RAM до ${formatBytes(load.peaks.residentBytes)}`
      : `${stages.length} этапов · ${seconds} с · нагрузку не измерили: ${lost}`;
    summary.set(line);
    publish({
      status: "done",
      current: null,
      stages: views.slice(),
      summary: line,
      report: JSON.parse(report()),
    });
  } catch (error) {
    const line = String(error);
    report.set(JSON.stringify({ startedAt, stages, error: line }, null, 2));
    publish({
      status: "error",
      current: null,
      stages: views.slice(),
      summary: line,
      error: line,
      report: { startedAt, stages, error: line },
    });
  } finally {
    hardwareReply = undefined;
    framesReply = undefined;
    readyReply = undefined;
    options.fixture(0);
    options.visit("developers");
    benchmarkRunning.set(false);
  }
}

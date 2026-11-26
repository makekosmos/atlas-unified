import { Clipboard, Text, View, signal } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { SettingsRow, SettingsSection } from "./settings";
import { DevelopersSection } from "./dev-settings";
import type { Route } from "./state";
import { jumpBenchmarkLibrary } from "./notes";
import { Glyph } from "./glyph";

export const benchmarkRunning = signal(false);
const report = signal("");
const summary = signal("");
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
  const stages = [];
  try {
    if (native) {
      await withDeadline(ready, 8_000, undefined);
      options.beginFrames();
    }
    startedAt = Date.now();
    for (const round of [1, 2]) {
      for (const route of [
        "journal",
        "notes",
        "tasks",
        "games",
        "settings",
      ] as const) {
        const start = Date.now();
        options.visit(route);
        const first = await frame();
        const firstFrameCallbackMs = Date.now() - start;
        const frameIntervalsMs = [];
        let last = first;
        while (last - first < 350) {
          const next = await frame();
          frameIntervalsMs.push(next - last);
          last = next;
        }
        stages.push({
          route,
          round,
          startedAt: start,
          firstFrameCallbackMs,
          frameIntervalsMs,
          callbackFps: (frameIntervalsMs.length * 1000) / (last - first),
        });
      }
    }
    for (const count of [10_000, 100_000]) {
      options.visit("settings");
      await frame();
      const start = Date.now();
      options.fixture(count);
      const generatedMs = Date.now() - start;
      options.visit("notes");
      const layoutStart = Date.now();
      await frame();
      const firstFrameCallbackMs = Date.now() - layoutStart;
      const scrollJumps = [];
      for (const fraction of [0.25, 0.5, 0.95, 0]) {
        const start = Date.now();
        if (jumpBenchmarkLibrary(fraction)) {
          await frame();
          scrollJumps.push({ fraction, frameCallbackMs: Date.now() - start });
        }
      }
      stages.push({
        route: "notes",
        syntheticNotes: count,
        startedAt: start,
        generatedMs,
        firstFrameCallbackMs,
        scrollJumps,
      });
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
            cpuPercentOfMachine: Math.max(
              ...stages.map(
                (stage) => stage.load?.cpuPeakPercentOfMachine ?? 0,
              ),
            ),
            residentBytes: Math.max(
              ...stages.map((stage) => stage.load?.residentPeakBytes ?? 0),
            ),
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
    summary.set(
      load
        ? `${stages.length} этапов · ${seconds} с · CPU до ${formatPercent(load.peaks.cpuPercentOfMachine)} · RAM до ${formatBytes(load.peaks.residentBytes)}`
        : `${stages.length} этапов · ${seconds} с · нагрузку не измерили: ${lost}`,
    );
  } catch (error) {
    report.set(
      JSON.stringify({ startedAt, stages, error: String(error) }, null, 2),
    );
  } finally {
    hardwareReply = undefined;
    framesReply = undefined;
    readyReply = undefined;
    options.fixture(0);
    options.visit("developers");
    benchmarkRunning.set(false);
  }
}

const supported = [
  {
    title: "Дневник",
    icon: "journal",
    status: "Готово",
    operation: "objects.list",
    params: { typeId: "com.mundus.atlas.journal" },
    example: [{ id: "example", typeId: "com.mundus.atlas.journal" }],
  },
  {
    title: "Заметки",
    icon: "note",
    status: "Готово",
    operation: "objects.list",
    params: { typeId: "core.note" },
    example: [{ id: "example", typeId: "core.note", title: "Заметка" }],
  },
  {
    title: "Задачи",
    icon: "check",
    status: "В разработке",
    operation: "objects.list",
    params: { typeId: "com.mundus.atlas.task" },
    example: [
      { id: "example", typeId: "com.mundus.atlas.task", title: "Задача" },
    ],
  },
  {
    title: "Игры",
    icon: "gamepad",
    status: "В разработке",
    operation: "canonical.game.list",
    params: {},
    example: [],
  },
] as const;

export function DevelopersPage(props: {
  colors: ThemeColors;
  dark: boolean;
  demo: boolean;
  size: number;
  run: () => void;
  stress: (size: number) => void;
  reset: () => void;
}) {
  const expanded = signal("");
  return (
    <View>
      <SettingsSection colors={props.colors} title="Производительность">
        <SettingsRow
          colors={props.colors}
          first
          title={
            benchmarkRunning() ? "Проверка идёт…" : "Запустить полный тест"
          }
          description="Переходы между разделами и открытие библиотек из 10 000 и 100 000 тестовых заметок"
          onPress={props.run}
        />
        {Boolean(report()) && (
          <SettingsRow
            colors={props.colors}
            title="Скопировать отчёт JSON"
            description={summary()}
            onPress={() => void Clipboard.writeText(report())}
          />
        )}
      </SettingsSection>
      {props.demo && (
        <DevelopersSection
          colors={props.colors}
          dark={props.dark}
          size={props.size}
          onStress={props.stress}
          onReset={props.reset}
        />
      )}
      <SettingsSection colors={props.colors} title="Поддерживаемые типы">
        {supported.map((item, index) => (
          <SettingsRow
            colors={props.colors}
            title={item.title}
            first={index === 0}
            leading={
              <Glyph name={item.icon} size={16} color={props.colors.muted} />
            }
            description={
              expanded() === item.title
                ? `${item.operation} ${JSON.stringify(item.params)}\nПример результата: ${JSON.stringify(item.example)}`
                : undefined
            }
            onPress={() =>
              expanded.set(expanded() === item.title ? "" : item.title)
            }
          >
            <Text
              class="rounded-md border px-2 py-1 text-[12px]"
              style={{
                color: props.colors.muted,
                borderColor: props.colors.border,
              }}
            >
              {item.status}
            </Text>
          </SettingsRow>
        ))}
      </SettingsSection>
    </View>
  );
}

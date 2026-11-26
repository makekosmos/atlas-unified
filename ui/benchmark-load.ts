// What the benchmark's Windows sampler said about load, per stage.
//
// The sampler keeps three cadences apart (see `scripts/benchmark-sample.ps1`):
// the cheap process counters every 100 ms, PerfProc IO every second, and the
// GPU/disk counters — CIM queries, hundreds of milliseconds each — every
// three seconds. So CPU and memory are attributed to a stage (a stage lasts
// ~320 ms, three process samples), while GPU, disk and free RAM are
// run-level probes that say what the machine did around the run, not what a
// single page cost.

export type ProcessSample = {
  at: number;
  cpuPercentOfMachine: number | null;
  residentBytes: number;
  privateBytes: number;
  threadCount: number;
  handleCount: number;
};

export type IoSample = {
  at: number;
  readBytesPerSecond: number;
  writeBytesPerSecond: number;
};

export type SystemSample = {
  at: number;
  systemCpuPercent: number | null;
  systemFreeRamBytes: number | null;
  diskReadBytesPerSecond: number | null;
  diskWriteBytesPerSecond: number | null;
  diskBusyPercent: number | null;
  gpuCountersAvailable: boolean;
  gpuEngines: { name: string; utilizationPercent: number | null }[];
  gpuMemory: {
    name: string;
    dedicatedBytes: number | null;
    sharedBytes: number | null;
  }[];
};

export type NativeResources = {
  logicalProcessors?: number;
  cpu?: string[];
  gpu?: string[];
  systemRamBytes?: number;
  cadenceMilliseconds?: { process: number; processIo: number; system: number };
  samples?: ProcessSample[];
  processIoSamples?: IoSample[];
  systemSamples?: SystemSample[];
  unavailable?: string;
};

type Window = { start: number; end: number };

function within<T extends { at: number }>(
  list: T[] | undefined,
  window: Window,
): T[] {
  return (list ?? []).filter(
    (sample) => sample.at >= window.start && sample.at < window.end,
  );
}

function peak(values: (number | null | undefined)[]): number | null {
  const known = values.filter(
    (value): value is number => typeof value === "number",
  );
  return known.length ? Math.max(...known) : null;
}

function lowest(values: (number | null | undefined)[]): number | null {
  const known = values.filter(
    (value): value is number => typeof value === "number",
  );
  return known.length ? Math.min(...known) : null;
}

function mean(values: (number | null | undefined)[]): number | null {
  const known = values.filter(
    (value): value is number => typeof value === "number",
  );
  return known.length
    ? known.reduce((sum, value) => sum + value, 0) / known.length
    : null;
}

const gpuUtilization = (sample: SystemSample) =>
  sample.gpuEngines.reduce(
    (sum, engine) => sum + (engine.utilizationPercent ?? 0),
    0,
  );
const gpuMemory = (sample: SystemSample) =>
  sample.gpuMemory.reduce((sum, entry) => sum + (entry.dedicatedBytes ?? 0), 0);

/// The load of one stage: CPU and memory from the 100 ms samples.
export function stageLoad(resources: NativeResources, window: Window) {
  const process = within(resources.samples, window);
  const io = within(resources.processIoSamples, window);
  return {
    samples: process.length,
    cpuPeakPercentOfMachine: peak(
      process.map((sample) => sample.cpuPercentOfMachine),
    ),
    cpuMeanPercentOfMachine: mean(
      process.map((sample) => sample.cpuPercentOfMachine),
    ),
    residentPeakBytes: peak(process.map((sample) => sample.residentBytes)),
    residentMeanBytes: mean(process.map((sample) => sample.residentBytes)),
    privatePeakBytes: peak(process.map((sample) => sample.privateBytes)),
    threadsPeak: peak(process.map((sample) => sample.threadCount)),
    handlesPeak: peak(process.map((sample) => sample.handleCount)),
    ioReadPeakBytesPerSecond: peak(
      io.map((sample) => sample.readBytesPerSecond),
    ),
    ioWritePeakBytesPerSecond: peak(
      io.map((sample) => sample.writeBytesPerSecond),
    ),
  };
}

export type StageLoad = ReturnType<typeof stageLoad>;

/// What the machine did around the whole run (GPU, disk, free RAM).
export function runProbes(resources: NativeResources, window: Window) {
  const system = within(resources.systemSamples, window);
  return {
    samples: system.length,
    gpuCountersAvailable: system.some((sample) => sample.gpuCountersAvailable),
    gpuUtilizationPeakPercent: peak(system.map(gpuUtilization)),
    gpuMemoryDedicatedPeakBytes: peak(system.map(gpuMemory)),
    systemCpuPeakPercent: peak(system.map((sample) => sample.systemCpuPercent)),
    systemFreeRamMinBytes: lowest(
      system.map((sample) => sample.systemFreeRamBytes),
    ),
    diskBusyPeakPercent: peak(system.map((sample) => sample.diskBusyPercent)),
    diskReadPeakBytesPerSecond: peak(
      system.map((sample) => sample.diskReadBytesPerSecond),
    ),
    diskWritePeakBytesPerSecond: peak(
      system.map((sample) => sample.diskWriteBytesPerSecond),
    ),
  };
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  const megabytes = bytes / (1024 * 1024);
  if (megabytes < 1) return `${Math.round(bytes / 1024)} КБ`;
  if (megabytes < 1024) return `${Math.round(megabytes)} МБ`;
  return `${(megabytes / 1024).toFixed(1)} ГБ`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`;
}

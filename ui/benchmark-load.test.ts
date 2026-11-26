import { expect, test } from "nsh/test";
import {
  formatBytes,
  runProbes,
  stageLoad,
  type NativeResources,
} from "./benchmark-load";

// Two stages of a run: `journal` occupies [1000, 1300), `notes` [1300, 1600).
const resources: NativeResources = {
  cadenceMilliseconds: { process: 100, processIo: 1000, system: 3000 },
  samples: [
    {
      at: 800,
      cpuPercentOfMachine: 2,
      residentBytes: 100,
      privateBytes: 50,
      threadCount: 10,
      handleCount: 40,
    },
    {
      at: 1000,
      cpuPercentOfMachine: 10,
      residentBytes: 200,
      privateBytes: 90,
      threadCount: 12,
      handleCount: 44,
    },
    {
      at: 1100,
      cpuPercentOfMachine: 40,
      residentBytes: 300,
      privateBytes: 100,
      threadCount: 14,
      handleCount: 45,
    },
    {
      at: 1200,
      cpuPercentOfMachine: 20,
      residentBytes: 260,
      privateBytes: 95,
      threadCount: 13,
      handleCount: 44,
    },
    {
      at: 1300,
      cpuPercentOfMachine: 5,
      residentBytes: 900,
      privateBytes: 700,
      threadCount: 40,
      handleCount: 90,
    },
    {
      at: 1400,
      cpuPercentOfMachine: 15,
      residentBytes: 1200,
      privateBytes: 1000,
      threadCount: 42,
      handleCount: 92,
    },
    {
      at: 1500,
      cpuPercentOfMachine: null,
      residentBytes: 1100,
      privateBytes: 900,
      threadCount: 41,
      handleCount: 91,
    },
  ],
  processIoSamples: [
    { at: 1100, readBytesPerSecond: 0, writeBytesPerSecond: 4096 },
    { at: 1400, readBytesPerSecond: 8192, writeBytesPerSecond: 0 },
  ],
  systemSamples: [
    {
      at: 1000,
      systemCpuPercent: 30,
      systemFreeRamBytes: 8_000,
      diskReadBytesPerSecond: 0,
      diskWriteBytesPerSecond: 0,
      diskBusyPercent: 4,
      gpuCountersAvailable: true,
      gpuEngines: [
        { name: "a", utilizationPercent: 12 },
        { name: "b", utilizationPercent: 8 },
      ],
      gpuMemory: [{ name: "a", dedicatedBytes: 100_000, sharedBytes: 0 }],
    },
    {
      at: 1400,
      systemCpuPercent: 55,
      systemFreeRamBytes: 6_000,
      diskReadBytesPerSecond: 1024,
      diskWriteBytesPerSecond: 0,
      diskBusyPercent: 30,
      gpuCountersAvailable: true,
      gpuEngines: [{ name: "a", utilizationPercent: 40 }],
      gpuMemory: [{ name: "a", dedicatedBytes: 300_000, sharedBytes: 0 }],
    },
  ],
};

test("a stage's load is its own window, not the run's average", () => {
  const journal = stageLoad(resources, { start: 1000, end: 1300 });
  expect(journal.samples).toBe(3);
  expect(journal.cpuPeakPercentOfMachine).toBe(40);
  expect(journal.cpuMeanPercentOfMachine).toBe(70 / 3);
  expect(journal.residentPeakBytes).toBe(300);
  expect(journal.ioWritePeakBytesPerSecond).toBe(4096);
  expect(journal.ioReadPeakBytesPerSecond).toBe(0);

  const notes = stageLoad(resources, { start: 1300, end: 1600 });
  expect(notes.samples).toBe(3);
  // A sample the sampler could not price (the first tick after its start) is
  // skipped, not counted as zero.
  expect(notes.cpuPeakPercentOfMachine).toBe(15);
  expect(notes.residentPeakBytes).toBe(1200);
  expect(notes.threadsPeak).toBe(42);
  expect(notes.ioReadPeakBytesPerSecond).toBe(8192);
});

test("the run probes report the peak GPU, the lowest free RAM and disk use", () => {
  const run = runProbes(resources, { start: 800, end: 1600 });
  expect(run.samples).toBe(2);
  expect(run.gpuUtilizationPeakPercent).toBe(40);
  expect(run.gpuMemoryDedicatedPeakBytes).toBe(300_000);
  expect(run.systemCpuPeakPercent).toBe(55);
  expect(run.systemFreeRamMinBytes).toBe(6_000);
  expect(run.diskBusyPeakPercent).toBe(30);
});

test("a run without a sampler reports no numbers instead of zeros", () => {
  const empty: NativeResources = { unavailable: "sampler timed out" };
  expect(stageLoad(empty, { start: 0, end: 100 }).cpuPeakPercentOfMachine).toBe(
    null,
  );
  expect(stageLoad(empty, { start: 0, end: 100 }).residentPeakBytes).toBe(null);
  expect(
    runProbes(empty, { start: 0, end: 100 }).gpuUtilizationPeakPercent,
  ).toBe(null);
  expect(formatBytes(null)).toBe("—");
  expect(formatBytes(1024 * 1024)).toBe("1 МБ");
  expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 ГБ");
});

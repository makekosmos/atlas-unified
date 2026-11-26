// The window that started the run. The guest Atlas is the other window; this
// one only shows where the run is and what each stage measured.

import { Clipboard, Scroll, Text, View, effect, signal } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { formatBytes, formatPercent } from "./benchmark-load";
import {
  stagePlan,
  type BenchStageView,
  type BenchStatus,
} from "./benchmark-plan";
import { Glyph } from "./glyph";

export const benchPanel = signal(false);
export const benchStatus = signal<BenchStatus | null>(null);
export const benchReport = signal("");
export const benchError = signal("");
const spin = signal(0);
const expanded = signal("");
const frames = ["◐", "◓", "◑", "◒"];

export function applyDock(event: { ok?: boolean; error?: string }) {
  if (!event.ok) {
    benchError.set(event.error || "Не удалось открыть окно проверки");
    return;
  }
  benchError.set("");
  benchReport.set("");
  benchStatus.set({ status: "running", stages: [] });
  benchPanel.set(true);
}

export function applyStatus(event: BenchStatus) {
  if (event.reportText) benchReport.set(event.reportText);
  benchStatus.set(event);
}

export function closeBenchPanel() {
  benchPanel.set(false);
}

function detail(stage: BenchStageView) {
  const lines = [`Первый кадр: ${Math.round(stage.firstFrameCallbackMs)} мс`];
  if (typeof stage.callbackFps === "number") {
    lines.push(`Кадры: ${Math.round(stage.callbackFps)} в секунду`);
  }
  if (typeof stage.generatedMs === "number") {
    lines.push(`Подготовка списка: ${Math.round(stage.generatedMs)} мс`);
  }
  if (stage.scrollJumps?.length) {
    lines.push(
      `Прокрутка: ${stage.scrollJumps
        .map(
          (jump) =>
            `${Math.round(jump.fraction * 100)}% ${Math.round(jump.frameCallbackMs)} мс`,
        )
        .join(", ")}`,
    );
  }
  if (stage.cpuPeakPercentOfMachine !== null) {
    lines.push(`CPU: ${formatPercent(stage.cpuPeakPercentOfMachine)}`);
  }
  if (stage.residentPeakBytes !== null) {
    lines.push(`Память: ${formatBytes(stage.residentPeakBytes)}`);
  }
  return lines.join("\n");
}

export function BenchmarkPanel(props: {
  colors: ThemeColors;
  ask: (name: string) => void;
  onDismiss: () => void;
}) {
  effect(() => {
    props.ask("benchmark.status");
    const poll = setInterval(() => props.ask("benchmark.status"), 400);
    const ticker = setInterval(
      () => spin.set((spin() + 1) % frames.length),
      160,
    );
    return () => {
      clearInterval(poll);
      clearInterval(ticker);
    };
  });
  const status = benchStatus();
  const running = !status || status.status === "running";
  const done = new Map(
    (status?.stages ?? []).map((stage) => [stage.id, stage]),
  );
  const colors = props.colors;
  return (
    <Scroll class="min-h-0 flex-1">
      <View style={{ padding: 20, gap: 14 }}>
        <View class="flex-row items-center" style={{ gap: 10 }}>
          {running && (
            <Text style={{ color: colors.accent, fontSize: 18, width: 22 }}>
              {frames[spin()]}
            </Text>
          )}
          <View class="min-w-0 flex-1">
            <Text style={{ color: colors.foreground, fontSize: 18 }}>
              {running ? "Идёт проверка" : "Проверка"}
            </Text>
            <Text
              class="text-[12px]"
              style={{ color: colors.muted, marginTop: 2 }}
            >
              {status?.error ||
                status?.summary ||
                "Отдельное окно на временных данных. Здесь только этапы."}
            </Text>
          </View>
        </View>
        <View
          class="rounded-xl border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          {stagePlan().map((item, index) => {
            const stage = done.get(item.id);
            const state = stage
              ? "done"
              : status?.current === item.id
                ? "running"
                : "pending";
            const open = expanded() === item.id && !!stage;
            return (
              <View
                key={item.id}
                onPress={() => {
                  if (!stage) return;
                  expanded.set(open ? "" : item.id);
                }}
                role="button"
                accessibilityLabel={`${item.label}: ${state === "done" ? "готово" : state === "running" ? "сейчас" : "ожидает"}`}
                style={{
                  paddingLeft: 14,
                  paddingRight: 14,
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderColor: colors.border,
                  cursor: stage ? "pointer" : "default",
                }}
              >
                <View class="flex-row items-center" style={{ gap: 10 }}>
                  <View
                    class="items-center justify-center"
                    style={{ width: 18, height: 18 }}
                  >
                    {state === "running" && (
                      <Text style={{ color: colors.accent, fontSize: 16 }}>
                        {frames[spin()]}
                      </Text>
                    )}
                    {state === "done" && (
                      <Glyph name="check" size={14} color={colors.accent} />
                    )}
                    {state === "pending" && (
                      <View
                        class="rounded-full border"
                        style={{
                          width: 8,
                          height: 8,
                          borderColor: colors.border,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    class="min-w-0 flex-1"
                    style={{
                      color:
                        state === "pending" ? colors.muted : colors.foreground,
                      fontSize: 14,
                    }}
                  >
                    {item.label}
                  </Text>
                  {stage && (
                    <Text class="text-[12px]" style={{ color: colors.muted }}>
                      {Math.round(stage.firstFrameCallbackMs)} мс
                    </Text>
                  )}
                </View>
                {open && stage && (
                  <Text
                    class="text-[12px]"
                    style={{
                      color: colors.muted,
                      marginTop: 8,
                      marginLeft: 28,
                    }}
                  >
                    {detail(stage)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        {status?.reportPath && (
          <Text class="text-[12px]" style={{ color: colors.muted }}>
            {status.reportPath}
          </Text>
        )}
        <View class="flex-row" style={{ gap: 8 }}>
          <View
            onPress={props.onDismiss}
            role="button"
            accessibilityLabel={running ? "Остановить" : "Закрыть"}
            class="rounded-lg border px-3 py-2"
            style={{ borderColor: colors.border, cursor: "pointer" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 13 }}>
              {running ? "Остановить" : "Закрыть"}
            </Text>
          </View>
          {benchReport() !== "" && (
            <View
              onPress={() => void Clipboard.writeText(benchReport())}
              role="button"
              accessibilityLabel="Скопировать отчёт JSON"
              class="rounded-lg border px-3 py-2"
              style={{ borderColor: colors.border, cursor: "pointer" }}
            >
              <Text style={{ color: colors.foreground, fontSize: 13 }}>
                Скопировать JSON
              </Text>
            </View>
          )}
        </View>
      </View>
    </Scroll>
  );
}

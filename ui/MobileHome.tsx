import { Text, View } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
type Mode = "home" | "fadeInStart" | "fadeIn" | "fadeOut" | "hidden";

export function MobileHome(props: {
  colors: ThemeColors;
  mode: () => Mode;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
}) {
  const mode = () => props.mode();
  const hidden = () => mode() === "hidden";
  const inactive = () => hidden() || mode() === "fadeInStart" || mode() === "fadeIn";
  const diaryColor = () => props.colors.background === "#0d0c10" ? "rgba(251, 146, 60, 0.7)" : "rgba(194, 65, 12, 0.7)";
  const transitioning = () => mode() !== "home";
  return <View class="h-full w-full" pointerEvents={inactive() ? "none" : undefined} style={{ display: hidden() ? "none" : "flex", position: transitioning() ? "absolute" : undefined, left: transitioning() ? 0 : undefined, top: transitioning() ? 0 : undefined, right: transitioning() ? 0 : undefined, bottom: transitioning() ? 0 : undefined, zIndex: transitioning() ? 100 : undefined, backgroundColor: props.colors.background, opacity: mode() === "fadeOut" || mode() === "fadeInStart" ? 0 : 1, transitionProperty: "opacity", transitionDuration: 65, transitionTimingFunction: "ease-in-out" }}>
    <View class="h-14 flex-row items-center justify-between px-3">
      <Text class="min-w-0 flex-1 text-[20px] font-semibold" style={{ color: props.colors.foreground }}>Атлас</Text>
      <View onPress={props.onOpenSettings} role="button" accessibilityLabel="Настройки" class="h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: props.colors.border, backgroundColor: props.colors.card }}>
        <Text class="text-[20px]" style={{ color: props.colors.foreground }}>⚙</Text>
      </View>
    </View>
    <View class="min-h-0 flex-1 items-stretch justify-start px-3 pt-3">
      <View onPress={props.onOpenJournal} role="button" accessibilityLabel="Открыть дневник" class="w-full max-w-[460px] flex-row items-center gap-4 rounded-xl border p-5" style={{ borderColor: diaryColor(), backgroundColor: diaryColor() }}>
        <Text class="text-[28px]" style={{ color: "#ffffff" }}>▤</Text><View class="min-w-0 flex-1"><Text class="text-[17px] font-medium" style={{ color: "#ffffff" }}>Дневник</Text></View>
      </View>
    </View>
  </View>;
}

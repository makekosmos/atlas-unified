import { Text, View } from "nsh";
import { Button as SharedButton } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";

/// The one modal shell of the app, after MonoCode's GPUI `modal.rs`: a dimmed
/// page, a 16px card with a hairline rule, a 15/600 title, an optional back
/// step, and a footer rule. A press anywhere outside the card closes it.
export function Modal(props: { title: string; colors: ThemeColors; onDismiss: () => void; children: any; footer?: any; onBack?: () => void; width?: number }) {
  return <View class="absolute inset-0 items-center justify-center px-6">
    <View onPress={props.onDismiss} accessibilityLabel="Закрыть окно" role="button" class="absolute inset-0" style={{ backgroundColor: "#00000059" }} />
    <View class="z-10 flex-col rounded-[16px] border" style={{ width: props.width ?? 420, borderColor: props.colors.border, backgroundColor: props.colors.card }} role="none">
      <View class="w-full flex-row items-center px-5 pb-3 pt-5" style={{ gap: 6 }}>
        {props.onBack && <View onPress={props.onBack} role="button" accessibilityLabel="Шаг назад" class="h-6 w-6 items-center justify-center rounded-md" hoverStyle={{ backgroundColor: props.colors.background }}>
          <Text class="text-[14px]" style={{ color: props.colors.muted }}>←</Text>
        </View>}
        <Text class="flex-1 text-[15px] font-semibold" style={{ color: props.colors.foreground }}>{props.title}</Text>
        <View onPress={props.onDismiss} role="button" accessibilityLabel="Закрыть карточку" class="h-6 w-6 items-center justify-center rounded-md" hoverStyle={{ backgroundColor: props.colors.background }}>
          <Text class="text-[13px]" style={{ color: props.colors.muted }}>✕</Text>
        </View>
      </View>
      <View class="w-full px-5 pb-5">{props.children}</View>
      {props.footer && <View class="flex-row items-center justify-between border-t px-5 py-3" style={{ borderColor: props.colors.border, gap: 12 }}>{props.footer}</View>}
    </View>
  </View>;
}

export function modalNote(colors: ThemeColors, text: string) {
  return <Text class="text-[12px] leading-[18px]" style={{ color: colors.muted }}>{text}</Text>;
}

/// Footer actions shared by every modal, so their look never drifts.
export function ModalGhost(props: { label: string; colors: ThemeColors; onPress: () => void }) {
  return <SharedButton label={props.label} colors={props.colors} onPress={props.onPress} className="border-0 px-0 py-0" style={{ backgroundColor: "transparent", borderColor: "transparent" }} />;
}

export function ModalPrimary(props: { label: string; colors: ThemeColors; onPress: () => void }) {
  return <SharedButton label={props.label} colors={props.colors} onPress={props.onPress} selected className="h-9 items-center justify-center px-3 py-0" style={{ backgroundColor: props.colors.accent, borderColor: "transparent" }} textColor={props.colors.background} />;
}

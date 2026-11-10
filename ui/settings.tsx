import { Scroll, Text, View, signal, nativeComponent } from "nsh";
import { Popover } from "nsh/base";
import { PageScroll, SectionTitle } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { hoverWash } from "./chrome";
import { WIDGETS, widgetOn, toggleWidget } from "./widgets";

const openSelect = signal<string | null>(null);

/// Imago's own settings switch: geometry, travel, marks and the macOS haptic
/// tick come from the host, the palette from the props below.
const NativeToggle = nativeComponent<
  { checked: boolean; disabled: boolean; label: string; accent: string; foreground: string; surface: string },
  { change: { checked: boolean } }
>("atlas.toggle", {
  props: ["checked", "disabled", "label", "accent", "foreground", "surface"],
  events: ["change"],
});

/// Settings primitives the shared imago-nsh kit has no shape for yet: a page
/// column, a group of rows and a drop-down. They wear the kit's tokens
/// (`SectionTitle`, colors, hover wash) so a screen that uses them matches the
/// rest of the app; the switch is imago's own, through `atlas.toggle`.


/** Whether the palette paints on a dark background, for the hover wash. */
export function darkColors(colors: ThemeColors) {
  const n = Number.parseInt(colors.background.replace("#", ""), 16);
  if (Number.isNaN(n)) return true;
  const y = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return y < 128;
}

/** The scrolling page every settings screen opens with: one column, centered. */
export function SettingsPage(props: { colors: ThemeColors; children: any }) {
  return <PageScroll colors={props.colors}>
    <View class="mx-auto w-full max-w-[660px]">{props.children}</View>
  </PageScroll>;
}

/** A titled group of rows: the rounded card a settings page is built from. */
export function SettingsSection(props: { colors: ThemeColors; title: string; note?: string; children: any }) {
  return <View style={{ marginBottom: 22 }}>
    <SectionTitle colors={props.colors}>{props.title}</SectionTitle>
    {props.note ? <Text class="mb-2 text-[12px]" style={{ color: props.colors.muted }}>{props.note}</Text> : null}
    <View class="rounded-xl border" style={{ backgroundColor: props.colors.card, borderColor: props.colors.border }}>{props.children}</View>
  </View>;
}

/**
 * One line of a group: a label, an optional description, and the control on
 * the right. `first` drops the divider the row above would draw.
 */
export function SettingsRow(props: { colors: ThemeColors; title: string; description?: string; first?: boolean; onPress?: () => void; accessibilityLabel?: string; children?: any }) {
  const colors = props.colors;
  const body = <View class="flex-row items-center" style={{ gap: 16, paddingLeft: 14, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderTopWidth: props.first ? 0 : 1, borderColor: colors.border }}>
    <View class="min-w-0 flex-1">
      <Text class="text-[13px]" style={{ color: colors.foreground }}>{props.title}</Text>
      {props.description ? <Text class="text-[12px]" style={{ color: colors.muted, marginTop: 2 }}>{props.description}</Text> : null}
    </View>
    {props.children}
  </View>;
  if (!props.onPress) return body;
  return <View onPress={props.onPress} role="button" accessibilityLabel={props.accessibilityLabel ?? props.title} hoverStyle={{ backgroundColor: hoverWash(darkColors(colors)) }} style={{ cursor: "pointer" }}>{body}</View>;
}

/** A switch: imago's `Toggle`, so the press ticks and the look matches. */
export function Toggle(props: { colors: ThemeColors; label: string; on: boolean; onPress: () => void; disabled?: boolean }) {
  const colors = props.colors;
  // The switch is a host view: it draws at imago's 44.8 x 28.8 and does not
  // report that size to the layout, so the box is reserved here. Without it the
  // row placed the switch on its edge and half of it hung out of the card.
  return <View class="shrink-0 items-center justify-center" style={{ width: 45, height: 29 }}>
    <NativeToggle
      style={{ width: 44.8, height: 28.8 }}
      checked={props.on}
      disabled={!!props.disabled}
      label={props.label}
      accent={colors.accent}
      foreground={colors.foreground}
      surface={colors.card}
      onChange={() => props.onPress()}
    />
  </View>;
}

/// Which widgets the sidebar shows: one row per type, a switch on each. A
/// widget is a type of thing the app can open, so turning one off hides its
/// page and leaves its data alone.
export function WidgetsSection(props: { colors: ThemeColors }) {
  return <SettingsSection colors={props.colors} title="Виджеты" note="Какие типы показывать в боковой панели. Хотя бы один остаётся">
    {WIDGETS.map((widget, index) => <SettingsRow colors={props.colors} title={widget.label} description={widget.description} first={index === 0}>
      <Toggle colors={props.colors} label={widget.label} on={widgetOn(widget.id)} onPress={() => toggleWidget(widget.id)} />
    </SettingsRow>)}
  </SettingsSection>;
}

/** A drop-down: the trigger is a row, the list opens under it. */
export function SettingsSelect(props: { id: string; colors: ThemeColors; label: string; value: string; options: { value: string; label: string }[]; onSelect: (value: string) => void; width?: number; disabled?: boolean }) {
  const colors = props.colors;
  const width = props.width ?? 140;
  const expanded = openSelect() === props.id;
  const trigger = <View role="button" accessibilityLabel={props.label} accessibilityState={{ expanded, disabled: !!props.disabled }} class="h-8 flex-row items-center justify-between rounded-lg border" hoverStyle={{ backgroundColor: hoverWash(darkColors(colors)) }} style={{ width, paddingLeft: 10, paddingRight: 9, backgroundColor: colors.background, borderColor: expanded ? colors.accent : colors.border, opacity: props.disabled ? 0.6 : 1, cursor: props.disabled ? "default" : "pointer" }}>
    <Text class="text-[12px]" style={{ color: colors.foreground }}>{props.options.find((option) => option.value === props.value)?.label ?? props.value}</Text>
    <Text class="text-[9px]" style={{ color: colors.muted }}>{expanded ? "▲" : "▼"}</Text>
  </View>;
  if (props.disabled) return <View style={{ width }}>{trigger}</View>;
  return <View style={{ width }}><Popover open={expanded} onOpenChange={(next) => openSelect.set(next ? props.id : null)} placement="bottom" align="end" offset={4} margin={8} trigger={trigger} popupClass="rounded-xl border p-1" popupStyle={{ width, backgroundColor: colors.card, borderColor: colors.border }}>
    <Scroll accessibilityLabel="Варианты выбора" style={{ height: Math.min(props.options.length * 30, 240) }}>
      {props.options.map((option) => <View onPress={() => { props.onSelect(option.value); openSelect.set(null); }} role="option" accessibilityState={{ selected: option.value === props.value }} class="h-8 flex-row items-center gap-2 rounded-lg px-2" hoverStyle={{ backgroundColor: hoverWash(darkColors(colors)) }} style={{ cursor: "pointer" }}>
        <Text class="flex-1 text-[12px]" style={{ color: colors.foreground }}>{option.label}</Text>
        {option.value === props.value ? <Text class="text-[12px]" style={{ color: colors.accent }}>✓</Text> : null}
      </View>)}
    </Scroll>
  </Popover></View>;
}

/** A set of pills where exactly one is chosen. */
export function SettingsSegments(props: { colors: ThemeColors; value: string; options: { value: string; label: string }[]; onSelect: (value: string) => void; disabled?: boolean }) {
  const colors = props.colors;
  return <View class="flex-row flex-wrap items-center" style={{ gap: 6 }}>
    {props.options.map((option) => {
      const selected = option.value === props.value;
      return <View onPress={props.disabled ? undefined : () => props.onSelect(option.value)} role="button" accessibilityLabel={option.label} accessibilityState={{ selected, disabled: !!props.disabled }} class="h-7 shrink-0 flex-row items-center justify-center rounded-md border" hoverStyle={{ backgroundColor: hoverWash(darkColors(colors)) }} style={{ paddingLeft: 10, paddingRight: 10, backgroundColor: selected ? colors.card : colors.background, borderColor: selected ? colors.accent : colors.border, opacity: props.disabled ? 0.6 : 1, cursor: props.disabled ? "default" : "pointer" }}>
        <Text class="text-[12px]" style={{ color: selected ? colors.foreground : colors.muted }}>{option.label}</Text>
      </View>;
    })}
  </View>;
}

/** A key binding, drawn as the chip a user presses to rebind it. */
export function KeyChip(props: { colors: ThemeColors; label: string; accessibilityLabel?: string; onPress?: () => void; muted?: boolean }) {
  const colors = props.colors;
  const pressable = !!props.onPress;
  return <View onPress={pressable ? props.onPress : undefined} role={pressable ? "button" : undefined} accessibilityLabel={pressable ? props.accessibilityLabel : undefined} class="h-7 shrink-0 flex-row items-center justify-center rounded-md border" hoverStyle={pressable ? { backgroundColor: hoverWash(darkColors(colors)) } : undefined} style={{ paddingLeft: 9, paddingRight: 9, backgroundColor: colors.background, borderColor: colors.border, cursor: pressable ? "pointer" : "default" }}>
    <Text class="text-[12px]" style={{ color: props.muted ? colors.muted : colors.accent }}>{props.label}</Text>
  </View>;
}

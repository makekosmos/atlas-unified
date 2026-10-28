import { Scroll, Text, View, signal, keymap } from "nsh";
import { Popover } from "nsh/base";
import type { Appearance, ThemeColors } from "@makekosmos/imago-nsh";
import { hoverWash } from "./chrome";
import { accentMark, previewThemes, systemAccent, systemAccents } from "./themes";

type ShortcutName = "sidebar" | "create" | "search" | "reload";
type Selector = "fontSize" | null;

const openSelector = signal<Selector>(null);
const modePreviews: { value: Appearance["settings"]["mode"]; label: string }[] = [
  { value: "system", label: "Система" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];
const materialLabels: Record<string, string> = { default: "Сплошной", frosted: "Стекло", mica: "Системный" };
const fontSizes = [12, 13, 14, 15, 16, 18];

export function AtlasAppearanceSettings(props: {
  appearance: () => Appearance | undefined;
  editable: () => boolean;
  colors: () => ThemeColors;
  shortcuts: Record<ShortcutName, string>;
  onPatch: (patch: Record<string, unknown>) => void;
  onChangeShortcut: (name: ShortcutName) => void;
}) {
  const appearance = () => props.appearance();
  const settings = () => appearance()?.settings;
  const colors = () => props.colors();
  const canEdit = () => props.editable() || !appearance()?.policy.following;
  const patch = (values: Record<string, unknown>) => {
    if (canEdit() && appearance()) props.onPatch(values);
  };
  const dark = appearance()?.settings.mode !== "light";
  const wash = hoverWash(dark);
  const heading = (label: string) => <Text class="mb-2 px-2 text-[13px]" style={{ color: colors().muted }}>{label}</Text>;
  const card = (selected: boolean, label: string, onPress: () => void) => (
    <View onPress={canEdit() ? onPress : undefined} role="button" accessibilityState={{ selected, disabled: !canEdit() }} class="items-center justify-center rounded-lg border" hoverStyle={{ backgroundColor: wash }} style={{ height: 32, paddingLeft: 12, paddingRight: 12, backgroundColor: selected ? colors().card : colors().background, borderColor: selected ? colors().accent : colors().border, opacity: canEdit() ? 1 : 0.65, cursor: canEdit() ? "pointer" : "default" }}>
      <Text class="text-[12px]" hoverStyle={{ color: colors().foreground }} style={{ color: selected ? colors().foreground : colors().muted }}>{label}</Text>
    </View>
  );
  const select = (id: Exclude<Selector, null>, value: string, options: { value: string; label: string }[], onSelect: (value: string) => void, width: number) => {
    const expanded = openSelector() === id;
    const trigger = <View role="button" accessibilityLabel="Выбрать размер текста" accessibilityState={{ expanded, disabled: !canEdit() }} class="h-8 flex-row items-center justify-between rounded-lg border" hoverStyle={{ backgroundColor: wash }} style={{ paddingLeft: 12, paddingRight: 8, backgroundColor: colors().card, borderColor: expanded ? colors().accent : colors().border, opacity: canEdit() ? 1 : 0.65, cursor: canEdit() ? "pointer" : "default" }}>
      <Text class="text-[12px]" style={{ color: colors().foreground }}>{options.find((option) => option.value === value)?.label ?? value}</Text>
      <Text class="text-[11px]" style={{ color: colors().muted }}>{expanded ? "⌃" : "⌄"}</Text>
    </View>;
    return <View style={{ width }}>
      {canEdit() ? <Popover open={expanded} onOpenChange={(next) => openSelector.set(next ? id : null)} placement="bottom" align="end" offset={4} margin={8} trigger={trigger} popupClass="rounded-xl border p-1" popupStyle={{ width, backgroundColor: colors().card, borderColor: colors().border }}>
        <Scroll accessibilityLabel="Варианты выбора" style={{ height: Math.min(options.length * 32, 256) }}>
          {options.map((option) => <View onPress={() => { onSelect(option.value); openSelector.set(null); }} role="button" accessibilityState={{ selected: option.value === value }} class="h-8 flex-row items-center gap-2 rounded-lg px-2" hoverStyle={{ backgroundColor: wash }} style={{ cursor: "pointer" }}>
            <Text class="flex-1 text-[12px]" style={{ color: colors().foreground }}>{option.label}</Text>
            {option.value === value && <Text class="text-[12px]" style={{ color: colors().accent }}>✓</Text>}
          </View>)}
        </Scroll>
      </Popover> : trigger}
    </View>;
  };
  const shortcutRow = (name: ShortcutName, label: string) => (
    <View class="min-h-[52px] flex-row items-center gap-4 border-b py-3" style={{ borderColor: colors().border }}>
      <Text class="flex-1 text-[13px]" style={{ color: colors().foreground }}>{label}</Text>
      <View onPress={() => props.onChangeShortcut(name)} role="button" accessibilityLabel={`Изменить сочетание: ${label}`} class="items-center justify-center" hoverStyle={{ backgroundColor: wash }} style={{ height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 8, backgroundColor: colors().background, cursor: "pointer" }}>
        <Text class="text-[12px]" style={{ color: colors().accent }}>{keymap.label(props.shortcuts[name])}</Text>
      </View>
    </View>
  );

  if (!settings() || !appearance()) return <Scroll class="min-h-0 flex-1 px-7 pt-4 pb-8"><Text class="text-[13px]" style={{ color: colors().muted }}>Загружаем настройки внешнего вида…</Text></Scroll>;
  const current = () => settings()!;
  const modePalette = (mode: Appearance["settings"]["mode"]) => {
    if (mode === "system") return colors();
    const darkMode = mode === "dark";
    const theme = previewThemes[0];
    const base = darkMode ? theme.dark : theme.light;
    const custom = current().accent_source === "custom" ? systemAccent(current().accent_color, darkMode) : undefined;
    return { ...base, accent: custom ?? base.accent };
  };
  const modeCard = (mode: { value: Appearance["settings"]["mode"]; label: string }) => {
    const palette = () => modePalette(mode.value);
    return <View onPress={() => patch({ mode: mode.value })} role="button" accessibilityState={{ selected: current().mode === mode.value, disabled: !canEdit() }} class="min-w-0 flex-1" hoverStyle={{ opacity: canEdit() ? 0.85 : 0.65 }} style={{ opacity: canEdit() ? 1 : 0.65, cursor: canEdit() ? "pointer" : "default" }}>
    <View class="h-[148px] items-center justify-center overflow-hidden rounded-md border p-3" style={{ borderColor: current().mode === mode.value ? colors().accent : palette().border, backgroundColor: palette().background }}>
      <View class="h-full w-full flex-row overflow-hidden rounded-md border" style={{ borderColor: palette().border, backgroundColor: palette().card }}>
        <View class="w-1/3 gap-2 border-r p-2" style={{ borderColor: palette().border }}><View class="h-2 rounded" style={{ backgroundColor: palette().accent }} /><View class="h-1.5 rounded" style={{ backgroundColor: palette().muted }} /><View class="h-1.5 rounded" style={{ backgroundColor: palette().border }} /></View>
        <View class="flex-1 gap-2 p-2"><View class="h-2 w-1/2 rounded" style={{ backgroundColor: palette().muted }} /><View class="h-9 rounded" style={{ backgroundColor: palette().background }} /><View class="h-1.5 w-2/3 rounded" style={{ backgroundColor: palette().border }} /></View>
      </View>
    </View>
    <Text class="mt-2 text-center text-[12px]" style={{ color: current().mode === mode.value ? colors().accent : colors().muted }}>{mode.label}</Text>
  </View>;
  };

  return <Scroll class="min-h-0 flex-1 px-7 pt-4 pb-8" style={{ backgroundColor: colors().background }}>
    <View class="mx-auto w-full max-w-[720px]">
      <Text class="mb-5 px-2 text-[22px] font-semibold" style={{ color: colors().foreground }}>Оформление</Text>
      {appearance()?.policy.following && <Text class="mb-4 px-2 text-[12px]" style={{ color: colors().accent }}>Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.</Text>}
      {!props.editable() && !appearance()?.policy.following && <Text class="mb-4 px-2 text-[12px]" style={{ color: colors().muted }}>Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.</Text>}

      {heading("Режим")}
      <View class="mb-8 flex-row gap-4">{modePreviews.map(modeCard)}</View>

      {heading("Акцент")}
      <View class="mb-8 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="gap-2 py-3">
          {[systemAccents.slice(0, 6), systemAccents.slice(6)].map((row) => <View class="flex-row flex-wrap items-center gap-2">
            {row.map((accent) => {
              const shown = () => appearance()?.settings.mode !== "light" ? accent.dark : accent.light;
              const selected = () => {
                const stored = current().accent_color?.toLowerCase();
                return current().accent_source === "custom"
                  ? stored === accent.light || stored === accent.dark || accent.legacy.includes(stored ?? "")
                  : current().accent_source !== "wallpaper" && accent.key === "blue";
              };
              const label = () => appearance()?.settings.mode !== "light" && accent.darkName ? accent.darkName : accent.name;
              return <View onPress={() => patch({ accent_source: "custom", accent_color: accent.light })} role="button" accessibilityLabel={`Акцент ${label()}`} accessibilityState={{ selected: selected() }} class="h-7 w-7 items-center justify-center rounded-full border" hoverStyle={{ opacity: 0.85 }} style={{ backgroundColor: shown(), borderColor: selected() ? accentMark(shown()) : "transparent", cursor: "pointer" }}>{selected() && <Text class="text-[12px]" style={{ color: accentMark(shown()) }}>✓</Text>}</View>;
            })}
          </View>)}
          {appearance()?.capabilities.wallpaper_accent && card(current().accent_source === "wallpaper", "Обои", () => patch({ accent_source: "wallpaper" }))}
        </View>
      </View>

      {heading("Стекло")}
      <View class="mb-8 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="min-h-[60px] flex-row flex-wrap items-center gap-4 py-3">
          <Text class="min-w-[160px] flex-1 text-[13px]" style={{ color: colors().foreground }}>Материал окна</Text>
          <View class="flex-row flex-wrap items-center gap-2">{(appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current().material, (next) => patch({ material: next }), colors(), canEdit(), dark))}</View>
        </View>
      </View>

      {heading("Размер текста")}
      <View class="mb-8 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="min-h-[60px] flex-row flex-wrap items-center gap-4 py-3">
          <Text class="min-w-[160px] flex-1 text-[13px]" style={{ color: colors().foreground }}>Размер интерфейсного текста</Text>
          {select("fontSize", String(current().font_size), [...new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({ value: String(size), label: `${size} px` })), (value) => patch({ font_size: Number(value) }), 128)}
        </View>
      </View>

      {heading("Горячие клавиши")}
      <View class="rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        {shortcutRow("sidebar", "Боковая панель — открыть/скрыть")}
        {shortcutRow("create", "Новая задача — панель справа")}
        {shortcutRow("search", "Быстрый поиск")}
        {shortcutRow("reload", "Обновить данные из Engine")}
        <View class="h-10 flex-row items-center"><Text class="flex-1 text-[13px]" style={{ color: colors().foreground }}>Закрыть панель / поиск</Text><Text class="text-[12px]" style={{ color: colors().muted }}>Esc</Text></View>
      </View>
    </View>
  </Scroll>;
}

function selectLabel(material: string, label: string, selected: string, onPress: (value: string) => void, colors: ThemeColors, editable: boolean, dark: boolean) {
  return <View onPress={editable ? () => onPress(material) : undefined} role="button" accessibilityState={{ selected: selected === material, disabled: !editable }} class="items-center justify-center rounded-lg border" hoverStyle={{ backgroundColor: hoverWash(dark) }} style={{ height: 32, paddingLeft: 12, paddingRight: 12, backgroundColor: selected === material ? colors.card : colors.background, borderColor: selected === material ? colors.accent : colors.border, opacity: editable ? 1 : 0.65, cursor: editable ? "pointer" : "default" }}><Text class="text-[12px]" hoverStyle={{ color: colors.foreground }} style={{ color: selected === material ? colors.foreground : colors.muted }}>{label}</Text></View>;
}



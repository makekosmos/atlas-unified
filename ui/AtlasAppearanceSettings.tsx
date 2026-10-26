import { Scroll, Text, View, signal, keymap } from "nsh";
import { accentChoices } from "@makekosmos/imago-nsh";
import type { Appearance, ThemeChoice, ThemeColors } from "@makekosmos/imago-nsh";

type ShortcutName = "sidebar" | "create" | "search" | "reload";
type Selector = "light" | "dark" | "fontSize" | null;

const openSelector = signal<Selector>(null);
const modePreviews: { value: string; label: string }[] = [
  { value: "system", label: "Система" },
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];
const materialLabels: Record<string, string> = { default: "Сплошной", frosted: "Стекло", mica: "Системный" };
const fontSizes = [12, 13, 14, 15, 16, 18];

export function AtlasAppearanceSettings(props: {
  appearance?: Appearance;
  editable: boolean;
  themes: ThemeChoice[];
  colors: ThemeColors;
  shortcuts: Record<ShortcutName, string>;
  onPatch: (patch: Record<string, unknown>) => void;
  onChangeShortcut: (name: ShortcutName) => void;
}) {
  const appearance = () => props.appearance;
  const settings = () => appearance()?.settings;
  const colors = () => props.colors;
  const patch = (values: Record<string, unknown>) => {
    if (props.editable) props.onPatch(values);
  };
  const heading = (label: string) => <Text class="mb-2 text-[12px]" style={{ color: colors().muted }}>{label}</Text>;
  const card = (selected: boolean, label: string, onPress: () => void) => (
    <View onPress={props.editable ? onPress : undefined} role="button" accessibilityState={{ selected, disabled: !props.editable }} class="rounded-lg border px-2.5 py-2" style={{ backgroundColor: selected ? colors().card : colors().background, borderColor: selected ? colors().accent : colors().border, opacity: props.editable ? 1 : 0.65 }}>
      <Text class="text-[12px]" style={{ color: selected ? colors().foreground : colors().muted }}>{label}</Text>
    </View>
  );
  const select = (id: Exclude<Selector, null>, value: string, options: { value: string; label: string }[], onSelect: (value: string) => void, width: number, preview?: boolean, menuWidth = width) => {
    const expanded = openSelector() === id;
    return <View class="relative" style={{ width }}>
      <View onPress={() => props.editable && openSelector.set(expanded ? null : id)} role="button" accessibilityState={{ expanded, disabled: !props.editable }} class="h-8 flex-row items-center justify-between rounded-lg border px-2.5" style={{ backgroundColor: colors().card, borderColor: expanded ? colors().accent : colors().border, opacity: props.editable ? 1 : 0.65 }}>
        <View class="min-w-0 flex-1 flex-row items-center gap-2">
          {preview && <View class="h-4 w-5 rounded border" style={{ backgroundColor: paletteSample(value, id === "light" ? "light" : "dark").background, borderColor: colors().border }}><View class="h-1 w-full" style={{ backgroundColor: paletteSample(value, id === "light" ? "light" : "dark").accent }} /></View>}
          <Text class="text-[12px]" style={{ color: colors().foreground }}>{options.find((option) => option.value === value)?.label ?? value}</Text>
        </View>
        <Text class="text-[11px]" style={{ color: colors().muted }}>{expanded ? "⌃" : "⌄"}</Text>
      </View>
      {expanded && <View class="absolute left-0 top-9 z-20 rounded-xl border p-1" style={{ width: menuWidth, backgroundColor: colors().card, borderColor: colors().border }}>
        {options.map((option) => <View onPress={() => { onSelect(option.value); openSelector.set(null); }} role="button" accessibilityState={{ selected: option.value === value }} class="h-8 flex-row items-center gap-2 rounded-md px-2">
          {preview && <View class="h-4 w-5 rounded border" style={{ backgroundColor: paletteSample(option.value, id === "light" ? "light" : "dark").background, borderColor: colors().border }}><View class="h-1 w-full" style={{ backgroundColor: paletteSample(option.value, id === "light" ? "light" : "dark").accent }} /></View>}
          <Text class="flex-1 text-[12px]" style={{ color: colors().foreground }}>{option.label}</Text>
          {option.value === value && <Text class="text-[12px]" style={{ color: colors().accent }}>✓</Text>}
        </View>)}
      </View>}
    </View>;
  };
  const shortcutRow = (name: ShortcutName, label: string) => (
    <View class="h-10 flex-row items-center border-b" style={{ borderColor: colors().border }}>
      <Text class="flex-1 text-[13px]" style={{ color: colors().foreground }}>{label}</Text>
      <View onPress={() => props.onChangeShortcut(name)} role="button" accessibilityLabel={`Изменить сочетание: ${label}`} class="rounded-md px-3 py-1" style={{ backgroundColor: colors().background }}>
        <Text class="text-[12px]" style={{ color: colors().accent }}>{keymap.label(props.shortcuts[name])}</Text>
      </View>
    </View>
  );

  if (!settings() || !appearance()) return <Scroll class="min-h-0 flex-1 px-7 pt-4 pb-8"><Text class="text-[13px]" style={{ color: colors().muted }}>Загружаем настройки внешнего вида…</Text></Scroll>;
  const current = settings()!;
  const modeCard = (mode: { value: string; label: string }) => <View onPress={() => patch({ mode: mode.value })} role="button" accessibilityState={{ selected: current.mode === mode.value, disabled: !props.editable }} class="min-w-0 flex-1" style={{ opacity: props.editable ? 1 : 0.65 }}>
    <View class="h-[148px] items-center justify-center overflow-hidden rounded-md border p-3" style={{ borderColor: current.mode === mode.value ? colors().accent : colors().border, backgroundColor: mode.value === "light" ? "#f5f4f1" : mode.value === "dark" ? "#211f26" : colors().card }}>
      <View class="h-full w-full flex-row overflow-hidden rounded-md border" style={{ borderColor: mode.value === "light" ? "#dedce0" : "#3b3940", backgroundColor: mode.value === "light" ? "#fff" : "#17151b" }}>
        <View class="w-1/3 gap-2 border-r p-2" style={{ borderColor: mode.value === "light" ? "#dedce0" : "#3b3940" }}><View class="h-2 rounded" style={{ backgroundColor: colors().accent }} /><View class="h-1.5 rounded" style={{ backgroundColor: mode.value === "light" ? "#d5d2d8" : "#4b4850" }} /><View class="h-1.5 rounded" style={{ backgroundColor: mode.value === "light" ? "#e3e1e5" : "#38353d" }} /></View>
        <View class="flex-1 gap-2 p-2"><View class="h-2 w-1/2 rounded" style={{ backgroundColor: mode.value === "light" ? "#d5d2d8" : "#4b4850" }} /><View class="h-9 rounded" style={{ backgroundColor: mode.value === "light" ? "#f0eef2" : "#28252d" }} /><View class="h-1.5 w-2/3 rounded" style={{ backgroundColor: mode.value === "light" ? "#e3e1e5" : "#38353d" }} /></View>
      </View>
    </View>
    <Text class="mt-2 text-center text-[12px]" style={{ color: current.mode === mode.value ? colors().accent : colors().muted }}>{mode.label}</Text>
  </View>;

  return <Scroll class="min-h-0 flex-1 px-7 pt-4 pb-8" style={{ backgroundColor: colors().background }}>
    <View class="mx-auto w-full max-w-[720px]">
      <Text class="mb-5 text-[22px] font-semibold" style={{ color: colors().foreground }}>Оформление</Text>
      {appearance()?.policy.following && <Text class="mb-4 text-[12px]" style={{ color: colors().accent }}>Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.</Text>}
      {!props.editable && !appearance()?.policy.following && <Text class="mb-4 text-[12px]" style={{ color: colors().accent }}>Настройки внешнего вида сейчас недоступны.</Text>}

      {heading("Режим")}
      <View class="mb-6 flex-row gap-4">{modePreviews.map(modeCard)}</View>

      {heading("Темы")}
      <View class="mb-6 gap-2 rounded-xl border p-3" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="h-10 flex-row items-center justify-between border-b" style={{ borderColor: colors().border }}>
          <Text class="text-[12px]" style={{ color: colors().foreground }}>Светлая тема</Text>
          {select("light", current.light_theme, props.themes.map((theme) => ({ value: theme.key, label: theme.name })), (value) => patch({ light_theme: value }), 218, true, 260)}
        </View>
        <View class="h-10 flex-row items-center justify-between">
          <Text class="text-[12px]" style={{ color: colors().foreground }}>Тёмная тема</Text>
          {select("dark", current.dark_theme, props.themes.map((theme) => ({ value: theme.key, label: theme.name })), (value) => patch({ dark_theme: value }), 218, true, 260)}
        </View>
      </View>

      {heading("Акцент")}
      <View class="mb-6 rounded-xl border p-3" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="mb-3 flex-row gap-2">
          {card(current.accent_source === "theme", "Цвет темы", () => patch({ accent_source: "theme", accent_color: null }))}
          {card(current.accent_source === "custom", "Свой цвет", () => patch({ accent_source: "custom", accent_color: current.accent_color ?? accentChoices[0] }))}
          {appearance()?.capabilities.wallpaper_accent && card(current.accent_source === "wallpaper", "Обои", () => patch({ accent_source: "wallpaper" }))}
        </View>
        <View class="flex-row gap-2">{accentChoices.map((accent) => <View onPress={() => patch({ accent_source: "custom", accent_color: accent })} role="button" accessibilityLabel={`Акцент ${accent}`} accessibilityState={{ selected: current.accent_source === "custom" && current.accent_color?.toLowerCase() === accent }} class="h-7 w-7 items-center justify-center rounded-lg border" style={{ backgroundColor: accent, borderColor: current.accent_color?.toLowerCase() === accent ? colors().foreground : colors().border }}>{current.accent_color?.toLowerCase() === accent && <Text class="text-[12px]" style={{ color: "#ffffff" }}>✓</Text>}</View>)}</View>
      </View>

      {heading("Стекло")}
      <View class="mb-6 flex-row gap-2">{(appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current.material, (next) => patch({ material: next }), colors(), props.editable))}</View>

      {heading("Размер текста")}
      <View class="mb-6 flex-row items-center gap-3">
        <Text class="flex-1 text-[12px]" style={{ color: colors().muted }}>Размер интерфейсного текста</Text>
        {select("fontSize", String(current.font_size), [...new Set([...fontSizes, current.font_size])].sort((a, b) => a - b).map((size) => ({ value: String(size), label: `${size} px` })), (value) => patch({ font_size: Number(value) }), 128)}
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

function selectLabel(material: string, label: string, selected: string, onPress: (value: string) => void, colors: ThemeColors, editable: boolean) {
  return <View onPress={editable ? () => onPress(material) : undefined} role="button" accessibilityState={{ selected: selected === material, disabled: !editable }} class="rounded-lg border px-3 py-2" style={{ backgroundColor: selected === material ? colors.card : colors.background, borderColor: selected === material ? colors.accent : colors.border, opacity: editable ? 1 : 0.65 }}><Text class="text-[12px]" style={{ color: selected === material ? colors.foreground : colors.muted }}>{label}</Text></View>;
}

function paletteSample(key: string, mode: "light" | "dark") {
  const palettes: Record<string, { light: [string, string]; dark: [string, string] }> = {
    default: { light: ["#f8f7f9", "#7239ca"], dark: ["#0d0c10", "#af94f9"] },
    claude: { light: ["#faf9f5", "#c96442"], dark: ["#262624", "#d97757"] },
    graphite: { light: ["#f0f0f0", "#606060"], dark: ["#1a1a1a", "#a0a0a0"] },
  };
  const [background, accent] = (palettes[key] ?? palettes.default)[mode];
  return { background, accent };
}

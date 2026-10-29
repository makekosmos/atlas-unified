import { keymap, Scroll, Text, View, signal } from "nsh";
import type { Appearance, ThemeColors } from "@makekosmos/imago-nsh";
import type { AtlasTheme, SyncSnapshot } from "./state";

type ShortcutName = "sidebar" | "create" | "search" | "reload";
type Selector = "fontSize" | null;

const openSelector = signal<Selector>(null);
const modePreviews: { value: "light" | "dark"; label: string }[] = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
];
const modePickerOpen = signal(false);
const modePickerClosing = signal(false);
let modePickerTimer: number | undefined;
const materialLabels: Record<string, string> = { default: "Сплошной", frosted: "Стекло", mica: "Системный" };
const fontSizes = [12, 13, 14, 15, 16, 18];

function showModePicker() {
  modePickerClosing.set(false);
  if (modePickerTimer !== undefined) clearTimeout(modePickerTimer);
  modePickerOpen.set(true);
}

function hideModePicker() {
  modePickerClosing.set(true);
  if (modePickerTimer !== undefined) clearTimeout(modePickerTimer);
  modePickerTimer = setTimeout(() => {
    modePickerOpen.set(false);
    modePickerClosing.set(false);
    modePickerTimer = undefined;
  }, 160);
}

export function AtlasAppearanceSettings(props: {
  appearance: () => Appearance | undefined;
  editable: () => boolean;
  themes: AtlasTheme[];
  colors: () => ThemeColors;
  shortcuts: Record<ShortcutName, string>;
  onPatch: (patch: Record<string, unknown>) => void;
  onChangeShortcut: (name: ShortcutName) => void;
  connection?: SyncSnapshot;
  onConnections?: () => void;
  mobile?: boolean;
}) {
  const appearance = () => props.appearance();
  const settings = () => appearance()?.settings;
  const colors = () => props.colors();
  const canEdit = () => props.editable() || !appearance()?.policy.following;
  const patch = (values: Record<string, unknown>) => {
    if (canEdit() && appearance()) props.onPatch(values);
  };
  const heading = (label: string) => <Text class="mb-2 px-2 text-[13px]" style={{ color: colors().muted }}>{label}</Text>;
  const select = (id: Exclude<Selector, null>, value: string, options: { value: string; label: string }[], onSelect: (value: string) => void, width: number) => {
    const expanded = openSelector() === id;
    return <View style={{ width }}>
      <View onPress={() => canEdit() && openSelector.set(expanded ? null : id)} role="button" accessibilityLabel="Выбрать размер текста" accessibilityState={{ expanded, disabled: !canEdit() }} class="h-9 flex-row items-center justify-between rounded-lg border px-3" style={{ backgroundColor: colors().card, borderColor: expanded ? colors().accent : colors().border, opacity: canEdit() ? 1 : 0.65 }}>
        <Text class="text-[12px]" style={{ color: colors().foreground }}>{options.find((option) => option.value === value)?.label ?? value}</Text>
        <Text class="text-[11px]" style={{ color: colors().muted }}>{expanded ? "⌃" : "⌄"}</Text>
      </View>
      {expanded && <View class="mt-1 rounded-xl border p-1" style={{ backgroundColor: colors().card, borderColor: colors().border }}>{options.map((option) => <View onPress={() => { onSelect(option.value); openSelector.set(null); }} role="button" accessibilityState={{ selected: option.value === value }} class="h-9 flex-row items-center gap-2 rounded-md px-2"><Text class="flex-1 text-[12px]" style={{ color: colors().foreground }}>{option.label}</Text>{option.value === value && <Text class="text-[12px]" style={{ color: colors().accent }}>✓</Text>}</View>)}</View>}
    </View>;
  };
  const shortcutRow = (name: ShortcutName, label: string) => (
    <View class="min-h-[52px] flex-row items-center gap-4 border-b py-3" style={{ borderColor: colors().border }}>
      <Text class="flex-1 text-[13px]" style={{ color: colors().foreground }}>{label}</Text>
      <View onPress={() => props.onChangeShortcut(name)} role="button" accessibilityLabel={`Изменить сочетание: ${label}`} class="rounded-md px-3 py-1" style={{ backgroundColor: colors().background }}>
        <Text class="text-[12px]" style={{ color: colors().accent }}>{keymap.label(props.shortcuts[name])}</Text>
      </View>
    </View>
  );

  if (!settings() || !appearance()) return <Scroll class={`min-h-0 flex-1 ${props.mobile ? "px-4" : "px-7"} pt-4 pb-8`}><Text class="text-[13px]" style={{ color: colors().muted }}>Загружаем настройки внешнего вида…</Text></Scroll>;
  const current = () => settings()!;
  if (props.mobile) {
    const selectedMode = () => current().mode === "light" ? "light" : "dark";
    const selectedLabel = () => selectedMode() === "light" ? "Светлая" : "Тёмная";
    return <View class="relative min-h-0 flex-1" style={{ backgroundColor: colors().background }}>
    <Scroll class="min-h-0 flex-1 px-3 pt-2 pb-8" style={{ backgroundColor: colors().background }}>
      <Text class="mb-2 px-3 text-[13px]" style={{ color: colors().muted }}>Синхронизация</Text>
      <View onPress={props.onConnections} role="button" accessibilityLabel="Открыть подключения" class="mb-5 min-h-[62px] flex-row items-center gap-3 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="h-2 w-2 rounded-full" style={{ backgroundColor: props.connection?.peers.some((peer) => peer.status === "online") ? "#22c55e" : props.connection?.running ? "#facc15" : "#ef4444" }} />
        <View class="flex-1">
          <Text class="text-[14px]" style={{ color: colors().foreground }}>Устройства и подключение</Text>
          <Text class="text-[12px]" style={{ color: colors().muted }}>{!props.connection ? "Проверяем подключение…" : props.connection.peers.some((peer) => peer.status === "online") ? "Устройство в сети" : props.connection.running ? "Ожидает подключения" : "Синхронизация остановлена"}</Text>
        </View>
        <Text class="text-[18px]" style={{ color: colors().muted }}>›</Text>
      </View>
      <Text class="mb-2 px-3 text-[13px]" style={{ color: colors().muted }}>Отображение</Text>
      <View class="mb-5 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View onPress={() => canEdit() && showModePicker()} role="button" accessibilityLabel="Выбрать тему оформления" class="min-h-[58px] flex-row items-center gap-3">
          <Text class="flex-1 text-[14px]" style={{ color: colors().foreground }}>Тема</Text>
          <Text class="text-[13px]" style={{ color: colors().muted }}>{selectedLabel()}</Text>
          <Text class="text-[18px]" style={{ color: colors().muted }}>›</Text>
        </View>
      </View>
      {heading("Размер текста")}
      <View class="mb-5 rounded-xl border px-4 py-2" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="min-h-[50px] flex-row items-center gap-3"><Text class="flex-1 text-[14px]" style={{ color: colors().foreground }}>Размер интерфейсного текста</Text>{select("fontSize", String(current().font_size), [...new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({ value: String(size), label: `${size} px` })), (value) => patch({ font_size: Number(value) }), 92)}</View>
      </View>
    </Scroll>
    {modePickerOpen() && <View class="absolute inset-0 items-center justify-center px-7" style={{ backgroundColor: "rgba(0,0,0,0.42)", opacity: modePickerClosing() ? 0 : 1, transitionProperty: "opacity", transitionDuration: 160 }}>
      <View onPress={hideModePicker} class="absolute inset-0" accessibilityLabel="Закрыть выбор темы" />
      <View class="z-10 w-full max-w-[340px] rounded-2xl border p-2" style={{ backgroundColor: colors().card, borderColor: colors().border, opacity: modePickerClosing() ? 0 : 1, transform: [{ translateY: modePickerClosing() ? 12 : 0 }, { scale: modePickerClosing() ? 0.96 : 1 }], transitionProperty: "opacity, transform", transitionDuration: 180, transitionTimingFunction: "ease-out" }}>
        <Text class="px-3 pt-2 pb-1 text-[14px] font-semibold" style={{ color: colors().foreground }}>Тема оформления</Text>
        {modePreviews.map((mode, index) => <View onPress={() => { patch({ mode: mode.value }); hideModePicker(); }} role="radio" accessibilityState={{ selected: selectedMode() === mode.value, disabled: !canEdit() }} class={`min-h-[52px] flex-row items-center gap-3 rounded-xl px-3 ${index ? "mt-1" : ""}`} style={{ backgroundColor: selectedMode() === mode.value ? colors().background : "transparent", opacity: canEdit() ? 1 : 0.65 }}>
          <View class="h-5 w-5 items-center justify-center rounded-full border-2" style={{ borderColor: selectedMode() === mode.value ? colors().accent : colors().muted }}>{selectedMode() === mode.value && <View class="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors().accent }} />}</View>
          <Text class="flex-1 text-[14px]" style={{ color: colors().foreground }}>{mode.label}</Text>
        </View>)}
      </View>
    </View>}
    </View>;
  }
  const modePalette = (mode: Appearance["settings"]["mode"]) => {
    if (mode === "system") return colors();
    const themeKey = mode === "light" ? current().light_theme : current().dark_theme;
    const theme = props.themes.find((item) => item.key === themeKey);
    return (mode === "light" ? theme?.light : theme?.dark) ?? colors();
  };
  const modeCard = (mode: { value: Appearance["settings"]["mode"]; label: string }) => {
    const palette = modePalette(mode.value);
    return <View onPress={() => patch({ mode: mode.value })} role="button" accessibilityState={{ selected: current().mode === mode.value, disabled: !canEdit() }} class="min-w-0 flex-1" style={{ opacity: canEdit() ? 1 : 0.65 }}>
    <View class={`${props.mobile ? "h-[104px] p-2" : "h-[148px] p-3"} items-center justify-center overflow-hidden rounded-md border`} style={{ borderColor: current().mode === mode.value ? colors().accent : palette.border, backgroundColor: palette.background }}>
      <View class="h-full w-full flex-row overflow-hidden rounded-md border" style={{ borderColor: palette.border, backgroundColor: palette.card }}>
        <View class="w-1/3 gap-2 border-r p-2" style={{ borderColor: palette.border }}><View class="h-2 rounded" style={{ backgroundColor: palette.accent }} /><View class="h-1.5 rounded" style={{ backgroundColor: palette.muted }} /><View class="h-1.5 rounded" style={{ backgroundColor: palette.border }} /></View>
        <View class="flex-1 gap-2 p-2"><View class="h-2 w-1/2 rounded" style={{ backgroundColor: palette.muted }} /><View class="h-9 rounded" style={{ backgroundColor: palette.background }} /><View class="h-1.5 w-2/3 rounded" style={{ backgroundColor: palette.border }} /></View>
      </View>
    </View>
    <Text class="mt-2 text-center text-[12px]" style={{ color: current().mode === mode.value ? colors().accent : colors().muted }}>{mode.label}</Text>
  </View>;
  };

  return <Scroll class={`min-h-0 flex-1 ${props.mobile ? "px-4" : "px-7"} pt-4 pb-8`} style={{ backgroundColor: colors().background }}>
    <View class="mx-auto w-full max-w-[720px]">
      <Text class="mb-5 px-2 text-[22px] font-semibold" style={{ color: colors().foreground }}>Оформление</Text>
      {appearance()?.policy.following && <Text class="mb-4 px-2 text-[12px]" style={{ color: colors().accent }}>Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.</Text>}
      {!props.editable() && !appearance()?.policy.following && <Text class="mb-4 px-2 text-[12px]" style={{ color: colors().muted }}>Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.</Text>}

      {heading("Режим")}
      <View class="mb-8 flex-row gap-4">{modePreviews.map(modeCard)}</View>

      {heading("Стекло")}
      <View class="mb-8 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="min-h-[60px] flex-row flex-wrap items-center gap-4 py-3">
          <Text class="min-w-[160px] flex-1 text-[13px]" style={{ color: colors().foreground }}>Материал окна</Text>
          <View class="flex-row flex-wrap items-center gap-2">{(appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current().material, (next) => patch({ material: next }), colors(), canEdit()))}</View>
        </View>
      </View>

      {heading("Размер текста")}
      <View class="mb-8 rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        <View class="min-h-[60px] flex-row flex-wrap items-center gap-4 py-3">
          <Text class="min-w-[160px] flex-1 text-[13px]" style={{ color: colors().foreground }}>Размер интерфейсного текста</Text>
          {select("fontSize", String(current().font_size), [...new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({ value: String(size), label: `${size} px` })), (value) => patch({ font_size: Number(value) }), 128)}
        </View>
      </View>

      {!props.mobile && heading("Горячие клавиши")}
      {!props.mobile && <View class="rounded-xl border px-4" style={{ backgroundColor: colors().card, borderColor: colors().border }}>
        {shortcutRow("sidebar", "Боковая панель — открыть/скрыть")}
        {shortcutRow("create", "Новая задача — панель справа")}
        {shortcutRow("search", "Быстрый поиск")}
        {shortcutRow("reload", "Обновить данные из Engine")}
        <View class="h-10 flex-row items-center"><Text class="flex-1 text-[13px]" style={{ color: colors().foreground }}>Закрыть панель / поиск</Text><Text class="text-[12px]" style={{ color: colors().muted }}>Esc</Text></View>
      </View>}
    </View>
  </Scroll>;
}

function selectLabel(material: string, label: string, selected: string, onPress: (value: string) => void, colors: ThemeColors, editable: boolean) {
  return <View onPress={editable ? () => onPress(material) : undefined} role="button" accessibilityState={{ selected: selected === material, disabled: !editable }} class="rounded-lg border px-3 py-2" style={{ backgroundColor: selected === material ? colors.card : colors.background, borderColor: selected === material ? colors.accent : colors.border, opacity: editable ? 1 : 0.65 }}><Text class="text-[12px]" style={{ color: selected === material ? colors.foreground : colors.muted }}>{label}</Text></View>;
}

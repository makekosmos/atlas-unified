import { Text, View, keymap } from "nsh";
import type { Appearance, ThemeColors } from "@makekosmos/imago-nsh";
import { SectionTitle } from "@makekosmos/imago-nsh";
import { KeyChip, SettingsRow, SettingsSection, SettingsSegments, SettingsSelect, Toggle } from "./settings";
import { accentMark, previewThemes, systemAccent, systemAccents } from "./themes";

type ShortcutName = "sidebar" | "create" | "search" | "reload";

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

  if (!settings() || !appearance()) return <View class="px-7 pt-4"><Text class="text-[13px]" style={{ color: colors().muted }}>Загружаем настройки внешнего вида…</Text></View>;
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
    const selected = current().mode === mode.value;
    return <View onPress={() => patch({ mode: mode.value })} role="button" accessibilityLabel={mode.label} accessibilityState={{ selected, disabled: !canEdit() }} class="min-w-0 flex-1" hoverStyle={{ opacity: canEdit() ? 0.85 : 0.65 }} style={{ opacity: canEdit() ? 1 : 0.65, cursor: canEdit() ? "pointer" : "default" }}>
      <View class="items-center justify-center overflow-hidden rounded-lg border p-2.5" style={{ height: 104, borderColor: selected ? colors().accent : palette().border, backgroundColor: palette().background }}>
        <View class="h-full w-full flex-row overflow-hidden rounded-md border" style={{ borderColor: palette().border, backgroundColor: palette().card }}>
          <View class="w-1/3 gap-2 border-r p-2" style={{ borderColor: palette().border }}><View class="h-2 rounded" style={{ backgroundColor: palette().accent }} /><View class="h-1.5 rounded" style={{ backgroundColor: palette().muted }} /><View class="h-1.5 rounded" style={{ backgroundColor: palette().border }} /></View>
          <View class="flex-1 gap-2 p-2"><View class="h-2 w-1/2 rounded" style={{ backgroundColor: palette().muted }} /><View class="h-6 rounded" style={{ backgroundColor: palette().background }} /><View class="h-1.5 w-2/3 rounded" style={{ backgroundColor: palette().border }} /></View>
        </View>
      </View>
      <Text class="mt-1.5 text-center text-[12px]" style={{ color: selected ? colors().accent : colors().muted }}>{mode.label}</Text>
    </View>;
  };

  const swatch = (accent: (typeof systemAccents)[number]) => {
    const shown = () => current().mode !== "light" ? accent.dark : accent.light;
    const selected = () => {
      const stored = current().accent_color?.toLowerCase();
      return current().accent_source === "custom"
        ? stored === accent.light || stored === accent.dark || accent.legacy.includes(stored ?? "")
        : current().accent_source !== "wallpaper" && accent.key === "blue";
    };
    const label = () => current().mode !== "light" && accent.darkName ? accent.darkName : accent.name;
    return <View onPress={() => patch({ accent_source: "custom", accent_color: accent.light })} role="button" accessibilityLabel={`Акцент ${label()}`} accessibilityState={{ selected: selected(), disabled: !canEdit() }} class="h-6 w-6 shrink-0 items-center justify-center rounded-full border" hoverStyle={{ opacity: 0.85 }} style={{ backgroundColor: shown(), borderColor: selected() ? accentMark(shown()) : "transparent", opacity: canEdit() ? 1 : 0.6, cursor: canEdit() ? "pointer" : "default" }}>
      {selected() ? <Text class="text-[11px]" style={{ color: accentMark(shown()) }}>✓</Text> : null}
    </View>;
  };

  return <View>
    {appearance()?.policy.following ? <Text class="mb-4 text-[12px]" style={{ color: colors().accent }}>Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.</Text> : null}
    {!props.editable() && !appearance()?.policy.following ? <Text class="mb-4 text-[12px]" style={{ color: colors().muted }}>Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.</Text> : null}

    <SectionTitle colors={colors()}>Тема</SectionTitle>
    <View class="mb-5 flex-row gap-3">{modePreviews.map(modeCard)}</View>

    <SettingsSection colors={colors()} title="Акцент">
      <SettingsRow colors={colors()} title="Цвет акцента" description="Из системной палитры" first>
        <View class="flex-row flex-wrap items-center" style={{ gap: 6 }}>{systemAccents.map(swatch)}</View>
      </SettingsRow>
      {appearance()?.capabilities.wallpaper_accent ? <SettingsRow colors={colors()} title="Акцент с обоев" description="Цвет берётся с фона рабочего стола">
        <Toggle colors={colors()} label="Акцент с обоев" on={current().accent_source === "wallpaper"} disabled={!canEdit()} onPress={() => patch(current().accent_source === "wallpaper" ? { accent_source: "system" } : { accent_source: "wallpaper" })} />
      </SettingsRow> : null}
    </SettingsSection>

    <SettingsSection colors={colors()} title="Окно">
      <SettingsRow colors={colors()} title="Материал окна" description="Чем рисуется фон под содержимым" first>
        <SettingsSegments colors={colors()} value={current().material} disabled={!canEdit()} options={(appearance()?.capabilities.materials ?? []).map((material) => ({ value: material, label: materialLabels[material] ?? material }))} onSelect={(next) => patch({ material: next })} />
      </SettingsRow>
      <SettingsRow colors={colors()} title="Размер текста" description={`Размер интерфейсного текста · ${current().font_size} px`}>
        {SettingsSelect({ id: "font-size", colors: colors(), label: "Выбрать размер текста", disabled: !canEdit(), width: 120, value: String(current().font_size), options: [...new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({ value: String(size), label: `${size} px` })), onSelect: (value) => patch({ font_size: Number(value) }) })}
      </SettingsRow>
    </SettingsSection>

    <SettingsSection colors={colors()} title="Горячие клавиши" note="Нажмите на сочетание, чтобы сменить его.">
      <SettingsRow colors={colors()} title="Боковая панель — открыть/скрыть" first>
        <KeyChip colors={colors()} label={keymap.label(props.shortcuts.sidebar)} accessibilityLabel="Изменить сочетание: Боковая панель — открыть/скрыть" onPress={() => props.onChangeShortcut("sidebar")} />
      </SettingsRow>
      <SettingsRow colors={colors()} title="Новая задача — панель справа">
        <KeyChip colors={colors()} label={keymap.label(props.shortcuts.create)} accessibilityLabel="Изменить сочетание: Новая задача — панель справа" onPress={() => props.onChangeShortcut("create")} />
      </SettingsRow>
      <SettingsRow colors={colors()} title="Быстрый поиск">
        <KeyChip colors={colors()} label={keymap.label(props.shortcuts.search)} accessibilityLabel="Изменить сочетание: Быстрый поиск" onPress={() => props.onChangeShortcut("search")} />
      </SettingsRow>
      <SettingsRow colors={colors()} title="Обновить данные из Engine">
        <KeyChip colors={colors()} label={keymap.label(props.shortcuts.reload)} accessibilityLabel="Изменить сочетание: Обновить данные из Engine" onPress={() => props.onChangeShortcut("reload")} />
      </SettingsRow>
      <SettingsRow colors={colors()} title="Закрыть панель / поиск">
        <KeyChip colors={colors()} label="Esc" muted />
      </SettingsRow>
    </SettingsSection>
    <View style={{ height: 6 }} />
  </View>;
}

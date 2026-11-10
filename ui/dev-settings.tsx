import { Text, View } from "nsh";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { SettingsRow, SettingsSection } from "./settings";
import { surfaceWash } from "./chrome";

/// The load tests: fill the notes store with ten thousand notes, or with a
/// hundred thousand to see where the library gives up. The buttons write into
/// the demo store only, so a real library is never touched.
export function DevelopersSection(props: { colors: ThemeColors; dark: boolean; onStress: (count: number) => void; onReset: () => void; size: number }) {
  const colors = props.colors;
  return <SettingsSection colors={props.colors} title="Для разработчиков" note="Проверка нагрузки на заметках">
    <SettingsRow colors={props.colors} title="Заметки" description={props.size > 0 ? `Сейчас в библиотеке: ${props.size}` : "Библиотека пуста"} first>
      <View class="flex-row" style={{ gap: 8 }}>
        <DevButton colors={colors} dark={props.dark} label="10 000" onPress={() => props.onStress(10_000)} />
        <DevButton colors={colors} dark={props.dark} label="100 000" onPress={() => props.onStress(100_000)} />
        <DevButton colors={colors} dark={props.dark} label="Сбросить" onPress={props.onReset} />
      </View>
    </SettingsRow>
    <SettingsRow colors={props.colors} title="Как это работает" description="Генератор живёт в демо-хранилище и заменяет библиотеку. Настоящие заметки он не трогает." />
  </SettingsSection>;
}

function DevButton(props: { colors: ThemeColors; dark: boolean; label: string; onPress: () => void }) {
  return <View onPress={props.onPress} role="button" accessibilityLabel={props.label} class="flex-row items-center justify-center" hoverStyle={{ backgroundColor: surfaceWash(props.dark, 0.09) }} style={{ height: 28, paddingLeft: 10, paddingRight: 10, gap: 6, borderRadius: 9, borderWidth: 1, borderColor: props.colors.border, backgroundColor: props.colors.card, cursor: "pointer" }}>
    <Text class="text-[12px]" style={{ color: props.colors.foreground }}>{props.label}</Text>
  </View>;
}

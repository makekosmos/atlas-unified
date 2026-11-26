import { Clipboard, Text, View, signal } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { SettingsRow, SettingsSection } from "./settings";
import { DevelopersSection } from "./dev-settings";
import { Glyph } from "./glyph";
import type { GlyphName } from "./icons";
import { hoverWash, surfaceWash } from "./chrome";
import { codeSize, interfaceSize } from "./reading-size";
import { benchmarkRunning, report, summary } from "./benchmark-run";
import Mono from "./fonts/GeistMono-Regular.ttf";

const supported = [
  {
    title: "Дневник",
    icon: "journal",
    status: "Готово",
    operation: "objects.list",
    params: { typeId: "com.mundus.atlas.journal" },
    example: [{ id: "example", typeId: "com.mundus.atlas.journal" }],
  },
  {
    title: "Заметки",
    icon: "note",
    status: "Готово",
    operation: "objects.list",
    params: { typeId: "core.note" },
    example: [{ id: "example", typeId: "core.note", title: "Заметка" }],
  },
  {
    title: "Задачи",
    icon: "check",
    status: "В разработке",
    operation: "objects.list",
    params: { typeId: "com.mundus.atlas.task" },
    example: [
      { id: "example", typeId: "com.mundus.atlas.task", title: "Задача" },
    ],
  },
  {
    title: "Игры",
    icon: "gamepad",
    status: "В разработке",
    operation: "canonical.game.list",
    params: {},
    example: [],
  },
] as const;

function typeCode(item: (typeof supported)[number]) {
  return `${item.operation} ${JSON.stringify(item.params, null, 2)}\n\n${JSON.stringify(item.example, null, 2)}`;
}

function SupportedType(props: {
  colors: ThemeColors;
  dark: boolean;
  first: boolean;
  open: boolean;
  title: string;
  icon: GlyphName;
  status: string;
  code: string;
  onPress: () => void;
}) {
  const colors = props.colors;
  return (
    <View
      onPress={props.onPress}
      role="button"
      accessibilityLabel={`Тип ${props.title}`}
      accessibilityState={{ expanded: props.open }}
      hoverStyle={{ backgroundColor: hoverWash(props.dark) }}
      style={{
        borderTopWidth: props.first ? 0 : 1,
        borderColor: colors.border,
        cursor: "pointer",
      }}
    >
      <View
        class="flex-row"
        style={{
          alignItems: "flex-start",
          gap: 12,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 11,
          paddingBottom: props.open ? 8 : 11,
        }}
      >
        <View class="shrink-0">
          <Glyph name={props.icon} size={16} color={colors.muted} />
        </View>
        <Text
          class="min-w-0 flex-1"
          style={{ color: colors.foreground, fontSize: interfaceSize() }}
        >
          {props.title}
        </Text>
        <Text
          class="shrink-0 rounded-md border px-2 py-1 text-[12px]"
          style={{ color: colors.muted, borderColor: colors.border }}
        >
          {props.status}
        </Text>
      </View>
      {props.open && (
        <View
          style={{
            marginLeft: 14,
            marginRight: 14,
            marginBottom: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: surfaceWash(props.dark, 0.06),
            paddingTop: 12,
            paddingBottom: 14,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <Text
            style={{
              fontFamily: Mono,
              fontSize: codeSize(),
              fontWeight: 500,
              lineHeight: Math.round(codeSize() * 1.57),
              color: colors.foreground,
            }}
          >
            {props.code}
          </Text>
        </View>
      )}
    </View>
  );
}

export function DevelopersPage(props: {
  colors: ThemeColors;
  dark: boolean;
  demo: boolean;
  size: number;
  run: () => void;
  separateWindow?: boolean;
  notice?: string;
  stress: (size: number) => void;
  reset: () => void;
}) {
  const expanded = signal("");
  return (
    <View>
      <SettingsSection colors={props.colors} title="Производительность">
        <SettingsRow
          colors={props.colors}
          first
          title={
            benchmarkRunning() ? "Проверка идёт…" : "Запустить полный тест"
          }
          description={
            props.notice ||
            (props.separateWindow
              ? "Отдельное окно на временных данных. Здесь остаётся чеклист этапов"
              : "Переходы между разделами и открытие библиотек из 10 000 и 100 000 тестовых заметок")
          }
          onPress={props.run}
        />
        {Boolean(report()) && (
          <SettingsRow
            colors={props.colors}
            title="Скопировать отчёт JSON"
            description={summary()}
            onPress={() => void Clipboard.writeText(report())}
          />
        )}
      </SettingsSection>
      {props.demo && (
        <DevelopersSection
          colors={props.colors}
          dark={props.dark}
          size={props.size}
          onStress={props.stress}
          onReset={props.reset}
        />
      )}
      <SettingsSection colors={props.colors} title="Поддерживаемые типы">
        {supported.map((item, index) => (
          <SupportedType
            colors={props.colors}
            dark={props.dark}
            first={index === 0}
            open={expanded() === item.title}
            title={item.title}
            icon={item.icon}
            status={item.status}
            code={typeCode(item)}
            onPress={() =>
              expanded.set(expanded() === item.title ? "" : item.title)
            }
          />
        ))}
      </SettingsSection>
    </View>
  );
}

import { effect, Scroll, signal, Text, View } from "nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { colorAlpha } from "./chrome";

/** One heading as the outline rail shows it: level (1..6), text, and document position. */
export type OutlineMark = { level: number; text: string; pos: number };

/** AnyType draws at most fifty marks: a rail longer than the page stops pointing anywhere. */
export const OUTLINE_LIMIT = 50;
export const OUTLINE_INSET = 14;

const TICK_WIDTHS = [24, 18, 13, 10, 8, 6] as const;
const POPOVER_ROW_HEIGHT = 36;
const POPOVER_CLOSE_MS = 140;

/** Direct mapping from heading level (H1..H6) to tick width in points: H1 longest, H6 shortest. */
export function outlineTickWidth(level: number): number {
  const index = Math.min(6, Math.max(1, Math.round(level))) - 1;
  return TICK_WIDTHS[index];
}

/** Left padding for a row in the outline popover, indented by heading hierarchy. */
export function outlineRowIndent(level: number, minLevel = 1): number {
  const clamped = Math.min(6, Math.max(1, Math.round(level)));
  const base = Math.min(6, Math.max(1, Math.round(minLevel)));
  return 12 + Math.max(0, clamped - base) * 14;
}

/** Scroll-spy selection: last heading at or above the reading threshold, defaulting to the first. */
export function activeOutlineIndex(
  ys: readonly (number | null)[],
  threshold: number,
): number {
  let active = -1;
  for (let index = 0; index < ys.length; index += 1) {
    const y = ys[index];
    if (y !== null && y <= threshold) active = index;
  }
  return active >= 0 ? active : 0;
}

/** Caret-based fallback: last heading at or before the caret position, defaulting to the first. */
export function activeOutlinePosForCaret(
  marks: readonly OutlineMark[],
  caretPos: number,
): number {
  if (!marks.length) return 0;
  let active = marks[0].pos;
  for (const mark of marks) {
    if (mark.pos <= caretPos) active = mark.pos;
    else break;
  }
  return active;
}

function popoverShadow(dark: boolean) {
  return dark
    ? "0 4px 12px rgba(0,0,0,0.45), 0 12px 32px rgba(0,0,0,0.42)"
    : "0 4px 12px rgba(15,23,42,0.08), 0 12px 32px rgba(15,23,42,0.12)";
}

export function NotesOutlineRail(props: {
  marks: () => readonly OutlineMark[];
  activePos: () => number;
  colors: ThemeColors;
  dark: boolean;
  maxHeight: () => number;
  onHoverOpen(): void;
  onSelect(mark: OutlineMark): void;
}) {
  const open = signal(false);
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };
  const openRail = () => {
    cancelClose();
    props.onHoverOpen();
    open.set(true);
  };
  const closeRail = () => {
    cancelClose();
    closeTimer = setTimeout(() => {
      closeTimer = null;
      open.set(false);
    }, POPOVER_CLOSE_MS);
  };
  effect(() => () => cancelClose());

  const list = () => props.marks().slice(0, OUTLINE_LIMIT);
  const resolvedActive = () => {
    const items = list();
    if (!items.length) return 0;
    const current = props.activePos();
    return items.some((item) => item.pos === current) ? current : items[0].pos;
  };
  const minLevel = () =>
    list().reduce((min, item) => Math.min(min, item.level), 6);
  const maxBody = () => Math.max(140, props.maxHeight() - 16);

  const renderRows = () => {
    const items = list();
    const activePos = resolvedActive();
    const base = minLevel();
    const rowActiveBg = props.dark
      ? colorAlpha("#ffffff", 0.08)
      : colorAlpha("#000000", 0.06);
    const rowHoverBg = props.dark
      ? colorAlpha("#ffffff", 0.12)
      : colorAlpha("#000000", 0.09);
    return (
      <View style={{ gap: 2 }}>
        {items.map((mark) => {
          const active = mark.pos === activePos;
          return (
            <View
              onPress={() => props.onSelect(mark)}
              role="button"
              accessibilityLabel={mark.text || "Заголовок"}
              accessibilityState={{ selected: active }}
              hoverStyle={{ backgroundColor: rowHoverBg }}
              style={{
                paddingLeft: outlineRowIndent(mark.level, base),
                paddingRight: 12,
                paddingTop: 7,
                paddingBottom: 7,
                borderRadius: 8,
                backgroundColor: active ? rowActiveBg : "transparent",
                cursor: "pointer",
              }}
            >
              <Text
                class="truncate"
                style={{
                  fontSize: 13.5,
                  lineHeight: 20,
                  fontWeight: active ? 500 : 400,
                  color: active
                    ? props.colors.foreground
                    : colorAlpha(props.colors.foreground, 0.84),
                }}
              >
                {mark.text || "Заголовок"}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTicks = () => {
    const items = list();
    const activePos = resolvedActive();
    const tickActive = props.dark ? "#ffffff" : props.colors.foreground;
    const tickIdle = props.dark
      ? colorAlpha("#ffffff", 0.24)
      : colorAlpha("#000000", 0.2);
    return (
      <View
        class="items-end"
        style={{
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          paddingRight: 2,
          gap: items.length > 25 ? 5 : 8,
        }}
      >
        {items.map((mark) => {
          const active = mark.pos === activePos;
          return (
            <View
              onPress={() => props.onSelect(mark)}
              role="button"
              accessibilityLabel={mark.text || "Заголовок"}
              accessibilityState={{ selected: active }}
              class="items-end justify-center"
              style={{ width: 28, height: 6, cursor: "pointer" }}
            >
              <View
                style={{
                  width: outlineTickWidth(mark.level),
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: active ? tickActive : tickIdle,
                }}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const renderPopover = () => {
    const bodyHeight = maxBody();
    const scrollable = list().length * POPOVER_ROW_HEIGHT > bodyHeight;
    return (
      <View
        testID="notes-outline-popover"
        style={{
          width: 256,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: props.dark
            ? colorAlpha("#ffffff", 0.1)
            : props.colors.border,
          backgroundColor: props.colors.card,
          padding: 8,
          boxShadow: popoverShadow(props.dark),
        }}
      >
        {scrollable ? (
          <Scroll scrollbar={false} style={{ height: bodyHeight }}>
            {renderRows()}
          </Scroll>
        ) : (
          renderRows()
        )}
      </View>
    );
  };

  return (
    <View
      class="absolute top-0 bottom-0 justify-center items-end"
      style={{ right: OUTLINE_INSET, pointerEvents: "box-none", zIndex: 20 }}
    >
      {list().length >= 2 && (
        <View
          testID="notes-outline-rail"
          onMouseEnter={openRail}
          onMouseLeave={closeRail}
        >
          {open() ? renderPopover() : renderTicks()}
        </View>
      )}
    </View>
  );
}

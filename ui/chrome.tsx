import { LayoutAnimation, Text, View, signal } from "nsh";
import { windows } from "nsh/desktop";
import type { TitleBarArea } from "nsh/desktop";
import { platform } from "os";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import { Glyph } from "./glyph";
import type { GlyphName } from "./icons";
import { accentMark } from "./themes";

/// As MonoCode's title bar has it: 48 tall, the tabs 32 inside it, 8 points
/// of air above and below them.
export const TITLEBAR_HEIGHT = 48;
/// The content sits in a rounded card, the way the shell's other surfaces do:
/// a gap to the window's edges, a radius of its own, a hairline border.
export const CARD_GAP = 8;
export const CARD_RADIUS = 14;
/// How far the bar's controls sit below its top edge. Zero centres a control
/// of any height in the bar; a positive pad pushed everything down by half of it.
export const TITLEBAR_TOP_PAD = 0;
export const SIDEBAR_WIDTH = 282;
export const ROW_HEIGHT = 32;
// Sidebar rows follow the reference layout: 40pt tall, 10pt radius.
export const NAV_ROW_HEIGHT = 40;
const CONTROL_RADIUS = 6;
const ROW_RADIUS = 8;
const NAV_ROW_RADIUS = 10;
const CLUSTER_START_MACOS = 88;
const CLUSTER_START = 8;
const TRAILING_INSET = 8;
/// MonoCode's caption buttons: 30 wide, 24 tall, glyph 14, in a 106 cluster.
const CAPTION_BUTTON_WIDTH = 30;
const CAPTION_BUTTON_HEIGHT = 24;
const TOGGLE_SIZE = 24;
/// The two trail arrows and the gap between them.
const TRAIL_WIDTH = 24 + 2 + 24;

const closeHovered = signal(false);

/// A tab joining or leaving the bar: the strip is a row of chips, so the ones
/// beside it slide over and the new one grows into the space it takes.
export function animateTabs() {
  LayoutAnimation.configureNext({
    duration: 160,
    create: { type: "easeOut", duration: 160 },
    update: { type: "easeOut", duration: 160 },
    delete: { type: "easeIn", duration: 120 },
  });
}

export function animatePanes() {
  LayoutAnimation.configureNext({
    duration: 200,
    update: { type: "easeOut", duration: 200 },
  });
}

// Zeron RESIZE: cubic-bezier(0, 0, 0.58, 1). The signal is the width
// last painted, so a new toggle retargets from the screen, not from a clock
// that has already run ahead of the frame. Hiding is quicker than the old
// 200 ms; opening runs 1.5 times faster than hiding.
export const SIDEBAR_HIDE_MS = 150;
export const SIDEBAR_OPEN_MS = 100;
export const SIDEBAR_MOTION_MS = SIDEBAR_HIDE_MS;

/** How long a toggle runs: hiding is slower than opening by design. */
export function sidebarMotionMs(open: boolean) {
  return open ? SIDEBAR_OPEN_MS : SIDEBAR_HIDE_MS;
}

const sidebarWidth = signal(SIDEBAR_WIDTH);
let sidebarTween: {
  from: number;
  to: number;
  started: number;
  duration: number;
} | null = null;
let sidebarScheduled = false;

function easeOut(t: number) {
  const x2 = 0.58;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const x = 3 * (1 - u) * u * u * x2 + u * u * u;
    const slope = 6 * (1 - u) * u * x2 + 3 * u * u * (1 - x2);
    if (Math.abs(slope) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - (x - t) / slope));
  }
  return 3 * (1 - u) * u * u + u * u * u;
}

export function sidebarWidthAt(
  from: number,
  to: number,
  elapsed: number,
  duration = SIDEBAR_MOTION_MS,
) {
  const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
  return from + (to - from) * easeOut(t);
}

export function sidebarFrame(now: number) {
  const tween = sidebarTween;
  if (!tween) return sidebarWidth();
  if (now - tween.started >= tween.duration) {
    sidebarTween = null;
    sidebarWidth.set(tween.to);
    return tween.to;
  }
  const value = sidebarWidthAt(
    tween.from,
    tween.to,
    now - tween.started,
    tween.duration,
  );
  sidebarWidth.set(value);
  return value;
}

function scheduleSidebar() {
  if (sidebarScheduled || !sidebarTween) return;
  sidebarScheduled = true;
  requestAnimationFrame(() => {
    sidebarScheduled = false;
    if (!sidebarTween) return;
    sidebarFrame(Date.now());
    scheduleSidebar();
  });
}

export function animateSidebar(open: boolean, now?: number) {
  const to = open ? SIDEBAR_WIDTH : 0;
  const from = sidebarWidth();
  if (from === to) {
    sidebarTween = null;
    return;
  }
  sidebarTween = {
    from,
    to,
    started: now ?? Date.now(),
    duration: sidebarMotionMs(open),
  };
  if (now === undefined) scheduleSidebar();
}

export function sidebarPaneWidth() {
  return sidebarWidth();
}

export function surfaceWash(dark: boolean, alpha = 0.05) {
  return dark ? `rgba(235,235,235,${alpha})` : `rgba(26,26,26,${alpha})`;
}

export function hoverWash(dark: boolean) {
  return surfaceWash(dark, dark ? 0.11 : 0.06);
}

/** The window shell: a step away from the page background, the sidebar's fill. */
export function shellFill(colors: { background: string }, dark: boolean) {
  return mixHex(colors.background, dark ? "#ffffff" : "#000000", 0.03);
}

/** A raised surface: the selected sidebar row, a card above the page. */
export function raisedFill(colors: { background: string }, dark: boolean) {
  return mixHex(
    colors.background,
    dark ? "#ffffff" : "#000000",
    dark ? 0.065 : 0.04,
  );
}

export function titlebarControlTop(size: number) {
  return (TITLEBAR_HEIGHT + TITLEBAR_TOP_PAD) / 2 - size / 2;
}

/**
 * Where the notes' arrows stand: against the pane's right edge, on the
 * toggle's own line — and after the toggle when there is no pane to hold them.
 */
export function noteBackLeft(pageInset: number, toggleLeft: number) {
  const afterToggle = toggleLeft + TOGGLE_SIZE + 6;
  const againstPane = pageInset - TRAIL_WIDTH;
  return Math.max(afterToggle, againstPane);
}

/// What a tab stands for: a page, or one note beside the list it came from.
export type TabView = {
  key: string;
  route: string;
  /// A note's tab carries the note; a page's carries none.
  noteId?: string;
  label: string;
  active: boolean;
};

const TAB_HEIGHT = 32;
/// The icon's tile: 24 × 20 with a 5 corner, as MonoCode's title tabs have it.
const TAB_TILE_HEIGHT = 20;
/// The close button and the room kept for it, so a name never shifts when it
/// shows up.
const TAB_CLOSE_SIZE = 20;
const TAB_CLOSE_ROOM = 4 + TAB_CLOSE_SIZE + 4;
/// MonoCode's tab name: 14 pt.
const TAB_TEXT_SIZE = 14;
/// A tab is this wide, its name or not: the strip reads as a row of equal
/// chips. It shrinks when the strip runs out of room, down to `TAB_MIN_WIDTH`.
const TAB_WIDTH = 200;
const TAB_MIN_WIDTH = 88;
/// How far the name fades out at the chip's right edge when it is longer than
/// the chip: the plate's own tone covers the cut.
const TAB_FADE = 22;
/// Between two tabs.
const TAB_GAP = 2;

/// A page's icon, taken from what the page is: the journal is its calendar, a
/// note a sheet, the list a tick, games a pad, settings a gear.
function TabIcon(props: { route: string; noteId?: string; color: string }) {
  if (props.route === "journal") {
    return <Glyph name="journal" size={14} color={props.color} />;
  }
  if (props.route === "games") {
    return <Glyph name="gamepad" size={14} color={props.color} />;
  }
  if (props.route === "settings") {
    return <Glyph name="settings" size={14} color={props.color} />;
  }
  if (props.route === "tasks") {
    return <Glyph name="check" size={14} color={props.color} />;
  }
  return <Glyph name="note" size={14} color={props.color} />;
}

/// The mark of what a recent row holds: the same icon the page wears.
/// A note reads as an open book, a game as its pad.
function recentIcon(kind: string): "note" | "gamepad" {
  return kind === "game" ? "gamepad" : "note";
}

/// One chip of the bar's row, the way MonoCode's title tabs are built: a flat
/// plate on the bar, a small gradient tile under the icon, and room for the
/// close button kept on every chip so nothing moves when it appears.
function TabChip(props: {
  tab: TabView;
  colors: ThemeColors;
  dark: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const over = signal(false);
  const closeOver = signal(false);
  const colors = props.colors;
  const base = shellFill(colors, props.dark);
  const ink = (t: number) => mixHex(base, colors.foreground, t);
  // The plate is the bar's own tone lifted a step: 4% of the ink at rest, 7%
  // under the pointer, 10% on the page being read.
  const plate = props.tab.active ? ink(0.1) : over() ? ink(0.07) : ink(0.04);
  // The tile is the icon's own card: the accent on the page being read (with
  // the ink that reads on it), a grey one everywhere else.
  const tileTop = props.tab.active
    ? mixHex(colors.accent, "#ffffff", 0.12)
    : ink(0.1);
  const tileBottom = props.tab.active ? colors.accent : ink(0.04);
  const tileInk = props.tab.active ? accentMark(colors.accent) : colors.muted;
  return (
    <View
      onPress={props.onSelect}
      role="button"
      accessibilityLabel={props.tab.label}
      accessibilityState={{ selected: props.tab.active }}
      onMouseEnter={() => over.set(true)}
      onMouseLeave={() => over.set(false)}
      desktop={{ windowDrag: false }}
      class="flex-row items-center"
      style={{
        height: TAB_HEIGHT,
        // One width for every chip, the same whether its name is long or not;
        // it gives way only when the strip is full.
        width: TAB_WIDTH,
        minWidth: TAB_MIN_WIDTH,
        flexShrink: 1,
        // As far from the tile as the tile is from the top and bottom.
        paddingLeft: (TAB_HEIGHT - TAB_TILE_HEIGHT) / 2,
        // The close button's room is part of the chip, not something the label
        // makes when it appears.
        paddingRight: TAB_CLOSE_ROOM,
        gap: 8,
        borderRadius: 8,
        backgroundColor: plate,
        cursor: "pointer",
      }}
    >
      <View
        class="items-center justify-center"
        style={{
          width: 24,
          height: TAB_TILE_HEIGHT,
          borderRadius: 5,
          backgroundImage: `linear-gradient(180deg, ${tileTop} 0%, ${tileBottom} 100%)`,
          borderWidth: 1,
          borderColor: props.tab.active
            ? colorAlpha("#ffffff", 0.14)
            : ink(0.1),
        }}
      >
        <TabIcon
          route={props.tab.route}
          noteId={props.tab.noteId}
          color={tileInk}
        />
      </View>
      {/* The name is confined to the room the tile and the close button
          leave: fixed, so a name never changes the chip, and clipped, so it
          never reaches under the cross. */}
      <View
        class="relative"
        style={{
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Text
          style={{
            fontSize: TAB_TEXT_SIZE,
            lineHeight: 20,
            // One line, cut where the room ends and no ellipsis: the fade is
            // what hides the cut.
            numberOfLines: 1,
            textOverflow: "clip",
            fontWeight: props.tab.active ? 600 : 500,
            color: props.tab.active ? colors.foreground : colors.muted,
          }}
        >
          {props.tab.label}
        </Text>
        {/* A long name does not end in a hard cut or an ellipsis: the plate's
            own tone comes in from the room's right edge and hides it. Over a
            name that fits it is plate over plate, so it is not seen at all. */}
        <View
          class="absolute"
          style={{
            right: 0,
            top: 0,
            width: TAB_FADE,
            height: 20,
            backgroundImage: `linear-gradient(90deg, ${colorAlpha(plate, 0)} 0%, ${plate} 100%)`,
          }}
        />
      </View>
      <View
        onPress={() => props.onClose()}
        role="button"
        accessibilityLabel={`Закрыть ${props.tab.label}`}
        onMouseEnter={() => closeOver.set(true)}
        onMouseLeave={() => closeOver.set(false)}
        class="absolute items-center justify-center"
        hoverStyle={{ backgroundColor: ink(0.18) }}
        desktop={{ windowDrag: false }}
        style={{
          right: 4,
          top: (TAB_HEIGHT - TAB_CLOSE_SIZE) / 2,
          width: TAB_CLOSE_SIZE,
          height: TAB_CLOSE_SIZE,
          borderRadius: 6,
          // Out of the way until the tab is the one being read or the pointer
          // is on it — its room stays either way.
          opacity: props.tab.active || over() ? 1 : 0,
          cursor: "pointer",
        }}
      >
        <Glyph
          name="close"
          size={13}
          color={closeOver() ? colors.foreground : colors.muted}
        />
      </View>
    </View>
  );
}

/// One of the two arrows that walk the notes' trail: quiet when there is
/// nowhere to go, and it only takes a press when there is.
export function TrailArrow(props: {
  dir: "back" | "forward";
  label: string;
  colors: ThemeColors;
  dark: boolean;
  enabled?: boolean;
  onPress?: () => void;
}) {
  const enabled = props.enabled === true;
  return (
    <View
      onPress={() => {
        if (enabled) props.onPress?.();
      }}
      role="button"
      accessibilityLabel={props.label}
      class="items-center justify-center"
      hoverStyle={
        enabled ? { backgroundColor: hoverWash(props.dark) } : undefined
      }
      activeStyle={
        enabled ? { backgroundColor: surfaceWash(props.dark, 0.12) } : undefined
      }
      desktop={{ windowDrag: false }}
      style={{
        width: 24,
        height: 24,
        borderRadius: CONTROL_RADIUS,
        cursor: enabled ? "pointer" : "default",
      }}
    >
      <Glyph
        name={props.dir === "back" ? "arrowLeft" : "arrowRight"}
        size={16}
        color={
          enabled
            ? props.colors.foreground
            : colorAlpha(props.colors.muted, 0.5)
        }
      />
    </View>
  );
}

function channel(hex: string, shift: number) {
  const h = hex.trim().replace("#", "");
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return (n >> shift) & 255;
}

export function mixHex(from: string, to: string, t: number) {
  const fr = channel(from, 16);
  const fg = channel(from, 8);
  const fb = channel(from, 0);
  const tr = channel(to, 16);
  const tg = channel(to, 8);
  const tb = channel(to, 0);
  if (
    fr === null ||
    fg === null ||
    fb === null ||
    tr === null ||
    tg === null ||
    tb === null
  )
    return from;
  const mix = (a: number, b: number) =>
    Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(fr, tr)}${mix(fg, tg)}${mix(fb, tb)}`;
}

export function colorAlpha(hex: string, alpha: number) {
  const r = channel(hex, 16);
  const g = channel(hex, 8);
  const b = channel(hex, 0);
  if (r === null || g === null || b === null) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function navInk(
  _selected: boolean,
  _hot: boolean,
  colors: { foreground: string; muted: string },
) {
  return colors.foreground;
}

export function hostOs() {
  const name = platform();
  if (name === "darwin" || name === "macos") return "macos";
  if (name === "win32" || name === "windows") return "windows";
  return name;
}

export function drawsCaptionButtons(os: string, reservedRight: number) {
  return (os === "windows" || os === "linux") && reservedRight === 0;
}

export function TitlebarOverlay(props: {
  colors: ThemeColors;
  dark: boolean;
  showAddGame?: boolean;
  dimmed?: boolean;
  pageInset?: number;
  /// The page's tabs: what is open, in the order it was opened.
  tabs?: readonly TabView[];
  onSelectTab?: (key: string) => void;
  onCloseTab?: (key: string) => void;
  noteActive?: boolean;
  /// The notes' trail: the arrows walk it, on the toggle's own line.
  noteNav?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onToggleSidebar: () => void;
  onAddGame?: () => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onDeleteNote?: () => void;
  onChrome: (command: string) => void;
}) {
  // NSH 0.7: an inline root (a host's window, not the app's own) has no
  // current window, so `titleBar()` throws there. Ask the app's window when
  // there is one and keep the bar's own layout when there is not: the host
  // puts its own controls where the system's would be.
  const controls: TitleBarArea = windows()[0]?.titleBar() ?? {
    height: 0,
    left: 0,
    right: 0,
  };
  const os = hostOs();
  const macos = os === "macos";
  const drawCaptions = drawsCaptionButtons(os, controls.right);
  const captionWidth = drawCaptions ? CAPTION_BUTTON_WIDTH * 3 : controls.right;
  const sidebarLeft = macos
    ? Math.max(controls.left, CLUSTER_START_MACOS)
    : Math.max(controls.left, CLUSTER_START);
  const controlsRight = captionWidth + TRAILING_INSET;
  const addGameRight = controlsRight;
  const wash = hoverWash(props.dark);
  const barHeight = controls.height || TITLEBAR_HEIGHT;
  const dragLeft = macos ? Math.max(controls.left, 78) : 0;
  return (
    <View
      class="absolute left-0 right-0 top-0 z-20"
      style={{ height: barHeight }}
      desktop={{ windowDrag: true }}
    >
      {props.dimmed && (
        <View
          class="absolute top-0 bottom-0"
          style={{
            left: props.pageInset ?? 0,
            right: 0,
            backgroundColor: "#00000080",
            pointerEvents: "none",
          }}
        />
      )}
      <View
        onPressDown={(event) =>
          props.onChrome(
            (event?.clickCount ?? 1) >= 2
              ? "window.titlebar-double-click"
              : "window.drag",
          )
        }
        class="absolute right-0 top-0 bottom-0"
        style={{ left: dragLeft }}
      />
      <View
        onPress={props.onToggleSidebar}
        role="button"
        accessibilityLabel="Боковая панель"
        class="absolute items-center justify-center"
        desktop={{ windowDrag: false }}
        hoverStyle={{ backgroundColor: wash }}
        style={{
          top: titlebarControlTop(TOGGLE_SIZE),
          left: sidebarLeft,
          width: TOGGLE_SIZE,
          height: TOGGLE_SIZE,
          borderRadius: CONTROL_RADIUS,
          cursor: "pointer",
        }}
      >
        <Glyph name="sidebar" size={14} color={props.colors.muted} />
      </View>
      {props.showAddGame && (
        <View
          onPress={() => props.onAddGame?.()}
          role="button"
          accessibilityLabel="Добавить игру"
          class="absolute items-center justify-center"
          desktop={{ windowDrag: false }}
          hoverStyle={{ backgroundColor: wash }}
          style={{
            top: titlebarControlTop(28),
            right: addGameRight,
            width: 28,
            height: 28,
            borderRadius: CONTROL_RADIUS,
            cursor: "pointer",
          }}
        >
          <Glyph name="plus" size={16} color={props.colors.muted} />
        </View>
      )}
      {props.noteNav && (
        <View
          class="absolute flex-row items-center"
          desktop={{ windowDrag: false }}
          style={{
            left: noteBackLeft(props.pageInset ?? 0, sidebarLeft),
            top: titlebarControlTop(24),
            height: 24,
            gap: 2,
          }}
        >
          <TrailArrow
            dir="back"
            label="Назад"
            dark={props.dark}
            colors={props.colors}
            enabled={props.canGoBack}
            onPress={props.onGoBack}
          />
          <TrailArrow
            dir="forward"
            label="Вперёд"
            dark={props.dark}
            colors={props.colors}
            enabled={props.canGoForward}
            onPress={props.onGoForward}
          />
        </View>
      )}
      {/* What is open, in a row across the bar's middle: a chip a page, a chip
        a note. The strip is centred; the delete button keeps the right end. */}
      {props.tabs && props.tabs.length > 0 && (
        <View
          class="absolute flex-row items-center justify-center"
          desktop={{ windowDrag: false }}
          style={{
            left: noteBackLeft(props.pageInset ?? 0, sidebarLeft) + 60,
            right: controlsRight + 44,
            top: titlebarControlTop(TAB_HEIGHT),
            height: TAB_HEIGHT,
            gap: TAB_GAP,
            pointerEvents: "box-none",
          }}
        >
          {props.tabs.map((tab) => (
            <TabChip
              key={tab.key}
              tab={tab}
              colors={props.colors}
              dark={props.dark}
              onSelect={() => props.onSelectTab?.(tab.key)}
              onClose={() => props.onCloseTab?.(tab.key)}
            />
          ))}
        </View>
      )}
      {props.noteActive && (
        <View
          onPress={() => props.onDeleteNote?.()}
          role="button"
          accessibilityLabel="Удалить заметку"
          class="absolute items-center justify-center"
          hoverStyle={{ backgroundColor: wash }}
          desktop={{ windowDrag: false }}
          style={{
            right: controlsRight + 8,
            top: titlebarControlTop(24),
            width: 26,
            height: 24,
            borderRadius: CONTROL_RADIUS,
            cursor: "pointer",
          }}
        >
          <Glyph name="trash" size={13} color={props.colors.muted} />
        </View>
      )}
      {drawCaptions && (
        <View
          class="absolute right-0 top-0 flex-row items-center"
          desktop={{ windowDrag: false }}
          style={{ height: TITLEBAR_HEIGHT, paddingRight: TRAILING_INSET }}
        >
          <View
            onPress={() => props.onChrome("window.minimize")}
            role="button"
            accessibilityLabel="Свернуть окно"
            class="items-center justify-center"
            desktop={{ windowDrag: false }}
            hoverStyle={{ backgroundColor: wash }}
            style={{
              width: CAPTION_BUTTON_WIDTH,
              height: CAPTION_BUTTON_HEIGHT,
              borderRadius: CONTROL_RADIUS,
              cursor: "pointer",
            }}
          >
            <SharedIcon name="windowMin" color={props.colors.muted} size={14} />
          </View>
          <View
            onPress={() => props.onChrome("window.zoom")}
            role="button"
            accessibilityLabel="Развернуть окно"
            class="items-center justify-center"
            desktop={{ windowDrag: false }}
            hoverStyle={{ backgroundColor: wash }}
            style={{
              width: CAPTION_BUTTON_WIDTH,
              height: CAPTION_BUTTON_HEIGHT,
              borderRadius: CONTROL_RADIUS,
              cursor: "pointer",
            }}
          >
            <SharedIcon name="windowMax" color={props.colors.muted} size={14} />
          </View>
          <View
            onPress={() => props.onChrome("window.close")}
            onMouseEnter={() => closeHovered.set(true)}
            onMouseLeave={() => closeHovered.set(false)}
            role="button"
            accessibilityLabel="Закрыть окно"
            class="items-center justify-center"
            desktop={{ windowDrag: false }}
            hoverStyle={{ backgroundColor: "#e81123" }}
            style={{
              width: CAPTION_BUTTON_WIDTH,
              height: CAPTION_BUTTON_HEIGHT,
              borderRadius: CONTROL_RADIUS,
              cursor: "pointer",
            }}
          >
            <SharedIcon
              name="windowClose"
              color={closeHovered() ? "#ffffff" : props.colors.muted}
              size={14}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export function SidebarRow(props: {
  label: string;
  icon: GlyphName;
  selected: boolean;
  dark: boolean;
  colors: ThemeColors;
  onPress: () => void;
}) {
  const wash = hoverWash(props.dark);
  return (
    <View
      onPress={props.onPress}
      role="button"
      accessibilityState={{ selected: props.selected }}
      desktop={{ windowDrag: false }}
      class="flex-row items-center"
      hoverStyle={{ backgroundColor: wash }}
      style={{
        height: NAV_ROW_HEIGHT,
        gap: 10,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: NAV_ROW_RADIUS,
        backgroundColor: props.selected
          ? raisedFill(props.colors, props.dark)
          : "transparent",
        cursor: "pointer",
      }}
    >
      <Glyph name={props.icon} size={16} color={props.colors.foreground} />
      <Text
        class="text-[14px]"
        style={{
          color: props.colors.foreground,
          fontWeight: 500,
          lineHeight: 20,
        }}
      >
        {props.label}
      </Text>
    </View>
  );
}

/// A row under the widgets: something opened not long ago. Quieter than a
/// widget: smaller text and no icon, lit with the same raised fill when active.
export function RecentRow(props: {
  entry: { kind: string; id: string; title: string };
  selected?: boolean;
  colors: ThemeColors;
  dark: boolean;
  onPress: () => void;
}) {
  const wash = hoverWash(props.dark);
  return (
    <View
      onPress={props.onPress}
      role="button"
      accessibilityLabel={props.entry.title}
      accessibilityState={{ selected: Boolean(props.selected) }}
      desktop={{ windowDrag: false }}
      class="flex-row items-center"
      hoverStyle={{ backgroundColor: wash }}
      style={{
        height: NAV_ROW_HEIGHT - 6,
        gap: 10,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: NAV_ROW_RADIUS,
        backgroundColor: props.selected
          ? raisedFill(props.colors, props.dark)
          : "transparent",
        cursor: "pointer",
      }}
    >
      <Glyph
        name={recentIcon(props.entry.kind)}
        size={14}
        color={props.colors.foreground}
      />
      <Text
        class="text-[14px] truncate"
        style={{
          color: props.colors.foreground,
          fontWeight: 500,
          lineHeight: 20,
        }}
      >
        {props.entry.title}
      </Text>
    </View>
  );
}

export function GhostButton(props: {
  label: string;
  colors: ThemeColors;
  dark: boolean;
  onPress: () => void;
}) {
  return (
    <View
      onPress={props.onPress}
      role="button"
      accessibilityLabel={props.label}
      class="items-center justify-center"
      hoverStyle={{
        backgroundColor: props.dark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
      }}
      style={{
        height: ROW_HEIGHT,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: ROW_RADIUS,
        cursor: "pointer",
      }}
    >
      <Text
        class={`text-[13px] hover:text-[${props.colors.foreground}]`}
        style={{ color: props.colors.muted }}
      >
        {props.label}
      </Text>
    </View>
  );
}

export function SolidButton(props: {
  label: string;
  background: string;
  foreground: string;
  onPress: () => void;
}) {
  return (
    <View
      onPress={props.onPress}
      role="button"
      accessibilityLabel={props.label}
      class="items-center justify-center"
      hoverStyle={{ opacity: 0.9 }}
      style={{
        height: ROW_HEIGHT,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: ROW_RADIUS,
        backgroundColor: props.background,
        cursor: "pointer",
      }}
    >
      <Text class="text-[13px] font-medium" style={{ color: props.foreground }}>
        {props.label}
      </Text>
    </View>
  );
}

import { LayoutAnimation, Text, View, signal } from "nsh";
import { Input } from "nsh/base";
import { titleBar } from "nsh/desktop";
import { platform } from "os";
import { Icon as SharedIcon } from "@makekosmos/imago-nsh";
import type { IconName, ThemeColors } from "@makekosmos/imago-nsh";
import { Glyph } from "./glyph";

export const TITLEBAR_HEIGHT = 38;
export const TITLEBAR_TOP_PAD = 4;
export const SIDEBAR_WIDTH = 282;
export const ROW_HEIGHT = 32;
// Sidebar rows follow the reference layout: 40pt tall, 10pt radius.
export const NAV_ROW_HEIGHT = 40;
const CONTROL_RADIUS = 6;
const ROW_RADIUS = 8;
const NAV_ROW_RADIUS = 10;
const CLUSTER_START_MACOS = 88;
const CLUSTER_START = 10;
const TRAILING_INSET = 6;
const CAPTION_BUTTON_WIDTH = 36;

const closeHovered = signal(false);

export function animatePanes() {
  LayoutAnimation.configureNext({ duration: 200, update: { type: "easeOut", duration: 200 } });
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
let sidebarTween: { from: number; to: number; started: number; duration: number } | null = null;
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

export function sidebarWidthAt(from: number, to: number, elapsed: number, duration = SIDEBAR_MOTION_MS) {
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
  const value = sidebarWidthAt(tween.from, tween.to, now - tween.started, tween.duration);
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
  sidebarTween = { from, to, started: now ?? Date.now(), duration: sidebarMotionMs(open) };
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
  return mixHex(colors.background, dark ? "#ffffff" : "#000000", dark ? 0.065 : 0.04);
}

export function titlebarControlTop(size: number) {
  return (TITLEBAR_HEIGHT + TITLEBAR_TOP_PAD) / 2 - size / 2;
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
  if (fr === null || fg === null || fb === null || tr === null || tg === null || tb === null) return from;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t).toString(16).padStart(2, "0");
  return `#${mix(fr, tr)}${mix(fg, tg)}${mix(fb, tb)}`;
}

export function colorAlpha(hex: string, alpha: number) {
  const r = channel(hex, 16);
  const g = channel(hex, 8);
  const b = channel(hex, 0);
  if (r === null || g === null || b === null) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function navInk(_selected: boolean, _hot: boolean, colors: { foreground: string; muted: string }) {
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
  /// The open note's name: it takes the bar's middle in place of the page.
  noteTitle?: string;
  noteActive?: boolean;
  /// The language of the code block the caret sits in, named in the bar.
  codeLanguage?: string;
  onPickLanguage?: (at: { x: number; y: number }) => void;
  onToggleSidebar: () => void;
  onAddGame?: () => void;
  onRenameNote?: (value: string) => void;
  onCloseNote?: () => void;
  onDeleteNote?: () => void;
  onChrome: (command: string) => void;
}) {
  const controls = titleBar();
  const os = hostOs();
  const macos = os === "macos";
  const drawCaptions = drawsCaptionButtons(os, controls.right);
  const captionWidth = drawCaptions ? CAPTION_BUTTON_WIDTH * 3 : controls.right;
  const sidebarLeft = macos ? Math.max(controls.left, CLUSTER_START_MACOS) : Math.max(controls.left, CLUSTER_START);
  const controlsRight = captionWidth + TRAILING_INSET;
  const addGameRight = controlsRight;
  const wash = hoverWash(props.dark);
  return <View class="absolute left-0 right-0 top-0 z-20" style={{ height: controls.height || TITLEBAR_HEIGHT }} desktop={{ windowDrag: true }}>
    <View class="absolute top-0 bottom-0" style={{ left: props.pageInset ?? 0, right: 0, backgroundColor: props.colors.background, pointerEvents: "none" }} />
    {props.dimmed && <View class="absolute top-0 bottom-0" style={{ left: props.pageInset ?? 0, right: 0, backgroundColor: "#00000080", pointerEvents: "none" }} />}
    <View onPressDown={() => props.onChrome("window.drag")} class="absolute left-0 right-0 top-0 bottom-0" />
    <View onPress={props.onToggleSidebar} role="button" accessibilityLabel="Боковая панель" class="absolute items-center justify-center" desktop={{ windowDrag: false }} hoverStyle={{ backgroundColor: wash }} style={{ top: titlebarControlTop(24), left: sidebarLeft, width: 24, height: 24, borderRadius: CONTROL_RADIUS, cursor: "pointer" }}>
      <SharedIcon name="sidebar" size={16} color={props.colors.muted} />
    </View>
    {props.showAddGame && <View onPress={() => props.onAddGame?.()} role="button" accessibilityLabel="Добавить игру" class="absolute items-center justify-center" desktop={{ windowDrag: false }} hoverStyle={{ backgroundColor: wash }} style={{ top: titlebarControlTop(28), right: addGameRight, width: 28, height: 28, borderRadius: CONTROL_RADIUS, cursor: "pointer" }}>
      <SharedIcon name="plus" size={16} color={props.colors.muted} />
    </View>}
    {props.noteActive && <View onPress={() => props.onCloseNote?.()} role="button" accessibilityLabel="К списку заметок" class="absolute flex-row items-center" hoverStyle={{ backgroundColor: wash }} desktop={{ windowDrag: false }} style={{ left: (props.pageInset ?? 0) + 8, top: titlebarControlTop(24), height: 24, paddingLeft: 8, paddingRight: 10, gap: 3, borderRadius: CONTROL_RADIUS, cursor: "pointer" }}>
      <Text class="text-[15px]" style={{ color: props.colors.muted }}>‹</Text>
      <Text class="text-[12px]" style={{ color: props.colors.muted }}>Заметки</Text>
    </View>}
    {props.noteActive && <View class="absolute items-center" desktop={{ windowDrag: false }} style={{ left: "50%", top: titlebarControlTop(26), height: 26, width: 340, marginLeft: -170 }}>
      <Input value={props.noteTitle ?? ""} onChange={(event) => props.onRenameNote?.(event.value)} placeholder="Заголовок" accessibilityLabel="Заголовок заметки" class="text-center text-[13px] font-semibold" style={{ width: 340, color: props.colors.foreground, backgroundColor: "transparent", paddingTop: 0, paddingBottom: 0, lineHeight: 18 }} />
    </View>}
    {props.noteActive && <View onPress={() => props.onDeleteNote?.()} role="button" accessibilityLabel="Удалить заметку" class="absolute items-center justify-center" hoverStyle={{ backgroundColor: wash }} desktop={{ windowDrag: false }} style={{ right: controlsRight + 8, top: titlebarControlTop(24), width: 26, height: 24, borderRadius: CONTROL_RADIUS, cursor: "pointer" }}>
      <SharedIcon name="trash" size={13} color={props.colors.muted} />
    </View>}
    {props.noteActive && props.codeLanguage ? <View onPress={(event) => props.onPickLanguage?.(event.pagePosition)} role="button" accessibilityLabel={`Язык блока: ${props.codeLanguage}`} class="absolute flex-row items-center justify-center" hoverStyle={{ backgroundColor: wash }} desktop={{ windowDrag: false }} style={{ right: controlsRight + 40, top: titlebarControlTop(26), height: 20, paddingLeft: 8, paddingRight: 8, gap: 4, borderRadius: 6, borderWidth: 1, backgroundColor: props.colors.card, borderColor: props.colors.border, cursor: "pointer" }}>
      <Text class="text-[11px]" style={{ color: props.colors.muted }}>{props.codeLanguage}</Text>
    </View> : null}
    {drawCaptions && <View class="absolute right-0 top-0 flex-row" desktop={{ windowDrag: false }} style={{ height: TITLEBAR_HEIGHT }}>
      <View onPress={() => props.onChrome("window.minimize")} role="button" accessibilityLabel="Свернуть окно" class="items-center justify-center" desktop={{ windowDrag: false }} hoverStyle={{ backgroundColor: wash }} style={{ width: CAPTION_BUTTON_WIDTH, height: TITLEBAR_HEIGHT, cursor: "pointer" }}><SharedIcon name="windowMin" color={props.colors.foreground} size={12} /></View>
      <View onPress={() => props.onChrome("window.zoom")} role="button" accessibilityLabel="Развернуть окно" class="items-center justify-center" desktop={{ windowDrag: false }} hoverStyle={{ backgroundColor: wash }} style={{ width: CAPTION_BUTTON_WIDTH, height: TITLEBAR_HEIGHT, cursor: "pointer" }}><SharedIcon name="windowMax" color={props.colors.foreground} size={12} /></View>
      <View onPress={() => props.onChrome("window.close")} onMouseEnter={() => closeHovered.set(true)} onMouseLeave={() => closeHovered.set(false)} role="button" accessibilityLabel="Закрыть окно" class="items-center justify-center" desktop={{ windowDrag: false }} hoverStyle={{ backgroundColor: "#e81123" }} style={{ width: CAPTION_BUTTON_WIDTH, height: TITLEBAR_HEIGHT, cursor: "pointer" }}><SharedIcon name="windowClose" color={closeHovered() ? "#ffffff" : props.colors.foreground} size={12} /></View>
    </View>}
  </View>;
}

export function SidebarRow(props: {
  label: string;
  icon: IconName | "gamepad" | "file";
  selected: boolean;
  dark: boolean;
  colors: ThemeColors;
  onPress: () => void;
}) {
  const wash = hoverWash(props.dark);
  return <View onPress={props.onPress} role="button" accessibilityState={{ selected: props.selected }} desktop={{ windowDrag: false }} class="flex-row items-center" hoverStyle={{ backgroundColor: wash }} style={{ height: NAV_ROW_HEIGHT, gap: 10, paddingLeft: 10, paddingRight: 10, borderRadius: NAV_ROW_RADIUS, backgroundColor: props.selected ? raisedFill(props.colors, props.dark) : "transparent", cursor: "pointer" }}>
    {props.icon === "gamepad" || props.icon === "file"
      ? <Glyph name={props.icon} size={16} color={props.colors.foreground} />
      : <SharedIcon name={props.icon} size={16} color={props.colors.foreground} />}
    <Text class="text-[14px]" style={{ color: props.colors.foreground, fontWeight: 500, lineHeight: 20 }}>{props.label}</Text>
  </View>;
}

/// A row under the widgets: something opened not long ago. Quieter than a
/// widget: smaller text, no icon, and no selection mark.
export function RecentRow(props: {
  entry: { kind: string; id: string; title: string };
  colors: ThemeColors;
  dark: boolean;
  onPress: () => void;
}) {
  const wash = hoverWash(props.dark);
  return <View onPress={props.onPress} role="button" accessibilityLabel={props.entry.title} class="flex-row items-center" hoverStyle={{ backgroundColor: wash }} style={{ height: NAV_ROW_HEIGHT - 6, paddingLeft: 10, paddingRight: 10, borderRadius: NAV_ROW_RADIUS, cursor: "pointer" }}>
    <Text class="text-[12px]" style={{ color: props.colors.muted, lineHeight: 18 }}>{props.entry.title}</Text>
  </View>;
}

export function GhostButton(props: { label: string; colors: ThemeColors; dark: boolean; onPress: () => void }) {
  return <View onPress={props.onPress} role="button" accessibilityLabel={props.label} class="items-center justify-center" hoverStyle={{ backgroundColor: props.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} style={{ height: ROW_HEIGHT, paddingLeft: 12, paddingRight: 12, borderRadius: ROW_RADIUS, cursor: "pointer" }}>
    <Text class={`text-[13px] hover:text-[${props.colors.foreground}]`} style={{ color: props.colors.muted }}>{props.label}</Text>
  </View>;
}

export function SolidButton(props: { label: string; background: string; foreground: string; onPress: () => void }) {
  return <View onPress={props.onPress} role="button" accessibilityLabel={props.label} class="items-center justify-center" hoverStyle={{ opacity: 0.9 }} style={{ height: ROW_HEIGHT, paddingLeft: 12, paddingRight: 12, borderRadius: ROW_RADIUS, backgroundColor: props.background, cursor: "pointer" }}>
    <Text class="text-[13px] font-medium" style={{ color: props.foreground }}>{props.label}</Text>
  </View>;
}

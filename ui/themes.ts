import type { ThemeColors } from "@makekosmos/imago-nsh";

export type PreviewTheme = { key: string; name: string; light: ThemeColors; dark: ThemeColors };

function colors(background: string, foreground: string, muted: string, border: string, accent: string, card: string): ThemeColors {
  return { background, foreground, muted, border, accent, card };
}

// The swatch screenshots are Display P3. The painter treats a hex as sRGB, so the
// P3 bytes (#5ac078) render washed (#75be7f). These hexes are the sRGB values
// that display as those circles. `plate` is the dark-mode bubble: the P3 circle
// mixed 18% toward black, then converted, which is the fill Zeron paints.
const BLUE_LIGHT = "#1e86fc";
const BLUE_DARK = "#1784fc";

export const previewThemes: PreviewTheme[] = [
  { key: "default", name: "Default", light: colors("#f8f7f9", "#222027", "#615f67", "#dedde0", BLUE_LIGHT, "#f3f2f4"), dark: colors("#0d0c10", "#e7e5ea", "#8d8a94", "#27262a", BLUE_DARK, "#131216") },
];

export const systemAccents: { key: string; name: string; darkName?: string; light: string; dark: string; plate: string; legacy: string[] }[] = [
  { key: "mono", name: "Чёрный", darkName: "Белый", light: "#000000", dark: "#ffffff", plate: "#d1d1d1", legacy: [] },
  { key: "brown", name: "Коричневый", light: "#a16c39", dark: "#a16c39", plate: "#83582f", legacy: ["#996e42"] },
  { key: "red", name: "Красный", light: "#fb2c3f", dark: "#fc2d3e", plate: "#cf2633", legacy: ["#e74347", "#e84447"] },
  { key: "orange", name: "Оранжевый", light: "#fe6a10", dark: "#fa6710", plate: "#cc550f", legacy: ["#ec7332", "#e87031"] },
  { key: "yellow", name: "Жёлтый", light: "#f69312", dark: "#f79411", plate: "#ca7912", legacy: ["#e8983a", "#e9993a"] },
  { key: "green", name: "Зелёный", light: "#13c16f", dark: "#13c370", plate: "#169f5c", legacy: ["#59be77", "#5ac078"] },
  { key: "teal", name: "Бирюзовый", light: "#15b8a3", dark: "#15b8a4", plate: "#179686", legacy: ["#55b5a3", "#55b5a4"] },
  { key: "blue", name: "Синий", light: BLUE_LIGHT, dark: BLUE_DARK, plate: "#156dcf", legacy: ["#4184f4", "#3e82f4"] },
  { key: "purple", name: "Фиолетовый", light: "#905afa", dark: "#915bfc", plate: "#764ace", legacy: ["#885cf1", "#895df3"] },
  { key: "pink", name: "Розовый", light: "#f93498", dark: "#fb3499", plate: "#cd2b7e", legacy: ["#e54896", "#e74897"] },
  { key: "gray", name: "Серый", light: "#959595", dark: "#777777", plate: "#626262", legacy: [] },
];

export function systemAccent(stored: string | null | undefined, dark: boolean) {
  if (!stored) return undefined;
  const needle = stored.toLowerCase();
  const match = systemAccents.find((accent) => accent.light === needle || accent.dark === needle || accent.legacy.includes(needle));
  if (!match) return stored;
  return dark ? match.dark : match.light;
}

// Dark journal bubbles use the deeper plate. Light mode keeps the circle color.
// Brown is the same hex in both modes, so it stays the circle.
export function journalBubble(accent: string) {
  const needle = accent.toLowerCase();
  const match = systemAccents.find((item) => item.dark === needle && item.light !== item.dark);
  return match?.plate ?? accent;
}

export function accentMark(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return "#ffffff";
  const y = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return y > 160 ? "#1d1d1f" : "#ffffff";
}

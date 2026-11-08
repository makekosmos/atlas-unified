import { Image } from "nsh";
import { glyphs } from "./icons";
import type { GlyphName } from "./icons";

/// A line icon from the app's Hugeicons set, tinted to the caller's color: the
/// same look as `Icon` from imago-nsh, for the icons only this app draws.
export function Glyph(props: { name: GlyphName; color: string; size?: number }) {
  return <Image src={glyphs[props.name]} style={{ width: props.size ?? 16, height: props.size ?? 16, tintColor: props.color }} />;
}

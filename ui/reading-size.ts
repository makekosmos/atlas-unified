import { signal, Storage } from "nsh";

export const textSize = signal(16);
export const codeSize = signal(14);
export const interfaceSize = signal(13);

for (const [key, size] of [
  ["text", textSize],
  ["code", codeSize],
] as const) {
  const storageKey = `mundus.atlas.font.${key}`;
  void Storage.getItem(storageKey).then((value) => {
    const px = Number(value);
    if (px >= 12 && px <= 24) size.set(px);
  });
}

export function setReadingSize(kind: "text" | "code", px: number) {
  if (!Number.isFinite(px) || px < 12 || px > 24) return;
  (kind === "text" ? textSize : codeSize).set(px);
  void Storage.setItem(`mundus.atlas.font.${kind}`, String(px));
}

import type { AtlasTheme } from "./state";

// Atlas mobile uses the desktop Mundus palette with the desktop Blue accent.
export const mobileThemes: AtlasTheme[] = [
  {
    key: "default",
    name: "Mundus",
    light: { background: "#f8f7f9", foreground: "#222027", muted: "#615f67", border: "#dedde0", accent: "#2563eb", card: "#f3f2f4" },
    dark: { background: "#0d0c10", foreground: "#e7e5ea", muted: "#8d8a94", border: "#27262a", accent: "#60a5fa", card: "#131216" },
  },
];

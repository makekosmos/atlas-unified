declare module "nsh/native" {
  export const nativeComponent: typeof import("nsh").nativeComponent;
}

declare module "nsh/gesture" {
  export const PanResponder: typeof import("nsh").PanResponder;
}

declare module "nsh/keymap" {
  export const keymap: typeof import("nsh").keymap;
}

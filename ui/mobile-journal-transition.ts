export type MobileJournalTransition =
  | { kind: "idle" }
  | { kind: "enter" | "exit"; phase: "primed" | "moving" };

export const mobileJournalTransitionDuration = 130;

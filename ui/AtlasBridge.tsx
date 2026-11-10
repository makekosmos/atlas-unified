import { nativeComponent } from "nsh";
import type { Appearance } from "@makekosmos/imago-nsh";
import { canNavigateToRoute, resolveAppearanceColors } from "./state";
import { previewThemes } from "./themes";
import { mobileThemes } from "./mobile-themes";
import type { JournalEntry, Note, Route, Snapshot } from "./state";

interface AtlasBridgeProps {
  route: Route;
  canHandleBack: boolean;
  snapshot: Snapshot;
  mobileAppearanceOverride: Appearance["settings"] | undefined;
  onCommandRef(command: (name: string, args?: unknown) => void): void;
  onRoute(route: Route): void;
  onSnapshot(snapshot: Snapshot): void;
  onSidebarVisible(visible: boolean): void;
  onJournal(entries: JournalEntry[]): void;
  onNotes(notes: Note[]): void;
  onNavigate(route: string): void;
  onConnection(connection: NonNullable<Snapshot["connection"]>): void;
  onBack(): void;
}

const Bridge = nativeComponent<{ route: Route; canHandleBack: boolean }, { state: Snapshot; navigate: { route: Route }; journal: JournalEntry[]; notes: Note[]; connection: NonNullable<Snapshot["connection"]>; back: Record<string, never> }>("atlas.bridge", {
  props: ["route", "canHandleBack"],
  events: ["state", "navigate", "journal", "notes", "connection", "back"],
});

let mobileJournalRequested = false;

export function AtlasBridge(props: AtlasBridgeProps) {
  return <Bridge
    class="absolute left-0 top-0 h-px w-px"
    ref={(node) => props.onCommandRef((name, args) => node.command(name, args))}
    route={props.route}
    canHandleBack={props.canHandleBack}
    onState={(next) => {
      props.onRoute(next.route);
      const appearance = next.appearance ?? props.snapshot.appearance;
      const themes = next.chrome === "mobile" ? mobileThemes : previewThemes;
      const mobileSettings = props.mobileAppearanceOverride;
      const mobileAppearance = next.chrome === "mobile" && mobileSettings && appearance
        ? { ...appearance, settings: mobileSettings, policy: { ...appearance.policy, following: false } }
        : appearance;
      const hydrated = {
        ...next,
        themes,
        journalEntries: next.chrome === "mobile" ? next.journalEntries : props.snapshot.journalEntries,
        sidebarVisible: next.chrome === "mobile" ? next.sidebarVisible : props.snapshot.sidebarVisible,
        connection: next.connection ?? props.snapshot.connection,
        colors: mobileAppearance
          ? resolveAppearanceColors(mobileAppearance, themes, next.colors)
          : next.colors,
        ...(mobileAppearance ? { appearance: mobileAppearance } : {}),
      };
      props.onSnapshot(hydrated);
      if (next.chrome === "mobile") props.onCommandRef((command) => command("window.background", { color: hydrated.colors.background }));
      props.onSidebarVisible(next.sidebarVisible);
      if (next.chrome === "mobile" && !mobileJournalRequested) {
        mobileJournalRequested = true;
        props.onCommandRef((command) => command("reload"));
      }
    }}
    onJournal={props.onJournal}
    onNotes={props.onNotes}
    onNavigate={(event) => props.onNavigate(event.route)}
    onConnection={props.onConnection}
    onBack={props.onBack}
  />;
}

// The shell with a library in it: the tab bookkeeping needs notes to open, and
// the app's own bridge is the host's, which a headless test does not have. The
// seed comes first so the notes are there before `App.tsx` mounts.
import "./tabs-seed";
import "./App.tsx";

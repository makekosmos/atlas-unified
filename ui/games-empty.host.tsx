import { mount, View } from "nsh";
import { gameLibrary } from "./game-library";
import { GamesLibrary } from "./games";
import { previewThemes } from "./themes";

gameLibrary.receiveLibrary([]);

mount(() => {
  const colors = previewThemes[0].dark;
  return (
    <View class="h-full w-full">
      <GamesLibrary
        colors={colors}
        pickedExes={[]}
        pickSource="manual"
        onPick={() => {}}
        onBrowse={() => {}}
        onBrowseFolder={() => {}}
        onLaunch={() => {}}
        onClearPick={() => {}}
      />
    </View>
  );
});

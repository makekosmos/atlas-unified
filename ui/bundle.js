import { append, bindProp, component, each, element, insert, prop, setup, spread, text } from "nsh:rt";
import { LayoutAnimation, PanResponder, Storage, effect, keymap, mount, nativeComponent, signal } from "nsh";
import { Window, titleBar } from "nsh/desktop";
import { Popover } from "nsh/base";

//#region ../../../../Users/user/kos436/atlas-journal-native-shell/node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+79570d556deefca52dd45795e055cd3122181524/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/types.ts
const spacing = {
	sidebarWidth: 240,
	titlebarHeight: 40,
	rowHeight: 32,
	compactRowHeight: 28,
	pageGutter: 28
};
const typography = {
	body: 13,
	label: 12,
	title: 24,
	titlebar: 13
};
const defaultColors = {
	background: "#0d0c10",
	foreground: "#e7e5ea",
	muted: "#8d8a94",
	border: "#27262a",
	accent: "#af94f9",
	card: "#131216"
};
const accentChoices = [
	"#8ec07c",
	"#d79921",
	"#b18aff",
	"#83a598",
	"#fb4934",
	"#d3869b",
	"#458588",
	"#fabd2f"
];

//#endregion
//#region ../../../../Users/user/kos436/atlas-journal-native-shell/node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+79570d556deefca52dd45795e055cd3122181524/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/icons.ts
const icons = {
	about: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M16%202V6M8%202V6%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M13%204H11C7.22876%204%205.34315%204%204.17157%205.17157C3%206.34315%203%208.22876%203%2012V14C3%2017.7712%203%2019.6569%204.17157%2020.8284C5.34315%2022%207.22876%2022%2011%2022H13C16.7712%2022%2018.6569%2022%2019.8284%2020.8284C21%2019.6569%2021%2017.7712%2021%2014V12C21%208.22876%2021%206.34315%2019.8284%205.17157C18.6569%204%2016.7712%204%2013%204Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M3%2010H21%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M10%2018.5002L9.99999%2013.8474C9.99999%2013.6557%209.86325%2013.5002%209.69458%2013.5002H9M14%2018.4983L15.4855%2013.8923C15.4951%2013.8626%2015.5%2013.8315%2015.5%2013.8002C15.5%2013.6346%2015.3657%2013.5002%2015.2%2013.5002L13%2013.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	check: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M5%2013.2592L7.58583%2015.9568C8.2525%2016.6523%208.58583%2017%209.00004%2017C9.41425%2017%209.74759%2016.6523%2010.4143%2015.9568L19%207%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	inbox: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M2.5%2012C2.5%207.52166%202.5%205.28249%203.89124%203.89124C5.28249%202.5%207.52166%202.5%2012%202.5C16.4783%202.5%2018.7175%202.5%2020.1088%203.89124C21.5%205.28249%2021.5%207.52166%2021.5%2012C21.5%2016.4783%2021.5%2018.7175%2020.1088%2020.1088C18.7175%2021.5%2016.4783%2021.5%2012%2021.5C7.52166%2021.5%205.28249%2021.5%203.89124%2020.1088C2.5%2018.7175%202.5%2016.4783%202.5%2012Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M21.5%2013.5H16.5743C15.7322%2013.5%2015.0706%2014.2036%2014.6995%2014.9472C14.2963%2015.7551%2013.4889%2016.5%2012%2016.5C10.5111%2016.5%209.70373%2015.7551%209.30054%2014.9472C8.92942%2014.2036%208.26777%2013.5%207.42566%2013.5H2.5%22%20stroke%3D%22currentColor%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	logbook: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7.99978%203.5H6.60021C4.43183%203.5%203.34764%203.5%202.67399%204.17362C2.00034%204.84724%202.00029%205.93144%202.00021%208.09982L2%2013.3998C1.99992%2015.5684%201.99987%2016.6526%202.67353%2017.3263C3.34719%2018%204.43146%2018%206.6%2018H8.95042C10.4329%2018%2011.7092%2019.0464%2011.9999%2020.5V5.5C11.0556%204.24097%209.99989%203.5%207.99978%203.5Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M16.0001%203.5H17.3997C19.5681%203.5%2020.6523%203.5%2021.3259%204.17362C21.9996%204.84724%2021.9996%205.93144%2021.9997%208.09982L21.9999%2013.3998C22%2015.5684%2022%2016.6526%2021.3264%2017.3263C20.6527%2018%2019.5684%2018%2017.3999%2018H15.0495C13.567%2018%2012.2907%2019.0464%2012%2020.5V5.5C12.9443%204.24097%2014%203.5%2016.0001%203.5Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	more: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M21%2012C21%2011.1716%2020.3284%2010.5%2019.5%2010.5C18.6716%2010.5%2018%2011.1716%2018%2012C18%2012.8284%2018.6716%2013.5%2019.5%2013.5C20.3284%2013.5%2021%2012.8284%2021%2012Z%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M13.5%2012C13.5%2011.1716%2012.8284%2010.5%2012%2010.5C11.1716%2010.5%2010.5%2011.1716%2010.5%2012C10.5%2012.8284%2011.1716%2013.5%2012%2013.5C12.8284%2013.5%2013.5%2012.8284%2013.5%2012Z%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M6%2012C6%2011.1716%205.32843%2010.5%204.5%2010.5C3.67157%2010.5%203%2011.1716%203%2012C3%2012.8284%203.67157%2013.5%204.5%2013.5C5.32843%2013.5%206%2012.8284%206%2012Z%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	nextWeek: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M16%202V6M8%202V6%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M13%204H11C7.22876%204%205.34315%204%204.17157%205.17157C3%206.34315%203%208.22876%203%2012V14C3%2017.7712%203%2019.6569%204.17157%2020.8284C5.34315%2022%207.22876%2022%2011%2022H13C16.7712%2022%2018.6569%2022%2019.8284%2020.8284C21%2019.6569%2021%2017.7712%2021%2014V12C21%208.22876%2021%206.34315%2019.8284%205.17157C18.6569%204%2016.7712%204%2013%204Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M3%2010H21%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M11%2014H16M8%2014H8.00898M13%2018H8M16%2018H15.991%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	plus: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M12%204V20M20%2012H4%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	project: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M8%207H16.75C18.8567%207%2019.91%207%2020.6667%207.50559C20.9943%207.72447%2021.2755%208.00572%2021.4944%208.33329C22%209.08996%2022%2010.1433%2022%2012.25C22%2015.7612%2022%2017.5167%2021.1573%2018.7779C20.7926%2019.3238%2020.3238%2019.7926%2019.7779%2020.1573C18.5167%2021%2016.7612%2021%2013.25%2021H12C7.28595%2021%204.92893%2021%203.46447%2019.5355C2%2018.0711%202%2015.714%202%2011V7.94427C2%206.1278%202%205.21956%202.38032%204.53806C2.65142%204.05227%203.05227%203.65142%203.53806%203.38032C4.21956%203%205.1278%203%206.94427%203C8.10802%203%208.6899%203%209.19926%203.19101C10.3622%203.62712%2010.8418%204.68358%2011.3666%205.73313L12%207%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	settings: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3.99963%205.00055L9.99963%205.00031%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M12.9996%205.00031L19.9996%205.00031%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M15.9996%209.00031L15.9996%2015.0003%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9.99963%202.00031L9.99963%208.00031%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M11.9996%2016.0003L11.9996%2022.0003%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M15.9996%2012.0001L19.9996%2012.0003%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M3.99963%2012.0005L12.9996%2012.0003%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M11.9996%2019.0003L19.9996%2019.0003%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M3.99963%2019.0005L8.99963%2019.0003%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	sidebar: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M2%2012C2%208.31087%202%206.4663%202.81382%205.15877C3.1149%204.67502%203.48891%204.25427%203.91891%203.91554C5.08116%203%206.72077%203%2010%203H14C17.2792%203%2018.9188%203%2020.0811%203.91554C20.5111%204.25427%2020.8851%204.67502%2021.1862%205.15877C22%206.4663%2022%208.31087%2022%2012C22%2015.6891%2022%2017.5337%2021.1862%2018.8412C20.8851%2019.325%2020.5111%2019.7457%2020.0811%2020.0845C18.9188%2021%2017.2792%2021%2014%2021H10C6.72077%2021%205.08116%2021%203.91891%2020.0845C3.48891%2019.7457%203.1149%2019.325%202.81382%2018.8412C2%2017.5337%202%2015.6891%202%2012Z%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9.5%203L9.5%2021%22%20stroke%3D%22currentColor%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M5%207H6M5%2010H6%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	someday: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%2210%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M12%208V12L14%2014%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	statistics: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%2017L7%2013%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M12%2017L12%207%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M17%2017L17%2011%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M2.5%2012C2.5%207.52166%202.5%205.28249%203.89124%203.89124C5.28249%202.5%207.52166%202.5%2012%202.5C16.4783%202.5%2018.7175%202.5%2020.1088%203.89124C21.5%205.28249%2021.5%207.52166%2021.5%2012C21.5%2016.4783%2021.5%2018.7175%2020.1088%2020.1088C18.7175%2021.5%2016.4783%2021.5%2012%2021.5C7.52166%2021.5%205.28249%2021.5%203.89124%2020.1088C2.5%2018.7175%202.5%2016.4783%202.5%2012Z%22%20stroke%3D%22currentColor%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	trash: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M19.5%205.5L18.8803%2015.5251C18.7219%2018.0864%2018.6428%2019.3671%2018.0008%2020.2879C17.6833%2020.7431%2017.2747%2021.1273%2016.8007%2021.416C15.8421%2022%2014.559%2022%2011.9927%2022C9.42312%2022%208.1383%2022%207.17905%2021.4149C6.7048%2021.1257%206.296%2020.7408%205.97868%2020.2848C5.33688%2019.3626%205.25945%2018.0801%205.10461%2015.5152L4.5%205.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M3%205.5H21M16.0557%205.5L15.3731%204.09173C14.9196%203.15626%2014.6928%202.68852%2014.3017%202.39681C14.215%202.3321%2014.1231%202.27454%2014.027%202.2247C13.5939%202%2013.0741%202%2012.0345%202C10.9688%202%2010.436%202%209.99568%202.23412C9.8981%202.28601%209.80498%202.3459%209.71729%202.41317C9.32164%202.7167%209.10063%203.20155%208.65861%204.17126L8.05292%205.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9.5%2016.5L9.5%2010.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M14.5%2016.5L14.5%2010.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	week: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M16%202V6M8%202V6%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M13%204H11C7.22876%204%205.34315%204%204.17157%205.17157C3%206.34315%203%208.22876%203%2012V14C3%2017.7712%203%2019.6569%204.17157%2020.8284C5.34315%2022%207.22876%2022%2011%2022H13C16.7712%2022%2018.6569%2022%2019.8284%2020.8284C21%2019.6569%2021%2017.7712%2021%2014V12C21%208.22876%2021%206.34315%2019.8284%205.17157C18.6569%204%2016.7712%204%2013%204Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M3%2010H21%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M10%2018.5002L9.99999%2013.8474C9.99999%2013.6557%209.86325%2013.5002%209.69458%2013.5002H9M14%2018.4983L15.4855%2013.8923C15.4951%2013.8626%2015.5%2013.8315%2015.5%2013.8002C15.5%2013.6346%2015.3657%2013.5002%2015.2%2013.5002L13%2013.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	display: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M4%2011L4%2021%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M19%2013L19%2021%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M19%203L19%207%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M11.5%203L11.5%2013%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M4%203L4%205%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M11.5%2019L11.5%2021%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M2%209.5C2%209.03406%202%208.80109%202.07612%208.61732C2.17761%208.37229%202.37229%208.17761%202.61732%208.07612C2.80109%208%203.03406%208%203.5%208H4.5C4.96594%208%205.19891%208%205.38268%208.07612C5.62771%208.17761%205.82239%208.37229%205.92388%208.61732C6%208.80109%206%209.03406%206%209.5C6%209.96594%206%2010.1989%205.92388%2010.3827C5.82239%2010.6277%205.62771%2010.8224%205.38268%2010.9239C5.19891%2011%204.96594%2011%204.5%2011H3.5C3.03406%2011%202.80109%2011%202.61732%2010.9239C2.37229%2010.8224%202.17761%2010.6277%202.07612%2010.3827C2%2010.1989%202%209.96594%202%209.5Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M17%2011.5C17%2011.0341%2017%2010.8011%2017.0761%2010.6173C17.1776%2010.3723%2017.3723%2010.1776%2017.6173%2010.0761C17.8011%2010%2018.0341%2010%2018.5%2010H19.5C19.9659%2010%2020.1989%2010%2020.3827%2010.0761C20.6277%2010.1776%2020.8224%2010.3723%2020.9239%2010.6173C21%2010.8011%2021%2011.0341%2021%2011.5C21%2011.9659%2021%2012.1989%2020.9239%2012.3827C20.8224%2012.6277%2020.6277%2012.8224%2020.3827%2012.9239C20.1989%2013%2019.9659%2013%2019.5%2013H18.5C18.0341%2013%2017.8011%2013%2017.6173%2012.9239C17.3723%2012.8224%2017.1776%2012.6277%2017.0761%2012.3827C17%2012.1989%2017%2011.9659%2017%2011.5Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M9.5%2014.5C9.5%2014.0341%209.5%2013.8011%209.57612%2013.6173C9.67761%2013.3723%209.87229%2013.1776%2010.1173%2013.0761C10.3011%2013%2010.5341%2013%2011%2013H12C12.4659%2013%2012.6989%2013%2012.8827%2013.0761C13.1277%2013.1776%2013.3224%2013.3723%2013.4239%2013.6173C13.5%2013.8011%2013.5%2014.0341%2013.5%2014.5C13.5%2014.9659%2013.5%2015.1989%2013.4239%2015.3827C13.3224%2015.6277%2013.1277%2015.8224%2012.8827%2015.9239C12.6989%2016%2012.4659%2016%2012%2016H11C10.5341%2016%2010.3011%2016%2010.1173%2015.9239C9.87229%2015.8224%209.67761%2015.6277%209.57612%2015.3827C9.5%2015.1989%209.5%2014.9659%209.5%2014.5Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E%0A",
	windowMin: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M6%2012h12%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E%0A",
	windowMax: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Crect%20x%3D%226.5%22%20y%3D%226.5%22%20width%3D%2211%22%20height%3D%2211%22%20rx%3D%221.5%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E%0A",
	windowClose: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22m6%206%2012%2012M18%206%206%2018%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E%0A"
};

//#endregion
//#region ../../../../Users/user/kos436/atlas-journal-native-shell/node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+79570d556deefca52dd45795e055cd3122181524/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/components.tsx
function Icon(props) {
	return (() => {
		const __nsh_hv0 = element("image");
		bindProp(__nsh_hv0, "src", () => icons[props.name]);
		bindProp(__nsh_hv0, "style", () => ({
			width: props.size ?? 16,
			height: props.size ?? 16,
			tintColor: props.color
		}));
		return __nsh_hv0;
	})();
}
function NavigationItem(props) {
	return (() => {
		const __nsh_hv1 = element("view");
		bindProp(__nsh_hv1, "onPress", () => props.onPress);
		prop(__nsh_hv1, "role", "button");
		bindProp(__nsh_hv1, "accessibilityState", () => ({ selected: props.selected }));
		prop(__nsh_hv1, "class", "flex-row items-center gap-2 rounded-lg px-2.5");
		bindProp(__nsh_hv1, "style", () => ({
			height: spacing.rowHeight,
			backgroundColor: props.selected ? props.colors.card : "transparent"
		}));
		const __nsh_hv2 = element("text");
		prop(__nsh_hv2, "class", "text-[13px]");
		bindProp(__nsh_hv2, "style", () => ({ color: props.selected ? props.colors.foreground : props.colors.muted }));
		insert(__nsh_hv2, () => props.label);
		append(__nsh_hv1, __nsh_hv2);
		insert(__nsh_hv1, component(Icon, {
			get name() {
				return props.icon;
			},
			get color() {
				return props.colors.muted;
			}
		}), __nsh_hv2);
		return __nsh_hv1;
	})();
}
function Button(props) {
	return (() => {
		const __nsh_hv32 = element("view");
		bindProp(__nsh_hv32, "onPress", () => props.disabled ? void 0 : props.onPress);
		prop(__nsh_hv32, "role", "button");
		bindProp(__nsh_hv32, "accessibilityState", () => ({
			selected: !!props.selected,
			disabled: !!props.disabled
		}));
		bindProp(__nsh_hv32, "class", () => `rounded-md border px-3 py-2 ${props.className ?? ""}`);
		bindProp(__nsh_hv32, "style", () => ({
			backgroundColor: props.selected ? props.colors.card : props.colors.background,
			borderColor: props.selected ? props.colors.accent : props.colors.border,
			opacity: props.disabled ? .5 : 1,
			...props.style
		}));
		const __nsh_hv33 = element("text");
		prop(__nsh_hv33, "class", "text-[13px]");
		bindProp(__nsh_hv33, "style", () => ({ color: props.textColor ?? (props.selected ? props.colors.foreground : props.colors.muted) }));
		insert(__nsh_hv33, () => props.label);
		append(__nsh_hv32, __nsh_hv33);
		return __nsh_hv32;
	})();
}
function Dialog(props) {
	return (() => {
		const __nsh_hv36 = element("view");
		prop(__nsh_hv36, "class", "absolute inset-0 items-center justify-center bg-[#00000080] px-4");
		const __nsh_hv37 = element("view");
		prop(__nsh_hv37, "class", "w-full max-w-[440px] rounded-xl border p-4");
		bindProp(__nsh_hv37, "style", () => ({
			borderColor: props.colors.border,
			backgroundColor: props.colors.card
		}));
		const __nsh_hv38 = element("text");
		prop(__nsh_hv38, "class", "mb-3 text-[14px]");
		bindProp(__nsh_hv38, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv38, () => props.title);
		append(__nsh_hv37, __nsh_hv38);
		insert(__nsh_hv37, () => props.children);
		append(__nsh_hv36, __nsh_hv37);
		return __nsh_hv36;
	})();
}

//#endregion
//#region navigation.json
var navigation_default = [
	{
		"id": "journal",
		"label": "Дневник",
		"icon": "book.closed",
		"footer": false
	},
	{
		"id": "tasks",
		"label": "Задачи",
		"icon": "checklist",
		"footer": false
	},
	{
		"id": "settings",
		"label": "Настройки",
		"icon": "gearshape",
		"footer": true
	}
];

//#endregion
//#region state.ts
const fallback = {
	route: "journal",
	title: "Дневник",
	todos: [],
	journalEntries: [],
	version: "",
	appearance: {
		settings: {
			mode: "dark",
			light_theme: "default",
			dark_theme: "default",
			accent_source: "theme",
			material: "default",
			font_size: 13,
			font_family: "Inter"
		},
		policy: { following: false },
		capabilities: {
			materials: [
				"default",
				"frosted",
				"mica"
			],
			wallpaper_accent: false
		}
	},
	appearanceEditable: false,
	themes: [
		{
			key: "default",
			name: "Default",
			light: defaultColors,
			dark: defaultColors
		},
		{
			key: "claude",
			name: "Claude",
			light: defaultColors,
			dark: defaultColors
		},
		{
			key: "graphite",
			name: "Graphite",
			light: defaultColors,
			dark: defaultColors
		}
	],
	colors: defaultColors,
	sidebarVisible: true,
	chrome: "tsx"
};
function resolveAppearanceColors(appearance, themes, fallbackColors) {
	const settings = appearance.settings;
	const dark = settings.mode !== "light";
	const themeKey = dark ? settings.dark_theme : settings.light_theme;
	const themeColors = themes.find((theme) => theme.key === themeKey)?.[dark ? "dark" : "light"] ?? fallbackColors;
	return {
		...themeColors,
		accent: settings.accent_source === "custom" && settings.accent_color ? settings.accent_color : themeColors.accent
	};
}
function isSnapshot(value) {
	if (typeof value !== "object" || value === null || !("route" in value) || !isRoute(value.route)) return false;
	if (!("title" in value) || typeof value.title !== "string" || !("todos" in value) || !Array.isArray(value.todos)) return false;
	if (!value.todos.every(isTodo) || !("journalEntries" in value) || !Array.isArray(value.journalEntries) || !value.journalEntries.every(isJournalEntry)) return false;
	return "version" in value && typeof value.version === "string" && "appearanceEditable" in value && typeof value.appearanceEditable === "boolean" && "themes" in value && Array.isArray(value.themes) && "colors" in value && isColors(value.colors) && "sidebarVisible" in value && typeof value.sidebarVisible === "boolean" && "chrome" in value && (value.chrome === "native" || value.chrome === "tsx");
}
function isRoute(value) {
	return value === "journal" || value === "tasks" || value === "settings";
}
function isTodo(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "title" in value && typeof value.title === "string" && "is_completed" in value && typeof value.is_completed === "boolean";
}
function isJournalEntry(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "text" in value && typeof value.text === "string" && "createdAt" in value && typeof value.createdAt === "string";
}
function isColors(value) {
	if (typeof value !== "object" || value === null) return false;
	return "background" in value && typeof value.background === "string" && "foreground" in value && typeof value.foreground === "string" && "muted" in value && typeof value.muted === "string" && "border" in value && typeof value.border === "string" && "accent" in value && typeof value.accent === "string" && "card" in value && typeof value.card === "string";
}

//#endregion
//#region journal-model.ts
const monthNamesInDate = [
	"января",
	"февраля",
	"марта",
	"апреля",
	"мая",
	"июня",
	"июля",
	"августа",
	"сентября",
	"октября",
	"ноября",
	"декабря"
];
const monthNamesShort = [
	"янв",
	"фев",
	"мар",
	"апр",
	"май",
	"июн",
	"июл",
	"авг",
	"сен",
	"окт",
	"ноя",
	"дек"
];
function localDayKey(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function buildJournalDays(entries) {
	const groups = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const date = new Date(entry.createdAt);
		if (Number.isNaN(date.valueOf())) {
			const key = `invalid:${entry.createdAt}`;
			const group = groups.get(key);
			if (group) group.entries.push(entry);
			else groups.set(key, {
				kind: "invalid",
				key,
				label: entry.createdAt,
				entries: [entry]
			});
			continue;
		}
		const key = localDayKey(date);
		const group = groups.get(key);
		if (group) group.entries.push(entry);
		else groups.set(key, {
			kind: "dated",
			key,
			date,
			entries: [entry]
		});
	}
	return [...groups.values()];
}
function formatJournalDay(group, now = /* @__PURE__ */ new Date()) {
	if (group.kind === "invalid") return group.label;
	const year = group.date.getFullYear() === now.getFullYear() ? "" : ` ${group.date.getFullYear()}`;
	return `${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
}
function buildCalendarDays(groups, now = /* @__PURE__ */ new Date()) {
	const counts = new Map(groups.flatMap((group) => group.kind === "dated" ? [[group.key, group.entries.length]] : []));
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dated = groups.filter((group) => group.kind === "dated");
	const oldest = dated.reduce((date, group) => group.kind === "dated" && group.date < date ? group.date : date, today);
	const start = dated.length ? new Date(oldest.getFullYear(), oldest.getMonth(), oldest.getDate() - 40) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 40);
	const days = [];
	for (const date = today; date >= start; date.setDate(date.getDate() - 1)) {
		const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const key = localDayKey(day);
		const period = day.getDay() === 0 || day.valueOf() === today.valueOf() ? `${monthNamesShort[day.getMonth()]} ${day.getFullYear()}` : "";
		days.push({
			key,
			date: day,
			count: counts.get(key) ?? 0,
			period
		});
	}
	return days;
}
function closestJournalDay(groups, key) {
	const [year, month, day] = key.split("-").map(Number);
	const target = new Date(year, month - 1, day, 12).valueOf();
	return groups.reduce((closest, group) => {
		if (group.kind !== "dated") return closest;
		if (!closest || closest.kind !== "dated") return group;
		return Math.abs(group.date.valueOf() - target) < Math.abs(closest.date.valueOf() - target) ? group : closest;
	}, void 0);
}

//#endregion
//#region JournalCalendar.tsx
const weekdays = [
	"вс",
	"пн",
	"вт",
	"ср",
	"чт",
	"пт",
	"сб"
];
const months = [
	"января",
	"февраля",
	"марта",
	"апреля",
	"мая",
	"июня",
	"июля",
	"августа",
	"сентября",
	"октября",
	"ноября",
	"декабря"
];
function JournalCalendar(props) {
	const days = buildCalendarDays(props.groups);
	const today = /* @__PURE__ */ new Date();
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "h-full border-l");
		bindProp(__nsh_hv0, "style", () => ({
			width: props.width,
			backgroundColor: props.colors.card,
			borderColor: props.resizeHovered ? props.colors.muted : props.colors.border,
			transitionProperty: "borderColor",
			transitionDuration: 150,
			transitionTimingFunction: "ease-out"
		}));
		const __nsh_hv1 = element("scroll");
		prop(__nsh_hv1, "class", "min-h-0 flex-1 px-3 pb-4");
		insert(__nsh_hv1, () => days.map((day) => (() => {
			const __nsh_hv2 = element("view");
			const __nsh_hv4 = element("view");
			prop(__nsh_hv4, "onPress", () => props.onSelect(day.key));
			prop(__nsh_hv4, "role", "button");
			bindProp(__nsh_hv4, "accessibilityLabel", () => `${day.date.getDate()} ${months[day.date.getMonth()]}, ${day.count} записей`);
			prop(__nsh_hv4, "class", "h-[25px] flex-row items-center justify-end gap-1.5 rounded-md px-1");
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "class", "max-w-[86px] flex-row flex-wrap justify-end gap-[3px]");
			insert(__nsh_hv5, () => Array.from({ length: Math.min(day.count, 24) }, () => (() => {
				const __nsh_hv6 = element("view");
				prop(__nsh_hv6, "class", "h-[3px] w-[3px] rounded-full");
				bindProp(__nsh_hv6, "style", () => ({ backgroundColor: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.muted }));
				return __nsh_hv6;
			})()));
			const __nsh_hv7 = element("view");
			prop(__nsh_hv7, "class", "h-px w-5");
			bindProp(__nsh_hv7, "style", () => ({ backgroundColor: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.border }));
			const __nsh_hv8 = element("text");
			prop(__nsh_hv8, "class", "w-5 text-right text-[10px]");
			bindProp(__nsh_hv8, "style", () => ({ color: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.muted }));
			insert(__nsh_hv8, () => weekdays[day.date.getDay()]);
			const __nsh_hv9 = element("text");
			prop(__nsh_hv9, "class", "w-5 text-right text-[11px]");
			bindProp(__nsh_hv9, "style", () => ({ color: day.date.toDateString() === today.toDateString() ? props.colors.accent : props.colors.foreground }));
			insert(__nsh_hv9, () => day.date.getDate());
			append(__nsh_hv4, __nsh_hv5);
			append(__nsh_hv4, __nsh_hv7);
			append(__nsh_hv4, __nsh_hv8);
			append(__nsh_hv4, __nsh_hv9);
			append(__nsh_hv2, __nsh_hv4);
			insert(__nsh_hv2, () => day.period && (() => {
				const __nsh_hv3 = element("text");
				prop(__nsh_hv3, "class", "pt-3 pb-1 pl-1 text-[10px] capitalize");
				bindProp(__nsh_hv3, "style", () => ({ color: props.colors.muted }));
				insert(__nsh_hv3, () => day.period);
				return __nsh_hv3;
			})(), __nsh_hv4);
			return __nsh_hv2;
		})()));
		append(__nsh_hv0, __nsh_hv1);
		return __nsh_hv0;
	})();
}

//#endregion
//#region JournalPage.tsx
const journalCalendarOpen = signal(false);
const NativeCalendarToggle = nativeComponent("atlas.journalCalendarToggle", {
	props: ["expanded", "label"],
	events: ["press"]
});
const journalCalendarWidth = signal(260);
const journalDraft = signal("");
const journalDraftContentHeight = signal(20);
const journalDraftMinContentHeight = 20;
const journalDraftMaxContentHeight = 100;
const journalDraftExpandedHeight = journalDraftMinContentHeight * 1.5;
const journalDraftVerticalPadding = 20;
const journalCalendarMinWidth = 220;
const journalCalendarMaxWidth = 420;
const journalCalendarResizeHovered = signal(false);
const journalCalendarResizeActive = signal(false);
const editingJournalId = signal(null);
const editingJournalText = signal("");
function timeLabel(createdAt) {
	const date = new Date(createdAt);
	return Number.isNaN(date.valueOf()) ? "" : date.toLocaleTimeString("ru-RU", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function JournalPage(props) {
	let feedRef;
	let pageWidth = 0;
	let resizeStartWidth = journalCalendarWidth();
	const resizeCalendar = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onPanResponderGrant: () => {
			resizeStartWidth = journalCalendarWidth();
			journalCalendarResizeActive.set(true);
		},
		onPanResponderMove: (_, gesture) => {
			const maxWidth = pageWidth > 0 ? Math.max(journalCalendarMinWidth, Math.min(journalCalendarMaxWidth, pageWidth * .42)) : journalCalendarMaxWidth;
			journalCalendarWidth.set(Math.max(journalCalendarMinWidth, Math.min(maxWidth, resizeStartWidth - gesture.dx)));
		},
		onPanResponderRelease: () => journalCalendarResizeActive.set(false),
		onPanResponderTerminate: () => journalCalendarResizeActive.set(false),
		onPanResponderTerminationRequest: () => false
	});
	const dayOffsets = /* @__PURE__ */ new Map();
	const groups = buildJournalDays(props.entries);
	effect(() => {
		if (props.entries.length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
	});
	const send = (text) => {
		const value = text.trim();
		if (!value) return;
		props.onCreate(value);
		journalDraft.set("");
		journalDraftContentHeight.set(journalDraftMinContentHeight);
	};
	const jumpToDay = (key) => {
		const target = closestJournalDay(groups, key);
		if (journalCalendarOpen()) toggleJournalCalendar();
		if (target?.kind === "dated") {
			const offset = dayOffsets.get(target.key);
			if (offset !== void 0) feedRef?.scrollTo({
				y: Math.max(0, offset - 12),
				animated: true
			});
		}
	};
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "onLayout", (bounds) => {
			pageWidth = bounds.size.width;
		});
		prop(__nsh_hv0, "class", "min-h-0 flex-1 flex-row overflow-hidden");
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "relative min-w-0 flex-1 flex-col items-center");
		const __nsh_hv3 = element("view");
		prop(__nsh_hv3, "class", "relative min-h-0 w-full flex-1");
		const __nsh_hv4 = element("scroll");
		prop(__nsh_hv4, "ref", (node) => {
			feedRef = node;
		});
		prop(__nsh_hv4, "class", "min-h-0 w-full flex-1 py-4");
		const __nsh_hv5 = element("view");
		prop(__nsh_hv5, "class", "mx-auto w-full max-w-[690px] px-5");
		insert(__nsh_hv5, [() => groups.map((group) => (() => {
			const __nsh_hv6 = element("view");
			prop(__nsh_hv6, "onLayout", (bounds) => {
				dayOffsets.set(group.key, bounds.origin.y);
			});
			prop(__nsh_hv6, "class", "mb-5");
			const __nsh_hv7 = element("view");
			prop(__nsh_hv7, "class", "mb-3 flex-row items-center justify-center");
			const __nsh_hv8 = element("view");
			prop(__nsh_hv8, "class", "h-px flex-1");
			bindProp(__nsh_hv8, "style", () => ({ backgroundColor: props.colors.border }));
			const __nsh_hv9 = element("text");
			prop(__nsh_hv9, "class", "mx-3 text-[12px] capitalize");
			bindProp(__nsh_hv9, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv9, () => formatJournalDay(group));
			const __nsh_hv10 = element("view");
			prop(__nsh_hv10, "class", "h-px flex-1");
			bindProp(__nsh_hv10, "style", () => ({ backgroundColor: props.colors.border }));
			append(__nsh_hv7, __nsh_hv8);
			append(__nsh_hv7, __nsh_hv9);
			append(__nsh_hv7, __nsh_hv10);
			append(__nsh_hv6, __nsh_hv7);
			insert(__nsh_hv6, () => group.entries.map((entry) => (() => {
				const __nsh_hv11 = element("view");
				prop(__nsh_hv11, "class", "mb-3 self-end w-full max-w-[650px] rounded-2xl px-4 py-3");
				bindProp(__nsh_hv11, "style", () => ({ backgroundColor: props.colors.card }));
				const __nsh_hv16 = element("view");
				prop(__nsh_hv16, "class", "mt-2 flex-row items-center justify-end gap-3");
				const __nsh_hv17 = element("text");
				prop(__nsh_hv17, "class", "text-[10px]");
				bindProp(__nsh_hv17, "style", () => ({ color: props.colors.muted }));
				insert(__nsh_hv17, () => timeLabel(entry.createdAt));
				append(__nsh_hv16, __nsh_hv17);
				insert(__nsh_hv16, () => editingJournalId() !== entry.id && (() => {
					const __nsh_hv18 = element("view");
					prop(__nsh_hv18, "class", "flex-row gap-3");
					const __nsh_hv19 = element("view");
					prop(__nsh_hv19, "onPress", () => {
						editingJournalId.set(entry.id);
						editingJournalText.set(entry.text);
					});
					prop(__nsh_hv19, "role", "button");
					prop(__nsh_hv19, "accessibilityLabel", "Изменить запись");
					const __nsh_hv20 = element("text");
					prop(__nsh_hv20, "class", "text-[11px]");
					bindProp(__nsh_hv20, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv21 = text("Изменить");
					append(__nsh_hv20, __nsh_hv21);
					append(__nsh_hv19, __nsh_hv20);
					const __nsh_hv22 = element("view");
					prop(__nsh_hv22, "onPress", () => props.onDelete(entry.id));
					prop(__nsh_hv22, "role", "button");
					prop(__nsh_hv22, "accessibilityLabel", "Удалить запись");
					const __nsh_hv23 = element("text");
					prop(__nsh_hv23, "class", "text-[11px]");
					bindProp(__nsh_hv23, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv24 = text("Удалить");
					append(__nsh_hv23, __nsh_hv24);
					append(__nsh_hv22, __nsh_hv23);
					append(__nsh_hv18, __nsh_hv19);
					append(__nsh_hv18, __nsh_hv22);
					return __nsh_hv18;
				})());
				append(__nsh_hv11, __nsh_hv16);
				insert(__nsh_hv11, () => editingJournalId() === entry.id ? (() => {
					const __nsh_hv12 = element("view");
					const __nsh_hv13 = element("input");
					bindProp(__nsh_hv13, "value", () => editingJournalText());
					prop(__nsh_hv13, "onChange", (value) => editingJournalText.set(value));
					prop(__nsh_hv13, "multiline", true);
					prop(__nsh_hv13, "submitBehavior", "newline");
					prop(__nsh_hv13, "class", "min-h-[56px] w-full rounded-lg px-2 py-1 text-[13px]");
					bindProp(__nsh_hv13, "style", () => ({
						color: props.colors.foreground,
						backgroundColor: props.colors.background
					}));
					const __nsh_hv14 = element("view");
					prop(__nsh_hv14, "class", "mt-2 flex-row justify-end gap-2");
					insert(__nsh_hv14, [component(Button, {
						label: "Отмена",
						get colors() {
							return props.colors;
						},
						onPress: () => editingJournalId.set(null)
					}), component(Button, {
						label: "Сохранить",
						get colors() {
							return props.colors;
						},
						onPress: () => {
							props.onUpdate(entry.id, editingJournalText());
							editingJournalId.set(null);
						},
						selected: true
					})]);
					append(__nsh_hv12, __nsh_hv13);
					append(__nsh_hv12, __nsh_hv14);
					return __nsh_hv12;
				})() : (() => {
					const __nsh_hv15 = element("text");
					prop(__nsh_hv15, "selectable", true);
					prop(__nsh_hv15, "class", "text-[14px] leading-6");
					bindProp(__nsh_hv15, "style", () => ({
						color: props.colors.foreground,
						selectionColor: props.colors.accent
					}));
					insert(__nsh_hv15, () => entry.text);
					return __nsh_hv15;
				})(), __nsh_hv16);
				return __nsh_hv11;
			})()));
			return __nsh_hv6;
		})()), () => groups.length === 0 && (() => {
			const __nsh_hv25 = element("view");
			prop(__nsh_hv25, "class", "flex-1 items-center justify-center py-12");
			const __nsh_hv26 = element("text");
			prop(__nsh_hv26, "class", "text-[13px]");
			bindProp(__nsh_hv26, "style", () => ({ color: props.colors.muted }));
			const __nsh_hv27 = text("Записей пока нет");
			append(__nsh_hv26, __nsh_hv27);
			append(__nsh_hv25, __nsh_hv26);
			return __nsh_hv25;
		})()]);
		append(__nsh_hv4, __nsh_hv5);
		const __nsh_hv28 = element("view");
		prop(__nsh_hv28, "pointerEvents", "none");
		prop(__nsh_hv28, "class", "absolute right-0 top-0 bottom-0 w-[8px]");
		bindProp(__nsh_hv28, "style", () => ({
			backgroundColor: props.colors.background,
			opacity: .86
		}));
		append(__nsh_hv3, __nsh_hv4);
		append(__nsh_hv3, __nsh_hv28);
		const __nsh_hv29 = element("view");
		prop(__nsh_hv29, "class", "mb-4 w-full px-5");
		const __nsh_hv30 = element("view");
		prop(__nsh_hv30, "class", "mx-auto w-full max-w-[650px] flex-row items-end gap-2 border pl-3 pr-1.5 py-1.5");
		bindProp(__nsh_hv30, "style", () => ({
			backgroundColor: props.colors.card,
			borderColor: props.colors.border,
			borderRadius: journalDraftContentHeight() > journalDraftExpandedHeight ? 24 : 999,
			transitionProperty: "borderRadius",
			transitionDuration: 180,
			transitionTimingFunction: "ease-out"
		}));
		const __nsh_hv31 = element("input");
		bindProp(__nsh_hv31, "value", () => journalDraft());
		prop(__nsh_hv31, "onChange", (value) => journalDraft.set(value));
		prop(__nsh_hv31, "onContentSizeChange", ({ height }) => journalDraftContentHeight.set(Math.max(journalDraftMinContentHeight, Math.min(journalDraftMaxContentHeight, height))));
		prop(__nsh_hv31, "onSubmit", (event) => send(event.text));
		prop(__nsh_hv31, "multiline", true);
		prop(__nsh_hv31, "submitBehavior", "submit");
		prop(__nsh_hv31, "placeholder", "Запись в дневник…");
		prop(__nsh_hv31, "accessibilityLabel", "Новая запись в дневник");
		prop(__nsh_hv31, "class", "max-h-[120px] flex-1 text-[15px]");
		bindProp(__nsh_hv31, "style", () => ({
			placeholderColor: props.colors.muted,
			selectionColor: props.colors.accent,
			height: journalDraftContentHeight() + journalDraftVerticalPadding,
			fontSize: 15,
			lineHeight: 20,
			paddingHorizontal: 10,
			paddingVertical: 10,
			backgroundColor: "transparent",
			color: props.colors.foreground
		}));
		const __nsh_hv32 = element("view");
		prop(__nsh_hv32, "onPress", () => send(journalDraft()));
		prop(__nsh_hv32, "role", "button");
		prop(__nsh_hv32, "accessibilityLabel", "Отправить запись");
		prop(__nsh_hv32, "class", "h-10 w-10 shrink-0 items-center justify-center rounded-full");
		bindProp(__nsh_hv32, "style", () => ({ backgroundColor: props.colors.accent }));
		const __nsh_hv33 = element("text");
		prop(__nsh_hv33, "class", "text-[20px] font-semibold");
		bindProp(__nsh_hv33, "style", () => ({ color: props.colors.foreground }));
		const __nsh_hv34 = text("↑");
		append(__nsh_hv33, __nsh_hv34);
		append(__nsh_hv32, __nsh_hv33);
		append(__nsh_hv30, __nsh_hv31);
		append(__nsh_hv30, __nsh_hv32);
		append(__nsh_hv29, __nsh_hv30);
		append(__nsh_hv1, __nsh_hv3);
		append(__nsh_hv1, __nsh_hv29);
		insert(__nsh_hv1, () => props.nativeCalendarButton ? component(NativeCalendarToggle, {
			get expanded() {
				return journalCalendarOpen();
			},
			get label() {
				return journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь";
			},
			onPress: toggleJournalCalendar,
			get accessibilityLabel() {
				return journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь";
			},
			class: "absolute right-4 top-4 z-10 h-8 w-8"
		}) : (() => {
			const __nsh_hv2 = element("view");
			prop(__nsh_hv2, "onPress", toggleJournalCalendar);
			prop(__nsh_hv2, "role", "button");
			bindProp(__nsh_hv2, "accessibilityLabel", () => journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь");
			bindProp(__nsh_hv2, "accessibilityState", () => ({ selected: journalCalendarOpen() }));
			prop(__nsh_hv2, "class", "absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-lg");
			bindProp(__nsh_hv2, "style", () => ({ backgroundColor: journalCalendarOpen() ? props.colors.card : "transparent" }));
			insert(__nsh_hv2, component(Icon, {
				name: "sidebar",
				get color() {
					return journalCalendarOpen() ? props.colors.accent : props.colors.muted;
				}
			}));
			return __nsh_hv2;
		})(), __nsh_hv3);
		const __nsh_hv35 = element("view");
		prop(__nsh_hv35, "class", "relative h-full shrink-0");
		bindProp(__nsh_hv35, "style", () => ({ width: journalCalendarOpen() ? journalCalendarWidth() : 0 }));
		const __nsh_hv36 = element("view");
		prop(__nsh_hv36, "class", "h-full w-full overflow-hidden");
		insert(__nsh_hv36, component(JournalCalendar, {
			get width() {
				return journalCalendarWidth();
			},
			get resizeHovered() {
				return journalCalendarResizeHovered() || journalCalendarResizeActive();
			},
			groups,
			get colors() {
				return props.colors;
			},
			onSelect: jumpToDay
		}));
		append(__nsh_hv35, __nsh_hv36);
		insert(__nsh_hv35, () => journalCalendarOpen() && (() => {
			const __nsh_hv37 = element("view");
			spread(__nsh_hv37, resizeCalendar.panHandlers);
			prop(__nsh_hv37, "role", "button");
			prop(__nsh_hv37, "accessibilityLabel", "Изменить ширину календаря");
			prop(__nsh_hv37, "onHoverIn", () => journalCalendarResizeHovered.set(true));
			prop(__nsh_hv37, "onHoverOut", () => journalCalendarResizeHovered.set(false));
			prop(__nsh_hv37, "class", "absolute top-0 bottom-0 z-10 w-5");
			prop(__nsh_hv37, "style", {
				left: -10,
				cursor: "col-resize"
			});
			return __nsh_hv37;
		})());
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv35);
		return __nsh_hv0;
	})();
}
function toggleJournalCalendar() {
	LayoutAnimation.configureNext({
		duration: 200,
		update: {
			type: "easeOut",
			duration: 200
		}
	});
	journalCalendarOpen.update((open) => !open);
}

//#endregion
//#region AtlasAppearanceSettings.tsx
const openSelector = signal(null);
const modePreviews = [
	{
		value: "system",
		label: "Система"
	},
	{
		value: "light",
		label: "Светлая"
	},
	{
		value: "dark",
		label: "Тёмная"
	}
];
const materialLabels = {
	default: "Сплошной",
	frosted: "Стекло",
	mica: "Системный"
};
const fontSizes = [
	12,
	13,
	14,
	15,
	16,
	18
];
function AtlasAppearanceSettings(props) {
	const appearance = () => props.appearance();
	const settings = () => appearance()?.settings;
	const colors = () => props.colors();
	const canEdit = () => props.editable() || !appearance()?.policy.following;
	const patch = (values) => {
		if (canEdit() && appearance()) props.onPatch(values);
	};
	const heading = (label) => (() => {
		const __nsh_hv0 = element("text");
		prop(__nsh_hv0, "class", "mb-2 text-[12px]");
		bindProp(__nsh_hv0, "style", () => ({ color: colors().muted }));
		insert(__nsh_hv0, label);
		return __nsh_hv0;
	})();
	const card = (selected, label, onPress) => (() => {
		const __nsh_hv1 = element("view");
		bindProp(__nsh_hv1, "onPress", () => canEdit() ? onPress : void 0);
		prop(__nsh_hv1, "role", "button");
		bindProp(__nsh_hv1, "accessibilityState", () => ({
			selected,
			disabled: !canEdit()
		}));
		prop(__nsh_hv1, "class", "rounded-lg border px-2.5 py-2");
		bindProp(__nsh_hv1, "style", () => ({
			backgroundColor: selected ? colors().card : colors().background,
			borderColor: selected ? colors().accent : colors().border,
			opacity: canEdit() ? 1 : .65
		}));
		const __nsh_hv2 = element("text");
		prop(__nsh_hv2, "class", "text-[12px]");
		bindProp(__nsh_hv2, "style", () => ({ color: selected ? colors().foreground : colors().muted }));
		insert(__nsh_hv2, label);
		append(__nsh_hv1, __nsh_hv2);
		return __nsh_hv1;
	})();
	const select = (id, value, options, onSelect, width, preview, menuWidth = width) => {
		const expanded = openSelector() === id;
		const label = id === "light" ? "Выбрать светлую тему" : id === "dark" ? "Выбрать тёмную тему" : "Выбрать размер текста";
		const trigger = (() => {
			const __nsh_hv3 = element("view");
			prop(__nsh_hv3, "role", "button");
			prop(__nsh_hv3, "accessibilityLabel", label);
			bindProp(__nsh_hv3, "accessibilityState", () => ({
				expanded,
				disabled: !canEdit()
			}));
			prop(__nsh_hv3, "class", "h-8 flex-row items-center justify-between rounded-lg border px-2.5");
			bindProp(__nsh_hv3, "style", () => ({
				backgroundColor: colors().card,
				borderColor: expanded ? colors().accent : colors().border,
				opacity: canEdit() ? 1 : .65
			}));
			const __nsh_hv4 = element("view");
			prop(__nsh_hv4, "class", "min-w-0 flex-1 flex-row items-center gap-2");
			const __nsh_hv5 = element("text");
			prop(__nsh_hv5, "class", "text-[12px]");
			bindProp(__nsh_hv5, "style", () => ({ color: colors().foreground }));
			insert(__nsh_hv5, () => options.find((option) => option.value === value)?.label ?? value);
			append(__nsh_hv4, __nsh_hv5);
			insert(__nsh_hv4, () => preview && component(PaletteChip, {
				get palette() {
					return options.find((option) => option.value === value)?.preview ?? colors();
				},
				get border() {
					return colors().border;
				}
			}), __nsh_hv5);
			const __nsh_hv6 = element("text");
			prop(__nsh_hv6, "class", "text-[11px]");
			bindProp(__nsh_hv6, "style", () => ({ color: colors().muted }));
			insert(__nsh_hv6, expanded ? "⌃" : "⌄");
			append(__nsh_hv3, __nsh_hv4);
			append(__nsh_hv3, __nsh_hv6);
			return __nsh_hv3;
		})();
		return (() => {
			const __nsh_hv7 = element("view");
			prop(__nsh_hv7, "style", { width });
			insert(__nsh_hv7, () => canEdit() ? component(Popover, {
				open: expanded,
				onOpenChange: (next) => openSelector.set(next ? id : null),
				placement: "bottom",
				align: "end",
				offset: 4,
				margin: 8,
				trigger,
				popupClass: "rounded-xl border p-1",
				get popupStyle() {
					return {
						width: menuWidth,
						backgroundColor: colors().card,
						borderColor: colors().border
					};
				},
				get children() {
					return (() => {
						const __nsh_hv8 = element("scroll");
						prop(__nsh_hv8, "accessibilityLabel", "Варианты выбора");
						bindProp(__nsh_hv8, "style", () => ({ height: Math.min(options.length * 32, 256) }));
						insert(__nsh_hv8, () => options.map((option) => (() => {
							const __nsh_hv9 = element("view");
							prop(__nsh_hv9, "onPress", () => {
								onSelect(option.value);
								openSelector.set(null);
							});
							prop(__nsh_hv9, "role", "button");
							bindProp(__nsh_hv9, "accessibilityState", () => ({ selected: option.value === value }));
							prop(__nsh_hv9, "class", "h-8 flex-row items-center gap-2 rounded-md px-2");
							const __nsh_hv10 = element("text");
							prop(__nsh_hv10, "class", "flex-1 text-[12px]");
							bindProp(__nsh_hv10, "style", () => ({ color: colors().foreground }));
							insert(__nsh_hv10, () => option.label);
							append(__nsh_hv9, __nsh_hv10);
							insert(__nsh_hv9, () => preview && component(PaletteChip, {
								get palette() {
									return option.preview ?? colors();
								},
								get border() {
									return colors().border;
								}
							}), __nsh_hv10);
							insert(__nsh_hv9, () => option.value === value && (() => {
								const __nsh_hv11 = element("text");
								prop(__nsh_hv11, "class", "text-[12px]");
								bindProp(__nsh_hv11, "style", () => ({ color: colors().accent }));
								const __nsh_hv12 = text("✓");
								append(__nsh_hv11, __nsh_hv12);
								return __nsh_hv11;
							})());
							return __nsh_hv9;
						})()));
						return __nsh_hv8;
					})();
				}
			}) : trigger);
			return __nsh_hv7;
		})();
	};
	const shortcutRow = (name, label) => (() => {
		const __nsh_hv13 = element("view");
		prop(__nsh_hv13, "class", "h-10 flex-row items-center border-b");
		bindProp(__nsh_hv13, "style", () => ({ borderColor: colors().border }));
		const __nsh_hv14 = element("text");
		prop(__nsh_hv14, "class", "flex-1 text-[13px]");
		bindProp(__nsh_hv14, "style", () => ({ color: colors().foreground }));
		insert(__nsh_hv14, label);
		const __nsh_hv15 = element("view");
		prop(__nsh_hv15, "onPress", () => props.onChangeShortcut(name));
		prop(__nsh_hv15, "role", "button");
		prop(__nsh_hv15, "accessibilityLabel", `Изменить сочетание: ${label}`);
		prop(__nsh_hv15, "class", "rounded-md px-3 py-1");
		bindProp(__nsh_hv15, "style", () => ({ backgroundColor: colors().background }));
		const __nsh_hv16 = element("text");
		prop(__nsh_hv16, "class", "text-[12px]");
		bindProp(__nsh_hv16, "style", () => ({ color: colors().accent }));
		insert(__nsh_hv16, () => keymap.label(props.shortcuts[name]));
		append(__nsh_hv15, __nsh_hv16);
		append(__nsh_hv13, __nsh_hv14);
		append(__nsh_hv13, __nsh_hv15);
		return __nsh_hv13;
	})();
	if (!settings() || !appearance()) return (() => {
		const __nsh_hv17 = element("scroll");
		prop(__nsh_hv17, "class", "min-h-0 flex-1 px-7 pt-4 pb-8");
		const __nsh_hv18 = element("text");
		prop(__nsh_hv18, "class", "text-[13px]");
		bindProp(__nsh_hv18, "style", () => ({ color: colors().muted }));
		const __nsh_hv19 = text("Загружаем настройки внешнего вида…");
		append(__nsh_hv18, __nsh_hv19);
		append(__nsh_hv17, __nsh_hv18);
		return __nsh_hv17;
	})();
	const current = () => settings();
	const modePalette = (mode) => {
		if (mode === "system") return colors();
		const themeKey = mode === "light" ? current().light_theme : current().dark_theme;
		const theme = props.themes.find((item) => item.key === themeKey);
		return (mode === "light" ? theme?.light : theme?.dark) ?? colors();
	};
	const modeCard = (mode) => {
		const palette = modePalette(mode.value);
		return (() => {
			const __nsh_hv20 = element("view");
			prop(__nsh_hv20, "onPress", () => patch({ mode: mode.value }));
			prop(__nsh_hv20, "role", "button");
			bindProp(__nsh_hv20, "accessibilityState", () => ({
				selected: current().mode === mode.value,
				disabled: !canEdit()
			}));
			prop(__nsh_hv20, "class", "min-w-0 flex-1");
			bindProp(__nsh_hv20, "style", () => ({ opacity: canEdit() ? 1 : .65 }));
			const __nsh_hv21 = element("view");
			prop(__nsh_hv21, "class", "h-[148px] items-center justify-center overflow-hidden rounded-md border p-3");
			bindProp(__nsh_hv21, "style", () => ({
				borderColor: current().mode === mode.value ? colors().accent : palette.border,
				backgroundColor: palette.background
			}));
			const __nsh_hv22 = element("view");
			prop(__nsh_hv22, "class", "h-full w-full flex-row overflow-hidden rounded-md border");
			bindProp(__nsh_hv22, "style", () => ({
				borderColor: palette.border,
				backgroundColor: palette.card
			}));
			const __nsh_hv23 = element("view");
			prop(__nsh_hv23, "class", "w-1/3 gap-2 border-r p-2");
			bindProp(__nsh_hv23, "style", () => ({ borderColor: palette.border }));
			const __nsh_hv24 = element("view");
			prop(__nsh_hv24, "class", "h-2 rounded");
			bindProp(__nsh_hv24, "style", () => ({ backgroundColor: palette.accent }));
			const __nsh_hv25 = element("view");
			prop(__nsh_hv25, "class", "h-1.5 rounded");
			bindProp(__nsh_hv25, "style", () => ({ backgroundColor: palette.muted }));
			const __nsh_hv26 = element("view");
			prop(__nsh_hv26, "class", "h-1.5 rounded");
			bindProp(__nsh_hv26, "style", () => ({ backgroundColor: palette.border }));
			append(__nsh_hv23, __nsh_hv24);
			append(__nsh_hv23, __nsh_hv25);
			append(__nsh_hv23, __nsh_hv26);
			const __nsh_hv27 = element("view");
			prop(__nsh_hv27, "class", "flex-1 gap-2 p-2");
			const __nsh_hv28 = element("view");
			prop(__nsh_hv28, "class", "h-2 w-1/2 rounded");
			bindProp(__nsh_hv28, "style", () => ({ backgroundColor: palette.muted }));
			const __nsh_hv29 = element("view");
			prop(__nsh_hv29, "class", "h-9 rounded");
			bindProp(__nsh_hv29, "style", () => ({ backgroundColor: palette.background }));
			const __nsh_hv30 = element("view");
			prop(__nsh_hv30, "class", "h-1.5 w-2/3 rounded");
			bindProp(__nsh_hv30, "style", () => ({ backgroundColor: palette.border }));
			append(__nsh_hv27, __nsh_hv28);
			append(__nsh_hv27, __nsh_hv29);
			append(__nsh_hv27, __nsh_hv30);
			append(__nsh_hv22, __nsh_hv23);
			append(__nsh_hv22, __nsh_hv27);
			append(__nsh_hv21, __nsh_hv22);
			const __nsh_hv31 = element("text");
			prop(__nsh_hv31, "class", "mt-2 text-center text-[12px]");
			bindProp(__nsh_hv31, "style", () => ({ color: current().mode === mode.value ? colors().accent : colors().muted }));
			insert(__nsh_hv31, () => mode.label);
			append(__nsh_hv20, __nsh_hv21);
			append(__nsh_hv20, __nsh_hv31);
			return __nsh_hv20;
		})();
	};
	return (() => {
		const __nsh_hv32 = element("scroll");
		prop(__nsh_hv32, "class", "min-h-0 flex-1 px-7 pt-4 pb-8");
		bindProp(__nsh_hv32, "style", () => ({ backgroundColor: colors().background }));
		const __nsh_hv33 = element("view");
		prop(__nsh_hv33, "class", "mx-auto w-full max-w-[720px]");
		const __nsh_hv34 = element("text");
		prop(__nsh_hv34, "class", "mb-5 text-[22px] font-semibold");
		bindProp(__nsh_hv34, "style", () => ({ color: colors().foreground }));
		const __nsh_hv35 = text("Оформление");
		append(__nsh_hv34, __nsh_hv35);
		const __nsh_hv40 = element("view");
		prop(__nsh_hv40, "class", "mb-6 flex-row gap-4");
		insert(__nsh_hv40, () => modePreviews.map(modeCard));
		const __nsh_hv41 = element("view");
		prop(__nsh_hv41, "class", "mb-6 gap-2 rounded-xl border p-3");
		bindProp(__nsh_hv41, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv42 = element("view");
		prop(__nsh_hv42, "class", "h-10 flex-row items-center justify-between border-b");
		bindProp(__nsh_hv42, "style", () => ({ borderColor: colors().border }));
		const __nsh_hv43 = element("text");
		prop(__nsh_hv43, "class", "text-[12px]");
		bindProp(__nsh_hv43, "style", () => ({ color: colors().foreground }));
		const __nsh_hv44 = text("Светлая тема");
		append(__nsh_hv43, __nsh_hv44);
		append(__nsh_hv42, __nsh_hv43);
		insert(__nsh_hv42, () => select("light", current().light_theme, props.themes.map((theme) => ({
			value: theme.key,
			label: theme.name,
			preview: theme.light
		})), (value) => patch({ light_theme: value }), 218, true, 260));
		const __nsh_hv45 = element("view");
		prop(__nsh_hv45, "class", "h-10 flex-row items-center justify-between");
		const __nsh_hv46 = element("text");
		prop(__nsh_hv46, "class", "text-[12px]");
		bindProp(__nsh_hv46, "style", () => ({ color: colors().foreground }));
		const __nsh_hv47 = text("Тёмная тема");
		append(__nsh_hv46, __nsh_hv47);
		append(__nsh_hv45, __nsh_hv46);
		insert(__nsh_hv45, () => select("dark", current().dark_theme, props.themes.map((theme) => ({
			value: theme.key,
			label: theme.name,
			preview: theme.dark
		})), (value) => patch({ dark_theme: value }), 218, true, 260));
		append(__nsh_hv41, __nsh_hv42);
		append(__nsh_hv41, __nsh_hv45);
		const __nsh_hv48 = element("view");
		prop(__nsh_hv48, "class", "mb-6 rounded-xl border p-3");
		bindProp(__nsh_hv48, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv49 = element("view");
		prop(__nsh_hv49, "class", "mb-3 flex-row gap-2");
		insert(__nsh_hv49, [
			() => card(current().accent_source === "theme", "Цвет темы", () => patch({
				accent_source: "theme",
				accent_color: null
			})),
			() => card(current().accent_source === "custom", "Свой цвет", () => patch({
				accent_source: "custom",
				accent_color: current().accent_color ?? accentChoices[0]
			})),
			() => appearance()?.capabilities.wallpaper_accent && card(current().accent_source === "wallpaper", "Обои", () => patch({ accent_source: "wallpaper" }))
		]);
		const __nsh_hv50 = element("view");
		prop(__nsh_hv50, "class", "flex-row gap-2");
		insert(__nsh_hv50, () => accentChoices.map((accent) => (() => {
			const __nsh_hv51 = element("view");
			prop(__nsh_hv51, "onPress", () => patch({
				accent_source: "custom",
				accent_color: accent
			}));
			prop(__nsh_hv51, "role", "button");
			prop(__nsh_hv51, "accessibilityLabel", `Акцент ${accent}`);
			bindProp(__nsh_hv51, "accessibilityState", () => ({ selected: current().accent_source === "custom" && current().accent_color?.toLowerCase() === accent }));
			prop(__nsh_hv51, "class", "h-7 w-7 items-center justify-center rounded-lg border");
			bindProp(__nsh_hv51, "style", () => ({
				backgroundColor: accent,
				borderColor: current().accent_color?.toLowerCase() === accent ? colors().foreground : colors().border
			}));
			insert(__nsh_hv51, () => current().accent_color?.toLowerCase() === accent && (() => {
				const __nsh_hv52 = element("text");
				prop(__nsh_hv52, "class", "text-[12px]");
				prop(__nsh_hv52, "style", { color: "#ffffff" });
				const __nsh_hv53 = text("✓");
				append(__nsh_hv52, __nsh_hv53);
				return __nsh_hv52;
			})());
			return __nsh_hv51;
		})()));
		append(__nsh_hv48, __nsh_hv49);
		append(__nsh_hv48, __nsh_hv50);
		const __nsh_hv54 = element("view");
		prop(__nsh_hv54, "class", "mb-6 flex-row gap-2");
		insert(__nsh_hv54, () => (appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current().material, (next) => patch({ material: next }), colors(), canEdit())));
		const __nsh_hv55 = element("view");
		prop(__nsh_hv55, "class", "mb-6 flex-row items-center gap-3");
		const __nsh_hv56 = element("text");
		prop(__nsh_hv56, "class", "flex-1 text-[12px]");
		bindProp(__nsh_hv56, "style", () => ({ color: colors().muted }));
		const __nsh_hv57 = text("Размер интерфейсного текста");
		append(__nsh_hv56, __nsh_hv57);
		append(__nsh_hv55, __nsh_hv56);
		insert(__nsh_hv55, () => select("fontSize", String(current().font_size), [.../* @__PURE__ */ new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({
			value: String(size),
			label: `${size} px`
		})), (value) => patch({ font_size: Number(value) }), 128));
		const __nsh_hv58 = element("view");
		prop(__nsh_hv58, "class", "rounded-xl border px-4");
		bindProp(__nsh_hv58, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv59 = element("view");
		prop(__nsh_hv59, "class", "h-10 flex-row items-center");
		const __nsh_hv60 = element("text");
		prop(__nsh_hv60, "class", "flex-1 text-[13px]");
		bindProp(__nsh_hv60, "style", () => ({ color: colors().foreground }));
		const __nsh_hv61 = text("Закрыть панель / поиск");
		append(__nsh_hv60, __nsh_hv61);
		const __nsh_hv62 = element("text");
		prop(__nsh_hv62, "class", "text-[12px]");
		bindProp(__nsh_hv62, "style", () => ({ color: colors().muted }));
		const __nsh_hv63 = text("Esc");
		append(__nsh_hv62, __nsh_hv63);
		append(__nsh_hv59, __nsh_hv60);
		append(__nsh_hv59, __nsh_hv62);
		append(__nsh_hv58, __nsh_hv59);
		insert(__nsh_hv58, [
			() => shortcutRow("sidebar", "Боковая панель — открыть/скрыть"),
			() => shortcutRow("create", "Новая задача — панель справа"),
			() => shortcutRow("search", "Быстрый поиск"),
			() => shortcutRow("reload", "Обновить данные из Engine")
		], __nsh_hv59);
		append(__nsh_hv33, __nsh_hv34);
		append(__nsh_hv33, __nsh_hv40);
		append(__nsh_hv33, __nsh_hv41);
		append(__nsh_hv33, __nsh_hv48);
		append(__nsh_hv33, __nsh_hv54);
		append(__nsh_hv33, __nsh_hv55);
		append(__nsh_hv33, __nsh_hv58);
		insert(__nsh_hv33, [
			() => appearance()?.policy.following && (() => {
				const __nsh_hv36 = element("text");
				prop(__nsh_hv36, "class", "mb-4 text-[12px]");
				bindProp(__nsh_hv36, "style", () => ({ color: colors().accent }));
				const __nsh_hv37 = text("Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.");
				append(__nsh_hv36, __nsh_hv37);
				return __nsh_hv36;
			})(),
			() => !props.editable() && !appearance()?.policy.following && (() => {
				const __nsh_hv38 = element("text");
				prop(__nsh_hv38, "class", "mb-4 text-[12px]");
				bindProp(__nsh_hv38, "style", () => ({ color: colors().muted }));
				const __nsh_hv39 = text("Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.");
				append(__nsh_hv38, __nsh_hv39);
				return __nsh_hv38;
			})(),
			() => heading("Режим")
		], __nsh_hv40);
		insert(__nsh_hv33, () => heading("Темы"), __nsh_hv41);
		insert(__nsh_hv33, () => heading("Акцент"), __nsh_hv48);
		insert(__nsh_hv33, () => heading("Стекло"), __nsh_hv54);
		insert(__nsh_hv33, () => heading("Размер текста"), __nsh_hv55);
		insert(__nsh_hv33, () => heading("Горячие клавиши"), __nsh_hv58);
		append(__nsh_hv32, __nsh_hv33);
		return __nsh_hv32;
	})();
}
function selectLabel(material, label, selected, onPress, colors, editable) {
	return (() => {
		const __nsh_hv64 = element("view");
		bindProp(__nsh_hv64, "onPress", () => editable ? () => onPress(material) : void 0);
		prop(__nsh_hv64, "role", "button");
		prop(__nsh_hv64, "accessibilityState", {
			selected: selected === material,
			disabled: !editable
		});
		prop(__nsh_hv64, "class", "rounded-lg border px-3 py-2");
		bindProp(__nsh_hv64, "style", () => ({
			backgroundColor: selected === material ? colors.card : colors.background,
			borderColor: selected === material ? colors.accent : colors.border,
			opacity: editable ? 1 : .65
		}));
		const __nsh_hv65 = element("text");
		prop(__nsh_hv65, "class", "text-[12px]");
		bindProp(__nsh_hv65, "style", () => ({ color: selected === material ? colors.foreground : colors.muted }));
		insert(__nsh_hv65, label);
		append(__nsh_hv64, __nsh_hv65);
		return __nsh_hv64;
	})();
}
function PaletteChip(props) {
	return (() => {
		const __nsh_hv66 = element("view");
		prop(__nsh_hv66, "class", "h-4 w-5 overflow-hidden rounded border");
		bindProp(__nsh_hv66, "style", () => ({
			backgroundColor: props.palette.background,
			borderColor: props.border
		}));
		const __nsh_hv67 = element("view");
		prop(__nsh_hv67, "class", "h-1 w-full");
		bindProp(__nsh_hv67, "style", () => ({ backgroundColor: props.palette.accent }));
		append(__nsh_hv66, __nsh_hv67);
		return __nsh_hv66;
	})();
}

//#endregion
//#region App.tsx
setup(null, "{\n  \"cssVars\": {\n    \"theme\": {\n      \"font-sans\": \"Inter, sans-serif\",\n      \"radius\": \"0.625rem\",\n      \"radius-control\": \"0.5rem\",\n      \"spacing-sidebar\": \"240px\",\n      \"spacing-titlebar\": \"40px\",\n      \"spacing-row\": \"32px\",\n      \"font-size-body\": \"13px\",\n      \"font-size-label\": \"12px\"\n    },\n    \"light\": {\n      \"background\": \"#faf9fb\",\n      \"foreground\": \"#26242a\",\n      \"card\": \"#f2f0f4\",\n      \"card-foreground\": \"#26242a\",\n      \"muted\": \"#ece9ef\",\n      \"muted-foreground\": \"#77727e\",\n      \"primary\": \"#7152bf\",\n      \"primary-foreground\": \"#ffffff\",\n      \"border\": \"#dedbe2\",\n      \"input\": \"#dedbe2\",\n      \"ring\": \"#b18aff\"\n    },\n    \"dark\": {\n      \"background\": \"#0d0c10\",\n      \"foreground\": \"#e7e5ea\",\n      \"card\": \"#131216\",\n      \"card-foreground\": \"#e7e5ea\",\n      \"muted\": \"#27262a\",\n      \"muted-foreground\": \"#8d8a94\",\n      \"primary\": \"#af94f9\",\n      \"primary-foreground\": \"#0d0c10\",\n      \"border\": \"#27262a\",\n      \"input\": \"#27262a\",\n      \"ring\": \"#af94f9\"\n    }\n  }\n}\n", null, null);
const initialValue = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__");
const initial = isSnapshot(initialValue) ? initialValue : fallback;
const snapshot = signal(initial);
const route = signal(initial.route);
const addTaskOpen = signal(false);
const newTaskTitle = signal("");
const sidebarVisible = signal(true);
const shortcutNames = [
	"sidebar",
	"create",
	"search",
	"reload"
];
const defaultShortcuts = {
	sidebar: "mod+b",
	create: "mod+n",
	search: "mod+k",
	reload: "mod+r"
};
const shortcutOptions = {
	sidebar: ["mod+b", "mod+shift+b"],
	create: ["mod+n", "mod+shift+n"],
	search: ["mod+k", "mod+shift+k"],
	reload: ["mod+r", "mod+shift+r"]
};
const shortcuts = signal(defaultShortcuts);
Storage.getItem("mundus.atlas.shortcuts.v1").then((value) => {
	if (!value) return;
	try {
		const saved = JSON.parse(value);
		shortcuts.set(Object.fromEntries(shortcutNames.map((name) => [name, shortcutOptions[name].includes(saved[name] ?? "") ? saved[name] : defaultShortcuts[name]])));
	} catch {}
});
const Bridge = nativeComponent("atlas.bridge", {
	props: ["route"],
	events: [
		"state",
		"navigate",
		"journal"
	]
});
function iconForNavigation(id) {
	switch (id) {
		case "journal": return "logbook";
		case "tasks": return "week";
		default: return "settings";
	}
}
function AtlasTitlebar(props) {
	effect(() => Window.setTitleBar("hidden", spacing.titlebarHeight));
	const controls = titleBar();
	const customControls = controls.left === 0 && controls.right === 0;
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "w-full flex-row items-center");
		bindProp(__nsh_hv0, "style", () => ({ height: controls.height || spacing.titlebarHeight }));
		prop(__nsh_hv0, "desktop", { windowDrag: true });
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "flex-row items-center");
		bindProp(__nsh_hv1, "style", () => ({
			width: (props.sidebarVisible ? spacing.sidebarWidth : 40) + controls.left,
			height: spacing.titlebarHeight
		}));
		const __nsh_hv2 = element("view");
		bindProp(__nsh_hv2, "style", () => ({ width: controls.left }));
		const __nsh_hv3 = element("view");
		bindProp(__nsh_hv3, "onPress", () => props.onToggleSidebar);
		prop(__nsh_hv3, "role", "button");
		prop(__nsh_hv3, "accessibilityLabel", "Боковая панель");
		prop(__nsh_hv3, "class", "w-10 items-center justify-center");
		bindProp(__nsh_hv3, "style", () => ({ height: spacing.titlebarHeight }));
		insert(__nsh_hv3, component(Icon, {
			name: "sidebar",
			get color() {
				return props.colors.muted;
			}
		}));
		const __nsh_hv4 = element("view");
		prop(__nsh_hv4, "class", "flex-1");
		prop(__nsh_hv4, "desktop", { windowDrag: true });
		append(__nsh_hv1, __nsh_hv2);
		append(__nsh_hv1, __nsh_hv3);
		append(__nsh_hv1, __nsh_hv4);
		append(__nsh_hv0, __nsh_hv1);
		insert(__nsh_hv0, [() => props.showPageIdentity ? (() => {
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "class", "flex-1 flex-row items-center gap-1.5");
			prop(__nsh_hv5, "desktop", { windowDrag: true });
			const __nsh_hv6 = element("text");
			prop(__nsh_hv6, "class", "font-medium");
			bindProp(__nsh_hv6, "style", () => ({
				fontSize: typography.titlebar,
				color: props.colors.foreground
			}));
			insert(__nsh_hv6, () => props.title);
			append(__nsh_hv5, __nsh_hv6);
			insert(__nsh_hv5, component(Icon, {
				get name() {
					return props.icon;
				},
				size: 15,
				get color() {
					return props.colors.muted;
				}
			}), __nsh_hv6);
			return __nsh_hv5;
		})() : (() => {
			const __nsh_hv7 = element("view");
			prop(__nsh_hv7, "class", "flex-1");
			prop(__nsh_hv7, "desktop", { windowDrag: true });
			return __nsh_hv7;
		})(), () => customControls ? (() => {
			const __nsh_hv8 = element("view");
			prop(__nsh_hv8, "class", "flex-row");
			bindProp(__nsh_hv8, "style", () => ({
				width: 138,
				height: spacing.titlebarHeight
			}));
			const __nsh_hv9 = element("view");
			prop(__nsh_hv9, "onPress", () => Window.minimize());
			prop(__nsh_hv9, "role", "button");
			prop(__nsh_hv9, "accessibilityLabel", "Свернуть окно");
			prop(__nsh_hv9, "class", "w-[46px] items-center justify-center");
			bindProp(__nsh_hv9, "style", () => ({ height: spacing.titlebarHeight }));
			insert(__nsh_hv9, component(Icon, {
				name: "windowMin",
				get color() {
					return props.colors.foreground;
				},
				size: 14
			}));
			const __nsh_hv10 = element("view");
			prop(__nsh_hv10, "onPress", () => Window.toggleMaximize());
			prop(__nsh_hv10, "role", "button");
			prop(__nsh_hv10, "accessibilityLabel", "Развернуть окно");
			prop(__nsh_hv10, "class", "w-[46px] items-center justify-center");
			bindProp(__nsh_hv10, "style", () => ({ height: spacing.titlebarHeight }));
			insert(__nsh_hv10, component(Icon, {
				name: "windowMax",
				get color() {
					return props.colors.foreground;
				},
				size: 14
			}));
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "onPress", () => Window.close());
			prop(__nsh_hv11, "role", "button");
			prop(__nsh_hv11, "accessibilityLabel", "Закрыть окно");
			prop(__nsh_hv11, "class", "w-[46px] items-center justify-center");
			bindProp(__nsh_hv11, "style", () => ({ height: spacing.titlebarHeight }));
			insert(__nsh_hv11, component(Icon, {
				name: "windowClose",
				get color() {
					return props.colors.foreground;
				},
				size: 14
			}));
			append(__nsh_hv8, __nsh_hv9);
			append(__nsh_hv8, __nsh_hv10);
			append(__nsh_hv8, __nsh_hv11);
			return __nsh_hv8;
		})() : (() => {
			const __nsh_hv12 = element("view");
			bindProp(__nsh_hv12, "style", () => ({ width: controls.right }));
			return __nsh_hv12;
		})()]);
		return __nsh_hv0;
	})();
}
function TaskRows() {
	return each(() => snapshot().todos, (todo) => (() => {
		const __nsh_hv13 = element("view");
		prop(__nsh_hv13, "class", "flex-row items-center border-b px-3");
		bindProp(__nsh_hv13, "style", () => ({
			height: 37 * (snapshot().appearance?.settings.font_size ?? 13) / 13,
			borderColor: snapshot().colors.border
		}));
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "onPress", () => commandRef?.("complete", { id: todo().id }));
		prop(__nsh_hv14, "role", "checkbox");
		bindProp(__nsh_hv14, "accessibilityLabel", () => todo().title);
		bindProp(__nsh_hv14, "accessibilityState", () => ({ checked: todo().is_completed }));
		prop(__nsh_hv14, "class", "mr-3 h-[14px] w-[14px] items-center justify-center rounded-full border");
		bindProp(__nsh_hv14, "style", () => ({
			borderColor: todo().is_completed ? snapshot().colors.accent : snapshot().colors.muted,
			backgroundColor: todo().is_completed ? snapshot().colors.accent : "transparent"
		}));
		insert(__nsh_hv14, () => todo().is_completed && component(Icon, {
			name: "check",
			size: 10,
			get color() {
				return snapshot().colors.background;
			}
		}));
		const __nsh_hv15 = element("text");
		bindProp(__nsh_hv15, "class", () => todo().is_completed ? "line-through" : "");
		bindProp(__nsh_hv15, "style", () => ({
			fontSize: snapshot().appearance?.settings.font_size ?? 13,
			color: todo().is_completed ? snapshot().colors.muted : snapshot().colors.foreground
		}));
		insert(__nsh_hv15, () => todo().title);
		append(__nsh_hv13, __nsh_hv14);
		append(__nsh_hv13, __nsh_hv15);
		return __nsh_hv13;
	})());
}
let commandRef;
function setAppearance(patch) {
	const current = snapshot();
	if (current.appearance && !current.appearance.policy.following) {
		const appearance = {
			...current.appearance,
			settings: {
				...current.appearance.settings,
				...patch
			}
		};
		snapshot.set({
			...current,
			appearance,
			colors: resolveAppearanceColors(appearance, current.themes, current.colors)
		});
	}
	if (current.appearanceEditable) commandRef?.("appearance.set", patch);
}
function cycleShortcut(name) {
	const current = shortcuts();
	const choices = shortcutOptions[name];
	const next = choices[(choices.indexOf(current[name]) + 1) % choices.length];
	const updated = {
		...current,
		[name]: next
	};
	shortcuts.set(updated);
	Storage.setItem("mundus.atlas.shortcuts.v1", JSON.stringify(updated));
}
function TaskPage() {
	return (() => {
		const __nsh_hv16 = element("scroll");
		prop(__nsh_hv16, "class", "min-h-0 flex-1 px-7 py-5");
		const __nsh_hv17 = element("view");
		prop(__nsh_hv17, "class", "mx-auto w-full max-w-[640px]");
		insert(__nsh_hv17, () => snapshot().todos.length === 0 ? (() => {
			const __nsh_hv18 = element("view");
			prop(__nsh_hv18, "class", "items-center py-12");
			const __nsh_hv19 = element("text");
			prop(__nsh_hv19, "class", "text-[13px]");
			bindProp(__nsh_hv19, "style", () => ({ color: snapshot().colors.muted }));
			const __nsh_hv20 = text("Задач пока нет");
			append(__nsh_hv19, __nsh_hv20);
			append(__nsh_hv18, __nsh_hv19);
			return __nsh_hv18;
		})() : component(TaskRows, {}));
		append(__nsh_hv16, __nsh_hv17);
		return __nsh_hv16;
	})();
}
effect(() => {
	const active = shortcuts();
	const unbind = [
		keymap.bind(active.sidebar, () => commandRef?.("toggle-sidebar"), { when: "notEditing" }),
		keymap.bind(active.create, () => {
			newTaskTitle.set("");
			addTaskOpen.set(true);
		}, { when: "notEditing" }),
		keymap.bind(active.reload, () => commandRef?.("reload"), { when: "notEditing" })
	];
	return () => unbind.forEach((remove) => remove());
});
function SettingsPage() {
	return component(AtlasAppearanceSettings, {
		appearance: () => snapshot().appearance,
		editable: () => snapshot().appearanceEditable,
		get themes() {
			return snapshot().themes;
		},
		colors: () => snapshot().colors,
		get shortcuts() {
			return shortcuts();
		},
		onPatch: setAppearance,
		onChangeShortcut: cycleShortcut
	});
}
function App() {
	const primaryNavigation = navigation_default.filter((item) => !item.footer);
	const footerNavigation = navigation_default.filter((item) => item.footer);
	const openNewTask = () => {
		newTaskTitle.set("");
		addTaskOpen.set(true);
	};
	const changeRoute = (target) => {
		if (!isRoute(target)) return;
		if (target !== "journal" && journalCalendarOpen()) toggleJournalCalendar();
		route.set(target);
	};
	return (() => {
		const __nsh_hv21 = element("view");
		prop(__nsh_hv21, "class", "relative h-full w-full flex-col");
		bindProp(__nsh_hv21, "style", () => ({ backgroundColor: snapshot().colors.background }));
		const __nsh_hv22 = element("view");
		prop(__nsh_hv22, "class", "min-h-0 flex-1 flex-row");
		const __nsh_hv26 = element("view");
		prop(__nsh_hv26, "class", "relative min-w-0 flex-1");
		insert(__nsh_hv26, [
			() => route() === "journal" && component(JournalPage, {
				get entries() {
					return snapshot().journalEntries;
				},
				get colors() {
					return snapshot().colors;
				},
				onCreate: (text) => commandRef?.("journal.create", { text }),
				onUpdate: (id, text) => commandRef?.("journal.update", {
					id,
					text
				}),
				onDelete: (id) => commandRef?.("journal.delete", { id }),
				get nativeCalendarButton() {
					return snapshot().chrome === "native";
				}
			}),
			() => route() === "tasks" && (() => {
				const __nsh_hv27 = element("view");
				prop(__nsh_hv27, "class", "min-h-0 flex-1");
				insert(__nsh_hv27, [component(TaskPage, {}), () => snapshot().chrome === "tsx" && (() => {
					const __nsh_hv28 = element("view");
					prop(__nsh_hv28, "onPress", openNewTask);
					prop(__nsh_hv28, "role", "button");
					prop(__nsh_hv28, "accessibilityLabel", "Новая задача");
					prop(__nsh_hv28, "class", "absolute right-6 bottom-6 h-11 w-11 items-center justify-center rounded-full");
					bindProp(__nsh_hv28, "style", () => ({ backgroundColor: snapshot().colors.foreground }));
					insert(__nsh_hv28, component(Icon, {
						name: "plus",
						size: 20,
						get color() {
							return snapshot().colors.background;
						}
					}));
					return __nsh_hv28;
				})()]);
				return __nsh_hv27;
			})(),
			() => route() === "settings" && component(SettingsPage, {}),
			() => addTaskOpen() && component(Dialog, {
				title: "Новая задача",
				get colors() {
					return snapshot().colors;
				},
				get children() {
					return [(() => {
						const __nsh_hv29 = element("input");
						bindProp(__nsh_hv29, "value", () => newTaskTitle());
						prop(__nsh_hv29, "onChange", (value) => newTaskTitle.set(value));
						prop(__nsh_hv29, "onSubmit", (event) => {
							commandRef?.("create", { title: event.text });
							addTaskOpen.set(false);
						});
						prop(__nsh_hv29, "placeholder", "Название задачи");
						prop(__nsh_hv29, "class", "h-10 rounded-lg px-3 text-[13px]");
						bindProp(__nsh_hv29, "style", () => ({
							backgroundColor: snapshot().colors.background,
							color: snapshot().colors.foreground
						}));
						return __nsh_hv29;
					})(), (() => {
						const __nsh_hv30 = element("view");
						prop(__nsh_hv30, "class", "mt-3 flex-row justify-end gap-2");
						insert(__nsh_hv30, [component(Button, {
							label: "Отмена",
							get colors() {
								return snapshot().colors;
							},
							onPress: () => addTaskOpen.set(false),
							className: "border-0 px-0 py-0",
							style: {
								backgroundColor: "transparent",
								borderColor: "transparent"
							}
						}), component(Button, {
							label: "Добавить",
							get colors() {
								return snapshot().colors;
							},
							onPress: () => {
								commandRef?.("create", { title: newTaskTitle() });
								addTaskOpen.set(false);
							},
							selected: true,
							className: "h-9 w-[90px] items-center justify-center px-0 py-0",
							get style() {
								return {
									backgroundColor: snapshot().colors.accent,
									borderColor: "transparent"
								};
							},
							get textColor() {
								return snapshot().colors.background;
							}
						})]);
						return __nsh_hv30;
					})()];
				}
			})
		]);
		append(__nsh_hv22, __nsh_hv26);
		insert(__nsh_hv22, () => snapshot().chrome === "tsx" && (() => {
			const __nsh_hv23 = element("view");
			prop(__nsh_hv23, "class", "w-[240px] shrink-0 border-r px-2 pt-1");
			bindProp(__nsh_hv23, "style", () => ({
				borderColor: snapshot().colors.border,
				display: sidebarVisible() ? "flex" : "none"
			}));
			const __nsh_hv24 = element("view");
			prop(__nsh_hv24, "class", "gap-0.5");
			insert(__nsh_hv24, () => primaryNavigation.map((item) => component(NavigationItem, {
				get label() {
					return item.label;
				},
				get icon() {
					return iconForNavigation(item.id);
				},
				get selected() {
					return route() === item.id;
				},
				get colors() {
					return snapshot().colors;
				},
				onPress: () => changeRoute(item.id)
			})));
			const __nsh_hv25 = element("view");
			prop(__nsh_hv25, "class", "mt-auto mb-2 gap-0.5");
			insert(__nsh_hv25, () => footerNavigation.map((item) => component(NavigationItem, {
				get label() {
					return item.label;
				},
				get icon() {
					return iconForNavigation(item.id);
				},
				get selected() {
					return route() === item.id;
				},
				get colors() {
					return snapshot().colors;
				},
				onPress: () => changeRoute(item.id)
			})));
			append(__nsh_hv23, __nsh_hv24);
			append(__nsh_hv23, __nsh_hv25);
			return __nsh_hv23;
		})(), __nsh_hv26);
		append(__nsh_hv21, __nsh_hv22);
		insert(__nsh_hv21, [component(Bridge, {
			class: "absolute left-0 top-0 h-px w-px",
			ref: (node) => {
				commandRef = (name, args) => node.command(name, args);
			},
			get route() {
				return route();
			},
			onState: (next) => {
				route.set(next.route);
				snapshot.set({
					...next,
					journalEntries: snapshot().journalEntries
				});
				sidebarVisible.set(next.sidebarVisible);
			},
			onJournal: (entries) => snapshot.set({
				...snapshot(),
				journalEntries: entries
			}),
			onNavigate: (event) => changeRoute(event.route)
		}), () => snapshot().chrome === "tsx" && component(AtlasTitlebar, {
			get title() {
				return snapshot().title;
			},
			get icon() {
				return iconForNavigation(route());
			},
			get colors() {
				return snapshot().colors;
			},
			onToggleSidebar: () => commandRef?.("toggle-sidebar"),
			get sidebarVisible() {
				return sidebarVisible();
			},
			get showPageIdentity() {
				return route() !== "settings";
			}
		})], __nsh_hv22);
		return __nsh_hv21;
	})();
}
mount(App);

//#endregion
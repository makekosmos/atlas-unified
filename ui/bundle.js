import { append, bindProp, component, each, element, font, insert, prop, setup, spread, text } from "nsh:rt";
import { PanResponder, Storage, effect, keymap, mount, nativeComponent, signal } from "nsh";
import { Window, titleBar } from "nsh/desktop";
import { Popover } from "nsh/base";

//#region ../node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+6e9b9b5d5bf9ff48ad29f9e9600e2e93eb6a9c11/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/types.ts
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
//#region ../node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+6e9b9b5d5bf9ff48ad29f9e9600e2e93eb6a9c11/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/icons.ts
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
//#region ../node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+6e9b9b5d5bf9ff48ad29f9e9600e2e93eb6a9c11/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/components.tsx
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
		"footer": false,
		"devOnly": true
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
	devFeatures: true,
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
	return "version" in value && typeof value.version === "string" && "appearanceEditable" in value && typeof value.appearanceEditable === "boolean" && "themes" in value && Array.isArray(value.themes) && "colors" in value && isColors(value.colors) && "sidebarVisible" in value && typeof value.sidebarVisible === "boolean" && "devFeatures" in value && typeof value.devFeatures === "boolean" && (value.route !== "tasks" || value.devFeatures) && "chrome" in value && (value.chrome === "native" || value.chrome === "tsx" || value.chrome === "mobile");
}
function canNavigateToRoute(route, devFeatures) {
	return route !== "tasks" || devFeatures;
}
function isRoute(value) {
	return value === "home" || value === "journal" || value === "tasks" || value === "settings";
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
const weekdays$1 = [
	"воскресенье",
	"понедельник",
	"вторник",
	"среда",
	"четверг",
	"пятница",
	"суббота"
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
	if (localDayKey(group.date) === localDayKey(now)) return "Сегодня";
	const year = group.date.getFullYear() === now.getFullYear() ? "" : ` ${group.date.getFullYear()}`;
	return `${weekdays$1[group.date.getDay()]}, ${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
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
const journalDraftMaxContentHeight = 240;
const journalDraftExpandedHeight = journalDraftMinContentHeight * 1.5;
const journalDraftVerticalPadding = 20;
const editingJournalId = signal(null);
const editingJournalText = signal("");
const activeJournalEntry = signal(null);
const journalSelectionEntryId = signal(null);
const journalActionsClosing = signal(false);
const mobileJournalEditorOpen = signal(false);
const mobileJournalEditorDragY = signal(0);
const mobileJournalEditorClosing = signal(false);
const mobileJournalDiscardPrompt = signal(false);
let mobileJournalEditorTimer;
let journalActionsTimer;
function openJournalActions(entry) {
	journalSelectionEntryId.set(null);
	activeJournalEntry.set(entry);
	journalActionsClosing.set(true);
	if (journalActionsTimer !== void 0) clearTimeout(journalActionsTimer);
	journalActionsTimer = setTimeout(() => {
		journalActionsClosing.set(false);
		journalActionsTimer = void 0;
	}, 16);
}
function closeJournalActions() {
	journalActionsClosing.set(true);
	if (journalActionsTimer !== void 0) clearTimeout(journalActionsTimer);
	journalActionsTimer = setTimeout(() => {
		activeJournalEntry.set(null);
		journalActionsClosing.set(false);
		journalActionsTimer = void 0;
	}, 130);
}
function closeMobileJournalEditor(discard) {
	mobileJournalDiscardPrompt.set(false);
	mobileJournalEditorClosing.set(true);
	if (mobileJournalEditorTimer !== void 0) clearTimeout(mobileJournalEditorTimer);
	mobileJournalEditorTimer = setTimeout(() => {
		if (discard) {
			journalDraft.set("");
			journalDraftContentHeight.set(journalDraftMinContentHeight);
		}
		mobileJournalEditorOpen.set(false);
		mobileJournalEditorClosing.set(false);
		mobileJournalEditorTimer = void 0;
	}, 180);
}
function openMobileJournalEditor() {
	mobileJournalEditorClosing.set(false);
	mobileJournalEditorDragY.set(0);
	mobileJournalEditorOpen.set(true);
}
function requestMobileJournalBack() {
	if (!mobileJournalEditorOpen()) return;
	if (mobileJournalDiscardPrompt()) {
		mobileJournalDiscardPrompt.set(false);
		return;
	}
	if (journalDraft().trim()) mobileJournalDiscardPrompt.set(true);
	else closeMobileJournalEditor(false);
}
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
		},
		onPanResponderMove: (_event, gesture) => {
			const minWidth = 220;
			const maxWidth = pageWidth > 0 ? Math.max(minWidth, Math.min(420, pageWidth * .42)) : 420;
			journalCalendarWidth.set(Math.max(minWidth, Math.min(maxWidth, resizeStartWidth - gesture.dx)));
		},
		onPanResponderRelease: () => {},
		onPanResponderTerminate: () => {},
		onPanResponderTerminationRequest: () => false
	});
	const dismissJournalEditor = PanResponder.create({
		onStartShouldSetPanResponder: () => false,
		onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
		onPanResponderMove: (_event, gesture) => mobileJournalEditorDragY.set(Math.max(0, gesture.dy)),
		onPanResponderRelease: (_event, gesture) => {
			if (gesture.dy > 96 || gesture.vy > 1.5) closeMobileJournalEditor(false);
			else mobileJournalEditorDragY.set(0);
		},
		onPanResponderTerminate: () => mobileJournalEditorDragY.set(0)
	});
	const dayOffsets = /* @__PURE__ */ new Map();
	const groups = () => buildJournalDays(props.entries);
	const mobileDraftNeedsExpand = () => journalDraftContentHeight() > 60;
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
		const target = closestJournalDay(groups(), key);
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
		bindProp(__nsh_hv5, "class", () => `mx-auto w-full max-w-[690px] ${props.mobile ? "px-3" : "px-5"}`);
		insert(__nsh_hv5, [() => groups().map((group) => (() => {
			const __nsh_hv6 = element("view");
			prop(__nsh_hv6, "onLayout", (bounds) => {
				dayOffsets.set(group.key, bounds.origin.y);
			});
			prop(__nsh_hv6, "class", "mb-5");
			const __nsh_hv7 = element("text");
			prop(__nsh_hv7, "class", "mb-3 text-center text-[14px]");
			bindProp(__nsh_hv7, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv7, () => formatJournalDay(group));
			append(__nsh_hv6, __nsh_hv7);
			insert(__nsh_hv6, () => group.entries.map((entry) => (() => {
				const __nsh_hv8 = element("view");
				bindProp(__nsh_hv8, "onLongPress", () => props.mobile ? () => openJournalActions(entry) : void 0);
				bindProp(__nsh_hv8, "onContextMenu", () => props.mobile ? () => openJournalActions(entry) : void 0);
				bindProp(__nsh_hv8, "role", () => props.mobile ? "button" : void 0);
				bindProp(__nsh_hv8, "accessibilityLabel", () => props.mobile ? "Действия с записью" : void 0);
				prop(__nsh_hv8, "delayLongPress", 430);
				bindProp(__nsh_hv8, "class", () => `mb-3 self-end ${props.mobile ? "w-auto max-w-full" : "w-full max-w-[650px]"} rounded-2xl px-4 py-3`);
				bindProp(__nsh_hv8, "style", () => ({
					backgroundColor: editingJournalId() === entry.id || !props.mobile ? props.colors.card : props.colors.background === "#0d0c10" ? "#1b191f" : "#f7f6f8",
					width: props.mobile ? "auto" : "100%",
					maxWidth: props.mobile ? "100%" : 650
				}));
				insert(__nsh_hv8, [() => editingJournalId() === entry.id ? (() => {
					const __nsh_hv9 = element("view");
					const __nsh_hv10 = element("input");
					bindProp(__nsh_hv10, "value", () => editingJournalText());
					prop(__nsh_hv10, "onChange", (value) => editingJournalText.set(value));
					prop(__nsh_hv10, "multiline", true);
					prop(__nsh_hv10, "submitBehavior", "newline");
					bindProp(__nsh_hv10, "class", () => `min-h-[56px] w-full px-1 py-1 ${props.mobile ? "text-[18px]" : "text-[13px]"}`);
					bindProp(__nsh_hv10, "style", () => ({
						color: props.colors.foreground,
						backgroundColor: "transparent",
						fontSize: props.mobile ? 18 : 13,
						lineHeight: props.mobile ? 27 : 20,
						selectionColor: props.colors.accent
					}));
					const __nsh_hv11 = element("view");
					prop(__nsh_hv11, "class", "mt-2 flex-row justify-end gap-2");
					insert(__nsh_hv11, [component(Button, {
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
					append(__nsh_hv9, __nsh_hv10);
					append(__nsh_hv9, __nsh_hv11);
					return __nsh_hv9;
				})() : (() => {
					const __nsh_hv12 = element("text");
					bindProp(__nsh_hv12, "selectable", () => props.mobile ? journalSelectionEntryId() === entry.id : true);
					bindProp(__nsh_hv12, "class", () => props.mobile ? "text-[18px] leading-7" : "text-[14px] leading-6");
					bindProp(__nsh_hv12, "style", () => ({
						color: props.colors.foreground,
						fontSize: props.mobile ? 18 : 14,
						lineHeight: props.mobile ? 27 : 24,
						selectionColor: props.colors.accent
					}));
					insert(__nsh_hv12, () => entry.text);
					return __nsh_hv12;
				})(), () => !props.mobile && (() => {
					const __nsh_hv13 = element("view");
					prop(__nsh_hv13, "class", "mt-2 flex-row items-center justify-end gap-3");
					const __nsh_hv14 = element("text");
					prop(__nsh_hv14, "class", "text-[10px]");
					bindProp(__nsh_hv14, "style", () => ({ color: props.colors.muted }));
					insert(__nsh_hv14, () => timeLabel(entry.createdAt));
					append(__nsh_hv13, __nsh_hv14);
					insert(__nsh_hv13, () => editingJournalId() !== entry.id && (() => {
						const __nsh_hv15 = element("view");
						prop(__nsh_hv15, "class", "flex-row gap-3");
						const __nsh_hv16 = element("view");
						prop(__nsh_hv16, "onPress", () => {
							editingJournalId.set(entry.id);
							editingJournalText.set(entry.text);
						});
						prop(__nsh_hv16, "role", "button");
						prop(__nsh_hv16, "accessibilityLabel", "Изменить запись");
						const __nsh_hv17 = element("text");
						prop(__nsh_hv17, "class", "text-[11px]");
						bindProp(__nsh_hv17, "style", () => ({ color: props.colors.muted }));
						const __nsh_hv18 = text("Изменить");
						append(__nsh_hv17, __nsh_hv18);
						append(__nsh_hv16, __nsh_hv17);
						const __nsh_hv19 = element("view");
						prop(__nsh_hv19, "onPress", () => props.onDelete(entry.id));
						prop(__nsh_hv19, "role", "button");
						prop(__nsh_hv19, "accessibilityLabel", "Удалить запись");
						const __nsh_hv20 = element("text");
						prop(__nsh_hv20, "class", "text-[11px]");
						bindProp(__nsh_hv20, "style", () => ({ color: props.colors.muted }));
						const __nsh_hv21 = text("Удалить");
						append(__nsh_hv20, __nsh_hv21);
						append(__nsh_hv19, __nsh_hv20);
						append(__nsh_hv15, __nsh_hv16);
						append(__nsh_hv15, __nsh_hv19);
						return __nsh_hv15;
					})());
					return __nsh_hv13;
				})()]);
				return __nsh_hv8;
			})()));
			return __nsh_hv6;
		})()), () => groups().length === 0 && (() => {
			const __nsh_hv22 = element("view");
			prop(__nsh_hv22, "class", "flex-1 items-center justify-center py-12");
			const __nsh_hv23 = element("text");
			prop(__nsh_hv23, "class", "text-[13px]");
			bindProp(__nsh_hv23, "style", () => ({ color: props.colors.muted }));
			const __nsh_hv24 = text("Записей пока нет");
			append(__nsh_hv23, __nsh_hv24);
			append(__nsh_hv22, __nsh_hv23);
			return __nsh_hv22;
		})()]);
		append(__nsh_hv4, __nsh_hv5);
		append(__nsh_hv3, __nsh_hv4);
		append(__nsh_hv1, __nsh_hv3);
		insert(__nsh_hv1, () => !props.mobile && (props.nativeCalendarButton ? component(NativeCalendarToggle, {
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
		})()), __nsh_hv3);
		insert(__nsh_hv1, () => props.mobile ? (() => {
			const __nsh_hv25 = element("view");
			prop(__nsh_hv25, "class", "relative mb-4 w-full px-3");
			const __nsh_hv29 = element("view");
			prop(__nsh_hv29, "class", "w-full flex-row items-end gap-2 rounded-[24px] border px-2 py-1.5");
			bindProp(__nsh_hv29, "style", () => ({
				backgroundColor: props.colors.card,
				borderColor: props.colors.border
			}));
			const __nsh_hv30 = element("input");
			bindProp(__nsh_hv30, "value", () => journalDraft());
			prop(__nsh_hv30, "onChange", (value) => journalDraft.set(value));
			prop(__nsh_hv30, "onContentSizeChange", ({ height }) => journalDraftContentHeight.set(Math.max(journalDraftMinContentHeight, Math.min(journalDraftMaxContentHeight, height))));
			prop(__nsh_hv30, "onSubmit", (event) => send(event.text));
			prop(__nsh_hv30, "multiline", true);
			prop(__nsh_hv30, "submitBehavior", "newline");
			prop(__nsh_hv30, "placeholder", "Запись в дневник…");
			prop(__nsh_hv30, "accessibilityLabel", "Новая запись в дневник");
			prop(__nsh_hv30, "class", "min-w-0 flex-1 px-2 py-1 text-[18px]");
			bindProp(__nsh_hv30, "style", () => ({
				placeholderColor: props.colors.muted,
				selectionColor: props.colors.accent,
				height: Math.max(44, Math.min(260, journalDraftContentHeight() + 20)),
				fontSize: 18,
				lineHeight: 24,
				paddingHorizontal: 8,
				paddingVertical: 10,
				backgroundColor: "transparent",
				color: props.colors.foreground,
				transitionProperty: "height",
				transitionDuration: 120,
				transitionTimingFunction: "ease-out"
			}));
			const __nsh_hv31 = element("view");
			bindProp(__nsh_hv31, "onPress", () => journalDraft().trim() ? () => send(journalDraft()) : void 0);
			prop(__nsh_hv31, "role", "button");
			prop(__nsh_hv31, "accessibilityLabel", "Отправить запись");
			bindProp(__nsh_hv31, "accessibilityState", () => ({ disabled: !journalDraft().trim() }));
			prop(__nsh_hv31, "class", "h-11 w-11 shrink-0 items-center justify-center rounded-full");
			bindProp(__nsh_hv31, "style", () => ({
				backgroundColor: journalDraft().trim() ? props.colors.accent : props.colors.border,
				opacity: journalDraft().trim() ? 1 : .55
			}));
			const __nsh_hv32 = element("text");
			prop(__nsh_hv32, "class", "text-[22px] font-semibold");
			prop(__nsh_hv32, "style", { color: "#ffffff" });
			const __nsh_hv33 = text("↑");
			append(__nsh_hv32, __nsh_hv33);
			append(__nsh_hv31, __nsh_hv32);
			append(__nsh_hv29, __nsh_hv30);
			append(__nsh_hv29, __nsh_hv31);
			append(__nsh_hv25, __nsh_hv29);
			insert(__nsh_hv25, () => mobileDraftNeedsExpand() && (() => {
				const __nsh_hv26 = element("view");
				prop(__nsh_hv26, "onPress", openMobileJournalEditor);
				prop(__nsh_hv26, "role", "button");
				prop(__nsh_hv26, "accessibilityLabel", "Развернуть на весь экран");
				prop(__nsh_hv26, "class", "absolute right-5 -top-11 z-10 h-9 w-9 items-center justify-center rounded-full border");
				bindProp(__nsh_hv26, "style", () => ({
					backgroundColor: props.colors.card,
					borderColor: props.colors.border
				}));
				const __nsh_hv27 = element("text");
				prop(__nsh_hv27, "class", "text-[20px] font-medium");
				bindProp(__nsh_hv27, "style", () => ({ color: props.colors.foreground }));
				const __nsh_hv28 = text("⛶");
				append(__nsh_hv27, __nsh_hv28);
				append(__nsh_hv26, __nsh_hv27);
				return __nsh_hv26;
			})(), __nsh_hv29);
			return __nsh_hv25;
		})() : (() => {
			const __nsh_hv34 = element("view");
			prop(__nsh_hv34, "class", "mb-4 w-full px-5");
			const __nsh_hv35 = element("view");
			prop(__nsh_hv35, "class", "mx-auto w-full max-w-[650px] flex-row items-end gap-2 border pl-3 pr-1.5 py-1.5");
			bindProp(__nsh_hv35, "style", () => ({
				backgroundColor: props.colors.card,
				borderColor: props.colors.border,
				borderRadius: journalDraftContentHeight() > journalDraftExpandedHeight ? 24 : 999,
				transitionProperty: "borderRadius",
				transitionDuration: 180,
				transitionTimingFunction: "ease-out"
			}));
			const __nsh_hv36 = element("input");
			bindProp(__nsh_hv36, "value", () => journalDraft());
			prop(__nsh_hv36, "onChange", (value) => journalDraft.set(value));
			prop(__nsh_hv36, "onContentSizeChange", ({ height }) => journalDraftContentHeight.set(Math.max(journalDraftMinContentHeight, Math.min(journalDraftMaxContentHeight, height))));
			prop(__nsh_hv36, "onSubmit", (event) => send(event.text));
			prop(__nsh_hv36, "multiline", true);
			prop(__nsh_hv36, "submitBehavior", "submit");
			prop(__nsh_hv36, "placeholder", "Запись в дневник…");
			prop(__nsh_hv36, "accessibilityLabel", "Новая запись в дневник");
			prop(__nsh_hv36, "class", "max-h-[120px] flex-1 text-[15px]");
			bindProp(__nsh_hv36, "style", () => ({
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
			const __nsh_hv37 = element("view");
			prop(__nsh_hv37, "onPress", () => send(journalDraft()));
			prop(__nsh_hv37, "role", "button");
			prop(__nsh_hv37, "accessibilityLabel", "Отправить запись");
			prop(__nsh_hv37, "class", "h-10 w-10 shrink-0 items-center justify-center rounded-full");
			bindProp(__nsh_hv37, "style", () => ({ backgroundColor: props.colors.accent }));
			const __nsh_hv38 = element("text");
			prop(__nsh_hv38, "class", "text-[20px] font-semibold");
			bindProp(__nsh_hv38, "style", () => ({ color: props.colors.foreground }));
			const __nsh_hv39 = text("↑");
			append(__nsh_hv38, __nsh_hv39);
			append(__nsh_hv37, __nsh_hv38);
			append(__nsh_hv35, __nsh_hv36);
			append(__nsh_hv35, __nsh_hv37);
			append(__nsh_hv34, __nsh_hv35);
			return __nsh_hv34;
		})());
		append(__nsh_hv0, __nsh_hv1);
		insert(__nsh_hv0, [
			() => !props.mobile && (() => {
				const __nsh_hv40 = element("view");
				prop(__nsh_hv40, "class", "relative h-full shrink-0");
				bindProp(__nsh_hv40, "style", () => ({ width: journalCalendarOpen() ? journalCalendarWidth() : 0 }));
				const __nsh_hv41 = element("view");
				prop(__nsh_hv41, "class", "h-full w-full overflow-hidden");
				insert(__nsh_hv41, component(JournalCalendar, {
					get width() {
						return journalCalendarWidth();
					},
					resizeHovered: false,
					get groups() {
						return groups();
					},
					get colors() {
						return props.colors;
					},
					onSelect: jumpToDay
				}));
				append(__nsh_hv40, __nsh_hv41);
				insert(__nsh_hv40, () => journalCalendarOpen() && resizeCalendar && (() => {
					const __nsh_hv42 = element("view");
					spread(__nsh_hv42, resizeCalendar.panHandlers);
					prop(__nsh_hv42, "role", "button");
					prop(__nsh_hv42, "accessibilityLabel", "Изменить ширину календаря");
					prop(__nsh_hv42, "class", "absolute top-0 bottom-0 z-10 w-5");
					prop(__nsh_hv42, "style", {
						left: -10,
						cursor: "col-resize"
					});
					return __nsh_hv42;
				})());
				return __nsh_hv40;
			})(),
			() => props.mobile && mobileJournalEditorOpen() && (() => {
				const __nsh_hv43 = element("view");
				spread(__nsh_hv43, dismissJournalEditor.panHandlers);
				bindProp(__nsh_hv43, "class", () => `absolute inset-0 z-30 ${mobileJournalEditorClosing() ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`);
				bindProp(__nsh_hv43, "style", () => ({
					backgroundColor: props.colors.background,
					transform: [{ translateY: mobileJournalEditorDragY() }],
					transitionProperty: "opacity, transform",
					transitionDuration: mobileJournalEditorDragY() ? 0 : 180,
					transitionTimingFunction: "ease-out"
				}));
				const __nsh_hv44 = element("view");
				prop(__nsh_hv44, "class", "absolute right-4 top-3 z-20");
				const __nsh_hv45 = element("view");
				prop(__nsh_hv45, "onPress", () => closeMobileJournalEditor(false));
				prop(__nsh_hv45, "role", "button");
				prop(__nsh_hv45, "accessibilityLabel", "Свернуть редактор");
				prop(__nsh_hv45, "class", "h-10 w-10 items-center justify-center rounded-full border");
				bindProp(__nsh_hv45, "style", () => ({
					backgroundColor: props.colors.card,
					borderColor: props.colors.border
				}));
				const __nsh_hv46 = element("text");
				prop(__nsh_hv46, "class", "text-[24px]");
				bindProp(__nsh_hv46, "style", () => ({
					color: props.colors.foreground,
					transform: [{ rotate: "-90deg" }]
				}));
				const __nsh_hv47 = text("‹");
				append(__nsh_hv46, __nsh_hv47);
				append(__nsh_hv45, __nsh_hv46);
				append(__nsh_hv44, __nsh_hv45);
				const __nsh_hv48 = element("view");
				prop(__nsh_hv48, "class", "absolute left-5 right-5 top-20 bottom-20");
				const __nsh_hv49 = element("input");
				bindProp(__nsh_hv49, "value", () => journalDraft());
				prop(__nsh_hv49, "onChange", (value) => journalDraft.set(value));
				prop(__nsh_hv49, "multiline", true);
				prop(__nsh_hv49, "submitBehavior", "newline");
				prop(__nsh_hv49, "autoFocus", true);
				prop(__nsh_hv49, "placeholder", "О чём вы думаете?");
				prop(__nsh_hv49, "accessibilityLabel", "Текст новой заметки");
				prop(__nsh_hv49, "class", "h-full w-full text-[32px]");
				bindProp(__nsh_hv49, "style", () => ({
					fontSize: 32,
					lineHeight: 40,
					placeholderColor: props.colors.muted,
					selectionColor: props.colors.accent,
					backgroundColor: "transparent",
					color: props.colors.foreground
				}));
				append(__nsh_hv48, __nsh_hv49);
				const __nsh_hv50 = element("view");
				prop(__nsh_hv50, "class", "absolute right-4 bottom-4 z-20");
				const __nsh_hv51 = element("view");
				prop(__nsh_hv51, "onPress", () => {
					send(journalDraft());
					closeMobileJournalEditor(false);
				});
				prop(__nsh_hv51, "role", "button");
				prop(__nsh_hv51, "accessibilityLabel", "Готово, отправить запись");
				prop(__nsh_hv51, "class", "h-12 items-center justify-center rounded-full px-6");
				bindProp(__nsh_hv51, "style", () => ({ backgroundColor: props.colors.accent }));
				const __nsh_hv52 = element("text");
				prop(__nsh_hv52, "class", "text-[16px] font-semibold");
				prop(__nsh_hv52, "style", { color: "#ffffff" });
				const __nsh_hv53 = text("Готово");
				append(__nsh_hv52, __nsh_hv53);
				append(__nsh_hv51, __nsh_hv52);
				append(__nsh_hv50, __nsh_hv51);
				append(__nsh_hv43, __nsh_hv44);
				append(__nsh_hv43, __nsh_hv48);
				append(__nsh_hv43, __nsh_hv50);
				return __nsh_hv43;
			})(),
			() => props.mobile && mobileJournalDiscardPrompt() && component(Dialog, {
				title: "Удалить черновик?",
				get colors() {
					return props.colors;
				},
				get children() {
					return [(() => {
						const __nsh_hv54 = element("text");
						prop(__nsh_hv54, "class", "mb-4 text-[13px]");
						bindProp(__nsh_hv54, "style", () => ({ color: props.colors.muted }));
						const __nsh_hv55 = text("Текст заметки ещё не добавлен в дневник.");
						append(__nsh_hv54, __nsh_hv55);
						return __nsh_hv54;
					})(), (() => {
						const __nsh_hv56 = element("view");
						prop(__nsh_hv56, "class", "flex-row justify-end gap-2");
						insert(__nsh_hv56, [component(Button, {
							label: "Продолжить",
							get colors() {
								return props.colors;
							},
							onPress: () => mobileJournalDiscardPrompt.set(false)
						}), component(Button, {
							label: "Удалить",
							get colors() {
								return props.colors;
							},
							onPress: () => closeMobileJournalEditor(true),
							selected: true,
							get style() {
								return {
									backgroundColor: props.colors.accent,
									borderColor: "transparent"
								};
							},
							get textColor() {
								return props.colors.background;
							}
						})]);
						return __nsh_hv56;
					})()];
				}
			}),
			() => props.mobile && activeJournalEntry() && (() => {
				const __nsh_hv57 = element("view");
				prop(__nsh_hv57, "class", "absolute inset-0 z-40 justify-end");
				bindProp(__nsh_hv57, "style", () => ({
					backgroundColor: "#00000066",
					opacity: journalActionsClosing() ? 0 : 1,
					transitionProperty: "opacity",
					transitionDuration: 130,
					transitionTimingFunction: "ease-out"
				}));
				const __nsh_hv58 = element("view");
				prop(__nsh_hv58, "onPress", closeJournalActions);
				prop(__nsh_hv58, "class", "absolute inset-0");
				prop(__nsh_hv58, "accessibilityLabel", "Закрыть меню записи");
				const __nsh_hv59 = element("view");
				bindProp(__nsh_hv59, "class", () => `w-full rounded-t-[26px] border px-5 pt-3 pb-8 ${journalActionsClosing() ? "translate-y-6" : "translate-y-0"}`);
				bindProp(__nsh_hv59, "style", () => ({
					backgroundColor: props.colors.card,
					borderColor: props.colors.border,
					opacity: journalActionsClosing() ? 0 : 1,
					transitionProperty: "opacity, transform",
					transitionDuration: 130,
					transitionTimingFunction: "ease-out"
				}));
				const __nsh_hv60 = element("view");
				prop(__nsh_hv60, "class", "mx-auto mb-4 h-1 w-10 rounded-full");
				bindProp(__nsh_hv60, "style", () => ({ backgroundColor: props.colors.border }));
				const __nsh_hv61 = element("text");
				prop(__nsh_hv61, "numberOfLines", 2);
				prop(__nsh_hv61, "class", "mb-3 text-[15px] font-medium");
				bindProp(__nsh_hv61, "style", () => ({ color: props.colors.foreground }));
				insert(__nsh_hv61, () => activeJournalEntry()?.text);
				const __nsh_hv62 = element("view");
				prop(__nsh_hv62, "onPress", () => {
					const entry = activeJournalEntry();
					if (entry) props.onCopy?.(entry.text);
					closeJournalActions();
				});
				prop(__nsh_hv62, "role", "button");
				prop(__nsh_hv62, "class", "h-12 justify-center border-b");
				bindProp(__nsh_hv62, "style", () => ({ borderColor: props.colors.border }));
				const __nsh_hv63 = element("text");
				prop(__nsh_hv63, "class", "text-[16px]");
				bindProp(__nsh_hv63, "style", () => ({ color: props.colors.foreground }));
				const __nsh_hv64 = text("Копировать текст");
				append(__nsh_hv63, __nsh_hv64);
				append(__nsh_hv62, __nsh_hv63);
				const __nsh_hv65 = element("view");
				prop(__nsh_hv65, "onPress", () => {
					const entry = activeJournalEntry();
					journalSelectionEntryId.set(entry?.id ?? null);
					closeJournalActions();
				});
				prop(__nsh_hv65, "role", "button");
				prop(__nsh_hv65, "class", "h-12 justify-center border-b");
				bindProp(__nsh_hv65, "style", () => ({ borderColor: props.colors.border }));
				const __nsh_hv66 = element("text");
				prop(__nsh_hv66, "class", "text-[16px]");
				bindProp(__nsh_hv66, "style", () => ({ color: props.colors.foreground }));
				const __nsh_hv67 = text("Выбрать фрагмент");
				append(__nsh_hv66, __nsh_hv67);
				append(__nsh_hv65, __nsh_hv66);
				const __nsh_hv68 = element("view");
				prop(__nsh_hv68, "onPress", () => {
					const entry = activeJournalEntry();
					if (entry) {
						editingJournalId.set(entry.id);
						editingJournalText.set(entry.text);
					}
					closeJournalActions();
				});
				prop(__nsh_hv68, "role", "button");
				prop(__nsh_hv68, "class", "h-12 justify-center border-b");
				bindProp(__nsh_hv68, "style", () => ({ borderColor: props.colors.border }));
				const __nsh_hv69 = element("text");
				prop(__nsh_hv69, "class", "text-[16px]");
				bindProp(__nsh_hv69, "style", () => ({ color: props.colors.foreground }));
				const __nsh_hv70 = text("Изменить");
				append(__nsh_hv69, __nsh_hv70);
				append(__nsh_hv68, __nsh_hv69);
				const __nsh_hv71 = element("view");
				prop(__nsh_hv71, "onPress", () => {
					const entry = activeJournalEntry();
					if (entry) props.onDelete(entry.id);
					closeJournalActions();
				});
				prop(__nsh_hv71, "role", "button");
				prop(__nsh_hv71, "class", "h-12 justify-center");
				const __nsh_hv72 = element("text");
				prop(__nsh_hv72, "class", "text-[16px]");
				prop(__nsh_hv72, "style", { color: "#ef4444" });
				const __nsh_hv73 = text("Удалить");
				append(__nsh_hv72, __nsh_hv73);
				append(__nsh_hv71, __nsh_hv72);
				append(__nsh_hv59, __nsh_hv60);
				append(__nsh_hv59, __nsh_hv61);
				append(__nsh_hv59, __nsh_hv62);
				append(__nsh_hv59, __nsh_hv65);
				append(__nsh_hv59, __nsh_hv68);
				append(__nsh_hv59, __nsh_hv71);
				append(__nsh_hv57, __nsh_hv58);
				append(__nsh_hv57, __nsh_hv59);
				return __nsh_hv57;
			})()
		]);
		return __nsh_hv0;
	})();
}
function toggleJournalCalendar() {
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
const mobileAccentPresets = [
	{
		name: "Zeron",
		dark: "#8b7cf6",
		light: "#5b43e8"
	},
	{
		name: "Orange",
		dark: "#fb923c",
		light: "#c2410c"
	},
	{
		name: "Amber",
		dark: "#fbbf24",
		light: "#a16207"
	},
	{
		name: "Green",
		dark: "#4ade80",
		light: "#15803d"
	},
	{
		name: "Cyan",
		dark: "#22d3ee",
		light: "#0e7490"
	},
	{
		name: "Blue",
		dark: "#60a5fa",
		light: "#2563eb"
	},
	{
		name: "Pink",
		dark: "#f472b6",
		light: "#be185d"
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
		prop(__nsh_hv0, "class", "mb-2 px-2 text-[13px]");
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
			bindProp(__nsh_hv7, "style", () => ({ width: props.mobile ? "100%" : width }));
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
						width: props.mobile ? 288 : menuWidth,
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
		prop(__nsh_hv13, "class", "min-h-[52px] flex-row items-center gap-4 border-b py-3");
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
		bindProp(__nsh_hv17, "class", () => `min-h-0 flex-1 ${props.mobile ? "px-4" : "px-7"} pt-4 pb-8`);
		const __nsh_hv18 = element("text");
		prop(__nsh_hv18, "class", "text-[13px]");
		bindProp(__nsh_hv18, "style", () => ({ color: colors().muted }));
		const __nsh_hv19 = text("Загружаем настройки внешнего вида…");
		append(__nsh_hv18, __nsh_hv19);
		append(__nsh_hv17, __nsh_hv18);
		return __nsh_hv17;
	})();
	const current = () => settings();
	if (props.mobile) {
		const selectedPalette = () => current().mode === "light" ? current().light_theme : current().dark_theme;
		const selectedTheme = () => props.themes.find((theme) => theme.key === selectedPalette()) ?? props.themes[0];
		const isDark = () => current().mode === "dark" || current().mode === "system" && colors().background.toLowerCase() !== (selectedTheme()?.light.background ?? "").toLowerCase();
		const selectMode = (mode) => {
			const patchValues = { mode };
			if (current().accent_source === "custom" && current().accent_color) {
				const preset = mobileAccentPresets.find((item) => item.light === current().accent_color?.toLowerCase() || item.dark === current().accent_color?.toLowerCase());
				if (preset) patchValues.accent_color = mode === "light" ? preset.light : mode === "dark" ? preset.dark : isDark() ? preset.dark : preset.light;
			}
			patch(patchValues);
		};
		return (() => {
			const __nsh_hv20 = element("scroll");
			prop(__nsh_hv20, "class", "min-h-0 flex-1 px-3 pt-2 pb-8");
			bindProp(__nsh_hv20, "style", () => ({ backgroundColor: colors().background }));
			const __nsh_hv21 = element("text");
			prop(__nsh_hv21, "class", "mb-2 px-3 text-[13px]");
			bindProp(__nsh_hv21, "style", () => ({ color: colors().muted }));
			const __nsh_hv22 = text("Синхронизация");
			append(__nsh_hv21, __nsh_hv22);
			const __nsh_hv23 = element("view");
			prop(__nsh_hv23, "accessibilityLabel", "Синхронизация: ожидает подключения");
			prop(__nsh_hv23, "class", "mb-6 min-h-[58px] flex-row items-center gap-3 rounded-lg border px-4");
			bindProp(__nsh_hv23, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			const __nsh_hv24 = element("view");
			prop(__nsh_hv24, "class", "h-2 w-2 rounded-full");
			prop(__nsh_hv24, "style", { backgroundColor: "#facc15" });
			const __nsh_hv25 = element("view");
			const __nsh_hv26 = element("text");
			prop(__nsh_hv26, "class", "text-[14px]");
			bindProp(__nsh_hv26, "style", () => ({ color: colors().foreground }));
			const __nsh_hv27 = text("Ожидает подключения");
			append(__nsh_hv26, __nsh_hv27);
			append(__nsh_hv25, __nsh_hv26);
			append(__nsh_hv23, __nsh_hv24);
			append(__nsh_hv23, __nsh_hv25);
			const __nsh_hv28 = element("view");
			prop(__nsh_hv28, "class", "mb-2 px-3");
			const __nsh_hv29 = element("text");
			prop(__nsh_hv29, "class", "text-[13px]");
			bindProp(__nsh_hv29, "style", () => ({ color: colors().muted }));
			const __nsh_hv30 = text("Режим");
			append(__nsh_hv29, __nsh_hv30);
			append(__nsh_hv28, __nsh_hv29);
			const __nsh_hv31 = element("view");
			prop(__nsh_hv31, "class", "mb-6 rounded-lg border px-3");
			bindProp(__nsh_hv31, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			insert(__nsh_hv31, () => modePreviews.map((mode, index) => (() => {
				const __nsh_hv32 = element("view");
				prop(__nsh_hv32, "onPress", () => selectMode(mode.value));
				prop(__nsh_hv32, "role", "button");
				bindProp(__nsh_hv32, "accessibilityState", () => ({
					selected: current().mode === mode.value,
					disabled: !canEdit()
				}));
				prop(__nsh_hv32, "class", `h-12 flex-row items-center ${index ? "border-t" : ""}`);
				bindProp(__nsh_hv32, "style", () => ({
					borderColor: colors().border,
					opacity: canEdit() ? 1 : .65
				}));
				const __nsh_hv33 = element("text");
				prop(__nsh_hv33, "class", "flex-1 text-[14px]");
				bindProp(__nsh_hv33, "style", () => ({ color: colors().foreground }));
				insert(__nsh_hv33, () => mode.label === "Система" ? "Системная" : mode.label);
				append(__nsh_hv32, __nsh_hv33);
				insert(__nsh_hv32, () => current().mode === mode.value && (() => {
					const __nsh_hv34 = element("text");
					prop(__nsh_hv34, "class", "text-[18px]");
					bindProp(__nsh_hv34, "style", () => ({ color: colors().accent }));
					const __nsh_hv35 = text("✓");
					append(__nsh_hv34, __nsh_hv35);
					return __nsh_hv34;
				})());
				return __nsh_hv32;
			})()));
			const __nsh_hv36 = element("view");
			prop(__nsh_hv36, "class", "mb-2 px-3");
			const __nsh_hv37 = element("text");
			prop(__nsh_hv37, "class", "text-[13px]");
			bindProp(__nsh_hv37, "style", () => ({ color: colors().muted }));
			const __nsh_hv38 = text("Тема");
			append(__nsh_hv37, __nsh_hv38);
			append(__nsh_hv36, __nsh_hv37);
			const __nsh_hv39 = element("scroll");
			prop(__nsh_hv39, "horizontal", true);
			prop(__nsh_hv39, "scrollbar", false);
			prop(__nsh_hv39, "class", "mb-6 h-[104px]");
			prop(__nsh_hv39, "accessibilityLabel", "Темы оформления");
			const __nsh_hv40 = element("view");
			prop(__nsh_hv40, "class", "flex-row gap-[10px] px-3");
			insert(__nsh_hv40, () => props.themes.map((theme) => {
				const palette = isDark() ? theme.dark : theme.light;
				const selected = selectedPalette() === theme.key;
				return (() => {
					const __nsh_hv41 = element("view");
					prop(__nsh_hv41, "onPress", () => patch({
						light_theme: theme.key,
						dark_theme: theme.key
					}));
					prop(__nsh_hv41, "role", "button");
					bindProp(__nsh_hv41, "accessibilityState", () => ({
						selected,
						disabled: !canEdit()
					}));
					prop(__nsh_hv41, "class", "w-[92px]");
					bindProp(__nsh_hv41, "style", () => ({ opacity: canEdit() ? 1 : .65 }));
					const __nsh_hv42 = element("view");
					prop(__nsh_hv42, "class", "h-16 w-full flex-col justify-center gap-1.5 rounded-lg border p-2.5");
					bindProp(__nsh_hv42, "style", () => ({
						backgroundColor: palette.background,
						borderColor: selected ? colors().accent : palette.border,
						borderWidth: selected ? 2 : 1
					}));
					const __nsh_hv43 = element("view");
					prop(__nsh_hv43, "class", "h-[6px] w-11 rounded-full");
					bindProp(__nsh_hv43, "style", () => ({ backgroundColor: palette.foreground }));
					const __nsh_hv44 = element("view");
					prop(__nsh_hv44, "class", "h-[5px] w-[60px] rounded-full");
					bindProp(__nsh_hv44, "style", () => ({ backgroundColor: palette.muted }));
					const __nsh_hv45 = element("view");
					prop(__nsh_hv45, "class", "flex-row gap-1");
					insert(__nsh_hv45, () => [
						palette.accent,
						palette.foreground,
						palette.muted,
						palette.border
					].map((dot) => (() => {
						const __nsh_hv46 = element("view");
						prop(__nsh_hv46, "class", "h-2.5 w-2.5 rounded-full");
						prop(__nsh_hv46, "style", { backgroundColor: dot });
						return __nsh_hv46;
					})()));
					append(__nsh_hv42, __nsh_hv43);
					append(__nsh_hv42, __nsh_hv44);
					append(__nsh_hv42, __nsh_hv45);
					const __nsh_hv47 = element("text");
					prop(__nsh_hv47, "class", "mt-1.5 text-[12px]");
					bindProp(__nsh_hv47, "style", () => ({ color: selected ? colors().foreground : colors().muted }));
					insert(__nsh_hv47, () => theme.name);
					append(__nsh_hv41, __nsh_hv42);
					append(__nsh_hv41, __nsh_hv47);
					return __nsh_hv41;
				})();
			}));
			append(__nsh_hv39, __nsh_hv40);
			const __nsh_hv48 = element("view");
			prop(__nsh_hv48, "class", "mb-2 px-3");
			const __nsh_hv49 = element("text");
			prop(__nsh_hv49, "class", "text-[13px]");
			bindProp(__nsh_hv49, "style", () => ({ color: colors().muted }));
			const __nsh_hv50 = text("Акцент");
			append(__nsh_hv49, __nsh_hv50);
			append(__nsh_hv48, __nsh_hv49);
			const __nsh_hv51 = element("scroll");
			prop(__nsh_hv51, "horizontal", true);
			prop(__nsh_hv51, "scrollbar", false);
			prop(__nsh_hv51, "class", "h-[68px]");
			prop(__nsh_hv51, "accessibilityLabel", "Цвет акцента");
			const __nsh_hv52 = element("view");
			prop(__nsh_hv52, "class", "flex-row items-center gap-2 px-3");
			const __nsh_hv53 = element("view");
			prop(__nsh_hv53, "onPress", () => patch({
				accent_source: "theme",
				accent_color: null
			}));
			prop(__nsh_hv53, "role", "button");
			prop(__nsh_hv53, "accessibilityLabel", "Цвет темы");
			bindProp(__nsh_hv53, "accessibilityState", () => ({
				selected: current().accent_source === "theme",
				disabled: !canEdit()
			}));
			prop(__nsh_hv53, "class", "h-10 w-[76px] flex-row items-center justify-center gap-1 rounded-lg border");
			bindProp(__nsh_hv53, "style", () => ({
				borderColor: current().accent_source === "theme" ? colors().accent : colors().border,
				backgroundColor: colors().card
			}));
			const __nsh_hv54 = element("view");
			prop(__nsh_hv54, "class", "h-4 w-4 rounded-full");
			bindProp(__nsh_hv54, "style", () => ({ backgroundColor: selectedTheme()?.[isDark() ? "dark" : "light"].accent }));
			const __nsh_hv55 = element("text");
			prop(__nsh_hv55, "class", "text-[11px]");
			bindProp(__nsh_hv55, "style", () => ({ color: colors().foreground }));
			const __nsh_hv56 = text("Тема");
			append(__nsh_hv55, __nsh_hv56);
			append(__nsh_hv53, __nsh_hv54);
			append(__nsh_hv53, __nsh_hv55);
			append(__nsh_hv52, __nsh_hv53);
			insert(__nsh_hv52, () => mobileAccentPresets.map((preset) => {
				const accent = isDark() ? preset.dark : preset.light;
				const selected = current().accent_source === "custom" && [preset.light, preset.dark].includes(current().accent_color?.toLowerCase() ?? "");
				return (() => {
					const __nsh_hv57 = element("view");
					prop(__nsh_hv57, "onPress", () => patch({
						accent_source: "custom",
						accent_color: accent
					}));
					prop(__nsh_hv57, "role", "button");
					bindProp(__nsh_hv57, "accessibilityLabel", () => `Акцент ${preset.name}`);
					bindProp(__nsh_hv57, "accessibilityState", () => ({
						selected,
						disabled: !canEdit()
					}));
					prop(__nsh_hv57, "class", "h-9 w-9 items-center justify-center rounded-full border");
					bindProp(__nsh_hv57, "style", () => ({
						backgroundColor: accent,
						borderColor: selected ? colors().foreground : colors().border,
						opacity: canEdit() ? 1 : .65
					}));
					insert(__nsh_hv57, () => selected && (() => {
						const __nsh_hv58 = element("text");
						prop(__nsh_hv58, "class", "text-[16px]");
						prop(__nsh_hv58, "style", { color: "#ffffff" });
						const __nsh_hv59 = text("✓");
						append(__nsh_hv58, __nsh_hv59);
						return __nsh_hv58;
					})());
					return __nsh_hv57;
				})();
			}));
			append(__nsh_hv51, __nsh_hv52);
			append(__nsh_hv20, __nsh_hv21);
			append(__nsh_hv20, __nsh_hv23);
			append(__nsh_hv20, __nsh_hv28);
			append(__nsh_hv20, __nsh_hv31);
			append(__nsh_hv20, __nsh_hv36);
			append(__nsh_hv20, __nsh_hv39);
			append(__nsh_hv20, __nsh_hv48);
			append(__nsh_hv20, __nsh_hv51);
			return __nsh_hv20;
		})();
	}
	const modePalette = (mode) => {
		if (mode === "system") return colors();
		const themeKey = mode === "light" ? current().light_theme : current().dark_theme;
		const theme = props.themes.find((item) => item.key === themeKey);
		return (mode === "light" ? theme?.light : theme?.dark) ?? colors();
	};
	const modeCard = (mode) => {
		const palette = modePalette(mode.value);
		return (() => {
			const __nsh_hv60 = element("view");
			prop(__nsh_hv60, "onPress", () => patch({ mode: mode.value }));
			prop(__nsh_hv60, "role", "button");
			bindProp(__nsh_hv60, "accessibilityState", () => ({
				selected: current().mode === mode.value,
				disabled: !canEdit()
			}));
			prop(__nsh_hv60, "class", "min-w-0 flex-1");
			bindProp(__nsh_hv60, "style", () => ({ opacity: canEdit() ? 1 : .65 }));
			const __nsh_hv61 = element("view");
			bindProp(__nsh_hv61, "class", () => `${props.mobile ? "h-[104px] p-2" : "h-[148px] p-3"} items-center justify-center overflow-hidden rounded-md border`);
			bindProp(__nsh_hv61, "style", () => ({
				borderColor: current().mode === mode.value ? colors().accent : palette.border,
				backgroundColor: palette.background
			}));
			const __nsh_hv62 = element("view");
			prop(__nsh_hv62, "class", "h-full w-full flex-row overflow-hidden rounded-md border");
			bindProp(__nsh_hv62, "style", () => ({
				borderColor: palette.border,
				backgroundColor: palette.card
			}));
			const __nsh_hv63 = element("view");
			prop(__nsh_hv63, "class", "w-1/3 gap-2 border-r p-2");
			bindProp(__nsh_hv63, "style", () => ({ borderColor: palette.border }));
			const __nsh_hv64 = element("view");
			prop(__nsh_hv64, "class", "h-2 rounded");
			bindProp(__nsh_hv64, "style", () => ({ backgroundColor: palette.accent }));
			const __nsh_hv65 = element("view");
			prop(__nsh_hv65, "class", "h-1.5 rounded");
			bindProp(__nsh_hv65, "style", () => ({ backgroundColor: palette.muted }));
			const __nsh_hv66 = element("view");
			prop(__nsh_hv66, "class", "h-1.5 rounded");
			bindProp(__nsh_hv66, "style", () => ({ backgroundColor: palette.border }));
			append(__nsh_hv63, __nsh_hv64);
			append(__nsh_hv63, __nsh_hv65);
			append(__nsh_hv63, __nsh_hv66);
			const __nsh_hv67 = element("view");
			prop(__nsh_hv67, "class", "flex-1 gap-2 p-2");
			const __nsh_hv68 = element("view");
			prop(__nsh_hv68, "class", "h-2 w-1/2 rounded");
			bindProp(__nsh_hv68, "style", () => ({ backgroundColor: palette.muted }));
			const __nsh_hv69 = element("view");
			prop(__nsh_hv69, "class", "h-9 rounded");
			bindProp(__nsh_hv69, "style", () => ({ backgroundColor: palette.background }));
			const __nsh_hv70 = element("view");
			prop(__nsh_hv70, "class", "h-1.5 w-2/3 rounded");
			bindProp(__nsh_hv70, "style", () => ({ backgroundColor: palette.border }));
			append(__nsh_hv67, __nsh_hv68);
			append(__nsh_hv67, __nsh_hv69);
			append(__nsh_hv67, __nsh_hv70);
			append(__nsh_hv62, __nsh_hv63);
			append(__nsh_hv62, __nsh_hv67);
			append(__nsh_hv61, __nsh_hv62);
			const __nsh_hv71 = element("text");
			prop(__nsh_hv71, "class", "mt-2 text-center text-[12px]");
			bindProp(__nsh_hv71, "style", () => ({ color: current().mode === mode.value ? colors().accent : colors().muted }));
			insert(__nsh_hv71, () => mode.label);
			append(__nsh_hv60, __nsh_hv61);
			append(__nsh_hv60, __nsh_hv71);
			return __nsh_hv60;
		})();
	};
	return (() => {
		const __nsh_hv72 = element("scroll");
		bindProp(__nsh_hv72, "class", () => `min-h-0 flex-1 ${props.mobile ? "px-4" : "px-7"} pt-4 pb-8`);
		bindProp(__nsh_hv72, "style", () => ({ backgroundColor: colors().background }));
		const __nsh_hv73 = element("view");
		prop(__nsh_hv73, "class", "mx-auto w-full max-w-[720px]");
		const __nsh_hv74 = element("text");
		prop(__nsh_hv74, "class", "mb-5 px-2 text-[22px] font-semibold");
		bindProp(__nsh_hv74, "style", () => ({ color: colors().foreground }));
		const __nsh_hv75 = text("Оформление");
		append(__nsh_hv74, __nsh_hv75);
		const __nsh_hv80 = element("view");
		prop(__nsh_hv80, "class", "mb-8 flex-row gap-4");
		insert(__nsh_hv80, () => modePreviews.map(modeCard));
		const __nsh_hv81 = element("view");
		prop(__nsh_hv81, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv81, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv82 = element("view");
		prop(__nsh_hv82, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 border-b py-3");
		bindProp(__nsh_hv82, "style", () => ({ borderColor: colors().border }));
		const __nsh_hv83 = element("text");
		prop(__nsh_hv83, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv83, "style", () => ({ color: colors().foreground }));
		const __nsh_hv84 = text("Светлая тема");
		append(__nsh_hv83, __nsh_hv84);
		append(__nsh_hv82, __nsh_hv83);
		insert(__nsh_hv82, () => select("light", current().light_theme, props.themes.map((theme) => ({
			value: theme.key,
			label: theme.name,
			preview: theme.light
		})), (value) => patch({ light_theme: value }), 218, true, 260));
		const __nsh_hv85 = element("view");
		prop(__nsh_hv85, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv86 = element("text");
		prop(__nsh_hv86, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv86, "style", () => ({ color: colors().foreground }));
		const __nsh_hv87 = text("Тёмная тема");
		append(__nsh_hv86, __nsh_hv87);
		append(__nsh_hv85, __nsh_hv86);
		insert(__nsh_hv85, () => select("dark", current().dark_theme, props.themes.map((theme) => ({
			value: theme.key,
			label: theme.name,
			preview: theme.dark
		})), (value) => patch({ dark_theme: value }), 218, true, 260));
		append(__nsh_hv81, __nsh_hv82);
		append(__nsh_hv81, __nsh_hv85);
		const __nsh_hv88 = element("view");
		prop(__nsh_hv88, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv88, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv89 = element("view");
		prop(__nsh_hv89, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv90 = element("text");
		prop(__nsh_hv90, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv90, "style", () => ({ color: colors().foreground }));
		const __nsh_hv91 = text("Акцентный цвет");
		append(__nsh_hv90, __nsh_hv91);
		const __nsh_hv92 = element("view");
		prop(__nsh_hv92, "class", "flex-row flex-wrap items-center gap-2");
		insert(__nsh_hv92, [
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
		append(__nsh_hv89, __nsh_hv90);
		append(__nsh_hv89, __nsh_hv92);
		const __nsh_hv93 = element("view");
		prop(__nsh_hv93, "class", "flex-row flex-wrap items-center gap-2 border-t py-3");
		bindProp(__nsh_hv93, "style", () => ({ borderColor: colors().border }));
		insert(__nsh_hv93, () => accentChoices.map((accent) => (() => {
			const __nsh_hv94 = element("view");
			prop(__nsh_hv94, "onPress", () => patch({
				accent_source: "custom",
				accent_color: accent
			}));
			prop(__nsh_hv94, "role", "button");
			prop(__nsh_hv94, "accessibilityLabel", `Акцент ${accent}`);
			bindProp(__nsh_hv94, "accessibilityState", () => ({ selected: current().accent_source === "custom" && current().accent_color?.toLowerCase() === accent }));
			prop(__nsh_hv94, "class", "h-7 w-7 items-center justify-center rounded-lg border");
			bindProp(__nsh_hv94, "style", () => ({
				backgroundColor: accent,
				borderColor: current().accent_color?.toLowerCase() === accent ? colors().foreground : colors().border
			}));
			insert(__nsh_hv94, () => current().accent_color?.toLowerCase() === accent && (() => {
				const __nsh_hv95 = element("text");
				prop(__nsh_hv95, "class", "text-[12px]");
				prop(__nsh_hv95, "style", { color: "#ffffff" });
				const __nsh_hv96 = text("✓");
				append(__nsh_hv95, __nsh_hv96);
				return __nsh_hv95;
			})());
			return __nsh_hv94;
		})()));
		append(__nsh_hv88, __nsh_hv89);
		append(__nsh_hv88, __nsh_hv93);
		const __nsh_hv97 = element("view");
		prop(__nsh_hv97, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv97, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv98 = element("view");
		prop(__nsh_hv98, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv99 = element("text");
		prop(__nsh_hv99, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv99, "style", () => ({ color: colors().foreground }));
		const __nsh_hv100 = text("Материал окна");
		append(__nsh_hv99, __nsh_hv100);
		const __nsh_hv101 = element("view");
		prop(__nsh_hv101, "class", "flex-row flex-wrap items-center gap-2");
		insert(__nsh_hv101, () => (appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current().material, (next) => patch({ material: next }), colors(), canEdit())));
		append(__nsh_hv98, __nsh_hv99);
		append(__nsh_hv98, __nsh_hv101);
		append(__nsh_hv97, __nsh_hv98);
		const __nsh_hv102 = element("view");
		prop(__nsh_hv102, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv102, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv103 = element("view");
		prop(__nsh_hv103, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv104 = element("text");
		prop(__nsh_hv104, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv104, "style", () => ({ color: colors().foreground }));
		const __nsh_hv105 = text("Размер интерфейсного текста");
		append(__nsh_hv104, __nsh_hv105);
		append(__nsh_hv103, __nsh_hv104);
		insert(__nsh_hv103, () => select("fontSize", String(current().font_size), [.../* @__PURE__ */ new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({
			value: String(size),
			label: `${size} px`
		})), (value) => patch({ font_size: Number(value) }), 128));
		append(__nsh_hv102, __nsh_hv103);
		append(__nsh_hv73, __nsh_hv74);
		append(__nsh_hv73, __nsh_hv80);
		append(__nsh_hv73, __nsh_hv81);
		append(__nsh_hv73, __nsh_hv88);
		append(__nsh_hv73, __nsh_hv97);
		append(__nsh_hv73, __nsh_hv102);
		insert(__nsh_hv73, [
			() => appearance()?.policy.following && (() => {
				const __nsh_hv76 = element("text");
				prop(__nsh_hv76, "class", "mb-4 px-2 text-[12px]");
				bindProp(__nsh_hv76, "style", () => ({ color: colors().accent }));
				const __nsh_hv77 = text("Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.");
				append(__nsh_hv76, __nsh_hv77);
				return __nsh_hv76;
			})(),
			() => !props.editable() && !appearance()?.policy.following && (() => {
				const __nsh_hv78 = element("text");
				prop(__nsh_hv78, "class", "mb-4 px-2 text-[12px]");
				bindProp(__nsh_hv78, "style", () => ({ color: colors().muted }));
				const __nsh_hv79 = text("Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.");
				append(__nsh_hv78, __nsh_hv79);
				return __nsh_hv78;
			})(),
			() => heading("Режим")
		], __nsh_hv80);
		insert(__nsh_hv73, () => heading("Темы"), __nsh_hv81);
		insert(__nsh_hv73, () => heading("Акцент"), __nsh_hv88);
		insert(__nsh_hv73, () => heading("Стекло"), __nsh_hv97);
		insert(__nsh_hv73, () => heading("Размер текста"), __nsh_hv102);
		insert(__nsh_hv73, [() => !props.mobile && heading("Горячие клавиши"), () => !props.mobile && (() => {
			const __nsh_hv106 = element("view");
			prop(__nsh_hv106, "class", "rounded-xl border px-4");
			bindProp(__nsh_hv106, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			const __nsh_hv107 = element("view");
			prop(__nsh_hv107, "class", "h-10 flex-row items-center");
			const __nsh_hv108 = element("text");
			prop(__nsh_hv108, "class", "flex-1 text-[13px]");
			bindProp(__nsh_hv108, "style", () => ({ color: colors().foreground }));
			const __nsh_hv109 = text("Закрыть панель / поиск");
			append(__nsh_hv108, __nsh_hv109);
			const __nsh_hv110 = element("text");
			prop(__nsh_hv110, "class", "text-[12px]");
			bindProp(__nsh_hv110, "style", () => ({ color: colors().muted }));
			const __nsh_hv111 = text("Esc");
			append(__nsh_hv110, __nsh_hv111);
			append(__nsh_hv107, __nsh_hv108);
			append(__nsh_hv107, __nsh_hv110);
			append(__nsh_hv106, __nsh_hv107);
			insert(__nsh_hv106, [
				() => shortcutRow("sidebar", "Боковая панель — открыть/скрыть"),
				() => shortcutRow("create", "Новая задача — панель справа"),
				() => shortcutRow("search", "Быстрый поиск"),
				() => shortcutRow("reload", "Обновить данные из Engine")
			], __nsh_hv107);
			return __nsh_hv106;
		})()]);
		append(__nsh_hv72, __nsh_hv73);
		return __nsh_hv72;
	})();
}
function selectLabel(material, label, selected, onPress, colors, editable) {
	return (() => {
		const __nsh_hv112 = element("view");
		bindProp(__nsh_hv112, "onPress", () => editable ? () => onPress(material) : void 0);
		prop(__nsh_hv112, "role", "button");
		prop(__nsh_hv112, "accessibilityState", {
			selected: selected === material,
			disabled: !editable
		});
		prop(__nsh_hv112, "class", "rounded-lg border px-3 py-2");
		bindProp(__nsh_hv112, "style", () => ({
			backgroundColor: selected === material ? colors.card : colors.background,
			borderColor: selected === material ? colors.accent : colors.border,
			opacity: editable ? 1 : .65
		}));
		const __nsh_hv113 = element("text");
		prop(__nsh_hv113, "class", "text-[12px]");
		bindProp(__nsh_hv113, "style", () => ({ color: selected === material ? colors.foreground : colors.muted }));
		insert(__nsh_hv113, label);
		append(__nsh_hv112, __nsh_hv113);
		return __nsh_hv112;
	})();
}
function PaletteChip(props) {
	return (() => {
		const __nsh_hv114 = element("view");
		prop(__nsh_hv114, "class", "h-4 w-5 overflow-hidden rounded border");
		bindProp(__nsh_hv114, "style", () => ({
			backgroundColor: props.palette.background,
			borderColor: props.border
		}));
		const __nsh_hv115 = element("view");
		prop(__nsh_hv115, "class", "h-1 w-full");
		bindProp(__nsh_hv115, "style", () => ({ backgroundColor: props.palette.accent }));
		append(__nsh_hv114, __nsh_hv115);
		return __nsh_hv114;
	})();
}

//#endregion
//#region MobileHome.tsx
function MobileHome(props) {
	const mode = () => props.mode();
	const hidden = () => mode() === "hidden";
	const inactive = () => hidden() || mode() === "fadeInStart" || mode() === "fadeIn";
	const diaryColor = () => props.colors.background === "#0d0c10" ? "rgba(251, 146, 60, 0.7)" : "rgba(194, 65, 12, 0.7)";
	const transitioning = () => mode() !== "home";
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "h-full w-full");
		bindProp(__nsh_hv0, "pointerEvents", () => inactive() ? "none" : void 0);
		bindProp(__nsh_hv0, "style", () => ({
			display: hidden() ? "none" : "flex",
			position: transitioning() ? "absolute" : void 0,
			left: transitioning() ? 0 : void 0,
			top: transitioning() ? 0 : void 0,
			right: transitioning() ? 0 : void 0,
			bottom: transitioning() ? 0 : void 0,
			zIndex: transitioning() ? 100 : void 0,
			backgroundColor: props.colors.background,
			opacity: mode() === "fadeOut" || mode() === "fadeInStart" ? 0 : 1,
			transitionProperty: "opacity",
			transitionDuration: 65,
			transitionTimingFunction: "ease-in-out"
		}));
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "h-14 flex-row items-center justify-between px-3");
		const __nsh_hv2 = element("text");
		prop(__nsh_hv2, "class", "min-w-0 flex-1 text-[20px] font-semibold");
		bindProp(__nsh_hv2, "style", () => ({ color: props.colors.foreground }));
		const __nsh_hv3 = text("Атлас");
		append(__nsh_hv2, __nsh_hv3);
		const __nsh_hv4 = element("view");
		bindProp(__nsh_hv4, "onPress", () => props.onOpenSettings);
		prop(__nsh_hv4, "role", "button");
		prop(__nsh_hv4, "accessibilityLabel", "Настройки");
		prop(__nsh_hv4, "class", "h-10 w-10 items-center justify-center rounded-full border");
		bindProp(__nsh_hv4, "style", () => ({
			borderColor: props.colors.border,
			backgroundColor: props.colors.card
		}));
		const __nsh_hv5 = element("text");
		prop(__nsh_hv5, "class", "text-[20px]");
		bindProp(__nsh_hv5, "style", () => ({ color: props.colors.foreground }));
		const __nsh_hv6 = text("⚙");
		append(__nsh_hv5, __nsh_hv6);
		append(__nsh_hv4, __nsh_hv5);
		append(__nsh_hv1, __nsh_hv2);
		append(__nsh_hv1, __nsh_hv4);
		const __nsh_hv7 = element("view");
		prop(__nsh_hv7, "class", "min-h-0 flex-1 items-stretch justify-start px-3 pt-3");
		const __nsh_hv8 = element("view");
		bindProp(__nsh_hv8, "onPress", () => props.onOpenJournal);
		prop(__nsh_hv8, "role", "button");
		prop(__nsh_hv8, "accessibilityLabel", "Открыть дневник");
		prop(__nsh_hv8, "class", "w-full max-w-[460px] flex-row items-center gap-4 rounded-xl border p-5");
		bindProp(__nsh_hv8, "style", () => ({
			borderColor: diaryColor(),
			backgroundColor: diaryColor()
		}));
		const __nsh_hv9 = element("text");
		prop(__nsh_hv9, "class", "text-[28px]");
		prop(__nsh_hv9, "style", { color: "#ffffff" });
		const __nsh_hv10 = text("▤");
		append(__nsh_hv9, __nsh_hv10);
		const __nsh_hv11 = element("view");
		prop(__nsh_hv11, "class", "min-w-0 flex-1");
		const __nsh_hv12 = element("text");
		prop(__nsh_hv12, "class", "text-[17px] font-medium");
		prop(__nsh_hv12, "style", { color: "#ffffff" });
		const __nsh_hv13 = text("Дневник");
		append(__nsh_hv12, __nsh_hv13);
		append(__nsh_hv11, __nsh_hv12);
		append(__nsh_hv8, __nsh_hv9);
		append(__nsh_hv8, __nsh_hv11);
		append(__nsh_hv7, __nsh_hv8);
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv7);
		return __nsh_hv0;
	})();
}

//#endregion
//#region mobile-themes.ts
const mobileThemes = [{
	key: "default",
	name: "Mundus",
	light: {
		background: "#f8f7f9",
		foreground: "#222027",
		muted: "#615f67",
		border: "#dedde0",
		accent: "#2563eb",
		card: "#f3f2f4"
	},
	dark: {
		background: "#0d0c10",
		foreground: "#e7e5ea",
		muted: "#8d8a94",
		border: "#27262a",
		accent: "#60a5fa",
		card: "#131216"
	}
}];

//#endregion
//#region ../assets/fonts/Inter.ttf
var Inter_default = font("asset://Users/user/kos436/atlas-journal-native-shell/assets/fonts/Inter.ttf", "Inter");

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
const mobileRouteStack = signal([]);
const journalTransition = signal({ kind: "idle" });
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
const mobileAppearanceKey = "mundus.atlas.mobile-appearance.v1";
const mobileAppearanceOverride = signal(void 0);
function isAppearanceSettings(value) {
	if (typeof value !== "object" || value === null) return false;
	return "mode" in value && (value.mode === "system" || value.mode === "light" || value.mode === "dark") && "light_theme" in value && typeof value.light_theme === "string" && "dark_theme" in value && typeof value.dark_theme === "string" && "accent_source" in value && (value.accent_source === "theme" || value.accent_source === "custom" || value.accent_source === "wallpaper") && "material" in value && typeof value.material === "string" && "font_size" in value && typeof value.font_size === "number" && Number.isFinite(value.font_size) && "font_family" in value && typeof value.font_family === "string" && (!("accent_color" in value) || value.accent_color === void 0 || typeof value.accent_color === "string");
}
Storage.getItem(mobileAppearanceKey).then((value) => {
	if (!value) return;
	try {
		const saved = JSON.parse(value);
		if (!isAppearanceSettings(saved)) return;
		const availableThemeKeys = new Set(mobileThemes.map((theme) => theme.key));
		const mobileSettings = {
			...saved,
			light_theme: availableThemeKeys.has(saved.light_theme) ? saved.light_theme : "default",
			dark_theme: availableThemeKeys.has(saved.dark_theme) ? saved.dark_theme : "default"
		};
		mobileAppearanceOverride.set(mobileSettings);
		const current = snapshot();
		if (current.chrome === "mobile" && current.appearance) {
			const appearance = {
				...current.appearance,
				settings: mobileSettings,
				policy: {
					...current.appearance.policy,
					following: false
				}
			};
			snapshot.set({
				...current,
				appearance,
				colors: resolveAppearanceColors(appearance, current.themes, current.colors)
			});
		}
	} catch {}
});
Storage.getItem("mundus.atlas.shortcuts.v1").then((value) => {
	if (!value) return;
	try {
		const saved = JSON.parse(value);
		shortcuts.set(Object.fromEntries(shortcutNames.map((name) => [name, shortcutOptions[name].includes(saved[name] ?? "") ? saved[name] : defaultShortcuts[name]])));
	} catch {}
});
const Bridge = nativeComponent("atlas.bridge", {
	props: ["route", "canHandleBack"],
	events: [
		"state",
		"navigate",
		"journal",
		"back"
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
let mobileJournalRequested = false;
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
		if (current.chrome === "mobile") {
			mobileAppearanceOverride.set(appearance.settings);
			Storage.setItem(mobileAppearanceKey, JSON.stringify(appearance.settings));
			return;
		}
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
		onChangeShortcut: cycleShortcut,
		get mobile() {
			return snapshot().chrome === "mobile";
		}
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
		if (journalTransition().kind !== "idle") return;
		if (!isRoute(target) || !canNavigateToRoute(target, snapshot().devFeatures)) return;
		if (target === route()) return;
		if (snapshot().chrome === "mobile" && target === "journal" && route() === "home") {
			journalTransition.set({
				kind: "enter",
				phase: "primed"
			});
			mobileRouteStack.update((stack) => [...stack, route()]);
			route.set("journal");
			const fadeDuration = 130 / 2;
			setTimeout(() => journalTransition.set({
				kind: "enter",
				phase: "moving"
			}), fadeDuration);
			setTimeout(() => journalTransition.set({ kind: "idle" }), 130);
			return;
		}
		if (snapshot().chrome === "mobile") mobileRouteStack.update((stack) => [...stack, route()]);
		if (target !== "journal" && journalCalendarOpen()) toggleJournalCalendar();
		route.set(target);
	};
	const goBack = () => {
		if (journalTransition().kind !== "idle") return;
		if (mobileJournalEditorOpen()) {
			requestMobileJournalBack();
			return;
		}
		const stack = mobileRouteStack();
		const previous = stack[stack.length - 1] ?? "home";
		if (snapshot().chrome === "mobile" && route() === "journal" && previous === "home") {
			journalTransition.set({
				kind: "exit",
				phase: "primed"
			});
			const fadeDuration = 130 / 2;
			setTimeout(() => journalTransition.set({
				kind: "exit",
				phase: "moving"
			}), fadeDuration);
			setTimeout(() => {
				mobileRouteStack.set(stack.slice(0, -1));
				route.set("home");
				journalTransition.set({ kind: "idle" });
			}, 130);
			return;
		}
		mobileRouteStack.set(stack.slice(0, -1));
		route.set(previous);
	};
	const transition = journalTransition();
	return (() => {
		const __nsh_hv21 = element("view");
		prop(__nsh_hv21, "class", "relative h-full w-full flex-col font-sans");
		bindProp(__nsh_hv21, "style", () => ({ backgroundColor: snapshot().colors.background }));
		const __nsh_hv22 = element("view");
		prop(__nsh_hv22, "class", "min-h-0 flex-1 flex-row");
		const __nsh_hv26 = element("view");
		prop(__nsh_hv26, "class", "relative min-w-0 flex-1");
		insert(__nsh_hv26, [
			() => snapshot().chrome === "mobile" && route() === "journal" && (() => {
				const __nsh_hv27 = element("view");
				prop(__nsh_hv27, "class", "relative h-full min-h-0 flex-col overflow-hidden");
				bindProp(__nsh_hv27, "style", () => ({
					backgroundColor: snapshot().colors.background,
					opacity: transition.kind === "enter" ? transition.phase === "moving" ? 1 : 0 : transition.kind === "exit" ? 0 : 1,
					transitionProperty: "opacity",
					transitionDuration: 130 / 2,
					transitionTimingFunction: "ease-in-out"
				}));
				insert(__nsh_hv27, [() => !mobileJournalEditorOpen() && (() => {
					const __nsh_hv28 = element("view");
					prop(__nsh_hv28, "class", "h-14 flex-row items-center gap-2 px-3");
					const __nsh_hv29 = element("view");
					prop(__nsh_hv29, "onPress", goBack);
					prop(__nsh_hv29, "role", "button");
					prop(__nsh_hv29, "accessibilityLabel", "Назад");
					prop(__nsh_hv29, "class", "h-10 w-10 items-center justify-center rounded-full border");
					bindProp(__nsh_hv29, "style", () => ({
						borderColor: snapshot().colors.border,
						backgroundColor: snapshot().colors.card
					}));
					const __nsh_hv30 = element("text");
					prop(__nsh_hv30, "class", "text-[25px]");
					bindProp(__nsh_hv30, "style", () => ({ color: snapshot().colors.foreground }));
					const __nsh_hv31 = text("‹");
					append(__nsh_hv30, __nsh_hv31);
					append(__nsh_hv29, __nsh_hv30);
					const __nsh_hv32 = element("view");
					prop(__nsh_hv32, "class", "h-10 min-w-0 flex-1 items-center justify-center rounded-full border px-4");
					bindProp(__nsh_hv32, "style", () => ({
						borderColor: snapshot().colors.border,
						backgroundColor: snapshot().colors.card
					}));
					const __nsh_hv33 = element("text");
					prop(__nsh_hv33, "numberOfLines", 1);
					prop(__nsh_hv33, "ellipsizeMode", "tail");
					prop(__nsh_hv33, "class", "min-w-0 text-center text-[16px] font-normal");
					bindProp(__nsh_hv33, "style", () => ({
						color: snapshot().colors.foreground,
						fontFamily: Inter_default
					}));
					const __nsh_hv34 = text("Дневник");
					append(__nsh_hv33, __nsh_hv34);
					append(__nsh_hv32, __nsh_hv33);
					append(__nsh_hv28, __nsh_hv29);
					append(__nsh_hv28, __nsh_hv32);
					return __nsh_hv28;
				})(), component(JournalPage, {
					get entries() {
						return snapshot().journalEntries;
					},
					get colors() {
						return {
							...snapshot().colors,
							accent: snapshot().colors.background === "#0d0c10" ? "#fb923c" : "#c2410c"
						};
					},
					onCreate: (text) => commandRef?.("journal.create", { text }),
					onUpdate: (id, text) => commandRef?.("journal.update", {
						id,
						text
					}),
					onDelete: (id) => commandRef?.("journal.delete", { id }),
					onCopy: (text) => commandRef?.("clipboard.copy", { text }),
					nativeCalendarButton: false,
					mobile: true
				})]);
				return __nsh_hv27;
			})(),
			() => route() === "journal" && snapshot().chrome !== "mobile" && component(JournalPage, {
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
				},
				get mobile() {
					return snapshot().chrome === "mobile";
				}
			}),
			() => route() === "tasks" && (() => {
				const __nsh_hv35 = element("view");
				prop(__nsh_hv35, "class", "min-h-0 flex-1");
				insert(__nsh_hv35, [component(TaskPage, {}), () => snapshot().chrome === "tsx" && (() => {
					const __nsh_hv36 = element("view");
					prop(__nsh_hv36, "onPress", openNewTask);
					prop(__nsh_hv36, "role", "button");
					prop(__nsh_hv36, "accessibilityLabel", "Новая задача");
					prop(__nsh_hv36, "class", "absolute right-6 bottom-6 h-11 w-11 items-center justify-center rounded-full");
					bindProp(__nsh_hv36, "style", () => ({ backgroundColor: snapshot().colors.foreground }));
					insert(__nsh_hv36, component(Icon, {
						name: "plus",
						size: 20,
						get color() {
							return snapshot().colors.background;
						}
					}));
					return __nsh_hv36;
				})()]);
				return __nsh_hv35;
			})(),
			() => route() === "settings" && (snapshot().chrome === "mobile" ? (() => {
				const __nsh_hv37 = element("view");
				prop(__nsh_hv37, "class", "h-full min-h-0 flex-col");
				bindProp(__nsh_hv37, "style", () => ({ backgroundColor: snapshot().colors.background }));
				const __nsh_hv38 = element("view");
				prop(__nsh_hv38, "class", "h-14 flex-row items-center px-3");
				const __nsh_hv39 = element("view");
				prop(__nsh_hv39, "onPress", goBack);
				prop(__nsh_hv39, "role", "button");
				prop(__nsh_hv39, "accessibilityLabel", "Назад");
				prop(__nsh_hv39, "class", "h-10 w-10 items-center justify-center rounded-full border");
				bindProp(__nsh_hv39, "style", () => ({
					borderColor: snapshot().colors.border,
					backgroundColor: snapshot().colors.card
				}));
				const __nsh_hv40 = element("text");
				prop(__nsh_hv40, "class", "text-[25px]");
				bindProp(__nsh_hv40, "style", () => ({ color: snapshot().colors.foreground }));
				const __nsh_hv41 = text("‹");
				append(__nsh_hv40, __nsh_hv41);
				append(__nsh_hv39, __nsh_hv40);
				append(__nsh_hv38, __nsh_hv39);
				append(__nsh_hv37, __nsh_hv38);
				insert(__nsh_hv37, component(SettingsPage, {}));
				return __nsh_hv37;
			})() : component(SettingsPage, {})),
			() => snapshot().chrome === "mobile" && component(MobileHome, {
				get colors() {
					return snapshot().colors;
				},
				mode: () => route() === "home" ? transition.kind === "enter" && transition.phase === "primed" ? "fadeOut" : "home" : transition.kind === "exit" && transition.phase === "primed" ? "fadeInStart" : transition.kind === "exit" && transition.phase === "moving" ? "fadeIn" : "hidden",
				onOpenJournal: () => changeRoute("journal"),
				onOpenSettings: () => changeRoute("settings")
			}),
			() => addTaskOpen() && component(Dialog, {
				title: "Новая задача",
				get colors() {
					return snapshot().colors;
				},
				get children() {
					return [(() => {
						const __nsh_hv42 = element("input");
						bindProp(__nsh_hv42, "value", () => newTaskTitle());
						prop(__nsh_hv42, "onChange", (value) => newTaskTitle.set(value));
						prop(__nsh_hv42, "onSubmit", (event) => {
							commandRef?.("create", { title: event.text });
							addTaskOpen.set(false);
						});
						prop(__nsh_hv42, "placeholder", "Название задачи");
						prop(__nsh_hv42, "class", "h-10 rounded-lg px-3 text-[13px]");
						bindProp(__nsh_hv42, "style", () => ({
							backgroundColor: snapshot().colors.background,
							color: snapshot().colors.foreground
						}));
						return __nsh_hv42;
					})(), (() => {
						const __nsh_hv43 = element("view");
						prop(__nsh_hv43, "class", "mt-3 flex-row justify-end gap-2");
						insert(__nsh_hv43, [component(Button, {
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
						return __nsh_hv43;
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
			insert(__nsh_hv24, () => primaryNavigation.map((item) => (!item.devOnly || snapshot().devFeatures) && component(NavigationItem, {
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
			insert(__nsh_hv25, () => footerNavigation.map((item) => (!item.devOnly || snapshot().devFeatures) && component(NavigationItem, {
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
			get canHandleBack() {
				return snapshot().chrome === "mobile" && (route() !== "home" || mobileJournalEditorOpen());
			},
			onState: (next) => {
				route.set(next.route);
				const themes = next.chrome === "mobile" ? mobileThemes : next.themes;
				const mobileSettings = mobileAppearanceOverride();
				const mobileAppearance = next.chrome === "mobile" && mobileSettings && next.appearance ? {
					...next.appearance,
					settings: mobileSettings,
					policy: {
						...next.appearance.policy,
						following: false
					}
				} : next.appearance;
				const nextSnapshot = {
					...mobileAppearance ? {
						...next,
						themes,
						appearance: mobileAppearance,
						colors: resolveAppearanceColors(mobileAppearance, themes, next.colors)
					} : {
						...next,
						themes
					},
					journalEntries: next.chrome === "mobile" ? next.journalEntries : snapshot().journalEntries
				};
				snapshot.set(nextSnapshot);
				if (next.chrome === "mobile") commandRef?.("window.background", { color: nextSnapshot.colors.background });
				sidebarVisible.set(next.sidebarVisible);
				if (next.chrome === "mobile" && !mobileJournalRequested) {
					mobileJournalRequested = true;
					commandRef?.("reload");
				}
			},
			onJournal: (entries) => snapshot.set({
				...snapshot(),
				journalEntries: entries
			}),
			onNavigate: (event) => changeRoute(event.route),
			onBack: goBack
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
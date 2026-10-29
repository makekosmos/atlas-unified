import { append, bindProp, component, each, element, font, insert, prop, setup, spread, text } from "nsh:rt";
import { Clipboard, Easing, LayoutAnimation, PanResponder, Storage, createMotion, effect, keymap, mount, nativeComponent, signal } from "nsh";
import { Menu, Window, titleBar } from "nsh/desktop";
import { platform } from "os";

//#region ../../../../../kos436/atlas-journal-native-shell/node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+6e9b9b5d5bf9ff48ad29f9e9600e2e93eb6a9c11/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/icons.ts
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
//#region ../../../../../kos436/atlas-journal-native-shell/node_modules/.pnpm/@makekosmos+imago-nsh@https+++codeload.github.com+makekosmos+imago+tar.gz+6e9b9b5d5bf9ff48ad29f9e9600e2e93eb6a9c11/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/components.tsx
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
//#region themes.ts
function colors(background, foreground, muted, border, accent, card) {
	return {
		background,
		foreground,
		muted,
		border,
		accent,
		card
	};
}
const BLUE_LIGHT = "#1e86fc";
const BLUE_DARK = "#1784fc";
const previewThemes = [{
	key: "default",
	name: "Default",
	light: colors("#f8f7f9", "#222027", "#615f67", "#dedde0", BLUE_LIGHT, "#f3f2f4"),
	dark: colors("#0d0c10", "#e7e5ea", "#8d8a94", "#27262a", BLUE_DARK, "#131216")
}];
const systemAccents = [
	{
		key: "mono",
		name: "Чёрный",
		darkName: "Белый",
		light: "#000000",
		dark: "#ffffff",
		plate: "#d1d1d1",
		legacy: []
	},
	{
		key: "brown",
		name: "Коричневый",
		light: "#a16c39",
		dark: "#a16c39",
		plate: "#83582f",
		legacy: ["#996e42"]
	},
	{
		key: "red",
		name: "Красный",
		light: "#fb2c3f",
		dark: "#fc2d3e",
		plate: "#cf2633",
		legacy: ["#e74347", "#e84447"]
	},
	{
		key: "orange",
		name: "Оранжевый",
		light: "#fe6a10",
		dark: "#fa6710",
		plate: "#cc550f",
		legacy: ["#ec7332", "#e87031"]
	},
	{
		key: "yellow",
		name: "Жёлтый",
		light: "#f69312",
		dark: "#f79411",
		plate: "#ca7912",
		legacy: ["#e8983a", "#e9993a"]
	},
	{
		key: "green",
		name: "Зелёный",
		light: "#13c16f",
		dark: "#13c370",
		plate: "#169f5c",
		legacy: ["#59be77", "#5ac078"]
	},
	{
		key: "teal",
		name: "Бирюзовый",
		light: "#15b8a3",
		dark: "#15b8a4",
		plate: "#179686",
		legacy: ["#55b5a3", "#55b5a4"]
	},
	{
		key: "blue",
		name: "Синий",
		light: BLUE_LIGHT,
		dark: BLUE_DARK,
		plate: "#156dcf",
		legacy: ["#4184f4", "#3e82f4"]
	},
	{
		key: "purple",
		name: "Фиолетовый",
		light: "#905afa",
		dark: "#915bfc",
		plate: "#764ace",
		legacy: ["#885cf1", "#895df3"]
	},
	{
		key: "pink",
		name: "Розовый",
		light: "#f93498",
		dark: "#fb3499",
		plate: "#cd2b7e",
		legacy: ["#e54896", "#e74897"]
	},
	{
		key: "gray",
		name: "Серый",
		light: "#959595",
		dark: "#777777",
		plate: "#626262",
		legacy: []
	}
];
function systemAccent(stored, dark) {
	if (!stored) return void 0;
	const needle = stored.toLowerCase();
	const match = systemAccents.find((accent) => accent.light === needle || accent.dark === needle || accent.legacy.includes(needle));
	if (!match) return stored;
	return dark ? match.dark : match.light;
}
function journalBubble(accent) {
	const needle = accent.toLowerCase();
	return systemAccents.find((item) => item.dark === needle && item.light !== item.dark)?.plate ?? accent;
}
function accentMark(hex) {
	const n = Number.parseInt(hex.replace("#", ""), 16);
	if (Number.isNaN(n)) return "#ffffff";
	return ((n >> 16 & 255) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1e3 > 160 ? "#1d1d1f" : "#ffffff";
}

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
	themes: previewThemes,
	colors: previewThemes[0].dark,
	sidebarVisible: true,
	devFeatures: true,
	chrome: "tsx"
};
function resolveAppearanceColors(appearance, themes, fallbackColors) {
	const settings = appearance.settings;
	const dark = settings.mode !== "light";
	const themeColors = (themes.find((item) => item.key === "default") ?? themes[0])?.[dark ? "dark" : "light"] ?? fallbackColors;
	if (settings.accent_source === "wallpaper") return {
		...themeColors,
		accent: fallbackColors.accent
	};
	const custom = settings.accent_source === "custom" ? systemAccent(settings.accent_color, dark) : void 0;
	return {
		...themeColors,
		accent: custom ?? themeColors.accent
	};
}
function isSnapshot(value) {
	if (typeof value !== "object" || value === null || !("route" in value) || !isRoute(value.route)) return false;
	if (!("title" in value) || typeof value.title !== "string" || !("todos" in value) || !Array.isArray(value.todos)) return false;
	if (!value.todos.every(isTodo$1) || !("journalEntries" in value) || !Array.isArray(value.journalEntries) || !value.journalEntries.every(isJournalEntry$1)) return false;
	return "version" in value && typeof value.version === "string" && "appearanceEditable" in value && typeof value.appearanceEditable === "boolean" && "themes" in value && Array.isArray(value.themes) && "colors" in value && isColors(value.colors) && "sidebarVisible" in value && typeof value.sidebarVisible === "boolean" && "devFeatures" in value && typeof value.devFeatures === "boolean" && (value.route !== "tasks" || value.devFeatures) && "chrome" in value && (value.chrome === "native" || value.chrome === "tsx" || value.chrome === "mobile");
}
function canNavigateToRoute(route, devFeatures) {
	return route !== "tasks" || devFeatures;
}
function isRoute(value) {
	return value === "home" || value === "journal" || value === "tasks" || value === "settings" || value === "connection";
}
function isTodo$1(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "title" in value && typeof value.title === "string" && "is_completed" in value && typeof value.is_completed === "boolean";
}
function isJournalEntry$1(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "text" in value && typeof value.text === "string" && "createdAt" in value && typeof value.createdAt === "string";
}
function isColors(value) {
	if (typeof value !== "object" || value === null) return false;
	return "background" in value && typeof value.background === "string" && "foreground" in value && typeof value.foreground === "string" && "muted" in value && typeof value.muted === "string" && "border" in value && typeof value.border === "string" && "accent" in value && typeof value.accent === "string" && "card" in value && typeof value.card === "string";
}

//#endregion
//#region chrome.tsx
const TITLEBAR_HEIGHT = 38;
const SIDEBAR_WIDTH = 256;
const ROW_HEIGHT = 32;
const CONTROL_RADIUS = 6;
const ROW_RADIUS = 8;
const CLUSTER_START_MACOS = 88;
const CLUSTER_START = 10;
const TRAILING_INSET = 6;
const CAPTION_BUTTON_WIDTH = 36;
const closeHovered = signal(false);
function animatePanes() {
	LayoutAnimation.configureNext({
		duration: 200,
		update: {
			type: "easeOut",
			duration: 200
		}
	});
}
const SIDEBAR_MOTION_MS = 200;
const sidebarWidth = signal(256);
let sidebarTween = null;
let sidebarScheduled = false;
function easeOut(t) {
	const x2 = .58;
	let u = t;
	for (let i = 0; i < 6; i++) {
		const x = 3 * (1 - u) * u * u * x2 + u * u * u;
		const slope = 6 * (1 - u) * u * x2 + 3 * u * u * .42000000000000004;
		if (Math.abs(slope) < 1e-6) break;
		u = Math.min(1, Math.max(0, u - (x - t) / slope));
	}
	return 3 * (1 - u) * u * u + u * u * u;
}
function sidebarWidthAt(from, to, elapsed, duration = 200) {
	const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
	return from + (to - from) * easeOut(t);
}
function sidebarFrame(now) {
	const tween = sidebarTween;
	if (!tween) return sidebarWidth();
	if (now - tween.started >= 200) {
		sidebarTween = null;
		sidebarWidth.set(tween.to);
		return tween.to;
	}
	const value = sidebarWidthAt(tween.from, tween.to, now - tween.started);
	sidebarWidth.set(value);
	return value;
}
function scheduleSidebar() {
	if (sidebarScheduled || !sidebarTween) return;
	sidebarScheduled = true;
	requestAnimationFrame(() => {
		sidebarScheduled = false;
		if (!sidebarTween) return;
		sidebarFrame(Date.now());
		scheduleSidebar();
	});
}
function animateSidebar(open, now) {
	const to = open ? 256 : 0;
	const from = sidebarWidth();
	if (from === to) {
		sidebarTween = null;
		return;
	}
	sidebarTween = {
		from,
		to,
		started: now ?? Date.now()
	};
	if (now === void 0) scheduleSidebar();
}
function sidebarPaneWidth() {
	return sidebarWidth();
}
function surfaceWash(dark, alpha = .05) {
	return dark ? `rgba(235,235,235,${alpha})` : `rgba(26,26,26,${alpha})`;
}
function hoverWash(dark) {
	return surfaceWash(dark, dark ? .11 : .06);
}
function titlebarControlTop(size) {
	return 21 - size / 2;
}
function channel(hex, shift) {
	const h = hex.trim().replace("#", "");
	if (h.length !== 6) return null;
	const n = Number.parseInt(h, 16);
	if (Number.isNaN(n)) return null;
	return n >> shift & 255;
}
function colorAlpha(hex, alpha) {
	const r = channel(hex, 16);
	const g = channel(hex, 8);
	const b = channel(hex, 0);
	if (r === null || g === null || b === null) return hex;
	return `rgba(${r},${g},${b},${alpha})`;
}
function hostOs() {
	const name = platform();
	if (name === "darwin" || name === "macos") return "macos";
	if (name === "win32" || name === "windows") return "windows";
	return name;
}
function drawsCaptionButtons(os, reservedRight) {
	return (os === "windows" || os === "linux") && reservedRight === 0;
}
function TitlebarOverlay(props) {
	const controls = titleBar();
	const os = hostOs();
	const macos = os === "macos";
	const drawCaptions = drawsCaptionButtons(os, controls.right);
	const captionWidth = drawCaptions ? 108 : controls.right;
	const sidebarLeft = macos ? Math.max(controls.left, CLUSTER_START_MACOS) : Math.max(controls.left, CLUSTER_START);
	const calendarRight = captionWidth + TRAILING_INSET;
	const wash = hoverWash(props.dark);
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "absolute left-0 right-0 top-0 z-20");
		bindProp(__nsh_hv0, "style", () => ({ height: controls.height || 38 }));
		prop(__nsh_hv0, "desktop", { windowDrag: true });
		const __nsh_hv1 = element("view");
		bindProp(__nsh_hv1, "onPress", () => props.onToggleSidebar);
		prop(__nsh_hv1, "role", "button");
		prop(__nsh_hv1, "accessibilityLabel", "Боковая панель");
		prop(__nsh_hv1, "class", "absolute items-center justify-center");
		prop(__nsh_hv1, "desktop", { windowDrag: false });
		prop(__nsh_hv1, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv1, "style", () => ({
			top: titlebarControlTop(24),
			left: sidebarLeft,
			width: 24,
			height: 24,
			borderRadius: CONTROL_RADIUS,
			cursor: "pointer"
		}));
		insert(__nsh_hv1, component(Icon, {
			name: "sidebar",
			size: 16,
			get color() {
				return props.colors.muted;
			}
		}));
		append(__nsh_hv0, __nsh_hv1);
		insert(__nsh_hv0, [() => props.showCalendarToggle && (() => {
			const __nsh_hv2 = element("view");
			bindProp(__nsh_hv2, "onPress", () => props.onToggleCalendar);
			prop(__nsh_hv2, "role", "button");
			bindProp(__nsh_hv2, "accessibilityLabel", () => props.calendarOpen ? "Скрыть календарь" : "Показать календарь");
			bindProp(__nsh_hv2, "accessibilityState", () => ({ selected: props.calendarOpen }));
			prop(__nsh_hv2, "class", "absolute items-center justify-center");
			prop(__nsh_hv2, "desktop", { windowDrag: false });
			bindProp(__nsh_hv2, "hoverStyle", () => ({ backgroundColor: surfaceWash(props.dark, .11) }));
			bindProp(__nsh_hv2, "style", () => ({
				top: titlebarControlTop(28),
				right: calendarRight,
				width: 28,
				height: 28,
				borderRadius: CONTROL_RADIUS,
				cursor: "pointer",
				backgroundColor: props.calendarOpen ? surfaceWash(props.dark, .09) : "transparent"
			}));
			insert(__nsh_hv2, component(Icon, {
				name: "sidebar",
				size: 16,
				get color() {
					return props.calendarOpen ? props.colors.foreground : props.colors.muted;
				}
			}));
			return __nsh_hv2;
		})(), () => drawCaptions && (() => {
			const __nsh_hv3 = element("view");
			prop(__nsh_hv3, "class", "absolute right-0 top-0 flex-row");
			prop(__nsh_hv3, "desktop", { windowDrag: false });
			prop(__nsh_hv3, "style", { height: 38 });
			const __nsh_hv4 = element("view");
			prop(__nsh_hv4, "onPress", () => Window.minimize());
			prop(__nsh_hv4, "role", "button");
			prop(__nsh_hv4, "accessibilityLabel", "Свернуть окно");
			prop(__nsh_hv4, "class", "items-center justify-center");
			prop(__nsh_hv4, "desktop", { windowDrag: false });
			prop(__nsh_hv4, "hoverStyle", { backgroundColor: wash });
			prop(__nsh_hv4, "style", {
				width: CAPTION_BUTTON_WIDTH,
				height: 38,
				cursor: "pointer"
			});
			insert(__nsh_hv4, component(Icon, {
				name: "windowMin",
				get color() {
					return props.colors.foreground;
				},
				size: 12
			}));
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "onPress", () => Window.toggleMaximize());
			prop(__nsh_hv5, "role", "button");
			prop(__nsh_hv5, "accessibilityLabel", "Развернуть окно");
			prop(__nsh_hv5, "class", "items-center justify-center");
			prop(__nsh_hv5, "desktop", { windowDrag: false });
			prop(__nsh_hv5, "hoverStyle", { backgroundColor: wash });
			prop(__nsh_hv5, "style", {
				width: CAPTION_BUTTON_WIDTH,
				height: 38,
				cursor: "pointer"
			});
			insert(__nsh_hv5, component(Icon, {
				name: "windowMax",
				get color() {
					return props.colors.foreground;
				},
				size: 12
			}));
			const __nsh_hv6 = element("view");
			prop(__nsh_hv6, "onPress", () => Window.close());
			prop(__nsh_hv6, "onHoverIn", () => closeHovered.set(true));
			prop(__nsh_hv6, "onHoverOut", () => closeHovered.set(false));
			prop(__nsh_hv6, "role", "button");
			prop(__nsh_hv6, "accessibilityLabel", "Закрыть окно");
			prop(__nsh_hv6, "class", "items-center justify-center");
			prop(__nsh_hv6, "desktop", { windowDrag: false });
			prop(__nsh_hv6, "hoverStyle", { backgroundColor: "#e81123" });
			prop(__nsh_hv6, "style", {
				width: CAPTION_BUTTON_WIDTH,
				height: 38,
				cursor: "pointer"
			});
			insert(__nsh_hv6, component(Icon, {
				name: "windowClose",
				get color() {
					return closeHovered() ? "#ffffff" : props.colors.foreground;
				},
				size: 12
			}));
			append(__nsh_hv3, __nsh_hv4);
			append(__nsh_hv3, __nsh_hv5);
			append(__nsh_hv3, __nsh_hv6);
			return __nsh_hv3;
		})()]);
		return __nsh_hv0;
	})();
}
function SidebarRow(props) {
	const wash = hoverWash(props.dark);
	return (() => {
		const __nsh_hv7 = element("view");
		bindProp(__nsh_hv7, "onPress", () => props.onPress);
		prop(__nsh_hv7, "role", "button");
		bindProp(__nsh_hv7, "accessibilityState", () => ({ selected: props.selected }));
		prop(__nsh_hv7, "class", "flex-row items-center");
		prop(__nsh_hv7, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv7, "style", () => ({
			height: 32,
			gap: 8,
			paddingLeft: 8,
			paddingRight: 8,
			borderRadius: ROW_RADIUS,
			backgroundColor: props.selected ? wash : "transparent",
			cursor: "pointer"
		}));
		const __nsh_hv8 = element("text");
		prop(__nsh_hv8, "class", "text-[13px]");
		bindProp(__nsh_hv8, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv8, () => props.label);
		append(__nsh_hv7, __nsh_hv8);
		insert(__nsh_hv7, component(Icon, {
			get name() {
				return props.icon;
			},
			size: 16,
			get color() {
				return props.colors.foreground;
			}
		}), __nsh_hv8);
		return __nsh_hv7;
	})();
}
function GhostButton(props) {
	return (() => {
		const __nsh_hv9 = element("view");
		bindProp(__nsh_hv9, "onPress", () => props.onPress);
		prop(__nsh_hv9, "role", "button");
		bindProp(__nsh_hv9, "accessibilityLabel", () => props.label);
		prop(__nsh_hv9, "class", "items-center justify-center");
		bindProp(__nsh_hv9, "hoverStyle", () => ({ backgroundColor: props.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }));
		prop(__nsh_hv9, "style", {
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: ROW_RADIUS,
			cursor: "pointer"
		});
		const __nsh_hv10 = element("text");
		prop(__nsh_hv10, "class", "text-[13px]");
		bindProp(__nsh_hv10, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv10, () => props.label);
		append(__nsh_hv9, __nsh_hv10);
		return __nsh_hv9;
	})();
}
function SolidButton(props) {
	return (() => {
		const __nsh_hv11 = element("view");
		bindProp(__nsh_hv11, "onPress", () => props.onPress);
		prop(__nsh_hv11, "role", "button");
		bindProp(__nsh_hv11, "accessibilityLabel", () => props.label);
		prop(__nsh_hv11, "class", "items-center justify-center");
		prop(__nsh_hv11, "hoverStyle", { opacity: .9 });
		bindProp(__nsh_hv11, "style", () => ({
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: ROW_RADIUS,
			backgroundColor: props.background,
			cursor: "pointer"
		}));
		const __nsh_hv12 = element("text");
		prop(__nsh_hv12, "class", "text-[13px] font-medium");
		bindProp(__nsh_hv12, "style", () => ({ color: props.foreground }));
		insert(__nsh_hv12, () => props.label);
		append(__nsh_hv11, __nsh_hv12);
		return __nsh_hv11;
	})();
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
	for (const group of groups.values()) group.entries.sort((a, b) => entryTime(a) - entryTime(b));
	return [...groups.values()].sort((a, b) => groupTime(a) - groupTime(b));
}
function entryTime(entry) {
	const time = new Date(entry.createdAt).valueOf();
	return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}
function groupTime(group) {
	return group.kind === "dated" ? group.date.valueOf() : Number.POSITIVE_INFINITY;
}
function formatJournalDay(group, now = /* @__PURE__ */ new Date()) {
	if (group.kind === "invalid") return group.label;
	if (localDayKey(group.date) === localDayKey(now)) return "Сегодня";
	const year = group.date.getFullYear() === now.getFullYear() ? "" : ` ${group.date.getFullYear()}`;
	return `${weekdays$1[group.date.getDay()]}, ${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
}
function formatJournalStamp(createdAt, _now = /* @__PURE__ */ new Date()) {
	const date = new Date(createdAt);
	if (Number.isNaN(date.valueOf())) return "";
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
		bindProp(__nsh_hv0, "class", () => props.framed ? "h-full border-l" : "h-full");
		bindProp(__nsh_hv0, "style", () => ({
			width: props.width,
			backgroundColor: props.framed ? props.colors.card : "transparent",
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
			prop(__nsh_hv4, "class", "flex-row items-center justify-end gap-2");
			bindProp(__nsh_hv4, "hoverStyle", () => ({ backgroundColor: hoverWash(props.dark) }));
			prop(__nsh_hv4, "style", {
				height: 24,
				paddingLeft: 8,
				paddingRight: 8,
				borderRadius: 8,
				cursor: "pointer"
			});
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
const COMPOSER_RADIUS = 26;
const COMPOSER_COMPACT_HEIGHT = 49;
const COMPOSER_SEND = 30;
const COMPOSER_LINE = 22;
const COMPOSER_PAD_X = 16;
const COMPOSER_PAD_Y = 12;
const COMPOSER_MAX_CONTENT = 132;
const COMPOSER_MAX_HEIGHT = 168;
const CARET_WIDTH = 2;
const CARET_BLINK_MS = 500;
const COMPOSER_FADE = 20;
const BUBBLE_RADIUS = 18;
const FEED_PAD = 16;
const THREAD_WIDTH = 690;
const JOURNAL_DATE_DELAY_MS = 2e3;
const feedBox = signal({
	width: 0,
	height: 0
});
const journalHoverId = signal(null);
const journalDateShown = signal(null);
let journalDateWarm = false;
let journalDateTimer;
function threadSpan() {
	const width = feedBox().width;
	return width > 0 ? Math.min(width, THREAD_WIDTH) : THREAD_WIDTH;
}
function clearJournalDateTimer() {
	if (journalDateTimer !== void 0) {
		clearTimeout(journalDateTimer);
		journalDateTimer = void 0;
	}
}
function journalDateDelay(warm) {
	return warm ? 0 : JOURNAL_DATE_DELAY_MS;
}
function showJournalDate(id) {
	journalHoverId.set(id);
	clearJournalDateTimer();
	const delay = journalDateDelay(journalDateWarm);
	if (delay === 0) {
		journalDateShown.set(id);
		return;
	}
	journalDateShown.set(null);
	journalDateTimer = setTimeout(() => {
		journalDateTimer = void 0;
		if (journalHoverId() !== id) return;
		journalDateWarm = true;
		journalDateShown.set(id);
	}, delay);
}
function hideJournalDate(id) {
	if (journalHoverId() !== id) return;
	clearJournalDateTimer();
	journalHoverId.set(null);
	journalDateShown.set(null);
}
function leaveJournalDates() {
	clearJournalDateTimer();
	journalDateWarm = false;
	journalHoverId.set(null);
	journalDateShown.set(null);
}
const journalCalendarOpen$1 = signal(false);
const NativeCalendarToggle$1 = nativeComponent("atlas.journalCalendarToggle", {
	props: ["expanded", "label"],
	events: ["press"]
});
const journalCalendarWidth$1 = signal(260);
const journalDraft$1 = signal("");
const journalDraftContentHeight$1 = signal(COMPOSER_LINE);
const journalFocused = signal(false);
const journalSelection = signal({
	start: 0,
	end: 0
});
const journalCaret = signal({
	x: COMPOSER_PAD_X,
	y: COMPOSER_PAD_Y,
	height: COMPOSER_LINE
});
const journalCaretOn = signal(true);
const journalCaretTick = signal(0);
const journalScrollY = signal(0);
const journalCalendarMinWidth = 220;
const journalCalendarMaxWidth = 420;
const journalCalendarResizeHovered = signal(false);
const journalCalendarResizeActive = signal(false);
const editingJournalId$1 = signal(null);
const editingJournalText$1 = signal("");
const arrivingId = signal(null);
let sendSeq = 0;
let composerRef;
let editFocus;
function claimJournalComposer() {
	if (editingJournalId$1()) return;
	composerRef?.focus();
}
function animateComposer() {
	LayoutAnimation.configureNext({
		duration: 180,
		update: {
			type: "easeOut",
			duration: 180
		}
	});
}
function clampDraftHeight(height) {
	return Math.round(Math.max(COMPOSER_LINE, Math.min(COMPOSER_MAX_CONTENT, height)));
}
function composerContentHeight() {
	return Math.max(COMPOSER_LINE, journalDraftContentHeight$1());
}
function composerInputHeight() {
	return composerContentHeight() + 24;
}
function composerViewportHeight() {
	return clampDraftHeight(composerContentHeight()) + 24;
}
function composerPillHeight() {
	return Math.max(COMPOSER_COMPACT_HEIGHT, Math.min(COMPOSER_MAX_HEIGHT, composerViewportHeight()));
}
function composerFadeEdges(content, viewport, scroll) {
	const max = Math.max(0, content - viewport);
	if (max <= 1) return {
		top: false,
		bottom: false
	};
	return {
		top: scroll > 1,
		bottom: scroll < max - 1
	};
}
function composerFadeTop() {
	return composerFadeEdges(composerInputHeight(), composerViewportHeight(), journalScrollY()).top;
}
function composerFadeBottom() {
	return composerFadeEdges(composerInputHeight(), composerViewportHeight(), journalScrollY()).bottom;
}
function composerExpanded() {
	return journalDraftContentHeight$1() > 23;
}
function placeCaret(bounds) {
	const height = bounds.size.height;
	if (height <= 0) return;
	journalCaret.set({
		x: bounds.origin.x,
		y: bounds.origin.y,
		height
	});
	journalCaretOn.set(true);
	journalCaretTick.update((n) => n + 1);
}
function composerSelecting() {
	const range = journalSelection();
	return range.start !== range.end;
}
function composerCaretShown() {
	return journalFocused() && !composerSelecting() && journalCaretOn();
}
function animateSend() {
	LayoutAnimation.configureNext({
		duration: 280,
		create: {
			type: "easeOut",
			property: "opacity",
			duration: 220
		},
		update: {
			type: "easeOut",
			duration: 180
		},
		delete: {
			type: "easeOut",
			property: "opacity",
			duration: 160
		}
	});
}
function nextEntryId() {
	sendSeq += 1;
	return `local-${Date.now()}-${sendSeq}`;
}
function JournalBubble(props) {
	const sendMotion = props.arriving ? createMotion({ enter: {
		keyframes: [{
			opacity: 0,
			translateY: 40,
			scale: .96
		}, {
			opacity: 1,
			translateY: 0,
			scale: 1
		}],
		duration: 280,
		easing: Easing.bezier(.16, 1, .3, 1)
	} }) : null;
	const openEntryMenu = (event) => {
		if (editingJournalId$1() === props.entry.id) return;
		Menu.popup([
			{
				label: "Копировать",
				onSelect: () => void Clipboard.writeText(props.entry.text)
			},
			{
				label: "Изменить",
				onSelect: () => {
					editingJournalId$1.set(props.entry.id);
					editingJournalText$1.set(props.entry.text);
				}
			},
			{
				label: "Удалить",
				onSelect: () => props.onDelete(props.entry.id)
			}
		], event.pagePosition);
	};
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "onHoverIn", () => showJournalDate(props.entry.id));
		prop(__nsh_hv0, "onHoverOut", () => hideJournalDate(props.entry.id));
		prop(__nsh_hv0, "class", "mb-2 w-full flex-row items-center justify-end");
		const __nsh_hv2 = element("view");
		prop(__nsh_hv2, "onContextMenu", openEntryMenu);
		prop(__nsh_hv2, "class", "max-w-[75%] px-3 py-2");
		bindProp(__nsh_hv2, "style", () => ({
			backgroundColor: editingJournalId$1() === props.entry.id ? props.colors.card : journalBubble(props.colors.accent),
			borderRadius: BUBBLE_RADIUS,
			transformOrigin: "bottom right",
			...sendMotion?.style ?? {}
		}));
		insert(__nsh_hv2, () => editingJournalId$1() === props.entry.id ? (() => {
			const __nsh_hv3 = element("view");
			const __nsh_hv4 = element("input");
			prop(__nsh_hv4, "ref", (node) => {
				editFocus = node;
			});
			prop(__nsh_hv4, "autoFocus", true);
			bindProp(__nsh_hv4, "value", () => editingJournalText$1());
			prop(__nsh_hv4, "onChange", (value) => editingJournalText$1.set(value));
			prop(__nsh_hv4, "multiline", true);
			prop(__nsh_hv4, "submitBehavior", "newline");
			prop(__nsh_hv4, "accessibilityLabel", "Текст записи");
			prop(__nsh_hv4, "class", "min-h-[56px] w-full rounded-lg px-2 py-1 text-[15px]");
			bindProp(__nsh_hv4, "style", () => ({
				color: props.colors.foreground,
				backgroundColor: props.colors.background
			}));
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "class", "mt-2 flex-row justify-end");
			prop(__nsh_hv5, "style", { gap: 8 });
			insert(__nsh_hv5, [component(GhostButton, {
				label: "Отмена",
				get colors() {
					return props.colors;
				},
				get dark() {
					return props.dark;
				},
				onPress: () => editingJournalId$1.set(null)
			}), component(SolidButton, {
				label: "Сохранить",
				get background() {
					return props.colors.accent;
				},
				get foreground() {
					return props.colors.background;
				},
				onPress: () => {
					props.onUpdate(props.entry.id, editingJournalText$1());
					editingJournalId$1.set(null);
				}
			})]);
			append(__nsh_hv3, __nsh_hv4);
			append(__nsh_hv3, __nsh_hv5);
			return __nsh_hv3;
		})() : (() => {
			const __nsh_hv6 = element("text");
			prop(__nsh_hv6, "selectable", true);
			prop(__nsh_hv6, "onContextMenu", openEntryMenu);
			prop(__nsh_hv6, "class", "text-[15px] leading-5");
			bindProp(__nsh_hv6, "style", () => ({
				color: "#ffffff",
				selectionColor: colorAlpha(props.colors.accent, props.dark ? .35 : .24)
			}));
			insert(__nsh_hv6, () => props.entry.text);
			return __nsh_hv6;
		})());
		append(__nsh_hv0, __nsh_hv2);
		insert(__nsh_hv0, () => journalDateShown() === props.entry.id && (() => {
			const __nsh_hv1 = element("text");
			prop(__nsh_hv1, "pointerEvents", "none");
			prop(__nsh_hv1, "class", "mr-2 text-[11px]");
			bindProp(__nsh_hv1, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv1, () => formatJournalStamp(props.entry.createdAt));
			return __nsh_hv1;
		})(), __nsh_hv2);
		return __nsh_hv0;
	})();
}
function JournalPage(props) {
	let feedRef;
	let composerScrollRef;
	const revealComposer = (caret) => {
		const viewport = composerViewportHeight();
		const max = Math.max(0, composerInputHeight() - viewport);
		const top = caret.y;
		const bottom = top + Math.max(caret.height, COMPOSER_LINE);
		let next = journalScrollY();
		if (top < next) next = top;
		else if (bottom > next + viewport) next = bottom - viewport;
		next = Math.max(0, Math.min(max, next));
		if (Math.abs(next - journalScrollY()) <= 1) return;
		journalScrollY.set(next);
		composerScrollRef?.scrollTo({
			y: next,
			animated: false
		});
	};
	let pageWidth = 0;
	let resizeStartWidth = journalCalendarWidth$1();
	const resizeCalendar = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onPanResponderGrant: () => {
			resizeStartWidth = journalCalendarWidth$1();
			journalCalendarResizeActive.set(true);
		},
		onPanResponderMove: (_, gesture) => {
			const maxWidth = pageWidth > 0 ? Math.max(journalCalendarMinWidth, Math.min(journalCalendarMaxWidth, pageWidth * .42)) : journalCalendarMaxWidth;
			journalCalendarWidth$1.set(Math.max(journalCalendarMinWidth, Math.min(maxWidth, resizeStartWidth - gesture.dx)));
		},
		onPanResponderRelease: () => journalCalendarResizeActive.set(false),
		onPanResponderTerminate: () => journalCalendarResizeActive.set(false),
		onPanResponderTerminationRequest: () => false
	});
	const dayOffsets = /* @__PURE__ */ new Map();
	const groups = () => buildJournalDays(props.entries());
	effect(() => {
		if (props.entries().length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
	});
	effect(() => {
		const editing = editingJournalId$1();
		queueMicrotask(() => {
			if (editing) editFocus?.focus();
			else composerRef?.focus();
		});
		return () => journalFocused.set(false);
	});
	effect(() => {
		if (!journalFocused()) return;
		journalCaretTick();
		journalCaretOn.set(true);
		let timer = setTimeout(function tick() {
			journalCaretOn.update((on) => !on);
			timer = setTimeout(tick, CARET_BLINK_MS);
		}, CARET_BLINK_MS);
		return () => clearTimeout(timer);
	});
	const send = (text) => {
		const value = text.trim();
		if (!value) return;
		const id = nextEntryId();
		arrivingId.set(id);
		animateSend();
		props.onCreate(value, id);
		journalDraft$1.set("");
		journalDraftContentHeight$1.set(COMPOSER_LINE);
		journalScrollY.set(0);
		composerScrollRef?.scrollTo({
			y: 0,
			animated: false
		});
		journalCaret.set({
			x: COMPOSER_PAD_X,
			y: COMPOSER_PAD_Y,
			height: COMPOSER_LINE
		});
		journalCaretOn.set(true);
		journalCaretTick.update((n) => n + 1);
		composerRef?.focus();
	};
	const jumpToDay = (key) => {
		const target = closestJournalDay(groups(), key);
		if (journalCalendarOpen$1()) toggleJournalCalendar$1();
		if (target?.kind === "dated") {
			const offset = dayOffsets.get(target.key);
			if (offset !== void 0) feedRef?.scrollTo({
				y: Math.max(0, offset - 12),
				animated: true
			});
		}
	};
	return (() => {
		const __nsh_hv7 = element("view");
		prop(__nsh_hv7, "onLayout", (bounds) => {
			pageWidth = bounds.size.width;
		});
		prop(__nsh_hv7, "onPress", claimJournalComposer);
		prop(__nsh_hv7, "class", "min-h-0 flex-1 flex-row overflow-hidden");
		const __nsh_hv8 = element("view");
		prop(__nsh_hv8, "class", "relative min-w-0 flex-1 flex-col items-center");
		const __nsh_hv10 = element("view");
		prop(__nsh_hv10, "class", "relative min-h-0 w-full flex-1");
		const __nsh_hv11 = element("scroll");
		prop(__nsh_hv11, "ref", (node) => {
			feedRef = node;
		});
		prop(__nsh_hv11, "onLayout", (bounds) => feedBox.set({
			width: bounds.size.width,
			height: bounds.size.height
		}));
		prop(__nsh_hv11, "contentStyle", { flexGrow: 1 });
		prop(__nsh_hv11, "class", "min-h-0 w-full flex-1 pb-4");
		const __nsh_hv12 = element("view");
		prop(__nsh_hv12, "onHoverOut", leaveJournalDates);
		prop(__nsh_hv12, "class", "mx-auto justify-end");
		bindProp(__nsh_hv12, "style", () => ({
			width: threadSpan(),
			minHeight: feedBox().height,
			paddingTop: props.titlebarInset + 16,
			paddingLeft: FEED_PAD,
			paddingRight: FEED_PAD
		}));
		insert(__nsh_hv12, [each(() => groups(), (group) => (() => {
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "onLayout", (bounds) => {
				dayOffsets.set(group().key, bounds.origin.y);
			});
			prop(__nsh_hv13, "class", "mb-4");
			const __nsh_hv14 = element("text");
			prop(__nsh_hv14, "class", "mb-3 text-center text-[12px]");
			bindProp(__nsh_hv14, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv14, () => formatJournalDay(group()));
			append(__nsh_hv13, __nsh_hv14);
			insert(__nsh_hv13, each(() => group().entries, (entry) => component(JournalBubble, {
				get entry() {
					return entry();
				},
				get arriving() {
					return arrivingId() === entry().id;
				},
				get colors() {
					return props.colors;
				},
				get dark() {
					return props.dark;
				},
				get onUpdate() {
					return props.onUpdate;
				},
				get onDelete() {
					return props.onDelete;
				}
			}), ((entry) => entry.id)));
			return __nsh_hv13;
		})(), ((group) => group.key)), () => groups().length === 0 && (() => {
			const __nsh_hv15 = element("view");
			prop(__nsh_hv15, "class", "flex-1 items-center justify-center py-12");
			const __nsh_hv16 = element("text");
			prop(__nsh_hv16, "class", "text-[13px]");
			bindProp(__nsh_hv16, "style", () => ({ color: props.colors.muted }));
			const __nsh_hv17 = text("Записей пока нет");
			append(__nsh_hv16, __nsh_hv17);
			append(__nsh_hv15, __nsh_hv16);
			return __nsh_hv15;
		})()]);
		append(__nsh_hv11, __nsh_hv12);
		const __nsh_hv18 = element("view");
		prop(__nsh_hv18, "pointerEvents", "none");
		prop(__nsh_hv18, "class", "absolute right-0 top-0 bottom-0 w-[8px]");
		bindProp(__nsh_hv18, "style", () => ({
			backgroundColor: props.colors.background,
			opacity: .86
		}));
		append(__nsh_hv10, __nsh_hv11);
		append(__nsh_hv10, __nsh_hv18);
		const __nsh_hv19 = element("view");
		prop(__nsh_hv19, "class", "mb-4 mx-auto w-full");
		prop(__nsh_hv19, "style", {
			maxWidth: THREAD_WIDTH,
			paddingLeft: FEED_PAD,
			paddingRight: FEED_PAD
		});
		const __nsh_hv20 = element("view");
		prop(__nsh_hv20, "class", "w-full flex-row border");
		bindProp(__nsh_hv20, "style", () => ({
			height: composerPillHeight(),
			alignItems: composerExpanded() ? "flex-end" : "center",
			backgroundColor: props.colors.card,
			borderColor: props.colors.border,
			borderRadius: COMPOSER_RADIUS
		}));
		const __nsh_hv21 = element("view");
		prop(__nsh_hv21, "class", "relative min-w-0 flex-1 overflow-hidden");
		bindProp(__nsh_hv21, "style", () => ({ height: composerViewportHeight() }));
		const __nsh_hv22 = element("scroll");
		prop(__nsh_hv22, "ref", (node) => {
			composerScrollRef = node;
		});
		prop(__nsh_hv22, "scrollbar", false);
		prop(__nsh_hv22, "onScroll", (event) => journalScrollY.set(event.offset.y));
		prop(__nsh_hv22, "class", "w-full");
		bindProp(__nsh_hv22, "style", () => ({ height: composerViewportHeight() }));
		const __nsh_hv23 = element("view");
		prop(__nsh_hv23, "class", "relative w-full");
		bindProp(__nsh_hv23, "style", () => ({ height: composerInputHeight() }));
		const __nsh_hv24 = element("input");
		prop(__nsh_hv24, "ref", (node) => {
			composerRef = node;
		});
		prop(__nsh_hv24, "autoFocus", true);
		bindProp(__nsh_hv24, "value", () => journalDraft$1());
		prop(__nsh_hv24, "onChange", (value) => journalDraft$1.set(value));
		prop(__nsh_hv24, "onContentSizeChange", ({ height }) => {
			const raw = Math.max(COMPOSER_LINE, Math.round(height));
			if (raw === journalDraftContentHeight$1()) return;
			if (clampDraftHeight(raw) !== clampDraftHeight(journalDraftContentHeight$1())) animateComposer();
			journalDraftContentHeight$1.set(raw);
			revealComposer(journalCaret());
		});
		prop(__nsh_hv24, "onCaretMove", (event) => {
			placeCaret(event.bounds);
			revealComposer(journalCaret());
		});
		prop(__nsh_hv24, "onSelectionChange", (range) => journalSelection.set(range));
		prop(__nsh_hv24, "onFocus", () => journalFocused.set(true));
		prop(__nsh_hv24, "onBlur", () => journalFocused.set(false));
		prop(__nsh_hv24, "onSubmit", (event) => send(event.text));
		prop(__nsh_hv24, "multiline", true);
		prop(__nsh_hv24, "submitBehavior", "submit");
		prop(__nsh_hv24, "caret", false);
		prop(__nsh_hv24, "placeholder", "Запись в дневник…");
		prop(__nsh_hv24, "accessibilityLabel", "Новая запись в дневник");
		prop(__nsh_hv24, "class", "min-w-0 w-full text-[15px]");
		bindProp(__nsh_hv24, "style", () => ({
			height: composerInputHeight(),
			fontSize: 15,
			lineHeight: COMPOSER_LINE,
			paddingLeft: COMPOSER_PAD_X,
			paddingRight: 8,
			paddingTop: COMPOSER_PAD_Y,
			paddingBottom: COMPOSER_PAD_Y,
			placeholderColor: props.colors.muted,
			selectionColor: colorAlpha(props.colors.accent, props.dark ? .35 : .24),
			backgroundColor: "transparent",
			color: props.colors.foreground
		}));
		const __nsh_hv25 = element("view");
		prop(__nsh_hv25, "pointerEvents", "none");
		prop(__nsh_hv25, "class", "absolute");
		bindProp(__nsh_hv25, "style", () => ({
			left: journalCaret().x,
			top: journalCaret().y,
			width: CARET_WIDTH,
			height: journalCaret().height,
			backgroundColor: props.colors.accent,
			opacity: composerCaretShown() ? 1 : 0,
			zIndex: 1
		}));
		append(__nsh_hv23, __nsh_hv24);
		append(__nsh_hv23, __nsh_hv25);
		append(__nsh_hv22, __nsh_hv23);
		append(__nsh_hv21, __nsh_hv22);
		insert(__nsh_hv21, [() => composerFadeTop() && (() => {
			const __nsh_hv26 = element("view");
			prop(__nsh_hv26, "pointerEvents", "none");
			prop(__nsh_hv26, "class", "absolute left-0 right-0 top-0");
			bindProp(__nsh_hv26, "style", () => ({
				height: COMPOSER_FADE,
				backgroundImage: `linear-gradient(to bottom, ${props.colors.card}, ${colorAlpha(props.colors.card, 0)})`,
				zIndex: 2
			}));
			return __nsh_hv26;
		})(), () => composerFadeBottom() && (() => {
			const __nsh_hv27 = element("view");
			prop(__nsh_hv27, "pointerEvents", "none");
			prop(__nsh_hv27, "class", "absolute left-0 right-0 bottom-0");
			bindProp(__nsh_hv27, "style", () => ({
				height: COMPOSER_FADE,
				backgroundImage: `linear-gradient(to bottom, ${colorAlpha(props.colors.card, 0)}, ${props.colors.card})`,
				zIndex: 2
			}));
			return __nsh_hv27;
		})()]);
		const __nsh_hv28 = element("view");
		prop(__nsh_hv28, "onPress", () => send(journalDraft$1()));
		prop(__nsh_hv28, "role", "button");
		prop(__nsh_hv28, "accessibilityLabel", "Отправить запись");
		prop(__nsh_hv28, "class", "shrink-0 items-center justify-center rounded-full");
		bindProp(__nsh_hv28, "hoverStyle", () => ({ opacity: journalDraft$1().trim() ? .85 : .35 }));
		bindProp(__nsh_hv28, "activeStyle", () => ({ opacity: journalDraft$1().trim() ? .7 : .35 }));
		bindProp(__nsh_hv28, "style", () => ({
			width: COMPOSER_SEND,
			height: COMPOSER_SEND,
			marginRight: 8,
			marginBottom: composerExpanded() ? 10 : 0,
			backgroundColor: journalBubble(props.colors.accent),
			opacity: journalDraft$1().trim() ? 1 : .35,
			cursor: journalDraft$1().trim() ? "pointer" : "default"
		}));
		const __nsh_hv29 = element("text");
		prop(__nsh_hv29, "class", "text-[14px] font-semibold");
		bindProp(__nsh_hv29, "style", () => ({ color: accentMark(journalBubble(props.colors.accent)) }));
		const __nsh_hv30 = text("↑");
		append(__nsh_hv29, __nsh_hv30);
		append(__nsh_hv28, __nsh_hv29);
		append(__nsh_hv20, __nsh_hv21);
		append(__nsh_hv20, __nsh_hv28);
		append(__nsh_hv19, __nsh_hv20);
		append(__nsh_hv8, __nsh_hv10);
		append(__nsh_hv8, __nsh_hv19);
		insert(__nsh_hv8, () => props.nativeCalendarButton ? component(NativeCalendarToggle$1, {
			get expanded() {
				return journalCalendarOpen$1();
			},
			get label() {
				return journalCalendarOpen$1() ? "Скрыть календарь" : "Показать календарь";
			},
			onPress: toggleJournalCalendar$1,
			get accessibilityLabel() {
				return journalCalendarOpen$1() ? "Скрыть календарь" : "Показать календарь";
			},
			class: "absolute right-4 z-10 h-8 w-8",
			get style() {
				return { top: props.titlebarInset + 16 };
			}
		}) : props.titlebarInset === 0 && (() => {
			const __nsh_hv9 = element("view");
			prop(__nsh_hv9, "onPress", toggleJournalCalendar$1);
			prop(__nsh_hv9, "role", "button");
			bindProp(__nsh_hv9, "accessibilityLabel", () => journalCalendarOpen$1() ? "Скрыть календарь" : "Показать календарь");
			bindProp(__nsh_hv9, "accessibilityState", () => ({ selected: journalCalendarOpen$1() }));
			prop(__nsh_hv9, "class", "absolute z-10 items-center justify-center");
			bindProp(__nsh_hv9, "hoverStyle", () => ({ backgroundColor: surfaceWash(props.dark, .11) }));
			bindProp(__nsh_hv9, "style", () => ({
				top: 16,
				right: 16,
				width: 28,
				height: 28,
				borderRadius: 6,
				cursor: "pointer",
				backgroundColor: journalCalendarOpen$1() ? surfaceWash(props.dark, .09) : "transparent"
			}));
			insert(__nsh_hv9, component(Icon, {
				name: "sidebar",
				size: 16,
				get color() {
					return journalCalendarOpen$1() ? props.colors.foreground : props.colors.muted;
				}
			}));
			return __nsh_hv9;
		})(), __nsh_hv10);
		const __nsh_hv31 = element("view");
		prop(__nsh_hv31, "class", "relative h-full shrink-0 overflow-hidden");
		bindProp(__nsh_hv31, "style", () => ({ width: journalCalendarOpen$1() ? journalCalendarWidth$1() : 0 }));
		const __nsh_hv32 = element("view");
		prop(__nsh_hv32, "class", "h-full border-l");
		bindProp(__nsh_hv32, "style", () => ({
			width: journalCalendarWidth$1(),
			paddingTop: props.titlebarInset,
			backgroundColor: surfaceWash(props.dark),
			borderColor: journalCalendarResizeHovered() || journalCalendarResizeActive() ? props.colors.muted : props.colors.border,
			transitionProperty: "borderColor",
			transitionDuration: 150,
			transitionTimingFunction: "ease-out"
		}));
		insert(__nsh_hv32, component(JournalCalendar, {
			get width() {
				return journalCalendarWidth$1();
			},
			framed: false,
			resizeHovered: false,
			get groups() {
				return groups();
			},
			get colors() {
				return props.colors;
			},
			get dark() {
				return props.dark;
			},
			onSelect: jumpToDay
		}));
		append(__nsh_hv31, __nsh_hv32);
		insert(__nsh_hv31, () => journalCalendarOpen$1() && (() => {
			const __nsh_hv33 = element("view");
			spread(__nsh_hv33, resizeCalendar.panHandlers);
			prop(__nsh_hv33, "role", "button");
			prop(__nsh_hv33, "accessibilityLabel", "Изменить ширину календаря");
			prop(__nsh_hv33, "onHoverIn", () => journalCalendarResizeHovered.set(true));
			prop(__nsh_hv33, "onHoverOut", () => journalCalendarResizeHovered.set(false));
			prop(__nsh_hv33, "class", "absolute top-0 bottom-0 z-10 w-5");
			prop(__nsh_hv33, "style", {
				left: -10,
				cursor: "col-resize"
			});
			return __nsh_hv33;
		})());
		append(__nsh_hv7, __nsh_hv8);
		append(__nsh_hv7, __nsh_hv31);
		return __nsh_hv7;
	})();
}
function toggleJournalCalendar$1() {
	animatePanes();
	journalCalendarOpen$1.update((open) => !open);
}

//#endregion
//#region MobileJournalPage.tsx
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
function MobileJournalPage(props) {
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
					bindProp(__nsh_hv12, "onLongPress", () => props.mobile ? () => openJournalActions(entry) : void 0);
					bindProp(__nsh_hv12, "onContextMenu", () => props.mobile ? () => openJournalActions(entry) : void 0);
					prop(__nsh_hv12, "delayLongPress", 430);
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
			prop(__nsh_hv29, "class", "w-full flex-row gap-2 rounded-[24px] border px-2 py-1.5");
			bindProp(__nsh_hv29, "style", () => ({
				alignItems: mobileDraftNeedsExpand() ? "flex-end" : "center",
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
			prop(__nsh_hv35, "class", "mx-auto w-full max-w-[650px] flex-row gap-2 border pl-3 pr-1.5 py-1.5");
			bindProp(__nsh_hv35, "style", () => ({
				alignItems: journalDraftContentHeight() > journalDraftExpandedHeight ? "flex-end" : "center",
				backgroundColor: props.colors.card,
				borderColor: props.colors.border,
				borderRadius: 24
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
					framed: false,
					get dark() {
						return props.colors.background === "#0d0c10";
					},
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
const modePreviews = [{
	value: "light",
	label: "Светлая"
}, {
	value: "dark",
	label: "Тёмная"
}];
const modePickerOpen = signal(false);
const modePickerClosing = signal(false);
let modePickerTimer;
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
function showModePicker() {
	modePickerClosing.set(false);
	if (modePickerTimer !== void 0) clearTimeout(modePickerTimer);
	modePickerOpen.set(true);
}
function hideModePicker() {
	modePickerClosing.set(true);
	if (modePickerTimer !== void 0) clearTimeout(modePickerTimer);
	modePickerTimer = setTimeout(() => {
		modePickerOpen.set(false);
		modePickerClosing.set(false);
		modePickerTimer = void 0;
	}, 160);
}
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
	const select = (id, value, options, onSelect, width) => {
		const expanded = openSelector() === id;
		return (() => {
			const __nsh_hv1 = element("view");
			prop(__nsh_hv1, "style", { width });
			const __nsh_hv2 = element("view");
			prop(__nsh_hv2, "onPress", () => canEdit() && openSelector.set(expanded ? null : id));
			prop(__nsh_hv2, "role", "button");
			prop(__nsh_hv2, "accessibilityLabel", "Выбрать размер текста");
			bindProp(__nsh_hv2, "accessibilityState", () => ({
				expanded,
				disabled: !canEdit()
			}));
			prop(__nsh_hv2, "class", "h-9 flex-row items-center justify-between rounded-lg border px-3");
			bindProp(__nsh_hv2, "style", () => ({
				backgroundColor: colors().card,
				borderColor: expanded ? colors().accent : colors().border,
				opacity: canEdit() ? 1 : .65
			}));
			const __nsh_hv3 = element("text");
			prop(__nsh_hv3, "class", "text-[12px]");
			bindProp(__nsh_hv3, "style", () => ({ color: colors().foreground }));
			insert(__nsh_hv3, () => options.find((option) => option.value === value)?.label ?? value);
			const __nsh_hv4 = element("text");
			prop(__nsh_hv4, "class", "text-[11px]");
			bindProp(__nsh_hv4, "style", () => ({ color: colors().muted }));
			insert(__nsh_hv4, expanded ? "⌃" : "⌄");
			append(__nsh_hv2, __nsh_hv3);
			append(__nsh_hv2, __nsh_hv4);
			append(__nsh_hv1, __nsh_hv2);
			insert(__nsh_hv1, () => expanded && (() => {
				const __nsh_hv5 = element("view");
				prop(__nsh_hv5, "class", "mt-1 rounded-xl border p-1");
				bindProp(__nsh_hv5, "style", () => ({
					backgroundColor: colors().card,
					borderColor: colors().border
				}));
				insert(__nsh_hv5, () => options.map((option) => (() => {
					const __nsh_hv6 = element("view");
					prop(__nsh_hv6, "onPress", () => {
						onSelect(option.value);
						openSelector.set(null);
					});
					prop(__nsh_hv6, "role", "button");
					bindProp(__nsh_hv6, "accessibilityState", () => ({ selected: option.value === value }));
					prop(__nsh_hv6, "class", "h-9 flex-row items-center gap-2 rounded-md px-2");
					const __nsh_hv7 = element("text");
					prop(__nsh_hv7, "class", "flex-1 text-[12px]");
					bindProp(__nsh_hv7, "style", () => ({ color: colors().foreground }));
					insert(__nsh_hv7, () => option.label);
					append(__nsh_hv6, __nsh_hv7);
					insert(__nsh_hv6, () => option.value === value && (() => {
						const __nsh_hv8 = element("text");
						prop(__nsh_hv8, "class", "text-[12px]");
						bindProp(__nsh_hv8, "style", () => ({ color: colors().accent }));
						const __nsh_hv9 = text("✓");
						append(__nsh_hv8, __nsh_hv9);
						return __nsh_hv8;
					})());
					return __nsh_hv6;
				})()));
				return __nsh_hv5;
			})());
			return __nsh_hv1;
		})();
	};
	const shortcutRow = (name, label) => (() => {
		const __nsh_hv10 = element("view");
		prop(__nsh_hv10, "class", "min-h-[52px] flex-row items-center gap-4 border-b py-3");
		bindProp(__nsh_hv10, "style", () => ({ borderColor: colors().border }));
		const __nsh_hv11 = element("text");
		prop(__nsh_hv11, "class", "flex-1 text-[13px]");
		bindProp(__nsh_hv11, "style", () => ({ color: colors().foreground }));
		insert(__nsh_hv11, label);
		const __nsh_hv12 = element("view");
		prop(__nsh_hv12, "onPress", () => props.onChangeShortcut(name));
		prop(__nsh_hv12, "role", "button");
		prop(__nsh_hv12, "accessibilityLabel", `Изменить сочетание: ${label}`);
		prop(__nsh_hv12, "class", "rounded-md px-3 py-1");
		bindProp(__nsh_hv12, "style", () => ({ backgroundColor: colors().background }));
		const __nsh_hv13 = element("text");
		prop(__nsh_hv13, "class", "text-[12px]");
		bindProp(__nsh_hv13, "style", () => ({ color: colors().accent }));
		insert(__nsh_hv13, () => keymap.label(props.shortcuts[name]));
		append(__nsh_hv12, __nsh_hv13);
		append(__nsh_hv10, __nsh_hv11);
		append(__nsh_hv10, __nsh_hv12);
		return __nsh_hv10;
	})();
	if (!settings() || !appearance()) return (() => {
		const __nsh_hv14 = element("scroll");
		bindProp(__nsh_hv14, "class", () => `min-h-0 flex-1 ${props.mobile ? "px-4" : "px-7"} pt-4 pb-8`);
		const __nsh_hv15 = element("text");
		prop(__nsh_hv15, "class", "text-[13px]");
		bindProp(__nsh_hv15, "style", () => ({ color: colors().muted }));
		const __nsh_hv16 = text("Загружаем настройки внешнего вида…");
		append(__nsh_hv15, __nsh_hv16);
		append(__nsh_hv14, __nsh_hv15);
		return __nsh_hv14;
	})();
	const current = () => settings();
	if (props.mobile) {
		const selectedMode = () => current().mode === "light" ? "light" : "dark";
		const selectedLabel = () => selectedMode() === "light" ? "Светлая" : "Тёмная";
		return (() => {
			const __nsh_hv17 = element("view");
			prop(__nsh_hv17, "class", "relative min-h-0 flex-1");
			bindProp(__nsh_hv17, "style", () => ({ backgroundColor: colors().background }));
			const __nsh_hv18 = element("scroll");
			prop(__nsh_hv18, "class", "min-h-0 flex-1 px-3 pt-2 pb-8");
			bindProp(__nsh_hv18, "style", () => ({ backgroundColor: colors().background }));
			const __nsh_hv19 = element("text");
			prop(__nsh_hv19, "class", "mb-2 px-3 text-[13px]");
			bindProp(__nsh_hv19, "style", () => ({ color: colors().muted }));
			const __nsh_hv20 = text("Синхронизация");
			append(__nsh_hv19, __nsh_hv20);
			const __nsh_hv21 = element("view");
			bindProp(__nsh_hv21, "onPress", () => props.onConnections);
			prop(__nsh_hv21, "role", "button");
			prop(__nsh_hv21, "accessibilityLabel", "Открыть подключения");
			prop(__nsh_hv21, "class", "mb-5 min-h-[62px] flex-row items-center gap-3 rounded-xl border px-4");
			bindProp(__nsh_hv21, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			const __nsh_hv22 = element("view");
			prop(__nsh_hv22, "class", "h-2 w-2 rounded-full");
			bindProp(__nsh_hv22, "style", () => ({ backgroundColor: props.connection?.peers.some((peer) => peer.status === "online") ? "#22c55e" : props.connection?.running ? "#facc15" : "#ef4444" }));
			const __nsh_hv23 = element("view");
			prop(__nsh_hv23, "class", "flex-1");
			const __nsh_hv24 = element("text");
			prop(__nsh_hv24, "class", "text-[14px]");
			bindProp(__nsh_hv24, "style", () => ({ color: colors().foreground }));
			const __nsh_hv25 = text("Устройства и подключение");
			append(__nsh_hv24, __nsh_hv25);
			const __nsh_hv26 = element("text");
			prop(__nsh_hv26, "class", "text-[12px]");
			bindProp(__nsh_hv26, "style", () => ({ color: colors().muted }));
			insert(__nsh_hv26, () => !props.connection ? "Проверяем подключение…" : props.connection.peers.some((peer) => peer.status === "online") ? "Устройство в сети" : props.connection.running ? "Ожидает подключения" : "Синхронизация остановлена");
			append(__nsh_hv23, __nsh_hv24);
			append(__nsh_hv23, __nsh_hv26);
			const __nsh_hv27 = element("text");
			prop(__nsh_hv27, "class", "text-[18px]");
			bindProp(__nsh_hv27, "style", () => ({ color: colors().muted }));
			const __nsh_hv28 = text("›");
			append(__nsh_hv27, __nsh_hv28);
			append(__nsh_hv21, __nsh_hv22);
			append(__nsh_hv21, __nsh_hv23);
			append(__nsh_hv21, __nsh_hv27);
			const __nsh_hv29 = element("text");
			prop(__nsh_hv29, "class", "mb-2 px-3 text-[13px]");
			bindProp(__nsh_hv29, "style", () => ({ color: colors().muted }));
			const __nsh_hv30 = text("Отображение");
			append(__nsh_hv29, __nsh_hv30);
			const __nsh_hv31 = element("view");
			prop(__nsh_hv31, "class", "mb-5 rounded-xl border px-4");
			bindProp(__nsh_hv31, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			const __nsh_hv32 = element("view");
			prop(__nsh_hv32, "onPress", () => canEdit() && showModePicker());
			prop(__nsh_hv32, "role", "button");
			prop(__nsh_hv32, "accessibilityLabel", "Выбрать тему оформления");
			prop(__nsh_hv32, "class", "min-h-[58px] flex-row items-center gap-3");
			const __nsh_hv33 = element("text");
			prop(__nsh_hv33, "class", "flex-1 text-[14px]");
			bindProp(__nsh_hv33, "style", () => ({ color: colors().foreground }));
			const __nsh_hv34 = text("Тема");
			append(__nsh_hv33, __nsh_hv34);
			const __nsh_hv35 = element("text");
			prop(__nsh_hv35, "class", "text-[13px]");
			bindProp(__nsh_hv35, "style", () => ({ color: colors().muted }));
			insert(__nsh_hv35, () => selectedLabel());
			const __nsh_hv36 = element("text");
			prop(__nsh_hv36, "class", "text-[18px]");
			bindProp(__nsh_hv36, "style", () => ({ color: colors().muted }));
			const __nsh_hv37 = text("›");
			append(__nsh_hv36, __nsh_hv37);
			append(__nsh_hv32, __nsh_hv33);
			append(__nsh_hv32, __nsh_hv35);
			append(__nsh_hv32, __nsh_hv36);
			append(__nsh_hv31, __nsh_hv32);
			const __nsh_hv38 = element("view");
			prop(__nsh_hv38, "class", "mb-5 rounded-xl border px-4 py-2");
			bindProp(__nsh_hv38, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			const __nsh_hv39 = element("view");
			prop(__nsh_hv39, "class", "min-h-[50px] flex-row items-center gap-3");
			const __nsh_hv40 = element("text");
			prop(__nsh_hv40, "class", "flex-1 text-[14px]");
			bindProp(__nsh_hv40, "style", () => ({ color: colors().foreground }));
			const __nsh_hv41 = text("Размер интерфейсного текста");
			append(__nsh_hv40, __nsh_hv41);
			append(__nsh_hv39, __nsh_hv40);
			insert(__nsh_hv39, () => select("fontSize", String(current().font_size), [.../* @__PURE__ */ new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({
				value: String(size),
				label: `${size} px`
			})), (value) => patch({ font_size: Number(value) }), 92));
			append(__nsh_hv38, __nsh_hv39);
			append(__nsh_hv18, __nsh_hv19);
			append(__nsh_hv18, __nsh_hv21);
			append(__nsh_hv18, __nsh_hv29);
			append(__nsh_hv18, __nsh_hv31);
			append(__nsh_hv18, __nsh_hv38);
			insert(__nsh_hv18, () => heading("Размер текста"), __nsh_hv38);
			append(__nsh_hv17, __nsh_hv18);
			insert(__nsh_hv17, () => modePickerOpen() && (() => {
				const __nsh_hv42 = element("view");
				prop(__nsh_hv42, "class", "absolute inset-0 items-center justify-center px-7");
				bindProp(__nsh_hv42, "style", () => ({
					backgroundColor: "rgba(0,0,0,0.42)",
					opacity: modePickerClosing() ? 0 : 1,
					transitionProperty: "opacity",
					transitionDuration: 160
				}));
				const __nsh_hv43 = element("view");
				prop(__nsh_hv43, "onPress", hideModePicker);
				prop(__nsh_hv43, "class", "absolute inset-0");
				prop(__nsh_hv43, "accessibilityLabel", "Закрыть выбор темы");
				const __nsh_hv44 = element("view");
				prop(__nsh_hv44, "class", "z-10 w-full max-w-[340px] rounded-2xl border p-2");
				bindProp(__nsh_hv44, "style", () => ({
					backgroundColor: colors().card,
					borderColor: colors().border,
					opacity: modePickerClosing() ? 0 : 1,
					transform: [{ translateY: modePickerClosing() ? 12 : 0 }, { scale: modePickerClosing() ? .96 : 1 }],
					transitionProperty: "opacity, transform",
					transitionDuration: 180,
					transitionTimingFunction: "ease-out"
				}));
				const __nsh_hv45 = element("text");
				prop(__nsh_hv45, "class", "px-3 pt-2 pb-1 text-[14px] font-semibold");
				bindProp(__nsh_hv45, "style", () => ({ color: colors().foreground }));
				const __nsh_hv46 = text("Тема оформления");
				append(__nsh_hv45, __nsh_hv46);
				append(__nsh_hv44, __nsh_hv45);
				insert(__nsh_hv44, () => modePreviews.map((mode, index) => (() => {
					const __nsh_hv47 = element("view");
					prop(__nsh_hv47, "onPress", () => {
						patch({ mode: mode.value });
						hideModePicker();
					});
					prop(__nsh_hv47, "role", "radio");
					bindProp(__nsh_hv47, "accessibilityState", () => ({
						selected: selectedMode() === mode.value,
						disabled: !canEdit()
					}));
					prop(__nsh_hv47, "class", `min-h-[52px] flex-row items-center gap-3 rounded-xl px-3 ${index ? "mt-1" : ""}`);
					bindProp(__nsh_hv47, "style", () => ({
						backgroundColor: selectedMode() === mode.value ? colors().background : "transparent",
						opacity: canEdit() ? 1 : .65
					}));
					const __nsh_hv48 = element("view");
					prop(__nsh_hv48, "class", "h-5 w-5 items-center justify-center rounded-full border-2");
					bindProp(__nsh_hv48, "style", () => ({ borderColor: selectedMode() === mode.value ? colors().accent : colors().muted }));
					insert(__nsh_hv48, () => selectedMode() === mode.value && (() => {
						const __nsh_hv49 = element("view");
						prop(__nsh_hv49, "class", "h-2.5 w-2.5 rounded-full");
						bindProp(__nsh_hv49, "style", () => ({ backgroundColor: colors().accent }));
						return __nsh_hv49;
					})());
					const __nsh_hv50 = element("text");
					prop(__nsh_hv50, "class", "flex-1 text-[14px]");
					bindProp(__nsh_hv50, "style", () => ({ color: colors().foreground }));
					insert(__nsh_hv50, () => mode.label);
					append(__nsh_hv47, __nsh_hv48);
					append(__nsh_hv47, __nsh_hv50);
					return __nsh_hv47;
				})()));
				append(__nsh_hv42, __nsh_hv43);
				append(__nsh_hv42, __nsh_hv44);
				return __nsh_hv42;
			})());
			return __nsh_hv17;
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
			const __nsh_hv51 = element("view");
			prop(__nsh_hv51, "onPress", () => patch({ mode: mode.value }));
			prop(__nsh_hv51, "role", "button");
			bindProp(__nsh_hv51, "accessibilityState", () => ({
				selected: current().mode === mode.value,
				disabled: !canEdit()
			}));
			prop(__nsh_hv51, "class", "min-w-0 flex-1");
			bindProp(__nsh_hv51, "style", () => ({ opacity: canEdit() ? 1 : .65 }));
			const __nsh_hv52 = element("view");
			bindProp(__nsh_hv52, "class", () => `${props.mobile ? "h-[104px] p-2" : "h-[148px] p-3"} items-center justify-center overflow-hidden rounded-md border`);
			bindProp(__nsh_hv52, "style", () => ({
				borderColor: current().mode === mode.value ? colors().accent : palette.border,
				backgroundColor: palette.background
			}));
			const __nsh_hv53 = element("view");
			prop(__nsh_hv53, "class", "h-full w-full flex-row overflow-hidden rounded-md border");
			bindProp(__nsh_hv53, "style", () => ({
				borderColor: palette.border,
				backgroundColor: palette.card
			}));
			const __nsh_hv54 = element("view");
			prop(__nsh_hv54, "class", "w-1/3 gap-2 border-r p-2");
			bindProp(__nsh_hv54, "style", () => ({ borderColor: palette.border }));
			const __nsh_hv55 = element("view");
			prop(__nsh_hv55, "class", "h-2 rounded");
			bindProp(__nsh_hv55, "style", () => ({ backgroundColor: palette.accent }));
			const __nsh_hv56 = element("view");
			prop(__nsh_hv56, "class", "h-1.5 rounded");
			bindProp(__nsh_hv56, "style", () => ({ backgroundColor: palette.muted }));
			const __nsh_hv57 = element("view");
			prop(__nsh_hv57, "class", "h-1.5 rounded");
			bindProp(__nsh_hv57, "style", () => ({ backgroundColor: palette.border }));
			append(__nsh_hv54, __nsh_hv55);
			append(__nsh_hv54, __nsh_hv56);
			append(__nsh_hv54, __nsh_hv57);
			const __nsh_hv58 = element("view");
			prop(__nsh_hv58, "class", "flex-1 gap-2 p-2");
			const __nsh_hv59 = element("view");
			prop(__nsh_hv59, "class", "h-2 w-1/2 rounded");
			bindProp(__nsh_hv59, "style", () => ({ backgroundColor: palette.muted }));
			const __nsh_hv60 = element("view");
			prop(__nsh_hv60, "class", "h-9 rounded");
			bindProp(__nsh_hv60, "style", () => ({ backgroundColor: palette.background }));
			const __nsh_hv61 = element("view");
			prop(__nsh_hv61, "class", "h-1.5 w-2/3 rounded");
			bindProp(__nsh_hv61, "style", () => ({ backgroundColor: palette.border }));
			append(__nsh_hv58, __nsh_hv59);
			append(__nsh_hv58, __nsh_hv60);
			append(__nsh_hv58, __nsh_hv61);
			append(__nsh_hv53, __nsh_hv54);
			append(__nsh_hv53, __nsh_hv58);
			append(__nsh_hv52, __nsh_hv53);
			const __nsh_hv62 = element("text");
			prop(__nsh_hv62, "class", "mt-2 text-center text-[12px]");
			bindProp(__nsh_hv62, "style", () => ({ color: current().mode === mode.value ? colors().accent : colors().muted }));
			insert(__nsh_hv62, () => mode.label);
			append(__nsh_hv51, __nsh_hv52);
			append(__nsh_hv51, __nsh_hv62);
			return __nsh_hv51;
		})();
	};
	return (() => {
		const __nsh_hv63 = element("scroll");
		bindProp(__nsh_hv63, "class", () => `min-h-0 flex-1 ${props.mobile ? "px-4" : "px-7"} pt-4 pb-8`);
		bindProp(__nsh_hv63, "style", () => ({ backgroundColor: colors().background }));
		const __nsh_hv64 = element("view");
		prop(__nsh_hv64, "class", "mx-auto w-full max-w-[720px]");
		const __nsh_hv65 = element("text");
		prop(__nsh_hv65, "class", "mb-5 px-2 text-[22px] font-semibold");
		bindProp(__nsh_hv65, "style", () => ({ color: colors().foreground }));
		const __nsh_hv66 = text("Оформление");
		append(__nsh_hv65, __nsh_hv66);
		const __nsh_hv71 = element("view");
		prop(__nsh_hv71, "class", "mb-8 flex-row gap-4");
		insert(__nsh_hv71, () => modePreviews.map(modeCard));
		const __nsh_hv72 = element("view");
		prop(__nsh_hv72, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv72, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv73 = element("view");
		prop(__nsh_hv73, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv74 = element("text");
		prop(__nsh_hv74, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv74, "style", () => ({ color: colors().foreground }));
		const __nsh_hv75 = text("Материал окна");
		append(__nsh_hv74, __nsh_hv75);
		const __nsh_hv76 = element("view");
		prop(__nsh_hv76, "class", "flex-row flex-wrap items-center gap-2");
		insert(__nsh_hv76, () => (appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current().material, (next) => patch({ material: next }), colors(), canEdit())));
		append(__nsh_hv73, __nsh_hv74);
		append(__nsh_hv73, __nsh_hv76);
		append(__nsh_hv72, __nsh_hv73);
		const __nsh_hv77 = element("view");
		prop(__nsh_hv77, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv77, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv78 = element("view");
		prop(__nsh_hv78, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv79 = element("text");
		prop(__nsh_hv79, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv79, "style", () => ({ color: colors().foreground }));
		const __nsh_hv80 = text("Размер интерфейсного текста");
		append(__nsh_hv79, __nsh_hv80);
		append(__nsh_hv78, __nsh_hv79);
		insert(__nsh_hv78, () => select("fontSize", String(current().font_size), [.../* @__PURE__ */ new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({
			value: String(size),
			label: `${size} px`
		})), (value) => patch({ font_size: Number(value) }), 128));
		append(__nsh_hv77, __nsh_hv78);
		append(__nsh_hv64, __nsh_hv65);
		append(__nsh_hv64, __nsh_hv71);
		append(__nsh_hv64, __nsh_hv72);
		append(__nsh_hv64, __nsh_hv77);
		insert(__nsh_hv64, [
			() => appearance()?.policy.following && (() => {
				const __nsh_hv67 = element("text");
				prop(__nsh_hv67, "class", "mb-4 px-2 text-[12px]");
				bindProp(__nsh_hv67, "style", () => ({ color: colors().accent }));
				const __nsh_hv68 = text("Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.");
				append(__nsh_hv67, __nsh_hv68);
				return __nsh_hv67;
			})(),
			() => !props.editable() && !appearance()?.policy.following && (() => {
				const __nsh_hv69 = element("text");
				prop(__nsh_hv69, "class", "mb-4 px-2 text-[12px]");
				bindProp(__nsh_hv69, "style", () => ({ color: colors().muted }));
				const __nsh_hv70 = text("Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.");
				append(__nsh_hv69, __nsh_hv70);
				return __nsh_hv69;
			})(),
			() => heading("Режим")
		], __nsh_hv71);
		insert(__nsh_hv64, () => heading("Стекло"), __nsh_hv72);
		insert(__nsh_hv64, () => heading("Размер текста"), __nsh_hv77);
		insert(__nsh_hv64, [() => !props.mobile && heading("Горячие клавиши"), () => !props.mobile && (() => {
			const __nsh_hv81 = element("view");
			prop(__nsh_hv81, "class", "rounded-xl border px-4");
			bindProp(__nsh_hv81, "style", () => ({
				backgroundColor: colors().card,
				borderColor: colors().border
			}));
			const __nsh_hv82 = element("view");
			prop(__nsh_hv82, "class", "h-10 flex-row items-center");
			const __nsh_hv83 = element("text");
			prop(__nsh_hv83, "class", "flex-1 text-[13px]");
			bindProp(__nsh_hv83, "style", () => ({ color: colors().foreground }));
			const __nsh_hv84 = text("Закрыть панель / поиск");
			append(__nsh_hv83, __nsh_hv84);
			const __nsh_hv85 = element("text");
			prop(__nsh_hv85, "class", "text-[12px]");
			bindProp(__nsh_hv85, "style", () => ({ color: colors().muted }));
			const __nsh_hv86 = text("Esc");
			append(__nsh_hv85, __nsh_hv86);
			append(__nsh_hv82, __nsh_hv83);
			append(__nsh_hv82, __nsh_hv85);
			append(__nsh_hv81, __nsh_hv82);
			insert(__nsh_hv81, [
				() => shortcutRow("sidebar", "Боковая панель — открыть/скрыть"),
				() => shortcutRow("create", "Новая задача — панель справа"),
				() => shortcutRow("search", "Быстрый поиск"),
				() => shortcutRow("reload", "Обновить данные из Engine")
			], __nsh_hv82);
			return __nsh_hv81;
		})()]);
		append(__nsh_hv63, __nsh_hv64);
		return __nsh_hv63;
	})();
}
function selectLabel(material, label, selected, onPress, colors, editable) {
	return (() => {
		const __nsh_hv87 = element("view");
		bindProp(__nsh_hv87, "onPress", () => editable ? () => onPress(material) : void 0);
		prop(__nsh_hv87, "role", "button");
		prop(__nsh_hv87, "accessibilityState", {
			selected: selected === material,
			disabled: !editable
		});
		prop(__nsh_hv87, "class", "rounded-lg border px-3 py-2");
		bindProp(__nsh_hv87, "style", () => ({
			backgroundColor: selected === material ? colors.card : colors.background,
			borderColor: selected === material ? colors.accent : colors.border,
			opacity: editable ? 1 : .65
		}));
		const __nsh_hv88 = element("text");
		prop(__nsh_hv88, "class", "text-[12px]");
		bindProp(__nsh_hv88, "style", () => ({ color: selected === material ? colors.foreground : colors.muted }));
		insert(__nsh_hv88, label);
		append(__nsh_hv87, __nsh_hv88);
		return __nsh_hv87;
	})();
}

//#endregion
//#region preview.ts
const PREVIEW_STORAGE_KEY = "mundus.atlas.preview.v1";
function persistPreview(store) {
	Storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(store));
}
function loadPreview() {
	return Storage.getItem(PREVIEW_STORAGE_KEY).then((value) => {
		if (!value) return null;
		try {
			const parsed = JSON.parse(value);
			return isPreviewStore(parsed) ? parsed : null;
		} catch {
			return null;
		}
	});
}
function isPreviewStore(value) {
	if (typeof value !== "object" || value === null) return false;
	if (!("journalEntries" in value) || !Array.isArray(value.journalEntries)) return false;
	if (!("todos" in value) || !Array.isArray(value.todos)) return false;
	return value.journalEntries.every(isJournalEntry) && value.todos.every(isTodo);
}
function isJournalEntry(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "text" in value && typeof value.text === "string" && "createdAt" in value && typeof value.createdAt === "string";
}
function isTodo(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "title" in value && typeof value.title === "string" && "is_completed" in value && typeof value.is_completed === "boolean";
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
//#region ConnectionPage.tsx
const ticketVisible = signal(false);
const selectedPeer = signal(null);
function peerStatus(status) {
	return status === "online" ? "В сети" : status === "offline" ? "Не в сети" : "Статус неизвестен";
}
function deviceName(peer) {
	return peer.device_name?.trim() || "Устройство";
}
function ConnectionPage(props) {
	const c = () => props.colors;
	const sync = () => props.sync;
	const incoming = () => sync()?.incoming_pairing_requests[0];
	const onlineCount = () => sync()?.peers.filter((peer) => peer.status === "online").length ?? 0;
	const statusText = () => !sync() ? "Проверяем подключение…" : onlineCount() ? `В сети: ${onlineCount()}` : sync().running ? "Ожидает подключения устройства" : "Синхронизация остановлена";
	const statusColor = () => onlineCount() ? "#22c55e" : sync()?.running ? "#eab308" : "#ef4444";
	const button = (label, onPress, primary = false, destructive = false) => (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "onPress", onPress);
		prop(__nsh_hv0, "role", "button");
		prop(__nsh_hv0, "class", "min-h-11 items-center justify-center rounded-lg border px-4 py-2");
		bindProp(__nsh_hv0, "style", () => ({
			backgroundColor: primary ? c().accent : c().card,
			borderColor: destructive ? "#ef4444" : primary ? c().accent : c().border
		}));
		const __nsh_hv1 = element("text");
		prop(__nsh_hv1, "class", "text-[14px] font-medium");
		bindProp(__nsh_hv1, "style", () => ({ color: primary ? c().background : destructive ? "#ef4444" : c().foreground }));
		insert(__nsh_hv1, label);
		append(__nsh_hv0, __nsh_hv1);
		return __nsh_hv0;
	})();
	const group = (children) => (() => {
		const __nsh_hv2 = element("view");
		prop(__nsh_hv2, "class", "mb-5 rounded-xl border px-4 py-1");
		bindProp(__nsh_hv2, "style", () => ({
			backgroundColor: c().card,
			borderColor: c().border
		}));
		insert(__nsh_hv2, children);
		return __nsh_hv2;
	})();
	return (() => {
		const __nsh_hv3 = element("view");
		prop(__nsh_hv3, "class", "h-full min-h-0 flex-col");
		bindProp(__nsh_hv3, "style", () => ({ backgroundColor: c().background }));
		const __nsh_hv4 = element("view");
		prop(__nsh_hv4, "class", "h-14 shrink-0 flex-row items-center gap-2 px-3");
		const __nsh_hv5 = element("view");
		bindProp(__nsh_hv5, "onPress", () => props.onBack);
		prop(__nsh_hv5, "role", "button");
		prop(__nsh_hv5, "accessibilityLabel", "Назад");
		prop(__nsh_hv5, "class", "h-10 w-10 items-center justify-center rounded-full border");
		bindProp(__nsh_hv5, "style", () => ({
			borderColor: c().border,
			backgroundColor: c().card
		}));
		const __nsh_hv6 = element("text");
		prop(__nsh_hv6, "class", "text-[25px]");
		bindProp(__nsh_hv6, "style", () => ({ color: c().foreground }));
		const __nsh_hv7 = text("‹");
		append(__nsh_hv6, __nsh_hv7);
		append(__nsh_hv5, __nsh_hv6);
		const __nsh_hv8 = element("text");
		prop(__nsh_hv8, "class", "text-[16px] font-medium");
		bindProp(__nsh_hv8, "style", () => ({ color: c().foreground }));
		const __nsh_hv9 = text("Подключения");
		append(__nsh_hv8, __nsh_hv9);
		append(__nsh_hv4, __nsh_hv5);
		append(__nsh_hv4, __nsh_hv8);
		const __nsh_hv10 = element("scroll");
		prop(__nsh_hv10, "class", "min-h-0 flex-1 px-4 pb-8");
		const __nsh_hv11 = element("text");
		prop(__nsh_hv11, "class", "mb-2 px-1 text-[13px]");
		bindProp(__nsh_hv11, "style", () => ({ color: c().muted }));
		const __nsh_hv12 = text("Это устройство");
		append(__nsh_hv11, __nsh_hv12);
		const __nsh_hv20 = element("text");
		prop(__nsh_hv20, "class", "mb-2 px-1 text-[13px]");
		bindProp(__nsh_hv20, "style", () => ({ color: c().muted }));
		const __nsh_hv21 = text("Устройства");
		append(__nsh_hv20, __nsh_hv21);
		const __nsh_hv39 = element("text");
		prop(__nsh_hv39, "class", "mb-2 px-1 text-[13px]");
		bindProp(__nsh_hv39, "style", () => ({ color: c().muted }));
		const __nsh_hv40 = text("Подключить устройство");
		append(__nsh_hv39, __nsh_hv40);
		append(__nsh_hv10, __nsh_hv11);
		append(__nsh_hv10, __nsh_hv20);
		append(__nsh_hv10, __nsh_hv39);
		insert(__nsh_hv10, () => group((() => {
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "class", "min-h-[62px] flex-row items-center gap-3");
			const __nsh_hv14 = element("view");
			prop(__nsh_hv14, "class", "h-2.5 w-2.5 rounded-full");
			bindProp(__nsh_hv14, "style", () => ({ backgroundColor: statusColor() }));
			const __nsh_hv15 = element("view");
			prop(__nsh_hv15, "class", "min-w-0 flex-1");
			const __nsh_hv16 = element("text");
			prop(__nsh_hv16, "class", "text-[15px]");
			bindProp(__nsh_hv16, "style", () => ({ color: c().foreground }));
			insert(__nsh_hv16, () => sync()?.local_device?.device_name || "Это устройство");
			const __nsh_hv17 = element("text");
			prop(__nsh_hv17, "class", "mt-0.5 text-[12px]");
			bindProp(__nsh_hv17, "style", () => ({ color: c().muted }));
			insert(__nsh_hv17, () => statusText());
			append(__nsh_hv15, __nsh_hv16);
			append(__nsh_hv15, __nsh_hv17);
			const __nsh_hv18 = element("text");
			prop(__nsh_hv18, "class", "text-[11px]");
			bindProp(__nsh_hv18, "style", () => ({ color: c().muted }));
			const __nsh_hv19 = text("Atlas ");
			append(__nsh_hv18, __nsh_hv19);
			insert(__nsh_hv18, () => props.version);
			append(__nsh_hv13, __nsh_hv14);
			append(__nsh_hv13, __nsh_hv15);
			append(__nsh_hv13, __nsh_hv18);
			return __nsh_hv13;
		})()), __nsh_hv20);
		insert(__nsh_hv10, [() => group(sync()?.peers.length ? sync().peers.map((peer, index) => (() => {
			const __nsh_hv22 = element("view");
			prop(__nsh_hv22, "class", `min-h-[58px] flex-row items-center gap-3 ${index ? "border-t" : ""}`);
			bindProp(__nsh_hv22, "style", () => ({ borderColor: c().border }));
			const __nsh_hv23 = element("view");
			prop(__nsh_hv23, "class", "h-8 w-8 items-center justify-center rounded-full");
			bindProp(__nsh_hv23, "style", () => ({ backgroundColor: c().background }));
			const __nsh_hv24 = element("text");
			prop(__nsh_hv24, "class", "text-[15px]");
			bindProp(__nsh_hv24, "style", () => ({ color: c().accent }));
			insert(__nsh_hv24, () => (deviceName(peer)[0] ?? "У").toUpperCase());
			append(__nsh_hv23, __nsh_hv24);
			const __nsh_hv25 = element("view");
			prop(__nsh_hv25, "class", "min-w-0 flex-1");
			const __nsh_hv26 = element("text");
			prop(__nsh_hv26, "numberOfLines", 1);
			prop(__nsh_hv26, "class", "text-[14px]");
			bindProp(__nsh_hv26, "style", () => ({ color: c().foreground }));
			insert(__nsh_hv26, () => deviceName(peer));
			const __nsh_hv27 = element("text");
			prop(__nsh_hv27, "class", "text-[12px]");
			bindProp(__nsh_hv27, "style", () => ({ color: peer.status === "online" ? "#22c55e" : c().muted }));
			insert(__nsh_hv27, () => peerStatus(peer.status));
			append(__nsh_hv25, __nsh_hv26);
			append(__nsh_hv25, __nsh_hv27);
			const __nsh_hv28 = element("view");
			prop(__nsh_hv28, "onPress", () => selectedPeer.set(peer));
			prop(__nsh_hv28, "role", "button");
			bindProp(__nsh_hv28, "accessibilityLabel", () => `Настройки устройства ${deviceName(peer)}`);
			prop(__nsh_hv28, "class", "px-2 py-2");
			const __nsh_hv29 = element("text");
			prop(__nsh_hv29, "class", "text-[20px]");
			bindProp(__nsh_hv29, "style", () => ({ color: c().muted }));
			const __nsh_hv30 = text("⋯");
			append(__nsh_hv29, __nsh_hv30);
			append(__nsh_hv28, __nsh_hv29);
			append(__nsh_hv22, __nsh_hv23);
			append(__nsh_hv22, __nsh_hv25);
			append(__nsh_hv22, __nsh_hv28);
			return __nsh_hv22;
		})()) : (() => {
			const __nsh_hv31 = element("view");
			prop(__nsh_hv31, "class", "min-h-[54px] justify-center");
			const __nsh_hv32 = element("text");
			prop(__nsh_hv32, "class", "text-[13px]");
			bindProp(__nsh_hv32, "style", () => ({ color: c().muted }));
			const __nsh_hv33 = text("Другие устройства пока не подключены");
			append(__nsh_hv32, __nsh_hv33);
			append(__nsh_hv31, __nsh_hv32);
			return __nsh_hv31;
		})()), () => incoming() && group((() => {
			const __nsh_hv34 = element("view");
			prop(__nsh_hv34, "class", "py-3");
			const __nsh_hv35 = element("text");
			prop(__nsh_hv35, "class", "mb-1 text-[15px] font-medium");
			bindProp(__nsh_hv35, "style", () => ({ color: c().foreground }));
			insert(__nsh_hv35, () => incoming()?.device_name?.trim() || "Новое устройство");
			const __nsh_hv36 = element("text");
			prop(__nsh_hv36, "class", "mb-3 text-[12px]");
			bindProp(__nsh_hv36, "style", () => ({ color: c().muted }));
			const __nsh_hv37 = text("Запрашивает подключение к этому Atlas. После подтверждения устройства начнут синхронизироваться.");
			append(__nsh_hv36, __nsh_hv37);
			const __nsh_hv38 = element("view");
			prop(__nsh_hv38, "class", "flex-row justify-end gap-2");
			insert(__nsh_hv38, [() => button("Отклонить", () => props.onDecline(incoming().device_id)), () => button("Подключить", () => props.onAccept(incoming().device_id), true)]);
			append(__nsh_hv34, __nsh_hv35);
			append(__nsh_hv34, __nsh_hv36);
			append(__nsh_hv34, __nsh_hv38);
			return __nsh_hv34;
		})())], __nsh_hv39);
		insert(__nsh_hv10, [
			() => group((() => {
				const __nsh_hv41 = element("view");
				prop(__nsh_hv41, "class", "gap-3 py-3");
				const __nsh_hv42 = element("text");
				prop(__nsh_hv42, "class", "text-[12px] leading-5");
				bindProp(__nsh_hv42, "style", () => ({ color: c().muted }));
				const __nsh_hv43 = text("На втором устройстве откройте его код подключения и скопируйте его. Atlas прочитает код из буфера обмена.");
				append(__nsh_hv42, __nsh_hv43);
				append(__nsh_hv41, __nsh_hv42);
				insert(__nsh_hv41, [
					() => button("Вставить код из буфера", props.onConnectClipboard, true),
					() => button(ticketVisible() ? "Обновить мой код" : "Показать мой код", () => {
						ticketVisible.set(true);
						props.onShowCode();
					}),
					() => sync()?.own_iroh_ticket && (() => {
						const __nsh_hv44 = element("view");
						prop(__nsh_hv44, "class", "rounded-lg border p-3");
						bindProp(__nsh_hv44, "style", () => ({
							backgroundColor: c().background,
							borderColor: c().border
						}));
						const __nsh_hv45 = element("text");
						prop(__nsh_hv45, "class", "mb-2 text-[12px] leading-5");
						bindProp(__nsh_hv45, "style", () => ({ color: c().foreground }));
						insert(__nsh_hv45, () => sync()?.own_iroh_ticket);
						append(__nsh_hv44, __nsh_hv45);
						insert(__nsh_hv44, () => button("Скопировать мой код", () => props.onCopy(sync().own_iroh_ticket)));
						return __nsh_hv44;
					})()
				]);
				return __nsh_hv41;
			})()),
			() => sync()?.outgoing_pairing && (() => {
				const __nsh_hv46 = element("view");
				prop(__nsh_hv46, "class", "mb-5 rounded-xl border p-4");
				bindProp(__nsh_hv46, "style", () => ({
					backgroundColor: c().card,
					borderColor: c().border
				}));
				const __nsh_hv47 = element("text");
				prop(__nsh_hv47, "class", "mb-3 text-[14px]");
				bindProp(__nsh_hv47, "style", () => ({ color: c().foreground }));
				insert(__nsh_hv47, () => sync()?.outgoing_pairing?.status === "pending" ? "Ожидание подтверждения…" : sync()?.outgoing_pairing?.status === "connected" ? "Подключено" : "Запрос на подключение");
				append(__nsh_hv46, __nsh_hv47);
				insert(__nsh_hv46, () => sync()?.outgoing_pairing?.status === "pending" && button("Отменить запрос", props.onCancelPairing));
				return __nsh_hv46;
			})(),
			() => sync()?.error && (() => {
				const __nsh_hv48 = element("text");
				prop(__nsh_hv48, "class", "mb-3 px-1 text-[13px]");
				prop(__nsh_hv48, "style", { color: "#ef4444" });
				insert(__nsh_hv48, () => sync()?.error);
				return __nsh_hv48;
			})(),
			() => button("Синхронизировать сейчас", props.onRestart, true)
		]);
		append(__nsh_hv3, __nsh_hv4);
		append(__nsh_hv3, __nsh_hv10);
		insert(__nsh_hv3, () => selectedPeer() && (() => {
			const __nsh_hv49 = element("view");
			prop(__nsh_hv49, "class", "absolute inset-0 z-40 justify-end");
			prop(__nsh_hv49, "style", { backgroundColor: "#00000066" });
			const __nsh_hv50 = element("view");
			prop(__nsh_hv50, "onPress", () => selectedPeer.set(null));
			prop(__nsh_hv50, "class", "absolute inset-0");
			prop(__nsh_hv50, "accessibilityLabel", "Закрыть сведения об устройстве");
			const __nsh_hv51 = element("view");
			prop(__nsh_hv51, "class", "w-full rounded-t-[24px] border px-5 pt-5 pb-8");
			bindProp(__nsh_hv51, "style", () => ({
				backgroundColor: c().card,
				borderColor: c().border
			}));
			const __nsh_hv52 = element("text");
			prop(__nsh_hv52, "class", "mb-1 text-[17px] font-medium");
			bindProp(__nsh_hv52, "style", () => ({ color: c().foreground }));
			insert(__nsh_hv52, () => deviceName(selectedPeer()));
			const __nsh_hv53 = element("text");
			prop(__nsh_hv53, "class", "mb-5 text-[13px]");
			bindProp(__nsh_hv53, "style", () => ({ color: c().muted }));
			const __nsh_hv54 = text(" · ");
			append(__nsh_hv53, __nsh_hv54);
			insert(__nsh_hv53, () => peerStatus(selectedPeer()?.status), __nsh_hv54);
			insert(__nsh_hv53, () => selectedPeer()?.platform || "Платформа неизвестна");
			const __nsh_hv55 = element("view");
			prop(__nsh_hv55, "class", "h-2");
			append(__nsh_hv51, __nsh_hv52);
			append(__nsh_hv51, __nsh_hv53);
			append(__nsh_hv51, __nsh_hv55);
			insert(__nsh_hv51, () => button("Отключить устройство", () => {
				const peer = selectedPeer();
				selectedPeer.set(null);
				if (peer) props.onDisconnect(peer.device_id);
			}, false, true), __nsh_hv55);
			insert(__nsh_hv51, () => button("Закрыть", () => selectedPeer.set(null)));
			append(__nsh_hv49, __nsh_hv50);
			append(__nsh_hv49, __nsh_hv51);
			return __nsh_hv49;
		})());
		return __nsh_hv3;
	})();
}

//#endregion
//#region ../assets/fonts/Inter.ttf
var Inter_default = font("asset://Users/user/Documents/projects/mundus-rs/atlas-unified/assets/fonts/Inter.ttf", "Inter");

//#endregion
//#region App.tsx
setup(null, "{\n  \"cssVars\": {\n    \"theme\": {\n      \"font-sans\": \"Inter, sans-serif\",\n      \"radius\": \"0.625rem\",\n      \"radius-control\": \"0.5rem\",\n      \"spacing-sidebar\": \"240px\",\n      \"spacing-titlebar\": \"40px\",\n      \"spacing-row\": \"32px\",\n      \"font-size-body\": \"13px\",\n      \"font-size-label\": \"12px\"\n    },\n    \"light\": {\n      \"background\": \"#faf9fb\",\n      \"foreground\": \"#26242a\",\n      \"card\": \"#f2f0f4\",\n      \"card-foreground\": \"#26242a\",\n      \"muted\": \"#ece9ef\",\n      \"muted-foreground\": \"#77727e\",\n      \"primary\": \"#7152bf\",\n      \"primary-foreground\": \"#ffffff\",\n      \"border\": \"#dedbe2\",\n      \"input\": \"#dedbe2\",\n      \"ring\": \"#b18aff\"\n    },\n    \"dark\": {\n      \"background\": \"#0d0c10\",\n      \"foreground\": \"#e7e5ea\",\n      \"card\": \"#131216\",\n      \"card-foreground\": \"#e7e5ea\",\n      \"muted\": \"#27262a\",\n      \"muted-foreground\": \"#8d8a94\",\n      \"primary\": \"#af94f9\",\n      \"primary-foreground\": \"#0d0c10\",\n      \"border\": \"#27262a\",\n      \"input\": \"#27262a\",\n      \"ring\": \"#af94f9\"\n    }\n  }\n}\n", null, null);
const initialValue = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__");
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
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
		const mobileSettings = {
			...saved,
			light_theme: "default",
			dark_theme: "default"
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
				colors: resolveAppearanceColors(appearance, mobileThemes, current.colors)
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
if (!hosted) loadPreview().then((saved) => {
	if (!saved) return;
	snapshot.set({
		...snapshot(),
		journalEntries: saved.journalEntries,
		todos: saved.todos
	});
});
function persistPreviewSnapshot() {
	if (hosted) return;
	persistPreview({
		journalEntries: snapshot().journalEntries,
		todos: snapshot().todos
	});
}
const Bridge = nativeComponent("atlas.bridge", {
	props: ["route", "canHandleBack"],
	events: [
		"state",
		"navigate",
		"journal",
		"connection",
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
function TaskRows() {
	return each(() => snapshot().todos, (todo) => (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "flex-row items-center border-b px-3");
		bindProp(__nsh_hv0, "style", () => ({
			height: 37 * (snapshot().appearance?.settings.font_size ?? 13) / 13,
			borderColor: snapshot().colors.border
		}));
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "onPress", () => completeTodo(todo().id));
		prop(__nsh_hv1, "role", "checkbox");
		bindProp(__nsh_hv1, "accessibilityLabel", () => todo().title);
		bindProp(__nsh_hv1, "accessibilityState", () => ({ checked: todo().is_completed }));
		prop(__nsh_hv1, "class", "mr-3 h-[14px] w-[14px] items-center justify-center rounded-full border");
		bindProp(__nsh_hv1, "style", () => ({
			borderColor: todo().is_completed ? snapshot().colors.accent : snapshot().colors.muted,
			backgroundColor: todo().is_completed ? snapshot().colors.accent : "transparent"
		}));
		insert(__nsh_hv1, () => todo().is_completed && component(Icon, {
			name: "check",
			size: 10,
			get color() {
				return snapshot().colors.background;
			}
		}));
		const __nsh_hv2 = element("text");
		bindProp(__nsh_hv2, "class", () => todo().is_completed ? "line-through" : "");
		bindProp(__nsh_hv2, "style", () => ({
			fontSize: snapshot().appearance?.settings.font_size ?? 13,
			color: todo().is_completed ? snapshot().colors.muted : snapshot().colors.foreground
		}));
		insert(__nsh_hv2, () => todo().title);
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv2);
		return __nsh_hv0;
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
		const __nsh_hv3 = element("scroll");
		prop(__nsh_hv3, "class", "min-h-0 flex-1 px-7 pb-5");
		prop(__nsh_hv3, "style", { paddingTop: 38 + 20 });
		const __nsh_hv4 = element("view");
		prop(__nsh_hv4, "class", "mx-auto w-full max-w-[640px]");
		insert(__nsh_hv4, () => snapshot().todos.length === 0 ? (() => {
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "class", "items-center py-12");
			const __nsh_hv6 = element("text");
			prop(__nsh_hv6, "class", "text-[13px]");
			bindProp(__nsh_hv6, "style", () => ({ color: snapshot().colors.muted }));
			const __nsh_hv7 = text("Задач пока нет");
			append(__nsh_hv6, __nsh_hv7);
			append(__nsh_hv5, __nsh_hv6);
			return __nsh_hv5;
		})() : component(TaskRows, {}));
		append(__nsh_hv3, __nsh_hv4);
		return __nsh_hv3;
	})();
}
function toggleSidebar() {
	const open = !sidebarVisible();
	sidebarVisible.set(open);
	animateSidebar(open);
	askEngine("toggle-sidebar");
}
function askEngine(name, args) {
	try {
		commandRef?.(name, args);
	} catch {}
}
function createJournal(text, id) {
	askEngine("journal.create", { text });
	snapshot.set({
		...snapshot(),
		journalEntries: [...snapshot().journalEntries, {
			id,
			text,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}]
	});
	persistPreviewSnapshot();
}
function updateJournal(id, text) {
	askEngine("journal.update", {
		id,
		text
	});
	snapshot.set({
		...snapshot(),
		journalEntries: snapshot().journalEntries.map((entry) => entry.id === id ? {
			...entry,
			text
		} : entry)
	});
	persistPreviewSnapshot();
}
function deleteJournal(id) {
	askEngine("journal.delete", { id });
	snapshot.set({
		...snapshot(),
		journalEntries: snapshot().journalEntries.filter((entry) => entry.id !== id)
	});
	persistPreviewSnapshot();
}
function createTodo(title) {
	const value = title.trim();
	if (!value) return;
	askEngine("create", { title: value });
	snapshot.set({
		...snapshot(),
		todos: [...snapshot().todos, {
			id: `local-${Date.now()}`,
			title: value,
			is_completed: false
		}]
	});
	persistPreviewSnapshot();
}
function completeTodo(id) {
	askEngine("complete", { id });
	snapshot.set({
		...snapshot(),
		todos: snapshot().todos.map((todo) => todo.id === id ? {
			...todo,
			is_completed: true
		} : todo)
	});
	persistPreviewSnapshot();
}
effect(() => {
	const active = shortcuts();
	const unbind = [
		keymap.bind(active.sidebar, () => toggleSidebar(), { repeat: true }),
		keymap.bind(active.create, () => {
			newTaskTitle.set("");
			addTaskOpen.set(true);
		}, { when: "notEditing" }),
		keymap.bind(active.reload, () => commandRef?.("reload"), { when: "notEditing" })
	];
	return () => unbind.forEach((remove) => remove());
});
function SettingsPage(props = {}) {
	return component(AtlasAppearanceSettings, {
		appearance: () => snapshot().appearance,
		editable: () => snapshot().appearanceEditable,
		get themes() {
			return snapshot().chrome === "mobile" ? mobileThemes : snapshot().themes;
		},
		colors: () => snapshot().colors,
		get shortcuts() {
			return shortcuts();
		},
		onPatch: setAppearance,
		onChangeShortcut: cycleShortcut,
		get connection() {
			return snapshot().connection;
		},
		get onConnections() {
			return props.onConnections;
		},
		get mobile() {
			return snapshot().chrome === "mobile";
		}
	});
}
function App() {
	effect(() => {
		if (snapshot().chrome === "tsx") Window.setTitleBar("hidden", 38);
	});
	const primaryNavigation = navigation_default.filter((item) => !item.footer);
	const footerNavigation = navigation_default.filter((item) => item.footer);
	const openNewTask = () => {
		newTaskTitle.set("");
		addTaskOpen.set(true);
	};
	const shell = snapshot().chrome === "tsx";
	const dark = snapshot().appearance?.settings.mode !== "light";
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
		if (target !== "journal" && journalCalendarOpen$1()) toggleJournalCalendar$1();
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
		const __nsh_hv8 = element("view");
		prop(__nsh_hv8, "class", "relative h-full w-full");
		bindProp(__nsh_hv8, "style", () => ({ backgroundColor: snapshot().colors.background }));
		const __nsh_hv9 = element("view");
		bindProp(__nsh_hv9, "class", () => `h-full w-full ${snapshot().chrome === "mobile" ? "flex-col" : "flex-row"}`);
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "class", "relative min-h-0 min-w-0 flex-1");
		insert(__nsh_hv14, [
			() => route() === "journal" && snapshot().chrome !== "mobile" && component(JournalPage, {
				entries: () => snapshot().journalEntries,
				get colors() {
					return snapshot().colors;
				},
				onCreate: createJournal,
				onUpdate: updateJournal,
				onDelete: deleteJournal,
				get nativeCalendarButton() {
					return snapshot().chrome === "native";
				},
				titlebarInset: shell ? 38 : 0,
				dark
			}),
			() => snapshot().chrome === "mobile" && route() === "journal" && (() => {
				const __nsh_hv15 = element("view");
				prop(__nsh_hv15, "class", "relative h-full min-h-0 flex-col overflow-hidden");
				bindProp(__nsh_hv15, "style", () => ({
					backgroundColor: snapshot().colors.background,
					opacity: transition.kind === "enter" ? transition.phase === "moving" ? 1 : 0 : transition.kind === "exit" ? 0 : 1,
					transitionProperty: "opacity",
					transitionDuration: 130 / 2,
					transitionTimingFunction: "ease-in-out"
				}));
				insert(__nsh_hv15, [() => !mobileJournalEditorOpen() && (() => {
					const __nsh_hv16 = element("view");
					prop(__nsh_hv16, "class", "h-14 flex-row items-center gap-2 px-3");
					const __nsh_hv17 = element("view");
					prop(__nsh_hv17, "onPress", goBack);
					prop(__nsh_hv17, "role", "button");
					prop(__nsh_hv17, "accessibilityLabel", "Назад");
					prop(__nsh_hv17, "class", "h-10 w-10 items-center justify-center rounded-full border");
					bindProp(__nsh_hv17, "style", () => ({
						borderColor: snapshot().colors.border,
						backgroundColor: snapshot().colors.card
					}));
					const __nsh_hv18 = element("text");
					prop(__nsh_hv18, "class", "text-[25px]");
					bindProp(__nsh_hv18, "style", () => ({ color: snapshot().colors.foreground }));
					const __nsh_hv19 = text("‹");
					append(__nsh_hv18, __nsh_hv19);
					append(__nsh_hv17, __nsh_hv18);
					const __nsh_hv20 = element("view");
					prop(__nsh_hv20, "class", "h-10 min-w-0 flex-1 items-center justify-center rounded-full border px-4");
					bindProp(__nsh_hv20, "style", () => ({
						borderColor: snapshot().colors.border,
						backgroundColor: snapshot().colors.card
					}));
					const __nsh_hv21 = element("text");
					prop(__nsh_hv21, "numberOfLines", 1);
					prop(__nsh_hv21, "ellipsizeMode", "tail");
					prop(__nsh_hv21, "class", "min-w-0 text-center text-[16px] font-normal");
					bindProp(__nsh_hv21, "style", () => ({
						color: snapshot().colors.foreground,
						fontFamily: Inter_default
					}));
					const __nsh_hv22 = text("Дневник");
					append(__nsh_hv21, __nsh_hv22);
					append(__nsh_hv20, __nsh_hv21);
					append(__nsh_hv16, __nsh_hv17);
					append(__nsh_hv16, __nsh_hv20);
					return __nsh_hv16;
				})(), component(MobileJournalPage, {
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
					onCopy: (text) => commandRef?.("clipboard.copy", { text }),
					nativeCalendarButton: false,
					mobile: true
				})]);
				return __nsh_hv15;
			})(),
			() => route() === "tasks" && (() => {
				const __nsh_hv23 = element("view");
				prop(__nsh_hv23, "class", "min-h-0 flex-1");
				insert(__nsh_hv23, [component(TaskPage, {}), () => shell && (() => {
					const __nsh_hv24 = element("view");
					prop(__nsh_hv24, "onPress", openNewTask);
					prop(__nsh_hv24, "role", "button");
					prop(__nsh_hv24, "accessibilityLabel", "Новая задача");
					prop(__nsh_hv24, "class", "absolute items-center justify-center rounded-full");
					prop(__nsh_hv24, "hoverStyle", { opacity: .85 });
					bindProp(__nsh_hv24, "style", () => ({
						right: 16,
						bottom: 16,
						width: 32,
						height: 32,
						backgroundColor: snapshot().colors.foreground,
						cursor: "pointer"
					}));
					insert(__nsh_hv24, component(Icon, {
						name: "plus",
						size: 16,
						get color() {
							return snapshot().colors.background;
						}
					}));
					return __nsh_hv24;
				})()]);
				return __nsh_hv23;
			})(),
			() => route() === "settings" && snapshot().chrome !== "mobile" && (() => {
				const __nsh_hv25 = element("view");
				prop(__nsh_hv25, "class", "min-h-0 flex-1");
				prop(__nsh_hv25, "style", { paddingTop: shell ? 38 : 0 });
				insert(__nsh_hv25, component(SettingsPage, {}));
				return __nsh_hv25;
			})(),
			() => snapshot().chrome === "mobile" && route() === "settings" && (() => {
				const __nsh_hv26 = element("view");
				prop(__nsh_hv26, "class", "h-full min-h-0 flex-col");
				bindProp(__nsh_hv26, "style", () => ({ backgroundColor: snapshot().colors.background }));
				const __nsh_hv27 = element("view");
				prop(__nsh_hv27, "class", "h-14 flex-row items-center px-3");
				const __nsh_hv28 = element("view");
				prop(__nsh_hv28, "onPress", goBack);
				prop(__nsh_hv28, "role", "button");
				prop(__nsh_hv28, "accessibilityLabel", "Назад");
				prop(__nsh_hv28, "class", "h-10 w-10 items-center justify-center rounded-full border");
				bindProp(__nsh_hv28, "style", () => ({
					borderColor: snapshot().colors.border,
					backgroundColor: snapshot().colors.card
				}));
				const __nsh_hv29 = element("text");
				prop(__nsh_hv29, "class", "text-[25px]");
				bindProp(__nsh_hv29, "style", () => ({ color: snapshot().colors.foreground }));
				const __nsh_hv30 = text("‹");
				append(__nsh_hv29, __nsh_hv30);
				append(__nsh_hv28, __nsh_hv29);
				append(__nsh_hv27, __nsh_hv28);
				append(__nsh_hv26, __nsh_hv27);
				insert(__nsh_hv26, component(SettingsPage, { onConnections: () => changeRoute("connection") }));
				return __nsh_hv26;
			})(),
			() => snapshot().chrome === "mobile" && route() === "connection" && component(ConnectionPage, {
				get colors() {
					return snapshot().colors;
				},
				get version() {
					return snapshot().version;
				},
				get sync() {
					return snapshot().connection;
				},
				onBack: goBack,
				onShowCode: () => commandRef?.("connection.show-code"),
				onCopy: (text) => commandRef?.("clipboard.copy", { text }),
				onConnectClipboard: () => commandRef?.("connection.connect-clipboard"),
				onRestart: () => commandRef?.("connection.restart"),
				onAccept: (deviceId) => commandRef?.("connection.accept", { device_id: deviceId }),
				onDecline: (deviceId) => commandRef?.("connection.decline", { device_id: deviceId }),
				onCancelPairing: () => commandRef?.("connection.cancel"),
				onDisconnect: (deviceId) => commandRef?.("connection.disconnect", { device_id: deviceId })
			}),
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
						const __nsh_hv31 = element("input");
						bindProp(__nsh_hv31, "value", () => newTaskTitle());
						prop(__nsh_hv31, "onChange", (value) => newTaskTitle.set(value));
						prop(__nsh_hv31, "onSubmit", (event) => {
							createTodo(event.text);
							addTaskOpen.set(false);
						});
						prop(__nsh_hv31, "placeholder", "Название задачи");
						prop(__nsh_hv31, "accessibilityLabel", "Название задачи");
						prop(__nsh_hv31, "class", "h-10 rounded-lg px-3 text-[13px]");
						bindProp(__nsh_hv31, "style", () => ({
							backgroundColor: snapshot().colors.background,
							color: snapshot().colors.foreground
						}));
						return __nsh_hv31;
					})(), (() => {
						const __nsh_hv32 = element("view");
						prop(__nsh_hv32, "class", "mt-3 flex-row justify-end");
						prop(__nsh_hv32, "style", { gap: 8 });
						insert(__nsh_hv32, [component(GhostButton, {
							label: "Отмена",
							get colors() {
								return snapshot().colors;
							},
							dark,
							onPress: () => addTaskOpen.set(false)
						}), component(SolidButton, {
							label: "Добавить",
							get background() {
								return snapshot().colors.accent;
							},
							get foreground() {
								return snapshot().colors.background;
							},
							onPress: () => {
								createTodo(newTaskTitle());
								addTaskOpen.set(false);
							}
						})]);
						return __nsh_hv32;
					})()];
				}
			})
		]);
		append(__nsh_hv9, __nsh_hv14);
		insert(__nsh_hv9, () => shell && (() => {
			const __nsh_hv10 = element("view");
			prop(__nsh_hv10, "class", "h-full shrink-0 overflow-hidden");
			bindProp(__nsh_hv10, "style", () => ({ width: sidebarPaneWidth() }));
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "class", "h-full border-r px-2");
			bindProp(__nsh_hv11, "style", () => ({
				width: 256,
				paddingTop: 38 + 4,
				backgroundColor: surfaceWash(dark),
				borderColor: snapshot().colors.border
			}));
			const __nsh_hv12 = element("view");
			prop(__nsh_hv12, "style", { gap: 2 });
			insert(__nsh_hv12, () => primaryNavigation.map((item) => component(SidebarRow, {
				get label() {
					return item.label;
				},
				get icon() {
					return iconForNavigation(item.id);
				},
				get selected() {
					return route() === item.id;
				},
				dark,
				get colors() {
					return snapshot().colors;
				},
				onPress: () => changeRoute(item.id)
			})));
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "class", "mt-auto mb-2");
			prop(__nsh_hv13, "style", { gap: 2 });
			insert(__nsh_hv13, () => footerNavigation.map((item) => component(SidebarRow, {
				get label() {
					return item.label;
				},
				get icon() {
					return iconForNavigation(item.id);
				},
				get selected() {
					return route() === item.id;
				},
				dark,
				get colors() {
					return snapshot().colors;
				},
				onPress: () => changeRoute(item.id)
			})));
			append(__nsh_hv11, __nsh_hv12);
			append(__nsh_hv11, __nsh_hv13);
			append(__nsh_hv10, __nsh_hv11);
			return __nsh_hv10;
		})(), __nsh_hv14);
		append(__nsh_hv8, __nsh_hv9);
		insert(__nsh_hv8, component(Bridge, {
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
				const appearance = next.appearance ?? snapshot().appearance;
				const themes = next.chrome === "mobile" ? mobileThemes : previewThemes;
				const mobileSettings = mobileAppearanceOverride();
				const mobileAppearance = next.chrome === "mobile" && mobileSettings && appearance ? {
					...appearance,
					settings: mobileSettings,
					policy: {
						...appearance.policy,
						following: false
					}
				} : appearance;
				const hydrated = {
					...next,
					themes,
					journalEntries: next.chrome === "mobile" ? next.journalEntries : snapshot().journalEntries,
					sidebarVisible: next.chrome === "mobile" ? next.sidebarVisible : sidebarVisible(),
					connection: next.connection ?? snapshot().connection,
					colors: mobileAppearance ? resolveAppearanceColors(mobileAppearance, themes, next.colors) : next.colors,
					...mobileAppearance ? { appearance: mobileAppearance } : {}
				};
				snapshot.set(hydrated);
				if (next.chrome === "mobile") commandRef?.("window.background", { color: hydrated.colors.background });
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
			onConnection: (connection) => snapshot.set({
				...snapshot(),
				connection
			}),
			onBack: goBack
		}), __nsh_hv9);
		insert(__nsh_hv8, () => shell && component(TitlebarOverlay, {
			get colors() {
				return snapshot().colors;
			},
			dark,
			get showCalendarToggle() {
				return route() === "journal";
			},
			get calendarOpen() {
				return journalCalendarOpen$1();
			},
			onToggleSidebar: toggleSidebar,
			onToggleCalendar: toggleJournalCalendar$1
		}));
		return __nsh_hv8;
	})();
}
mount(App);

//#endregion
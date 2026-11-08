import { append, bindProp, component, each, element, insert, prop, setup, spread, text } from "nsh:rt";
import { Clipboard, Easing, LayoutAnimation, PanResponder, Storage, createMotion, effect, host, keymap, mount, nativeComponent, signal } from "nsh";
import { Menu, Window, titleBar } from "nsh/desktop";
import { platform } from "os";
import { Popover } from "nsh/base";

//#region ../node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/icons.ts
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
//#region ../node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/components.tsx
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
		"id": "games",
		"label": "Игры",
		"icon": "folder",
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
	key: "cobalt-foundry",
	name: "Cobalt Foundry",
	light: colors("#f7f8fa", "#111820", "#5f6a7a", "#dde2ea", "#1f6df5", "#ffffff"),
	dark: colors("#090c15", "#ffffff", "#717580", "#1e222b", "#1784fc", "#101318")
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
			light_theme: "cobalt-foundry",
			dark_theme: "cobalt-foundry",
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
	chrome: "tsx"
};
function resolveAppearanceColors(appearance, themes, fallbackColors) {
	const settings = appearance.settings;
	const dark = settings.mode !== "light";
	const themeColors = (themes.find((item) => item.key === "cobalt-foundry") ?? themes[0])?.[dark ? "dark" : "light"] ?? fallbackColors;
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
	return "version" in value && typeof value.version === "string" && "appearanceEditable" in value && typeof value.appearanceEditable === "boolean" && "themes" in value && Array.isArray(value.themes) && "colors" in value && isColors(value.colors) && "sidebarVisible" in value && typeof value.sidebarVisible === "boolean" && "chrome" in value && (value.chrome === "native" || value.chrome === "tsx");
}
function isRoute(value) {
	return value === "journal" || value === "tasks" || value === "games" || value === "settings";
}
function isTodo$1(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "title" in value && typeof value.title === "string" && "is_completed" in value && typeof value.is_completed === "boolean";
}
function isJournalEntry$1(value) {
	return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" && "text" in value && typeof value.text === "string" && "createdAt" in value && typeof value.createdAt === "string" && (!("voice" in value) || value.voice === void 0 || isJournalVoice(value.voice));
}
function isJournalVoice(value) {
	return typeof value === "object" && value !== null && "durationMs" in value && typeof value.durationMs === "number" && "data" in value && typeof value.data === "string" && "peaks" in value && Array.isArray(value.peaks) && value.peaks.every((peak) => typeof peak === "number");
}
function isColors(value) {
	if (typeof value !== "object" || value === null) return false;
	return "background" in value && typeof value.background === "string" && "foreground" in value && typeof value.foreground === "string" && "muted" in value && typeof value.muted === "string" && "border" in value && typeof value.border === "string" && "accent" in value && typeof value.accent === "string" && "card" in value && typeof value.card === "string";
}

//#endregion
//#region app-shortcuts.ts
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

//#endregion
//#region icons.ts
const glyphs = {
	search: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M17%2017L21%2021%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M19%2011C19%206.58172%2015.4183%203%2011%203C6.58172%203%203%206.58172%203%2011C3%2015.4183%206.58172%2019%2011%2019C15.4183%2019%2019%2015.4183%2019%2011Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	folder: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M2.5%2020V8.87695C2.5%207.58945%202.5%206.9457%202.78533%206.47048C2.9541%206.18939%203.18939%205.9541%203.47048%205.78533C3.9457%205.5%204.59449%205.5%205.89206%205.5C6.52339%205.5%206.83906%205.5%207.12612%205.58819C7.31759%205.64702%207.49914%205.73428%207.66469%205.84705C7.91289%206.01611%208.10859%206.26074%208.5%206.75C8.89141%207.23926%209.08711%207.48389%209.33531%207.65295C9.50086%207.76572%209.68241%207.85298%209.87388%207.91181C10.1609%208%2010.4742%208%2011.1008%208H15C16.4045%208%2017.1067%208%2017.6111%208.33706C17.8295%208.48298%2018.017%208.67048%2018.1629%208.88886C18.5%209.39331%2018.5%2010.0955%2018.5%2011.5%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M4.42028%2014.0144L3.63368%2016.0144C2.65618%2018.4998%202.16743%2019.7425%202.7524%2020.6213C3.33737%2021.5%204.65337%2021.5%207.28537%2021.5H15.1903C16.4249%2021.5%2017.0422%2021.5%2017.5295%2021.1795C18.0169%2020.859%2018.2702%2020.2865%2018.7769%2019.1415L19.6618%2017.1415C20.7866%2014.5992%2021.349%2013.3281%2020.7679%2012.4141C20.1868%2011.5%2018.8163%2011.5%2016.0752%2011.5H8.07196C6.78232%2011.5%206.1375%2011.5%205.63811%2011.8439C5.13872%2012.1877%204.89924%2012.7966%204.42028%2014.0144Z%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M11.5%204.51456C12.4151%203.28409%2013.6662%202.55594%2015.5125%202.50161C16.1155%202.48386%2016.7152%202.61395%2017.2682%202.85544C18.5748%203.42601%2019.4185%204.15644%2020%205.5L21.5%203%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	file: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M14.4961%202.00027H9.49609C8.66767%202.00027%207.99609%202.67185%207.99609%203.50027C7.99609%204.3287%208.66767%205.00027%209.49609%205.00027H14.4961C15.3245%205.00027%2015.9961%204.3287%2015.9961%203.50027C15.9961%202.67185%2015.3245%202.00027%2014.4961%202.00027Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M7.99609%2015.0003H11.4247M7.99609%2011.0003H15.9961%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M15.9961%203.50027C17.5496%203.54709%2018.4761%203.72035%2019.1174%204.36164C19.9961%205.24032%2019.9961%206.65451%2019.9961%209.4829L19.9961%2015.9997C19.9961%2018.8282%2019.9961%2020.2424%2019.1174%2021.1211C18.2387%2021.9997%2016.8245%2021.9997%2013.9961%2021.9997L9.99609%2021.9997C7.16767%2021.9997%205.75346%2021.9997%204.87478%2021.1211C3.9961%2020.2424%203.9961%2018.8282%203.99609%2015.9998L3.99611%209.48296C3.9961%206.65453%203.9961%205.24031%204.87478%204.36163C5.51606%203.72034%206.44261%203.54708%207.99599%203.50027%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	check: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M5%2013.2592L7.58583%2015.9568C8.2525%2016.6523%208.58583%2017%209.00004%2017C9.41425%2017%209.74759%2016.6523%2010.4143%2015.9568L19%207%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E",
	close: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22m6%206%2012%2012M18%206%206%2018%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E%0A",
	gamepad: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7.1%207.5h9.8a4.5%204.5%200%200%201%204.4%203.5l1%204.7a2.6%202.6%200%200%201-4.4%202.4l-2-1.9H8.1l-2%201.9a2.6%202.6%200%200%201-4.4-2.4l1-4.7a4.5%204.5%200%200%201%204.4-3.5Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M7%2010.5v4m-2-2h4m7-.8h.01m2%202h.01%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E%0A"
};

//#endregion
//#region glyph.tsx
function Glyph(props) {
	return (() => {
		const __nsh_hv0 = element("image");
		bindProp(__nsh_hv0, "src", () => glyphs[props.name]);
		bindProp(__nsh_hv0, "style", () => ({
			width: props.size ?? 16,
			height: props.size ?? 16,
			tintColor: props.color
		}));
		return __nsh_hv0;
	})();
}

//#endregion
//#region chrome.tsx
const TITLEBAR_HEIGHT = 38;
const SIDEBAR_WIDTH = 282;
const ROW_HEIGHT = 32;
const NAV_ROW_HEIGHT = 40;
const CONTROL_RADIUS = 6;
const ROW_RADIUS = 8;
const NAV_ROW_RADIUS = 10;
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
const SIDEBAR_HIDE_MS = 150;
const SIDEBAR_OPEN_MS = 100;
const SIDEBAR_MOTION_MS = 150;
/** How long a toggle runs: hiding is slower than opening by design. */
function sidebarMotionMs(open) {
	return open ? 100 : 150;
}
const sidebarWidth = signal(282);
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
function sidebarWidthAt(from, to, elapsed, duration = 150) {
	const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
	return from + (to - from) * easeOut(t);
}
function sidebarFrame(now) {
	const tween = sidebarTween;
	if (!tween) return sidebarWidth();
	if (now - tween.started >= tween.duration) {
		sidebarTween = null;
		sidebarWidth.set(tween.to);
		return tween.to;
	}
	const value = sidebarWidthAt(tween.from, tween.to, now - tween.started, tween.duration);
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
	const to = open ? 282 : 0;
	const from = sidebarWidth();
	if (from === to) {
		sidebarTween = null;
		return;
	}
	sidebarTween = {
		from,
		to,
		started: now ?? Date.now(),
		duration: sidebarMotionMs(open)
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
/** The window shell: a step away from the page background, the sidebar's fill. */
function shellFill(colors, dark) {
	return mixHex(colors.background, dark ? "#ffffff" : "#000000", .03);
}
/** A raised surface: the selected sidebar row, a card above the page. */
function raisedFill(colors, dark) {
	return mixHex(colors.background, dark ? "#ffffff" : "#000000", dark ? .065 : .04);
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
function mixHex(from, to, t) {
	const fr = channel(from, 16);
	const fg = channel(from, 8);
	const fb = channel(from, 0);
	const tr = channel(to, 16);
	const tg = channel(to, 8);
	const tb = channel(to, 0);
	if (fr === null || fg === null || fb === null || tr === null || tg === null || tb === null) return from;
	const mix = (a, b) => Math.round(a + (b - a) * t).toString(16).padStart(2, "0");
	return `#${mix(fr, tr)}${mix(fg, tg)}${mix(fb, tb)}`;
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
	const addGameRight = calendarRight + (props.showCalendarToggle ? 34 : 0);
	const wash = hoverWash(props.dark);
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "absolute left-0 right-0 top-0 z-20");
		bindProp(__nsh_hv0, "style", () => ({ height: controls.height || 38 }));
		prop(__nsh_hv0, "desktop", { windowDrag: true });
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "absolute top-0 bottom-0");
		bindProp(__nsh_hv1, "style", () => ({
			left: props.pageInset ?? 0,
			right: 0,
			backgroundColor: props.colors.background,
			pointerEvents: "none"
		}));
		const __nsh_hv3 = element("view");
		bindProp(__nsh_hv3, "onPress", () => props.onToggleSidebar);
		prop(__nsh_hv3, "role", "button");
		prop(__nsh_hv3, "accessibilityLabel", "Боковая панель");
		prop(__nsh_hv3, "class", "absolute items-center justify-center");
		prop(__nsh_hv3, "desktop", { windowDrag: false });
		prop(__nsh_hv3, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv3, "style", () => ({
			top: titlebarControlTop(24),
			left: sidebarLeft,
			width: 24,
			height: 24,
			borderRadius: CONTROL_RADIUS,
			cursor: "pointer"
		}));
		insert(__nsh_hv3, component(Icon, {
			name: "sidebar",
			size: 16,
			get color() {
				return props.colors.muted;
			}
		}));
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv3);
		insert(__nsh_hv0, () => props.dimmed && (() => {
			const __nsh_hv2 = element("view");
			prop(__nsh_hv2, "class", "absolute top-0 bottom-0");
			bindProp(__nsh_hv2, "style", () => ({
				left: props.pageInset ?? 0,
				right: 0,
				backgroundColor: "#00000080",
				pointerEvents: "none"
			}));
			return __nsh_hv2;
		})(), __nsh_hv3);
		insert(__nsh_hv0, [
			() => props.showCalendarToggle && (() => {
				const __nsh_hv4 = element("view");
				bindProp(__nsh_hv4, "onPress", () => props.onToggleCalendar);
				prop(__nsh_hv4, "role", "button");
				bindProp(__nsh_hv4, "accessibilityLabel", () => props.calendarOpen ? "Скрыть календарь" : "Показать календарь");
				bindProp(__nsh_hv4, "accessibilityState", () => ({ selected: props.calendarOpen }));
				prop(__nsh_hv4, "class", "absolute items-center justify-center");
				prop(__nsh_hv4, "desktop", { windowDrag: false });
				bindProp(__nsh_hv4, "hoverStyle", () => ({ backgroundColor: surfaceWash(props.dark, .11) }));
				bindProp(__nsh_hv4, "style", () => ({
					top: titlebarControlTop(28),
					right: calendarRight,
					width: 28,
					height: 28,
					borderRadius: CONTROL_RADIUS,
					cursor: "pointer",
					backgroundColor: props.calendarOpen ? surfaceWash(props.dark, .09) : "transparent"
				}));
				insert(__nsh_hv4, component(Icon, {
					name: "sidebar",
					size: 16,
					get color() {
						return props.calendarOpen ? props.colors.foreground : props.colors.muted;
					}
				}));
				return __nsh_hv4;
			})(),
			() => props.showAddGame && (() => {
				const __nsh_hv5 = element("view");
				prop(__nsh_hv5, "onPress", () => props.onAddGame?.());
				prop(__nsh_hv5, "role", "button");
				prop(__nsh_hv5, "accessibilityLabel", "Добавить игру");
				prop(__nsh_hv5, "class", "absolute items-center justify-center");
				prop(__nsh_hv5, "desktop", { windowDrag: false });
				prop(__nsh_hv5, "hoverStyle", { backgroundColor: wash });
				bindProp(__nsh_hv5, "style", () => ({
					top: titlebarControlTop(28),
					right: addGameRight,
					width: 28,
					height: 28,
					borderRadius: CONTROL_RADIUS,
					cursor: "pointer"
				}));
				insert(__nsh_hv5, component(Icon, {
					name: "plus",
					size: 16,
					get color() {
						return props.colors.muted;
					}
				}));
				return __nsh_hv5;
			})(),
			() => drawCaptions && (() => {
				const __nsh_hv6 = element("view");
				prop(__nsh_hv6, "class", "absolute right-0 top-0 flex-row");
				prop(__nsh_hv6, "desktop", { windowDrag: false });
				prop(__nsh_hv6, "style", { height: 38 });
				const __nsh_hv7 = element("view");
				prop(__nsh_hv7, "onPress", () => props.onChrome("window.minimize"));
				prop(__nsh_hv7, "role", "button");
				prop(__nsh_hv7, "accessibilityLabel", "Свернуть окно");
				prop(__nsh_hv7, "class", "items-center justify-center");
				prop(__nsh_hv7, "desktop", { windowDrag: false });
				prop(__nsh_hv7, "hoverStyle", { backgroundColor: wash });
				prop(__nsh_hv7, "style", {
					width: CAPTION_BUTTON_WIDTH,
					height: 38,
					cursor: "pointer"
				});
				insert(__nsh_hv7, component(Icon, {
					name: "windowMin",
					get color() {
						return props.colors.foreground;
					},
					size: 12
				}));
				const __nsh_hv8 = element("view");
				prop(__nsh_hv8, "onPress", () => props.onChrome("window.zoom"));
				prop(__nsh_hv8, "role", "button");
				prop(__nsh_hv8, "accessibilityLabel", "Развернуть окно");
				prop(__nsh_hv8, "class", "items-center justify-center");
				prop(__nsh_hv8, "desktop", { windowDrag: false });
				prop(__nsh_hv8, "hoverStyle", { backgroundColor: wash });
				prop(__nsh_hv8, "style", {
					width: CAPTION_BUTTON_WIDTH,
					height: 38,
					cursor: "pointer"
				});
				insert(__nsh_hv8, component(Icon, {
					name: "windowMax",
					get color() {
						return props.colors.foreground;
					},
					size: 12
				}));
				const __nsh_hv9 = element("view");
				prop(__nsh_hv9, "onPress", () => props.onChrome("window.close"));
				prop(__nsh_hv9, "onMouseEnter", () => closeHovered.set(true));
				prop(__nsh_hv9, "onMouseLeave", () => closeHovered.set(false));
				prop(__nsh_hv9, "role", "button");
				prop(__nsh_hv9, "accessibilityLabel", "Закрыть окно");
				prop(__nsh_hv9, "class", "items-center justify-center");
				prop(__nsh_hv9, "desktop", { windowDrag: false });
				prop(__nsh_hv9, "hoverStyle", { backgroundColor: "#e81123" });
				prop(__nsh_hv9, "style", {
					width: CAPTION_BUTTON_WIDTH,
					height: 38,
					cursor: "pointer"
				});
				insert(__nsh_hv9, component(Icon, {
					name: "windowClose",
					get color() {
						return closeHovered() ? "#ffffff" : props.colors.foreground;
					},
					size: 12
				}));
				append(__nsh_hv6, __nsh_hv7);
				append(__nsh_hv6, __nsh_hv8);
				append(__nsh_hv6, __nsh_hv9);
				return __nsh_hv6;
			})()
		]);
		return __nsh_hv0;
	})();
}
function SidebarRow(props) {
	const wash = hoverWash(props.dark);
	return (() => {
		const __nsh_hv10 = element("view");
		bindProp(__nsh_hv10, "onPress", () => props.onPress);
		prop(__nsh_hv10, "role", "button");
		bindProp(__nsh_hv10, "accessibilityState", () => ({ selected: props.selected }));
		prop(__nsh_hv10, "desktop", { windowDrag: false });
		prop(__nsh_hv10, "class", "flex-row items-center");
		prop(__nsh_hv10, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv10, "style", () => ({
			height: 40,
			gap: 10,
			paddingLeft: 10,
			paddingRight: 10,
			borderRadius: NAV_ROW_RADIUS,
			backgroundColor: props.selected ? raisedFill(props.colors, props.dark) : "transparent",
			cursor: "pointer"
		}));
		const __nsh_hv11 = element("text");
		prop(__nsh_hv11, "class", "text-[14px]");
		bindProp(__nsh_hv11, "style", () => ({
			color: props.colors.foreground,
			fontWeight: 500,
			lineHeight: 20
		}));
		insert(__nsh_hv11, () => props.label);
		append(__nsh_hv10, __nsh_hv11);
		insert(__nsh_hv10, () => props.icon === "gamepad" ? component(Glyph, {
			name: "gamepad",
			size: 16,
			get color() {
				return props.colors.foreground;
			}
		}) : component(Icon, {
			get name() {
				return props.icon;
			},
			size: 16,
			get color() {
				return props.colors.foreground;
			}
		}), __nsh_hv11);
		return __nsh_hv10;
	})();
}
function GhostButton(props) {
	return (() => {
		const __nsh_hv12 = element("view");
		bindProp(__nsh_hv12, "onPress", () => props.onPress);
		prop(__nsh_hv12, "role", "button");
		bindProp(__nsh_hv12, "accessibilityLabel", () => props.label);
		prop(__nsh_hv12, "class", "items-center justify-center");
		bindProp(__nsh_hv12, "hoverStyle", () => ({ backgroundColor: props.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }));
		prop(__nsh_hv12, "style", {
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: ROW_RADIUS,
			cursor: "pointer"
		});
		const __nsh_hv13 = element("text");
		bindProp(__nsh_hv13, "class", () => `text-[13px] hover:text-[${props.colors.foreground}]`);
		bindProp(__nsh_hv13, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv13, () => props.label);
		append(__nsh_hv12, __nsh_hv13);
		return __nsh_hv12;
	})();
}
function SolidButton(props) {
	return (() => {
		const __nsh_hv14 = element("view");
		bindProp(__nsh_hv14, "onPress", () => props.onPress);
		prop(__nsh_hv14, "role", "button");
		bindProp(__nsh_hv14, "accessibilityLabel", () => props.label);
		prop(__nsh_hv14, "class", "items-center justify-center");
		prop(__nsh_hv14, "hoverStyle", { opacity: .9 });
		bindProp(__nsh_hv14, "style", () => ({
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: ROW_RADIUS,
			backgroundColor: props.background,
			cursor: "pointer"
		}));
		const __nsh_hv15 = element("text");
		prop(__nsh_hv15, "class", "text-[13px] font-medium");
		bindProp(__nsh_hv15, "style", () => ({ color: props.foreground }));
		insert(__nsh_hv15, () => props.label);
		append(__nsh_hv14, __nsh_hv15);
		return __nsh_hv14;
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
/** Hugeicons `mic-01`, drawn in `currentColor` so a tint applies. */
const DotScope = nativeComponent("atlas.scope", {
	props: [
		"level",
		"active",
		"done"
	],
	events: []
});
const MIC_ICON = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M12%202C10.3431%202%209%203.34315%209%205V12C9%2013.6569%2010.3431%2015%2012%2015C13.6569%2015%2015%2013.6569%2015%2012V5C15%203.34315%2013.6569%202%2012%202Z%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M19%2011V12C19%2015.866%2015.866%2019%2012%2019C8.13401%2019%205%2015.866%205%2012V11%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M12%2019V22%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E";
const COMPOSER_RADIUS = 50;
const COMPOSER_COMPACT_HEIGHT = 49;
/** The recording scope sits in its own compartment above the field. */
const SCOPE_HEIGHT = 64;
const SCOPE_RADIUS = 26;
const COMPOSER_SEND = 31;
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
const THREAD_WIDTH = 650;
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
const journalCalendarOpen = signal(false);
const NativeCalendarToggle = nativeComponent("atlas.journalCalendarToggle", {
	props: ["expanded", "label"],
	events: ["press"]
});
const journalCalendarWidth = signal(260);
const journalDraft = signal("");
const journalDraftContentHeight = signal(COMPOSER_LINE);
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
const editingJournalId = signal(null);
const editingJournalText = signal("");
const arrivingId = signal(null);
/**
* The recording compartment hands over to the message: the scope plays its
* "done" clear, the block fades, and only then does the field close the gap.
* A plain flag, not a signal, so the effect that drives this subscribes to
* the recording state alone and a fast second take can cancel the exit.
*/
const scopeShown = signal(false);
/** 0 while recording, 0..1 through the exit. */
const scopeExit = signal(0);
const SCOPE_EXIT_MS = 320;
/** Share of the exit spent fading; the height closes in the rest. */
const SCOPE_FADE_SHARE = .7;
let scopeMounted = false;
let scopeExitStep = null;
function stopScopeExit() {
	if (scopeExitStep) {
		clearTimeout(scopeExitStep);
		scopeExitStep = null;
	}
}
function runScopeExit() {
	stopScopeExit();
	const started = Date.now();
	const step = () => {
		const progress = Math.min(1, (Date.now() - started) / SCOPE_EXIT_MS);
		scopeExit.set(progress);
		if (progress < 1) {
			scopeExitStep = setTimeout(step, 16);
			return;
		}
		scopeExitStep = null;
		scopeMounted = false;
		scopeShown.set(false);
		scopeExit.set(0);
	};
	step();
}
function scopeOpacity() {
	const progress = scopeExit();
	if (progress === 0) return 1;
	return Math.max(0, 1 - progress / SCOPE_FADE_SHARE);
}
function scopeHeight() {
	const progress = scopeExit();
	if (progress <= SCOPE_FADE_SHARE) return SCOPE_HEIGHT;
	const closing = (progress - SCOPE_FADE_SHARE) / .30000000000000004;
	return SCOPE_HEIGHT * Math.max(0, 1 - closing);
}
function markJournalArriving(id) {
	arrivingId.set(id);
}
let sendSeq = 0;
let composerRef;
let editFocus;
function claimJournalComposer() {
	if (editingJournalId()) return;
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
	return Math.max(COMPOSER_LINE, journalDraftContentHeight());
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
	return journalDraftContentHeight() > 23;
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
/** 0:42, the way a voice message shows its length. */
function formatVoiceDuration(ms) {
	const total = Math.max(0, Math.round(ms / 1e3));
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
const VOICE_BAR_MIN = 3;
const VOICE_BAR_MAX = 20;
/**
* One recorded bar's height. Peaks arrive on the recorder's decibel scale
* (0..100), and the 0.55 curve lifts ordinary speech past the floor: a quiet
* word at 20 still draws half the range.
*/
function voiceBarHeight(peak) {
	const level = Math.pow(Math.max(0, Math.min(100, peak)) / 100, .55);
	return VOICE_BAR_MIN + Math.round(level * 17);
}
function VoiceBubble(props) {
	const voice = props.entry.voice;
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "flex-row items-center");
		prop(__nsh_hv0, "style", {
			gap: 10,
			height: 26
		});
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "onPress", () => props.onPlay(props.entry));
		prop(__nsh_hv1, "role", "button");
		bindProp(__nsh_hv1, "accessibilityLabel", () => props.playing ? "Остановить голосовую запись" : "Прослушать голосовую запись");
		bindProp(__nsh_hv1, "accessibilityState", () => ({ selected: props.playing }));
		prop(__nsh_hv1, "class", "shrink-0 items-center justify-center rounded-full");
		prop(__nsh_hv1, "hoverStyle", { opacity: .8 });
		prop(__nsh_hv1, "activeStyle", { opacity: .6 });
		bindProp(__nsh_hv1, "style", () => ({
			width: 24,
			height: 24,
			backgroundColor: colorAlpha("#ffffff", .24),
			cursor: "pointer"
		}));
		const __nsh_hv2 = element("text");
		prop(__nsh_hv2, "class", "text-[10px]");
		prop(__nsh_hv2, "style", { color: "#ffffff" });
		insert(__nsh_hv2, () => props.playing ? "■" : "▶");
		append(__nsh_hv1, __nsh_hv2);
		const __nsh_hv3 = element("view");
		prop(__nsh_hv3, "class", "flex-row items-center");
		prop(__nsh_hv3, "style", {
			gap: 2,
			height: VOICE_BAR_MAX
		});
		insert(__nsh_hv3, each(() => voice.peaks, (peak) => (() => {
			const __nsh_hv4 = element("view");
			bindProp(__nsh_hv4, "style", () => ({
				width: 2,
				borderRadius: 1,
				backgroundColor: colorAlpha("#ffffff", .78),
				height: voiceBarHeight(peak())
			}));
			return __nsh_hv4;
		})()));
		const __nsh_hv5 = element("text");
		prop(__nsh_hv5, "class", "text-[12px]");
		bindProp(__nsh_hv5, "style", () => ({
			color: colorAlpha("#ffffff", .82),
			fontVariantNumeric: "tabular-nums"
		}));
		insert(__nsh_hv5, () => formatVoiceDuration(voice.durationMs));
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv3);
		append(__nsh_hv0, __nsh_hv5);
		return __nsh_hv0;
	})();
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
		if (editingJournalId() === props.entry.id) return;
		Menu.popup([
			{
				label: "Копировать",
				onSelect: () => void Clipboard.writeText(props.entry.text)
			},
			{
				label: "Изменить",
				onSelect: () => {
					editingJournalId.set(props.entry.id);
					editingJournalText.set(props.entry.text);
				}
			},
			{
				label: "Удалить",
				onSelect: () => props.onDelete(props.entry.id)
			}
		], event.pagePosition);
	};
	return (() => {
		const __nsh_hv6 = element("view");
		prop(__nsh_hv6, "onMouseEnter", () => showJournalDate(props.entry.id));
		prop(__nsh_hv6, "onMouseLeave", () => hideJournalDate(props.entry.id));
		prop(__nsh_hv6, "class", "mb-1 w-full flex-row items-center justify-end");
		const __nsh_hv8 = element("view");
		prop(__nsh_hv8, "onContextMenu", openEntryMenu);
		prop(__nsh_hv8, "class", "max-w-[75%] px-3 py-2");
		bindProp(__nsh_hv8, "style", () => ({
			backgroundColor: editingJournalId() === props.entry.id ? props.colors.card : journalBubble(props.colors.accent),
			borderRadius: BUBBLE_RADIUS,
			transformOrigin: "bottom right",
			...sendMotion?.style ?? {}
		}));
		insert(__nsh_hv8, () => editingJournalId() === props.entry.id ? (() => {
			const __nsh_hv9 = element("view");
			const __nsh_hv10 = element("input");
			prop(__nsh_hv10, "ref", (node) => {
				editFocus = node;
			});
			prop(__nsh_hv10, "autoFocus", true);
			bindProp(__nsh_hv10, "value", () => editingJournalText());
			prop(__nsh_hv10, "onChange", (e) => editingJournalText.set(e.value));
			prop(__nsh_hv10, "multiline", true);
			prop(__nsh_hv10, "submitBehavior", "newline");
			prop(__nsh_hv10, "accessibilityLabel", "Текст записи");
			prop(__nsh_hv10, "class", "min-h-[56px] w-full rounded-lg px-2 py-1 text-[15px]");
			bindProp(__nsh_hv10, "style", () => ({
				color: props.colors.foreground,
				backgroundColor: props.colors.background
			}));
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "class", "mt-2 flex-row justify-end");
			prop(__nsh_hv11, "style", { gap: 8 });
			insert(__nsh_hv11, [component(GhostButton, {
				label: "Отмена",
				get colors() {
					return props.colors;
				},
				get dark() {
					return props.dark;
				},
				onPress: () => editingJournalId.set(null)
			}), component(SolidButton, {
				label: "Сохранить",
				get background() {
					return props.colors.accent;
				},
				get foreground() {
					return props.colors.background;
				},
				onPress: () => {
					props.onUpdate(props.entry.id, editingJournalText());
					editingJournalId.set(null);
				}
			})]);
			append(__nsh_hv9, __nsh_hv10);
			append(__nsh_hv9, __nsh_hv11);
			return __nsh_hv9;
		})() : props.entry.voice ? component(VoiceBubble, {
			get entry() {
				return props.entry;
			},
			get playing() {
				return props.playing;
			},
			get colors() {
				return props.colors;
			},
			get onPlay() {
				return props.onPlay;
			}
		}) : (() => {
			const __nsh_hv12 = element("text");
			prop(__nsh_hv12, "onContextMenu", openEntryMenu);
			prop(__nsh_hv12, "class", "select-text text-[15px] leading-5");
			bindProp(__nsh_hv12, "style", () => ({
				color: "#ffffff",
				fontWeight: 500,
				selectionColor: colorAlpha(props.colors.accent, props.dark ? .35 : .24)
			}));
			insert(__nsh_hv12, () => props.entry.text);
			return __nsh_hv12;
		})());
		append(__nsh_hv6, __nsh_hv8);
		insert(__nsh_hv6, () => journalDateShown() === props.entry.id && (() => {
			const __nsh_hv7 = element("text");
			prop(__nsh_hv7, "class", "mr-2 text-[11px]");
			bindProp(__nsh_hv7, "style", () => ({
				color: props.colors.muted,
				pointerEvents: "none"
			}));
			insert(__nsh_hv7, () => formatJournalStamp(props.entry.createdAt));
			return __nsh_hv7;
		})(), __nsh_hv8);
		return __nsh_hv6;
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
	const groups = () => buildJournalDays(props.entries());
	effect(() => {
		if (props.entries().length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
	});
	effect(() => {
		const editing = editingJournalId();
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
	effect(() => {
		if (props.recording()) {
			stopScopeExit();
			scopeMounted = true;
			scopeExit.set(0);
			scopeShown.set(true);
			return;
		}
		if (!scopeMounted) return;
		runScopeExit();
	});
	const send = (text) => {
		const value = text.trim();
		if (!value) return;
		const id = nextEntryId();
		arrivingId.set(id);
		animateSend();
		props.onCreate(value, id);
		journalDraft.set("");
		journalDraftContentHeight.set(COMPOSER_LINE);
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
		const __nsh_hv13 = element("view");
		prop(__nsh_hv13, "onLayout", (e) => {
			pageWidth = e.bounds.size.width;
		});
		prop(__nsh_hv13, "onPress", claimJournalComposer);
		prop(__nsh_hv13, "class", "min-h-0 flex-1 flex-row overflow-hidden");
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "class", "relative min-w-0 flex-1 flex-col items-center");
		const __nsh_hv16 = element("view");
		prop(__nsh_hv16, "class", "relative min-h-0 w-full flex-1");
		const __nsh_hv17 = element("scroll");
		prop(__nsh_hv17, "ref", (node) => {
			feedRef = node;
		});
		prop(__nsh_hv17, "onLayout", (e) => feedBox.set({
			width: e.bounds.size.width,
			height: e.bounds.size.height
		}));
		prop(__nsh_hv17, "contentStyle", { flexGrow: 1 });
		prop(__nsh_hv17, "class", "min-h-0 w-full flex-1 pb-4");
		const __nsh_hv18 = element("view");
		prop(__nsh_hv18, "onMouseLeave", leaveJournalDates);
		prop(__nsh_hv18, "class", "mx-auto justify-end");
		bindProp(__nsh_hv18, "style", () => ({
			width: threadSpan(),
			minHeight: feedBox().height,
			paddingTop: props.titlebarInset + 16,
			paddingLeft: FEED_PAD,
			paddingRight: FEED_PAD
		}));
		insert(__nsh_hv18, [each(() => groups(), (group) => (() => {
			const __nsh_hv19 = element("view");
			prop(__nsh_hv19, "onLayout", (e) => {
				dayOffsets.set(group().key, e.bounds.origin.y);
			});
			prop(__nsh_hv19, "class", "mb-4");
			const __nsh_hv20 = element("text");
			prop(__nsh_hv20, "class", "mb-3 text-center text-[12px]");
			bindProp(__nsh_hv20, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv20, () => formatJournalDay(group()));
			append(__nsh_hv19, __nsh_hv20);
			insert(__nsh_hv19, each(() => group().entries, (entry) => component(JournalBubble, {
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
				get playing() {
					return props.playing() === entry().id;
				},
				get onPlay() {
					return props.onPlayVoice;
				},
				get onUpdate() {
					return props.onUpdate;
				},
				get onDelete() {
					return props.onDelete;
				}
			}), ((entry) => entry.id)));
			return __nsh_hv19;
		})(), ((group) => group.key)), () => groups().length === 0 && (() => {
			const __nsh_hv21 = element("view");
			prop(__nsh_hv21, "class", "flex-1 items-center justify-center py-12");
			const __nsh_hv22 = element("text");
			prop(__nsh_hv22, "class", "text-[13px]");
			bindProp(__nsh_hv22, "style", () => ({ color: props.colors.muted }));
			const __nsh_hv23 = text("Записей пока нет");
			append(__nsh_hv22, __nsh_hv23);
			append(__nsh_hv21, __nsh_hv22);
			return __nsh_hv21;
		})()]);
		append(__nsh_hv17, __nsh_hv18);
		const __nsh_hv24 = element("view");
		prop(__nsh_hv24, "class", "absolute right-0 top-0 bottom-0 w-[8px]");
		bindProp(__nsh_hv24, "style", () => ({
			backgroundColor: props.colors.background,
			opacity: .86,
			pointerEvents: "none"
		}));
		append(__nsh_hv16, __nsh_hv17);
		append(__nsh_hv16, __nsh_hv24);
		const __nsh_hv25 = element("view");
		prop(__nsh_hv25, "class", "mx-auto w-full");
		prop(__nsh_hv25, "style", {
			maxWidth: THREAD_WIDTH,
			paddingLeft: FEED_PAD,
			paddingRight: FEED_PAD,
			marginBottom: 18
		});
		const __nsh_hv26 = element("view");
		prop(__nsh_hv26, "class", "w-full overflow-hidden border");
		bindProp(__nsh_hv26, "style", () => ({
			borderRadius: scopeShown() ? SCOPE_RADIUS : COMPOSER_RADIUS,
			borderColor: props.colors.border,
			backgroundColor: props.colors.card
		}));
		const __nsh_hv30 = element("view");
		prop(__nsh_hv30, "class", "w-full flex-row");
		bindProp(__nsh_hv30, "style", () => ({
			height: composerPillHeight(),
			alignItems: composerExpanded() ? "flex-end" : "center",
			backgroundColor: "transparent"
		}));
		insert(__nsh_hv30, [
			() => !props.recording() && (() => {
				const __nsh_hv31 = element("view");
				prop(__nsh_hv31, "class", "relative min-w-0 flex-1 overflow-hidden");
				bindProp(__nsh_hv31, "style", () => ({ height: composerViewportHeight() }));
				const __nsh_hv32 = element("scroll");
				prop(__nsh_hv32, "ref", (node) => {
					composerScrollRef = node;
				});
				prop(__nsh_hv32, "scrollbar", false);
				prop(__nsh_hv32, "onScroll", (event) => journalScrollY.set(event.offset.y));
				prop(__nsh_hv32, "class", "w-full");
				bindProp(__nsh_hv32, "style", () => ({ height: composerViewportHeight() }));
				const __nsh_hv33 = element("view");
				prop(__nsh_hv33, "class", "relative w-full");
				bindProp(__nsh_hv33, "style", () => ({ height: composerInputHeight() }));
				const __nsh_hv34 = element("input");
				prop(__nsh_hv34, "ref", (node) => {
					composerRef = node;
				});
				prop(__nsh_hv34, "autoFocus", true);
				bindProp(__nsh_hv34, "value", () => journalDraft());
				prop(__nsh_hv34, "onChange", (e) => journalDraft.set(e.value));
				prop(__nsh_hv34, "onContentSizeChange", ({ size }) => {
					const raw = Math.max(COMPOSER_LINE, Math.round(size.height));
					if (raw === journalDraftContentHeight()) return;
					if (clampDraftHeight(raw) !== clampDraftHeight(journalDraftContentHeight())) animateComposer();
					journalDraftContentHeight.set(raw);
					revealComposer(journalCaret());
				});
				prop(__nsh_hv34, "onCaretMove", (event) => {
					placeCaret(event.bounds);
					revealComposer(journalCaret());
				});
				prop(__nsh_hv34, "onSelectionChange", (range) => journalSelection.set(range));
				prop(__nsh_hv34, "onFocus", () => journalFocused.set(true));
				prop(__nsh_hv34, "onBlur", () => journalFocused.set(false));
				prop(__nsh_hv34, "onSubmit", (event) => send(event.text));
				prop(__nsh_hv34, "multiline", true);
				prop(__nsh_hv34, "submitBehavior", "submit");
				prop(__nsh_hv34, "caret", false);
				prop(__nsh_hv34, "placeholder", "Запись в дневник…");
				prop(__nsh_hv34, "accessibilityLabel", "Новая запись в дневник");
				prop(__nsh_hv34, "class", "min-w-0 w-full text-[15px]");
				bindProp(__nsh_hv34, "style", () => ({
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
				const __nsh_hv35 = element("view");
				prop(__nsh_hv35, "class", "absolute");
				bindProp(__nsh_hv35, "style", () => ({
					pointerEvents: "none",
					left: journalCaret().x,
					top: journalCaret().y,
					width: CARET_WIDTH,
					height: journalCaret().height,
					backgroundColor: props.colors.accent,
					opacity: composerCaretShown() ? 1 : 0,
					zIndex: 1
				}));
				append(__nsh_hv33, __nsh_hv34);
				append(__nsh_hv33, __nsh_hv35);
				append(__nsh_hv32, __nsh_hv33);
				append(__nsh_hv31, __nsh_hv32);
				insert(__nsh_hv31, [() => composerFadeTop() && (() => {
					const __nsh_hv36 = element("view");
					prop(__nsh_hv36, "class", "absolute left-0 right-0 top-0");
					bindProp(__nsh_hv36, "style", () => ({
						pointerEvents: "none",
						height: COMPOSER_FADE,
						backgroundImage: `linear-gradient(to bottom, ${props.colors.card}, ${colorAlpha(props.colors.card, 0)})`,
						zIndex: 2
					}));
					return __nsh_hv36;
				})(), () => composerFadeBottom() && (() => {
					const __nsh_hv37 = element("view");
					prop(__nsh_hv37, "class", "absolute left-0 right-0 bottom-0");
					bindProp(__nsh_hv37, "style", () => ({
						pointerEvents: "none",
						height: COMPOSER_FADE,
						backgroundImage: `linear-gradient(to bottom, ${colorAlpha(props.colors.card, 0)}, ${props.colors.card})`,
						zIndex: 2
					}));
					return __nsh_hv37;
				})()]);
				return __nsh_hv31;
			})(),
			() => props.recording() && (() => {
				const __nsh_hv38 = element("view");
				prop(__nsh_hv38, "class", "min-w-0 flex-1 flex-row items-center");
				prop(__nsh_hv38, "style", {
					paddingLeft: COMPOSER_PAD_X,
					gap: 8
				});
				const __nsh_hv39 = element("view");
				prop(__nsh_hv39, "class", "shrink-0 rounded-full");
				prop(__nsh_hv39, "style", {
					width: 8,
					height: 8,
					backgroundColor: "#ff453a"
				});
				const __nsh_hv40 = element("text");
				prop(__nsh_hv40, "class", "text-[13px]");
				bindProp(__nsh_hv40, "style", () => ({
					color: props.colors.foreground,
					fontVariantNumeric: "tabular-nums"
				}));
				insert(__nsh_hv40, () => formatVoiceDuration(props.elapsed()));
				append(__nsh_hv38, __nsh_hv39);
				append(__nsh_hv38, __nsh_hv40);
				return __nsh_hv38;
			})(),
			() => journalDraft().trim() ? (() => {
				const __nsh_hv41 = element("view");
				prop(__nsh_hv41, "onPress", () => send(journalDraft()));
				prop(__nsh_hv41, "role", "button");
				prop(__nsh_hv41, "accessibilityLabel", "Отправить запись");
				prop(__nsh_hv41, "class", "shrink-0 items-center justify-center rounded-full");
				bindProp(__nsh_hv41, "hoverStyle", () => ({ opacity: journalDraft().trim() ? .85 : .35 }));
				bindProp(__nsh_hv41, "activeStyle", () => ({ opacity: journalDraft().trim() ? .7 : .35 }));
				bindProp(__nsh_hv41, "style", () => ({
					width: COMPOSER_SEND,
					height: COMPOSER_SEND,
					marginRight: 8,
					marginBottom: composerExpanded() ? 10 : 0,
					backgroundColor: journalBubble(props.colors.accent),
					opacity: journalDraft().trim() ? 1 : .35,
					cursor: journalDraft().trim() ? "pointer" : "default"
				}));
				const __nsh_hv42 = element("text");
				prop(__nsh_hv42, "class", "text-[14px] font-semibold");
				bindProp(__nsh_hv42, "style", () => ({ color: accentMark(journalBubble(props.colors.accent)) }));
				const __nsh_hv43 = text("↑");
				append(__nsh_hv42, __nsh_hv43);
				append(__nsh_hv41, __nsh_hv42);
				return __nsh_hv41;
			})() : props.recording() ? (() => {
				const __nsh_hv44 = element("view");
				prop(__nsh_hv44, "onPress", () => {
					animateComposer();
					props.onStopRecording();
				});
				prop(__nsh_hv44, "role", "button");
				prop(__nsh_hv44, "accessibilityLabel", "Остановить запись");
				prop(__nsh_hv44, "accessibilityState", { selected: true });
				prop(__nsh_hv44, "class", "shrink-0 items-center justify-center rounded-full");
				prop(__nsh_hv44, "hoverStyle", { opacity: .85 });
				prop(__nsh_hv44, "activeStyle", { opacity: .7 });
				bindProp(__nsh_hv44, "style", () => ({
					width: COMPOSER_SEND,
					height: COMPOSER_SEND,
					marginRight: 8,
					marginBottom: composerExpanded() ? 10 : 0,
					backgroundColor: "#ff453a",
					cursor: "pointer"
				}));
				const __nsh_hv45 = element("view");
				prop(__nsh_hv45, "style", {
					width: 10,
					height: 10,
					borderRadius: 2,
					backgroundColor: "#ffffff"
				});
				append(__nsh_hv44, __nsh_hv45);
				return __nsh_hv44;
			})() : (() => {
				const __nsh_hv46 = element("view");
				prop(__nsh_hv46, "onPress", () => {
					animateComposer();
					props.onStartRecording();
				});
				prop(__nsh_hv46, "role", "button");
				prop(__nsh_hv46, "accessibilityLabel", "Записать голос");
				prop(__nsh_hv46, "class", "shrink-0 items-center justify-center rounded-full");
				prop(__nsh_hv46, "hoverStyle", { opacity: .85 });
				prop(__nsh_hv46, "activeStyle", { opacity: .7 });
				bindProp(__nsh_hv46, "style", () => ({
					width: COMPOSER_SEND,
					height: COMPOSER_SEND,
					marginRight: 8,
					marginBottom: composerExpanded() ? 10 : 0,
					backgroundColor: journalBubble(props.colors.accent),
					cursor: "pointer"
				}));
				const __nsh_hv47 = element("image");
				prop(__nsh_hv47, "src", MIC_ICON);
				bindProp(__nsh_hv47, "style", () => ({
					width: 17,
					height: 17,
					tintColor: accentMark(journalBubble(props.colors.accent))
				}));
				append(__nsh_hv46, __nsh_hv47);
				return __nsh_hv46;
			})()
		]);
		append(__nsh_hv26, __nsh_hv30);
		insert(__nsh_hv26, [() => scopeShown() && (() => {
			const __nsh_hv27 = element("view");
			prop(__nsh_hv27, "class", "relative w-full overflow-hidden");
			bindProp(__nsh_hv27, "style", () => ({
				height: scopeHeight(),
				opacity: scopeOpacity()
			}));
			const __nsh_hv28 = element("view");
			prop(__nsh_hv28, "class", "absolute left-0 right-0 top-0 bottom-0");
			insert(__nsh_hv28, component(DotScope, {
				get level() {
					return props.level();
				},
				get active() {
					return props.recording();
				},
				get done() {
					return !props.recording();
				},
				style: {
					width: "100%",
					height: "100%"
				}
			}));
			append(__nsh_hv27, __nsh_hv28);
			return __nsh_hv27;
		})(), () => scopeShown() && (() => {
			const __nsh_hv29 = element("view");
			prop(__nsh_hv29, "class", "w-full");
			bindProp(__nsh_hv29, "style", () => ({
				height: scopeHeight() > .5 ? 1 : 0,
				backgroundColor: props.colors.border
			}));
			return __nsh_hv29;
		})()], __nsh_hv30);
		append(__nsh_hv25, __nsh_hv26);
		append(__nsh_hv14, __nsh_hv16);
		append(__nsh_hv14, __nsh_hv25);
		insert(__nsh_hv14, () => props.nativeCalendarButton ? component(NativeCalendarToggle, {
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
			class: "absolute right-4 z-10 h-8 w-8",
			get style() {
				return { top: props.titlebarInset + 16 };
			}
		}) : props.titlebarInset === 0 && (() => {
			const __nsh_hv15 = element("view");
			prop(__nsh_hv15, "onPress", toggleJournalCalendar);
			prop(__nsh_hv15, "role", "button");
			bindProp(__nsh_hv15, "accessibilityLabel", () => journalCalendarOpen() ? "Скрыть календарь" : "Показать календарь");
			bindProp(__nsh_hv15, "accessibilityState", () => ({ selected: journalCalendarOpen() }));
			prop(__nsh_hv15, "class", "absolute z-10 items-center justify-center");
			bindProp(__nsh_hv15, "hoverStyle", () => ({ backgroundColor: surfaceWash(props.dark, .11) }));
			bindProp(__nsh_hv15, "style", () => ({
				top: 16,
				right: 16,
				width: 28,
				height: 28,
				borderRadius: 6,
				cursor: "pointer",
				backgroundColor: journalCalendarOpen() ? surfaceWash(props.dark, .09) : "transparent"
			}));
			insert(__nsh_hv15, component(Icon, {
				name: "sidebar",
				size: 16,
				get color() {
					return journalCalendarOpen() ? props.colors.foreground : props.colors.muted;
				}
			}));
			return __nsh_hv15;
		})(), __nsh_hv16);
		const __nsh_hv48 = element("view");
		prop(__nsh_hv48, "class", "relative h-full shrink-0 overflow-hidden");
		bindProp(__nsh_hv48, "style", () => ({ width: journalCalendarOpen() ? journalCalendarWidth() : 0 }));
		const __nsh_hv49 = element("view");
		prop(__nsh_hv49, "class", "h-full border-l");
		bindProp(__nsh_hv49, "style", () => ({
			width: journalCalendarWidth(),
			paddingTop: props.titlebarInset,
			backgroundColor: surfaceWash(props.dark),
			borderColor: journalCalendarResizeHovered() || journalCalendarResizeActive() ? props.colors.muted : props.colors.border,
			transitionProperty: "borderColor",
			transitionDuration: 150,
			transitionTimingFunction: "ease-out"
		}));
		insert(__nsh_hv49, component(JournalCalendar, {
			get width() {
				return journalCalendarWidth();
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
		append(__nsh_hv48, __nsh_hv49);
		insert(__nsh_hv48, () => journalCalendarOpen() && (() => {
			const __nsh_hv50 = element("view");
			spread(__nsh_hv50, resizeCalendar.panHandlers);
			prop(__nsh_hv50, "role", "button");
			prop(__nsh_hv50, "accessibilityLabel", "Изменить ширину календаря");
			prop(__nsh_hv50, "onMouseEnter", () => journalCalendarResizeHovered.set(true));
			prop(__nsh_hv50, "onMouseLeave", () => journalCalendarResizeHovered.set(false));
			prop(__nsh_hv50, "class", "absolute top-0 bottom-0 z-10 w-5");
			prop(__nsh_hv50, "style", {
				left: -10,
				cursor: "col-resize"
			});
			return __nsh_hv50;
		})());
		append(__nsh_hv13, __nsh_hv14);
		append(__nsh_hv13, __nsh_hv48);
		return __nsh_hv13;
	})();
}
function toggleJournalCalendar() {
	animatePanes();
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
	const dark = appearance()?.settings.mode !== "light";
	const wash = hoverWash(dark);
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
		prop(__nsh_hv1, "class", "items-center justify-center rounded-lg border");
		prop(__nsh_hv1, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv1, "style", () => ({
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			backgroundColor: selected ? colors().card : colors().background,
			borderColor: selected ? colors().accent : colors().border,
			opacity: canEdit() ? 1 : .65,
			cursor: canEdit() ? "pointer" : "default"
		}));
		const __nsh_hv2 = element("text");
		bindProp(__nsh_hv2, "class", () => `text-[12px] hover:text-[${colors().foreground}]`);
		bindProp(__nsh_hv2, "style", () => ({ color: selected ? colors().foreground : colors().muted }));
		insert(__nsh_hv2, label);
		append(__nsh_hv1, __nsh_hv2);
		return __nsh_hv1;
	})();
	const select = (id, value, options, onSelect, width) => {
		const expanded = openSelector() === id;
		const trigger = (() => {
			const __nsh_hv3 = element("view");
			prop(__nsh_hv3, "role", "button");
			prop(__nsh_hv3, "accessibilityLabel", "Выбрать размер текста");
			bindProp(__nsh_hv3, "accessibilityState", () => ({
				expanded,
				disabled: !canEdit()
			}));
			prop(__nsh_hv3, "class", "h-8 flex-row items-center justify-between rounded-lg border");
			prop(__nsh_hv3, "hoverStyle", { backgroundColor: wash });
			bindProp(__nsh_hv3, "style", () => ({
				paddingLeft: 12,
				paddingRight: 8,
				backgroundColor: colors().card,
				borderColor: expanded ? colors().accent : colors().border,
				opacity: canEdit() ? 1 : .65,
				cursor: canEdit() ? "pointer" : "default"
			}));
			const __nsh_hv4 = element("text");
			prop(__nsh_hv4, "class", "text-[12px]");
			bindProp(__nsh_hv4, "style", () => ({ color: colors().foreground }));
			insert(__nsh_hv4, () => options.find((option) => option.value === value)?.label ?? value);
			const __nsh_hv5 = element("text");
			prop(__nsh_hv5, "class", "text-[11px]");
			bindProp(__nsh_hv5, "style", () => ({ color: colors().muted }));
			insert(__nsh_hv5, expanded ? "⌃" : "⌄");
			append(__nsh_hv3, __nsh_hv4);
			append(__nsh_hv3, __nsh_hv5);
			return __nsh_hv3;
		})();
		return (() => {
			const __nsh_hv6 = element("view");
			prop(__nsh_hv6, "style", { width });
			insert(__nsh_hv6, () => canEdit() ? component(Popover, {
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
						width,
						backgroundColor: colors().card,
						borderColor: colors().border
					};
				},
				get children() {
					return (() => {
						const __nsh_hv7 = element("scroll");
						prop(__nsh_hv7, "accessibilityLabel", "Варианты выбора");
						bindProp(__nsh_hv7, "style", () => ({ height: Math.min(options.length * 32, 256) }));
						insert(__nsh_hv7, () => options.map((option) => (() => {
							const __nsh_hv8 = element("view");
							prop(__nsh_hv8, "onPress", () => {
								onSelect(option.value);
								openSelector.set(null);
							});
							prop(__nsh_hv8, "role", "button");
							bindProp(__nsh_hv8, "accessibilityState", () => ({ selected: option.value === value }));
							prop(__nsh_hv8, "class", "h-8 flex-row items-center gap-2 rounded-lg px-2");
							prop(__nsh_hv8, "hoverStyle", { backgroundColor: wash });
							prop(__nsh_hv8, "style", { cursor: "pointer" });
							const __nsh_hv9 = element("text");
							prop(__nsh_hv9, "class", "flex-1 text-[12px]");
							bindProp(__nsh_hv9, "style", () => ({ color: colors().foreground }));
							insert(__nsh_hv9, () => option.label);
							append(__nsh_hv8, __nsh_hv9);
							insert(__nsh_hv8, () => option.value === value && (() => {
								const __nsh_hv10 = element("text");
								prop(__nsh_hv10, "class", "text-[12px]");
								bindProp(__nsh_hv10, "style", () => ({ color: colors().accent }));
								const __nsh_hv11 = text("✓");
								append(__nsh_hv10, __nsh_hv11);
								return __nsh_hv10;
							})());
							return __nsh_hv8;
						})()));
						return __nsh_hv7;
					})();
				}
			}) : trigger);
			return __nsh_hv6;
		})();
	};
	const shortcutRow = (name, label) => (() => {
		const __nsh_hv12 = element("view");
		prop(__nsh_hv12, "class", "min-h-[52px] flex-row items-center gap-4 border-b py-3");
		bindProp(__nsh_hv12, "style", () => ({ borderColor: colors().border }));
		const __nsh_hv13 = element("text");
		prop(__nsh_hv13, "class", "flex-1 text-[13px]");
		bindProp(__nsh_hv13, "style", () => ({ color: colors().foreground }));
		insert(__nsh_hv13, label);
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "onPress", () => props.onChangeShortcut(name));
		prop(__nsh_hv14, "role", "button");
		prop(__nsh_hv14, "accessibilityLabel", `Изменить сочетание: ${label}`);
		prop(__nsh_hv14, "class", "items-center justify-center");
		prop(__nsh_hv14, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv14, "style", () => ({
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: 8,
			backgroundColor: colors().background,
			cursor: "pointer"
		}));
		const __nsh_hv15 = element("text");
		prop(__nsh_hv15, "class", "text-[12px]");
		bindProp(__nsh_hv15, "style", () => ({ color: colors().accent }));
		insert(__nsh_hv15, () => keymap.label(props.shortcuts[name]));
		append(__nsh_hv14, __nsh_hv15);
		append(__nsh_hv12, __nsh_hv13);
		append(__nsh_hv12, __nsh_hv14);
		return __nsh_hv12;
	})();
	if (!settings() || !appearance()) return (() => {
		const __nsh_hv16 = element("scroll");
		prop(__nsh_hv16, "class", "min-h-0 flex-1 px-7 pt-4 pb-8");
		const __nsh_hv17 = element("text");
		prop(__nsh_hv17, "class", "text-[13px]");
		bindProp(__nsh_hv17, "style", () => ({ color: colors().muted }));
		const __nsh_hv18 = text("Загружаем настройки внешнего вида…");
		append(__nsh_hv17, __nsh_hv18);
		append(__nsh_hv16, __nsh_hv17);
		return __nsh_hv16;
	})();
	const current = () => settings();
	const modePalette = (mode) => {
		if (mode === "system") return colors();
		const darkMode = mode === "dark";
		const theme = previewThemes[0];
		const base = darkMode ? theme.dark : theme.light;
		const custom = current().accent_source === "custom" ? systemAccent(current().accent_color, darkMode) : void 0;
		return {
			...base,
			accent: custom ?? base.accent
		};
	};
	const modeCard = (mode) => {
		const palette = () => modePalette(mode.value);
		return (() => {
			const __nsh_hv19 = element("view");
			prop(__nsh_hv19, "onPress", () => patch({ mode: mode.value }));
			prop(__nsh_hv19, "role", "button");
			bindProp(__nsh_hv19, "accessibilityState", () => ({
				selected: current().mode === mode.value,
				disabled: !canEdit()
			}));
			prop(__nsh_hv19, "class", "min-w-0 flex-1");
			bindProp(__nsh_hv19, "hoverStyle", () => ({ opacity: canEdit() ? .85 : .65 }));
			bindProp(__nsh_hv19, "style", () => ({
				opacity: canEdit() ? 1 : .65,
				cursor: canEdit() ? "pointer" : "default"
			}));
			const __nsh_hv20 = element("view");
			prop(__nsh_hv20, "class", "h-[148px] items-center justify-center overflow-hidden rounded-md border p-3");
			bindProp(__nsh_hv20, "style", () => ({
				borderColor: current().mode === mode.value ? colors().accent : palette().border,
				backgroundColor: palette().background
			}));
			const __nsh_hv21 = element("view");
			prop(__nsh_hv21, "class", "h-full w-full flex-row overflow-hidden rounded-md border");
			bindProp(__nsh_hv21, "style", () => ({
				borderColor: palette().border,
				backgroundColor: palette().card
			}));
			const __nsh_hv22 = element("view");
			prop(__nsh_hv22, "class", "w-1/3 gap-2 border-r p-2");
			bindProp(__nsh_hv22, "style", () => ({ borderColor: palette().border }));
			const __nsh_hv23 = element("view");
			prop(__nsh_hv23, "class", "h-2 rounded");
			bindProp(__nsh_hv23, "style", () => ({ backgroundColor: palette().accent }));
			const __nsh_hv24 = element("view");
			prop(__nsh_hv24, "class", "h-1.5 rounded");
			bindProp(__nsh_hv24, "style", () => ({ backgroundColor: palette().muted }));
			const __nsh_hv25 = element("view");
			prop(__nsh_hv25, "class", "h-1.5 rounded");
			bindProp(__nsh_hv25, "style", () => ({ backgroundColor: palette().border }));
			append(__nsh_hv22, __nsh_hv23);
			append(__nsh_hv22, __nsh_hv24);
			append(__nsh_hv22, __nsh_hv25);
			const __nsh_hv26 = element("view");
			prop(__nsh_hv26, "class", "flex-1 gap-2 p-2");
			const __nsh_hv27 = element("view");
			prop(__nsh_hv27, "class", "h-2 w-1/2 rounded");
			bindProp(__nsh_hv27, "style", () => ({ backgroundColor: palette().muted }));
			const __nsh_hv28 = element("view");
			prop(__nsh_hv28, "class", "h-9 rounded");
			bindProp(__nsh_hv28, "style", () => ({ backgroundColor: palette().background }));
			const __nsh_hv29 = element("view");
			prop(__nsh_hv29, "class", "h-1.5 w-2/3 rounded");
			bindProp(__nsh_hv29, "style", () => ({ backgroundColor: palette().border }));
			append(__nsh_hv26, __nsh_hv27);
			append(__nsh_hv26, __nsh_hv28);
			append(__nsh_hv26, __nsh_hv29);
			append(__nsh_hv21, __nsh_hv22);
			append(__nsh_hv21, __nsh_hv26);
			append(__nsh_hv20, __nsh_hv21);
			const __nsh_hv30 = element("text");
			prop(__nsh_hv30, "class", "mt-2 text-center text-[12px]");
			bindProp(__nsh_hv30, "style", () => ({ color: current().mode === mode.value ? colors().accent : colors().muted }));
			insert(__nsh_hv30, () => mode.label);
			append(__nsh_hv19, __nsh_hv20);
			append(__nsh_hv19, __nsh_hv30);
			return __nsh_hv19;
		})();
	};
	return (() => {
		const __nsh_hv31 = element("scroll");
		prop(__nsh_hv31, "class", "min-h-0 flex-1 px-7 pt-4 pb-8");
		bindProp(__nsh_hv31, "style", () => ({ backgroundColor: colors().background }));
		const __nsh_hv32 = element("view");
		prop(__nsh_hv32, "class", "mx-auto w-full max-w-[720px]");
		const __nsh_hv33 = element("text");
		prop(__nsh_hv33, "class", "mb-5 px-2 text-[22px] font-semibold");
		bindProp(__nsh_hv33, "style", () => ({ color: colors().foreground }));
		const __nsh_hv34 = text("Оформление");
		append(__nsh_hv33, __nsh_hv34);
		const __nsh_hv39 = element("view");
		prop(__nsh_hv39, "class", "mb-8 flex-row gap-4");
		insert(__nsh_hv39, () => modePreviews.map(modeCard));
		const __nsh_hv40 = element("view");
		prop(__nsh_hv40, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv40, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv41 = element("view");
		prop(__nsh_hv41, "class", "gap-2 py-3");
		insert(__nsh_hv41, [() => [systemAccents.slice(0, 6), systemAccents.slice(6)].map((row) => (() => {
			const __nsh_hv42 = element("view");
			prop(__nsh_hv42, "class", "flex-row flex-wrap items-center gap-2");
			insert(__nsh_hv42, () => row.map((accent) => {
				const shown = () => appearance()?.settings.mode !== "light" ? accent.dark : accent.light;
				const selected = () => {
					const stored = current().accent_color?.toLowerCase();
					return current().accent_source === "custom" ? stored === accent.light || stored === accent.dark || accent.legacy.includes(stored ?? "") : current().accent_source !== "wallpaper" && accent.key === "blue";
				};
				const label = () => appearance()?.settings.mode !== "light" && accent.darkName ? accent.darkName : accent.name;
				return (() => {
					const __nsh_hv43 = element("view");
					prop(__nsh_hv43, "onPress", () => patch({
						accent_source: "custom",
						accent_color: accent.light
					}));
					prop(__nsh_hv43, "role", "button");
					bindProp(__nsh_hv43, "accessibilityLabel", () => `Акцент ${label()}`);
					bindProp(__nsh_hv43, "accessibilityState", () => ({ selected: selected() }));
					prop(__nsh_hv43, "class", "h-7 w-7 items-center justify-center rounded-full border");
					prop(__nsh_hv43, "hoverStyle", { opacity: .85 });
					bindProp(__nsh_hv43, "style", () => ({
						backgroundColor: shown(),
						borderColor: selected() ? accentMark(shown()) : "transparent",
						cursor: "pointer"
					}));
					insert(__nsh_hv43, () => selected() && (() => {
						const __nsh_hv44 = element("text");
						prop(__nsh_hv44, "class", "text-[12px]");
						bindProp(__nsh_hv44, "style", () => ({ color: accentMark(shown()) }));
						const __nsh_hv45 = text("✓");
						append(__nsh_hv44, __nsh_hv45);
						return __nsh_hv44;
					})());
					return __nsh_hv43;
				})();
			}));
			return __nsh_hv42;
		})()), () => appearance()?.capabilities.wallpaper_accent && card(current().accent_source === "wallpaper", "Обои", () => patch({ accent_source: "wallpaper" }))]);
		append(__nsh_hv40, __nsh_hv41);
		const __nsh_hv46 = element("view");
		prop(__nsh_hv46, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv46, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv47 = element("view");
		prop(__nsh_hv47, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv48 = element("text");
		prop(__nsh_hv48, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv48, "style", () => ({ color: colors().foreground }));
		const __nsh_hv49 = text("Материал окна");
		append(__nsh_hv48, __nsh_hv49);
		const __nsh_hv50 = element("view");
		prop(__nsh_hv50, "class", "flex-row flex-wrap items-center gap-2");
		insert(__nsh_hv50, () => (appearance()?.capabilities.materials ?? []).map((material) => selectLabel(material, materialLabels[material] ?? material, current().material, (next) => patch({ material: next }), colors(), canEdit(), dark)));
		append(__nsh_hv47, __nsh_hv48);
		append(__nsh_hv47, __nsh_hv50);
		append(__nsh_hv46, __nsh_hv47);
		const __nsh_hv51 = element("view");
		prop(__nsh_hv51, "class", "mb-8 rounded-xl border px-4");
		bindProp(__nsh_hv51, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv52 = element("view");
		prop(__nsh_hv52, "class", "min-h-[60px] flex-row flex-wrap items-center gap-4 py-3");
		const __nsh_hv53 = element("text");
		prop(__nsh_hv53, "class", "min-w-[160px] flex-1 text-[13px]");
		bindProp(__nsh_hv53, "style", () => ({ color: colors().foreground }));
		const __nsh_hv54 = text("Размер интерфейсного текста");
		append(__nsh_hv53, __nsh_hv54);
		append(__nsh_hv52, __nsh_hv53);
		insert(__nsh_hv52, () => select("fontSize", String(current().font_size), [.../* @__PURE__ */ new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({
			value: String(size),
			label: `${size} px`
		})), (value) => patch({ font_size: Number(value) }), 128));
		append(__nsh_hv51, __nsh_hv52);
		const __nsh_hv55 = element("view");
		prop(__nsh_hv55, "class", "rounded-xl border px-4");
		bindProp(__nsh_hv55, "style", () => ({
			backgroundColor: colors().card,
			borderColor: colors().border
		}));
		const __nsh_hv56 = element("view");
		prop(__nsh_hv56, "class", "h-10 flex-row items-center");
		const __nsh_hv57 = element("text");
		prop(__nsh_hv57, "class", "flex-1 text-[13px]");
		bindProp(__nsh_hv57, "style", () => ({ color: colors().foreground }));
		const __nsh_hv58 = text("Закрыть панель / поиск");
		append(__nsh_hv57, __nsh_hv58);
		const __nsh_hv59 = element("text");
		prop(__nsh_hv59, "class", "text-[12px]");
		bindProp(__nsh_hv59, "style", () => ({ color: colors().muted }));
		const __nsh_hv60 = text("Esc");
		append(__nsh_hv59, __nsh_hv60);
		append(__nsh_hv56, __nsh_hv57);
		append(__nsh_hv56, __nsh_hv59);
		append(__nsh_hv55, __nsh_hv56);
		insert(__nsh_hv55, [
			() => shortcutRow("sidebar", "Боковая панель — открыть/скрыть"),
			() => shortcutRow("create", "Новая задача — панель справа"),
			() => shortcutRow("search", "Быстрый поиск"),
			() => shortcutRow("reload", "Обновить данные из Engine")
		], __nsh_hv56);
		append(__nsh_hv32, __nsh_hv33);
		append(__nsh_hv32, __nsh_hv39);
		append(__nsh_hv32, __nsh_hv40);
		append(__nsh_hv32, __nsh_hv46);
		append(__nsh_hv32, __nsh_hv51);
		append(__nsh_hv32, __nsh_hv55);
		insert(__nsh_hv32, [
			() => appearance()?.policy.following && (() => {
				const __nsh_hv35 = element("text");
				prop(__nsh_hv35, "class", "mb-4 px-2 text-[12px]");
				bindProp(__nsh_hv35, "style", () => ({ color: colors().accent }));
				const __nsh_hv36 = text("Общий стиль задаётся в Mundus Manager. Настройки доступны только для просмотра.");
				append(__nsh_hv35, __nsh_hv36);
				return __nsh_hv35;
			})(),
			() => !props.editable() && !appearance()?.policy.following && (() => {
				const __nsh_hv37 = element("text");
				prop(__nsh_hv37, "class", "mb-4 px-2 text-[12px]");
				bindProp(__nsh_hv37, "style", () => ({ color: colors().muted }));
				const __nsh_hv38 = text("Engine не подключён. Можно временно менять оформление; выбор действует только до закрытия Atlas.");
				append(__nsh_hv37, __nsh_hv38);
				return __nsh_hv37;
			})(),
			() => heading("Режим")
		], __nsh_hv39);
		insert(__nsh_hv32, () => heading("Акцент"), __nsh_hv40);
		insert(__nsh_hv32, () => heading("Стекло"), __nsh_hv46);
		insert(__nsh_hv32, () => heading("Размер текста"), __nsh_hv51);
		insert(__nsh_hv32, () => heading("Горячие клавиши"), __nsh_hv55);
		append(__nsh_hv31, __nsh_hv32);
		return __nsh_hv31;
	})();
}
function selectLabel(material, label, selected, onPress, colors, editable, dark) {
	return (() => {
		const __nsh_hv61 = element("view");
		bindProp(__nsh_hv61, "onPress", () => editable ? () => onPress(material) : void 0);
		prop(__nsh_hv61, "role", "button");
		prop(__nsh_hv61, "accessibilityState", {
			selected: selected === material,
			disabled: !editable
		});
		prop(__nsh_hv61, "class", "items-center justify-center rounded-lg border");
		bindProp(__nsh_hv61, "hoverStyle", () => ({ backgroundColor: hoverWash(dark) }));
		bindProp(__nsh_hv61, "style", () => ({
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			backgroundColor: selected === material ? colors.card : colors.background,
			borderColor: selected === material ? colors.accent : colors.border,
			opacity: editable ? 1 : .65,
			cursor: editable ? "pointer" : "default"
		}));
		const __nsh_hv62 = element("text");
		bindProp(__nsh_hv62, "class", () => `text-[12px] hover:text-[${colors.foreground}]`);
		bindProp(__nsh_hv62, "style", () => ({ color: selected === material ? colors.foreground : colors.muted }));
		insert(__nsh_hv62, label);
		append(__nsh_hv61, __nsh_hv62);
		return __nsh_hv61;
	})();
}

//#endregion
//#region game-library-utils.ts
function visibleGameCards(cards, query) {
	const search = query.trim().toLocaleLowerCase();
	return cards.filter((card) => !card.hidden && (!search || card.title.toLocaleLowerCase().includes(search) || card.exePath.toLocaleLowerCase().includes(search)));
}
function pathKey(path) {
	return path.replaceAll("/", "\\").toLocaleLowerCase();
}
function guessTitle(path) {
	return (path.split(/[\\/]/).pop() ?? path).replace(/\.(exe|lnk)$/i, "").replaceAll(/[._-]+/g, " ").trim();
}
function isGameCard(value) {
	if (!value || typeof value !== "object") return false;
	const card = value;
	return typeof card.id === "string" && typeof card.title === "string" && typeof card.exePath === "string" && !!card.exePath;
}
function isCandidate(value) {
	if (!value || typeof value !== "object") return false;
	const game = value;
	return typeof game.title === "string" && typeof game.exePath === "string" && !!game.exePath && typeof game.source === "string";
}
function isScanProgress(value) {
	if (!value || typeof value !== "object") return false;
	const progress = value;
	return [
		"steam",
		"epic",
		"gog"
	].includes(progress.provider ?? "") && [
		"scanning",
		"complete",
		"error"
	].includes(progress.phase ?? "") && typeof progress.completed === "number" && typeof progress.total === "number" && typeof progress.found === "number";
}
function providerLabel(provider) {
	if (provider === "steam") return "Steam";
	if (provider === "epic") return "Epic Games";
	if (provider === "gog") return "GOG";
	if (provider === "Engine") return "Engine";
	return "Источник";
}

//#endregion
//#region game-library-metadata.ts
const metadataChoices = signal(null);
function receiveMetadata(value, cards) {
	if (!value || typeof value !== "object") return;
	const event = value;
	if (typeof event.exePath !== "string" || !event.result || typeof event.result !== "object") return;
	const exePath = event.exePath;
	const result = event.result;
	if (result.status !== "ambiguous" || !Array.isArray(result.candidates)) {
		if (metadataChoices()?.exePath === exePath) metadataChoices.set(null);
		return;
	}
	const item = cards.find((card) => card.exePath.toLowerCase() === exePath.toLowerCase());
	const candidates = result.candidates.filter((entry) => !!entry && typeof entry === "object" && typeof entry.provider === "string" && typeof entry.providerId === "string" && typeof entry.name === "string");
	metadataChoices.set({
		exePath,
		title: item?.title ?? guessTitle(exePath),
		candidates
	});
}
function chooseMetadata(choice, sendCommand) {
	const pending = metadataChoices();
	if (!pending) return;
	sendCommand?.("games.metadata.choose", {
		exePath: pending.exePath,
		title: pending.title,
		provider: choice.provider,
		providerId: choice.providerId
	});
	metadataChoices.set(null);
}
function setImage(exePath, source, sendCommand) {
	sendCommand?.("games.metadata.set-image", {
		exePath,
		source
	});
}

//#endregion
//#region game-library.ts
const legacyCardsKey = "mundus.atlas.games.v1";
const cards = signal([]);
const candidates = signal([]);
const libraryState = signal("loading");
const scanState = signal("idle");
const scanProgress = signal(null);
const scanError = signal("");
const scanWarning = signal("");
const importError = signal("");
const error = signal("");
const addOpen = signal(false);
const deck = signal([]);
const deckTotal = signal(0);
const deckAdded = signal(0);
const deckSkipped = signal(0);
const reviewDone = signal(false);
let sendCommand;
let loadRequested = false;
let migrationRequested = false;
function readJson$1(raw, fallback) {
	if (!raw) return fallback;
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function migrateLegacyCards() {
	if (migrationRequested) return;
	migrationRequested = true;
	Storage.getItem(legacyCardsKey).then((raw) => {
		const legacy = readJson$1(raw, []).filter(isGameCard);
		if (legacy.length) sendCommand?.("games.import-legacy", { candidates: legacy });
	});
}
function bindCommand(command) {
	sendCommand = command;
	if (!loadRequested) {
		loadRequested = true;
		command("games.load");
	}
}
function startDiscovery() {
	candidates.set([]);
	deck.set([]);
	deckTotal.set(0);
	deckAdded.set(0);
	deckSkipped.set(0);
	reviewDone.set(false);
	scanError.set("");
	scanWarning.set("");
	importError.set("");
	if (!sendCommand) {
		scanState.set("error");
		scanError.set("Engine недоступен");
		reviewDone.set(true);
		return;
	}
	scanProgress.set({
		provider: "steam",
		phase: "scanning",
		completed: 0,
		total: 3,
		found: 0
	});
	scanState.set("scanning");
	sendCommand("games.discover");
}
function openAddDialog() {
	addOpen.set(true);
	if (!deck().length) {
		deckTotal.set(0);
		reviewDone.set(false);
	}
}
function startDeck() {
	const items = availableCandidates();
	deck.set(items);
	deckTotal.set(items.length);
	deckAdded.set(0);
	deckSkipped.set(0);
}
function decideDeck(accept) {
	const card = deck()[0];
	if (!card) return;
	deck.set(deck().slice(1));
	if (accept) {
		deckAdded.set(deckAdded() + 1);
		importGames([card]);
	} else deckSkipped.set(deckSkipped() + 1);
}
function beginManualAdd() {
	importError.set("");
}
function importGames(selected) {
	if (!selected.length) return;
	if (!sendCommand) {
		importError.set("Engine недоступен");
		return;
	}
	importError.set("");
	sendCommand("games.import", { candidates: selected });
}
function availableCandidates() {
	const known = new Set(cards().map((card) => pathKey(card.exePath)));
	return candidates().filter((candidate) => !known.has(pathKey(candidate.exePath)));
}
const pendingAdd = signal(null);
const launchError = signal("");
let confirmFromPicker = false;
function beginConfirm(path, source = "manual", fromPicker = true) {
	importError.set("");
	confirmFromPicker = fromPicker;
	addOpen.set(false);
	pendingAdd.set({
		path,
		title: guessTitle(path),
		source
	});
}
function editPendingTitle(title) {
	const pending = pendingAdd();
	if (pending) pendingAdd.set({
		...pending,
		title
	});
}
function cancelConfirm() {
	pendingAdd.set(null);
	if (confirmFromPicker) addOpen.set(true);
}
function confirmAdd() {
	const pending = pendingAdd();
	if (!pending) return;
	pendingAdd.set(null);
	importGames([{
		title: pending.title.trim() || guessTitle(pending.path),
		exePath: pending.path,
		installDir: "",
		source: pending.source
	}]);
}
function receiveLaunch(value) {
	const result = value && typeof value === "object" ? value : {};
	launchError.set(result.ok === true ? "" : String(result.error ?? "Не удалось запустить игру"));
}
function receiveLibrary(value) {
	if (!Array.isArray(value)) {
		const message = value && typeof value === "object" ? String(value.error ?? "Не удалось загрузить библиотеку игр") : "Не удалось загрузить библиотеку игр";
		libraryState.set("error");
		error.set(message);
		return;
	}
	cards.set(value.filter(isGameCard));
	libraryState.set("ready");
	error.set("");
	migrateLegacyCards();
}
function receiveDiscovery(value) {
	if (value && typeof value === "object" && "progress" in value) {
		const progress = value.progress;
		if (isScanProgress(progress)) {
			LayoutAnimation.configureNext({
				duration: 500,
				update: {
					type: "easeOut",
					duration: 500
				}
			});
			scanProgress.set(progress);
		}
		return;
	}
	const response = value && typeof value === "object" ? value : {};
	const items = Array.isArray(value) ? value : Array.isArray(response.candidates) ? response.candidates : null;
	if (!items) {
		scanState.set("error");
		scanError.set(String(response.error ?? "Не удалось проверить библиотеки игр"));
		reviewDone.set(true);
		return;
	}
	const found = items.filter(isCandidate);
	LayoutAnimation.configureNext({
		duration: 500,
		create: {
			type: "easeOut",
			property: "opacity",
			duration: 500
		},
		update: {
			type: "easeOut",
			duration: 500
		},
		delete: {
			type: "easeOut",
			property: "opacity",
			duration: 500
		}
	});
	const failures = Array.isArray(response.errors) ? response.errors.map((entry) => {
		const failure = entry && typeof entry === "object" ? entry : {};
		return `${providerLabel(failure.provider)}: ${String(failure.message ?? "ошибка")}`;
	}) : [];
	candidates.set(found);
	scanProgress.set({
		provider: "gog",
		phase: "complete",
		completed: 3,
		total: 3,
		found: found.length
	});
	if ((response.fatal === true || failures.length === 3) && found.length === 0) {
		scanState.set("error");
		scanError.set(failures.join(" · "));
		scanWarning.set("");
	} else {
		scanState.set("ready");
		scanError.set("");
		scanWarning.set(failures.length ? `Не все библиотеки проверены: ${failures.join(" · ")}` : "");
		startDeck();
	}
	reviewDone.set(true);
}
function receiveImport(value) {
	const result = value && typeof value === "object" ? value : {};
	if (result.ok === true) {
		importError.set("");
		if (result.legacy === true) Storage.setItem(legacyCardsKey, "[]");
		else if (!deckTotal()) addOpen.set(false);
	} else {
		importError.set(String(result.error ?? "Не удалось добавить игру в Engine"));
		if (!result.legacy && !deckTotal()) addOpen.set(true);
	}
}
const gameLibrary = {
	cards,
	candidates,
	libraryState,
	scanState,
	scanProgress,
	scanError,
	scanWarning,
	importError,
	error,
	addOpen,
	metadataChoices,
	receiveMetadata: (value) => receiveMetadata(value, cards()),
	chooseMetadata: (choice) => chooseMetadata(choice, sendCommand),
	setImage: (exePath, source) => setImage(exePath, source, sendCommand),
	deck,
	deckTotal,
	deckAdded,
	deckSkipped,
	reviewDone,
	bindCommand,
	openAddDialog,
	scanAutomatically: startDiscovery,
	beginManualAdd,
	closeAddDialog: () => addOpen.set(false),
	decideDeck,
	importGames,
	receiveLaunch,
	pendingAdd,
	launchError,
	beginConfirm,
	editPendingTitle,
	cancelConfirm,
	confirmAdd,
	receiveLibrary,
	receiveDiscovery,
	receiveImport
};

//#endregion
//#region modal.tsx
function Modal(props) {
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "absolute inset-0 items-center justify-center px-6");
		const __nsh_hv1 = element("view");
		bindProp(__nsh_hv1, "onPress", () => props.onDismiss);
		prop(__nsh_hv1, "accessibilityLabel", "Закрыть окно");
		prop(__nsh_hv1, "role", "button");
		prop(__nsh_hv1, "class", "absolute inset-0");
		prop(__nsh_hv1, "style", { backgroundColor: "#00000059" });
		const __nsh_hv2 = element("view");
		prop(__nsh_hv2, "class", "z-10 flex-col rounded-[16px] border");
		bindProp(__nsh_hv2, "style", () => ({
			width: props.width ?? 420,
			borderColor: props.colors.border,
			backgroundColor: props.colors.card
		}));
		prop(__nsh_hv2, "role", "none");
		const __nsh_hv3 = element("view");
		prop(__nsh_hv3, "class", "w-full flex-row items-center px-5 pb-3 pt-5");
		prop(__nsh_hv3, "style", { gap: 6 });
		const __nsh_hv7 = element("text");
		prop(__nsh_hv7, "class", "flex-1 text-[15px] font-semibold");
		bindProp(__nsh_hv7, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv7, () => props.title);
		const __nsh_hv8 = element("view");
		bindProp(__nsh_hv8, "onPress", () => props.onDismiss);
		prop(__nsh_hv8, "role", "button");
		prop(__nsh_hv8, "accessibilityLabel", "Закрыть карточку");
		prop(__nsh_hv8, "class", "h-6 w-6 items-center justify-center rounded-md");
		bindProp(__nsh_hv8, "hoverStyle", () => ({ backgroundColor: props.colors.background }));
		const __nsh_hv9 = element("text");
		prop(__nsh_hv9, "class", "text-[13px]");
		bindProp(__nsh_hv9, "style", () => ({ color: props.colors.muted }));
		const __nsh_hv10 = text("✕");
		append(__nsh_hv9, __nsh_hv10);
		append(__nsh_hv8, __nsh_hv9);
		append(__nsh_hv3, __nsh_hv7);
		append(__nsh_hv3, __nsh_hv8);
		insert(__nsh_hv3, () => props.onBack && (() => {
			const __nsh_hv4 = element("view");
			bindProp(__nsh_hv4, "onPress", () => props.onBack);
			prop(__nsh_hv4, "role", "button");
			prop(__nsh_hv4, "accessibilityLabel", "Шаг назад");
			prop(__nsh_hv4, "class", "h-6 w-6 items-center justify-center rounded-md");
			bindProp(__nsh_hv4, "hoverStyle", () => ({ backgroundColor: props.colors.background }));
			const __nsh_hv5 = element("text");
			prop(__nsh_hv5, "class", "text-[14px]");
			bindProp(__nsh_hv5, "style", () => ({ color: props.colors.muted }));
			const __nsh_hv6 = text("←");
			append(__nsh_hv5, __nsh_hv6);
			append(__nsh_hv4, __nsh_hv5);
			return __nsh_hv4;
		})(), __nsh_hv7);
		const __nsh_hv11 = element("view");
		prop(__nsh_hv11, "class", "w-full px-5 pb-5");
		insert(__nsh_hv11, () => props.children);
		append(__nsh_hv2, __nsh_hv3);
		append(__nsh_hv2, __nsh_hv11);
		insert(__nsh_hv2, () => props.footer && (() => {
			const __nsh_hv12 = element("view");
			prop(__nsh_hv12, "class", "flex-row items-center justify-between border-t px-5 py-3");
			bindProp(__nsh_hv12, "style", () => ({
				borderColor: props.colors.border,
				gap: 12
			}));
			insert(__nsh_hv12, () => props.footer);
			return __nsh_hv12;
		})());
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv2);
		return __nsh_hv0;
	})();
}
function ModalGhost(props) {
	return component(Button, {
		get label() {
			return props.label;
		},
		get colors() {
			return props.colors;
		},
		get onPress() {
			return props.onPress;
		},
		className: "border-0 px-0 py-0",
		style: {
			backgroundColor: "transparent",
			borderColor: "transparent"
		}
	});
}

//#endregion
//#region games-add.tsx
const DIALOG_WIDTH = 460;
function runAfterPress(run) {
	setTimeout(run, 0);
}
function providerName(provider) {
	return provider === "steam" ? "Steam" : provider === "epic" ? "Epic Games" : "GOG";
}
function scanStage() {
	const progress = gameLibrary.scanProgress();
	if (!progress) return "Подключаемся к Engine…";
	if (progress.aggregate) return `Проверены все библиотеки · найдено ${progress.found}`;
	const provider = providerName(progress.provider);
	if (progress.phase === "complete") return `${provider}: найдено ${progress.providerFound ?? 0}`;
	if (progress.phase === "error") return `${provider}: не удалось проверить`;
	return `Проверяем ${provider} (${Math.min(progress.completed + 1, progress.total)} из ${progress.total})…`;
}
function scanPercent() {
	const progress = gameLibrary.scanProgress();
	return progress ? Math.max(7, Math.round(progress.completed / progress.total * 100)) : 7;
}
function Action(props) {
	return (() => {
		const __nsh_hv0 = element("view");
		bindProp(__nsh_hv0, "onPress", () => props.onPress);
		prop(__nsh_hv0, "role", "button");
		bindProp(__nsh_hv0, "accessibilityLabel", () => props.title);
		prop(__nsh_hv0, "class", "flex-row items-center rounded-[10px] px-2 py-2");
		prop(__nsh_hv0, "style", { gap: 12 });
		bindProp(__nsh_hv0, "hoverStyle", () => ({ backgroundColor: props.colors.background }));
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "h-9 w-9 shrink-0 items-center justify-center rounded-[10px]");
		bindProp(__nsh_hv1, "style", () => ({ backgroundColor: props.colors.background }));
		insert(__nsh_hv1, component(Glyph, {
			get name() {
				return props.icon;
			},
			size: 18,
			get color() {
				return props.colors.foreground;
			}
		}));
		const __nsh_hv2 = element("view");
		prop(__nsh_hv2, "class", "min-w-0 flex-1");
		const __nsh_hv3 = element("text");
		prop(__nsh_hv3, "class", "text-[13px]");
		bindProp(__nsh_hv3, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv3, () => props.title);
		const __nsh_hv4 = element("text");
		prop(__nsh_hv4, "class", "text-[11px]");
		bindProp(__nsh_hv4, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv4, () => props.hint);
		append(__nsh_hv2, __nsh_hv3);
		append(__nsh_hv2, __nsh_hv4);
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv2);
		return __nsh_hv0;
	})();
}
let decisionPending = false;
function decide(accept) {
	if (decisionPending) return;
	decisionPending = true;
	LayoutAnimation.configureNext({
		duration: 500,
		create: {
			type: "easeOut",
			property: "opacity",
			duration: 500
		},
		update: {
			type: "easeOut",
			duration: 500
		},
		delete: {
			type: "easeOut",
			property: "opacity",
			duration: 500
		}
	});
	gameLibrary.decideDeck(accept);
	setTimeout(() => {
		decisionPending = false;
	}, 500);
}
function ReviewCard(props) {
	const initial = () => (gameLibrary.deck()[0]?.title ?? "?").trim().charAt(0).toLocaleUpperCase();
	return (() => {
		const __nsh_hv5 = element("view");
		prop(__nsh_hv5, "class", "w-full");
		const __nsh_hv6 = element("view");
		prop(__nsh_hv6, "testID", "game-review-card");
		prop(__nsh_hv6, "class", "w-full overflow-hidden rounded-[14px] border");
		bindProp(__nsh_hv6, "style", () => ({
			borderColor: props.colors.border,
			backgroundColor: props.colors.background
		}));
		const __nsh_hv7 = element("view");
		prop(__nsh_hv7, "class", "h-[190px] items-center justify-center overflow-hidden px-7");
		bindProp(__nsh_hv7, "style", () => ({ backgroundColor: props.colors.card }));
		const __nsh_hv8 = element("text");
		prop(__nsh_hv8, "class", "absolute text-[160px] font-semibold");
		bindProp(__nsh_hv8, "style", () => ({
			color: props.colors.foreground,
			opacity: .05,
			left: 6,
			top: -22
		}));
		insert(__nsh_hv8, () => initial());
		const __nsh_hv9 = element("text");
		prop(__nsh_hv9, "class", "text-center text-[20px] font-semibold");
		bindProp(__nsh_hv9, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv9, () => gameLibrary.deck()[0]?.title);
		append(__nsh_hv7, __nsh_hv8);
		append(__nsh_hv7, __nsh_hv9);
		const __nsh_hv10 = element("view");
		prop(__nsh_hv10, "class", "flex-row items-center border-t px-4 py-3");
		bindProp(__nsh_hv10, "style", () => ({
			borderColor: props.colors.border,
			gap: 10
		}));
		const __nsh_hv11 = element("text");
		prop(__nsh_hv11, "class", "min-w-0 flex-1 text-[11px]");
		bindProp(__nsh_hv11, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv11, () => gameLibrary.deck()[0]?.exePath);
		const __nsh_hv12 = element("text");
		prop(__nsh_hv12, "class", "shrink-0 text-[11px]");
		bindProp(__nsh_hv12, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv12, () => `${gameLibrary.deckTotal() - gameLibrary.deck().length + 1} из ${gameLibrary.deckTotal()}`);
		append(__nsh_hv10, __nsh_hv11);
		append(__nsh_hv10, __nsh_hv12);
		append(__nsh_hv6, __nsh_hv7);
		append(__nsh_hv6, __nsh_hv10);
		const __nsh_hv13 = element("view");
		prop(__nsh_hv13, "class", "mt-3 flex-row");
		prop(__nsh_hv13, "style", { gap: 10 });
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "onPress", () => decide(false));
		prop(__nsh_hv14, "role", "button");
		prop(__nsh_hv14, "accessibilityLabel", "Пропустить игру");
		prop(__nsh_hv14, "class", "h-10 flex-1 flex-row items-center justify-center rounded-[10px] border");
		bindProp(__nsh_hv14, "style", () => ({
			gap: 8,
			backgroundColor: props.colors.background,
			borderColor: props.colors.border
		}));
		prop(__nsh_hv14, "hoverStyle", { opacity: .88 });
		const __nsh_hv15 = element("text");
		prop(__nsh_hv15, "class", "text-[13px]");
		bindProp(__nsh_hv15, "style", () => ({ color: props.colors.foreground }));
		const __nsh_hv16 = text("Пропустить");
		append(__nsh_hv15, __nsh_hv16);
		append(__nsh_hv14, __nsh_hv15);
		insert(__nsh_hv14, component(Glyph, {
			name: "close",
			size: 15,
			get color() {
				return props.colors.muted;
			}
		}), __nsh_hv15);
		const __nsh_hv17 = element("view");
		prop(__nsh_hv17, "onPress", () => decide(true));
		prop(__nsh_hv17, "role", "button");
		prop(__nsh_hv17, "accessibilityLabel", "Добавить игру в библиотеку");
		prop(__nsh_hv17, "class", "h-10 flex-1 flex-row items-center justify-center rounded-[10px]");
		bindProp(__nsh_hv17, "style", () => ({
			gap: 8,
			backgroundColor: props.colors.accent
		}));
		prop(__nsh_hv17, "hoverStyle", { opacity: .88 });
		const __nsh_hv18 = element("text");
		prop(__nsh_hv18, "class", "text-[13px]");
		bindProp(__nsh_hv18, "style", () => ({ color: props.colors.background }));
		const __nsh_hv19 = text("Добавить");
		append(__nsh_hv18, __nsh_hv19);
		append(__nsh_hv17, __nsh_hv18);
		insert(__nsh_hv17, component(Glyph, {
			name: "check",
			size: 15,
			get color() {
				return props.colors.background;
			}
		}), __nsh_hv18);
		append(__nsh_hv13, __nsh_hv14);
		append(__nsh_hv13, __nsh_hv17);
		append(__nsh_hv5, __nsh_hv6);
		append(__nsh_hv5, __nsh_hv13);
		return __nsh_hv5;
	})();
}
function ReviewSummary(props) {
	const reviewed = () => gameLibrary.deckTotal() > 0;
	const failed = () => !reviewed() && gameLibrary.scanState() === "error";
	const headline = () => reviewed() ? `Добавлено ${gameLibrary.deckAdded()} · пропущено ${gameLibrary.deckSkipped()}` : failed() ? "Не удалось проверить библиотеки" : gameLibrary.candidates().length ? "Новых игр нет" : "Ничего не нашлось";
	const detail = () => {
		if (reviewed()) return gameLibrary.importError() || gameLibrary.scanWarning() || "Игры из списка можно запустить в любой момент";
		if (failed()) return gameLibrary.scanError();
		if (gameLibrary.candidates().length) return `Все ${gameLibrary.candidates().length} найденных игр уже в библиотеке`;
		return "Автоматический поиск не нашёл игр";
	};
	return (() => {
		const __nsh_hv20 = element("view");
		prop(__nsh_hv20, "class", "w-full items-center py-2");
		const __nsh_hv21 = element("view");
		prop(__nsh_hv21, "class", "h-11 w-11 items-center justify-center rounded-full");
		bindProp(__nsh_hv21, "style", () => ({ backgroundColor: props.colors.background }));
		insert(__nsh_hv21, component(Glyph, {
			get name() {
				return failed() ? "close" : "check";
			},
			size: 20,
			get color() {
				return failed() ? props.colors.muted : props.colors.accent;
			}
		}));
		const __nsh_hv22 = element("text");
		prop(__nsh_hv22, "class", "mt-3 text-center text-[14px]");
		bindProp(__nsh_hv22, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv22, () => headline());
		const __nsh_hv23 = element("text");
		prop(__nsh_hv23, "class", "mt-1 text-center text-[12px]");
		bindProp(__nsh_hv23, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv23, () => detail());
		const __nsh_hv24 = element("view");
		prop(__nsh_hv24, "class", "mt-4 flex-row self-stretch");
		prop(__nsh_hv24, "style", { gap: 10 });
		const __nsh_hv28 = element("view");
		bindProp(__nsh_hv28, "onPress", () => gameLibrary.closeAddDialog);
		prop(__nsh_hv28, "role", "button");
		prop(__nsh_hv28, "accessibilityLabel", "Готово");
		prop(__nsh_hv28, "class", "h-9 flex-1 items-center justify-center rounded-[10px]");
		bindProp(__nsh_hv28, "style", () => ({ backgroundColor: props.colors.accent }));
		prop(__nsh_hv28, "hoverStyle", { opacity: .88 });
		const __nsh_hv29 = element("text");
		prop(__nsh_hv29, "class", "text-[13px]");
		bindProp(__nsh_hv29, "style", () => ({ color: props.colors.background }));
		const __nsh_hv30 = text("Готово");
		append(__nsh_hv29, __nsh_hv30);
		append(__nsh_hv28, __nsh_hv29);
		append(__nsh_hv24, __nsh_hv28);
		insert(__nsh_hv24, () => failed() && (() => {
			const __nsh_hv25 = element("view");
			bindProp(__nsh_hv25, "onPress", () => gameLibrary.scanAutomatically);
			prop(__nsh_hv25, "role", "button");
			prop(__nsh_hv25, "accessibilityLabel", "Повторить поиск");
			prop(__nsh_hv25, "class", "h-9 flex-1 items-center justify-center rounded-[10px] border");
			bindProp(__nsh_hv25, "style", () => ({
				backgroundColor: props.colors.background,
				borderColor: props.colors.border
			}));
			prop(__nsh_hv25, "hoverStyle", { opacity: .88 });
			const __nsh_hv26 = element("text");
			prop(__nsh_hv26, "class", "text-[13px]");
			bindProp(__nsh_hv26, "style", () => ({ color: props.colors.foreground }));
			const __nsh_hv27 = text("Повторить");
			append(__nsh_hv26, __nsh_hv27);
			append(__nsh_hv25, __nsh_hv26);
			return __nsh_hv25;
		})(), __nsh_hv28);
		append(__nsh_hv20, __nsh_hv21);
		append(__nsh_hv20, __nsh_hv22);
		append(__nsh_hv20, __nsh_hv23);
		append(__nsh_hv20, __nsh_hv24);
		return __nsh_hv20;
	})();
}
function ScanPanel(props) {
	return (() => {
		const __nsh_hv31 = element("view");
		prop(__nsh_hv31, "class", "w-full rounded-[12px] p-4");
		bindProp(__nsh_hv31, "style", () => ({ backgroundColor: props.colors.background }));
		const __nsh_hv32 = element("view");
		prop(__nsh_hv32, "class", "flex-row items-center justify-between");
		const __nsh_hv33 = element("text");
		prop(__nsh_hv33, "class", "text-[13px]");
		bindProp(__nsh_hv33, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv33, () => scanStage());
		const __nsh_hv34 = element("text");
		prop(__nsh_hv34, "class", "text-[11px]");
		bindProp(__nsh_hv34, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv34, () => `${gameLibrary.scanProgress()?.found ?? 0} игр`);
		append(__nsh_hv32, __nsh_hv33);
		append(__nsh_hv32, __nsh_hv34);
		const __nsh_hv35 = element("view");
		prop(__nsh_hv35, "class", "mt-3 h-1 overflow-hidden rounded");
		bindProp(__nsh_hv35, "style", () => ({ backgroundColor: props.colors.border }));
		const __nsh_hv36 = element("view");
		prop(__nsh_hv36, "class", "h-full rounded");
		bindProp(__nsh_hv36, "style", () => ({
			width: `${scanPercent()}%`,
			backgroundColor: props.colors.accent
		}));
		append(__nsh_hv35, __nsh_hv36);
		const __nsh_hv37 = element("text");
		prop(__nsh_hv37, "class", "mt-3 text-[11px]");
		bindProp(__nsh_hv37, "style", () => ({ color: props.colors.muted }));
		const __nsh_hv38 = text("Дальше покажем найденное по одной игре — добавить или пропустить");
		append(__nsh_hv37, __nsh_hv38);
		append(__nsh_hv31, __nsh_hv32);
		append(__nsh_hv31, __nsh_hv35);
		append(__nsh_hv31, __nsh_hv37);
		return __nsh_hv31;
	})();
}
function reviewing() {
	return gameLibrary.scanState() !== "scanning" && gameLibrary.deck().length > 0;
}
function settled() {
	return gameLibrary.reviewDone() && gameLibrary.deck().length === 0;
}
function menuHint() {
	if (gameLibrary.scanState() === "error") return gameLibrary.scanError();
	return gameLibrary.importError();
}
function AddGamesDialog(props) {
	return component(Modal, {
		title: "Добавить игры",
		get colors() {
			return props.colors;
		},
		get onDismiss() {
			return gameLibrary.closeAddDialog;
		},
		width: DIALOG_WIDTH,
		get children() {
			return gameLibrary.scanState() === "scanning" ? component(ScanPanel, { get colors() {
				return props.colors;
			} }) : reviewing() ? component(ReviewCard, { get colors() {
				return props.colors;
			} }) : settled() ? component(ReviewSummary, { get colors() {
				return props.colors;
			} }) : (() => {
				const __nsh_hv39 = element("view");
				prop(__nsh_hv39, "class", "w-full");
				insert(__nsh_hv39, [
					component(Action, {
						get colors() {
							return props.colors;
						},
						icon: "search",
						title: "Найти автоматически",
						hint: "Поиск установленных игр",
						get onPress() {
							return gameLibrary.scanAutomatically;
						}
					}),
					component(Action, {
						get colors() {
							return props.colors;
						},
						icon: "folder",
						title: "Просканировать папку",
						hint: "Выбрать exe из папки игры",
						onPress: () => {
							gameLibrary.beginManualAdd();
							runAfterPress(props.onBrowseFolder);
						}
					}),
					component(Action, {
						get colors() {
							return props.colors;
						},
						icon: "file",
						title: "Выбрать exe",
						hint: "Один файл",
						onPress: () => {
							gameLibrary.beginManualAdd();
							runAfterPress(props.onBrowse);
						}
					}),
					() => menuHint() ? (() => {
						const __nsh_hv40 = element("text");
						prop(__nsh_hv40, "class", "mt-2 px-2 text-[11px]");
						bindProp(__nsh_hv40, "style", () => ({ color: props.colors.muted }));
						insert(__nsh_hv40, () => menuHint());
						return __nsh_hv40;
					})() : null
				]);
				return __nsh_hv39;
			})();
		}
	});
}

//#endregion
//#region game-confirm.tsx
function sourceLabel(source) {
	if (source === "steam") return "Steam";
	if (source === "epic") return "Epic Games";
	if (source === "gog") return "GOG";
	if (source === "folder") return "Папка игры";
	return "Выбрано вручную";
}
function ConfirmGameDialog(props) {
	const pending = gameLibrary.pendingAdd();
	if (!pending) return (() => {
		return element("view");
	})();
	const footer = (() => {
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "flex-row items-center justify-between");
		prop(__nsh_hv1, "style", { gap: 8 });
		insert(__nsh_hv1, [component(Button, {
			label: "Назад",
			get colors() {
				return props.colors;
			},
			get onPress() {
				return gameLibrary.cancelConfirm;
			},
			className: "border-0 px-0 py-0",
			style: {
				backgroundColor: "transparent",
				borderColor: "transparent"
			}
		}), component(Button, {
			label: "Добавить",
			get colors() {
				return props.colors;
			},
			get onPress() {
				return gameLibrary.confirmAdd;
			},
			selected: true,
			className: "h-9 items-center justify-center px-3 py-0",
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
		return __nsh_hv1;
	})();
	return component(Modal, {
		title: "Добавить игру",
		get colors() {
			return props.colors;
		},
		get onDismiss() {
			return gameLibrary.cancelConfirm;
		},
		get onBack() {
			return gameLibrary.cancelConfirm;
		},
		width: 460,
		footer,
		get children() {
			return [
				(() => {
					const __nsh_hv2 = element("text");
					prop(__nsh_hv2, "class", "mb-2 text-[12px]");
					bindProp(__nsh_hv2, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv3 = text("Поправь название, если угадалось неверно.");
					append(__nsh_hv2, __nsh_hv3);
					return __nsh_hv2;
				})(),
				(() => {
					const __nsh_hv4 = element("input");
					bindProp(__nsh_hv4, "value", () => pending.title);
					bindProp(__nsh_hv4, "onChange", () => gameLibrary.editPendingTitle);
					prop(__nsh_hv4, "accessibilityLabel", "Название игры");
					prop(__nsh_hv4, "class", "h-10 rounded-[10px] px-3 text-[13px]");
					bindProp(__nsh_hv4, "style", () => ({
						backgroundColor: props.colors.background,
						color: props.colors.foreground
					}));
					return __nsh_hv4;
				})(),
				(() => {
					const __nsh_hv5 = element("view");
					prop(__nsh_hv5, "class", "mt-3 rounded-[10px] p-3");
					bindProp(__nsh_hv5, "style", () => ({ backgroundColor: props.colors.background }));
					const __nsh_hv6 = element("text");
					prop(__nsh_hv6, "class", "text-[11px]");
					bindProp(__nsh_hv6, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv7 = text("Запускается");
					append(__nsh_hv6, __nsh_hv7);
					const __nsh_hv8 = element("text");
					prop(__nsh_hv8, "class", "mt-1 text-[12px]");
					bindProp(__nsh_hv8, "style", () => ({ color: props.colors.foreground }));
					insert(__nsh_hv8, () => pending.path);
					const __nsh_hv9 = element("text");
					prop(__nsh_hv9, "class", "mt-2 text-[11px]");
					bindProp(__nsh_hv9, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv10 = text("Источник · ");
					append(__nsh_hv9, __nsh_hv10);
					insert(__nsh_hv9, () => sourceLabel(pending.source));
					append(__nsh_hv5, __nsh_hv6);
					append(__nsh_hv5, __nsh_hv8);
					append(__nsh_hv5, __nsh_hv9);
					return __nsh_hv5;
				})(),
				(() => {
					const __nsh_hv11 = element("text");
					prop(__nsh_hv11, "class", "mt-3 text-[11px] leading-[17px]");
					bindProp(__nsh_hv11, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv12 = text("После добавления игра появится сразу; метаданные и горизонтальная обложка загрузятся в фоне. Если источники не найдут игру, её можно дополнить вручную.");
					append(__nsh_hv11, __nsh_hv12);
					return __nsh_hv11;
				})()
			];
		}
	});
}

//#endregion
//#region game-details.tsx
const imageSource = signal("");
function xml(text) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
function placeholder(title) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="430" viewBox="0 0 920 430"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#18212f"/><stop offset=".55" stop-color="#493a70"/><stop offset="1" stop-color="#a65951"/></linearGradient></defs><rect width="920" height="430" fill="url(#g)"/><circle cx="780" cy="80" r="240" fill="#fff" opacity=".06"/><text x="46" y="350" fill="#fff" font-family="sans-serif" font-size="42" font-weight="600">${xml(title.trim().slice(0, 42) || "Игра")}</text></svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
function Artwork(props) {
	const height = props.height ?? 215;
	return (() => {
		const __nsh_hv0 = element("image");
		bindProp(__nsh_hv0, "src", () => props.path || placeholder(props.title));
		prop(__nsh_hv0, "style", {
			width: "100%",
			height
		});
		return __nsh_hv0;
	})();
}
function metadataStatus(card) {
	if (card.metadataStatus === "loading") return "Метаданные загружаются…";
	if (card.metadataStatus === "not-found") return "Источник не нашёл метаданные — можно добавить картинку вручную";
	if (card.metadataStatus === "error") return "Не удалось загрузить метаданные";
	return "";
}
function GameDetailsDialog(props) {
	const genres = props.card.genres?.join(" · ") || "Жанры неизвестны";
	const developers = props.card.developers?.join(" · ") || "неизвестен";
	const publishers = props.card.publishers?.join(" · ") || "неизвестен";
	const footer = (() => {
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "flex-row items-center justify-between");
		prop(__nsh_hv1, "style", { gap: 10 });
		const __nsh_hv2 = element("input");
		bindProp(__nsh_hv2, "value", () => imageSource());
		prop(__nsh_hv2, "onChange", (value) => imageSource.set(value));
		prop(__nsh_hv2, "placeholder", "URL или путь к картинке");
		prop(__nsh_hv2, "accessibilityLabel", "URL или путь к своей картинке");
		prop(__nsh_hv2, "class", "h-9 min-w-0 flex-1 rounded-lg px-3 text-[12px]");
		bindProp(__nsh_hv2, "style", () => ({
			backgroundColor: props.colors.background,
			color: props.colors.foreground
		}));
		append(__nsh_hv1, __nsh_hv2);
		insert(__nsh_hv1, component(Button, {
			label: "Сохранить",
			get colors() {
				return props.colors;
			},
			onPress: () => {
				const source = imageSource().trim();
				if (source) props.onSetImage(source);
			},
			className: "h-9 items-center justify-center px-3 py-0"
		}));
		return __nsh_hv1;
	})();
	return component(Modal, {
		get title() {
			return props.card.title;
		},
		get colors() {
			return props.colors;
		},
		get onDismiss() {
			return props.onClose;
		},
		width: 520,
		footer,
		get children() {
			return [
				component(Artwork, {
					get title() {
						return props.card.title;
					},
					get path() {
						return props.card.headerImagePath;
					}
				}),
				(() => {
					const __nsh_hv3 = element("text");
					prop(__nsh_hv3, "class", "mt-3 text-[12px]");
					bindProp(__nsh_hv3, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv4 = text("Разработчик: ");
					const __nsh_hv5 = text(" · издатель: ");
					append(__nsh_hv3, __nsh_hv4);
					append(__nsh_hv3, __nsh_hv5);
					insert(__nsh_hv3, developers, __nsh_hv5);
					insert(__nsh_hv3, publishers);
					return __nsh_hv3;
				})(),
				() => metadataStatus(props.card) && (() => {
					const __nsh_hv6 = element("text");
					prop(__nsh_hv6, "class", "mt-1 text-[11px]");
					bindProp(__nsh_hv6, "style", () => ({ color: props.colors.muted }));
					insert(__nsh_hv6, () => metadataStatus(props.card));
					return __nsh_hv6;
				})(),
				(() => {
					const __nsh_hv7 = element("text");
					prop(__nsh_hv7, "class", "mt-2 text-[12px]");
					bindProp(__nsh_hv7, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv8 = text(" · ");
					append(__nsh_hv7, __nsh_hv8);
					insert(__nsh_hv7, genres, __nsh_hv8);
					insert(__nsh_hv7, () => props.card.releaseDateText || props.card.released || "дата выхода неизвестна");
					return __nsh_hv7;
				})(),
				() => props.card.description && (() => {
					const __nsh_hv9 = element("text");
					prop(__nsh_hv9, "class", "mt-3 text-[12px] leading-[18px]");
					bindProp(__nsh_hv9, "style", () => ({ color: props.colors.foreground }));
					insert(__nsh_hv9, () => props.card.description);
					return __nsh_hv9;
				})(),
				(() => {
					const __nsh_hv10 = element("text");
					prop(__nsh_hv10, "class", "mt-3 text-[11px]");
					bindProp(__nsh_hv10, "style", () => ({ color: props.colors.muted }));
					const __nsh_hv11 = text("Можно вставить URL изображения или путь к локальному файлу.");
					append(__nsh_hv10, __nsh_hv11);
					return __nsh_hv10;
				})()
			];
		}
	});
}
function MetadataChoicesDialog(props) {
	return component(Modal, {
		get title() {
			return `Выбери версию игры: ${props.choices.title}`;
		},
		get colors() {
			return props.colors;
		},
		get onDismiss() {
			return props.onClose;
		},
		width: 520,
		get children() {
			return [(() => {
				const __nsh_hv12 = element("text");
				prop(__nsh_hv12, "class", "mb-3 text-[12px]");
				bindProp(__nsh_hv12, "style", () => ({ color: props.colors.muted }));
				const __nsh_hv13 = text("Нашлось несколько похожих игр. Выбор привяжет подходящие метаданные.");
				append(__nsh_hv12, __nsh_hv13);
				return __nsh_hv12;
			})(), (() => {
				const __nsh_hv14 = element("view");
				prop(__nsh_hv14, "class", "flex-col");
				prop(__nsh_hv14, "style", { gap: 8 });
				insert(__nsh_hv14, () => props.choices.candidates.slice(0, 5).map((candidate) => (() => {
					const __nsh_hv15 = element("view");
					prop(__nsh_hv15, "onPress", () => props.onChoose(candidate));
					prop(__nsh_hv15, "role", "button");
					bindProp(__nsh_hv15, "accessibilityLabel", () => `Выбрать ${candidate.name}`);
					prop(__nsh_hv15, "class", "h-[76px] flex-row items-center overflow-hidden rounded-[10px] border px-2");
					bindProp(__nsh_hv15, "style", () => ({
						gap: 10,
						borderColor: props.colors.border,
						backgroundColor: props.colors.background
					}));
					const __nsh_hv16 = element("image");
					bindProp(__nsh_hv16, "src", () => candidate.headerImagePath || placeholder(candidate.name));
					prop(__nsh_hv16, "style", {
						width: 132,
						height: 62
					});
					const __nsh_hv17 = element("text");
					prop(__nsh_hv17, "class", "min-w-0 flex-1 text-[13px]");
					bindProp(__nsh_hv17, "style", () => ({ color: props.colors.foreground }));
					insert(__nsh_hv17, () => candidate.name);
					append(__nsh_hv15, __nsh_hv16);
					append(__nsh_hv15, __nsh_hv17);
					return __nsh_hv15;
				})()));
				return __nsh_hv14;
			})()];
		}
	});
}

//#endregion
//#region games.tsx
const emptyExtensions = { games: true };
const gamesOn = signal(true);
const livePrograms = signal([]);
const searchQuery = signal("");
const fromDrop = signal(false);
const selectedGameId = signal(null);
let extensionsStamp = 0;
const extensionsKey = "mundus.atlas.extensions.v1";
function loadGamePrefs() {
	const extensionsAt = extensionsStamp;
	Storage.getItem(extensionsKey).then((value) => {
		if (extensionsAt !== extensionsStamp) return;
		const saved = readJson(value, emptyExtensions);
		gamesOn.set(saved.games !== false);
	});
}
function readJson(value, fallback) {
	if (!value) return fallback;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}
function saveExtensions(next) {
	extensionsStamp += 1;
	gamesOn.set(next.games);
	Storage.setItem(extensionsKey, JSON.stringify(next));
}
function pathFromDrop(uri) {
	return decodeURIComponent(uri).replace(/^file:\/*(?=[A-Za-z]:)/, "").replace(/^file:\/\//, "").replaceAll("/", "\\");
}
function usageFor(path, programs) {
	const key = path.replaceAll("/", "\\").toLowerCase();
	const file = key.split("\\").pop() ?? "";
	const stem = file.replace(/\.exe$/i, "").replace(/\.lnk$/i, "");
	return programs.find((program) => {
		const process = program.process.toLowerCase();
		return program.path.replaceAll("/", "\\").toLowerCase() === key || process === file || process === stem || process === `${stem}.exe`;
	});
}
function visibleCards() {
	return visibleGameCards(gameLibrary.cards(), searchQuery());
}
function formatTime(ms) {
	const minutes = Math.floor(ms / 6e4);
	if (minutes < 1) return "меньше минуты";
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return hours < 1 ? `${rest} мин` : rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
function GamesLibrary(props) {
	effect(() => {
		const picked = props.pickedExes;
		if (!picked.length) return;
		gameLibrary.closeAddDialog();
		if (picked.length !== 1) return;
		gameLibrary.beginConfirm(picked[0], props.pickSource, !fromDrop());
		fromDrop.set(false);
		props.onClearPick();
	});
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "flex-1");
		prop(__nsh_hv0, "onFileDrop", (event) => {
			const path = pathFromDrop(event.uris[0] ?? "");
			if (path) {
				fromDrop.set(true);
				props.onPick(path);
			}
		});
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "flex-row items-center px-7 pt-3");
		const __nsh_hv2 = element("input");
		bindProp(__nsh_hv2, "value", () => searchQuery());
		prop(__nsh_hv2, "onChange", (value) => searchQuery.set(value));
		prop(__nsh_hv2, "placeholder", "Поиск игр");
		prop(__nsh_hv2, "accessibilityLabel", "Поиск игр");
		prop(__nsh_hv2, "class", "h-9 min-w-0 flex-1 rounded-lg px-3 text-[13px]");
		bindProp(__nsh_hv2, "style", () => ({
			backgroundColor: props.colors.card,
			color: props.colors.foreground,
			placeholderColor: props.colors.muted
		}));
		append(__nsh_hv1, __nsh_hv2);
		append(__nsh_hv0, __nsh_hv1);
		insert(__nsh_hv0, [
			() => gameLibrary.launchError() && (() => {
				const __nsh_hv3 = element("text");
				prop(__nsh_hv3, "class", "px-7 pt-2 text-[11px]");
				bindProp(__nsh_hv3, "style", () => ({ color: props.colors.muted }));
				insert(__nsh_hv3, () => gameLibrary.launchError());
				return __nsh_hv3;
			})(),
			() => visibleCards().length === 0 && (() => {
				const __nsh_hv4 = element("view");
				prop(__nsh_hv4, "class", "flex-1 items-center justify-center px-7");
				const __nsh_hv5 = element("text");
				prop(__nsh_hv5, "class", "mb-2 text-[14px]");
				bindProp(__nsh_hv5, "style", () => ({ color: props.colors.muted }));
				insert(__nsh_hv5, () => searchQuery().trim() ? "Игры не найдены" : gameLibrary.libraryState() === "loading" ? "Загружаем библиотеку игр…" : gameLibrary.libraryState() === "error" ? "Не удалось загрузить библиотеку" : "Игр пока нет");
				const __nsh_hv6 = element("text");
				prop(__nsh_hv6, "class", "text-center text-[12px]");
				bindProp(__nsh_hv6, "style", () => ({ color: props.colors.muted }));
				insert(__nsh_hv6, () => gameLibrary.error() || "Нажми + в заголовке, чтобы найти игры или добавить exe вручную");
				append(__nsh_hv4, __nsh_hv5);
				append(__nsh_hv4, __nsh_hv6);
				return __nsh_hv4;
			})(),
			each(() => visibleCards(), (card) => {
				const item = card();
				const usage = usageFor(item.exePath, livePrograms());
				const byline = item.metadataStatus === "loading" ? "Загружаем метаданные…" : item.developers?.join(" · ") || item.genres?.slice(0, 2).join(" · ");
				return (() => {
					const __nsh_hv7 = element("view");
					prop(__nsh_hv7, "class", "mx-7 h-14 flex-row items-center border-b");
					bindProp(__nsh_hv7, "style", () => ({ borderColor: props.colors.border }));
					const __nsh_hv8 = element("view");
					prop(__nsh_hv8, "onPress", () => selectedGameId.set(item.id));
					prop(__nsh_hv8, "role", "button");
					bindProp(__nsh_hv8, "accessibilityLabel", () => `Подробнее: ${item.title}`);
					prop(__nsh_hv8, "class", "min-w-0 flex-1");
					const __nsh_hv9 = element("text");
					prop(__nsh_hv9, "class", "text-[14px]");
					bindProp(__nsh_hv9, "style", () => ({ color: props.colors.foreground }));
					insert(__nsh_hv9, () => item.title);
					const __nsh_hv10 = element("text");
					prop(__nsh_hv10, "class", "text-[12px]");
					bindProp(__nsh_hv10, "style", () => ({ color: props.colors.muted }));
					insert(__nsh_hv10, () => byline || (usage ? `${formatTime(usage.foregroundMs)} · ${usage.sessions} сесс.` : "Время ещё не посчитано"));
					append(__nsh_hv8, __nsh_hv9);
					append(__nsh_hv8, __nsh_hv10);
					append(__nsh_hv7, __nsh_hv8);
					insert(__nsh_hv7, component(Button, {
						label: "Запустить",
						get colors() {
							return props.colors;
						},
						onPress: () => props.onLaunch(item.exePath),
						className: "border-0 px-0 py-0",
						style: {
							backgroundColor: "transparent",
							borderColor: "transparent"
						}
					}));
					return __nsh_hv7;
				})();
			}),
			() => gameLibrary.pendingAdd() ? component(ConfirmGameDialog, { get colors() {
				return props.colors;
			} }) : gameLibrary.addOpen() && component(AddGamesDialog, {
				get colors() {
					return props.colors;
				},
				get onBrowse() {
					return props.onBrowse;
				},
				get onBrowseFolder() {
					return props.onBrowseFolder;
				}
			}),
			() => props.pickedExes.length > 1 && component(Modal, {
				title: "Какой файл запускать",
				get colors() {
					return props.colors;
				},
				get onDismiss() {
					return props.onClearPick;
				},
				get children() {
					return [() => props.pickedExes.map((path) => component(Button, {
						get label() {
							return guessTitle(path);
						},
						get colors() {
							return props.colors;
						},
						onPress: () => {
							gameLibrary.beginConfirm(path, props.pickSource, true);
							props.onClearPick();
						},
						className: "border-0 px-0 py-0",
						style: {
							backgroundColor: "transparent",
							borderColor: "transparent"
						}
					})), component(Button, {
						label: "Отмена",
						get colors() {
							return props.colors;
						},
						get onPress() {
							return props.onClearPick;
						},
						className: "mt-3 border-0 px-0 py-0",
						style: {
							backgroundColor: "transparent",
							borderColor: "transparent"
						}
					})];
				}
			}),
			() => selectedGameId() && gameLibrary.cards().find((card) => card.id === selectedGameId()) && component(GameDetailsDialog, {
				get card() {
					return gameLibrary.cards().find((card) => card.id === selectedGameId());
				},
				get colors() {
					return props.colors;
				},
				onClose: () => selectedGameId.set(null),
				onSetImage: (source) => {
					const card = gameLibrary.cards().find((item) => item.id === selectedGameId());
					if (card) gameLibrary.setImage(card.exePath, source);
				}
			}),
			() => !selectedGameId() && gameLibrary.metadataChoices() && component(MetadataChoicesDialog, {
				get choices() {
					return gameLibrary.metadataChoices();
				},
				get colors() {
					return props.colors;
				},
				get onChoose() {
					return gameLibrary.chooseMetadata;
				},
				onClose: () => gameLibrary.metadataChoices.set(null)
			})
		]);
		return __nsh_hv0;
	})();
}
function ExtensionsPage(props) {
	return (() => {
		const __nsh_hv11 = element("view");
		prop(__nsh_hv11, "class", "px-7 pt-6");
		const __nsh_hv12 = element("text");
		prop(__nsh_hv12, "class", "mb-3 text-[13px]");
		bindProp(__nsh_hv12, "style", () => ({ color: props.colors.foreground }));
		const __nsh_hv13 = text("Расширения");
		append(__nsh_hv12, __nsh_hv13);
		const __nsh_hv14 = element("text");
		prop(__nsh_hv14, "class", "mt-2 text-[12px]");
		bindProp(__nsh_hv14, "style", () => ({ color: props.colors.muted }));
		const __nsh_hv15 = text("Выключение прячет страницу. Записи остаются");
		append(__nsh_hv14, __nsh_hv15);
		append(__nsh_hv11, __nsh_hv12);
		append(__nsh_hv11, __nsh_hv14);
		insert(__nsh_hv11, component(Button, {
			get label() {
				return gamesOn() ? "Расширение Игры: включено" : "Расширение Игры";
			},
			get colors() {
				return props.colors;
			},
			onPress: () => saveExtensions({ games: !gamesOn() }),
			className: "border-0 px-0 py-0",
			style: {
				backgroundColor: "transparent",
				borderColor: "transparent"
			}
		}), __nsh_hv14);
		return __nsh_hv11;
	})();
}
function GamesSettings(props) {
	return (() => {
		const __nsh_hv16 = element("view");
		prop(__nsh_hv16, "class", "px-7 pt-6");
		const __nsh_hv17 = element("text");
		prop(__nsh_hv17, "class", "mb-2 text-[13px]");
		bindProp(__nsh_hv17, "style", () => ({ color: props.colors.foreground }));
		const __nsh_hv18 = text("Игры");
		append(__nsh_hv17, __nsh_hv18);
		const __nsh_hv19 = element("text");
		prop(__nsh_hv19, "class", "mb-4 text-[12px]");
		bindProp(__nsh_hv19, "style", () => ({ color: props.colors.muted }));
		const __nsh_hv20 = text("Метаданные игр и обложки загружаются без ключей и кэшируются в каталоге данных Engine.");
		append(__nsh_hv19, __nsh_hv20);
		const __nsh_hv21 = element("text");
		prop(__nsh_hv21, "class", "text-[12px]");
		bindProp(__nsh_hv21, "style", () => ({ color: props.colors.muted }));
		const __nsh_hv22 = text("Источники и порядок загрузки задаются в game-metadata.json.");
		append(__nsh_hv21, __nsh_hv22);
		append(__nsh_hv16, __nsh_hv17);
		append(__nsh_hv16, __nsh_hv19);
		append(__nsh_hv16, __nsh_hv21);
		return __nsh_hv16;
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
//#region App.tsx
setup(null, "{\n  \"cssVars\": {\n    \"theme\": {\n      \"font-sans\": \"Inter, sans-serif\",\n      \"radius\": \"0.625rem\",\n      \"radius-control\": \"0.5rem\",\n      \"spacing-sidebar\": \"240px\",\n      \"spacing-titlebar\": \"40px\",\n      \"spacing-row\": \"32px\",\n      \"font-size-body\": \"13px\",\n      \"font-size-label\": \"12px\"\n    },\n    \"light\": {\n      \"background\": \"#faf9fb\",\n      \"foreground\": \"#26242a\",\n      \"card\": \"#f2f0f4\",\n      \"card-foreground\": \"#26242a\",\n      \"muted\": \"#ece9ef\",\n      \"muted-foreground\": \"#77727e\",\n      \"primary\": \"#7152bf\",\n      \"primary-foreground\": \"#ffffff\",\n      \"border\": \"#dedbe2\",\n      \"input\": \"#dedbe2\",\n      \"ring\": \"#b18aff\"\n    },\n    \"dark\": {\n      \"background\": \"#0d0c10\",\n      \"foreground\": \"#e7e5ea\",\n      \"card\": \"#131216\",\n      \"card-foreground\": \"#e7e5ea\",\n      \"muted\": \"#27262a\",\n      \"muted-foreground\": \"#8d8a94\",\n      \"primary\": \"#af94f9\",\n      \"primary-foreground\": \"#0d0c10\",\n      \"border\": \"#27262a\",\n      \"input\": \"#27262a\",\n      \"ring\": \"#af94f9\"\n    }\n  }\n}\n", null, null);
const initialValue = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__") ?? host.params.atlas;
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
const snapshot = signal(initial);
const route = signal(initial.route);
const addTaskOpen = signal(false);
const newTaskTitle = signal("");
const sidebarVisible = signal(true);
const voiceRecording = signal(false);
const voiceLevel = signal(0);
const voiceElapsed = signal(0);
const voicePlaying = signal(null);
let voiceStartedAt = 0;
const pickedExes = signal([]);
const pickSource = signal("manual");
loadGamePrefs();
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
	props: ["route"],
	events: [
		"state",
		"navigate",
		"journal",
		"voiceLevel",
		"voiceRecorded",
		"voicePlayed",
		"voiceFailed",
		"usage",
		"picked",
		"games",
		"discovered",
		"imported",
		"launched",
		"metadata"
	]
});
function iconForNavigation(id) {
	switch (id) {
		case "journal": return "logbook";
		case "tasks": return "week";
		case "games": return "gamepad";
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
function createVoiceJournal(voice, id) {
	markJournalArriving(id);
	askEngine("journal.createVoice", {
		text: "",
		voice
	});
	snapshot.set({
		...snapshot(),
		journalEntries: [...snapshot().journalEntries, {
			id,
			text: "",
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			voice
		}]
	});
	persistPreviewSnapshot();
}
function startRecording() {
	if (voiceRecording()) return;
	voicePlaying.set(null);
	voiceLevel.set(0);
	voiceElapsed.set(0);
	voiceStartedAt = Date.now();
	voiceRecording.set(true);
	askEngine("voice.start");
	const timer = setInterval(() => {
		if (!voiceRecording()) return;
		voiceElapsed.set(Date.now() - voiceStartedAt);
	}, 50);
	stopVoiceTicker = () => clearInterval(timer);
}
let stopVoiceTicker = null;
function stopRecording() {
	if (!voiceRecording()) return;
	askEngine("voice.stop");
}
function playVoice(entry) {
	if (!entry.voice) return;
	if (voicePlaying() === entry.id) {
		askEngine("voice.pause");
		voicePlaying.set(null);
		return;
	}
	voicePlaying.set(entry.id);
	askEngine("voice.play", { data: entry.voice.data });
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
function SettingsPage() {
	return (() => {
		const __nsh_hv8 = element("view");
		insert(__nsh_hv8, [
			component(AtlasAppearanceSettings, {
				appearance: () => snapshot().appearance,
				editable: () => snapshot().appearanceEditable,
				colors: () => snapshot().colors,
				get shortcuts() {
					return shortcuts();
				},
				onPatch: setAppearance,
				onChangeShortcut: cycleShortcut
			}),
			component(ExtensionsPage, { get colors() {
				return snapshot().colors;
			} }),
			() => gamesOn() && component(GamesSettings, { get colors() {
				return snapshot().colors;
			} })
		]);
		return __nsh_hv8;
	})();
}
function App() {
	effect(() => Window.setTitleBar({
		style: "hidden",
		height: 38
	}));
	const primaryNavigation = navigation_default.filter((item) => !item.footer && (item.id !== "games" || gamesOn()));
	const footerNavigation = navigation_default.filter((item) => item.footer);
	const openNewTask = () => {
		newTaskTitle.set("");
		addTaskOpen.set(true);
	};
	const shell = snapshot().chrome === "tsx";
	const dark = snapshot().appearance?.settings.mode !== "light";
	const changeRoute = (target) => {
		if (!isRoute(target)) return;
		if (target !== "journal" && journalCalendarOpen()) toggleJournalCalendar();
		route.set(target);
	};
	return (() => {
		const __nsh_hv9 = element("view");
		prop(__nsh_hv9, "class", "relative h-full w-full");
		bindProp(__nsh_hv9, "style", () => ({ backgroundColor: snapshot().colors.background }));
		const __nsh_hv10 = element("view");
		prop(__nsh_hv10, "class", "h-full w-full flex-row");
		const __nsh_hv15 = element("view");
		prop(__nsh_hv15, "class", "relative min-h-0 min-w-0 flex-1");
		insert(__nsh_hv15, [
			() => route() === "journal" && component(JournalPage, {
				entries: () => snapshot().journalEntries,
				get colors() {
					return snapshot().colors;
				},
				onCreate: createJournal,
				onUpdate: updateJournal,
				onDelete: deleteJournal,
				recording: voiceRecording,
				level: voiceLevel,
				elapsed: voiceElapsed,
				playing: voicePlaying,
				onStartRecording: startRecording,
				onStopRecording: stopRecording,
				onPlayVoice: playVoice,
				get nativeCalendarButton() {
					return snapshot().chrome === "native";
				},
				titlebarInset: shell ? 38 : 0,
				dark
			}),
			() => route() === "tasks" && (() => {
				const __nsh_hv16 = element("view");
				prop(__nsh_hv16, "class", "min-h-0 flex-1");
				insert(__nsh_hv16, [component(TaskPage, {}), () => shell && (() => {
					const __nsh_hv17 = element("view");
					prop(__nsh_hv17, "onPress", openNewTask);
					prop(__nsh_hv17, "role", "button");
					prop(__nsh_hv17, "accessibilityLabel", "Новая задача");
					prop(__nsh_hv17, "class", "absolute items-center justify-center rounded-full");
					prop(__nsh_hv17, "hoverStyle", { opacity: .85 });
					bindProp(__nsh_hv17, "style", () => ({
						right: 16,
						bottom: 16,
						width: 32,
						height: 32,
						backgroundColor: snapshot().colors.foreground,
						cursor: "pointer"
					}));
					insert(__nsh_hv17, component(Icon, {
						name: "plus",
						size: 16,
						get color() {
							return snapshot().colors.background;
						}
					}));
					return __nsh_hv17;
				})()]);
				return __nsh_hv16;
			})(),
			() => route() === "games" && gamesOn() && (() => {
				const __nsh_hv18 = element("view");
				prop(__nsh_hv18, "class", "min-h-0 flex-1");
				prop(__nsh_hv18, "style", { paddingTop: shell ? 38 : 0 });
				insert(__nsh_hv18, component(GamesLibrary, {
					get colors() {
						return snapshot().colors;
					},
					get pickedExes() {
						return pickedExes();
					},
					get pickSource() {
						return pickSource();
					},
					onPick: (path) => askEngine("games.pick", { path }),
					onBrowse: () => {
						pickSource.set("manual");
						askEngine("games.browse");
					},
					onBrowseFolder: () => {
						pickSource.set("folder");
						askEngine("games.browse-folder");
					},
					onLaunch: (path) => askEngine("games.launch", { path }),
					onClearPick: () => {
						pickedExes.set([]);
						askEngine("games.clear-pick");
					}
				}));
				return __nsh_hv18;
			})(),
			() => route() === "settings" && (() => {
				const __nsh_hv19 = element("view");
				prop(__nsh_hv19, "class", "min-h-0 flex-1");
				prop(__nsh_hv19, "style", { paddingTop: shell ? 38 : 0 });
				insert(__nsh_hv19, component(SettingsPage, {}));
				return __nsh_hv19;
			})(),
			() => addTaskOpen() && component(Modal, {
				title: "Новая задача",
				get colors() {
					return snapshot().colors;
				},
				onDismiss: () => addTaskOpen.set(false),
				get footer() {
					return (() => {
						const __nsh_hv20 = element("view");
						prop(__nsh_hv20, "class", "flex-row items-center justify-end");
						prop(__nsh_hv20, "style", { gap: 8 });
						insert(__nsh_hv20, [component(ModalGhost, {
							label: "Отмена",
							get colors() {
								return snapshot().colors;
							},
							onPress: () => addTaskOpen.set(false)
						}), component(Button, {
							label: "Добавить",
							get colors() {
								return snapshot().colors;
							},
							onPress: () => {
								createTodo(newTaskTitle());
								addTaskOpen.set(false);
							},
							selected: true,
							className: "h-9 items-center justify-center px-3 py-0",
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
						return __nsh_hv20;
					})();
				},
				get children() {
					return (() => {
						const __nsh_hv21 = element("input");
						bindProp(__nsh_hv21, "value", () => newTaskTitle());
						prop(__nsh_hv21, "onChange", (value) => newTaskTitle.set(value));
						prop(__nsh_hv21, "onSubmit", (event) => {
							createTodo(event.text);
							addTaskOpen.set(false);
						});
						prop(__nsh_hv21, "placeholder", "Название задачи");
						prop(__nsh_hv21, "accessibilityLabel", "Название задачи");
						prop(__nsh_hv21, "class", "h-10 rounded-lg px-3 text-[13px]");
						bindProp(__nsh_hv21, "style", () => ({
							backgroundColor: snapshot().colors.background,
							color: snapshot().colors.foreground
						}));
						return __nsh_hv21;
					})();
				}
			})
		]);
		append(__nsh_hv10, __nsh_hv15);
		insert(__nsh_hv10, () => shell && (() => {
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "class", "h-full shrink-0 overflow-hidden");
			bindProp(__nsh_hv11, "style", () => ({ width: sidebarPaneWidth() }));
			const __nsh_hv12 = element("view");
			prop(__nsh_hv12, "class", "box-border h-full");
			bindProp(__nsh_hv12, "style", () => ({
				width: 282,
				paddingTop: 38 + 8,
				paddingBottom: 16,
				paddingLeft: 8,
				paddingRight: 8,
				backgroundColor: shellFill(snapshot().colors, dark)
			}));
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "style", { gap: 2 });
			insert(__nsh_hv13, () => primaryNavigation.map((item) => component(SidebarRow, {
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
			const __nsh_hv14 = element("view");
			prop(__nsh_hv14, "class", "mt-auto mb-2");
			prop(__nsh_hv14, "style", { gap: 2 });
			insert(__nsh_hv14, () => footerNavigation.map((item) => component(SidebarRow, {
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
			append(__nsh_hv12, __nsh_hv13);
			append(__nsh_hv12, __nsh_hv14);
			append(__nsh_hv11, __nsh_hv12);
			return __nsh_hv11;
		})(), __nsh_hv15);
		append(__nsh_hv9, __nsh_hv10);
		insert(__nsh_hv9, component(Bridge, {
			class: "absolute left-0 top-0 h-px w-px",
			ref: (node) => {
				commandRef = (name, args) => node.command(name, args);
				gameLibrary.bindCommand((name, args) => node.command(name, args));
			},
			get route() {
				return route();
			},
			onState: (next) => {
				route.set(next.route);
				const appearance = next.appearance ?? snapshot().appearance;
				snapshot.set({
					...next,
					themes: previewThemes,
					journalEntries: snapshot().journalEntries,
					sidebarVisible: sidebarVisible(),
					colors: appearance ? resolveAppearanceColors(appearance, previewThemes, next.colors) : next.colors
				});
			},
			onJournal: (entries) => snapshot.set({
				...snapshot(),
				journalEntries: entries
			}),
			onVoiceLevel: (event) => voiceLevel.set(event.level),
			onVoiceRecorded: (voice) => {
				voiceRecording.set(false);
				stopVoiceTicker?.();
				stopVoiceTicker = null;
				createVoiceJournal({
					durationMs: voice.durationMs,
					peaks: voice.peaks,
					data: voice.data
				}, `local-${Date.now()}`);
			},
			onVoicePlayed: () => voicePlaying.set(null),
			onVoiceFailed: () => {
				voiceRecording.set(false);
				voicePlaying.set(null);
				stopVoiceTicker?.();
				stopVoiceTicker = null;
			},
			onNavigate: (event) => changeRoute(event.route)
		}), __nsh_hv10);
		insert(__nsh_hv9, () => shell && component(TitlebarOverlay, {
			get colors() {
				return snapshot().colors;
			},
			dark,
			get showCalendarToggle() {
				return route() === "journal";
			},
			get calendarOpen() {
				return journalCalendarOpen();
			},
			get showAddGame() {
				return route() === "games" && gamesOn();
			},
			get pageInset() {
				return sidebarPaneWidth();
			},
			get dimmed() {
				return addTaskOpen() || gameLibrary.addOpen() || pickedExes().length > 1;
			},
			onToggleSidebar: toggleSidebar,
			onToggleCalendar: toggleJournalCalendar,
			get onAddGame() {
				return gameLibrary.openAddDialog;
			},
			onChrome: (command) => askEngine(command)
		}));
		return __nsh_hv9;
	})();
}
mount(App);

//#endregion
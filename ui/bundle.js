import { append, bindProp, component, each, element, font, insert, list, prop, setup, text } from "nsh:rt";
import { Animated, Clipboard, Easing, LayoutAnimation, Storage, batch, colorScheme, createAnimatedValue, createMotion, effect, host, keymap, mount, nativeComponent, pixelRatio, setColorScheme, setTheme, signal, untracked } from "nsh";
import { Menu, windows } from "nsh/desktop";
import { platform } from "os";
import { Popover, RichEditor, RichEditorPlugin, StarterKit, TableKit, chain, command, createRichEditor, deleteRange, insertTable, markdown, selectAll, setNodeAttribute } from "nsh/base";

//#region \0nsh-app
setup(null, null, null, null, "{\"id\":\"com.mundus.atlas\",\"name\":\"Atlas\",\"version\":\"1.0.0\",\"build\":1,\"development\":true}");

//#endregion
//#region ../node_modules/.pnpm/@makekosmos+imago-nsh@https_6aac098089f45291b681748c9279272c/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/icons.ts
const icons = {
	mundus: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20854%20841%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M848.85895%20312.15771C833.823%20246.3922%20789.67505%20200.34573%20750.2724%20209.29922C719.13416%20216.38741%20414.19922%20453.55243%20336.24701%20504.18228C403.00226%20439.42935%20679.25177%20166.39703%20693.11469%20137.61795C710.65662%20101.21774%20675.57306%2047.923195%20614.73621%2018.664467C553.89935%20-10.594261%20490.39661%20-4.8384075%20472.80139%2031.615091C458.93848%2060.394169%20320.19763%20399.6716%20311.18674%20492.19101C302.17584%20399.6716%20394.95541%2060.447464%20381.0925%2031.615091C363.5506%20-4.8384075%20299.99451%20-10.594261%20239.15767%2018.664467C178.32083%2047.923195%20143.23724%20101.21774%20160.77916%20137.61795C174.64207%20166.39703%20219.37186%20439.48267%20286.12711%20504.18228C208.12158%20453.55243%20134.75906%20216.38741%20103.62083%20209.29922C64.164856%20200.29243%2020.016878%20246.3389%205.0342722%20312.15771C-10.001652%20377.92322%209.7798576%20438.57248%2049.235832%20447.57925C80.374062%20454.66742%20187.75366%20543.08728%20279.99533%20531.3092C191.75259%20560.6745%2094.663284%20517.02222%2069.656731%20536.95441C38.038635%20562.16272%2046.516647%20625.37006%2088.638565%20678.13171C130.70715%20730.89337%20190.47778%20753.22388%20222.09589%20728.01556C247.10245%20708.08337%20249.01703%20632.46222%20297.32394%20553C265.2793%20640.29651%20304.74017%20735.79651%20304.74017%20767.77325C304.74017%20808.22388%20359.44498%20841%20427%20841C494.55502%20841%20549.2605%20808.22388%20549.2605%20767.77325C549.2605%20735.84979%20357.2009%20640.29651%20325.15625%20553C373.46317%20632.46222%20606.89819%20708.08337%20631.90472%20728.01556C663.52283%20753.22388%20723.29346%20730.89337%20765.36206%20678.13171C807.43066%20625.37006%20815.96136%20562.16272%20784.34326%20536.95441C759.33673%20517.02222%20430.72763%20560.6745%20342.48489%20531.3092C434.72656%20543.08728%20773.57263%20454.66742%20804.76416%20447.57925C844.22015%20438.57248%20864.00165%20377.97653%20848.9657%20312.15771L848.85895%20312.15771Z%22%20fill%3D%22currentColor%22%20fill-rule%3D%22nonzero%22%2F%3E%3C%2Fsvg%3E",
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
	windowClose: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22m6%206%2012%2012M18%206%206%2018%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E%0A",
	server: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%222.6%22%2F%3E%3Cpath%20d%3D%22M12%209.4c0-3.2%201.1-5.9%202.8-5.9%201.6%200%202.3%202.5.9%205.1%22%2F%3E%3Cpath%20d%3D%22M14.6%2012c3.2%200%205.9%201.1%205.9%202.8%200%201.6-2.5%202.3-5.1.9%22%2F%3E%3Cpath%20d%3D%22M12%2014.6c0%203.2-1.1%205.9-2.8%205.9-1.6%200-2.3-2.5-.9-5.1%22%2F%3E%3Cpath%20d%3D%22M9.4%2012c-3.2%200-5.9-1.1-5.9-2.8%200-1.6%202.5-2.3%205.1-.9%22%2F%3E%3C%2Fsvg%3E",
	info: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229%22%2F%3E%3Cpath%20d%3D%22M12%2011v6%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%227.6%22%20r%3D%22.95%22%20fill%3D%22currentColor%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E",
	palette: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%203a9%209%200%201%200%200%2018h1.5a2.1%202.1%200%200%200%200-4.2h-.6a1.9%201.9%200%200%201%200-3.8H16a5%205%200%200%200%205-5C21%205.3%2017%203%2012%203Z%22%2F%3E%3Ccircle%20cx%3D%227.8%22%20cy%3D%2210%22%20r%3D%221.1%22%20fill%3D%22currentColor%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2210.2%22%20cy%3D%226.8%22%20r%3D%221.1%22%20fill%3D%22currentColor%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2214.4%22%20cy%3D%226.6%22%20r%3D%221.1%22%20fill%3D%22currentColor%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E",
	apps: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223.5%22%20y%3D%223.5%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%222.2%22%2F%3E%3Crect%20x%3D%2213.5%22%20y%3D%223.5%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%222.2%22%2F%3E%3Crect%20x%3D%223.5%22%20y%3D%2213.5%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%222.2%22%2F%3E%3Crect%20x%3D%2213.5%22%20y%3D%2213.5%22%20width%3D%227%22%20height%3D%227%22%20rx%3D%222.2%22%2F%3E%3C%2Fsvg%3E",
	plug: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M9%203v5M15%203v5%22%2F%3E%3Cpath%20d%3D%22M6%208h12v3a6%206%200%200%201-6%206%206%206%200%200%201-6-6V8Z%22%2F%3E%3Cpath%20d%3D%22M12%2017v4%22%2F%3E%3C%2Fsvg%3E",
	database: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cellipse%20cx%3D%2212%22%20cy%3D%226%22%20rx%3D%227.5%22%20ry%3D%223%22%2F%3E%3Cpath%20d%3D%22M4.5%206v6c0%201.66%203.36%203%207.5%203s7.5-1.34%207.5-3V6%22%2F%3E%3Cpath%20d%3D%22M4.5%2012v6c0%201.66%203.36%203%207.5%203s7.5-1.34%207.5-3v-6%22%2F%3E%3C%2Fsvg%3E",
	pulse: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M2.5%2012h4l2-5%203%2010%202.5-6%201.5%203h6%22%2F%3E%3C%2Fsvg%3E",
	monitor: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%222.5%22%20y%3D%224%22%20width%3D%2219%22%20height%3D%2212.5%22%20rx%3D%222.6%22%2F%3E%3Cpath%20d%3D%22M9%2020.5h6M12%2016.5v4%22%2F%3E%3C%2Fsvg%3E",
	globe: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229%22%2F%3E%3Cpath%20d%3D%22M3.2%209h17.6M3.2%2015h17.6%22%2F%3E%3Cpath%20d%3D%22M12%203a14%2014%200%200%201%200%2018a14%2014%200%200%201%200-18Z%22%2F%3E%3C%2Fsvg%3E",
	key: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%228.2%22%20cy%3D%228.2%22%20r%3D%224.4%22%2F%3E%3Cpath%20d%3D%22M11.4%2011.4%2020%2020M17%2017l-2%202M14%2014l-2%202%22%2F%3E%3C%2Fsvg%3E",
	chip: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%226.5%22%20y%3D%226.5%22%20width%3D%2211%22%20height%3D%2211%22%20rx%3D%222.6%22%2F%3E%3Cpath%20d%3D%22M10%203v3.5M14%203v3.5M10%2017.5V21M14%2017.5V21M3%2010h3.5M3%2014h3.5M17.5%2010H21M17.5%2014H21%22%2F%3E%3C%2Fsvg%3E",
	gear: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223.1%22%2F%3E%3Cpath%20d%3D%22M19.4%2013.4a7.6%207.6%200%200%200%200-2.8l1.9-1.4-2-3.4-2.2%201a7.6%207.6%200%200%200-2.4-1.4L14.3%202.2H9.7l-.4%202.9a7.6%207.6%200%200%200-2.4%201.4l-2.2-1-2%203.4%201.9%201.4a7.6%207.6%200%200%200%200%202.8l-1.9%201.4%202%203.4%202.2-1a7.6%207.6%200%200%200%202.4%201.4l.4%202.9h4.6l.4-2.9a7.6%207.6%200%200%200%202.4-1.4l2.2%201%202-3.4-1.9-1.4Z%22%2F%3E%3C%2Fsvg%3E",
	code: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M9%208.5%205%2012l4%203.5M15%208.5%2019%2012l-4%203.5%22%2F%3E%3C%2Fsvg%3E",
	search: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2211%22%20cy%3D%2211%22%20r%3D%226.5%22%2F%3E%3Cpath%20d%3D%22M16%2016l4.4%204.4%22%2F%3E%3C%2Fsvg%3E",
	power: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%203v8%22%2F%3E%3Cpath%20d%3D%22M7.6%206.3a7.6%207.6%200%201%200%208.8%200%22%2F%3E%3C%2Fsvg%3E",
	chevron: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M9.5%206l6%206-6%206%22%2F%3E%3C%2Fsvg%3E",
	refresh: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M20%2011a8%208%200%201%200-2.7%207%22%2F%3E%3Cpath%20d%3D%22M20%204.6V11h-6.4%22%2F%3E%3C%2Fsvg%3E",
	shield: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%203%205%206v5.6c0%204.3%203%208%207%209.4%204-1.4%207-5.1%207-9.4V6l-7-3Z%22%2F%3E%3C%2Fsvg%3E",
	external: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M13.5%204.5H20V11%22%2F%3E%3Cpath%20d%3D%22M20%204.5%2011.5%2013%22%2F%3E%3Cpath%20d%3D%22M18%2014v3.5a2.5%202.5%200%200%201-2.5%202.5H6a2.5%202.5%200%200%201-2.5-2.5V9A2.5%202.5%200%200%201%206%206.5h3.5%22%2F%3E%3C%2Fsvg%3E"
};

//#endregion
//#region ../node_modules/.pnpm/@makekosmos+imago-nsh@https_6aac098089f45291b681748c9279272c/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/components.tsx
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
function SectionTitle(props) {
	return (() => {
		const __nsh_hv39 = element("text");
		prop(__nsh_hv39, "class", "mb-3 text-[13px]");
		bindProp(__nsh_hv39, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv39, () => props.children);
		return __nsh_hv39;
	})();
}
function PageScroll(props) {
	return (() => {
		const __nsh_hv43 = element("scroll");
		prop(__nsh_hv43, "class", "min-h-0 flex-1 px-7 pt-4 pb-8");
		bindProp(__nsh_hv43, "style", () => ({ backgroundColor: props.colors.background }));
		insert(__nsh_hv43, () => props.children);
		return __nsh_hv43;
	})();
}

//#endregion
//#region ../node_modules/.pnpm/@makekosmos+imago-nsh@https_6aac098089f45291b681748c9279272c/node_modules/@makekosmos/imago-nsh/crates/imago-nsh/ui/palettes.ts
/**
* Cobalt Foundry: forged steel greys lit by a cobalt arc. The Manager wears it
* as its signature scheme; every consumer may ship its own palettes next to
* this one, and the shape is the same so a choice can travel between apps.
*/
const cobaltFoundry = {
	background: "#090c15",
	shell: "#0d1019",
	card: "#101318",
	raised: "#181c25",
	input: "#1e222b",
	border: "#1e222b",
	foreground: "#ffffff",
	muted: "#717580",
	faint: "#8f9498",
	accent: "#1784fc",
	accentText: "#101318",
	danger: "#e67b71",
	dangerFill: "#3e1f24",
	success: "#3fbf7f"
};
/** The same cobalt palette for a light room: pale steel, same arc. */
const cobaltFoundryLight = {
	background: "#f7f8fa",
	shell: "#eff1f5",
	card: "#ffffff",
	raised: "#eef1f6",
	border: "#dde2ea",
	foreground: "#111820",
	muted: "#5f6a7a",
	faint: "#8c96a6",
	accent: "#1f6df5",
	accentText: "#ffffff",
	danger: "#d5373c",
	dangerFill: "#fdecec",
	success: "#1f8a5b"
};
function palette(key, name, colors) {
	return {
		key,
		name,
		colors
	};
}
const lightThemes = [
	palette("merino-light", "Merino Light", {
		...cobaltFoundryLight,
		background: "#f5f3ef",
		shell: "#eeeae4",
		card: "#ffffff",
		raised: "#f1ede7",
		border: "#e0dad1",
		foreground: "#221f1b",
		muted: "#6b645b",
		faint: "#948c82",
		accent: "#2563eb",
		accentText: "#ffffff"
	}),
	palette("alpine-milk", "Alpine Milk", {
		...cobaltFoundryLight,
		background: "#f7f9fb",
		shell: "#eef2f7",
		card: "#ffffff",
		raised: "#eaf0f7",
		border: "#dbe3ee",
		foreground: "#152030",
		muted: "#5b6a7d",
		faint: "#8794a8",
		accent: "#0f7bd4"
	}),
	palette("buttercream-diner", "Buttercream Diner", {
		...cobaltFoundryLight,
		background: "#fdf8ea",
		shell: "#f8f0dc",
		card: "#fffdf4",
		raised: "#f7eed8",
		border: "#eadfc2",
		foreground: "#2a2113",
		muted: "#736450",
		faint: "#9c8f7c",
		accent: "#d1622a",
		danger: "#c2402f"
	}),
	palette("coastal-linen", "Coastal Linen", {
		...cobaltFoundryLight,
		background: "#f3f8f7",
		shell: "#e9f2f1",
		card: "#ffffff",
		raised: "#e8f1f0",
		border: "#d5e4e2",
		foreground: "#132524",
		muted: "#566a69",
		faint: "#839796",
		accent: "#0f9aa8",
		success: "#149a72"
	})
];
const darkThemes = [
	palette("cinder-peak", "Cinder Peak", {
		...cobaltFoundry,
		background: "#121010",
		shell: "#161313",
		card: "#1c1818",
		raised: "#241f1f",
		border: "#2e2727",
		foreground: "#f1eae7",
		muted: "#a2968f",
		faint: "#736762",
		accent: "#f0743f",
		danger: "#e5544b",
		dangerFill: "#2b1614"
	}),
	palette("cobalt-foundry", "Cobalt Foundry", cobaltFoundry),
	palette("ember-hollow", "Ember Hollow", {
		...cobaltFoundry,
		background: "#0e0c09",
		shell: "#12100b",
		card: "#191509",
		raised: "#221c10",
		border: "#2d2515",
		foreground: "#f4ead6",
		muted: "#a6987c",
		faint: "#776b53",
		accent: "#f2a03d",
		danger: "#e2603f",
		dangerFill: "#2a1a10",
		success: "#9cbf4b"
	}),
	palette("heliotrope", "Heliotrope", {
		...cobaltFoundry,
		background: "#0c0a12",
		shell: "#100d17",
		card: "#16121f",
		raised: "#1e1929",
		border: "#291f38",
		foreground: "#ece7f8",
		muted: "#9a90b4",
		faint: "#6d6488",
		accent: "#b07cff",
		danger: "#ef5d8b",
		dangerFill: "#291322"
	})
];

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
		"id": "notes",
		"label": "Заметки",
		"icon": "note.text",
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
		"id": "developers",
		"label": "Для разработчиков",
		"icon": "gearshape",
		"footer": true
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
/** What a note without a name is called. */
const NOTE_UNTITLED = "Без названия";
/**
* A note's name as it is shown: a note with no name keeps one that reads, so a
* tab, a row or a card never stands blank because the name is an empty string.
*/
function noteLabel(title) {
	return String(title ?? "").trim() || "Без названия";
}
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
	return value === "journal" || value === "notes" || value === "tasks" || value === "games" || value === "settings" || value === "developers";
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
	sidebar: "mod+shift+b",
	create: "mod+n",
	search: "mod+k",
	reload: "mod+r"
};
const shortcutOptions = {
	sidebar: ["mod+shift+b", "mod+alt+b"],
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
	search: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M10%202a8%208%200%201%200%204.906%2014.32l5.387%205.387a1%201%200%200%200%201.414-1.414l-5.387-5.387A8%208%200%200%200%2010%202Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	folder: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M9.021%202c.306.003.611.019.903.107l.231.083q.342.142.63.378l.113.101c.256.244.45.548.647.845l.574.863.282.411c.051.07.07.086.084.099l.081.053q.045.024.091.039l.128.014c.086.004.233.007.5.007H14.6c1.103%200%201.991-.001%202.709.058.728.06%201.368.185%201.96.487l.175.093a5%205%200%200%201%202.011%202.092l.115.249c.154.363.247.748.308%201.16q.24.074.468.21l.191.13a2.5%202.5%200%200%201%20.9%201.297l.039.158c.075.365.042.72-.016%201.043a9%209%200%200%201-.134.597l-.186.7-.89%203.27c-.409%201.502-.678%202.55-1.233%203.354l-.116.157a5%205%200%200%201-1.752%201.432l-.297.135c-.962.397-2.082.378-3.743.378H7.188c-.654%200-1.21.001-1.66-.033-.427-.032-.855-.102-1.25-.288a4%204%200%200%201-.393-.15l-.155-.074a5%205%200%200%201-2.092-2.01l-.093-.175c-.302-.593-.428-1.233-.487-1.961C.999%2016.59%201%2015.703%201%2014.599V9.4c0-1.103-.001-1.991.058-2.709.06-.728.185-1.368.487-1.96l.093-.175A5%205%200%200%201%203.73%202.545l.224-.106c.53-.227%201.1-.33%201.737-.381C6.41%201.999%207.297%202%208.401%202zm-.62%202c-1.137%200-1.93%200-2.547.05-.529.044-.862.12-1.113.228l-.103.05a3%203%200%200%200-1.196%201.104l-.115.206c-.134.263-.227.611-.276%201.216C3%207.471%203%208.264%203%209.4v5.2c0%201.07.002%201.835.044%202.435l.09-.338%201.259-4.62.15-.55c.15-.53.316-.998.61-1.38l.125-.152a3%203%200%200%201%201.106-.788l.226-.08c.405-.12.848-.144%201.334-.148h11.86a2%202%200%200%200-.077-.226l-.054-.115a3%203%200%200%200-1.105-1.196l-.206-.115c-.263-.134-.611-.227-1.216-.276C16.528%207%2015.735%207%2014.6%207h-1.621a3.6%203.6%200%200%201-.756-.07l-.147-.037a2.5%202.5%200%200%201-.663-.315l-.197-.146c-.236-.194-.419-.439-.591-.692l-.17-.254-.574-.863a12%2012%200%200%200-.282-.411l-.084-.099a.5.5%200%200%200-.081-.053l-.091-.039C9.305%204.011%209.247%204%208.716%204z%22%20clip-rule%3D%22evenodd%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	note: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M11%205.197c0-.892-.588-1.688-1.462-1.866-2.621-.535-5.579-.536-8.034.867A1%201%200%200%200%201%205.067v15.5a1%201%200%200%200%201.394.919c2.607-1.118%205.852-.48%208.606.669z%22%20fill%3D%22currentColor%22%2F%3E%3Cpath%20d%3D%22M13%2022.155c2.754-1.15%205.999-1.787%208.606-.67A1%201%200%200%200%2023%2020.568v-15.5a1%201%200%200%200-.504-.869c-2.455-1.403-5.413-1.402-8.034-.867C13.588%203.51%2013%204.306%2013%205.198z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	journal: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M8%201a1%201%200%200%201%201%201v1.04C9.805%203%2010.759%203%2011.916%203h.168c1.157%200%202.111%200%202.916.04V2a1%201%200%201%201%202%200v1.305q.35.092.679.228a7%207%200%200%201%203.788%203.788c.214.517.339%201.064.414%201.679H2.12c.074-.615.199-1.162.413-1.679A7%207%200%200%201%206.32%203.533%205%205%200%200%201%207%203.305V2a1%201%200%200%201%201-1Z%22%20fill%3D%22currentColor%22%2F%3E%3Cpath%20d%3D%22M2.01%2011C2%2011.581%202%2012.235%202%2012.974v.063c0%201.366%200%202.443.06%203.314.06.888.186%201.634.473%202.328a7%207%200%200%200%203.788%203.788c.694.287%201.44.413%202.328.474.87.059%201.948.059%203.314.059h.074c1.366%200%202.443%200%203.314-.06.888-.06%201.634-.186%202.328-.473a7%207%200%200%200%203.788-3.788c.287-.694.413-1.44.474-2.328.059-.87.059-1.947.059-3.314v-.063c0-.74%200-1.393-.01-1.974z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	check: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M1.85%2012C1.85%206.394%206.394%201.85%2012%201.85S22.15%206.394%2022.15%2012%2017.606%2022.15%2012%2022.15%201.85%2017.606%201.85%2012Zm14.214-1.328a1%201%200%201%200-1.128-1.652l-.101.07a16%2016%200%200%200-4.174%204.168l-1.454-1.453a1%201%200%200%200-1.414%201.415l2.341%202.339a1%201%200%200%200%201.575-.211%2014%2014%200%200%201%204.254-4.607z%22%20clip-rule%3D%22evenodd%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	file: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M8%201a5%205%200%200%200-5%205v12a5%205%200%200%200%205%205h8a5%205%200%200%200%205-5v-5.2c0-.857%200-1.439-.038-1.889-.035-.438-.1-.663-.18-.819a2%202%200%200%200-.874-.874c-.156-.08-.38-.145-.819-.18C18.639%209%2018.057%209%2017.2%209h-.038c-.528%200-.982%200-1.357-.03-.395-.033-.789-.104-1.167-.297a3%203%200%200%201-1.311-1.311c-.193-.378-.264-.772-.296-1.167C13%205.82%2013%205.365%2013%204.839V4.8c0-.857%200-1.439-.038-1.889-.035-.438-.1-.663-.18-.819a2%202%200%200%200-.874-.874c-.156-.08-.38-.145-.819-.18C10.639%201%2010.057%201%209.2%201z%22%20fill%3D%22currentColor%22%2F%3E%3Cpath%20d%3D%22M14.664%201.4c.175.423.253.869.292%201.348C15%203.29%2015%203.954%2015%204.758V4.8c0%20.577%200%20.949.024%201.232.022.272.06.373.085.422a1%201%200%200%200%20.437.437c.05.025.15.063.422.085C16.25%207%2016.623%207%2017.2%207h.041c.805%200%201.47%200%202.01.044.48.04.926.117%201.348.292a9.02%209.02%200%200%200-5.935-5.935Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	gamepad: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M1%2011.667A7.667%207.667%200%200%201%208.667%204h6.666A7.667%207.667%200%200%201%2023%2011.667v5.243a4.09%204.09%200%200%201-7.748%201.829l-.146-.292A2.62%202.62%200%200%200%2012.764%2017h-1.528c-.992%200-1.898.56-2.342%201.447l-.145.292A4.09%204.09%200%200%201%201%2016.909zM15.982%209.19a1%201%200%200%200-1.964-.382v.001a1%201%200%200%200%201.963.382zM9%209a1%201%200%201%200-2%200v1H6a1%201%200%201%200%200%202h1v1a1%201%200%201%200%202%200v-1h1a1%201%200%201%200%200-2H9zm9.982%203.19a1%201%200%200%200-1.963-.38h0a1%201%200%200%200%201.963.382z%22%20clip-rule%3D%22evenodd%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	settings: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M11.205%202.124a2.6%202.6%200%200%201%201.59%200c.354.114.638.309.889.517.234.196.496.452.79.74l.328.322c.306.3.35.334.387.356q.08.048.171.07c.042.011.098.018.526.022l.46.005c.411.004.777.008%201.08.036.326.03.664.092.995.262.483.249.876.642%201.125%201.125.17.33.232.67.262.994.028.304.032.67.036%201.08l.005.461c.004.428.01.484.021.526q.023.091.07.17c.023.038.058.082.357.388l.323.329c.287.293.543.555.739.79.208.25.403.534.517.888a2.6%202.6%200%200%201%200%201.59c-.114.354-.309.638-.517.889a15%2015%200%200%201-.739.789l-.323.33c-.3.305-.334.35-.356.386a.6.6%200%200%200-.07.171c-.011.042-.018.098-.022.526l-.005.46c-.004.411-.008.777-.036%201.08-.03.326-.092.664-.262.995a2.6%202.6%200%200%201-1.125%201.125c-.33.17-.67.232-.994.262-.304.028-.67.032-1.08.036l-.461.005c-.428.004-.484.01-.526.021a.6.6%200%200%200-.17.07c-.038.023-.082.058-.388.357l-.329.323c-.293.287-.555.543-.79.739-.25.208-.534.403-.888.517a2.6%202.6%200%200%201-1.59%200c-.354-.114-.638-.309-.889-.517a14%2014%200%200%201-.789-.739l-.33-.323c-.305-.3-.35-.334-.386-.356a.6.6%200%200%200-.171-.07c-.042-.011-.098-.018-.526-.022l-.46-.005a14%2014%200%200%201-1.08-.036c-.326-.03-.664-.092-.995-.262a2.6%202.6%200%200%201-1.125-1.125c-.17-.33-.232-.67-.262-.994-.028-.304-.032-.67-.036-1.08l-.005-.461c-.004-.428-.01-.484-.021-.526a.6.6%200%200%200-.07-.17c-.023-.038-.058-.082-.357-.388l-.323-.329a14%2014%200%200%201-.739-.79c-.208-.25-.403-.534-.517-.888a2.6%202.6%200%200%201%200-1.59c.114-.354.309-.638.517-.889.196-.234.452-.496.74-.79l.322-.328c.3-.306.334-.35.356-.387a.6.6%200%200%200%20.07-.171c.011-.042.018-.098.022-.526l.005-.46c.004-.411.008-.777.036-1.08.03-.326.092-.664.262-.995A2.6%202.6%200%200%201%205.58%204.454c.33-.17.67-.232.994-.262.304-.028.67-.032%201.08-.036l.461-.005c.428-.004.484-.01.526-.021a.6.6%200%200%200%20.17-.07c.038-.023.082-.058.388-.357l.329-.323c.293-.287.555-.543.79-.739.25-.208.534-.403.888-.517ZM12%209.9c-1.146%200-2.109.927-2.109%202.1s.963%202.1%202.11%202.1%202.108-.927%202.108-2.1S13.147%209.9%2012%209.9Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	plus: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M1.85%2012C1.85%206.394%206.394%201.85%2012%201.85S22.15%206.394%2022.15%2012%2017.606%2022.15%2012%2022.15%201.85%2017.606%201.85%2012ZM13%208.9a1%201%200%201%200-2%200V11H8.9a1%201%200%201%200%200%202H11v2.1a1%201%200%201%200%202%200V13h2.1a1%201%200%201%200%200-2H13z%22%20clip-rule%3D%22evenodd%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	trash: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M12%201a4.24%204.24%200%200%200-3.789%202.342L7.382%205H4a1%201%200%200%200%200%202h1v8.036c0%20.901%200%201.629.04%202.22.042.61.13%201.148.34%201.657a5%205%200%200%200%202.707%202.706c.51.212%201.048.3%201.656.34.592.041%201.32.041%202.221.041h.072c.901%200%201.629%200%202.22-.04.61-.042%201.148-.13%201.657-.34a5%205%200%200%200%202.706-2.707c.212-.51.3-1.048.34-1.656.041-.592.041-1.32.041-2.222V7h1a1%201%200%201%200%200-2h-3.382l-.83-1.658A4.24%204.24%200%200%200%2012%201Zm-2%203.236L9.618%205h4.764L14%204.236a2.236%202.236%200%200%200-4%200Z%22%20clip-rule%3D%22evenodd%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	sidebar: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M18.724%202.654c-.7-.356-1.463-.51-2.359-.583C15.491%202%2014.407%202%2013.044%202h-2.052c-.757%200-1.425%200-2.011.011-1.535.03-2.7.131-3.705.643a6%206%200%200%200-2.622%202.622c-.356.7-.51%201.463-.583%202.359C2%208.509%202%209.593%202%2010.956v2.088c0%201.363%200%202.447.071%203.321.074.896.227%201.66.583%202.359a6%206%200%200%200%202.622%202.622c1.004.512%202.17.613%203.705.643.586.011%201.254.011%202.011.011h2.052c1.363%200%202.447%200%203.321-.071.896-.074%201.66-.227%202.359-.583a6%206%200%200%200%202.622-2.622c.356-.7.51-1.463.583-2.359.071-.874.071-1.958.071-3.321v-2.088c0-1.363%200-2.447-.071-3.321-.074-.896-.227-1.66-.583-2.359a6%206%200%200%200-2.622-2.622ZM13%204c1.417%200%202.419%200%203.203.065.771.063%201.243.182%201.613.371a4%204%200%200%201%201.748%201.748c.189.37.308.842.371%201.613C20%208.581%2020%209.583%2020%2011v2c0%201.417%200%202.419-.065%203.203-.063.771-.182%201.243-.371%201.613a4%204%200%200%201-1.748%201.748c-.37.189-.841.308-1.613.371C15.419%2020%2014.417%2020%2013%2020h-2l-1-.001V4h1z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	more: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M1.85%2012C1.85%206.394%206.394%201.85%2012%201.85S22.15%206.394%2022.15%2012c0%205.605-4.544%2010.15-10.15%2010.15S1.85%2017.605%201.85%2012ZM8%2010.9a1.1%201.1%200%200%200%200%202.2h.01a1.1%201.1%200%200%200%200-2.2zm4%200a1.1%201.1%200%200%200%200%202.2h.01a1.1%201.1%200%200%200%200-2.2zm4%200a1.1%201.1%200%200%200%200%202.2h.01a1.1%201.1%200%200%200%200-2.2z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	mic: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M12%2020a8%208%200%200%201-8-8m8%208a8%208%200%200%200%208-8m-8%208v2m0-6a4%204%200%200%201-4-4V7a4%204%200%201%201%208%200v5a4%204%200%200%201-4%204Z%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E%0A",
	copy: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M13.8%202c-1.668%200-2.748%200-3.654.294a6%206%200%200%200-3.887%203.965l-.113.035a6%206%200%200%200-3.852%203.852C1.999%2011.052%202%2012.132%202%2013.8v.4c0%201.669%200%202.748.294%203.654a6%206%200%200%200%203.852%203.852c.906.295%201.985.294%203.654.294h.4c1.669%200%202.748%200%203.654-.294a6%206%200%200%200%203.887-3.965q.057-.015.113-.035a6%206%200%200%200%203.852-3.852c.295-.906.294-1.985.294-3.654v-.4c0-1.669%200-2.748-.294-3.654a6%206%200%200%200-3.852-3.852C16.948%201.999%2015.87%202%2014.2%202zM9.909%206c-.512%200-.967%200-1.376.007a4%204%200%200%201%202.232-1.811C11.329%204.012%2012.061%204%2014%204s2.672.012%203.236.196a4%204%200%200%201%202.568%202.568C19.988%207.329%2020%208.061%2020%2010s-.012%202.672-.196%203.236a4%204%200%200%201-1.81%202.232c.006-.409.006-.863.006-1.375V13.8c0-1.668%200-2.748-.294-3.654a6%206%200%200%200-3.852-3.852C12.948%205.999%2011.87%206%2010.2%206z%22%20clip-rule%3D%22evenodd%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E",
	arrowLeft: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M14.125%208.14a20.4%2020.4%200%200%200-3.894%203.701.47.47%200%200%200%200%20.596%2020.4%2020.4%200%200%200%203.894%203.702%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E%0A",
	arrowRight: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M9.875%208.14a20.4%2020.4%200%200%201%203.894%203.701.47.47%200%200%201%200%20.596%2020.4%2020.4%200%200%201-3.894%203.702%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E%0A",
	close: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22m6%206%2012%2012M18%206%206%2018%22%20stroke%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E%0A"
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
//#region reading-size.ts
const textSize = signal(16);
const codeSize = signal(14);
const interfaceSize = signal(13);
for (const [key, size] of [["text", textSize], ["code", codeSize]]) {
	const storageKey = `mundus.atlas.font.${key}`;
	Storage.getItem(storageKey).then((value) => {
		const px = Number(value);
		if (px >= 12 && px <= 24) size.set(px);
	});
}
function setReadingSize(kind, px) {
	if (!Number.isFinite(px) || px < 12 || px > 24) return;
	(kind === "text" ? textSize : codeSize).set(px);
	Storage.setItem(`mundus.atlas.font.${kind}`, String(px));
}

//#endregion
//#region chrome.tsx
const TITLEBAR_HEIGHT = 48;
const CARD_GAP$1 = 8;
function slideDirection(from, to) {
	return to > from ? 1 : -1;
}
const SIDEBAR_WIDTH = 282;
const ROW_HEIGHT = 32;
const NAV_ROW_HEIGHT = 40;
const CONTROL_RADIUS = 6;
const ROW_RADIUS = 8;
const NAV_ROW_RADIUS = 10;
const CLUSTER_START_MACOS = 88;
const CLUSTER_START = 8;
const TRAILING_INSET = 8;
const CAPTION_BUTTON_WIDTH = 30;
const CAPTION_BUTTON_HEIGHT = 24;
const TOGGLE_SIZE = 24;
const TRAIL_WIDTH = 50;
const closeHovered = signal(false);
function animateTabs() {
	LayoutAnimation.configureNext({
		duration: 160,
		create: {
			type: "easeOut",
			duration: 160
		},
		update: {
			type: "easeOut",
			duration: 160
		},
		delete: {
			type: "easeIn",
			duration: 120
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
	return 24 - size / 2;
}
/**
* Where the notes' arrows stand: against the pane's right edge, on the
* toggle's own line — and after the toggle when there is no pane to hold them.
*/
function noteBackLeft(pageInset, toggleLeft) {
	const afterToggle = toggleLeft + TOGGLE_SIZE + 6;
	const againstPane = pageInset - TRAIL_WIDTH;
	return Math.max(afterToggle, againstPane);
}
const TAB_HEIGHT = 32;
const TAB_TILE_HEIGHT = 20;
const TAB_CLOSE_SIZE = 20;
const TAB_CLOSE_ROOM = 28;
const TAB_WIDTH = 300;
const TAB_TILE_PAD = 6;
const TAB_ICON_ONLY = 36;
const TAB_NAME_FITS = 96;
function tabChipWidth(room, count) {
	if (!(room > 0) || count < 1) return TAB_WIDTH;
	const fit = Math.floor((room - TAB_GAP * (count - 1)) / count);
	return Math.max(TAB_ICON_ONLY, Math.min(TAB_WIDTH, fit));
}
const TAB_FADE = 22;
const TAB_GAP = 2;
function TabIcon(props) {
	if (props.route === "journal") return component(Glyph, {
		name: "journal",
		size: 14,
		get color() {
			return props.color;
		}
	});
	if (props.route === "games") return component(Glyph, {
		name: "gamepad",
		size: 14,
		get color() {
			return props.color;
		}
	});
	if (props.route === "settings") return component(Glyph, {
		name: "settings",
		size: 14,
		get color() {
			return props.color;
		}
	});
	if (props.route === "tasks") return component(Glyph, {
		name: "check",
		size: 14,
		get color() {
			return props.color;
		}
	});
	return component(Glyph, {
		name: "note",
		size: 14,
		get color() {
			return props.color;
		}
	});
}
function recentIcon(kind) {
	return kind === "game" ? "gamepad" : "note";
}
function TabChip(props) {
	const over = signal(false);
	const closeOver = signal(false);
	const colors = props.colors;
	const base = shellFill(colors, props.dark);
	const ink = (t) => mixHex(base, colors.foreground, t);
	const plate = props.tab.active ? ink(.1) : over() ? ink(.07) : ink(.04);
	const tileTop = props.tab.active ? mixHex(colors.accent, "#ffffff", .12) : ink(.1);
	const tileBottom = props.tab.active ? colors.accent : ink(.04);
	const tileInk = props.tab.active ? accentMark(colors.accent) : colors.muted;
	return (() => {
		const __nsh_hv0 = element("view");
		bindProp(__nsh_hv0, "onPress", () => props.onSelect);
		prop(__nsh_hv0, "onContextMenu", (event) => props.onMenu?.(event.pagePosition));
		bindProp(__nsh_hv0, "testID", () => `tab-${props.tab.key}`);
		prop(__nsh_hv0, "role", "button");
		bindProp(__nsh_hv0, "accessibilityLabel", () => props.tab.label);
		bindProp(__nsh_hv0, "accessibilityState", () => ({ selected: props.tab.active }));
		prop(__nsh_hv0, "onMouseEnter", () => over.set(true));
		prop(__nsh_hv0, "onMouseLeave", () => over.set(false));
		prop(__nsh_hv0, "desktop", { windowDrag: false });
		prop(__nsh_hv0, "class", "flex-row items-center");
		bindProp(__nsh_hv0, "style", () => ({
			height: TAB_HEIGHT,
			width: props.width,
			minWidth: TAB_ICON_ONLY,
			flexShrink: 1,
			paddingLeft: TAB_TILE_PAD,
			paddingRight: props.compact ? TAB_TILE_PAD : TAB_CLOSE_ROOM,
			gap: props.compact ? 0 : 8,
			borderRadius: 8,
			backgroundColor: plate,
			cursor: "pointer"
		}));
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "items-center justify-center");
		bindProp(__nsh_hv1, "style", () => ({
			width: 24,
			height: TAB_TILE_HEIGHT,
			borderRadius: 5,
			backgroundImage: `linear-gradient(180deg, ${tileTop} 0%, ${tileBottom} 100%)`,
			borderWidth: 1,
			borderColor: props.tab.active ? colorAlpha("#ffffff", .14) : ink(.1)
		}));
		insert(__nsh_hv1, component(TabIcon, {
			get route() {
				return props.tab.route;
			},
			get noteId() {
				return props.tab.noteId;
			},
			color: tileInk
		}));
		const __nsh_hv2 = element("view");
		prop(__nsh_hv2, "class", "relative");
		prop(__nsh_hv2, "style", {
			flexGrow: 1,
			flexShrink: 1,
			minWidth: 0,
			overflow: "hidden"
		});
		const __nsh_hv3 = element("text");
		bindProp(__nsh_hv3, "style", () => ({
			fontSize: interfaceSize() + 1,
			lineHeight: 20,
			numberOfLines: 1,
			textOverflow: "clip",
			fontWeight: props.tab.active ? 600 : 500,
			color: props.tab.active ? colors.foreground : colors.muted
		}));
		insert(__nsh_hv3, () => props.tab.label);
		const __nsh_hv4 = element("view");
		prop(__nsh_hv4, "class", "absolute");
		bindProp(__nsh_hv4, "style", () => ({
			right: 0,
			top: 0,
			width: TAB_FADE,
			height: 20,
			backgroundImage: `linear-gradient(90deg, ${colorAlpha(plate, 0)} 0%, ${plate} 100%)`
		}));
		append(__nsh_hv2, __nsh_hv3);
		append(__nsh_hv2, __nsh_hv4);
		append(__nsh_hv0, __nsh_hv1);
		append(__nsh_hv0, __nsh_hv2);
		insert(__nsh_hv0, () => !props.compact && (() => {
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "onPress", () => props.onClose());
			prop(__nsh_hv5, "role", "button");
			bindProp(__nsh_hv5, "accessibilityLabel", () => `Закрыть ${props.tab.label}`);
			prop(__nsh_hv5, "onMouseEnter", () => closeOver.set(true));
			prop(__nsh_hv5, "onMouseLeave", () => closeOver.set(false));
			prop(__nsh_hv5, "class", "absolute items-center justify-center");
			bindProp(__nsh_hv5, "hoverStyle", () => ({ backgroundColor: ink(.18) }));
			prop(__nsh_hv5, "desktop", { windowDrag: false });
			bindProp(__nsh_hv5, "style", () => ({
				right: 4,
				top: 6,
				width: TAB_CLOSE_SIZE,
				height: TAB_CLOSE_SIZE,
				borderRadius: 6,
				opacity: props.tab.active || over() ? 1 : 0,
				cursor: "pointer"
			}));
			insert(__nsh_hv5, component(Glyph, {
				name: "close",
				size: 13,
				get color() {
					return closeOver() ? colors.foreground : colors.muted;
				}
			}));
			return __nsh_hv5;
		})());
		return __nsh_hv0;
	})();
}
function TrailArrow(props) {
	const enabled = () => props.enabled === true;
	return (() => {
		const __nsh_hv6 = element("view");
		prop(__nsh_hv6, "onPress", () => {
			if (enabled()) props.onPress?.();
		});
		prop(__nsh_hv6, "role", "button");
		bindProp(__nsh_hv6, "accessibilityLabel", () => props.label);
		bindProp(__nsh_hv6, "accessibilityState", () => ({ disabled: !enabled() }));
		prop(__nsh_hv6, "class", "items-center justify-center");
		bindProp(__nsh_hv6, "hoverStyle", () => enabled() ? { backgroundColor: hoverWash(props.dark) } : void 0);
		bindProp(__nsh_hv6, "activeStyle", () => enabled() ? { backgroundColor: surfaceWash(props.dark, .12) } : void 0);
		prop(__nsh_hv6, "desktop", { windowDrag: false });
		bindProp(__nsh_hv6, "style", () => ({
			width: 24,
			height: 24,
			borderRadius: CONTROL_RADIUS,
			cursor: enabled() ? "pointer" : "default"
		}));
		insert(__nsh_hv6, component(Glyph, {
			get name() {
				return props.dir === "back" ? "arrowLeft" : "arrowRight";
			},
			size: 16,
			get color() {
				return enabled() ? props.colors.foreground : colorAlpha(props.colors.muted, .5);
			}
		}));
		return __nsh_hv6;
	})();
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
	const controls = windows()[0]?.titleBar() ?? {
		height: 0,
		left: 0,
		right: 0
	};
	const os = hostOs();
	const macos = os === "macos";
	const drawCaptions = drawsCaptionButtons(os, controls.right);
	const captionWidth = drawCaptions ? 90 : controls.right;
	const sidebarLeft = macos ? Math.max(controls.left, CLUSTER_START_MACOS) : Math.max(controls.left, CLUSTER_START);
	const controlsRight = captionWidth + TRAILING_INSET;
	const addGameRight = controlsRight;
	const wash = hoverWash(props.dark);
	const barHeight = controls.height || 48;
	const dragLeft = macos ? Math.max(controls.left, 78) : 0;
	const trailLeft = () => noteBackLeft(props.pageInset ?? 0, sidebarLeft);
	const stripLeft = () => trailLeft() + TRAIL_WIDTH + 8;
	const controlsRoom = controlsRight + 44;
	const windowWidth = windows()[0]?.state()?.contentBounds.size.width ?? windows()[0]?.state()?.bounds.size.width ?? 0;
	const chipWidth = () => {
		const pageRight = props.pageWidth && props.pageWidth > 0 ? (props.pageInset ?? 8) + props.pageWidth : windowWidth;
		return tabChipWidth(Math.max(0, pageRight - stripLeft() - controlsRoom), props.tabs?.length ?? 0);
	};
	return (() => {
		const __nsh_hv7 = element("view");
		prop(__nsh_hv7, "class", "absolute left-0 right-0 top-0 z-20");
		prop(__nsh_hv7, "style", { height: barHeight });
		prop(__nsh_hv7, "desktop", { windowDrag: true });
		const __nsh_hv9 = element("view");
		prop(__nsh_hv9, "onPressDown", (event) => props.onChrome((event?.clickCount ?? 1) >= 2 ? "window.titlebar-double-click" : "window.drag"));
		prop(__nsh_hv9, "class", "absolute right-0 top-0 bottom-0");
		prop(__nsh_hv9, "style", { left: dragLeft });
		const __nsh_hv10 = element("view");
		bindProp(__nsh_hv10, "onPress", () => props.onToggleSidebar);
		prop(__nsh_hv10, "role", "button");
		prop(__nsh_hv10, "accessibilityLabel", "Боковая панель");
		prop(__nsh_hv10, "class", "absolute items-center justify-center");
		prop(__nsh_hv10, "desktop", { windowDrag: false });
		prop(__nsh_hv10, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv10, "style", () => ({
			top: titlebarControlTop(TOGGLE_SIZE),
			left: sidebarLeft,
			width: TOGGLE_SIZE,
			height: TOGGLE_SIZE,
			borderRadius: CONTROL_RADIUS,
			cursor: "pointer"
		}));
		insert(__nsh_hv10, component(Glyph, {
			name: "sidebar",
			size: 14,
			get color() {
				return props.colors.muted;
			}
		}));
		const __nsh_hv12 = element("view");
		prop(__nsh_hv12, "class", "absolute flex-row items-center");
		prop(__nsh_hv12, "desktop", { windowDrag: false });
		bindProp(__nsh_hv12, "style", () => ({
			left: trailLeft(),
			top: titlebarControlTop(24),
			height: 24,
			gap: 2
		}));
		insert(__nsh_hv12, [component(TrailArrow, {
			dir: "back",
			label: "Назад",
			get dark() {
				return props.dark;
			},
			get colors() {
				return props.colors;
			},
			get enabled() {
				return props.canGoBack;
			},
			get onPress() {
				return props.onGoBack;
			}
		}), component(TrailArrow, {
			dir: "forward",
			label: "Вперёд",
			get dark() {
				return props.dark;
			},
			get colors() {
				return props.colors;
			},
			get enabled() {
				return props.canGoForward;
			},
			get onPress() {
				return props.onGoForward;
			}
		})]);
		append(__nsh_hv7, __nsh_hv9);
		append(__nsh_hv7, __nsh_hv10);
		append(__nsh_hv7, __nsh_hv12);
		insert(__nsh_hv7, () => props.dimmed && (() => {
			const __nsh_hv8 = element("view");
			prop(__nsh_hv8, "class", "absolute top-0 bottom-0");
			bindProp(__nsh_hv8, "style", () => ({
				left: props.pageInset ?? 0,
				right: 0,
				backgroundColor: "#00000080",
				pointerEvents: "none"
			}));
			return __nsh_hv8;
		})(), __nsh_hv9);
		insert(__nsh_hv7, () => props.showAddGame && (() => {
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "onPress", () => props.onAddGame?.());
			prop(__nsh_hv11, "role", "button");
			prop(__nsh_hv11, "accessibilityLabel", "Добавить игру");
			prop(__nsh_hv11, "class", "absolute items-center justify-center");
			prop(__nsh_hv11, "desktop", { windowDrag: false });
			prop(__nsh_hv11, "hoverStyle", { backgroundColor: wash });
			bindProp(__nsh_hv11, "style", () => ({
				top: titlebarControlTop(28),
				right: addGameRight,
				width: 28,
				height: 28,
				borderRadius: CONTROL_RADIUS,
				cursor: "pointer"
			}));
			insert(__nsh_hv11, component(Glyph, {
				name: "plus",
				size: 16,
				get color() {
					return props.colors.muted;
				}
			}));
			return __nsh_hv11;
		})(), __nsh_hv12);
		insert(__nsh_hv7, [() => props.tabs && props.tabs.length > 0 && (() => {
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "class", "absolute flex-row items-center");
			prop(__nsh_hv13, "desktop", { windowDrag: false });
			bindProp(__nsh_hv13, "style", () => ({
				left: stripLeft(),
				right: controlsRoom,
				top: titlebarControlTop(TAB_HEIGHT),
				height: TAB_HEIGHT,
				gap: TAB_GAP,
				pointerEvents: "box-none"
			}));
			insert(__nsh_hv13, () => props.tabs.map((tab) => component(TabChip, {
				get key() {
					return tab.key;
				},
				tab,
				get colors() {
					return props.colors;
				},
				get dark() {
					return props.dark;
				},
				get width() {
					return chipWidth() < TAB_NAME_FITS ? TAB_ICON_ONLY : chipWidth();
				},
				get compact() {
					return chipWidth() < TAB_NAME_FITS;
				},
				onSelect: () => props.onSelectTab?.(tab.key),
				onClose: () => props.onCloseTab?.(tab.key),
				onMenu: (at) => props.onTabMenu?.(tab.key, at)
			})));
			return __nsh_hv13;
		})(), () => drawCaptions && (() => {
			const __nsh_hv14 = element("view");
			prop(__nsh_hv14, "class", "absolute right-0 top-0 flex-row items-center");
			prop(__nsh_hv14, "desktop", { windowDrag: false });
			prop(__nsh_hv14, "style", {
				height: 48,
				paddingRight: TRAILING_INSET
			});
			const __nsh_hv15 = element("view");
			prop(__nsh_hv15, "onPress", () => props.onChrome("window.minimize"));
			prop(__nsh_hv15, "role", "button");
			prop(__nsh_hv15, "accessibilityLabel", "Свернуть окно");
			prop(__nsh_hv15, "class", "items-center justify-center");
			prop(__nsh_hv15, "desktop", { windowDrag: false });
			prop(__nsh_hv15, "hoverStyle", { backgroundColor: wash });
			prop(__nsh_hv15, "style", {
				width: CAPTION_BUTTON_WIDTH,
				height: CAPTION_BUTTON_HEIGHT,
				borderRadius: CONTROL_RADIUS,
				cursor: "pointer"
			});
			insert(__nsh_hv15, component(Icon, {
				name: "windowMin",
				get color() {
					return props.colors.muted;
				},
				size: 14
			}));
			const __nsh_hv16 = element("view");
			prop(__nsh_hv16, "onPress", () => props.onChrome("window.zoom"));
			prop(__nsh_hv16, "role", "button");
			prop(__nsh_hv16, "accessibilityLabel", "Развернуть окно");
			prop(__nsh_hv16, "class", "items-center justify-center");
			prop(__nsh_hv16, "desktop", { windowDrag: false });
			prop(__nsh_hv16, "hoverStyle", { backgroundColor: wash });
			prop(__nsh_hv16, "style", {
				width: CAPTION_BUTTON_WIDTH,
				height: CAPTION_BUTTON_HEIGHT,
				borderRadius: CONTROL_RADIUS,
				cursor: "pointer"
			});
			insert(__nsh_hv16, component(Icon, {
				name: "windowMax",
				get color() {
					return props.colors.muted;
				},
				size: 14
			}));
			const __nsh_hv17 = element("view");
			prop(__nsh_hv17, "onPress", () => props.onChrome("window.close"));
			prop(__nsh_hv17, "onMouseEnter", () => closeHovered.set(true));
			prop(__nsh_hv17, "onMouseLeave", () => closeHovered.set(false));
			prop(__nsh_hv17, "role", "button");
			prop(__nsh_hv17, "accessibilityLabel", "Закрыть окно");
			prop(__nsh_hv17, "class", "items-center justify-center");
			prop(__nsh_hv17, "desktop", { windowDrag: false });
			prop(__nsh_hv17, "hoverStyle", { backgroundColor: "#e81123" });
			prop(__nsh_hv17, "style", {
				width: CAPTION_BUTTON_WIDTH,
				height: CAPTION_BUTTON_HEIGHT,
				borderRadius: CONTROL_RADIUS,
				cursor: "pointer"
			});
			insert(__nsh_hv17, component(Icon, {
				name: "windowClose",
				get color() {
					return closeHovered() ? "#ffffff" : props.colors.muted;
				},
				size: 14
			}));
			append(__nsh_hv14, __nsh_hv15);
			append(__nsh_hv14, __nsh_hv16);
			append(__nsh_hv14, __nsh_hv17);
			return __nsh_hv14;
		})()]);
		return __nsh_hv7;
	})();
}
function SidebarRow(props) {
	const wash = hoverWash(props.dark);
	return (() => {
		const __nsh_hv18 = element("view");
		bindProp(__nsh_hv18, "onPress", () => props.onPress);
		prop(__nsh_hv18, "role", "button");
		bindProp(__nsh_hv18, "accessibilityState", () => ({ selected: props.selected }));
		prop(__nsh_hv18, "desktop", { windowDrag: false });
		prop(__nsh_hv18, "class", "flex-row items-center");
		prop(__nsh_hv18, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv18, "style", () => ({
			height: 40,
			gap: 10,
			paddingLeft: 10,
			paddingRight: 10,
			borderRadius: NAV_ROW_RADIUS,
			backgroundColor: props.selected ? raisedFill(props.colors, props.dark) : "transparent",
			cursor: "pointer"
		}));
		const __nsh_hv19 = element("text");
		prop(__nsh_hv19, "class", "text-[14px]");
		bindProp(__nsh_hv19, "style", () => ({
			color: props.colors.foreground,
			fontWeight: 500,
			lineHeight: 20
		}));
		insert(__nsh_hv19, () => props.label);
		append(__nsh_hv18, __nsh_hv19);
		insert(__nsh_hv18, component(Glyph, {
			get name() {
				return props.icon;
			},
			size: 16,
			get color() {
				return props.colors.foreground;
			}
		}), __nsh_hv19);
		return __nsh_hv18;
	})();
}
function RecentRow(props) {
	const wash = hoverWash(props.dark);
	return (() => {
		const __nsh_hv20 = element("view");
		bindProp(__nsh_hv20, "onPress", () => props.onPress);
		prop(__nsh_hv20, "role", "button");
		bindProp(__nsh_hv20, "accessibilityLabel", () => props.entry.title);
		bindProp(__nsh_hv20, "accessibilityState", () => ({ selected: Boolean(props.selected) }));
		prop(__nsh_hv20, "desktop", { windowDrag: false });
		prop(__nsh_hv20, "class", "flex-row items-center");
		prop(__nsh_hv20, "hoverStyle", { backgroundColor: wash });
		bindProp(__nsh_hv20, "style", () => ({
			height: 34,
			gap: 10,
			paddingLeft: 10,
			paddingRight: 10,
			borderRadius: NAV_ROW_RADIUS,
			backgroundColor: props.selected ? raisedFill(props.colors, props.dark) : "transparent",
			cursor: "pointer"
		}));
		const __nsh_hv21 = element("text");
		prop(__nsh_hv21, "class", "text-[14px] truncate");
		bindProp(__nsh_hv21, "style", () => ({
			color: props.colors.foreground,
			fontWeight: 500,
			lineHeight: 20
		}));
		insert(__nsh_hv21, () => props.entry.title);
		append(__nsh_hv20, __nsh_hv21);
		insert(__nsh_hv20, component(Glyph, {
			get name() {
				return recentIcon(props.entry.kind);
			},
			size: 14,
			get color() {
				return props.colors.foreground;
			}
		}), __nsh_hv21);
		return __nsh_hv20;
	})();
}
function GhostButton(props) {
	return (() => {
		const __nsh_hv22 = element("view");
		bindProp(__nsh_hv22, "onPress", () => props.onPress);
		prop(__nsh_hv22, "role", "button");
		bindProp(__nsh_hv22, "accessibilityLabel", () => props.label);
		prop(__nsh_hv22, "class", "items-center justify-center");
		bindProp(__nsh_hv22, "hoverStyle", () => ({ backgroundColor: props.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }));
		prop(__nsh_hv22, "style", {
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: ROW_RADIUS,
			cursor: "pointer"
		});
		const __nsh_hv23 = element("text");
		bindProp(__nsh_hv23, "class", () => `text-[13px] hover:text-[${props.colors.foreground}]`);
		bindProp(__nsh_hv23, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv23, () => props.label);
		append(__nsh_hv22, __nsh_hv23);
		return __nsh_hv22;
	})();
}
function SolidButton(props) {
	return (() => {
		const __nsh_hv24 = element("view");
		bindProp(__nsh_hv24, "onPress", () => props.onPress);
		prop(__nsh_hv24, "role", "button");
		bindProp(__nsh_hv24, "accessibilityLabel", () => props.label);
		prop(__nsh_hv24, "class", "items-center justify-center");
		prop(__nsh_hv24, "hoverStyle", { opacity: .9 });
		bindProp(__nsh_hv24, "style", () => ({
			height: 32,
			paddingLeft: 12,
			paddingRight: 12,
			borderRadius: ROW_RADIUS,
			backgroundColor: props.background,
			cursor: "pointer"
		}));
		const __nsh_hv25 = element("text");
		prop(__nsh_hv25, "class", "text-[13px] font-medium");
		bindProp(__nsh_hv25, "style", () => ({ color: props.foreground }));
		insert(__nsh_hv25, () => props.label);
		append(__nsh_hv24, __nsh_hv25);
		return __nsh_hv24;
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
const weekdays = [
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
	return `${weekdays[group.date.getDay()]}, ${group.date.getDate()} ${monthNamesInDate[group.date.getMonth()]}${year}`;
}
function formatJournalStamp(createdAt, _now = /* @__PURE__ */ new Date()) {
	const date = new Date(createdAt);
	if (Number.isNaN(date.valueOf())) return "";
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

//#endregion
//#region JournalPage.tsx
/** The mic: the journal's voice button, tinted from the bubble it sits on. */
const DotScope = nativeComponent("atlas.scope", {
	props: [
		"level",
		"active",
		"done"
	],
	events: []
});
const COMPOSER_RADIUS = 25;
const COMPOSER_EXPANDED_RADIUS = 18;
const COMPOSER_COMPACT_HEIGHT = 49;
/** The recording scope sits in its own compartment above the field. */
const SCOPE_HEIGHT = 64;
const SCOPE_RADIUS = 26;
const COMPOSER_SEND = 31;
const COMPOSER_BUTTON_INSET = 8;
const composerFont = () => textSize() - 1;
const composerLine = () => Math.round(composerFont() * 22 / 15);
const COMPOSER_PAD_X = 16;
const COMPOSER_PAD_Y = 12;
const COMPOSER_MAX_WINDOW_SHARE = .7;
const COMPOSER_MAX_HEIGHT_FALLBACK = 168;
/** Matches RichEditor's caret in notes (`nsh-base`: 1.5 pt wide, ~0.85 * asc+desc tall, 530 ms blink). */
const CARET_WIDTH = 1.5;
const caretHeight = () => composerFont() * 1.02;
const CARET_BLINK_MS = 530;
const COMPOSER_BOTTOM_MARGIN = 18;
const COMPOSER_FEED_GAP = 14;
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
function createCaretState(initial) {
	const focused = signal(false);
	const selection = signal({
		start: 0,
		end: 0
	});
	const composing = signal(false);
	const rect = signal(initial);
	const on = signal(true);
	const tick = signal(0);
	const bump = () => {
		on.set(true);
		tick.update((n) => n + 1);
	};
	const place = (bounds) => {
		const height = bounds.size.height;
		if (height <= 0) return;
		rect.set({
			x: bounds.origin.x,
			y: bounds.origin.y,
			height
		});
		bump();
	};
	const active = () => {
		const range = selection();
		return focused() && (windows()[0]?.state()?.focused ?? true) && range.start === range.end && !composing();
	};
	const focus = () => {
		focused.set(true);
		bump();
	};
	const blur = () => {
		focused.set(false);
		selection.set({
			start: 0,
			end: 0
		});
		composing.set(false);
	};
	const reset = () => {
		selection.set({
			start: 0,
			end: 0
		});
		composing.set(false);
		rect.set(initial);
		bump();
	};
	return {
		focused,
		selection,
		composing,
		rect,
		on,
		tick,
		bump,
		place,
		active,
		focus,
		blur,
		reset
	};
}
const journalDraft = signal("");
const journalDraftContentHeight = signal(composerLine());
const composerCaret = createCaretState({
	x: COMPOSER_PAD_X,
	y: COMPOSER_PAD_Y,
	height: composerLine()
});
const editCaret = createCaretState({
	x: 8,
	y: 4,
	height: composerLine()
});
const journalScrollY = signal(0);
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
	if (editingJournalId() || composerCaret.focused()) return;
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
function composerMaxHeight(windowHeight) {
	if (windowHeight <= 0) return COMPOSER_MAX_HEIGHT_FALLBACK;
	return Math.max(COMPOSER_COMPACT_HEIGHT, Math.round(windowHeight * COMPOSER_MAX_WINDOW_SHARE));
}
function composerMaxContent() {
	return Math.max(composerLine(), composerMaxHeight(feedBox().height) - 24);
}
function clampDraftHeight(height) {
	return Math.round(Math.max(composerLine(), Math.min(composerMaxContent(), height)));
}
function composerContentHeight() {
	return Math.max(composerLine(), journalDraftContentHeight());
}
function composerInputHeight() {
	return composerContentHeight() + 24;
}
function composerViewportHeight() {
	return clampDraftHeight(composerContentHeight()) + 24;
}
function composerPillHeight() {
	return Math.max(COMPOSER_COMPACT_HEIGHT, Math.min(composerMaxHeight(feedBox().height), composerViewportHeight()));
}
function composerMaxScroll() {
	return Math.max(0, composerInputHeight() - composerViewportHeight());
}
function composerBottomInset() {
	return composerPillHeight() + (scopeShown() ? scopeHeight() : 0) + COMPOSER_BOTTOM_MARGIN + COMPOSER_FEED_GAP;
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
	return journalDraftContentHeight() > composerLine() + 1;
}
function composerCorners(expanded, scoped) {
	const outer = expanded ? COMPOSER_EXPANDED_RADIUS : scoped ? SCOPE_RADIUS : COMPOSER_RADIUS;
	return {
		outer,
		button: Math.min(Math.ceil(COMPOSER_SEND / 2), Math.max(8, outer - COMPOSER_BUTTON_INSET))
	};
}
function composerCaretBox(caret, ratio) {
	const dpr = Math.max(1, ratio);
	const snap = (value) => Math.round(value * dpr) / dpr;
	const width = Math.max(1 / dpr, snap(CARET_WIDTH));
	const height = snap(Math.min(caret.height, caretHeight()));
	const top = snap(caret.y + (caret.height - height) * .5);
	return {
		left: Math.max(0, snap(caret.x - width * .5)),
		top,
		width,
		height
	};
}
function EditorCaret(props) {
	effect(() => {
		if (!props.caret.active()) {
			props.caret.on.set(false);
			return;
		}
		props.caret.tick();
		props.caret.on.set(true);
		let timer = setTimeout(function step() {
			props.caret.on.update((visible) => !visible);
			timer = setTimeout(step, CARET_BLINK_MS);
		}, CARET_BLINK_MS);
		return () => clearTimeout(timer);
	});
	const box = () => composerCaretBox(props.caret.rect(), pixelRatio());
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "absolute");
		bindProp(__nsh_hv0, "style", () => ({
			pointerEvents: "none",
			left: box().left,
			top: box().top,
			width: box().width,
			height: box().height,
			backgroundColor: props.color,
			opacity: props.caret.active() && props.caret.on() ? 1 : 0,
			zIndex: 1
		}));
		return __nsh_hv0;
	})();
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
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "flex-row items-center");
		prop(__nsh_hv1, "style", {
			gap: 10,
			height: 26
		});
		const __nsh_hv2 = element("view");
		prop(__nsh_hv2, "onPress", () => props.onPlay(props.entry));
		prop(__nsh_hv2, "role", "button");
		bindProp(__nsh_hv2, "accessibilityLabel", () => props.playing ? "Остановить голосовую запись" : "Прослушать голосовую запись");
		bindProp(__nsh_hv2, "accessibilityState", () => ({ selected: props.playing }));
		prop(__nsh_hv2, "class", "shrink-0 items-center justify-center rounded-full");
		prop(__nsh_hv2, "hoverStyle", { opacity: .8 });
		prop(__nsh_hv2, "activeStyle", { opacity: .6 });
		bindProp(__nsh_hv2, "style", () => ({
			width: 24,
			height: 24,
			backgroundColor: colorAlpha("#ffffff", .24),
			cursor: "pointer"
		}));
		const __nsh_hv3 = element("text");
		prop(__nsh_hv3, "class", "text-[10px]");
		prop(__nsh_hv3, "style", { color: "#ffffff" });
		insert(__nsh_hv3, () => props.playing ? "■" : "▶");
		append(__nsh_hv2, __nsh_hv3);
		const __nsh_hv4 = element("view");
		prop(__nsh_hv4, "class", "flex-row items-center");
		prop(__nsh_hv4, "style", {
			gap: 2,
			height: VOICE_BAR_MAX
		});
		insert(__nsh_hv4, each(() => voice.peaks, (peak) => (() => {
			const __nsh_hv5 = element("view");
			bindProp(__nsh_hv5, "style", () => ({
				width: 2,
				borderRadius: 1,
				backgroundColor: colorAlpha("#ffffff", .78),
				height: voiceBarHeight(peak())
			}));
			return __nsh_hv5;
		})()));
		const __nsh_hv6 = element("text");
		prop(__nsh_hv6, "class", "text-[12px]");
		bindProp(__nsh_hv6, "style", () => ({
			color: colorAlpha("#ffffff", .82),
			fontVariantNumeric: "tabular-nums"
		}));
		insert(__nsh_hv6, () => formatVoiceDuration(voice.durationMs));
		append(__nsh_hv1, __nsh_hv2);
		append(__nsh_hv1, __nsh_hv4);
		append(__nsh_hv1, __nsh_hv6);
		return __nsh_hv1;
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
	const bubbleBg = () => journalBubble(props.colors.accent);
	const bubbleInk = () => accentMark(bubbleBg());
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
		const __nsh_hv7 = element("view");
		prop(__nsh_hv7, "onMouseEnter", () => showJournalDate(props.entry.id));
		prop(__nsh_hv7, "onMouseLeave", () => hideJournalDate(props.entry.id));
		prop(__nsh_hv7, "class", "mb-1 w-full flex-row items-center justify-end");
		const __nsh_hv9 = element("view");
		prop(__nsh_hv9, "onContextMenu", openEntryMenu);
		prop(__nsh_hv9, "class", "max-w-[75%] px-3 py-2");
		bindProp(__nsh_hv9, "style", () => ({
			backgroundColor: editingJournalId() === props.entry.id ? props.colors.card : bubbleBg(),
			borderRadius: BUBBLE_RADIUS,
			transformOrigin: "bottom right",
			...sendMotion?.style ?? {}
		}));
		insert(__nsh_hv9, () => editingJournalId() === props.entry.id ? (() => {
			const __nsh_hv10 = element("view");
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "class", "relative w-full overflow-hidden rounded-lg");
			const __nsh_hv12 = element("input");
			prop(__nsh_hv12, "ref", (node) => {
				editFocus = node;
			});
			prop(__nsh_hv12, "autoFocus", true);
			bindProp(__nsh_hv12, "value", () => editingJournalText());
			prop(__nsh_hv12, "onChange", (e) => {
				editingJournalText.set(e.value);
				editCaret.bump();
			});
			prop(__nsh_hv12, "onCaretMove", (event) => editCaret.place(event.bounds));
			prop(__nsh_hv12, "onSelectionChange", (range) => editCaret.selection.set(range));
			prop(__nsh_hv12, "onCompositionChange", (event) => editCaret.composing.set(event.composing));
			bindProp(__nsh_hv12, "onFocus", () => editCaret.focus);
			bindProp(__nsh_hv12, "onBlur", () => editCaret.blur);
			prop(__nsh_hv12, "multiline", true);
			prop(__nsh_hv12, "submitBehavior", "newline");
			prop(__nsh_hv12, "caret", false);
			prop(__nsh_hv12, "accessibilityLabel", "Текст записи");
			prop(__nsh_hv12, "class", "min-h-[56px] w-full rounded-lg px-2 py-1 text-[15px]");
			bindProp(__nsh_hv12, "style", () => ({
				fontSize: composerFont(),
				lineHeight: composerLine(),
				color: props.colors.foreground,
				backgroundColor: props.colors.background,
				selectionColor: props.colors.accent
			}));
			append(__nsh_hv11, __nsh_hv12);
			insert(__nsh_hv11, component(EditorCaret, {
				caret: editCaret,
				get color() {
					return props.colors.accent;
				}
			}));
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "class", "mt-2 flex-row justify-end");
			prop(__nsh_hv13, "style", { gap: 8 });
			insert(__nsh_hv13, [component(GhostButton, {
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
			append(__nsh_hv10, __nsh_hv11);
			append(__nsh_hv10, __nsh_hv13);
			return __nsh_hv10;
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
			const __nsh_hv14 = element("text");
			prop(__nsh_hv14, "onContextMenu", openEntryMenu);
			prop(__nsh_hv14, "class", "select-text text-[15px] leading-5");
			bindProp(__nsh_hv14, "style", () => ({
				color: bubbleInk(),
				fontSize: composerFont(),
				lineHeight: composerLine(),
				fontWeight: 500,
				selectionColor: bubbleInk()
			}));
			insert(__nsh_hv14, () => props.entry.text);
			return __nsh_hv14;
		})());
		append(__nsh_hv7, __nsh_hv9);
		insert(__nsh_hv7, () => journalDateShown() === props.entry.id && (() => {
			const __nsh_hv8 = element("text");
			prop(__nsh_hv8, "class", "mr-2 text-[11px]");
			bindProp(__nsh_hv8, "style", () => ({
				color: props.colors.muted,
				pointerEvents: "none"
			}));
			insert(__nsh_hv8, () => formatJournalStamp(props.entry.createdAt));
			return __nsh_hv8;
		})(), __nsh_hv9);
		return __nsh_hv7;
	})();
}
function JournalPage(props) {
	let feedRef;
	let composerScrollRef;
	const revealComposer = (caret) => {
		const viewport = composerViewportHeight();
		const max = composerMaxScroll();
		const top = Math.max(0, caret.y - COMPOSER_PAD_Y);
		const bottom = caret.y + Math.max(caret.height, composerLine()) + COMPOSER_PAD_Y;
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
	effect(() => {
		const max = composerMaxScroll();
		if (journalScrollY() > max) {
			journalScrollY.set(max);
			composerScrollRef?.scrollTo({
				y: max,
				animated: false
			});
		}
	});
	const groups = () => buildJournalDays(props.entries());
	effect(() => {
		if (props.entries().length) queueMicrotask(() => feedRef?.scrollToEnd({ animated: true }));
	});
	let prevEditing = editingJournalId();
	effect(() => {
		const editing = editingJournalId();
		if (editing === prevEditing) return;
		prevEditing = editing;
		queueMicrotask(() => {
			if (editing) editFocus?.focus();
			else composerRef?.focus();
		});
	});
	effect(() => () => {
		composerCaret.blur();
		editCaret.blur();
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
		journalDraftContentHeight.set(composerLine());
		journalScrollY.set(0);
		composerScrollRef?.scrollTo({
			y: 0,
			animated: false
		});
		composerCaret.reset();
		composerRef?.focus();
	};
	return (() => {
		const __nsh_hv15 = element("view");
		prop(__nsh_hv15, "class", "min-h-0 flex-1 overflow-hidden");
		const __nsh_hv16 = element("view");
		prop(__nsh_hv16, "class", "relative min-h-0 flex-1 flex-col items-center");
		const __nsh_hv17 = element("view");
		prop(__nsh_hv17, "class", "relative min-h-0 w-full flex-1");
		const __nsh_hv18 = element("scroll");
		prop(__nsh_hv18, "ref", (node) => {
			feedRef = node;
		});
		prop(__nsh_hv18, "onLayout", (e) => feedBox.set({
			width: e.bounds.size.width,
			height: e.bounds.size.height
		}));
		prop(__nsh_hv18, "contentStyle", { flexGrow: 1 });
		prop(__nsh_hv18, "class", "min-h-0 w-full flex-1");
		const __nsh_hv19 = element("view");
		prop(__nsh_hv19, "onMouseLeave", leaveJournalDates);
		prop(__nsh_hv19, "class", "mx-auto justify-end");
		bindProp(__nsh_hv19, "style", () => ({
			width: threadSpan(),
			minHeight: feedBox().height,
			paddingTop: props.titlebarInset,
			paddingBottom: composerBottomInset(),
			paddingLeft: FEED_PAD,
			paddingRight: FEED_PAD
		}));
		insert(__nsh_hv19, [each(() => groups(), (group) => (() => {
			const __nsh_hv20 = element("view");
			prop(__nsh_hv20, "class", "mb-4");
			const __nsh_hv21 = element("text");
			prop(__nsh_hv21, "class", "mb-3 text-center text-[12px]");
			bindProp(__nsh_hv21, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv21, () => formatJournalDay(group()));
			append(__nsh_hv20, __nsh_hv21);
			insert(__nsh_hv20, each(() => group().entries, (entry) => component(JournalBubble, {
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
			return __nsh_hv20;
		})(), ((group) => group.key)), () => groups().length === 0 && (() => {
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
		append(__nsh_hv18, __nsh_hv19);
		const __nsh_hv25 = element("view");
		prop(__nsh_hv25, "class", "absolute right-0 top-0 bottom-0 w-[8px]");
		bindProp(__nsh_hv25, "style", () => ({
			backgroundColor: props.colors.background,
			opacity: .86,
			borderRadius: 14,
			pointerEvents: "none"
		}));
		append(__nsh_hv17, __nsh_hv18);
		append(__nsh_hv17, __nsh_hv25);
		const __nsh_hv26 = element("view");
		prop(__nsh_hv26, "class", "absolute left-0 right-0 bottom-0 items-center");
		prop(__nsh_hv26, "style", {
			paddingBottom: COMPOSER_BOTTOM_MARGIN,
			pointerEvents: "box-none"
		});
		const __nsh_hv27 = element("view");
		prop(__nsh_hv27, "class", "mx-auto w-full");
		prop(__nsh_hv27, "style", {
			maxWidth: THREAD_WIDTH,
			paddingLeft: FEED_PAD,
			paddingRight: FEED_PAD,
			pointerEvents: "box-none"
		});
		const __nsh_hv28 = element("view");
		prop(__nsh_hv28, "onPress", claimJournalComposer);
		prop(__nsh_hv28, "class", "w-full overflow-hidden");
		bindProp(__nsh_hv28, "style", () => ({
			borderRadius: composerCorners(composerExpanded(), scopeShown()).outer,
			backgroundColor: props.colors.card
		}));
		const __nsh_hv32 = element("view");
		prop(__nsh_hv32, "class", "w-full flex-row");
		bindProp(__nsh_hv32, "style", () => ({
			height: composerPillHeight(),
			alignItems: composerExpanded() ? "flex-end" : "center",
			backgroundColor: "transparent"
		}));
		insert(__nsh_hv32, [
			() => !props.recording() && (() => {
				const __nsh_hv33 = element("view");
				prop(__nsh_hv33, "class", "relative min-w-0 flex-1 overflow-hidden");
				bindProp(__nsh_hv33, "style", () => ({ height: composerViewportHeight() }));
				const __nsh_hv34 = element("scroll");
				prop(__nsh_hv34, "ref", (node) => {
					composerScrollRef = node;
				});
				prop(__nsh_hv34, "scrollbar", false);
				prop(__nsh_hv34, "onScroll", (event) => journalScrollY.set(Math.max(0, Math.min(composerMaxScroll(), event.offset.y))));
				prop(__nsh_hv34, "class", "w-full");
				bindProp(__nsh_hv34, "style", () => ({ height: composerViewportHeight() }));
				const __nsh_hv35 = element("view");
				prop(__nsh_hv35, "class", "relative w-full overflow-hidden");
				bindProp(__nsh_hv35, "style", () => ({ height: composerInputHeight() }));
				const __nsh_hv36 = element("input");
				prop(__nsh_hv36, "ref", (node) => {
					composerRef = node;
				});
				prop(__nsh_hv36, "autoFocus", true);
				bindProp(__nsh_hv36, "value", () => journalDraft());
				prop(__nsh_hv36, "onChange", (e) => {
					journalDraft.set(e.value);
					composerCaret.bump();
				});
				prop(__nsh_hv36, "onContentSizeChange", ({ size }) => {
					const raw = Math.max(composerLine(), Math.round(size.height));
					if (raw === journalDraftContentHeight()) return;
					if (clampDraftHeight(raw) !== clampDraftHeight(journalDraftContentHeight())) animateComposer();
					journalDraftContentHeight.set(raw);
					revealComposer(composerCaret.rect());
				});
				prop(__nsh_hv36, "onCaretMove", (event) => {
					composerCaret.place(event.bounds);
					revealComposer(composerCaret.rect());
				});
				prop(__nsh_hv36, "onSelectionChange", (range) => composerCaret.selection.set(range));
				prop(__nsh_hv36, "onCompositionChange", (event) => composerCaret.composing.set(event.composing));
				bindProp(__nsh_hv36, "onFocus", () => composerCaret.focus);
				bindProp(__nsh_hv36, "onBlur", () => composerCaret.blur);
				prop(__nsh_hv36, "onSubmit", (event) => send(event.text));
				prop(__nsh_hv36, "multiline", true);
				prop(__nsh_hv36, "submitBehavior", "submit");
				prop(__nsh_hv36, "caret", false);
				prop(__nsh_hv36, "placeholder", "Запись в дневник…");
				prop(__nsh_hv36, "accessibilityLabel", "Новая запись в дневник");
				prop(__nsh_hv36, "class", "min-w-0 w-full text-[15px]");
				bindProp(__nsh_hv36, "style", () => ({
					height: composerInputHeight(),
					maxHeight: composerInputHeight(),
					fontSize: composerFont(),
					lineHeight: composerLine(),
					paddingLeft: COMPOSER_PAD_X,
					paddingRight: 8,
					paddingTop: COMPOSER_PAD_Y,
					paddingBottom: COMPOSER_PAD_Y,
					placeholderColor: props.colors.muted,
					selectionColor: props.colors.accent,
					backgroundColor: "transparent",
					color: props.colors.foreground
				}));
				append(__nsh_hv35, __nsh_hv36);
				insert(__nsh_hv35, component(EditorCaret, {
					caret: composerCaret,
					get color() {
						return props.colors.accent;
					}
				}));
				append(__nsh_hv34, __nsh_hv35);
				append(__nsh_hv33, __nsh_hv34);
				insert(__nsh_hv33, [() => composerFadeTop() && (() => {
					const __nsh_hv37 = element("view");
					prop(__nsh_hv37, "class", "absolute left-0 right-0 top-0");
					bindProp(__nsh_hv37, "style", () => ({
						pointerEvents: "none",
						height: COMPOSER_FADE,
						backgroundImage: `linear-gradient(to bottom, ${props.colors.card}, ${colorAlpha(props.colors.card, 0)})`,
						zIndex: 2
					}));
					return __nsh_hv37;
				})(), () => composerFadeBottom() && (() => {
					const __nsh_hv38 = element("view");
					prop(__nsh_hv38, "class", "absolute left-0 right-0 bottom-0");
					bindProp(__nsh_hv38, "style", () => ({
						pointerEvents: "none",
						height: COMPOSER_FADE,
						backgroundImage: `linear-gradient(to bottom, ${colorAlpha(props.colors.card, 0)}, ${props.colors.card})`,
						zIndex: 2
					}));
					return __nsh_hv38;
				})()]);
				return __nsh_hv33;
			})(),
			() => props.recording() && (() => {
				const __nsh_hv39 = element("view");
				prop(__nsh_hv39, "class", "min-w-0 flex-1 flex-row items-center");
				prop(__nsh_hv39, "style", {
					paddingLeft: COMPOSER_PAD_X,
					gap: 8
				});
				const __nsh_hv40 = element("view");
				prop(__nsh_hv40, "class", "shrink-0 rounded-full");
				prop(__nsh_hv40, "style", {
					width: 8,
					height: 8,
					backgroundColor: "#ff453a"
				});
				const __nsh_hv41 = element("text");
				prop(__nsh_hv41, "class", "text-[13px]");
				bindProp(__nsh_hv41, "style", () => ({
					color: props.colors.foreground,
					fontVariantNumeric: "tabular-nums"
				}));
				insert(__nsh_hv41, () => formatVoiceDuration(props.elapsed()));
				append(__nsh_hv39, __nsh_hv40);
				append(__nsh_hv39, __nsh_hv41);
				return __nsh_hv39;
			})(),
			() => journalDraft().trim() ? (() => {
				const __nsh_hv42 = element("view");
				prop(__nsh_hv42, "onPress", () => send(journalDraft()));
				prop(__nsh_hv42, "role", "button");
				prop(__nsh_hv42, "accessibilityLabel", "Отправить запись");
				prop(__nsh_hv42, "class", "shrink-0 items-center justify-center");
				bindProp(__nsh_hv42, "hoverStyle", () => ({ opacity: journalDraft().trim() ? .85 : .35 }));
				bindProp(__nsh_hv42, "activeStyle", () => ({ opacity: journalDraft().trim() ? .7 : .35 }));
				bindProp(__nsh_hv42, "style", () => ({
					width: COMPOSER_SEND,
					height: COMPOSER_SEND,
					borderRadius: composerCorners(composerExpanded(), scopeShown()).button,
					marginRight: COMPOSER_BUTTON_INSET,
					marginBottom: composerExpanded() ? COMPOSER_BUTTON_INSET : 0,
					backgroundColor: journalBubble(props.colors.accent),
					opacity: journalDraft().trim() ? 1 : .35,
					cursor: journalDraft().trim() ? "pointer" : "default"
				}));
				const __nsh_hv43 = element("text");
				prop(__nsh_hv43, "class", "text-[14px] font-semibold");
				bindProp(__nsh_hv43, "style", () => ({ color: accentMark(journalBubble(props.colors.accent)) }));
				const __nsh_hv44 = text("↑");
				append(__nsh_hv43, __nsh_hv44);
				append(__nsh_hv42, __nsh_hv43);
				return __nsh_hv42;
			})() : props.recording() ? (() => {
				const __nsh_hv45 = element("view");
				prop(__nsh_hv45, "onPress", () => {
					animateComposer();
					props.onStopRecording();
				});
				prop(__nsh_hv45, "role", "button");
				prop(__nsh_hv45, "accessibilityLabel", "Остановить запись");
				prop(__nsh_hv45, "accessibilityState", { selected: true });
				prop(__nsh_hv45, "class", "shrink-0 items-center justify-center");
				prop(__nsh_hv45, "hoverStyle", { opacity: .85 });
				prop(__nsh_hv45, "activeStyle", { opacity: .7 });
				bindProp(__nsh_hv45, "style", () => ({
					width: COMPOSER_SEND,
					height: COMPOSER_SEND,
					borderRadius: composerCorners(composerExpanded(), scopeShown()).button,
					marginRight: COMPOSER_BUTTON_INSET,
					marginBottom: composerExpanded() ? COMPOSER_BUTTON_INSET : 0,
					backgroundColor: "#ff453a",
					cursor: "pointer"
				}));
				const __nsh_hv46 = element("view");
				prop(__nsh_hv46, "style", {
					width: 10,
					height: 10,
					borderRadius: 2,
					backgroundColor: "#ffffff"
				});
				append(__nsh_hv45, __nsh_hv46);
				return __nsh_hv45;
			})() : (() => {
				const __nsh_hv47 = element("view");
				prop(__nsh_hv47, "onPress", () => {
					animateComposer();
					props.onStartRecording();
				});
				prop(__nsh_hv47, "role", "button");
				prop(__nsh_hv47, "accessibilityLabel", "Записать голос");
				prop(__nsh_hv47, "class", "shrink-0 items-center justify-center");
				prop(__nsh_hv47, "hoverStyle", { opacity: .85 });
				prop(__nsh_hv47, "activeStyle", { opacity: .7 });
				bindProp(__nsh_hv47, "style", () => ({
					width: COMPOSER_SEND,
					height: COMPOSER_SEND,
					borderRadius: composerCorners(composerExpanded(), scopeShown()).button,
					marginRight: COMPOSER_BUTTON_INSET,
					marginBottom: composerExpanded() ? COMPOSER_BUTTON_INSET : 0,
					backgroundColor: journalBubble(props.colors.accent),
					cursor: "pointer"
				}));
				insert(__nsh_hv47, component(Glyph, {
					name: "mic",
					size: 17,
					get color() {
						return accentMark(journalBubble(props.colors.accent));
					}
				}));
				return __nsh_hv47;
			})()
		]);
		append(__nsh_hv28, __nsh_hv32);
		insert(__nsh_hv28, [() => scopeShown() && (() => {
			const __nsh_hv29 = element("view");
			prop(__nsh_hv29, "class", "relative w-full overflow-hidden");
			bindProp(__nsh_hv29, "style", () => ({
				height: scopeHeight(),
				opacity: scopeOpacity()
			}));
			const __nsh_hv30 = element("view");
			prop(__nsh_hv30, "class", "absolute left-0 right-0 top-0 bottom-0");
			insert(__nsh_hv30, component(DotScope, {
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
			append(__nsh_hv29, __nsh_hv30);
			return __nsh_hv29;
		})(), () => scopeShown() && (() => {
			const __nsh_hv31 = element("view");
			prop(__nsh_hv31, "class", "w-full");
			bindProp(__nsh_hv31, "style", () => ({
				height: scopeHeight() > .5 ? 1 : 0,
				backgroundColor: props.colors.border
			}));
			return __nsh_hv31;
		})()], __nsh_hv32);
		append(__nsh_hv27, __nsh_hv28);
		append(__nsh_hv26, __nsh_hv27);
		append(__nsh_hv16, __nsh_hv17);
		append(__nsh_hv16, __nsh_hv26);
		append(__nsh_hv15, __nsh_hv16);
		return __nsh_hv15;
	})();
}

//#endregion
//#region fonts/GeistMono-Regular.ttf
var GeistMono_Regular_default = font("asset:/fonts/GeistMono-Regular.ttf", "Geist Mono");

//#endregion
//#region fonts/GeistMono-Medium.ttf
var GeistMono_Medium_default = font("asset:/fonts/GeistMono-Medium.ttf", "Geist Mono");

//#endregion
//#region highlight.ts
const WORDS = {
	rust: "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while",
	ts: "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends false finally for from function get if implements import in instanceof interface let new null of private protected public readonly return set static super switch this throw true try type typeof undefined var void while yield",
	js: "async await break case catch class const continue debugger default delete do else export extends false finally for function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield",
	python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
	go: "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil",
	sql: "add all alter and as asc between by case cast column create delete desc distinct drop else end exists from group having in index inner insert into is join key left like limit not null off offset on or order outer primary references right select set table then union unique update values when where with",
	bash: "if then else elif fi for while do done case esac function in export local readonly return exit echo cd source set unset",
	json: "true false null",
	css: "important media supports font face keyframes import from to",
	html: "",
	markdown: ""
};
const WORD_SET = {};
function wordsOf(language) {
	if (!WORD_SET[language]) WORD_SET[language] = new Set((WORDS[language] ?? "").split(/\s+/).filter(Boolean));
	return WORD_SET[language];
}
const ALIASES = {
	rs: "rust",
	js: "js",
	javascript: "js",
	jsx: "js",
	mjs: "js",
	tsx: "ts",
	typescript: "ts",
	py: "python",
	python3: "python",
	sh: "bash",
	shell: "bash",
	zsh: "bash",
	console: "bash",
	golang: "go",
	postgres: "sql",
	postgresql: "sql",
	mysql: "sql",
	sqlite: "sql",
	yml: "yaml",
	yaml: "yaml",
	md: "markdown",
	markdown: "markdown",
	text: "",
	plaintext: "",
	htm: "html",
	xml: "html",
	svg: "html",
	scss: "css",
	less: "css"
};
function languageOf(name) {
	const key = (name ?? "").trim().toLowerCase();
	if (!key) return "";
	const mapped = ALIASES[key] ?? key;
	if (!mapped) return "";
	if (mapped === "html" || mapped === "css" || mapped === "markdown" || mapped === "yaml") return mapped;
	return WORDS[mapped] ? mapped : "";
}
const lineComment = {
	rust: ["//"],
	ts: ["//"],
	js: ["//"],
	go: ["//"],
	python: ["#"],
	bash: ["#"],
	sql: ["--"],
	yaml: ["#"],
	css: [],
	html: [],
	markdown: [],
	json: []
};
const quotePairs = {
	rust: ["\"", "'"],
	ts: [
		"\"",
		"'",
		"`"
	],
	js: [
		"\"",
		"'",
		"`"
	],
	python: ["\"", "'"],
	go: [
		"\"",
		"'",
		"`"
	],
	sql: ["'"],
	bash: ["\"", "'"],
	json: ["\""],
	yaml: ["\"", "'"],
	css: ["\"", "'"],
	html: ["\"", "'"],
	markdown: ["\"", "'"]
};
const identifier = /[A-Za-z_$\u0400-\u04FF][A-Za-z0-9_$\u0400-\u04FF]*/y;
const number = /(?:0[xXbBoO][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:[a-zA-Z]{0,3})?/y;
function scan(code, language) {
	const lang = languageOf(language);
	const tokens = [];
	if (!lang) return tokens;
	const words = wordsOf(lang);
	const comments = lineComment[lang] ?? [];
	const quotes = quotePairs[lang] ?? ["\""];
	const push = (from, to, kind) => {
		if (to > from) tokens.push({
			from,
			to,
			kind
		});
	};
	let i = 0;
	while (i < code.length) {
		const ch = code[i];
		if (comments.find((mark) => code.startsWith(mark, i))) {
			let end = code.indexOf("\n", i);
			if (end === -1) end = code.length;
			push(i, end, "comment");
			i = end;
			continue;
		}
		if (code.startsWith("/*", i)) {
			const end = code.indexOf("*/", i + 2);
			const stop = end === -1 ? code.length : end + 2;
			push(i, stop, "comment");
			i = stop;
			continue;
		}
		if (lang === "html" && code.startsWith("<!--", i)) {
			const end = code.indexOf("-->", i + 4);
			const stop = end === -1 ? code.length : end + 3;
			push(i, stop, "comment");
			i = stop;
			continue;
		}
		if (lang === "markdown" && (i === 0 || code[i - 1] === "\n")) {
			const fence = /```\w*/.exec(code.slice(i))?.[0];
			if (fence) {
				push(i, i + fence.length, "keyword");
				i += fence.length;
				continue;
			}
			if (/^#{1,6} /.exec(code.slice(i))) {
				let end = code.indexOf("\n", i);
				if (end === -1) end = code.length;
				push(i, end, "function");
				i = end;
				continue;
			}
			if (/^[-*+] /.exec(code.slice(i))) {
				push(i, i + 2, "keyword");
				i += 2;
				continue;
			}
		}
		if (lang === "html") {
			if (ch === "<") {
				const tag = /^<\/?([A-Za-z][\w:-]*)/.exec(code.slice(i));
				if (tag) {
					push(i, i + tag[0].length, "tag");
					i += tag[0].length;
					continue;
				}
				push(i, i + 1, "comment");
				i += 1;
				continue;
			}
			if (ch === ">") {
				push(i, i + 1, "comment");
				i += 1;
				continue;
			}
			const attr = /^([A-Za-z_:][\w:.-]*)(?==)/.exec(code.slice(i));
			if (attr && /[\s"']/.test(code[i - 1] ?? " ")) {
				push(i, i + attr[1].length, "property");
				i += attr[1].length;
				continue;
			}
		}
		if (lang === "css") {
			if (ch === "@") {
				const at = /^@[A-Za-z-]+/.exec(code.slice(i));
				if (at) {
					push(i, i + at[0].length, "keyword");
					i += at[0].length;
					continue;
				}
			}
			if (ch === "." || ch === "#") {
				const selector = /^[.#][A-Za-z_-][\w-]*/.exec(code.slice(i));
				if (selector) {
					push(i, i + selector[0].length, "function");
					i += selector[0].length;
					continue;
				}
			}
			if (/[A-Za-z-]/.test(ch) && code[i + 1] === "-" || ch === "-") {
				const prop = /^-{0,2}[A-Za-z-]+(?=\s*:)/.exec(code.slice(i));
				if (prop) {
					push(i, i + prop[0].length, "property");
					i += prop[0].length;
					continue;
				}
			}
		}
		if (quotes.includes(ch)) {
			const triple = code.startsWith(ch + ch + ch, i);
			const mark = triple ? ch + ch + ch : ch;
			let j = i + mark.length;
			while (j < code.length) {
				if (code[j] === "\\") {
					j += 2;
					continue;
				}
				if (code.startsWith(mark, j)) {
					j += mark.length;
					break;
				}
				if (!triple && code[j] === "\n" && ch !== "`") break;
				j += 1;
			}
			const stop = Math.min(j, code.length);
			const after = code.slice(stop).match(/^\s*:/);
			push(i, stop, (lang === "json" || lang === "yaml") && after ? "property" : "string");
			i = stop;
			continue;
		}
		if (/[0-9]/.test(ch)) {
			number.lastIndex = i;
			const match = number.exec(code);
			if (match && match.index === i) {
				push(i, i + match[0].length, "number");
				i += match[0].length;
				continue;
			}
		}
		if (/[A-Za-z_$\u0400-\u04FF]/.test(ch)) {
			identifier.lastIndex = i;
			const match = identifier.exec(code);
			if (match && match.index === i) {
				const word = match[0];
				const next = code[i + word.length];
				let kind = null;
				const lower = word.toLowerCase();
				if (words.has(word)) kind = lower === "true" || lower === "false" || lower === "null" || lower === "none" ? "literal" : "keyword";
				else if (next === "(") kind = "function";
				else if (next === "!" && code[i + word.length + 1] === "(") kind = "function";
				else if (lang === "json" && next === ":") kind = "property";
				else if (lang === "yaml" && next === ":") kind = "property";
				if (kind) push(i, i + word.length, kind);
				i += word.length;
				continue;
			}
		}
		i += 1;
	}
	return tokens;
}
function tokenColors(dark) {
	return dark ? {
		comment: "#7f8b93",
		string: "#b8dc9a",
		number: "#e3b341",
		keyword: "#c9a2f7",
		literal: "#e39a6b",
		function: "#8ec7f5",
		property: "#f0c674",
		tag: "#f29d92"
	} : {
		comment: "#8a8f98",
		string: "#4a7d2f",
		number: "#9a5b00",
		keyword: "#7a3fb5",
		literal: "#a1451b",
		function: "#1f5f9e",
		property: "#8a6d1f",
		tag: "#a1322c"
	};
}

//#endregion
//#region recent.ts
/** How many entries the list keeps. */
const RECENT_LIMIT = 10;
const STORAGE_KEY = "mundus.atlas.recent.v1";
const items = signal([]);
let staged = null;
let stamp$1 = 0;
function recent() {
	return items();
}
function loadRecent() {
	const at = stamp$1;
	Storage.getItem(STORAGE_KEY).then((value) => {
		if (at !== stamp$1) return;
		items.set(readJson$1(value));
	});
}
function rememberRecent(entry) {
	const title = entry.title.trim();
	if (!title) return;
	const next = [{
		...entry,
		title,
		at: Date.now()
	}, ...items().filter((item) => !(item.kind === entry.kind && item.id === entry.id))].slice(0, 10);
	items.set(next);
	stamp$1 += 1;
	Storage.setItem(STORAGE_KEY, JSON.stringify(next));
}
function stageRecent(entry) {
	const title = entry.title.trim();
	if (!title) return;
	staged = {
		kind: entry.kind,
		id: entry.id,
		title
	};
	const list = items();
	const index = list.findIndex((item) => item.kind === entry.kind && item.id === entry.id);
	if (index === -1) {
		const next = [{
			...entry,
			title,
			at: Date.now()
		}, ...list].slice(0, 10);
		items.set(next);
		stamp$1 += 1;
		Storage.setItem(STORAGE_KEY, JSON.stringify(next));
	} else if (list[index].title !== title) {
		const next = list.map((item, i) => i === index ? {
			...item,
			title
		} : item);
		items.set(next);
		stamp$1 += 1;
		Storage.setItem(STORAGE_KEY, JSON.stringify(next));
	}
}
function commitRecent(entry) {
	const pending = staged;
	if (!pending) return;
	if (entry && (entry.kind !== pending.kind || entry.id !== pending.id)) return;
	staged = null;
	const title = entry?.title?.trim() || pending.title;
	rememberRecent({
		kind: pending.kind,
		id: pending.id,
		title
	});
}
function forgetRecent(kind, id) {
	if (staged && staged.kind === kind && staged.id === id) staged = null;
	const next = items().filter((item) => !(item.kind === kind && item.id === id));
	if (next.length === items().length) return;
	items.set(next);
	stamp$1 += 1;
	Storage.setItem(STORAGE_KEY, JSON.stringify(next));
}
function forgetMissingNotes(ids) {
	const before = items();
	const next = before.filter((item) => item.kind !== "note" || ids.has(item.id));
	if (next.length === before.length) return;
	if (staged && staged.kind === "note" && !ids.has(staged.id)) staged = null;
	items.set(next);
	stamp$1 += 1;
	Storage.setItem(STORAGE_KEY, JSON.stringify(next));
}
function readJson$1(value) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item) => {
			if (!item || typeof item !== "object") return false;
			const entry = item;
			return (entry.kind === "note" || entry.kind === "game") && typeof entry.id === "string" && typeof entry.title === "string";
		}).slice(0, 10);
	} catch {
		return [];
	}
}

//#endregion
//#region notes-outline.tsx
/** AnyType draws at most fifty marks: a rail longer than the page stops pointing anywhere. */
const OUTLINE_LIMIT = 50;
const OUTLINE_INSET = 14;
const TICK_WIDTHS = [
	20,
	18,
	16,
	14,
	12,
	10
];
const TICK_ACTIVE_WIDTH = 26;
const TICK_ROW_HEIGHT = 6;
const TICK_PAD_TOP = 12;
const POPOVER_ROW_HEIGHT = 36;
const POPOVER_CLOSE_MS = 140;
/** Direct mapping from heading level (H1..H6) to tick width in points: H1 longest, H6 shortest. */
function outlineTickWidth(level) {
	const index = Math.min(6, Math.max(1, Math.round(level))) - 1;
	return TICK_WIDTHS[index];
}
/** Left padding for a row in the outline board, indented by heading hierarchy. */
function outlineRowIndent(level, minLevel = 1) {
	return 12 + Math.max(0, Math.min(6, Math.max(1, Math.round(level))) - Math.min(6, Math.max(1, Math.round(minLevel)))) * 14;
}
/** Scroll-spy selection: last heading at or above the reading threshold, defaulting to the first. */
function activeOutlineIndex(ys, threshold) {
	let active = -1;
	for (let index = 0; index < ys.length; index += 1) {
		const y = ys[index];
		if (y !== null && y <= threshold) active = index;
	}
	return active >= 0 ? active : 0;
}
function boardShadow(dark) {
	return dark ? "0 4px 12px rgba(0,0,0,0.45), 0 12px 32px rgba(0,0,0,0.42)" : "0 4px 12px rgba(15,23,42,0.08), 0 12px 32px rgba(15,23,42,0.12)";
}
function NotesOutlineRail(props) {
	const open = signal(false);
	let closeTimer = null;
	const cancelClose = () => {
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
	};
	const openRail = () => {
		cancelClose();
		props.onHoverOpen();
		open.set(true);
	};
	const closeRail = () => {
		cancelClose();
		closeTimer = setTimeout(() => {
			closeTimer = null;
			open.set(false);
		}, POPOVER_CLOSE_MS);
	};
	effect(() => () => cancelClose());
	const list = () => props.marks().slice(0, 50);
	const resolvedActive = () => {
		const items = list();
		if (!items.length) return 0;
		const current = props.activePos();
		return items.some((item) => item.pos === current) ? current : items[0].pos;
	};
	const minLevel = () => list().reduce((min, item) => Math.min(min, item.level), 6);
	const maxBody = () => Math.max(160, props.maxHeight() - 32);
	const renderRows = () => {
		const items = list();
		const activePos = resolvedActive();
		const base = minLevel();
		const rowActiveBg = props.dark ? colorAlpha("#ffffff", .08) : colorAlpha("#000000", .06);
		const rowHoverBg = props.dark ? colorAlpha("#ffffff", .12) : colorAlpha("#000000", .09);
		return (() => {
			const __nsh_hv0 = element("view");
			prop(__nsh_hv0, "style", { gap: 2 });
			insert(__nsh_hv0, () => items.map((mark) => {
				const active = mark.pos === activePos;
				return (() => {
					const __nsh_hv1 = element("view");
					prop(__nsh_hv1, "onPress", () => props.onSelect(mark));
					prop(__nsh_hv1, "role", "button");
					bindProp(__nsh_hv1, "accessibilityLabel", () => mark.text || "Заголовок");
					prop(__nsh_hv1, "accessibilityState", { selected: active });
					prop(__nsh_hv1, "hoverStyle", { backgroundColor: rowHoverBg });
					bindProp(__nsh_hv1, "style", () => ({
						paddingLeft: outlineRowIndent(mark.level, base),
						paddingRight: 12,
						paddingTop: 7,
						paddingBottom: 7,
						borderRadius: 8,
						backgroundColor: active ? rowActiveBg : "transparent",
						cursor: "pointer"
					}));
					const __nsh_hv2 = element("text");
					prop(__nsh_hv2, "class", "truncate");
					bindProp(__nsh_hv2, "style", () => ({
						fontSize: 13.5,
						lineHeight: 20,
						fontWeight: active ? 500 : 400,
						color: active ? props.colors.foreground : colorAlpha(props.colors.foreground, .84)
					}));
					insert(__nsh_hv2, () => mark.text || "Заголовок");
					append(__nsh_hv1, __nsh_hv2);
					return __nsh_hv1;
				})();
			}));
			return __nsh_hv0;
		})();
	};
	const renderTicks = () => {
		const items = list();
		const activePos = resolvedActive();
		const tickActive = props.dark ? "#ffffff" : props.colors.foreground;
		const tickIdle = props.dark ? colorAlpha("#ffffff", .26) : colorAlpha("#000000", .22);
		return (() => {
			const __nsh_hv3 = element("view");
			prop(__nsh_hv3, "class", "items-end");
			bindProp(__nsh_hv3, "style", () => ({
				paddingTop: TICK_PAD_TOP,
				paddingBottom: TICK_PAD_TOP,
				paddingLeft: 12,
				paddingRight: 2,
				gap: items.length > 25 ? 5 : 8
			}));
			insert(__nsh_hv3, () => items.map((mark) => {
				const active = mark.pos === activePos;
				return (() => {
					const __nsh_hv4 = element("view");
					prop(__nsh_hv4, "onPress", () => props.onSelect(mark));
					prop(__nsh_hv4, "role", "button");
					bindProp(__nsh_hv4, "accessibilityLabel", () => mark.text || "Заголовок");
					prop(__nsh_hv4, "accessibilityState", { selected: active });
					prop(__nsh_hv4, "class", "items-end justify-center");
					prop(__nsh_hv4, "style", {
						width: 30,
						height: TICK_ROW_HEIGHT,
						cursor: "pointer"
					});
					const __nsh_hv5 = element("view");
					bindProp(__nsh_hv5, "style", () => ({
						width: active ? TICK_ACTIVE_WIDTH : outlineTickWidth(mark.level),
						height: 2,
						borderRadius: 1,
						backgroundColor: active ? tickActive : tickIdle,
						transitionProperty: "width, background-color",
						transitionTimingFunction: "spring(320, 26)"
					}));
					append(__nsh_hv4, __nsh_hv5);
					return __nsh_hv4;
				})();
			}));
			return __nsh_hv3;
		})();
	};
	const renderBoard = () => {
		const bodyHeight = maxBody();
		const scrollable = list().length * POPOVER_ROW_HEIGHT > bodyHeight;
		return (() => {
			const __nsh_hv6 = element("view");
			prop(__nsh_hv6, "testID", "notes-outline-board");
			bindProp(__nsh_hv6, "style", () => ({
				width: 256,
				borderRadius: 14,
				borderWidth: 1,
				borderColor: props.dark ? colorAlpha("#ffffff", .1) : props.colors.border,
				backgroundColor: props.colors.card,
				padding: 8,
				boxShadow: boardShadow(props.dark)
			}));
			insert(__nsh_hv6, () => scrollable ? (() => {
				const __nsh_hv7 = element("scroll");
				prop(__nsh_hv7, "scrollbar", false);
				prop(__nsh_hv7, "style", { height: bodyHeight });
				insert(__nsh_hv7, () => renderRows());
				return __nsh_hv7;
			})() : renderRows());
			return __nsh_hv6;
		})();
	};
	return (() => {
		const __nsh_hv8 = element("view");
		prop(__nsh_hv8, "class", "absolute top-0 bottom-0 justify-center items-end");
		prop(__nsh_hv8, "style", {
			right: 14,
			pointerEvents: "box-none",
			zIndex: 20
		});
		insert(__nsh_hv8, () => list().length >= 2 && (() => {
			const __nsh_hv9 = element("view");
			prop(__nsh_hv9, "testID", "notes-outline-rail");
			prop(__nsh_hv9, "onMouseEnter", openRail);
			prop(__nsh_hv9, "onMouseLeave", closeRail);
			insert(__nsh_hv9, () => open() ? renderBoard() : renderTicks());
			return __nsh_hv9;
		})());
		return __nsh_hv8;
	})();
}

//#endregion
//#region notes.tsx
let commands = {
	create() {},
	save() {},
	remove() {},
	reload() {}
};
let editorRef = null;
let menuAnchor = null;
const outline = signal([]);
const activeOutlinePos = signal(0);
let outlineTimer = null;
let outlineSyncTimer = null;
let outlineSettleTimer = null;
let splitScrollRef;
let splitScrollY = 0;
let pageTopY = 48;
let pinnedOutlinePos = null;
let pinnedScrollY = 0;
let saveTimer = null;
const SAVE_DELAY_MS = 700;
const CARD_MIN = 196;
const CARD_MAX = 260;
const CARD_GAP = 16;
const CARD_RATIO = 264 / 236;
const CARD_MAX_COLUMNS = 5;
const COMPACT_LIBRARY = 560;
const LIBRARY_BOTTOM = 104;
const GRID_PAD = 24;
const LIBRARY_LIST_PAD = 12;
const PAGE_MAX = 720;
const PAGE_PAD = 40;
const PREVIEW_BLOCKS = 14;
const SLASH_MENU_HEIGHT = 320;
const SLASH_ITEMS = [
	{
		id: "text",
		label: "Текст",
		hint: "обычный абзац",
		keys: "text paragraph p",
		make: () => command("setParagraph")
	},
	{
		id: "h1",
		label: "Заголовок 1",
		hint: "крупный раздел",
		keys: "heading h1",
		make: () => command("setHeading", { level: 1 })
	},
	{
		id: "h2",
		label: "Заголовок 2",
		hint: "раздел",
		keys: "heading h2",
		make: () => command("setHeading", { level: 2 })
	},
	{
		id: "h3",
		label: "Заголовок 3",
		hint: "подраздел",
		keys: "heading h3",
		make: () => command("setHeading", { level: 3 })
	},
	{
		id: "bullet",
		label: "Список",
		hint: "маркированный",
		keys: "list bullet ul",
		make: () => command("toggleBulletList")
	},
	{
		id: "ordered",
		label: "Нумерация",
		hint: "нумерованный список",
		keys: "ordered list ol number",
		make: () => command("toggleOrderedList")
	},
	{
		id: "task",
		label: "Чек-лист",
		hint: "задачи с галочками",
		keys: "task todo check",
		make: () => command("toggleTaskList")
	},
	{
		id: "quote",
		label: "Цитата",
		hint: "выделить блок",
		keys: "quote blockquote",
		make: () => command("toggleBlockquote")
	},
	{
		id: "code",
		label: "Код",
		hint: "блок кода",
		keys: "code",
		make: () => command("toggleCodeBlock")
	},
	{
		id: "table",
		label: "Таблица",
		hint: "3 на 3 с заголовком",
		keys: "table",
		make: () => insertTable({
			rows: 3,
			cols: 3,
			withHeaderRow: true
		})
	},
	{
		id: "rule",
		label: "Разделитель",
		hint: "горизонтальная линия",
		keys: "divider rule hr line",
		make: () => command("setHorizontalRule")
	}
];
const notes = signal([]);
const editorVersion = signal(0);
function blockSize(node) {
	const block = node;
	if (!block) return 1;
	if (typeof block.text === "string") return block.text.length;
	if (block.type === "image" || block.type === "hardBreak" || block.type === "horizontalRule") return 1;
	let size = 2;
	for (const child of block.content ?? []) size += blockSize(child);
	return size;
}
function shownLanguage(named) {
	const known = languageOf(named);
	if (known) return known;
	const key = named.trim().toLowerCase();
	if (!key || key === "text" || key === "plaintext" || key === "plain" || key === "txt") return "";
	return named.trim();
}
const codeLanguages = [
	["rust", "Rust"],
	["ts", "TypeScript"],
	["js", "JavaScript"],
	["python", "Python"],
	["json", "JSON"],
	["bash", "Bash"],
	["sql", "SQL"],
	["go", "Go"],
	["html", "HTML"],
	["css", "CSS"],
	["markdown", "Markdown"],
	["", "Простой текст"]
];
function languageLabel(name) {
	const found = codeLanguages.find(([value]) => value === name);
	return found ? found[1] : name || "Простой текст";
}
const PICTURE_LIMIT = 4194304;
function pictureUri(file) {
	if (file.data.byteLength > PICTURE_LIMIT) {
		console.log("[atlas-notes] picture is larger than 4 MiB:", file.name);
		return null;
	}
	return `data:${file.mime && file.mime.startsWith("image/") ? file.mime : "image/png"};base64,${Buffer.from(file.data).toString("base64")}`;
}
const PICTURE_WIDTH = 520;
function insertPicture(session, src) {
	session.run(command("setImage", { src }));
	try {
		const found = session.findParentNode("image");
		if (typeof found?.pos === "number") session.run(setNodeAttribute(found.pos, "width", PICTURE_WIDTH));
	} catch {}
}
function pastePictures(pasted, session) {
	for (const file of pasted.files) {
		if (!file.mime || !file.mime.startsWith("image/")) continue;
		const src = pictureUri(file);
		if (src) insertPicture(session, src);
	}
	for (const uri of pasted.uris) if (PICTURE_FILE.test(uri)) insertPicture(session, uri);
}
const copiedId = signal(null);
let copiedTimer = null;
function copyBlock(text, id) {
	Clipboard.writeText(text);
	copiedId.set(id);
	if (copiedTimer) clearTimeout(copiedTimer);
	copiedTimer = setTimeout(() => {
		copiedId.set(null);
		copiedTimer = null;
	}, 1400);
}
const highlight = new RichEditorPlugin("highlight");
const proseGutter = new RichEditorPlugin("note-prose-gutter");
const TABLE_BLEED = 8;
const gutterSignature = /* @__PURE__ */ new WeakMap();
function applyProseGutter(session, revisions) {
	const doc = session.getJSON();
	let from = 0;
	const decorations = [];
	for (const block of doc.content ?? []) {
		const to = from + blockSize(block);
		if (block.type !== "table") decorations.push({
			from,
			to,
			kind: "node",
			attrs: { class: "mx-2" }
		});
		from = to;
	}
	const signature = decorations.map(({ from, to }) => `${from}:${to}`).join(",");
	if (gutterSignature.get(session) === signature) return;
	gutterSignature.set(session, signature);
	session.setDecorations(proseGutter.key, decorations);
	revisions.add(session.revision);
}
let paintedDark = true;
const selectedId = signal(null);
const draftTitle = signal("");
const dirty = signal(false);
const slashOpen = signal(false);
const slashQuery = signal("");
const slashIndex = signal(0);
const slashTop = signal(0);
const slashLeft = signal(0);
const gridWidth = signal(0);
function compact() {
	const room = gridWidth() > 0 ? gridWidth() : pageRoom();
	return room > 0 && room < COMPACT_LIBRARY;
}
const loading = signal(true);
const pageRoom = signal(0);
const pageTall = signal(0);
let openingNew = false;
let editor = null;
let slashSeg = null;
let asked = false;
let segments = [];
let segSerial = 0;
let singlePainted = "";
const singlePaintRevs = /* @__PURE__ */ new Set();
let epoch = 0;
let split = false;
const codeLayout = signal(false);
const segmentList = signal([]);
const bodyRev = signal(0);
const singleBodyEmpty = signal(true);
const segRefs = /* @__PURE__ */ new Map();
const segHeights = /* @__PURE__ */ new Map();
const segTops = /* @__PURE__ */ new Map();
const segHeightRev = signal(0);
let wantFocus = null;
let reshaping = false;
let splitTimer = null;
let reshapeTimer = null;
let reshapeRuns = 0;
function bindNoteCommands(next) {
	commands = next;
	if (asked) commands.reload();
}
function addNote(note) {
	loading.set(false);
	const id = text$1(note.id);
	notes.set([note, ...notes().filter((item) => text$1(item.id) !== id)]);
	if (openingNew) {
		openingNew = false;
		select(note);
	}
}
function setNotes(next) {
	loading.set(false);
	forgetMissingNotes(new Set(next.map((note) => text$1(note.id))));
	const before = new Set(notes().map((note) => text$1(note.id)));
	if (openingNew) {
		notes.set(next);
		const fresh = next.find((note) => !before.has(text$1(note.id)));
		if (fresh) {
			openingNew = false;
			select(fresh);
		}
		return;
	}
	if (sameLibrary(notes(), next)) return;
	notes.set(next);
	const current = selectedId();
	if (current && next.some((note) => text$1(note.id) === current)) return;
	if (current) closeNote();
}
function sameLibrary(left, right) {
	if (left.length !== right.length) return false;
	for (let index = 0; index < left.length; index += 1) {
		if (text$1(left[index].id) !== text$1(right[index].id)) return false;
		if (text$1(left[index].updatedAt) !== text$1(right[index].updatedAt)) return false;
		if (text$1(left[index].title) !== text$1(right[index].title)) return false;
	}
	return true;
}
function text$1(value) {
	return String(value);
}
function paintNodes(nodes, from, palette, out) {
	let at = from;
	for (const node of nodes) {
		const kind = node?.type;
		if (kind === "text") {
			at += String(node.text ?? "").length;
			continue;
		}
		if (kind === "codeBlock") {
			const body = (Array.isArray(node.content) ? node.content : []).map((child) => String(child?.text ?? "")).join("");
			for (const token of scan(body, languageOf(node?.attrs?.language))) out.push({
				from: at + 1 + token.from,
				to: at + 1 + token.to,
				kind: "inline",
				attrs: { class: `text-[${palette[token.kind]}]` }
			});
			at += body.length + 2;
			continue;
		}
		if (Array.isArray(node?.content)) {
			at = paintNodes(node.content, at + 1, palette, out) + 1;
			continue;
		}
		at += 1;
	}
	return at;
}
function paintCode() {
	const palette = tokenColors(paintedDark);
	if (split) {
		for (const seg of segments) {
			if (!seg.paint) continue;
			const doc = seg.session.getJSON();
			const sig = `${paintedDark}|${JSON.stringify(doc)}`;
			if (seg.painted === sig) continue;
			const marks = [];
			paintNodes(doc.content ?? [], 0, palette, marks);
			seg.session.setDecorations(seg.paint.key, marks);
			seg.painted = sig;
			seg.paintRevs.add(seg.session.revision);
		}
		return;
	}
	const live = editor;
	if (!live) return;
	const doc = live.getJSON();
	const sig = `${paintedDark}|${JSON.stringify(doc)}`;
	if (singlePainted === sig) return;
	const marks = [];
	paintNodes(doc.content ?? [], 0, palette, marks);
	live.setDecorations("highlight", marks);
	singlePainted = sig;
	singlePaintRevs.add(live.revision);
}
let paintTimer = null;
function schedulePaint() {
	if (paintTimer) clearTimeout(paintTimer);
	paintTimer = setTimeout(paintCode, 60);
}
function editorExtensions(trailing = true) {
	return [StarterKit.configure({
		heading: { levels: [
			1,
			2,
			3,
			4,
			5,
			6
		] },
		highlight: false,
		subscript: false,
		superscript: false,
		textStyle: false,
		textAlign: false,
		...trailing ? {} : { trailingNode: false }
	}), TableKit.configure({ table: { resizable: false } })];
}
function docOf(nodes) {
	return {
		type: "doc",
		content: nodes.length ? nodes : [{ type: "paragraph" }]
	};
}
function hasCodeBlock(doc) {
	const content = doc?.content;
	return Array.isArray(content) && content.some((node) => node?.type === "codeBlock");
}
function groupsOf(doc) {
	const content = doc?.content;
	const nodes = Array.isArray(content) ? content : [];
	const groups = [];
	let prose = [];
	const flush = () => {
		if (!prose.length) return;
		groups.push({
			kind: "prose",
			nodes: prose
		});
		prose = [];
	};
	for (const node of nodes) if (node?.type === "codeBlock") {
		flush();
		groups.push({
			kind: "code",
			node
		});
	} else prose.push(node);
	flush();
	if (!groups.length) groups.push({
		kind: "prose",
		nodes: [{ type: "paragraph" }]
	});
	return groups;
}
function groupKinds(doc) {
	return groupsOf(doc).map((group) => group.kind).join(",");
}
function currentDoc() {
	if (!split) return editor ? editor.getJSON() : docOf([]);
	const content = [];
	for (const seg of segments) {
		const doc = seg.session.getJSON();
		content.push(...doc.content ?? []);
	}
	return docOf(content);
}
function currentText() {
	if (!split) return editor ? editor.getText() : "";
	return segments.map((seg) => seg.session.getText()).filter((part) => part.length > 0).join("\n");
}
function codeOrdinal(doc, pos) {
	const content = doc.content ?? [];
	let at = 0;
	let ordinal = 0;
	for (const node of content) {
		const size = blockSize(node);
		if (node.type === "codeBlock") {
			if (pos >= at && pos <= at + size) return ordinal;
			ordinal += 1;
		}
		at += size;
	}
	return Math.max(0, ordinal - 1);
}
function shapeDrifted() {
	return groupKinds(currentDoc()) !== segments.map((seg) => seg.kind).join(",");
}
function activeCodeOrdinal() {
	const index = segments.findIndex((seg) => seg.session === editor);
	if (index < 0 || segments[index].kind !== "code") return -1;
	return segments.slice(0, index + 1).filter((seg) => seg.kind === "code").length - 1;
}
function retireSeg(seg) {
	try {
		seg.session.dispose();
	} catch {}
	try {
		seg.paint?.dispose();
	} catch {}
	headingLocsCache.delete(seg.session);
	segRefs.delete(seg.id);
	segHeights.delete(seg.id);
	segTops.delete(seg.id);
}
function bindSeg(session, epochAt) {
	session.on("revision", (event) => {
		if (epoch !== epochAt || reshaping) return;
		const seg = segments.find((item) => item.session === session);
		if (!seg) return;
		if (typeof event?.revision === "number" && seg.paintRevs.delete(event.revision)) return;
		editor = session;
		scheduleSave();
		syncSlash();
		scheduleOutline();
		if (seg.kind === "code" || session.findParentNode("codeBlock")) schedulePaint();
		bodyRev.set(bodyRev() + 1);
		if (split && shapeDrifted()) scheduleReshape();
	});
}
function createSeg(group) {
	const id = ++segSerial;
	const paint = group.kind === "code" ? new RichEditorPlugin(`paint-${id}`) : null;
	const content = group.kind === "code" ? docOf([group.node]) : docOf(group.nodes);
	const epochAt = epoch;
	const make = (body) => {
		const paste = paint ? null : new RichEditorPlugin("note-markdown-paste");
		const session = createRichEditor({
			extensions: editorExtensions(false),
			plugins: paste ? [
				proseGutter,
				markdownPaste(),
				paste
			] : paint ? [paint] : [],
			content: body,
			format: "json"
		});
		if (paste) bindMarkdownPaste(paste, session);
		return session;
	};
	let session;
	try {
		session = make(content);
	} catch {
		session = make(docOf([{ type: "paragraph" }]));
	}
	const paintRevs = /* @__PURE__ */ new Set();
	if (group.kind === "prose") applyProseGutter(session, paintRevs);
	bindSeg(session, epochAt);
	return {
		id,
		kind: group.kind,
		session,
		paint,
		painted: "",
		paintRevs
	};
}
function markdownPaste() {
	return markdown({
		blockRules: false,
		inlineRules: false,
		copyAsMarkdown: false
	});
}
const MARKDOWN_BLOCK = /^ {0,3}(?:#{1,6}[ \t]+|>[ \t]+|[-*+][ \t]+|\d+[.)][ \t]+|`{3,}|~{3,}|---[ \t]*$)/m;
function bindMarkdownPaste(plugin, session) {
	plugin.handlePaste((slice, { text, html }) => {
		if (!html || session.findParentNode("codeBlock")) return false;
		const blocks = slice.content ?? [];
		if (!MARKDOWN_BLOCK.test(text) || !blocks.length || html.includes("data-pm-slice") || !blocks.every((block) => (block.type === "paragraph" || block.type === "codeBlock" && !block.attrs?.language) && (block.content ?? []).every((node) => node.type === "hardBreak" || node.type === "text" && !node.marks?.length))) return false;
		return session.insertContent(text, "markdown");
	});
}
function becomeSplit(doc, focusOrdinal) {
	epoch += 1;
	reshaping = true;
	if (splitTimer) {
		clearTimeout(splitTimer);
		splitTimer = null;
	}
	if (reshapeTimer) {
		clearTimeout(reshapeTimer);
		reshapeTimer = null;
	}
	const retiring = segments.slice();
	const retiringSingle = editor && !retiring.some((seg) => seg.session === editor) ? editor : null;
	let groups = groupsOf(doc);
	let built = groups.map((group) => createSeg(group));
	const flat = docOf(built.flatMap((seg) => seg.session.getJSON().content ?? []));
	if (groupKinds(flat) !== groups.map((group) => group.kind).join(",")) {
		for (const seg of built) retireSeg(seg);
		groups = groupsOf(flat);
		built = groups.map((group) => createSeg(group));
	}
	segments = built;
	split = true;
	codeLayout.set(true);
	const codes = built.filter((seg) => seg.kind === "code");
	const focus = focusOrdinal >= 0 ? codes[focusOrdinal] ?? null : null;
	editor = (focus ?? built.find((seg) => seg.kind === "prose") ?? built[0] ?? null)?.session ?? null;
	wantFocus = focus?.id ?? null;
	segmentList.set(built.map((seg) => ({
		id: seg.id,
		kind: seg.kind
	})));
	reshaping = false;
	for (const seg of retiring) retireSeg(seg);
	if (retiringSingle) try {
		retiringSingle.dispose();
	} catch {}
	paintCode();
}
function scheduleSplit(ordinal) {
	if (splitTimer || split) return;
	const epochAt = epoch;
	splitTimer = setTimeout(() => {
		splitTimer = null;
		if (epoch !== epochAt || !editor || split) return;
		const doc = editor.getJSON();
		if (!hasCodeBlock(doc)) return;
		becomeSplit(doc, ordinal);
	}, 0);
}
function scheduleReshape() {
	if (reshapeTimer || reshapeRuns > 8) return;
	const epochAt = epoch;
	reshapeTimer = setTimeout(() => {
		reshapeTimer = null;
		if (epoch !== epochAt || !split || reshaping) return;
		if (!shapeDrifted()) return;
		reshapeRuns += 1;
		becomeSplit(currentDoc(), activeCodeOrdinal());
	}, 0);
}
function teardownEditors() {
	epoch += 1;
	reshaping = true;
	if (splitTimer) {
		clearTimeout(splitTimer);
		splitTimer = null;
	}
	if (reshapeTimer) {
		clearTimeout(reshapeTimer);
		reshapeTimer = null;
	}
	if (outlineSyncTimer) {
		clearTimeout(outlineSyncTimer);
		outlineSyncTimer = null;
	}
	if (outlineSettleTimer) {
		clearTimeout(outlineSettleTimer);
		outlineSettleTimer = null;
	}
	reshapeRuns = 0;
	if (paintTimer) {
		clearTimeout(paintTimer);
		paintTimer = null;
	}
	const retiring = segments.slice();
	const single = editor && !retiring.some((seg) => seg.session === editor) ? editor : null;
	segments = [];
	editor = null;
	split = false;
	splitScrollY = 0;
	pinnedOutlinePos = null;
	pinnedScrollY = 0;
	wantFocus = null;
	singlePainted = "";
	singlePaintRevs.clear();
	segRefs.clear();
	segHeights.clear();
	segTops.clear();
	codeLayout.set(false);
	segmentList.set([]);
	copiedId.set(null);
	for (const seg of retiring) retireSeg(seg);
	if (single) try {
		single.dispose();
	} catch {}
	reshaping = false;
}
function open(note) {
	teardownEditors();
	closeSlash();
	slashIndex.set(0);
	if (note) {
		const doc = documentOf(note.doc);
		if (hasCodeBlock(doc)) becomeSplit(doc, -1);
		else mountSingle(doc);
		buildTitleEditor(text$1(note.title));
		savedBody = JSON.stringify(currentDoc());
		savedTitle = text$1(note.title);
		const marks = headingsOf(doc);
		outline.set(marks);
		activeOutlinePos.set(marks[0]?.pos ?? 0);
		paintCode();
	} else {
		buildTitleEditor("");
		outline.set([]);
		activeOutlinePos.set(0);
	}
	editorVersion.set(editorVersion() + 1);
}
function mountSingle(doc) {
	const epochAt = epoch;
	const paste = new RichEditorPlugin("note-markdown-paste");
	const made = makeEditor(doc, paste);
	singleBodyEmpty.set(made.getText().length === 0);
	bindMarkdownPaste(paste, made);
	applyProseGutter(made, singlePaintRevs);
	made.on("revision", (event) => {
		if (epoch !== epochAt || editor !== made) return;
		if (typeof event?.revision === "number" && singlePaintRevs.delete(event.revision)) return;
		scheduleSave();
		syncSlash();
		scheduleOutline();
		if (made.findParentNode("codeBlock")) schedulePaint();
		if (hasCodeBlock(made.getJSON())) {
			const parent = made.findParentNode("codeBlock");
			scheduleSplit(codeOrdinal(made.getJSON(), parent?.pos ?? 0));
		}
	});
	editor = made;
}
const TASK_CLASSES = { taskCheckbox: "w-4 h-4" };
function makeEditor(doc, paste) {
	const options = (content) => ({
		extensions: editorExtensions(),
		plugins: paste ? [
			highlight,
			proseGutter,
			markdownPaste(),
			paste
		] : [],
		content,
		format: "json"
	});
	try {
		return createRichEditor(options(doc));
	} catch {
		return createRichEditor(options(documentOf(null)));
	}
}
function documentOf(doc) {
	if (!doc) return {
		type: "doc",
		content: [{ type: "paragraph" }]
	};
	try {
		return JSON.parse(JSON.stringify(doc));
	} catch {
		return {
			type: "doc",
			content: [{ type: "paragraph" }]
		};
	}
}
function headingsOf(doc) {
	const root = doc;
	if (!root || !Array.isArray(root.content)) return [];
	const marks = [];
	let pos = 1;
	for (const node of root.content) {
		const block = node;
		if (block.type === "heading" && Array.isArray(block.content)) {
			const text = block.content.map((child) => child?.text ?? "").join("").trim();
			marks.push({
				level: Math.min(6, Math.max(1, block.attrs?.level ?? 1)),
				text,
				pos: pos + 1
			});
		}
		pos += nodeSize(node);
	}
	return marks;
}
function nodeSize(node) {
	const block = node;
	if (!block) return 1;
	if (typeof block.text === "string") return block.text.length;
	if (!Array.isArray(block.content)) return 1;
	let size = 1;
	for (const child of block.content) size += nodeSize(child);
	return size;
}
function scheduleOutline() {
	if (outlineTimer) clearTimeout(outlineTimer);
	outlineTimer = setTimeout(() => {
		outlineTimer = null;
		if (!editor && !split) return;
		const next = headingsOf(currentDoc());
		const current = outline();
		if (!(next.length === current.length && next.every((mark, index) => {
			const old = current[index];
			return mark.pos === old.pos && mark.text === old.text && mark.level === old.level;
		}))) {
			outline.set(next);
			if (!next.some((mark) => mark.pos === activeOutlinePos())) activeOutlinePos.set(next[0]?.pos ?? 0);
		}
	}, 320);
}
function headingPmLocations(doc) {
	const root = doc;
	if (!root || !Array.isArray(root.content)) return [];
	const out = [];
	let pos = 0;
	for (const node of root.content) {
		const block = node;
		if (block.type === "heading" && Array.isArray(block.content)) out.push({
			nodePos: pos,
			textPos: pos + 1
		});
		pos += blockSize(node);
	}
	return out;
}
function cachedByRev(cache, key, rev, make) {
	const hit = cache.get(key);
	if (hit && hit.rev === rev) return hit.value;
	const value = make();
	cache.set(key, {
		rev,
		value
	});
	return value;
}
const headingLocsCache = /* @__PURE__ */ new Map();
function headingLocsOf(session) {
	return cachedByRev(headingLocsCache, session, bodyRev(), () => headingPmLocations(session.getJSON()));
}
function splitHeadingLocations() {
	const out = [];
	for (const seg of segments) {
		if (seg.kind !== "prose") continue;
		for (const loc of headingLocsOf(seg.session)) out.push({
			segId: seg.id,
			session: seg.session,
			nodePos: loc.nodePos,
			textPos: loc.textPos
		});
	}
	return out;
}
function outlineThreshold() {
	return Math.max(96, Math.round(pageTall() * .36));
}
function syncOutlineFromCaret(segId, localPos) {
	const marks = outline();
	if (marks.length < 2) return;
	if (split && segId !== null) {
		const segOrder = segments.findIndex((seg) => seg.id === segId);
		if (segOrder < 0) return;
		const locs = splitHeadingLocations();
		const count = Math.min(marks.length, locs.length);
		if (!count) return;
		let active = 0;
		for (let index = 0; index < count; index += 1) {
			const locOrder = segments.findIndex((seg) => seg.id === locs[index].segId);
			if (locOrder < segOrder || locOrder === segOrder && locs[index].nodePos <= localPos) active = index;
			else break;
		}
		if (activeOutlinePos() !== marks[active].pos) activeOutlinePos.set(marks[active].pos);
		return;
	}
	if (!editor) return;
	const locs = headingLocsOf(editor);
	const count = Math.min(marks.length, locs.length);
	if (!count) return;
	const active = activeOutlineIndex(locs.slice(0, count).map((loc) => loc.nodePos), localPos);
	if (activeOutlinePos() !== marks[active].pos) activeOutlinePos.set(marks[active].pos);
}
function syncOutlineFromViewport() {
	if (pinnedOutlinePos !== null) return;
	const marks = outline();
	if (marks.length < 2) return;
	const threshold = outlineThreshold();
	if (split) {
		const locs = splitHeadingLocations();
		const count = Math.min(marks.length, locs.length);
		if (!count) return;
		const ys = [];
		for (let index = 0; index < count; index += 1) {
			const loc = locs[index];
			const segTop = segTops.get(loc.segId);
			if (typeof segTop !== "number") {
				ys.push(null);
				continue;
			}
			let localY = 0;
			try {
				const rect = loc.session.nodeRect(loc.nodePos) ?? loc.session.coordsAtPos(loc.textPos);
				if (rect && typeof rect.y === "number") localY = rect.y;
			} catch {}
			ys.push(segTop + localY);
		}
		if (!ys.some((y) => y !== null)) return;
		const active = activeOutlineIndex(ys, splitScrollY + threshold);
		if (activeOutlinePos() !== marks[active].pos) activeOutlinePos.set(marks[active].pos);
		return;
	}
	if (!editor) return;
	const locs = headingLocsOf(editor);
	const count = Math.min(marks.length, locs.length);
	if (!count) return;
	const ys = [];
	for (let index = 0; index < count; index += 1) {
		const loc = locs[index];
		let y = null;
		try {
			const rect = editor.pageNodeRect(loc.nodePos) ?? editor.pageCoordsAtPos(loc.textPos);
			if (rect && typeof rect.y === "number") y = rect.y;
		} catch {}
		ys.push(y);
	}
	if (!ys.some((y) => y !== null)) return;
	const active = activeOutlineIndex(ys, pageTopY + threshold);
	if (activeOutlinePos() !== marks[active].pos) activeOutlinePos.set(marks[active].pos);
}
let caretSyncTimer = null;
let caretSyncAt = null;
function scheduleCaretOutline(segId, pos) {
	caretSyncAt = {
		segId,
		pos
	};
	if (caretSyncTimer) return;
	caretSyncTimer = setTimeout(() => {
		caretSyncTimer = null;
		const at = caretSyncAt;
		caretSyncAt = null;
		if (at) syncOutlineFromCaret(at.segId, at.pos);
	}, 60);
}
function scheduleOutlineSync() {
	if (outlineSyncTimer) return;
	outlineSyncTimer = setTimeout(() => {
		outlineSyncTimer = null;
		syncOutlineFromViewport();
	}, 60);
}
function onSplitScroll(y) {
	splitScrollY = y;
	if (pinnedOutlinePos !== null && !outlineSettleTimer && Math.abs(y - pinnedScrollY) > 24) pinnedOutlinePos = null;
	scheduleOutlineSync();
}
function onSingleWheel() {
	if (split || outline().length < 2) return;
	pinnedOutlinePos = null;
	syncOutlineFromViewport();
	scheduleOutlineSync();
	if (outlineSettleTimer) clearTimeout(outlineSettleTimer);
	outlineSettleTimer = setTimeout(() => {
		outlineSettleTimer = null;
		syncOutlineFromViewport();
	}, 220);
}
function jumpToOutline(mark) {
	const index = outline().findIndex((item) => item.pos === mark.pos);
	if (index < 0) return;
	activeOutlinePos.set(mark.pos);
	pinnedOutlinePos = mark.pos;
	pinnedScrollY = splitScrollY;
	if (outlineSettleTimer) clearTimeout(outlineSettleTimer);
	outlineSettleTimer = setTimeout(() => {
		outlineSettleTimer = null;
		pinnedScrollY = splitScrollY;
	}, 450);
	if (split) {
		const loc = splitHeadingLocations()[index];
		if (!loc) return;
		const segTop = segTops.get(loc.segId);
		if (typeof segTop === "number" && splitScrollRef) {
			let localY = 0;
			try {
				const rect = loc.session.nodeRect(loc.nodePos) ?? loc.session.coordsAtPos(loc.textPos);
				if (rect && typeof rect.y === "number") localY = rect.y;
			} catch {}
			const targetY = Math.max(0, Math.round(segTop + localY - Math.max(40, pageTall() * .14)));
			pinnedScrollY = targetY;
			splitScrollRef.scrollTo({
				y: targetY,
				animated: true
			});
		}
		const ref = segRefs.get(loc.segId);
		if (ref) {
			editor = loc.session;
			ref.focus();
			ref.setSelection(loc.textPos, loc.textPos);
		}
		return;
	}
	if (!editor || !editorRef) return;
	const loc = headingLocsOf(editor)[index];
	const targetPos = loc ? loc.textPos : mark.pos;
	editorRef.focus();
	editorRef.setSelection(targetPos, targetPos);
}
function caretToEnd() {
	if (split && segments.length) {
		const last = segments[segments.length - 1];
		const ref = segRefs.get(last.id);
		if (!ref) return;
		editor = last.session;
		ref.focus();
		ref.setSelection(headingsEnd(last.session.getJSON()), headingsEnd(last.session.getJSON()));
		return;
	}
	if (!editor || !editorRef) return;
	const end = headingsEnd(editor.getJSON());
	editorRef.focus();
	editorRef.setSelection(end, end);
}
function headingsEnd(doc) {
	const root = doc;
	if (!root || !Array.isArray(root.content) || root.content.length === 0) return 1;
	let pos = 1;
	for (const node of root.content) pos += nodeSize(node);
	return Math.max(1, pos - 1);
}
const US_OF_RU = {
	й: "q",
	ц: "w",
	у: "e",
	к: "r",
	т: "t",
	н: "y",
	г: "u",
	ш: "i",
	щ: "o",
	з: "p",
	х: "[",
	ъ: "]",
	ф: "a",
	ы: "s",
	в: "d",
	а: "f",
	п: "g",
	р: "h",
	о: "j",
	л: "k",
	д: "l",
	ж: ";",
	э: "'",
	я: "z",
	ч: "x",
	с: "c",
	м: "v",
	и: "b",
	т: "n",
	ь: "m",
	б: ",",
	ю: ".",
	ё: "`"
};
function usForm(text) {
	return Array.from(text.toLowerCase()).map((letter) => US_OF_RU[letter] ?? letter).join("");
}
let slashRange = null;
function slashMatch() {
	const live = editor;
	if (!live || live.findParentNode("codeBlock")) return null;
	const selection = live.selection;
	const at = selection?.anchor;
	const head = selection?.head ?? at;
	if (selection?.type !== "text" || typeof at !== "number" || at !== head) return null;
	const before = live.textBetween(0, at, "\n");
	const found = /(?:^|\s)\/([^\s/]*)$/.exec(before);
	if (!found) return null;
	const query = found[1] ?? "";
	return {
		from: at - (query.length + 1),
		to: at,
		query
	};
}
function placeSlash(pos) {
	const live = editor;
	const anchor = menuAnchor;
	if (!live || !anchor) return;
	const seg = slashSeg !== null ? segRefs.get(slashSeg) : null;
	const segBox = seg ? seg.node.measure() : Promise.resolve(null);
	const page = live.pageCoordsAtPos(pos);
	if (!page && !seg) return;
	Promise.all([anchor.measure(), segBox]).then(([box, piece]) => {
		if (!box) return;
		const x = piece ? piece.pagePosition.x - box.pagePosition.x : page.x - box.pagePosition.x;
		const y = piece ? piece.pagePosition.y - box.pagePosition.y + 30 : page.y - box.pagePosition.y;
		const below = y + 24;
		const above = y - SLASH_MENU_HEIGHT - 8;
		slashLeft.set(Math.max(0, x));
		slashTop.set(below + SLASH_MENU_HEIGHT <= box.bounds.size.height ? below : Math.max(0, above));
	});
}
function syncSlash() {
	if (slashOpen() && slashSession && editor !== slashSession) return;
	const match = slashMatch();
	if (!match) {
		if (slashOpen()) closeSlash();
		return;
	}
	slashRange = match;
	if (!slashOpen()) {
		slashQuery.set(usForm(match.query));
		slashIndex.set(0);
		slashSession = editor;
		slashSeg = segmentAt(match.from)?.id ?? null;
		slashOpen.set(true);
		bindSlashKeys();
		placeSlash(match.from);
	}
	const count = filtered(slashQuery()).length;
	if (slashIndex() > count - 1) slashIndex.set(0);
}
function filtered(query) {
	if (!query) return SLASH_ITEMS;
	return SLASH_ITEMS.filter((item) => usForm(item.label).includes(query) || item.keys.includes(query));
}
function onSlashKey(key) {
	if (!slashOpen()) return;
	if (key === "Escape") {
		closeSlash(true);
		return;
	}
	if (key === "Enter" || key === "Tab") {
		pick();
		return;
	}
	const count = filtered(slashQuery()).length;
	if (count === 0) return;
	if (key === "ArrowDown") slashIndex.set((slashIndex() + 1) % count);
	if (key === "ArrowUp") slashIndex.set((slashIndex() + count - 1) % count);
}
function pick() {
	const item = filtered(slashQuery())[slashIndex()];
	const range = slashRange;
	closeSlash();
	if (!item || !editor || !range) return;
	editor.run(chain([deleteRange({
		from: range.from,
		to: range.to
	}), item.make()]));
	setTimeout(focusCaret, 0);
}
function closeSlash(discard = false) {
	const range = slashRange;
	const live = editor;
	slashRange = null;
	slashSeg = null;
	slashSession = null;
	const wasOpen = slashOpen();
	if (wasOpen) slashOpen.set(false);
	unbindSlashKeysNow();
	if (wasOpen) focusCaret();
	if (discard && wasOpen && range && live) live.run(deleteRange({
		from: range.from,
		to: range.to
	}));
}
function focusCaret() {
	if (split) {
		const seg = segments.find((item) => item.session === editor);
		if (seg) segRefs.get(seg.id)?.focus();
		return;
	}
	editorRef?.focus();
}
const SLASH_TYPE_KEYS = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"minus"
];
let unbindSlashKeys = null;
let slashFocus = null;
let slashSession = null;
let slashHold = false;
function bindSlashKeys() {
	if (unbindSlashKeys) return;
	slashHold = true;
	editorRef?.blur();
	for (const ref of segRefs.values()) ref.blur();
	slashFocus?.focus();
	const bindings = {
		up: () => onSlashKey("ArrowUp"),
		down: () => onSlashKey("ArrowDown"),
		enter: () => onSlashKey("Enter"),
		tab: () => onSlashKey("Tab"),
		escape: () => onSlashKey("Escape"),
		backspace: () => {
			slashQuery.set(slashQuery().slice(0, -1));
			slashIndex.set(0);
		}
	};
	for (const key of SLASH_TYPE_KEYS) bindings[key] = () => {
		slashQuery.set(slashQuery() + (key === "minus" ? "-" : key));
		slashIndex.set(0);
	};
	unbindSlashKeys = keymap.bind(bindings);
}
function unbindSlashKeysNow() {
	if (unbindSlashKeys) {
		unbindSlashKeys();
		unbindSlashKeys = null;
	}
}
function currentRecentEntry() {
	const id = selectedId();
	if (!id) return null;
	return {
		kind: "note",
		id,
		title: noteLabel(draftTitle() || text$1(selected()?.title ?? ""))
	};
}
function select(note) {
	const id = note ? text$1(note.id) : null;
	if (id && id === selectedId() && editor) return;
	flushSave();
	applyPreview();
	const leaving = currentRecentEntry();
	if (leaving && leaving.id !== id) commitRecent(leaving);
	draftTitle.set(note ? text$1(note.title) : "");
	dirty.set(false);
	open(note);
	selectedId.set(id);
	if (note) stageRecent({
		kind: "note",
		id: text$1(note.id),
		title: noteLabel(note.title)
	});
}
const openNoteTitle = () => selectedId() ? draftTitle().replace(/\s+/g, " ").trim() : "";
const openNoteId = () => selectedId();
const hasOpenNote = () => selectedId() !== null;
const closeOpenNote = () => closeNote();
const removeOpenNote = () => removeNote();
function createOpenNote() {
	if (openNoteIsBlank()) return;
	createNote();
}
function openNoteIsBlank() {
	if (selectedId() === null) return false;
	if (openNoteTitle() !== "") return false;
	return isBlankDoc(currentDoc());
}
function isBlankDoc(node) {
	if (!node || typeof node !== "object") return true;
	const block = node;
	if (typeof block.text === "string" && block.text.trim() !== "") return false;
	if (Array.isArray(block.content)) return block.content.every(isBlankDoc);
	return true;
}
function leaveOpenNote() {
	flushSave();
	applyPreview();
	const current = currentRecentEntry();
	if (current) commitRecent(current);
}
function openNoteById(id) {
	const note = notes().find((item) => text$1(item.id) === id);
	if (note) select(note);
}
function selected() {
	const id = selectedId();
	if (!id) return null;
	return notes().find((note) => text$1(note.id) === id) ?? null;
}
function editTitle(value) {
	draftTitle.set(value);
	scheduleSave();
}
function scheduleSave() {
	dirty.set(true);
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(flushSave, SAVE_DELAY_MS);
}
let pendingPreview = null;
let savedBody = "";
let savedTitle = "";
function flushSave() {
	if (saveTimer) {
		clearTimeout(saveTimer);
		saveTimer = null;
	}
	if (!dirty()) return;
	const note = selected();
	if (!note || !editor && !split) return;
	const title = noteLabel(draftTitle());
	const doc = currentDoc();
	const body = currentText();
	const serialized = JSON.stringify(doc);
	if (serialized === savedBody && title === savedTitle) {
		dirty.set(false);
		return;
	}
	savedBody = serialized;
	savedTitle = title;
	dirty.set(false);
	commands.save(text$1(note.id), title, doc);
	pendingPreview = {
		id: text$1(note.id),
		title,
		text: body
	};
}
function applyPreview() {
	if (!pendingPreview) return;
	const { id, title, text: body } = pendingPreview;
	pendingPreview = null;
	notes.set(notes().map((item) => text$1(item.id) === id ? {
		...item,
		title,
		text: body
	} : item));
}
function createNote() {
	flushSave();
	applyPreview();
	openingNew = true;
	commands.create("", null);
}
function closeNote() {
	leaveOpenNote();
	selectedId.set(null);
	draftTitle.set("");
	open(null);
}
function requestNoteTitleFocus() {
	const tryFocus = (tries) => {
		const session = titleSession;
		if (session) {
			try {
				session.focus();
				session.run(selectAll());
			} catch {}
			return;
		}
		if (tries > 0) setTimeout(() => tryFocus(tries - 1), 16);
	};
	tryFocus(8);
}
function removeNote() {
	const note = selected();
	if (!note) return;
	if (saveTimer) {
		clearTimeout(saveTimer);
		saveTimer = null;
	}
	dirty.set(false);
	notes.set(notes().filter((item) => text$1(item.id) !== text$1(note.id)));
	forgetRecent("note", text$1(note.id));
	closeNote();
	commands.remove(text$1(note.id));
}
function NotesPage(props) {
	if (!asked) {
		asked = true;
		loading.set(true);
		commands.reload();
	}
	return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "min-h-0 flex-1 flex-col");
		bindProp(__nsh_hv0, "style", () => ({ paddingTop: props.titlebarInset }));
		insert(__nsh_hv0, () => selected() ? each(() => [{ id: selectedId() ?? "" }], (row) => component(NoteView, {
			get colors() {
				return props.colors;
			},
			get dark() {
				return props.dark;
			}
		}), ((row) => row.id)) : component(LibraryView, {
			get colors() {
				return props.colors;
			},
			get dark() {
				return props.dark;
			},
			get onBack() {
				return props.onBack;
			},
			get benchmarkNotes() {
				return props.benchmarkNotes;
			}
		}));
		return __nsh_hv0;
	})();
}
function LibraryView(props) {
	const colors = props.colors;
	const items = () => props.benchmarkNotes ?? notes();
	return (() => {
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "class", "relative min-h-0 flex-1 flex-col");
		const __nsh_hv6 = element("view");
		prop(__nsh_hv6, "class", "min-h-0 flex-1");
		bindProp(__nsh_hv6, "style", () => ({ pointerEvents: props.benchmarkNotes ? "none" : "auto" }));
		prop(__nsh_hv6, "onLayout", (event) => gridWidth.set(event.bounds.size.width));
		insert(__nsh_hv6, () => loading() && !props.benchmarkNotes ? skeletonLibrary(colors, props.dark) : items().length === 0 ? component(EmptyLibrary, { colors }) : compact() ? libraryList(items(), colors, props.dark, Boolean(props.benchmarkNotes)) : libraryGrid(items(), colors, props.dark, Boolean(props.benchmarkNotes)));
		const __nsh_hv7 = element("view");
		prop(__nsh_hv7, "onPress", () => {
			if (!props.benchmarkNotes) createNote();
		});
		prop(__nsh_hv7, "role", "button");
		prop(__nsh_hv7, "accessibilityLabel", "Новая заметка");
		prop(__nsh_hv7, "class", "absolute flex-row items-center justify-center");
		bindProp(__nsh_hv7, "hoverStyle", () => ({ backgroundColor: filledHover(colors.accent) }));
		bindProp(__nsh_hv7, "activeStyle", () => ({ backgroundColor: filledPressed(colors.accent) }));
		bindProp(__nsh_hv7, "style", () => ({
			left: "50%",
			marginLeft: -92,
			bottom: 24,
			width: 184,
			height: 40,
			gap: 8,
			borderRadius: 20,
			backgroundColor: colors.accent,
			cursor: "pointer",
			boxShadow: cardShadow(props.dark)
		}));
		const __nsh_hv8 = element("text");
		prop(__nsh_hv8, "class", "text-[13px] font-medium");
		bindProp(__nsh_hv8, "style", () => ({ color: accentMark(colors.accent) }));
		const __nsh_hv9 = text("Новая заметка");
		append(__nsh_hv8, __nsh_hv9);
		append(__nsh_hv7, __nsh_hv8);
		insert(__nsh_hv7, component(Glyph, {
			name: "plus",
			size: 15,
			get color() {
				return accentMark(colors.accent);
			}
		}), __nsh_hv8);
		append(__nsh_hv1, __nsh_hv6);
		append(__nsh_hv1, __nsh_hv7);
		insert(__nsh_hv1, () => compact() && props.onBack ? (() => {
			const __nsh_hv2 = element("view");
			prop(__nsh_hv2, "class", "flex-row items-center");
			prop(__nsh_hv2, "style", {
				height: 44,
				paddingLeft: 12,
				gap: 10
			});
			const __nsh_hv3 = element("view");
			bindProp(__nsh_hv3, "onPress", () => props.onBack);
			prop(__nsh_hv3, "role", "button");
			prop(__nsh_hv3, "accessibilityLabel", "Назад");
			prop(__nsh_hv3, "class", "items-center justify-center");
			prop(__nsh_hv3, "style", {
				width: 24,
				height: 28,
				cursor: "pointer"
			});
			const __nsh_hv4 = element("text");
			prop(__nsh_hv4, "class", "text-[20px]");
			bindProp(__nsh_hv4, "style", () => ({ color: colors.accent }));
			const __nsh_hv5 = text("‹");
			append(__nsh_hv4, __nsh_hv5);
			append(__nsh_hv3, __nsh_hv4);
			append(__nsh_hv2, __nsh_hv3);
			return __nsh_hv2;
		})() : null, __nsh_hv6);
		return __nsh_hv1;
	})();
}
function gridMetrics(width) {
	const room = Math.max(width - 48, CARD_MIN);
	const columns = Math.max(1, Math.min(CARD_MAX_COLUMNS, Math.floor((room + CARD_GAP) / 212)));
	const share = (room - CARD_GAP * (columns - 1)) / columns;
	const cardWidth = Math.round(Math.min(CARD_MAX, share));
	const used = cardWidth * columns + CARD_GAP * (columns - 1);
	return {
		columns,
		cardWidth,
		sidePad: Math.max(0, Math.round((room - used) / 2))
	};
}
let benchmarkList = null;
function jumpBenchmarkLibrary(fraction) {
	if (!benchmarkList) return false;
	const { ref, count } = benchmarkList;
	ref.scrollToIndex({
		index: Math.floor((count - 1) * fraction),
		animated: false
	});
	return true;
}
function libraryGrid(items, colors, dark, benchmark = false) {
	const { columns, cardWidth, sidePad } = gridMetrics(gridWidth());
	const inset = GRID_PAD + sidePad;
	const rows = rowsOf(items, columns);
	const rowHeight = Math.round(cardWidth * CARD_RATIO) + CARD_GAP + 8;
	return component(list, {
		ref: benchmark ? (ref) => {
			benchmarkList = ref ? {
				ref,
				count: rows.length
			} : null;
		} : void 0,
		each: rows,
		keyExtractor: (row) => "row:" + (row[0] ? text$1(row[0].id) : "empty"),
		estimatedItemSize: rowHeight,
		testID: "notes-grid",
		class: "min-h-0 flex-1",
		contentStyle: {
			paddingLeft: inset,
			paddingRight: inset,
			paddingTop: inset,
			paddingBottom: LIBRARY_BOTTOM
		},
		get children() {
			return (row) => (() => {
				const __nsh_hv10 = element("view");
				prop(__nsh_hv10, "class", "flex-row");
				prop(__nsh_hv10, "style", {
					gap: CARD_GAP,
					paddingBottom: CARD_GAP
				});
				insert(__nsh_hv10, () => row().map((note) => component(NoteCard, {
					note,
					width: cardWidth,
					colors,
					dark
				})));
				return __nsh_hv10;
			})();
		}
	});
}
function rowsOf(notes, columns) {
	const rows = [];
	for (let index = 0; index < notes.length; index += columns) rows.push(notes.slice(index, index + columns));
	return rows;
}
function skeletonLibrary(colors, dark) {
	const { columns, cardWidth, sidePad } = gridMetrics(gridWidth());
	const inset = GRID_PAD + sidePad;
	const height = Math.round(cardWidth * CARD_RATIO);
	const fill = surfaceWash(dark, .06);
	const line = (width) => (() => {
		const __nsh_hv11 = element("view");
		prop(__nsh_hv11, "style", {
			width,
			height: 5,
			borderRadius: 3,
			backgroundColor: fill
		});
		return __nsh_hv11;
	})();
	const card = (() => {
		const __nsh_hv12 = element("view");
		bindProp(__nsh_hv12, "style", () => ({
			width: cardWidth,
			height,
			padding: 4,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.background
		}));
		const __nsh_hv13 = element("view");
		prop(__nsh_hv13, "class", "overflow-hidden");
		bindProp(__nsh_hv13, "style", () => ({
			flex: 1,
			borderRadius: 16,
			backgroundColor: colors.card,
			padding: 14,
			gap: 8
		}));
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "style", {
			width: cardWidth * .55,
			height: 11,
			borderRadius: 4,
			backgroundColor: fill
		});
		const __nsh_hv15 = element("view");
		prop(__nsh_hv15, "style", {
			marginTop: 6,
			gap: 6
		});
		insert(__nsh_hv15, [
			() => line(cardWidth * .72),
			() => line(cardWidth * .64),
			() => line(cardWidth * .7),
			() => line(cardWidth * .4)
		]);
		append(__nsh_hv13, __nsh_hv14);
		append(__nsh_hv13, __nsh_hv15);
		append(__nsh_hv12, __nsh_hv13);
		return __nsh_hv12;
	})();
	const rows = [];
	for (let index = 0; index < 3 * columns; index += columns) rows.push(new Array(columns).fill(null));
	return (() => {
		const __nsh_hv16 = element("view");
		prop(__nsh_hv16, "class", "min-h-0 flex-1");
		prop(__nsh_hv16, "style", {
			paddingLeft: inset,
			paddingRight: inset,
			paddingTop: inset
		});
		const __nsh_hv17 = element("view");
		prop(__nsh_hv17, "style", { gap: CARD_GAP });
		insert(__nsh_hv17, () => rows.map((row) => (() => {
			const __nsh_hv18 = element("view");
			prop(__nsh_hv18, "class", "flex-row");
			prop(__nsh_hv18, "style", { gap: CARD_GAP });
			insert(__nsh_hv18, () => row.map(() => card));
			return __nsh_hv18;
		})()));
		append(__nsh_hv16, __nsh_hv17);
		return __nsh_hv16;
	})();
}
function libraryList(items, colors, dark, benchmark = false) {
	const wash = surfaceWash(dark, .07);
	return component(list, {
		ref: benchmark ? (ref) => {
			benchmarkList = ref ? {
				ref,
				count: items.length
			} : null;
		} : void 0,
		each: items,
		keyExtractor: (note) => "note:" + text$1(note.id),
		estimatedItemSize: 78,
		class: "min-h-0 flex-1",
		contentStyle: {
			paddingLeft: LIBRARY_LIST_PAD,
			paddingRight: LIBRARY_LIST_PAD,
			paddingTop: LIBRARY_LIST_PAD,
			paddingBottom: LIBRARY_BOTTOM
		},
		get children() {
			return (note) => {
				const item = note();
				const title = noteLabel(item.title);
				return (() => {
					const __nsh_hv19 = element("view");
					prop(__nsh_hv19, "onPress", () => select(item));
					prop(__nsh_hv19, "role", "button");
					prop(__nsh_hv19, "accessibilityLabel", title);
					prop(__nsh_hv19, "hoverStyle", { backgroundColor: wash });
					prop(__nsh_hv19, "style", {
						paddingLeft: 12,
						paddingRight: 12,
						paddingTop: 12,
						paddingBottom: 12,
						gap: 3,
						borderRadius: 14,
						cursor: "pointer"
					});
					const __nsh_hv20 = element("text");
					prop(__nsh_hv20, "class", "text-[16px] font-semibold");
					bindProp(__nsh_hv20, "style", () => ({ color: colors.foreground }));
					insert(__nsh_hv20, title);
					const __nsh_hv21 = element("text");
					prop(__nsh_hv21, "class", "text-[13px]");
					bindProp(__nsh_hv21, "style", () => ({ color: colors.muted }));
					insert(__nsh_hv21, () => listLine(item));
					const __nsh_hv22 = element("text");
					prop(__nsh_hv22, "class", "text-[11px]");
					bindProp(__nsh_hv22, "style", () => ({ color: colors.muted }));
					insert(__nsh_hv22, () => stamp(item.updatedAt));
					append(__nsh_hv19, __nsh_hv20);
					append(__nsh_hv19, __nsh_hv21);
					append(__nsh_hv19, __nsh_hv22);
					return __nsh_hv19;
				})();
			};
		}
	});
}
function listLine(note) {
	const blocks = previewOf(note.doc);
	const line = text$1((blocks.filter((block) => block.text.trim() && (block.kind === "text" || block.kind === "item" || block.kind === "quote"))[0] ?? blocks.find((block) => block.text.trim()))?.text).trim();
	if (!line) return "Пустая заметка";
	return line.length > 80 ? `${line.slice(0, 78)}…` : line;
}
function NoteCard(props) {
	const colors = props.colors;
	const title = noteLabel(props.note.title);
	const height = Math.round(props.width * CARD_RATIO);
	const blocks = previewOf(props.note.doc);
	const lift = createMotion();
	const rise = (on) => {
		lift.play({
			keyframes: [{ translateY: on ? 0 : -3 }, { translateY: on ? -3 : 0 }],
			duration: 150,
			easing: Easing.bezier(.16, 1, .3, 1)
		});
	};
	return (() => {
		const __nsh_hv23 = element("view");
		prop(__nsh_hv23, "onPress", () => select(props.note));
		prop(__nsh_hv23, "onMouseEnter", () => rise(true));
		prop(__nsh_hv23, "onMouseLeave", () => rise(false));
		prop(__nsh_hv23, "role", "button");
		prop(__nsh_hv23, "accessibilityLabel", title);
		bindProp(__nsh_hv23, "hoverStyle", () => ({ backgroundColor: surfaceWash(props.dark, .07) }));
		bindProp(__nsh_hv23, "style", () => ({
			width: props.width,
			height,
			padding: 4,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.background,
			cursor: "pointer",
			boxShadow: cardShadow(props.dark),
			transitionProperty: "width, height",
			transitionDuration: "200ms",
			transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
			...lift.style
		}));
		const __nsh_hv24 = element("view");
		prop(__nsh_hv24, "class", "overflow-hidden");
		bindProp(__nsh_hv24, "style", () => ({
			flex: 1,
			borderRadius: 16,
			backgroundColor: colors.card,
			padding: 14
		}));
		const __nsh_hv25 = element("view");
		prop(__nsh_hv25, "class", "overflow-hidden");
		prop(__nsh_hv25, "style", { height: 36 });
		const __nsh_hv26 = element("text");
		prop(__nsh_hv26, "class", "text-[13px] font-semibold");
		bindProp(__nsh_hv26, "style", () => ({
			color: colors.foreground,
			lineHeight: 18
		}));
		insert(__nsh_hv26, title);
		append(__nsh_hv25, __nsh_hv26);
		const __nsh_hv27 = element("view");
		prop(__nsh_hv27, "style", {
			marginTop: 9,
			gap: 3
		});
		insert(__nsh_hv27, () => blocks.map((block) => component(PreviewLine, {
			block,
			colors
		})));
		append(__nsh_hv24, __nsh_hv25);
		append(__nsh_hv24, __nsh_hv27);
		append(__nsh_hv23, __nsh_hv24);
		return __nsh_hv23;
	})();
}
function EmptyLibrary(props) {
	const colors = props.colors;
	return (() => {
		const __nsh_hv28 = element("view");
		prop(__nsh_hv28, "class", "items-center");
		prop(__nsh_hv28, "style", {
			paddingTop: 96,
			gap: 10
		});
		const __nsh_hv29 = element("text");
		prop(__nsh_hv29, "class", "text-[15px]");
		bindProp(__nsh_hv29, "style", () => ({ color: colors.foreground }));
		const __nsh_hv30 = text("Заметок пока нет");
		append(__nsh_hv29, __nsh_hv30);
		const __nsh_hv31 = element("text");
		prop(__nsh_hv31, "class", "text-[12px]");
		bindProp(__nsh_hv31, "style", () => ({ color: colors.muted }));
		const __nsh_hv32 = text("Первая заметка — как чистый лист.");
		append(__nsh_hv31, __nsh_hv32);
		const __nsh_hv33 = element("view");
		prop(__nsh_hv33, "onPress", createNote);
		prop(__nsh_hv33, "role", "button");
		prop(__nsh_hv33, "accessibilityLabel", "Создать заметку");
		prop(__nsh_hv33, "class", "flex-row items-center");
		bindProp(__nsh_hv33, "hoverStyle", () => ({ backgroundColor: surfaceWash(false, .07) }));
		bindProp(__nsh_hv33, "style", () => ({
			marginTop: 6,
			height: 30,
			paddingLeft: 12,
			paddingRight: 14,
			gap: 6,
			borderRadius: 10,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.card,
			cursor: "pointer"
		}));
		const __nsh_hv34 = element("text");
		prop(__nsh_hv34, "class", "text-[13px]");
		bindProp(__nsh_hv34, "style", () => ({ color: colors.foreground }));
		const __nsh_hv35 = text("Создать заметку");
		append(__nsh_hv34, __nsh_hv35);
		append(__nsh_hv33, __nsh_hv34);
		insert(__nsh_hv33, component(Glyph, {
			name: "plus",
			size: 13,
			get color() {
				return colors.foreground;
			}
		}), __nsh_hv34);
		append(__nsh_hv28, __nsh_hv29);
		append(__nsh_hv28, __nsh_hv31);
		append(__nsh_hv28, __nsh_hv33);
		return __nsh_hv28;
	})();
}
function codeFields(id, rev) {
	const content = (segments.find((item) => item.id === id)?.session.getJSON())?.content ?? [];
	const block = content.find((node) => node?.type === "codeBlock") ?? content[0];
	const named = typeof block?.attrs?.language === "string" ? block.attrs.language : "";
	const text = (block?.content ?? []).map((child) => child?.text ?? "").join("");
	return {
		language: shownLanguage(named),
		text
	};
}
function setCodeLanguage(id, language) {
	const seg = segments.find((item) => item.id === id && item.kind === "code");
	if (!seg) return;
	const content = seg.session.getJSON().content ?? [];
	let pos = 0;
	for (const node of content) {
		if (node?.type === "codeBlock") break;
		pos += blockSize(node);
	}
	seg.session.run(setNodeAttribute(pos, "language", language));
	paintCode();
}
function codeLanguageMenu(id, at) {
	Menu.popup(codeLanguages.map(([value, label]) => ({
		label,
		onSelect: () => setCodeLanguage(id, value)
	})), at);
}
function attachRef(id, ref) {
	if (!ref) {
		segRefs.delete(id);
		return;
	}
	segRefs.set(id, ref);
	if (wantFocus !== id) return;
	wantFocus = null;
	try {
		ref.focus();
		if (!codeFields(id).text) ref.setSelection(1, 1);
	} catch {}
}
const TEXT_BLOCKS = /* @__PURE__ */ new Set([
	"paragraph",
	"heading",
	"listItem",
	"bulletList",
	"orderedList",
	"blockquote",
	"codeBlock",
	"table",
	"tableRow",
	"taskList",
	"taskItem"
]);
function plainOf(node) {
	const block = node;
	if (!block) return "";
	if (typeof block.text === "string") return block.text;
	if (!Array.isArray(block.content)) return "";
	const blocky = block.content.some((child) => TEXT_BLOCKS.has(String(child?.type ?? "")));
	return block.content.map(plainOf).filter((part) => part.length > 0).join(blocky ? "\n" : "");
}
function wrappedLines(text, width, font) {
	const per = Math.max(8, Math.floor(Math.max(40, width) / (font * .62)));
	let lines = 0;
	for (const line of (text || " ").split("\n")) lines += Math.max(1, Math.ceil(line.length / per));
	return lines;
}
function pieceWidth(room) {
	const pad = room > 0 ? room < COMPACT_LIBRARY ? 16 : Math.max((room - PAGE_MAX) / 2, PAGE_PAD / 2) : PAGE_PAD;
	return Math.max(220, (room > 0 ? room : 720) - pad * 2);
}
function updateSegHeight(id, height) {
	const rounded = Math.max(24, Math.ceil(height));
	if (segHeights.get(id) === rounded) return;
	segHeights.set(id, rounded);
	segHeightRev.update((n) => n + 1);
}
function measuredSegHeight(id, fallbackHeight) {
	segHeightRev();
	return segHeights.get(id) ?? fallbackHeight;
}
function proseBoxHeight(id, room, rev) {
	const seg = segments.find((item) => item.id === id);
	if (!seg) return 32;
	const width = pieceWidth(room);
	const content = seg.session.getJSON().content ?? [];
	let height = 0;
	for (const node of content) {
		const type = node?.type;
		const level = node?.attrs?.level ?? 1;
		if (type === "heading") {
			const line = level === 1 ? 36 : level === 2 ? 30 : level === 3 ? 26 : level === 4 ? 24 : level === 5 ? 22 : 20;
			const above = level === 1 ? 32 : level === 2 ? 26 : level === 3 ? 20 : level === 4 ? 16 : level === 5 ? 14 : 12;
			const below = level === 1 ? 8 : level === 2 ? 6 : level <= 4 ? 4 : 2;
			height += above + wrappedLines(plainOf(node), width, line > 26 ? 26 : 18) * line + below;
		} else if (type === "horizontalRule") height += 38;
		else if (type === "table") height += 40 * Math.max(1, (node.content ?? []).length) + 12;
		else if (type === "bulletList" || type === "orderedList" || type === "blockquote") height += 10 + wrappedLines(plainOf(node), width - 32, 16) * 24;
		else height += 8 + wrappedLines(plainOf(node), width, 16) * 24;
	}
	return Math.max(28, Math.ceil(height));
}
const CODE_BLEED = 20;
const CODE_EDGE = 8;
function codeBleedFor(pad) {
	return Math.max(0, Math.min(CODE_BLEED, pad - CODE_EDGE));
}
function codeBleed() {
	return codeBleedFor(pagePad());
}
function codeBoxHeight(text, room) {
	const per = Math.max(8, Math.floor(Math.max(80, pieceWidth(room)) / (codeSize() * .6)));
	return 26 + (text.length ? text : " ").split("\n").reduce((count, line) => count + Math.max(1, Math.ceil(line.length / per)), 0) * Math.round(codeSize() * 1.57);
}
function CodeCard(props) {
	const seg = segments.find((item) => item.id === props.id);
	if (!seg) return (() => {
		return element("view");
	})();
	const bleed = codeBleed();
	return (() => {
		const __nsh_hv37 = element("view");
		prop(__nsh_hv37, "testID", "note-code-card");
		bindProp(__nsh_hv37, "style", () => ({
			marginTop: 4,
			marginBottom: 8,
			marginLeft: -bleed,
			marginRight: -bleed,
			borderRadius: 10,
			borderWidth: 1,
			borderColor: props.colors.border,
			backgroundColor: surfaceWash(props.dark, .06),
			overflow: "hidden"
		}));
		const __nsh_hv38 = element("view");
		prop(__nsh_hv38, "class", "flex-row items-center justify-between");
		bindProp(__nsh_hv38, "style", () => ({
			height: 36,
			paddingLeft: Math.max(0, bleed - 8),
			paddingRight: bleed + 4,
			borderBottomWidth: 1,
			borderColor: props.colors.border
		}));
		const __nsh_hv39 = element("view");
		prop(__nsh_hv39, "onPress", (event) => codeLanguageMenu(props.id, event.pagePosition));
		prop(__nsh_hv39, "role", "button");
		bindProp(__nsh_hv39, "accessibilityLabel", () => languageLabel(codeFields(props.id, bodyRev()).language));
		bindProp(__nsh_hv39, "hoverStyle", () => ({ backgroundColor: props.wash }));
		prop(__nsh_hv39, "style", {
			height: 26,
			paddingLeft: 8,
			paddingRight: 8,
			borderRadius: 6,
			cursor: "pointer",
			justifyContent: "center"
		});
		const __nsh_hv40 = element("text");
		prop(__nsh_hv40, "class", "text-[12px] font-medium");
		bindProp(__nsh_hv40, "style", () => ({ color: props.colors.muted }));
		insert(__nsh_hv40, () => languageLabel(codeFields(props.id, bodyRev()).language));
		append(__nsh_hv39, __nsh_hv40);
		const __nsh_hv41 = element("view");
		prop(__nsh_hv41, "onPress", () => copyBlock(codeFields(props.id).text, props.id));
		prop(__nsh_hv41, "role", "button");
		prop(__nsh_hv41, "accessibilityLabel", "Скопировать");
		prop(__nsh_hv41, "class", "items-center justify-center");
		bindProp(__nsh_hv41, "hoverStyle", () => ({ backgroundColor: props.wash }));
		prop(__nsh_hv41, "style", {
			width: 28,
			height: 28,
			borderRadius: 6,
			cursor: "pointer"
		});
		insert(__nsh_hv41, () => copiedId() === props.id ? component(Glyph, {
			name: "check",
			size: 14,
			get color() {
				return props.colors.foreground;
			}
		}) : component(Glyph, {
			name: "copy",
			size: 14,
			get color() {
				return props.colors.muted;
			}
		}));
		append(__nsh_hv38, __nsh_hv39);
		append(__nsh_hv38, __nsh_hv41);
		append(__nsh_hv37, __nsh_hv38);
		insert(__nsh_hv37, component(RichEditor, {
			get editor() {
				return seg.session;
			},
			ref: (ref) => attachRef(props.id, ref),
			accessibilityLabel: "Код",
			onContentSizeChange: ({ contentSize }) => updateSegHeight(props.id, Math.max(40, contentSize.height)),
			onSelectionChange: ({ selection }) => syncOutlineFromCaret(props.id, selection.from),
			get style() {
				return { height: measuredSegHeight(props.id, codeBoxHeight(codeFields(props.id, bodyRev()).text, pageRoom())) };
			},
			get styles() {
				return codeStyles(props.colors, props.dark, bleed - 1);
			}
		}));
		return __nsh_hv37;
	})();
}
function ProsePiece(props) {
	const seg = segments.find((item) => item.id === props.id);
	if (!seg) return (() => {
		return element("view");
	})();
	return component(RichEditor, {
		get editor() {
			return seg.session;
		},
		ref: (ref) => attachRef(props.id, ref),
		classes: TASK_CLASSES,
		accessibilityLabel: "Текст заметки",
		get placeholder() {
			return segmentList()[0]?.id === props.id ? NOTE_PLACEHOLDER : void 0;
		},
		onContentSizeChange: ({ contentSize }) => updateSegHeight(props.id, contentSize.height),
		onChange: () => applyProseGutter(seg.session, seg.paintRevs),
		onSelectionChange: ({ selection }) => scheduleCaretOutline(props.id, selection.from),
		onPasteFiles: (event) => {
			pastePictures(event.paste, seg.session);
		},
		onBlur: () => {
			if (!slashOpen()) return;
			if (slashHold) {
				slashHold = false;
				return;
			}
			if (seg.session !== slashSession) return;
			closeSlash();
		},
		get style() {
			return {
				marginLeft: -8,
				marginRight: -8,
				height: measuredSegHeight(props.id, proseBoxHeight(props.id, pageRoom(), bodyRev()))
			};
		},
		get styles() {
			return noteStyles(props.colors, props.dark, 0, true);
		}
	});
}
function SplitNote(props) {
	return (() => {
		const __nsh_hv43 = element("view");
		prop(__nsh_hv43, "class", "relative min-h-0 flex-1");
		prop(__nsh_hv43, "ref", (node) => {
			menuAnchor = node;
		});
		const __nsh_hv44 = element("scroll");
		prop(__nsh_hv44, "ref", (node) => {
			splitScrollRef = node;
		});
		prop(__nsh_hv44, "onScroll", (event) => onSplitScroll(event.offset.y));
		prop(__nsh_hv44, "smoothWheel", true);
		prop(__nsh_hv44, "wheelLineHeight", 40);
		prop(__nsh_hv44, "scrollbar", false);
		prop(__nsh_hv44, "class", "min-h-0 flex-1");
		bindProp(__nsh_hv44, "contentStyle", () => ({
			paddingTop: noteTopPad(),
			paddingBottom: 0,
			paddingLeft: pagePad(),
			paddingRight: pagePad()
		}));
		const __nsh_hv46 = element("view");
		prop(__nsh_hv46, "onPress", caretToEnd);
		prop(__nsh_hv46, "testID", "split-note-tail");
		prop(__nsh_hv46, "style", { height: 120 });
		append(__nsh_hv44, __nsh_hv46);
		insert(__nsh_hv44, [component(NoteTitle, { get colors() {
			return props.colors;
		} }), each(() => segmentList(), (row) => {
			const item = row();
			return (() => {
				const __nsh_hv45 = element("view");
				prop(__nsh_hv45, "onLayout", (event) => {
					segTops.set(item.id, event.bounds.origin.y);
				});
				insert(__nsh_hv45, () => item.kind === "code" ? component(CodeCard, {
					get id() {
						return item.id;
					},
					get colors() {
						return props.colors;
					},
					get dark() {
						return props.dark;
					},
					get wash() {
						return props.wash;
					}
				}) : component(ProsePiece, {
					get id() {
						return item.id;
					},
					get colors() {
						return props.colors;
					},
					get dark() {
						return props.dark;
					}
				}));
				return __nsh_hv45;
			})();
		}, ((row) => String(row.id)))], __nsh_hv46);
		append(__nsh_hv43, __nsh_hv44);
		return __nsh_hv43;
	})();
}
function slashKeyboard() {
	return (() => {
		const __nsh_hv47 = element("view");
		prop(__nsh_hv47, "ref", (node) => {
			slashFocus = node;
		});
		prop(__nsh_hv47, "focusable", true);
		prop(__nsh_hv47, "style", {
			position: "absolute",
			width: 1,
			height: 1,
			opacity: 0
		});
		return __nsh_hv47;
	})();
}
function slashMenu(colors, wash) {
	return (() => {
		const __nsh_hv48 = element("view");
		prop(__nsh_hv48, "class", "absolute rounded-lg border");
		bindProp(__nsh_hv48, "style", () => ({
			left: slashLeft(),
			top: slashTop(),
			width: 264,
			backgroundColor: colors.card,
			borderColor: colors.border,
			paddingTop: 4,
			paddingBottom: 4
		}));
		insert(__nsh_hv48, () => filtered(slashQuery()).map((item, index) => (() => {
			const __nsh_hv49 = element("view");
			prop(__nsh_hv49, "onPress", () => {
				slashIndex.set(index);
				pick();
			});
			prop(__nsh_hv49, "role", "button");
			bindProp(__nsh_hv49, "accessibilityLabel", () => item.label);
			prop(__nsh_hv49, "class", "flex-row items-center");
			prop(__nsh_hv49, "hoverStyle", { backgroundColor: wash });
			bindProp(__nsh_hv49, "style", () => ({
				height: 28,
				paddingLeft: 10,
				paddingRight: 10,
				gap: 8,
				cursor: "pointer",
				backgroundColor: index === slashIndex() ? wash : "transparent"
			}));
			const __nsh_hv50 = element("text");
			prop(__nsh_hv50, "class", "text-[13px] flex-1");
			bindProp(__nsh_hv50, "style", () => ({ color: colors.foreground }));
			insert(__nsh_hv50, () => item.label);
			const __nsh_hv51 = element("text");
			prop(__nsh_hv51, "class", "text-[11px]");
			bindProp(__nsh_hv51, "style", () => ({ color: colors.muted }));
			insert(__nsh_hv51, () => item.hint);
			append(__nsh_hv49, __nsh_hv50);
			append(__nsh_hv49, __nsh_hv51);
			return __nsh_hv49;
		})()));
		return __nsh_hv48;
	})();
}
function onPageSpacePress() {
	if (slashOpen()) {
		closeSlash();
		return;
	}
	if (split) return;
	caretToEnd();
}
function NoteView(props) {
	const colors = props.colors;
	const wash = surfaceWash(props.dark, .07);
	const id = selectedId() ?? "";
	if (id && !editor) {
		const note = notes().find((item) => text$1(item.id) === id);
		if (note) open(note);
	}
	if (paintedDark !== props.dark) {
		paintedDark = props.dark;
		queueMicrotask(paintCode);
	}
	return (() => {
		const __nsh_hv52 = element("view");
		prop(__nsh_hv52, "class", "min-h-0 flex-1 flex-col");
		const __nsh_hv53 = element("view");
		prop(__nsh_hv53, "class", "relative min-h-0 flex-1");
		prop(__nsh_hv53, "onLayout", (event) => {
			pageRoom.set(event.bounds.size.width);
			pageTall.set(event.bounds.size.height);
			menuAnchor?.measure().then((box) => {
				if (box) pageTopY = box.pagePosition.y;
			});
		});
		const __nsh_hv54 = element("view");
		prop(__nsh_hv54, "class", "min-h-0 flex-col");
		bindProp(__nsh_hv54, "style", () => ({ height: pageTall() > 0 ? pageTall() : void 0 }));
		const __nsh_hv55 = element("view");
		prop(__nsh_hv55, "class", "relative min-h-0 flex-1");
		prop(__nsh_hv55, "ref", (node) => {
			menuAnchor = node;
		});
		prop(__nsh_hv55, "onPress", onPageSpacePress);
		prop(__nsh_hv55, "onWheel", onSingleWheel);
		prop(__nsh_hv55, "testID", "note-page-space");
		insert(__nsh_hv55, [
			() => codeLayout() ? component(SplitNote, {
				colors,
				get dark() {
					return props.dark;
				},
				wash
			}) : each(() => [{ stamp: editorVersion() }], (row) => editor ? component(RichEditor, {
				editor,
				ref: (ref) => {
					editorRef = ref;
				},
				class: "min-h-0 flex-1",
				classes: TASK_CLASSES,
				onChange: () => {
					if (editor && !split) {
						singleBodyEmpty.set(editor.getText().length === 0);
						applyProseGutter(editor, singlePaintRevs);
					}
				},
				get contentLayer() {
					return (() => {
						const __nsh_hv56 = element("view");
						prop(__nsh_hv56, "class", "absolute left-0 right-0");
						bindProp(__nsh_hv56, "style", () => ({
							top: noteTopPad(),
							pointerEvents: "box-none"
						}));
						insert(__nsh_hv56, component(NoteTitle, {
							colors,
							pad: true
						}));
						return __nsh_hv56;
					})();
				},
				placeholder: NOTE_PLACEHOLDER,
				accessibilityLabel: "Текст заметки",
				onSelectionChange: ({ selection }) => scheduleCaretOutline(null, selection.from),
				onPasteFiles: (event) => {
					pastePictures(event.paste, editor);
				},
				onBlur: () => {
					if (!slashOpen()) return;
					if (slashHold) {
						slashHold = false;
						return;
					}
					if (editor !== slashSession) return;
					closeSlash();
				},
				get styles() {
					return noteStyles(colors, props.dark, pagePad() - TABLE_BLEED, false, noteTopPad() + titleHeight() + 20 + NOTE_TOP_PAD, singleBodyEmpty());
				}
			}) : (() => {
				const __nsh_hv57 = element("view");
				prop(__nsh_hv57, "class", "h-full");
				return __nsh_hv57;
			})(), ((row) => row.stamp)),
			() => slashOpen() && slashKeyboard(),
			() => slashOpen() && slashMenu(colors, wash)
		]);
		append(__nsh_hv54, __nsh_hv55);
		append(__nsh_hv53, __nsh_hv54);
		insert(__nsh_hv53, component(NotesOutlineRail, {
			marks: outline,
			activePos: activeOutlinePos,
			colors,
			get dark() {
				return props.dark;
			},
			maxHeight: () => pageTall(),
			onHoverOpen: syncOutlineFromViewport,
			onSelect: jumpToOutline
		}));
		append(__nsh_hv52, __nsh_hv53);
		return __nsh_hv52;
	})();
}
function NoteTitle(props) {
	const editor = titleEditor();
	if (!editor) return (() => {
		return element("view");
	})();
	return (() => {
		const __nsh_hv59 = element("view");
		prop(__nsh_hv59, "class", "shrink-0 flex-col justify-end");
		bindProp(__nsh_hv59, "onLayout", () => props.pad ? (event) => titleHeight.set(event.bounds.size.height) : void 0);
		bindProp(__nsh_hv59, "style", () => ({
			minHeight: 80,
			marginLeft: props.pad ? pagePad() : 0,
			marginRight: props.pad ? pagePad() : 0,
			marginBottom: 20
		}));
		insert(__nsh_hv59, component(RichEditor, {
			editor,
			placeholder: NOTE_TITLE_HINT,
			accessibilityLabel: "Название заметки",
			get styles() {
				return titleStyles(props.colors, draftTitle().length === 0);
			},
			class: "shrink-0"
		}));
		return __nsh_hv59;
	})();
}
let titleSession = null;
function titleEditor() {
	return titleSession;
}
function buildTitleEditor(title) {
	titleHeight.set(80);
	const previous = titleSession;
	titleSession = null;
	if (previous) try {
		previous.dispose();
	} catch {}
	const made = makeEditor({
		type: "doc",
		content: [{
			type: "paragraph",
			content: title ? [{
				type: "text",
				text: title
			}] : []
		}]
	});
	made.on("revision", () => editTitle(titleTextOf(made)));
	titleSession = made;
}
function titleTextOf(session) {
	const doc = session.getJSON();
	return (Array.isArray(doc?.content) ? doc.content : []).map((block) => (Array.isArray(block.content) ? block.content : []).map((leaf) => leaf.text ?? "").join("")).join("\n");
}
let titleStylesCache = null;
function titleStyles(colors, empty) {
	const foreground = empty ? colors.muted : colors.foreground;
	const key = `${foreground}|${colors.muted}|${colors.accent}`;
	if (titleStylesCache?.key !== key) titleStylesCache = {
		key,
		styles: {
			content: {
				color: foreground,
				backgroundColor: "transparent",
				paddingTop: 0,
				paddingBottom: 0,
				paddingLeft: 0,
				paddingRight: 0,
				minHeight: 0
			},
			placeholder: { color: colors.muted },
			caret: { backgroundColor: colors.accent },
			nodes: { paragraph: {
				fontSize: 32,
				fontWeight: 600,
				lineHeight: 40,
				marginTop: 0,
				marginBottom: 0,
				textAlign: "center"
			} }
		}
	};
	return titleStylesCache.styles;
}
function pagePad() {
	const room = pageRoom();
	if (!(room > 0)) return PAGE_PAD;
	if (compact()) return 16;
	return Math.max((room - PAGE_MAX) / 2, PAGE_PAD / 2);
}
const NOTE_TITLE_GAP = 20;
const NOTE_TOP_PAD = 4;
const NOTE_TITLE_LINE = 40;
const NOTE_TITLE_BLOCK = 80;
const titleHeight = signal(80);
const NOTE_TOP_SHARE = .2;
function pageVisibleTall() {
	if (pageTall() > 0) return pageTall();
	const bounds = windows()[0]?.state()?.contentBounds;
	const tall = Number(bounds?.size?.height ?? 0);
	return tall > 0 ? tall - 48 : 0;
}
function noteTopPadFor(tall) {
	if (!(tall > 0)) return NOTE_TOP_PAD;
	return Math.max(0, Math.round(tall * NOTE_TOP_SHARE) - NOTE_TITLE_LINE);
}
function noteTopPad() {
	return noteTopPadFor(pageVisibleTall());
}
const emptyHint = (text) => `\u200B${text}`;
const NOTE_PLACEHOLDER = emptyHint("Пишите. Слэш открывает блоки: заголовок, список, таблица…");
const NOTE_TITLE_HINT = emptyHint("Без названия");
let documentStylesCache = null;
function segmentAt(markPos) {
	let pos = 1;
	for (let index = 0; index < segments.length; index += 1) {
		const seg = segments[index];
		const start = pos;
		const doc = seg.session.getJSON();
		for (const node of doc.content ?? []) pos += nodeSize(node);
		if (markPos < pos || index === segments.length - 1) return {
			id: seg.id,
			local: markPos - (start - 1)
		};
	}
	return null;
}
function noteStyles(colors, dark, pad, piece = false, topPad = 2, empty = false) {
	const key = `${piece}|${dark}|${pad}|${topPad}|${empty}|${textSize()}|${codeSize()}|${colors.background}|${colors.foreground}|${colors.muted}|${colors.border}`;
	if (documentStylesCache?.key !== key) documentStylesCache = {
		key,
		styles: documentStyles(colors, dark, pad, piece, topPad, empty)
	};
	return documentStylesCache.styles;
}
let codeStylesCache = null;
function codeStyles(colors, dark, pad) {
	const key = `${dark}|${colors.foreground}|${colors.accent}|${colors.muted}|${pad}|${codeSize()}`;
	if (codeStylesCache?.key !== key) codeStylesCache = {
		key,
		styles: {
			content: {
				color: colors.foreground,
				backgroundColor: "transparent",
				paddingTop: 0,
				paddingBottom: 0,
				paddingLeft: 0,
				paddingRight: 0,
				minHeight: 0
			},
			placeholder: { color: colors.muted },
			caret: { backgroundColor: colors.accent },
			nodes: {
				codeBlock: {
					fontFamily: GeistMono_Regular_default,
					fontSize: codeSize(),
					fontWeight: 500,
					lineHeight: Math.round(codeSize() * 1.57),
					paddingTop: 12,
					paddingBottom: 14,
					paddingLeft: pad,
					paddingRight: pad,
					marginTop: 0,
					marginBottom: 0,
					backgroundColor: "transparent"
				},
				paragraph: {
					fontFamily: GeistMono_Regular_default,
					fontSize: codeSize(),
					fontWeight: 500,
					lineHeight: Math.round(codeSize() * 1.57),
					marginTop: 0,
					marginBottom: 0
				}
			},
			marks: {}
		}
	};
	return codeStylesCache.styles;
}
function documentStyles(colors, dark, pad, piece = false, topPad = 2, empty = false) {
	return {
		content: {
			color: empty ? colors.muted : colors.foreground,
			backgroundColor: "transparent",
			paddingTop: piece ? 0 : topPad,
			paddingBottom: piece ? 0 : 120,
			paddingLeft: piece ? 0 : pad,
			paddingRight: piece ? 0 : pad,
			minHeight: 0
		},
		placeholder: { color: colors.muted },
		caret: { backgroundColor: colors.accent },
		taskCheckbox: {
			marginRight: 8,
			marginTop: 3
		},
		taskCheckboxIndicator: {
			width: 16,
			height: 16,
			borderWidth: 1.5,
			borderColor: colors.border,
			borderRadius: 4
		},
		taskCheckboxChecked: {
			width: 16,
			height: 16,
			borderWidth: 1.5,
			borderColor: colors.accent,
			borderRadius: 4,
			backgroundColor: colors.accent
		},
		nodes: {
			paragraph: {
				fontSize: textSize(),
				fontWeight: 500,
				lineHeight: Math.round(textSize() * 1.5),
				marginTop: 2,
				marginBottom: 4
			},
			"heading[level=1]": {
				fontSize: 28,
				lineHeight: 36,
				fontWeight: "bold",
				marginTop: 32,
				marginBottom: 8
			},
			"heading[level=2]": {
				fontSize: 22,
				lineHeight: 30,
				fontWeight: "bold",
				marginTop: 26,
				marginBottom: 6
			},
			"heading[level=3]": {
				fontSize: 18,
				lineHeight: 26,
				fontWeight: "bold",
				marginTop: 20,
				marginBottom: 4
			},
			"heading[level=4]": {
				fontSize: 16,
				lineHeight: 24,
				fontWeight: "bold",
				marginTop: 16,
				marginBottom: 4
			},
			"heading[level=5]": {
				fontSize: 15,
				lineHeight: 22,
				fontWeight: "bold",
				marginTop: 14,
				marginBottom: 2
			},
			"heading[level=6]": {
				fontSize: 14,
				lineHeight: 20,
				fontWeight: "bold",
				marginTop: 12,
				marginBottom: 2
			},
			blockquote: {
				paddingLeft: 28,
				marginTop: 6,
				marginBottom: 6,
				borderLeftWidth: 2,
				borderColor: colors.border
			},
			bulletList: {
				marginTop: 2,
				marginBottom: 4,
				paddingLeft: 24
			},
			orderedList: {
				marginTop: 2,
				marginBottom: 4,
				paddingLeft: 38
			},
			listItem: {
				fontSize: textSize(),
				fontWeight: 500,
				lineHeight: Math.round(textSize() * 1.5)
			},
			taskList: {
				marginTop: 2,
				marginBottom: 4,
				paddingLeft: piece ? 24 : 6
			},
			taskItem: {
				fontSize: textSize(),
				fontWeight: 500,
				lineHeight: Math.round(textSize() * 1.5)
			},
			codeBlock: {
				fontFamily: GeistMono_Regular_default,
				fontSize: codeSize(),
				fontWeight: 500,
				lineHeight: Math.round(codeSize() * 1.57),
				paddingTop: 12,
				paddingBottom: 12,
				paddingLeft: 14,
				paddingRight: 14,
				marginTop: piece ? 0 : 6,
				marginBottom: piece ? 0 : 6,
				borderRadius: piece ? 0 : 8,
				backgroundColor: piece ? "transparent" : surfaceWash(dark, .08)
			},
			horizontalRule: {
				marginTop: 18,
				marginBottom: 18,
				borderColor: colors.border
			},
			table: {
				marginTop: 6,
				marginBottom: 6
			},
			tableCell: {
				fontSize: 14,
				lineHeight: 22,
				padding: 8,
				borderColor: colors.border
			},
			tableHeader: {
				fontSize: 14,
				lineHeight: 22,
				padding: 8,
				fontWeight: "bold",
				backgroundColor: surfaceWash(dark, .05)
			}
		},
		marks: {
			code: {
				fontFamily: GeistMono_Regular_default,
				fontSize: codeSize(),
				fontWeight: 500,
				color: colors.foreground,
				backgroundColor: surfaceWash(dark, .08)
			},
			link: {
				color: colors.accent,
				textDecorationLine: "underline"
			}
		}
	};
}
function previewOf(doc) {
	const body = documentOf(doc);
	Array.isArray(body.content) && body.content;
	const out = [];
	const push = (block) => {
		if (out.length < PREVIEW_BLOCKS && (block.text || block.kind === "rule")) out.push(block);
	};
	const walk = (node, depth) => {
		if (out.length >= PREVIEW_BLOCKS || !node || typeof node !== "object") return;
		const value = node;
		const nodes = Array.isArray(value.content) ? value.content : [];
		for (const child of nodes) {
			if (out.length >= PREVIEW_BLOCKS) return;
			const type = String(child?.type ?? "");
			const text = inlineText(child);
			if (type === "heading") push({
				kind: "heading",
				text,
				level: Number(child.attrs?.level ?? 1)
			});
			else if (type === "paragraph") push({
				kind: depth > 0 ? "item" : "text",
				text,
				level: 0
			});
			else if (type === "codeBlock") push({
				kind: "code",
				text,
				level: 0
			});
			else if (type === "blockquote") walk(child, depth + 1);
			else if (type === "bulletList" || type === "orderedList") walk(child, depth + 1);
			else if (type === "listItem") walk(child, depth);
			else if (type === "horizontalRule") push({
				kind: "rule",
				text: "",
				level: 0
			});
			else if (type === "table") push({
				kind: "rule",
				text: "",
				level: 0
			});
			else if (Array.isArray(child.content)) walk(child, depth);
		}
	};
	walk(body, 0);
	return out;
}
function inlineText(node) {
	const value = node;
	if (typeof value?.text === "string") return value.text;
	if (!Array.isArray(value?.content)) return "";
	return value.content.map((child) => inlineText(child)).join("");
}
const PREVIEW_SIZES = {
	h1: {
		size: 12,
		line: 16,
		weight: "bold",
		gap: 6
	},
	h2: {
		size: 11,
		line: 15,
		weight: "bold",
		gap: 5
	},
	h3: {
		size: 10,
		line: 14,
		weight: "bold",
		gap: 4
	},
	text: {
		size: 8,
		line: 12,
		weight: "normal",
		gap: 2
	},
	item: {
		size: 8,
		line: 12,
		weight: "normal",
		gap: 2
	},
	code: {
		size: 7.5,
		line: 11,
		weight: "normal",
		gap: 2
	},
	quote: {
		size: 8,
		line: 12,
		weight: "normal",
		gap: 2
	}
};
function PreviewLine(props) {
	const block = props.block;
	const colors = props.colors;
	if (block.kind === "rule") return (() => {
		const __nsh_hv60 = element("view");
		bindProp(__nsh_hv60, "style", () => ({
			height: 1,
			marginTop: 4,
			marginBottom: 2,
			backgroundColor: colors.border
		}));
		return __nsh_hv60;
	})();
	const scale = block.kind === "heading" ? PREVIEW_SIZES[`h${Math.min(Math.max(block.level, 1), 3)}`] ?? PREVIEW_SIZES.h1 : PREVIEW_SIZES[block.kind] ?? PREVIEW_SIZES.text;
	const ink = block.kind === "heading" ? colors.foreground : colorAlpha(colors.foreground, .62);
	return (() => {
		const __nsh_hv61 = element("text");
		prop(__nsh_hv61, "class", "w-full");
		bindProp(__nsh_hv61, "style", () => ({
			fontSize: scale.size,
			lineHeight: scale.line,
			fontWeight: scale.weight,
			fontFamily: block.kind === "code" ? GeistMono_Regular_default : void 0,
			color: ink,
			marginTop: scale.gap,
			paddingLeft: block.kind === "item" ? 9 : 0
		}));
		insert(__nsh_hv61, () => block.kind === "item" ? `• ${block.text}` : block.text);
		return __nsh_hv61;
	})();
}
function cardShadow(dark) {
	return dark ? "0 1px 2px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.35)" : "0 1px 2px rgba(15,23,42,0.06), 0 10px 26px rgba(15,23,42,0.09)";
}
const filledHover = (accent) => mixHex(accent, accentMark(accent), .12);
const filledPressed = (accent) => mixHex(accent, accentMark(accent), .22);
const MONTHS_SHORT = [
	"янв",
	"фев",
	"мар",
	"апр",
	"мая",
	"июн",
	"июл",
	"авг",
	"сен",
	"окт",
	"ноя",
	"дек"
];
function stamp(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.valueOf())) return "";
	return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

//#endregion
//#region settings.tsx
const openSelect = signal(null);
const NativeToggle = nativeComponent("atlas.toggle", {
	props: [
		"checked",
		"disabled",
		"label",
		"accent",
		"foreground",
		"surface"
	],
	events: ["change"]
});
/** Whether the palette paints on a dark background, for the hover wash. */
function darkColors(colors) {
	const n = Number.parseInt(colors.background.replace("#", ""), 16);
	if (Number.isNaN(n)) return true;
	return ((n >> 16 & 255) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1e3 < 128;
}
/** The scrolling page every settings screen opens with: one column, centered. */
function SettingsPage$1(props) {
	return component(PageScroll, {
		get colors() {
			return props.colors;
		},
		get children() {
			return (() => {
				const __nsh_hv0 = element("view");
				prop(__nsh_hv0, "class", "mx-auto w-full max-w-[660px]");
				insert(__nsh_hv0, () => props.children);
				return __nsh_hv0;
			})();
		}
	});
}
/** A titled group of rows: the rounded card a settings page is built from. */
function SettingsSection(props) {
	return (() => {
		const __nsh_hv1 = element("view");
		prop(__nsh_hv1, "style", { marginBottom: 22 });
		const __nsh_hv3 = element("view");
		prop(__nsh_hv3, "class", "rounded-xl border");
		bindProp(__nsh_hv3, "style", () => ({
			backgroundColor: props.colors.card,
			borderColor: props.colors.border
		}));
		insert(__nsh_hv3, () => props.children);
		append(__nsh_hv1, __nsh_hv3);
		insert(__nsh_hv1, [component(SectionTitle, {
			get colors() {
				return props.colors;
			},
			get children() {
				return props.title;
			}
		}), () => props.note ? (() => {
			const __nsh_hv2 = element("text");
			prop(__nsh_hv2, "class", "mb-2 text-[12px]");
			bindProp(__nsh_hv2, "style", () => ({ color: props.colors.muted }));
			insert(__nsh_hv2, () => props.note);
			return __nsh_hv2;
		})() : null], __nsh_hv3);
		return __nsh_hv1;
	})();
}
/**
* One line of a group: a label, an optional description, and the control on
* the right. `first` drops the divider the row above would draw.
*/
function SettingsRow(props) {
	const colors = props.colors;
	const body = (() => {
		const __nsh_hv4 = element("view");
		prop(__nsh_hv4, "class", "flex-row items-center");
		bindProp(__nsh_hv4, "style", () => ({
			gap: 16,
			paddingLeft: 14,
			paddingRight: 14,
			paddingTop: 11,
			paddingBottom: 11,
			borderTopWidth: props.first ? 0 : 1,
			borderColor: colors.border
		}));
		const __nsh_hv5 = element("view");
		prop(__nsh_hv5, "class", "min-w-0 flex-1");
		const __nsh_hv6 = element("text");
		bindProp(__nsh_hv6, "style", () => ({
			color: colors.foreground,
			fontSize: interfaceSize()
		}));
		insert(__nsh_hv6, () => props.title);
		append(__nsh_hv5, __nsh_hv6);
		insert(__nsh_hv5, () => props.description ? (() => {
			const __nsh_hv7 = element("text");
			prop(__nsh_hv7, "class", "text-[12px]");
			bindProp(__nsh_hv7, "style", () => ({
				color: colors.muted,
				marginTop: 2
			}));
			insert(__nsh_hv7, () => props.description);
			return __nsh_hv7;
		})() : null);
		append(__nsh_hv4, __nsh_hv5);
		insert(__nsh_hv4, () => props.leading, __nsh_hv5);
		insert(__nsh_hv4, () => props.children);
		return __nsh_hv4;
	})();
	if (!props.onPress) return body;
	return (() => {
		const __nsh_hv8 = element("view");
		bindProp(__nsh_hv8, "onPress", () => props.onPress);
		prop(__nsh_hv8, "role", "button");
		bindProp(__nsh_hv8, "accessibilityLabel", () => props.accessibilityLabel ?? props.title);
		bindProp(__nsh_hv8, "hoverStyle", () => ({ backgroundColor: hoverWash(darkColors(colors)) }));
		prop(__nsh_hv8, "style", { cursor: "pointer" });
		insert(__nsh_hv8, body);
		return __nsh_hv8;
	})();
}
/** A switch: imago's `Toggle`, so the press ticks and the look matches. */
function Toggle(props) {
	const colors = props.colors;
	return (() => {
		const __nsh_hv9 = element("view");
		prop(__nsh_hv9, "class", "shrink-0 items-center justify-center");
		prop(__nsh_hv9, "style", {
			width: 45,
			height: 29
		});
		insert(__nsh_hv9, component(NativeToggle, {
			style: {
				width: 44.8,
				height: 28.8
			},
			get checked() {
				return props.on;
			},
			get disabled() {
				return !!props.disabled;
			},
			get label() {
				return props.label;
			},
			get accent() {
				return colors.accent;
			},
			get foreground() {
				return colors.foreground;
			},
			get surface() {
				return colors.card;
			},
			onChange: () => props.onPress()
		}));
		return __nsh_hv9;
	})();
}
/** A drop-down: the trigger is a row, the list opens under it. */
function SettingsSelect(props) {
	const colors = props.colors;
	const width = props.width ?? 140;
	const expanded = openSelect() === props.id;
	const trigger = (() => {
		const __nsh_hv10 = element("view");
		prop(__nsh_hv10, "role", "button");
		bindProp(__nsh_hv10, "accessibilityLabel", () => props.label);
		bindProp(__nsh_hv10, "accessibilityState", () => ({
			expanded,
			disabled: !!props.disabled
		}));
		prop(__nsh_hv10, "class", "h-8 flex-row items-center justify-between rounded-lg border");
		bindProp(__nsh_hv10, "hoverStyle", () => ({ backgroundColor: hoverWash(darkColors(colors)) }));
		bindProp(__nsh_hv10, "style", () => ({
			width,
			paddingLeft: 10,
			paddingRight: 9,
			backgroundColor: colors.background,
			borderColor: expanded ? colors.accent : colors.border,
			opacity: props.disabled ? .6 : 1,
			cursor: props.disabled ? "default" : "pointer"
		}));
		const __nsh_hv11 = element("text");
		prop(__nsh_hv11, "class", "text-[12px]");
		bindProp(__nsh_hv11, "style", () => ({ color: colors.foreground }));
		insert(__nsh_hv11, () => props.options.find((option) => option.value === props.value)?.label ?? props.value);
		const __nsh_hv12 = element("text");
		prop(__nsh_hv12, "class", "text-[9px]");
		bindProp(__nsh_hv12, "style", () => ({ color: colors.muted }));
		insert(__nsh_hv12, expanded ? "▲" : "▼");
		append(__nsh_hv10, __nsh_hv11);
		append(__nsh_hv10, __nsh_hv12);
		return __nsh_hv10;
	})();
	if (props.disabled) return (() => {
		const __nsh_hv13 = element("view");
		prop(__nsh_hv13, "style", { width });
		insert(__nsh_hv13, trigger);
		return __nsh_hv13;
	})();
	return (() => {
		const __nsh_hv14 = element("view");
		prop(__nsh_hv14, "style", { width });
		insert(__nsh_hv14, component(Popover, {
			open: expanded,
			onOpenChange: (next) => openSelect.set(next ? props.id : null),
			placement: "bottom",
			align: "end",
			offset: 4,
			margin: 8,
			trigger,
			popupClass: "rounded-xl border p-1",
			get popupStyle() {
				return {
					width,
					backgroundColor: colors.card,
					borderColor: colors.border
				};
			},
			get children() {
				return (() => {
					const __nsh_hv15 = element("scroll");
					prop(__nsh_hv15, "accessibilityLabel", "Варианты выбора");
					bindProp(__nsh_hv15, "style", () => ({ height: Math.min(props.options.length * 30, 240) }));
					insert(__nsh_hv15, () => props.options.map((option) => (() => {
						const __nsh_hv16 = element("view");
						prop(__nsh_hv16, "onPress", () => {
							props.onSelect(option.value);
							openSelect.set(null);
						});
						prop(__nsh_hv16, "role", "option");
						bindProp(__nsh_hv16, "accessibilityState", () => ({ selected: option.value === props.value }));
						prop(__nsh_hv16, "class", "h-8 flex-row items-center gap-2 rounded-lg px-2");
						bindProp(__nsh_hv16, "hoverStyle", () => ({ backgroundColor: hoverWash(darkColors(colors)) }));
						prop(__nsh_hv16, "style", { cursor: "pointer" });
						const __nsh_hv17 = element("text");
						prop(__nsh_hv17, "class", "flex-1 text-[12px]");
						bindProp(__nsh_hv17, "style", () => ({ color: colors.foreground }));
						insert(__nsh_hv17, () => option.label);
						append(__nsh_hv16, __nsh_hv17);
						insert(__nsh_hv16, () => option.value === props.value ? (() => {
							const __nsh_hv18 = element("text");
							prop(__nsh_hv18, "class", "text-[12px]");
							bindProp(__nsh_hv18, "style", () => ({ color: colors.accent }));
							const __nsh_hv19 = text("✓");
							append(__nsh_hv18, __nsh_hv19);
							return __nsh_hv18;
						})() : null);
						return __nsh_hv16;
					})()));
					return __nsh_hv15;
				})();
			}
		}));
		return __nsh_hv14;
	})();
}
/** A key binding, drawn as the chip a user presses to rebind it. */
function KeyChip(props) {
	const colors = props.colors;
	const pressable = !!props.onPress;
	return (() => {
		const __nsh_hv20 = element("view");
		bindProp(__nsh_hv20, "onPress", () => pressable ? props.onPress : void 0);
		prop(__nsh_hv20, "role", pressable ? "button" : void 0);
		bindProp(__nsh_hv20, "accessibilityLabel", () => pressable ? props.accessibilityLabel : void 0);
		prop(__nsh_hv20, "class", "h-7 shrink-0 flex-row items-center justify-center rounded-md border");
		bindProp(__nsh_hv20, "hoverStyle", () => pressable ? { backgroundColor: hoverWash(darkColors(colors)) } : void 0);
		bindProp(__nsh_hv20, "style", () => ({
			paddingLeft: 9,
			paddingRight: 9,
			backgroundColor: colors.background,
			borderColor: colors.border,
			cursor: pressable ? "pointer" : "default"
		}));
		const __nsh_hv21 = element("text");
		prop(__nsh_hv21, "class", "text-[12px]");
		bindProp(__nsh_hv21, "style", () => ({ color: props.muted ? colors.muted : colors.accent }));
		insert(__nsh_hv21, () => props.label);
		append(__nsh_hv20, __nsh_hv21);
		return __nsh_hv20;
	})();
}

//#endregion
//#region AtlasAppearanceSettings.tsx
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
	if (!settings() || !appearance()) return (() => {
		const __nsh_hv0 = element("view");
		prop(__nsh_hv0, "class", "px-7 pt-4");
		const __nsh_hv1 = element("text");
		prop(__nsh_hv1, "class", "text-[13px]");
		bindProp(__nsh_hv1, "style", () => ({ color: colors().muted }));
		const __nsh_hv2 = text("Загружаем настройки внешнего вида…");
		append(__nsh_hv1, __nsh_hv2);
		append(__nsh_hv0, __nsh_hv1);
		return __nsh_hv0;
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
		const selected = current().mode === mode.value;
		return (() => {
			const __nsh_hv3 = element("view");
			prop(__nsh_hv3, "onPress", () => patch({ mode: mode.value }));
			prop(__nsh_hv3, "role", "button");
			bindProp(__nsh_hv3, "accessibilityLabel", () => mode.label);
			bindProp(__nsh_hv3, "accessibilityState", () => ({
				selected,
				disabled: !canEdit()
			}));
			prop(__nsh_hv3, "class", "min-w-0 flex-1");
			bindProp(__nsh_hv3, "hoverStyle", () => ({ opacity: canEdit() ? .85 : .65 }));
			bindProp(__nsh_hv3, "style", () => ({
				opacity: canEdit() ? 1 : .65,
				cursor: canEdit() ? "pointer" : "default"
			}));
			const __nsh_hv4 = element("view");
			prop(__nsh_hv4, "class", "items-center justify-center overflow-hidden rounded-lg border p-2.5");
			bindProp(__nsh_hv4, "style", () => ({
				height: 104,
				borderColor: selected ? colors().accent : palette().border,
				backgroundColor: palette().background
			}));
			const __nsh_hv5 = element("view");
			prop(__nsh_hv5, "class", "h-full w-full flex-row overflow-hidden rounded-md border");
			bindProp(__nsh_hv5, "style", () => ({
				borderColor: palette().border,
				backgroundColor: palette().card
			}));
			const __nsh_hv6 = element("view");
			prop(__nsh_hv6, "class", "w-1/3 gap-2 border-r p-2");
			bindProp(__nsh_hv6, "style", () => ({ borderColor: palette().border }));
			const __nsh_hv7 = element("view");
			prop(__nsh_hv7, "class", "h-2 rounded");
			bindProp(__nsh_hv7, "style", () => ({ backgroundColor: palette().accent }));
			const __nsh_hv8 = element("view");
			prop(__nsh_hv8, "class", "h-1.5 rounded");
			bindProp(__nsh_hv8, "style", () => ({ backgroundColor: palette().muted }));
			const __nsh_hv9 = element("view");
			prop(__nsh_hv9, "class", "h-1.5 rounded");
			bindProp(__nsh_hv9, "style", () => ({ backgroundColor: palette().border }));
			append(__nsh_hv6, __nsh_hv7);
			append(__nsh_hv6, __nsh_hv8);
			append(__nsh_hv6, __nsh_hv9);
			const __nsh_hv10 = element("view");
			prop(__nsh_hv10, "class", "flex-1 gap-2 p-2");
			const __nsh_hv11 = element("view");
			prop(__nsh_hv11, "class", "h-2 w-1/2 rounded");
			bindProp(__nsh_hv11, "style", () => ({ backgroundColor: palette().muted }));
			const __nsh_hv12 = element("view");
			prop(__nsh_hv12, "class", "h-6 rounded");
			bindProp(__nsh_hv12, "style", () => ({ backgroundColor: palette().background }));
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "class", "h-1.5 w-2/3 rounded");
			bindProp(__nsh_hv13, "style", () => ({ backgroundColor: palette().border }));
			append(__nsh_hv10, __nsh_hv11);
			append(__nsh_hv10, __nsh_hv12);
			append(__nsh_hv10, __nsh_hv13);
			append(__nsh_hv5, __nsh_hv6);
			append(__nsh_hv5, __nsh_hv10);
			append(__nsh_hv4, __nsh_hv5);
			const __nsh_hv14 = element("text");
			prop(__nsh_hv14, "class", "mt-1.5 text-center text-[12px]");
			bindProp(__nsh_hv14, "style", () => ({ color: selected ? colors().accent : colors().muted }));
			insert(__nsh_hv14, () => mode.label);
			append(__nsh_hv3, __nsh_hv4);
			append(__nsh_hv3, __nsh_hv14);
			return __nsh_hv3;
		})();
	};
	const swatch = (accent) => {
		const shown = () => colorScheme() === "dark" ? accent.dark : accent.light;
		const selected = () => {
			const stored = current().accent_color?.toLowerCase();
			return current().accent_source === "custom" ? stored === accent.light || stored === accent.dark || accent.legacy.includes(stored ?? "") : current().accent_source !== "wallpaper" && accent.key === "blue";
		};
		const label = () => colorScheme() === "dark" && accent.darkName ? accent.darkName : accent.name;
		return (() => {
			const __nsh_hv15 = element("view");
			prop(__nsh_hv15, "onPress", () => patch({
				accent_source: "custom",
				accent_color: accent.light
			}));
			prop(__nsh_hv15, "role", "button");
			bindProp(__nsh_hv15, "accessibilityLabel", () => `Акцент ${label()}`);
			bindProp(__nsh_hv15, "accessibilityState", () => ({
				selected: selected(),
				disabled: !canEdit()
			}));
			prop(__nsh_hv15, "class", "h-6 w-6 shrink-0 items-center justify-center rounded-full border");
			prop(__nsh_hv15, "hoverStyle", { opacity: .85 });
			bindProp(__nsh_hv15, "style", () => ({
				backgroundColor: shown(),
				borderColor: selected() ? accentMark(shown()) : "transparent",
				opacity: canEdit() ? 1 : .6,
				cursor: canEdit() ? "pointer" : "default"
			}));
			insert(__nsh_hv15, () => selected() ? (() => {
				const __nsh_hv16 = element("text");
				prop(__nsh_hv16, "class", "text-[11px]");
				bindProp(__nsh_hv16, "style", () => ({ color: accentMark(shown()) }));
				const __nsh_hv17 = text("✓");
				append(__nsh_hv16, __nsh_hv17);
				return __nsh_hv16;
			})() : null);
			return __nsh_hv15;
		})();
	};
	return (() => {
		const __nsh_hv18 = element("view");
		const __nsh_hv19 = element("view");
		prop(__nsh_hv19, "class", "mb-5 flex-row gap-3");
		insert(__nsh_hv19, () => modePreviews.map(modeCard));
		const __nsh_hv21 = element("view");
		prop(__nsh_hv21, "style", { height: 6 });
		append(__nsh_hv18, __nsh_hv19);
		append(__nsh_hv18, __nsh_hv21);
		insert(__nsh_hv18, component(SectionTitle, {
			get colors() {
				return colors();
			},
			get children() {
				return "Тема";
			}
		}), __nsh_hv19);
		insert(__nsh_hv18, [
			component(SettingsSection, {
				get colors() {
					return colors();
				},
				title: "Акцент",
				get children() {
					return [component(SettingsRow, {
						get colors() {
							return colors();
						},
						title: "Цвет акцента",
						description: "Палитра Atlas",
						first: true,
						get children() {
							return (() => {
								const __nsh_hv20 = element("view");
								prop(__nsh_hv20, "class", "flex-row flex-wrap items-center");
								prop(__nsh_hv20, "style", { gap: 6 });
								insert(__nsh_hv20, () => systemAccents.map(swatch));
								return __nsh_hv20;
							})();
						}
					}), () => appearance()?.capabilities.wallpaper_accent ? component(SettingsRow, {
						get colors() {
							return colors();
						},
						title: "Акцент с обоев",
						description: "Цвет берётся с фона рабочего стола",
						get children() {
							return component(Toggle, {
								get colors() {
									return colors();
								},
								label: "Акцент с обоев",
								get on() {
									return current().accent_source === "wallpaper";
								},
								get disabled() {
									return !canEdit();
								},
								onPress: () => patch(current().accent_source === "wallpaper" ? { accent_source: "system" } : { accent_source: "wallpaper" })
							});
						}
					}) : null];
				}
			}),
			component(SettingsSection, {
				get colors() {
					return colors();
				},
				title: "Размер текста",
				get children() {
					return [component(SettingsRow, {
						get colors() {
							return colors();
						},
						title: "Интерфейс",
						first: true,
						get children() {
							return SettingsSelect({
								id: "font-size",
								colors: colors(),
								label: "Выбрать размер текста",
								disabled: !canEdit(),
								width: 120,
								value: String(current().font_size),
								options: [.../* @__PURE__ */ new Set([...fontSizes, current().font_size])].sort((a, b) => a - b).map((size) => ({
									value: String(size),
									label: `${size} px`
								})),
								onSelect: (value) => patch({ font_size: Number(value) })
							});
						}
					}), () => [[
						"text",
						"Текст заметок и дневника",
						textSize
					], [
						"code",
						"Код в заметках",
						codeSize
					]].map(([kind, label, size]) => component(SettingsRow, {
						get colors() {
							return colors();
						},
						title: label,
						get children() {
							return SettingsSelect({
								id: `reading-${kind}`,
								colors: colors(),
								label,
								width: 120,
								value: String(size()),
								options: [
									12,
									14,
									16,
									18,
									20,
									22,
									24
								].map((px) => ({
									value: String(px),
									label: `${px} px`
								})),
								onSelect: (value) => setReadingSize(kind, Number(value))
							});
						}
					}))];
				}
			}),
			component(SettingsSection, {
				get colors() {
					return colors();
				},
				title: "Горячие клавиши",
				note: "Нажмите на сочетание, чтобы сменить его.",
				get children() {
					return [
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Боковая панель — открыть/скрыть",
							first: true,
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									get label() {
										return keymap.label(props.shortcuts.sidebar);
									},
									accessibilityLabel: "Изменить сочетание: Боковая панель — открыть/скрыть",
									onPress: () => props.onChangeShortcut("sidebar")
								});
							}
						}),
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Новая задача — панель справа",
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									get label() {
										return keymap.label(props.shortcuts.create);
									},
									accessibilityLabel: "Изменить сочетание: Новая задача — панель справа",
									onPress: () => props.onChangeShortcut("create")
								});
							}
						}),
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Быстрый поиск",
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									get label() {
										return keymap.label(props.shortcuts.search);
									},
									accessibilityLabel: "Изменить сочетание: Быстрый поиск",
									onPress: () => props.onChangeShortcut("search")
								});
							}
						}),
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Новая заметка",
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									get label() {
										return keymap.label("mod+t");
									},
									muted: true
								});
							}
						}),
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Следующая вкладка",
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									get label() {
										return keymap.label("ctrl+tab");
									},
									muted: true
								});
							}
						}),
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Закрыть вкладку",
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									get label() {
										return keymap.label("mod+w");
									},
									muted: true
								});
							}
						}),
						component(SettingsRow, {
							get colors() {
								return colors();
							},
							title: "Закрыть поиск",
							get children() {
								return component(KeyChip, {
									get colors() {
										return colors();
									},
									label: "Esc",
									muted: true
								});
							}
						})
					];
				}
			})
		], __nsh_hv21);
		return __nsh_hv18;
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
function readJson(raw, fallback) {
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
		const legacy = readJson(raw, []).filter(isGameCard);
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
					prop(__nsh_hv4, "onChange", (e) => gameLibrary.editPendingTitle(e.value));
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
		prop(__nsh_hv2, "onChange", (e) => imageSource.set(e.value));
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
					const __nsh_hv8 = text(" ·");
					append(__nsh_hv7, __nsh_hv8);
					insert(__nsh_hv7, genres, __nsh_hv8);
					insert(__nsh_hv7, [" ", () => props.card.releaseDateText || props.card.released || "дата выхода неизвестна"]);
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
const livePrograms = signal([]);
const searchQuery = signal("");
const fromDrop = signal(false);
const selectedGameId = signal(null);
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
		prop(__nsh_hv2, "onChange", (e) => searchQuery.set(e.value));
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
					prop(__nsh_hv8, "onPress", () => {
						selectedGameId.set(item.id);
						rememberRecent({
							kind: "game",
							id: item.id,
							title: item.title
						});
					});
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

//#endregion
//#region dev-settings.tsx
function DevelopersSection(props) {
	const colors = props.colors;
	return component(SettingsSection, {
		get colors() {
			return props.colors;
		},
		title: "Для разработчиков",
		note: "Проверка нагрузки на заметках",
		get children() {
			return [component(SettingsRow, {
				get colors() {
					return props.colors;
				},
				title: "Заметки",
				get description() {
					return props.size > 0 ? `Сейчас в библиотеке: ${props.size}` : "Библиотека пуста";
				},
				first: true,
				get children() {
					return (() => {
						const __nsh_hv0 = element("view");
						prop(__nsh_hv0, "class", "flex-row");
						prop(__nsh_hv0, "style", { gap: 8 });
						insert(__nsh_hv0, [
							component(DevButton, {
								colors,
								get dark() {
									return props.dark;
								},
								label: "10 000",
								onPress: () => props.onStress(1e4)
							}),
							component(DevButton, {
								colors,
								get dark() {
									return props.dark;
								},
								label: "100 000",
								onPress: () => props.onStress(1e5)
							}),
							component(DevButton, {
								colors,
								get dark() {
									return props.dark;
								},
								label: "Сбросить",
								get onPress() {
									return props.onReset;
								}
							})
						]);
						return __nsh_hv0;
					})();
				}
			}), component(SettingsRow, {
				get colors() {
					return props.colors;
				},
				title: "Как это работает",
				description: "Генератор живёт в демо-хранилище и заменяет библиотеку. Настоящие заметки он не трогает."
			})];
		}
	});
}
function DevButton(props) {
	return (() => {
		const __nsh_hv1 = element("view");
		bindProp(__nsh_hv1, "onPress", () => props.onPress);
		prop(__nsh_hv1, "role", "button");
		bindProp(__nsh_hv1, "accessibilityLabel", () => props.label);
		prop(__nsh_hv1, "class", "flex-row items-center justify-center");
		bindProp(__nsh_hv1, "hoverStyle", () => ({ backgroundColor: surfaceWash(props.dark, .09) }));
		bindProp(__nsh_hv1, "style", () => ({
			height: 28,
			paddingLeft: 10,
			paddingRight: 10,
			gap: 6,
			borderRadius: 9,
			borderWidth: 1,
			borderColor: props.colors.border,
			backgroundColor: props.colors.card,
			cursor: "pointer"
		}));
		const __nsh_hv2 = element("text");
		prop(__nsh_hv2, "class", "text-[12px]");
		bindProp(__nsh_hv2, "style", () => ({ color: props.colors.foreground }));
		insert(__nsh_hv2, () => props.label);
		append(__nsh_hv1, __nsh_hv2);
		return __nsh_hv1;
	})();
}

//#endregion
//#region benchmark-load.ts
function within(list, window) {
	return (list ?? []).filter((sample) => sample.at >= window.start && sample.at < window.end);
}
function peak(values) {
	const known = values.filter((value) => typeof value === "number");
	return known.length ? Math.max(...known) : null;
}
function lowest(values) {
	const known = values.filter((value) => typeof value === "number");
	return known.length ? Math.min(...known) : null;
}
function mean(values) {
	const known = values.filter((value) => typeof value === "number");
	return known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : null;
}
const gpuUtilization = (sample) => sample.gpuEngines.reduce((sum, engine) => sum + (engine.utilizationPercent ?? 0), 0);
const gpuMemory = (sample) => sample.gpuMemory.reduce((sum, entry) => sum + (entry.dedicatedBytes ?? 0), 0);
function stageLoad(resources, window) {
	const process = within(resources.samples, window);
	const io = within(resources.processIoSamples, window);
	return {
		samples: process.length,
		cpuPeakPercentOfMachine: peak(process.map((sample) => sample.cpuPercentOfMachine)),
		cpuMeanPercentOfMachine: mean(process.map((sample) => sample.cpuPercentOfMachine)),
		residentPeakBytes: peak(process.map((sample) => sample.residentBytes)),
		residentMeanBytes: mean(process.map((sample) => sample.residentBytes)),
		privatePeakBytes: peak(process.map((sample) => sample.privateBytes)),
		threadsPeak: peak(process.map((sample) => sample.threadCount)),
		handlesPeak: peak(process.map((sample) => sample.handleCount)),
		ioReadPeakBytesPerSecond: peak(io.map((sample) => sample.readBytesPerSecond)),
		ioWritePeakBytesPerSecond: peak(io.map((sample) => sample.writeBytesPerSecond))
	};
}
function runProbes(resources, window) {
	const system = within(resources.systemSamples, window);
	return {
		samples: system.length,
		gpuCountersAvailable: system.some((sample) => sample.gpuCountersAvailable),
		gpuUtilizationPeakPercent: peak(system.map(gpuUtilization)),
		gpuMemoryDedicatedPeakBytes: peak(system.map(gpuMemory)),
		systemCpuPeakPercent: peak(system.map((sample) => sample.systemCpuPercent)),
		systemFreeRamMinBytes: lowest(system.map((sample) => sample.systemFreeRamBytes)),
		diskBusyPeakPercent: peak(system.map((sample) => sample.diskBusyPercent)),
		diskReadPeakBytesPerSecond: peak(system.map((sample) => sample.diskReadBytesPerSecond)),
		diskWritePeakBytesPerSecond: peak(system.map((sample) => sample.diskWriteBytesPerSecond))
	};
}
function formatBytes(bytes) {
	if (bytes === null) return "—";
	const megabytes = bytes / 1048576;
	if (megabytes < 1) return `${Math.round(bytes / 1024)} КБ`;
	if (megabytes < 1024) return `${Math.round(megabytes)} МБ`;
	return `${(megabytes / 1024).toFixed(1)} ГБ`;
}
function formatPercent(value) {
	if (value === null) return "—";
	return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`;
}

//#endregion
//#region developer-page.tsx
const benchmarkRunning = signal(false);
const report = signal("");
const summary = signal("");
let hardwareReply;
let framesReply;
let readyReply;
let activeRun = 0;
const events = {
	ready: null,
	hardware: null,
	frames: null
};
function benchmarkHardware(event) {
	if (event.runId !== activeRun) return;
	events.hardware = Date.now();
	readyReply?.();
	hardwareReply?.(event.data);
}
function benchmarkReady(event) {
	if (event.runId !== activeRun) return;
	events.ready = Date.now();
	readyReply?.();
}
function benchmarkFrames(event) {
	if (event.runId !== activeRun) return;
	events.frames = Date.now();
	framesReply?.(event.data);
}
function frame() {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(/* @__PURE__ */ new Error("No animation frame")), 3e3);
		requestAnimationFrame((time) => {
			clearTimeout(timeout);
			resolve(time);
		});
	});
}
async function withDeadline(promise, milliseconds, fallback) {
	let timer;
	try {
		return await Promise.race([promise, new Promise((resolve) => {
			timer = setTimeout(() => resolve(fallback), milliseconds);
		})]);
	} finally {
		if (timer !== void 0) clearTimeout(timer);
	}
}
async function runBenchmark(options) {
	if (benchmarkRunning()) return;
	benchmarkRunning.set(true);
	report.set("");
	summary.set("");
	const runId = ++activeRun;
	events.ready = null;
	events.hardware = null;
	events.frames = null;
	const ready = new Promise((resolve) => {
		readyReply = resolve;
	});
	let startedAt = Date.now();
	let native = false;
	const hardware = new Promise((resolve) => {
		hardwareReply = resolve;
		native = options.sample(runId);
		if (!native) resolve({ unavailable: "native host unavailable" });
	});
	const stages = [];
	try {
		if (native) {
			await withDeadline(ready, 8e3, void 0);
			options.beginFrames();
		}
		startedAt = Date.now();
		for (const round of [1, 2]) for (const route of [
			"journal",
			"notes",
			"tasks",
			"games",
			"settings"
		]) {
			const start = Date.now();
			options.visit(route);
			const first = await frame();
			const firstFrameCallbackMs = Date.now() - start;
			const frameIntervalsMs = [];
			let last = first;
			while (last - first < 350) {
				const next = await frame();
				frameIntervalsMs.push(next - last);
				last = next;
			}
			stages.push({
				route,
				round,
				startedAt: start,
				firstFrameCallbackMs,
				frameIntervalsMs,
				callbackFps: frameIntervalsMs.length * 1e3 / (last - first)
			});
		}
		for (const count of [1e4, 1e5]) {
			options.visit("settings");
			await frame();
			const start = Date.now();
			options.fixture(count);
			const generatedMs = Date.now() - start;
			options.visit("notes");
			const layoutStart = Date.now();
			await frame();
			const firstFrameCallbackMs = Date.now() - layoutStart;
			const scrollJumps = [];
			for (const fraction of [
				.25,
				.5,
				.95,
				0
			]) {
				const start = Date.now();
				if (jumpBenchmarkLibrary(fraction)) {
					await frame();
					scrollJumps.push({
						fraction,
						frameCallbackMs: Date.now() - start
					});
				}
			}
			stages.push({
				route: "notes",
				syntheticNotes: count,
				startedAt: start,
				generatedMs,
				firstFrameCallbackMs,
				scrollJumps
			});
		}
		const endedAt = Date.now();
		const frames = new Promise((resolve) => {
			framesReply = resolve;
			if (native) options.frames(runId);
			else resolve({ unavailable: "native host unavailable" });
		});
		options.visit("developers");
		const [samples, presentedFrames] = await Promise.all([withDeadline(hardware, 3e4, { unavailable: "sampler timed out" }), withDeadline(frames, 8e3, { unavailable: "frame profiler timed out" })]);
		const resources = samples;
		const load = !!resources.samples?.length ? {
			baseline: stageLoad(resources, {
				start: resources.samples[0].at,
				end: stages[0]?.startedAt ?? endedAt
			}),
			run: runProbes(resources, {
				start: resources.samples[0].at,
				end: endedAt
			}),
			cadenceMilliseconds: resources.cadenceMilliseconds ?? null,
			peaks: {
				cpuPercentOfMachine: Math.max(...stages.map((stage) => stage.load?.cpuPeakPercentOfMachine ?? 0)),
				residentBytes: Math.max(...stages.map((stage) => stage.load?.residentPeakBytes ?? 0))
			}
		} : null;
		if (load) {
			stages.forEach((stage, index) => {
				const end = stages[index + 1]?.startedAt ?? endedAt;
				stage.load = stageLoad(resources, {
					start: stage.startedAt,
					end
				});
			});
			load.peaks.cpuPercentOfMachine = Math.max(...stages.map((stage) => stage.load?.cpuPeakPercentOfMachine ?? 0));
			load.peaks.residentBytes = Math.max(...stages.map((stage) => stage.load?.residentPeakBytes ?? 0));
		}
		report.set(JSON.stringify({
			schema: 2,
			atlasVersion: options.version,
			startedAt,
			endedAt,
			timing: "Stage timings use animation callbacks. Presented frames are reported separately by GPUI. Resource timestamps are Unix milliseconds: CPU and memory come from 100 ms process samples (per stage), GPU, disk and free RAM from 3 s CIM probes (run-level; nativeMeasurements.resources.cadenceMilliseconds).",
			stages,
			load,
			nativeMeasurements: {
				resources,
				presentedFrames,
				events: { ...events }
			}
		}, null, 2));
		const seconds = ((endedAt - startedAt) / 1e3).toFixed(1);
		const lost = resources.unavailable ?? "нет сэмплов";
		summary.set(load ? `${stages.length} этапов · ${seconds} с · CPU до ${formatPercent(load.peaks.cpuPercentOfMachine)} · RAM до ${formatBytes(load.peaks.residentBytes)}` : `${stages.length} этапов · ${seconds} с · нагрузку не измерили: ${lost}`);
	} catch (error) {
		report.set(JSON.stringify({
			startedAt,
			stages,
			error: String(error)
		}, null, 2));
	} finally {
		hardwareReply = void 0;
		framesReply = void 0;
		readyReply = void 0;
		options.fixture(0);
		options.visit("developers");
		benchmarkRunning.set(false);
	}
}
const supported = [
	{
		title: "Дневник",
		icon: "journal",
		status: "Готово",
		operation: "objects.list",
		params: { typeId: "com.mundus.atlas.journal" },
		example: [{
			id: "example",
			typeId: "com.mundus.atlas.journal"
		}]
	},
	{
		title: "Заметки",
		icon: "note",
		status: "Готово",
		operation: "objects.list",
		params: { typeId: "core.note" },
		example: [{
			id: "example",
			typeId: "core.note",
			title: "Заметка"
		}]
	},
	{
		title: "Задачи",
		icon: "check",
		status: "В разработке",
		operation: "objects.list",
		params: { typeId: "com.mundus.atlas.task" },
		example: [{
			id: "example",
			typeId: "com.mundus.atlas.task",
			title: "Задача"
		}]
	},
	{
		title: "Игры",
		icon: "gamepad",
		status: "В разработке",
		operation: "canonical.game.list",
		params: {},
		example: []
	}
];
function DevelopersPage(props) {
	const expanded = signal("");
	return (() => {
		const __nsh_hv0 = element("view");
		insert(__nsh_hv0, [
			component(SettingsSection, {
				get colors() {
					return props.colors;
				},
				title: "Производительность",
				get children() {
					return [component(SettingsRow, {
						get colors() {
							return props.colors;
						},
						first: true,
						get title() {
							return benchmarkRunning() ? "Проверка идёт…" : "Запустить полный тест";
						},
						description: "Переходы между разделами и открытие библиотек из 10 000 и 100 000 тестовых заметок",
						get onPress() {
							return props.run;
						}
					}), () => Boolean(report()) && component(SettingsRow, {
						get colors() {
							return props.colors;
						},
						title: "Скопировать отчёт JSON",
						get description() {
							return summary();
						},
						onPress: () => void Clipboard.writeText(report())
					})];
				}
			}),
			() => props.demo && component(DevelopersSection, {
				get colors() {
					return props.colors;
				},
				get dark() {
					return props.dark;
				},
				get size() {
					return props.size;
				},
				get onStress() {
					return props.stress;
				},
				get onReset() {
					return props.reset;
				}
			}),
			component(SettingsSection, {
				get colors() {
					return props.colors;
				},
				title: "Поддерживаемые типы",
				get children() {
					return supported.map((item, index) => component(SettingsRow, {
						get colors() {
							return props.colors;
						},
						get title() {
							return item.title;
						},
						first: index === 0,
						get leading() {
							return component(Glyph, {
								get name() {
									return item.icon;
								},
								size: 16,
								get color() {
									return props.colors.muted;
								}
							});
						},
						get description() {
							return expanded() === item.title ? `${item.operation} ${JSON.stringify(item.params)}\nПример результата: ${JSON.stringify(item.example)}` : void 0;
						},
						onPress: () => expanded.set(expanded() === item.title ? "" : item.title),
						get children() {
							return (() => {
								const __nsh_hv1 = element("text");
								prop(__nsh_hv1, "class", "rounded-md border px-2 py-1 text-[12px]");
								bindProp(__nsh_hv1, "style", () => ({
									color: props.colors.muted,
									borderColor: props.colors.border
								}));
								insert(__nsh_hv1, () => item.status);
								return __nsh_hv1;
							})();
						}
					}));
				}
			})
		]);
		return __nsh_hv0;
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
//#region shell-theme.ts
let applied = "";
function applyShellTheme(theme) {
	if (!theme || typeof theme !== "object") return;
	if (typeof setTheme !== "function") return;
	const json = JSON.stringify(theme);
	if (json === applied) return;
	applied = json;
	setTheme(theme);
}

//#endregion
//#region quick-search.tsx
function QuickSearch(props) {
	const query = signal("");
	const preview = signal(null);
	const results = () => {
		const needle = query().trim().toLocaleLowerCase();
		if (!needle) return [];
		const found = [];
		for (const note of props.notes) {
			const label = noteLabel(note.title);
			if (`${label} ${note.text}`.toLocaleLowerCase().includes(needle)) found.push({
				label,
				kind: "Заметка",
				select: () => props.onNote(String(note.id))
			});
			if (found.length === 20) break;
		}
		let count = 0;
		for (const entry of props.journal) {
			if (!entry.text.toLocaleLowerCase().includes(needle)) continue;
			found.push({
				label: entry.text.slice(0, 100),
				kind: "Дневник",
				select: () => preview.set(entry)
			});
			if (++count === 10) break;
		}
		return found;
	};
	return component(Modal, {
		title: "Быстрый поиск",
		get colors() {
			return props.colors;
		},
		get onDismiss() {
			return props.onDismiss;
		},
		get onBack() {
			return preview() ? () => preview.set(null) : void 0;
		},
		get children() {
			return preview() ? (() => {
				const __nsh_hv0 = element("view");
				prop(__nsh_hv0, "class", "gap-3 px-5 pb-5");
				const __nsh_hv1 = element("scroll");
				prop(__nsh_hv1, "style", { maxHeight: 250 });
				const __nsh_hv2 = element("text");
				prop(__nsh_hv2, "class", "select-text");
				bindProp(__nsh_hv2, "style", () => ({ color: props.colors.foreground }));
				insert(__nsh_hv2, () => preview()?.text);
				append(__nsh_hv1, __nsh_hv2);
				append(__nsh_hv0, __nsh_hv1);
				insert(__nsh_hv0, component(ModalGhost, {
					get colors() {
						return props.colors;
					},
					label: "Открыть дневник",
					get onPress() {
						return props.onJournal;
					}
				}));
				return __nsh_hv0;
			})() : (() => {
				const __nsh_hv3 = element("view");
				prop(__nsh_hv3, "class", "gap-2 px-5 pb-5");
				const __nsh_hv4 = element("input");
				prop(__nsh_hv4, "autoFocus", true);
				bindProp(__nsh_hv4, "value", () => query());
				prop(__nsh_hv4, "accessibilityLabel", "Поисковый запрос");
				prop(__nsh_hv4, "placeholder", "Заметки и дневник");
				prop(__nsh_hv4, "onChange", (event) => query.set(event.value));
				prop(__nsh_hv4, "onSubmit", () => results()[0]?.select());
				append(__nsh_hv3, __nsh_hv4);
				insert(__nsh_hv3, () => !!query().trim() && (() => {
					const __nsh_hv5 = element("scroll");
					prop(__nsh_hv5, "style", { maxHeight: 300 });
					insert(__nsh_hv5, [() => results().length === 0 && (() => {
						const __nsh_hv6 = element("text");
						bindProp(__nsh_hv6, "style", () => ({ color: props.colors.muted }));
						const __nsh_hv7 = text("Ничего не найдено");
						append(__nsh_hv6, __nsh_hv7);
						return __nsh_hv6;
					})(), () => results().map((result) => (() => {
						const __nsh_hv8 = element("view");
						prop(__nsh_hv8, "class", "gap-1 rounded-md px-3 py-2");
						prop(__nsh_hv8, "role", "button");
						bindProp(__nsh_hv8, "onPress", () => result.select);
						bindProp(__nsh_hv8, "hoverStyle", () => ({ backgroundColor: props.colors.background }));
						const __nsh_hv9 = element("text");
						bindProp(__nsh_hv9, "style", () => ({ color: props.colors.foreground }));
						insert(__nsh_hv9, () => result.label);
						const __nsh_hv10 = element("text");
						prop(__nsh_hv10, "class", "text-[11px]");
						bindProp(__nsh_hv10, "style", () => ({ color: props.colors.muted }));
						insert(__nsh_hv10, () => result.kind);
						append(__nsh_hv8, __nsh_hv9);
						append(__nsh_hv8, __nsh_hv10);
						return __nsh_hv8;
					})())]);
					return __nsh_hv5;
				})());
				return __nsh_hv3;
			})();
		}
	});
}

//#endregion
//#region App.tsx
setup(null, "{\n  \"cssVars\": {\n    \"theme\": {\n      \"font-sans\": \"Inter\",\n      \"font-mono\": \"Geist Mono\",\n      \"radius\": \"0.75rem\",\n      \"radius-control\": \"0.5rem\"\n    },\n    \"light\": {\n      \"background\": \"#f7f8fa\",\n      \"foreground\": \"#111820\",\n      \"card\": \"#ffffff\",\n      \"card-foreground\": \"#111820\",\n      \"popover\": \"#ffffff\",\n      \"popover-foreground\": \"#111820\",\n      \"primary\": \"#1f6df5\",\n      \"primary-foreground\": \"#ffffff\",\n      \"secondary\": \"#eef1f6\",\n      \"secondary-foreground\": \"#111820\",\n      \"muted\": \"#eef1f6\",\n      \"muted-foreground\": \"#5f6a7a\",\n      \"accent\": \"#a8c5fb\",\n      \"accent-foreground\": \"#111820\",\n      \"destructive\": \"#d5373c\",\n      \"border\": \"#dde2ea\",\n      \"input\": \"#dde2ea\",\n      \"ring\": \"#1f6df5\",\n      \"selection\": \"#1f6df538\",\n      \"sidebar\": \"#eff1f5\",\n      \"sidebar-foreground\": \"#111820\",\n      \"sidebar-border\": \"#dde2ea\"\n    },\n    \"dark\": {\n      \"background\": \"#090c15\",\n      \"foreground\": \"#ffffff\",\n      \"card\": \"#101318\",\n      \"card-foreground\": \"#ffffff\",\n      \"popover\": \"#181c25\",\n      \"popover-foreground\": \"#ffffff\",\n      \"primary\": \"#1784fc\",\n      \"primary-foreground\": \"#101318\",\n      \"secondary\": \"#181c25\",\n      \"secondary-foreground\": \"#ffffff\",\n      \"muted\": \"#181c25\",\n      \"muted-foreground\": \"#717580\",\n      \"accent\": \"#104888\",\n      \"accent-foreground\": \"#ffffff\",\n      \"destructive\": \"#e67b71\",\n      \"border\": \"#1e222b\",\n      \"input\": \"#1e222b\",\n      \"ring\": \"#1784fc\",\n      \"selection\": \"#1784fc38\",\n      \"sidebar\": \"#0d1019\",\n      \"sidebar-foreground\": \"#ffffff\",\n      \"sidebar-border\": \"#1e222b\"\n    }\n  }\n}\n", null, null);
const initialValue = Reflect.get(globalThis, "__MUNDUS_ATLAS_INITIAL__") ?? host.params.atlas;
const hosted = isSnapshot(initialValue);
const initial = hosted ? initialValue : fallback;
const snapshot = signal(initial);
const appearanceKey = "mundus.atlas.appearance.v1";
const appearanceDefaults = fallback.appearance;
const inheritedAppearance = initial.appearance?.settings ?? appearanceDefaults.settings;
const localAppearance = signal({
	...appearanceDefaults,
	settings: {
		...appearanceDefaults.settings,
		mode: inheritedAppearance.mode,
		accent_source: inheritedAppearance.accent_source === "custom" ? "custom" : "theme",
		accent_color: inheritedAppearance.accent_color,
		font_size: inheritedAppearance.font_size
	}
});
let localAppearanceEdited = false;
let importAppearancePending = false;
let importAppearanceTimer;
function finishAppearanceImport(legacy) {
	if (!importAppearancePending) return;
	importAppearancePending = false;
	if (importAppearanceTimer !== void 0) clearTimeout(importAppearanceTimer);
	if (localAppearanceEdited) return;
	const current = localAppearance();
	const old = legacy?.settings;
	if (old) localAppearance.set({
		...current,
		settings: {
			...current.settings,
			mode: old.mode,
			accent_source: old.accent_source === "custom" ? "custom" : "theme",
			accent_color: old.accent_color,
			font_size: old.font_size
		}
	});
	Storage.setItem(appearanceKey, JSON.stringify(localAppearance().settings));
}
function requestAppearanceImport() {
	if (!importAppearancePending || !commandRef || importAppearanceTimer !== void 0) return;
	importAppearanceTimer = setTimeout(() => finishAppearanceImport(), 2e3);
	askEngine("appearance.import");
}
Storage.getItem(appearanceKey).then((value) => {
	if (localAppearanceEdited) return;
	if (value) try {
		const settings = JSON.parse(value);
		if ([
			"light",
			"dark",
			"system"
		].includes(settings.mode)) {
			localAppearance.set({
				...appearanceDefaults,
				settings: {
					...localAppearance().settings,
					...settings
				}
			});
			return;
		}
	} catch {}
	importAppearancePending = true;
	if (hosted) requestAppearanceImport();
	else finishAppearanceImport();
});
function localColors(appearance) {
	const settings = appearance.settings;
	return resolveAppearanceColors({
		...appearance,
		settings: {
			...settings,
			mode: settings.mode === "system" ? colorScheme() : settings.mode
		}
	}, previewThemes, fallback.colors);
}
effect(() => {
	const mode = localAppearance().settings.mode;
	setColorScheme(mode === "light" || mode === "dark" ? mode : "system");
});
effect(() => {
	const appearance = localAppearance();
	interfaceSize.set(appearance.settings.font_size);
	const colors = localColors(appearance);
	untracked(() => snapshot.set({
		...snapshot(),
		appearance,
		appearanceEditable: true,
		colors
	}));
});
const benchmarkNotes = signal(null);
const route = signal(initial.route);
let startNoteOpened = false;
let routeReady = false;
const addTaskOpen = signal(false);
const searchOpen = signal(false);
effect(() => {
	if (searchOpen()) return keymap.bind("escape", () => searchOpen.set(false), { overFocused: true });
});
const newTaskTitle = signal("");
const sidebarVisible = signal(true);
const voiceRecording = signal(false);
const voiceLevel = signal(0);
const voiceElapsed = signal(0);
const voicePlaying = signal(null);
let voiceStartedAt = 0;
const pickedExes = signal([]);
const pickSource = signal("manual");
const pageNavigation = navigation_default.filter((item) => !item.footer);
loadRecent();
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
		"notes",
		"notesCreated",
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
		"metadata",
		"benchmark",
		"benchmarkFrames",
		"benchmarkReady",
		"appearanceImported"
	]
});
function iconForNavigation(id) {
	switch (id) {
		case "journal": return "journal";
		case "notes": return "note";
		case "tasks": return "check";
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
		insert(__nsh_hv1, () => todo().is_completed && component(Glyph, {
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
effect(() => {
	const settings = localAppearance().settings;
	askEngine("appearance.set", settings);
});
function setAppearance(patch) {
	localAppearanceEdited = true;
	const appearance = localAppearance();
	const settings = {
		...appearance.settings,
		...patch
	};
	localAppearance.set({
		...appearance,
		settings
	});
	Storage.setItem(appearanceKey, JSON.stringify(settings));
}
function TaskPage() {
	return (() => {
		const __nsh_hv3 = element("scroll");
		prop(__nsh_hv3, "class", "min-h-0 flex-1 px-7 pb-5");
		bindProp(__nsh_hv3, "style", () => ({ paddingTop: snapshot().chrome === "tsx" ? 0 : 48 }));
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
		keymap.bind(active.reload, () => commandRef?.("reload"), { when: "notEditing" }),
		keymap.bind(active.search, () => searchOpen.set(true), { overFocused: true }),
		keymap.bind("mod+t", () => {
			route.set("notes");
			createOpenNote();
		}, { repeat: false })
	];
	return () => unbind.forEach((remove) => remove());
});
function SettingsPage() {
	return component(SettingsPage$1, {
		get colors() {
			return snapshot().colors;
		},
		get children() {
			return [(() => {
				const __nsh_hv8 = element("text");
				prop(__nsh_hv8, "class", "mb-6 text-[22px] font-semibold");
				bindProp(__nsh_hv8, "style", () => ({ color: snapshot().colors.foreground }));
				const __nsh_hv9 = text("Настройки");
				append(__nsh_hv8, __nsh_hv9);
				return __nsh_hv8;
			})(), component(AtlasAppearanceSettings, {
				appearance: () => snapshot().appearance,
				editable: () => snapshot().appearanceEditable,
				colors: () => snapshot().colors,
				get shortcuts() {
					return shortcuts();
				},
				onPatch: setAppearance,
				onChangeShortcut: cycleShortcut
			})];
		}
	});
}
function App() {
	effect(() => applyShellTheme(snapshot().nshTheme));
	effect(() => windows()[0]?.set({ titleBar: {
		style: "hidden",
		height: 48
	} }));
	const footerNavigation = navigation_default.filter((item) => item.footer);
	const openNewTask = () => {
		newTaskTitle.set("");
		addTaskOpen.set(true);
	};
	const pageLeft = signal(0);
	const pageWidth = signal(0);
	const shell = snapshot().chrome === "tsx";
	const dark = () => (localAppearance().settings.mode === "system" ? colorScheme() : localAppearance().settings.mode) === "dark";
	const pageSlideX = createAnimatedValue(0);
	const pageSlideY = createAnimatedValue(0);
	const sliding = signal(false);
	let slidFromSidebar = false;
	const slidePage = (dir, axis = "x") => {
		const vertical = axis === "y";
		pageSlideX.set(vertical ? 0 : dir * 34);
		pageSlideY.set(vertical ? dir * 34 : 0);
		sliding.set(true);
		Animated.timing(vertical ? pageSlideY : pageSlideX, {
			toValue: 0,
			duration: 200,
			easing: Easing.out(Easing.cubic)
		}).start().then(() => sliding.set(false));
	};
	const pageTab = (target) => ({
		key: `page:${target}`,
		route: target
	});
	const pageLabel = (target) => navigation_default.find((item) => item.id === target)?.label ?? target;
	const tabs = signal([{
		...pageTab(route()),
		label: pageLabel(route()),
		active: true
	}]);
	const activeTabKey = signal(`page:${route()}`);
	const destination = () => ({
		route: route(),
		noteId: route() === "notes" ? openNoteId() : null
	});
	const sameDestination = (left, right) => left.route === right.route && left.noteId === right.noteId;
	const history = signal({
		entries: [destination()],
		index: 0
	});
	effect(() => {
		const next = destination();
		untracked(() => {
			if (benchmarkRunning()) return;
			const { entries, index } = history();
			if (sameDestination(entries[index], next)) return;
			const kept = [...entries.slice(0, index + 1), next].slice(-40);
			history.set({
				entries: kept,
				index: kept.length - 1
			});
		});
	});
	const historyTarget = (step) => {
		const { entries, index } = history();
		for (let at = index + step; at >= 0 && at < entries.length; at += step) {
			const target = entries[at];
			if (sameDestination(entries[index], target) || target.noteId && !notes().some((note) => String(note.id) === target.noteId)) continue;
			return at;
		}
		return -1;
	};
	const walkHistory = (step) => batch(() => {
		const index = historyTarget(step);
		if (index < 0) return;
		const { entries } = history();
		const target = entries[index];
		history.set({
			entries,
			index
		});
		if (target.noteId) {
			route.set("notes");
			openNoteById(target.noteId);
		} else openPageTab(target.route);
	});
	const noteTabLabel = (tab) => {
		if (tab.noteId === openNoteId()) return noteLabel(openNoteTitle());
		const note = notes().find((item) => String(item.id) === tab.noteId);
		return noteLabel(note?.title);
	};
	const tabViews = () => tabs().map((tab) => ({
		...tab,
		active: tab.key === activeTabKey(),
		label: tab.noteId ? noteTabLabel(tab) : pageLabel(tab.route)
	}));
	const activateTab = (key) => batch(() => {
		const list = tabs();
		const to = list.findIndex((item) => item.key === key);
		if (to < 0) return;
		const tab = list[to];
		const from = list.findIndex((item) => item.key === activeTabKey());
		const slidByRow = slidFromSidebar;
		slidFromSidebar = false;
		if (from >= 0 && from !== to && !slidByRow) slidePage(slideDirection(from, to));
		activeTabKey.set(key);
		if (tab.route !== route()) route.set(tab.route);
		if (openNoteId() === (tab.noteId ?? null)) return;
		if (tab.noteId) openNoteById(tab.noteId);
		else closeOpenNote();
	});
	const openPageTab = (target) => {
		if (!isRoute(target)) return;
		const key = `page:${target}`;
		if (!tabs().some((tab) => tab.key === key)) {
			animateTabs();
			tabs.set([...tabs(), {
				...pageTab(target),
				label: pageLabel(target),
				active: false
			}]);
		}
		activateTab(key);
	};
	const closeTab = (key) => {
		const list = tabs();
		if (list.length < 2) return;
		const at = list.findIndex((tab) => tab.key === key);
		if (at < 0) return;
		const rest = list.filter((tab) => tab.key !== key);
		animateTabs();
		if (activeTabKey() === key) {
			const next = rest[Math.min(at, rest.length - 1)];
			activateTab(next.key);
		}
		tabs.set(rest);
	};
	const tabMenu = (key, at) => {
		const tab = tabs().find((item) => item.key === key);
		if (!tab) return;
		const note = tab.noteId;
		Menu.popup([
			...note ? [{
				label: "Переименовать",
				onSelect: () => {
					activateTab(key);
					requestNoteTitleFocus();
				}
			}] : [],
			{
				label: "Закрыть",
				onSelect: () => closeTab(key)
			},
			...tabs().length > 1 ? [{
				label: "Закрыть остальные",
				onSelect: () => closeOtherTabs(key)
			}] : [],
			...note ? [{
				label: "Удалить заметку",
				onSelect: () => {
					activateTab(key);
					removeOpenNote();
					closeTab(key);
				}
			}] : []
		], at);
	};
	const closeOtherTabs = (keep) => {
		if (tabs().filter((tab) => tab.key !== keep).length === 0) return;
		animateTabs();
		tabs.set(tabs().filter((tab) => tab.key === keep));
		activateTab(keep);
	};
	const cycleTab = (step) => {
		const list = tabs();
		if (list.length < 2) return;
		const next = list[((list.findIndex((tab) => tab.key === activeTabKey()) + step) % list.length + list.length) % list.length];
		if (next) activateTab(next.key);
	};
	effect(() => keymap.bind({
		"ctrl+tab": () => cycleTab(1),
		"ctrl+shift+tab": () => cycleTab(-1)
	}, { overFocused: true }), keymap.bind("mod+w", () => closeTab(activeTabKey()), { repeat: false }));
	effect(() => {
		const id = openNoteId();
		untracked(() => {
			if (!id) {
				if (activeTabKey().startsWith("note:")) openPageTab("notes");
				return;
			}
			const key = `note:${id}`;
			if (activeTabKey() === key) return;
			const list = tabs();
			if (!list.some((tab) => tab.key === key)) {
				animateTabs();
				const at = list.findIndex((tab) => tab.key === activeTabKey());
				const tab = {
					key,
					route: "notes",
					noteId: id,
					label: noteLabel(openNoteTitle()),
					active: true
				};
				tabs.set([
					...list.slice(0, at + 1),
					tab,
					...list.slice(at + 1)
				]);
			}
			activeTabKey.set(key);
		});
	});
	const changeRoute = (target) => {
		if (!isRoute(target)) return;
		openPageTab(target);
	};
	const selectSidebarPage = (target) => {
		const rows = navigation_default.map((item) => item.id);
		const fromRow = rows.indexOf(route());
		const toRow = rows.indexOf(target);
		if (fromRow >= 0 && toRow >= 0 && fromRow !== toRow) {
			slidFromSidebar = true;
			slidePage(slideDirection(fromRow, toRow), "y");
		}
		if (target === "notes") {
			if (hasOpenNote()) closeOpenNote();
			openPageTab("notes");
			return;
		}
		changeRoute(target);
	};
	const activeRecentNote = () => {
		if (route() !== "notes") return false;
		const id = openNoteId();
		return id !== null && recent().some((entry) => entry.kind === "note" && entry.id === id);
	};
	const openRecentEntry = (entry) => {
		if (entry.kind !== "note") return;
		batch(() => {
			openNoteById(entry.id);
			if (openNoteId() === entry.id) route.set("notes");
		});
	};
	return (() => {
		const __nsh_hv10 = element("view");
		prop(__nsh_hv10, "class", "relative h-full w-full");
		prop(__nsh_hv10, "onMouseUp", (event) => {
			if (event.button === "back") walkHistory(-1);
			if (event.button === "forward") walkHistory(1);
		});
		bindProp(__nsh_hv10, "style", () => ({ backgroundColor: shell ? shellFill(snapshot().colors, dark()) : snapshot().colors.background }));
		const __nsh_hv11 = element("view");
		prop(__nsh_hv11, "class", "h-full w-full flex-row");
		const __nsh_hv21 = element("view");
		prop(__nsh_hv21, "class", "relative min-h-0 min-w-0 flex-1");
		prop(__nsh_hv21, "onLayout", (event) => {
			pageLeft.set(event.bounds.origin.x);
			pageWidth.set(event.bounds.size.width);
		});
		bindProp(__nsh_hv21, "style", () => ({ ...shell ? {
			marginLeft: 8,
			marginRight: 8,
			marginTop: 48,
			marginBottom: 8,
			borderRadius: 14,
			borderWidth: 1,
			borderColor: snapshot().colors.border,
			backgroundColor: snapshot().colors.background,
			overflow: "hidden"
		} : {} }));
		const __nsh_hv22 = element("view");
		prop(__nsh_hv22, "class", "min-h-0 min-w-0 flex-col");
		bindProp(__nsh_hv22, "style", () => ({
			flex: 1,
			transform: sliding() ? [{ translateX: pageSlideX }, { translateY: pageSlideY }] : void 0
		}));
		insert(__nsh_hv22, [
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
				titlebarInset: 0,
				get dark() {
					return dark();
				}
			}),
			() => route() === "notes" && component(NotesPage, {
				get colors() {
					return snapshot().colors;
				},
				get dark() {
					return dark();
				},
				titlebarInset: 0,
				get benchmarkNotes() {
					return benchmarkNotes();
				}
			}),
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
					insert(__nsh_hv24, component(Glyph, {
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
			() => route() === "games" && (() => {
				const __nsh_hv25 = element("view");
				prop(__nsh_hv25, "class", "min-h-0 flex-1");
				insert(__nsh_hv25, component(GamesLibrary, {
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
				return __nsh_hv25;
			})(),
			() => route() === "settings" && (() => {
				const __nsh_hv26 = element("view");
				prop(__nsh_hv26, "class", "min-h-0 flex-1");
				insert(__nsh_hv26, component(SettingsPage, {}));
				return __nsh_hv26;
			})(),
			() => route() === "developers" && component(SettingsPage$1, {
				get colors() {
					return snapshot().colors;
				},
				get children() {
					return component(DevelopersPage, {
						get colors() {
							return snapshot().colors;
						},
						get dark() {
							return dark();
						},
						get demo() {
							return Boolean(snapshot().demo);
						},
						get size() {
							return notes().length;
						},
						run: () => void runBenchmark({
							visit: (target) => {
								if (route() !== target) slidePage(1);
								route.set(target);
							},
							frames: (runId) => askEngine("benchmark.frames", { runId }),
							beginFrames: () => askEngine("benchmark.begin"),
							version: snapshot().version,
							sample: (runId) => {
								if (!hosted || !commandRef) return false;
								askEngine("benchmark.sample", { runId });
								return true;
							},
							fixture: (size) => {
								const text = "Абзац для проверки списка заметок.";
								const doc = {
									type: "doc",
									content: [{
										type: "paragraph",
										content: [{
											type: "text",
											text
										}]
									}]
								};
								const date = (/* @__PURE__ */ new Date()).toISOString();
								benchmarkNotes.set(size ? Array.from({ length: size }, (_, index) => ({
									id: `benchmark:${index}`,
									title: `Тестовая заметка ${index + 1}`,
									text,
									doc,
									createdAt: date,
									updatedAt: date
								})) : null);
							}
						}),
						stress: (count) => askEngine("notes.stress", { count }),
						reset: () => askEngine("notes.reset")
					});
				}
			})
		]);
		append(__nsh_hv21, __nsh_hv22);
		insert(__nsh_hv21, [() => searchOpen() && component(QuickSearch, {
			get colors() {
				return snapshot().colors;
			},
			get notes() {
				return notes();
			},
			get journal() {
				return snapshot().journalEntries;
			},
			onDismiss: () => searchOpen.set(false),
			onNote: (id) => {
				searchOpen.set(false);
				openRecentEntry({
					kind: "note",
					id,
					title: ""
				});
			},
			onJournal: () => {
				searchOpen.set(false);
				openPageTab("journal");
			}
		}), () => addTaskOpen() && component(Modal, {
			title: "Новая задача",
			get colors() {
				return snapshot().colors;
			},
			onDismiss: () => addTaskOpen.set(false),
			get footer() {
				return (() => {
					const __nsh_hv27 = element("view");
					prop(__nsh_hv27, "class", "flex-row items-center justify-end");
					prop(__nsh_hv27, "style", { gap: 8 });
					insert(__nsh_hv27, [component(ModalGhost, {
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
					return __nsh_hv27;
				})();
			},
			get children() {
				return (() => {
					const __nsh_hv28 = element("input");
					bindProp(__nsh_hv28, "value", () => newTaskTitle());
					prop(__nsh_hv28, "onChange", (e) => newTaskTitle.set(e.value));
					prop(__nsh_hv28, "onSubmit", (event) => {
						createTodo(event.text);
						addTaskOpen.set(false);
					});
					prop(__nsh_hv28, "placeholder", "Название задачи");
					prop(__nsh_hv28, "accessibilityLabel", "Название задачи");
					prop(__nsh_hv28, "class", "h-10 rounded-lg px-3 text-[13px]");
					bindProp(__nsh_hv28, "style", () => ({
						backgroundColor: snapshot().colors.background,
						color: snapshot().colors.foreground
					}));
					return __nsh_hv28;
				})();
			}
		})]);
		append(__nsh_hv11, __nsh_hv21);
		insert(__nsh_hv11, () => shell && (() => {
			const __nsh_hv12 = element("view");
			prop(__nsh_hv12, "class", "h-full shrink-0 overflow-hidden");
			bindProp(__nsh_hv12, "style", () => ({ width: sidebarPaneWidth() }));
			const __nsh_hv13 = element("view");
			prop(__nsh_hv13, "class", "relative box-border h-full");
			bindProp(__nsh_hv13, "style", () => ({
				width: 282,
				paddingTop: 48 + 8,
				paddingBottom: 8,
				paddingLeft: 8,
				paddingRight: shell ? 0 : 8,
				backgroundColor: shellFill(snapshot().colors, dark())
			}));
			const __nsh_hv14 = element("view");
			prop(__nsh_hv14, "onPressDown", () => askEngine("window.drag"));
			prop(__nsh_hv14, "class", "absolute left-0 right-0 bottom-0");
			prop(__nsh_hv14, "style", { top: 48 });
			const __nsh_hv15 = element("view");
			prop(__nsh_hv15, "style", {
				gap: 2,
				pointerEvents: "box-none"
			});
			insert(__nsh_hv15, () => pageNavigation.map((item) => component(SidebarRow, {
				get label() {
					return item.label;
				},
				get icon() {
					return iconForNavigation(item.id);
				},
				get selected() {
					return route() === item.id && !(item.id === "notes" && activeRecentNote());
				},
				get dark() {
					return dark();
				},
				get colors() {
					return snapshot().colors;
				},
				onPress: () => selectSidebarPage(item.id)
			})));
			const __nsh_hv20 = element("view");
			prop(__nsh_hv20, "class", "mt-auto");
			prop(__nsh_hv20, "style", {
				gap: 2,
				pointerEvents: "box-none"
			});
			insert(__nsh_hv20, () => footerNavigation.map((item) => component(SidebarRow, {
				get label() {
					return item.label;
				},
				get icon() {
					return iconForNavigation(item.id);
				},
				get selected() {
					return route() === item.id;
				},
				get dark() {
					return dark();
				},
				get colors() {
					return snapshot().colors;
				},
				onPress: () => changeRoute(item.id)
			})));
			append(__nsh_hv13, __nsh_hv14);
			append(__nsh_hv13, __nsh_hv15);
			append(__nsh_hv13, __nsh_hv20);
			insert(__nsh_hv13, () => recent().length > 0 && (() => {
				const __nsh_hv16 = element("view");
				prop(__nsh_hv16, "class", "mt-5");
				prop(__nsh_hv16, "style", { pointerEvents: "box-none" });
				const __nsh_hv17 = element("text");
				prop(__nsh_hv17, "class", "mb-1 text-[11px] font-medium");
				bindProp(__nsh_hv17, "style", () => ({
					color: snapshot().colors.muted,
					paddingLeft: 10
				}));
				const __nsh_hv18 = text("Недавно открытые");
				append(__nsh_hv17, __nsh_hv18);
				const __nsh_hv19 = element("view");
				prop(__nsh_hv19, "style", { gap: 1 });
				insert(__nsh_hv19, () => recent().map((entry) => component(RecentRow, {
					entry,
					get selected() {
						return entry.kind === "note" && route() === "notes" && openNoteId() === entry.id;
					},
					get colors() {
						return snapshot().colors;
					},
					get dark() {
						return dark();
					},
					onPress: () => openRecentEntry(entry)
				})));
				append(__nsh_hv16, __nsh_hv17);
				append(__nsh_hv16, __nsh_hv19);
				return __nsh_hv16;
			})(), __nsh_hv20);
			append(__nsh_hv12, __nsh_hv13);
			return __nsh_hv12;
		})(), __nsh_hv21);
		append(__nsh_hv10, __nsh_hv11);
		insert(__nsh_hv10, component(Bridge, {
			class: "absolute left-0 top-0 h-px w-px",
			ref: (node) => {
				commandRef = (name, args) => node.command(name, args);
				requestAppearanceImport();
				askEngine("appearance.set", localAppearance().settings);
				gameLibrary.bindCommand((name, args) => node.command(name, args));
				bindNoteCommands({
					create: (title, doc) => node.command("notes.create", {
						title,
						doc
					}),
					save: (id, title, doc) => node.command("notes.save", {
						id,
						title,
						doc
					}),
					remove: (id) => node.command("notes.delete", { id }),
					reload: () => node.command("notes.reload")
				});
			},
			get route() {
				return route();
			},
			onState: (next) => {
				if (!routeReady) {
					routeReady = true;
					batch(() => {
						route.set(next.route);
						history.set({
							entries: [destination()],
							index: 0
						});
					});
				}
				const appearance = localAppearance();
				snapshot.set({
					...next,
					appearance,
					appearanceEditable: true,
					themes: previewThemes,
					journalEntries: snapshot().journalEntries,
					sidebarVisible: sidebarVisible(),
					colors: localColors(appearance)
				});
			},
			onJournal: (entries) => snapshot.set({
				...snapshot(),
				journalEntries: entries
			}),
			onNotes: (next) => {
				setNotes(next);
				const first = snapshot().openNote;
				if (first && !startNoteOpened) {
					startNoteOpened = true;
					batch(() => {
						openNoteById(first);
						history.set({
							entries: [destination()],
							index: 0
						});
					});
				}
			},
			onNotesCreated: (note) => addNote(note),
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
			onNavigate: (event) => changeRoute(event.route),
			onBenchmark: benchmarkHardware,
			onBenchmarkFrames: benchmarkFrames,
			onBenchmarkReady: benchmarkReady,
			onAppearanceImported: (appearance) => finishAppearanceImport(appearance ?? void 0)
		}), __nsh_hv11);
		insert(__nsh_hv10, () => shell && component(TitlebarOverlay, {
			get colors() {
				return snapshot().colors;
			},
			get dark() {
				return dark();
			},
			get showAddGame() {
				return route() === "games";
			},
			get pageInset() {
				return pageLeft() > 0 ? pageLeft() : sidebarPaneWidth() + 8;
			},
			get dimmed() {
				return searchOpen() || addTaskOpen() || gameLibrary.addOpen() || pickedExes().length > 1;
			},
			get canGoBack() {
				return historyTarget(-1) >= 0;
			},
			get canGoForward() {
				return historyTarget(1) >= 0;
			},
			get tabs() {
				return tabViews();
			},
			onSelectTab: activateTab,
			onCloseTab: closeTab,
			onTabMenu: tabMenu,
			onGoBack: () => walkHistory(-1),
			onGoForward: () => walkHistory(1),
			onToggleSidebar: toggleSidebar,
			get onAddGame() {
				return gameLibrary.openAddDialog;
			},
			onChrome: (command) => askEngine(command)
		}));
		return __nsh_hv10;
	})();
}
mount(App);

//#endregion
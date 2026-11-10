import CoreGraphics
import Foundation

// Prints the window id of a process by name, so a shot can be taken without
// touching the person's screen: `screencapture -l <id>` renders the window even
// when it is behind other windows or parked outside the desktop.

let wanted = CommandLine.arguments.count > 1 ? CommandLine.arguments[1].lowercased() : "atlas"
let list = CGWindowListCopyWindowInfo([.optionAll, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
var best: (id: Int, area: Int)?
for window in list {
    let owner = (window[kCGWindowOwnerName as String] as? String ?? "").lowercased()
    guard owner.contains(wanted) else { continue }
    let layer = window[kCGWindowLayer as String] as? Int ?? 0
    guard layer == 0 else { continue }
    let bounds = window[kCGWindowBounds as String] as? [String: Any] ?? [:]
    let width = bounds["Width"] as? Double ?? 0
    let height = bounds["Height"] as? Double ?? 0
    guard width > 200, height > 200 else { continue }
    let id = window[kCGWindowNumber as String] as? Int ?? 0
    let area = Int(width * height)
    if best == nil || area > best!.area {
        best = (id, area)
    }
}
if let best {
    print(best.id)
} else {
    FileHandle.standardError.write("no window for \(wanted)\n".data(using: .utf8)!)
    exit(2)
}

import CoreFoundation
import Foundation
import Security

func fail(_ message: String, code: Int32 = 1) -> Never {
    fputs("\(message)\n", stderr)
    exit(code)
}

func run(_ executable: String, _ arguments: [String], environment: [String: String]? = nil) -> String {
    let process = Process()
    let output = Pipe()
    process.executableURL = URL(fileURLWithPath: executable)
    process.arguments = arguments
    if let environment { process.environment = environment }
    process.standardOutput = output
    process.standardError = output

    do {
        try process.run()
    } catch {
        fail("Could not start \(executable): \(error.localizedDescription)")
    }

    let data = output.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    let text = String(data: data, encoding: .utf8) ?? ""
    guard process.terminationStatus == 0 else {
        fputs(text, stderr)
        fail("\(URL(fileURLWithPath: executable).lastPathComponent) failed with exit code \(process.terminationStatus).", code: process.terminationStatus)
    }
    return text
}

func capture(_ pattern: String, from text: String, label: String) -> String {
    guard let range = text.range(of: pattern, options: .regularExpression),
          let match = text[range].range(of: "[^=:' ]+$", options: .regularExpression) else {
        fail("Could not read \(label) from Android build output.")
    }
    return String(text[match])
}

guard CommandLine.arguments.count >= 2 else {
    fail("Usage: build-android-release.swift REPOSITORY_ROOT")
}

let repo = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let home = FileManager.default.homeDirectoryForCurrentUser
let keystore = home.appendingPathComponent(".android/atlas-release-key.p12")
let gradle = repo.appendingPathComponent("android/gradlew")
let releaseApk = repo.appendingPathComponent("android/app/build/outputs/apk/release/app-release.apk")
let outputApk = repo.appendingPathComponent("dist/Atlas-Android-arm64.apk")
let buildTools = URL(fileURLWithPath: ProcessInfo.processInfo.environment["ANDROID_HOME"] ?? "/opt/homebrew/share/android-commandlinetools")
    .appendingPathComponent("build-tools/35.0.0")
let zipalign = buildTools.appendingPathComponent("zipalign").path
let apksigner = buildTools.appendingPathComponent("apksigner").path
let aapt = buildTools.appendingPathComponent("aapt").path
let expectedCertificate = "7464a378a701bef4528f6ae3d2fbca709f6fd528ca24df2b3d600c016cb01ca0"

guard FileManager.default.isExecutableFile(atPath: gradle.path) else { fail("Gradle wrapper not found at \(gradle.path).") }
guard FileManager.default.fileExists(atPath: keystore.path) else { fail("Android release keystore not found at \(keystore.path).") }
guard [zipalign, apksigner, aapt].allSatisfy({ FileManager.default.isExecutableFile(atPath: $0) }) else {
    fail("Android build-tools 35.0.0 are missing under \(buildTools.path). Set ANDROID_HOME to the installed SDK.")
}

let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: "atlas-android-release",
    kSecAttrAccount as String: "atlas-release",
    kSecReturnData as String: true,
    kSecMatchLimit as String: kSecMatchLimitOne,
]
var keychainResult: CFTypeRef?
guard SecItemCopyMatching(query as CFDictionary, &keychainResult) == errSecSuccess,
      let secret = keychainResult as? Data,
      let password = String(data: secret, encoding: .utf8) else {
    fail("Could not read Android release signing credentials from macOS Keychain (atlas-android-release / atlas-release).")
}

var environment = ProcessInfo.processInfo.environment
environment["ATLAS_ANDROID_KEY_PASSWORD"] = password
let gradleArguments = ["--project-dir", repo.appendingPathComponent("android").path, "--no-daemon", ":app:assembleRelease"]
let build = Process()
build.executableURL = gradle
build.arguments = gradleArguments
build.environment = environment
build.standardOutput = FileHandle.standardOutput
build.standardError = FileHandle.standardError
do {
    try build.run()
} catch {
    fail("Could not start Gradle: \(error.localizedDescription)")
}
build.waitUntilExit()
guard build.terminationStatus == 0 else { fail("Android release build failed.", code: build.terminationStatus) }
guard FileManager.default.fileExists(atPath: releaseApk.path) else { fail("Gradle did not produce the signed APK at \(releaseApk.path).") }

_ = run(zipalign, ["-c", "-p", "4", releaseApk.path])
let signature = run(apksigner, ["verify", "--verbose", "--print-certs", releaseApk.path])
let certificate = capture("(?m)^Signer #1 certificate SHA-256 digest: [0-9a-fA-F:]+$", from: signature, label: "signing certificate")
    .components(separatedBy: ": ").last!.replacingOccurrences(of: ":", with: "").lowercased()
guard certificate == expectedCertificate else {
    fail("APK was signed with an unexpected certificate (\(certificate)); expected the Atlas release certificate.")
}

let badging = run(aapt, ["dump", "badging", releaseApk.path])
guard badging.contains("package: name='com.mundus.atlas'") else { fail("The release APK has an unexpected Android package name.") }
let versionCode = capture("(?<=versionCode=')[0-9]+", from: badging, label: "versionCode")
let versionName = capture("(?<=versionName=')[^']+", from: badging, label: "versionName")

try FileManager.default.createDirectory(at: outputApk.deletingLastPathComponent(), withIntermediateDirectories: true)
if FileManager.default.fileExists(atPath: outputApk.path) { try FileManager.default.removeItem(at: outputApk) }
try FileManager.default.copyItem(at: releaseApk, to: outputApk)
print("Built and verified \(outputApk.path) (version \(versionName), code \(versionCode), Atlas release signature).")

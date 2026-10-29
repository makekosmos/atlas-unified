plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val repoRoot = rootProject.projectDir.parentFile
val nativeOut = layout.buildDirectory.dir("rust")
val generatedKotlin = layout.buildDirectory.dir("generated/uniffi")
val nshAar = providers.environmentVariable("NSH_ANDROID_AAR")
    .orElse("${System.getProperty("user.home")}/.nsh-0.3.0-atlas/embed/android/nsh.aar")
    .get()
val nshCli = providers.environmentVariable("NSH_CLI")
    .orElse("${System.getProperty("user.home")}/.cargo/bin/nsh")
    .get()
val rustProfile = if (gradle.startParameter.taskNames.any { it.contains("Release") }) "release" else "android-dev"
val releaseSigningPassword = providers.environmentVariable("ATLAS_ANDROID_KEY_PASSWORD").orNull
val releaseKeystore = File(System.getProperty("user.home"), ".android/atlas-release-key.p12")
val releaseRequested = gradle.startParameter.taskNames.any { it.contains("Release") }

if (releaseRequested && releaseSigningPassword.isNullOrBlank()) {
    throw GradleException("Android release builds must run through scripts/build-android-release.sh so the signing key is loaded from macOS Keychain.")
}
if (releaseRequested && !releaseKeystore.isFile) {
    throw GradleException("Android release keystore not found at ${releaseKeystore.path}.")
}

val buildMobileCore by tasks.registering(Exec::class) {
    workingDir = repoRoot
    commandLine("bash", "scripts/build-android-native.sh", nativeOut.get().asFile.path, generatedKotlin.get().asFile.path, rustProfile)
    inputs.dir(repoRoot.resolve("android/rust/src"))
    inputs.files(repoRoot.resolve("android/rust/Cargo.toml"), repoRoot.resolve("android/rust/Cargo.lock"))
    inputs.file(repoRoot.resolve("src/store/journal.rs"))
    inputs.file(repoRoot.resolve("scripts/build-android-native.sh"))
    inputs.property("rustProfile", rustProfile)
    outputs.dir(nativeOut)
    outputs.dir(generatedKotlin)
}

val buildNshBundle by tasks.registering(Exec::class) {
    workingDir = repoRoot
    commandLine(
        nshCli,
        "build",
        "ui/App.tsx",
        "--out",
        layout.projectDirectory.dir("src/main/assets/nsh").asFile.path,
    )
    inputs.dir(repoRoot.resolve("ui"))
    inputs.files(nshAar, nshCli)
    outputs.dir(layout.projectDirectory.dir("src/main/assets/nsh"))
}

android {
    namespace = "com.mundus.atlas"
    compileSdk = 35
    ndkVersion = "27.2.12479018"
    defaultConfig {
        applicationId = "com.mundus.atlas"
        minSdk = 28
        targetSdk = 35
        versionCode = 3
        versionName = Regex("(?m)^version = \"([^\"]+)\"")
            .find(repoRoot.resolve("Cargo.toml").readText())?.groupValues?.get(1) ?: "0.0.0"
        ndk { abiFilters += "arm64-v8a" }
    }

    signingConfigs {
        create("release") {
            storeFile = releaseKeystore
            storeType = "PKCS12"
            storePassword = releaseSigningPassword.orEmpty()
            keyAlias = "atlas-release"
            keyPassword = releaseSigningPassword.orEmpty()
        }
    }

    buildTypes {
        debug { applicationIdSuffix = ".dev" }
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    sourceSets.getByName("main").apply {
        java.srcDir(generatedKotlin)
        jniLibs.srcDir(nativeOut.map { it.dir("jniLibs") })
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { buildConfig = true }
}

tasks.named("preBuild") {
    dependsOn(buildMobileCore, buildNshBundle)
}

dependencies {
    if (!file(nshAar).isFile) {
        throw GradleException("NSH Android runtime not found at $nshAar; set NSH_ANDROID_AAR")
    }
    implementation(files(nshAar))
    implementation("net.java.dev.jna:jna:5.15.0@aar")
}

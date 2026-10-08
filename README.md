# SmartRide AI - Android Native Studio Project

This directory contains the original native Android Studio project (Java / WebView) for SmartRide AI.

---

## 🏗️ Project Structure

```
android_native_app/
├── app/                     # Android application module
│   ├── src/                 # Java source code, AndroidManifest.xml, res/
│   ├── build.gradle.kts     # Module-level Gradle build configuration
│   └── proguard-rules.pro   # Proguard obfuscation rules
├── gradle/                  # Gradle wrapper configuration
├── gradlew                  # Unix Gradle wrapper executable
├── gradlew.bat              # Windows Gradle wrapper executable
├── build.gradle.kts         # Project-level Gradle build configuration
├── settings.gradle.kts      # Project settings (includes :app)
├── gradle.properties        # JVM & AndroidX Gradle flags
└── local.properties         # Android SDK location path
```

---

## 🚀 Building & Running

### 1. In Android Studio
1. Launch Android Studio.
2. Select **Open** and choose this `android_native_app` folder.
3. Allow Gradle to sync and download dependencies.
4. Select a connected device or Android Virtual Device (AVD) and click **Run** (`Shift + F10`).

### 2. From Command Line (CLI)
```bash
cd android_native_app
./gradlew assembleDebug
```
*The compiled APK will be generated at `app/build/outputs/apk/debug/app-debug.apk`.*

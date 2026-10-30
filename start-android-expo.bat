@echo off
title SmartRide AI - Build & Run Android App
cd /d "%~dp0"
echo ============================================================
echo   SmartRide AI - Build & Package Native Android App (APK)
echo ============================================================
echo.

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;C:\Users\NARASIMHA\AppData\Local\Android\Sdk\platform-tools;%PATH%"

set "NODE_CMD="
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  set "NODE_CMD=node"
) else (
  for /f "delims=" %%I in ('dir /s /b "C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\node.exe" 2^>nul') do (
    if exist "%%I" set "NODE_CMD=%%I"
  )
  if "%NODE_CMD%"=="" if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_CMD=C:\Program Files\nodejs\node.exe"
  )
)

echo [1/3] Compiling Web bundle into Android assets...
cd /d "%~dp0frontend"
if not "%NODE_CMD%"=="" (
  "%NODE_CMD%" "node_modules\vite\bin\vite.js" build
) else (
  call npm run build
)
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Frontend asset compilation failed.
  pause
  exit /b 1
)

echo.
echo [2/3] Compiling and assembling Android APK via Gradle...
cd /d "%~dp0"
call .\gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Gradle build failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Updating root SmartRide_AI_Cab_Booking.apk...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
  copy /y "app\build\outputs\apk\debug\app-debug.apk" "SmartRide_AI_Cab_Booking.apk" >nul
  echo.
  echo ============================================================
  echo [SUCCESS] Latest Android APK generated:
  echo   %~dp0SmartRide_AI_Cab_Booking.apk
  echo ============================================================
  echo.
  
  adb get-state 1>nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    echo [INFO] Connected Android device detected. Installing APK...
    adb install -r "SmartRide_AI_Cab_Booking.apk"
    echo [INFO] Launching SmartRide AI app on device...
    adb shell monkey -p com.example.airidebooking -c android.intent.category.LAUNCHER 1 >nul 2>nul
    echo [SUCCESS] App launched on connected Android device!
  ) else (
    echo [INFO] You can install SmartRide_AI_Cab_Booking.apk on any Android phone,
    echo or open this folder in Android Studio and click 'Run'.
  )
)
echo.
pause

@echo off
title SmartRide AI - React Native Android App
cd /d "%~dp0"
echo ============================================================
echo   SmartRide AI - React Native Mobile Application
echo ============================================================
echo.
echo Checking Node runtime...
set PATH=C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\cua_node\a708e72b10c27b59\bin;%PATH%

echo.
echo Starting Expo Metro Bundler for Android...
echo  - Press 'a' to open on Android Emulator / Connected Device
echo  - Press 'w' to open in Web Browser
echo  - Scan QR code with 'Expo Go' app on your Android phone
echo.
call npx expo start
pause

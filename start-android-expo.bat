@echo off
title SmartRide AI - Launch React Native Android App
cd /d "%~dp0frontend_android_app"
echo ============================================================
echo   Starting SmartRide AI React Native Mobile App
echo ============================================================
echo.
set PATH=C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\cua_node\a708e72b10c27b59\bin;%PATH%
call npx expo start
pause

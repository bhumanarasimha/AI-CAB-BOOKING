@echo off
title SmartRide AI - Full Stack Launcher
cd /d "%~dp0"
echo ============================================================
echo   SmartRide AI - Full Stack Launcher
echo ============================================================
echo.
echo [1/2] Launching PHP & MySQL REST Backend (Port 5000)...
start "SmartRide AI Backend" cmd /c "%~dp0start-backend.bat"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Web Frontend (Vite on Port 5173)...
start "SmartRide AI Web Frontend" cmd /c "%~dp0start-web.bat"

echo.
echo ============================================================
echo   SmartRide AI Services are now starting:
echo   - Backend REST API: http://localhost:5000
echo   - Web Application:  http://localhost:5173
echo.
echo   To build and package the native Android App (APK):
echo   Run: start-android-expo.bat
echo   Or open this directory in Android Studio.
echo ============================================================
echo.
pause

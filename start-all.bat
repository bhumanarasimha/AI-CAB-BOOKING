@echo off
title SmartRide AI - Full Stack Launcher
cd /d "%~dp0"
echo ============================================================
echo   SmartRide AI - Complete Full Stack Launcher
echo ============================================================
echo.
echo [1/3] Launching Backend Server (Node Express / Socket.io on port 5000)...
start "SmartRide AI Backend" cmd /c "%~dp0start-backend.bat"

timeout /t 2 /nobreak >nul

echo [2/3] Launching Web Frontend (Vite on port 5173)...
start "SmartRide AI Web Frontend" cmd /c "%~dp0start-web.bat"

timeout /t 2 /nobreak >nul

echo [3/3] Launching React Native Mobile App (Expo Metro)...
start "SmartRide AI Mobile App" cmd /c "%~dp0start-android-expo.bat"

echo.
echo ============================================================
echo   All 3 SmartRide AI Services are running:
echo   - Backend REST & Real-Time API: http://localhost:5000/api
echo   - Web Frontend:                 http://localhost:5173
echo   - Mobile App (Expo Metro):       http://localhost:8081
echo ============================================================
echo.
pause

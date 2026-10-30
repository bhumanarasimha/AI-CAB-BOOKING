@echo off
title SmartRide AI - Dual Tab Launcher
cd /d "%~dp0"
echo ============================================================
echo   Opening Android Mobile View and Web Application in 2 Tabs
echo ============================================================
echo.

echo [1/2] Opening Tab 1: Android Mobile App View...
start "" "http://localhost:5173/?view=mobile"

timeout /t 1 /nobreak >nul

echo [2/2] Opening Tab 2: Desktop Web Application...
start "" "http://localhost:5173/?view=desktop"

echo.
echo ============================================================
echo   Both tabs are now open in your default browser!
echo   - Tab 1: http://localhost:5173/?view=mobile (Android App)
echo   - Tab 2: http://localhost:5173/?view=desktop (Web App)
echo.
echo   Tip: You can also open the Dedicated Desktop Mobility Hub:
echo        http://localhost:8080
echo ============================================================
pause
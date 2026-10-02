@echo off
title SmartRide AI - Backend Server
cd /d "%~dp0Backend"
echo ============================================================
echo   SmartRide AI - Backend Server (Port 5000)
echo ============================================================
echo.
set PATH=C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\cua_node\a708e72b10c27b59\bin;%PATH%
node server.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Backend server stopped or failed to launch.
)
pause

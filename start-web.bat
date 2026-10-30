@echo off
title SmartRide AI - Web Frontend
cd /d "%~dp0frontend"
echo ============================================================
echo   SmartRide AI - Web Frontend (Desktop & Mobile Browser)
echo ============================================================
echo.

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

if "%NODE_CMD%"=="" (
  echo [ERROR] Node.js executable was not found.
  echo Please install Node.js from https://nodejs.org
  pause
  exit /b 1
)

echo Starting Vite development server...
echo Desktop Web URL: http://localhost:5173
echo (Tip: Access from any device on your Wi-Fi via your PC's IP on port 5173)
echo.
"%NODE_CMD%" "node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5173
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Web Frontend server stopped or failed to launch.
)
pause

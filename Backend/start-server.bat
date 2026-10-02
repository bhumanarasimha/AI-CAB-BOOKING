@echo off
title SmartRide AI Backend Server
echo ====================================================
echo Starting SmartRide AI Backend Server on Port 5000...
echo ====================================================

REM Ensure Node is in PATH for this session if not yet loaded from User Environment
set "PATH=%PATH%;C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\cua_node\a708e72b10c27b59\bin"

node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Node.js not detected. Please verify installation.
  pause
  exit /b 1
)

echo Node.js is ready. Launching server...
node server.js
pause

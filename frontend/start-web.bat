@echo off
title SmartRide AI Web Frontend
echo ====================================================
echo Starting SmartRide AI Web Frontend on Vite...
echo ====================================================

REM Ensure Node is in PATH for this session
set "PATH=%PATH%;C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\cua_node\a708e72b10c27b59\bin"

npm run dev
pause

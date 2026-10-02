@echo off
title SmartRide AI - Web Frontend
cd /d "%~dp0Web_frontend"
echo ============================================================
echo   Starting SmartRide AI Web Frontend (Port 5173)
echo ============================================================
echo.
set PATH=C:\Users\NARASIMHA\AppData\Local\OpenAI\Codex\runtimes\cua_node\a708e72b10c27b59\bin;%PATH%
call npm run dev
pause

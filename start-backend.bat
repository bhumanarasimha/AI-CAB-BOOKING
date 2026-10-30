@echo off
title SmartRide AI - Backend Server
cd /d "%~dp0Backend\php"
echo ============================================================
echo   SmartRide AI - PHP & MySQL REST Backend (Port 5000)
echo ============================================================
echo.

REM Check if php is in system PATH, otherwise fallback to XAMPP PHP
where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  if exist "C:\xampp\php\php.exe" (
    echo [INFO] Using PHP from C:\xampp\php\php.exe
    set "PATH=C:\xampp\php;%PATH%"
  ) else (
    echo [WARNING] PHP was not found in PATH or C:\xampp\php.
    echo Please install PHP or XAMPP to run the backend server.
    pause
    exit /b 1
  )
)

echo Starting PHP API server on http://localhost:5000 ...
echo (Tip: Ensure MySQL is running in XAMPP Control Panel if using MySQL DB)
echo.
php -S 0.0.0.0:5000 index.php
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Backend server stopped or failed to launch.
)
pause

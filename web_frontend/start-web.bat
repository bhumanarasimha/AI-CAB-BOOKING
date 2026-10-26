@echo off
title SmartRide AI - Web Application
cd /d "%~dp0"
echo ============================================================
echo   SmartRide AI - Vanilla HTML/CSS/JS Web Application
echo ============================================================
echo.

REM 1. Check XAMPP PHP (Confirmed installed on this machine)
if exist "C:\xampp\php\php.exe" (
  echo [INFO] Starting web server via XAMPP PHP on http://localhost:8080 ...
  start http://localhost:8080
  "C:\xampp\php\php.exe" -S 0.0.0.0:8080
  goto end
)

REM 2. Check if PHP is in PATH
php -v >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo [INFO] Starting web server via PHP on http://localhost:8080 ...
  start http://localhost:8080
  php -S 0.0.0.0:8080
  goto end
)

REM 3. Check if real Python is working (not Microsoft Store stub)
python -c "import sys; sys.exit(0)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo [INFO] Starting web server via Python on http://localhost:8080 ...
  start http://localhost:8080
  python -m http.server 8080
  goto end
)

REM 4. Check npx serve
call npx -v >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo [INFO] Starting web server via npx serve on http://localhost:8080 ...
  start http://localhost:8080
  call npx -y serve -p 8080 .
  goto end
)

echo [INFO] Opening index.html directly in your default browser...
start index.html

:end
pause

@echo off
echo =======================================================
echo  SmartRide AI - PHP & MySQL REST Backend Web Server
echo =======================================================
echo.
echo Starting PHP Built-in Web Server on http://localhost:5000...
cd /d "%~dp0"
php -S 0.0.0.0:5000 index.php
pause

@echo off
title HRM Pro Local Server
cd /d "%~dp0"
echo ========================================================
echo    Starting HRM Pro Local Development Server...
echo ========================================================
echo.
node server/src/server.js
pause

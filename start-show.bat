@echo off
rem Double-click this to build the app and run the built version, with the
rem backend, all in one window. Same as: npm run start
cd /d "%~dp0"
call npm run start
echo.
pause

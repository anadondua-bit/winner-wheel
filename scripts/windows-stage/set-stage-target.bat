@echo off
rem Double-click this to pick which monitor the stage kiosk opens on.
rem Same as: powershell -ExecutionPolicy Bypass -File stage-target.ps1
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "stage-target.ps1"
echo.
pause

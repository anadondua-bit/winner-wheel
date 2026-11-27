@echo off
rem Double-click this to build the app, run it with the backend, and start
rem watching for the "Open/Close stage display" buttons in Control - the
rem whole stack, one click.

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Couldn't find npm. Install Node.js from https://nodejs.org first, then try again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Dependencies aren't installed yet - running npm install, this only happens once...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed - see the error above.
    echo.
    pause
    exit /b 1
  )
  echo.
)

if exist "scripts\windows-stage\stage-target.json" (
  echo Starting the stage watcher in its own window...
  rem -NoExit keeps this window open if the script errors out, so the
  rem actual error is visible instead of the window just closing.
  start "Stage Watcher" powershell -NoExit -ExecutionPolicy Bypass -File "scripts\windows-stage\stage-watcher.ps1" -StageUrl "http://localhost:8080/stage"
) else (
  echo No projector monitor saved yet - skipping the stage watcher.
  echo Run set-stage-target.bat once, then start this again to pick it up.
)

echo Opening Control in your browser once the app is actually up...
start "" powershell -NoProfile -WindowStyle Hidden -Command "while (-not (Test-NetConnection -ComputerName localhost -Port 8080 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Sleep -Seconds 1 }; Start-Process 'http://localhost:8080/control'"

echo.
call npm run start
echo.
pause

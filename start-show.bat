@echo off
rem Double-click this to build the app and run the built version, with the
rem backend, all in one window. Same as: npm run start

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

call npm run start
echo.
pause

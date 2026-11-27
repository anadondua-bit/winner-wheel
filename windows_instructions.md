# Setting up the stage display (Windows, one machine)

This is for the normal case: **one Windows computer runs the whole show and
also projects it** — the operator uses Control in a regular browser window,
and a second output (HDMI to the projector / LED wall) shows the Stage
display in a kiosk window. Everything talks to `localhost` — no network, no
tunnel, no other machine involved.

(If Control and the projector are ever on two separate machines instead, see
`windows_instructions_two_machines.md`.)

## Prerequisites

- **Node.js** (and npm) installed.
- **Google Chrome** installed.
- **PowerShell 7** (`pwsh`) is recommended but not required. If you don't
  have it: `winget install Microsoft.PowerShell`. Without it, use
  `powershell.exe` (built into Windows) with the exact same commands below —
  just swap `pwsh` for `powershell`.
- This repo on the machine (`git clone`, or copy the folder over).

## One-time setup: pick the projector output

Plug in the HDMI/video output that goes to the LED wall or projector, then:

**Easiest:** double-click `set-stage-target.bat` in `scripts/windows-stage`.

Or from a terminal, from that same folder:
`powershell -ExecutionPolicy Bypass -File .\stage-target.ps1`.

Either way, it lists every monitor Windows can see and flashes a big number on each
screen for a few seconds, so you can match the list to what's physically in
front of you. Type the index of the projector/LED-wall screen (not your own
laptop screen) when prompted. This saves your choice to `stage-target.json`
next to the script.

You only need to redo this if the monitor arrangement ever changes.

## Every show: double-click start-show.bat

That's it — one double-click of `start-show.bat` in the repo's root folder
does everything:

- Installs dependencies first, if this is the very first run.
- Starts the stage watcher in its own window (skipped with a note if you
  haven't done the one-time monitor setup above yet).
- Opens Control in your browser after a few seconds.
- Builds and runs the app with the backend, in this window.

Leave this window (and the "Stage Watcher" window it opens) running for the
whole show.

Prefer doing it by hand instead? From a terminal, in the repo folder:
`npm install` once, then `npm run start` (or `npm run dev` for the dev
server — auto-reloads on changes, handy while testing), and separately
`powershell -ExecutionPolicy Bypass -File scripts\windows-stage\stage-watcher.ps1 -StageUrl "http://localhost:8080/stage"`
in another window.

To stop the watcher, close its window or `Ctrl+C` there. That does **not**
close an already-open kiosk window — that's done from Control (see below) or
by closing it directly.

## From Control: open and close the screen

In the command center's header, next to the settings gear, there are two
icons:

- **Monitor (play) icon** — "Open stage display". The watcher picks this up
  within a couple of seconds and launches Chrome in kiosk mode on the
  monitor you picked above, pointed at the stage display.
- **Monitor (off) icon** — "Close stage display" (asks you to confirm first,
  since it blanks the screen live). Closes that same kiosk window.

That's the whole flow: start the app, pick the monitor once, start the
watcher each show, then use the two buttons in Control for the rest of the
event.

## If something's not working

- **"'vite' is not recognized as an internal or external command"** —
  dependencies aren't installed. `start-show.bat` now does this
  automatically, but if you're running `npm run start`/`dev` by hand, run
  `npm install` in the repo folder first.
- **"Couldn't find chrome.exe"** — pass `-ChromePath` explicitly to
  `stage-watcher.ps1`, pointing at your actual Chrome install.
- **"No target monitor saved yet"** — run `stage-target.ps1` first.
- **Nothing happens when you click Open/Close in Control** — check that
  `stage-watcher.ps1` is still running, and that `npm run dev` (or `start`)
  is still running too.
- **Script won't run at all / "running scripts is disabled"** — that's
  Windows' execution policy; the `-ExecutionPolicy Bypass` flag in the
  commands above should already handle it for that one run.

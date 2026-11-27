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
- This repo on the machine (`git clone`, or copy the folder over), with
  `npm install` already run once.

## Start the app

From the repo folder:

```powershell
npm run dev
```

(or `npm run start` for a production build — either way it serves on
`http://localhost:8080`.) Leave this running for the whole show.

Open Control in a normal Chrome window on the operator's own screen:

```
http://localhost:8080/control
```

## One-time setup: pick the projector output

Plug in the HDMI/video output that goes to the LED wall or projector, then
from `scripts/windows-stage`:

```powershell
powershell -ExecutionPolicy Bypass -File .\stage-target.ps1
```

It lists every monitor Windows can see and flashes a big number on each
screen for a few seconds, so you can match the list to what's physically in
front of you. Type the index of the projector/LED-wall screen (not your own
laptop screen) when prompted. This saves your choice to `stage-target.json`
next to the script.

You only need to redo this if the monitor arrangement ever changes.

## Every show: start the watcher

```powershell
powershell -ExecutionPolicy Bypass -File .\stage-watcher.ps1 -StageUrl "http://localhost:8080/stage"
```

Leave this running (minimized is fine) for the whole show — it's just
watching for a command from Control every couple of seconds; nothing opens
until you tell it to.

To stop watching, close the window or `Ctrl+C`. This does **not** close an
already-open kiosk window — that's done from Control (see below) or by
closing it directly.

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

- **"Couldn't find chrome.exe"** — pass `-ChromePath` explicitly to
  `stage-watcher.ps1`, pointing at your actual Chrome install.
- **"No target monitor saved yet"** — run `stage-target.ps1` first.
- **Nothing happens when you click Open/Close in Control** — check that
  `stage-watcher.ps1` is still running, and that `npm run dev` (or `start`)
  is still running too.
- **Script won't run at all / "running scripts is disabled"** — that's
  Windows' execution policy; the `-ExecutionPolicy Bypass` flag in the
  commands above should already handle it for that one run.

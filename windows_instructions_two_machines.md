# Setting up the stage display (Windows, two machines)

This is for the less common case: **Control runs on one computer, and a
separate machine does the actual projecting** (e.g. a dedicated Windows box
wired to the LED wall, controlled from your own laptop). If one machine does
both, use `windows_instructions.md` instead — it's simpler and has no
network setup at all.

On the projecting machine, you only need two files from this repo:
`scripts/windows-stage/stage-target.ps1` and
`scripts/windows-stage/stage-watcher.ps1`. Copy that `windows-stage` folder
over (USB stick, shared drive, or a full `git clone` if you'd rather) —
nothing else here is needed on that machine, unless you'd rather run the
`npm run stage:*` shortcuts, in which case it needs the whole repo and
Node.js too.

## Prerequisites

- **Google Chrome** installed on the projecting machine.
- **PowerShell 7** (`pwsh`) is recommended but not required there. If you
  don't have it: `winget install Microsoft.PowerShell`. Without it, use
  `powershell.exe` (built into Windows) with the exact same commands below —
  just swap `pwsh` for `powershell`.
- The command center (wherever `npm run dev` or `npm run start` runs) needs
  to already be running.
- **This runs over your local network — no tunnel, no cloud service.** Both
  machines just need to be on the same Wi-Fi/LAN. Find the Control
  machine's local IP address:
  - It's printed right in the terminal when `npm run dev` starts, as
    `Network: http://<ip>:8080/` — use that address as-is.
  - Or find it yourself: on Mac, System Settings → Wi-Fi → Details (or
    `ipconfig getifaddr en0` in Terminal); on Windows, `ipconfig` and look
    for the Wi-Fi adapter's IPv4 address.
  - Your stage URL is then `http://<that-ip>:8080/stage`.
  - A tunnel (Cloudflare, ngrok, etc.) is only needed if the projecting
    machine genuinely can't reach the Control machine's LAN IP — different
    networks, a venue that blocks device-to-device traffic, a remote AV
    booth, etc. If that's not your situation, skip it.

## One-time setup: pick the monitor

On the projecting machine, plug in the HDMI/video output that goes to the
LED wall or projector, then from inside the `windows-stage` folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\stage-target.ps1
```

It lists every monitor Windows can see and flashes a big number on each
screen for a few seconds, so you can match the list to what's physically in
front of you. Type the index of the screen that should show the stage
display when prompted. This saves your choice to `stage-target.json` next to
the script.

You only need to redo this if the monitor arrangement ever changes (a
different machine, a different HDMI port, etc.).

## Every show: start the watcher

On the projecting machine:

```powershell
powershell -ExecutionPolicy Bypass -File .\stage-watcher.ps1 -StageUrl "http://<Control-machine-ip>:8080/stage"
```

Replace the IP with the Control machine's actual local network address for
that day (see Prerequisites above for how to find it). Leave this running
(minimized is fine) for the whole show — it's just watching for a command
from Control every couple of seconds; nothing opens until you tell it to.

To stop watching, close the window or `Ctrl+C`. This does **not** close an
already-open kiosk window — that's done from Control (see below) or by
closing it directly on the projecting machine.

## From Control: open and close the screen

In the command center's header, next to the settings gear, there are two
icons:

- **Monitor (play) icon** — "Open stage display". The watcher picks this up
  within a couple of seconds and launches Chrome in kiosk mode on the
  monitor you picked above, pointed at your stage URL.
- **Monitor (off) icon** — "Close stage display" (asks you to confirm first,
  since it blanks the screen live). Closes that same kiosk window remotely.

## If something's not working

- **"Couldn't find chrome.exe"** — pass `-ChromePath` explicitly to
  `stage-watcher.ps1`, pointing at your actual Chrome install.
- **"No target monitor saved yet"** — run `stage-target.ps1` first.
- **Nothing happens when you click Open/Close in Control** — check that
  `stage-watcher.ps1` is still running on the projecting machine, and that
  `-StageUrl` actually matches what Control is using right now.
- **Script won't run at all / "running scripts is disabled"** — that's
  Windows' execution policy; the `-ExecutionPolicy Bypass` flag in the
  commands above should already handle it for that one run.
- **The stage URL just times out / won't load from the projecting machine**
  — almost always the Control machine's firewall blocking incoming LAN
  connections on port 8080. On Mac: System Settings → Network → Firewall,
  and allow incoming connections for Node (or turn the firewall off for the
  show). Confirm both machines are actually on the same network first (same
  Wi-Fi, not one on Wi-Fi and one wired to a different router/VLAN).

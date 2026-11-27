<#
.SYNOPSIS
  Opens and closes the stage display's kiosk Chrome window in response to
  the "Open stage display" / "Close stage display" buttons in the command
  center, on the monitor chosen by stage-target.ps1.

.DESCRIPTION
  Run this once at the start of the show and leave it running (minimized is
  fine). It polls the show's own local server (server/index.ts -- the same
  one Control and Stage talk to, reached through whatever tunnel or network
  address serves StageUrl) every couple of seconds -- no websocket,
  nothing fragile to keep alive overnight -- and only acts on a command
  issued *after* this script started, so a leftover command from a
  previous show never fires on launch.

  Requires stage-target.ps1 to have been run first (reads its
  stage-target.json for which monitor to use).

.PARAMETER StageUrl
  The URL the kiosk window should load -- your /stage page (through the
  tunnel, or your venue network address; whatever you'd normally open on
  that machine). The command server is assumed to be on this same origin
  (that's what the Vite dev server's proxy sets up) -- pass -ServerUrl to
  override if yours is reachable somewhere else.

.PARAMETER ConfigPath
  Where stage-target.ps1 saved the chosen monitor. Defaults to
  stage-target.json next to this script.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\stage-watcher.ps1 -StageUrl "https://your-tunnel.example.com/stage"
#>

param(
  [Parameter(Mandatory = $true)][string]$StageUrl,
  [string]$ServerUrl,
  [string]$ConfigPath,
  [string]$ChromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  [string]$ProfileDir,
  [int]$PollSeconds = 2
)

if (-not $ServerUrl) {
  $ServerUrl = $StageUrl -replace '/stage/?$', ''
}

if (-not $ConfigPath) {
  $ConfigPath = Join-Path $PSScriptRoot "stage-target.json"
}

if (-not $ProfileDir) {
  # $env:LOCALAPPDATA is occasionally empty depending on how the shell was
  # launched -- fall back rather than hard-failing on it.
  $profileBase = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } elseif ($env:TEMP) { $env:TEMP } else { $PSScriptRoot }
  $ProfileDir = Join-Path $profileBase "AwardWheelStageKiosk"
}

if (-not (Test-Path $ChromePath)) {
  $alt = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  if (Test-Path $alt) {
    $ChromePath = $alt
  } else {
    Write-Error "Couldn't find chrome.exe at '$ChromePath'. Pass -ChromePath explicitly."
    exit 1
  }
}

if (-not (Test-Path $ConfigPath)) {
  Write-Error "No target monitor saved yet. Run stage-target.ps1 first."
  exit 1
}

$target = Get-Content $ConfigPath -Raw | ConvertFrom-Json
Write-Host "Target monitor: [$($target.monitorIndex)] $($target.width)x$($target.height) at $($target.x),$($target.y)" -ForegroundColor Cyan

$endpoint = "$ServerUrl/api/stage-command"

$stageProcess = $null
$lastSeenAt = $null
$initialized = $false

function Start-StageKiosk {
  if ($script:stageProcess -and -not $script:stageProcess.HasExited) {
    Write-Host "Stage display is already open." -ForegroundColor Yellow
    return
  }
  $chromeArgs = @(
    "--kiosk",
    "--window-position=$($target.x),$($target.y)",
    "--window-size=$($target.width),$($target.height)",
    "--user-data-dir=`"$ProfileDir`"",
    "--no-first-run",
    "--disable-session-crashed-bubble",
    "`"$StageUrl`""
  )
  $script:stageProcess = Start-Process -FilePath $ChromePath -ArgumentList $chromeArgs -PassThru
  Write-Host "Opened stage display (PID $($script:stageProcess.Id))." -ForegroundColor Green
}

function Stop-StageKiosk {
  if (-not $script:stageProcess -or $script:stageProcess.HasExited) {
    Write-Host "Stage display is already closed." -ForegroundColor Yellow
    return
  }
  Stop-Process -Id $script:stageProcess.Id -Force -ErrorAction SilentlyContinue
  Write-Host "Closed stage display." -ForegroundColor Green
}

Write-Host "Watching for stage commands every $PollSeconds second(s). Ctrl+C stops watching (an already-open display stays open)." -ForegroundColor Cyan

while ($true) {
  Start-Sleep -Seconds $PollSeconds

  try {
    $row = Invoke-RestMethod -Uri $endpoint -Method Get -TimeoutSec 10
  } catch {
    continue # a dropped poll just retries next loop; never give up watching over one bad request
  }

  if (-not $row) { continue }

  if (-not $initialized) {
    # Baseline only -- an old command from a previous show must never fire
    # the instant this script starts.
    $lastSeenAt = $row.requestedAt
    $initialized = $true
    continue
  }

  if ($row.requestedAt -ne $lastSeenAt) {
    $lastSeenAt = $row.requestedAt
    switch ($row.command) {
      "start" { Start-StageKiosk }
      "close" { Stop-StageKiosk }
      default { Write-Host "Unknown command '$($row.command)' -- ignored." -ForegroundColor Yellow }
    }
  }
}

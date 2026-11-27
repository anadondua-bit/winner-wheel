<#
.SYNOPSIS
  Opens and closes the stage display's kiosk Chrome window in response to
  the "Open stage display" / "Close stage display" buttons in the command
  center, on the monitor chosen by stage-target.ps1.

.DESCRIPTION
  Run this once at the start of the show and leave it running (minimized is
  fine). It polls a single row in the show's Supabase project over plain
  HTTPS every couple of seconds -- no websocket, nothing fragile to keep
  alive overnight -- and only acts on a command issued *after* this script
  started, so a leftover command from a previous show never fires on launch.

  Requires stage-target.ps1 to have been run first (reads its
  stage-target.json for which monitor to use).

.PARAMETER StageUrl
  The URL the kiosk window should load -- your /stage page (through the
  tunnel, or your venue network address; whatever you'd normally open on
  that machine).

.PARAMETER ConfigPath
  Where stage-target.ps1 saved the chosen monitor. Defaults to
  stage-target.json next to this script.

.PARAMETER SupabaseUrl / SupabaseAnonKey
  Default to this project's actual values (the same ones already shipped
  in the web app's own bundle -- the anon key is public by design, gated by
  row-level security, not a secret). Override only if you point this at a
  different project.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\stage-watcher.ps1 -StageUrl "https://your-tunnel.example.com/stage"
#>

param(
  [Parameter(Mandatory = $true)][string]$StageUrl,
  [string]$ConfigPath = (Join-Path $PSScriptRoot "stage-target.json"),
  [string]$ChromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  [string]$ProfileDir = (Join-Path $env:LOCALAPPDATA "AwardWheelStageKiosk"),
  [string]$SupabaseUrl = "https://br-spicy-nene-d133f62b.supabase.aidap-global.ap-southeast-1.bytepluses.com",
  [string]$SupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGF0Zm9ybSIsInJvbGUiOiJhbm9uIiwiZXhwIjozNjkyMjcyMjE2fQ.XgC1wFYD6UWTTQupIg9R8u1DFwaHsIvn-8mqlEbyUs0",
  [int]$PollSeconds = 2
)

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

$headers = @{
  apikey        = $SupabaseAnonKey
  Authorization = "Bearer $SupabaseAnonKey"
}
$endpoint = "$SupabaseUrl/rest/v1/award_wheel_commands?stage_key=eq.main-stage&select=command,requested_at"

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
    $rows = Invoke-RestMethod -Uri $endpoint -Headers $headers -Method Get -TimeoutSec 10
  } catch {
    continue # a dropped poll just retries next loop; never give up watching over one bad request
  }

  $row = $rows | Select-Object -First 1
  if (-not $row) { continue }

  if (-not $initialized) {
    # Baseline only -- an old command from a previous show must never fire
    # the instant this script starts.
    $lastSeenAt = $row.requested_at
    $initialized = $true
    continue
  }

  if ($row.requested_at -ne $lastSeenAt) {
    $lastSeenAt = $row.requested_at
    switch ($row.command) {
      "start" { Start-StageKiosk }
      "close" { Stop-StageKiosk }
      default { Write-Host "Unknown command '$($row.command)' -- ignored." -ForegroundColor Yellow }
    }
  }
}

<#
.SYNOPSIS
  Picks which monitor the stage kiosk should open on and saves it for
  stage-watcher.ps1 to read on every launch.

.DESCRIPTION
  Run this once per show, after plugging in the HDMI/video output that goes
  to the LED wall, and again any time the monitor arrangement changes. It
  lists every monitor Windows can see, flashes a big number on each one for
  a few seconds so you can match the list to what's physically in front of
  you, then saves your choice to stage-target.json next to this script.

.PARAMETER ConfigPath
  Where to save the chosen monitor. Defaults to stage-target.json next to
  this script — leave it alone unless you have a reason to move it.

.PARAMETER NoIdentify
  Skip the on-screen number flash (e.g. if you already know the index from
  a previous run and just want to re-save it quickly).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\stage-target.ps1
#>

param(
  [string]$ConfigPath = (Join-Path $PSScriptRoot "stage-target.json"),
  [switch]$NoIdentify
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screens = [System.Windows.Forms.Screen]::AllScreens
if ($screens.Count -eq 0) {
  Write-Error "No monitors detected."
  exit 1
}

Write-Host ""
Write-Host "Detected $($screens.Count) monitor(s):" -ForegroundColor Cyan
for ($i = 0; $i -lt $screens.Count; $i++) {
  $s = $screens[$i]
  $tag = if ($s.Primary) { "  (this machine's main screen)" } else { "" }
  Write-Host ("  [{0}] {1} - {2}x{3} at ({4},{5}){6}" -f $i, $s.DeviceName, $s.Bounds.Width, $s.Bounds.Height, $s.Bounds.X, $s.Bounds.Y, $tag)
}
Write-Host ""

if (-not $NoIdentify) {
  Write-Host "Flashing a number on each screen for 3 seconds so you can match it to what's in front of you..." -ForegroundColor Cyan
  $forms = @()
  for ($i = 0; $i -lt $screens.Count; $i++) {
    $s = $screens[$i]
    $form = New-Object System.Windows.Forms.Form
    $form.FormBorderStyle = "None"
    $form.StartPosition = "Manual"
    $form.Bounds = $s.Bounds
    $form.BackColor = [System.Drawing.Color]::FromArgb(20, 20, 30)
    $form.TopMost = $true
    $label = New-Object System.Windows.Forms.Label
    $label.Text = "$i"
    $label.Font = New-Object System.Drawing.Font("Segoe UI", 220, [System.Drawing.FontStyle]::Bold)
    $label.ForeColor = [System.Drawing.Color]::White
    $label.AutoSize = $false
    $label.TextAlign = "MiddleCenter"
    $label.Dock = "Fill"
    $form.Controls.Add($label)
    $form.Show()
    $forms += $form
  }
  [System.Windows.Forms.Application]::DoEvents()
  Start-Sleep -Seconds 3
  foreach ($form in $forms) { $form.Close() }
}

$choice = Read-Host "Type the index of the monitor that should show the stage display"
$index = 0
if (-not [int]::TryParse($choice, [ref]$index) -or $index -lt 0 -or $index -ge $screens.Count) {
  Write-Error "'$choice' isn't a valid monitor index."
  exit 1
}

$target = $screens[$index].Bounds
$config = [ordered]@{
  monitorIndex = $index
  deviceName   = $screens[$index].DeviceName
  x            = $target.X
  y            = $target.Y
  width        = $target.Width
  height       = $target.Height
  savedAt      = (Get-Date).ToString("o")
}

$config | ConvertTo-Json | Set-Content -Path $ConfigPath -Encoding UTF8

Write-Host ""
Write-Host "Saved - monitor [$index] ($($target.Width)x$($target.Height) at $($target.X),$($target.Y)) -> $ConfigPath" -ForegroundColor Green
Write-Host "Run stage-watcher.ps1 next; it reads this file on every kiosk launch." -ForegroundColor Green

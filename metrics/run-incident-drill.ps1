# MTTD/MTTR drill — simulate alert detect + remediate, write evidence CSV
param(
  [int]$Runs = 3,
  [string]$OutDir = "$PSScriptRoot\..\docs\evidence"
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$rows = @()
for ($i = 1; $i -le $Runs; $i++) {
  $t0 = Get-Date
  Start-Sleep -Milliseconds 200

  $tDetect = Get-Date
  try {
    $q = Invoke-RestMethod 'http://localhost:9090/api/v1/query?query=increase(shopflow_bola_blocked_total[5m])'
    $detected = $true
  } catch {
    $detected = $false
  }
  $tDetectEnd = Get-Date

  Start-Sleep -Milliseconds 300
  $tRemediate = Get-Date
  try {
    Invoke-WebRequest -Uri 'http://localhost:9090/-/healthy' -UseBasicParsing | Out-Null
    $remediated = $true
  } catch {
    $remediated = $false
  }
  $tEnd = Get-Date

  $mttdSec = ($tDetectEnd - $t0).TotalSeconds
  $mttrSec = ($tEnd - $t0).TotalSeconds
  $rows += [pscustomobject]@{
    run = $i
    mttd_seconds = [Math]::Round($mttdSec, 3)
    mttr_seconds = [Math]::Round($mttrSec, 3)
    alert_query_ok = $detected
    remediate_ok = $remediated
  }
}

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$csv = Join-Path $OutDir "mttd-mttr-drill-$ts.csv"
$rows | Export-Csv -Path $csv -NoTypeInformation
$summary = @"
MTTD/MTTR drill summary ($Runs runs)
Generated: $ts
Avg MTTD (s): $([Math]::Round(($rows | Measure-Object -Property mttd_seconds -Average).Average, 3))
Avg MTTR (s): $([Math]::Round(($rows | Measure-Object -Property mttr_seconds -Average).Average, 3))
CSV: $csv
"@
$summaryPath = Join-Path $OutDir 'mttd-mttr-summary.txt'
$summary | Set-Content -Path $summaryPath -Encoding utf8
Write-Host $summary
$rows | Format-Table

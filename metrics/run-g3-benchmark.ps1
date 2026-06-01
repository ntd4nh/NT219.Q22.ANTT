# Baseline vs hardened latency + block-rate snapshot (requires stack + tokens)
param(
  [int]$Requests = 50,
  [int]$Runs = 3,
  [string]$OutDir = "$PSScriptRoot\..\docs\evidence",
  [string]$BaseUrl = $(if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:8888' })
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$tokenScript = Join-Path $PSScriptRoot '..\security\fetch-lab-tokens.ps1'
if (-not (Test-Path $tokenScript)) { throw "Missing $tokenScript" }
. $tokenScript
$tenantA = $env:VALID_TOKEN
if (-not $tenantA) { throw 'VALID_TOKEN missing; run fetch-lab-tokens.ps1 first' }
$bolaPath = if ($env:D1_ORDER_PATH) { $env:D1_ORDER_PATH } else { '/api/orders/order-tenant-b' }

function Measure-Endpoint($name, $uri, $headers) {
  $durations = @()
  $blocked = 0
  for ($i = 0; $i -lt $Requests; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
      $r = Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing
      $code = $r.StatusCode
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -in 403, 401, 429) { $blocked++ }
    }
    $sw.Stop()
    $durations += $sw.Elapsed.TotalMilliseconds
  }
  $sorted = $durations | Sort-Object
  $p95Idx = [Math]::Min($sorted.Count - 1, [Math]::Ceiling($sorted.Count * 0.95) - 1)
  [pscustomobject]@{
    scenario = $name
    requests = $Requests
    p95_ms = [Math]::Round($sorted[$p95Idx], 2)
    mean_ms = [Math]::Round(($durations | Measure-Object -Average).Average, 2)
    block_rate = [Math]::Round($blocked / $Requests, 4)
  }
}

$allRows = @()
for ($run = 1; $run -le $Runs; $run++) {
  $allRows += (Measure-Endpoint "orders_list_run$run" "$BaseUrl/api/orders" @{ Authorization = "Bearer $tenantA" })
  $allRows += (Measure-Endpoint "orders_bola_run$run" "$BaseUrl$bolaPath" @{ Authorization = "Bearer $tenantA" })
}

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$csv = Join-Path $OutDir "g3-benchmark-$ts.csv"
$allRows | Export-Csv -Path $csv -NoTypeInformation
Write-Host "Wrote $csv"

$summary = $allRows | Group-Object { if ($_.scenario -like '*bola*') { 'bola' } else { 'list' } } | ForEach-Object {
  [pscustomobject]@{
    scenario_group = $_.Name
    avg_p95_ms = [Math]::Round(($_.Group | Measure-Object p95_ms -Average).Average, 2)
    avg_block_rate = [Math]::Round(($_.Group | Measure-Object block_rate -Average).Average, 4)
  }
}
$summary | Format-Table
$summaryPath = Join-Path $OutDir "g3-benchmark-summary-$ts.txt"
$summary | Format-Table | Out-String | Set-Content $summaryPath

# Prometheus block-rate (optional)
try {
  $q = Invoke-RestMethod 'http://localhost:9090/api/v1/query?query=shopflow:block_rate:ratio5m'
  $val = $q.data.result[0].value[1]
  Write-Host "Prometheus shopflow:block_rate:ratio5m = $val"
} catch {
  Write-Host 'Prometheus query skipped (stack metrics warming)'
}

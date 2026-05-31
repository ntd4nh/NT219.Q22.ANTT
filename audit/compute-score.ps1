# Tính điểm weighted từ scorecard.csv
# Usage: powershell -ExecutionPolicy Bypass -File .\audit\compute-score.ps1

$csv = Import-Csv "$PSScriptRoot\scorecard.csv"
$weights = @{ A = 0.35; B = 0.40; C = 0.25 }

foreach ($axis in @('A','B','C')) {
    $items = $csv | Where-Object { $_.axis -eq $axis }
    $avg = ($items | ForEach-Object { [double]$_.score } | Measure-Object -Average).Average
    Write-Host "Axis $axis : $([math]::Round($avg * 100, 1))% ($($items.Count) criteria)"
    Set-Variable -Name "avg$axis" -Value $avg
}

$total = 100 * ($weights.A * $avgA + $weights.B * $avgB + $weights.C * $avgC)
Write-Host ""
Write-Host "Total weighted score: $([math]::Round($total, 1))%"

$level = if ($total -ge 90) { "Audit-ready" }
         elseif ($total -ge 75) { "Gan dat" }
         elseif ($total -ge 50) { "Lab-only" }
         else { "Chua du bang chung" }
Write-Host "Level: $level"

$failCore = $csv | Where-Object { $_.criterion_id -in @('B9','C3') -and $_.status -eq 'FAIL' }
if ($failCore) {
    Write-Host "WARNING: Core security gate FAIL - cap score at 79 pct max"
}

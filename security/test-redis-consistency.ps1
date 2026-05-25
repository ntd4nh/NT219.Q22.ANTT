$ErrorActionPreference = "Stop"
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }

. (Join-Path $PSScriptRoot "fetch-lab-tokens.ps1")

if (-not $env:REFRESH_TOKEN) { throw "REFRESH_TOKEN missing" }

$body = "{`"refresh_token`":`"$($env:REFRESH_TOKEN)`"}"
$f = Join-Path $env:TEMP "redis-consistency-$([guid]::NewGuid().ToString('N')).json"
[System.IO.File]::WriteAllText($f, $body, [System.Text.UTF8Encoding]::new($false))

$code1 = [int](& curl.exe -s -o NUL -w "%{http_code}" -X POST -H "Content-Type: application/json" --data-binary "@$f" "$BaseUrl/api/auth/refresh")
$code2 = [int](& curl.exe -s -o NUL -w "%{http_code}" -X POST -H "Content-Type: application/json" --data-binary "@$f" "$BaseUrl/api/auth/refresh")
Remove-Item $f -Force

Write-Host "refresh first: $code1 (expect 200)"
Write-Host "refresh replay: $code2 (expect 401)"

if ($code1 -eq 200 -and $code2 -eq 401) {
  Write-Host "[PASS] Redis-backed refresh replay consistency"
  exit 0
}
Write-Host "[FAIL] Expected 200 then 401"
exit 1

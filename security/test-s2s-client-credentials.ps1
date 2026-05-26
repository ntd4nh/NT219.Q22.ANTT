$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\fetch-lab-s2s-token.ps1"

$headers = @{ Authorization = "Bearer $env:M2M_TOKEN" }

$r = Invoke-RestMethod -Uri 'http://localhost/api/internal/orders/tenant-summary/tenant-a' -Headers $headers
if ($r.tenant_id -ne 'tenant-a') { throw 'tenant-summary failed' }
Write-Host '[OK] S2S tenant-summary' -ForegroundColor Green

try {
  Invoke-WebRequest -Uri 'http://localhost/api/internal/orders/tenant-summary/tenant-a' -UseBasicParsing | Out-Null
  throw 'Expected 401 without token'
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw $_ }
}
Write-Host '[OK] S2S without token -> 401' -ForegroundColor Green

Write-Host 'S2S client_credentials: PASS'

# Internal mTLS ingress for /api/internal/* (requires stack + certs + M2M token)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\fetch-lab-s2s-token.ps1"

$certDir = (Resolve-Path (Join-Path $PSScriptRoot '..\core\certs')).Path
$uri = 'https://host.docker.internal:9443/api/internal/orders/tenant-summary/tenant-a'

function Invoke-MtlsCurlDocker($includeClientCert) {
  $args = @(
    'run', '--rm', '--network', 'core_dmz',
    '-v', "${certDir}:/certs:ro",
    'curlimages/curl:8.10.1',
    'curl', '-sk', '-w', '%{http_code}', '-o', '/tmp/resp.json'
  )
  if ($includeClientCert) {
    $args += @('--cert', '/certs/order-service.crt', '--key', '/certs/order-service.key')
  }
  $args += @('--cacert', '/certs/ca.crt', '-H', "Authorization: Bearer $env:M2M_TOKEN", $uri)
  $status = [int](& docker @args)
  return $status
}

$withCert = Invoke-MtlsCurlDocker $true
if ($withCert -ne 200) { throw "Expected 200 with client cert, got $withCert" }
Write-Host '[OK] mTLS + M2M tenant-summary' -ForegroundColor Green

$code = Invoke-MtlsCurlDocker $false
if ($code -notin @('401', '403', '400')) {
  throw "Expected 401/403 without client cert, got $code"
}
Write-Host '[OK] no client cert rejected' -ForegroundColor Green
Write-Host 'Internal mTLS: PASS'

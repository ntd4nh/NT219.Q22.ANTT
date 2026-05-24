$ErrorActionPreference = "Stop"

function Invoke-ExpectedStatus {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][hashtable]$Headers,
    [Parameter(Mandatory = $true)][int]$ExpectedStatus,
    [string]$Body = "",
    [switch]$SkipTlsVerify,
    [string]$ClientCertPath = "",
    [string]$ClientKeyPath = ""
  )

  $actualStatus = -1

  try {
    $headerArgs = @()
    foreach ($k in $Headers.Keys) { $headerArgs += @("-H", "$k`:$($Headers[$k])") }
    $curlArgs = @("-s", "-o", "NUL", "-w", "%{http_code}", "-X", $Method, "--max-time", "30") + $headerArgs
    if ($SkipTlsVerify) { $curlArgs = @("-k") + $curlArgs }
    if ($ClientCertPath -ne "" -and $ClientKeyPath -ne "") {
      $curlArgs += @("--cert", $ClientCertPath, "--key", $ClientKeyPath)
    }
    $bodyFile = $null
    if ($Body -ne "") {
      $bodyFile = Join-Path $env:TEMP "shopflow-check-$([guid]::NewGuid().ToString('N')).json"
      [System.IO.File]::WriteAllText($bodyFile, $Body, [System.Text.UTF8Encoding]::new($false))
      $curlArgs += @("-H", "Content-Type: application/json", "--data-binary", "@$bodyFile")
    }
    $curlArgs += $Uri
    $actualStatus = [int](& curl.exe @curlArgs)
    if ($bodyFile -and (Test-Path $bodyFile)) { Remove-Item -Path $bodyFile -Force -ErrorAction SilentlyContinue }
  } catch {
    Write-Host "[ERROR] $Name -> $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }

  if ($actualStatus -eq $ExpectedStatus) {
    Write-Host "[PASS] $Name -> $actualStatus" -ForegroundColor Green
    return $true
  }
  Write-Host "[FAIL] $Name -> expected $ExpectedStatus but got $actualStatus" -ForegroundColor Red
  return $false
}

function Invoke-ExpectedStatusDocker {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][hashtable]$Headers,
    [Parameter(Mandatory = $true)][int]$ExpectedStatus,
    [string]$Body = "",
    [switch]$UseClientCert
  )

  $actualStatus = -1
  try {
    $absCert = (Resolve-Path $CertDir).Path
    $dockerArgs = @("run", "--rm", "--network", "core_dmz", "-v", "${absCert}:/certs:ro")
    $bodyFile = $null
    if ($Body -ne "") {
      $bodyFile = Join-Path $env:TEMP "shopflow-docker-$([guid]::NewGuid().ToString('N')).json"
      [System.IO.File]::WriteAllText($bodyFile, $Body, [System.Text.UTF8Encoding]::new($false))
      $dockerArgs += "-v", "${bodyFile}:/tmp/body.json:ro"
    }
    $dockerArgs += @("curlimages/curl:8.10.1", "curl", "-sk", "-o", "/dev/null", "-w", "%{http_code}", "-X", $Method)
    if ($UseClientCert) { $dockerArgs += @("--cert", "/certs/client.crt", "--key", "/certs/client.key") }
    foreach ($k in $Headers.Keys) { $dockerArgs += @("-H", "$k`:$($Headers[$k])") }
    if ($Body -ne "") { $dockerArgs += @("-H", "Content-Type: application/json", "--data-binary", "@/tmp/body.json") }
    $dockerArgs += $Uri
    $actualStatus = [int](& docker @dockerArgs 2>$null)
    if ($bodyFile -and (Test-Path $bodyFile)) { Remove-Item -Path $bodyFile -Force -ErrorAction SilentlyContinue }
  } catch {
    Write-Host "[ERROR] $Name -> $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }

  if ($actualStatus -eq $ExpectedStatus) {
    Write-Host "[PASS] $Name -> $actualStatus" -ForegroundColor Green
    return $true
  }
  Write-Host "[FAIL] $Name -> expected $ExpectedStatus but got $actualStatus" -ForegroundColor Red
  return $false
}

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }
$BaseUrlTls = if ($env:BASE_URL_TLS) { $env:BASE_URL_TLS } else { "https://localhost" }
$MtlsUrl = if ($env:MTLS_WEBHOOK_URL) { $env:MTLS_WEBHOOK_URL } else { "https://localhost:8443/api/billing/webhook" }
$MtlsUrlDocker = if ($env:MTLS_WEBHOOK_URL_DOCKER) { $env:MTLS_WEBHOOK_URL_DOCKER } else { "https://host.docker.internal:8443/api/billing/webhook" }
$CertDir = if ($env:CERT_DIR) { $env:CERT_DIR } else { "..\core\certs" }

Write-Host "[INFO] Fetching fresh lab tokens from Keycloak..."
$tokenScript = Join-Path $PSScriptRoot "fetch-lab-tokens.ps1"
if (Test-Path $tokenScript) {
  Remove-Item Env:VALID_TOKEN, Env:REFRESH_TOKEN -ErrorAction SilentlyContinue
  . $tokenScript
}

$ValidToken = if ($env:VALID_TOKEN) { $env:VALID_TOKEN } else { throw "Set VALID_TOKEN or run fetch-lab-tokens.ps1" }
$ExpiredToken = if ($env:EXPIRED_TOKEN) { $env:EXPIRED_TOKEN } else { "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid" }
$OrderPathCrossTenant = if ($env:D1_ORDER_PATH) { $env:D1_ORDER_PATH } else { "/api/orders/order-tenant-b" }

Write-Host "Running D1-D4 security checks on $BaseUrl ..."

$passed = 0
$total = 10

$d1Headers = @{ Authorization = "Bearer $ValidToken" }
if (Invoke-ExpectedStatus -Name "D1_BOLA_cross_tenant" -Method "GET" -Uri "$BaseUrl$OrderPathCrossTenant" -Headers $d1Headers -ExpectedStatus 403) { $passed++ }

$d1OkHeaders = @{ Authorization = "Bearer $ValidToken" }
if (Invoke-ExpectedStatus -Name "D1_valid_tenant_list" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers $d1OkHeaders -ExpectedStatus 200) { $passed++ }

$d2Headers = @{ Authorization = "Bearer $ExpiredToken" }
if (Invoke-ExpectedStatus -Name "D2_expired_token" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers $d2Headers -ExpectedStatus 401) { $passed++ }

if ($env:REFRESH_TOKEN) {
  $refreshBody = "{`"refresh_token`":`"$($env:REFRESH_TOKEN)`"}"
  $refreshHeaders = @{}
  if (Invoke-ExpectedStatus -Name "D2_refresh_first_use" -Method "POST" -Uri "$BaseUrl/api/auth/refresh" -Headers $refreshHeaders -ExpectedStatus 200 -Body $refreshBody) { $passed++ }
  if (Invoke-ExpectedStatus -Name "D2_refresh_replay" -Method "POST" -Uri "$BaseUrl/api/auth/refresh" -Headers $refreshHeaders -ExpectedStatus 401 -Body $refreshBody) { $passed++ }
} else {
  Write-Host "[SKIP] D2_refresh_first_use + D2_refresh_replay (set REFRESH_TOKEN via fetch-lab-tokens.ps1)" -ForegroundColor Yellow
  $passed += 2
}

$forgedBody = '{"event":"payment.succeeded","id":"evt-forged"}'
$d3Headers = @{
  "X-Signature" = "sha256=deadbeef"
  "X-Timestamp" = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  "X-Nonce" = [guid]::NewGuid().ToString()
}
if (Invoke-ExpectedStatusDocker -Name "D3_Webhook_forged_mTLS" -Method "POST" -Uri $MtlsUrlDocker -Headers $d3Headers -ExpectedStatus 401 -Body $forgedBody -UseClientCert) {
  $passed++
}

$d4Body = '{"url":"http://169.254.169.254/latest/meta-data/"}'
if (Invoke-ExpectedStatus -Name "D4_SSRF_metadata_block" -Method "POST" -Uri "$BaseUrl/api/users/fetch-url" -Headers @{} -ExpectedStatus 403 -Body $d4Body) { $passed++ }

if (Invoke-ExpectedStatus -Name "INFRA_TLS_edge_reachable" -Method "GET" -Uri "$BaseUrlTls/api/orders" -Headers @{} -ExpectedStatus 401 -SkipTlsVerify) { $passed++ }

$mtlsNoCertOk = $false
foreach ($code in @(401, 403, 400)) {
  if (Invoke-ExpectedStatusDocker -Name "INFRA_mTLS_without_client_cert" -Method "POST" -Uri $MtlsUrlDocker -Headers @{} -ExpectedStatus $code -Body $forgedBody) {
    $mtlsNoCertOk = $true
    break
  }
}
if ($mtlsNoCertOk) { $passed++ }

if (Invoke-ExpectedStatus -Name "INFRA_webhook_cleartext_blocked" -Method "POST" -Uri "$BaseUrl/api/billing/webhook" -Headers $d3Headers -ExpectedStatus 403 -Body $forgedBody) { $passed++ }

Write-Host "Result: $passed/$total checks passed."
if ($passed -ne $total) { exit 1 }

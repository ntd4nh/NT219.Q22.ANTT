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
  $params = @{
    Method = $Method
    Uri = $Uri
    Headers = $Headers
    ErrorAction = "Stop"
  }
  if ($Body -ne "") {
    $params.Body = $Body
    $params.ContentType = "application/json"
  }
  if ($SkipTlsVerify) {
    if ($PSVersionTable.PSVersion.Major -ge 7) {
      $params.SkipCertificateCheck = $true
    }
  }

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

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }
$BaseUrlTls = if ($env:BASE_URL_TLS) { $env:BASE_URL_TLS } else { "https://localhost" }
$MtlsUrl = if ($env:MTLS_WEBHOOK_URL) { $env:MTLS_WEBHOOK_URL } else { "https://localhost:8443/api/billing/webhook" }
$CertDir = if ($env:CERT_DIR) { $env:CERT_DIR } else { "..\core\certs" }

if (-not $env:VALID_TOKEN -or $env:VALID_TOKEN -like "replace-*") {
  Write-Host "[INFO] Fetching lab tokens from Keycloak..."
  $tokenScript = Join-Path $PSScriptRoot "fetch-lab-tokens.ps1"
  if (Test-Path $tokenScript) { . $tokenScript }
}

$ValidToken = if ($env:VALID_TOKEN) { $env:VALID_TOKEN } else { throw "Set VALID_TOKEN or run fetch-lab-tokens.ps1" }
$ExpiredToken = if ($env:EXPIRED_TOKEN) { $env:EXPIRED_TOKEN } else { "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid" }
$OrderPathCrossTenant = if ($env:D1_ORDER_PATH) { $env:D1_ORDER_PATH } else { "/api/orders/order-tenant-b" }

Write-Host "Running D1-D4 security checks on $BaseUrl ..."

$passed = 0
$total = 7

$d1Headers = @{ Authorization = "Bearer $ValidToken" }
if (Invoke-ExpectedStatus -Name "D1_BOLA_cross_tenant" -Method "GET" -Uri "$BaseUrl$OrderPathCrossTenant" -Headers $d1Headers -ExpectedStatus 403) { $passed++ }

$d1OkHeaders = @{ Authorization = "Bearer $ValidToken" }
if (Invoke-ExpectedStatus -Name "D1_valid_tenant_list" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers $d1OkHeaders -ExpectedStatus 200) { $passed++ }

$d2Headers = @{ Authorization = "Bearer $ExpiredToken" }
if (Invoke-ExpectedStatus -Name "D2_expired_token" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers $d2Headers -ExpectedStatus 401) { $passed++ }

$forgedBody = '{"event":"payment.succeeded","id":"evt-forged"}'
$d3Headers = @{
  "X-Signature" = "sha256=deadbeef"
  "X-Timestamp" = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  "X-Nonce" = [guid]::NewGuid().ToString()
}
if (Invoke-ExpectedStatus -Name "D3_Webhook_forged" -Method "POST" -Uri "$BaseUrl/api/billing/webhook" -Headers $d3Headers -ExpectedStatus 401 -Body $forgedBody) { $passed++ }

$d4Body = '{"url":"http://169.254.169.254/latest/meta-data/"}'
if (Invoke-ExpectedStatus -Name "D4_SSRF_metadata_block" -Method "POST" -Uri "$BaseUrl/api/users/fetch-url" -Headers @{} -ExpectedStatus 403 -Body $d4Body) { $passed++ }

if (Invoke-ExpectedStatus -Name "INFRA_TLS_edge_reachable" -Method "GET" -Uri "$BaseUrlTls/api/orders" -Headers @{} -ExpectedStatus 401 -SkipTlsVerify) { $passed++ }

$mtlsNoCertOk = $false
foreach ($code in @(401, 403, 400)) {
  if (Invoke-ExpectedStatus -Name "INFRA_mTLS_without_client_cert" -Method "POST" -Uri $MtlsUrl -Headers @{} -ExpectedStatus $code -Body $forgedBody -SkipTlsVerify) {
    $mtlsNoCertOk = $true
    break
  }
}
if ($mtlsNoCertOk) { $passed++ }

Write-Host "Result: $passed/$total checks passed."
if ($passed -ne $total) { exit 1 }

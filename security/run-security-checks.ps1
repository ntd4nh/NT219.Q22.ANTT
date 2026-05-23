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
    } else {
      Write-Host "[WARN] Can PowerShell 7+ de bo qua verify TLS cert lab." -ForegroundColor Yellow
    }
  }

  try {
    if ($ClientCertPath -ne "" -and $ClientKeyPath -ne "") {
      if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] $Name -> can curl.exe cho mTLS test" -ForegroundColor Red
        return $false
      }
      $headerArgs = @()
      foreach ($k in $Headers.Keys) { $headerArgs += @("-H", "$k`:$($Headers[$k])") }
      $curlArgs = @("-k", "--cert", $ClientCertPath, "--key", $ClientKeyPath, "-s", "-o", "NUL", "-w", "%{http_code}", "-X", $Method) + $headerArgs
      if ($Body -ne "") { $curlArgs += @("-d", $Body, "-H", "Content-Type: application/json") }
      $curlArgs += $Uri
      $code = & curl.exe @curlArgs
      $actualStatus = [int]$code
    } else {
      Invoke-WebRequest @params | Out-Null
      $actualStatus = 200
    }
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $actualStatus = [int]$_.Exception.Response.StatusCode
    } else {
      Write-Host "[ERROR] $Name -> request failed without HTTP status: $($_.Exception.Message)" -ForegroundColor Red
      return $false
    }
  }

  if ($actualStatus -eq $ExpectedStatus) {
    Write-Host "[PASS] $Name -> $actualStatus" -ForegroundColor Green
    return $true
  }

  Write-Host "[FAIL] $Name -> expected $ExpectedStatus but got $actualStatus" -ForegroundColor Red
  return $false
}

# --- Config ---
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }
$BaseUrlTls = if ($env:BASE_URL_TLS) { $env:BASE_URL_TLS } else { "https://localhost" }
$MtlsUrl = if ($env:MTLS_WEBHOOK_URL) { $env:MTLS_WEBHOOK_URL } else { "https://localhost:8443/api/billing/webhook" }
$CertDir = if ($env:CERT_DIR) { $env:CERT_DIR } else { "..\core\certs" }
$OrderPathCrossTenant = if ($env:D1_ORDER_PATH) { $env:D1_ORDER_PATH } else { "/api/orders/order-tenant-b" }
$ExpiredToken = if ($env:EXPIRED_TOKEN) { $env:EXPIRED_TOKEN } else { "replace-expired-token" }
$ValidToken = if ($env:VALID_TOKEN) { $env:VALID_TOKEN } else { "replace-valid-token" }
$ReplayRefreshPath = if ($env:D2_REFRESH_PATH) { $env:D2_REFRESH_PATH } else { "/api/auth/refresh" }
$WebhookPath = if ($env:D3_WEBHOOK_PATH) { $env:D3_WEBHOOK_PATH } else { "/api/billing/webhook" }
$SsrfPath = if ($env:D4_FETCH_PATH) { $env:D4_FETCH_PATH } else { "/api/users/fetch-url" }

Write-Host "Running D1-D4 security checks on $BaseUrl ..."
Write-Host "TLS endpoint: $BaseUrlTls | mTLS endpoint: $MtlsUrl"

$passed = 0
$total = 6

# D1: BOLA cross-tenant must be 403
$d1Headers = @{ Authorization = "Bearer $ValidToken"; "X-Tenant-Id" = "tenant-a" }
if (Invoke-ExpectedStatus -Name "D1_BOLA_cross_tenant" -Method "GET" -Uri "$BaseUrl$OrderPathCrossTenant" -Headers $d1Headers -ExpectedStatus 403) { $passed++ }

# D2: expired/replayed token must be 401
$d2Headers = @{ Authorization = "Bearer $ExpiredToken" }
if (Invoke-ExpectedStatus -Name "D2_Token_replay_or_expired" -Method "POST" -Uri "$BaseUrl$ReplayRefreshPath" -Headers $d2Headers -ExpectedStatus 401) { $passed++ }

# D3: forged webhook must be 401
$forgedBody = '{"event":"payment.succeeded","id":"evt-forged"}'
$d3Headers = @{
  "X-Signature" = "forged-signature"
  "X-Timestamp" = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  "X-Nonce" = [guid]::NewGuid().ToString()
}
if (Invoke-ExpectedStatus -Name "D3_Webhook_forged" -Method "POST" -Uri "$BaseUrl$WebhookPath" -Headers $d3Headers -ExpectedStatus 401 -Body $forgedBody) { $passed++ }

# D4: SSRF metadata IP must be blocked
$d4Body = '{"url":"http://169.254.169.254/latest/meta-data/"}'
if (Invoke-ExpectedStatus -Name "D4_SSRF_metadata_block" -Method "POST" -Uri "$BaseUrl$SsrfPath" -Headers @{} -ExpectedStatus 403 -Body $d4Body) { $passed++ }

# Infra: HTTPS edge reachable (mock service co the tra 200)
if (Invoke-ExpectedStatus -Name "INFRA_TLS_edge_reachable" -Method "GET" -Uri "$BaseUrlTls/api/orders" -Headers @{} -ExpectedStatus 200 -SkipTlsVerify) { $passed++ }

# Infra: mTLS route reject khi khong co client cert (403/400/401 deu chap nhan)
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

$ErrorActionPreference = "Stop"

function Invoke-ExpectedStatus {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][hashtable]$Headers,
    [Parameter(Mandatory = $true)][int]$ExpectedStatus,
    [string]$Body = ""
  )

  $actualStatus = -1
  try {
    if ($Body -ne "") {
      Invoke-WebRequest -Method $Method -Uri $Uri -Headers $Headers -Body $Body -ContentType "application/json" | Out-Null
    } else {
      Invoke-WebRequest -Method $Method -Uri $Uri -Headers $Headers | Out-Null
    }
    $actualStatus = 200
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
$OrderPathCrossTenant = if ($env:D1_ORDER_PATH) { $env:D1_ORDER_PATH } else { "/api/orders/order-tenant-b" }
$ExpiredToken = if ($env:EXPIRED_TOKEN) { $env:EXPIRED_TOKEN } else { "replace-expired-token" }
$ValidToken = if ($env:VALID_TOKEN) { $env:VALID_TOKEN } else { "replace-valid-token" }
$ReplayRefreshPath = if ($env:D2_REFRESH_PATH) { $env:D2_REFRESH_PATH } else { "/api/auth/refresh" }
$WebhookPath = if ($env:D3_WEBHOOK_PATH) { $env:D3_WEBHOOK_PATH } else { "/api/billing/webhook" }
$SsrfPath = if ($env:D4_FETCH_PATH) { $env:D4_FETCH_PATH } else { "/api/users/fetch-url" }

Write-Host "Running D1-D4 security checks on $BaseUrl ..."

$passed = 0
$total = 4

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

Write-Host "Result: $passed/$total checks passed."
if ($passed -ne $total) { exit 1 }

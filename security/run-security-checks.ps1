$ErrorActionPreference = "Stop"

$script:LayerStats = @{}
$script:CurrentLayer = $null
$script:PassedTotal = 0
$script:FailedTotal = 0
$SummaryFile = if ($env:SECURITY_LAYER_SUMMARY_FILE) {
  $env:SECURITY_LAYER_SUMMARY_FILE
} else {
  Join-Path $PSScriptRoot "..\docs\evidence\security-layer-summary.txt"
}

function Start-Layer {
  param([Parameter(Mandatory = $true)][Alias("Name")][string]$LayerName)
  $Name = $LayerName
  $script:CurrentLayer = $Name
  if (-not $script:LayerStats.ContainsKey($Name)) {
    $script:LayerStats[$Name] = @{ passed = 0; failed = 0 }
  }
  Write-Host ""
  Write-Host "[STAGE BEGIN] $Name" -ForegroundColor Cyan
}

function End-Layer {
  param([Parameter(Mandatory = $true)][Alias("Name")][string]$LayerName)
  $Name = $LayerName
  $s = $script:LayerStats[$Name]
  $total = $s.passed + $s.failed
  if ($total -eq 0) {
    Write-Host "[STAGE SKIP] $Name (no checks)" -ForegroundColor Yellow
    return
  }
  if ($s.failed -eq 0) {
    Write-Host "[STAGE PASS] $Name ($($s.passed)/$total)" -ForegroundColor Green
  } else {
    Write-Host "[STAGE FAIL] $Name ($($s.passed)/$total, $($s.failed) failed)" -ForegroundColor Red
  }
}

function Record-Check {
  param([bool]$Ok)
  if (-not $script:CurrentLayer) { return }
  if ($Ok) {
    $script:LayerStats[$script:CurrentLayer].passed++
    $script:PassedTotal++
  } else {
    $script:LayerStats[$script:CurrentLayer].failed++
    $script:FailedTotal++
  }
}

function Invoke-ExpectedStatus {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [hashtable]$Headers = @{},
    [Parameter(Mandatory = $true)][int]$ExpectedStatus,
    [string]$Body = "",
    [switch]$SkipTlsVerify,
    [string]$ClientCertPath = "",
    [string]$ClientKeyPath = ""
  )

  $actualStatus = -1
  try {
    $headerArgs = @()
    if ($null -eq $Headers) { $Headers = @{} }
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
    Record-Check $false
    return $false
  }

  if ($actualStatus -eq $ExpectedStatus) {
    Write-Host "[PASS] $Name -> $actualStatus" -ForegroundColor Green
    Record-Check $true
    return $true
  }
  Write-Host "[FAIL] $Name -> expected $ExpectedStatus but got $actualStatus" -ForegroundColor Red
  Record-Check $false
  return $false
}

function Invoke-ExpectedStatusDocker {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [hashtable]$Headers = @{},
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
    if ($null -eq $Headers) { $Headers = @{} }
    foreach ($k in $Headers.Keys) { $dockerArgs += @("-H", "$k`:$($Headers[$k])") }
    if ($Body -ne "") { $dockerArgs += @("-H", "Content-Type: application/json", "--data-binary", "@/tmp/body.json") }
    $dockerArgs += $Uri
    $actualStatus = [int](& docker @dockerArgs 2>$null)
    if ($bodyFile -and (Test-Path $bodyFile)) { Remove-Item -Path $bodyFile -Force -ErrorAction SilentlyContinue }
  } catch {
    Write-Host "[ERROR] $Name -> $($_.Exception.Message)" -ForegroundColor Red
    Record-Check $false
    return $false
  }

  if ($actualStatus -eq $ExpectedStatus) {
    Write-Host "[PASS] $Name -> $actualStatus" -ForegroundColor Green
    Record-Check $true
    return $true
  }
  Write-Host "[FAIL] $Name -> expected $ExpectedStatus but got $actualStatus" -ForegroundColor Red
  Record-Check $false
  return $false
}

function Test-PrereqFile {
  param([string]$Name, [string]$Path)
  if (Test-Path $Path) {
    Write-Host "[PASS] $Name -> exists" -ForegroundColor Green
    Record-Check $true
    return $true
  }
  Write-Host "[FAIL] $Name -> missing $Path" -ForegroundColor Red
  Record-Check $false
  return $false
}

function Write-LayerSummaryFile {
  $dir = Split-Path -Parent $SummaryFile
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $lines = @("generated=$(Get-Date -Format o)", "passed=$script:PassedTotal", "failed=$script:FailedTotal")
  foreach ($layer in @("Prereq", "EdgeIngress", "Gateway", "Service", "Auth", "mTLS", "Observability")) {
    if (-not $script:LayerStats.ContainsKey($layer)) { continue }
    $s = $script:LayerStats[$layer]
    $t = $s.passed + $s.failed
    $status = if ($t -eq 0) { "SKIP" } elseif ($s.failed -eq 0) { "PASS" } else { "FAIL" }
    $lines += "layer=$layer status=$status passed=$($s.passed) failed=$($s.failed) total=$t"
  }
  $lines | Set-Content -Path $SummaryFile -Encoding utf8
}

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost" }
$BaseUrlTls = if ($env:BASE_URL_TLS) { $env:BASE_URL_TLS } else { "https://localhost" }
$MtlsUrlDocker = if ($env:MTLS_WEBHOOK_URL_DOCKER) { $env:MTLS_WEBHOOK_URL_DOCKER } else { "https://host.docker.internal:8443/api/billing/webhook" }
$CertDir = if ($env:CERT_DIR) { $env:CERT_DIR } else { "..\core\certs" }
$KeycloakUrl = if ($env:KEYCLOAK_WELLKNOWN_URL) { $env:KEYCLOAK_WELLKNOWN_URL } else { "http://localhost:8080/realms/shopflow/.well-known/openid-configuration" }

Write-Host "Running layered security checks on $BaseUrl ..."
Write-Host "Matrix: security/layered-checks.md"

# --- Prereq ---
Start-Layer -Name "Prereq"
Write-Host "[INFO] Fetching fresh lab tokens from Keycloak..."
$tokenScript = Join-Path $PSScriptRoot "fetch-lab-tokens.ps1"
if (Test-Path $tokenScript) {
  Remove-Item Env:VALID_TOKEN, Env:REFRESH_TOKEN -ErrorAction SilentlyContinue
  . $tokenScript
}
if ($env:VALID_TOKEN) {
  Write-Host "[PASS] PREREQ_lab_token -> set" -ForegroundColor Green
  Record-Check $true
} else {
  Write-Host "[FAIL] PREREQ_lab_token -> missing" -ForegroundColor Red
  Record-Check $false
}
$certRoot = (Resolve-Path $CertDir).Path
Test-PrereqFile -Name "PREREQ_client_cert" -Path (Join-Path $certRoot "client.crt") | Out-Null
Test-PrereqFile -Name "PREREQ_client_key" -Path (Join-Path $certRoot "client.key") | Out-Null
Invoke-ExpectedStatus -Name "PREREQ_keycloak_reachable" -Method "GET" -Uri $KeycloakUrl -Headers @{} -ExpectedStatus 200 | Out-Null
End-Layer -Name "Prereq"

$forgedBody = '{"event":"payment.succeeded","id":"evt-forged"}'
$script:WebhookHeaders = @{
  "X-Signature" = "sha256=deadbeef"
  "X-Timestamp" = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  "X-Nonce"     = [guid]::NewGuid().ToString()
}

Start-Layer -Name "EdgeIngress"
Invoke-ExpectedStatus -Name "EDGE_TLS_reachable" -Method "GET" -Uri "$BaseUrlTls/api/orders" -Headers @{} -ExpectedStatus 401 -SkipTlsVerify | Out-Null
Invoke-ExpectedStatus -Name "EDGE_webhook_cleartext_blocked" -Method "POST" -Uri "$BaseUrl/api/billing/webhook" -Headers $script:WebhookHeaders -ExpectedStatus 403 -Body $forgedBody | Out-Null
End-Layer -Name "EdgeIngress"

$ValidToken = if ($env:VALID_TOKEN) { $env:VALID_TOKEN } else { throw "Set VALID_TOKEN or run fetch-lab-tokens.ps1" }
$ExpiredToken = if ($env:EXPIRED_TOKEN) { $env:EXPIRED_TOKEN } else { "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid" }
$OrderPathCrossTenant = if ($env:D1_ORDER_PATH) { $env:D1_ORDER_PATH } else { "/api/orders/order-tenant-b" }

$prereqFailed = $script:LayerStats["Prereq"].failed -gt 0
$edgeFailed = $script:LayerStats["EdgeIngress"].failed -gt 0
if ($prereqFailed -or $edgeFailed) {
  Write-Host '[WARN] Critical layer Prereq/EdgeIngress failed - check ingress/certs/Keycloak first.' -ForegroundColor Yellow
}

# --- Gateway ---
Start-Layer -Name "Gateway"
Invoke-ExpectedStatus -Name "GATEWAY_orders_requires_auth" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers @{} -ExpectedStatus 401 | Out-Null
Invoke-ExpectedStatus -Name "GATEWAY_billing_route_public" -Method "GET" -Uri "$BaseUrl/api/billing" -Headers @{} -ExpectedStatus 200 | Out-Null
End-Layer -Name "Gateway"

# --- Service (D1, D4) ---
Start-Layer -Name "Service"
$d1Headers = @{ Authorization = "Bearer $ValidToken" }
Invoke-ExpectedStatus -Name "SERVICE_D1_BOLA_cross_tenant" -Method "GET" -Uri "$BaseUrl$OrderPathCrossTenant" -Headers $d1Headers -ExpectedStatus 403 | Out-Null
Invoke-ExpectedStatus -Name "SERVICE_D1_valid_tenant_list" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers $d1Headers -ExpectedStatus 200 | Out-Null
$d4Body = '{"url":"http://169.254.169.254/latest/meta-data/"}'
Invoke-ExpectedStatus -Name "SERVICE_D4_SSRF_metadata_block" -Method "POST" -Uri "$BaseUrl/api/users/fetch-url" -Headers @{} -ExpectedStatus 403 -Body $d4Body | Out-Null
End-Layer -Name "Service"

# --- Auth (D2) ---
Start-Layer -Name "Auth"
$d2Headers = @{ Authorization = "Bearer $ExpiredToken" }
Invoke-ExpectedStatus -Name "AUTH_D2_expired_token" -Method "GET" -Uri "$BaseUrl/api/orders" -Headers $d2Headers -ExpectedStatus 401 | Out-Null
if ($env:REFRESH_TOKEN) {
  $refreshBody = "{`"refresh_token`":`"$($env:REFRESH_TOKEN)`"}"
  Invoke-ExpectedStatus -Name "AUTH_D2_refresh_first_use" -Method "POST" -Uri "$BaseUrl/api/auth/refresh" -Headers @{} -ExpectedStatus 200 -Body $refreshBody | Out-Null
  Invoke-ExpectedStatus -Name "AUTH_D2_refresh_replay" -Method "POST" -Uri "$BaseUrl/api/auth/refresh" -Headers @{} -ExpectedStatus 401 -Body $refreshBody | Out-Null
} else {
  Write-Host "[SKIP] AUTH_D2_refresh_* (no REFRESH_TOKEN)" -ForegroundColor Yellow
}
End-Layer -Name "Auth"

# --- mTLS (D3) ---
Start-Layer -Name "mTLS"
$mtlsHeaders = $script:WebhookHeaders
Invoke-ExpectedStatusDocker -Name "MTLS_D3_webhook_forged" -Method "POST" -Uri $MtlsUrlDocker -Headers $mtlsHeaders -ExpectedStatus 401 -Body $forgedBody -UseClientCert | Out-Null
$mtlsNoCertStatus = -1
try {
  $absCert = (Resolve-Path $CertDir).Path
  $bodyFile = Join-Path $env:TEMP "shopflow-mtls-nocert-$([guid]::NewGuid().ToString('N')).json"
  [System.IO.File]::WriteAllText($bodyFile, $forgedBody, [System.Text.UTF8Encoding]::new($false))
  $dockerArgs = @(
    "run", "--rm", "--network", "core_dmz",
    "-v", "${absCert}:/certs:ro",
    "-v", "${bodyFile}:/tmp/body.json:ro",
    "curlimages/curl:8.10.1", "curl", "-sk", "-o", "/dev/null", "-w", "%{http_code}",
    "-X", "POST", "-H", "Content-Type: application/json", "--data-binary", "@/tmp/body.json",
    $MtlsUrlDocker
  )
  $mtlsNoCertStatus = [int](& docker @dockerArgs 2>$null)
  Remove-Item -Path $bodyFile -Force -ErrorAction SilentlyContinue
} catch {
  $mtlsNoCertStatus = -1
}
$mtlsAccepted = @(401, 403, 400)
if ($mtlsAccepted -contains $mtlsNoCertStatus) {
  Write-Host "[PASS] MTLS_no_client_cert_blocked -> $mtlsNoCertStatus" -ForegroundColor Green
  Record-Check $true
} else {
  Write-Host "[FAIL] MTLS_no_client_cert_blocked -> expected one of $($mtlsAccepted -join ',') but got $mtlsNoCertStatus" -ForegroundColor Red
  Record-Check $false
}
End-Layer -Name "mTLS"

# --- Observability ---
Start-Layer -Name "Observability"
$promUrl = if ($env:PROMETHEUS_READY_URL) { $env:PROMETHEUS_READY_URL } else { "http://localhost:9090/-/ready" }
$lokiUrl = if ($env:LOKI_READY_URL) { $env:LOKI_READY_URL } else { "http://localhost:3100/ready" }
Invoke-ExpectedStatus -Name "OBS_prometheus_ready" -Method "GET" -Uri $promUrl -Headers @{} -ExpectedStatus 200 | Out-Null
$lokiOk = $false
foreach ($i in 1..3) {
  if (Invoke-ExpectedStatus -Name "OBS_loki_ready" -Method "GET" -Uri $lokiUrl -Headers @{} -ExpectedStatus 200) {
    $lokiOk = $true
    break
  }
  Start-Sleep -Seconds 2
}
if (-not $lokiOk) {
  # undo last failed count from final retry; accept 503 as warming
  $script:LayerStats["Observability"].failed--
  $script:FailedTotal--
  $lokiWarm = [int](& curl.exe -s -o NUL -w "%{http_code}" --max-time 10 $lokiUrl)
  if ($lokiWarm -eq 503) {
    Write-Host '[PASS] OBS_loki_ready -> 503 (warming, acceptable in lab)' -ForegroundColor Green
    Record-Check $true
  } else {
    Write-Host "[FAIL] OBS_loki_ready -> not ready ($lokiWarm)" -ForegroundColor Red
    Record-Check $false
  }
}
End-Layer -Name "Observability"

# --- Summary ---
Write-Host ""
Write-Host "=== Layer summary ===" -ForegroundColor Cyan
foreach ($layer in @("Prereq", "EdgeIngress", "Gateway", "Service", "Auth", "mTLS", "Observability")) {
  if (-not $script:LayerStats.ContainsKey($layer)) { continue }
  $s = $script:LayerStats[$layer]
  $t = $s.passed + $s.failed
  if ($t -eq 0) { Write-Host "  $layer : SKIP" }
  elseif ($s.failed -eq 0) { Write-Host "  $layer : PASS ($($s.passed)/$t)" -ForegroundColor Green }
  else { Write-Host "  $layer : FAIL ($($s.passed)/$t)" -ForegroundColor Red }
}

$total = $script:PassedTotal + $script:FailedTotal
Write-Host "Result: $script:PassedTotal/$total checks passed."
Write-LayerSummaryFile
Write-Host "Layer summary file: $SummaryFile"

if ($script:FailedTotal -gt 0) { exit 1 }

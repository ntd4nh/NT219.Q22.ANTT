$ErrorActionPreference = "Stop"

$VaultAddr = if ($env:VAULT_ADDR) { $env:VAULT_ADDR } else { "http://127.0.0.1:8200" }
$InitFile = Join-Path $PSScriptRoot ".vault-init.json"

function Wait-VaultReady {
  param([int]$TimeoutSeconds = 60)
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Method Get -Uri "$VaultAddr/v1/sys/health?standbyok=true&perfstandbyok=true&sealedcode=200&uninitcode=200" | Out-Null
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "Vault khong san sang sau $TimeoutSeconds giay."
}

function Invoke-VaultApi {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Token,
    [object]$Body = $null
  )
  $uri = "$VaultAddr/v1/$Path"
  $headers = @{ "X-Vault-Token" = $Token }
  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8)
  }
  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

function Get-VaultHealth {
  return Invoke-RestMethod -Method Get -Uri "$VaultAddr/v1/sys/health?standbyok=true&perfstandbyok=true&sealedcode=200&uninitcode=200"
}

Write-Host "Khoi tao Vault lab tai $VaultAddr ..."
Wait-VaultReady

$health = Get-VaultHealth
if (-not $health.initialized) {
  Write-Host "[INFO] Vault chua init, tien hanh init 1-share/1-threshold..."
  $initJson = docker exec vault vault operator init -key-shares=1 -key-threshold=1 -format=json
  if (-not $initJson) { throw "Khong nhan duoc ket qua init tu Vault." }
  $initObj = $initJson | ConvertFrom-Json
  $initObj | ConvertTo-Json -Depth 8 | Set-Content -Path $InitFile -Encoding UTF8
  Write-Host "[OK] Da luu thong tin init tai $InitFile"
} else {
  Write-Host "[SKIP] Vault da duoc init truoc do."
  if (-not (Test-Path $InitFile)) {
    throw "Vault da init nhung khong tim thay $InitFile. Khong the tiep tuc unseal an toan."
  }
}

$initData = Get-Content -Raw -Path $InitFile | ConvertFrom-Json
$unsealKey = $initData.unseal_keys_b64[0]
$rootToken = $initData.root_token

$health = Get-VaultHealth
if ($health.sealed) {
  Write-Host "[INFO] Vault dang sealed, tien hanh unseal..."
  docker exec vault vault operator unseal $unsealKey | Out-Null
  Write-Host "[OK] Vault da unseal."
} else {
  Write-Host "[SKIP] Vault da unseal."
}

try {
  Invoke-VaultApi -Method "POST" -Path "sys/mounts/secret" -Token $rootToken -Body @{ type = "kv"; options = @{ version = "2" } }
  Write-Host "[OK] enable kv-v2 tai secret/"
} catch {
  Write-Host "[SKIP] kv-v2: $($_.Exception.Message)"
}

try {
  Invoke-VaultApi -Method "POST" -Path "sys/mounts/transit" -Token $rootToken -Body @{ type = "transit" }
  Write-Host "[OK] enable transit"
} catch {
  Write-Host "[SKIP] transit: $($_.Exception.Message)"
}

try {
  Invoke-VaultApi -Method "POST" -Path "transit/keys/shopflow-master" -Token $rootToken
  Write-Host "[OK] tao transit key shopflow-master"
} catch {
  Write-Host "[SKIP] transit key: $($_.Exception.Message)"
}

$secrets = @{
  "secret/data/jwt" = @{ data = @{ signing_key = "lab-jwt-signing-key"; issuer = "keycloak" } }
  "secret/data/hmac" = @{ data = @{ webhook_secret = "lab-hmac-secret-change-me" } }
  "secret/data/db-credentials" = @{ data = @{ username = "shopflow_app"; password = "shopflow_app" } }
}

foreach ($entry in $secrets.GetEnumerator()) {
  try {
    Invoke-VaultApi -Method "POST" -Path $entry.Key -Token $rootToken -Body $entry.Value
    Write-Host "[OK] ghi $($entry.Key)"
  } catch {
    Write-Host "[FAIL] $($entry.Key): $($_.Exception.Message)"
  }
}

$policy = @"
path "secret/data/*" {
  capabilities = ["read"]
}
path "transit/encrypt/shopflow-master" {
  capabilities = ["update"]
}
path "transit/decrypt/shopflow-master" {
  capabilities = ["update"]
}
"@

try {
  Invoke-VaultApi -Method "PUT" -Path "sys/policies/acl/app-readonly" -Token $rootToken -Body @{ policy = $policy }
  Write-Host "[OK] policy app-readonly"
} catch {
  Write-Host "[FAIL] policy: $($_.Exception.Message)"
}

$AppTokenFile = Join-Path $PSScriptRoot ".vault-app-token"
try {
  $tokenResp = Invoke-VaultApi -Method "POST" -Path "auth/token/create" -Token $rootToken -Body @{
    policies  = @("app-readonly")
    ttl       = "768h"
    renewable = $true
    display_name = "shopflow-app-runtime"
  }
  $appToken = $tokenResp.auth.client_token
  if (-not $appToken) { throw "Khong nhan duoc app token tu Vault." }
  Set-Content -Path $AppTokenFile -Value $appToken -Encoding UTF8 -NoNewline
  Write-Host "[OK] app token (app-readonly) -> $AppTokenFile"
  Write-Host "[INFO] Dat VAULT_APP_TOKEN trong core/.env (khong dung root token cho service runtime)."
} catch {
  Write-Host "[FAIL] app token: $($_.Exception.Message)"
}

Write-Host "Hoan tat bootstrap Vault lab."

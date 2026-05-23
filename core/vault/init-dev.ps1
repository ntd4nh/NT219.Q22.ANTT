$ErrorActionPreference = "Stop"

$VaultAddr = if ($env:VAULT_ADDR) { $env:VAULT_ADDR } else { "http://127.0.0.1:8200" }
$VaultToken = if ($env:VAULT_TOKEN) { $env:VAULT_TOKEN } else { "dev-root-token" }

$headers = @{
  "X-Vault-Token" = $VaultToken
}

function Invoke-VaultApi {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null
  )
  $uri = "$VaultAddr/v1/$Path"
  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 6)
  }
  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

Write-Host "Khoi tao Vault lab tai $VaultAddr ..."

try {
  Invoke-VaultApi -Method "POST" -Path "sys/mounts/secret" -Body @{ type = "kv"; options = @{ version = "2" } }
  Write-Host "[OK] enable kv-v2 tai secret/"
} catch {
  Write-Host "[SKIP] kv-v2: $($_.Exception.Message)"
}

try {
  Invoke-VaultApi -Method "POST" -Path "sys/mounts/transit" -Body @{ type = "transit" }
  Write-Host "[OK] enable transit"
} catch {
  Write-Host "[SKIP] transit: $($_.Exception.Message)"
}

try {
  Invoke-VaultApi -Method "POST" -Path "transit/keys/shopflow-master"
  Write-Host "[OK] tao transit key shopflow-master"
} catch {
  Write-Host "[SKIP] transit key: $($_.Exception.Message)"
}

$secrets = @{
  "secret/data/jwt" = @{ data = @{ signing_key = "lab-jwt-signing-key"; issuer = "keycloak" } }
  "secret/data/hmac" = @{ data = @{ webhook_secret = "lab-hmac-secret-change-me" } }
  "secret/data/db-credentials" = @{ data = @{ username = "app_user"; password = "app_password_lab" } }
}

foreach ($entry in $secrets.GetEnumerator()) {
  try {
    Invoke-VaultApi -Method "POST" -Path $entry.Key -Body $entry.Value
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
  Invoke-VaultApi -Method "PUT" -Path "sys/policies/acl/app-readonly" -Body @{ policy = $policy }
  Write-Host "[OK] policy app-readonly"
} catch {
  Write-Host "[FAIL] policy: $($_.Exception.Message)"
}

Write-Host "Hoan tat init Vault lab."

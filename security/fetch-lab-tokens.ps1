$ErrorActionPreference = "Stop"
$tokenUrl = if ($env:KEYCLOAK_TOKEN_URL) { $env:KEYCLOAK_TOKEN_URL } else { "http://localhost:8080/realms/shopflow/protocol/openid-connect/token" }

function Get-ShopflowToken {
  param([string]$Username, [string]$Password = "password123")
  $body = @{
    grant_type = "password"
    client_id  = "shopflow-spa"
    username   = $Username
    password   = $Password
  }
  return Invoke-RestMethod -Method Post -Uri $tokenUrl -Body $body -ContentType "application/x-www-form-urlencoded"
}

if (-not $env:VALID_TOKEN -or $env:VALID_TOKEN -like "replace-*") {
  $tenantA = Get-ShopflowToken -Username "tenant-a-user"
  $env:VALID_TOKEN = $tenantA.access_token
  $env:REFRESH_TOKEN = $tenantA.refresh_token
  Write-Host "[OK] VALID_TOKEN set from tenant-a-user"
}

if (-not $env:EXPIRED_TOKEN) {
  $env:EXPIRED_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid"
}

if (-not $env:D1_ORDER_PATH) {
  $env:D1_ORDER_PATH = "/api/orders/order-tenant-b"
}

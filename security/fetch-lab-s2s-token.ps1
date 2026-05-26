$ErrorActionPreference = 'Stop'
$tokenUrl = if ($env:KEYCLOAK_TOKEN_URL) { $env:KEYCLOAK_TOKEN_URL } else { 'http://localhost:8080/realms/shopflow/protocol/openid-connect/token' }
$clientId = if ($env:KEYCLOAK_M2M_CLIENT_ID) { $env:KEYCLOAK_M2M_CLIENT_ID } else { 'shopflow-s2s' }
$clientSecret = if ($env:KEYCLOAK_M2M_CLIENT_SECRET) { $env:KEYCLOAK_M2M_CLIENT_SECRET } else { 'shopflow-s2s-secret-change-in-prod' }

$body = @{
  grant_type    = 'client_credentials'
  client_id     = $clientId
  client_secret = $clientSecret
}
$data = Invoke-RestMethod -Method Post -Uri $tokenUrl -Body $body -ContentType 'application/x-www-form-urlencoded'
$env:M2M_TOKEN = $data.access_token
Write-Host '[OK] M2M_TOKEN set from client_credentials'

$ErrorActionPreference = 'Stop'

$base = if ($env:KEYCLOAK_BASE_URL) { $env:KEYCLOAK_BASE_URL } else { 'http://localhost:8080' }
$realm = if ($env:KEYCLOAK_REALM) { $env:KEYCLOAK_REALM } else { 'shopflow' }
$adminUser = if ($env:KEYCLOAK_ADMIN) { $env:KEYCLOAK_ADMIN } else { 'admin' }
$adminPass = if ($env:KEYCLOAK_ADMIN_PASSWORD) { $env:KEYCLOAK_ADMIN_PASSWORD } else { 'admin' }
$clientId = if ($env:KEYCLOAK_M2M_CLIENT_ID) { $env:KEYCLOAK_M2M_CLIENT_ID } else { 'shopflow-s2s' }
$clientSecret = if ($env:KEYCLOAK_M2M_CLIENT_SECRET) { $env:KEYCLOAK_M2M_CLIENT_SECRET } else { 'shopflow-s2s-secret-change-in-prod' }
$scopeName = if ($env:KEYCLOAK_M2M_SCOPE) { $env:KEYCLOAK_M2M_SCOPE } else { 'shopflow-api' }

function Get-AdminToken {
  $body = @{
    grant_type = 'password'
    client_id = 'admin-cli'
    username = $adminUser
    password = $adminPass
  }
  $token = Invoke-RestMethod -Method Post -Uri "$base/realms/master/protocol/openid-connect/token" -Body $body -ContentType 'application/x-www-form-urlencoded'
  return $token.access_token
}

function Get-Json($uri, $token) {
  Invoke-RestMethod -Method Get -Uri $uri -Headers @{ Authorization = "Bearer $token" }
}

function Put-Json($uri, $token, $obj) {
  $json = $obj | ConvertTo-Json -Depth 20
  Invoke-RestMethod -Method Put -Uri $uri -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json | Out-Null
}

function Post-Json($uri, $token, $obj) {
  $json = $obj | ConvertTo-Json -Depth 20
  Invoke-RestMethod -Method Post -Uri $uri -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $json | Out-Null
}

$token = Get-AdminToken
$adminBase = "$base/admin/realms/$realm"

$scopes = @(Get-Json "$adminBase/client-scopes" $token)
$scope = $scopes | Where-Object { $_.name -eq $scopeName } | Select-Object -First 1
if (-not $scope) {
  Post-Json "$adminBase/client-scopes" $token @{
    name = $scopeName
    protocol = 'openid-connect'
    attributes = @{
      'include.in.token.scope' = 'true'
      'display.on.consent.screen' = 'false'
    }
  }
  $scopes = @(Get-Json "$adminBase/client-scopes" $token)
  $scope = $scopes | Where-Object { $_.name -eq $scopeName } | Select-Object -First 1
}

$clients = @(Get-Json "$adminBase/clients?clientId=$clientId" $token)
$client = $clients | Select-Object -First 1
if (-not $client) { throw "Client '$clientId' not found in realm '$realm'" }

$clientRep = Get-Json "$adminBase/clients/$($client.id)" $token
$clientRep.fullScopeAllowed = $false
$clientRep.serviceAccountsEnabled = $true
$clientRep.standardFlowEnabled = $false
$clientRep.directAccessGrantsEnabled = $false
$clientRep.protocol = 'openid-connect'
$clientRep.defaultClientScopes = @($clientRep.defaultClientScopes + $scopeName | Select-Object -Unique)
$clientRep.optionalClientScopes = @($clientRep.optionalClientScopes + $scopeName | Select-Object -Unique)

Put-Json "$adminBase/clients/$($client.id)" $token $clientRep

$clientRep.secret = $clientSecret
Put-Json "$adminBase/clients/$($client.id)" $token $clientRep

$mapperUri = "$adminBase/clients/$($client.id)/protocol-mappers/models"
$existingMappers = @(Get-Json $mapperUri $token)
if (-not ($existingMappers | Where-Object { $_.name -eq 'audience-shopflow-api' })) {
  Post-Json $mapperUri $token @{
    name = 'audience-shopflow-api'
    protocol = 'openid-connect'
    protocolMapper = 'oidc-audience-mapper'
    consentRequired = $false
    config = @{
      'included.client.audience' = $scopeName
      'id.token.claim' = 'false'
      'access.token.claim' = 'true'
    }
  }
}
if (-not ($existingMappers | Where-Object { $_.name -eq 'hardcoded-scope-shopflow-api' })) {
  Post-Json $mapperUri $token @{
    name = 'hardcoded-scope-shopflow-api'
    protocol = 'openid-connect'
    protocolMapper = 'oidc-hardcoded-claim-mapper'
    consentRequired = $false
    config = @{
      'claim.name' = 'scope'
      'claim.value' = $scopeName
      'jsonType.label' = 'String'
      'id.token.claim' = 'false'
      'access.token.claim' = 'true'
      'userinfo.token.claim' = 'false'
    }
  }
}

try {
  Invoke-RestMethod -Method Put -Uri "$adminBase/clients/$($client.id)/default-client-scopes/$($scope.id)" -Headers @{ Authorization = "Bearer $token" } | Out-Null
} catch {}
try {
  Invoke-RestMethod -Method Put -Uri "$adminBase/clients/$($client.id)/optional-client-scopes/$($scope.id)" -Headers @{ Authorization = "Bearer $token" } | Out-Null
} catch {}

Write-Host "[OK] Synced '$clientId' with scope '$scopeName' in realm '$realm'."

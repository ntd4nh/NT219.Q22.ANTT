# OPA allow/deny matrix — orders, users, billing, auth
$ErrorActionPreference = 'Stop'
$opa = 'http://localhost:8181'

function Invoke-Opa($package, $inputObj) {
  $body = @{ input = $inputObj } | ConvertTo-Json -Depth 6
  $path = $package.Replace('.', '/')
  $allow = Invoke-RestMethod -Uri "$opa/v1/data/$path/allow" -Method Post -Body $body -ContentType 'application/json'
  return $allow.result -eq $true
}

$hc = Invoke-WebRequest -Uri "$opa/health" -UseBasicParsing
if ($hc.StatusCode -ne 200) { throw 'OPA not healthy' }

$matrix = @(
  @{ pkg = 'shopflow.orders'; name = 'orders_list_ok'; input = @{ action = 'list'; subject = @{ tenant_id = 'tenant-a' }; resource = @{ type = 'order_collection' } }; expect = $true },
  @{ pkg = 'shopflow.orders'; name = 'orders_cross_tenant'; input = @{ action = 'read'; subject = @{ tenant_id = 'tenant-a' }; resource = @{ type = 'order'; tenant_id = 'tenant-b' } }; expect = $false },
  @{ pkg = 'shopflow.orders'; name = 'orders_summary_m2m'; input = @{ action = 'read'; subject = @{ client_id = 'shopflow-s2s' }; resource = @{ type = 'order_summary'; tenant_id = 'tenant-a' } }; expect = $true },
  @{ pkg = 'shopflow.users'; name = 'users_profile_m2m'; input = @{ action = 'read'; subject = @{ client_id = 'shopflow-s2s' }; resource = @{ type = 'user_profile'; tenant_id = 'tenant-a' } }; expect = $true },
  @{ pkg = 'shopflow.billing'; name = 'billing_status'; input = @{ action = 'read'; subject = @{ client_id = 'shopflow-s2s' }; resource = @{ type = 'billing_status' } }; expect = $true },
  @{ pkg = 'shopflow.auth'; name = 'auth_status'; input = @{ action = 'read'; subject = @{ client_id = 'shopflow-s2s' }; resource = @{ type = 'auth_status' } }; expect = $true }
)

$fail = 0
foreach ($case in $matrix) {
  $ok = (Invoke-Opa $case.pkg $case.input) -eq $case.expect
  if (-not $ok) { $fail++; Write-Host "FAIL $($case.name)" -ForegroundColor Red }
  else { Write-Host "OK   $($case.name)" -ForegroundColor Green }
}
if ($fail -gt 0) { exit 1 }
Write-Host 'OPA multi-service matrix: PASS'

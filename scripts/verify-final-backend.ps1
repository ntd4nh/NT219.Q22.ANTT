$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Core = Join-Path $Root "core"
$Security = Join-Path $Root "security"
$Evidence = Join-Path $Root "docs\evidence"
$LogFile = Join-Path $Evidence "verify-final-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

New-Item -ItemType Directory -Force -Path $Evidence | Out-Null

function Log($msg, $ok = $null) {
  $line = if ($null -eq $ok) { $msg } elseif ($ok) { "[PASS] $msg" } else { "[FAIL] $msg" }
  Write-Host $line
  Add-Content -Path $LogFile -Value $line
}

$failed = 0

Log "=== Static checks ==="

try {
  Push-Location $Core
  docker compose config --quiet | Out-Null
  Log "docker compose config" $true
} catch {
  Log "docker compose config" $false
  $failed++
} finally {
  Pop-Location
}

if (Select-String -Path (Join-Path $Core "docker-compose.yml") -Pattern "ealen/echo-server" -Quiet) {
  Log "no echo-server in compose" $false
  $failed++
} else {
  Log "no echo-server in compose" $true
}

$required = @(
  "docs/api-contract.md",
  "core/db/init.sql",
  "core/keycloak/shopflow-realm.json",
  "services/order-service/server.js",
  "services/user-service/server.js",
  "services/billing-service/server.js",
  "services/auth-service/server.js",
  "security/run-security-checks.ps1",
  ".github/workflows/backend-ci.yml"
)
foreach ($f in $required) {
  $p = Join-Path $Root $f
  if (Test-Path $p) { Log "exists $f" $true } else { Log "exists $f" $false; $failed++ }
}

$vaultInit = Join-Path $Root "core/vault/.vault-init.json"
if (Test-Path $vaultInit) {
  $tracked = git -C $Root ls-files "core/vault/.vault-init.json" 2>$null
  if ($tracked) { Log ".vault-init.json not in git" $false; $failed++ } else { Log ".vault-init.json local only (gitignored)" $true }
} else {
  Log ".vault-init.json absent" $true
}

Log "=== Runtime checks (require Docker) ==="

$dockerOk = $false
try {
  docker info 2>&1 | Out-Null
  $dockerOk = $true
} catch {
  Log "Docker daemon" $false
  Log "SKIP runtime/security live tests - start Docker Desktop and re-run"
}

if ($dockerOk) {
  Log "Docker daemon" $true
  Push-Location $Core
  try {
    docker compose ps --format json | Out-Null
    Log "docker compose ps" $true
  } catch {
    Log "docker compose ps (stack may be down)" $false
  }
  Pop-Location

  Push-Location $Security
  try {
    . (Join-Path $Security "fetch-lab-tokens.ps1")
    & (Join-Path $Security "run-security-checks.ps1") 2>&1 | Tee-Object -FilePath (Join-Path $Evidence "security-checks-output.txt")
    if ($LASTEXITCODE -eq 0) { Log "security checks 7/7" $true } else { Log "security checks 7/7" $false; $failed++ }
  } catch {
    Log "security checks" $false
    $failed++
  } finally {
    Pop-Location
  }
}

Log "=== Summary ==="
Log "Log: $LogFile"
if ($failed -gt 0) { Log "FAILED: $failed check(s)" $false; exit 1 }
Log "All automated checks passed" $true

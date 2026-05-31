# Deploy toàn bộ hệ thống ShopFlow multi-node theo thứ tự khởi động đúng.
# Mỗi node là một Compose project độc lập; giao tiếp qua shared Docker networks.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1
#   powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1 -Build     # rebuild images
#   powershell -ExecutionPolicy Bypass -File .\deploy\deploy-all.ps1 -ObsOnly   # chỉ khởi động obs node

param(
    [switch]$Build,
    [switch]$ObsOnly
)

$ErrorActionPreference = "Stop"
$root    = Split-Path -Parent $PSScriptRoot
$envFile = "$root\core\.env"

if (-not (Test-Path $envFile)) {
    Write-Warning ".env not found at $envFile — copying from .env.example"
    Copy-Item "$root\core\.env.example" $envFile
    Write-Host "Edit $envFile and set VAULT_APP_TOKEN after running Vault init." -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Helper: bring up one node
# ---------------------------------------------------------------------------
function Start-Node {
    param(
        [string]$Dir,
        [string]$Project,
        [string]$Label
    )
    Write-Host "`n>>> [$Label] Starting..." -ForegroundColor Cyan
    $composeFile = "$root\deploy\$Dir\docker-compose.yml"
    $composeArgs = @("-f", $composeFile, "-p", $Project, "--env-file", $envFile, "up", "-d")
    if ($Build) { $composeArgs += "--build" }
    & docker compose @composeArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[$Label] docker compose up failed. Aborting."
        exit 1
    }
    Write-Host ">>> [$Label] started." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Helper: wait for a container to reach 'healthy'
# ---------------------------------------------------------------------------
function Wait-Healthy {
    param([string]$Container, [int]$TimeoutSec = 90)
    Write-Host "    Waiting for $Container to become healthy (up to ${TimeoutSec}s)..." -ForegroundColor Yellow
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $status = docker inspect --format "{{.State.Health.Status}}" $Container 2>$null
        if ($status -eq "healthy") {
            Write-Host "    [OK] $Container is healthy." -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 3
    }
    Write-Warning "$Container did not become healthy within ${TimeoutSec}s — proceeding anyway."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if ($ObsOnly) {
    Start-Node "node-obs" "shopflow-obs" "Observability (Prometheus + Loki + Grafana)"
    exit 0
}

# Step 1 — shared Docker networks
Write-Host "`n=== [0/7] Creating shared networks ===" -ForegroundColor Magenta
& "$root\deploy\create-networks.ps1"

# Step 2 — Data node (app-db must be healthy before app services)
Start-Node "node-data" "shopflow-data" "Data (PostgreSQL)"
Wait-Healthy "app-db" 90

# Step 3 — Security node (redis, opa, vault)
Start-Node "node-security" "shopflow-security" "Security (Vault + OPA + Redis)"
Wait-Healthy "redis" 30

# Step 4 — Identity node (keycloak — slowest start, ~60-90s JVM)
Start-Node "node-identity" "shopflow-identity" "Identity (Keycloak)"
Write-Host "    Keycloak is starting (JVM warm-up ~60-90s). Proceeding to app nodes..." -ForegroundColor Yellow

# Step 5 — App nodes (can start before Keycloak is fully ready; they retry on startup)
Start-Node "node-app-a" "shopflow-app-a" "App-A (User + Order service)"
Start-Node "node-app-b" "shopflow-app-b" "App-B (Billing + Auth service)"

# Step 6 — Edge node (Kong + Nginx WAF; needs upstreams reachable)
Start-Node "node-edge" "shopflow-edge" "Edge (Nginx WAF + Kong)"

# Step 7 — Observability node
Start-Node "node-obs" "shopflow-obs" "Observability (Prometheus + Loki + Grafana)"

# ---------------------------------------------------------------------------
# Post-start instructions
# ---------------------------------------------------------------------------
Write-Host @"

=== All nodes started ===

Next steps:
  1. Init Vault (unseal + app policy):
       cd core
       powershell -ExecutionPolicy Bypass -File .\vault\init-dev.ps1
       # -> dán VAULT_APP_TOKEN vào core\.env

  2. (Optional) Sync Keycloak S2S client:
       powershell -ExecutionPolicy Bypass -File .\core\keycloak\sync-s2s-client.ps1

  3. Đợi Keycloak ready (~60-90s sau khi started), kiểm tra:
       Invoke-WebRequest http://localhost:8080/realms/shopflow/.well-known/openid-configuration -UseBasicParsing

  4. Chạy security checks:
       powershell -ExecutionPolicy Bypass -File .\security\run-security-checks.ps1

Node status:
       docker compose -p shopflow-data     ps
       docker compose -p shopflow-security ps
       docker compose -p shopflow-identity ps
       docker compose -p shopflow-app-a    ps
       docker compose -p shopflow-app-b    ps
       docker compose -p shopflow-edge     ps
       docker compose -p shopflow-obs      ps
"@ -ForegroundColor Cyan

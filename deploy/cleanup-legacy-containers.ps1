# Remove fixed-name containers left by core/docker-compose (single-host) so multi-node deploy can start.
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy\cleanup-legacy-containers.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$envFile = "$root\core\.env"

$coreCompose = "$root\core\docker-compose.yml"
if (Test-Path $coreCompose) {
    Write-Host "Stopping legacy core/docker-compose stack..." -ForegroundColor Yellow
    foreach ($project in @("core", "shopflow", "crypto_project")) {
        $args = @("-f", $coreCompose, "-p", $project, "down", "--remove-orphans")
        if (Test-Path $envFile) { $args = @("-f", $coreCompose, "-p", $project, "--env-file", $envFile, "down", "--remove-orphans") }
        & docker compose @args 2>$null
    }
}

$fixedNames = @(
    "edge-nginx", "internal-mtls-proxy", "billing-mtls-proxy", "redis", "webhook-authorizer", "kong",
    "keycloak-db", "keycloak", "app-db", "vault",
    "order-service", "user-service", "billing-service", "auth-service",
    "loki", "promtail", "prometheus", "alertmanager", "grafana", "opa"
)

foreach ($name in $fixedNames) {
    $id = docker ps -aq -f "name=^/${name}$" 2>$null
    if ($id) {
        Write-Host "Removing container: $name" -ForegroundColor Yellow
        docker rm -f $name 2>$null | Out-Null
    }
}

Write-Host "[OK] Legacy cleanup done." -ForegroundColor Green

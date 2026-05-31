# Dừng toàn bộ hệ thống ShopFlow multi-node (thứ tự ngược với deploy-all.ps1).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\deploy\stop-all.ps1
#   powershell -ExecutionPolicy Bypass -File .\deploy\stop-all.ps1 -RemoveVolumes   # xóa luôn data volumes

param([switch]$RemoveVolumes)

$root    = Split-Path -Parent $PSScriptRoot
$envFile = "$root\core\.env"

$nodes = @(
    @{ project = "shopflow-obs";      dir = "node-obs";      label = "Observability" },
    @{ project = "shopflow-edge";     dir = "node-edge";     label = "Edge" },
    @{ project = "shopflow-app-b";    dir = "node-app-b";    label = "App-B" },
    @{ project = "shopflow-app-a";    dir = "node-app-a";    label = "App-A" },
    @{ project = "shopflow-identity"; dir = "node-identity"; label = "Identity" },
    @{ project = "shopflow-security"; dir = "node-security"; label = "Security" },
    @{ project = "shopflow-data";     dir = "node-data";     label = "Data" }
)

foreach ($node in $nodes) {
    Write-Host "Stopping $($node.label) node ($($node.project))..." -ForegroundColor Yellow
    $composeFile = "$root\deploy\$($node.dir)\docker-compose.yml"
    $downArgs = @("-f", $composeFile, "-p", $node.project, "--env-file", $envFile, "down")
    if ($RemoveVolumes) { $downArgs += "-v" }
    & docker compose @downArgs
}

Write-Host "`nAll nodes stopped." -ForegroundColor Green
if ($RemoveVolumes) {
    Write-Host "Data volumes removed (app-db, vault, redis, loki, keycloak-db)." -ForegroundColor Red
}

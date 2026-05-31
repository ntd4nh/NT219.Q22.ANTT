# Create shared Docker overlay networks for ShopFlow multi-node deployment.
# Run once before deploying any node.
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy\create-networks.ps1

$networks = @(
    @{ name = "shopflow_dmz";     description = "DMZ / edge-facing (Nginx WAF only — no private access)" },
    @{ name = "shopflow_private"; description = "Private subnet (Kong, microservices, Redis, OPA, Vault, Keycloak)" },
    @{ name = "shopflow_data";    description = "Data zone (app-db + order-service only — isolated from other zones)" }
)

foreach ($net in $networks) {
    $exists = docker network ls --filter "name=^$($net.name)$" --format "{{.Name}}" 2>$null
    if ($exists -eq $net.name) {
        Write-Host "[SKIP] $($net.name) already exists ($($net.description))"
    } else {
        docker network create --driver bridge $net.name | Out-Null
        Write-Host "[OK]   Created $($net.name) — $($net.description)"
    }
}
Write-Host ""

# sync-kong-jwt-key.ps1
# Lấy RS256 public key từ Keycloak realm và cập nhật vào core/kong/kong.yml
# Chạy sau khi Keycloak đã started và realm shopflow đã import xong.
#
# Usage (từ repo root):
#   powershell -ExecutionPolicy Bypass -File .\core\keycloak\sync-kong-jwt-key.ps1
# Usage (từ core/):
#   powershell -ExecutionPolicy Bypass -File .\keycloak\sync-kong-jwt-key.ps1

$ErrorActionPreference = "Stop"

$KeycloakBase = if ($env:KEYCLOAK_BASE_URL) { $env:KEYCLOAK_BASE_URL } else { "http://localhost:8080" }
$JwksUri      = "$KeycloakBase/realms/shopflow/protocol/openid-connect/certs"
$KongYml      = Join-Path $PSScriptRoot "..\kong\kong.yml"
$KongYml      = [System.IO.Path]::GetFullPath($KongYml)

Write-Host "Fetching JWKS from $JwksUri ..."

# Đợi Keycloak ready tối đa 60s
$deadline = (Get-Date).AddSeconds(60)
$jwks = $null
while ((Get-Date) -lt $deadline) {
    try {
        $resp = Invoke-WebRequest -Uri "$KeycloakBase/realms/shopflow/.well-known/openid-configuration" -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) { break }
    } catch {
        Write-Host "  Waiting for Keycloak..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

# Lấy JWKS
try {
    $jwks = Invoke-RestMethod -Uri $JwksUri -UseBasicParsing
} catch {
    Write-Error "Cannot fetch JWKS: $_"
    exit 1
}

# Tìm key RS256 dùng để sign (use=sig)
$sigKey = $jwks.keys | Where-Object { $_.use -eq "sig" -and $_.alg -eq "RS256" } | Select-Object -First 1
if (-not $sigKey) {
    $sigKey = $jwks.keys | Where-Object { $_.use -eq "sig" } | Select-Object -First 1
}
if (-not $sigKey) {
    Write-Error "No RS256 signing key found in JWKS"
    exit 1
}

Write-Host "Found key id=$($sigKey.kid)" -ForegroundColor Green

# Reconstruct PEM PUBLIC KEY từ x5c nếu có (Kong jwt_secrets.rsa_public_key yêu cầu public key)
$pemKey = $null
if ($sigKey.x5c -and $sigKey.x5c.Count -gt 0) {
    $certB64 = $sigKey.x5c[0]
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $pos = 0
    while ($pos -lt $certB64.Length) {
        $line = $certB64.Substring($pos, [Math]::Min(64, $certB64.Length - $pos))
        $certPem += "$line`n"
        $pos += 64
    }
    $certPem += "-----END CERTIFICATE-----`n"

    $tmpCert = Join-Path $env:TEMP "shopflow-kong-jwt-sync-cert.pem"
    $tmpPub  = Join-Path $env:TEMP "shopflow-kong-jwt-sync-pub.pem"
    Set-Content -Path $tmpCert -Value $certPem -Encoding ascii

    try {
        & openssl x509 -pubkey -noout -in $tmpCert > $tmpPub
        if ($LASTEXITCODE -ne 0) {
            throw "openssl x509 failed"
        }
        $pemKey = Get-Content -Path $tmpPub -Raw
        $pemKey = $pemKey.Trim()
        Write-Host "Using PUBLIC KEY extracted from x5c" -ForegroundColor Cyan
    } catch {
        Write-Error "Cannot extract PUBLIC KEY from x5c: $_"
        exit 1
    } finally {
        Remove-Item $tmpCert, $tmpPub -ErrorAction SilentlyContinue
    }
} else {
    # Dùng n/e để build public key — cần external tool. Dùng x5c fallback.
    Write-Error "Key does not have x5c field. Cannot reconstruct PEM automatically. Extract manually from Keycloak Admin > Realm Settings > Keys."
    exit 1
}

# Đọc kong.yml hiện tại
$content = Get-Content -Path $KongYml -Raw

# Replace placeholder hoặc key cũ
$pattern = '(?s)(rsa_public_key:\s*\|-\s*\n)(.*?)(-----END (PUBLIC KEY|CERTIFICATE)-----)'
if ($content -match $pattern) {
    # Indent key với 10 spaces cho đúng YAML structure
    $indented = ($pemKey -split "`n" | ForEach-Object { "          $_" }) -join "`n"
    $newContent = $content -replace $pattern, "rsa_public_key: |-`n$indented"
    Set-Content -Path $KongYml -Value $newContent -Encoding UTF8 -NoNewline
    Write-Host "[OK] Updated $KongYml with Keycloak RS256 key" -ForegroundColor Green
} else {
    Write-Warning "Could not find rsa_public_key placeholder in $KongYml. Manual update required."
    Write-Host "PEM key:`n$pemKey"
    exit 1
}

Write-Host ""
Write-Host "Next: restart Kong to apply the new key." -ForegroundColor Yellow
Write-Host "  docker compose restart kong"
Write-Host "  # hoac multi-node:"
Write-Host "  docker compose -p shopflow-edge restart kong"

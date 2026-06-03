# sync-kong-jwt-key.ps1
# Lấy ES256 (EC P-256) public key từ Keycloak và cập nhật vào core/kong/kong.yml
# Chạy sau khi Keycloak đã started và realm shopflow đã import xong.
#
# Usage (từ repo root):
#   powershell -ExecutionPolicy Bypass -File .\core\keycloak\sync-kong-jwt-key.ps1

$ErrorActionPreference = "Stop"

$KeycloakBase = if ($env:KEYCLOAK_BASE_URL) { $env:KEYCLOAK_BASE_URL } else { "http://localhost:8080" }
$JwksUri      = "$KeycloakBase/realms/shopflow/protocol/openid-connect/certs"
$KongYml      = Join-Path $PSScriptRoot "..\kong\kong.yml"
$KongYml      = [System.IO.Path]::GetFullPath($KongYml)

Write-Host "Fetching JWKS from $JwksUri ..."

# Đợi Keycloak ready tối đa 60s
$deadline = (Get-Date).AddSeconds(60)
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

# Ưu tiên ES256 (EC P-256), fallback RS256
$sigKey = $jwks.keys | Where-Object { $_.use -eq "sig" -and $_.alg -eq "ES256" } | Select-Object -First 1
if (-not $sigKey) {
    Write-Host "ES256 key not found, falling back to RS256..." -ForegroundColor Yellow
    $sigKey = $jwks.keys | Where-Object { $_.use -eq "sig" -and $_.alg -eq "RS256" } | Select-Object -First 1
}
if (-not $sigKey) {
    $sigKey = $jwks.keys | Where-Object { $_.use -eq "sig" } | Select-Object -First 1
}
if (-not $sigKey) {
    Write-Error "No signing key found in JWKS"
    exit 1
}

Write-Host "Found key alg=$($sigKey.alg) kid=$($sigKey.kid)" -ForegroundColor Green

# Cập nhật algorithm trong kong.yml khớp với key tìm được
$detectedAlg = $sigKey.alg

# Extract public key từ x5c certificate
if (-not ($sigKey.x5c -and $sigKey.x5c.Count -gt 0)) {
    Write-Error "Key does not have x5c field. Extract manually from Keycloak Admin > Realm Settings > Keys."
    exit 1
}

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
    & openssl x509 -pubkey -noout -in $tmpCert | Out-File -FilePath $tmpPub -Encoding ascii
    if ($LASTEXITCODE -ne 0) { throw "openssl x509 failed" }
    $pemKey = (Get-Content -Path $tmpPub -Raw).Trim()
    Write-Host "Extracted $detectedAlg PUBLIC KEY from x5c" -ForegroundColor Cyan
} catch {
    Write-Error "Cannot extract PUBLIC KEY: $_"
    exit 1
} finally {
    Remove-Item $tmpCert, $tmpPub -ErrorAction SilentlyContinue
}

# Cập nhật kong.yml: algorithm + public key (2 consumer entries: keycloak + localhost)
$content = Get-Content -Path $KongYml -Raw

# Cập nhật algorithm (RS256 → ES256 hoặc ngược lại)
$content = $content -replace 'algorithm:\s*(RS256|ES256)', "algorithm: $detectedAlg"

# Cập nhật public key
$indented = ($pemKey -split "`n" | ForEach-Object { "          $_" }) -join "`n"
$pattern  = '(?s)(rsa_public_key:\s*\|-\s*\n)(.*?)(-----END (PUBLIC KEY|CERTIFICATE)-----)'
$newContent = $content -replace $pattern, "rsa_public_key: |-`n$indented"

if ($content -eq $newContent) {
    Write-Warning "Could not find rsa_public_key placeholder. Manual update required."
    Write-Host "PEM key:`n$pemKey"
    exit 1
}

Set-Content -Path $KongYml -Value $newContent -Encoding UTF8 -NoNewline
Write-Host "[OK] Updated $KongYml with $detectedAlg key" -ForegroundColor Green
Write-Host ""
Write-Host "Next: restart Kong to apply the new key." -ForegroundColor Yellow
Write-Host "  docker compose -p shopflow-edge restart kong"

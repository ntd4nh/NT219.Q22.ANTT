#Requires -Version 5.1
# Auto test script -- no pauses, captures all results

$BASE  = "http://localhost:8888"
$KC    = "http://localhost:8080"
$REALM = "shopflow"
$Results = [System.Collections.Generic.List[string]]::new()

function Log([string]$line) {
    Write-Host $line
    $Results.Add($line)
}

function Section([string]$title) {
    Log ""
    Log "## $title"
    Log ""
}

function CallApi {
    param(
        [string]$Method = "GET",
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$ContentType = "application/json"
    )
    try {
        $params = @{
            Method         = $Method
            Uri            = $Url
            Headers        = $Headers
            UseBasicParsing = $true
            ErrorAction    = "Stop"
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = $ContentType
        }
        $r = Invoke-WebRequest @params
        return @{ ok = $true; code = [int]$r.StatusCode; body = $r.Content }
    } catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode.value__ } catch {}
        $body = ""
        try { $body = $_.ErrorDetails.Message } catch {}
        return @{ ok = $false; code = $code; body = $body }
    }
}

Log "# ShopFlow Security Demo -- Ket qua Auto Test"
Log ""
Log "**Thoi gian:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "**Base URL:** $BASE"
Log "**Keycloak:** $KC"
Log ""
Log "---"

# ─── LOGIN ───────────────────────────────────────────────────────────────────
Section "Setup: Dang nhap"

$TOKEN_A = $null; $REFRESH_A = $null; $TOKEN_B = $null
try {
    $loginA = Invoke-RestMethod -Method Post `
        -Uri "$KC/realms/$REALM/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123"
    $TOKEN_A   = $loginA.access_token
    $REFRESH_A = $loginA.refresh_token
    Log "- **tenant-a-user login:** OK (expires ${$loginA.expires_in}s)"
} catch {
    Log "- **tenant-a-user login:** FAIL -- $_"
}

try {
    $loginB = Invoke-RestMethod -Method Post `
        -Uri "$KC/realms/$REALM/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=password&client_id=shopflow-spa&username=tenant-b-user&password=password123"
    $TOKEN_B = $loginB.access_token
    Log "- **tenant-b-user login:** OK"
} catch {
    Log "- **tenant-b-user login:** FAIL -- $_"
}

if (-not $TOKEN_A) {
    Log ""
    Log "> **ABORT: Khong the login, dung lai.**"
    $Results | Out-File -FilePath "demo\demo-results.md" -Encoding UTF8
    exit 1
}

# ─── D1 BOLA ─────────────────────────────────────────────────────────────────
Section "D1 -- BOLA (Broken Object Level Authorization)"

Log "### [1/2] tenant-a doc order cua chinh minh (order-a-001)"
$r = CallApi -Url "$BASE/api/orders/order-a-001" -Headers @{ Authorization = "Bearer $TOKEN_A" }
if ($r.code -eq 200) {
    Log "- **Ket qua:** ``200 OK`` -- PASS"
    Log "- **Response:** ``$($r.body)``"
} else {
    Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 200)"
    Log "- **Response:** ``$($r.body)``"
}

Log ""
Log "### [2/2] tenant-a doc order cua tenant-b (order-tenant-b) -- tan cong BOLA"
$r = CallApi -Url "$BASE/api/orders/order-tenant-b" -Headers @{ Authorization = "Bearer $TOKEN_A" }
if ($r.code -eq 403) {
    Log "- **Ket qua:** ``403 BOLA_BLOCKED`` -- PASS (tan cong bi chan)"
    Log "- **Response:** ``$($r.body)``"
} else {
    Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 403)"
    Log "- **Response:** ``$($r.body)``"
}

# ─── D2 TOKEN REPLAY ─────────────────────────────────────────────────────────
Section "D2 -- Token Replay Prevention"

Log "### [1/2] Dung refresh_token lan 1"
$r = CallApi -Method "POST" -Url "$BASE/api/auth/refresh" `
    -Headers @{ Authorization = "Bearer $TOKEN_A" } `
    -Body (ConvertTo-Json @{ refresh_token = $REFRESH_A })
if ($r.code -eq 200) {
    Log "- **Ket qua:** ``200 OK`` -- PASS"
} else {
    Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 200)"
    Log "- **Response:** ``$($r.body)``"
}

Log ""
Log "### [2/2] Dung CUNG refresh_token do lan 2 -- tan cong replay"
$r = CallApi -Method "POST" -Url "$BASE/api/auth/refresh" `
    -Headers @{ Authorization = "Bearer $TOKEN_A" } `
    -Body (ConvertTo-Json @{ refresh_token = $REFRESH_A })
if ($r.code -eq 401 -and $r.body -like "*TOKEN_REPLAY*") {
    Log "- **Ket qua:** ``401 TOKEN_REPLAY`` -- PASS (replay bi chan)"
    Log "- **Response:** ``$($r.body)``"
} else {
    Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 401 TOKEN_REPLAY)"
    Log "- **Response:** ``$($r.body)``"
}

# ─── D4 SSRF ─────────────────────────────────────────────────────────────────
Section "D4 -- SSRF (Server-Side Request Forgery)"

Log "### [1/2] URL hop le (imgur.com -- trong allowlist)"
$r = CallApi -Method "POST" -Url "$BASE/api/users/fetch-url" `
    -Headers @{ Authorization = "Bearer $TOKEN_A" } `
    -Body (ConvertTo-Json @{ url = "https://imgur.com/favicon.ico" })
if ($r.code -eq 200) {
    Log "- **Ket qua:** ``200 OK`` -- PASS"
    Log "- **Response:** ``$($r.body)``"
} else {
    Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 200)"
    Log "- **Response:** ``$($r.body)``"
}

Log ""
Log "### [2/2] Azure Metadata 169.254.169.254 -- tan cong SSRF"
$r = CallApi -Method "POST" -Url "$BASE/api/users/fetch-url" `
    -Headers @{ Authorization = "Bearer $TOKEN_A" } `
    -Body (ConvertTo-Json @{ url = "http://169.254.169.254/metadata/instance" })
if ($r.code -eq 403) {
    Log "- **Ket qua:** ``403 SSRF_BLOCKED`` -- PASS (tan cong bi chan)"
    Log "- **Response:** ``$($r.body)``"
} else {
    Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 403)"
    Log "- **Response:** ``$($r.body)``"
}

# ─── D5 VAULT TRANSIT ────────────────────────────────────────────────────────
Section "D5 -- Vault Transit (AES-256-GCM)"

$S2S_TOKEN = $null
try {
    $s2s = Invoke-RestMethod -Method Post `
        -Uri "$KC/realms/$REALM/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod&scope=shopflow-api"
    $S2S_TOKEN = $s2s.access_token
    Log "- **S2S token:** OK"
} catch {
    Log "- **S2S token:** FAIL -- $_"
}

$CIPHER = $null
if ($S2S_TOKEN) {
    Log ""
    Log "### [1/2] Ma hoa so the '4111-1111-1111-1111'"
    $r = CallApi -Method "POST" -Url "$BASE/api/billing/vault-encrypt" `
        -Headers @{ Authorization = "Bearer $S2S_TOKEN" } `
        -Body (ConvertTo-Json @{ plaintext = "4111-1111-1111-1111" })
    if ($r.code -eq 200) {
        $CIPHER = ($r.body | ConvertFrom-Json).ciphertext
        Log "- **Ket qua:** ``200 OK`` -- PASS"
        Log "- **Ciphertext:** ``$CIPHER``"
    } else {
        Log "- **Ket qua:** ``$($r.code)`` -- FAIL (Expected 200)"
        Log "- **Response:** ``$($r.body)``"
    }

    if ($CIPHER) {
        Log ""
        Log "### [2/2] Giai ma ciphertext --> so the goc"
        $r = CallApi -Method "POST" -Url "$BASE/api/billing/vault-decrypt" `
            -Headers @{ Authorization = "Bearer $S2S_TOKEN" } `
            -Body (ConvertTo-Json @{ ciphertext = $CIPHER })
        if ($r.code -eq 200) {
            $plain = ($r.body | ConvertFrom-Json).plaintext
            if ($plain -eq "4111-1111-1111-1111") {
                Log "- **Ket qua:** ``200 OK`` -- PASS"
                Log "- **Plaintext:** ``$plain``"
            } else {
                Log "- **Ket qua:** ``200`` nhung plaintext sai: ``$plain``"
            }
        } else {
            Log "- **Ket qua:** ``$($r.code)`` -- FAIL"
            Log "- **Response:** ``$($r.body)``"
        }
    }
}

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
Section "Tong ket"

Log "| Demo | Mo ta | Ket qua |"
Log "|------|-------|---------|"
Log "| D1a  | Doc order chinh minh (200) | Xem ben tren |"
Log "| D1b  | BOLA cross-tenant (403) | Xem ben tren |"
Log "| D2a  | Refresh token lan 1 (200) | Xem ben tren |"
Log "| D2b  | Token replay lan 2 (401) | Xem ben tren |"
Log "| D4a  | SSRF allowlist (200) | Xem ben tren |"
Log "| D4b  | SSRF metadata (403) | Xem ben tren |"
Log "| D5a  | Vault encrypt (200) | Xem ben tren |"
Log "| D5b  | Vault decrypt (200) | Xem ben tren |"

Log ""
Log "---"
Log "*Generated by auto-test.ps1 -- $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*"

# Save to file
$outFile = "demo\demo-results.md"
$Results | Out-File -FilePath $outFile -Encoding UTF8
Write-Host ""
Write-Host ">>> Saved: $outFile" -ForegroundColor Green

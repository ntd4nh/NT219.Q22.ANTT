#Requires -Version 5.1
# ShopFlow Security Demo -- NT219
# Chay: .\demo\run-demo.ps1

$BASE  = "http://4.193.178.246:8888"
$KC    = "http://20.212.114.132:8080"
$REALM = "shopflow"

function Banner([string]$text, [string]$color = "Cyan") {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor $color
    Write-Host "  $text" -ForegroundColor $color
    Write-Host ("=" * 60) -ForegroundColor $color
}

function Step([string]$label) {
    Write-Host ""
    Write-Host ">>> $label" -ForegroundColor Yellow
}

function Ok([string]$msg)   { Write-Host "[OK]    $msg" -ForegroundColor Green }
function Fail([string]$msg) { Write-Host "[BLOCK] $msg" -ForegroundColor Red }
function Info([string]$msg) { Write-Host "[INFO]  $msg" -ForegroundColor Gray }

function Pause([string]$msg = "Nhan Enter de tiep tuc...") {
    Write-Host ""
    Write-Host $msg -ForegroundColor Magenta
    $null = Read-Host
}

# ---------------------------------------------------------------------------
Banner "SHOPFLOW API SECURITY DEMO -- NT219" "White"
Info "Base URL : $BASE"
Info "Keycloak : $KC"
Pause "Nhan Enter de bat dau lay token..."

# ---------------------------------------------------------------------------
Banner "SETUP: Dang nhap 2 tenant"

Step "Login tenant-a-user (tenant_id = tenant-a)"
try {
    $loginA = Invoke-RestMethod -Method Post `
        -Uri "$KC/realms/$REALM/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123"
    $TOKEN_A   = $loginA.access_token
    $REFRESH_A = $loginA.refresh_token
    Ok "Token tenant-a OK (expires in $($loginA.expires_in)s)"
} catch {
    Write-Host "[ERROR] Login tenant-a that bai: $_" -ForegroundColor Red
    exit 1
}

Step "Login tenant-b-user (tenant_id = tenant-b)"
try {
    $loginB = Invoke-RestMethod -Method Post `
        -Uri "$KC/realms/$REALM/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=password&client_id=shopflow-spa&username=tenant-b-user&password=password123"
    $TOKEN_B = $loginB.access_token
    Ok "Token tenant-b OK"
} catch {
    Write-Host "[ERROR] Login tenant-b that bai: $_" -ForegroundColor Red
    exit 1
}

Info "Dan token vao jwt.io de xem claim tenant_id:"
Write-Host ($TOKEN_A.Substring(0, [Math]::Min(80, $TOKEN_A.Length)) + "...") -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
Pause "=== San sang. Nhan Enter chay D1: BOLA ==="

Banner "D1 -- BOLA: Broken Object Level Authorization" "Cyan"
Info "Kich ban: tenant-a co doc order cua tenant-b"
Info "order-a-001 thuoc tenant-a | order-tenant-b thuoc tenant-b"

Step "[1/2] tenant-a doc ORDER CUA CHINH MINH --> Phai 200"
try {
    $r = Invoke-WebRequest -Method Get `
        -Uri "$BASE/api/orders/order-a-001" `
        -Headers @{ Authorization = "Bearer $TOKEN_A" } `
        -UseBasicParsing `
        -ErrorAction Stop
    Ok "200 OK -- $($r.Content)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[WARN] Status $code -- $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Step "[2/2] tenant-a doc ORDER CUA tenant-b --> Phai 403 BOLA_BLOCKED"
try {
    $r = Invoke-WebRequest -Method Get `
        -Uri "$BASE/api/orders/order-tenant-b" `
        -Headers @{ Authorization = "Bearer $TOKEN_A" } `
        -UseBasicParsing `
        -ErrorAction Stop
    Write-Host "[!!!] KHONG bi block -- lo hong ton tai: $($r.Content)" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    Fail "$code BOLA_BLOCKED -- $body"
}

Info "checkTenantAccess(): userTenant='tenant-a' != orderTenant='tenant-b' --> deny"

# ---------------------------------------------------------------------------
Pause "=== Nhan Enter chay D2: Token Replay ==="

Banner "D2 -- Token Replay Prevention (Redis SET NX)" "Cyan"
Info "Kich ban: dung refresh_token 2 lan -- lan 2 phai bi block"

Step "[1/2] Dung refresh_token LAN 1 --> Phai 200"
try {
    $r1 = Invoke-RestMethod -Method Post `
        -Uri "$BASE/api/auth/refresh" `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ refresh_token = $REFRESH_A }) `
        -ErrorAction Stop
    Ok "200 OK -- Nhan duoc access_token moi"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[WARN] Lan 1 loi $code -- $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Step "[2/2] Dung CUNG refresh_token DO LAN 2 --> Phai 401 TOKEN_REPLAY"
try {
    $r2 = Invoke-RestMethod -Method Post `
        -Uri "$BASE/api/auth/refresh" `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ refresh_token = $REFRESH_A }) `
        -ErrorAction Stop
    Write-Host "[!!!] KHONG bi block -- lo hong ton tai" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    Fail "$code TOKEN_REPLAY -- $body"
}

Info "Redis SET NX: lan 1 set key thanh cong, lan 2 key da ton tai --> reject"

# ---------------------------------------------------------------------------
Pause "=== Nhan Enter chay D4: SSRF ==="

Banner "D4 -- SSRF: Server-Side Request Forgery" "Cyan"
Info "Kich ban: attacker co dung server lam proxy doc metadata cloud"

Step "[1/2] URL hop le (allowlist) --> Phai pass"
try {
    $r = Invoke-RestMethod -Method Post `
        -Uri "$BASE/api/users/fetch-url" `
        -Headers @{ Authorization = "Bearer $TOKEN_A" } `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ url = "https://imgur.com/favicon.ico" }) `
        -ErrorAction Stop
    Ok "200 OK -- $($r.message)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "[WARN] $code -- $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Step "[2/2] Azure Metadata endpoint 169.254.169.254 --> Phai 403 SSRF_BLOCKED"
try {
    $r = Invoke-RestMethod -Method Post `
        -Uri "$BASE/api/users/fetch-url" `
        -Headers @{ Authorization = "Bearer $TOKEN_A" } `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ url = "http://169.254.169.254/metadata/instance" }) `
        -ErrorAction Stop
    Write-Host "[!!!] KHONG bi block: $r" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    Fail "$code SSRF_BLOCKED -- $body"
}

Info "validateUrl(): 169.254.x.x la link-local IP --> PRIVATE_IP --> reject"

# ---------------------------------------------------------------------------
Pause "=== Nhan Enter chay D5: Vault Transit AES-256-GCM ==="

Banner "D5 -- Vault Transit: Ma hoa AES-256-GCM" "Cyan"
Info "Kich ban: billing-service ma hoa so the qua Vault, key khong bao gio roi Vault"

Step "Lay S2S token (client_credentials -- shopflow-s2s)"
$S2S_TOKEN = $null
try {
    $s2s = Invoke-RestMethod -Method Post `
        -Uri "$KC/realms/$REALM/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod&scope=shopflow-api" `
        -ErrorAction Stop
    $S2S_TOKEN = $s2s.access_token
    Ok "S2S token OK"
} catch {
    Write-Host "[ERROR] S2S token that bai: $_" -ForegroundColor Red
}

if ($S2S_TOKEN) {
    $CIPHER = $null

    Step "[1/2] Ma hoa so the '4111-1111-1111-1111'"
    try {
        $enc = Invoke-RestMethod -Method Post `
            -Uri "$BASE/api/billing/vault-encrypt" `
            -Headers @{ Authorization = "Bearer $S2S_TOKEN" } `
            -ContentType "application/json" `
            -Body (ConvertTo-Json @{ plaintext = "4111-1111-1111-1111" }) `
            -ErrorAction Stop
        $CIPHER = $enc.ciphertext
        Ok "Ciphertext: $CIPHER"
        Info "Key 'shopflow-master' nam trong Vault, service khong bao gio thay key"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "[ERROR] Encrypt loi $code -- $($_.ErrorDetails.Message)" -ForegroundColor Red
    }

    if ($CIPHER) {
        Step "[2/2] Giai ma ciphertext --> ra so the goc"
        try {
            $dec = Invoke-RestMethod -Method Post `
                -Uri "$BASE/api/billing/vault-decrypt" `
                -Headers @{ Authorization = "Bearer $S2S_TOKEN" } `
                -ContentType "application/json" `
                -Body (ConvertTo-Json @{ ciphertext = $CIPHER }) `
                -ErrorAction Stop
            Ok "Plaintext: $($dec.plaintext)"
            Info "AES-256-GCM: authenticated encryption -- bao mat + toan ven du lieu"
        } catch {
            $code = $_.Exception.Response.StatusCode.value__
            Write-Host "[ERROR] Decrypt loi $code -- $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

# ---------------------------------------------------------------------------
Banner "DEMO HOAN TAT" "Green"
Write-Host ""
Write-Host "  D1 BOLA         -- JWT tenantId claim + DB row check" -ForegroundColor Green
Write-Host "  D2 Token Replay -- Redis SET NX atomic" -ForegroundColor Green
Write-Host "  D4 SSRF         -- DNS + private-IP + allowlist validation" -ForegroundColor Green
Write-Host "  D5 Vault Transit -- AES-256-GCM, key khong roi Vault" -ForegroundColor Green
Write-Host ""
Write-Host "  Grafana: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

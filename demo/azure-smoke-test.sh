#!/bin/bash
# ShopFlow Azure Smoke Test
# Chay tren Azure Cloud Shell sau khi deploy xong
# Usage: bash demo/azure-smoke-test.sh <EDGE_IP> <BACKEND_IP>
# Vi du: bash demo/azure-smoke-test.sh 4.193.178.246 20.212.114.132

EDGE_IP="${1:-4.193.178.246}"
BACKEND_IP="${2:-20.212.114.132}"
BASE="http://${EDGE_IP}:8888"
KC="http://${BACKEND_IP}:8080"
REALM="shopflow"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0

ok()   { echo -e "${GREEN}[OK]   $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}[FAIL] $1${NC}"; FAIL=$((FAIL+1)); }
info() { echo -e "${YELLOW}[INFO] $1${NC}"; }
section() { echo -e "\n${CYAN}=== $1 ===${NC}"; }

echo "=================================================="
echo "  ShopFlow Azure Smoke Test"
echo "=================================================="
info "Edge:    $BASE"
info "Keycloak: $KC"

# ─── SETUP: Login ────────────────────────────────────────────────────────────
section "SETUP: Dang nhap"

LOGIN_A=$(curl -s -X POST "$KC/realms/$REALM/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123")

TOKEN_A=$(echo "$LOGIN_A" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
REFRESH_A=$(echo "$LOGIN_A" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)

if [ -n "$TOKEN_A" ] && [ "$TOKEN_A" != "None" ]; then
    ok "Login tenant-a-user thanh cong"
else
    ERR=$(echo "$LOGIN_A" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description',d.get('error','')))" 2>/dev/null)
    fail "Login tenant-a-user that bai: $ERR"
    echo "Kiem tra Keycloak tai $KC/realms/$REALM"
    exit 1
fi

LOGIN_B=$(curl -s -X POST "$KC/realms/$REALM/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-b-user&password=password123")
TOKEN_B=$(echo "$LOGIN_B" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -n "$TOKEN_B" ] && [ "$TOKEN_B" != "None" ]; then
    ok "Login tenant-b-user thanh cong"
else
    fail "Login tenant-b-user that bai"
fi

# ─── D1: BOLA ────────────────────────────────────────────────────────────────
section "D1 -- BOLA: Broken Object Level Authorization"

# Ket qua mong doi: 200
R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN_A" \
  "$BASE/api/orders/order-a-001")
BODY=$(cat /tmp/body.txt)

if [ "$R" = "200" ]; then
    ok "D1a: tenant-a doc order chinh minh -> 200 OK"
    echo "     Response: $BODY"
else
    fail "D1a: Expected 200, got $R -- $BODY"
fi

# Ket qua mong doi: 403
R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN_A" \
  "$BASE/api/orders/order-tenant-b")
BODY=$(cat /tmp/body.txt)

if [ "$R" = "403" ]; then
    ok "D1b: BOLA cross-tenant -> 403 BOLA_BLOCKED"
    echo "     Response: $BODY"
else
    fail "D1b: Expected 403, got $R -- $BODY"
fi

# ─── D2: Token Replay ────────────────────────────────────────────────────────
section "D2 -- Token Replay Prevention"

# Lan 1: 200
R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
  -X POST "$BASE/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_A\"}")
BODY=$(cat /tmp/body.txt)

if [ "$R" = "200" ]; then
    ok "D2a: Refresh token lan 1 -> 200 OK"
else
    fail "D2a: Expected 200, got $R -- $BODY"
fi

# Lan 2: 401 TOKEN_REPLAY
R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
  -X POST "$BASE/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_A\"}")
BODY=$(cat /tmp/body.txt)

if [ "$R" = "401" ] && echo "$BODY" | grep -q "TOKEN_REPLAY"; then
    ok "D2b: Token replay lan 2 -> 401 TOKEN_REPLAY"
    echo "     Response: $BODY"
else
    fail "D2b: Expected 401 TOKEN_REPLAY, got $R -- $BODY"
fi

# ─── D4: SSRF ────────────────────────────────────────────────────────────────
section "D4 -- SSRF: Server-Side Request Forgery"

# URL hop le
R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
  -X POST "$BASE/api/users/fetch-url" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://imgur.com/favicon.ico"}')
BODY=$(cat /tmp/body.txt)

if [ "$R" = "200" ]; then
    ok "D4a: URL allowlist (imgur.com) -> 200 OK"
else
    fail "D4a: Expected 200, got $R -- $BODY"
fi

# SSRF metadata
R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
  -X POST "$BASE/api/users/fetch-url" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://169.254.169.254/metadata/instance"}')
BODY=$(cat /tmp/body.txt)

if [ "$R" = "403" ]; then
    ok "D4b: SSRF metadata -> 403 SSRF_BLOCKED"
    echo "     Response: $BODY"
else
    fail "D4b: Expected 403, got $R -- $BODY"
fi

# ─── D5: Vault Transit ───────────────────────────────────────────────────────
section "D5 -- Vault Transit AES-256-GCM"

# S2S token
S2S=$(curl -s -X POST "$KC/realms/$REALM/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod&scope=shopflow-api")
S2S_TOKEN=$(echo "$S2S" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -n "$S2S_TOKEN" ] && [ "$S2S_TOKEN" != "None" ]; then
    ok "S2S token (client_credentials) OK"
else
    fail "S2S token that bai"
    S2S_TOKEN=""
fi

if [ -n "$S2S_TOKEN" ]; then
    # Encrypt
    R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
      -X POST "$BASE/api/billing/vault-encrypt" \
      -H "Authorization: Bearer $S2S_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"plaintext":"4111-1111-1111-1111"}')
    BODY=$(cat /tmp/body.txt)

    if [ "$R" = "200" ]; then
        CIPHER=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ciphertext',''))" 2>/dev/null)
        ok "D5a: Vault encrypt -> 200 OK"
        echo "     Ciphertext: $CIPHER"

        # Decrypt
        R=$(curl -s -o /tmp/body.txt -w "%{http_code}" \
          -X POST "$BASE/api/billing/vault-decrypt" \
          -H "Authorization: Bearer $S2S_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"ciphertext\":\"$CIPHER\"}")
        BODY=$(cat /tmp/body.txt)
        PLAIN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('plaintext',''))" 2>/dev/null)

        if [ "$R" = "200" ] && [ "$PLAIN" = "4111-1111-1111-1111" ]; then
            ok "D5b: Vault decrypt -> 200 OK, plaintext: $PLAIN"
        else
            fail "D5b: Expected plaintext=4111-1111-1111-1111, got $R -- $BODY"
        fi
    else
        fail "D5a: Vault encrypt that bai $R -- $BODY"
    fi
fi

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
echo ""
echo "=================================================="
echo -e "  Ket qua: ${GREEN}PASS=$PASS${NC}  ${RED}FAIL=$FAIL${NC}"
echo "=================================================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}  TẤT CA PASS -- San sang demo!${NC}"
else
    echo -e "${RED}  Co $FAIL test that bai -- kiem tra lai truoc khi demo${NC}"
fi
echo ""

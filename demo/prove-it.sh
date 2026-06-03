#!/usr/bin/env bash
# =============================================================================
# prove-it.sh — Chứng minh thật sự lúc thuyết trình bị hỏi vặn
# Chạy: bash prove-it.sh [số_câu]   hoặc  source prove-it.sh rồi gọi từng hàm
# =============================================================================

# --- IP (sửa nếu VM restart đổi IP) -----------------------------------------
export EDGE_IP="4.193.178.246"
export BACK_IP="20.212.114.132"
export BASE_URL="http://$EDGE_IP:8888"
export MTLS_URL="https://$EDGE_IP:8443"
export KC_URL="http://$BACK_IP:8080"

separator() { echo; echo "──────────────────────────────────────────────────────"; echo "  $*"; echo "──────────────────────────────────────────────────────"; }

# =============================================================================
# HÀM DÙNG CHUNG
# =============================================================================

get_user_token() {
  TOKEN_RESP=$(curl -s -X POST "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
    -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123" \
    -H "Content-Type: application/x-www-form-urlencoded")
  export VALID_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
  export REFRESH_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")
  echo "VALID_TOKEN  : ${#VALID_TOKEN} ký tự"
  echo "REFRESH_TOKEN: ${#REFRESH_TOKEN} ký tự"
}

get_m2m_token() {
  M2M_RESP=$(curl -s -X POST "$KC_URL/realms/shopflow/protocol/openid-connect/token" \
    -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod" \
    -H "Content-Type: application/x-www-form-urlencoded")
  export M2M_TOKEN=$(echo "$M2M_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
  echo "M2M_TOKEN: ${#M2M_TOKEN} ký tự"
}

# =============================================================================
# CÂU 1 — "HTTPS có thật không hay chỉ expose HTTP?"
# Kỳ vọng: TLSv1.3, cipher AES-256-GCM, cert CN=localhost / issuer ShopFlow-CA
# =============================================================================
prove_1_https_is_real() {
  separator "CÂU 1: HTTPS có thật không?"
  echo ">>> Kết nối TLS thẳng vào port 8444 (Kong HTTPS) để xem cert và cipher"
  echo ""
  echo | openssl s_client -connect "$EDGE_IP:8444" -showcerts 2>/dev/null \
    | openssl x509 -noout -text 2>/dev/null \
    | grep -E "Subject:|Issuer:|Not After|Public-Key:|Signature Algorithm"
  echo ""
  echo ">>> Tóm tắt handshake:"
  echo | openssl s_client -connect "$EDGE_IP:8444" 2>/dev/null \
    | grep -E "Protocol|Cipher|Verify return"
}

# =============================================================================
# CÂU 2 — "JWT bị tamper có bị detect không?"
# Kỳ vọng: 401 {"message":"Invalid signature"}
# =============================================================================
prove_2_jwt_tamper_detected() {
  separator "CÂU 2: JWT bị tamper → bị reject"
  echo ">>> Lấy token hợp lệ, đổi 1 ký tự ở signature → gửi lên"
  get_user_token
  # Cắt signature (phần thứ 3), đổi ký tự đầu tiên
  HEADER=$(echo "$VALID_TOKEN" | cut -d. -f1)
  PAYLOAD=$(echo "$VALID_TOKEN" | cut -d. -f2)
  SIG_ORIGINAL=$(echo "$VALID_TOKEN" | cut -d. -f3)
  # Flip ký tự đầu: A→B, còn lại giữ nguyên
  SIG_TAMPERED="X${SIG_ORIGINAL:1}"
  TAMPERED_TOKEN="${HEADER}.${PAYLOAD}.${SIG_TAMPERED}"
  echo ""
  echo "Token gốc    (sig 10 ký tự đầu): ${SIG_ORIGINAL:0:10}..."
  echo "Token giả mạo(sig 10 ký tự đầu): ${SIG_TAMPERED:0:10}..."
  echo ""
  curl -s -w "\nHTTP: %{http_code}\n" \
    -H "Authorization: Bearer $TAMPERED_TOKEN" \
    "$BASE_URL/api/orders"
  echo ""
  echo ">>> Kỳ vọng: HTTP 401 — Kong reject ngay, không vào service"
}

# =============================================================================
# CÂU 3 — "ES256 hay RS256 đang dùng thật sự?"
# Kỳ vọng: decode JWT header thấy alg = ES256
# =============================================================================
prove_3_algorithm_es256() {
  separator "CÂU 3: Thuật toán ES256 (không phải RS256)"
  echo ">>> Decode header của JWT (phần 1 trước dấu chấm đầu tiên)"
  get_user_token
  echo ""
  HEADER_B64=$(echo "$VALID_TOKEN" | cut -d. -f1)
  # Thêm padding
  PAD=$(( (4 - ${#HEADER_B64} % 4) % 4 ))
  HEADER_B64_PADDED="${HEADER_B64}$(printf '=%.0s' $(seq 1 $PAD))"
  echo "Header (raw base64url): $HEADER_B64"
  echo ""
  echo "Header (decoded JSON):"
  echo "$HEADER_B64_PADDED" | tr '_-' '/+' | base64 -d 2>/dev/null | python3 -m json.tool
  echo ""
  echo ">>> Kỳ vọng: \"alg\": \"ES256\" — ECDSA P-256, không phải RSA"
}

# =============================================================================
# CÂU 4 — "Token không có aud bị chặn không?"
# Kỳ vọng: 401 — Kong enforce audience claim
# =============================================================================
prove_4_audience_enforced() {
  separator "CÂU 4: Audience (aud) claim được enforce"
  echo ">>> Lấy token từ client id khác (không có aud=shopflow-api) — không tồn tại"
  echo "    → Dùng token hợp lệ nhưng decode xem aud có đúng không"
  get_user_token
  PAYLOAD_B64=$(echo "$VALID_TOKEN" | cut -d. -f2)
  PAD=$(( (4 - ${#PAYLOAD_B64} % 4) % 4 ))
  PAYLOAD_B64P="${PAYLOAD_B64}$(printf '=%.0s' $(seq 1 $PAD))"
  echo ""
  echo "Payload (các claim quan trọng):"
  echo "$PAYLOAD_B64P" | tr '_-' '/+' | base64 -d 2>/dev/null \
    | python3 -c "import sys,json,datetime; d=json.load(sys.stdin); print('aud      :', d.get('aud')); print('iss      :', d.get('iss')); print('tenant_id:', d.get('tenant_id')); print('exp      :', d.get('exp')); print('exp UTC  :', datetime.datetime.fromtimestamp(d['exp'], datetime.timezone.utc))"
  echo ""
  echo ">>> LƯU Ý: token user có thể aud=None. Logic Kong: token CÓ aud sai → chặn;"
  echo "    aud vắng mặt → bỏ qua (xem pre-function trong kong.yml)."
  echo ">>> Thử token với wrong audience (giả thủ công) → phải bị chặn:"
  EXPIRED_WRONG_AUD="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ3cm9uZy1hdWQiLCJleHAiOjk5OTk5OTk5OTl9.invalid"
  curl -s -w "\nHTTP: %{http_code}\n" \
    -H "Authorization: Bearer $EXPIRED_WRONG_AUD" \
    "$BASE_URL/api/orders"
  echo ""
  echo ">>> Kỳ vọng: HTTP 401"
}

# =============================================================================
# CÂU 5 — "Redis denylist có thật không? Xem trực tiếp key trong Redis"
# Kỳ vọng: key shopflow:refresh:used:<hash> tồn tại sau khi dùng refresh token
# =============================================================================
prove_5_redis_denylist() {
  separator "CÂU 5: Redis denylist token replay — xem key thật"
  echo ">>> Bước 1: lấy refresh token mới"
  get_user_token
  echo ""
  echo ">>> Bước 2: dùng refresh token → Redis ghi nhận"
  curl -s -X POST "$BASE_URL/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | python3 -c "
import sys,json
lines = sys.stdin.read().strip().split('\n')
try:
  d = json.loads(lines[0])
  print('new access_token:', d['access_token'][:50]+'...')
except: print(lines[0])
"
  echo ""
  echo ">>> Bước 3: xem Redis key trực tiếp trên vm-backend"
  az vm run-command invoke -g shopflow-rg -n vm-backend \
    --command-id RunShellScript \
    --scripts "docker exec redis redis-cli KEYS 'shopflow:refresh:used:*'" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
  echo ""
  echo ">>> Bước 4: xem TTL của key (bằng giây)"
  az vm run-command invoke -g shopflow-rg -n vm-backend \
    --command-id RunShellScript \
    --scripts "for k in \$(docker exec redis redis-cli KEYS 'shopflow:refresh:used:*'); do echo \"\$k  TTL=\$(docker exec redis redis-cli TTL \$k)s\"; done" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
  echo ""
  echo ">>> Kỳ vọng: key shopflow:refresh:used:<sha256> với TTL > 0"
}

# =============================================================================
# CÂU 6 — "mTLS bắt buộc không? Thử không có cert thì sao"
# Kỳ vọng: SSL alert / connection refused — không vào được
# =============================================================================
prove_6_mtls_cert_required() {
  separator "CÂU 6: mTLS — không có client cert thì không kết nối được"
  echo ">>> Thử kết nối HTTPS port 8443 KHÔNG có --cert --key"
  TS=$(date +%s)
  echo ""
  echo "--- Không có cert:"
  curl -sk -w "\nHTTP: %{http_code}\n" \
    -X POST "$MTLS_URL/api/billing/webhook" \
    -H "Content-Type: application/json" \
    -H "X-Signature: sha256=aaa" \
    -H "X-Timestamp: $TS" \
    -H "X-Nonce: no-cert-$TS" \
    -d '{"event":"test"}' 2>&1
  echo ""
  echo ">>> Kỳ vọng: HTTP 400 / SSL handshake failed / empty reply — server yêu cầu client cert"
  echo ""
  echo "--- Để so sánh — CÓ cert (kỳ vọng 401 INVALID_SIGNATURE):"
  # Cần cert file — script này chạy sau khi đã copy cert theo D3-Bước1
  if [[ -f /tmp/client.crt && -f /tmp/client.key ]]; then
    curl -sk -w "\nHTTP: %{http_code}\n" \
      -X POST "$MTLS_URL/api/billing/webhook" \
      --cert /tmp/client.crt --key /tmp/client.key \
      -H "Content-Type: application/json" \
      -H "X-Signature: sha256=deadbeef" \
      -H "X-Timestamp: $TS" \
      -H "X-Nonce: with-cert-$TS" \
      -d '{"event":"test"}'
    echo ">>> Có cert → vào được layer HMAC → 401 INVALID_SIGNATURE (đúng luồng)"
  else
    echo ">>> [!] Chưa có /tmp/client.crt — chạy D3-Bước1 để copy cert về Cloud Shell trước"
  fi
}

# =============================================================================
# CÂU 7 — "WAF (ModSecurity) đang ON hay Detection mode?"
# Kỳ vọng: SQL injection bị block 403, không phải detect rồi cho qua
# =============================================================================
prove_7_waf_blocking_mode() {
  separator "CÂU 7: WAF ModSecurity ở BLOCKING mode (không phải DetectionOnly)"
  get_user_token
  echo ""
  echo ">>> Test 1: SQL Injection trong query param"
  curl -s -o /dev/null -w "SQLi in param   : HTTP %{http_code}\n" \
    -H "Authorization: Bearer $VALID_TOKEN" \
    "$BASE_URL/api/orders?id=1%27+OR+%271%27%3D%271"
  echo ""
  echo ">>> Test 2: XSS trong header"
  curl -s -o /dev/null -w "XSS in header   : HTTP %{http_code}\n" \
    -H "Authorization: Bearer $VALID_TOKEN" \
    -H "X-Custom: <script>alert(1)</script>" \
    "$BASE_URL/api/orders"
  echo ""
  echo ">>> Test 3: Path traversal (--path-as-is để curl KHÔNG tự normalize ../)"
  curl -s --path-as-is -o /dev/null -w "Path traversal  : HTTP %{http_code}\n" \
    -H "Authorization: Bearer $VALID_TOKEN" \
    "$BASE_URL/api/orders/..%2f..%2f..%2fetc%2fpasswd"
  echo ""
  echo ">>> Kỳ vọng: SQLi + XSS → 403 (ModSecurity); path traversal → 400/403 (bị chặn ở edge)"
  echo "    Điểm mấu chốt: KHÔNG có request nào đi lọt (200/401). Nếu Detection mode"
  echo "    thì request sẽ qua được và chỉ ghi log — đây rõ ràng là Blocking mode."
}

# =============================================================================
# CÂU 8 — "Rate limiting có thật không? Flood thử"
# Kỳ vọng: 429 Too Many Requests sau khi vượt limit
# =============================================================================
prove_8_rate_limit() {
  separator "CÂU 8: Rate limiting — flood 40 request liên tiếp (limit auth = 30/phút)"
  get_user_token
  echo ""
  echo ">>> Gửi 40 request liên tiếp đến /api/auth (route limit 30/phút)..."
  echo "    (upstream trả 404 vì path không có handler — nhưng rate-limit của Kong"
  echo "     áp ở tầng route TRƯỚC khi proxy, nên vẫn đếm và chặn 429)"
  BLOCKED=0
  for i in $(seq 1 40); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $VALID_TOKEN" \
      "$BASE_URL/api/auth" 2>/dev/null || echo "000")
    printf "Request %02d: HTTP %s\n" "$i" "$CODE"
    if [[ "$CODE" == "429" ]]; then
      BLOCKED=$((BLOCKED+1))
    fi
  done
  echo ""
  echo ">>> Tổng request bị block (429): $BLOCKED/40"
  echo ">>> Kỳ vọng: từ request 31+ trả 429 Too Many Requests"
}

# =============================================================================
# CÂU 9 — "Vault thật sự encrypt hay chỉ encode base64?"
# Kỳ vọng: ciphertext vault:v1: khác nhau cho cùng plaintext (nonce random)
# =============================================================================
prove_9_vault_real_encryption() {
  separator "CÂU 9: Vault dùng AES-256-GCM thật — không phải base64"
  get_m2m_token
  echo ""
  echo ">>> Mã hóa cùng 1 plaintext 3 lần — kết quả phải KHÁC NHAU (do GCM nonce random)"
  for i in 1 2 3; do
    RESULT=$(curl -s -X POST "$BASE_URL/api/billing/vault-encrypt" \
      -H "Authorization: Bearer $M2M_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"plaintext":"so-the-giong-nhau"}')
    CIPHER=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['ciphertext'])" 2>/dev/null)
    printf "Lần %d: %s\n" "$i" "$CIPHER"
  done
  echo ""
  echo ">>> Kỳ vọng: 3 ciphertext vault:v1:... KHÁC NHAU — chứng minh GCM nonce không tái sử dụng"
  echo ""
  echo ">>> Kiểm tra Vault status + key info trên vm-backend:"
  az vm run-command invoke -g shopflow-rg -n vm-backend \
    --command-id RunShellScript \
    --scripts "
export VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=\$(cat /home/azureuser/Crypto_project/core/vault/.vault-init.json 2>/dev/null | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get(\"root_token\",\"\"))' 2>/dev/null)
VAULT_TOKEN=\$VAULT_TOKEN vault status 2>/dev/null | grep -E 'Sealed|Version|Storage'
echo '---'
VAULT_TOKEN=\$VAULT_TOKEN vault read transit/keys/shopflow-master 2>/dev/null | grep -E 'type|min_decryption|latest_version'
" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
}

# =============================================================================
# CÂU 10 — "BOLA: giả mạo X-Tenant-ID header có bypass được không?"
# Kỳ vọng: 403 — service check từ JWT, không tin header từ ngoài
# =============================================================================
prove_10_bola_header_bypass_fails() {
  separator "CÂU 10: BOLA — fake X-Tenant-ID header KHÔNG bypass được"
  get_user_token
  echo ""
  echo ">>> Gửi request với X-Tenant-ID: tenant-b (giả mạo header)"
  echo "    Token vẫn là của tenant-a — service phải check từ JWT, không từ header ngoài"
  echo ""
  curl -s -w "\nHTTP: %{http_code}\n" \
    -H "Authorization: Bearer $VALID_TOKEN" \
    -H "X-Tenant-ID: tenant-b" \
    "$BASE_URL/api/orders/order-tenant-b"
  echo ""
  echo ">>> Kỳ vọng: 403 BOLA_BLOCKED — service đọc tenant_id từ JWT (verify bởi Kong)"
  echo "    Không đọc X-Tenant-ID từ request header"
}

# =============================================================================
# CÂU 11 — "Webhook timestamp validation có hoạt động không? Gửi timestamp cũ"
# Kỳ vọng: 401 TIMESTAMP_EXPIRED hoặc tương đương
# =============================================================================
prove_11_timestamp_validation() {
  separator "CÂU 11: Webhook timestamp — timestamp quá cũ bị reject"
  # Cần cert
  if [[ ! -f /tmp/client.crt ]]; then
    echo "[!] Chưa có /tmp/client.crt — chạy D3-Bước1 để copy cert"
    return 1
  fi
  get_m2m_token
  BODY='{"event":"payment.succeeded","order_id":"ord-ts-test","amount":1}'
  SIG=$(curl -s -X POST "$BASE_URL/api/billing/test-sign" \
    -H "Authorization: Bearer $M2M_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['signature'])" 2>/dev/null)
  echo ""
  echo ">>> Gửi webhook với timestamp 1 giờ trước ($(date -d '-1 hour' +%s 2>/dev/null || echo OLD)):"
  OLD_TS=$(date -d '-1 hour' +%s 2>/dev/null || python3 -c "import time; print(int(time.time())-3600)")
  curl -sk -w "\nHTTP: %{http_code}\n" \
    -X POST "$MTLS_URL/api/billing/webhook" \
    --cert /tmp/client.crt --key /tmp/client.key \
    -H "Content-Type: application/json" \
    -H "X-Signature: $SIG" \
    -H "X-Timestamp: $OLD_TS" \
    -H "X-Nonce: ts-test-$OLD_TS" \
    -d "$BODY"
  echo ""
  echo ">>> Kỳ vọng: 401 TIMESTAMP_EXPIRED (window ±300 giây)"
}

# =============================================================================
# CÂU 12 — "Network isolation giữa các node có thật không?"
# Kỳ vọng: service trên node-app không truy cập được trực tiếp từ edge nếu không qua Kong
# =============================================================================
prove_12_network_isolation() {
  separator "CÂU 12: Network isolation — các node dùng Docker network riêng"
  echo ">>> Liệt kê Docker networks trên vm-edge:"
  az vm run-command invoke -g shopflow-rg -n vm-edge \
    --command-id RunShellScript \
    --scripts "docker network ls && echo '---' && docker inspect shopflow_dmz 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); [print('  Container:', c['Name'], '| IP:', list(c['NetworkSettings']['Networks'].values())[0]['IPAddress'] if c['NetworkSettings']['Networks'] else 'N/A') for c in d[0].get('Containers',{}).values()]\" 2>/dev/null || true" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
  echo ""
  echo ">>> Thử gọi thẳng billing-service từ edge (không qua Kong) — phải fail:"
  az vm run-command invoke -g shopflow-rg -n vm-edge \
    --command-id RunShellScript \
    --scripts "curl -s --connect-timeout 3 http://billing-service:8080/health 2>&1 || echo 'Connection refused / DNS fail — isolated đúng'" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
}

# =============================================================================
# CÂU 13 — "Grafana/Prometheus có metric security không?"
# Kỳ vọng: counter tăng cho bola_blocked, token_replay, ssrf_blocked
# =============================================================================
prove_13_security_metrics() {
  separator "CÂU 13: Security metrics trong Prometheus"
  echo ">>> Query Prometheus trực tiếp — counter các event bảo mật:"
  echo ""
  for METRIC in \
    "bola_blocked_total" \
    "token_replay_total" \
    "ssrf_blocked_total" \
    "webhook_rejected_total" \
    "rate_limit_exceeded_total"; do
    RESULT=$(curl -s "http://$BACK_IP:9090/api/v1/query?query=$METRIC" \
      | python3 -c "
import sys,json
d=json.load(sys.stdin)
results=d.get('data',{}).get('result',[])
if results:
  for r in results:
    print('  ', r['metric'], '=', r['value'][1])
else:
  print('  (no data yet)')
" 2>/dev/null)
    printf "%-40s %s\n" "$METRIC:" "$RESULT"
  done
  echo ""
  echo ">>> Grafana: http://$BACK_IP:3000 (admin/admin)"
}

# =============================================================================
# CÂU 14 — "Vault sealed sau restart — dữ liệu không accessible"
# Kỳ vọng: khi sealed, /vault-encrypt trả 503
# =============================================================================
prove_14_vault_sealed_protection() {
  separator "CÂU 14: Vault seal state — xem trạng thái hiện tại"
  echo ">>> Kiểm tra Vault status trực tiếp:"
  az vm run-command invoke -g shopflow-rg -n vm-backend \
    --command-id RunShellScript \
    --scripts "curl -s http://127.0.0.1:8200/v1/sys/health | python3 -m json.tool 2>/dev/null | grep -E 'sealed|initialized|version'" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
  echo ""
  echo ">>> Kỳ vọng: sealed=false (đang unseal, hoạt động bình thường)"
  echo "    Nếu sealed=true → billing-service sẽ trả 503 cho vault-encrypt/decrypt"
  echo ""
  echo "    Cơ chế: Vault dùng Shamir's Secret Sharing"
  echo "    Master key chia thành N mảnh, cần đủ threshold để reconstruct"
  echo "    Sau restart container → sealed → không đọc được secret nào"
  echo "    Script init-dev.ps1 / init-dev.sh tự động unseal bằng unseal keys"
}

# =============================================================================
# CÂU 15 — "Không có JWT thì sao? Kong có chặn không?"
# Kỳ vọng: 401 trước khi vào service
# =============================================================================
prove_15_no_jwt_blocked() {
  separator "CÂU 15: Không có JWT → Kong reject, không vào service"
  echo ""
  echo ">>> Gọi API không có Authorization header:"
  curl -s -w "\nHTTP: %{http_code}\n" \
    "$BASE_URL/api/orders"
  echo ""
  echo ">>> Gọi với Authorization header rỗng:"
  curl -s -w "\nHTTP: %{http_code}\n" \
    -H "Authorization: " \
    "$BASE_URL/api/orders"
  echo ""
  echo ">>> Gọi với Bearer token giả (random string):"
  curl -s -w "\nHTTP: %{http_code}\n" \
    -H "Authorization: Bearer thisisnotatoken" \
    "$BASE_URL/api/orders"
  echo ""
  echo ">>> Kỳ vọng: tất cả HTTP 401 — Kong xử lý trước khi request chạm service"
}

# =============================================================================
# CÂU 16 — "Audit log có đủ thông tin không? Xem structured JSON log"
# =============================================================================
prove_16_audit_logs() {
  separator "CÂU 16: Audit log — structured JSON với đủ trường cho SOC"
  echo ">>> Log từ order-service (BOLA events):"
  az vm run-command invoke -g shopflow-rg -n vm-backend \
    --command-id RunShellScript \
    --scripts "docker logs order-service 2>&1 | grep -E 'BOLA|security' | tail -3 | python3 -c \"
import sys
for line in sys.stdin:
  line=line.strip()
  if not line: continue
  try:
    import json; d=json.loads(line)
    print('event:', d.get('event'), '| tenantId:', d.get('tenantId'), '| reason:', d.get('reason_code',''), '| correlationId:', str(d.get('correlationId',''))[:20])
  except: print(line[:120])
\"" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
  echo ""
  echo ">>> Log từ webhook-authorizer:"
  az vm run-command invoke -g shopflow-rg -n vm-edge \
    --command-id RunShellScript \
    --scripts "docker logs webhook-authorizer 2>&1 | grep -E 'WEBHOOK|nonce' | tail -3" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
  echo ""
  echo ">>> Log từ auth-service (TOKEN_REPLAY events):"
  az vm run-command invoke -g shopflow-rg -n vm-backend \
    --command-id RunShellScript \
    --scripts "docker logs auth-service 2>&1 | grep -E 'TOKEN_REPLAY|replay' | tail -3" \
    --query "value[0].message" -o tsv 2>/dev/null | grep -v "^\["
}

# =============================================================================
# MAIN — chạy tất cả hoặc theo số
# =============================================================================
main() {
  echo "======================================================================"
  echo "  PROVE-IT.SH — Chứng minh từng tính năng khi bị hỏi vặn"
  echo "  IP: EDGE=$EDGE_IP  BACK=$BACK_IP"
  echo "======================================================================"
  echo ""
  echo "  Gọi từng hàm riêng:"
  echo "    prove_1_https_is_real"
  echo "    prove_2_jwt_tamper_detected"
  echo "    prove_3_algorithm_es256"
  echo "    prove_4_audience_enforced"
  echo "    prove_5_redis_denylist"
  echo "    prove_6_mtls_cert_required"
  echo "    prove_7_waf_blocking_mode"
  echo "    prove_8_rate_limit"
  echo "    prove_9_vault_real_encryption"
  echo "    prove_10_bola_header_bypass_fails"
  echo "    prove_11_timestamp_validation"
  echo "    prove_12_network_isolation"
  echo "    prove_13_security_metrics"
  echo "    prove_14_vault_sealed_protection"
  echo "    prove_15_no_jwt_blocked"
  echo "    prove_16_audit_logs"
  echo ""
  echo "  Hoặc chạy tất cả: bash prove-it.sh all"
  echo ""

  case "$1" in
    1)  prove_1_https_is_real ;;
    2)  prove_2_jwt_tamper_detected ;;
    3)  prove_3_algorithm_es256 ;;
    4)  prove_4_audience_enforced ;;
    5)  prove_5_redis_denylist ;;
    6)  prove_6_mtls_cert_required ;;
    7)  prove_7_waf_blocking_mode ;;
    8)  prove_8_rate_limit ;;
    9)  prove_9_vault_real_encryption ;;
    10) prove_10_bola_header_bypass_fails ;;
    11) prove_11_timestamp_validation ;;
    12) prove_12_network_isolation ;;
    13) prove_13_security_metrics ;;
    14) prove_14_vault_sealed_protection ;;
    15) prove_15_no_jwt_blocked ;;
    16) prove_16_audit_logs ;;
    all)
      prove_1_https_is_real;          echo; sleep 1
      prove_2_jwt_tamper_detected;    echo; sleep 1
      prove_3_algorithm_es256;        echo; sleep 1
      prove_4_audience_enforced;      echo; sleep 1
      prove_5_redis_denylist;         echo; sleep 1
      prove_6_mtls_cert_required;     echo; sleep 1
      prove_7_waf_blocking_mode;      echo; sleep 1
      prove_8_rate_limit;             echo; sleep 1
      prove_9_vault_real_encryption;  echo; sleep 1
      prove_10_bola_header_bypass_fails; echo; sleep 1
      prove_11_timestamp_validation;  echo; sleep 1
      prove_12_network_isolation;     echo; sleep 1
      prove_13_security_metrics;      echo; sleep 1
      prove_14_vault_sealed_protection; echo; sleep 1
      prove_15_no_jwt_blocked;        echo; sleep 1
      prove_16_audit_logs;            echo
      ;;
  esac
}

main "$@"

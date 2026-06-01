#!/usr/bin/env bash
# Tạo root token mới cho Vault từ unseal key trong .vault-init.json
# Chạy trong Git Bash: bash core/vault/fix-root-token.sh

set -e

INIT_FILE="core/vault/.vault-init.json"

if [ ! -f "$INIT_FILE" ]; then
  echo "[FAIL] Không tìm thấy $INIT_FILE"
  exit 1
fi

UNSEAL_KEY=$(python3 -c "import json; d=json.load(open('$INIT_FILE', encoding='utf-8-sig')); print(d['unseal_keys_b64'][0])")

echo "[INFO] Đọc unseal key từ $INIT_FILE OK"

# Khởi tạo generate-root
INIT_OUT=$(docker exec vault vault operator generate-root -init -format=json)
NONCE=$(echo "$INIT_OUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['nonce'])")
OTP=$(echo "$INIT_OUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['otp'])")

echo "[INFO] Nonce: $NONCE"

# Gửi unseal key để generate encoded token
ENCODED=$(echo "$UNSEAL_KEY" | docker exec -i vault vault operator generate-root \
  -nonce="$NONCE" -format=json - | python3 -c "import sys,json; print(json.load(sys.stdin)['encoded_token'])")

# Decode thành root token
NEW_ROOT=$(docker exec vault vault operator generate-root \
  -decode="$ENCODED" -otp="$OTP" -format=json | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "[OK] Root token mới đã tạo"

# Cập nhật .vault-init.json với root token mới
python3 - <<PYEOF
import json
with open('$INIT_FILE', encoding='utf-8-sig') as f:
    d = json.load(f)
d['root_token'] = '$NEW_ROOT'
with open('$INIT_FILE', 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2)
print('[OK] Đã cập nhật $INIT_FILE với root token mới')
PYEOF

echo "[DONE] Bây giờ chạy lại: powershell -ExecutionPolicy Bypass -File core/vault/init-dev.ps1"


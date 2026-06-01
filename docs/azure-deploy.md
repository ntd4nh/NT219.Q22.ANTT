# Hướng dẫn triển khai ShopFlow lên Azure — Step by Step

> **Yêu cầu:** Tài khoản Azure với $200 credit · Đã có stack chạy được ở local
> **Thời gian:** 45–90 phút · **Chi phí:** ~$3.5/ngày (tắt VM khi không dùng: $0)
> **Kết quả:** API chạy trên cloud thật, D4 SSRF nhắm Azure IMDS thật

---

## Tổng quan kiến trúc sau khi deploy

```
Internet
    │ :8888/:8444/:8443
    ▼
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│ VM-EDGE  (public IP)        │        │ VM-BACKEND  (private IP only)    │
│ Standard_B2s · 2CPU · 4GB  │◄──────►│ Standard_B4ms · 4CPU · 16GB     │
│                             │ VNet   │                                  │
│ shopflow_dmz (Docker)       │ 10.0.x │ shopflow_identity → keycloak     │
│ ├─ edge-nginx (WAF)         │        │ shopflow_security → vault, redis │
│ ├─ kong (API Gateway)       │        │ shopflow_app-a   → order, user   │
│ ├─ billing-mtls-proxy       │        │ shopflow_app-b   → billing, auth │
│ └─ webhook-authorizer       │        │ shopflow_data    → postgresql    │
└─────────────────────────────┘        │ shopflow_obs     → prometheus..  │
                                       └──────────────────────────────────┘
NSG VM-EDGE:  8888/8444/8443 open      NSG VM-BACKEND: chỉ VM-EDGE vào được
```

---

## PHASE 0 — Chuẩn bị

### Bước 0.1 — Đảm bảo có sẵn những thứ sau

- [ ] Đang đăng nhập tại https://portal.azure.com với tài khoản UIT
- [ ] Thấy **$200 USD in credits** ở trang Home
- [ ] Code project đã được push lên GitHub (dù là private cũng được)
- [ ] Nhớ URL GitHub repo của bạn: `https://github.com/<username>/Crypto_project`

### Bước 0.2 — Mở Azure Cloud Shell

1. Nhìn lên thanh công cụ phía trên cùng của Azure Portal
2. Click icon **`>_`** (Terminal icon, nằm cạnh icon chuông 🔔)
3. Cửa sổ Cloud Shell xuất hiện ở phía dưới màn hình
4. Nếu hỏi **"Select your preferred shell"** → chọn **Bash**
5. Nếu hỏi **"You have no storage mounted"** → click **"Create storage"**
6. Đợi ~30 giây → thấy dấu nhắc lệnh `azureuser@Azure:~$` là OK

> ⚠️ **Quan trọng:** Mọi lệnh trong hướng dẫn này đều chạy trong Cloud Shell, không phải terminal máy tính của bạn.

---

## PHASE 1 — Khai báo biến (chạy 1 lần duy nhất)

Copy **nguyên cả khối** này vào Cloud Shell, **thay YOUR_GITHUB_REPO** bằng URL repo thật:

```bash
# ==== THAY DÒNG NÀY ====
REPO_URL="https://github.com/ntd4nh/NT219.Q22.ANTT"
# =======================

RG="shopflow-rg"
LOCATION="southeastasia"
VNET_NAME="shopflow-vnet"
SUBNET_NAME="shopflow-subnet"
VM_EDGE="vm-edge"
VM_BACKEND="vm-backend"
ADMIN_USER="azureuser"
VM_PASS="ShopFlow@Azure2024!"

echo "=== Biến đã khai báo ==="
echo "Repo   : $REPO_URL"
echo "Region : $LOCATION"
echo "VM Pass: $VM_PASS"
```

**Kết quả mong đợi:**
```
=== Biến đã khai báo ===
Repo   : https://github.com/...
Region : southeastasia
VM Pass: ShopFlow@Azure2024!
```

> ⚠️ **Nếu đóng Cloud Shell,** phải chạy lại Phase 1 trước khi tiếp tục bất kỳ Phase nào.

---

## PHASE 2 — Tạo hạ tầng Azure

### Bước 2.1 — Tạo Resource Group

```bash
az group create --name $RG --location $LOCATION
```

**Kết quả mong đợi:** Thấy `"provisioningState": "Succeeded"` trong output JSON.

---

### Bước 2.2 — Tạo Virtual Network

```bash
az network vnet create \
  --resource-group $RG \
  --name $VNET_NAME \
  --address-prefix 10.0.0.0/16 \
  --subnet-name $SUBNET_NAME \
  --subnet-prefix 10.0.1.0/24
```

**Kết quả mong đợi:** JSON với `"provisioningState": "Succeeded"`.

---

### Bước 2.3 — Tạo VM-EDGE

> ⏱️ Bước này mất 2–3 phút. Không đóng Cloud Shell.

```bash
az vm create \
  --resource-group $RG \
  --name $VM_EDGE \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --vnet-name $VNET_NAME \
  --subnet $SUBNET_NAME \
  --public-ip-sku Standard \
  --admin-username $ADMIN_USER \
  --admin-password "$VM_PASS" \
  --authentication-type password
```

**Kết quả mong đợi:** JSON với `"powerState": "VM running"` và có trường `"publicIpAddress"`.

---

### Bước 2.4 — Tạo VM-BACKEND

> ⏱️ Bước này mất 2–3 phút.

```bash
az vm create \
  --resource-group $RG \
  --name $VM_BACKEND \
  --image Ubuntu2204 \
  --size Standard_B4ms \
  --vnet-name $VNET_NAME \
  --subnet $SUBNET_NAME \
  --public-ip-sku Standard \
  --admin-username $ADMIN_USER \
  --admin-password "$VM_PASS" \
  --authentication-type password
```

**Kết quả mong đợi:** JSON với `"powerState": "VM running"`.

---

### Bước 2.5 — Lấy IP addresses

```bash
EDGE_PUBLIC_IP=$(az vm show -d -g $RG -n $VM_EDGE    --query publicIps  -o tsv)
EDGE_PRIVATE_IP=$(az vm show -d -g $RG -n $VM_EDGE   --query privateIps -o tsv)
BACKEND_PUBLIC_IP=$(az vm show -d -g $RG -n $VM_BACKEND  --query publicIps  -o tsv)
BACKEND_PRIVATE_IP=$(az vm show -d -g $RG -n $VM_BACKEND --query privateIps -o tsv)

echo "============================================"
echo "  VM-EDGE    public  IP : $EDGE_PUBLIC_IP"
echo "  VM-EDGE    private IP : $EDGE_PRIVATE_IP"
echo "  VM-BACKEND public  IP : $BACKEND_PUBLIC_IP"
echo "  VM-BACKEND private IP : $BACKEND_PRIVATE_IP"
echo "============================================"
```

> 📋 **Lưu lại 4 địa chỉ IP này** — bạn sẽ cần ở các bước sau.

---

### Bước 2.6 — Mở cổng tường lửa

```bash
# VM-EDGE: mở cổng ra internet
az vm open-port -g $RG -n $VM_EDGE --port 22   --priority 100
az vm open-port -g $RG -n $VM_EDGE --port 8888 --priority 200
az vm open-port -g $RG -n $VM_EDGE --port 8444 --priority 300
az vm open-port -g $RG -n $VM_EDGE --port 8443 --priority 400
az vm open-port -g $RG -n $VM_EDGE --port 8080 --priority 500
echo "✅ NSG VM-EDGE OK"

# VM-BACKEND: mở tất cả (sẽ khoá lại sau khi setup xong)
az vm open-port -g $RG -n $VM_BACKEND --port 22   --priority 100
az vm open-port -g $RG -n $VM_BACKEND --port 8080 --priority 200
az vm open-port -g $RG -n $VM_BACKEND --port 8082 --priority 300
az vm open-port -g $RG -n $VM_BACKEND --port 8083 --priority 400
az vm open-port -g $RG -n $VM_BACKEND --port 8084 --priority 500
az vm open-port -g $RG -n $VM_BACKEND --port 8085 --priority 600
az vm open-port -g $RG -n $VM_BACKEND --port 3000 --priority 700
az vm open-port -g $RG -n $VM_BACKEND --port 9090 --priority 800
echo "✅ NSG VM-BACKEND OK"
```

---

## PHASE 3 — Cài Docker

### Bước 3.1 — Cài Docker trên VM-EDGE (SSH)

```bash
ssh -o StrictHostKeyChecking=no $ADMIN_USER@$EDGE_PUBLIC_IP \
  "echo '$VM_PASS' | sudo -S bash -c '
    apt-get update -qq
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker azureuser
    apt-get install -y git python3 python3-yaml
    echo DOCKER_EDGE_OK
  '"
```

**Kết quả mong đợi:** Thấy `DOCKER_EDGE_OK` ở cuối output.

---

### Bước 3.2 — Cài Docker trên VM-BACKEND (run-command)

> ⏱️ Bước này mất 3–5 phút.

```bash
az vm run-command invoke \
  --resource-group $RG \
  --name $VM_BACKEND \
  --command-id RunShellScript \
  --scripts "
    apt-get update -qq
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker azureuser
    apt-get install -y git python3 python3-yaml
    echo DOCKER_BACKEND_OK
  "
```

**Kết quả mong đợi:** Trong phần `"message"` thấy `DOCKER_BACKEND_OK`.

---

## PHASE 4 — Clone repo và cấu hình

### Bước 4.1 — Clone repo trên VM-EDGE

```bash
ssh -o StrictHostKeyChecking=no $ADMIN_USER@$EDGE_PUBLIC_IP \
  "git clone $REPO_URL ~/Crypto_project && echo 'CLONE_EDGE_OK'"
```

**Nếu repo private:** Thêm Personal Access Token vào URL:
```bash
# Tạo token tại: GitHub → Settings → Developer settings → Personal access tokens
# Rồi thay URL thành:
REPO_URL="https://<YOUR_TOKEN>@github.com/<username>/Crypto_project.git"
```

---

### Bước 4.2 — Clone repo trên VM-BACKEND

```bash
az vm run-command invoke -g $RG -n $VM_BACKEND \
  --command-id RunShellScript \
  --scripts "
    git clone $REPO_URL /home/azureuser/Crypto_project
    chown -R azureuser:azureuser /home/azureuser/Crypto_project
    echo CLONE_BACKEND_OK
  "
```

---

### Bước 4.3 — Cấu hình .env trên VM-BACKEND

```bash
az vm run-command invoke -g $RG -n $VM_BACKEND \
  --command-id RunShellScript \
  --scripts "
    cd /home/azureuser/Crypto_project
    cp core/.env.example core/.env

    BACKEND_IP=\$(hostname -I | awk '{print \$1}')
    echo \"Backend private IP: \$BACKEND_IP\"

    # Keycloak hostname
    echo \"KC_HOSTNAME=\$BACKEND_IP\"          >> core/.env
    echo \"KC_HOSTNAME_STRICT=false\"           >> core/.env
    echo \"KC_HOSTNAME_STRICT_BACKCHANNEL=false\" >> core/.env

    # Token URL
    sed -i \"s|KEYCLOAK_TOKEN_URL=.*|KEYCLOAK_TOKEN_URL=http://\${BACKEND_IP}:8080/realms/shopflow/protocol/openid-connect/token|\" core/.env

    # Issuers (thêm cả internal docker name và private IP)
    sed -i \"s|^#.*KEYCLOAK_ISSUERS.*||\" core/.env
    echo \"KEYCLOAK_ISSUERS=http://keycloak:8080/realms/shopflow,http://\${BACKEND_IP}:8080/realms/shopflow\" >> core/.env

    echo '=== core/.env (phần quan trọng) ==='
    grep -E 'KC_HOST|KEYCLOAK_TOKEN|KEYCLOAK_ISSUERS|VAULT|REDIS' core/.env
    echo CONFIG_BACKEND_OK
  "
```

**Kết quả mong đợi:** Thấy `CONFIG_BACKEND_OK` và các dòng cấu hình đúng.

---

### Bước 4.4 — Expose service ports trên VM-BACKEND

```bash
az vm run-command invoke -g $RG -n $VM_BACKEND \
  --command-id RunShellScript \
  --scripts "
    cd /home/azureuser/Crypto_project

    python3 << 'PYEOF'
import yaml, os

updates = {
    'deploy/node-app-a/docker-compose.yml': {
        'order-service': {'ports': ['8082:8080']},
        'user-service':  {'ports': ['8083:8080']},
    },
    'deploy/node-app-b/docker-compose.yml': {
        'billing-service': {'ports': ['8084:8080']},
        'auth-service':    {'ports': ['8085:8080']},
    },
}

for filepath, services in updates.items():
    if not os.path.exists(filepath):
        print(f'SKIP {filepath} (not found)')
        continue
    with open(filepath) as f:
        data = yaml.safe_load(f)
    for svc, cfg in services.items():
        if 'services' in data and svc in data['services']:
            data['services'][svc].update(cfg)
            print(f'  Updated {svc} in {filepath}')
    with open(filepath, 'w') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True)

print('PORTS_OK')
PYEOF
  "
```

---

### Bước 4.5 — Cấu hình VM-EDGE (.env + extra_hosts)

```bash
ssh -o StrictHostKeyChecking=no $ADMIN_USER@$EDGE_PUBLIC_IP "
  cd ~/Crypto_project
  cp core/.env.example core/.env

  # Update .env cho edge
  sed -i 's|KEYCLOAK_TOKEN_URL=.*|KEYCLOAK_TOKEN_URL=http://${BACKEND_PRIVATE_IP}:8080/realms/shopflow/protocol/openid-connect/token|' core/.env
  echo 'KEYCLOAK_ISSUERS=http://keycloak:8080/realms/shopflow,http://${BACKEND_PRIVATE_IP}:8080/realms/shopflow' >> core/.env

  # Thêm extra_hosts vào kong và webhook-authorizer
  python3 << 'PYEOF'
import yaml, os

BACKEND = '${BACKEND_PRIVATE_IP}'
filepath = 'deploy/node-edge/docker-compose.yml'

extra_hosts = [
    f'order-service:{BACKEND}',
    f'user-service:{BACKEND}',
    f'billing-service:{BACKEND}',
    f'auth-service:{BACKEND}',
    f'keycloak:{BACKEND}',
    f'redis:{BACKEND}',
    f'webhook-authorizer:{BACKEND}',
    f'vault:{BACKEND}',
]

with open(filepath) as f:
    data = yaml.safe_load(f)

for svc_name in ['kong', 'webhook-authorizer', 'billing-mtls-proxy', 'internal-mtls-proxy']:
    if 'services' in data and svc_name in data['services']:
        data['services'][svc_name]['extra_hosts'] = extra_hosts
        print(f'  Added extra_hosts to {svc_name}')

with open(filepath, 'w') as f:
    yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
print('EXTRA_HOSTS_OK')
PYEOF
"
```

---

## PHASE 5 — Deploy Backend (VM-BACKEND)

> ⏱️ Bước này mất 5–10 phút (build Docker images lần đầu).

```bash
az vm run-command invoke -g $RG -n $VM_BACKEND \
  --command-id RunShellScript \
  --timeout-in-seconds 600 \
  --scripts "
    cd /home/azureuser/Crypto_project
    ENV=core/.env

    echo '[1/5] Starting Data (PostgreSQL)...'
    docker compose -f deploy/node-data/docker-compose.yml -p shopflow-data --env-file \$ENV up -d
    sleep 15

    echo '[2/5] Starting Security (Vault + Redis)...'
    docker compose -f deploy/node-security/docker-compose.yml -p shopflow-security --env-file \$ENV up -d
    sleep 10

    echo '[3/5] Starting Identity (Keycloak)...'
    docker compose -f deploy/node-identity/docker-compose.yml -p shopflow-identity --env-file \$ENV up -d
    echo '  (Keycloak JVM can take 60-90s to start, continuing...)'

    echo '[4/5] Starting App nodes...'
    docker compose -f deploy/node-app-a/docker-compose.yml -p shopflow-app-a --env-file \$ENV up -d --build
    docker compose -f deploy/node-app-b/docker-compose.yml -p shopflow-app-b --env-file \$ENV up -d --build

    echo '[5/5] Starting Observability...'
    docker compose -f deploy/node-obs/docker-compose.yml -p shopflow-obs --env-file \$ENV up -d

    echo ''
    echo '=== Container Status ==='
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    echo BACKEND_DEPLOY_OK
  "
```

**Kết quả mong đợi:** Thấy `BACKEND_DEPLOY_OK` và danh sách ~14 containers ở trạng thái `Up`.

---

## PHASE 6 — Init Vault

```bash
az vm run-command invoke -g $RG -n $VM_BACKEND \
  --command-id RunShellScript \
  --timeout-in-seconds 120 \
  --scripts "
    cd /home/azureuser/Crypto_project
    sleep 15

    # Check vault status
    STATUS=\$(docker exec vault vault status -format=json 2>/dev/null | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d[\"initialized\"],d[\"sealed\"])' 2>/dev/null || echo 'false true')
    INITIALIZED=\$(echo \$STATUS | awk '{print \$1}')
    SEALED=\$(echo \$STATUS | awk '{print \$2}')

    echo \"Vault initialized=\$INITIALIZED sealed=\$SEALED\"

    if [ \"\$INITIALIZED\" = \"False\" ]; then
      echo 'Initializing Vault...'
      INIT_JSON=\$(docker exec vault vault operator init -key-shares=1 -key-threshold=1 -format=json)
      UNSEAL_KEY=\$(echo \"\$INIT_JSON\" | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"unseal_keys_b64\"][0])')
      ROOT_TOKEN=\$(echo \"\$INIT_JSON\" | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"root_token\"])')
      echo \"\$UNSEAL_KEY\" > core/vault/.vault-unseal-key
      echo \"\$ROOT_TOKEN\"  > core/vault/.vault-root-token
      echo 'Vault initialized'
    else
      echo 'Vault already initialized, reading existing keys...'
      UNSEAL_KEY=\$(cat core/vault/.vault-unseal-key 2>/dev/null || echo '')
      ROOT_TOKEN=\$(cat core/vault/.vault-root-token  2>/dev/null || echo '')
    fi

    # Unseal
    if [ -n \"\$UNSEAL_KEY\" ]; then
      docker exec vault vault operator unseal \"\$UNSEAL_KEY\"
      echo 'Vault unsealed'
    fi

    # Cấu hình secrets engines (idempotent)
    docker exec -e VAULT_TOKEN=\"\$ROOT_TOKEN\" vault vault secrets enable -path=secret kv-v2 2>/dev/null || true
    docker exec -e VAULT_TOKEN=\"\$ROOT_TOKEN\" vault vault kv put secret/hmac webhook_secret='lab-hmac-secret-change-me' 2>/dev/null || true
    docker exec -e VAULT_TOKEN=\"\$ROOT_TOKEN\" vault vault secrets enable transit 2>/dev/null || true
    docker exec -e VAULT_TOKEN=\"\$ROOT_TOKEN\" vault vault write -f transit/keys/shopflow-master 2>/dev/null || true

    # Policy
    docker exec -e VAULT_TOKEN=\"\$ROOT_TOKEN\" vault vault policy write shopflow-app - << 'VEOF'
path \"secret/data/*\"                   { capabilities = [\"read\"] }
path \"transit/encrypt/shopflow-master\" { capabilities = [\"update\"] }
path \"transit/decrypt/shopflow-master\" { capabilities = [\"update\"] }
VEOF

    # App token
    APP_TOKEN=\$(docker exec -e VAULT_TOKEN=\"\$ROOT_TOKEN\" vault \
      vault token create -policy=shopflow-app -format=json | \
      python3 -c 'import sys,json; print(json.load(sys.stdin)[\"auth\"][\"client_token\"])')
    echo \"\$APP_TOKEN\" > core/vault/.vault-app-token
    sed -i \"s|VAULT_APP_TOKEN=.*|VAULT_APP_TOKEN=\$APP_TOKEN|\" core/.env
    echo \"App token saved\"

    # Verify
    echo 'Vault status:'
    docker inspect vault --format '{{.State.Health.Status}}'
    echo VAULT_OK
  "
```

**Kết quả mong đợi:** Thấy `VAULT_OK` và `healthy`.

---

### Bước 6.1 — Restart services để nhận Vault token mới

```bash
az vm run-command invoke -g $RG -n $VM_BACKEND \
  --command-id RunShellScript \
  --scripts "
    cd /home/azureuser/Crypto_project
    docker compose -f deploy/node-app-a/docker-compose.yml -p shopflow-app-a --env-file core/.env restart
    docker compose -f deploy/node-app-b/docker-compose.yml -p shopflow-app-b --env-file core/.env restart
    sleep 20
    docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'service|auth|billing'
    echo RESTART_OK
  "
```

---

## PHASE 7 — Đợi Keycloak + Sync Kong JWT Key

### Bước 7.1 — Kiểm tra Keycloak sẵn sàng

```bash
echo "Đợi Keycloak... (có thể mất đến 90 giây)"
for i in $(seq 1 30); do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://$BACKEND_PUBLIC_IP:8080/realms/shopflow/.well-known/openid-configuration" 2>/dev/null)
  if [ "$HTTP" = "200" ]; then
    echo "✅ Keycloak ready!"
    break
  fi
  echo "  Thử $i/30 (HTTP $HTTP)... chờ 10s"
  sleep 10
done
[ "$HTTP" != "200" ] && echo "❌ Keycloak chưa sẵn sàng - đợi thêm rồi chạy lại bước này"
```

---

### Bước 7.2 — Sync public key Keycloak vào Kong

```bash
ssh -o StrictHostKeyChecking=no $ADMIN_USER@$EDGE_PUBLIC_IP "
  cd ~/Crypto_project
  BACKEND_IP='${BACKEND_PRIVATE_IP}'

  python3 << 'PYEOF'
import urllib.request, json, base64, textwrap, subprocess, re, sys

BACKEND = '${BACKEND_PRIVATE_IP}'

# Lấy JWKS từ Keycloak
try:
    url = f'http://{BACKEND}:8080/realms/shopflow/protocol/openid-connect/certs'
    resp = urllib.request.urlopen(url, timeout=10)
    jwks = json.loads(resp.read())
except Exception as e:
    print(f'ERROR: Không lấy được JWKS: {e}')
    sys.exit(1)

# Tìm key RS256 dùng để ký
key = next((k for k in jwks['keys'] if k.get('use', 'sig') == 'sig' and k.get('alg', 'RS256') == 'RS256'), None)
if not key:
    key = jwks['keys'][0]

# Dùng x5c (certificate) để extract public key qua openssl
if 'x5c' not in key:
    print('ERROR: Không có x5c trong JWKS')
    sys.exit(1)

cert_der = base64.b64decode(key['x5c'][0])
result = subprocess.run(
    ['openssl', 'x509', '-inform', 'DER', '-pubkey', '-noout'],
    input=cert_der, capture_output=True
)
if result.returncode != 0:
    print(f'ERROR openssl: {result.stderr.decode()}')
    sys.exit(1)

pub_pem = result.stdout.decode().strip()
print(f'Public key extracted ({len(pub_pem)} chars)')

# Update kong.yml
with open('core/kong/kong.yml') as f:
    content = f.read()

ISSUER_INTERNAL = 'http://keycloak:8080/realms/shopflow'
ISSUER_EXTERNAL  = f'http://{BACKEND}:8080/realms/shopflow'

# Indent PEM cho YAML (10 spaces)
pem_indented = '\n'.join('          ' + line for line in pub_pem.split('\n'))

# Thay thế toàn bộ consumer block bằng block mới có 2 issuers
new_consumer = f'''consumers:
  - username: keycloak-realm-users
    jwt_secrets:
      - key: {ISSUER_INTERNAL}
        algorithm: RS256
        rsa_public_key: |-
{pem_indented}
      - key: {ISSUER_EXTERNAL}
        algorithm: RS256
        rsa_public_key: |-
{pem_indented}
'''

# Tìm và thay consumers block
content_new = re.sub(
    r'^consumers:.*?(?=^services:)',
    new_consumer,
    content,
    flags=re.MULTILINE | re.DOTALL
)

with open('core/kong/kong.yml', 'w') as f:
    f.write(content_new)

print(f'kong.yml updated:')
print(f'  Issuer 1: {ISSUER_INTERNAL}')
print(f'  Issuer 2: {ISSUER_EXTERNAL}')
print('KONG_SYNC_OK')
PYEOF
"
```

**Kết quả mong đợi:** Thấy `KONG_SYNC_OK`.

---

## PHASE 8 — Deploy Edge (VM-EDGE)

```bash
ssh -o StrictHostKeyChecking=no $ADMIN_USER@$EDGE_PUBLIC_IP "
  cd ~/Crypto_project
  docker compose -f deploy/node-edge/docker-compose.yml \
    -p shopflow-edge --env-file core/.env up -d --build
  echo EDGE_DEPLOY_OK
"
```

**Kết quả mong đợi:** Thấy `EDGE_DEPLOY_OK`.

```bash
# Đợi Kong khởi động
sleep 20
ssh -o StrictHostKeyChecking=no $ADMIN_USER@$EDGE_PUBLIC_IP \
  "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

---

## PHASE 9 — Kiểm tra toàn bộ

```bash
echo ""
echo "========== SMOKE TEST =========="
echo "API Base URL: http://$EDGE_PUBLIC_IP:8888"
echo ""

# Lấy token
TOKEN=$(curl -s -X POST \
  "http://$BACKEND_PUBLIC_IP:8080/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-a-user&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','ERROR'))" 2>/dev/null)

if [ "$TOKEN" = "ERROR" ] || [ -z "$TOKEN" ]; then
  echo "❌ Không lấy được token — kiểm tra Keycloak"
else
  echo "✅ Token OK (${#TOKEN} ký tự)"
fi

echo ""
run_test() {
  printf "  %-45s" "$1"
  RESULT=$(eval "$2" 2>/dev/null)
  if [ "$RESULT" = "$3" ]; then
    echo "✅ $RESULT"
  else
    echo "❌ $RESULT (mong đợi $3)"
  fi
}

run_test "GET /api/orders (expect 200)" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' http://$EDGE_PUBLIC_IP:8888/api/orders" \
  "200"

run_test "D1 BOLA cross-tenant (expect 403)" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' http://$EDGE_PUBLIC_IP:8888/api/orders/order-tenant-b" \
  "403"

run_test "Không có token (expect 401)" \
  "curl -s -o /dev/null -w '%{http_code}' http://$EDGE_PUBLIC_IP:8888/api/orders" \
  "401"

run_test "GET /api/users (expect 200)" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' http://$EDGE_PUBLIC_IP:8888/api/users" \
  "200"

# D2: token replay
REFRESH=$(curl -s -X POST \
  "http://$BACKEND_PUBLIC_IP:8080/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=password&client_id=shopflow-spa&username=tenant-b-user&password=password123" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)

run_test "D2 refresh token lần 1 (expect 200)" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST http://$EDGE_PUBLIC_IP:8888/api/auth/refresh -H 'Content-Type: application/json' -d '{\"refresh_token\":\"$REFRESH\"}'" \
  "200"

run_test "D2 replay same token (expect 401)" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST http://$EDGE_PUBLIC_IP:8888/api/auth/refresh -H 'Content-Type: application/json' -d '{\"refresh_token\":\"$REFRESH\"}'" \
  "401"

# D4: SSRF
run_test "D4 SSRF metadata (expect 403)" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST http://$EDGE_PUBLIC_IP:8888/api/users/fetch-url -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"url\":\"http://169.254.169.254/metadata/instance\"}'" \
  "403"

# D5: Vault Transit — dùng M2M token (client_credentials)
M2M_TOKEN=$(curl -s -X POST \
  "http://$BACKEND_PUBLIC_IP:8080/realms/shopflow/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=shopflow-s2s&client_secret=shopflow-s2s-secret-change-in-prod" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','ERROR'))" 2>/dev/null)

run_test "D5 Vault Transit encrypt (expect 200)" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST http://$EDGE_PUBLIC_IP:8888/api/billing/vault-encrypt -H 'Authorization: Bearer $M2M_TOKEN' -H 'Content-Type: application/json' -d '{\"plaintext\":\"amount=50000000\"}'" \
  "200"

echo ""
echo "========== THÔNG TIN KẾT NỐI =========="
echo "  API (HTTP)  : http://$EDGE_PUBLIC_IP:8888"
echo "  API (HTTPS) : https://$EDGE_PUBLIC_IP:8444"
echo "  Webhook mTLS: https://$EDGE_PUBLIC_IP:8443"
echo "  Keycloak    : http://$BACKEND_PUBLIC_IP:8080/admin  (admin/admin)"
echo "  Grafana     : http://$BACKEND_PUBLIC_IP:3000        (admin/admin)"
echo "  Prometheus  : http://$BACKEND_PUBLIC_IP:9090"
echo "========================================"
```

---

## PHASE 10 — Khoá VM-BACKEND khỏi internet

Sau khi setup xong, khoá VM-BACKEND để chỉ VM-EDGE được kết nối vào — **đây là điểm quan trọng về kiến trúc trust zone**.

```bash
# Lấy tên NSG của VM-BACKEND
BACKEND_NSG=$(az network nsg list -g $RG \
  --query "[?contains(name,'$VM_BACKEND')].name" -o tsv | head -1)
echo "NSG VM-BACKEND: $BACKEND_NSG"

# Cho phép VM-EDGE kết nối vào (tất cả cổng)
az network nsg rule create \
  --resource-group $RG \
  --nsg-name $BACKEND_NSG \
  --name "allow-from-edge" \
  --priority 110 \
  --source-address-prefixes $EDGE_PRIVATE_IP \
  --destination-port-ranges "*" \
  --access Allow \
  --protocol "*"

# Từ chối tất cả kết nối từ internet (trừ những rule priority cao hơn)
az network nsg rule create \
  --resource-group $RG \
  --nsg-name $BACKEND_NSG \
  --name "deny-internet" \
  --priority 4000 \
  --source-address-prefixes Internet \
  --destination-port-ranges "*" \
  --access Deny \
  --protocol "*"

echo "✅ VM-BACKEND đã được khoá khỏi internet"
echo "   Chỉ $EDGE_PRIVATE_IP (VM-EDGE) mới được kết nối vào"
```

> ⚠️ **Sau bước này,** `$BACKEND_PUBLIC_IP:8080` (Keycloak) và `$BACKEND_PUBLIC_IP:3000` (Grafana) sẽ không còn truy cập được từ browser trực tiếp. Dùng browser vào qua `$EDGE_PUBLIC_IP:8888` hoặc tạm thời gỡ rule deny khi cần debug.

---

## Sử dụng hàng ngày

### Tắt VM để tiết kiệm credit

```bash
# Tắt (deallocate = không tốn tiền compute, chỉ tốn tiền lưu trữ ~$0.05/ngày)
az vm deallocate -g shopflow-rg -n vm-edge    --no-wait
az vm deallocate -g shopflow-rg -n vm-backend --no-wait
echo "✅ Cả 2 VM đã tắt"
```

### Bật lại khi cần demo

```bash
echo "Bật VM..."
az vm start -g shopflow-rg -n vm-backend --no-wait
az vm start -g shopflow-rg -n vm-edge    --no-wait

# Đợi cả 2 bật xong
az vm wait -g shopflow-rg -n vm-backend --updated
az vm wait -g shopflow-rg -n vm-edge    --updated
echo "✅ VM đã bật"

# Lấy lại IP (IP public có thể thay đổi sau khi stop/start)
EDGE_PUBLIC_IP=$(az vm show -d -g shopflow-rg -n vm-edge    --query publicIps -o tsv)
BACKEND_PUBLIC_IP=$(az vm show -d -g shopflow-rg -n vm-backend --query publicIps -o tsv)
BACKEND_PRIVATE_IP=$(az vm show -d -g shopflow-rg -n vm-backend --query privateIps -o tsv)
echo "VM-EDGE    public: $EDGE_PUBLIC_IP"
echo "VM-BACKEND public: $BACKEND_PUBLIC_IP"
```

> ⚠️ **Vault bị sealed sau mỗi lần restart** — phải unseal trước khi dùng.

### Unseal Vault sau khi bật lại

```bash
# Đọc unseal key đã lưu
UNSEAL_KEY=$(az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "cat /home/azureuser/Crypto_project/core/vault/.vault-unseal-key" \
  --query "value[0].message" -o tsv | grep -v '\[stdout\]\|\[stderr\]' | tr -d '\n')

# Unseal
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker exec vault vault operator unseal '$UNSEAL_KEY' && echo VAULT_UNSEALED"

echo "✅ Vault unsealed"
```

---

## Xử lý sự cố

### Lỗi: Kong trả 500 sau khi deploy edge

```bash
ssh -o StrictHostKeyChecking=no azureuser@$EDGE_PUBLIC_IP \
  "docker logs kong --tail 20"
```

Nếu thấy lỗi cjson hoặc JWT:
```bash
# Sync lại Kong JWT key (chạy lại Phase 7.2)
```

### Lỗi: Không lấy được token (Keycloak)

```bash
# Kiểm tra Keycloak log
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker logs keycloak --tail 30"
```

### Lỗi: Service trả 502 Bad Gateway từ Kong

```bash
# Kiểm tra service đang chạy trên VM-BACKEND
az vm run-command invoke -g shopflow-rg -n vm-backend \
  --command-id RunShellScript \
  --scripts "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

### Muốn xem Grafana/Keycloak từ browser

```bash
# Tạm thời mở cổng cho IP của bạn
MY_IP=$(curl -s https://api.ipify.org)
BACKEND_NSG=$(az network nsg list -g shopflow-rg \
  --query "[?contains(name,'vm-backend')].name" -o tsv | head -1)

az network nsg rule create -g shopflow-rg --nsg-name $BACKEND_NSG \
  --name "temp-my-access" --priority 105 \
  --source-address-prefixes $MY_IP \
  --destination-port-ranges "8080" "3000" "9090" \
  --access Allow --protocol "Tcp"

echo "Grafana  : http://$BACKEND_PUBLIC_IP:3000"
echo "Keycloak : http://$BACKEND_PUBLIC_IP:8080/admin"
echo "(Nhớ xóa rule này sau khi dùng xong)"

# Xóa rule tạm sau khi dùng xong
# az network nsg rule delete -g shopflow-rg --nsg-name $BACKEND_NSG --name "temp-my-access"
```

### Xóa toàn bộ khi không cần nữa

```bash
# Xóa TOÀN BỘ resource group (không thể hoàn tác)
az group delete --name shopflow-rg --yes --no-wait
echo "✅ Đã xóa toàn bộ resources"
```

---

## Ước tính chi phí

| VM | Size | Giá/giờ | 8 giờ/ngày | 7 ngày |
|----|------|---------|-----------|--------|
| VM-EDGE | Standard_B2s | $0.048 | $0.38 | $2.69 |
| VM-BACKEND | Standard_B4ms | $0.184 | $1.47 | $10.30 |
| **Tổng (8h/ngày)** | | | **$1.85** | **$13** |
| **Tổng (24h/ngày)** | | | **$5.57** | **$39** |

**Còn lại sau 1 tuần demo (8h/ngày):** ~$87 từ $100.

---

## Kết quả sau khi deploy thành công

```
✅ D1 BOLA          : http://<EDGE-IP>:8888/api/orders/order-tenant-b → 403
✅ D2 Token Replay  : replay refresh token → 401 TOKEN_REPLAY
✅ D3 Webhook mTLS  : https://<EDGE-IP>:8443/api/billing/webhook
✅ D4 SSRF          : http://169.254.169.254 → 403 (Azure IMDS thật!)
✅ D5 Vault Transit : /api/billing/vault-encrypt → 200 {"ciphertext":"vault:v1:..."}
✅ Grafana          : http://<BACKEND-IP>:3000
✅ Keycloak         : http://<BACKEND-IP>:8080/admin
```

> **Lưu ý kỹ thuật đã fix:** `core/kong/kong.yml` dùng Lua string pattern thay `require("cjson.safe")` để tương thích Kong 3.x sandbox. Không cần thay đổi thêm.

*Cập nhật lần cuối: 2026-06-01. Tested với Azure Southeast Asia, Ubuntu 22.04, Docker 25.x. D1–D5 PASS.*

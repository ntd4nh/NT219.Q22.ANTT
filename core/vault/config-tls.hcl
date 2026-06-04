# Vault config WITH TLS — dùng cho deploy trên nền semi-trust (Azure).
# Bật bằng: VAULT_CONFIG_FILE=config-tls.hcl trong core/.env (xem .env.example).
# Cert do core/certs/generate-certs.ps1 sinh (vault.crt/vault.key, ký bởi NT219-Lab-CA),
# được mount vào /vault/certs trong deploy/node-security/docker-compose.yml.
ui = true

listener "tcp" {
  address         = "0.0.0.0:8200"
  tls_cert_file   = "/vault/certs/vault.crt"
  tls_key_file    = "/vault/certs/vault.key"
  tls_min_version = "tls12"
}

storage "file" {
  path = "/vault/file"
}

api_addr      = "https://vault:8200"
disable_mlock = true

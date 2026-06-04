import fs from 'fs'
import { isProductionEnv } from './security-config.js'
import { fetchVaultSecret } from './vault-secrets.js'

// DB_SSL: disable | require | verify-ca | verify-full. Mặc định ép TLS trong production.
function databaseSslMode() {
  return (process.env.DB_SSL || (isProductionEnv() ? 'require' : 'disable')).toLowerCase()
}

/**
 * Tùy chọn `ssl` cho pg.Pool. Trả về false khi tắt; object khi bật.
 * - require: mã hóa kênh truyền, không verify chuỗi cert (đủ chống nghe lén nội bộ).
 * - verify-ca/verify-full: verify theo DB_SSL_CA (CA của lab, vd /certs/ca.crt).
 */
export function databaseSslOption() {
  const mode = databaseSslMode()
  if (mode === 'disable') return false
  const caPath = process.env.DB_SSL_CA
  if ((mode === 'verify-ca' || mode === 'verify-full') && caPath && fs.existsSync(caPath)) {
    return { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
  }
  return { rejectUnauthorized: false }
}

export async function resolveDatabaseUrl() {
  const explicit = process.env.DATABASE_URL
  const vaultRequired = process.env.VAULT_DB_REQUIRED === 'true' || isProductionEnv()

  if (explicit && !vaultRequired) return explicit

  const user =
    (await fetchVaultSecret('secret/data/db-credentials', 'username', { required: vaultRequired })) ||
    process.env.DB_USER ||
    'shopflow_app'
  const password =
    (await fetchVaultSecret('secret/data/db-credentials', 'password', { required: vaultRequired })) ||
    process.env.DB_PASSWORD

  if (!password) {
    throw new Error('DB password required: set Vault secret/data/db-credentials or DB_PASSWORD')
  }

  const host = process.env.DB_HOST || 'app-db'
  const db = process.env.DB_NAME || 'shopflow'
  const port = process.env.DB_PORT || '5432'
  const mode = databaseSslMode()
  const sslParam = mode === 'disable' ? '' : `?sslmode=${mode}`
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}${sslParam}`
}

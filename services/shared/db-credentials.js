import { isProductionEnv } from './security-config.js'
import { fetchVaultSecret } from './vault-secrets.js'

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
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`
}

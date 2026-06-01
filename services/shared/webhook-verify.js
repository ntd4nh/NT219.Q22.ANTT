import crypto from 'crypto'
import { isProductionEnv } from './security-config.js'
import { fetchVaultSecret, timingSafeEqualHex } from './vault-secrets.js'
import { markOnce, nonceKey } from './redis-state.js'

const TIMESTAMP_WINDOW_SEC = 300

export async function loadWebhookSecret(log) {
  const required = process.env.VAULT_REQUIRED === 'true' || isProductionEnv()
  const fromVault = await fetchVaultSecret('secret/data/hmac', 'webhook_secret', { required })
  if (fromVault) return fromVault
  if (required) throw new Error('Vault webhook_secret required when VAULT_REQUIRED=true')
  const labSecret = process.env.HMAC_SECRET
  if (!labSecret && isProductionEnv()) {
    throw new Error('HMAC_SECRET or Vault secret required in production')
  }
  const secret = labSecret || 'lab-hmac-secret-change-me'
  if (!isProductionEnv() && log) {
    log('hmac_lab_fallback', { mode: 'env_or_default' })
  }
  return secret
}

export function computeWebhookHmac(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

export async function verifyWebhookRequest(req, webhookSecret, nonceTtlSec = 300) {
  const sigHeader = req.headers['x-signature'] || ''
  const timestamp = req.headers['x-timestamp']
  const nonce = req.headers['x-nonce']
  if (!sigHeader || !timestamp || !nonce) {
    return { ok: false, reason: 'MISSING_HEADERS' }
  }

  const ts = Number(timestamp)
  const now = Math.floor(Date.now() / 1000)
  if (Number.isNaN(ts) || Math.abs(now - ts) > TIMESTAMP_WINDOW_SEC) {
    return { ok: false, reason: 'TIMESTAMP_OUT_OF_WINDOW' }
  }

  const replay = await markOnce(nonceKey(nonce), nonceTtlSec)
  if (replay) return { ok: false, reason: 'NONCE_REPLAY' }

  // Bắt buộc raw Buffer: JSON.stringify(req.body) không byte-identical với body gốc
  // (key order, whitespace, unicode escapes có thể khác) → HMAC mismatch hoặc bypass.
  // Caller phải mount express.raw({ type: '*/*' }) trước middleware này.
  if (!Buffer.isBuffer(req.body)) {
    return { ok: false, reason: 'RAW_BODY_REQUIRED' }
  }
  const raw = req.body
  const expectedHex = computeWebhookHmac(webhookSecret, raw)
  const provided = sigHeader.replace(/^sha256=/i, '')
  if (!timingSafeEqualHex(provided, expectedHex)) {
    return { ok: false, reason: 'INVALID_SIGNATURE' }
  }
  return { ok: true, rawBody: raw }
}

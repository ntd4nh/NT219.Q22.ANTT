import express from 'express'
import crypto from 'crypto'
import {
  createLogger,
  correlationMiddleware,
  fetchVaultSecret,
  timingSafeEqualHex,
  metricsHandler,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
  isProductionEnv,
} from '../shared/index.js'
import { markOnce, nonceKey } from '../shared/redis-state.js'

validateSecurityConfig('billing-service')

const app = express()
const log = createLogger('billing-service')
const port = Number(process.env.PORT || 8080)

let webhookSecret = null
const TIMESTAMP_WINDOW_SEC = 300
const NONCE_TTL_SEC = Number(process.env.WEBHOOK_NONCE_TTL_SEC || 300)

app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf } }))
app.use(correlationMiddleware())

async function loadSecrets() {
  const required = process.env.VAULT_REQUIRED === 'true' || isProductionEnv()
  const fromVault = await fetchVaultSecret('secret/data/hmac', 'webhook_secret', { required })
  if (fromVault) {
    webhookSecret = fromVault
    return
  }
  if (required) throw new Error('Vault webhook_secret required when VAULT_REQUIRED=true')
  const labSecret = process.env.HMAC_SECRET
  if (!labSecret && isProductionEnv()) {
    throw new Error('HMAC_SECRET or Vault secret required in production')
  }
  webhookSecret = labSecret || 'lab-hmac-secret-change-me'
  if (!isProductionEnv()) {
    log('hmac_lab_fallback', { mode: 'env_or_default' })
  }
}

function computeHmac(body) {
  return crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
}

async function verifyWebhook(req) {
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

  const replay = await markOnce(nonceKey(nonce), NONCE_TTL_SEC)
  if (replay) return { ok: false, reason: 'NONCE_REPLAY' }

  const expectedHex = computeHmac(req.rawBody || Buffer.from(JSON.stringify(req.body || {})))
  const provided = sigHeader.replace(/^sha256=/i, '')
  if (!timingSafeEqualHex(provided, expectedHex)) {
    return { ok: false, reason: 'INVALID_SIGNATURE' }
  }
  return { ok: true }
}

app.get('/metrics', metricsHandler)
app.get('/health', async (_req, res) => {
  try {
    const redis = await redisPing()
    res.json({ status: 'ok', service: 'billing-service', redis, vaultRequired: process.env.VAULT_REQUIRED === 'true' })
  } catch (e) {
    res.status(503).json({ status: 'error', service: 'billing-service', message: e.message })
  }
})

app.post('/api/billing/test-sign', (req, res) => {
  const body = JSON.stringify(req.body || { event: 'payment.succeeded', id: 'evt-test' })
  const signature = `sha256=${computeHmac(Buffer.from(body))}`
  res.json({ signature, body: JSON.parse(body) })
})

app.post('/api/billing/webhook', async (req, res) => {
  const result = await verifyWebhook(req)
  if (!result.ok) {
    incMetric('shopflow_webhook_rejected_total')
    securityAudit(log, 'WEBHOOK_REJECTED', {
      correlationId: req.correlationId,
      reason: result.reason,
    })
    return res.status(401).json({ error: 'WEBHOOK_REJECTED', reason: result.reason })
  }
  log('webhook_accepted', { correlationId: req.correlationId, event: req.body?.event })
  res.status(200).json({ received: true })
})

app.get('/api/billing', (_req, res) => res.json({ service: 'billing' }))

loadSecrets()
  .then(() => {
    app.listen(port, () => log('startup', { port, vaultRequired: process.env.VAULT_REQUIRED === 'true' }))
  })
  .catch((e) => {
    console.error(JSON.stringify({ event: 'startup_failed', service: 'billing-service', error: e.message }))
    process.exit(1)
  })

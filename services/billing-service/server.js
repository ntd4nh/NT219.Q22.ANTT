import express from 'express'
import crypto from 'crypto'
import {
  createLogger,
  correlationMiddleware,
  fetchVaultSecret,
  timingSafeEqualHex,
  metricsHandler,
  metricsMiddleware,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
  isProductionEnv,
  requireM2mAuth,
  opaAllow,
  opaDenyReason,
  isOpaEnabled,
} from '../shared/index.js'
import { markOnce, nonceKey } from '../shared/redis-state.js'

validateSecurityConfig('billing-service')

const app = express()
const log = createLogger('billing-service')
const port = Number(process.env.PORT || 8080)

let webhookSecret = null
const TIMESTAMP_WINDOW_SEC = 300
const NONCE_TTL_SEC = Number(process.env.WEBHOOK_NONCE_TTL_SEC || 300)

const jsonParser = express.json({
  verify: (req, _res, buf) => { req.rawBody = buf },
  type: (req) => req.path !== '/api/billing/webhook',
})

app.use(jsonParser)
app.use(correlationMiddleware())
app.use(metricsMiddleware('billing-service'))

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

  const raw = Buffer.isBuffer(req.body)
    ? req.body
    : (req.rawBody || Buffer.from(JSON.stringify(req.body || {})))
  const expectedHex = computeHmac(raw)
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

app.post('/api/billing/webhook', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  const result = await verifyWebhook(req)
  if (!result.ok) {
    incMetric('shopflow_webhook_rejected_total')
    securityAudit(log, 'WEBHOOK_REJECTED', {
      correlationId: req.correlationId,
      reason: result.reason,
    })
    return res.status(401).json({ error: 'WEBHOOK_REJECTED', reason: result.reason })
  }
  let eventName = null
  if (Buffer.isBuffer(req.body) && req.body.length) {
    try {
      const parsed = JSON.parse(req.body.toString('utf8'))
      eventName = parsed?.event || null
    } catch {
      return res.status(400).json({ error: 'BAD_REQUEST', reason: 'INVALID_JSON' })
    }
  }
  log('webhook_accepted', { correlationId: req.correlationId, event: eventName })
  res.status(200).json({ received: true, event: eventName })
})

app.get('/api/billing', (_req, res) => res.json({ service: 'billing' }))

const m2mAuth = requireM2mAuth({ log })
app.get('/api/internal/billing/status', m2mAuth, async (req, res) => {
  const opaInput = {
    action: 'read',
    subject: { client_id: req.m2m.clientId, sub: req.m2m.sub },
    resource: { type: 'billing_status' },
  }
  if (isOpaEnabled()) {
    const { allow } = await opaAllow('shopflow.billing', opaInput)
    if (!allow) {
      const reason = await opaDenyReason('shopflow.billing', opaInput)
      incMetric('shopflow_opa_denied_total', { reason_code: reason })
      return res.status(403).json({ error: 'FORBIDDEN', reason_code: reason })
    }
  }
  res.json({ service: 'billing', vault_required: process.env.VAULT_REQUIRED === 'true' })
})

loadSecrets()
  .then(() => {
    app.listen(port, () => log('startup', { port, vaultRequired: process.env.VAULT_REQUIRED === 'true' }))
  })
  .catch((e) => {
    console.error(JSON.stringify({ event: 'startup_failed', service: 'billing-service', error: e.message }))
    process.exit(1)
  })

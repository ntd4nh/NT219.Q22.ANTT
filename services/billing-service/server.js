import express from 'express'
import {
  createLogger,
  correlationMiddleware,
  fetchVaultSecret,
  vaultTransitEncrypt,
  vaultTransitDecrypt,
  computeWebhookHmac,
  metricsHandler,
  metricsMiddleware,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
  isProductionEnv,
  requireM2mAuth,
} from '../shared/index.js'
import { loadWebhookSecret } from '../shared/webhook-verify.js'

validateSecurityConfig('billing-service')

const app = express()
const log = createLogger('billing-service')
const port = Number(process.env.PORT || 8080)
const internalToken =
  process.env.WEBHOOK_INTERNAL_SECRET || 'lab-webhook-internal-secret-change-me'

let webhookSecret = null

app.use(express.json())
app.use(correlationMiddleware())
app.use(metricsMiddleware('billing-service'))

async function loadSecrets() {
  webhookSecret = await loadWebhookSecret(log)
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
  const signature = `sha256=${computeWebhookHmac(webhookSecret, Buffer.from(body))}`
  res.json({ signature, body: JSON.parse(body) })
})

app.post('/api/internal/billing/webhook', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  if (req.headers['x-webhook-internal-token'] !== internalToken) {
    return res.status(403).json({ error: 'FORBIDDEN', reason: 'INVALID_INTERNAL_TOKEN' })
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
  log('webhook_accepted', { correlationId: req.correlationId, event: eventName, stage: 'billing' })
  res.status(200).json({ received: true, event: eventName })
})

app.get('/api/billing', (_req, res) => res.json({ service: 'billing' }))

app.post('/api/billing/vault-encrypt', async (req, res) => {
  const { plaintext } = req.body || {}
  if (!plaintext) return res.status(400).json({ error: 'BAD_REQUEST', message: 'plaintext required' })
  try {
    const ciphertext = await vaultTransitEncrypt(String(plaintext))
    if (!ciphertext) {
      return res.status(503).json({ error: 'VAULT_UNAVAILABLE', message: 'Vault not configured' })
    }
    log('vault_encrypt', { correlationId: req.correlationId })
    res.json({
      original: String(plaintext),
      ciphertext,
      key: 'shopflow-master',
      algorithm: 'aes256-gcm96',
    })
  } catch (e) {
    res.status(503).json({ error: 'VAULT_ERROR', message: e.message })
  }
})

app.post('/api/billing/vault-decrypt', async (req, res) => {
  const { ciphertext } = req.body || {}
  if (!ciphertext) return res.status(400).json({ error: 'BAD_REQUEST', message: 'ciphertext required' })
  try {
    const plaintext = await vaultTransitDecrypt(String(ciphertext))
    if (!plaintext) return res.status(503).json({ error: 'VAULT_UNAVAILABLE', message: 'Vault not configured' })
    log('vault_decrypt', { correlationId: req.correlationId })
    res.json({ plaintext })
  } catch (e) {
    res.status(503).json({ error: 'VAULT_ERROR', message: e.message })
  }
})

const m2mAuth = requireM2mAuth({ log })
app.get('/api/internal/billing/status', m2mAuth, async (_req, res) => {
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

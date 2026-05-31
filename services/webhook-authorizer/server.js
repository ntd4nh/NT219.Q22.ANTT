import express from 'express'
import {
  createLogger,
  correlationMiddleware,
  metricsHandler,
  metricsMiddleware,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
} from '../shared/index.js'
import { loadWebhookSecret, verifyWebhookRequest } from '../shared/webhook-verify.js'

validateSecurityConfig('webhook-authorizer')

const app = express()
const log = createLogger('webhook-authorizer')
const port = Number(process.env.PORT || 8080)
const billingInternalUrl =
  process.env.BILLING_INTERNAL_URL || 'http://billing-service:8080'
const internalToken =
  process.env.WEBHOOK_INTERNAL_SECRET || 'lab-webhook-internal-secret-change-me'
const NONCE_TTL_SEC = Number(process.env.WEBHOOK_NONCE_TTL_SEC || 300)

let webhookSecret = null

app.use(correlationMiddleware())
app.use(metricsMiddleware('webhook-authorizer'))

app.get('/metrics', metricsHandler)
app.get('/health', async (_req, res) => {
  try {
    const redis = await redisPing()
    res.json({ status: 'ok', service: 'webhook-authorizer', redis })
  } catch (e) {
    res.status(503).json({ status: 'error', service: 'webhook-authorizer', message: e.message })
  }
})

app.post(
  '/api/billing/webhook',
  express.raw({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    const result = await verifyWebhookRequest(req, webhookSecret, NONCE_TTL_SEC)
    if (!result.ok) {
      incMetric('shopflow_webhook_rejected_total')
      securityAudit(log, 'WEBHOOK_REJECTED', {
        correlationId: req.correlationId,
        reason: result.reason,
        stage: 'authorizer',
      })
      return res.status(401).json({ error: 'WEBHOOK_REJECTED', reason: result.reason })
    }

    try {
      const forward = await fetch(`${billingInternalUrl}/api/internal/billing/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'X-Correlation-Id': req.correlationId || '',
          'X-Webhook-Internal-Token': internalToken,
        },
        body: result.rawBody,
      })
      const text = await forward.text()
      let body
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        body = { raw: text }
      }
      return res.status(forward.status).json(body)
    } catch (e) {
      log('forward_failed', { correlationId: req.correlationId, error: e.message })
      return res.status(502).json({ error: 'BAD_GATEWAY', message: e.message })
    }
  },
)

loadWebhookSecret(log)
  .then((secret) => {
    webhookSecret = secret
    app.listen(port, () => log('startup', { port, billingInternalUrl }))
  })
  .catch((e) => {
    console.error(
      JSON.stringify({ event: 'startup_failed', service: 'webhook-authorizer', error: e.message }),
    )
    process.exit(1)
  })

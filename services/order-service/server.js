import express from 'express'
import pg from 'pg'
import {
  createLogger,
  correlationMiddleware,
  requireAuth,
  tenantRateLimit,
  metricsHandler,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
} from '../shared/index.js'

validateSecurityConfig('order-service')

const app = express()
const log = createLogger('order-service')
const port = Number(process.env.PORT || 8080)

app.use(express.json())
app.use(correlationMiddleware())

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://shopflow_app:shopflow_app@app-db:5432/shopflow',
})

const auth = requireAuth({ log })
const rateLimit = tenantRateLimit()

app.get('/metrics', metricsHandler)

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    const redis = await redisPing()
    res.json({ status: 'ok', service: 'order-service', redis })
  } catch (e) {
    res.status(503).json({ status: 'error', message: e.message })
  }
})

app.get('/api/orders', auth, rateLimit, async (req, res) => {
  const tenantId = req.user.tenantId
  if (!tenantId) {
    securityAudit(log, 'AUTHZ_DENIED', {
      correlationId: req.correlationId,
      reason: 'MISSING_TENANT_CLAIM',
      path: req.path,
    })
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Missing tenant_id claim' })
  }
  const { rows } = await pool.query('SELECT id, tenant_id, amount, status FROM orders WHERE tenant_id = $1', [tenantId])
  log('orders_list', { correlationId: req.correlationId, tenantId, count: rows.length })
  res.json({ orders: rows })
})

app.get('/api/orders/:orderId', auth, rateLimit, async (req, res) => {
  const tenantId = req.user.tenantId
  const { orderId } = req.params
  const { rows } = await pool.query('SELECT id, tenant_id, amount, status FROM orders WHERE id = $1', [orderId])
  if (!rows.length) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }
  const order = rows[0]
  if (order.tenant_id !== tenantId) {
    incMetric('shopflow_bola_blocked_total')
    securityAudit(log, 'BOLA_BLOCKED', {
      correlationId: req.correlationId,
      tenantId,
      orderTenant: order.tenant_id,
      orderId,
      reason: 'CROSS_TENANT',
    })
    return res.status(403).json({ error: 'BOLA_BLOCKED', message: 'Cross-tenant access denied' })
  }
  res.json(order)
})

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM orders')
  if (rows[0].c > 0) return
  log('seed_skip', { reason: 'init.sql expected' })
}

app.listen(port, async () => {
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query('SELECT 1')
      await seedIfEmpty()
      log('startup', { port })
      break
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
})

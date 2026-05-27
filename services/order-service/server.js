import express from 'express'
import pg from 'pg'
import {
  createLogger,
  correlationMiddleware,
  requireAuth,
  tenantRateLimit,
  metricsHandler,
  metricsMiddleware,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
  opaAllow,
  opaDenyReason,
  isOpaEnabled,
  requireM2mAuth,
  s2sFetch,
} from '../shared/index.js'

validateSecurityConfig('order-service')

const app = express()
const log = createLogger('order-service')
const port = Number(process.env.PORT || 8080)

app.use(express.json())
app.use(correlationMiddleware())
app.use(metricsMiddleware('order-service'))

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://shopflow_app:shopflow_app@app-db:5432/shopflow',
})

const auth = requireAuth({ log })
const m2mAuth = requireM2mAuth({ log })
const rateLimit = tenantRateLimit()
const USER_INTERNAL_BASE = process.env.USER_INTERNAL_URL || 'http://user-service:8080'

async function ensureTenant(req, res) {
  const tenantId = req.user?.tenantId
  if (!tenantId) {
    securityAudit(log, 'AUTHZ_DENIED', {
      correlationId: req.correlationId,
      reason: 'MISSING_TENANT_CLAIM',
      path: req.path,
    })
    res.status(403).json({ error: 'FORBIDDEN', message: 'Missing tenant_id claim' })
    return null
  }
  return tenantId
}

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
  if (isOpaEnabled()) {
    const { allow } = await opaAllow('shopflow.orders', {
      action: 'list',
      subject: { tenant_id: tenantId, sub: req.user.sub },
      resource: { type: 'order_collection' },
    })
    if (!allow) {
      const reason = await opaDenyReason('shopflow.orders', {
        action: 'list',
        subject: { tenant_id: tenantId, sub: req.user.sub },
        resource: { type: 'order_collection' },
      })
      incMetric('shopflow_opa_denied_total', { reason_code: reason })
      securityAudit(log, 'OPA_DENIED', { correlationId: req.correlationId, reason, path: req.path })
      return res.status(403).json({ error: 'FORBIDDEN', message: 'OPA policy denied', reason_code: reason })
    }
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
  const opaInput = {
    action: 'read',
    subject: { tenant_id: tenantId, sub: req.user.sub },
    resource: { type: 'order', tenant_id: order.tenant_id, id: orderId },
  }
  if (isOpaEnabled()) {
    const { allow } = await opaAllow('shopflow.orders', opaInput)
    if (!allow) {
      const reason = await opaDenyReason('shopflow.orders', opaInput)
      incMetric('shopflow_bola_blocked_total')
      incMetric('shopflow_opa_denied_total', { reason_code: reason })
      securityAudit(log, 'BOLA_BLOCKED', {
        correlationId: req.correlationId,
        tenantId,
        orderTenant: order.tenant_id,
        orderId,
        reason,
        opa: true,
      })
      return res.status(403).json({ error: 'BOLA_BLOCKED', message: 'Cross-tenant access denied', reason_code: reason })
    }
  } else if (order.tenant_id !== tenantId) {
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

app.get('/api/catalog/lots', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return

  const { rows } = await pool.query(
    `SELECT id, tenant_id, sku, name, species, quality_grade, available_kg, unit_price_vnd
     FROM catalog_lots
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId],
  )
  res.json({ lots: rows })
})

app.get('/api/vendors/me', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return

  const { rows } = await pool.query(
    `SELECT tenant_id, company_name, province, contact_name, role
     FROM vendor_profiles
     WHERE tenant_id = $1
     LIMIT 1`,
    [tenantId],
  )
  if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND', message: 'Vendor profile not found' })
  res.json(rows[0])
})

app.get('/api/shipments', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return

  const { rows } = await pool.query(
    `SELECT id, tenant_id, lot_id, shipment_status, eta_date, route_summary
     FROM shipments
     WHERE tenant_id = $1
     ORDER BY eta_date ASC`,
    [tenantId],
  )
  res.json({ shipments: rows })
})

app.post('/api/quotes', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return

  const { lot_id: lotId, quantity_kg: quantityKg } = req.body || {}
  if (!lotId || !quantityKg) return res.status(400).json({ error: 'BAD_REQUEST', message: 'lot_id and quantity_kg are required' })

  const lotResult = await pool.query(
    'SELECT id, tenant_id, unit_price_vnd FROM catalog_lots WHERE id = $1 LIMIT 1',
    [lotId],
  )
  if (!lotResult.rows.length) return res.status(404).json({ error: 'NOT_FOUND', message: 'Lot not found' })
  const lot = lotResult.rows[0]
  if (lot.tenant_id !== tenantId) {
    return res.status(403).json({ error: 'BOLA_BLOCKED', message: 'Cross-tenant quote denied' })
  }

  const totalVnd = Number(quantityKg) * Number(lot.unit_price_vnd)
  const quoteId = `q-${Date.now()}`
  await pool.query(
    `INSERT INTO quotes (id, tenant_id, lot_id, quantity_kg, total_vnd, quote_status)
     VALUES ($1, $2, $3, $4, $5, 'draft')`,
    [quoteId, tenantId, lotId, Number(quantityKg), totalVnd],
  )
  res.status(201).json({ id: quoteId, tenant_id: tenantId, lot_id: lotId, quantity_kg: Number(quantityKg), total_vnd: totalVnd, quote_status: 'draft' })
})

app.get('/api/internal/orders/tenant-summary/:tenantId', m2mAuth, async (req, res) => {
  const { tenantId } = req.params
  const opaInput = {
    action: 'read',
    subject: { client_id: req.m2m.clientId, sub: req.m2m.sub },
    resource: { type: 'order_summary', tenant_id: tenantId },
  }
  if (isOpaEnabled()) {
    const { allow } = await opaAllow('shopflow.orders', opaInput)
    if (!allow) {
      const reason = await opaDenyReason('shopflow.orders', opaInput)
      incMetric('shopflow_opa_denied_total', { reason_code: reason })
      return res.status(403).json({ error: 'FORBIDDEN', reason_code: reason })
    }
  }
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS c FROM orders WHERE tenant_id = $1',
    [tenantId],
  )
  let profile = null
  try {
    const profileRes = await s2sFetch(
      `${USER_INTERNAL_BASE}/api/internal/users/${tenantId}`,
      { correlationId: req.correlationId },
    )
    if (profileRes.ok) profile = await profileRes.json()
  } catch (e) {
    log('s2s_profile_skip', { correlationId: req.correlationId, error: e.message })
  }
  res.json({ tenant_id: tenantId, order_count: rows[0].c, profile })
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

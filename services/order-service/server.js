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
  requireM2mAuth,
  s2sFetch,
  isAdmin,
  checkTenantAccess,
} from '../shared/index.js'
import { resolveDatabaseUrl } from '../shared/db-credentials.js'

validateSecurityConfig('order-service')

const app = express()
const log = createLogger('order-service')
const port = Number(process.env.PORT || 8080)

let pool = null

app.use(express.json())
app.use(correlationMiddleware())
app.use(metricsMiddleware('order-service'))

const auth = requireAuth({ log })
const m2mAuth = requireM2mAuth({ log })
const rateLimit = tenantRateLimit()
const USER_INTERNAL_BASE = process.env.USER_INTERNAL_URL || 'http://user-service:8080'

async function ensureTenant(req, res) {
  const tenantId = req.user?.tenantId
  if (!tenantId && !isAdmin(req.user?.roles)) {
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
  if (!tenantId && !isAdmin(req.user.roles)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Missing tenant_id claim' })
  }
  const { rows } = isAdmin(req.user.roles)
    ? await pool.query('SELECT id, tenant_id, amount, status FROM orders')
    : await pool.query('SELECT id, tenant_id, amount, status FROM orders WHERE tenant_id = $1', [tenantId])
  log('orders_list', { correlationId: req.correlationId, tenantId, count: rows.length })
  res.json({ orders: rows })
})

app.get('/api/orders/:orderId', auth, rateLimit, async (req, res) => {
  const tenantId = req.user.tenantId
  const { orderId } = req.params
  const { rows } = await pool.query('SELECT id, tenant_id, amount, status FROM orders WHERE id = $1', [orderId])
  if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
  const order = rows[0]
  const access = checkTenantAccess(tenantId, order.tenant_id, req.user.roles)
  if (!access.allow) {
    incMetric('shopflow_bola_blocked_total')
    securityAudit(log, 'BOLA_BLOCKED', {
      correlationId: req.correlationId,
      tenantId,
      orderTenant: order.tenant_id,
      orderId,
      reason: access.reason,
    })
    return res.status(403).json({ error: 'BOLA_BLOCKED', message: 'Cross-tenant access denied', reason_code: access.reason })
  }
  res.json(order)
})

app.get('/api/catalog/lots', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return
  const { rows } = await pool.query(
    `SELECT id, tenant_id, sku, name, species, quality_grade, available_kg, unit_price_vnd
     FROM catalog_lots WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  )
  res.json({ lots: rows })
})

app.get('/api/vendors/me', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return
  const { rows } = await pool.query(
    `SELECT tenant_id, company_name, province, contact_name, role
     FROM vendor_profiles WHERE tenant_id = $1 LIMIT 1`,
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
     FROM shipments WHERE tenant_id = $1 ORDER BY eta_date ASC`,
    [tenantId],
  )
  res.json({ shipments: rows })
})

app.post('/api/quotes', auth, rateLimit, async (req, res) => {
  const tenantId = await ensureTenant(req, res)
  if (!tenantId) return
  const { lot_id: lotId, quantity_kg: quantityKg } = req.body || {}
  if (!lotId || !quantityKg) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'lot_id and quantity_kg are required' })
  }
  const lotResult = await pool.query(
    'SELECT id, tenant_id, unit_price_vnd FROM catalog_lots WHERE id = $1 LIMIT 1',
    [lotId],
  )
  if (!lotResult.rows.length) return res.status(404).json({ error: 'NOT_FOUND', message: 'Lot not found' })
  const lot = lotResult.rows[0]
  const access = checkTenantAccess(tenantId, lot.tenant_id, req.user.roles)
  if (!access.allow) {
    incMetric('shopflow_bola_blocked_total')
    securityAudit(log, 'BOLA_BLOCKED', {
      correlationId: req.correlationId,
      reason: 'CROSS_TENANT_QUOTE',
      path: req.path,
    })
    return res.status(403).json({ error: 'BOLA_BLOCKED', message: 'Cross-tenant quote denied' })
  }
  const totalVnd = Number(quantityKg) * Number(lot.unit_price_vnd)
  const quoteId = `q-${Date.now()}`
  await pool.query(
    `INSERT INTO quotes (id, tenant_id, lot_id, quantity_kg, total_vnd, quote_status)
     VALUES ($1, $2, $3, $4, $5, 'draft')`,
    [quoteId, tenantId, lotId, Number(quantityKg), totalVnd],
  )
  res.status(201).json({
    id: quoteId,
    tenant_id: tenantId,
    lot_id: lotId,
    quantity_kg: Number(quantityKg),
    total_vnd: totalVnd,
    quote_status: 'draft',
  })
})

app.get('/api/internal/orders/tenant-summary/:tenantId', m2mAuth, async (req, res) => {
  const { tenantId } = req.params
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM orders WHERE tenant_id = $1', [tenantId])
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

async function start() {
  const connectionString = await resolveDatabaseUrl()
  pool = new pg.Pool({ connectionString })
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query('SELECT 1')
      app.listen(port, () => log('startup', { port }))
      return
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  throw new Error('Database not ready')
}

start().catch((e) => {
  console.error(JSON.stringify({ event: 'startup_failed', service: 'order-service', error: e.message }))
  process.exit(1)
})

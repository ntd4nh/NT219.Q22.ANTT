import express from 'express'
import dns from 'dns/promises'
import {
  createLogger,
  correlationMiddleware,
  requireAuth,
  metricsHandler,
  metricsMiddleware,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
  requireM2mAuth,
} from '../shared/index.js'

validateSecurityConfig('user-service')

const app = express()
const log = createLogger('user-service')
const port = Number(process.env.PORT || 8080)

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal'])
const ALLOWLIST = (process.env.SSRF_ALLOWLIST || 'cdn.shopflow.local,imgur.com').split(',').map((h) => h.trim())

function isPrivateIp(ip) {
  // IPv6: loopback, IPv4-mapped, unique-local, link-local
  if (ip === '::1') return true
  if (/^::ffff:/i.test(ip)) return isPrivateIp(ip.replace(/^::ffff:/i, ''))
  if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true  // fe80::/10 link-local
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true   // fc00::/7 unique-local
  // IPv4
  if (ip.startsWith('10.') || ip.startsWith('127.') || ip.startsWith('169.254.')) return true
  if (ip.startsWith('192.168.')) return true
  const parts = ip.split('.').map(Number)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  return false
}

async function validateUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'INVALID_URL' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: 'INVALID_PROTOCOL' }
  }
  const host = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(host)) return { ok: false, reason: 'BLOCKED_HOST' }
  if (ALLOWLIST.length && !ALLOWLIST.some((a) => host === a || host.endsWith(`.${a}`))) {
    return { ok: false, reason: 'NOT_IN_ALLOWLIST' }
  }
  const resolved = await dns.lookup(host, { all: true })
  for (const r of resolved) {
    if (isPrivateIp(r.address)) return { ok: false, reason: 'PRIVATE_IP' }
  }
  return { ok: true, host }
}

app.use(express.json())
app.use(correlationMiddleware())
app.use(metricsMiddleware('user-service'))

const auth = requireAuth({ log })
const m2mAuth = requireM2mAuth({ log })

app.get('/metrics', metricsHandler)
app.get('/health', async (_req, res) => {
  try {
    const redis = await redisPing()
    res.json({ status: 'ok', service: 'user-service', redis })
  } catch (e) {
    res.status(503).json({ status: 'error', service: 'user-service', message: e.message })
  }
})

app.get('/api/users', auth, (req, res) => {
  res.json({ sub: req.user.sub, tenant_id: req.user.tenantId })
})

app.post('/api/users/fetch-url', requireAuth({ log }), async (req, res) => {
  const url = req.body?.url
  if (!url) return res.status(400).json({ error: 'BAD_REQUEST', message: 'url required' })
  const check = await validateUrl(url)
  if (!check.ok) {
    incMetric('shopflow_ssrf_blocked_total')
    securityAudit(log, 'SSRF_BLOCKED', {
      correlationId: req.correlationId,
      url,
      reason: check.reason,
    })
    return res.status(403).json({ error: 'SSRF_BLOCKED', reason: check.reason })
  }
  res.json({
    ok: true,
    message: 'URL validation passed: allowlist + DNS + private-IP checks cleared',
    host: check.host,
  })
})

app.get('/api/internal/users/:tenantId', m2mAuth, async (req, res) => {
  const { tenantId } = req.params
  res.json({ tenant_id: tenantId, profile: { display_name: `Tenant ${tenantId}` } })
})

app.listen(port, () => log('startup', { port }))

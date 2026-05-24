import express from 'express'
import dns from 'dns/promises'
import {
  createLogger,
  correlationMiddleware,
  requireAuth,
  metricsHandler,
  incMetric,
  securityAudit,
} from '../shared/index.js'

const app = express()
const log = createLogger('user-service')
const port = Number(process.env.PORT || 8080)

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal'])
const ALLOWLIST = (process.env.SSRF_ALLOWLIST || 'cdn.shopflow.local,imgur.com').split(',').map((h) => h.trim())

function isPrivateIp(ip) {
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

const auth = requireAuth({ log })

app.get('/metrics', metricsHandler)
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }))

app.get('/api/users', auth, (req, res) => {
  res.json({ sub: req.user.sub, tenant_id: req.user.tenantId })
})

app.post('/api/users/fetch-url', requireAuth({ optional: true, log }), async (req, res) => {
  const url = req.body?.url
  if (!url) return res.status(400).json({ error: 'BAD_REQUEST', message: 'url required' })

  if (process.env.SSRF_DISABLED === 'true') {
    return res.json({ ok: true, mode: 'baseline', url })
  }

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

  res.json({ ok: true, message: 'URL allowed (lab: no outbound fetch)', host: check.host })
})

app.listen(port, () => log('startup', { port }))

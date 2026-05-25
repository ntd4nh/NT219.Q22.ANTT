import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { validateSecurityConfig, isProductionEnv } from './security-config.js'
import { incrementWindow, redisPing, tenantRateKey } from './redis-state.js'

export { validateSecurityConfig, isProductionEnv } from './security-config.js'
export { redisPing } from './redis-state.js'

const counters = {}

export function incMetric(name) {
  counters[name] = (counters[name] || 0) + 1
}

export function metricsHandler(_req, res) {
  const lines = Object.entries(counters).map(([name, value]) => `${name} ${value}`)
  res.type('text/plain').send(`${lines.join('\n')}\n`)
}

export function createLogger(serviceName) {
  return (event, fields = {}) => {
    const line = {
      ts: new Date().toISOString(),
      service: serviceName,
      event,
      ...fields,
    }
    console.log(JSON.stringify(line))
  }
}

export function securityAudit(log, event, fields = {}) {
  log(event, { audit: true, ...fields })
}

export function correlationMiddleware() {
  return (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID()
    req.correlationId = correlationId
    res.setHeader('X-Correlation-Id', correlationId)
    next()
  }
}

const TENANT_RPM = Number(process.env.TENANT_RATE_LIMIT_RPM || 120)

export function tenantRateLimit() {
  return async (req, res, next) => {
    const tenantId = req.user?.tenantId
    if (!tenantId) return next()

    const windowMinute = Math.floor(Date.now() / 60_000)
    const key = tenantRateKey(tenantId, windowMinute)
    try {
      const { limited } = await incrementWindow(key, 60, TENANT_RPM)
      if (limited) {
        incMetric('shopflow_rate_limited_total')
        return res.status(429).json({
          error: 'RATE_LIMITED',
          message: 'Tenant quota exceeded',
          tenant_id: tenantId,
        })
      }
      req.headers['x-tenant-id'] = tenantId
      next()
    } catch (e) {
      return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: e.message })
    }
  }
}

let jwks = null

function getJwks() {
  if (!jwks) {
    const uri = process.env.KEYCLOAK_JWKS_URI || 'http://keycloak:8080/realms/shopflow/protocol/openid-connect/certs'
    jwks = jwksClient({ jwksUri: uri, cache: true, rateLimit: true })
  }
  return jwks
}

function getKey(header, callback) {
  getJwks().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    callback(null, key.getPublicKey())
  })
}

function authFailure(log, req, res, reason, message) {
  incMetric('shopflow_auth_failures_total')
  incMetric(`shopflow_auth_failures_${reason.toLowerCase()}_total`)
  if (log) {
    securityAudit(log, 'AUTH_FAILED', {
      correlationId: req.correlationId,
      reason,
      path: req.path,
    })
  }
  return res.status(401).json({ error: 'UNAUTHORIZED', message })
}

export function requireAuth(options = {}) {
  const { optional = false } = options
  const log = options.log || null
  const issuers = (process.env.KEYCLOAK_ISSUERS || process.env.KEYCLOAK_ISSUER || 'http://keycloak:8080/realms/shopflow,http://localhost:8080/realms/shopflow')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      if (optional) return next()
      return authFailure(log, req, res, 'MISSING_TOKEN', 'Missing bearer token')
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, payload) => {
      if (err) {
        const reason = err.name === 'TokenExpiredError' ? 'EXPIRED' : 'INVALID'
        incMetric('shopflow_auth_failures_total')
        incMetric(`shopflow_auth_failures_${reason.toLowerCase()}_total`)
        if (log) {
          securityAudit(log, 'AUTH_FAILED', {
            correlationId: req.correlationId,
            reason,
            path: req.path,
          })
        }
        return res.status(401).json({ error: 'UNAUTHORIZED', message: err.message })
      }
      if (!issuers.includes(payload.iss)) {
        return authFailure(log, req, res, 'INVALID_ISSUER', 'Invalid issuer')
      }
      if (process.env.KEYCLOAK_AUDIENCE && payload.aud && payload.aud !== process.env.KEYCLOAK_AUDIENCE) {
        return authFailure(log, req, res, 'INVALID_AUDIENCE', 'Invalid audience')
      }
      req.user = {
        sub: payload.sub,
        tenantId: payload.tenant_id || payload.tenantId || null,
        scope: payload.scope || '',
      }
      next()
    })
  }
}

export async function fetchVaultSecret(path, field, options = {}) {
  const { required = false } = options
  const addr = process.env.VAULT_ADDR
  const token = process.env.VAULT_TOKEN
  if (!addr || !token) {
    if (required) throw new Error('VAULT_ADDR and VAULT_TOKEN are required')
    return null
  }
  try {
    const res = await fetch(`${addr}/v1/${path}`, { headers: { 'X-Vault-Token': token } })
    if (!res.ok) {
      if (required) throw new Error(`Vault read failed for ${path}: HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    const value = json?.data?.data?.[field] ?? null
    if (required && !value) throw new Error(`Vault field ${field} missing at ${path}`)
    return value
  } catch (e) {
    if (required) throw e
    return null
  }
}

export function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

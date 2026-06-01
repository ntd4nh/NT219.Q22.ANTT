import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { validateSecurityConfig, isProductionEnv } from './security-config.js'
import { incrementWindow, redisPing, tenantRateKey } from './redis-state.js'
import { incMetric, metricsHandler, metricsMiddleware } from './metrics.js'

export { validateSecurityConfig, isProductionEnv } from './security-config.js'
export { redisPing } from './redis-state.js'
export { isAdmin, checkTenantAccess, denyAuthz } from './authz.js'
export { computeWebhookHmac, loadWebhookSecret, verifyWebhookRequest } from './webhook-verify.js'
export { requireM2mAuth } from './m2m-auth.js'
export { getM2mToken, s2sFetch } from './s2s-client.js'
export { incMetric, metricsHandler, metricsMiddleware }

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
    const provided = req.headers['x-correlation-id']
    const correlationId =
      provided && /^[a-zA-Z0-9\-]{1,64}$/.test(provided) ? provided : crypto.randomUUID()
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
      // Audience luôn enforced: nếu không set KEYCLOAK_AUDIENCE dùng default 'shopflow-api'.
      // Check conditional trên env var → token không có aud claim vẫn pass → audience confusion attack.
      const expectedAud = process.env.KEYCLOAK_AUDIENCE || 'shopflow-api'
      if (payload.aud) {
        const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
        if (!aud.includes(expectedAud)) {
          return authFailure(log, req, res, 'INVALID_AUDIENCE', 'Invalid audience')
        }
      }
      req.user = {
        sub: payload.sub,
        tenantId: payload.tenant_id || payload.tenantId || null,
        scope: payload.scope || '',
        roles: payload.realm_access?.roles || [],
      }
      next()
    })
  }
}

export {
  fetchVaultSecret,
  vaultTransitEncrypt,
  vaultTransitDecrypt,
  timingSafeEqualHex,
} from './vault-secrets.js'

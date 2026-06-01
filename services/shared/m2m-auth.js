import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { incMetric } from './metrics.js'

function audit(log, event, fields) {
  if (log) log(event, { audit: true, ...fields })
}

let m2mJwks = null

function getM2mJwks() {
  if (!m2mJwks) {
    const uri = process.env.KEYCLOAK_JWKS_URI || 'http://keycloak:8080/realms/shopflow/protocol/openid-connect/certs'
    m2mJwks = jwksClient({ jwksUri: uri, cache: true, rateLimit: true })
  }
  return m2mJwks
}

function getKey(header, callback) {
  getM2mJwks().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    callback(null, key.getPublicKey())
  })
}

function parseScopes(scopeField) {
  if (!scopeField) return []
  if (Array.isArray(scopeField)) return scopeField
  return String(scopeField).split(/\s+/).filter(Boolean)
}

export function requireM2mAuth(options = {}) {
  const log = options.log || null
  const requiredScope = options.scope || process.env.KEYCLOAK_M2M_SCOPE || 'shopflow-api'
  // Default true: scope là ranh giới authorization chính của M2M token.
  // Opt-out bằng KEYCLOAK_M2M_ENFORCE_SCOPE=false hoặc options.enforceScope=false.
  const enforceScope = options.enforceScope ?? (process.env.KEYCLOAK_M2M_ENFORCE_SCOPE !== 'false')
  const expectedClient = process.env.KEYCLOAK_M2M_CLIENT_ID || 'shopflow-s2s'
  const expectedAudience = process.env.KEYCLOAK_AUDIENCE || 'shopflow-api'
  const issuers = (process.env.KEYCLOAK_ISSUERS || 'http://keycloak:8080/realms/shopflow,http://localhost:8080/realms/shopflow')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      if (log) audit(log, 'M2M_AUTH_FAILED', { correlationId: req.correlationId, reason: 'MISSING_TOKEN' })
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'M2M bearer token required' })
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, payload) => {
      if (err) {
        incMetric('shopflow_auth_failures_total')
        if (log) audit(log, 'M2M_AUTH_FAILED', { correlationId: req.correlationId, reason: 'INVALID_TOKEN' })
        return res.status(401).json({ error: 'UNAUTHORIZED', message: err.message })
      }
      if (!issuers.includes(payload.iss)) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid issuer' })
      }
      const azp = payload.azp || payload.client_id
      if (azp !== expectedClient) {
        if (log) audit(log, 'M2M_AUTH_FAILED', { correlationId: req.correlationId, reason: 'INVALID_CLIENT', azp })
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid M2M client' })
      }
      const scopes = parseScopes(payload.scope)
      if (enforceScope && requiredScope && !scopes.includes(requiredScope)) {
        return res.status(403).json({ error: 'FORBIDDEN', message: `Missing scope: ${requiredScope}` })
      }
      const aud = payload.aud
      const audOk = !expectedAudience
        || aud === expectedAudience
        || (Array.isArray(aud) && aud.includes(expectedAudience))
      if (!audOk) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid audience' })
      }
      req.m2m = { clientId: azp, scopes, sub: payload.sub }
      next()
    })
  }
}

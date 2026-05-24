import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

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

export function correlationMiddleware() {
  return (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID()
    req.correlationId = correlationId
    res.setHeader('X-Correlation-Id', correlationId)
    next()
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

export function requireAuth(options = {}) {
  const { optional = false } = options
  const issuers = (process.env.KEYCLOAK_ISSUERS || process.env.KEYCLOAK_ISSUER || 'http://keycloak:8080/realms/shopflow,http://localhost:8080/realms/shopflow')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      if (optional) return next()
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing bearer token' })
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, payload) => {
      if (err) {
        incMetric('shopflow_auth_failures_total')
        return res.status(401).json({ error: 'UNAUTHORIZED', message: err.message })
      }
      if (!issuers.includes(payload.iss)) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid issuer' })
      }
      if (process.env.KEYCLOAK_AUDIENCE && payload.aud && payload.aud !== process.env.KEYCLOAK_AUDIENCE) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid audience' })
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

export async function fetchVaultSecret(path, field) {
  const addr = process.env.VAULT_ADDR
  const token = process.env.VAULT_TOKEN
  if (!addr || !token) return null
  try {
    const res = await fetch(`${addr}/v1/${path}`, { headers: { 'X-Vault-Token': token } })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.data?.[field] ?? null
  } catch {
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

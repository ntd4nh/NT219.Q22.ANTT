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
  requireM2mAuth,
} from '../shared/index.js'
import { isMarked, markUsed, refreshTokenKey } from '../shared/redis-state.js'

validateSecurityConfig('auth-service')

const app = express()
const log = createLogger('auth-service')
const port = Number(process.env.PORT || 8080)

const REFRESH_TTL_SEC = Number(process.env.REFRESH_REPLAY_TTL_SEC || 1800)
const KEYCLOAK_TOKEN_URL =
  process.env.KEYCLOAK_TOKEN_URL || 'http://keycloak:8080/realms/shopflow/protocol/openid-connect/token'
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'shopflow-spa'
const M2M_CLIENT_ID = process.env.KEYCLOAK_M2M_CLIENT_ID || 'shopflow-s2s'
const M2M_CLIENT_SECRET = process.env.KEYCLOAK_M2M_CLIENT_SECRET || 'shopflow-s2s-secret-change-in-prod'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(correlationMiddleware())
app.use(metricsMiddleware('auth-service'))

app.get('/metrics', metricsHandler)
app.get('/health', async (_req, res) => {
  try {
    const redis = await redisPing()
    res.json({ status: 'ok', service: 'auth-service', redis })
  } catch (e) {
    res.status(503).json({ status: 'error', service: 'auth-service', message: e.message })
  }
})

const m2mAuth = requireM2mAuth({ log })

app.get('/api/internal/auth/status', m2mAuth, async (_req, res) => {
  const redis = await redisPing()
  res.json({ service: 'auth-service', redis })
})

app.post('/api/auth/s2s-token', async (req, res) => {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: M2M_CLIENT_ID,
    client_secret: M2M_CLIENT_SECRET,
  })
  try {
    const kcRes = await fetch(KEYCLOAK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await kcRes.json()
    if (!kcRes.ok) {
      securityAudit(log, 'M2M_TOKEN_FAILED', {
        correlationId: req.correlationId,
        reason: data.error || 'client_credentials_failed',
      })
      return res.status(401).json({ error: 'UNAUTHORIZED', message: data.error_description || data.error })
    }
    log('m2m_token_issued', { correlationId: req.correlationId, clientId: M2M_CLIENT_ID })
    res.json(data)
  } catch (e) {
    res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: e.message })
  }
})

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.body?.refresh_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!refreshToken) {
    securityAudit(log, 'AUTH_FAILED', { correlationId: req.correlationId, reason: 'MISSING_REFRESH_TOKEN' })
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'refresh_token required' })
  }
  if (await isMarked(refreshTokenKey(refreshToken))) {
    incMetric('shopflow_token_replay_total')
    incMetric('shopflow_auth_failures_total')
    securityAudit(log, 'TOKEN_REPLAY', { correlationId: req.correlationId, reason: 'REFRESH_REPLAY' })
    return res.status(401).json({ error: 'TOKEN_REPLAY', message: 'Refresh token already used' })
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  })
  try {
    const kcRes = await fetch(KEYCLOAK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await kcRes.json()
    if (!kcRes.ok) {
      securityAudit(log, 'AUTH_FAILED', {
        correlationId: req.correlationId,
        reason: 'KEYCLOAK_REJECT',
        detail: data.error || 'refresh_failed',
      })
      return res.status(401).json({ error: 'UNAUTHORIZED', message: data.error_description || data.error })
    }
    await markUsed(refreshTokenKey(refreshToken), REFRESH_TTL_SEC)
    if (data.refresh_token) {
      await markUsed(refreshTokenKey(data.refresh_token), REFRESH_TTL_SEC)
    }
    res.json(data)
  } catch (e) {
    res.status(502).json({ error: 'BAD_GATEWAY', message: e.message })
  }
})

app.listen(port, () => log('startup', { port, redis: process.env.REDIS_URL ? 'enabled' : 'memory-fallback' }))

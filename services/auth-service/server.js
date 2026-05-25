import express from 'express'
import {
  createLogger,
  correlationMiddleware,
  metricsHandler,
  incMetric,
  securityAudit,
  validateSecurityConfig,
  redisPing,
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

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(correlationMiddleware())

app.get('/metrics', metricsHandler)
app.get('/health', async (_req, res) => {
  try {
    const redis = await redisPing()
    res.json({ status: 'ok', service: 'auth-service', redis })
  } catch (e) {
    res.status(503).json({ status: 'error', service: 'auth-service', message: e.message })
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

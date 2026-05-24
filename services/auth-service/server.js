import express from 'express'
import { createLogger, correlationMiddleware, metricsHandler, incMetric } from '../shared/index.js'

const app = express()
const log = createLogger('auth-service')
const port = Number(process.env.PORT || 8080)

const usedRefreshTokens = new Set()
const KEYCLOAK_TOKEN_URL =
  process.env.KEYCLOAK_TOKEN_URL || 'http://keycloak:8080/realms/shopflow/protocol/openid-connect/token'
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'shopflow-spa'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(correlationMiddleware())

app.get('/metrics', metricsHandler)
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.body?.refresh_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!refreshToken) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'refresh_token required' })
  }

  if (usedRefreshTokens.has(refreshToken)) {
    incMetric('shopflow_auth_failures_total')
    log('TOKEN_REPLAY', { correlationId: req.correlationId })
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
      return res.status(401).json({ error: 'UNAUTHORIZED', message: data.error_description || data.error })
    }
    usedRefreshTokens.add(refreshToken)
    if (data.refresh_token) usedRefreshTokens.add(data.refresh_token)
    res.json(data)
  } catch (e) {
    res.status(502).json({ error: 'BAD_GATEWAY', message: e.message })
  }
})

app.listen(port, () => log('startup', { port }))

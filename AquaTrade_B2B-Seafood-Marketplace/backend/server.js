import express from 'express'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import { createHmac } from 'crypto'
import dns from 'dns/promises'
import net from 'net'

const app = express()
app.use(cors())
const PORT = Number(process.env.PORT || 4000)
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'change-this-in-production'
const HMAC_SECRET = process.env.HMAC_SECRET || 'change-this-in-production'
const ACCESS_TOKEN_TTL_SEC = Number(process.env.ACCESS_TOKEN_TTL_SEC || 300)
const REFRESH_TOKEN_TTL_SEC = Number(process.env.REFRESH_TOKEN_TTL_SEC || 1800)
const ALLOWED_FETCH_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || 'api.openstreetmap.org,api.example.com')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

const USERS = [
  { username: 'buyer', password: 'Buyer123#', role: 'buyer', tenant_id: 'buyer-tenant', displayName: 'Buyer Demo' },
  { username: 'seller', password: 'Seller123#', role: 'seller', tenant_id: 'seller-tenant', displayName: 'Seller Demo' },
  { username: 'admin', password: 'Admin123#', role: 'admin', tenant_id: 'admin-tenant', displayName: 'Admin Demo' },
]

const users = new Map(
  USERS.map((user) => [
    user.username,
    {
      ...user,
      passwordHash: bcrypt.hashSync(user.password, 10),
    },
  ]),
)

const refreshStore = new Map()
const usedRefreshTokens = new Set()
const sampleOrders = [
  { id: 'ord-100', tenant_id: 'buyer-tenant', customer: 'Buyer Demo', total: 140.5, items: 3 },
  { id: 'ord-200', tenant_id: 'seller-tenant', customer: 'Seller Demo', total: 980.0, items: 13 },
  { id: 'ord-300', tenant_id: 'buyer-tenant', customer: 'Buyer Demo', total: 54.75, items: 1 },
]

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf
    },
  }),
)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
})

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
      displayName: user.displayName,
    },
    JWT_SECRET,
    {
      expiresIn: `${ACCESS_TOKEN_TTL_SEC}s`,
    },
  )

const createRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.username,
      tenant_id: user.tenant_id,
    },
    REFRESH_SECRET,
    {
      expiresIn: `${REFRESH_TOKEN_TTL_SEC}s`,
    },
  )

const signWebhook = (body) => {
  return createHmac('sha256', HMAC_SECRET).update(body).digest('hex')
}

const isPrivateIp = (address) => {
  if (!net.isIP(address)) {
    return false
  }
  if (address === '::1' || address === '127.0.0.1') {
    return true
  }
  if (address.startsWith('10.') || address.startsWith('192.168.')) {
    return true
  }
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address)) {
    return true
  }
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) {
    return true
  }
  return false
}

const authenticateJwt = (req, res, next) => {
  const authorization = req.headers.authorization || ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing access token' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired access token' })
  }
}

const authorizeTenant = (resourceTenantId) => (req, res, next) => {
  if (req.user.role === 'admin') {
    return next()
  }
  if (req.user.tenant_id !== resourceTenantId) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Tenant mismatch' })
  }
  next()
}

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'aquatrade-backend', message: 'AquaTrade backend is running. Use /api/auth/login or /health.' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aquatrade-backend' })
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'username and password are required' })
  }

  const user = users.get(username)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' })
  }

  const accessToken = createAccessToken(user)
  const refreshToken = createRefreshToken(user)
  refreshStore.set(refreshToken, user.username)
  setTimeout(() => refreshStore.delete(refreshToken), REFRESH_TOKEN_TTL_SEC * 1000)

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SEC,
    role: user.role,
    tenant_id: user.tenant_id,
  })
})

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.body?.refresh_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!refreshToken) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'refresh_token is required' })
  }

  if (usedRefreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'TOKEN_REPLAY', message: 'Refresh token already used' })
  }

  if (!refreshStore.has(refreshToken)) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid refresh token' })
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET)
    const user = users.get(payload.sub)
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Unknown user' })
    }

    usedRefreshTokens.add(refreshToken)
    refreshStore.delete(refreshToken)

    const newRefreshToken = createRefreshToken(user)
    refreshStore.set(newRefreshToken, user.username)
    setTimeout(() => refreshStore.delete(newRefreshToken), REFRESH_TOKEN_TTL_SEC * 1000)

    const newAccessToken = createAccessToken(user)
    return res.json({ access_token: newAccessToken, refresh_token: newRefreshToken, token_type: 'Bearer', expires_in: ACCESS_TOKEN_TTL_SEC })
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' })
  }
})

app.get('/api/profile', authenticateJwt, (req, res) => {
  res.json({ profile: { username: req.user.sub, role: req.user.role, tenant_id: req.user.tenant_id, displayName: req.user.displayName } })
})

app.get('/api/orders', authenticateJwt, (req, res) => {
  const orders = sampleOrders.filter((order) => req.user.role === 'admin' || order.tenant_id === req.user.tenant_id)
  res.json({ orders })
})

app.post('/api/webhook/billing', (req, res) => {
  const signature = req.headers['x-signature'] || req.headers['x-hub-signature']
  const timestamp = req.headers['x-timestamp']
  const nonce = req.headers['x-nonce']
  if (!signature || !timestamp || !nonce) {
    return res.status(400).json({ error: 'INVALID_WEBHOOK', message: 'Missing webhook verification headers' })
  }

  const bodyString = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body)
  const expected = createHmac('sha256', `${HMAC_SECRET}`).update(`${timestamp}.${nonce}.${bodyString}`).digest('hex')
  if (!cryptoTimingSafeEqual(signature, expected)) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid webhook signature' })
  }

  return res.json({ status: 'ok', received: true })
})

const cryptoTimingSafeEqual = (a, b) => {
  const aBuf = Buffer.from(a || '', 'utf8')
  const bBuf = Buffer.from(b || '', 'utf8')
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return createHmac('sha256', 'timing-safe-key').update(aBuf).digest('hex') === createHmac('sha256', 'timing-safe-key').update(bBuf).digest('hex')
}

app.post('/api/internal/fetch-url', authenticateJwt, async (req, res) => {
  const urlString = req.body?.url
  if (!urlString) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'url is required' })
  }

  let url
  try {
    url = new URL(urlString)
  } catch (err) {
    return res.status(400).json({ error: 'INVALID_URL', message: 'The provided URL is not valid' })
  }

  if (!ALLOWED_FETCH_HOSTS.includes(url.hostname)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Hostname is not in allowlist' })
  }

  try {
    const resolved = await dns.lookup(url.hostname, { all: true })
    if (resolved.some((item) => isPrivateIp(item.address))) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Resolved IP is private or loopback' })
    }

    const externalRes = await fetch(url.toString(), { method: 'GET' })
    const text = await externalRes.text()
    return res.json({ status: 'ok', url: url.toString(), statusCode: externalRes.status, body: text.slice(0, 2048) })
  } catch (err) {
    return res.status(502).json({ error: 'BAD_GATEWAY', message: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`AquaTrade backend listening on http://localhost:${PORT}`)
  console.log(`Allowed fetch hosts: ${ALLOWED_FETCH_HOSTS.join(', ')}`)
})

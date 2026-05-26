import crypto from 'crypto'

let cached = { token: null, expiresAt: 0 }

export async function getM2mToken() {
  const now = Date.now()
  if (cached.token && cached.expiresAt > now + 30_000) {
    return cached.token
  }

  const tokenUrl = process.env.KEYCLOAK_TOKEN_URL
    || 'http://keycloak:8080/realms/shopflow/protocol/openid-connect/token'
  const clientId = process.env.KEYCLOAK_M2M_CLIENT_ID || 'shopflow-s2s'
  const clientSecret = process.env.KEYCLOAK_M2M_CLIENT_SECRET || 'shopflow-s2s-secret-change-in-prod'

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'client_credentials failed')
  }
  cached = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 300) * 1000,
  }
  return cached.token
}

export async function s2sFetch(url, options = {}) {
  const token = await getM2mToken()
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    'X-Correlation-Id': options.correlationId || crypto.randomUUID(),
  }
  return fetch(url, { ...options, headers })
}

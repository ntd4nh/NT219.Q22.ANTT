const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

export function readTokenPayload(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(decodeBase64Url(parts[1]))
  } catch {
    return null
  }
}

export function getAuthTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

export function setAuthTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function getTenantRole() {
  const { accessToken } = getAuthTokens()
  const payload = readTokenPayload(accessToken)
  const tenantId = payload?.tenant_id
  if (tenantId === 'tenant-a') return 'buyer'
  if (tenantId === 'tenant-b') return 'seller'
  return 'admin'
}

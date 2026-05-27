import { API_BASE } from '../config/env'
import { buildAuthorizeUrl, exchangeCodeForTokens, validateCallbackState } from '../auth/pkce'
import { clearAuthTokens, getAuthTokens, setAuthTokens } from '../auth/session'

export async function startPkceLogin() {
  const url = await buildAuthorizeUrl()
  window.location.href = url
}

export async function completePkceCallback({ code, state }) {
  validateCallbackState(state)
  const data = await exchangeCodeForTokens(code)
  setAuthTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
  return data
}

export async function refreshAccessToken() {
  const { refreshToken } = getAuthTokens()
  if (!refreshToken) throw new Error('Missing refresh token')

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || data.error || 'Refresh failed')
  setAuthTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
  return data
}

export function logout() {
  clearAuthTokens()
}

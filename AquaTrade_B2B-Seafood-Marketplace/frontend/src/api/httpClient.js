import { API_BASE } from '../config/env'
import { clearAuthTokens, getAuthTokens } from '../auth/session'
import { refreshAccessToken } from './authApi'

let refreshPromise = null

async function ensureRefreshedToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiRequest(path, options = {}, allowRetry = true) {
  const { accessToken } = getAuthTokens()
  const headers = {
    ...(options.headers || {}),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 401 && allowRetry) {
    try {
      await ensureRefreshedToken()
      return apiRequest(path, options, false)
    } catch {
      clearAuthTokens()
      throw new Error('Phiên đăng nhập đã hết hạn')
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()
  if (!response.ok) {
    const message = payload?.message || payload?.error || `HTTP ${response.status}`
    const err = new Error(message)
    err.status = response.status
    err.payload = payload
    throw err
  }
  return payload
}

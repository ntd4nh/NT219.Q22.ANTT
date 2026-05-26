const KEYCLOAK_BASE = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080'
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'shopflow'
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'shopflow-spa'
const REDIRECT_URI = import.meta.env.VITE_OIDC_REDIRECT_URI || 'http://localhost:5173/callback'

function randomString(len = 64) {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Base64Url(input) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function getRedirectUri() {
  return REDIRECT_URI
}

export function buildAuthorizeUrl() {
  const verifier = randomString(48)
  const state = randomString(16)
  sessionStorage.setItem('pkce_verifier', verifier)
  sessionStorage.setItem('pkce_state', state)

  const challenge = sha256Base64Url(verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    state,
  })

  return challenge.then((codeChallenge) => {
    params.set('code_challenge', codeChallenge)
    return `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/auth?${params.toString()}`
  })
}

export async function exchangeCodeForTokens(code) {
  const verifier = sessionStorage.getItem('pkce_verifier')
  const state = sessionStorage.getItem('pkce_state')
  if (!verifier) throw new Error('Missing PKCE verifier (session expired?)')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })

  const response = await fetch(`${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Token exchange failed')
  }

  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('pkce_state')

  return { data, state }
}

export function validateCallbackState(returnedState) {
  const expected = sessionStorage.getItem('pkce_state')
  if (!expected || expected !== returnedState) {
    throw new Error('Invalid OAuth state (possible CSRF)')
  }
}

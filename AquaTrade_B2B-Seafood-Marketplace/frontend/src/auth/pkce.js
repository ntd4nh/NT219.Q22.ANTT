import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL, OIDC_REDIRECT_URI } from '../config/env'

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
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function buildAuthorizeUrl() {
  const verifier = randomString(48)
  const state = randomString(16)
  sessionStorage.setItem('pkce_verifier', verifier)
  sessionStorage.setItem('pkce_state', state)

  const codeChallenge = await sha256Base64Url(verifier)
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: OIDC_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  })

  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params.toString()}`
}

export function validateCallbackState(returnedState) {
  const expected = sessionStorage.getItem('pkce_state')
  if (!expected || expected !== returnedState) {
    throw new Error('Invalid OAuth state')
  }
}

export async function exchangeCodeForTokens(code) {
  const verifier = sessionStorage.getItem('pkce_verifier')
  if (!verifier) throw new Error('Missing PKCE verifier')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KEYCLOAK_CLIENT_ID,
    code,
    redirect_uri: OIDC_REDIRECT_URI,
    code_verifier: verifier,
  })

  const response = await fetch(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
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
  return data
}

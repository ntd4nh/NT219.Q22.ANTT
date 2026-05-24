import { useMemo, useState } from 'react'
import './TokensPage.css'

const base64UrlDecode = (value) => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
  } catch {
    return null
  }
}

const formatExpiry = (exp) => {
  if (!exp) return null
  const date = new Date(exp * 1000)
  const now = Date.now()
  const remainingMs = date.getTime() - now
  const minutes = Math.floor((remainingMs / 1000 / 60) % 60)
  const seconds = Math.floor((remainingMs / 1000) % 60)
  return {
    text: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
    expired: remainingMs <= 0,
    countdown: `${minutes}m ${seconds}s`,
  }
}

const decodeToken = (token) => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 3) return null
  const header = base64UrlDecode(parts[0])
  const payload = base64UrlDecode(parts[1])
  return {
    header: header ? JSON.parse(header) : null,
    payload: payload ? JSON.parse(payload) : null,
    signature: parts[2],
  }
}

export default function TokensPage({ onTokensChange }) {
  const [form, setForm] = useState({ username: 'tenant-a-user', password: 'password123', realm: 'shopflow', clientId: 'shopflow-spa' })
  const [tokenResult, setTokenResult] = useState(null)
  const [showFull, setShowFull] = useState(false)
  const [jwtInput, setJwtInput] = useState('')
  const tokenEndpoint = `http://localhost:8080/realms/${form.realm}/protocol/openid-connect/token`

  const decoded = useMemo(() => decodeToken(jwtInput), [jwtInput])

  const expiry = decoded?.payload?.exp ? formatExpiry(decoded.payload.exp) : null

  const handleField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleFetchToken = async (event) => {
    event.preventDefault()
    setTokenResult({ loading: true })
    try {
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: form.clientId,
        username: form.username,
        password: form.password,
      })
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error_description || data.error || 'Lỗi lấy token')
      setTokenResult({ ...data, error: null })
    } catch (error) {
      setTokenResult({ error: error.message, loading: false })
    }
  }

  return (
    <section className="tokens-page glass-panel">
      <h1>Tokens & Auth</h1>
      <div className="tokens-grid">
        <div className="panel">
          <h2>Lấy token từ Keycloak</h2>
          <form className="token-form" onSubmit={handleFetchToken}>
            <label>
              Username
              <input value={form.username} onChange={handleField('username')} placeholder="alice@example.com" />
            </label>
            <label>
              Password
              <input type="password" value={form.password} onChange={handleField('password')} placeholder="••••••••" />
            </label>
            <label>
              Realm
              <input value={form.realm} onChange={handleField('realm')} />
            </label>
            <label>
              Client ID
              <input value={form.clientId} onChange={handleField('clientId')} />
            </label>
            <button className="button-primary" type="submit">Lấy Token</button>
          </form>
          {tokenResult ? (
            <div className="token-result">
              {tokenResult.loading ? (
                <div className="notice">Đang lấy token...</div>
              ) : tokenResult.error ? (
                <div className="notice error">{tokenResult.error}</div>
              ) : (
                <>
                  <div className="token-block">
                    <label>Access Token</label>
                    <div className="token-value">
                      {showFull ? tokenResult.access_token : `${tokenResult.access_token?.slice(0, 60)}...`}
                    </div>
                    <button className="button-secondary" type="button" onClick={() => setShowFull((current) => !current)}>
                      {showFull ? 'Hide' : 'Show full'}
                    </button>
                  </div>
                  <div className="token-block">
                    <label>Refresh Token</label>
                    <div className="token-value small">{tokenResult.refresh_token}</div>
                  </div>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => onTokensChange({ accessToken: tokenResult.access_token, refreshToken: tokenResult.refresh_token })}
                  >
                    📋 Dùng token này
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
        <div className="panel">
          <h2>JWT Decoder</h2>
          <label>
            Paste JWT
            <textarea value={jwtInput} onChange={(event) => setJwtInput(event.target.value)} placeholder="Paste JWT của bạn vào đây" />
          </label>
          {jwtInput && !decoded ? <div className="notice error">JWT không hợp lệ</div> : null}
          {decoded ? (
            <div className="jwt-boxes">
              <div className="jwt-block blue">
                <div className="jwt-title">Header</div>
                <pre>{JSON.stringify(decoded.header, null, 2)}</pre>
              </div>
              <div className="jwt-block green">
                <div className="jwt-title">Payload</div>
                <pre>{JSON.stringify(decoded.payload, null, 2)}</pre>
                {expiry ? (
                  <div className={`expiry ${expiry.expired ? 'expired' : 'valid'}`}>
                    Hết hạn lúc {expiry.text} • {expiry.expired ? '⚠️ Đã hết hạn' : `còn ${expiry.countdown}`}
                  </div>
                ) : null}
                {decoded.payload?.tenant_id ? <div className="highlight-yellow">tenant_id: {decoded.payload.tenant_id}</div> : null}
              </div>
              <div className="jwt-block gray">
                <div className="jwt-title">Signature</div>
                <pre>{decoded.signature}</pre>
                <div className="signature-note">Không verify phía client</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="quick-reference panel">
        <h2>Quick Reference</h2>
        <div className="reference-grid">
          <div><strong>Token URL</strong><span>{tokenEndpoint}</span></div>
          <div><strong>Realm</strong><span>shopflow</span></div>
          <div><strong>Client</strong><span>shopflow-spa, shopflow-s2s</span></div>
        </div>
        <pre className="curl-box">curl -X POST \
  http://localhost:8080/realms/shopflow/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=shopflow-spa&username=USER&password=PASS"</pre>
      </div>
    </section>
  )
}

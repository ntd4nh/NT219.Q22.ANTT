import { useMemo, useState } from 'react'
import ResponseViewer from '../components/ResponseViewer.jsx'
import './SecurityLab.css'

const urlOptions = [
  { label: 'AWS Metadata', value: 'http://169.254.169.254/latest/meta-data/' },
  { label: 'GCP Metadata', value: 'http://metadata.google.internal/' },
  { label: 'Private network', value: 'http://10.0.0.1/' },
  { label: 'Internal Vault', value: 'http://localhost:8200/' },
]

const initialLog = []

const jwtStatus = (token) => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return 'invalid'
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp && Date.now() / 1000 > payload.exp ? 'expired' : 'valid'
  } catch {
    return 'invalid'
  }
}

const addAttackLog = (logs, entry) => [entry, ...logs].slice(0, 20)

export default function SecurityLab({ bearerToken, refreshToken }) {
  const [openPanels, setOpenPanels] = useState({ d1: true, d2: false, d3: false, d4: false })
  const [orderId, setOrderId] = useState('order-tenant-b-001')
  const [expiredToken, setExpiredToken] = useState('')
  const [refreshTokenInput, setRefreshTokenInput] = useState(refreshToken || '')
  const [webhookPayload, setWebhookPayload] = useState('{"event":"payment","amount":100}')
  const [signature, setSignature] = useState('sha256=forged-bad-signature')
  const [validHmac, setValidHmac] = useState(false)
  const [srffUrl, setSrffUrl] = useState(urlOptions[0].value)
  const [response, setResponse] = useState(null)
  const [attackLog, setAttackLog] = useState(initialLog)
  const [loading, setLoading] = useState(false)

  const tokenState = useMemo(() => jwtStatus(bearerToken), [bearerToken])

  const expectedStatus = (label, status) => {
    if (label === 'D1 Cross-tenant') return status === 403
    if (label === 'D1 Valid') return status === 200
    if (label === 'D2 Expired') return status === 401
    if (label === 'D2 Refresh Replay #2') return status === 401
    if (label === 'D3 Webhook') return validHmac ? status >= 200 && status < 300 : status === 401
    if (label === 'D4 SSRF') return status === 403
    return status >= 200 && status < 300
  }

  const fireRequest = async ({ method, url, options, label }) => {
    setLoading(true)
    const start = Date.now()
    try {
      const res = await fetch(url, { method, ...options })
      const latency = Date.now() - start
      const data = await res.json().catch(() => null)
      const result = { status: res.status, latency, data, error: res.ok ? null : data || 'Request failed' }
      setResponse(result)
      setAttackLog((current) =>
        addAttackLog(current, {
          time: new Date().toLocaleTimeString(),
          method,
          url,
          status: res.status,
          latency,
          label,
          ok: expectedStatus(label, res.status),
        }),
      )
    } catch (error) {
      const latency = Date.now() - start
      const result = { status: 'ERR', latency, data: null, error: error.message }
      setResponse(result)
      setAttackLog((current) => addAttackLog(current, { time: new Date().toLocaleTimeString(), method, url, status: 'ERR', latency, label, ok: false }))
    } finally {
      setLoading(false)
    }
  }

  const handleD1CrossTenant = () => {
    fireRequest({
      method: 'GET',
      url: `/api/orders/${orderId}`,
      options: { headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {} },
      label: 'D1 Cross-tenant',
    })
  }

  const handleD1Valid = () => {
    fireRequest({
      method: 'GET',
      url: '/api/orders',
      options: { headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {} },
      label: 'D1 Valid',
    })
  }

  const handleD2 = () => {
    fireRequest({
      method: 'GET',
      url: '/api/orders',
      options: { headers: expiredToken ? { Authorization: `Bearer ${expiredToken}` } : {} },
      label: 'D2 Expired',
    })
  }

  const handleD2RefreshReplay = async () => {
    if (!refreshTokenInput) return
    setLoading(true)
    const body = JSON.stringify({ refresh_token: refreshTokenInput })
    const headers = { 'Content-Type': 'application/json' }
    const start = Date.now()
    try {
      const first = await fetch('/api/auth/refresh', { method: 'POST', headers, body })
      const firstData = await first.json().catch(() => null)
      const second = await fetch('/api/auth/refresh', { method: 'POST', headers, body })
      const secondData = await second.json().catch(() => null)
      const latency = Date.now() - start
      setResponse({
        status: second.status,
        latency,
        data: { first: { status: first.status, data: firstData }, second: { status: second.status, data: secondData } },
        error: second.ok ? null : secondData || 'Request failed',
      })
      setAttackLog((current) =>
        addAttackLog(current, {
          time: new Date().toLocaleTimeString(),
          method: 'POSTx2',
          url: '/api/auth/refresh',
          status: second.status,
          latency,
          label: 'D2 Refresh Replay #2',
          ok: second.status === 401,
        }),
      )
    } catch (error) {
      const latency = Date.now() - start
      setResponse({ status: 'ERR', latency, data: null, error: error.message })
      setAttackLog((current) =>
        addAttackLog(current, { time: new Date().toLocaleTimeString(), method: 'POSTx2', url: '/api/auth/refresh', status: 'ERR', latency, label: 'D2 Refresh Replay #2', ok: false }),
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchValidSignature = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/test-sign', { method: 'POST' })
      const data = await res.json()
      setSignature(data.signature || 'sha256=valid-signature')
    } catch {
      setSignature('sha256=valid-signature')
    } finally {
      setLoading(false)
    }
  }

  const handleD3 = async () => {
    if (validHmac) await fetchValidSignature()
    fireRequest({
      method: 'POST',
      url: '/api/billing/webhook',
      options: {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': String(Math.floor(Date.now() / 1000)),
          'X-Nonce': Math.random().toString(36).slice(2),
        },
        body: webhookPayload,
      },
      label: 'D3 Webhook',
    })
  }

  const handleD4 = () => {
    fireRequest({
      method: 'POST',
      url: '/api/users/fetch-url',
      options: {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: srffUrl }),
      },
      label: 'D4 SSRF',
    })
  }

  const togglePanel = (panel) => () => setOpenPanels((current) => ({ ...current, [panel]: !current[panel] }))

  return (
    <section className="securitylab-page glass-panel">
      <h1>Security Lab</h1>
      <div className="accordion">
        <div className="accordion-panel">
          <button type="button" className="accordion-header" onClick={togglePanel('d1')}>
            <span>D1</span>
            <span>BOLA: Cross-tenant Access</span>
            <span>{openPanels.d1 ? '▾' : '▸'}</span>
          </button>
          {openPanels.d1 ? (
            <div className="accordion-body">
              <div className="grid-two">
                <label>
                  Token Tenant A
                  <textarea value={bearerToken} readOnly placeholder="Token từ Tokens page" />
                </label>
                <label>
                  Order ID
                  <input value={orderId} onChange={(event) => setOrderId(event.target.value)} />
                </label>
              </div>
              <div className="button-row">
                <button className="button-danger" type="button" onClick={handleD1CrossTenant} disabled={loading}>🔴 Tấn công Cross-tenant</button>
                <button className="button-primary" type="button" onClick={handleD1Valid} disabled={loading}>🟢 Truy cập hợp lệ</button>
              </div>
              <div className="explain-box">
                Service kiểm tra <strong>tenant_id</strong> trong JWT ↔ tenant_id trong record. Không khớp → 403 Forbidden.
              </div>
            </div>
          ) : null}
        </div>
        <div className="accordion-panel">
          <button type="button" className="accordion-header" onClick={togglePanel('d2')}>
            <span>D2</span>
            <span>Token Replay</span>
            <span>{openPanels.d2 ? '▾' : '▸'}</span>
          </button>
          {openPanels.d2 ? (
            <div className="accordion-body">
              <label>
                Expired token
                <textarea value={expiredToken} onChange={(event) => setExpiredToken(event.target.value)} placeholder="Paste expired token" />
              </label>
              <label>
                Refresh token
                <textarea value={refreshTokenInput} onChange={(event) => setRefreshTokenInput(event.target.value)} placeholder="Paste refresh token từ Tokens page" />
              </label>
              <div className="button-row">
                <button className="button-warning" type="button" onClick={handleD2} disabled={loading}>⚠️ Test access token hết hạn</button>
                <button className="button-danger" type="button" onClick={handleD2RefreshReplay} disabled={loading || !refreshTokenInput}>💀 Test refresh replay (lần 2)</button>
              </div>
              <div className="explain-box">
                D2 gồm 2 case: access token hết hạn (401) và refresh replay trên <strong>/api/auth/refresh</strong> (lần 2 phải 401).
              </div>
            </div>
          ) : null}
        </div>
        <div className="accordion-panel">
          <button type="button" className="accordion-header" onClick={togglePanel('d3')}>
            <span>D3</span>
            <span>Webhook HMAC Forgery</span>
            <span>{openPanels.d3 ? '▾' : '▸'}</span>
          </button>
          {openPanels.d3 ? (
            <div className="accordion-body">
              <label>
                Event payload
                <textarea value={webhookPayload} onChange={(event) => setWebhookPayload(event.target.value)} />
              </label>
              <label>
                X-Signature
                <input value={signature} onChange={(event) => setSignature(event.target.value)} />
              </label>
              <div className="toggle-row">
                <label className="toggle-label">
                  <input type="checkbox" checked={validHmac} onChange={(event) => setValidHmac(event.target.checked)} />
                  Dùng HMAC hợp lệ
                </label>
              </div>
              <button className="button-primary" type="button" onClick={handleD3} disabled={loading}>📤 Gửi Webhook</button>
              <div className="explain-box">
                Billing service verify HMAC-SHA256(payload, secret). Signature sai → 401.
              </div>
            </div>
          ) : null}
        </div>
        <div className="accordion-panel">
          <button type="button" className="accordion-header" onClick={togglePanel('d4')}>
            <span>D4</span>
            <span>SSRF</span>
            <span>{openPanels.d4 ? '▾' : '▸'}</span>
          </button>
          {openPanels.d4 ? (
            <div className="accordion-body">
              <label>
                Quick select URL
                <select value={srffUrl} onChange={(event) => setSrffUrl(event.target.value)}>
                  {urlOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Custom URL
                <input value={srffUrl} onChange={(event) => setSrffUrl(event.target.value)} />
              </label>
              <button className="button-danger" type="button" onClick={handleD4} disabled={loading}>💀 Tấn công SSRF</button>
              <div className="explain-box">
                User service kiểm tra URL theo blocklist: private IP, loopback, metadata endpoints → 403 Forbidden.
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="response-log">
        <h2>Attack Log</h2>
        <div className="log-actions">
          <span>Token status: {tokenState === 'valid' ? '✅ valid' : tokenState === 'expired' ? '⚠️ expired' : tokenState === 'invalid' ? '❌ invalid' : 'none'}</span>
          <button className="button-secondary" type="button" onClick={() => setAttackLog([])}>🗑 Clear Log</button>
        </div>
        <div className="log-list">
          {attackLog.length === 0 ? (
            <div className="log-empty">Chưa có yêu cầu nào.</div>
          ) : (
            attackLog.map((item, index) => (
              <div key={`${item.time}-${index}`} className="log-item">
                <span className={`log-icon ${item.status === 200 ? 'ok' : item.status === 'ERR' ? 'err' : 'fail'}`}>
                  {item.ok ? '✅' : '❌'}
                </span>
                <span>{item.time}</span>
                <span>{item.label}</span>
                <span>{item.url}</span>
                <span>{item.status}</span>
                <span>{item.latency}ms</span>
              </div>
            ))
          )}
        </div>
      </div>
      <ResponseViewer {...(response || {})} />
    </section>
  )
}

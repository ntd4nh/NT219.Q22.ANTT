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

export default function SecurityLab({ bearerToken }) {
  const [openPanels, setOpenPanels] = useState({ d1: true, d2: false, d3: false, d4: false })
  const [orderId, setOrderId] = useState('order-tenant-b-001')
  const [expiredToken, setExpiredToken] = useState('')
  const [webhookPayload, setWebhookPayload] = useState('{"event":"payment","amount":100}')
  const [signature, setSignature] = useState('sha256=forged-bad-signature')
  const [validHmac, setValidHmac] = useState(false)
  const [srffUrl, setSrffUrl] = useState(urlOptions[0].value)
  const [response, setResponse] = useState(null)
  const [attackLog, setAttackLog] = useState(initialLog)
  const [loading, setLoading] = useState(false)

  const tokenState = useMemo(() => jwtStatus(bearerToken), [bearerToken])

  const fireRequest = async ({ method, url, options, label }) => {
    setLoading(true)
    const start = Date.now()
    try {
      const res = await fetch(url, { method, ...options })
      const latency = Date.now() - start
      const data = await res.json().catch(() => null)
      const result = { status: res.status, latency, data, error: res.ok ? null : data || 'Request failed' }
      setResponse(result)
      setAttackLog(addAttackLog(attackLog, { time: new Date().toLocaleTimeString(), method, url, status: res.status, latency, label }))
    } catch (error) {
      const latency = Date.now() - start
      const result = { status: 'ERR', latency, data: null, error: error.message }
      setResponse(result)
      setAttackLog(addAttackLog(attackLog, { time: new Date().toLocaleTimeString(), method, url, status: 'ERR', latency, label }))
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
      label: 'D2 Replay',
    })
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
          'X-Timestamp': String(Date.now()),
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
              <button className="button-warning" type="button" onClick={handleD2} disabled={loading}>⚠️ Gửi với token hết hạn</button>
              <div className="explain-box">
                Kong JWT Plugin verify <strong>exp</strong> claim. Token hết hạn → 401 Unauthorized.
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
                  {item.status === 200 ? '✅' : '❌'}
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

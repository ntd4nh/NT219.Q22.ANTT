import { useMemo, useState } from 'react'
import ResponseViewer from '../components/ResponseViewer.jsx'
import './Services.css'

const tabs = [
  { key: 'orders', label: 'Orders', path: '/api/orders' },
  { key: 'users', label: 'Users', path: '/api/users' },
  { key: 'billing', label: 'Billing', path: '/api/billing' },
]

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

const parseJwt = (token) => {
  const parts = token.trim().split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

export default function Services({ bearerToken }) {
  const [tokenInput, setTokenInput] = useState(bearerToken || '')
  const [activeTab, setActiveTab] = useState('orders')
  const [response, setResponse] = useState(null)
  const [statusInfo, setStatusInfo] = useState(null)

  const selectedTab = tabs.find((tab) => tab.key === activeTab)
  const tokenPayload = useMemo(() => parseJwt(tokenInput), [tokenInput])
  const tokenStatus = useMemo(() => {
    if (!tokenInput) return 'none'
    if (!tokenPayload) return 'invalid'
    if (tokenPayload.exp && Date.now() / 1000 > tokenPayload.exp) return 'expired'
    return 'valid'
  }, [tokenInput, tokenPayload])

  const handleSend = async () => {
    setStatusInfo({ loading: true })
    const start = Date.now()
    try {
      const res = await fetch(selectedTab.path, {
        headers: tokenInput ? { Authorization: `Bearer ${tokenInput}` } : {},
      })
      const latency = Date.now() - start
      const data = await res.json().catch(() => null)
      setResponse({ status: res.status, latency, data, error: res.ok ? null : data || 'Lỗi phản hồi' })
    } catch (error) {
      setResponse({ status: 'ERR', latency: Date.now() - start, data: null, error: error.message })
    }
    setStatusInfo({ loading: false })
  }

  return (
    <section className="services-page glass-panel">
      <h1>API Explorer</h1>
      <div className="token-panel panel">
        <h2>Bearer Token</h2>
        <textarea value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Paste token hoặc giữ token từ Tokens page" />
        <div className="token-status-row">
          <div className={`status-pill ${tokenStatus}`}>{
            tokenStatus === 'valid' ? '✅ Token hợp lệ' : tokenStatus === 'expired' ? '⚠️ Token đã hết hạn' : tokenStatus === 'invalid' ? '❌ Không phải JWT' : 'Nhập token để kiểm tra'
          }</div>
          {tokenPayload ? (
            <div className="token-summary">
              sub: {tokenPayload.sub || 'n/a'} • tenant_id: {tokenPayload.tenant_id || 'n/a'} • exp: {tokenPayload.exp || 'n/a'}
            </div>
          ) : null}
        </div>
      </div>
      <div className="api-explorer panel">
        <div className="tabs">
          {tabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="api-details">
          <div className="api-url">GET {selectedTab.path}</div>
          <button className="button-primary" type="button" onClick={handleSend} disabled={statusInfo?.loading}>
            {statusInfo?.loading ? 'Đang gửi...' : '▶ Send Request'}
          </button>
        </div>
      </div>
      <ResponseViewer {...(response || {})} />
    </section>
  )
}

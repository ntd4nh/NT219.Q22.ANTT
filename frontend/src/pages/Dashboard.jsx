import { useMemo, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import './Dashboard.css'

const cards = [
  { label: 'Total Requests', value: '1,247', icon: 'Activity', color: 'blue', trend: '+8.4%' },
  { label: 'Blocked', value: '38', icon: 'ShieldAlert', color: 'red', trend: '-2.1%' },
  { label: 'Active Services', value: '3/3', icon: 'Server', color: 'green', trend: '+0.0%' },
  { label: 'Avg Latency', value: '142ms', icon: 'Timer', color: 'purple', trend: '+3.2%' },
]

const services = [
  { name: 'Orders', path: '/api/orders', method: 'GET', expected: [200, 401] },
  { name: 'Users', path: '/api/users', method: 'GET', expected: [200, 401] },
  { name: 'Billing', path: '/api/billing', method: 'GET', expected: [200] },
]

const stack = [
  { component: 'Kong', url: 'http://localhost:8000', port: '8000', role: 'Gateway' },
  { component: 'Keycloak', url: 'http://localhost:8080', port: '8080', role: 'Auth' },
  { component: 'Vault', url: 'http://localhost:8200', port: '8200', role: 'Secret' },
  { component: 'ModSecurity', url: 'http://localhost', port: '80/443', role: 'WAF' },
  { component: 'Prometheus', url: 'http://localhost:9090', port: '9090', role: 'Metrics' },
  { component: 'Grafana', url: 'http://localhost:3000', port: '3000', role: 'Dashboard' },
]

export default function Dashboard() {
  const [statusState, setStatusState] = useState(services.map((item) => ({ ...item, status: 'unknown' })))
  const [serviceInfo, setServiceInfo] = useState({})

  const handlePing = async (item) => {
    const url = item.path
    setServiceInfo((current) => ({ ...current, [item.name]: { loading: true } }))
    try {
      const response = await fetch(url, { method: item.method })
      const isExpected = item.expected.includes(response.status)
      setServiceInfo((current) => ({ ...current, [item.name]: { loading: false, status: isExpected ? 'ok' : 'error', latency: null, code: response.status } }))
      setStatusState((current) => current.map((service) => (service.name === item.name ? { ...service, status: isExpected ? 'online' : 'offline' } : service)))
    } catch {
      setServiceInfo((current) => ({ ...current, [item.name]: { loading: false, status: 'error', latency: null, code: 'ERR' } }))
      setStatusState((current) => current.map((service) => (service.name === item.name ? { ...service, status: 'offline' } : service)))
    }
  }

  const architecture = useMemo(
    () => [
      { label: 'Client', subtitle: 'Browser', badge: 'laptop' },
      { label: 'Nginx WAF', subtitle: 'port 80/443', badge: 'shield' },
      { label: 'Kong', subtitle: 'port 8000', badge: 'kong' },
    ],
    [],
  )

  return (
    <section className="dashboard-page glass-panel">
      <h1>Dashboard Overview</h1>
      <div className="stats-grid">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
      <div className="architecture-panel panel glass-panel">
        <h2>Architecture Flow</h2>
        <div className="architecture-flow">
          <div className="flow-row">
            {architecture.map((item) => (
              <div key={item.label} className="flow-node">
                <div className="node-label">{item.label}</div>
                <div className="node-subtitle">{item.subtitle}</div>
              </div>
            ))}
          </div>
          <div className="flow-lines" aria-hidden="true">
            <div className="line" />
            <div className="line secondary" />
          </div>
          <div className="service-column">
            <div className="service-node">Orders<br /><span>8081</span></div>
            <div className="service-node">Users<br /><span>8082</span></div>
            <div className="service-node">Billing<br /><span>8083</span></div>
          </div>
          <div className="supporting-row">
            <div className="support-node">Keycloak<br /><span>8080</span></div>
            <div className="support-node">Vault<br /><span>8200</span></div>
            <div className="support-node">Prometheus<br /><span>9090</span></div>
            <div className="support-node">Grafana<br /><span>3000</span></div>
          </div>
        </div>
      </div>
      <div className="status-panel panel glass-panel">
        <h2>Service Status</h2>
        <div className="service-grid">
          {statusState.map((item) => {
            const info = serviceInfo[item.name] || {}
            return (
              <div key={item.name} className="service-card">
                <div className="service-header">
                  <div>
                    <strong>{item.name}</strong>
                    <div className="service-url">{item.method} {item.path}</div>
                  </div>
                  <div className={`service-dot ${item.status}`}></div>
                </div>
                <button className="button-secondary" onClick={() => handlePing(item)} disabled={info.loading}>Ping</button>
                <div className="service-meta">
                  {info.loading ? 'Đang ping...' : info.code ? `${info.code}` : 'Chưa ping'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="security-stack panel glass-panel">
        <h2>Security Stack</h2>
        <div className="stack-table">
          {stack.map((item) => (
            <div key={item.component} className="stack-row">
              <div>{item.component}</div>
              <div>{item.url}</div>
              <div>{item.port}</div>
              <div><span className="badge">{item.role}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

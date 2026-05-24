import { useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import TopBar from './components/TopBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Services from './pages/Services.jsx'
import SecurityLab from './pages/SecurityLab.jsx'
import TokensPage from './pages/TokensPage.jsx'
import './App.css'

const navigation = [
  { to: '/', label: 'Dashboard' },
  { to: '/services', label: 'Services' },
  { to: '/security-lab', label: 'Security Lab' },
  { to: '/tokens', label: 'Tokens' },
]

function App() {
  const [authTokens, setAuthTokens] = useState({ accessToken: '', refreshToken: '' })

  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="app-sidebar glass-panel">
          <div className="brand-block">
            <div className="brand-title">ShopFlow</div>
            <div className="brand-subtitle">Security dashboard</div>
          </div>
          <nav className="sidebar-nav">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="token-summary">
            <div className="summary-title">Bearer token</div>
            <div className="summary-value">{authTokens.accessToken ? `${authTokens.accessToken.slice(0, 24)}...` : 'Chưa có token'}</div>
          </div>
        </aside>
        <div className="app-main">
          <TopBar status="online" />
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/services" element={<Services bearerToken={authTokens.accessToken} />} />
              <Route path="/security-lab" element={<SecurityLab bearerToken={authTokens.accessToken} refreshToken={authTokens.refreshToken} />} />
              <Route path="/tokens" element={<TokensPage onTokensChange={setAuthTokens} />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App

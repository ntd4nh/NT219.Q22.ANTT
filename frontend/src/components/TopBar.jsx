import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './TopBar.css'

const pageTitles = {
  '/': 'Dashboard',
  '/services': 'Services',
  '/security-lab': 'Security Lab',
  '/tokens': 'Tokens & Auth',
}

const formatClock = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export default function TopBar({ status = 'online' }) {
  const location = useLocation()
  const [clock, setClock] = useState(formatClock(new Date()))

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const pageTitle = useMemo(() => pageTitles[location.pathname] ?? 'Dashboard', [location.pathname])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-page">{pageTitle}</div>
        <div className="topbar-subtitle">ShopFlow Security Dashboard</div>
      </div>
      <div className="topbar-right">
        <div className={`status-badge ${status === 'online' ? 'online' : 'offline'}`}>
          {status === 'online' ? '🟢 Stack Online' : '🔴 Offline'}
        </div>
        <div className="topbar-clock">{clock}</div>
      </div>
    </header>
  )
}

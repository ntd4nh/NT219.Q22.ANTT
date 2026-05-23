import './StatCard.css'
import { Activity, ShieldAlert, Server, Timer } from 'lucide-react'

const icons = {
  Activity: Activity,
  ShieldAlert: ShieldAlert,
  Server: Server,
  Timer: Timer,
}

export default function StatCard({ icon, label, value, color, trend }) {
  const Icon = icons[icon] || Activity
  return (
    <div className={`stat-card ${color} glass-panel`}>
      <div className="stat-top">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className="stat-icon">
          <Icon size={28} />
        </div>
      </div>
      <div className={`trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>{trend}</div>
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/session/create', icon: '♠', label: 'New Session' },
  { path: '/groups', icon: '♥', label: 'Groups' },
  { path: '/leaderboard', icon: '♦', label: 'Leaderboard' },
  { path: '/profile', icon: '♣', label: 'Profile' }
]

export default function FloatingNav() {
  const location = useLocation()

  return (
    <div className="floating-nav" aria-label="Quick navigation">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`floating-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          title={item.label}
        >
          <span>{item.icon}</span>
          <span className="floating-nav-tooltip">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}

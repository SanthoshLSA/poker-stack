import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
      <nav className="navbar" style={{ boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.5)' : 'none' }}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="navbar-logo">
            <span className="navbar-logo-icon">♠</span>
            POKER<span style={{ color: 'var(--color-gold)' }}>STACK</span>
          </Link>

          {/* Desktop Links */}
          {user && (
            <div className="navbar-links">
              <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/groups" className={`navbar-link ${isActive('/groups') ? 'active' : ''}`}>Groups</Link>
              <Link to="/leaderboard" className={`navbar-link ${isActive('/leaderboard') ? 'active' : ''}`}>Leaderboard</Link>
            </div>
          )}

          {/* Actions */}
          <div className="navbar-actions">
            {user ? (
              <>
                <Link to="/profile">
                  <div
                    className="navbar-avatar"
                    style={{ background: user.avatarColor || '#c9a84c', color: '#0a0a0f' }}
                    title="Profile"
                  >
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Exit ♠
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join Table</Link>
              </>
            )}
            {user && (
              <button className="navbar-menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                {menuOpen ? 'x' : '='}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {user && (
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/dashboard" className="mobile-menu-link">♠ Dashboard</Link>
          <Link to="/session/create" className="mobile-menu-link">♠ New Session</Link>
          <Link to="/groups" className="mobile-menu-link">♥ Groups</Link>
          <Link to="/leaderboard" className="mobile-menu-link">♦ Leaderboard</Link>
          <Link to="/profile" className="mobile-menu-link">♣ Profile</Link>
          <button
            onClick={handleLogout}
            className="mobile-menu-link"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            x Exit Game
          </button>
        </div>
      )}
    </>
  )
}

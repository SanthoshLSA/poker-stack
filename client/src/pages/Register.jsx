import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.username || form.username.length < 3) errs.username = 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = 'Letters, numbers, underscores only'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required'
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      await register({ username: form.username, email: form.email, password: form.password })
    } catch (err) {
      setServerError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const avatarColors = ['#c9a84c', '#8b1c1c', '#1a6b3a', '#2d5a9e', '#7c3aed', '#c2410c', '#0e7490', '#b45309']
  const preview = form.username?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="auth-page" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="bg-orb bg-orb-red" style={{ opacity: 0.5 }} />
      <div className="auth-card card animate-in" style={{ maxWidth: '480px' }}>
        <div className="card-body">
          <div className="auth-header">
            <span className="auth-logo">🎴</span>
            <h1 className="auth-title">Join the Table</h1>
            <p className="auth-subtitle">Create your PokerStack account</p>
          </div>

          {/* Avatar preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className="avatar avatar-xl" style={{ background: '#c9a84c', color: '#0a0a0f', fontSize: '28px', fontFamily: 'var(--font-display)', border: '3px solid rgba(201,168,76,0.4)', boxShadow: '0 0 20px rgba(201,168,76,0.2)' }}>
              {preview}
            </div>
          </div>

          {serverError && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '14px', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: '600' }}>
              ✕ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username ♠</label>
              <input
                id="username"
                name="username"
                type="text"
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="poker_king"
                value={form.username}
                onChange={handleChange}
                maxLength={20}
              />
              {errors.username && <p className="form-error">✕ {errors.username}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email ♥</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <p className="form-error">✕ {errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password ♦</label>
              <input
                id="password"
                name="password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <p className="form-error">✕ {errors.password}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password ♣</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                className={`form-input ${errors.confirm ? 'error' : ''}`}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
              />
              {errors.confirm && <p className="form-error">✕ {errors.confirm}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? '🔄 Creating account...' : '♠ Join PokerStack'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-gold)', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
              Login ♠
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

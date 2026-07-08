import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'

const AVATAR_COLORS = [
  { value: '#c9a84c', label: 'Gold' },
  { value: '#8b1c1c', label: 'Crimson' },
  { value: '#1a6b3a', label: 'Felt Green' },
  { value: '#2d5a9e', label: 'Royal Blue' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#c2410c', label: 'Orange' },
  { value: '#0e7490', label: 'Teal' },
  { value: '#b45309', label: 'Amber' }
]

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false)
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || '#c9a84c')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await authAPI.updateProfile({ isPrivate, avatarColor })
      updateUser(res.data.user)
      showToast('Profile updated!', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async e => {
    e.preventDefault()
    if (!pwForm.currentPassword || !pwForm.newPassword) { showToast('All fields required', 'error'); return }
    if (pwForm.newPassword !== pwForm.confirm) { showToast('Passwords do not match', 'error'); return }
    if (pwForm.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return }

    setChangingPw(true)
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      showToast('Password changed!', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to change password', 'error')
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="bg-orb bg-orb-green" style={{ opacity: 0.3 }} />

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? 'v' : 'x'} {toast.msg}
          </div>
        </div>
      )}

      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="section-badge">♣ Profile</div>
        <h1 className="page-title">Your Account</h1>
      </div>

      {/* Profile Card */}
      <div className="card animate-in" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="avatar avatar-xl" style={{ background: avatarColor, color: '#0a0a0f', border: '3px solid rgba(201,168,76,0.3)', boxShadow: '0 0 20px rgba(201,168,76,0.15)', fontSize: '28px', fontFamily: 'var(--font-display)' }}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {user.username}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{user.email}</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-gold">♠ {user.sessionsPlayed || 0} Sessions</span>
                <span className={`badge ${(user.totalProfit || 0) >= 0 ? 'badge-green' : 'badge-red'}`}>
                  {(user.totalProfit || 0) >= 0 ? '+' : ''}₹{Math.abs(user.totalProfit || 0).toLocaleString('en-IN')} P/L
                </span>
              </div>
            </div>
          </div>

          {/* Avatar color picker */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>Avatar Color ♦</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setAvatarColor(c.value)}
                  title={c.label}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: c.value,
                    border: avatarColor === c.value ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: avatarColor === c.value ? `0 0 12px ${c.value}` : 'none',
                    transform: avatarColor === c.value ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Privacy toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                Private Mode
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Hide your profit/loss from the global leaderboard
              </div>
            </div>
            <button
              onClick={() => setIsPrivate(p => !p)}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                background: isPrivate ? 'var(--color-gold)' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s',
                position: 'relative',
                flexShrink: 0
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: isPrivate ? '27px' : '3px',
                transition: 'all 0.3s'
              }} />
            </button>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card animate-in animate-in-delay-1" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>♠ Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-outline w-full" disabled={changingPw}>
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card animate-in animate-in-delay-2">
        <div className="card-body">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>♣ Your Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Sessions Played', val: user.sessionsPlayed || 0, color: 'var(--color-gold)' },
              { label: 'Sessions Won', val: user.sessionsWon || 0, color: '#22c55e' },
              { label: 'Win Rate', val: user.sessionsPlayed ? Math.round((user.sessionsWon / user.sessionsPlayed) * 100) + '%' : '-', color: 'var(--text-secondary)' },
              { label: 'Total P/L', val: (user.totalProfit >= 0 ? '+' : '') + '₹' + Math.abs(user.totalProfit || 0).toLocaleString('en-IN'), color: user.totalProfit >= 0 ? '#22c55e' : '#ef4444' }
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '900', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px', fontFamily: 'var(--font-display)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sessionAPI, groupAPI } from '../api/api'

export default function CreateSession() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', initialBank: '', groupId: '' })
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    groupAPI.getMine()
      .then(res => setGroups(res.data.groups || []))
      .catch(console.error)
  }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Session name is required'); return }
    if (!form.initialBank || Number(form.initialBank) < 1) { setError('Initial bank amount must be at least ₹1'); return }

    setLoading(true)
    try {
      const res = await sessionAPI.create({
        name: form.name.trim(),
        initialBank: Number(form.initialBank),
        groupId: form.groupId || undefined
      })
      navigate(`/session/${res.data.session.roomCode}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="bg-orb bg-orb-green" style={{ opacity: 0.4 }} />

      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="section-badge">♠ New Session</div>
        <h1 className="page-title">Deal a New Game</h1>
        <p className="text-secondary" style={{ marginTop: '6px', fontSize: '14px' }}>
          You'll be the session admin. Share the room code with players after creating.
        </p>
      </div>

      <div className="card animate-in">
        <div className="card-body">
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '14px', marginBottom: '20px', fontFamily: 'var(--font-display)', fontWeight: '600' }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Session Name ♠</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Friday Night Poker"
                value={form.name}
                onChange={handleChange}
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Bank Amount ♦ (₹)</label>
              <input
                id="initialBank"
                name="initialBank"
                type="number"
                className="form-input"
                placeholder="5000"
                value={form.initialBank}
                onChange={handleChange}
                min={1}
                step={1}
                required
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-display)' }}>
                💡 This is the total amount of real money brought to the table. All buy-ins are deducted from this.
              </p>
            </div>

            {groups.length > 0 && (
              <div className="form-group">
                <label className="form-label">Link to Group ♥ (optional)</label>
                <select
                  id="groupId"
                  name="groupId"
                  className="form-input form-select"
                  value={form.groupId}
                  onChange={handleChange}
                >
                  <option value="">— No group (standalone session) —</option>
                  {groups.map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-display)' }}>
                  Results will appear on the group's leaderboard.
                </p>
              </div>
            )}

            {/* Preview card */}
            <div style={{
              padding: '16px 20px',
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontFamily: 'var(--font-display)'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Session Preview</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{form.name || 'Untitled Session'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>Admin: {user.username}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: 'var(--color-gold)', fontSize: '20px' }}>
                    ₹{form.initialBank ? Number(form.initialBank).toLocaleString('en-IN') : '0'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank</div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? '🔄 Creating session...' : '♠ Create Session & Get Room Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

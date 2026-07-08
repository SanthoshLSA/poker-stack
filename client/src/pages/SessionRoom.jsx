import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sessionAPI } from '../api/api'
import AnimatedCounter from '../components/AnimatedCounter'

const formatINR = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const POLL_INTERVAL = 10000 // 10 seconds

export default function SessionRoom() {
  const { roomCode } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTxModal, setShowTxModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [txHistory, setTxHistory] = useState([])
  const [toast, setToast] = useState(null)
  const pollRef = useRef(null)

  const fetchSession = useCallback(async () => {
    try {
      const res = await sessionAPI.getByCode(roomCode.toUpperCase())
      setSession(res.data.session)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [roomCode])

  useEffect(() => {
    fetchSession()
    pollRef.current = setInterval(fetchSession, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [fetchSession])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.roomCode)
    showToast('Room code copied!', 'success')
  }

  const loadHistory = async () => {
    try {
      const res = await sessionAPI.getHistory(roomCode)
      setTxHistory(res.data.transactions || [])
      setShowHistory(true)
    } catch (err) {
      showToast('Could not load history', 'error')
    }
  }

  if (loading) return (
    <div className="loading-screen" style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', background: 'transparent' }}>
      <div className="loading-spinner" />
      <span>Loading session...</span>
    </div>
  )

  if (error) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>[!]</div>
      <h2 style={{ fontFamily: 'var(--font-display)', color: '#ef4444', marginBottom: '8px' }}>{error}</h2>
      <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  )

  if (!session) return null

  const isAdmin = session.admin?.toString() === user._id?.toString() ||
    session.admin === user._id
  const isActive = session.status === 'active'
  const myPlayer = session.players.find(p =>
    p.user?.toString() === user._id?.toString() || p.user === user._id
  )
  const totalInPlay = session.players.reduce((s, p) => s + p.currentStack, 0) + session.currentBank
  const isBalanced = Math.abs(totalInPlay - session.initialBank) < 0.01

  return (
    <div className="session-room">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-gold" style={{ opacity: 0.3 }} />

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? 'v' : 'x'} {toast.msg}
          </div>
        </div>
      )}

      {/* Session Header */}
      <div className="session-header">
        <div>
          <div className="section-badge" style={{ marginBottom: '8px' }}>
            {isActive ? <span className="badge badge-active">Live</span> : <span className="badge badge-gray">Ended</span>}
          </div>
          <h1 className="session-name">{session.name}</h1>
          {session.group && (
            <p style={{ color: 'var(--color-gold)', fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: '600', marginTop: '4px' }}>
              ♥ {session.group.name}
            </p>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Admin: {session.adminUsername}
          </p>
        </div>

        <div className="room-code-display" style={{ cursor: 'pointer' }} onClick={handleCopyCode} title="Click to copy">
          <div>
            <div className="room-code-label">Room Code</div>
            <div className="room-code-value">{session.roomCode}</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Copy</span>
        </div>
      </div>

      {/* Bank + Conservation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="bank-display">
          <div className="bank-label">Current Bank</div>
          <AnimatedCounter
            value={session.currentBank}
            prefix="₹"
            className="bank-amount"
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-display)' }}>
            of ₹{Number(session.initialBank).toLocaleString('en-IN')} initial
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div className="bank-label" style={{ color: isBalanced ? 'var(--text-muted)' : '#ef4444' }}>
            {isBalanced ? 'Conservation Check' : 'Conservation Error!'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '900', color: isBalanced ? '#22c55e' : '#ef4444', marginTop: '8px' }}>
            ₹{Number(totalInPlay).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-display)' }}>
            Total in play {isBalanced ? '= Initial' : 'mismatch'}
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div className="bank-label">Players</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '900', color: 'var(--color-gold)', marginTop: '8px' }}>
            {session.players.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-display)' }}>
            At the table
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && isActive && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={() => setShowTxModal(true)}>
            ♠ Record Transaction
          </button>
          <button className="btn btn-danger" onClick={() => setShowEndModal(true)}>
            End Session
          </button>
        </div>
      )}

      {/* History button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={loadHistory}
        style={{ marginBottom: '20px' }}
      >
        View Transaction History
      </button>

      {/* Auto-refresh indicator */}
      {isActive && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-green 2s infinite' }}></span>
          Auto-updating every 10s
        </div>
      )}

      {/* Players Grid */}
      <div className="players-grid">
        {session.players.map(player => {
          const profit = (session.status === 'ended' ? player.finalStack : player.currentStack) - player.totalBuyIn
          const isMe = player.user?.toString() === user._id?.toString() || player.user === user._id
          const isPlayerAdmin = session.admin?.toString() === player.user?.toString() || session.admin === player.user
          const stack = session.status === 'ended' && player.finalStack !== null ? player.finalStack : player.currentStack

          return (
            <div key={player.user} className="card player-card" style={isMe ? { borderColor: 'rgba(201,168,76,0.4)', boxShadow: '0 0 20px rgba(201,168,76,0.1)' } : {}}>
              <div className="player-info">
                <div className="avatar avatar-md" style={{ background: player.avatarColor || '#c9a84c', color: '#0a0a0f', flexShrink: 0 }}>
                  {player.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="player-name">
                    {player.username} {isMe && <span style={{ color: 'var(--color-gold)', fontSize: '12px' }}>(You)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                    {isPlayerAdmin && <span className="badge badge-gold" style={{ fontSize: '9px' }}>Admin</span>}
                    {isMe && <span className="badge badge-gray" style={{ fontSize: '9px' }}>You</span>}
                  </div>
                </div>
              </div>

              <div>
                <AnimatedCounter
                  value={stack}
                  prefix="₹"
                  className="player-stack"
                  style={{ color: stack > 0 ? '#22c55e' : stack < 0 ? '#ef4444' : 'var(--text-secondary)' }}
                />
              </div>

              <div className="player-stats">
                <span>Buy-in: ₹{Number(player.totalBuyIn).toLocaleString('en-IN')}</span>
                <span style={{ color: profit > 0 ? '#22c55e' : profit < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  {profit > 0 ? '+' : ''}{formatINR(profit)}
                </span>
              </div>

              {/* Admin controls for this player */}
              {isAdmin && isActive && (
                <div className="player-actions">
                  <button
                    className="btn btn-ghost btn-sm w-full"
                    onClick={() => setShowTxModal({ toPlayerId: player.user, toUsername: player.username })}
                  >
                    + Rebuy / Transfer
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Transaction Modal */}
      {showTxModal && isAdmin && (
        <TransactionModal
          session={session}
          preSelectedTo={typeof showTxModal === 'object' ? showTxModal : null}
          onClose={() => setShowTxModal(false)}
          onSuccess={(res) => {
            setSession(res.session)
            setShowTxModal(false)
            if (res.warnings?.length > 0) {
              showToast('! ' + res.warnings[0], 'warning')
            } else {
              showToast('Transaction recorded!', 'success')
            }
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* End Session Modal */}
      {showEndModal && (
        <EndSessionModal
          session={session}
          onClose={() => setShowEndModal(false)}
          onSuccess={() => {
            setShowEndModal(false)
            showToast('Session ended! Results saved.', 'success')
            fetchSession()
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
    </div>
  )
}

// ─── Transaction Modal ─────────────────────────────────────────────────────────
function TransactionModal({ session, preSelectedTo, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    type: 'rebuy',
    fromType: 'bank',
    fromUserId: '',
    toUserId: preSelectedTo?.toPlayerId || '',
    amount: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [warnings, setWarnings] = useState([])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setWarnings([])
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.toUserId) { onError('Select a recipient'); return }
    if (!form.amount || Number(form.amount) < 1) { onError('Enter a valid amount'); return }
    if (form.fromType === 'player' && !form.fromUserId) { onError('Select source player'); return }
    if (form.fromType === 'player' && form.fromUserId === form.toUserId) { onError('Source and recipient cannot be the same'); return }

    setLoading(true)
    try {
      const res = await sessionAPI.recordTransaction(session.roomCode, {
        type: form.fromType === 'bank' ? (form.toUserId && session.players.find(p => p.user === form.toUserId)?.totalBuyIn === 0 ? 'buyin' : 'rebuy') : 'player_transfer',
        fromType: form.fromType,
        fromUserId: form.fromType === 'player' ? form.fromUserId : undefined,
        toUserId: form.toUserId,
        amount: Number(form.amount),
        note: form.note
      })
      if (res.data.warnings?.length > 0) {
        setWarnings(res.data.warnings)
      }
      onSuccess(res.data)
    } catch (err) {
      onError(err.response?.data?.error || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const fromPlayer = session.players.find(p => p.user === form.fromUserId)
  const toPlayer = session.players.find(p => p.user === form.toUserId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">♠ Record Transaction</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          {warnings.map((w, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-gold)', fontSize: '13px', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
              ! {w}
            </div>
          ))}

          <form onSubmit={handleSubmit}>
            {/* From */}
            <div className="form-group">
              <label className="form-label">Money From</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { val: 'bank', label: 'Bank', sublabel: `₹${Number(session.currentBank).toLocaleString('en-IN')} remaining` },
                  { val: 'player', label: 'Player', sublabel: 'Chip transfer' }
                ].map(opt => (
                  <label key={opt.val} style={{
                    display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 14px',
                    background: form.fromType === opt.val ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${form.fromType === opt.val ? 'rgba(201,168,76,0.4)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input type="radio" name="fromType" value={opt.val} checked={form.fromType === opt.val} onChange={handleChange} style={{ display: 'none' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px', color: form.fromType === opt.val ? 'var(--color-gold)' : 'var(--text-primary)' }}>{opt.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{opt.sublabel}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.fromType === 'player' && (
              <div className="form-group">
                <label className="form-label">Source Player ♠</label>
                <select name="fromUserId" className="form-input form-select" value={form.fromUserId} onChange={handleChange}>
                  <option value="">- Select player -</option>
                  {session.players.map(p => (
                    <option key={p.user} value={p.user}>
                      {p.username} (Stack: ₹{Number(p.currentStack).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* To */}
            <div className="form-group">
              <label className="form-label">Recipient Player ♥</label>
              <select name="toUserId" className="form-input form-select" value={form.toUserId} onChange={handleChange}>
                <option value="">- Select player -</option>
                {session.players
                  .filter(p => form.fromType === 'bank' || p.user !== form.fromUserId)
                  .map(p => (
                    <option key={p.user} value={p.user}>
                      {p.username} (Stack: ₹{Number(p.currentStack).toLocaleString('en-IN')})
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount ♦ (₹)</label>
              <input
                type="number"
                name="amount"
                className="form-input"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                min={1}
                step={1}
              />
              {fromPlayer && form.fromType === 'player' && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {fromPlayer.username} has ₹{Number(fromPlayer.currentStack).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label">Note ♣ (optional)</label>
              <input
                type="text"
                name="note"
                className="form-input"
                placeholder="e.g., First buy-in, Side game rebuy..."
                value={form.note}
                onChange={handleChange}
                maxLength={100}
              />
            </div>
          </form>

          <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Recording...' : 'Confirm Transaction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── End Session Modal ─────────────────────────────────────────────────────────
function EndSessionModal({ session, onClose, onSuccess, onError }) {
  const navigate = useNavigate()
  const [finalStacks, setFinalStacks] = useState(
    Object.fromEntries(session.players.map(p => [p.user, p.currentStack]))
  )
  const [loading, setLoading] = useState(false)

  const totalFinal = Object.values(finalStacks).reduce((s, v) => s + Number(v || 0), 0)
  const isBalanced = Math.abs(totalFinal + session.currentBank - session.initialBank) < 0.01

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await sessionAPI.endSession(session.roomCode, { finalStacks })
      onSuccess()
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      onError(err.response?.data?.error || 'Failed to end session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h2 className="modal-title">End Session</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
            Enter each player's final chip count (cash-out amount). Profits and losses will be calculated and saved.
          </p>

          <div style={{ marginBottom: '16px' }}>
            {session.players.map(p => (
              <div key={p.user} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="avatar avatar-sm" style={{ background: p.avatarColor || '#c9a84c', color: '#0a0a0f', flexShrink: 0 }}>
                  {p.username?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px' }}>{p.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Buy-in: ₹{Number(p.totalBuyIn).toLocaleString('en-IN')} | Current: ₹{Number(p.currentStack).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '120px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                    value={finalStacks[p.user] || ''}
                    onChange={e => setFinalStacks(prev => ({ ...prev, [p.user]: e.target.value }))}
                    placeholder="Final ₹"
                    min={0}
                  />
                  {finalStacks[p.user] !== '' && (
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: '700', color: (Number(finalStacks[p.user]) - p.totalBuyIn) >= 0 ? '#22c55e' : '#ef4444' }}>
                      {(Number(finalStacks[p.user]) - p.totalBuyIn) >= 0 ? '+' : ''}₹{Number(Number(finalStacks[p.user]) - p.totalBuyIn).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Conservation check */}
          <div style={{ padding: '12px 14px', background: isBalanced ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isBalanced ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 'var(--radius-md)', fontSize: '13px', fontFamily: 'var(--font-display)', fontWeight: '600' }}>
            {isBalanced ? (
              <span style={{ color: '#22c55e' }}>Conservation check passed: ₹{Number(totalFinal + session.currentBank).toLocaleString('en-IN')} = ₹{Number(session.initialBank).toLocaleString('en-IN')}</span>
            ) : (
              <span style={{ color: '#ef4444' }}>
                Mismatch! Total final + bank = ₹{Number(totalFinal + session.currentBank).toLocaleString('en-IN')} vs Initial ₹{Number(session.initialBank).toLocaleString('en-IN')}
                {' '}(diff ₹{Math.abs(totalFinal + session.currentBank - session.initialBank).toLocaleString('en-IN')})
              </span>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Ending...' : 'End Session & Save Results'}
          </button>
        </div>
      </div>
    </div>
  )
}

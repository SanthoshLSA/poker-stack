import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { leaderboardAPI } from '../api/api'

const formatINR = n => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function Leaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('profit') // 'profit' | 'sessions' | 'winrate'

  useEffect(() => {
    leaderboardAPI.getGlobal()
      .then(res => setLeaderboard(res.data.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...leaderboard].sort((a, b) => {
    if (sortBy === 'profit') return (b.totalProfit || -Infinity) - (a.totalProfit || -Infinity)
    if (sortBy === 'sessions') return b.sessionsPlayed - a.sessionsPlayed
    if (sortBy === 'winrate') {
      const ra = a.sessionsPlayed ? a.sessionsWon / a.sessionsPlayed : 0
      const rb = b.sessionsPlayed ? b.sessionsWon / b.sessionsPlayed : 0
      return rb - ra
    }
    return 0
  })

  return (
    <div className="page">
      <div className="bg-orb bg-orb-gold" style={{ opacity: 0.3 }} />

      <div className="page-header">
        <div>
          <div className="section-badge">♦ Global Leaderboard</div>
          <h1 className="page-title">Hall of Fame</h1>
          <p className="text-secondary" style={{ marginTop: '6px', fontSize: '14px' }}>
            All-time profits and losses across all sessions. Players with 🔒 have hidden their stats.
          </p>
        </div>
      </div>

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        {[
          { val: 'profit', label: '♦ Profit' },
          { val: 'sessions', label: '♠ Sessions' },
          { val: 'winrate', label: '♥ Win Rate' }
        ].map(opt => (
          <button
            key={opt.val}
            onClick={() => setSortBy(opt.val)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
              background: sortBy === opt.val ? 'var(--color-bg-elevated)' : 'transparent',
              color: sortBy === opt.val ? 'var(--color-gold)' : 'var(--text-muted)',
              boxShadow: sortBy === opt.val ? 'var(--shadow-card)' : 'none'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {sorted.length >= 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              {[sorted[1], sorted[0], sorted[2]].map((p, podIdx) => {
                if (!p) return null
                const medal = podIdx === 0 ? '🥈' : podIdx === 1 ? '🥇' : '🥉'
                const heights = [120, 160, 100]
                return (
                  <div key={p.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '140px' }}>
                    <div className="avatar avatar-lg" style={{ background: p.avatarColor || '#c9a84c', color: '#0a0a0f', border: `3px solid ${podIdx === 1 ? 'var(--color-gold)' : podIdx === 0 ? '#9ca3af' : '#cd7f32'}`, boxShadow: podIdx === 1 ? 'var(--shadow-glow-gold)' : 'none', transform: podIdx === 1 ? 'scale(1.15)' : 'scale(1)' }}>
                      {p.username?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '14px' }}>{p.username}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '18px', color: p.isPrivate && p.userId !== user._id ? 'var(--text-muted)' : p.totalProfit >= 0 ? '#22c55e' : '#ef4444', marginTop: '4px' }}>
                        {p.isPrivate && p.userId !== user._id ? '🔒' : (p.totalProfit >= 0 ? '+' : '') + formatINR(p.totalProfit)}
                      </div>
                    </div>
                    <div style={{ background: podIdx === 1 ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${podIdx === 1 ? 'rgba(201,168,76,0.4)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', padding: '8px 16px', textAlign: 'center', width: '100%', height: `${heights[podIdx]}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                      {medal}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="card animate-in">
            <div style={{ overflowX: 'auto' }}>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Player</th>
                    <th style={{ textAlign: 'right' }}>Total P/L</th>
                    <th style={{ textAlign: 'center' }}>Sessions</th>
                    <th style={{ textAlign: 'center' }}>Won</th>
                    <th style={{ textAlign: 'center' }}>Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => {
                    const winRate = p.sessionsPlayed ? Math.round((p.sessionsWon / p.sessionsPlayed) * 100) : 0
                    const isMe = p.userId === user._id || p.userId === user._id?.toString()
                    return (
                      <tr key={p.userId} style={{ background: isMe ? 'rgba(201,168,76,0.04)' : 'transparent' }}>
                        <td className="rank-cell">
                          <span className={i < 3 ? `rank-${i + 1}` : ''}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar avatar-sm" style={{ background: p.avatarColor || '#c9a84c', color: '#0a0a0f', flexShrink: 0 }}>
                              {p.username?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px' }}>
                              {p.username}
                              {isMe && <span style={{ color: 'var(--color-gold)', fontSize: '11px', marginLeft: '6px' }}>You</span>}
                              {p.isPrivate && <span style={{ fontSize: '12px', marginLeft: '4px' }}>🔒</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px', color: p.isPrivate && !isMe ? 'var(--text-muted)' : p.totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {p.isPrivate && !isMe ? '—' : (p.totalProfit >= 0 ? '+' : '') + formatINR(p.totalProfit)}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{p.sessionsPlayed}</td>
                        <td style={{ textAlign: 'center', color: '#22c55e', fontFamily: 'var(--font-display)', fontWeight: '700' }}>{p.sessionsWon}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {p.sessionsPlayed ? `${winRate}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {sorted.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data yet. Play some sessions!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

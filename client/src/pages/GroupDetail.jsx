import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { groupAPI } from '../api/api'

const formatINR = n => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leaderboard')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      groupAPI.getById(id),
      groupAPI.getLeaderboard(id)
    ])
      .then(([gRes, lbRes]) => {
        setGroup(gRes.data.group)
        setLeaderboard(lbRes.data.leaderboard || [])
      })
      .catch(err => {
        if (err.response?.status === 403) navigate('/groups')
      })
      .finally(() => setLoading(false))
  }, [id])

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="loading-screen" style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', background: 'transparent' }}>
      <div className="loading-spinner" />
    </div>
  )

  if (!group) return null

  const isCreator = group.creator?._id === user._id || group.creator === user._id

  return (
    <div className="page">
      <div className="bg-orb bg-orb-red" style={{ opacity: 0.3 }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="section-badge">♥ Group</div>
          <h1 className="page-title">{group.name}</h1>
          {group.description && <p className="text-secondary" style={{ marginTop: '6px', fontSize: '14px' }}>{group.description}</p>}
          <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Created by {group.creator?.username} * {group.members?.length || 0} members
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="group-invite-code" style={{ cursor: 'pointer', fontSize: '14px', letterSpacing: '0.2em', padding: '8px 14px' }} onClick={copyCode} title="Click to copy">
            {group.inviteCode}
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', letterSpacing: '0' }}>{copied ? ' v' : ' Copy'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        {['leaderboard', 'members'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
              background: tab === t ? 'var(--color-bg-elevated)' : 'transparent',
              color: tab === t ? 'var(--color-gold)' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--shadow-card)' : 'none'
            }}
          >
            {t === 'leaderboard' ? '♦ Leaderboard' : '♠ Members'}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div className="card animate-in">
          <div className="card-header" style={{ padding: '20px 24px' }}>
            <h3 className="card-title">♦ {group.name} Leaderboard</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Player</th>
                  <th style={{ textAlign: 'right' }}>Total P/L</th>
                  <th style={{ textAlign: 'center' }}>Sessions</th>
                  <th style={{ textAlign: 'center' }}>Won</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((p, i) => (
                  <tr key={p.userId}>
                    <td className="rank-cell">
                      <span className={`rank-${i + 1}`}>
                        {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${i + 1}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar avatar-sm" style={{ background: p.avatarColor || '#c9a84c', color: '#0a0a0f', flexShrink: 0 }}>
                          {p.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px' }}>
                            {p.username}
                            {p.userId === user._id && <span style={{ color: 'var(--color-gold)', fontSize: '11px', marginLeft: '6px' }}>You</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px', color: p.isPrivate && p.userId !== user._id ? 'var(--text-muted)' : p.totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {p.isPrivate && p.userId !== user._id
                        ? 'Private'
                        : (p.totalProfit >= 0 ? '+' : '') + formatINR(p.totalProfit)}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{p.sessionsPlayed}</td>
                    <td style={{ textAlign: 'center', color: '#22c55e', fontFamily: 'var(--font-display)', fontWeight: '700' }}>{p.sessionsWon}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No sessions played in this group yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
          {group.members?.map(m => (
            <div key={m._id} className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="avatar avatar-md" style={{ background: m.avatarColor || '#c9a84c', color: '#0a0a0f' }}>
                  {m.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px' }}>
                    {m.username}
                    {m._id === user._id && <span style={{ color: 'var(--color-gold)', fontSize: '11px', marginLeft: '6px' }}>(You)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {isCreator && m._id === group.creator?._id ? 'Owner' : 'Member'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

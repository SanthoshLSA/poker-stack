import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { groupAPI } from '../api/api'

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [joinCode, setJoinCode] = useState('')
  const [toast, setToast] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchGroups = () => {
    groupAPI.getMine()
      .then(res => setGroups(res.data.groups || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGroups() }, [])

  const handleCreate = async e => {
    e.preventDefault()
    if (!createForm.name.trim()) { showToast('Group name is required', 'error'); return }
    setSubmitLoading(true)
    try {
      const res = await groupAPI.create(createForm)
      setGroups(prev => [res.data.group, ...prev])
      setCreateForm({ name: '', description: '' })
      setShowCreate(false)
      showToast(`Group "${res.data.group.name}" created! Code: ${res.data.group.inviteCode}`, 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create group', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleJoin = async e => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setSubmitLoading(true)
    try {
      const res = await groupAPI.join({ inviteCode: joinCode.trim() })
      setGroups(prev => {
        const exists = prev.find(g => g._id === res.data.group._id)
        return exists ? prev : [res.data.group, ...prev]
      })
      setJoinCode('')
      setShowJoin(false)
      showToast(res.data.message, 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid invite code', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="bg-orb bg-orb-red" style={{ opacity: 0.3 }} />

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="section-badge">♥ Groups</div>
          <h1 className="page-title">Your Circles</h1>
          <p className="text-secondary" style={{ marginTop: '6px', fontSize: '14px' }}>
            Private poker groups with dedicated leaderboards
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => { setShowJoin(true); setShowCreate(false) }}>
            ♦ Join Group
          </button>
          <button className="btn btn-primary" onClick={() => { setShowCreate(true); setShowJoin(false) }}>
            ♥ Create Group
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card animate-in" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>♥ Create New Group</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="The Poker Den"
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  maxLength={50}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Friday night crew"
                  value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  maxLength={200}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? '🔄 Creating...' : '✓ Create Group'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="card animate-in" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>♦ Join a Group</h3>
            <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, minWidth: '160px', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                placeholder="INVITE CODE"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button type="submit" className="btn btn-primary" disabled={submitLoading || !joinCode.trim()}>
                {submitLoading ? '...' : '♦ Join'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowJoin(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Groups list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>♥</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            No groups yet
          </p>
          <p style={{ marginBottom: '24px', fontSize: '14px' }}>Create a private circle or join one with an invite code.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {groups.map(g => (
            <Link key={g._id} to={`/groups/${g._id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {g.name}
                      </h3>
                      {g.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{g.description}</p>}
                    </div>
                    <span style={{ fontSize: '24px' }}>♥</span>
                  </div>

                  {/* Invite code */}
                  <div className="group-invite-code" style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Code:</span>
                    {g.inviteCode}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', letterSpacing: '0' }}>📋</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>👥 {g.members?.length || 0} members</span>
                    <span>🎮 {g.totalSessions || 0} sessions</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--color-gold)' }}>
                      {g.creator?._id === g.creator ? 'Owner' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

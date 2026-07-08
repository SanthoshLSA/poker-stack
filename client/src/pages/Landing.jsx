import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: '♠', title: 'Bank Integrity', desc: 'Total money is always conserved. Initial bank = all player stacks + remaining bank, at every moment.' },
  { icon: '♦', title: 'Live Transactions', desc: 'Admin records buy-ins and transfers in real-time. Every move is logged with a full audit trail.' },
  { icon: '♥', title: 'Leaderboard', desc: 'Track profits and losses across all sessions. Group-specific leaderboards for private circles.' },
  { icon: '♣', title: 'Private Sessions', desc: 'Sessions protected by room codes. Groups by invite-only. Your poker night stays private.' },
  { icon: '♠', title: 'Group Management', desc: 'Create groups with friends. Sessions tied to groups get their own leaderboard.' },
  { icon: '♦', title: 'Full History', desc: 'Every transaction logged. Review any session\'s complete history after it ends.' }
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-gold" />
      <div className="bg-orb bg-orb-red" />
      <div className="bg-orb bg-orb-green" />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <p className="landing-eyebrow">♠ The Ultimate Poker Night Companion ♠</p>

          <h1 className="landing-title">
            <span className="landing-title-main">PokerStack</span>
            <span className="landing-title-sub">Bankroll Manager</span>
            <span className="landing-suits">
              <span>♠</span>
              <span> ♥ </span>
              <span>♦</span>
              <span> ♣</span>
            </span>
          </h1>

          <p className="landing-description">
            No more miscounts. No more disputes. Track every chip, every rebuy, and every transfer
            with military precision. Your poker night, fully accounted.
          </p>

          <div className="landing-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Enter Lobby
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Join the Table
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Stats row */}
          <div style={{
            marginTop: '60px',
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '32px'
          }}>
            {[
              { val: '100%', label: 'Money Balanced' },
              { val: 'All', label: 'Transactions Logged' },
              { val: '0', label: 'Disputes' }
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '900', color: 'var(--color-gold)' }}>
                  {s.val}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="text-center mb-24">
          <div className="section-badge">♦ Features</div>
          <h2 className="section-title">Everything You Need</h2>
          <div className="section-divider" style={{ margin: '12px auto 0' }} />
        </div>

        <div className="landing-features">
          {features.map((f, i) => (
            <div key={f.title} className={`card feature-card animate-in animate-in-delay-${(i % 4) + 1}`}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          padding: '80px 24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 50%, rgba(139,28,28,0.04) 100%)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: '900', marginBottom: '20px' }}>
            Ready to <span className="text-gold">Deal In?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
            Free forever. No rake. Just pure poker management.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        ♠ PokerStack ♥ — Keep the game honest ♦ ♣
      </footer>
    </div>
  )
}

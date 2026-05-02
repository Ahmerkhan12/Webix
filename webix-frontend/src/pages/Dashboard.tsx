import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import ParticleField from '../components/ParticleField'
import SettingsView from '../components/SettingsView'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Session {
  id: string
  port: number
  url: string
}

type SessionStatus = 'idle' | 'loading' | 'running' | 'error'
type View = 'launch' | 'settings'

export default function Dashboard() {
  const { session: authSession, profile, signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetPlan = searchParams.get('plan')
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [currentView, setCurrentView] = useState<View>('launch')
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const endBtnRef = useRef<HTMLButtonElement>(null)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Animate panel in on mount
  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 }
    )
  }, [])

  // Handle post-login upgrade trigger
  useEffect(() => {
    if (targetPlan && profile?.subscription_tier === 'free' && authSession) {
      handleUpgrade(targetPlan)
      // Clear param
      searchParams.delete('plan')
      setSearchParams(searchParams)
    }
  }, [targetPlan, profile, authSession])

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await fetch(`${API}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession?.access_token}`
        },
        body: JSON.stringify({ plan })
      })
      if (!res.ok) throw new Error('Failed to create checkout session')
      const { url } = await res.json()
      window.location.href = url
    } catch (err: any) {
      console.error('Upgrade Error:', err)
    }
  }

  const getInitials = () => {
    if (!profile?.full_name) return 'U'
    return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  async function handleStart() {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession?.access_token}`
        }
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || 'Server error')
      }
      const data = await res.json()
      setSession(data.session)
      setStatus('running')

      // GSAP fullscreen takeover
      gsap.timeline()
        .to(panelRef.current, { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' })
        .set(overlayRef.current, { display: 'flex', pointerEvents: 'all' })
        .to(overlayRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' })

      setSession(data.session)
      setStatus('running')
      setShowControls(false)
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Failed to start session. Is the backend running?')
      setShowControls(true) // Expand controls to show error or let them try again
    }
  }

  async function handleEnd() {
    if (!session) return
    try {
      await fetch(`${API}/api/sessions/${session.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authSession?.access_token}`
        }
      })
    } catch (_) { }

    // GSAP fade back to panel
    gsap.timeline()
      .set(overlayRef.current, { pointerEvents: 'none' })
      .to(overlayRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' })
      .set(overlayRef.current, { display: 'none' })
      .to(panelRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' })

    setSession(null)
    setStatus('idle')
  }

  return (
    <div className="dashboard">
      {/* Three.js particle background */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
          <ParticleField count={3500} />
        </Canvas>
      </div>

      {/* Header */}
      <header className="dashboard-header" style={{ height: '80px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="logo-text" style={{ fontSize: '1.2rem', letterSpacing: '0.3em', cursor: 'pointer' }} onClick={() => setCurrentView('launch')}>
          WEBIX
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div className="status-badge" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className={`status-dot ${status === 'running' ? 'running' : ''}`} />
            <span style={{ fontWeight: '700', fontSize: '0.65rem' }}>{status === 'running' ? 'LIVE SESSION' : 'SYSTEM IDLE'}</span>
          </div>

          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                width: '40px', height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                border: profile?.avatar_url ? '2px solid var(--accent-green)' : 'none',
                padding: '0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: showProfileMenu ? '0 0 20px rgba(0,255,135,0.4)' : 'none',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#000', fontWeight: '800', fontSize: '0.8rem', fontFamily: 'var(--font-mono)'
                }}>
                  {getInitials()}
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '52px', right: '0',
                width: '220px',
                background: 'rgba(15,15,15,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '8px',
                zIndex: 1000,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover no-repeat` : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profile?.full_name || 'User'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{authSession?.user.email}</div>
                  </div>
                </div>

                <button
                  onClick={() => { setCurrentView('settings'); setShowProfileMenu(false); }}
                  style={{
                    width: '100%', padding: '10px 16px', textAlign: 'left',
                    background: 'transparent', border: 'none', color: '#ccc',
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer',
                    borderRadius: '6px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--accent-green)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                >
                  Account Settings
                </button>

                <button
                  onClick={signOut}
                  style={{
                    width: '100%', padding: '10px 16px', textAlign: 'left',
                    background: 'transparent', border: 'none', color: 'var(--accent-red)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer',
                    borderRadius: '6px', transition: 'all 0.2s', marginTop: '4px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,60,95,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* View Content */}
      <div
        className="hide-scrollbar"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: 'calc(100vh - 80px)', // Account for header height
          marginTop: '80px',
          display: 'flex',
          justifyContent: 'center',
          padding: '40px 20px',
          overflowY: 'auto' // Enable scrolling for long content like Settings
        }}
      >
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: currentView === 'launch' ? 'center' : 'flex-start', // Center launch, start settings at top
          minHeight: '100%'
        }}>
          {currentView === 'launch' ? (
            <div ref={panelRef} className="session-panel" style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none' }}>
              <div className="session-panel-label">// Session Control</div>
              <div className="session-panel-title">Ready to Launch</div>

              <div className="session-specs">
                {[
                  { label: 'CPU', value: '1 Core' },
                  { label: 'RAM', value: '2 GB' },
                  { label: 'OS', value: 'Ubuntu 22' },
                  { label: 'Storage', value: '10 GB' },
                ].map(s => (
                  <div key={s.label} className="spec-item">
                    <span style={{ color: '#444', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                    <span className="spec-value">{s.value}</span>
                  </div>
                ))}
              </div>

              <button
                className="start-btn"
                onClick={handleStart}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Initializing...' : '⚡ Start Desktop Session'}
              </button>

              {error && <div className="error-msg">⚠ {error}</div>}
            </div>
          ) : (
            <SettingsView onBack={() => setCurrentView('launch')} />
          )}
        </div>
      </div>

      {/* Fullscreen desktop overlay */}
      <div ref={overlayRef} className="desktop-overlay" style={{ display: 'none' }}>
        {session && (
          <iframe
            src={session.url}
            title="Webix Desktop"
            allow="fullscreen"
          />
        )}
      </div>

      {/* Collapsible Session Controls (Left Side) */}
      {session && (
        <div className={`session-controls ${showControls ? 'expanded' : ''}`}>
          <button
            className="session-toggle-btn"
            onClick={() => setShowControls(!showControls)}
            title={showControls ? "Hide Controls" : "Show Controls"}
          >
            {showControls ? '❮' : '❯'}
          </button>

          <div className="session-actions">
            <button className="end-session-btn" onClick={handleEnd}>
              ⏹ End Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import ParticleField from '../components/ParticleField'

const API = 'http://localhost:3001'

interface Session {
  id: string
  port: number
  url: string
}

type SessionStatus = 'idle' | 'loading' | 'running' | 'error'

export default function Dashboard() {
  const [status, setStatus]     = useState<SessionStatus>('idle')
  const [session, setSession]   = useState<Session | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const overlayRef              = useRef<HTMLDivElement>(null)
  const panelRef                = useRef<HTMLDivElement>(null)
  const endBtnRef               = useRef<HTMLButtonElement>(null)

  // Animate panel in on mount
  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 }
    )
  }, [])

  async function handleStart() {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${API}/api/sessions`, { method: 'POST' })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setSession(data.session)
      setStatus('running')

      // GSAP fullscreen takeover
      gsap.timeline()
        .to(panelRef.current, { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' })
        .set(overlayRef.current, { display: 'flex', pointerEvents: 'all' })
        .to(overlayRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' })
        .set(endBtnRef.current, { display: 'block' })
    } catch (err) {
      setStatus('error')
      setError('Failed to start session. Is the backend running?')
    }
  }

  async function handleEnd() {
    if (!session) return
    try {
      await fetch(`${API}/api/sessions/${session.id}`, { method: 'DELETE' })
    } catch (_) {}

    // GSAP fade back to panel
    gsap.timeline()
      .set(endBtnRef.current, { display: 'none' })
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
      <header className="dashboard-header">
        <span className="logo-text">WEBIX</span>
        <div className="status-badge">
          <span className={`status-dot ${status === 'running' ? 'running' : ''}`} />
          <span>{status === 'running' ? 'SESSION RUNNING' : 'IDLE'}</span>
        </div>
      </header>

      {/* Session control panel */}
      <div ref={panelRef} className="session-panel">
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

      {/* End session floating button */}
      <button ref={endBtnRef} className="end-session-btn" onClick={handleEnd} style={{ display: 'none' }}>
        ⏹ End Session
      </button>
    </div>
  )
}

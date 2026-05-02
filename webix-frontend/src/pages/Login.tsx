import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Auto-redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate(plan ? `/dashboard?plan=${plan}` : '/dashboard')
    }
  }, [session, navigate, plan])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate(plan ? `/dashboard?plan=${plan}` : '/dashboard')
    }
  }

  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag">Authentication Required</div>
          <h1 className="hero-headline">Login to <span>Webix</span></h1>
          
          <form onSubmit={handleLogin} className="session-panel" style={{ position: 'static', transform: 'none', margin: '0 auto' }}>
            <div className="spec-item" style={{ marginBottom: '20px' }}>
              <label className="session-panel-label">Email Address</label>
              <input 
                type="email" 
                className="cta-btn" 
                style={{ width: '100%', textTransform: 'none', textAlign: 'left', padding: '12px 20px', cursor: 'text' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="spec-item" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="session-panel-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.7rem', color: 'var(--accent-green)', textDecoration: 'none', opacity: 0.8 }}>Forgot Password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="cta-btn" 
                  style={{ width: '100%', textTransform: 'none', textAlign: 'left', padding: '12px 50px 12px 20px', cursor: 'text' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '15px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-green)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.8,
                    zIndex: 30,
                    mixBlendMode: 'difference' // This will make it visible against both dark and green backgrounds
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button type="submit" className="start-btn" disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? 'Authenticating...' : 'Access Desktop'}
            </button>

            {error && <div className="error-msg">{error}</div>}

            <div className="session-panel-label" style={{ marginTop: '24px', letterSpacing: '0.1em' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--accent-green)', textDecoration: 'none' }}>Register</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

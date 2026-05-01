import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gsap } from 'gsap'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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
      navigate('/dashboard')
    }
  }

  return (
    <div className="landing">
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
          
          <div className="spec-item" style={{ marginBottom: '32px' }}>
            <label className="session-panel-label">Password</label>
            <input 
              type="password" 
              className="cta-btn" 
              style={{ width: '100%', textTransform: 'none', textAlign: 'left', padding: '12px 20px', cursor: 'text' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="start-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Desktop'}
          </button>

          {error && <div className="error-msg">{error}</div>}

          <div className="session-panel-label" style={{ marginTop: '24px', letterSpacing: '0.1em' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-green)', textDecoration: 'none' }}>Register</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect to login after 2 seconds so they can see the success message
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }
  }

  return (
    <div className="landing">
      <div className="hero-content">
        <div className="hero-tag">Join the Cloud</div>
        <h1 className="hero-headline">Create <span>Account</span></h1>
        
        {success ? (
          <div className="session-panel" style={{ position: 'static', transform: 'none', margin: '0 auto' }}>
            <p className="hero-sub">Registration successful! Please check your email for a confirmation link.</p>
            <Link to="/login" className="start-btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="session-panel" style={{ position: 'static', transform: 'none', margin: '0 auto' }}>
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
              {loading ? 'Creating Account...' : 'Register Now'}
            </button>

            {error && <div className="error-msg">{error}</div>}

            <div className="session-panel-label" style={{ marginTop: '24px', letterSpacing: '0.1em' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none' }}>Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

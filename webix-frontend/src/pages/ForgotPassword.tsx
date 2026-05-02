import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for the password reset link.')
    }
    setLoading(false)
  }

  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag">Account Recovery</div>
          <h1 className="hero-headline">Reset <span>Password</span></h1>
          
          <form onSubmit={handleReset} className="session-panel" style={{ position: 'static', transform: 'none', margin: '0 auto' }}>
            <p className="hero-sub" style={{ marginBottom: '24px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="spec-item" style={{ marginBottom: '32px' }}>
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

            <button type="submit" className="start-btn" disabled={loading}>
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            {message && <div style={{ color: 'var(--accent-green)', marginTop: '20px', fontSize: '0.85rem' }}>{message}</div>}
            {error && <div className="error-msg">{error}</div>}

            <div className="session-panel-label" style={{ marginTop: '24px', letterSpacing: '0.1em' }}>
              Back to <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none' }}>Login</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

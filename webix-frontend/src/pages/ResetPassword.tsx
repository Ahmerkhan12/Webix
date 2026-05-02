import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag">Secure Update</div>
          <h1 className="hero-headline">New <span>Password</span></h1>
          
          <form onSubmit={handleUpdatePassword} className="session-panel" style={{ position: 'static', transform: 'none', margin: '0 auto' }}>
            <p className="hero-sub" style={{ marginBottom: '24px' }}>
              Please enter your new password below.
            </p>

            <div className="spec-item" style={{ marginBottom: '32px' }}>
              <label className="session-panel-label">New Password</label>
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
                    mixBlendMode: 'difference'
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button type="submit" className="start-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>

            {message && <div style={{ color: 'var(--accent-green)', marginTop: '20px', fontSize: '0.85rem' }}>{message}</div>}
            {error && <div className="error-msg">{error}</div>}
          </form>
        </div>
      </section>
    </div>
  )
}

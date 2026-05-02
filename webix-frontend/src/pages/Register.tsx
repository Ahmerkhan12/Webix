import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan')
  const [fullName, setFullName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let finalAvatarUrl = ''

    // 1. Sign up user with metadata included
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // avatar_url: finalAvatarUrl // We'll handle this if upload works
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id

    // 2. Upload avatar if selected (Note: This might still fail if RLS requires session)
    if (avatarFile && userId) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        finalAvatarUrl = publicUrl
        
        // Update metadata with avatar URL if we managed to upload it
        await supabase.auth.updateUser({
          data: { avatar_url: finalAvatarUrl }
        })
      }
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      navigate(plan ? `/login?plan=${plan}` : '/login')
    }, 2000)
  }

  return (
    <div className="landing">
      <section className="hero-section">
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
                <label className="session-panel-label">Full Name</label>
                <input 
                  type="text" 
                  className="cta-btn" 
                  style={{ width: '100%', textTransform: 'none', textAlign: 'left', padding: '12px 20px', cursor: 'text' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="spec-item" style={{ marginBottom: '20px' }}>
                <label className="session-panel-label">Profile Picture</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="cta-btn" 
                  style={{ width: '100%', textTransform: 'none', textAlign: 'left', padding: '12px 20px', cursor: 'pointer' }}
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>

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
                {loading ? 'Creating Account...' : 'Register Now'}
              </button>

              {error && <div className="error-msg">{error}</div>}

              <div className="session-panel-label" style={{ marginTop: '24px', letterSpacing: '0.1em' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none' }}>Login</Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

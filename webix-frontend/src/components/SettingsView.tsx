import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface SettingsProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsProps) {
  const { profile, user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [totalUsage, setTotalUsage] = useState(0)
  
  // Customization state
  const [osTheme, setOsTheme] = useState('ubuntu')
  const [ramAddon, setRamAddon] = useState(0)
  const [savingAddons, setSavingAddons] = useState(false)

  const tier = profile?.subscription_tier || 'free'
  const isFree = tier === 'free'
  const tierLimit = isFree ? 600 : 99999

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
      setOsTheme(profile.os_theme || 'ubuntu')
      setRamAddon(profile.ram_addon_mb || 0)
    }
    fetchSessions()
  }, [profile])

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setSessions(data.slice(0, 10))
      
      // Calculate total usage for the CURRENT MONTH only
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thisMonthSessions = data.filter((s: any) => new Date(s.created_at) >= startOfMonth);
      
      const total = thisMonthSessions.reduce((acc: number, s: any) => {
        if (!s.ended_at) return acc
        return acc + (new Date(s.ended_at).getTime() - new Date(s.created_at).getTime())
      }, 0)
      setTotalUsage(Math.floor(total / 60000))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setMsg('Uploading image...')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setMsg('Image uploaded! Click Update to save.')
    } catch (error: any) {
      setMsg('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Update the custom profiles table (use upsert to fix legacy accounts without a profile row)
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ 
        id: user?.id,
        full_name: fullName,
        avatar_url: avatarUrl
      }, { onConflict: 'id' })
    
    // 2. Sync to Supabase Auth Metadata (so the session stays fresh)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl
      }
    })

    if (!dbError && !authError) {
      setMsg('Profile updated successfully')
      await refreshProfile()
    } else {
      setMsg('Update failed: ' + (dbError?.message || authError?.message))
    }
    setLoading(false)
  }

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'Active'
    const diff = new Date(end).getTime() - new Date(start).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const handleUpdateAddons = async (theme: string, ram: number) => {
    if (isFree) return; // Free tier cannot customize
    setSavingAddons(true)
    
    // Optimistic update
    setOsTheme(theme)
    setRamAddon(ram)

    const { error } = await supabase
      .from('profiles')
      .update({ 
        os_theme: theme,
        ram_addon_mb: ram
      })
      .eq('id', user?.id)

    if (error) {
      setMsg('Failed to update customization: ' + error.message)
    } else {
      setMsg('Desktop customization saved!')
      await refreshProfile()
    }
    setSavingAddons(false)
  }

  const handleResetPassword = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Reset email sent! Check your inbox.')
    }
    setLoading(false)
  }

  const usagePercent = Math.min((totalUsage / tierLimit) * 100, 100)

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px', animation: 'fadeIn 0.5s ease' }}>
      {/* Navigation Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'none', border: 'none', color: '#555', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', gap: '8px', 
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: '700',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-green)'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#555'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          BACK TO DASHBOARD
        </button>
      </div>

      {/* Top Banner: Usage */}
      <div className="session-panel" style={{ position: 'static', transform: 'none', width: '100%', padding: '32px', marginBottom: '24px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <div className="session-panel-label" style={{ marginBottom: '8px', color: 'var(--accent-green)' }}>USAGE ANALYTICS</div>
            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
              {Math.floor(totalUsage / 60)}h {totalUsage % 60}m
              <span style={{ fontSize: '1rem', color: '#444', marginLeft: '12px', fontWeight: 400 }}>/ {isFree ? '10h Limit' : 'Unlimited'}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>TIER CAPACITY</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 800, fontSize: '1.1rem' }}>{usagePercent.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${usagePercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))', boxShadow: '0 0 20px rgba(0,255,135,0.4)' }} />
        </div>
      </div>

      {/* Resource Allocation Summary */}
      <div className="session-panel" style={{ position: 'static', transform: 'none', width: '100%', padding: '32px', marginBottom: '24px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
        <div>
          <div className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>CORE ALLOCATION</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {tier === 'free' ? '0.5' : tier === 'hobbyist' ? '1' : '2'} vCPUs
          </div>
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>Tier Baseline</div>
        </div>
        
        <div>
          <div className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>MEMORY (RAM)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {(tier === 'free' ? 0.5 : tier === 'hobbyist' ? 1 : 4) + (profile?.ram_addon_mb ? profile.ram_addon_mb / 1024 : 0)} GB
          </div>
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>
            {profile?.ram_addon_mb ? `Incl. ${profile.ram_addon_mb/1024}GB Boost` : 'Standard Performance'}
          </div>
        </div>

        <div>
          <div className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>PERSISTENT STORAGE</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
            {(tier === 'free' ? 5 : tier === 'hobbyist' ? 20 : 50) + (profile?.storage_addon_gb || 0)} GB
          </div>
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>
            {tier === 'free' ? 'Ephemeral Mode' : 'SSD Block Storage'}
          </div>
        </div>

        <div>
          <div className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>DESKTOP THEME</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
            {profile?.os_theme || 'UBUNTU'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px' }}>
            {profile?.os_theme === 'ubuntu' ? 'Standard UI' : 'Premium Reskin'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
        {/* Left: Account Details */}
        <div className="session-panel" style={{ position: 'static', transform: 'none', width: '100%', padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="session-panel-label" style={{ marginBottom: '24px' }}>ACCOUNT DETAILS</div>
          
          <div className="spec-item" style={{ marginBottom: '32px' }}>
            <label className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>CURRENT PLAN</label>
            <div style={{ padding: '12px 20px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.2)', color: 'var(--accent-green)', borderRadius: '4px', fontWeight: 800, textAlign: 'center', letterSpacing: '0.2em', fontSize: '0.8rem' }}>
              {tier.toUpperCase()} PLAN
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="spec-item" style={{ marginBottom: '24px' }}>
              <label className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>FULL NAME</label>
              <input 
                type="text" 
                className="cta-btn" 
                style={{ width: '100%', textAlign: 'left', padding: '12px 20px', cursor: 'text', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="spec-item" style={{ marginBottom: '24px' }}>
              <label className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>PROFILE PICTURE</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '60px', height: '60px', 
                  borderRadius: '50%', 
                  background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }} />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label 
                  htmlFor="avatar-upload" 
                  style={{ 
                    padding: '10px 16px', background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
                    borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' 
                  }}
                >
                  {uploading ? 'UPLOADING...' : 'CHANGE PHOTO'}
                </label>
              </div>
            </div>

            <button type="submit" className="start-btn" disabled={loading || uploading} style={{ padding: '14px', fontSize: '0.75rem', borderRadius: '4px' }}>
              {loading ? 'SYNCING...' : 'UPDATE PROFILE'}
            </button>
            {msg && !msg.includes('Reset') && <div style={{ color: 'var(--accent-green)', marginTop: '12px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>✓ {msg}</div>}
          </form>

          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '16px' }}>SECURITY</div>
            <button 
              onClick={handleResetPassword}
              disabled={loading}
              style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
            >
              {loading ? 'SENDING...' : 'REQUEST PASSWORD RESET'}
            </button>
            {msg && msg.includes('Reset') && <div style={{ color: 'var(--accent-green)', marginTop: '12px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>✓ {msg}</div>}
          </div>
        </div>

        {/* Middle/Bottom Left: Customization */}
        {!isFree && (
          <div className="session-panel" style={{ position: 'static', transform: 'none', width: '100%', padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / 2' }}>
            <div className="session-panel-label" style={{ marginBottom: '24px' }}>PREMIUM DESKTOP CUSTOMIZATION</div>
            
            {/* OS Theme Selection */}
            <div className="spec-item" style={{ marginBottom: '24px' }}>
              <label className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '12px', display: 'block' }}>OS THEME (Next Session)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {['ubuntu', 'win11', 'macos'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleUpdateAddons(t, ramAddon)}
                    disabled={savingAddons}
                    style={{
                      padding: '12px 8px',
                      background: osTheme === t ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${osTheme === t ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}`,
                      color: osTheme === t ? 'var(--accent-green)' : '#888',
                      borderRadius: '4px',
                      cursor: savingAddons ? 'wait' : 'pointer',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* RAM Boost Selection */}
            <div className="spec-item">
              <label className="session-panel-label" style={{ fontSize: '0.6rem', marginBottom: '12px', display: 'block' }}>RAM BOOST (+2GB)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleUpdateAddons(osTheme, 0)}
                  disabled={savingAddons}
                  style={{
                    flex: 1, padding: '12px',
                    background: ramAddon === 0 ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ramAddon === 0 ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}`,
                    color: ramAddon === 0 ? 'var(--accent-green)' : '#888',
                    borderRadius: '4px', cursor: savingAddons ? 'wait' : 'pointer',
                    fontSize: '0.7rem', fontFamily: 'var(--font-mono)'
                  }}
                >
                  STANDARD
                </button>
                <button
                  onClick={() => handleUpdateAddons(osTheme, 2048)}
                  disabled={savingAddons}
                  style={{
                    flex: 1, padding: '12px',
                    background: ramAddon === 2048 ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ramAddon === 2048 ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}`,
                    color: ramAddon === 2048 ? 'var(--accent-green)' : '#888',
                    borderRadius: '4px', cursor: savingAddons ? 'wait' : 'pointer',
                    fontSize: '0.7rem', fontFamily: 'var(--font-mono)'
                  }}
                >
                  +2GB BOOST
                </button>
              </div>
            </div>
            {savingAddons && <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '16px', fontFamily: 'var(--font-mono)' }}>Saving preferences...</div>}
            {msg && msg.includes('customization') && <div style={{ color: msg.includes('Failed') ? '#ff3c5f' : 'var(--accent-green)', marginTop: '16px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{msg}</div>}
          </div>
        )}

        {/* Right: History */}
        <div className="session-panel" style={{ position: 'static', transform: 'none', width: '100%', padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="session-panel-label" style={{ marginBottom: '24px' }}>SESSION ACTIVITY</div>
          
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#555', fontSize: '0.65rem' }}>DATE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#555', fontSize: '0.65rem' }}>DURATION</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#555', fontSize: '0.65rem' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px', color: '#ccc' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px', color: '#fff' }}>{calculateDuration(s.created_at, s.ended_at)}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: s.status === 'active' ? 'var(--accent-green)' : '#444' }}>
                      {s.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#333', fontSize: '0.7rem' }}>NO RECENT ACTIVITY DETECTED</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

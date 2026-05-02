import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useNavigate, Link } from 'react-router-dom'
import WireframeGlobe from '../components/WireframeGlobe'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const FEATURES = [
  { icon: '⚡', title: 'Instant Boot', desc: 'Your desktop is ready in under 2 seconds. No waiting, no installation.' },
  { icon: '🖥️', title: 'Full Ubuntu Desktop', desc: 'Complete XFCE environment with a real Linux terminal and file manager.' },
  { icon: '🛠️', title: 'Pre-installed Tools', desc: 'VS Code, Firefox, Git, Python — all ready to go on first launch.' },
]

const PLANS = [
  {
    tier: 'Free',
    price: '$0',
    period: '/ month',
    highlight: false,
    badge: null,
    specs: { cpu: '0.5 Core', ram: '1 GB', storage: '5 GB', session: '1 hr/day' },
    features: [
      'Ubuntu 22.04 XFCE',
      'noVNC Browser Access',
      'Pre-installed Dev Tools',
      '⚠ Ephemeral — files deleted on logout',
      'Throttled Network (10 Mbps)',
    ],
    cta: 'Try For Free',
    ctaPath: '/register',
  },
  {
    tier: 'Hobbyist',
    price: '$5',
    period: '/ month',
    highlight: false,
    badge: null,
    specs: { cpu: '1 Core', ram: '1 GB', storage: '20 GB', session: 'Unlimited' },
    features: [
      'Everything in Free',
      '✅ Persistent Home Directory',
      'Standard Network (100 Mbps)',
      'Unlimited Session Time',
      'Session History',
      '⚡ +2GB / +4GB RAM Add-on (+$5/mo)',
      '+50 GB Storage Add-on ($5/mo)',
      '🖥️ Windows 11 / macOS Theme Add-on ($3/mo)',
    ],
    cta: 'Start Hobbyist',
    ctaPath: '/register',
  },
  {
    tier: 'Developer',
    price: '$15',
    period: '/ month',
    highlight: true,
    badge: 'Best Value',
    specs: { cpu: '2 Cores', ram: '4 GB', storage: '50 GB', session: 'Unlimited' },
    features: [
      'Everything in Hobbyist',
      '✅ Daily Backups & Snapshots',
      'Uncapped Network',
      'Root Access & Custom OS Themes',
      'Priority Container Boot',
      '⚡ +2GB / +4GB RAM Add-on (+$5/mo)',
      '+50 GB Storage Add-on ($5/mo)',
      '🖥️ Windows 11 / macOS Theme Add-on ($3/mo)',
    ],
    cta: 'Start Developer',
    ctaPath: '/register',
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    period: '',
    highlight: false,
    badge: '🔥 Pro Max',
    specs: { cpu: '8+ Cores', ram: '16+ GB', storage: 'Unlimited', session: 'Unlimited' },
    features: [
      'Everything in Developer',
      'Dedicated Bare-Metal Host',
      'Docker-in-Docker (Privileged)',
      'True Windows / macOS VM',
      'SLA Uptime Guarantee',
      'SSO / SAML Auth',
      'Dedicated Support & Onboarding',
    ],
    cta: 'Contact Sales',
    ctaPath: '/register',
  },
]

export default function Landing() {
  const { session: authSession } = useAuth()
  const navigate = useNavigate()
  const tagRef   = useRef<HTMLDivElement>(null)
  const h1Ref    = useRef<HTMLHeadingElement>(null)
  const subRef   = useRef<HTMLParagraphElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  const handleUpgrade = async (plan: string) => {
    if (plan === 'free') {
      navigate('/dashboard');
      return;
    }
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
      alert('Billing Error: ' + err.message)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && window.scrollY > lastScrollY.current) {
        setIsNavVisible(false) // scrolling down
      } else {
        setIsNavVisible(true)  // scrolling up
      }
      lastScrollY.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to('.landing-nav', { opacity: 1, y: 0, duration: 0.6, delay: 0.2 })
      .to(tagRef.current,   { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to(h1Ref.current,    { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
      .to(subRef.current,   { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
      .to(btnRef.current,   { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .to(stripRef.current, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
  }, [])

  // Magnetic button effect
  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return
    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 100) {
        gsap.to(btn, { x: dx * 0.35, y: dy * 0.35, duration: 0.3, ease: 'power2.out' })
      }
    }
    const handleLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
    btn.addEventListener('mousemove', handleMove)
    btn.addEventListener('mouseleave', handleLeave)
    return () => {
      btn.removeEventListener('mousemove', handleMove)
      btn.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className={`landing-nav ${isNavVisible ? '' : 'nav-hidden'}`}>
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="nav-link nav-link--outline">Sign Up</Link>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Three.js background */}
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <WireframeGlobe />
          </Canvas>
        </div>

        {/* Hero content */}
        <div className="hero-content">
          <div ref={tagRef} className="hero-tag">Linux Desktop in the Browser</div>
          <h1 ref={h1Ref} className="hero-headline">
            Your OS.<br /><span>Anywhere.</span>
          </h1>
          <p ref={subRef} className="hero-sub">
            Webix gives you a full Ubuntu desktop, streamed directly to your browser.<br />
            No VM. No installation. Just click and start.
          </p>
          <button ref={btnRef} className="cta-btn" onClick={() => navigate('/dashboard')}>
            Launch Free Session →
          </button>
        </div>
      </section>

      {/* Features strip section */}
      <section ref={stripRef} className="features-strip">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '100px 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ marginBottom: '16px', display: 'inline-block', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(0,255,135,0.3)', background: 'rgba(0,255,135,0.05)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent-green)', letterSpacing: '0.15em' }}>// PRICING</span>
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Power that <span style={{ color: 'var(--accent-green)' }}>scales with you</span>
        </h2>
        <p style={{ color: '#555', fontSize: '1rem', marginBottom: '60px', maxWidth: '500px', margin: '0 auto 60px' }}>
          Start free, upgrade when you need more. No hidden fees.
        </p>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1100px', margin: '0 auto' }}>
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              style={{
                flex: '1 1 300px',
                maxWidth: '340px',
                padding: '36px 28px',
                borderRadius: '20px',
                border: plan.highlight ? '1px solid rgba(0,255,135,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: plan.highlight ? 'rgba(0,255,135,0.04)' : 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                boxShadow: plan.highlight ? '0 0 60px rgba(0,255,135,0.08)' : 'none',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = plan.highlight ? '0 0 80px rgba(0,255,135,0.15)' : '0 20px 40px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = plan.highlight ? '0 0 60px rgba(0,255,135,0.08)' : 'none'
              }}
            >
              {plan.badge && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: '20px', background: 'var(--accent-green)', color: '#000', fontSize: '0.65rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                  {plan.badge}
                </div>
              )}

              {/* Tier & Price */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: '700', color: plan.highlight ? 'var(--accent-green)' : '#555', letterSpacing: '0.15em', marginBottom: '12px' }}>{plan.tier.toUpperCase()}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{plan.price}</span>
                <span style={{ color: '#444', fontSize: '0.85rem' }}>{plan.period}</span>
              </div>

              {/* Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {Object.entries(plan.specs).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '700', color: '#ccc' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#888' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => {
                  if (authSession) {
                    handleUpgrade(plan.tier.toLowerCase());
                  } else {
                    navigate(`/register?plan=${plan.tier.toLowerCase()}`);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'block', textAlign: 'center',
                  padding: '14px 24px', borderRadius: '10px',
                  background: plan.highlight ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)',
                  color: plan.highlight ? '#000' : '#ccc',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: '800',
                  letterSpacing: '0.08em', textDecoration: 'none',
                  border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

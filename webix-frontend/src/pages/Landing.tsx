import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import WireframeGlobe from '../components/WireframeGlobe'

const FEATURES = [
  { icon: '⚡', title: 'Instant Boot', desc: 'Your desktop is ready in under 2 seconds. No waiting, no installation.' },
  { icon: '🖥️', title: 'Full Ubuntu Desktop', desc: 'Complete XFCE environment with a real Linux terminal and file manager.' },
  { icon: '🛠️', title: 'Pre-installed Tools', desc: 'VS Code, Firefox, Git, Python — all ready to go on first launch.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const tagRef   = useRef<HTMLDivElement>(null)
  const h1Ref    = useRef<HTMLHeadingElement>(null)
  const subRef   = useRef<HTMLParagraphElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(tagRef.current,   { opacity: 1, y: 0, duration: 0.6, delay: 0.3 })
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

      {/* Features strip */}
      <div ref={stripRef} className="features-strip" style={{ position: 'absolute', bottom: 0 }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

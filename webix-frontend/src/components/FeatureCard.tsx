import { useRef } from 'react'
import './FeatureCard.css'

interface FeatureCardProps {
  icon: string
  title: string
  desc: string
  techLabel: string
  techValue: string
  className?: string
}

export default function FeatureCard({ icon, title, desc, techLabel, techValue, className = '' }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`feature-card-wrapper ${className}`} ref={cardRef}>
      <div className="feature-card-inner">
        {/* Front of card */}
        <div className="feature-card-front">
          <span className="feature-icon">{icon}</span>
          <div className="feature-title">{title}</div>
          <div className="feature-desc">{desc}</div>
        </div>

        {/* Back of card (Technical Specs) */}
        <div className="feature-card-back">
          <div className="tech-tag">TECH_SPEC</div>
          <div className="tech-label">{techLabel}</div>
          <div className="tech-value">{techValue}</div>
          <div className="tech-status">
            <span className="tech-dot" />
            OPERATIONAL
          </div>
        </div>
      </div>
    </div>
  )
}

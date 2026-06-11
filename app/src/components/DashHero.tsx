import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';

interface Props {
  greeting: string;
  firstName: string;
  dateLabel: string;
}

export default function DashHero({ greeting, firstName, dateLabel }: Props) {
  const { acseScore } = useAppStore();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const scoreColor = acseScore >= 80 ? '#10B981' : acseScore >= 60 ? '#F59E0B' : '#F87171';
  const scoreLabel = acseScore >= 80 ? 'Great' : acseScore >= 60 ? 'Good' : 'Rest';

  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (acseScore / 100) * circ;

  return (
    <div
      className="dash-hero"
      ref={heroRef}
      style={{ opacity: 0, transform: 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <div className="dash-hero__left">
        <p className="dash-hero__date">{dateLabel}</p>
        <h1 className="dash-hero__greeting">
          {greeting},<br />
          <span className="dash-hero__name">{firstName}.</span>
        </h1>
      </div>
      <div className="dash-hero__ring">
        <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
          <circle
            cx="34" cy="34" r={r}
            fill="none"
            stroke={scoreColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 4px ${scoreColor}60)`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="dash-hero__ring-inner">
          <span className="dash-hero__score" style={{ color: scoreColor }}>{acseScore}</span>
          <span className="dash-hero__score-label">{scoreLabel}</span>
        </div>
      </div>
    </div>
  );
}

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
    const t = setTimeout(() => heroRef.current?.classList.add('dash-hero--visible'), 80);
    return () => clearTimeout(t);
  }, []);

  const scoreColor = acseScore >= 80 ? '#34C759' : acseScore >= 60 ? '#FF9500' : '#FF3B30';

  const r = 27;
  const circ = 2 * Math.PI * r;
  const dash = (acseScore / 100) * circ;

  return (
    <div
      className="dash-hero"
      ref={heroRef}
      style={{ opacity: 0, transform: 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
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
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="5" />
          <circle
            cx="34" cy="34" r={r}
            fill="none"
            stroke={scoreColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="dash-hero__ring-inner">
          <span className="dash-hero__score" style={{ color: scoreColor }}>{acseScore}</span>
          <span className="dash-hero__score-label">score</span>
        </div>
      </div>
    </div>
  );
}

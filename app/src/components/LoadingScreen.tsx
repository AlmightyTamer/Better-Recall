import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

const PETALS = 5;

export default function LoadingScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const [phase, setPhase] = useState<'in' | 'title' | 'exit'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'), 1400);
    const t2 = setTimeout(() => setPhase('exit'), 3000);
    const t3 = setTimeout(() => setScreen('login'), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [setScreen]);

  return (
    <div className={`sl-splash sl-splash--${phase}`} aria-label="Loading Recall">
      <div className="sl-bloom" aria-hidden>
        <div className="sl-bloom__glow" />
        <div className="sl-bloom__petals">
          {Array.from({ length: PETALS }, (_, i) => (
            <span
              key={i}
              className="sl-bloom__petal"
              style={{ '--i': i, '--angle': `${i * (360 / PETALS)}deg` } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="sl-bloom__center">
          <span className="sl-bloom__star" />
          <span className="sl-bloom__core" />
        </div>
      </div>
      <h1 className="sl-brand">Recall</h1>
      <p className="sl-tagline">Memory · Medication · Moments</p>
    </div>
  );
}

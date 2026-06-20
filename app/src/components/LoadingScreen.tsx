import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

const PETAL_COUNT = 5;

export default function LoadingScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const [phase, setPhase] = useState<'assemble' | 'bloom' | 'title' | 'exit'>('assemble');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('bloom'), 900);
    const t2 = setTimeout(() => setPhase('title'), 1600);
    const t3 = setTimeout(() => setPhase('exit'), 3200);
    const t4 = setTimeout(() => setScreen('login'), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [setScreen]);

  return (
    <div className={`sl-splash-root sl-splash-root--${phase}`} aria-label="Loading Recall">
      <div className="sl-flower-stage" aria-hidden>
        {/* Glow behind flower */}
        <div className="sl-flower-glow" />

        {/* Petals assemble from scattered positions */}
        <div className="sl-flower-petals">
          {Array.from({ length: PETAL_COUNT }, (_, i) => (
            <div
              key={i}
              className="sl-petal"
              style={{ '--petal-i': i, '--petal-angle': `${i * (360 / PETAL_COUNT)}deg` } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Center blooms after petals */}
        <div className="sl-flower-center">
          <div className="sl-flower-center__white" />
          <div className="sl-flower-center__yellow" />
          <div className="sl-flower-center__dot" />
        </div>

        {/* Stem + leaves */}
        <div className="sl-flower-stem" />
        <div className="sl-flower-leaf sl-flower-leaf--left" />
        <div className="sl-flower-leaf sl-flower-leaf--right" />
      </div>

      <p className="sl-splash-title">Recall</p>
      <p className="sl-splash-sub">Memory · Medication · Moments</p>
    </div>
  );
}

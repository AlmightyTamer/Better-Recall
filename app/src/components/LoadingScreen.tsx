import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { LOGO_URL } from '../lib/assets';

export default function LoadingScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const [phase, setPhase] = useState<'bloom' | 'title' | 'exit'>('bloom');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'), 1200);
    const t2 = setTimeout(() => setPhase('exit'), 2800);
    const t3 = setTimeout(() => setScreen('login'), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [setScreen]);

  return (
    <div className={`sl-splash sl-splash--${phase}`} aria-label="Loading Recall">
      <div className="sl-logo-stage" aria-hidden>
        <div className="sl-logo-glow" />
        <div className="sl-logo-ring" />
        <img
          src={LOGO_URL}
          alt=""
          className="sl-logo-img"
          width={160}
          height={160}
          draggable={false}
        />
      </div>
      <h1 className="sl-brand">Recall</h1>
      <p className="sl-tagline">Memory · Medication · Moments</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import ForgetMeNotMark from './ForgetMeNotMark';

export default function LoadingScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const [phase, setPhase] = useState<'bloom' | 'title' | 'exit'>('bloom');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'), 1100);
    const t2 = setTimeout(() => setPhase('exit'), 2700);
    const t3 = setTimeout(() => setScreen('login'), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [setScreen]);

  return (
    <div className={`sl-splash sl-splash--${phase}`} aria-label="Loading Recall">
      {/* Ambient background light pools */}
      <div className="sl-bg-orb sl-bg-orb--1" aria-hidden />
      <div className="sl-bg-orb sl-bg-orb--2" aria-hidden />
      <div className="sl-bg-orb sl-bg-orb--3" aria-hidden />

      {/* Ceramic orb housing the flower mark */}
      <div className="sl-logo-stage" aria-hidden>
        <div className="sl-logo-glow" />
        <div className="sl-logo-ring" />
        <div className="sl-ceramic-orb">
          <div className="sl-ceramic-orb__glaze" />
          <div className="sl-ceramic-orb__inner">
            <ForgetMeNotMark size={88} />
          </div>
          <div className="sl-ceramic-orb__rim" />
        </div>
      </div>

      {/* Brand text */}
      <div className="sl-brand-block">
        <h1 className="sl-brand">Recall</h1>
        <p className="sl-tagline">Memory · Medication · Moments</p>
      </div>
    </div>
  );
}

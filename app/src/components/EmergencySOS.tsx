import { useRef, useState, type CSSProperties } from 'react';
import { useAppStore } from '../store/appStore';
import StudioIcon from './StudioIcon';

const HOLD_MS = 3000;

interface Props { inline?: boolean; }

export default function EmergencySOS({ inline = false }: Props) {
  const { user } = useAppStore();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tapHint, setTapHint] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!user) return null;

  const clearHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
    setProgress(0);
  };

  const startHold = () => {
    setHolding(true);
    setTapHint(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    startTime.current = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
      setProgress(pct);
      if (elapsed >= HOLD_MS) {
        clearHold();
        window.location.href = 'tel:911';
      }
    }, 50);
  };

  const handleTap = () => {
    // Only fires if hold didn't complete (progress < 100)
    if (!holding) {
      setTapHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setTapHint(false), 3000);
    }
  };

  return (
    <>
      <button
        type="button"
        className={inline ? `sos-inline tap-feedback ${holding ? 'sos-inline--holding' : ''}` : `sos-fab tap-feedback ${holding ? 'sos-fab--holding' : ''}`}
        aria-label="Emergency SOS — hold 3 seconds to call 911"
        onPointerDown={startHold}
        onPointerUp={() => { clearHold(); handleTap(); }}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
        style={inline ? { '--progress': `${progress}%` } as CSSProperties : undefined}
      >
        {!inline && <span className="sos-fab__ring" style={{ '--progress': `${progress}%` } as CSSProperties} />}
        <StudioIcon name="sos" size={inline ? 18 : 26} />
        <span className={inline ? 'sos-inline__label' : 'sos-fab__label'}>SOS</span>
      </button>

      {tapHint && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,30,0.92)', color: '#fff',
          padding: '10px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600,
          zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          Hold for 3 seconds to call 911
        </div>
      )}
    </>
  );
}

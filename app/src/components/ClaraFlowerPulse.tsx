/** Clara's liquid glass orb — pulses and breathes when active */

interface ClaraFlowerPulseProps {
  active: boolean;
  size?: number;
  className?: string;
}

export default function ClaraFlowerPulse({ active, size = 96, className = '' }: ClaraFlowerPulseProps) {
  return (
    <div
      className={`lg-clara-orb ${active ? 'lg-clara-orb--active' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={!active}
      aria-label={active ? 'Clara is responding' : undefined}
      role={active ? 'status' : undefined}
    >
      <div className="lg-clara-orb__sphere">
        <div className="lg-clara-orb__core" />
        <div className="lg-clara-orb__shine" />
        <div className="lg-clara-orb__shine2" />
        <div className="lg-clara-orb__rim" />
      </div>
      <div className="lg-clara-orb__ring" />
      <div className="lg-clara-orb__ring2" />
    </div>
  );
}

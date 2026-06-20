import ForgetMeNotAnimated from './ForgetMeNotAnimated';

interface ClaraFlowerPulseProps {
  active: boolean;
  size?: number;
  className?: string;
}

/** Clara's forget-me-not — petals pulse in and out while she thinks */
export default function ClaraFlowerPulse({ active, size = 96, className = '' }: ClaraFlowerPulseProps) {
  return (
    <div
      className={`fm-clara ${active ? 'fm-clara--active' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={!active}
      aria-label={active ? 'Clara is thinking' : undefined}
      role={active ? 'status' : undefined}
    >
      <ForgetMeNotAnimated size={size} thinking={active} />
      <div className="fm-clara__glow" aria-hidden />
    </div>
  );
}

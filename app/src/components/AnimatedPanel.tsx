import { ReactNode, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

interface AnimatedPanelProps {
  panelKey: string;
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

export default function AnimatedPanel({
  panelKey,
  children,
  className = '',
}: AnimatedPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    // Force reflow to restart CSS animation on key change
    el.classList.remove('panel-enter');
    void el.offsetWidth;
    el.classList.add('panel-enter');

    const cleanup = () => el.classList.remove('panel-enter');
    el.addEventListener('animationend', cleanup, { once: true });
    return () => el.removeEventListener('animationend', cleanup);
  }, [panelKey]);

  return (
    <div ref={ref} className={`${className} panel-enter`}>
      {children}
    </div>
  );
}

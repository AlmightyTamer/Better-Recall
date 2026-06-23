import { ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { duration, EASE } from '../lib/motion';

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
  stagger = false,
}: AnimatedPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFirst = useRef(true);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Kill any in-flight tweens and reset inline styles before starting fresh
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'all' });

      const buttons = el.querySelectorAll<HTMLElement>('.studio-btn, .studio-input');

      const onComplete = () => gsap.set(el, { clearProps: 'opacity,y,transform' });

      if (isFirst.current) {
        isFirst.current = false;
        gsap.fromTo(
          el,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: duration(0.65),
            ease: EASE.enter,
            onComplete,
          }
        );
        gsap.set(buttons, { opacity: 1 });
        if (stagger && buttons.length) {
          gsap.fromTo(
            buttons,
            { y: 12, opacity: 1 },
            {
              y: 0,
              opacity: 1,
              duration: duration(0.45),
              ease: EASE.enter,
              stagger: 0.07,
              delay: 0.12,
            }
          );
        }
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: duration(0.55),
          ease: EASE.enter,
          onComplete,
        }
      );

      gsap.set(buttons, { opacity: 1 });
      if (stagger && buttons.length) {
        gsap.fromTo(
          buttons,
          { y: 10, opacity: 1 },
          {
            y: 0,
            opacity: 1,
            duration: duration(0.4),
            ease: EASE.enter,
            stagger: 0.06,
            delay: 0.08,
          }
        );
      }
    },
    { scope: ref, dependencies: [panelKey] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

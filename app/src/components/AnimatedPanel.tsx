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

      const buttons = el.querySelectorAll<HTMLElement>('.studio-btn, .studio-input');

      if (isFirst.current) {
        isFirst.current = false;
        gsap.fromTo(
          el,
          { opacity: 0, y: 14, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: duration(0.65),
            ease: EASE.enter,
          }
        );
        if (stagger && buttons.length) {
          gsap.fromTo(
            buttons,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: duration(0.45),
              ease: EASE.enter,
              stagger: 0.07,
              delay: 0.12,
            }
          );
        } else {
          gsap.set(buttons, { opacity: 1, y: 0 });
        }
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 18, filter: 'blur(5px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: duration(0.55),
          ease: EASE.enter,
        }
      );

      if (stagger && buttons.length) {
        gsap.fromTo(
          buttons,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: duration(0.4),
            ease: EASE.enter,
            stagger: 0.06,
            delay: 0.08,
          }
        );
      } else {
        gsap.set(buttons, { opacity: 1, y: 0 });
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

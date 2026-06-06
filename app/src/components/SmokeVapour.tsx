import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { duration, EASE, prefersReducedMotion } from '../lib/motion';

export default function SmokeVapour({ intensity = 1 }: { intensity?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const layers = gsap.utils.toArray<HTMLElement>('.smoke-layer');
      if (prefersReducedMotion()) {
        gsap.set(layers, { opacity: 0.08 * intensity });
        return;
      }

      const tl = gsap.timeline({ repeat: -1, defaults: { ease: EASE.breathe } });

      layers.forEach((layer, i) => {
        const driftX = 22 + i * 10;
        const driftY = -14 + i * 6;
        const rot = i % 2 === 0 ? 4 : -3.5;

        gsap.set(layer, { force3D: true, transformOrigin: '50% 50%' });

        gsap.to(layer, {
          x: `+=${driftX}`,
          y: `+=${driftY}`,
          rotation: rot,
          duration: duration(16 + i * 3),
          ease: EASE.breathe,
          repeat: -1,
          yoyo: true,
        });

        gsap.to(layer, {
          opacity: 0.09 * intensity + i * 0.025,
          scale: 1.06 + i * 0.02,
          duration: duration(9 + i * 2),
          ease: EASE.breathe,
          repeat: -1,
          yoyo: true,
        });
      });

      tl.to(layers, {
        opacity: `+=${0.02 * intensity}`,
        duration: duration(12),
        stagger: { each: 1.5, from: 'random' },
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: rootRef, dependencies: [intensity] }
  );

  return (
    <div ref={rootRef} className="smoke-root" aria-hidden>
      <div className="smoke-layer smoke-layer-1" />
      <div className="smoke-layer smoke-layer-2" />
      <div className="smoke-layer smoke-layer-3" />
      <div className="smoke-layer smoke-layer-4" />
    </div>
  );
}

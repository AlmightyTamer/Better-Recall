import { type CSSProperties, ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import FlowerStage from './FlowerStage';
import AnimatedPanel from './AnimatedPanel';
import { getFlowers } from '../flowers';
import { useAppStore } from '../store/appStore';
import { duration, EASE } from '../lib/motion';

interface StudioShellProps {
  children: ReactNode;
  flowerSrc?: string;
  contentKey?: string;
  header?: ReactNode;
  footer?: ReactNode;
  dimOverlay?: number;
}

export default function StudioShell({
  children,
  flowerSrc,
  contentKey,
  header,
  footer,
  dimOverlay = 0.76,
}: StudioShellProps) {
  const theme = useAppStore((s) => s.theme);
  const resolvedFlower = flowerSrc ?? getFlowers(theme).home;
  const effectiveOverlay = theme === 'light' ? Math.min(dimOverlay, 0.34) : dimOverlay;
  const scrimRef = useRef<HTMLDivElement>(null);
  const prevFlower = useRef(resolvedFlower);

  useGSAP(
    () => {
      if (resolvedFlower === prevFlower.current) return;
      prevFlower.current = resolvedFlower;

      if (scrimRef.current) {
        gsap.fromTo(
          scrimRef.current,
          { opacity: 0.92 },
          { opacity: 1, duration: duration(0.8), ease: EASE.smooth }
        );
      }
    },
    { dependencies: [resolvedFlower] }
  );

  return (
    <div className="studio-screen studio-app">
      <FlowerStage src={resolvedFlower} glowIntensity={0.6} variant="app" />
      <div
        ref={scrimRef}
        className="studio-app-scrim"
        style={{ '--scrim-opacity': String(effectiveOverlay) } as CSSProperties}
      />
      {header}
      <AnimatedPanel panelKey={contentKey ?? resolvedFlower} className="studio-app-content">
        {children}
      </AnimatedPanel>
      {footer}
    </div>
  );
}

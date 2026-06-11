import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAppStore } from '../store/appStore';
import { duration, EASE } from '../lib/motion';

export default function LoadingScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const screenRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.splash-loader__title', {
        opacity: 0,
        y: 24,
        duration: duration(0.85),
        delay: 0.15,
        ease: EASE.enter,
      });
      gsap.from('.splash-loader__sub', {
        opacity: 0,
        y: 12,
        duration: duration(0.7),
        delay: 0.35,
        ease: EASE.enter,
      });
      gsap.from('.splash-orbit', {
        opacity: 0,
        scale: 0.6,
        duration: duration(0.6),
        delay: 0.5,
        ease: 'back.out(1.6)',
      });
    },
    { scope: contentRef }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = screenRef.current;
      if (!el) {
        setScreen('login');
        return;
      }
      gsap.to(el, {
        opacity: 0,
        duration: duration(0.55),
        ease: EASE.smooth,
        onComplete: () => setScreen('login'),
      });
    }, 2400);
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div ref={screenRef} className="studio-screen splash-screen splash-screen--loader">
      <div className="splash-loader__mesh" aria-hidden />
      <div ref={contentRef} className="splash-loader__content">
        <h1 className="splash-loader__title">Recall</h1>
        <p className="splash-loader__sub">Getting things ready for you…</p>
        <div className="splash-orbit" aria-hidden>
          <span className="splash-orbit__ring" />
          <span className="splash-orbit__dot splash-orbit__dot--1" />
          <span className="splash-orbit__dot splash-orbit__dot--2" />
          <span className="splash-orbit__dot splash-orbit__dot--3" />
        </div>
      </div>
    </div>
  );
}

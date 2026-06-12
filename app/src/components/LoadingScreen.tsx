import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAppStore } from '../store/appStore';
import { duration } from '../lib/motion';

const LETTERS = ['R', 'E', 'C', 'A', 'L', 'L'];
const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const STARS = [
  { x: 8,  y: 12, r: 1.8, d: 0.3 }, { x: 91, y: 9,  r: 2.2, d: 0.7 },
  { x: 94, y: 58, r: 1.5, d: 0.1 }, { x: 85, y: 82, r: 2,   d: 0.9 },
  { x: 48, y: 94, r: 1.8, d: 0.4 }, { x: 6,  y: 71, r: 2.5, d: 0.6 },
  { x: 4,  y: 36, r: 1.6, d: 0.2 }, { x: 20, y: 90, r: 2,   d: 0.8 },
  { x: 76, y: 6,  r: 1.8, d: 0.5 }, { x: 55, y: 4,  r: 2.2, d: 0.15 },
  { x: 14, y: 52, r: 1.5, d: 0.35 }, { x: 88, y: 33, r: 2,  d: 0.55 },
  { x: 33, y: 5,  r: 1.8, d: 0.75 }, { x: 67, y: 96, r: 2,  d: 0.25 },
  { x: 2,  y: 25, r: 1.6, d: 0.45 }, { x: 78, y: 50, r: 2.5, d: 0.65 },
  { x: 42, y: 92, r: 1.5, d: 0.1 }, { x: 96, y: 75, r: 1.8, d: 0.85 },
  { x: 60, y: 91, r: 2,   d: 0.4 }, { x: 22, y: 15, r: 1.5, d: 0.7 },
];

export default function LoadingScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const screenRef = useRef<HTMLDivElement>(null);
  const petalRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const roseCenterRef = useRef<SVGCircleElement | null>(null);
  const roseGlowRef = useRef<SVGCircleElement | null>(null);
  const roseWrapRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Aurora orbs bloom into existence
    tl.from('.sl-orb', {
      scale: 0,
      opacity: 0,
      duration: duration(2),
      stagger: 0.25,
      ease: 'power3.out',
    }, 0);

    // 2. Stars sparkle in from random positions
    tl.from('.sl-star', {
      scale: 0,
      opacity: 0,
      duration: duration(0.5),
      stagger: { amount: 0.9, from: 'random' },
      ease: 'back.out(3)',
    }, 0.05);

    // 3. Rose petals bloom one by one with spring
    petalRefs.current.forEach((petal, i) => {
      if (!petal) return;
      tl.fromTo(petal,
        { attr: { ry: 0, rx: 0 }, opacity: 0 },
        { attr: { ry: 28, rx: 13 }, opacity: 1, duration: duration(0.55), ease: 'back.out(2.2)' },
        0.15 + i * 0.075
      );
    });

    // 4. Rose center pops in
    if (roseCenterRef.current) {
      tl.from(roseCenterRef.current, {
        attr: { r: 0 },
        opacity: 0,
        duration: duration(0.4),
        ease: 'back.out(3)',
      }, 0.6);
    }
    if (roseGlowRef.current) {
      tl.from(roseGlowRef.current, {
        attr: { r: 0 },
        opacity: 0,
        duration: duration(0.5),
        ease: 'power3.out',
      }, 0.55);
    }

    // 5. Letters slam in with elastic spring
    const letters = letterRefs.current.filter(Boolean);
    tl.from(letters, {
      y: 100,
      opacity: 0,
      scale: 0.3,
      rotationX: 90,
      duration: duration(0.8),
      stagger: 0.07,
      ease: 'elastic.out(1.1, 0.55)',
      transformOrigin: 'center bottom',
    }, 0.45);

    // 6. Subtitle sweeps in
    tl.from('.sl-subtitle', {
      y: 24,
      opacity: 0,
      duration: duration(0.7),
      ease: 'power3.out',
    }, 1.05);

    // 7. Progress arc draws itself
    tl.fromTo('.sl-arc', {
      strokeDashoffset: 283,
      opacity: 0,
    }, {
      strokeDashoffset: 0,
      opacity: 1,
      duration: duration(2.2),
      ease: 'power2.inOut',
    }, 0.1);

    // 8. Tagline chips fade in with stagger
    tl.from('.sl-tag', {
      y: 16,
      opacity: 0,
      scale: 0.9,
      duration: duration(0.5),
      stagger: 0.1,
      ease: 'back.out(2)',
    }, 1.3);

    // ── Continuous animations ──
    // Rose breathe
    gsap.to(roseWrapRef.current, {
      scale: 1.1,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.8,
    });

    // Letter glow pulse — shimmer through letters
    gsap.to(letters, {
      textShadow: '0 0 40px rgba(255,100,130,1), 0 0 80px rgba(175,82,222,0.8)',
      duration: 1.2,
      stagger: { amount: 1.5, from: 'start', repeat: -1, yoyo: true },
      ease: 'sine.inOut',
      delay: 0.9,
    });

    // Stars twinkle
    gsap.to('.sl-star', {
      opacity: 0.1,
      scale: 0.5,
      duration: 1,
      stagger: { amount: 3, from: 'random', repeat: -1, yoyo: true },
      ease: 'sine.inOut',
    });

    // Orbs drift slowly
    gsap.to('.sl-orb--rose', {
      x: 40, y: 30,
      duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
    gsap.to('.sl-orb--purple', {
      x: -30, y: -40,
      duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
    gsap.to('.sl-orb--blue', {
      x: 20, y: -25,
      duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });

  }, { scope: screenRef });

  useEffect(() => {
    const DISPLAY_MS = 2800;
    const EXIT_MS    = 600;

    const exitTimer = setTimeout(() => {
      const el = screenRef.current;
      const letters = letterRefs.current.filter(Boolean);

      // Exit: letters fly up, rose shrinks, screen fades
      gsap.to(letters, {
        y: -80, opacity: 0, stagger: 0.04,
        duration: duration(0.45), ease: 'power3.in',
      });
      gsap.to(roseWrapRef.current, {
        scale: 0, opacity: 0,
        duration: duration(0.45), ease: 'back.in(2)', delay: 0.05,
      });
      gsap.to('.sl-subtitle, .sl-tags, .sl-arc-wrap', {
        opacity: 0, duration: duration(0.3),
      });
      if (el) {
        gsap.to(el, {
          opacity: 0, duration: duration(0.5), ease: 'power2.in', delay: 0.2,
        });
      }
    }, DISPLAY_MS);

    // Guaranteed transition — never relies on GSAP completing
    const loginTimer = setTimeout(() => setScreen('login'), DISPLAY_MS + EXIT_MS);

    return () => { clearTimeout(exitTimer); clearTimeout(loginTimer); };
  }, [setScreen]);

  return (
    <div ref={screenRef} className="sl-screen" aria-label="Loading Recall">
      {/* Aurora blobs */}
      <div className="sl-orb sl-orb--rose" aria-hidden />
      <div className="sl-orb sl-orb--purple" aria-hidden />
      <div className="sl-orb sl-orb--blue" aria-hidden />
      <div className="sl-orb sl-orb--teal" aria-hidden />

      {/* Stars */}
      <svg className="sl-stars" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {STARS.map((s, i) => (
          <circle key={i} className="sl-star" cx={s.x} cy={s.y} r={s.r * 0.5} fill="white" opacity="0.9" />
        ))}
      </svg>

      {/* Progress ring */}
      <div className="sl-arc-wrap" aria-hidden>
        <svg className="sl-arc-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle
            className="sl-arc"
            cx="50" cy="50" r="45"
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset="283"
            transform="rotate(-90 50 50)"
          />
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF2D55" />
              <stop offset="50%" stopColor="#AF52DE" />
              <stop offset="100%" stopColor="#007AFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Rose bloom */}
      <div ref={roseWrapRef} className="sl-rose" aria-hidden>
        <svg viewBox="-60 -60 120 120" width="180" height="180">
          <defs>
            <radialGradient id="petalGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FF6B95" />
              <stop offset="60%" stopColor="#FF2D55" />
              <stop offset="100%" stopColor="#C0195C" />
            </radialGradient>
            <radialGradient id="petalGrad2" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#D97BFF" />
              <stop offset="60%" stopColor="#AF52DE" />
              <stop offset="100%" stopColor="#7B2ABF" />
            </radialGradient>
            <filter id="roseBlur">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          {/* Glow halo */}
          <circle ref={roseGlowRef} cx="0" cy="0" r="22"
            fill="none" stroke="#FF2D55" strokeWidth="12" opacity="0.15" filter="url(#roseBlur)" />
          {/* Petals */}
          {PETAL_ANGLES.map((angle, i) => (
            <ellipse
              key={i}
              ref={(el) => { petalRefs.current[i] = el; }}
              cx="0" cy="-26"
              rx="13" ry="28"
              fill={i % 2 === 0 ? 'url(#petalGrad)' : 'url(#petalGrad2)'}
              opacity="0.92"
              transform={`rotate(${angle})`}
              style={{ transformOrigin: '0px 0px' }}
            />
          ))}
          {/* Center */}
          <circle ref={roseCenterRef} cx="0" cy="0" r="11" fill="#FF2D55" />
          <circle cx="0" cy="0" r="7" fill="#FF6B95" />
          <circle cx="-2" cy="-2" r="3" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>

      {/* Title letters */}
      <div className="sl-title" aria-label="Recall">
        {LETTERS.map((l, i) => (
          <span key={i} ref={(el) => { letterRefs.current[i] = el; }} className="sl-letter">{l}</span>
        ))}
      </div>

      {/* Subtitle */}
      <p className="sl-subtitle">Memory · Medication · Moments</p>

      {/* Tag chips */}
      <div className="sl-tags" aria-hidden>
        {['Dementia Care', 'AI Companion', 'Family Connected'].map((t) => (
          <span key={t} className="sl-tag">{t}</span>
        ))}
      </div>
    </div>
  );
}

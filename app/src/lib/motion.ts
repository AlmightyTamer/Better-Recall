import gsap from 'gsap';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scale durations down to near-instant when user prefers reduced motion. */
export const duration = (full: number, reduced = 0.01) =>
  prefersReducedMotion() ? reduced : full;

export const EASE = {
  smooth: 'power2.inOut',
  enter: 'power3.out',
  exit: 'power2.in',
  breathe: 'sine.inOut',
  crossfade: 'power2.inOut',
  soft: 'expo.out',
} as const;

export function applyGsapDefaults() {
  gsap.defaults({ ease: EASE.smooth, overwrite: 'auto' });
  gsap.config({ force3D: true, nullTargetWarn: false });
}

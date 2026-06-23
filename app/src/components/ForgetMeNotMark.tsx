interface ForgetMeNotMarkProps {
  size?: number;
  className?: string;
}

/** Forget-me-not flower mark — Apple Liquid Glass ceramic edition */
export default function ForgetMeNotMark({ size = 32, className = '' }: ForgetMeNotMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`forget-me-not-mark ${className}`}
      aria-hidden
    >
      <defs>
        {/* Ceramic petal — iridescent white-to-sky-to-indigo */}
        <linearGradient id="fm-petal-body" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.98)" />
          <stop offset="28%"  stopColor="rgba(219,241,255,0.93)" />
          <stop offset="60%"  stopColor="rgba(147,206,250,0.87)" />
          <stop offset="100%" stopColor="rgba(79,140,235,0.74)" />
        </linearGradient>
        {/* Specular highlight spot on each petal */}
        <radialGradient id="fm-petal-shine" cx="42%" cy="18%" r="52%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.97)" />
          <stop offset="45%"  stopColor="rgba(255,255,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Iridescent edge tint — gives mother-of-pearl shimmer */}
        <linearGradient id="fm-petal-iris" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%"   stopColor="rgba(186,230,253,0.55)" />
          <stop offset="50%"  stopColor="rgba(216,180,254,0.35)" />
          <stop offset="100%" stopColor="rgba(186,230,253,0.55)" />
        </linearGradient>
        {/* Golden glass center */}
        <radialGradient id="fm-center-body" cx="38%" cy="28%" r="58%">
          <stop offset="0%"   stopColor="#FFFCF0" />
          <stop offset="38%"  stopColor="#FDE68A" />
          <stop offset="80%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        {/* Center glass specular */}
        <radialGradient id="fm-center-shine" cx="33%" cy="22%" r="42%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.92)" />
          <stop offset="60%"  stopColor="rgba(255,255,255,0.20)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Petal drop shadow */}
        <filter id="fm-petal-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3.5"
            floodColor="rgba(56,130,220,0.38)" floodOpacity="1" />
        </filter>
        {/* Center drop shadow */}
        <filter id="fm-center-shadow" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="3"
            floodColor="rgba(180,120,20,0.38)" floodOpacity="1" />
        </filter>
        {/* Outer glow bloom */}
        <filter id="fm-glow-bloom" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor="rgba(147,206,250,0.45)" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer ambient glow ring */}
      <circle cx="100" cy="100" r="94" fill="none"
        stroke="rgba(147,206,250,0.18)" strokeWidth="8" />

      {/* 5 ceramic glass petals */}
      {[0, 72, 144, 216, 288].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 100 100)`} filter="url(#fm-petal-shadow)">
          {/* Petal body — ceramic gradient */}
          <path
            d="M100 34 C114 52 120 72 100 93 C80 72 86 52 100 34Z"
            fill="url(#fm-petal-body)"
          />
          {/* Iridescent shimmer layer */}
          <path
            d="M100 34 C114 52 120 72 100 93 C80 72 86 52 100 34Z"
            fill="url(#fm-petal-iris)"
            opacity="0.6"
          />
          {/* Specular glass highlight */}
          <path
            d="M100 34 C114 52 120 72 100 93 C80 72 86 52 100 34Z"
            fill="url(#fm-petal-shine)"
          />
          {/* Glass rim — bright top edge */}
          <path
            d="M100 34 C114 52 120 72 100 93 C80 72 86 52 100 34Z"
            fill="none"
            stroke="rgba(255,255,255,0.78)"
            strokeWidth="1.8"
          />
        </g>
      ))}

      {/* Ceramic center disc */}
      <circle cx="100" cy="100" r="21" fill="url(#fm-center-body)" filter="url(#fm-center-shadow)" />
      {/* Center rim light */}
      <circle cx="100" cy="100" r="21" fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="2" />
      {/* Center glass glaze */}
      <circle cx="100" cy="100" r="21" fill="url(#fm-center-shine)" />
      {/* Center pupil */}
      <circle cx="100" cy="100" r="6" fill="rgba(55,30,8,0.82)" />
      {/* Pupil specular catchlight */}
      <circle cx="97.8" cy="97.8" r="2.2" fill="rgba(255,255,255,0.65)" />
    </svg>
  );
}

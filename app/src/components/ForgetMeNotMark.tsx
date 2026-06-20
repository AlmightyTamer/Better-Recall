interface ForgetMeNotMarkProps {
  size?: number;
  className?: string;
}

/** Forget-me-not flower mark — matches Clara logo */
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
        <linearGradient id="fm-mark-petal" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#1B5FD4" />
          <stop offset="55%" stopColor="#2E8FE8" />
          <stop offset="100%" stopColor="#5DD4FF" />
        </linearGradient>
        <radialGradient id="fm-mark-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="100%" stopColor="#F5B800" />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 100 100)`}>
          <path
            d="M100 38 C112 52 118 68 100 92 C82 68 88 52 100 38Z"
            fill="url(#fm-mark-petal)"
            transform="translate(0 8)"
          />
        </g>
      ))}
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
        <path
          key={deg}
          d="M100 78 L100 62"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${deg} 100 100)`}
          opacity="0.9"
        />
      ))}
      <circle cx="100" cy="100" r="18" fill="url(#fm-mark-center)" />
      <circle cx="100" cy="100" r="5" fill="#3D2810" />
    </svg>
  );
}

interface ForgetMeNotAnimatedProps {
  size?: number;
  thinking?: boolean;
  className?: string;
}

/** Forget-me-not with 5 petals — petals breathe when thinking */
export default function ForgetMeNotAnimated({
  size = 120,
  thinking = false,
  className = '',
}: ForgetMeNotAnimatedProps) {
  const uid = thinking ? 'think' : 'idle';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`fm-flower ${thinking ? 'fm-flower--thinking' : 'fm-flower--idle'} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`petal-${uid}`} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#1B5FD4" />
          <stop offset="55%" stopColor="#2E8FE8" />
          <stop offset="100%" stopColor="#5DD4FF" />
        </linearGradient>
        <radialGradient id={`center-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="70%" stopColor="#F5B800" />
          <stop offset="100%" stopColor="#E8A000" />
        </radialGradient>
      </defs>

      <g className="fm-flower__petals">
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <g key={deg} transform={`rotate(${deg} 100 100)`}>
            <g className={`fm-flower__petal fm-flower__petal--${i + 1}`}>
              <path
                d="M100 38 C112 52 118 68 100 92 C82 68 88 52 100 38Z"
                fill={`url(#petal-${uid})`}
                transform="translate(0 8)"
              />
            </g>
          </g>
        ))}
      </g>

      <g className="fm-flower__rays">
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
          <path
            key={deg}
            d="M100 78 L100 62"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${deg} 100 100)`}
            opacity="0.95"
          />
        ))}
      </g>

      <circle cx="100" cy="100" r="18" fill={`url(#center-${uid})`} className="fm-flower__core" />
      <circle cx="100" cy="100" r="5" fill="#3D2810" className="fm-flower__eye" />
    </svg>
  );
}

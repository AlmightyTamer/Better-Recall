import { forwardRef } from 'react';

interface LeafSpec {
  id: string;
  x: string;
  y: string;
  w: number;
  h: number;
  rot: number;
  z: number;
  sway: 'a' | 'b' | 'c' | 'd';
  delay: number;
  flip?: boolean;
  tint?: string;
}

const LEAVES: LeafSpec[] = [
  { id: 'l1', x: '-6%', y: '-2%', w: 260, h: 360, rot: -32, z: 2, sway: 'a', delay: 0,    flip: true },
  { id: 'l2', x: '48%', y: '-6%', w: 240, h: 330, rot: 22,  z: 3, sway: 'b', delay: 0.4 },
  { id: 'l3', x: '18%', y: '10%', w: 300, h: 400, rot: -10, z: 5, sway: 'c', delay: 0.2 },
  { id: 'l4', x: '58%', y: '14%', w: 250, h: 340, rot: 35,  z: 4, sway: 'd', delay: 0.7 },
  { id: 'l5', x: '-10%', y: '30%', w: 280, h: 380, rot: -48, z: 6, sway: 'b', delay: 1.1, flip: true },
  { id: 'l6', x: '42%', y: '34%', w: 320, h: 420, rot: 8,   z: 7, sway: 'a', delay: 0.5 },
  { id: 'l7', x: '64%', y: '38%', w: 260, h: 350, rot: 42,  z: 5, sway: 'c', delay: 0.9 },
  { id: 'l8', x: '8%',  y: '48%', w: 290, h: 390, rot: -22, z: 8, sway: 'd', delay: 0.3 },
  { id: 'l9', x: '50%', y: '52%', w: 270, h: 370, rot: 18,  z: 6, sway: 'b', delay: 1.4 },
  { id: 'l10', x: '72%', y: '58%', w: 240, h: 320, rot: 30, z: 4, sway: 'a', delay: 0.8 },
  { id: 'l11', x: '-4%', y: '62%', w: 250, h: 340, rot: -38, z: 3, sway: 'c', delay: 1.6, flip: true },
];

function CartoonLeaf({ w, h, tint = '#22C55E' }: { w: number; h: number; tint?: string }) {
  const dark = '#15803D';
  const mid = tint;
  const light = '#86EFAC';

  return (
    <svg width={w} height={h} viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 8 C78 10, 92 38, 88 72 C84 108, 62 128, 50 136 C38 128, 16 108, 12 72 C8 38, 22 10, 50 8Z"
        fill={mid} opacity="0.92"
      />
      <path
        d="M50 8 C78 10, 92 38, 88 72 C84 108, 62 128, 50 136 C38 128, 16 108, 12 72 C8 38, 22 10, 50 8Z"
        fill={light} opacity="0.35"
      />
      <path
        d="M50 8 C78 10, 92 38, 88 72 C84 108, 62 128, 50 136 C38 128, 16 108, 12 72 C8 38, 22 10, 50 8Z"
        fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M50 14 L48 136" stroke={dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M48 32 Q68 36 82 30" stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
      <path d="M47 52 Q72 58 86 48" stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/>
      <path d="M46 72 Q70 78 84 66" stroke={dark} strokeWidth="1.3" strokeLinecap="round" opacity="0.35"/>
      <path d="M52 32 Q32 38 18 32" stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
      <path d="M53 52 Q28 60 14 50" stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/>
      <path d="M54 72 Q30 80 16 68" stroke={dark} strokeWidth="1.3" strokeLinecap="round" opacity="0.35"/>
      {/* Dew beads */}
      <circle cx="72" cy="28" r="4.5" fill="white" opacity="0.85"/>
      <circle cx="70" cy="26" r="1.5" fill="white"/>
      <circle cx="28" cy="48" r="3.5" fill="white" opacity="0.8"/>
      <circle cx="80" cy="62" r="3" fill="white" opacity="0.75"/>
      <circle cx="22" cy="78" r="4" fill="white" opacity="0.8"/>
      <circle cx="58" cy="42" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="40" cy="90" r="2" fill="white" opacity="0.65"/>
    </svg>
  );
}

const DewyLeafScene = forwardRef<HTMLDivElement>(function DewyLeafScene(_, ref) {
  const stemSrc = `${import.meta.env.BASE_URL}dewy-leaf-stem.jpg`;

  return (
    <div ref={ref} className="dewy-scene">
      {/* Soft photo texture behind cartoon leaves */}
      <div className="dewy-scene-bg" style={{ backgroundImage: `url(${stemSrc})` }} />

      {/* Central stem */}
      <svg className="dewy-stem" viewBox="0 0 60 900" preserveAspectRatio="xMidYMid slice">
        <path
          d="M30 0 C28 120, 32 280, 30 420 C28 560, 32 720, 30 900"
          stroke="#166534" strokeWidth="14" strokeLinecap="round" fill="none"
        />
        <path
          d="M30 0 C28 120, 32 280, 30 420 C28 560, 32 720, 30 900"
          stroke="#22C55E" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5"
        />
        {/* Stem dew */}
        {[80, 200, 340, 480, 620, 760].map((cy, i) => (
          <g key={i}>
            <circle cx={30 + (i % 2 ? 6 : -6)} cy={cy} r={5 + (i % 3)} fill="white" opacity="0.85"/>
            <circle cx={30 + (i % 2 ? 5 : -5)} cy={cy - 2} r={1.8} fill="white"/>
          </g>
        ))}
      </svg>

      {/* Individual swaying leaves */}
      {LEAVES.map(leaf => (
        <div
          key={leaf.id}
          className={`dewy-leaf dewy-leaf--sway-${leaf.sway}`}
          style={{
            left: leaf.x,
            top: leaf.y,
            zIndex: leaf.z,
            animationDelay: `${leaf.delay}s`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ['--base-rot' as any]: `${leaf.rot}deg`,
          }}
        >
          <div className="dewy-leaf-inner" style={{ transform: leaf.flip ? 'scaleX(-1)' : undefined }}>
            <CartoonLeaf w={leaf.w} h={leaf.h} tint={leaf.tint} />
          </div>
        </div>
      ))}

      <div className="dewy-scene-vignette" aria-hidden />
    </div>
  );
});

export default DewyLeafScene;

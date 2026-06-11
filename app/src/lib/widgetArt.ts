/** Illustrated widget backgrounds — SVG art (not family photos) */

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

const WIDGET_ART = {
  clara: svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D6EBFA"/>
      <stop offset="100%" stop-color="#8ECDF5"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#4A90D9" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="180" r="120" fill="url(#glow)"/>
  <ellipse cx="200" cy="210" rx="70" ry="85" fill="#F5D0C5"/>
  <ellipse cx="200" cy="175" rx="58" ry="62" fill="#FAD4C8"/>
  <path d="M145 175c8-28 42-48 55-48s47 20 55 48" fill="#8B5E4A"/>
  <circle cx="178" cy="178" r="6" fill="#2D3748"/>
  <circle cx="222" cy="178" r="6" fill="#2D3748"/>
  <path d="M188 205q12 14 24 0" stroke="#C97B63" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M120 250c25-15 55-22 80-22s55 7 80 22" stroke="#4A90D9" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/>
  <path d="M95 270c30-8 60-12 105-12s75 4 105 12" stroke="#4A90D9" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.35"/>
  <circle cx="130" cy="300" r="18" fill="#4A90D9" opacity="0.25"/>
  <circle cx="200" cy="310" r="22" fill="#4A90D9" opacity="0.3"/>
  <circle cx="270" cy="300" r="18" fill="#4A90D9" opacity="0.25"/>
</svg>`),

  mind: svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8F4E8"/>
      <stop offset="100%" stop-color="#A8D5BA"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect x="80" y="90" width="110" height="110" rx="16" fill="#fff" stroke="#3D8B6E" stroke-width="4"/>
  <rect x="210" y="90" width="110" height="110" rx="16" fill="#FFD44D" stroke="#F5A623" stroke-width="4"/>
  <rect x="80" y="220" width="110" height="110" rx="16" fill="#8ECDF5" stroke="#4A90D9" stroke-width="4"/>
  <rect x="210" y="220" width="110" height="110" rx="16" fill="#fff" stroke="#3D8B6E" stroke-width="4"/>
  <text x="135" y="165" font-family="Georgia,serif" font-size="48" font-weight="700" fill="#3D8B6E">W</text>
  <text x="265" y="165" font-family="Georgia,serif" font-size="48" font-weight="700" fill="#B45309">?</text>
  <text x="135" y="295" font-family="Georgia,serif" font-size="48" font-weight="700" fill="#1A4A7A">9</text>
  <text x="265" y="295" font-family="Georgia,serif" font-size="48" font-weight="700" fill="#3D8B6E">4</text>
  <circle cx="200" cy="200" r="36" fill="#3D8B6E"/>
  <path d="M188 192c6-12 18-12 24 0M188 208c6 8 18 8 24 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`),

  sleep: svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="night" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1A3352"/>
      <stop offset="100%" stop-color="#2E4A6E"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#night)"/>
  <circle cx="300" cy="90" r="40" fill="#FFD44D" opacity="0.9"/>
  <circle cx="60" cy="70" r="3" fill="#fff" opacity="0.8"/>
  <circle cx="120" cy="50" r="2" fill="#fff" opacity="0.6"/>
  <circle cx="340" cy="160" r="2.5" fill="#fff" opacity="0.7"/>
  <circle cx="50" cy="200" r="2" fill="#fff" opacity="0.5"/>
  <path d="M200 120c-55 0-100 35-100 78 0 50 100 130 100 130s100-80 100-130c0-43-45-78-100-78z" fill="#6B8FD4" opacity="0.35"/>
  <rect x="95" y="230" width="210" height="90" rx="20" fill="#E8EEF5"/>
  <rect x="110" y="245" width="180" height="60" rx="12" fill="#fff"/>
  <ellipse cx="200" cy="275" rx="55" ry="18" fill="#D6EBFA"/>
  <path d="M155 320h90" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
</svg>`),

  meds: svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="tray" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0F7FF"/>
      <stop offset="100%" stop-color="#C5DCF5"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#tray)"/>
  <ellipse cx="200" cy="310" rx="150" ry="28" fill="#94A3B8" opacity="0.2"/>
  <rect x="70" y="140" width="90" height="150" rx="14" fill="#fff" stroke="#4A90D9" stroke-width="4"/>
  <rect x="85" y="115" width="60" height="35" rx="8" fill="#4A90D9"/>
  <circle cx="115" cy="210" r="22" fill="#FFD44D"/>
  <circle cx="115" cy="255" r="18" fill="#F5A623"/>
  <rect x="155" y="160" width="90" height="130" rx="14" fill="#fff" stroke="#3D8B6E" stroke-width="4"/>
  <rect x="170" y="135" width="60" height="35" rx="8" fill="#3D8B6E"/>
  <ellipse cx="200" cy="215" rx="28" ry="14" fill="#E53E3E"/>
  <ellipse cx="200" cy="255" rx="28" ry="14" fill="#fff" stroke="#CBD5E1" stroke-width="3"/>
  <rect x="240" y="150" width="90" height="140" rx="14" fill="#fff" stroke="#6B8FD4" stroke-width="4"/>
  <rect x="255" y="125" width="60" height="35" rx="8" fill="#6B8FD4"/>
  <circle cx="285" cy="220" r="20" fill="#4A90D9"/>
  <circle cx="285" cy="262" r="16" fill="#8ECDF5"/>
  <path d="M100 100h200" stroke="#4A90D9" stroke-width="3" stroke-dasharray="8 6" opacity="0.4"/>
</svg>`),

  today: svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="60%" stop-color="#FFE4A8"/>
      <stop offset="100%" stop-color="#FFD44D"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#sky)"/>
  <circle cx="310" cy="95" r="48" fill="#FFD44D" stroke="#F5A623" stroke-width="4"/>
  <rect x="85" y="110" width="230" height="220" rx="20" fill="#fff" stroke="#4A90D9" stroke-width="5"/>
  <rect x="85" y="110" width="230" height="52" rx="20" fill="#4A90D9"/>
  <rect x="85" y="148" width="230" height="14" fill="#4A90D9"/>
  <circle cx="130" cy="136" r="8" fill="#fff" opacity="0.5"/>
  <circle cx="200" cy="136" r="8" fill="#fff" opacity="0.5"/>
  <circle cx="270" cy="136" r="8" fill="#fff" opacity="0.5"/>
  <rect x="110" y="185" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="160" y="185" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="210" y="185" width="36" height="36" rx="8" fill="#4A90D9"/>
  <rect x="260" y="185" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="110" y="235" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="160" y="235" width="36" height="36" rx="8" fill="#FFD44D"/>
  <rect x="210" y="235" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="260" y="235" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="110" y="285" width="36" height="36" rx="8" fill="#D6EBFA"/>
  <rect x="160" y="285" width="36" height="36" rx="8" fill="#D6EBFA"/>
</svg>`),
} as const;

export type WidgetArtKey = keyof typeof WIDGET_ART;

export function widgetArtUrl(key: WidgetArtKey): string {
  return WIDGET_ART[key];
}

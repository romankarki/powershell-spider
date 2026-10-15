import React from 'react';
import { useSettingsStore } from '../state/settings-store';
import { getFlavor } from '../themes';

/**
 * Faint theme scenery over the terminal area: a spider web in the corner,
 * a bat-signal sweeping the sky, ocean waves with a Jolly Roger, or scattered
 * sparks. Pointer-events are off and opacity is low so text stays readable.
 */
export const AmbientLayer: React.FC = () => {
  const ambient = useSettingsStore((s) => getFlavor(s.theme).ambient);
  const enabled = useSettingsStore((s) => s.ambience);
  if (!enabled || !ambient) return null;

  return (
    <div className={`ambient ambient-${ambient}`} aria-hidden>
      {ambient === 'web' && <Web />}
      {ambient === 'batsignal' && <BatSignal />}
      {ambient === 'ocean' && <Ocean />}
      <style>{AMBIENT_CSS}</style>
    </div>
  );
};

/** Web anchored in the top-right corner: rings plus spokes, slightly sagging. */
const Web: React.FC = () => {
  const rings = [70, 130, 190, 250, 310, 370, 430];
  const spokes = Array.from({ length: 9 }, (_, i) => (90 + i * 11.25) * (Math.PI / 180));
  return (
    <svg className="ambient-web-svg" viewBox="0 0 460 460" preserveAspectRatio="xMaxYMin slice">
      <g transform="translate(460 0)" fill="none" stroke="currentColor" strokeWidth="1">
        {spokes.map((a, i) => (
          <line key={i} x1="0" y1="0" x2={Math.cos(a) * 520} y2={Math.sin(a) * 520} />
        ))}
        {rings.map((r) => (
          // Each ring is a chain of slightly sagging segments between spokes
          <path
            key={r}
            d={spokes.slice(0, -1).map((a, i) => {
              const b = spokes[i + 1];
              const x1 = Math.cos(a) * r, y1 = Math.sin(a) * r;
              const x2 = Math.cos(b) * r, y2 = Math.sin(b) * r;
              const mid = (a + b) / 2;
              const sag = r * 0.96;
              return `${i === 0 ? `M${x1} ${y1}` : ''} Q${Math.cos(mid) * sag} ${Math.sin(mid) * sag} ${x2} ${y2}`;
            }).join(' ')}
          />
        ))}
      </g>
    </svg>
  );
};

/** Spotlight cone from the top-right with the bat emblem, slowly pulsing. */
const BatSignal: React.FC = () => (
  <svg className="ambient-bat-svg" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
    <ellipse cx="100" cy="60" rx="92" ry="52" fill="currentColor" opacity="0.55" />
    <path
      fill="var(--bg-primary)"
      d="M100 28c-4 0-7 3-8 8l-5-5c-5-2-11-1-15 2l-9-7c-4 4-6 11-5 17l-11-2c0 7 4 13 11 16l12-3c7 7 17 12 30 12s23-5 30-12l12 3c7-3 11-9 11-16l-11 2c1-6-1-13-5-17l-9 7c-4-3-10-4-15-2l-5 5c-1-5-4-8-8-8z"
    />
  </svg>
);

/** Two drifting wave bands along the bottom, a warm sun, and a Jolly Roger. */
const Ocean: React.FC = () => {
  const wave = (y: number) => `M0 ${y} Q100 ${y - 22} 200 ${y} T400 ${y} T600 ${y} T800 ${y} T1000 ${y} T1200 ${y} V140 H0 Z`;
  return (
    <>
      <div className="ambient-sun" />
      <span className="ambient-roger">☠</span>
      <svg className="ambient-waves" viewBox="0 0 1200 140" preserveAspectRatio="none">
        <path className="ambient-wave ambient-wave-back" d={wave(70)} />
        <path className="ambient-wave ambient-wave-front" d={wave(95)} />
      </svg>
    </>
  );
};

const AMBIENT_CSS = `
.ambient {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: hidden;
  pointer-events: none;
  mix-blend-mode: screen;
}
.ambient-web-svg {
  position: absolute;
  top: 0;
  right: 0;
  width: min(46vw, 520px);
  height: min(46vw, 520px);
  color: var(--text-primary);
  opacity: 0.13;
  animation: ambient-fade-in 1.2s ease-out;
}
.ambient-bat-svg {
  position: absolute;
  top: 2%;
  right: 2%;
  width: min(24vw, 300px);
  color: var(--green);
  opacity: 0.14;
  filter: blur(0.6px);
  animation: ambient-bat-pulse 6s ease-in-out infinite;
}
.ambient-batsignal::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -10%;
  width: 55%;
  height: 70%;
  background: radial-gradient(ellipse at 80% 15%, rgba(var(--accent-rgb), 0.16), transparent 60%);
}
.ambient-sun {
  position: absolute;
  top: -120px;
  left: -80px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--accent-rgb), 0.22), transparent 62%);
}
.ambient-roger {
  position: absolute;
  right: 28px;
  bottom: 80px;
  font-size: 150px;
  line-height: 1;
  color: var(--text-primary);
  opacity: 0.06;
  animation: ambient-bob 7s ease-in-out infinite;
}
.ambient-waves {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 200%;
  height: 120px;
}
.ambient-wave {
  fill: rgb(var(--secondary-rgb));
}
.ambient-wave-back {
  opacity: 0.07;
  animation: ambient-drift 26s linear infinite;
}
.ambient-wave-front {
  opacity: 0.1;
  animation: ambient-drift 17s linear infinite reverse;
}
.ambient-spark {
  background-image:
    radial-gradient(rgba(var(--accent-rgb), 0.55) 1px, transparent 1.6px),
    radial-gradient(rgba(var(--secondary-rgb), 0.5) 1px, transparent 1.6px),
    radial-gradient(rgba(var(--accent-rgb), 0.35) 1.4px, transparent 2px);
  background-size: 190px 170px, 230px 210px, 320px 290px;
  background-position: 20px 40px, 110px 90px, 60px 160px;
  opacity: 0.35;
  animation: ambient-twinkle 5s ease-in-out infinite;
}
@keyframes ambient-fade-in { from { opacity: 0; } }
@keyframes ambient-bat-pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.2; } }
@keyframes ambient-bob { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
@keyframes ambient-drift { to { transform: translateX(-50%); } }
@keyframes ambient-twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.45; } }
`;

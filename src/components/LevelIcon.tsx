import { LEVEL_INFO, type Level } from '../engine/mastery';

const FILL: Record<Level, number> = { new: 0, learning: 0.25, reviewing: 0.5, provisional: 0.75, mastered: 1 };

/** Pie-shaped mastery symbol: the fill grows with mastery, so levels are distinguishable without colour. */
export function LevelIcon({ level, size = 14 }: { level: Level; size?: number }) {
  const f = FILL[level];
  const r = 6;
  const a = f * 2 * Math.PI;
  const x = 7 + r * Math.sin(a);
  const y = 7 - r * Math.cos(a);
  const color = LEVEL_INFO[level].color;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="inline-block shrink-0 align-[-2px]">
      <circle cx="7" cy="7" r={r} fill="none" stroke={color} strokeWidth="1.6" />
      {f === 1 ? <circle cx="7" cy="7" r={r} fill={color} /> : f > 0 && <path d={`M7 7V1A6 6 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`} fill={color} />}
    </svg>
  );
}

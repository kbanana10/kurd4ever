/**
 * SunMark — the signature mark of Kurdish Quest.
 *
 * A sun with exactly 21 rays, as on the Kurdish flag (Roja Kurdistanê).
 * Used sparingly: a quiet watermark on the home hero and a small bullet
 * beside the daily proverb. It inherits `currentColor`.
 */
import React from 'react';

export function SunMark({ className }: { className?: string }) {
  const rays = Array.from({ length: 21 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 21 - Math.PI / 2;
    return {
      x1: 50 + Math.cos(a) * 26,
      y1: 50 + Math.sin(a) * 26,
      x2: 50 + Math.cos(a) * 46,
      y2: 50 + Math.sin(a) * 46,
    };
  });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none">
      <circle cx="50" cy="50" r="17" fill="currentColor" />
      {rays.map((r, i) => (
        <line
          key={i}
          x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

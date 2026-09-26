/**
 * ScoreRing.tsx — deterministic 0..100 score ring for the writing lesson.
 *
 * A pure SVG ring (stroke-dasharray on a circle) that animates once to the
 * learner's score. It carries the score as text plus a small aria-label so
 * screen readers get the number without reading the whole ring.
 *
 * Design-system aligned: the ring colour comes from the score band —
 * emerald (≥90), amber (75–89), slate/violet (60–74), red (<60) — using the
 * same arbitrary-value palette the Warm Heritage remap preserves (no indigo/
 * purple named utilities that the remap recolours).
 */
import React, { useEffect, useState } from 'react';
import { scoreBand, type ScoreBand } from '../lib/pathValidation';
import { cn } from '../utils/cn';

const R = 42;               // ring radius (viewBox 100)
const CIRC = 2 * Math.PI * R;

const BAND_COLOUR = {
  excellent: '#10B981',
  good: '#F59E0B',
  practice: '#7C3AED',
  retry: '#EF4444',
} satisfies Record<ScoreBand, string>;

interface ScoreRingProps {
  /** Deterministic 0..100 score to show. */
  score: number;
  /** Accessible label prefix, e.g. "Score" / "نقاط". */
  label?: string;
  /** Extra classes on the wrapper. */
  className?: string;
}

export default function ScoreRing({ score, label, className }: ScoreRingProps) {
  const [shown, setShown] = useState(0);
  const clamped = Math.max(0, Math.min(100, score));
  const band = scoreBand(clamped);

  useEffect(() => {
    // Animate from 0 → clamped once, on the next frame (so the ring visibly
    // fills). No per-frame React state beyond this single rAF set.
    let raf = 0;
    const start = performance.now();
    const DURATION = 700;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setShown(Math.round(clamped * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="img"
      aria-label={`${label ?? 'Score'}: ${clamped}`}
    >
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgba(148,163,184,0.20)"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={BAND_COLOUR[band]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 80ms linear' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums"
        style={{ color: BAND_COLOUR[band] }}
        dir="ltr"
      >
        {clamped}
      </span>
    </div>
  );
}

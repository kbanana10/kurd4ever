/**
 * LetterDemo.tsx — "Watch it written" stage of the Interactive Letter Writing
 * Lesson. Reuses the existing StrokeGuide overlay (the animated stroke-order
 * demo from the /writing trace page) so the Learn → Watch flow teaches the
 * exact same construction the guide validates — one component, no drift.
 *
 * StrokeGuide auto-plays once on mount and again on every `replayToken`
 * change; LetterDemo owns the replay + continue controls around it.
 */
import React, { useState } from 'react';
import { Eye, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from './ui';
import StrokeGuide from './StrokeGuide';
import { TRACE_CANVAS } from '../lib/traceLetters';
import { getLetterReadiness } from '../data/letterStrokes';
import { cn } from '../utils/cn';

interface LetterDemoProps {
  /** Single uppercase glyph to demonstrate. */
  glyph: string;
  /** Labels in the active language, supplied by the page shell. */
  labels: {
    watch: string;
    replay: string;
    continue: string;
    notice: string;
  };
  /** Called once the learner continues past the demo. */
  onContinue: () => void;
}

export default function LetterDemo({ glyph, labels, onContinue }: LetterDemoProps) {
  const [replayToken, setReplayToken] = useState(0);
  // Missing/undrawn data degrades gracefully: still show the faint glyph, but
  // the demo overlay has no plan, and the learner is told it is unavailable.
  const readiness = getLetterReadiness(glyph);
  const missing = readiness === 'draft';

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      <div
        className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-line-soft shadow-flat touch-none select-none"
        style={{ aspectRatio: '1 / 1' }}
      >
        <svg
          viewBox={`0 0 ${TRACE_CANVAS} ${TRACE_CANVAS}`}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <text
            x={TRACE_CANVAS / 2}
            y={TRACE_CANVAS / 2}
            fontFamily="Noto Sans, system-ui, sans-serif"
            fontWeight={900}
            fontSize={TRACE_CANVAS * 0.7}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(100,116,139,0.22)"
          >
            {glyph}
          </text>
        </svg>
        {!missing && <StrokeGuide char={glyph} replayToken={replayToken} />}
      </div>

      {missing && (
        <p className="text-[11px] font-semibold text-muted text-center leading-relaxed">
          {labels.notice}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => setReplayToken((t) => t + 1)}
          leadingIcon={<RotateCcw className="w-4 h-4" />}
          className="text-xs h-12"
        >
          {labels.replay}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onContinue}
          trailingIcon={<ArrowRight className="w-4 h-4 rtl:-scale-x-100" />}
          className="text-xs h-12"
        >
          {labels.continue}
        </Button>
      </div>

      <span className="sr-only flex items-center gap-1 text-muted" aria-hidden="true">
        <Eye className="w-3.5 h-3.5" />
        {labels.watch}
      </span>
    </div>
  );
}

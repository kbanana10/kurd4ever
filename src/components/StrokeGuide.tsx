/**
 * StrokeGuide.tsx — animated "watch how to write" overlay for the tracing page.
 *
 * Renders INSIDE TracingCanvas (between the faint guide and the learner's
 * strokes) as a non-interactive canvas. It replays the hand-authored stroke
 * plan for a glyph (`src/data/strokeOrder.ts`), one stroke at a time:
 *   - the current stroke draws in a strong gold accent with a dot at the pen
 *     tip, pointing along `direction`;
 *   - strokes already drawn stay as a dimmed gold trace;
 *   - strokes not yet drawn are invisible, so the learner learns order.
 *
 * BEHAVIOUR (`play`): auto-plays once on mount, then again every time the
 * parent's `replayToken` changes. Duration is fixed (PROPS: 2s) and split
 * evenly across the plan's strokes.
 *
 * NON-BLOCKING (chosen + documented): the canvas is `pointer-events-none`, so
 * touches pass straight through to the drawing canvas beneath it — a learner
 * can begin tracing at any time, and their ink always paints ABOVE the
 * animation. Once a play finishes, `onDone` is reported so the parent can note
 * the demo completed; the overlay does not linger.
 */
import React, { useEffect, useRef } from 'react';
import {
  TRACE_CANVAS,
  SINGLE_BOX,
  buildGlyphMask,
  type TraceBox,
} from '../lib/traceLetters';
import { STROKE_PLANS, parseStrokePath } from '../data/strokeOrder';

const SIZE = TRACE_CANVAS;

/** Animation length for a full play-through (subtle: 2 seconds). */
const PLAY_DURATION_MS = 2000;

interface StrokeGuideProps {
  /** Single uppercase glyph (matches a key in STROKE_PLANS). */
  char: string;
  /** Parent increments this to replay the animation on demand. */
  replayToken: number;
  /** Called (once) when an animation play finishes. */
  onDone?: () => void;
  /** Guide box; defaults to the single-letter box used by the tracing page. */
  guideBox?: TraceBox;
}

export default function StrokeGuide({
  char,
  replayToken,
  onDone,
  guideBox = SINGLE_BOX,
}: StrokeGuideProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const plan = STROKE_PLANS[char];
    if (!plan) return; // no authored plan → nothing to show
    const strokesMeta = plan.strokes;

    // Resolve the glyph's pixel bounding box once, from the SAME mask the
    // authoring used (buildGlyphMask), so normalised stroke data maps exactly
    // onto the on-screen guide — including taller diacritic boxes.
    const mask = buildGlyphMask(char, guideBox);
    let minRow = SIZE, maxRow = -1, minCol = SIZE, maxCol = -1;
    for (let i = 0; i < mask.length; i += 1) {
      if (mask[i] === 1) {
        const r = Math.floor(i / SIZE);
        const c = i % SIZE;
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
    if (maxRow < minRow) return;
    const boxW = maxCol - minCol;
    const boxH = maxRow - minRow;
    const toPx = (p: { x: number; y: number }) => ({
      x: minCol + p.x * boxW,
      y: minRow + p.y * boxH,
    });
    // Precompute pixel points per stroke.
    const strokesPx = strokesMeta.map((s) => parseStrokePath(s.path).map(toPx));

    let raf = 0;
    // `start` is set from the FIRST rAF timestamp, not performance.now(): the
    // rAF callback receives the vsync time of the frame it runs on, which can
    // be a few ms EARLIER than a performance.now() captured at effect time
    // (negative elapsed → activeIdx −1 → nothing draws, and replays silently
    // skip). Anchoring to the frame's own clock keeps progress in [0,1].
    let start = 0;

    const drawFrame = (now: number) => {
      if (start === 0) start = now;
      const elapsed = now - start;
      const total = PLAY_DURATION_MS;
      const progress = Math.min(1, elapsed / total);
      const pos = progress * strokesPx.length; // continuous stroke cursor
      const activeIdx = Math.min(strokesPx.length - 1, Math.floor(pos));
      const strokeFrac = pos - Math.floor(pos); // progress within active stroke

      ctx.clearRect(0, 0, SIZE, SIZE);

      for (let s = 0; s < strokesPx.length; s += 1) {
        const px = strokesPx[s];
        const isPast = s < activeIdx;
        const isActive = s === activeIdx;
        if (!isPast && !isActive) continue; // future strokes stay hidden

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = SIZE * 0.028;
        ctx.beginPath();
        if (isPast) {
          // finished stroke: dimmed, complete
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.30)';
          ctx.moveTo(px[0].x, px[0].y);
          for (let k = 1; k < px.length; k += 1) ctx.lineTo(px[k].x, px[k].y);
        } else {
          // active stroke: strong accent, revealed up to strokeFrac
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.92)';
          const target = 1 + (px.length - 1) * strokeFrac;
          const last = Math.floor(target);
          ctx.moveTo(px[0].x, px[0].y);
          for (let k = 1; k <= last && k < px.length; k += 1) ctx.lineTo(px[k].x, px[k].y);
          if (last < px.length - 1) {
            const t = target - last;
            const a = px[last];
            const b = px[last + 1];
            ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
          } else if (strokeFrac < 1) {
            const a = px[px.length - 2];
            const b = px[px.length - 1];
            ctx.lineTo(a.x + (b.x - a.x) * strokeFrac, a.y + (b.y - a.y) * strokeFrac);
          }
        }
        ctx.stroke();
      }

      // Pen-tip dot on the current stroke's current end of travel.
      if (progress < 1) {
        const px = strokesPx[activeIdx];
        const seg = px.length <= 1 ? 0 : (px.length - 1) * strokeFrac;
        const lo = Math.floor(seg);
        const t = seg - lo;
        const a = px[Math.min(lo, px.length - 1)];
        const b = px[Math.min(lo + 1, px.length - 1)];
        const tip = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, SIZE * 0.022, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < 1) {
        raf = requestAnimationFrame(drawFrame);
      } else {
        // Dim the finished guide briefly, then hand back to the faint guide.
        ctx.lineWidth = SIZE * 0.028;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        for (const px of strokesPx) {
          if (!px.length) continue;
          ctx.beginPath();
          ctx.moveTo(px[0].x, px[0].y);
          for (let k = 1; k < px.length; k += 1) ctx.lineTo(px[k].x, px[k].y);
          ctx.stroke();
        }
        window.setTimeout(() => {
          ctx.clearRect(0, 0, SIZE, SIZE);
          onDoneRef.current?.();
        }, 450);
      }
    };

    // Ensure the faint glyph guide beneath also draws here so the overlay is
    // legible when it fades in (the parent's guide canvas is separate, but on
    // mobile the guide may be mid-paint; drawing nothing is fine — the overlay's
    // gold trace is self-explanatory). We intentionally do NOT redraw the letter
    // so there is no risk of diverging from the mask.
    ctx.clearRect(0, 0, SIZE, SIZE);
    start = 0; // first rAF frame anchors the clock
    raf = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [char, guideBox, replayToken]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

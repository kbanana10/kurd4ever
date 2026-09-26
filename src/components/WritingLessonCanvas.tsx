/**
 * WritingLessonCanvas.tsx — the drawing surface for the Interactive Letter
 * Writing Lesson, with two modes sharing one pointer engine:
 *
 *   • TRACE mode — the authored stroke plan is drawn as a dashed "dotted"
 *     guide (completed strokes gold, the CURRENT stroke dashed slate with a
 *     start dot), and the learner traces one stroke at a time. Each commit
 *     fires onStrokeComplete(ink, authored) so the page can evaluate
 *     start/end/direction/shape WITHOUT any per-move React state.
 *   • FREE mode — the guide is removed (only a faint glyph shows as the
 *     reference) and the learner writes independently; strokes are recorded
 *     for the deterministic coverage score.
 *
 * PERFORMANCE (A71-class Android, requirement): every pointermove writes
 * straight to the 2D canvas via refs — there is NO React state update on
 * pointer movement, no component re-render, and no analytics of pointer data.
 * `touch-action: none` + `overflow-hidden` stop scroll/overscroll on the
 * surface only. Undo snapshots are bounded by stroke count (a learner tracing
 * a ≤6-stroke letter can never grow memory unboundedly).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  SINGLE_BOX,
  TRACE_CANVAS,
  drawGlyphInBox,
  buildLetterMask,
} from '../lib/traceLetters';
import { glyphBBoxFromMask, type TracePoint } from '../lib/pathValidation';
import { getLetterStrokes, letterStrokesToPx } from '../data/letterStrokes';

const SIZE = TRACE_CANVAS;

export interface WritingLessonCanvasHandle {
  /** Clear every stroke and the feedback layer. */
  clear: () => void;
  /** Remove the most recent stroke (trace retry / free-mode undo). */
  undo: () => void;
  /** The strokes-only layer, for the parent to composite into a mask. */
  canvas: () => HTMLCanvasElement | null;
  /** Learner strokes as polylines (analysis px), in draw order. */
  strokePaths: () => TracePoint[][];
  /** Paint red on the given polylines (gentle off-path feedback). */
  showDeviation: (paths: TracePoint[][]) => void;
  /** Clear the feedback layer without erasing ink. */
  clearFeedback: () => void;
}

interface WritingLessonCanvasProps {
  /** Single uppercase glyph (matches LETTER_STROKES). */
  char: string;
  /** 'trace' shows the dashed authored guide; 'free' shows only a faint glyph. */
  mode: 'trace' | 'free';
  /** 0-based authored stroke to highlight as "current" in trace mode. */
  activeStrokeIndex?: number;
  /** Fired once when the pointer lifts, with the ink + the authored stroke (px). */
  onStrokeComplete?: (ink: TracePoint[], authored: TracePoint[]) => void;
}

const INK = 'rgba(51, 65, 85, 0.62)';
const GOLD = 'rgba(245, 158, 11, 0.92)';
const GOLD_DIM = 'rgba(245, 158, 11, 0.30)';
const DASH = { on: 7, off: 6 } as const;

const WritingLessonCanvas = React.forwardRef<WritingLessonCanvasHandle, WritingLessonCanvasProps>(
  function WritingLessonCanvas({ char, mode, activeStrokeIndex = 0, onStrokeComplete }, ref) {
    const guideRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<HTMLCanvasElement>(null);
    const missRef = useRef<HTMLCanvasElement>(null);

    const drawingRef = useRef(false);
    const currentPathRef = useRef<TracePoint[] | null>(null);
    const pathsRef = useRef<TracePoint[][]>([]);
    const snapshotsRef = useRef<HTMLCanvasElement[]>([]);

    const onStrokeCompleteRef = useRef(onStrokeComplete);
    onStrokeCompleteRef.current = onStrokeComplete;

    // Authored plan → pixel-space strokes (the SAME frame StrokeGuide uses so
    // the demo and the dotted guide can never drift). Cost is once per glyph.
    // SAFETY: letterStrokesToPx returns a TracePoint[][] for any plan; the
    // empty array is this component's documented "no guide" fallback.
    const authored = useMemo<TracePoint[][]>(() => {
      const plan = getLetterStrokes(char);
      if (!plan) return [];
      const mask = buildLetterMask(char);
      const bbox = glyphBBoxFromMask(mask, SIZE);
      if (!bbox) return [];
      return letterStrokesToPx(plan, bbox);
    }, [char]);

    const authoredRef = useRef(authored);
    authoredRef.current = authored;

    // Only interpret "the letter is ready" for trace mode gating; the page
    // already falls back, but a draft glyph has an empty guide here too.
    const activeIndex = Math.min(activeStrokeIndex, Math.max(0, authored.length - 1));

    React.useImperativeHandle(ref, (): WritingLessonCanvasHandle => ({
      clear: () => {
        const ctx = strokesRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
        snapshotsRef.current = [];
        pathsRef.current = [];
        currentPathRef.current = null;
        missRef.current?.getContext('2d')?.clearRect(0, 0, SIZE, SIZE);
      },
      undo: () => {
        const canvas = strokesRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const snapshot = snapshotsRef.current.pop();
        pathsRef.current.pop();
        ctx.clearRect(0, 0, SIZE, SIZE);
        if (snapshot) ctx.drawImage(snapshot, 0, 0);
      },
      canvas: () => strokesRef.current,
      strokePaths: () => pathsRef.current,
      showDeviation: (paths: TracePoint[][]) => {
        const layer = missRef.current;
        const ctx = layer?.getContext('2d');
        if (!layer || !ctx) return;
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.70)';
        ctx.lineWidth = SIZE * 0.045;
        for (const path of paths) {
          if (path.length === 0) continue;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let k = 1; k < path.length; k += 1) ctx.lineTo(path[k].x, path[k].y);
          ctx.stroke();
          if (path.length === 1) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.70)';
            ctx.beginPath();
            ctx.arc(path[0].x, path[0].y, SIZE * 0.02, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      clearFeedback: () => {
        missRef.current?.getContext('2d')?.clearRect(0, 0, SIZE, SIZE);
      },
    }));

    // Paint the guide layer: dashed authored strokes in TRACE mode, faint glyph
    // in FREE mode. Re-runs only when the active stroke advances or mode/char
    // changes — never on pointer movement.
    useEffect(() => {
      const canvas = guideRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);

      if (mode === 'free') {
        drawGlyphInBox(ctx, char, SINGLE_BOX, 'rgba(100, 116, 139, 0.24)');
        return;
      }

      const strokes = authoredRef.current;
      if (strokes.length === 0) {
        drawGlyphInBox(ctx, char, SINGLE_BOX, 'rgba(100, 116, 139, 0.18)');
        return;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = SIZE * 0.02;

      strokes.forEach((stroke, i) => {
        if (stroke.length < 2) return;
        const isPast = i < activeIndex;
        const isActive = i === activeIndex;
        if (!isPast && !isActive) return; // future strokes stay hidden

        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let k = 1; k < stroke.length; k += 1) ctx.lineTo(stroke[k].x, stroke[k].y);

        if (isPast) {
          ctx.setLineDash([]);
          ctx.strokeStyle = GOLD_DIM;
        } else {
          ctx.setLineDash([DASH.on, DASH.off]);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.90)';
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Start dot (green) + end cap (amber) on the ACTIVE stroke so the learner
      // knows exactly where to begin and where the pen should stop.
      const active = strokes[activeIndex];
      if (active && active.length >= 2) {
        const a = active[0];
        const b = active[active.length - 1];
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(a.x, a.y, SIZE * 0.022, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, SIZE * 0.014, 0, Math.PI * 2);
        ctx.fill();
      }
    }, [char, mode, activeIndex]);

    const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): TracePoint => {
      const canvas = strokesRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * SIZE,
        y: ((e.clientY - rect.top) / rect.height) * SIZE,
      };
    };

    const snapshotCurrent = () => {
      const canvas = strokesRef.current;
      if (!canvas) return;
      const copy = document.createElement('canvas');
      copy.width = SIZE;
      copy.height = SIZE;
      const copyCtx = copy.getContext('2d');
      if (copyCtx) copyCtx.drawImage(canvas, 0, 0);
      snapshotsRef.current.push(copy);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      const ctx = strokesRef.current?.getContext('2d');
      if (!ctx) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);

      snapshotCurrent();
      drawingRef.current = true;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = SIZE * 0.042;

      const p = toPoint(e);
      currentPathRef.current = [{ x: p.x, y: p.y }];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y + 0.01);
      ctx.stroke();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const ctx = strokesRef.current?.getContext('2d');
      if (!ctx) return;
      const p = toPoint(e);
      currentPathRef.current?.push({ x: p.x, y: p.y });
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };

    const endStroke = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const path = currentPathRef.current;
      currentPathRef.current = null;
      if (!path || path.length === 0) return;
      pathsRef.current.push(path);

      // Trace mode: hand the committed ink to the parent with its authored
      // target so it can evaluate the stroke and advance/retry. Free mode
      // ignores the callback (the parent reads strokePaths() on Check).
      if (mode === 'trace' && onStrokeCompleteRef.current) {
        const authoredStrokes = authoredRef.current;
        const activeAuthored = authoredStrokes[activeIndex] ?? [];
        onStrokeCompleteRef.current(path, activeAuthored);
      }
    };

    return (
      <div
        className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-line-soft shadow-flat touch-none select-none"
        style={{ aspectRatio: '1 / 1' }}
      >
        <canvas
          ref={guideRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />
        <canvas
          ref={strokesRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
        <canvas
          ref={missRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        />
      </div>
    );
  },
);

export default WritingLessonCanvas;

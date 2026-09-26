import React, { useEffect, useRef } from 'react';
import {
  SINGLE_BOX,
  TRACE_CANVAS,
  drawGlyphInBox,
  type TraceBox,
} from '../lib/traceLetters';
import type { TracePoint } from '../lib/pathValidation';

/**
 * TracingCanvas.tsx — the actual drawing surface for the Writing feature.
 *
 * It stacks up to three same-sized canvases inside one square wrapper:
 *   • the guide canvas (behind) shows the faded target (~30% opacity)
 *   • the draw canvas (in front) captures strokes — in-progress ink in a light
 *     slate so the learner sees exactly what they are drawing
 *   • the miss layer (optional, above the draw canvas and non-interactive)
 *     paints the glyph pixels the learner still hasn't covered in red after a
 *     failed check, so they can see exactly where to continue
 *
 * Input works identically for mouse, touch and pen via Pointer Events. The
 * surface is fixed-size in device-independent pixels (TRACE_CANVAS) and scaled
 * with CSS; the guide uses the SAME font/layout as the offscreen mask in
 * traceLetters.ts, so the evaluation samples exactly what the learner sees.
 */

const SIZE = TRACE_CANVAS;

interface Point {
  x: number;
  y: number;
}

export interface TracingCanvasHandle {
  /** Clear every stroke (and the miss highlight). */
  clear: () => void;
  /** Remove the most recent stroke. */
  undo: () => void;
  /** The strokes-only layer, for the parent to read back. */
  canvas: () => HTMLCanvasElement | null;
  /**
   * The learner's finished strokes as polylines in analysis-pixel space, in
   * draw order — for the path-based validator (single-letter tracing).
   */
  strokePaths: () => TracePoint[][];
  /** Paint a miss-mask: 0 = skip · 1 = covered · 2 = missed (red). */
  showMissHighlight: (miss: Uint8ClampedArray) => void;
  /** Paint red on the given polyline(s) — deviation/missing-stroke feedback. */
  showRedPaths: (paths: TracePoint[][]) => void;
  /** Clear the miss highlight without touching strokes. */
  clearMissHighlight: () => void;
}

interface TracingCanvasProps {
  /** The glyphs to show faintly in the guide layer (single-letter mode). */
  char: string;
  /** Optional guide box; single-letter glyphs draw inside their own box. */
  guideBox?: TraceBox;
  /** When provided, fully replaces the default glyph draw — lets word tracing
      render every letter of the word plus per-letter boundary boxes. */
  renderGuide?: (ctx: CanvasRenderingContext2D) => void;
  /**
   * Optional extra layer drawn between the guide and the learner's strokes
   * (C10: the animated stroke-order demo). Non-interactive by construction:
   * the parent is responsible for making its content `pointer-events-none`.
   */
  guideOverlay?: React.ReactNode;
}

const TracingCanvas = React.forwardRef<TracingCanvasHandle, TracingCanvasProps>(
  function TracingCanvas({ char, guideBox = SINGLE_BOX, renderGuide, guideOverlay }, ref) {
    const guideRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<HTMLCanvasElement>(null);
    const missRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    // Stroke polylines (analysis-px) for the path-based validator, plus the
    // in-progress stroke. One undo-snapshot per finished stroke below.
    const pathsRef = useRef<TracePoint[][]>([]);
    const currentPathRef = useRef<TracePoint[] | null>(null);
    // One undo-snapshot per finished stroke (offscreen copies of the strokes
    // canvas), pushed before each stroke begins so "undo" restores the prior
    // exact frame.
    const snapshotsRef = useRef<HTMLCanvasElement[]>([]);

    React.useImperativeHandle(ref, (): TracingCanvasHandle => ({
      clear: () => {
        const ctx = strokesRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
        snapshotsRef.current = [];
        pathsRef.current = [];
        currentPathRef.current = null;
        if (missRef.current) {
          missRef.current.getContext('2d')?.clearRect(0, 0, SIZE, SIZE);
        }
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
      showMissHighlight: (miss: Uint8ClampedArray) => {
        const layer = missRef.current;
        const ctx = layer?.getContext('2d');
        if (!layer || !ctx) return;
        ctx.clearRect(0, 0, SIZE, SIZE);
        const img = ctx.createImageData(SIZE, SIZE);
        const px = img.data;
        for (let i = 0; i < miss.length; i += 1) {
          if (miss[i] !== 2) continue; // 2 === missed target pixel
          const a = i * 4;
          px[a] = 239;
          px[a + 1] = 68;
          px[a + 2] = 68;
          px[a + 3] = 170;
        }
        ctx.putImageData(img, 0, 0);
      },
      showRedPaths: (paths: TracePoint[][]) => {
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
          // Single-point paths (deviating taps) are drawn as a red dot.
          if (path.length === 1) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.70)';
            ctx.beginPath();
            ctx.arc(path[0].x, path[0].y, SIZE * 0.022, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      clearMissHighlight: () => {
        const ctx = missRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
      },
    }));

    // Draw the faded guide layer (default: one glyph in its box; word pages
    // supply a custom renderer via `renderGuide`).
    useEffect(() => {
      const canvas = guideRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);
      if (renderGuide) {
        renderGuide(ctx);
      } else {
        drawGlyphInBox(ctx, char, guideBox, 'rgba(100, 116, 139, 0.30)');
      }
    }, [char, guideBox, renderGuide]);

    const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
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
      // SAFETY: pointer capture is best-effort so a stroke keeps tracking the
      // pointer off-surface (important on touch); optional-chaining covers the
      // browsers where the method is unavailable.
      e.currentTarget.setPointerCapture?.(e.pointerId);

      snapshotCurrent();
      drawingRef.current = true;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
      ctx.lineWidth = SIZE * 0.045;
      const p = toPoint(e);
      // Record the new stroke for the path validator (tap = single point).
      currentPathRef.current = [{ x: p.x, y: p.y }];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      // A dot: extending a hair-length guarantees a visible mark on tap.
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
      drawingRef.current = false;
      // Commit the finished stroke to the path record (undo pops the last).
      const path = currentPathRef.current;
      if (path && path.length > 0) pathsRef.current.push(path);
      currentPathRef.current = null;
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
        {guideOverlay}
        <canvas
          ref={strokesRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
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
  }
);

export default TracingCanvas;

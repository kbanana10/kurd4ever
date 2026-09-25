/**
 * pathValidation.ts — stroke-path validator for single-letter tracing (C10/M1).
 *
 * Replaces pixel-coverage validation for the letters that have a hand-authored
 * stroke plan in `src/data/strokeOrder.ts`. Where the old engine asked "did the
 * learner fill the glyph's pixels?", this engine asks "did the learner follow
 * the same strokes, in the same order, in the same direction, staying on the
 * path the Watch animation draws?".
 *
 * It is a MINIMAL CUSTOM IMPLEMENTATION (~100 lines of algorithm) modelled on
 * the reference matchers studied for this mission (Rule 16 sources):
 *   • hanzi-writer `strokeMatches.ts` — v3.7.3, MIT
 *     (https://github.com/chanind/hanzi-writer/blob/master/src/strokeMatches.ts):
 *     average-distance threshold, start/end distance, direction check,
 *     discrete Fréchet shape fit, backward detection via reversed point arrays.
 *   • kanji-recognizer — v0.2.0, MIT (https://www.npmjs.com/package/kanji-recognizer):
 *     arc-length resampling of both curves before comparison (speed-invariance).
 *   • `sketchy.js` was requested but does not exist on npm (E404) — not used.
 *
 * DESIGN (pure geometry — no canvas, no DOM, so it is unit-testable in jsdom):
 * both the authored strokes and the learner's ink are resampled to a fixed
 * number of arc-length points, which makes every metric invariant to the speed
 * the learner drew with (the DTW requirement). One check per mandatory rule:
 *
 *   1. stroke count  — ink strokes must equal the authored stroke count
 *   2. order         — ink stroke i must best-match authored stroke i
 *   3. direction     — endpoints must pair start→start / end→end (open strokes);
 *                      closed loops (O) use a directed-Fréchet backward flag
 *   4. shape         — directed discrete Fréchet distance <= PATH_TOLERANCE_PX
 *   5. connection    — only where the authored strokes touch, the ink must too
 *   6. coverage      — >= COVERAGE_MIN of each authored stroke lies within
 *                      COVERAGE_TOLERANCE_PX of ink (catches dashed strokes)
 *
 * Red highlighting is deviation-based: an ink point is red when it sits more
 * than RED_TOLERANCE_PX from the expected path, and a stroke the learner never
 * drew is shown as a red guide along its authored path. There is no such thing
 * as an "unfilled pixel" here.
 *
 * All tolerances are in ANALYSIS pixels (TRACE_CANVAS = 320, the same space the
 * mask engine and the Watch animation use), calibrated against synthetic traces
 * (audit/tools) where correct human-wobble scores ~5-10px, swapped strokes
 * ~47px, and reversed/shifted strokes 85-160px+.
 */

import { STROKE_PLANS, parseStrokePath } from '../data/strokeOrder';

/** A 2D point in the analysis-pixel space of the tracing surface. */
export interface TracePoint {
  x: number;
  y: number;
}

/** The pixel bounding box of a glyph, measured on the glyph mask. */
export interface GlyphPixelBounds {
  /** Left-most glyph column (px). */
  minC: number;
  /** Top-most glyph row (px). */
  minR: number;
  /** Glyph width in px (maxCol - minCol). */
  w: number;
  /** Glyph height in px (maxRow - minRow). */
  h: number;
}

/** Why a path trace failed — the UI maps this to a plain-language hint. */
export type PathFailureReason =
  | 'empty'
  | 'stroke-count'
  | 'order'
  | 'direction'
  | 'shape'
  | 'connection'
  | 'coverage';

/** Verdict of `validateStrokeTrace`. */
export interface PathTraceResult {
  passed: boolean;
  reason: PathFailureReason | null;
  /** Minimum per-stroke path-coverage fraction (0..1, 0 on no ink). */
  coverage: number;
  /** Learner stroke count (px space). */
  strokeCount: number;
  /** Authored stroke count for this glyph. */
  expectedCount: number;
  /**
   * Red highlight: ink points that deviate from their expected path by more
   * than RED_TOLERANCE_PX. Empty on a pass.
   */
  deviations: TracePoint[];
  /**
   * Red highlight: authored strokes (px polylines) the learner never drew
   * (coverage below a floor). Painted as a red guide so the learner sees what
   * is missing. Empty when every stroke has ink.
   */
  missingPaths: TracePoint[][];
}

/** Arc-length resampling parameter (points per curve). */
const RESAMPLE_N = 96;
/** Max mmd (mean min-distance) between ink stroke i and its slot, else wrong slot. */
export const ORDER_TOLERANCE_PX = 35;
/** Max directed discrete-Fréchet distance between an ink stroke and its path. */
export const PATH_TOLERANCE_PX = 30;
/** A learner's consecutive strokes must touch within this when their authored
    counterparts touch (the '~15 px' junction tolerance). */
export const CONNECTION_TOLERANCE_PX = 15;
/** Authored strokes closer than this are considered physically joined. */
export const AUTH_TOUCH_PX = 6;
/** Minimum fraction of each authored stroke that ink must lie within tolerance of. */
export const COVERAGE_MIN = 0.7;
/** A point counts as "on" the authored path within this distance. */
export const COVERAGE_TOLERANCE_PX = 20;
/** Ink farther than this from its expected path is painted red (deviation). */
export const RED_TOLERANCE_PX = 14;
/** Authored strokes with less ink coverage than this are reported "missing". */
const MISSING_COVERAGE_FLOOR = 0.25;

const dist = (a: TracePoint, b: TracePoint): number => Math.hypot(a.x - b.x, a.y - b.y);

const pathLength = (p: TracePoint[]): number => {
  let s = 0;
  for (let i = 1; i < p.length; i += 1) s += dist(p[i - 1], p[i]);
  return s;
};

/** Resample a polyline to `n` arc-length points (speed-invariant). A degenerate
    (zero-length) stroke collapses to its single point repeated. */
function resample(p: TracePoint[], n: number = RESAMPLE_N): TracePoint[] {
  if (p.length === 0) return [];
  const len = pathLength(p);
  if (len <= 1e-9) return Array.from({ length: n }, () => ({ x: p[0].x, y: p[0].y }));

  const out: TracePoint[] = [];
  let seg = 0;
  let acc = 0;
  for (let k = 0; k < n; k += 1) {
    const target = (len * k) / (n - 1);
    while (seg < p.length - 2 && acc + dist(p[seg], p[seg + 1]) < target) {
      acc += dist(p[seg], p[seg + 1]);
      seg += 1;
    }
    const segLen = dist(p[seg], p[Math.min(seg + 1, p.length - 1)]) || 1e-9;
    const t = Math.min(1, Math.max(0, (target - acc) / segLen));
    const a = p[seg];
    const b = p[Math.min(seg + 1, p.length - 1)];
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/** Discrete directed Fréchet distance (monotone DP alignment — a DTW variant). */
function frechet(P: TracePoint[], Q: TracePoint[]): number {
  const n = P.length;
  const m = Q.length;
  if (n === 0 || m === 0) return Infinity;
  const dd = (i: number, j: number): number => dist(P[i], Q[j]);
  const c: Float64Array[] = Array.from({ length: n }, () => new Float64Array(m).fill(Infinity));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < m; j += 1) {
      const d = dd(i, j);
      if (i === 0 && j === 0) c[i][j] = d;
      else if (i === 0) c[i][j] = Math.max(c[i][j - 1], d);
      else if (j === 0) c[i][j] = Math.max(c[i - 1][j], d);
      else c[i][j] = Math.max(Math.min(c[i - 1][j], c[i][j - 1], c[i - 1][j - 1]), d);
    }
  }
  return c[n - 1][m - 1];
}

/** Symmetric modified Hausdorff distance (mean min-distance, both directions). */
function mmd(P: TracePoint[], Q: TracePoint[]): number {
  if (P.length === 0 || Q.length === 0) return Infinity;
  let sum = 0;
  for (const p of P) {
    let m = Infinity;
    for (const q of Q) m = Math.min(m, dist(p, q));
    sum += m;
  }
  for (const q of Q) {
    let m = Infinity;
    for (const p of P) m = Math.min(m, dist(p, q));
    sum += m;
  }
  return sum / (P.length + Q.length);
}

/** Minimum distance between two polylines (used for the touching check). */
function minInterDistance(P: TracePoint[], Q: TracePoint[]): number {
  let best = Infinity;
  for (const p of P) {
    for (let j = 0; j + 1 < Q.length; j += 1) {
      best = Math.min(best, pointSegDistance(p, Q[j], Q[j + 1]));
    }
  }
  for (const q of Q) {
    for (let i = 0; i + 1 < P.length; i += 1) {
      best = Math.min(best, pointSegDistance(q, P[i], P[i + 1]));
    }
  }
  return best;
}

/** Distance from point p to segment ab. */
function pointSegDistance(p: TracePoint, a: TracePoint, b: TracePoint): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 <= 1e-9) return dist(p, a);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

/** Distance from one point to the nearest point of a polyline. */
function pointPolyDistance(p: TracePoint, poly: TracePoint[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < poly.length; i += 1) {
    best = Math.min(best, pointSegDistance(p, poly[i], poly[i + 1]));
  }
  if (poly.length === 1) best = Math.min(best, dist(p, poly[0]));
  return best;
}

/** Coverage sample density for authored paths (a raw bar is just 2 endpoints,
    so coverage is measured on a dense arc-length resample of the authored path). */
const COVERAGE_SAMPLES = 48;

/** Fraction of `path` that lies within `tol` of any ink point. */
function pathCoverage(path: TracePoint[], ink: TracePoint[][], tol: number): number {
  if (path.length === 0) return 0;
  const sampled = path.length >= COVERAGE_SAMPLES ? path : resample(path, COVERAGE_SAMPLES);
  let covered = 0;
  for (const p of sampled) {
    if (ink.some(stroke => pointPolyDistance(p, stroke) <= tol)) covered += 1;
  }
  return covered / sampled.length;
}

const first = (p: TracePoint[]): TracePoint => p[0];
const last = (p: TracePoint[]): TracePoint => p[p.length - 1];

/**
 * Direction check. Hanzi-writer style: for OPEN strokes, pair endpoints by
 * minimum total displacement — if reversed pairing is cheaper, the stroke was
 * drawn backwards. For CLOSED loops (start ≈ end, e.g. O) the endpoints are the
 * same point, so fall back to a directed-Fréchet backward flag.
 */
function drawnBackwards(inkRaw: TracePoint[], authoredRaw: TracePoint[]): boolean {
  const sA = first(authoredRaw);
  const eA = last(authoredRaw);
  const sI = first(inkRaw);
  const eI = last(inkRaw);
  const closed = dist(sA, eA) < 0.05 * Math.max(1, pathLength(authoredRaw));

  if (closed) {
    const ink = resample(inkRaw);
    const fwd = frechet(ink, resample(authoredRaw));
    const bwd = frechet(ink, resample([...authoredRaw].reverse()));
    return bwd < fwd - 1e-9;
  }

  const forward = dist(sI, sA) + dist(eI, eA);
  const reversed = dist(sI, eA) + dist(eI, sA);
  return reversed < forward - 1e-9;
}

/** Measure a glyph's pixel bounding box from its (already-built) alpha mask —
    the same bbox the StrokeGuide overlay derives when it maps normalised stroke
    data into pixels, so validation and the Watch animation stay identical.
 */
export function glyphBBoxFromMask(
  mask: Uint8ClampedArray,
  size: number,
): GlyphPixelBounds | null {
  let minR = size;
  let maxR = -1;
  let minC = size;
  let maxC = -1;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 1) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
  }
  if (maxC < minC) return null;
  return { minC, minR, w: maxC - minC, h: maxR - minR };
}

/**
 * Map the authored normalised stroke plan (0..1 in the glyph box) into the
 * glyph's pixel space, exactly as the StrokeGuide overlay does.
 */
export function authoredStrokesToPx(
  glyph: string,
  bbox: GlyphPixelBounds,
): TracePoint[][] {
  const plan = STROKE_PLANS[glyph];
  if (!plan) return [];
  return plan.strokes.map(s =>
    parseStrokePath(s.path).map(p => ({
      x: bbox.minC + p.x * bbox.w,
      y: bbox.minR + p.y * bbox.h,
    })),
  );
}

/** Red-highlight payload for a failed trace. */
interface PathHighlights {
  deviations: TracePoint[];
  missingPaths: TracePoint[][];
}

/** Collect red-highlight data for a failed trace. */
function computeHighlights(
  inkRaw: TracePoint[][],
  authored: TracePoint[][],
): PathHighlights {
  const deviations: TracePoint[] = [];
  const missingPaths: TracePoint[][] = [];

  const stops = Math.min(inkRaw.length, authored.length);
  for (let i = 0; i < stops; i += 1) {
    for (const p of inkRaw[i]) {
      if (pointPolyDistance(p, authored[i]) > RED_TOLERANCE_PX) deviations.push(p);
    }
  }

  for (let i = 0; i < authored.length; i += 1) {
    if (pathCoverage(authored[i], inkRaw, COVERAGE_TOLERANCE_PX) < MISSING_COVERAGE_FLOOR) {
      missingPaths.push(authored[i]);
    }
  }

  return { deviations, missingPaths };
}

/**
 * Validate a learner's strokes against the authored stroke plan for `glyph`.
 *
 * @param glyph      Uppercase glyph with a key in STROKE_PLANS (caller guards).
 * @param inkStrokes Learner strokes in analysis-pixel space, in draw order.
 * @param bbox       The glyph's pixel bounding box (from the same mask the
 *                   guide and Watch overlay use), to place authored strokes.
 */
export function validateStrokeTrace(
  glyph: string,
  inkStrokes: TracePoint[][],
  bbox: GlyphPixelBounds,
): PathTraceResult {
  const authored = authoredStrokesToPx(glyph, bbox);
  const expected = authored.length;

  const emptyCoverage = (): number => 0;

  if (inkStrokes.length === 0) {
    const { deviations, missingPaths } = computeHighlights([], authored);
    return {
      passed: false,
      reason: 'empty',
      coverage: emptyCoverage(),
      strokeCount: 0,
      expectedCount: expected,
      deviations,
      missingPaths,
    };
  }

  // 1 · Stroke count — a missing stroke is an immediate fail.
  if (inkStrokes.length !== expected) {
    const { deviations, missingPaths } = computeHighlights(inkStrokes, authored);
    return {
      passed: false,
      reason: 'stroke-count',
      coverage: 0,
      strokeCount: inkStrokes.length,
      expectedCount: expected,
      deviations,
      missingPaths,
    };
  }

  const ink = inkStrokes.map(s => resample(s));
  const A = authored.map(s => resample(s));

  // 2 · Order — ink stroke i must be the best match for authored slot i.
  for (let i = 0; i < expected; i += 1) {
    const own = mmd(ink[i], A[i]);
    let best = own;
    for (let j = 0; j < expected; j += 1) {
      if (j === i) continue;
      best = Math.min(best, mmd(ink[i], A[j]));
    }
    if (own > ORDER_TOLERANCE_PX || best < own - 1e-9) {
      const { deviations, missingPaths } = computeHighlights(inkStrokes, authored);
      return {
        passed: false,
        reason: 'order',
        coverage: 0,
        strokeCount: inkStrokes.length,
        expectedCount: expected,
        deviations,
        missingPaths,
      };
    }
  }

  // 3 · Direction — each stroke must travel the authored start → end.
  for (let i = 0; i < expected; i += 1) {
    if (drawnBackwards(inkStrokes[i], authored[i])) {
      const { deviations, missingPaths } = computeHighlights(inkStrokes, authored);
      return {
        passed: false,
        reason: 'direction',
        coverage: 0,
        strokeCount: inkStrokes.length,
        expectedCount: expected,
        deviations,
        missingPaths,
      };
    }
  }

  // 4 · Shape / position — directed Fréchet against the authored path.
  for (let i = 0; i < expected; i += 1) {
    if (frechet(ink[i], A[i]) > PATH_TOLERANCE_PX) {
      const { deviations, missingPaths } = computeHighlights(inkStrokes, authored);
      return {
        passed: false,
        reason: 'shape',
        coverage: 0,
        strokeCount: inkStrokes.length,
        expectedCount: expected,
        deviations,
        missingPaths,
      };
    }
  }

  // 5 · Connection — where authored consecutive strokes touch, ink must too.
  for (let i = 0; i + 1 < expected; i += 1) {
    const authoredGap = minInterDistance(authored[i], authored[i + 1]);
    if (authoredGap <= AUTH_TOUCH_PX) {
      const inkGap = minInterDistance(inkStrokes[i], inkStrokes[i + 1]);
      if (inkGap > CONNECTION_TOLERANCE_PX) {
        const { deviations, missingPaths } = computeHighlights(inkStrokes, authored);
        return {
          passed: false,
          reason: 'connection',
          coverage: 0,
          strokeCount: inkStrokes.length,
          expectedCount: expected,
          deviations,
          missingPaths,
        };
      }
    }
  }

  // 6 · Coverage ≥ COVERAGE_MIN of each authored stroke (dashed-stroke guard).
  let minCoverage = 1;
  for (const stroke of authored) {
    minCoverage = Math.min(minCoverage, pathCoverage(stroke, inkStrokes, COVERAGE_TOLERANCE_PX));
  }
  if (minCoverage < COVERAGE_MIN) {
    const { deviations, missingPaths } = computeHighlights(inkStrokes, authored);
    return {
      passed: false,
      reason: 'coverage',
      coverage: minCoverage,
      strokeCount: inkStrokes.length,
      expectedCount: expected,
      deviations,
      missingPaths,
    };
  }

  return {
    passed: true,
    reason: null,
    coverage: minCoverage,
    strokeCount: inkStrokes.length,
    expectedCount: expected,
    deviations: [],
    missingPaths: [],
  };
}

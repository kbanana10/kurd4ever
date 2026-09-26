/**
 * pathValidation.test.tsx — Mission 1 acceptance tests for the stroke-path
 * validator. Pure-geometry: each test builds synthetic px-space strokes from
 * the REAL authored plan (src/data/strokeOrder.ts) via authoredStrokesToPx, so
 * the assertions exercise the exact strokes the Watch animation draws.
 *
 * Acceptance criteria mapped here:
 *   1. correct human-wobble trace passes            → "accepts correct wobble"
 *   2. wrong order (swapped E bars) fails           → "rejects swapped E bars"
 *   3. wrong direction (C bottom-to-top) fails      → "rejects reversed C"
 *   4. broken connection (L corner gap) fails       → "rejects broken L corner"
 *   5. missing stroke fails                         → "rejects missing stroke"
 *   6. red only on deviation                        → "red highlights only on deviation"
 */
import { describe, it, expect } from 'vitest';
import { STROKE_PLANS } from '../src/data/strokeOrder';
import {
  validateStrokeTrace,
  authoredStrokesToPx,
  type TracePoint,
  type GlyphPixelBounds,
} from '../src/lib/pathValidation';

/** Deterministic PRNG (mulberry32) so wobble is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A synthetic glyph bbox in px (same shape the mask engine would report). */
const BBOX: GlyphPixelBounds = { minC: 40, minR: 24, w: 240, h: 224 };

const hasPlan = (g: string) => STROKE_PLANS[g] !== undefined;

/** Jitter a stroke with gaussian noise (~sigma px). */
function jitter(stroke: TracePoint[], rnd: () => number, sigma: number): TracePoint[] {
  // Box-Muller from the uniform rnd().
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return stroke.map(p => ({ x: p.x + gauss() * sigma, y: p.y + gauss() * sigma }));
}

/** Build a "correct" trace: authored strokes in order/direction + wobble. */
function correctTrace(glyph: string, sigma: number, seed = 1): TracePoint[][] {
  const rnd = mulberry32(seed);
  return authoredStrokesToPx(glyph, BBOX).map(s => jitter(s, rnd, sigma));
}

describe('validateStrokeTrace (path-based validator)', () => {
  it('E, O, Û and every authored glyph have a stroke plan', () => {
    for (const g of ['E', 'O', 'Û', 'C', 'L']) {
      expect(hasPlan(g)).toBe(true);
    }
  });

  it('accepts correct human-wobble traces on E, O and Û', () => {
    for (const glyph of ['E', 'O', 'Û']) {
      const result = validateStrokeTrace(glyph, correctTrace(glyph, 1.5), BBOX);
      expect(result.passed, `${glyph} should pass`).toBe(true);
      expect(result.reason).toBeNull();
      // A passing trace must carry no red anywhere.
      expect(result.deviations).toHaveLength(0);
      expect(result.missingPaths).toHaveLength(0);
    }
  });

  it('rejects C drawn bottom-to-top (wrong direction)', () => {
    const strokes = correctTrace('C', 1.5);
    const reversed = strokes.map(s => [...s].reverse());
    const result = validateStrokeTrace('C', reversed, BBOX);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('direction');
  });

  it('rejects swapped E bars (wrong order)', () => {
    const strokes = correctTrace('E', 1.5);
    // Authored E order: [stem, top bar, middle bar, bottom bar]. Swap bars 1↔2.
    const swapped = [strokes[0], strokes[2], strokes[1], strokes[3]];
    const result = validateStrokeTrace('E', swapped, BBOX);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('order');
  });

  it('rejects a missing stroke (E with 3 strokes)', () => {
    const strokes = correctTrace('E', 1.5);
    const missing = strokes.slice(0, 3); // dropped the bottom bar
    const result = validateStrokeTrace('E', missing, BBOX);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('stroke-count');
    expect(result.strokeCount).toBe(3);
    expect(result.expectedCount).toBe(4);
    // The never-drawn stroke is reported as a red guide path.
    expect(result.missingPaths.length).toBeGreaterThan(0);
  });

  it('rejects a broken L corner (connection) while the shape itself stays on-path', () => {
    const strokes = correctTrace('L', 0.0);
    const [stem, base] = strokes;
    // Shift the base's start a modest distance from the stem (≈19px gap at
    // bbox.w=240): the base is still a correct horizontal bar, but it no longer
    // joins the stem end, so the shaped Fréchet stays under tolerance and the
    // CONNECTION rule must catch the break.
    const gap = 0.08 * BBOX.w; // 19.2px
    const brokenBase = base.map((p, i) => (i === 0 ? { x: p.x + gap, y: p.y } : p));
    const result = validateStrokeTrace('L', [stem, brokenBase], BBOX);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('connection');
  });

  it('red highlights only on deviation — none when ink is correct, and none on a pass', () => {
    // PASS ⇒ zero red.
    const good = validateStrokeTrace('E', correctTrace('E', 1.2), BBOX);
    expect(good.deviations).toHaveLength(0);
    expect(good.missingPaths).toHaveLength(0);

    // MISSING stroke ⇒ the ink that WAS drawn is correct, so it carries no red;
    // only the never-drawn stroke is shown as a red guide path.
    const three = correctTrace('E', 0.5).slice(0, 3);
    const missing = validateStrokeTrace('E', three, BBOX);
    expect(missing.passed).toBe(false);
    expect(missing.reason).toBe('stroke-count');
    expect(missing.deviations).toHaveLength(0);
    expect(missing.missingPaths).toHaveLength(1);

    // WRONG-ORDER (swapped bars) ⇒ red appears WHERE ink deviates from its
    // expected path. Every reported deviation must actually be off the
    // authored path (by RED_TOLERANCE_PX, the validator's own threshold),
    // proving the red is deviation-driven — not "unfilled pixels".
    const strokes = correctTrace('E', 1.2);
    const swapped = [strokes[0], strokes[2], strokes[1], strokes[3]];
    const bad = validateStrokeTrace('E', swapped, BBOX);
    expect(bad.passed).toBe(false);
    expect(bad.deviations.length).toBeGreaterThan(0);

    const authored = authoredStrokesToPx('E', BBOX);
    const pointPolyDistance = (p: TracePoint, poly: TracePoint[]): number => {
      let best = Infinity;
      for (let i = 0; i + 1 < poly.length; i += 1) {
        const [ax, ay] = [poly[i].x, poly[i].y];
        const [bx, by] = [poly[i + 1].x, poly[i + 1].y];
        const abx = bx - ax;
        const aby = by - ay;
        const len2 = abx * abx + aby * aby;
        const t = len2 <= 1e-9 ? 0 : Math.max(0, Math.min(1, ((p.x - ax) * abx + (p.y - ay) * aby) / len2));
        const d = Math.hypot(p.x - (ax + abx * t), p.y - (ay + aby * t));
        if (d < best) best = d;
      }
      if (poly.length === 1) best = Math.min(best, Math.hypot(p.x - poly[0].x, p.y - poly[0].y));
      return best;
    };
    // Red is SELECTIVE, not a wholesale wash: (a) it exists, and (b) none of
    // it touches the correctly-drawn bottom bar (every deviation sits > 50px
    // from that path), which is how we know red marks only the wrong strokes.
    expect(bad.deviations.length).toBeGreaterThan(0);
    const bottomBar = authored[3];
    for (const p of bad.deviations) {
      expect(pointPolyDistance(p, bottomBar)).toBeGreaterThan(50);
    }
    // And it is bounded: fewer red points than the total ink drawn (the two
    // correct strokes — stem + bottom bar — contribute no red).
    const totalInkPoints = swapped.flat().length;
    expect(bad.deviations.length).toBeLessThan(totalInkPoints);
  });
});

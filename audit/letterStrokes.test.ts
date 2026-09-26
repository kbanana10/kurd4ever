/**
 * letterStrokes.test.ts — Phase 1 data-model tests for the Interactive Letter
 * Writing Lesson. These are STRUCTURAL assertions (pure data, no canvas): every
 * one of the 31 Kurmanji letters must have a usable, in-order, in-bounds stroke
 * plan that carries the HANDWRITING SEMANTICS the lesson teaches (start point,
 * order, direction, segmentation, end point) — not merely glyph geometry.
 *
 * Constraint 2 ("never silently ship incomplete letter data") is enforced here
 * by requiring an explicit readiness status per letter via
 * `getLetterReadiness`, and by asserting that every lesson glyph is `ready`
 * (geometry-verified by the raster verifier AND semantics-reviewed). Any glyph
 * whose plan is found lacking flips this suite red before it can ship.
 *
 * Raster-level "does each plan reconstruct the glyph?" proof lives in
 * audit/tools/letter-strokes-verify.mjs (run against a real browser canvas),
 * because jsdom provides no rasteriser; the `ready` set above is updated by
 * hand only after that tool passes.
 */
import { describe, it, expect } from 'vitest';
import { alphabet } from '../src/data/kurmanji';
import {
  LETTER_STROKES,
  LESSON_GLYPHS,
  getLetterStrokes,
  getLetterReadiness,
  isUsableStrokePlan,
  letterStrokesToPx,
} from '../src/data/letterStrokes';
import { STROKE_PLANS, parseStrokePath } from '../src/data/strokeOrder';
import type { GlyphStrokePlan } from '../src/data/strokeOrder';

/** The 31-letter alphabet, in its canonical (data) order. */
const GLYPHS = alphabet.map((l) => l.char.split(' ')[0]).map((g) => g.toUpperCase());

interface P { x: number; y: number }

const polyLength = (p: P[]): number => {
  let s = 0;
  for (let i = 1; i < p.length; i += 1) s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
  return s;
};

/** Signed doubled area of a closed polyline (SVG coords: y grows downward). */
const signedArea2 = (p: P[]): number => {
  let a = 0;
  for (let i = 0; i < p.length; i += 1) {
    const q = p[(i + 1) % p.length];
    a += p[i].x * q.y - q.x * p[i].y;
  }
  return a;
};

describe('letterStrokes data model', () => {
  it('covers every one of the 31 Kurmanji letters', () => {
    expect(GLYPHS).toHaveLength(31);
    for (const g of GLYPHS) {
      const plan = getLetterStrokes(g);
      expect(plan, `"${g}" must have a stroke plan`).toBeDefined();
      expect(plan?.glyph, `${g} plan.glyph`).toBe(g);
    }
    expect(LESSON_GLYPHS.sort()).toEqual([...GLYPHS].sort());
    expect(Object.keys(LETTER_STROKES).sort()).toEqual([...GLYPHS].sort());
  });

  it('every plan is structurally usable (ordered, in-bounds, non-empty)', () => {
    for (const g of LESSON_GLYPHS) {
      expect(isUsableStrokePlan(getLetterStrokes(g)), `${g} should be usable`).toBe(true);
    }
  });

  it('every stroke is travellable: start ≠ end for OPEN strokes, and every path has length', () => {
    for (const g of LESSON_GLYPHS) {
      const plan = getLetterStrokes(g)!;
      for (const s of plan.strokes) {
        const pts = parseStrokePath(s.path);
        expect(pts.length, `${g} stroke ${s.order} non-empty`).toBeGreaterThanOrEqual(1);
        const len = polyLength(pts);
        expect(len, `${g} stroke ${s.order} must have length`).toBeGreaterThan(0.05);
        const closed = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 0.05;
        // A `direction: 'end'` arrow marker needs a distinct destination unless
        // the stroke is a closed loop (O, Q, G) whose end legitimately equals
        // its start.
        if (!closed) {
          expect(
            pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y,
            `${g} stroke ${s.order} must not end where it starts (open stroke)`,
          ).toBe(true);
        }
        expect(s.direction, `${g} stroke ${s.order} direction`).toBe('end');
      }
    }
  });

  it('closed-loop letters (O, Q, G) travel counterclockwise and return to their start', () => {
    // "Magic C, keep on going" (Handwriting Without Tears): the pen starts at
    // the top and sweeps counterclockwise. In SVG (y-down) coordinates a
    // VISUALLY-counterclockwise polygon has a NEGATIVE signed area — asserted
    // below against the hand-verified convention.
    for (const g of ['O', 'Q', 'G']) {
      const ring = parseStrokePath(getLetterStrokes(g)!.strokes[0].path);
      const closed = Math.hypot(
        ring[0].x - ring[ring.length - 1].x,
        ring[0].y - ring[ring.length - 1].y,
      );
      expect(closed, `${g} ring closes on its start`).toBeLessThan(0.05);
      expect(signedArea2(ring), `${g} ring must be counterclockwise`).toBeLessThan(0);
    }
  });

  it('diacritics are authored LAST (base glyph fully drawn before its mark)', () => {
    const accented: Record<string, { baseStrokes: number; totalStrokes: number }> = {
      Ç: { baseStrokes: 1, totalStrokes: 2 },
      Ê: { baseStrokes: 4, totalStrokes: 6 },
      Î: { baseStrokes: 3, totalStrokes: 5 },
      Ş: { baseStrokes: 1, totalStrokes: 2 },
      Û: { baseStrokes: 2, totalStrokes: 4 },
    };
    for (const [g, expectStrokeCounts] of Object.entries(accented)) {
      const plan = getLetterStrokes(g)!;
      expect(plan.strokes).toHaveLength(expectStrokeCounts.totalStrokes);
      const accents = plan.strokes.slice(expectStrokeCounts.baseStrokes);
      for (const s of accents) {
        expect(s.order, `${g} accent order after base`).toBeGreaterThanOrEqual(expectStrokeCounts.baseStrokes);
      }
    }
  });

  it('lesson data and the Read/Watch guide cannot drift (shared glyphs agree)', () => {
    // strokeOrder.ts (existing /writing trace demo) and letterStrokes.ts (new
    // lesson) must teach the same glyph the same way, or the demo and the
    // lesson contradict each other. For every glyph present in BOTH files:
    //   • the stroke count must match, and
    //   • OPEN strokes must travel the same way (parallel end−start vectors
    //     — a dot product > 0 proves no stroke was reversed), and
    //   • CLOSED loops must rotate the same way (same signed-area sign).
    const shared = Object.keys(STROKE_PLANS).filter((g) => LETTER_STROKES[g] !== undefined);
    expect(shared.length, 'some glyphs must be shared for the check to mean anything').toBeGreaterThan(0);

    for (const g of shared) {
      const theirs = STROKE_PLANS[g].strokes;
      const ours = LETTER_STROKES[g].strokes;
      expect(ours.length, `${g} stroke count must match strokeOrder.ts`).toBe(theirs.length);

      for (let i = 0; i < ours.length; i += 1) {
        const op = parseStrokePath(ours[i].path);
        const tp = parseStrokePath(theirs[i].path);
        const ov = { x: op[op.length - 1].x - op[0].x, y: op[op.length - 1].y - op[0].y };
        const tv = { x: tp[tp.length - 1].x - tp[0].x, y: tp[tp.length - 1].y - tp[0].y };
        const oClosed = Math.hypot(ov.x, ov.y) < 0.05;
        const tClosed = Math.hypot(tv.x, tv.y) < 0.05;
        expect(oClosed, `${g} stroke ${i} open/closed must match strokeOrder.ts`).toBe(tClosed);
        if (oClosed) {
          const sign = (n: number) => (n < 0 ? -1 : 1);
          expect(
            sign(signedArea2(op)),
            `${g} stroke ${i} loop direction must match strokeOrder.ts`,
          ).toBe(sign(signedArea2(tp)));
        } else {
          const dot = ov.x * tv.x + ov.y * tv.y;
          expect(dot, `${g} stroke ${i} direction must not be reversed vs strokeOrder.ts`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('readiness: every lesson glyph is marked ready (geometry-verified + semantics-reviewed)', () => {
    for (const g of LESSON_GLYPHS) {
      expect(
        getLetterReadiness(g),
        `${g} must be explicit 'ready' before the lesson ships it (Constraint 2)`,
      ).toBe('ready');
    }
  });

  it('readiness degrades to draft for unknown glyphs (graceful, never fabricated)', () => {
    expect(getLetterReadiness('Ω')).toBe('draft');
    expect(getLetterStrokes('Ω')).toBeUndefined();
  });

  it('malformed / incomplete stroke data is rejected, not passed through', () => {
    // Missing plan.
    expect(isUsableStrokePlan(undefined)).toBe(false);
    expect(letterStrokesToPx(undefined, { minC: 0, minR: 0, w: 100, h: 100 })).toEqual([]);

    // Empty strokes array.
    expect(isUsableStrokePlan({ glyph: 'A', strokes: [] })).toBe(false);

    // A stroke whose path parses to nothing.
    const malformed: GlyphStrokePlan = {
      glyph: 'A',
      strokes: [
        { order: 0, path: 'garbage-with-no-numbers', direction: 'end' },
        { order: 1, path: 'M0.1 0.1 L0.9 0.9', direction: 'end' },
      ],
    };
    expect(isUsableStrokePlan(malformed)).toBe(false);

    // Out-of-order `order` fields are rejected.
    const outOfOrder: GlyphStrokePlan = {
      glyph: 'A',
      strokes: [
        { order: 1, path: 'M0.1 0.1 L0.9 0.9', direction: 'end' },
        { order: 0, path: 'M0.2 0.2 L0.8 0.8', direction: 'end' },
      ],
    };
    expect(isUsableStrokePlan(outOfOrder)).toBe(false);
  });
});

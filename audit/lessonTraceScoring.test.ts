/**
 * lessonTraceScoring.test.ts — Phase 2 acceptance tests for the lesson's
 * deterministic 0..100 scoring. Pure geometry: no canvas/DOM.
 *
 * Covers the primitives the guided lesson and previews rely on:
 *   - scoreBand thresholds (≥90 Excellent, 75–89 Good, 60–74 Practice, <60 Retry)
 *   - scoreLessonTrace: perfect copy ≈ full marks; wobble stays high; reversed
 *     stroke and stray/missing ink drop below thresholds; clamping to [0,100];
 *     mismatched stroke count cannot reach full marks
 *   - evaluateLessonStroke start/end/direction/coverage flags
 *   - freeWriteScore band + bounds factor behaviour
 *   - scoreLessonTrace never returns NaN/infinity for degenerate input
 */
import { describe, it, expect } from 'vitest';
import {
  scoreBand,
  scoreLessonTrace,
  evaluateLessonStroke,
  freeWriteScore,
  type TracePoint,
} from '../src/lib/pathValidation';

/** Deterministic PRNG so wobble is reproducible across runs. */
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

/** A vertical stroke in bbox space (x=160, y from 50 to 250). */
const VERT: TracePoint[] = Array.from({ length: 40 }, (_, i) => ({
  x: 160,
  y: 50 + i * 5,
}));

/** A horizontal bar in bbox space. */
const HORIZ: TracePoint[] = Array.from({ length: 40 }, (_, i) => ({
  x: 60 + i * 5,
  y: 150,
}));

const jitter = (p: TracePoint[], rnd: () => number, amp: number): TracePoint[] =>
  p.map((pt) => ({ x: pt.x + (rnd() - 0.5) * 2 * amp, y: pt.y + (rnd() - 0.5) * 2 * amp }));

describe('scoreBand', () => {
  it('maps score bands at 90 / 75 / 60', () => {
    expect(scoreBand(100)).toBe('excellent');
    expect(scoreBand(90)).toBe('excellent');
    expect(scoreBand(89)).toBe('good');
    expect(scoreBand(75)).toBe('good');
    expect(scoreBand(74)).toBe('practice');
    expect(scoreBand(60)).toBe('practice');
    expect(scoreBand(59)).toBe('retry');
    expect(scoreBand(0)).toBe('retry');
  });

  it('clamps out-of-range inputs sanely', () => {
    expect(scoreBand(120)).toBe('excellent');
    expect(scoreBand(-5)).toBe('retry');
  });
});

describe('scoreLessonTrace', () => {
  it('a perfect copy of a one-stroke plan scores ≥ 90', () => {
    const r = scoreLessonTrace([VERT], [VERT.map((p) => ({ ...p }))]);
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.completed).toBe(true);
    expect(r.breakdown.direction).toBe(1);
    expect(r.breakdown.coverage).toBe(1);
  });

  it('a human-wobble copy (±4px) stays ≥ 75 (forgiving)', () => {
    const rnd = mulberry32(11);
    for (let i = 0; i < 20; i += 1) {
      const wob = jitter(VERT, rnd, 4);
      const r = scoreLessonTrace([VERT], [wob]);
      expect(r.score, `wobble run ${i} (${r.score})`).toBeGreaterThanOrEqual(75);
    }
  });

  it('a backwards stroke is penalised through the direction component', () => {
    const fwd = scoreLessonTrace([VERT], [VERT.map((p) => ({ ...p }))]);
    const rev = scoreLessonTrace([VERT], [[...VERT].reverse()]);
    expect(rev.score).toBeLessThan(fwd.score);
    expect(rev.breakdown.direction).toBe(0);
  });

  it('a stroke count mismatch caps the score below full marks', () => {
    const perfect = scoreLessonTrace([VERT], [VERT.map((p) => ({ ...p }))]);
    const extra = scoreLessonTrace([VERT], [VERT.map((p) => ({ ...p })), HORIZ.map((p) => ({ ...p }))]);
    expect(extra.score).toBeLessThan(perfect.score);
    expect(extra.score).toBeLessThanOrEqual(80);
  });

  it('an empty attempt scores 0 without NaN/infinity', () => {
    const r = scoreLessonTrace([VERT], []);
    expect(r.score).toBe(0);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.completed).toBe(false);
  });

  it('an empty plan scores 0 defensively', () => {
    const r = scoreLessonTrace([], [VERT]);
    expect(r.score).toBe(0);
  });

  it('never returns NaN or out-of-range values for degenerate ink', () => {
    const degenerate: TracePoint[][] = [[{ x: 5, y: 5 }]];
    const r = scoreLessonTrace([VERT], degenerate);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe('evaluateLessonStroke', () => {
  it('flags a correct copy as started/ended/on-path/complete', () => {
    const e = evaluateLessonStroke(VERT, VERT.map((p) => ({ ...p })));
    expect(e.startedOnDot).toBe(true);
    expect(e.endedOnDot).toBe(true);
    expect(e.onPath).toBe(true);
    expect(e.backwards).toBe(false);
    expect(e.completed).toBe(true);
  });

  it('flags a reversed stroke as backwards', () => {
    const e = evaluateLessonStroke(VERT, [...VERT].reverse());
    expect(e.backwards).toBe(true);
    expect(e.completed).toBe(false);
  });
});

describe('freeWriteScore', () => {
  it('maps a solid trace to ≥90', () => {
    expect(freeWriteScore(0.98, 0, 1)).toBeGreaterThanOrEqual(90);
  });

  it('is forgiving of minor out-of-bounds overhang', () => {
    expect(freeWriteScore(0.9, 0.05, 1)).toBeGreaterThanOrEqual(85);
  });

  it('drops a mostly-empty attempt into the retry band', () => {
    expect(freeWriteScore(0.1, 0, 0.05)).toBeLessThan(60);
  });

  it('stays within [0, 100] for extreme inputs', () => {
    expect(freeWriteScore(2, 5, 9)).toBeGreaterThanOrEqual(0);
    expect(freeWriteScore(2, 5, 9)).toBeLessThanOrEqual(100);
  });
});

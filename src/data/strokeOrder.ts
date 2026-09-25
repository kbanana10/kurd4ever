/**
 * strokeOrder.ts — hand-authored per-letter stroke order for the Writing guide.
 *
 * C10 Phase 1. Each entry describes how to WRITE a letter the correct way,
 * one stroke at a time, in the order a teacher would prescribe. This is NOT
 * generated from the font and must never be generated on the fly: every path
 * below was authored against the actual on-screen guide (the 900-weight Noto
 * Sans glyph rendered by `buildLetterMask` / `buildGlyphMask` in traceLetters.ts)
 * and verified so that re-rasterising these strokes reproduces the glyph under
 * the same tolerance the learner's trace must pass (see
 * audit/tools/stroke-guide-verify.mjs).
 *
 * COORDINATES: each `path` is an SVG-style string of only M/L commands whose
 * x/y are NORMALISED to the glyph's own bounding box (0..1). At render time the
 * StrokeGuide component maps them back into pixels using the glyph's bounding
 * box (derived from the same mask), so the guide can never drift from the
 * letter the learner sees — including for diacritics like Û, whose taller box
 * includes the circumflex.
 *
 * STROKE ORDER CONVENTIONS (authored, educationally standard print order):
 *   - vertical stems first (top → bottom), then top/bottom bars, then bowls,
 *     and diacritics ALWAYS last (base glyph fully drawn before its mark).
 *   - `direction` is the end the pen travels TOWARD (arrow/dot marker target).
 */

export type StrokeDirection = 'start' | 'end';

export interface GuideStroke {
  /** 0-based draw order (kept explicit even though array order implies it). */
  order: number;
  /** 'M x y L x y …' in glyph-bbox-normalised (0..1) coordinates. */
  path: string;
  /** Which end the animated pen-tip marker points at. */
  direction: StrokeDirection;
}

export interface GlyphStrokePlan {
  glyph: string;
  strokes: GuideStroke[];
}

/** Parse the M/L-only SVG path strings authored above into point arrays. */
export function parseStrokePath(path: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const tokens = path.match(/[A-Za-z]|-?\d*\.?\d+(?:e[+-]?\d+)?/g);
  if (!tokens) return points;
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i].toUpperCase();
    i += 1;
    const coords: number[] = [];
    while (i < tokens.length && /^-?\d*\.?\d+(?:e[+-]?\d+)?$/i.test(tokens[i])) {
      coords.push(parseFloat(tokens[i]));
      i += 1;
    }
    for (let k = 0; k + 1 < coords.length; k += 2) {
      if (cmd === 'M' && points.length === 0) {
        points.push({ x: coords[k], y: coords[k + 1] });
      } else if (cmd === 'M') {
        // a second M inside the string starts a new section; keep as line-to
        points.push({ x: coords[k], y: coords[k + 1] });
      } else {
        points.push({ x: coords[k], y: coords[k + 1] });
      }
    }
  }
  return points;
}

/**
 * Stroke plans for the first ten letters (C10 Phase 1). Authored by hand and
 * reviewed against the rendered glyph skeleton. The remaining 21 glyphs are
 * authored in Phase 2.
 */
export const STROKE_PLANS = {
  E: {
    glyph: 'E',
    strokes: [
      { order: 0, path: 'M0.09 0.05 L0.09 0.94', direction: 'end' },        // vertical stem, top→bottom
      { order: 1, path: 'M0.09 0.07 L0.93 0.07', direction: 'end' },        // top bar, left→right
      { order: 2, path: 'M0.09 0.46 L0.86 0.46', direction: 'end' },        // middle bar
      { order: 3, path: 'M0.09 0.90 L0.92 0.90', direction: 'end' },        // bottom bar
    ],
  },
  O: {
    glyph: 'O',
    strokes: [
      {
        order: 0,
        path:
          'M0.50 0.05 L0.24 0.07 L0.08 0.21 L0.06 0.50 L0.08 0.79 ' +
          'L0.23 0.93 L0.50 0.95 L0.77 0.93 L0.92 0.79 L0.94 0.50 ' +
          'L0.92 0.21 L0.76 0.07 L0.50 0.05',
        direction: 'end',
      },
    ],
  },
  I: {
    glyph: 'I',
    strokes: [
      { order: 0, path: 'M0.50 0.10 L0.50 0.90', direction: 'end' },        // stem
      { order: 1, path: 'M0.06 0.10 L0.94 0.10', direction: 'end' },        // top bar
      { order: 2, path: 'M0.06 0.90 L0.94 0.90', direction: 'end' },        // bottom bar
    ],
  },
  L: {
    glyph: 'L',
    strokes: [
      { order: 0, path: 'M0.10 0.05 L0.10 0.90', direction: 'end' },        // stem
      { order: 1, path: 'M0.10 0.90 L0.93 0.90', direction: 'end' },        // base
    ],
  },
  T: {
    glyph: 'T',
    strokes: [
      { order: 0, path: 'M0.05 0.06 L0.95 0.06', direction: 'end' },        // top bar
      { order: 1, path: 'M0.50 0.06 L0.50 0.94', direction: 'end' },        // stem, top→bottom
    ],
  },
  A: {
    glyph: 'A',
    strokes: [
      { order: 0, path: 'M0.51 0.03 L0.15 0.90', direction: 'end' },        // left leg, apex→bottom-left
      { order: 1, path: 'M0.51 0.03 L0.87 0.90', direction: 'end' },        // right leg, apex→bottom-right
      { order: 2, path: 'M0.28 0.70 L0.72 0.70', direction: 'end' },        // crossbar
    ],
  },
  B: {
    glyph: 'B',
    strokes: [
      { order: 0, path: 'M0.14 0.04 L0.14 0.96', direction: 'end' },        // stem
      {
        order: 1,
        path: 'M0.14 0.12 L0.55 0.05 L0.82 0.16 L0.86 0.34 L0.60 0.47 L0.14 0.47',
        direction: 'end',
      },                                                                     // upper bowl
      {
        order: 2,
        path: 'M0.14 0.53 L0.60 0.49 L0.86 0.60 L0.90 0.80 L0.70 0.95 L0.14 0.96',
        direction: 'end',
      },                                                                     // lower bowl
    ],
  },
  C: {
    glyph: 'C',
    strokes: [
      {
        order: 0,
        path:
          'M0.88 0.16 L0.55 0.05 L0.22 0.06 L0.10 0.18 L0.05 0.45 ' +
          'L0.06 0.62 L0.12 0.82 L0.30 0.95 L0.58 0.96 L0.85 0.85',
        direction: 'end',
      },
    ],
  },
  S: {
    glyph: 'S',
    strokes: [
      {
        order: 0,
        path:
          'M0.82 0.13 L0.55 0.05 L0.28 0.06 L0.13 0.14 L0.09 0.26 ' +
          'L0.12 0.37 L0.22 0.45 L0.42 0.50 L0.62 0.55 L0.75 0.62 ' +
          'L0.80 0.74 L0.75 0.86 L0.58 0.95 L0.34 0.94 L0.19 0.87 L0.15 0.72',
        direction: 'end',
      },
    ],
  },
  U: {
    glyph: 'U',
    strokes: [
      { order: 0, path: 'M0.13 0.03 L0.13 0.70 L0.24 0.88 L0.42 0.96', direction: 'end' },  // left stem → bowl left half
      { order: 1, path: 'M0.87 0.03 L0.87 0.70 L0.76 0.88 L0.58 0.96', direction: 'end' },  // right stem → bowl right half
    ],
  },
  Û: {
    glyph: 'Û',
    // TALLER box than U (the circumflex sits above the letter), so the base U
    // occupies y≈0.26..0.97. Diacritic is ALWAYS last: stroke 2, 3.
    strokes: [
      { order: 0, path: 'M0.15 0.28 L0.15 0.72 L0.26 0.89 L0.43 0.96', direction: 'end' },  // left stem → bowl
      { order: 1, path: 'M0.85 0.28 L0.85 0.72 L0.74 0.89 L0.57 0.96', direction: 'end' },  // right stem → bowl
      { order: 2, path: 'M0.50 0.02 L0.37 0.09', direction: 'end' },                        // circumflex left arm
      { order: 3, path: 'M0.50 0.02 L0.63 0.10', direction: 'end' },                        // circumflex right arm
    ],
  },
} satisfies Record<string, GlyphStrokePlan>;

/** Which glyphs currently have an authored stroke plan (Phase 1 set). */
export const AUTHORED_GLYPHS = Object.keys(STROKE_PLANS);

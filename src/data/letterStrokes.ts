/**
 * letterStrokes.ts — stroke-order plans for ALL 31 Kurmanji letters
 * (data-driven Interactive Letter Writing Lesson).
 *
 * This is the single data table that makes the lesson "add a letter = add data
 * only". Every entry uses the SAME `GlyphStrokePlan` contract as
 * `src/data/strokeOrder.ts` (the Read/Watch trace guide) and the same
 * `parseStrokePath` reader, so the lesson reuses the established geometry:
 *
 *   • `path`   — 'M x y L x y …' polyline in the glyph's own bounding box
 *                (0..1), the coordinate system `pathValidation`'s
 *                `letterStrokesToPx` maps back to pixels.
 *   • `order`  — 0-based draw order (educational print order: vertical stems
 *                first, then top/bottom bars, then bowls, and diacritics
 *                ALWAYS last — the base glyph fully drawn before its mark).
 *   • `direction` — the end the pen travels TOWARD (arrow marker target).
 *
 * AUTHORING AUTHORITY (Constraint 1: handwriting, not glyph outline). Every
 * plan here is authored to teach HOW A LEARNER WRITES the letter, using the
 * standard print-formation conventions in Handwriting Without Tears
 * (Jan Z. Olsen, OTR — hwtears.com; "Directions for Capitals", verified 200):
 *
 *   1. ALL letters start at the top; vertical stems run top → bottom.
 *   2. Horizontal bars run left → right.
 *   3. Open curved letters (C, S, J) sweep counterclockwise from near the
 *      top right, exactly as HWT prescribes ("Magic C": the pencil starts
 *      near the upper right, sweeps left and down, finishes lower right).
 *   4. Closed loops (O, Q, G) are "Magic C, keep on going": start at the
 *      TOP and travel counterclockwise, closing back at the start. A closing
 *      loop therefore returns to its own start point (its `direction` end is
 *      the anchor — the rotation direction is what carries the order).
 *   5. Q's tail and G's nose bar are SEPARATE final strokes (HWT: "…stop,
 *      little line slides down"; "…little line across").
 *   6. Diacritics last: Ç Ê Î Ş Û draw the BASE glyph completely first, then
 *      their accent as final strokes. Accented letters occupy a taller
 *      (circumflex) or taller+wider (cedilla) bounding box and their base
 *      glyph sits inside it.
 *
 * GEOMETRY QUALITY: straight-stroke letters follow their measured stem axes;
 * curved letters are authored on the rendered glyph's true stroke CENTERLINE
 * (per-column ink-run mids / radial medians of the 900-weight Noto Sans mask),
 * so the demo pen rides the MIDDLE of each stroke. Geometry is verified
 * objectively by audit/tools/letter-strokes-verify.mjs (per-letter precision
 * on-glyph + centerline recall) and audit/letterStrokes.test.ts.
 *
 * READINESS (Constraint 2: never ship an unfinished letter). See
 * `LetterReadiness` / `getLetterReadiness` below: a glyph is `ready` only when
 * its geometry is raster-verified AND its handwriting semantics are reviewed.
 * The UI must gate production-complete lessons on `ready` and degrade
 * gracefully (single-stroke fallback + gentle notice) for anything else.
 */

import {
  parseStrokePath,
  type GlyphStrokePlan,
} from './strokeOrder';
import type { TracePoint, GlyphPixelBounds } from '../lib/pathValidation';

/** min/max fraction sanity bounds for authored (0..1) coordinates. */
const IN = (v: number) => Number.isFinite(v) && v >= -0.02 && v <= 1.02;

export type { GlyphStrokePlan } from './strokeOrder';

export const LETTER_STROKES = {
  // ---- Straight-stroke letters — centerline-authored (measured) ------------
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
      { order: 0, path: 'M0.19 0.04 L0.19 0.96', direction: 'end' },        // stem
      {
        order: 1,
        path: 'M0.19 0.11 L0.52 0.05 L0.80 0.16 L0.86 0.34 L0.62 0.47 L0.19 0.47',
        direction: 'end',
      },                                                                     // upper bowl
      {
        order: 2,
        path: 'M0.19 0.53 L0.58 0.49 L0.85 0.60 L0.90 0.80 L0.72 0.95 L0.19 0.96',
        direction: 'end',
      },                                                                     // lower bowl
    ],
  },
  C: {
    glyph: 'C',
    strokes: [
      {
        order: 0,
        // Exact measured centerline: at this 900-weight the C's left side
        // fuses into a vertical spine while the two arms flare to the open
        // mouth on the right. One continuous counterclockwise stroke from the
        // top arm tip, down the spine, along the bottom and back out.
        path:
          'M1.000 0.169 L0.960 0.149 L0.920 0.137 L0.880 0.123 L0.840 0.111 ' +
          'L0.800 0.103 L0.760 0.097 L0.720 0.094 L0.680 0.094 L0.640 0.091 ' +
          'L0.600 0.091 L0.560 0.094 L0.520 0.100 L0.480 0.106 L0.440 0.114 ' +
          'L0.400 0.123 L0.360 0.140 L0.320 0.154 L0.300 0.251 L0.260 0.300 ' +
          'L0.200 0.370 L0.140 0.440 L0.080 0.490 L0.040 0.500 L0.080 0.510 ' +
          'L0.140 0.560 L0.200 0.630 L0.260 0.700 L0.300 0.749 L0.320 0.846 ' +
          'L0.360 0.860 L0.400 0.877 L0.440 0.886 L0.480 0.894 L0.520 0.900 ' +
          'L0.560 0.903 L0.600 0.906 L0.640 0.909 L0.680 0.909 L0.720 0.906 ' +
          'L0.760 0.906 L0.800 0.903 L0.840 0.897 L0.880 0.886 L0.920 0.869 ' +
          'L0.960 0.846 L1.000 0.831',
        direction: 'end',
      },
    ],
  },
  Ç: {
    glyph: 'Ç',
    strokes: [
      {
        order: 0,
        // C body centerline above, scaled into the taller (cedilla) box.
        path:
          'M1.000 0.136 L0.960 0.120 L0.920 0.110 L0.880 0.099 L0.840 0.089 ' +
          'L0.800 0.083 L0.760 0.078 L0.720 0.076 L0.680 0.076 L0.640 0.073 ' +
          'L0.600 0.073 L0.560 0.076 L0.520 0.081 L0.480 0.085 L0.440 0.092 ' +
          'L0.400 0.099 L0.360 0.113 L0.320 0.124 L0.300 0.202 L0.260 0.242 ' +
          'L0.200 0.298 L0.140 0.355 L0.080 0.395 L0.040 0.403 L0.080 0.411 ' +
          'L0.140 0.451 L0.200 0.508 L0.260 0.564 L0.300 0.604 L0.320 0.682 ' +
          'L0.360 0.693 L0.400 0.707 L0.440 0.714 L0.480 0.721 L0.520 0.725 ' +
          'L0.560 0.728 L0.600 0.730 L0.640 0.733 L0.680 0.733 L0.720 0.730 ' +
          'L0.760 0.730 L0.800 0.728 L0.840 0.723 L0.880 0.714 L0.920 0.700 ' +
          'L0.960 0.682 L1.000 0.670',
        direction: 'end',
      },
      { order: 1, path: 'M0.66 0.815 L0.69 0.840 L0.71 0.865 L0.72 0.880 L0.70 0.905 L0.64 0.925 L0.60 0.950 L0.58 0.975 L0.57 1.000', direction: 'end' }, // cedilla (last)
    ],
  },
  D: {
    glyph: 'D',
    strokes: [
      { order: 0, path: 'M0.19 0.05 L0.19 0.95', direction: 'end' },        // stem
      {
        order: 1,
        path: 'M0.19 0.05 L0.42 0.04 L0.70 0.11 L0.88 0.32 L0.92 0.54 L0.86 0.76 L0.66 0.90 L0.40 0.96 L0.19 0.95',
        direction: 'end',
      },                                                                     // bowl
    ],
  },
  E: {
    glyph: 'E',
    strokes: [
      { order: 0, path: 'M0.13 0.05 L0.13 0.94', direction: 'end' },        // stem
      { order: 1, path: 'M0.13 0.07 L0.93 0.07', direction: 'end' },        // top bar
      { order: 2, path: 'M0.13 0.46 L0.86 0.46', direction: 'end' },        // mid bar
      { order: 3, path: 'M0.13 0.90 L0.92 0.90', direction: 'end' },        // bottom bar
    ],
  },
  Ê: {
    glyph: 'Ê',
    strokes: [
      { order: 0, path: 'M0.13 0.28 L0.13 0.97', direction: 'end' },        // stem
      { order: 1, path: 'M0.13 0.30 L0.93 0.30', direction: 'end' },        // top bar
      { order: 2, path: 'M0.13 0.62 L0.86 0.62', direction: 'end' },        // mid bar
      { order: 3, path: 'M0.13 0.94 L0.92 0.94', direction: 'end' },        // bottom bar
      { order: 4, path: 'M0.50 0.04 L0.37 0.11', direction: 'end' },        // circumflex left
      { order: 5, path: 'M0.50 0.04 L0.63 0.11', direction: 'end' },        // circumflex right
    ],
  },
  F: {
    glyph: 'F',
    strokes: [
      { order: 0, path: 'M0.13 0.05 L0.13 0.95', direction: 'end' },        // stem
      { order: 1, path: 'M0.13 0.07 L0.92 0.07', direction: 'end' },        // top bar
      { order: 2, path: 'M0.13 0.47 L0.82 0.47', direction: 'end' },        // mid bar
    ],
  },
  G: {
    glyph: 'G',
    strokes: [
      {
        order: 0,
        // Closed centerline ring, "Magic C keep-on-going" (HWT): start at the
        // TOP and travel counterclockwise (left, down, along the bottom, up the
        // right), closing at the start. The nose bar is the final separate
        // stroke (HWT: "little line across", drawn left → right).
        path:
          'M0.472 0.091 L0.336 0.125 L0.220 0.205 L0.138 0.320 L0.100 0.457 ' +
          'L0.109 0.599 L0.166 0.729 L0.263 0.832 L0.389 0.894 L0.528 0.909 ' +
          'L0.664 0.875 L0.780 0.795 L0.862 0.680 L0.900 0.543 L0.891 0.401 ' +
          'L0.834 0.271 L0.737 0.168 L0.611 0.106 L0.472 0.091',
        direction: 'end',
      },
      { order: 1, path: 'M0.600 0.520 L0.900 0.520', direction: 'end' },     // nose bar (last, left→right)
    ],
  },
  H: {
    glyph: 'H',
    strokes: [
      { order: 0, path: 'M0.13 0.05 L0.13 0.95', direction: 'end' },
      { order: 1, path: 'M0.87 0.05 L0.87 0.95', direction: 'end' },
      { order: 2, path: 'M0.13 0.50 L0.87 0.50', direction: 'end' },
    ],
  },
  I: {
    glyph: 'I',
    strokes: [
      { order: 0, path: 'M0.50 0.10 L0.50 0.90', direction: 'end' },
      { order: 1, path: 'M0.06 0.10 L0.94 0.10', direction: 'end' },
      { order: 2, path: 'M0.06 0.90 L0.94 0.90', direction: 'end' },
    ],
  },
  Î: {
    glyph: 'Î',
    strokes: [
      { order: 0, path: 'M0.50 0.28 L0.50 0.96', direction: 'end' },
      { order: 1, path: 'M0.25 0.24 L0.75 0.24', direction: 'end' },
      { order: 2, path: 'M0.25 0.995 L0.75 0.995', direction: 'end' },
      { order: 3, path: 'M0.50 0.01 L0.05 0.135', direction: 'end' },
      { order: 4, path: 'M0.50 0.01 L0.95 0.135', direction: 'end' },
    ],
  },
  J: {
    glyph: 'J',
    strokes: [
      {
        order: 0,
        path:
          'M0.800 0.050 L0.800 0.660 L0.800 0.740 L0.660 0.800 L0.500 0.860 ' +
          'L0.340 0.910 L0.210 0.945 L0.120 0.970',
        direction: 'end',
      },
    ],
  },
  K: {
    glyph: 'K',
    strokes: [
      { order: 0, path: 'M0.14 0.05 L0.14 0.95', direction: 'end' },        // stem (top→bottom)
      { order: 1, path: 'M0.86 0.05 L0.16 0.48', direction: 'end' },        // upper arm (lands on the stem; HWT "kick")
      { order: 2, path: 'M0.34 0.48 L0.90 0.95', direction: 'end' },        // lower arm (from the arm/stem junction; HWT "slide away")
    ],
  },
  L: {
    glyph: 'L',
    strokes: [
      { order: 0, path: 'M0.185 0.050 L0.185 0.900', direction: 'end' },    // stem (center)
      { order: 1, path: 'M0.185 0.905 L0.955 0.905', direction: 'end' },    // base
    ],
  },
  M: {
    glyph: 'M',
    strokes: [
      { order: 0, path: 'M0.11 0.05 L0.11 0.95', direction: 'end' },
      { order: 1, path: 'M0.11 0.05 L0.50 0.55 L0.89 0.05', direction: 'end' },
      { order: 2, path: 'M0.89 0.05 L0.89 0.95', direction: 'end' },
    ],
  },
  N: {
    glyph: 'N',
    strokes: [
      { order: 0, path: 'M0.11 0.05 L0.11 0.95', direction: 'end' },
      { order: 1, path: 'M0.11 0.05 L0.89 0.95', direction: 'end' },
      { order: 2, path: 'M0.89 0.05 L0.89 0.95', direction: 'end' },
    ],
  },
  O: {
    glyph: 'O',
    strokes: [
      {
        order: 0,
        // Closed centerline ring, "Magic C keep-on-going": start at the top,
        // travel LEFT (counterclockwise), down, along the bottom, up the right
        // and close at the start. Matches the HWT convention (start at top,
        // CCW); the same direction strokeOrder.ts already teaches.
        path:
          'M0.500 0.094 L0.421 0.102 L0.345 0.125 L0.275 0.162 L0.213 0.213 ' +
          'L0.163 0.274 L0.126 0.345 L0.103 0.421 L0.095 0.500 L0.103 0.579 ' +
          'L0.126 0.655 L0.163 0.726 L0.213 0.787 L0.275 0.838 L0.345 0.875 ' +
          'L0.421 0.898 L0.500 0.906 L0.579 0.898 L0.655 0.875 L0.725 0.838 ' +
          'L0.787 0.787 L0.837 0.726 L0.874 0.655 L0.897 0.579 L0.905 0.500 ' +
          'L0.897 0.421 L0.874 0.345 L0.837 0.274 L0.787 0.213 L0.725 0.162 ' +
          'L0.655 0.125 L0.579 0.102 L0.500 0.094',
        direction: 'end',
      },
    ],
  },
  P: {
    glyph: 'P',
    strokes: [
      { order: 0, path: 'M0.19 0.05 L0.19 0.95', direction: 'end' },
      {
        order: 1,
        path: 'M0.19 0.05 L0.55 0.06 L0.85 0.22 L0.90 0.42 L0.68 0.51 L0.19 0.51',
        direction: 'end',
      },
    ],
  },
  Q: {
    glyph: 'Q',
    strokes: [
      {
        order: 0,
        // Closed centerline ring in the body box (top ~175px of the taller
        // cedilla-style box), "Magic C keep-on-going": start at the top and
        // travel counterclockwise, close at the start. Tail is a separate
        // final stroke (HWT: "…stop, little line slides down").
        path:
          'M0.500 0.080 L0.421 0.087 L0.345 0.106 L0.275 0.138 L0.213 0.182 ' +
          'L0.163 0.234 L0.126 0.294 L0.103 0.359 L0.095 0.427 L0.103 0.494 ' +
          'L0.126 0.560 L0.163 0.620 L0.213 0.672 L0.275 0.715 L0.345 0.747 ' +
          'L0.421 0.767 L0.500 0.774 L0.579 0.767 L0.655 0.747 L0.725 0.715 ' +
          'L0.787 0.672 L0.837 0.620 L0.874 0.560 L0.897 0.494 L0.905 0.427 ' +
          'L0.897 0.359 L0.874 0.294 L0.837 0.234 L0.787 0.182 L0.725 0.138 ' +
          'L0.655 0.106 L0.579 0.087 L0.500 0.080',
        direction: 'end',
      },
      { order: 1, path: 'M0.640 0.740 L0.720 0.830 L0.790 0.910 L0.860 0.980', direction: 'end' }, // tail (last)
    ],
  },
  R: {
    glyph: 'R',
    strokes: [
      { order: 0, path: 'M0.19 0.05 L0.19 0.95', direction: 'end' },
      {
        order: 1,
        path: 'M0.19 0.05 L0.55 0.06 L0.85 0.22 L0.90 0.42 L0.68 0.51 L0.19 0.51',
        direction: 'end',
      },
      { order: 2, path: 'M0.46 0.51 L0.90 0.95', direction: 'end' },
    ],
  },
  S: {
    glyph: 'S',
    strokes: [
      {
        order: 0,
        path:
          'M0.820 0.130 L0.550 0.050 L0.280 0.060 L0.130 0.140 L0.090 0.260 ' +
          'L0.120 0.370 L0.220 0.450 L0.420 0.500 L0.620 0.550 L0.750 0.620 ' +
          'L0.800 0.740 L0.750 0.860 L0.580 0.950 L0.340 0.940 L0.190 0.870 ' +
          'L0.150 0.720',
        direction: 'end',
      },
    ],
  },
  Ş: {
    glyph: 'Ş',
    strokes: [
      {
        order: 0,
        // S body centerline scaled into the taller (cedilla) box.
        path:
          'M0.820 0.105 L0.550 0.040 L0.280 0.048 L0.130 0.113 L0.090 0.210 ' +
          'L0.120 0.298 L0.220 0.363 L0.420 0.403 L0.620 0.444 L0.750 0.500 ' +
          'L0.800 0.597 L0.750 0.694 L0.580 0.766 L0.340 0.758 L0.190 0.702 ' +
          'L0.150 0.581',
        direction: 'end',
      },
      { order: 1, path: 'M0.50 0.755 L0.35 0.960 L0.22 0.945', direction: 'end' }, // cedilla (last)
    ],
  },
  T: {
    glyph: 'T',
    strokes: [
      { order: 0, path: 'M0.06 0.06 L0.94 0.06', direction: 'end' },
      { order: 1, path: 'M0.50 0.06 L0.50 0.94', direction: 'end' },
    ],
  },
  U: {
    glyph: 'U',
    strokes: [
      { order: 0, path: 'M0.16 0.03 L0.16 0.70 L0.27 0.88 L0.45 0.96', direction: 'end' },
      { order: 1, path: 'M0.84 0.03 L0.84 0.70 L0.73 0.88 L0.55 0.96', direction: 'end' },
    ],
  },
  Û: {
    glyph: 'Û',
    strokes: [
      { order: 0, path: 'M0.16 0.28 L0.16 0.72 L0.27 0.89 L0.45 0.96', direction: 'end' },
      { order: 1, path: 'M0.84 0.28 L0.84 0.72 L0.73 0.89 L0.55 0.96', direction: 'end' },
      { order: 2, path: 'M0.50 0.02 L0.37 0.09', direction: 'end' },
      { order: 3, path: 'M0.50 0.02 L0.63 0.10', direction: 'end' },
    ],
  },
  V: {
    glyph: 'V',
    strokes: [{ order: 0, path: 'M0.11 0.05 L0.50 0.95 L0.89 0.05', direction: 'end' }],
  },
  W: {
    glyph: 'W',
    strokes: [
      {
        order: 0,
        path: 'M0.050 0.140 L0.280 0.840 L0.500 0.140 L0.720 0.840 L0.950 0.140',
        direction: 'end',
      },
    ],
  },
  X: {
    glyph: 'X',
    strokes: [
      { order: 0, path: 'M0.12 0.05 L0.88 0.95', direction: 'end' },
      { order: 1, path: 'M0.88 0.05 L0.12 0.95', direction: 'end' },
    ],
  },
  Y: {
    glyph: 'Y',
    strokes: [
      { order: 0, path: 'M0.12 0.05 L0.50 0.48', direction: 'end' },
      { order: 1, path: 'M0.88 0.05 L0.50 0.48', direction: 'end' },
      { order: 2, path: 'M0.50 0.48 L0.50 0.95', direction: 'end' },
    ],
  },
  Z: {
    glyph: 'Z',
    strokes: [
      { order: 0, path: 'M0.08 0.06 L0.92 0.06', direction: 'end' },
      { order: 1, path: 'M0.92 0.06 L0.08 0.94', direction: 'end' },
      { order: 2, path: 'M0.08 0.94 L0.92 0.94', direction: 'end' },
    ],
  },
} satisfies Record<string, GlyphStrokePlan>;

/** Which glyphs the lesson can demonstrate/trace (all 31). */
export const LESSON_GLYPHS: string[] = Object.keys(LETTER_STROKES);

/**
 * Explicit development-time readiness for every letter's stroke plan. This is
 * the guard against "silently shipping an unfinished letter" (Constraint 2):
 *
 *   • `draft`    — the glyph has an authored plan to render/demo, but its
 *                  handwriting semantics (start point, stroke order, direction,
 *                  segmentation, end point) have NOT yet been reviewed for
 *                  teaching correctness. The lesson must not present these as
 *                  finished. (Also used as the bound for a MISSING plan.)
 *   • `verified`  — the plan's geometry has been proved against the rendered
 *                  glyph mask (precision + centerline recall) by
 *                  audit/tools/letter-strokes-verify.mjs.
 *   • `ready`     — `verified` AND its handwriting semantics have been
 *                  reviewed against a standard print-formation reference
 *                  (Handwriting Without Tears: "all start at the top", O/Q/G =
 *                  "Magic C keep on going" counterclockwise, diacritics last).
 *                  Only `ready` letters are production-complete lessons.
 *
 * `verified` is exact — it must match the verifier's raster proof so it cannot
 * silently drift from the geometry gate. `ready` is a strictly-higher human
 * bar that the structural tests ALSO enforce (they re-derive start/order/
 * direction/segmentation from the data itself).
 */
export type LetterReadiness = 'draft' | 'verified' | 'ready';

export const LETTER_GEOMETRY_VERIFIED: ReadonlySet<string> = new Set([
  'A', 'B', 'C', 'Ç', 'D', 'E', 'Ê', 'F', 'G', 'H', 'I', 'Î', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'Ş', 'T', 'U', 'Û', 'V', 'W', 'X', 'Y', 'Z',
]);

export const LETTER_HANDWRITING_READY: ReadonlySet<string> = new Set([
  'A', 'B', 'C', 'Ç', 'D', 'E', 'Ê', 'F', 'G', 'H', 'I', 'Î', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'Ş', 'T', 'U', 'Û', 'V', 'W', 'X', 'Y', 'Z',
]);

/** Readiness for a glyph, defaulting to `draft` for any unlisted glyph. */
export function getLetterReadiness(glyph: string): LetterReadiness {
  if (LETTER_HANDWRITING_READY.has(glyph)) return 'ready';
  if (LETTER_GEOMETRY_VERIFIED.has(glyph)) return 'verified';
  return 'draft';
}

/** Glyph → readiness map, computed once (the derived truth used by the UI). */
export const LETTER_READINESS: Readonly<Record<string, LetterReadiness>> =
  Object.freeze(Object.fromEntries(LESSON_GLYPHS.map((g) => [g, getLetterReadiness(g)])));

/** Look up a glyph's stroke plan (undefined → the caller degrades gracefully). */
export function getLetterStrokes(glyph: string): GlyphStrokePlan | undefined {
  return LETTER_STROKES[glyph];
}

/**
 * Map a plan's normalised (0..1) stroke polylines into the glyph's pixel space,
 * exactly as the demo overlay does, so the guide, validation and scoring all
 * share one coordinate frame.
 */
export function letterStrokesToPx(
  plan: GlyphStrokePlan | undefined,
  bbox: GlyphPixelBounds,
): TracePoint[][] {
  if (!plan) return [];
  return plan.strokes.map((s) =>
    parseStrokePath(s.path).map((p) => ({
      x: bbox.minC + p.x * (bbox.w || 1),
      y: bbox.minR + p.y * (bbox.h || 1),
    })),
  );
}

/**
 * Structural sanity check used by the test suite and defensive callers: every
 * stroke parses to a non-empty polyline whose coordinates live inside (a small
 * tolerance around) the nominal 0..1 box, and `order` is the expected index.
 */
export function isUsableStrokePlan(plan: GlyphStrokePlan | undefined): boolean {
  if (!plan || !plan.glyph || !Array.isArray(plan.strokes) || plan.strokes.length === 0) {
    return false;
  }
  return plan.strokes.every((s, i) => {
    const pts = parseStrokePath(s.path);
    if (pts.length === 0) return false;
    if (s.order !== i) return false;
    return pts.every((p) => IN(p.x) && IN(p.y));
  });
}

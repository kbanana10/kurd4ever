/**
 * traceLetters.ts
 *
 * Pixel-coverage helpers for the Writing (Nivîsîn) tracing feature. We have no
 * AI behind the "Check" button, so validation works the honest way: render the
 * target glyph into an offscreen canvas to build an alpha mask, then compare
 * the learner's strokes (rasterised into a second mask) against it.
 *
 * Validation has two tiers (see constants below):
 *   • global  — coverage (fraction of glyph pixels covered) and outOfBounds
 *               (fraction of ink outside the glyph, within the traced region)
 *   • zones   — the glyph's bounding box is split into a grid; every non-empty
 *               zone must individually reach a lower coverage floor. This is
 *               what catches "close enough" strokes that skip a whole feature
 *               (e.g. the middle bar of an E).
 *
 * Coverage is measured with a distance tolerance: the learner draws a THIN
 * stroke (≈14px brush) but the guide is a THICK (900-weight) letter, so a
 * pixel-correct fill is impossible by hand. The drawn ink mask is dilated by
 * COVERAGE_TOLERANCE_PX before comparison — a drawn pixel "covers" every
 * target pixel within that radius, exactly how a pencil sliding down the
 * letter's centerline should count.
 *
 * Pass ⇔ coverage ≥ OVERALL_COVERAGE_MIN AND outOfBounds ≤ OUT_OF_BOUNDS_MAX
 *        AND every non-empty zone ≥ ZONE_COVERAGE_MIN — EXCEPT for the
 *        near-miss branch: a trace that covers every zone above
 *        ZONE_COVERAGE_FLOOR and whose mean zone coverage reaches
 *        ZONE_COVERAGE_MEAN_MIN also passes its zones (see evaluateZones, C8).
 *
 * Glyphs are placed inside normalized "boxes" (0..1 over the surface) so the
 * same routines serve both single letters (one full-height box) and word
 * tracing (one small box per letter, side by side).
 */

/** Length of one side of the tracing surface AND the offscreen mask canvases. */
export const TRACE_CANVAS = 320;
/** Only strokes whose falloff alpha meets this bar count as "ink". */
export const STROKE_ALPHA_THRESHOLD = 64;
/**
 * Distance tolerance (analysis px, i.e. 3/4 of a device px) for counting a
 * target pixel as covered: the learner's thin stroke is dilated by this radius
 * before comparison. Chosen so a brush-stroke centerline (ink peak width ~
 * BRUSH_WIDTH % of the canvas ≈ 14px) plus tolerance (2·4px) spans a 900-weight
 * letter's stroke thickness without forgiving a genuinely missing feature.
 * 4px is the tightest value at which the perfect-trace self-test still passes
 * every letter (3px trips M's diagonal leg zone: min-zone 36.1% < 40% floor).
 */
export const COVERAGE_TOLERANCE_PX = 4;
/**
 * Radius (analysis px) by which in-bounds ink is dilated when computing the
 * out-of-bounds fraction. A tight allowance lets honest overhang (the natural
 * width of a stroke hugging the guide's edge, plus the tolerance halo) pass
 * without counting legitimately stray scribbles as clean.
 */
export const BOUNDS_TOLERANCE_PX = 2;
/**
 * Erosion depth for the dev-mode perfect-trace self-test: it synthesises a
 * thin (~5px) centerline that, WITHOUT the coverage tolerance, would fall
 * below OVERALL_COVERAGE_MIN (e.g. E drops to ~58% exact coverage), so a
 * tolerance regression trips the check. With COVERAGE_TOLERANCE_PX intact the
 * same trace reaches ~88%+ (at 4px: I 72.7 / E 72.7 / O 83.7 / M 77.3 /
 * W 77.6, all zones ≥40%) and passes.
 */
export const SELF_TEST_PERFECT_TRACE_ERODE = 9;

/** Minimum per-zone coverage (fraction of the zone's glyph pixels covered). */
export const ZONE_COVERAGE_MIN = 0.4;
/**
 * C8 (realism) near-miss branch — a SECOND check layer, not a loosening of
 * ZONE_COVERAGE_MIN above. A correct human trace always hugs the guide, yet
 * the 4×4 zone grid still carves out brittle cells whose glyph pixels are
 * almost all "edge" pixels (diacritic crowns, terminal corner caps) that a
 * wobbling brush under- or over-shoots by a pixel or two. Requiring every such
 * cell to clear 40% rejects correct traces that are clean everywhere else.
 *
 * This branch has two parts:
 *   • ZONE_COVERAGE_FLOOR (a hard floor, still per zone): a zone below this is
 *     a WHOLESALE miss — a genuinely skipped feature (e.g. an E's middle bar
 *     whose cells drop to ~0%) must still fail even if stronger zones pull the
 *     mean up. 0.2 sits far below any fragile crown/cap cell (lowest observed
 *     37.8%) and far above a blank feature (0%).
 *   • ZONE_COVERAGE_MEAN_MIN (a shape-wide mean): only a trace whose zone
 *     coverage is solid across the whole letter — not just the south cells —
 *     may pass with one or two fragile cells below 40% but above the floor.
 *
 * Effect verified in audit/tools/realism-trace.mjs + calibrate-trace.mjs: at
 * tolerance 4, GOOD 31/31, AVERAGE 31/31 (Û fixed: 37.8% crown cell but 86.4%
 * mean), RUSHED unchanged (28/31 pass, ≥75% threshold holds); E/H minus their
 * bar still FAIL (bar cells ~0% < floor); perfect-trace self-test still passes.
 */
export const ZONE_COVERAGE_FLOOR = 0.2;
export const ZONE_COVERAGE_MEAN_MIN = 0.6;
/** Minimum overall glyph coverage required to pass. */
export const OVERALL_COVERAGE_MIN = 0.6;
/** Maximum fraction of ink allowed outside the glyph (within the region). */
export const OUT_OF_BOUNDS_MAX = 0.3;
/** Default zone grid dimension (3 → a 3×3 grid of 9 zones). */
export const ZONE_GRID = 3;
/** Coarsen the grid when a cell would drop below this many pixels. */
export const ZONE_MIN_DIMENSION = 4;
/** Skip zones with fewer glyph pixels than this (noise-proofing). */
export const ZONE_MIN_PIXELS = 20;

/** How many rows × columns to split a glyph's bounding box into. */
export interface ZoneGridConfig {
  rows: number;
  cols: number;
}

/**
 * Manual per-letter zone overrides. Different letter shapes want different
 * grids: narrow strokes get a single column (tall zones), broad/diagonal
 * letters get more columns so each feature (arms, legs, strokes) falls in its
 * own zone. Keys are the glyph as traced (uppercase).
 */
const ZONE_CONFIG = {
  // Narrow letters → one column × four rows.
  I: { rows: 4, cols: 1 },
  l: { rows: 4, cols: 1 },
  i: { rows: 4, cols: 1 },
  j: { rows: 4, cols: 1 },
  '1': { rows: 4, cols: 1 },
  // Wide / complex letters → 4×4.
  M: { rows: 4, cols: 4 },
  W: { rows: 4, cols: 4 },
  m: { rows: 4, cols: 4 },
  w: { rows: 4, cols: 4 },
  N: { rows: 4, cols: 4 },
  Z: { rows: 4, cols: 4 },
  K: { rows: 4, cols: 4 },
  X: { rows: 4, cols: 4 },
} satisfies Record<string, ZoneGridConfig>;

/**
 * Pick the zone grid for a glyph: a manual override when the letter is known,
 * otherwise an aspect-ratio heuristic on the glyph's bounding box, otherwise
 * the default ZONE_GRID×ZONE_GRID. Very small glyphs are coarsened so no cell
 * falls below ZONE_MIN_DIMENSION pixels.
 */
function resolveZoneGrid(
  glyph: string | undefined,
  boundingWidth: number,
  boundingHeight: number,
): ZoneGridConfig {
  let config: ZoneGridConfig;
  const override = glyph ? ZONE_CONFIG[glyph] : undefined;
  if (override) {
    config = override;
  } else {
    const ratio = boundingWidth / Math.max(1, boundingHeight);
    if (ratio < 0.4) config = { rows: 3, cols: 1 }; // tall & narrow
    else if (ratio > 1.5) config = { rows: 3, cols: 4 }; // short & wide
    else config = { rows: ZONE_GRID, cols: ZONE_GRID };
  }

  // Coarsen any grid whose cells would be sub-pixel (tiny glyphs). A single
  // column is left alone — that is already the narrowest sensible split.
  let { rows, cols } = config;
  while (
    rows > 1 &&
    cols > 1 &&
    (boundingHeight / rows < ZONE_MIN_DIMENSION || boundingWidth / cols < ZONE_MIN_DIMENSION)
  ) {
    rows -= 1;
    cols -= 1;
  }
  return { rows, cols };
}

/** A normalized (0..1) rectangle inside the trace surface. */
export interface TraceBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Standard resting box for a single traced letter. */
export const SINGLE_BOX: TraceBox = { left: 0.09, top: 0.09, right: 0.91, bottom: 0.91 };

/** The whole surface — used as a fallback target/region. */
export const FULL_BOX: TraceBox = { left: 0, top: 0, right: 1, bottom: 1 };

/** Why a trace failed — the UI maps this to a plain-language hint. */
export type TraceFailureReason = 'coverage' | 'bounds' | 'zone' | 'empty';

/** Per-zone evaluation result. */
export interface TraceZone {
  row: number;
  col: number;
  /** Glyph pixels that live in this zone. */
  targetPixels: number;
  /** Glyph pixels in this zone that the learner inked. */
  coveredPixels: number;
  /** coveredPixels / targetPixels (0 for empty/skipped zones). */
  coverage: number;
  /** True if the zone reaches the floor, is empty, or is below the skip size. */
  passed: boolean;
}

export interface TraceResult {
  passed: boolean;
  /** Overall coverage (0..1). */
  coverage: number;
  /** Overall out-of-bounds fraction (0..1). */
  outOfBounds: number;
  reason: TraceFailureReason;
  zones: TraceZone[];
  /**
   * Miss-mask (TRACE_CANVAS²): 0 = nothing, 2 = a glyph pixel the learner
   * still needs to cover, marked ONLY inside zones that failed. An all-pass
   * result carries an all-zero mask, so callers can paint it unconditionally.
   */
  miss: Uint8ClampedArray;
}

/** A miss-mask cell that marks a still-missing target pixel (painted red). */
export const MISS_TARGET = 2;

/** One self-test verdict for the dev-mode perfect-trace smoke check. */
export interface TraceSelfTestResult {
  char: string;
  passed: boolean;
  coverage: number;
  zoneCoverage: number[];
  missPixels: number;
}

/**
 * DEV-ONLY regression check (requirement: catch tolerance regressions
 * automatically). Simulates a *perfect* trace by laying a thin stroke down the
 * glyph's own skeleton (erodeMask), then runs it through evaluateTrace. A
 * correct tolerance pipeline must pass every letter; anything else means the
 * thick-guide / thin-stroke mismatch has regressed. Call it once, after the
 * guide has rendered, guarded by `import.meta.env.DEV`.
 */
export function runTraceSelfTest(chars: string[] = ['I', 'E', 'O', 'M', 'W']): TraceSelfTestResult[] {
  const results: TraceSelfTestResult[] = [];
  for (const raw of chars) {
    const char = raw.toUpperCase();
    const mask = buildLetterMask(char);
    // A small-radius centerline, then widened to a realistic brush width —
    // this is the honest "perfect trace" a careful finger produces (a thin
    // line down the middle of each stroke, NOT a solid fill).
    const ink = erodeMask(mask, TRACE_CANVAS, SELF_TEST_PERFECT_TRACE_ERODE);
    const traced = evaluateTrace(mask, ink, FULL_BOX, char);
    const missPixels = countMaskPixels(traced.miss, MISS_TARGET);
    results.push({
      char,
      passed: traced.passed,
      coverage: traced.coverage,
      zoneCoverage: traced.zones.map(z => z.coverage),
      missPixels,
    });
  }
  return results;
}

/** A neutral, not-yet-checked result — safe to store in state. */
export function emptyTraceResult(): TraceResult {
  return {
    passed: false,
    coverage: 0,
    outOfBounds: 0,
    reason: 'empty',
    zones: [],
    miss: new Uint8ClampedArray(TRACE_CANVAS * TRACE_CANVAS),
  };
}

/**
 * The single font used to draw a glyph inside a box, everywhere (guide canvas
 * and offscreen mask). Sharing it guarantees the evaluation samples the exact
 * same letter shape the learner sees.
 */
export function glyphFontForBox(box: TraceBox): string {
  const w = Math.max(0, box.right - box.left);
  const h = Math.max(0, box.bottom - box.top);
  const px = Math.max(8, Math.round(TRACE_CANVAS * Math.min(w, h) * 0.88));
  return `900 ${px}px "Noto Sans", "Arial", sans-serif`;
}

/** Draw one glyph centered inside its box, ready for either display or masking. */
export function drawGlyphInBox(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  box: TraceBox,
  fillStyle: string,
): void {
  const cx = ((box.left + box.right) / 2) * TRACE_CANVAS;
  const cy = ((box.top + box.bottom) / 2) * TRACE_CANVAS;
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = glyphFontForBox(box);
  ctx.fillText(glyph, cx, cy);
  ctx.restore();
}

/**
 * The single glyph renderer used by BOTH the visible guide canvas and the
 * offscreen mask. There is exactly one font config + placement here, so the
 * mask geometry can never drift from what the learner sees (same font, same
 * weight, same baseline, same box).
 */
export function renderGlyph(
  glyph: string,
  box: TraceBox = FULL_BOX,
  fillStyle = '#000000',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TRACE_CANVAS;
  canvas.height = TRACE_CANVAS;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  drawGlyphInBox(ctx, glyph, box, fillStyle);
  return canvas;
}

/** Count set pixels in a boolean mask (diagnostics / self-test). */
export function countMaskPixels(mask: Uint8ClampedArray, value = 1): number {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === value) count += 1;
  }
  return count;
}

/** 4-neighbour binary mask erosion (shrinks the silhouette into its skeleton). */
function erodeMask(mask: Uint8ClampedArray, size: number, radius: number): Uint8ClampedArray {
  const n = size * size;
  const out = new Uint8ClampedArray(n);
  if (radius <= 0) {
    for (let i = 0; i < n; i += 1) out[i] = mask[i];
    return out;
  }

  // Erosion keeps a silhouette pixel only when it is MORE than `radius` away
  // from the nearest background pixel. Sources are therefore the BACKGROUND
  // (mask == 0), and the chamfer distance measures distance-to-background.
  const INF = 0x3fffffff;
  const dist = new Int32Array(n);
  for (let i = 0; i < n; i += 1) {
    dist[i] = mask[i] === 1 ? INF : 0;
  }

  // Two-pass chamfer distance (forward = top-left → bottom-right, backward =
  // bottom-right → top-left) approximates the Euclidean distance to the
  // nearest background pixel on the same grid the masks use.
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const i = r * size + c;
      if (r > 0) dist[i] = Math.min(dist[i], dist[i - size] + 1);
      if (c > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
    }
  }
  for (let r = size - 1; r >= 0; r -= 1) {
    for (let c = size - 1; c >= 0; c -= 1) {
      const i = r * size + c;
      if (r < size - 1) dist[i] = Math.min(dist[i], dist[i + size] + 1);
      if (c < size - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
    }
  }

  for (let i = 0; i < n; i += 1) {
    if (mask[i] === 1 && dist[i] > radius) out[i] = 1;
  }
  return out;
}

/**
 * Coverage lookup: a target pixel counts as covered when any ink pixel sits
 * within `radius` (the tolerate/dilate distance). A single row-major radius
 * window scan turns the O(n·r²) per-pixel proximity test into O(n·r).
 */
function buildInkCoverLookup(
  ink: Uint8ClampedArray,
  size: number,
  radius: number,
): Uint8ClampedArray {
  const n = size * size;
  const cover = new Uint8ClampedArray(n);
  if (radius <= 0) {
    // No tolerance: coverage is exact. Copy ink for the shared API.
    for (let i = 0; i < n; i += 1) {
      if (ink[i] === 1) cover[i] = 1;
    }
    return cover;
  }

  let rowCover: Uint8ClampedArray;
  rowCover = new Uint8ClampedArray(n);
  for (let r = 0; r < size; r += 1) {
    let run = 0;
    for (let c = 0; c < size + radius; c += 1) {
      if (c < size && ink[r * size + c] === 1) run += 1;
      let oldest;
      if (c >= 2 * radius + 1) {
        oldest = c - (2 * radius + 1);
        if (oldest < size && ink[r * size + oldest] === 1) run -= 1;
      }
      let center;
      if (c >= radius) {
        center = c - radius;
        if (center < size && run > 0) rowCover[r * size + center] = 1;
      }
    }
  }
  for (let c = 0; c < size; c += 1) {
    let run = 0;
    for (let r = 0; r < size + radius; r += 1) {
      if (r < size && rowCover[r * size + c] === 1) run += 1;
      if (r >= 2 * radius + 1) {
        const oldest = r - (2 * radius + 1);
        if (oldest < size && rowCover[oldest * size + c] === 1) run -= 1;
      }
      if (r >= radius) {
        const center = r - radius;
        if (center < size && run > 0) cover[center * size + c] = 1;
      }
    }
  }
  return cover;
}


/**
 * Build a glyph target mask: an offscreen canvas where `1` marks pixels that
 * belong to the (eroded) glyph silhouette. The erosion thins the 900-weight
 * guide to its skeleton so that laying a stroke down the letter's centerline —
 * then hitting it with the coverage tolerance — reproduces the letter shape.
 *
 * The alpha cutoff is deliberately low (> 0) so partially-covered anti-aliased
 * edge pixels count as target, which is what lets a thin stroke cover the full
 * glyph without needing pixel-perfect placement.
 */
export function buildGlyphMask(glyph: string, box: TraceBox = FULL_BOX): Uint8ClampedArray {
  const n = TRACE_CANVAS * TRACE_CANVAS;
  const rendered = renderGlyph(glyph, box, '#000000');
  const rctx = rendered.getContext('2d', { willReadFrequently: true });
  if (!rctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  const ralpha = rctx.getImageData(0, 0, TRACE_CANVAS, TRACE_CANVAS).data;
  const mask = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i += 1) {
    // Full silhouette at a permissive cutoff: every anti-aliased edge pixel
    // (alpha > 0) counts as target, so the thin learner stroke + coverage
    // tolerance can reproduce the shape without touching every interior px.
    mask[i] = ralpha[i * 4 + 3] > 0 ? 1 : 0;
  }
  return mask;
}

/** Target mask for the single-letter tracing page (one full-height box). */
export function buildLetterMask(char: string): Uint8ClampedArray {
  return buildGlyphMask(char, SINGLE_BOX);
}

/**
 * Rasterise the learner's strokes (a falloff-alpha drawing) into a boolean ink
 * mask using the same sampling grid as `buildGlyphMask`. The canvas handle
 * exposes the strokes-only layer (the guide lives on a separate canvas), so
 * this mask carries exactly what the learner drew, at exactly the offset they
 * drew it — no cross-layer contamination to strip.
 */
export function buildStrokesMask(strokes: HTMLCanvasElement | null): Uint8ClampedArray {
  const n = TRACE_CANVAS * TRACE_CANVAS;
  const ink = new Uint8ClampedArray(n);
  if (!strokes) return ink;

  const src = document.createElement('canvas');
  src.width = TRACE_CANVAS;
  src.height = TRACE_CANVAS;
  const srcCtx = src.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) {
    throw new Error('Canvas 2D context unavailable');
  }
  srcCtx.drawImage(strokes, 0, 0, TRACE_CANVAS, TRACE_CANVAS);
  const data = srcCtx.getImageData(0, 0, TRACE_CANVAS, TRACE_CANVAS).data;
  for (let i = 0; i < n; i += 1) {
    if (data[i * 4 + 3] > STROKE_ALPHA_THRESHOLD) ink[i] = 1;
  }
  return ink;
}

/** Bounding box (pixel-inclusive) of the glyph pixels in a mask. */
interface GlyphBounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

function glyphBounds(mask: Uint8ClampedArray, size: number): GlyphBounds | null {
  let minRow = size;
  let maxRow = -1;
  let minCol = size;
  let maxCol = -1;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (mask[r * size + c] === 1) {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }
  if (maxRow < minRow) return null;
  return { minRow, maxRow, minCol, maxCol };
}

/** Zone-partition result over a glyph's bounding box. */
interface ZoneEvaluation {
  zones: TraceZone[];
  allPassed: boolean;
  miss: Uint8ClampedArray;
}

/**
 * Split the glyph's bounding box into the resolved row×col zone grid and
 * require each non-empty zone to reach ZONE_COVERAGE_MIN. Coverage is checked
 * against the pre-computed tolerance lookup (a target pixel is covered when
 * any ink sits within COVERAGE_TOLERANCE_PX). The returned miss-mask marks —
 * ONLY in zones that failed — the still-uncovered glyph pixels, so the canvas
 * can guide the learner to exactly what to fix (and can never paint outside
 * the glyph).
 */
function evaluateZones(
  glyph: string | undefined,
  glyphMask: Uint8ClampedArray,
  cover: Uint8ClampedArray,
  size: number,
): ZoneEvaluation {
  const miss = new Uint8ClampedArray(size * size);
  const bounds = glyphBounds(glyphMask, size);
  if (!bounds) {
    return { zones: [], allPassed: false, miss: new Uint8ClampedArray(size * size) };
  }

  const width = bounds.maxCol - bounds.minCol + 1;
  const height = bounds.maxRow - bounds.minRow + 1;
  const { rows, cols } = resolveZoneGrid(glyph, width, height);

  const zones: TraceZone[] = [];
  let allPassed = true;

  for (let row = 0; row < rows; row += 1) {
    const r0 = bounds.minRow + Math.floor((row * height) / rows);
    const r1 = bounds.minRow + Math.floor(((row + 1) * height) / rows);
    for (let col = 0; col < cols; col += 1) {
      const c0 = bounds.minCol + Math.floor((col * width) / cols);
      const c1 = bounds.minCol + Math.floor(((col + 1) * width) / cols);

      let targetPixels = 0;
      let coveredPixels = 0;
      for (let r = r0; r < r1; r += 1) {
        for (let c = c0; c < c1; c += 1) {
          const i = r * size + c;
          if (glyphMask[i] === 1) {
            targetPixels += 1;
            if (cover[i] === 1) coveredPixels += 1;
          }
        }
      }

      const coverage = targetPixels > 0 ? coveredPixels / targetPixels : 0;
      // Empty zones and noise-level zones are irrelevant to the letter shape.
      // `passed` keeps the STRICT per-zone verdict (diagnostics); the C8
      // near-miss branch below may still clear the whole letter.
      const passed = targetPixels === 0 || targetPixels < ZONE_MIN_PIXELS || coverage >= ZONE_COVERAGE_MIN;
      zones.push({ row, col, targetPixels, coveredPixels, coverage, passed });
      if (targetPixels >= ZONE_MIN_PIXELS && coverage < ZONE_COVERAGE_MIN) {
        allPassed = false;
      }
    }
  }

  // C8 near-miss branch: correct human traces can dip one brittle cell below
  // ZONE_COVERAGE_MIN (crowns/corner caps) while the rest of the letter is
  // solid. Allow that ONLY when (a) every cell clears the hard floor (so a
  // genuinely skipped feature — whose cells fall to ~0% — still fails) and
  // (b) the mean zone coverage still proves the whole shape was traced.
  // Red highlights are only painted for hard misses (cells below the floor),
  // so an all-pass letter never shows stray red on a fragile crown.
  if (!allPassed) {
    const meaningful = zones.filter(
      (z) => z.targetPixels >= ZONE_MIN_PIXELS && z.coverage < ZONE_COVERAGE_MIN,
    );
    const noWholesaleMiss = meaningful.every((z) => z.coverage >= ZONE_COVERAGE_FLOOR);
    if (noWholesaleMiss) {
      const tracked = zones.filter((z) => z.targetPixels >= ZONE_MIN_PIXELS);
      if (tracked.length > 0) {
        const mean = tracked.reduce((sum, z) => sum + z.coverage, 0) / tracked.length;
        if (mean >= ZONE_COVERAGE_MEAN_MIN) allPassed = true;
      }
    }
    // Refill the miss mask only when the letter still fails, marking every
    // strict-fail zone's missed pixels red (same guidance as before the C8
    // branch). On a PASS the miss stays empty even if a near-miss zone (0.2–
    // 0.4) was granted — painting red on a pass would be confusing.
    if (!allPassed) {
      for (let row = 0; row < rows; row += 1) {
        const r0 = bounds.minRow + Math.floor((row * height) / rows);
        const r1 = bounds.minRow + Math.floor(((row + 1) * height) / rows);
        for (let col = 0; col < cols; col += 1) {
          const z = zones[row * cols + col];
          if (z.targetPixels >= ZONE_MIN_PIXELS && z.coverage < ZONE_COVERAGE_MIN) {
            const c0 = bounds.minCol + Math.floor((col * width) / cols);
            const c1 = bounds.minCol + Math.floor(((col + 1) * width) / cols);
            for (let r = r0; r < r1; r += 1) {
              for (let c = c0; c < c1; c += 1) {
                const i = r * size + c;
                if (glyphMask[i] === 1 && cover[i] !== 1) miss[i] = MISS_TARGET;
              }
            }
          }
        }
      }
    }
  }

  return { zones, allPassed, miss };
}

/**
 * Compare a strokes ink-mask against the glyph mask and return the full
 * verdict. `region` bounds the out-of-bounds accounting (whole canvas for a
 * single letter; the letter's cell for one letter inside a word, so ink drawn
 * in a neighbouring letter's lane doesn't count against this one). `glyph` is
 * used only to resolve the per-letter zone grid (see ZONE_CONFIG).
 */
export function evaluateTrace(
  glyphMask: Uint8ClampedArray,
  strokesMask: Uint8ClampedArray,
  region: TraceBox = FULL_BOX,
  glyph?: string,
): TraceResult {
  const size = TRACE_CANVAS;
  const n = size * size;

  const rLeft = Math.max(0, Math.round(region.left * size));
  const rRight = Math.min(size, Math.round(region.right * size));
  const rTop = Math.max(0, Math.round(region.top * size));
  const rBottom = Math.min(size, Math.round(region.bottom * size));

  const cover = buildInkCoverLookup(strokesMask, size, COVERAGE_TOLERANCE_PX);
  // Out-of-bounds uses a TIGHTER dilation than coverage: honest overhang next
  // to the guide still counts as in-bounds, but the natural stroke width does
  // not erase a truly stray scribble.
  const inkWide = buildInkCoverLookup(strokesMask, size, BOUNDS_TOLERANCE_PX);

  let letterPixels = 0;
  let covered = 0;
  let inkRegion = 0;
  let outside = 0;
  for (let i = 0; i < n; i += 1) {
    const isGlyph = glyphMask[i] === 1;
    const isInk = inkWide[i] === 1;
    if (isGlyph) {
      letterPixels += 1;
      if (cover[i] === 1) covered += 1;
    }
    if (isInk) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (c >= rLeft && c < rRight && r >= rTop && r < rBottom) {
        inkRegion += 1;
        if (!isGlyph) outside += 1;
      }
    }
  }

  if (letterPixels === 0 || inkRegion === 0) {
    const miss = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i += 1) {
      if (glyphMask[i] === 1) miss[i] = MISS_TARGET;
    }
    return {
      passed: false,
      coverage: 0,
      outOfBounds: 0,
      reason: 'empty',
      zones: [],
      miss,
    };
  }

  const coverage = covered / letterPixels;
  const outOfBounds = outside / inkRegion;

  const zoneEval = evaluateZones(glyph, glyphMask, cover, size);

  const passed =
    coverage >= OVERALL_COVERAGE_MIN &&
    outOfBounds <= OUT_OF_BOUNDS_MAX &&
    zoneEval.allPassed;

  let reason: TraceFailureReason;
  if (!passed) {
    if (outOfBounds > OUT_OF_BOUNDS_MAX) reason = 'bounds';
    else if (coverage < OVERALL_COVERAGE_MIN) reason = 'coverage';
    else if (!zoneEval.allPassed) reason = 'zone';
    else reason = 'coverage'; // unreachable, but exhaustive
  } else {
    reason = 'coverage'; // passed — reason is unused by callers then
  }

  // When the fail is purely an overall-coverage shortfall (every zone reached
  // its floor — no zone marked any red), fall back to marking every
  // still-missing glyph pixel so the learner always sees what to finish.
  let highlight = zoneEval.miss;
  if (!passed && reason === 'coverage') {
    let anyMarked = false;
    for (let i = 0; i < n; i += 1) {
      if (highlight[i] === MISS_TARGET) {
        anyMarked = true;
        break;
      }
    }
    if (!anyMarked) {
      highlight = new Uint8ClampedArray(n);
      for (let i = 0; i < n; i += 1) {
        if (glyphMask[i] === 1 && cover[i] !== 1) highlight[i] = MISS_TARGET;
      }
    }
  }

  return { passed, coverage, outOfBounds, reason, zones: zoneEval.zones, miss: highlight };
}

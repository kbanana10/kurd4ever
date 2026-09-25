// realism-trace.mjs — C8 diagnostic: run the REAL tracing validator against
// simulated human traces at three fidelity levels (good / average / rushed),
// for every alphabet glyph (incl. Kurdish diacritics), at the CURRENT compiled
// tolerance. Prints a per-letter × per-level table plus the bottleneck zone for
// every failure. This is the evidence engine for the "pass bug" fix.
//
// Model (documented, honest): a "correct" trace = a brush moving down the
// glyph's medial axis. We reconstruct that axis with the app's own chamfer
// erosion (same radius as runTraceSelfTest), then render each axis pixel as a
// brush dot subject to per-level noise:
//   - good    : σ=0.5px jitter, 0% dropped, brush r=3, no overshoot/stray
//   - average : σ=1.2px jitter, 2% dropped, brush r=3, 1 short overshoot
//   - rushed  : σ=2.5px jitter, 8% dropped (gaps), brush r=2.5, 3 stray strokes
// The resulting ink mask is fed to the app's evaluateTrace(mask, ink, undefined,
// glyph) so zone grids, floors, and the coverage tolerance are all the real code.
//
// Usage: node audit/tools/realism-trace.mjs  (dev server on :3000)
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
if (!fs.existsSync(path.join(NSS_LIB, 'libnss3.so'))) {
  const { createReadStream, createWriteStream } = await import('node:fs');
  const { createBrotliDecompress } = await import('node:zlib');
  const { pipeline } = await import('node:stream/promises');
  const { execSync } = await import('node:child_process');
  const pkgBin = path.resolve(process.cwd(), 'node_modules/@sparticuz/chromium/bin');
  const tar = path.join(os.tmpdir(), 'al2023.tar');
  await pipeline(createReadStream(path.join(pkgBin, 'al2023.tar.br')), createBrotliDecompress(), createWriteStream(tar));
  fs.mkdirSync(path.join(os.tmpdir(), 'nsslibs'), { recursive: true });
  execSync(`tar -xf ${tar} -C ${path.join(os.tmpdir(), 'nsslibs')}`);
}

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto('http://localhost:3000/writing/e', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await page.evaluate(() => localStorage.setItem('kurdish_quest_lang', 'en'));
await new Promise((r) => setTimeout(r, 2500));

const result = await page.evaluate(async () => {
  const mod = await import('/src/lib/traceLetters.ts');
  const SIZE = mod.TRACE_CANVAS;

  // mulberry32 PRNG for reproducible levels.
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Gaussian via Box-Muller.
  const gauss = (rand) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

  // Replicates the app's private chamfer erosion (same radius semantics).
  function erode(mask, size, radius) {
    const n = size * size;
    const out = new Uint8ClampedArray(n);
    if (radius <= 0) { for (let i = 0; i < n; i++) out[i] = mask[i]; return out; }
    const INF = 0x3fffffff;
    const dist = new Int32Array(n);
    for (let i = 0; i < n; i++) dist[i] = mask[i] === 1 ? INF : 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (r > 0) dist[i] = Math.min(dist[i], dist[i - size] + 1);
      if (c > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
    }
    for (let r = size - 1; r >= 0; r--) for (let c = size - 1; c >= 0; c--) {
      const i = r * size + c;
      if (r < size - 1) dist[i] = Math.min(dist[i], dist[i + size] + 1);
      if (c < size - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
    }
    for (let i = 0; i < n; i++) if (mask[i] === 1 && dist[i] > radius) out[i] = 1;
    return out;
  }

  function paintDot(ink, size, x, y, rad) {
    const r2 = rad * rad;
    const x0 = Math.floor(x - rad), x1 = Math.ceil(x + rad);
    const y0 = Math.floor(y - rad), y1 = Math.ceil(y + rad);
    for (let yy = Math.max(0, y0); yy <= Math.min(size - 1, y1); yy++) {
      for (let xx = Math.max(0, x0); xx <= Math.min(size - 1, x1); xx++) {
        const dx = xx - x, dy = yy - y;
        if (dx * dx + dy * dy <= r2) {
          if (yy >= 0 && xx >= 0 && yy < size && xx < size) ink[yy * size + xx] = 1;
        }
      }
    }
  }
  function paintLine(ink, size, x0, y0, x1, y1, rad) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= steps; s++) {
      paintDot(ink, size, x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, rad);
    }
  }

  // Build a human-like ink mask from the glyph skeleton.
  function simulate(glyphMask, level, seed, opts = {}) {
    const cfg = {
      good:    { sigma: 0.5, skip: 0.00, rad: 3.0, strays: 0, overshoot: 0 },
      average: { sigma: 1.2, skip: 0.02, rad: 3.0, strays: 0, overshoot: 3 },
      rushed:  { sigma: 2.5, skip: 0.08, rad: 2.5, strays: 3, overshoot: 7 },
    }[level];
    const R = rng(seed);
    const skel = erode(glyphMask, SIZE, mod.SELF_TEST_PERFECT_TRACE_ERODE);
    const n = SIZE * SIZE;

    // Connected components of the skeleton = one "stroke" each (a vertical arm,
    // a diagonal, the crossbar, or a diacritic crown is its own component when
    // detached). Under-shoot is applied per stroke ENDPOINT, like a real hand
    // stopping short — never by blanking whole scanline rows.
    const label = new Int32Array(n).fill(-1);
    const strokes = [];
    for (let i = 0; i < n; i++) {
      if (skel[i] !== 1 || label[i] !== -1) continue;
      const comp = [];
      const queue = [i];
      label[i] = strokes.length;
      while (queue.length) {
        const cur = queue.pop();
        comp.push([cur % SIZE, Math.floor(cur / SIZE)]);
        const cx = cur % SIZE, cy = Math.floor(cur / SIZE);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
          const ni = ny * SIZE + nx;
          if (skel[ni] === 1 && label[ni] === -1) { label[ni] = strokes.length; queue.push(ni); }
        }
      }
      strokes.push(comp);
    }

    // Order each stroke into a path starting from a degree-1 endpoint.
    const ordered = [];
    for (const comp of strokes) {
      if (comp.length < 3) { ordered.push(comp.slice()); continue; }
      const inComp = new Set(comp.map(([x, y]) => y * SIZE + x));
      let start = comp[0];
      let startDeg = 99;
      for (const [x, y] of comp) {
        let deg = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (inComp.has((y + dy) * SIZE + (x + dx))) deg++;
        }
        if (deg < startDeg) { startDeg = deg; start = [x, y]; }
      }
      const path = [];
      const used = new Set();
      let cur = start;
      for (;;) {
        path.push(cur);
        used.add(cur[1] * SIZE + cur[0]);
        let next = null;
        for (let dy = -1; dy <= 1 && !next; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cur[0] + dx, ny = cur[1] + dy;
          if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
          const ni = ny * SIZE + nx;
          if (inComp.has(ni) && !used.has(ni)) { next = [nx, ny]; }
        }
        if (!next) break;
        cur = next;
      }
      // Failsafe for any un-visited branch pixels (near overlaps).
      for (const p of comp) if (!used.has(p[1] * SIZE + p[0])) path.push(p);
      ordered.push(path);
    }

    const ink = new Uint8ClampedArray(SIZE * SIZE);
    const ox = opts.offsetX ?? 0, oy = opts.offsetY ?? 0;
    // Under-shoot each stroke by truncFraction of its length from each end.
    const trunc = opts.tipTrunc ?? 0;
    for (const path of ordered) {
      const trim = Math.max(0, Math.floor(path.length * trunc));
      const kept = path.slice(trim, Math.max(trim, path.length - trim));
      for (const [x, y] of kept) {
        if (R() < cfg.skip) continue;
        const jx = gauss(R) * cfg.sigma;
        const jy = gauss(R) * cfg.sigma;
        paintDot(ink, SIZE, x + ox + jx, y + oy + jy, cfg.rad);
      }
    }
    // Overshoot: extend a few stroke ENDPOINTS (a hand that runs slightly past
    // the guide tip). Endpoints are the first/last pixel of each ordered path.
    if (cfg.overshoot > 0) {
      let ends = [];
      for (const path of ordered) {
        if (!path.length) continue;
        ends.push(path[0]);
        ends.push(path[path.length - 1]);
      }
      const R2 = R; // same stream
      for (const [x, y] of ends.slice(0, 2)) {
        const ang = R2() * Math.PI * 2;
        paintLine(ink, SIZE, x, y, x + Math.cos(ang) * cfg.overshoot, y + Math.sin(ang) * cfg.overshoot, cfg.rad * 0.8);
      }
    }
    // Stray scribbles (rushed): short random segments in the mid canvas.
    for (let s = 0; s < cfg.strays; s++) {
      const x0 = 40 + R() * (SIZE - 80), y0 = 40 + R() * (SIZE - 80);
      const len = 8 + R() * 12, ang = R() * Math.PI * 2;
      paintLine(ink, SIZE, x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len, cfg.rad * 0.7);
    }
    return ink;
  }

  const GLYPHS = ['A','B','C','Ç','D','E','Ê','F','G','H','I','Î','J','K','L','M','N','O','P','Q','R','S','Ş','T','U','Û','V','W','X','Y','Z'];
  const LEVELS = ['good', 'average', 'rushed'];
  // Per-level extra realism axes (a human traces the *visible* guide edge, not
  // the medial axis; and undershoots stroke tips):
  const axis = { good: { offsetX: 0.7, offsetY: 1.4, tipTrunc: 0.015 }, average: { offsetX: 1.2, offsetY: 2.2, tipTrunc: 0.04 }, rushed: { offsetX: 2.0, offsetY: 3.0, tipTrunc: 0.09 } };
  const rows = [];
  let seedBase = 901;
  for (let gi = 0; gi < GLYPHS.length; gi++) {
    const glyph = GLYPHS[gi];
    const mask = mod.buildLetterMask(glyph);
    const row = { glyph, good: null, average: null, rushed: null };
    for (const level of LEVELS) {
      const ink = simulate(mask, level, seedBase + gi * LEVELS.length + LEVELS.indexOf(level), axis[level]);
      const t = mod.evaluateTrace(mask, ink, undefined, glyph);
      // bottleneck = non-empty (>= ZONE_MIN_PIXELS) zone with lowest coverage
      let worst = null;
      for (const z of t.zones) {
        if (z.targetPixels < mod.ZONE_MIN_PIXELS) continue;
        if (!worst || z.coverage < worst.coverage) worst = z;
      }
      row[level] = {
        passed: t.passed,
        coverage: +(t.coverage * 100).toFixed(1),
        oob: +(t.outOfBounds * 100).toFixed(1),
        reason: t.reason,
        worstZone: worst ? +((worst.coverage * 100)).toFixed(1) : null,
        worstZonePx: worst ? worst.targetPixels : null,
      };
    }
    rows.push(row);
  }
  return { tolerance: mod.COVERAGE_TOLERANCE_PX, rows };
});

// ---- print ----
console.log(`COVERAGE_TOLERANCE_PX = ${result.tolerance}`);
const header = ['glyph', 'good', 'avg', 'rushed', 'bottleneck (rushed worst zone)'];
const lvl = (r, k) => r[k].passed ? 'PASS' : `FAIL ${r[k].coverage}%`;
console.log(header.join('\t'));
for (const r of result.rows) {
  const worst = r.rushed.worstZone != null ? `${r.rushed.worstZone}% (${r.rushed.worstZonePx}px, ${r.rushed.reason})` : '—';
  console.log([r.glyph, lvl(r, 'good'), lvl(r, 'average'), lvl(r, 'rushed'), worst].join('\t'));
}

// ---- summary across levels ----
for (const level of ['good', 'average', 'rushed']) {
  const pass = result.rows.filter((r) => r[level].passed).length;
  const pct = +((pass / result.rows.length) * 100).toFixed(1);
  console.log(`\n${level.toUpperCase()}: ${pass}/${result.rows.length} pass (${pct}%)`);
  const fails = result.rows.filter((r) => !r[level].passed).map((r) => r.glyph);
  if (fails.length) console.log(`  failures: ${fails.join(', ')}`);
}
await browser.close();
process.exit(0);

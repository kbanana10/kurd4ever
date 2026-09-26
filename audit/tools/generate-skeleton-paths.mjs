// generate-skeleton-paths.mjs — derives *centerline* stroke paths for curved
// glyphs from the rendered letter's own skeleton, so the demo guide rides the
// middle of each stroke the way a handwriting app should (not the outer edge).
//
// For each requested glyph it:
//   1. builds the 900-weight glyph mask + bounding box,
//   2. chamfer-erodes to the skeleton (same as traceLetters.erodeMask),
//   3. orders the skeleton cells into one or more polylines (nearest-neighbour
//      walk, branch-tolerant), resamples each to `N` arc-length points and
//      lightly smooths,
//   4. prints normalized 'M x y L …' path strings ready to paste into
//      src/data/letterStrokes.ts (base glyph first, diacritics last).
//
// Elliptical letters (O, Q body) are fitted analytically in the caller, they
// do not need the walk; this script still reports their suggested centers so
// the author can cent her ellipses.
//
// Usage: node audit/tools/generate-skeleton-paths.mjs [C,O,G,Q,J,W,...]
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

const GLYPHS = (process.argv[2] || 'C,G,J,W').split(',').map((g) => g.trim()).filter(Boolean);

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 390, height: 844 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});

const out = await page.evaluate(async ({ glyphs }) => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;

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

  function bboxOf(mask) {
    let minR = SIZE, maxR = -1, minC = SIZE, maxC = -1;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] !== 1) continue;
      const r = Math.floor(i / SIZE), c = i % SIZE;
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
    return { minC, minR, w: maxC - minC, h: maxR - minR };
  }

  function walk(cluster) {
    // nearest-neighbour ordering of a pixel set (endpoint anchor = min c+r)
    const pts = [...cluster].map((i) => ({ i, r: Math.floor(i / SIZE), c: i % SIZE }));
    pts.sort((a, b) => a.c + a.r - (b.c + b.r));
    const ordered = [pts.shift()];
    while (pts.length) {
      const last = ordered[ordered.length - 1];
      let bi = 0, bd = Infinity;
      for (let k = 0; k < pts.length; k++) {
        const d = (pts[k].c - last.c) ** 2 + (pts[k].r - last.r) ** 2;
        if (d < bd) { bd = d; bi = k; }
      }
      ordered.push(pts.splice(bi, 1)[0]);
    }
    return ordered.map((p) => ({ x: p.c, y: p.r }));
  }

  function resample(path, n) {
    if (path.length < 2) return path;
    let lens = [0];
    for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
    const total = lens[lens.length - 1];
    const out = [];
    let seg = 0;
    for (let k = 0; k < n; k++) {
      const tgt = (total * k) / (n - 1);
      while (seg < path.length - 2 && lens[seg + 1] < tgt) seg++;
      const a = path[seg], b = path[Math.min(seg + 1, path.length - 1)];
      const segLen = Math.max(1e-9, lens[seg + 1] - lens[seg]);
      const t = Math.max(0, Math.min(1, (tgt - lens[seg]) / segLen));
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return out;
  }

  function smooth(path, passes = 2) {
    let pts = path;
    for (let p = 0; p < passes; p++) {
      const next = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[Math.min(pts.length - 1, i + 1)];
        next.push({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 });
      }
      pts = next;
    }
    return pts;
  }

  const results = {};
  for (const g of glyphs) {
    const mask = trace.buildLetterMask(g);
    const skel = erode(mask, SIZE, 9);
    const bb = bboxOf(mask);
    // Report skeleton pixel positions so the author can also see the density.
    const pxList = [];
    for (let i = 0; i < skel.length; i++) if (skel[i] === 1) pxList.push(i);

    // Single connected cluster (enough for C/G/J/W and loop bodies).
    const path = walk(pxList);
    const smoothPath = smooth(resample(path, 28), 2);
    const norm = smoothPath.map((p) => ({
      x: +(((p.x - bb.minC) / bb.w)).toFixed(3),
      y: +(((p.y - bb.minR) / bb.h)).toFixed(3),
    }));

    // Estimate stem thickness: mean chamfer distance of skeleton pixels.
    const { meanThickness } = (() => {
      // re-run single-pass to get dist at skeleton points
      const INF = 0x3fffffff;
      const dist = new Int32Array(mask.length);
      for (let i = 0; i < mask.length; i++) dist[i] = mask[i] === 1 ? INF : 0;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        if (r > 0) dist[i] = Math.min(dist[i], dist[i - SIZE] + 1);
        if (c > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      }
      for (let r = SIZE - 1; r >= 0; r--) for (let c = SIZE - 1; c >= 0; c--) {
        const i = r * SIZE + c;
        if (r < SIZE - 1) dist[i] = Math.min(dist[i], dist[i + SIZE] + 1);
        if (c < SIZE - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      }
      let sum = 0, n = 0;
      for (const i of pxList) { sum += dist[i]; n++; }
      return { meanThickness: n ? Math.round((sum / n) * 10) / 10 : 0 };
    })();

    results[g] = {
      bbox: bb,
      meanThickness,
      skeletonPoints: pxList.length,
      // 1/3 of way along and 2/3 markers help the author see direction
      pathNorm: norm.map((p) => `${p.x} ${p.y}`).join(' L '),
      pathString: 'M ' + norm.map((p) => `${p.x} ${p.y}`).join(' L '),
      start: norm[0],
      end: norm[norm.length - 1],
    };
  }
  return results;
}, { glyphs: GLYPHS });

for (const g of GLYPHS) {
  const r = out[g];
  console.log(`\n=== ${g} (bbox ${r.bbox.w}x${r.bbox.h}, stem≈${r.meanThickness}px, ${r.skeletonPoints} skel px) ===`);
  console.log(`  start ${JSON.stringify(r.start)}  end ${JSON.stringify(r.end)}`);
  console.log(`  path: '${r.pathString}',`);
}

await page.close();
await browser.close();

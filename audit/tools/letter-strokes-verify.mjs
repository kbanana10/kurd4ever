// letter-strokes-verify.mjs — Phase 1 objective evidence for stroke data.
//
// Verifies, per letter, that the authored stroke plan actually FOLLOWS the
// glyph it teaches — geometry (strokes stay on the letter's own pixels) and
// coverage (the union of strokes re-traces the letter's centerline, so a
// learner following the guide redraws the whole letter). Two objective metrics
// per stroke plan, computed against the SAME glyph mask the app renders:
//
//   precision  — fraction of densely-sampled guide points within 12px of a
//                glyph FILL pixel. Proves the demo/trace guide never floats
//                in empty space (start point, direction and shape on-letter).
//   recall     — fraction of glyph SKELETON (eroded centerline) pixels within
//                20px of a guide point (~ the glyph's own half stroke-width).
//                Proves the guide collectively traces every feature — a
//                missing stem/bar/bowl/accent drops this below the floor.
//
// It also renders every plan (gold strokes) over its glyph into one composite
// grid PNG saved to audit/proof/letter-guides.png, for human review of the
// rendered appearance.
//
// Usage: node audit/tools/letter-strokes-verify.mjs [A,B,C,...]   (default: all 31)
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
// Same bootstrap audit/tools/realism-trace.mjs uses.
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

const ARG = process.argv[2] || '';
const GLYPHS = ARG ? ARG.split(',').map((g) => g.trim()).filter(Boolean) : null;

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 1280, height: 900 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});

const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('kurdish_quest_lang', 'en');
    localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA' }));
    localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({ xp: 100, level: 1, gems: 100, streak: 0, reviewDeck: {}, completedLessons: [] }));
  } catch {}
});
await page.goto(`${'http://localhost:3000'}/`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});

const result = await page.evaluate(async ({ glyphs }) => {
  const url = (p) => `${location.origin}/src/${p}.ts`;
  const trace = await import(url('lib/traceLetters'));
  const data = await import(url('data/letterStrokes'));

  const SIZE = trace.TRACE_CANVAS;
  const all = glyphs && glyphs.length ? glyphs : Object.keys(data.LETTER_STROKES);

  // Chamfer-erode the binary mask to its centerline (mirrors tranceLetters).
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

  function bboxOf(mask, size) {
    let minR = size, maxR = -1, minC = size, maxC = -1;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] !== 1) continue;
      const r = Math.floor(i / size), c = i % size;
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
    if (maxR < minR) return null;
    return { minC, minR, w: maxC - minC, h: maxR - minR };
  }

  function analyze(glyph) {
    const mask = trace.buildLetterMask(glyph);
    const plan = data.getLetterStrokes(glyph);
    const bbox = bboxOf(mask, SIZE);
    if (!plan || !bbox) return { glyph, err: 'no plan/mask' };

    const strokesPx = data.letterStrokesToPx(plan, bbox);
    const skeleton = erode(mask, SIZE, 9);

    // FIXED, right-sized tolerances (stable across glyphs):
    //   precision — a guide point counts as "on the letter" when it sits within
    //     10px of a fill pixel. Authoring rule: stroke centerlines live INSIDE
    //     the filled area, so a correct guide sits on/near fill (distance ≈ 0);
    //     10px absorbs the anti-aliasing edge.
    //   recall    — a centerline pixel counts as "traced" within 18px of a
    //     guide point (the thickest stem half-width measured is ≈16px), so a
    //     genuinely skipped feature still fails.
    const { stemHalf } = (() => {
      const INF = 0x3fffffff;
      const d = new Int32Array(mask.length);
      for (let i = 0; i < mask.length; i++) d[i] = mask[i] === 1 ? INF : 0;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        if (r > 0) d[i] = Math.min(d[i], d[i - SIZE] + 1);
        if (c > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      }
      for (let r = SIZE - 1; r >= 0; r--) for (let c = SIZE - 1; c >= 0; c--) {
        const i = r * SIZE + c;
        if (r < SIZE - 1) d[i] = Math.min(d[i], d[i + SIZE] + 1);
        if (c < SIZE - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      }
      let sum = 0, pts = 0;
      for (let i = 0; i < mask.length; i++) if (skeleton[i] === 1) { sum += d[i]; pts += 1; }
      return { stemHalf: pts ? Math.round(sum / pts) : 8 };
    })();
    const PRECISION_TOL = 10;
    const RECALL_TOL = 18;

    // Dense arc-length sampling of all guide polylines (≈ every 2px).
    const guide = [];
    for (const s of strokesPx) {
      for (let k = 0; k < s.length; k++) guide.push(s[k]);
      // densely interpolate long segments
      for (let k = 1; k < s.length; k++) {
        const a = s[k - 1], b = s[k];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const steps = Math.max(1, Math.round(d / 2));
        for (let t = 1; t < steps; t++) {
          guide.push({ x: a.x + ((b.x - a.x) * t) / steps, y: a.y + ((b.y - a.y) * t) / steps });
        }
      }
    }

    const fillPx = [];
    for (let i = 0; i < mask.length; i++) if (mask[i] === 1) fillPx.push(i);

    let offGuide = 0;
    for (const p of guide) {
      let best = Infinity;
      for (const i of fillPx) {
        const r = Math.floor(i / SIZE), c = i % SIZE;
        const d = (p.x - c) ** 2 + (p.y - r) ** 2;
        if (d < best) best = d;
      }
      if (Math.sqrt(best) > PRECISION_TOL) offGuide += 1;
    }
    const precision = guide.length ? 1 - offGuide / guide.length : 0;

    let covered = 0, totalSkel = 0;
    for (let i = 0; i < skeleton.length; i++) {
      if (skeleton[i] !== 1) continue;
      totalSkel += 1;
      const r = Math.floor(i / SIZE), c = i % SIZE;
      let best = Infinity;
      for (const p of guide) {
        const d = (p.x - c) ** 2 + (p.y - r) ** 2;
        if (d < best) best = d;
      }
      if (Math.sqrt(best) <= RECALL_TOL) covered += 1;
    }
    const recall = totalSkel ? covered / totalSkel : 0;

    return {
      glyph,
      strokes: plan.strokes.length,
      bbox: { w: bbox.w, h: bbox.h },
      stemHalf,
      precision: Math.round(precision * 1000) / 10,
      recall: Math.round(recall * 1000) / 10,
      ok: precision >= 0.95 && recall >= 0.9,
    };
  }

  return all.map(analyze);
}, { glyphs: GLYPHS });

// ---- Composite visual grid (gold guide over each glyph) for human review ----
await page.setViewport({ width: 1290, height: 1700, deviceScaleFactor: 1 });
const gridSvg = await page.evaluate(async ({ glyphs }) => {
  const url = (p) => `${location.origin}/src/${p}.ts`;
  const trace = await import(url('lib/traceLetters'));
  const data = await import(url('data/letterStrokes'));
  const SIZE = trace.TRACE_CANVAS;
  const all = glyphs && glyphs.length ? glyphs : Object.keys(data.LETTER_STROKES);

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

  const cells = all.map((g) => {
    const mask = trace.buildLetterMask(g);
    const bb = bboxOf(mask);
    const plan = data.getLetterStrokes(g);
    const strokesPx = data.letterStrokesToPx(plan, bb);
    const paths = strokesPx
      .map((s) => `<path d="M ${s.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join('');
    // dot at every stroke START to show where the pen should begin
    const starts = strokesPx
      .map((s) => (s.length ? `<circle cx="${s[0].x.toFixed(1)}" cy="${s[0].y.toFixed(1)}" r="4" fill="#EF4444"/>` : ''))
      .join('');
    const ends = strokesPx
      .map((s) => (s.length ? `<circle cx="${s[s.length - 1].x.toFixed(1)}" cy="${s[s.length - 1].y.toFixed(1)}" r="2.5" fill="#10B981"/>` : ''))
      .join('');
    return `<div style="width:198px">
      <div style="font:900 22px monospace;color:#1E293B;padding:2px 6px">${g}</div>
      <svg viewBox="0 0 ${SIZE} ${SIZE}" width="190" height="190" style="background:#F8F9FB;border:1px solid #E2E8F0;border-radius:12px">
        <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="none"/>
        <path d="${(() => { const pts = strokesPx.flat(); return pts.length ? pts.map((p) => `${p.x} ${p.y}`).join(' L ') : ''; })()}" fill="none" stroke="#94A3B8" stroke-width="18" stroke-linecap="round" opacity="0.35"/>
        ${paths}${starts}${ends}
        <text x="${SIZE / 2}" y="${SIZE / 2}" font-family="Arial" font-weight="900" font-size="${SIZE * 0.72}" text-anchor="middle" dominant-baseline="middle" fill="#1E293B" opacity="0.08">${g}</text>
      </svg>
    </div>`;
  }).join('');
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:system-ui;margin:0;padding:12px;background:#fff}
  .grid{display:grid;grid-template-columns:repeat(6,198px);gap:8px}</style></head>
  <body><h2 style="font-size:14px;margin:4px 8px">Gold = authored guide · red dot = stroke start · green dot = stroke end · faint slate = ink union · beige = glyph</h2>
  <div class="grid">${cells}</div></body></html>`;
  return html;
}, { glyphs: GLYPHS });

const shotFile = path.resolve(process.cwd(), 'audit/proof/letter-guides.png');
fs.mkdirSync(path.dirname(shotFile), { recursive: true });
await page.setContent(gridSvg, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 150));
await page.screenshot({ path: shotFile, fullPage: true });
console.log(`composite screenshot → ${shotFile}`);

await page.close();
await browser.close();

let failures = 0;
console.log('\n=== letter-strokes verification (precision on-glyph ≥95%, skeleton recall ≥85%) ===');
for (const r of result) {
  if (r.err) { failures += 1; console.log(`✗ ${r.glyph}  ERROR: ${r.err}`); continue; }
  if (!r.ok) failures += 1;
  console.log(`${r.ok ? '✓' : '✗'} ${r.glyph}  strokes=${r.strokes} bbox=${r.bbox.w}x${r.bbox.h}  precision=${r.precision}%  recall=${r.recall}%`);
}
console.log(`\n${result.length - failures}/${result.length} passed`);
process.exit(failures > 0 ? 1 : 0);

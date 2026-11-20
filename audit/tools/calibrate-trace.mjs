// calibrate-trace.mjs — C8: gather the numbers to choose Option 3's constants.
// For every glyph × level: overall coverage, min non-trivial zone coverage, and
// mean non-trivial zone coverage. Plus negative controls: a correct trace with a
// whole feature removed (E middle bar, A crossbar, H crossbar) — these MUST fail
// under any chosen rule. Also the complete-letter "Û" at average (the reported
// bug class) whose bottleneck zone coverage decides the floor.
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const b = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: 'shell', env: { ...process.env, LD_LIBRARY_PATH: '/tmp/nsslibs/lib' } });
const p = await b.newPage();
await p.goto('http://localhost:3000/writing/e', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 2000));

const out = await p.evaluate(async () => {
  const mod = await import('/src/lib/traceLetters.ts');
  const SIZE = mod.TRACE_CANVAS;
  function erode(mask, size, radius) {
    const n = size * size; const out = new Uint8ClampedArray(n);
    if (radius <= 0) { for (let i = 0; i < n; i++) out[i] = mask[i]; return out; }
    const INF = 0x3fffffff; const d = new Int32Array(n);
    for (let i = 0; i < n; i++) d[i] = mask[i] === 1 ? INF : 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const i = r * size + c; if (r > 0) d[i] = Math.min(d[i], d[i - size] + 1); if (c > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
    }
    for (let r = size - 1; r >= 0; r--) for (let c = size - 1; c >= 0; c--) {
      const i = r * size + c; if (r < size - 1) d[i] = Math.min(d[i], d[i + size] + 1); if (c < size - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
    }
    for (let i = 0; i < n; i++) if (mask[i] === 1 && d[i] > radius) out[i] = 1;
    return out;
  }
  function dot(ink, x, y, rad) { const r2 = rad * rad;
    for (let yy = Math.floor(y - rad); yy <= Math.ceil(y + rad); yy++) for (let xx = Math.floor(x - rad); xx <= Math.ceil(x + rad); xx++) {
      if (yy < 0 || xx < 0 || yy >= SIZE || xx >= SIZE) continue; const dx = xx - x, dy = yy - y; if (dx * dx + dy * dy <= r2) ink[yy * SIZE + xx] = 1; } }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  function orderedPaths(mask, size) {
    const skel = erode(mask, size, mod.SELF_TEST_PERFECT_TRACE_ERODE);
    const n = size * size; const label = new Int32Array(n).fill(-1); const strokes = [];
    for (let i = 0; i < n; i++) { if (skel[i] !== 1 || label[i] !== -1) continue;
      const comp = []; const queue = [i]; label[i] = strokes.length;
      while (queue.length) { const cur = queue.pop(); comp.push([cur % size, Math.floor(cur / size)]); const cx = cur % size, cy = Math.floor(cur / size);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue; const ni = ny * size + nx; if (skel[ni] === 1 && label[ni] === -1) { label[ni] = strokes.length; queue.push(ni); } } }
      strokes.push(comp); }
    const ordered = [];
    for (const comp of strokes) { if (comp.length < 3) { ordered.push(comp.slice()); continue; }
      const inComp = new Set(comp.map(([x, y]) => y * size + x)); let start = comp[0], sd = 99;
      for (const [x, y] of comp) { let deg = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; if (inComp.has((y + dy) * size + (x + dx))) deg++; } if (deg < sd) { sd = deg; start = [x, y]; } }
      const path = []; const used = new Set(); let cur = start;
      for (;;) { path.push(cur); used.add(cur[1] * size + cur[0]); let nxt = null;
        for (let dy = -1; dy <= 1 && !nxt; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; const nx = cur[0] + dx, ny = cur[1] + dy; if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue; const ni = ny * size + nx; if (inComp.has(ni) && !used.has(ni)) nxt = [nx, ny]; }
        if (!nxt) break; cur = nxt; }
      for (const pt of comp) if (!used.has(pt[1] * size + pt[0])) path.push(pt);
      ordered.push(path); }
    return ordered;
  }
  function sim(mask, level, seed, axis, blankRowBand) {
    const ordered = orderedPaths(mask, SIZE);
    const cfg = { good: { sigma: 0.5, skip: 0, rad: 3.0 }, average: { sigma: 1.2, skip: 0.02, rad: 3.0 }, rushed: { sigma: 2.5, skip: 0.08, rad: 2.5 } }[level];
    const R = rng(seed); const ink = new Uint8ClampedArray(SIZE * SIZE);
    const trunc = axis.tipTrunc || 0;
    for (const path of ordered) {
      const trim = Math.max(0, Math.floor(path.length * trunc));
      const kept = path.slice(trim, Math.max(trim, path.length - trim));
      for (const [x, y] of kept) {
        if (R() < cfg.skip) continue;
        if (blankRowBand && y >= blankRowBand[0] && y <= blankRowBand[1]) continue; // never drew this band
        dot(ink, x + (axis.offsetX || 0) + gauss(R) * cfg.sigma, y + (axis.offsetY || 0) + gauss(R) * cfg.sigma, cfg.rad);
      }
    }
    return ink;
  }
  // Dynamically find the widest horizontal bar of a glyph (the crossbar of A/H,
  // the middle bar of E, etc.): group rows whose skeleton row-run spans >=45%
  // of the glyph width; the main bar is the widest such group.
  function findMainBar(mask, size) {
    let minRow = size, maxRow = -1, minCol = size, maxCol = -1;
    for (let i = 0; i < mask.length; i++) if (mask[i] === 1) { const r = Math.floor(i / size), c = i % size; if (r < minRow) minRow = r; if (r > maxRow) maxRow = r; if (c < minCol) minCol = c; if (c > maxCol) maxCol = c; }
    const w = maxCol - minCol + 1; const rows = [];
    for (let r = minRow; r <= maxRow; r++) {
      let run = 0, best = 0;
      for (let c = minCol; c <= maxCol; c++) { if (mask[r * size + c] === 1) { run++; if (run > best) best = run; } else run = 0; }
      rows.push({ r, run: best });
    }
    const wide = rows.filter((o) => o.run >= w * 0.45).sort((a, b) => b.run - a.run);
    if (!wide.length) return null;
    const pivot = wide[0].r; const band = new Set([pivot - 1, pivot, pivot + 1].filter((r) => r >= minRow && r <= maxRow && rows.some((o) => o.r === r)));
    return { rows: [...band].sort((a, b) => a - b) };
  }
  // For negative controls, blank the main bar's rows from the trace source.
  function simWithoutBar(mask, level, seed, axis, barRows) {
    const ordered = orderedPaths(mask, SIZE);
    const cfg = { good: { sigma: 0.5, skip: 0, rad: 3.0 } }[level] || { sigma: 0.5, skip: 0, rad: 3.0 };
    const R = rng(seed); const ink = new Uint8ClampedArray(SIZE * SIZE);
    const trunc = axis.tipTrunc || 0;
    for (const path of ordered) {
      const trim = Math.max(0, Math.floor(path.length * trunc));
      const kept = path.slice(trim, Math.max(trim, path.length - trim));
      for (const [x, y] of kept) {
        if (R() < cfg.skip) continue;
        if (barRows.includes(y)) continue;
        dot(ink, x + (axis.offsetX || 0) + gauss(R) * cfg.sigma, y + (axis.offsetY || 0) + gauss(R) * cfg.sigma, cfg.rad);
      }
    }
    return ink;
  }
  const axis = { good: { offsetX: 0.7, offsetY: 1.4, tipTrunc: 0.015 }, average: { offsetX: 1.2, offsetY: 2.2, tipTrunc: 0.04 }, rushed: { offsetX: 2.0, offsetY: 3.0, tipTrunc: 0.09 } };
  const lvlIdx = { good: 0, average: 1, rushed: 2 };
  const glyphs = ['A','B','C','Ç','D','E','Ê','F','G','H','I','Î','J','K','L','M','N','O','P','Q','R','S','Ş','T','U','Û','V','W','X','Y','Z'];
  const stats = (g, level, blankBand) => {
    const gi = glyphs.indexOf(g); const seed = 901 + gi * 3 + lvlIdx[level];
    const mask = mod.buildLetterMask(g); const ink = sim(mask, level, seed, axis[level], blankBand);
    const t = mod.evaluateTrace(mask, ink, undefined, g);
    const nz = t.zones.filter((z) => z.targetPixels >= mod.ZONE_MIN_PIXELS);
    const covs = nz.map((z) => z.coverage);
    const min = covs.length ? Math.min(...covs) : 1;
    const mean = covs.length ? covs.reduce((a, b) => a + b, 0) / covs.length : 1;
    return { passed: t.passed, overall: +(t.coverage * 100).toFixed(1), min: +((min * 100).toFixed(1)), mean: +((mean * 100).toFixed(1)), oob: +(t.outOfBounds * 100).toFixed(1) };
  };
  // Correct-trace stats for the fragile letters across levels.
  const rows = [];
  for (const g of ['Û','Î','K','W','N','Ç','E','X','M','Ş']) rows.push({ g, l: 'avg', ...stats(g, 'average') });
  for (const g of ['Û','Î','K','W','N','Ç','X','M','Ş']) rows.push({ g, l: 'rush', ...stats(g, 'rushed') });
  // Negative controls: correct trace minus a whole feature (main bar removed
  // via dynamic detection — a whole crossbar/middle-bar is never drawn).
  const mkCtrl = (g, l, desc) => {
    const gi = glyphs.indexOf(g); const seed = 901 + gi * 3 + lvlIdx[l];
    const mask = mod.buildLetterMask(g);
    const bar = findMainBar(mask, SIZE);
    const ink = simWithoutBar(mask, l, seed, axis[l], bar ? bar.rows : []);
    const t = mod.evaluateTrace(mask, ink, undefined, g);
    const nz = t.zones.filter((z) => z.targetPixels >= mod.ZONE_MIN_PIXELS);
    const covs = nz.map((z) => z.coverage);
    return { desc: `${desc} ` + (bar ? `(bar rows ${bar.rows.join(',')})` : '(no bar found!)'), passed: t.passed, overall: +(t.coverage * 100).toFixed(1), min: covs.length ? +(Math.min(...covs) * 100).toFixed(1) : 0, mean: covs.length ? +(covs.reduce((a, b) => a + b, 0) / covs.length * 100).toFixed(1) : 0, oob: +(t.outOfBounds * 100).toFixed(1) };
  };
  const ctrlRows = [mkCtrl('E', 'good', 'E minus middle bar'), mkCtrl('A', 'good', 'A minus crossbar'), mkCtrl('H', 'good', 'H minus crossbar')];
  return { tolerance: mod.COVERAGE_TOLERANCE_PX, rows, ctrlRows };
});

console.log(`COVERAGE_TOLERANCE_PX = ${out.tolerance}  (ZONE_COVERAGE_MIN currently 0.40)`);
console.log('\n== fragile correct traces (mean vs min zone) ==');
console.log('glyph  level   overall%  minZone%  meanZone%  oob%  verdict');
for (const r of out.rows) console.log(`${r.g.padEnd(6)} ${r.l.padEnd(7)} ${String(r.overall).padStart(8)} ${String(r.min).padStart(9)} ${String(r.mean).padStart(10)} ${String(r.oob).padStart(6)}  ${r.passed ? 'PASS' : 'FAIL'}`);
console.log('\n== negative controls (feature removed) ==');
for (const r of out.ctrlRows) console.log(`${r.desc.padEnd(20)} overall=${r.overall}% min=${r.min}% mean=${r.mean}% oob=${r.oob}% → ${r.passed ? 'PASS (BAD: should fail)' : 'FAIL (good)'}`);
await b.close();

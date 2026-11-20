// negcontrol-trace.mjs — C8 negative controls, done properly.
// For E (middle bar), A (crossbar), H (crossbar): find the FULL bar band from
// the glyph MASK (rows in the middle 50% whose max run >= 78% of glyph width),
// then simulate a "good" correct trace that NEVER draws any skeleton pixel in
// that band. The result MUST FAIL. Reports under the CURRENT rule and the
// candidate rule (per-zone floor 0.25 + mean >= 0.55).
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const b = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: 'shell', env: { ...process.env, LD_LIBRARY_PATH: '/tmp/nsslibs/lib' } });
const p = await b.newPage();
await p.goto('http://localhost:3000/writing/e', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 1500));

const o = await p.evaluate(async () => {
  const mod = await import('/src/lib/traceLetters.ts');
  const SIZE = mod.TRACE_CANVAS;
  function erode(mask, size, radius) { const n = size * size; const out = new Uint8ClampedArray(n); if (radius <= 0) { for (let i = 0; i < n; i++) out[i] = mask[i]; return out; } const INF = 0x3fffffff; const d = new Int32Array(n); for (let i = 0; i < n; i++) d[i] = mask[i] === 1 ? INF : 0; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) { const i = r * size + c; if (r > 0) d[i] = Math.min(d[i], d[i - size] + 1); if (c > 0) d[i] = Math.min(d[i], d[i - 1] + 1); } for (let r = size - 1; r >= 0; r--) for (let c = size - 1; c >= 0; c--) { const i = r * size + c; if (r < size - 1) d[i] = Math.min(d[i], d[i + size] + 1); if (c < size - 1) d[i] = Math.min(d[i], d[i + 1] + 1); } for (let i = 0; i < n; i++) if (mask[i] === 1 && d[i] > radius) out[i] = 1; return out; }
  function dot(ink, x, y, rad) { const r2 = rad * rad; for (let yy = Math.floor(y - rad); yy <= Math.ceil(y + rad); yy++) for (let xx = Math.floor(x - rad); xx <= Math.ceil(x + rad); xx++) { if (yy < 0 || xx < 0 || yy >= SIZE || xx >= SIZE) continue; const dx = xx - x, dy = yy - y; if (dx * dx + dy * dy <= r2) ink[yy * SIZE + xx] = 1; } }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const ordered = (skel) => { const n = SIZE * SIZE; const label = new Int32Array(n).fill(-1); const comps = []; for (let i = 0; i < n; i++) { if (skel[i] !== 1 || label[i] !== -1) continue; const comp = []; const q = [i]; label[i] = comps.length; while (q.length) { const cur = q.pop(); comp.push([cur % SIZE, Math.floor(cur / SIZE)]); const cx = cur % SIZE, cy = Math.floor(cur / SIZE); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue; const ni = ny * SIZE + nx; if (skel[ni] === 1 && label[ni] === -1) { label[ni] = comps.length; q.push(ni); } } } comps.push(comp); } const out = []; for (const comp of comps) { if (comp.length < 3) { out.push(comp.slice()); continue; } const inC = new Set(comp.map(([x, y]) => y * SIZE + x)); let start = comp[0], sd = 99; for (const [x, y] of comp) { let deg = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; if (inC.has((y + dy) * SIZE + (x + dx))) deg++; } if (deg < sd) { sd = deg; start = [x, y]; } } const path = []; const used = new Set(); let cur = start; for (;;) { path.push(cur); used.add(cur[1] * SIZE + cur[0]); let nxt = null; for (let dy = -1; dy <= 1 && !nxt; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; const nx = cur[0] + dx, ny = cur[1] + dy; if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue; const ni = ny * SIZE + nx; if (inC.has(ni) && !used.has(ni)) nxt = [nx, ny]; } if (!nxt) break; cur = nxt; } for (const pt of comp) if (!used.has(pt[1] * SIZE + pt[0])) path.push(pt); out.push(path); } return out; };
  function evalRule(t, floor, meanGuard) {
    const nz = t.zones.filter((z) => z.targetPixels >= mod.ZONE_MIN_PIXELS);
    const covs = nz.map((z) => z.coverage);
    const min = covs.length ? Math.min(...covs) : 1;
    const mean = covs.length ? covs.reduce((a, c) => a + c, 0) / covs.length : 1;
    const zonesOk = covs.every((c) => c >= floor);
    const meanOk = mean >= meanGuard;
    return { passed: zonesOk && meanOk, min: +(min * 100).toFixed(1), mean: +(mean * 100).toFixed(1), nQualifying: covs.length };
  }

  const out = [];
  for (const g of ['E', 'A', 'H']) {
    const mask = mod.buildLetterMask(g);
    // glyph bounds + row runs on the FULL mask
    let minR = SIZE, maxR = -1, minC = SIZE, maxC = -1;
    for (let i = 0; i < mask.length; i++) if (mask[i] === 1) { const r = Math.floor(i / SIZE), c = i % SIZE; if (r < minR) minR = r; if (r > maxR) maxR = r; if (c < minC) minC = c; if (c > maxC) maxC = c; }
    const width = maxC - minC + 1, height = maxR - minR + 1;
    const barRows = new Set();
    const lo = minR + Math.floor(height * 0.28), hi = minR + Math.floor(height * 0.72);
    for (let r = lo; r <= hi; r++) { let run = 0, best = 0; for (let c = minC; c <= maxC; c++) { if (mask[r * SIZE + c] === 1) { run++; if (run > best) best = run; } else run = 0; } if (best >= width * 0.78) barRows.add(r); }
    const skel = erode(mask, SIZE, mod.SELF_TEST_PERFECT_TRACE_ERODE);
    const paths = ordered(skel);
    const R = rng(g.charCodeAt(0) * 7 + 5);
    const ink = new Uint8ClampedArray(SIZE * SIZE);
    for (const path of paths) {
      const trim = Math.max(0, Math.floor(path.length * 0.015));
      const kept = path.slice(trim, Math.max(trim, path.length - trim));
      for (const [x, y] of kept) {
        if (R() < 0.0) continue;
        if (barRows.has(y)) continue; // never draw the bar
        dot(ink, x + 0.7 + gauss(R) * 0.5, y + 1.4 + gauss(R) * 0.5, 3.0);
      }
    }
    const t = mod.evaluateTrace(mask, ink, undefined, g);
    const cur = evalRule(t, 0.4, 0);
    const cand = evalRule(t, 0.25, 0.55);
    out.push({ g, barRows: [...barRows].sort((a, b) => a - b).join(','), live: t.passed ? 'PASS(bad)' : 'FAIL(ok)', liveReason: t.reason, current: cur.passed ? 'PASS(bad)' : 'FAIL(ok)', candidate: cand.passed ? 'PASS(bad)' : 'FAIL(ok)', overall: +(t.coverage * 100).toFixed(1), curMin: cur.min, curMean: cur.mean, candN: cand.nQualifying });
  }
  return out;
});
console.log('negative controls (whole bar never drawn, "good" trace otherwise):');
for (const r of o) console.log(`${r.g}: barRows=[${r.barRows}] overall=${r.overall}% | LIVE evaluateTrace: ${r.live} (reason=${r.liveReason}) | current(floor .4): min=${r.curMin}% mean=${r.curMean}% → ${r.current} | candidate(floor .25 + mean .55): → ${r.candidate}`);
await b.close();

// zonedump-trace.mjs — C8 diagnostic detail. Prints every non-noise zone for
// failing (glyph, level) pairs under the SAME corrected human-trace model as
// realism-trace.mjs (per-stroke endpoint under-shoot + guide-edge offset).
// Usage: node audit/tools/zonedump-trace.mjs
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
      const i = r * size + c;
      if (r > 0) d[i] = Math.min(d[i], d[i - size] + 1);
      if (c > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
    }
    for (let r = size - 1; r >= 0; r--) for (let c = size - 1; c >= 0; c--) {
      const i = r * size + c;
      if (r < size - 1) d[i] = Math.min(d[i], d[i + size] + 1);
      if (c < size - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
    }
    for (let i = 0; i < n; i++) if (mask[i] === 1 && d[i] > radius) out[i] = 1;
    return out;
  }
  function dot(ink, x, y, rad) {
    const r2 = rad * rad;
    for (let yy = Math.floor(y - rad); yy <= Math.ceil(y + rad); yy++)
      for (let xx = Math.floor(x - rad); xx <= Math.ceil(x + rad); xx++) {
        if (yy < 0 || xx < 0 || yy >= SIZE || xx >= SIZE) continue;
        const dx = xx - x, dy = yy - y;
        if (dx * dx + dy * dy <= r2) ink[yy * SIZE + xx] = 1;
      }
  }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

  function sim(mask, level, seed, axis) {
    const skel = erode(mask, SIZE, mod.SELF_TEST_PERFECT_TRACE_ERODE);
    const n = SIZE * SIZE;
    // connected components per stroke
    const label = new Int32Array(n).fill(-1);
    const strokes = [];
    for (let i = 0; i < n; i++) {
      if (skel[i] !== 1 || label[i] !== -1) continue;
      const comp = []; const queue = [i]; label[i] = strokes.length;
      while (queue.length) {
        const cur = queue.pop(); comp.push([cur % SIZE, Math.floor(cur / SIZE)]);
        const cx = cur % SIZE, cy = Math.floor(cur / SIZE);
        for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
          if (dx===0&&dy===0) continue;
          const nx=cx+dx, ny=cy+dy; if (nx<0||ny<0||nx>=SIZE||ny>=SIZE) continue;
          const ni=ny*SIZE+nx; if (skel[ni]===1 && label[ni]===-1){label[ni]=strokes.length;queue.push(ni);}
        }
      }
      strokes.push(comp);
    }
    const ordered = [];
    for (const comp of strokes) {
      if (comp.length < 3) { ordered.push(comp.slice()); continue; }
      const inComp = new Set(comp.map(([x,y])=>y*SIZE+x));
      let start = comp[0], startDeg = 99;
      for (const [x,y] of comp) { let deg=0;
        for (let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;if(inComp.has((y+dy)*SIZE+(x+dx)))deg++;}
        if (deg<startDeg){startDeg=deg;start=[x,y];} }
      const path=[]; const used=new Set(); let cur=start;
      for(;;){path.push(cur);used.add(cur[1]*SIZE+cur[0]);let nxt=null;
        for(let dy=-1;dy<=1&&!nxt;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;const nx=cur[0]+dx,ny=cur[1]+dy;if(nx<0||ny<0||nx>=SIZE||ny>=SIZE)continue;const ni=ny*SIZE+nx;if(inComp.has(ni)&&!used.has(ni))nxt=[nx,ny];}
        if(!nxt)break;cur=nxt;}
      for (const pt of comp) if(!used.has(pt[1]*SIZE+pt[0])) path.push(pt);
      ordered.push(path);
    }
    const cfg = { good:{sigma:0.5,skip:0,rad:3.0}, average:{sigma:1.2,skip:0.02,rad:3.0}, rushed:{sigma:2.5,skip:0.08,rad:2.5} }[level];
    const R = rng(seed);
    const ink = new Uint8ClampedArray(n);
    const trunc = axis.tipTrunc || 0;
    for (const path of ordered) {
      const trim = Math.max(0, Math.floor(path.length*trunc));
      const kept = path.slice(trim, Math.max(trim, path.length-trim));
      for (const [x,y] of kept) {
        if (R() < cfg.skip) continue;
        dot(ink, x+(axis.offsetX||0)+gauss(R)*cfg.sigma, y+(axis.offsetY||0)+gauss(R)*cfg.sigma, cfg.rad);
      }
    }
    return ink;
  }
  const axis = { good:{offsetX:0.7,offsetY:1.4,tipTrunc:0.015}, average:{offsetX:1.2,offsetY:2.2,tipTrunc:0.04}, rushed:{offsetX:2.0,offsetY:3.0,tipTrunc:0.09} };
  const lvlIdx = { good:0, average:1, rushed:2 };
  const glyphs = ['A','B','C','Ç','D','E','Ê','F','G','H','I','Î','J','K','L','M','N','O','P','Q','R','S','Ş','T','U','Û','V','W','X','Y','Z'];
  // Focus: letters that failed somewhere in the diagnostic + E (control).
  const targets = ['Û','K','W','Î','N','Ç','E'];
  window.__zoneResults = [];
  for (const g of targets) {
    const gi = glyphs.indexOf(g);
    for (const l of ['good','average','rushed']) {
      const seed = 901 + gi*3 + lvlIdx[l];
      const mask = mod.buildLetterMask(g);
      const ink = sim(mask, l, seed, axis[l]);
      const t = mod.evaluateTrace(mask, ink, undefined, g);
      if (!t.passed) {
        window.__zoneResults.push({ g, l, passed:t.passed, coverage:+(t.coverage*100).toFixed(1), oob:+(t.outOfBounds*100).toFixed(1), reason:t.reason,
          zones: t.zones.filter(z=>z.targetPixels>=mod.ZONE_MIN_PIXELS).sort((a,b)=>a.coverage-b.coverage)
            .map(z=>({r:z.row,c:z.col,px:z.targetPixels,cov:+(z.coverage*100).toFixed(1),ok:z.passed})) });
      }
    }
  }
  return window.__zoneResults;
});

for (const r of out) {
  console.log(`\n=== ${r.g} / ${r.l} → FAIL (cov ${r.coverage}%, oob ${r.oob}%, reason ${r.reason})`);
  console.log('   zones (worst first):');
  for (const z of r.zones.slice(0, 8)) console.log(`     row${z.r},col${z.c}  ${z.px}px  cov ${z.cov}%  ${z.ok?'ok':'FAIL'}`);
}
if (!out.length) console.log('NO FAILURES — all focused letters pass at every level.');
await b.close();

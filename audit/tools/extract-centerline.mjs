import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
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
const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: 'shell', env: {...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH||''}`} });
const page = await browser.newPage();
await page.goto('http://localhost:3000/', { waitUntil:'load', timeout:60000 }).catch(()=>{});
const glyphs = (process.argv[2]||'C,L,O,G,J,Q').split(',').map(s=>s.trim());
const out = await page.evaluate(async (gs) => { const __dbg=[];
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;
  function erode(mask, size, radius) {
    const n = size*size; const out = new Uint8ClampedArray(n);
    if (radius<=0){ for(let i=0;i<n;i++) out[i]=mask[i]; return out; }
    const INF=0x3fffffff; const dist=new Int32Array(n);
    for(let i=0;i<n;i++) dist[i]=mask[i]===1?INF:0;
    for(let r=0;r<size;r++) for(let c=0;c<size;c++){const i=r*size+c; if(r>0)dist[i]=Math.min(dist[i],dist[i-size]+1); if(c>0)dist[i]=Math.min(dist[i],dist[i-1]+1);}
    for(let r=size-1;r>=0;r--) for(let c=size-1;c>=0;c--){const i=r*size+c; if(r<size-1)dist[i]=Math.min(dist[i],dist[i+size]+1); if(c<size-1)dist[i]=Math.min(dist[i],dist[i+1]+1);}
    for(let i=0;i<n;i++) if(mask[i]===1&&dist[i]>radius) out[i]=1;
    return out;
  }
  function bboxOf(mask){
    let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
    for(let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
    return {minC,minR,w:maxC-minC,h:maxR-minR};
  }
  const res={};
  for (const g of gs) {
    const mask = trace.buildLetterMask(g);
    // find a radius where the centerline is ~single-pixel thick but non-empty
    let skel=null, radius=0;
    for (let r=10; r<=14; r+=2) {
      const s = erode(mask, SIZE, r);
      let n=0; for(let i=0;i<s.length;i++) if(s[i]===1) n++;
      if (n>0 && n<1400) { skel=s; radius=r; break; }
    }
    const bb = bboxOf(mask);
    const on = [];
    for(let i=0;i<skel.length;i++) if(skel[i]===1) on.push(i);
    res[g]={ radius, bb, count: on.length, on }; __dbg.push(`${g}: r=${radius} n=${on.length}`);
  }
  return {res, dbg:__dbg};
}, glyphs);

// Order + resample + print (done in node where it's easy to debug).
for (const g of glyphs) {
  console.log(`${g} meta radius=${out.res[g]?.radius} count=${out.res[g]?.count}`);
  const { on, bb, radius, count } = out.res[g];
  const SIZE = 320;
  const px = on.map((i) => ({ c:i%SIZE, r:(i/SIZE)|0 }));
  // 8-neighborhood set key
  const key = (c,r)=>r*SIZE+c;
  const set = new Set(px.map(p=>key(p.c,p.r)));
  // degree (neighbors count)
  const deg = (p) => {
    let n=0;
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
      if (dr===0&&dc===0) continue;
      if (set.has(key(p.c+dc,p.r+dr))) n++;
    }
    return n;
  };
  // endpoints = degree 1
  const endpoints = px.filter(p=>deg(p)===1);
  let start = null;
  if (endpoints.length>=2) {
    // choose upper endpoint as start (handwriting starts high)
    const sortedEnds = [...endpoints].sort((a,b)=>a.r-b.r);
    start = sortedEnds[0];
  } else if (px.length>0) {
    // closed ring: start at the leftmost-topmost-ish point
    const sorted = [...px].sort((a,b)=>(a.c+b.r)-(b.c+b.r));
    start = sorted[0];
  }
  if (!start) { console.log(`${g}: empty skeleton px=${px.length} endpoints=${endpoints.length}`); continue; }
  // walk: always advance to an unvisited neighbor until stuck
  const order=[start];
  const visited=new Set([key(start.c,start.r)]);
  let cur=start, guard=10000;
  while (guard-->0) {
    let best=null, bestScore=Infinity;
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
      if (dr===0&&dc===0) continue;
      const nk=key(cur.c+dc,cur.r+dr);
      if (!set.has(nk) || visited.has(nk)) continue;
      // prefer continuing straight-ish (continue previous direction)
      const cand={c:cur.c+dc,r:cur.r+dr};
      let score=1;
      // bias: prefer fewer-future-options = tip over junction
      if (deg(cand)<=2) score=0;
      if (score<bestScore){bestScore=score;best=cand;}
    }
    if (!best) break;
    visited.add(key(best.c,best.r));
    order.push(best);
    cur=best;
  }
  // any leftover unvisited pixels appended (isolated dots)
  for (const p of px) if (!visited.has(key(p.c,p.r))) { order.push(p); visited.add(key(p.c,p.r)); }
  // resample to N points
  function resample(path, n){
    if (path.length<2) return path;
    const lens=[0];
    for(let i=1;i<path.length;i++) lens.push(lens[i-1]+Math.hypot(path[i].c-path[i-1].c,path[i].r-path[i-1].r));
    const total=lens[lens.length-1];
    const out=[]; let seg=0;
    for(let k=0;k<n;k++){
      const tgt=(total*k)/(n-1);
      while(seg<path.length-2&&lens[seg+1]<tgt) seg++;
      const a=path[seg], b=path[Math.min(seg+1,path.length-1)];
      const segLen=Math.max(1e-9,lens[seg+1]-lens[seg]);
      const t=Math.max(0,Math.min(1,(tgt-lens[seg])/segLen));
      out.push({c:a.c+(b.c-a.c)*t, r:a.r+(b.r-a.r)*t});
    }
    return out;
  }
  const N = g==='W'?24:28;
  const smoothPath = resample(order, N);
  // light smoothing (2 passes)
  let pts=smoothPath;
  for(let pass=0;pass<2;pass++){
    const next=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[Math.max(0,i-1)],b=pts[i],c=pts[Math.min(pts.length-1,i+1)];
      next.push({c:(a.c+b.c+c.c)/3, r:(a.r+b.r+c.r)/3});
    }
    pts=next;
  }
  const norm=pts.map(p=>({x:+(((p.c-bb.minC)/bb.w)).toFixed(3), y:+(((p.r-bb.minR)/bb.h)).toFixed(3)}));
  console.log(`\n${g}  (bbox ${bb.w}x${bb.h}, erodedR=${radius}, skelPx=${count})`);
  console.log(`  path: 'M ${norm.map(p=>`${p.x} ${p.y}`).join(' L ')}',`);
}
await browser.close();

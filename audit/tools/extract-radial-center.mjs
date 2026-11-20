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
const glyphs = (process.argv[2]||'C,Ç').split(',').map(s=>s.trim());
const out = await page.evaluate(async (gs) => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;
  const res={};
  for (const g of gs) {
    const mask = trace.buildLetterMask(g);
    let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
    for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
    const w=maxC-minC, h=maxR-minR;
    // For C-like: derive center as ((minC+maxC)/2, (minR+maxR)/2) in normalized coords
    const cx=(maxC+minC)/2, cy=(maxR+minR)/2;
    // radial median: for each angle (0..360, step 3deg), collect ink pixels in that sector within the ring, median radius
    const rays=[];
    for (let a=0; a<360; a+=3) {
      const th=a*Math.PI/180;
      const dirx=Math.cos(th), diry=Math.sin(th);
      const dists=[];
      // sample a thick ray
      for (let i=0;i<mask.length;i++) {
        if (mask[i]!==1) continue;
        const r=(i/SIZE)|0, c=i%SIZE;
        const dx=c-cx, dy=r-cy;
        const len=Math.hypot(dx,dy);
        if (len<2) continue;
        // angular distance from ray
        const cross=Math.abs(dx*diry-dy*dirx);
        if (cross/ len < 0.35) dists.push(len);
      }
      if (dists.length) {
        dists.sort((p,q)=>p-q);
        const med=dists[dists.length>>1];
        rays.push({a, x:(cx+med*Math.cos(th)-minC)/w, y:(cy+med*Math.sin(th)-minR)/h, n:dists.length});
      }
    }
    res[g]={w,h,rays};
  }
  return res;
}, glyphs);
for (const g of glyphs) {
  const {rays} = out[g];
  console.log(`\n${g}: radial-median centerline (a, x, y, n)`);
  for (const r of rays) console.log(`${r.a} ${r.x.toFixed(3)} ${r.y.toFixed(3)} ${r.n}`);
}
await browser.close();

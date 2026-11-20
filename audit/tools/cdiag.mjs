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
const out = await page.evaluate(async () => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const data = await import(`${location.origin}/src/data/letterStrokes.ts`);
  const SIZE = trace.TRACE_CANVAS;
  const res={};
  for (const g of ['C']) {
    const mask = trace.buildLetterMask(g);
    let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
    for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
    const bb={minC,minR,w:maxC-minC,h:maxR-minR};
    const plan = data.getLetterStrokes(g);
    const strokesPx = data.letterStrokesToPx(plan, bb).flat();
    // report normalized sample row-by-row: for each guide point, distance to nearest fill
    const fill=[];
    for (let i=0;i<mask.length;i++) if(mask[i]===1) fill.push(i);
    const row=[];
    for (const p of strokesPx) {
      let best=Infinity;
      for (const i of fill){ const r=(i/SIZE)|0,c=i%SIZE; const d=(p.x-c)**2+(p.y-r)**2; if(d<best)best=d; }
      row.push({x:+((p.x-minC)/bb.w).toFixed(3), y:+((p.y-minR)/bb.h).toFixed(3), d:+(Math.sqrt(best)).toFixed(1)});
    }
    res[g]=row;
  }
  return res;
});
for (const p of out.C) console.log(`x=${p.x} y=${p.y} distToFill=${p.d}px`);
await browser.close();

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
const glyphs = (process.argv[2]||'C,O,G,Q,J,W,L').split(',').map(s=>s.trim());
const out = await page.evaluate(async (gs) => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;
  const res = {};
  for (const g of gs) {
    const mask = trace.buildLetterMask(g);
    let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
    for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
    const w=maxC-minC, h=maxR-minR;
    // per-column profile: use 41 columns for fidelity
    const COLS = 40;
    const rowsBuffer=[];
    for (let k=0;k<=COLS;k++) {
      const c0 = minC+Math.round(k*w/COLS);
      let top=null, bot=null;
      for (let r=minR;r<=maxR;r++) if (mask[r*SIZE+c0]===1){ if(top===null) top=r; bot=r; }
      rowsBuffer.push({x:k/COLS, top:top===null?null:(top-minR)/h, bot:bot===null?null:(bot-minR)/h});
    }
    res[g]={w,h,rowsBuffer};
  }
  return res;
}, glyphs);
for (const g of glyphs) {
  const {w,h,rowsBuffer} = out[g];
  console.log(`\n${g} bbox=${w}x${h}`);
  let line='';
  for (const rb of rowsBuffer) {
    if (rb.top===null) { line+= ' ·'; continue; }
    line += ` ${rb.top.toFixed(2)}|${rb.bot.toFixed(2)}`;
  }
  console.log(' (top|bottom per x):'); console.log(line);
  const center = rowsBuffer.filter(rb=>rb.top!==null).map(rb=>`${rb.x.toFixed(2)},${((rb.top+rb.bot)/2).toFixed(3)}`);
  console.log(' center:', center.join(' '));
}
await browser.close();

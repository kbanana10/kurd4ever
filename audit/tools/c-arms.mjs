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
  const SIZE = trace.TRACE_CANVAS;
  const g='C';
  const mask = trace.buildLetterMask(g);
  let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
  for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
  const w=maxC-minC, h=maxR-minR;
  function band(x0,x1, which){
    const rows=[];
    for (let f=x0; f<=x1; f+=0.01) {
      const c = minC + Math.round(f*w);
      let top=null, bot=null;
      for (let r=minR;r<=maxR;r++) if(mask[r*SIZE+c]===1){ if(top===null)top=r; bot=r; }
      if (top===null) continue;
      // restrict to the arm's y-range
      const ytop=(top-minR)/h, ybot=(bot-minR)/h;
      let pick;
      if (which==='top') pick = ytop < 0.45 ? (ytop+ybot)/2 : null;
      else pick = ybot > 0.5 ? (ytop+ybot)/2 : null;
      if (pick!==null) rows.push({x:+(f).toFixed(2), y:+pick.toFixed(3)});
    }
    return rows;
  }
  return { top: band(0.74, 1.0, 'top'), bot: band(0.74, 1.0, 'bot') };
});
console.log('TOP ARM (x,y):', JSON.stringify(out.top));
console.log('BOT ARM (x,y):', JSON.stringify(out.bot));
await browser.close();

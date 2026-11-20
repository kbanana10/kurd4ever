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
  const mask = trace.buildLetterMask('Ç');
  let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
  for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
  const W=maxC-minC, H=maxR-minR;
  const rows=[];
  for (let rr=minR; rr<=maxR; rr++) {
    const y0=+((rr-minR)/H).toFixed(3);
    if (y0 < 0.83) continue; // cedilla only region
    let l=null, rt=null, seg=[];
    let inRun=false, runStart=null;
    for (let c=minC;c<=maxC;c++) {
      const on = mask[rr*SIZE+c]===1;
      if (on && !inRun){ inRun=true; runStart=c; }
      else if (!on && inRun){ inRun=false; seg.push([runStart, c-1]); }
    }
    if (inRun) seg.push([runStart, maxC]);
    // choose the run that is a continuation of the cedilla (not the body). body ends ~y0=0.806, so any run here is cedilla
    // compute mid of widest run
    let best=null;
    for (const [a,b] of seg){ if(rt===null||b-a>(best?best[1]-best[0]:0)) best=[a,b]; }
    if (best){
      const mid=(best[0]+best[1])/2;
      rows.push({ y0, xl:+((best[0]-minC)/W).toFixed(3), xr:+((best[1]-minC)/W).toFixed(3), xm:+((mid-minC)/W).toFixed(3), w:(best[1]-best[0]) });
    }
  }
  return rows;
});
for (const r of out) console.log(r.y0, 'x', r.xl, '..', r.xr, 'mid', r.xm, 'w', r.w);
await browser.close();

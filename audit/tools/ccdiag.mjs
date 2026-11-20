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
  const w=maxC-minC, h=maxR-minR, H=h, W=w;
  // flip y for display
  // Distances: find nearest fill for any (x,y) in 0..1
  const dist=(X,Y)=>{
    const c=Math.round(minC+X*W), r=Math.round(minR+(1-Y)*H);
    let best=1e9;
    for(let dr=-40;dr<=40;dr++)for(let dc=-40;dc<=40;dc++){
      const rr=r+dr, cc=c+dc;
      if(rr<0||cc<0||rr>=SIZE||cc>=SIZE)continue;
      if(mask[rr*SIZE+cc]===1){const d=Math.hypot(dr,dc); if(d<best)best=d;}
    }
    return best;
  };
  // per-row spans to find C body extent
  const rows=[];
  for (let rr=minR; rr<=maxR; rr++) {
    let l=null, rt=null;
    for (let c=minC;c<=maxC;c++) if(mask[rr*SIZE+c]===1){ if(l===null)l=c; rt=c; }
    if (l!==null) rows.push({y:+((minR)- rr)/H+1 /* y-up: y=1-(rr-minR)/H */, y0:+((rr-minR)/H).toFixed(3), l:+((l-minC)/W).toFixed(3), r:+((rt-minC)/W).toFixed(3)});
  }
  return {W,H,rows};
});
console.log('Ç bbox', out.W, 'x', out.H);
for (const r of out.rows) console.log('y0=', r.y0, 'x', r.l, '..', r.r);
await browser.close();

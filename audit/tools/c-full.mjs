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
  function bounds(mask){let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;for(let i=0;i<mask.length;i++)if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}return{minC,minR,w:maxC-minC,h:maxR-minR};}
  const res={};
  for (const g of ['C']) {
    const mask=trace.buildLetterMask(g); const bb=bounds(mask);
    const cols=[];
    for (let f=0; f<=1.0001; f+=0.02) {
      const c=bb.minC+Math.round(f*bb.w); let start=null; const runs=[];
      for(let r=bb.minR;r<=bb.minR+bb.h;r++){const on=mask[r*SIZE+c]===1; if(on&&start===null)start=r; if(!on&&start!==null){runs.push([start, r-1]); start=null;}}
      if(start!==null) runs.push([start, bb.minR+bb.h]);
      const mids=runs.map(([a,b])=>(((a+b)/2-bb.minR)/bb.h));
      cols.push({x:+f.toFixed(2), runs: runs.map(([a,b])=>[((a-bb.minR)/bb.h), ((b-bb.minR)/bb.h)]), mids:mids.map(m=>+m.toFixed(3))});
    }
    res[g]=cols;
  }
  return res;
});
for (const c of out.C) console.log(`x=${c.x} mids=${JSON.stringify(c.mids)}`);
await browser.close();

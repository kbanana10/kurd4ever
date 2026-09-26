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
for (const g of ['I','Î']) {
  const out = await page.evaluate(async (g) => {
    const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
    const SIZE = trace.TRACE_CANVAS; // 170
    const mask = trace.buildLetterMask(g);
    let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
    for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
    const w=maxC-minC, h=maxR-minR;
    const X=(c)=>+( (c-minC)/w ).toFixed(4);
    const Y=(r)=>+( (r-minR)/h ).toFixed(4);
    // per-row
    const rows=[];
    for (let rr=minR; rr<=maxR; rr++) {
      let l=null, rt=null;
      for (let c=minC;c<=maxC;c++) if(mask[rr*SIZE+c]===1){ if(l===null)l=c; rt=c; }
      if (l!==null) rows.push([rr, l, rt]);
    }
    // distill: find contiguous row-bands
    const bands=[];
    let cur=null;
    for (const [rr,l,rt] of rows){
      if(cur && rr===cur.last+1){ cur.last=rr; cur.l=Math.min(cur.l,l); cur.r=Math.max(cur.r,rt); }
      else { if(cur)bands.push(cur); cur={start:rr,last:rr,l,r:rt}; }
    }
    if(cur)bands.push(cur);
    const res=[];
    for (const b of bands){
      res.push({ band:`${Y(b.start)}..${Y(b.last)}`, x:[X(b.l), X(b.r)], xcenter: X(Math.round((b.l+b.r)/2)) });
      // top row and bottom row spans
      res.push({ firstRow:`y=${Y(b.start)} x=${X(b.l)}..${X(b.r)}`, lastRow:`y=${Y(b.last)} x=${X(rows.find(r=>r[0]===b.last)[1])}..${X(rows.find(r=>r[0]===b.last)[2])}` });
    }
    return { w, h, bands: res };
  }, g);
  console.log('\n=== '+g+' bbox '+out.w+'x'+out.h+' ===');
  for (const b of out.bands) console.log(JSON.stringify(b));
}
await browser.close();

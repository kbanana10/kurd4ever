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
  const mC = trace.buildLetterMask('C');
  const mCC = trace.buildLetterMask('Ç');
  // bboxes
  const bb=(m)=>{let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}return{minR,maxR,minC,maxC,w:maxC-minC,h:maxR-minR};};
  const cBox=bb(mC), ccBox=bb(mCC);
  // body in Ç: x maps 1:1 (same width), y_ç = y_c * 0.806 (both topleft-aligned top)
  const scale=0.806;
  // cedilla mask: Çpix where xc,yc is NOT within body
  const ced=new Array(SIZE*SIZE).fill(0);
  let n=0;
  for(let r=ccBox.minR;r<=ccBox.maxR;r++)for(let c=ccBox.minC;c<=ccBox.maxC;c++){
    if(mCC[r*SIZE+c]===1){
      const xc=(c-ccBox.minC)/ccBox.w;
      const yc=(r-ccBox.minR)/ccBox.h;
      const y_c=yc/scale;
      if(y_c<0||y_c>1){ced[r*SIZE+c]=1;n++;continue;}
      const rr=Math.round(cBox.minR + y_c*cBox.h);
      const cc=Math.round(cBox.minC + xc*cBox.w);
      if(mC[rr*SIZE+cc]!==1){ced[r*SIZE+c]=1;n++;}
    }
  }
  const cBoxCed=bb(ced);
  // per-row runs of cedilla (in cedilla bbox coords)
  const rows=[];
  for(let r=ced.minR;r<=ced.maxR;r++){
    const y0=+((r-ccBox.minR)/ccBox.h).toFixed(3);
    let runs=[],inRun=false,st=null;
    for(let c=ced.minC;c<=ced.maxC;c++){
      const on=ced[r*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=c;}
      else if(!on&&inRun){inRun=false;runs.push([st,c-1]);}
    }
    if(inRun)runs.push([st,ced.maxC]);
    for(const [a,b] of runs) rows.push({y0, xl:+((a-ccBox.minC)/ccBox.w).toFixed(3), xr:+((b-ccBox.minC)/ccBox.w).toFixed(3), xm:+(((a+b)/2-ccBox.minC)/ccBox.w).toFixed(3), w:b-a});
  }
  return {rows, n};
});
console.log('cedilla pixels:', out.n);
for (const r of out.rows) console.log(r.y0, 'x', r.xl, '..', r.xr, 'mid', r.xm, 'w', r.w);
await browser.close();

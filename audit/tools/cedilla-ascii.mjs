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
const text = await page.evaluate(async () => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;
  const mC = trace.buildLetterMask('C');
  const mCC = trace.buildLetterMask('Ç');
  const bb=(m)=>{let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}return{minR,maxR,minC,maxC,w:maxC-minC,h:maxR-minR};};
  const cBox=bb(mC), ccBox=bb(mCC);
  const scale=0.806;
  const ced=new Uint8Array(SIZE*SIZE);
  for(let r=ccBox.minR;r<=ccBox.maxR;r++)for(let c=ccBox.minC;c<=ccBox.maxC;c++){
    if(mCC[r*SIZE+c]===1){
      const xc=(c-ccBox.minC)/ccBox.w, yc=(r-ccBox.minR)/ccBox.h;
      const y_c=yc/scale;
      if(y_c<0||y_c>1){ced[r*SIZE+c]=1;continue;}
      const rr=Math.round(cBox.minR + y_c*cBox.h);
      const cc=Math.round(cBox.minC + xc*cBox.w);
      if(mC[rr*SIZE+cc]!==1)ced[r*SIZE+c]=1;
    }
  }
  const b=bb(ced);
  // ASCII in cedilla coords, 64x40
  const COLS=64, ROWS=40;
  let out='';
  for(let ry=0;ry<ROWS;ry++){
    let line='';
    for(let cx=0;cx<COLS;cx++){
      const c0=b.minC+Math.floor(cx*b.w/COLS), c1=b.minC+Math.floor((cx+1)*b.w/COLS);
      const r0=b.minR+Math.floor(ry*b.h/ROWS), r1=b.minR+Math.floor((ry+1)*b.h/ROWS);
      let n=0;
      for(let r=r0;r<r1;r++)for(let c=c0;c<c1;c++)if(ced[r*SIZE+c]===1)n++;
      const f=n?n/((c1-c0)*(r1-r0)):0;
      line+=f>0.6?'#':f>0.3?'+':f>0.08?'.':' ';
    }
    out+=line+'\n';
  }
  return out;
});
console.log(text);
await browser.close();

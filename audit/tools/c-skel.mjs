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
  const erode=(mask,size,r)=>{const n=size*size;const out=new Uint8ClampedArray(n);if(r<=0){for(let i=0;i<n;i++)out[i]=mask[i];return out;}const INF=0x3fffffff;const d=new Int32Array(n);for(let i=0;i<n;i++)d[i]=mask[i]===1?INF:0;for(let r2=0;r2<size;r2++)for(let c=0;c<size;c++){const i=r2*size+c;if(r2>0)d[i]=Math.min(d[i],d[i-size]+1);if(c>0)d[i]=Math.min(d[i],d[i-1]+1);}for(let r2=size-1;r2>=0;r2--)for(let c=size-1;c>=0;c--){const i=r2*size+c;if(r2<size-1)d[i]=Math.min(d[i],d[i+size]+1);if(c<size-1)d[i]=Math.min(d[i],d[i+1]+1);}for(let i=0;i<n;i++)if(mask[i]===1&&d[i]>r)out[i]=1;return out;};
  const g='C';
  const mask=trace.buildLetterMask(g);
  let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
  for(let i=0;i<mask.length;i++)if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
  const bb={minC,minR,w:maxC-minC,h:maxR-minR};
  // try a few erosion radii; report on-pixel count per radius
  const radii=[];
  for (const r of [6,8,10,12,14]) {
    const s=erode(mask,SIZE,r); let n=0; for(let i=0;i<s.length;i++)if(s[i]===1)n++;
    radii.push({r,n});
  }
  return {radii, bb};
});
console.log(JSON.stringify(out));
await browser.close();

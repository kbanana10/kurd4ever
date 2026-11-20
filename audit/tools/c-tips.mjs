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
  // top arm tip: in top half (y<0.4*norm), the max column
  let topTip={c:-1,r:-1};
  for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; const yn=(r-minR)/h;
    if (yn<0.3 || (yn<0.55 && c>topTip.c && yn<0.45)) { if (c>topTip.c) topTip={c,r}; }}
  // simpler: top arm tip = rightmost ink with yn<0.42; bottom arm = rightmost ink with yn>0.5
  let tt={c:-1,r:0}, bt={c:-1,r:0};
  for (let i=0;i<mask.length;i++) if(mask[i]===1){const r=(i/SIZE)|0,c=i%SIZE; const yn=(r-minR)/h;
    if (yn<0.42 && c>tt.c) tt={c,r};
    if (yn>0.5 && c>bt.c) bt={c,r};
  }
  return {
    topTip: {x:+((tt.c-minC)/w).toFixed(3), y:+((tt.r-minR)/h).toFixed(3)},
    botTip: {x:+((bt.c-minC)/w).toFixed(3), y:+((bt.r-minR)/h).toFixed(3)},
  };
});
console.log(JSON.stringify(out));
await browser.close();

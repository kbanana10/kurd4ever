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
  const bb=(m)=>{let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}return{minR,maxR,minC,maxC,w:maxC-minC,h:maxR-minR};};
  const cBox=bb(mC), ccBox=bb(mCC);
  const scale=ccBox.w/cBox.w;      // x scale (1:1 in width here)
  const yscale=ccBox.h/cBox.h;     // 217/175 = 1.24 ... no. body occupies y 0..0.806
  // The body is NOT full height of Ç: body top == Ç top (y=0), body height scale computed by comparing C's aspect
  // body height in Ç pixels = cBox.h * (ccBox.w/cBox.w) = 168*(143/143)=... careful:
  // C body: w=143,h=175. Ç: w=143,h=217. Body in Ç occupies top 175px? No — 175/217=0.806 of height.
  const bodyH = cBox.h; // in pixels, since widths equal (143), the body is rendered at same pixel size
  const ced=new Uint8Array(SIZE*SIZE);
  for(let r=ccBox.minR;r<=ccBox.maxR;r++)for(let c=ccBox.minC;c<=ccBox.maxC;c++){
    if(mCC[r*SIZE+c]===1){
      const rr = r - ccBox.minR;   // local y in Ç
      if (rr > bodyH) { ced[r*SIZE+c]=1; continue; }   // clean cedilla zone
      // else it's body zone; skip entirely
    }
  }
  const b=bb(ced);
  // print all runs per row in cedilla coords
  const rows=[];
  for(let r=b.minR;r<=b.maxR;r++){
    const y0=+((r-ccBox.minR)/ccBox.h).toFixed(3);
    let runs=[],inRun=false,st=null;
    for(let c=b.minC;c<=b.maxC;c++){
      const on=ced[r*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=c;}
      else if(!on&&inRun){inRun=false;runs.push([st,c-1]);}
    }
    if(inRun)runs.push([st,b.maxC]);
    const tmp=runs.map(([a,bbx])=>`${+((a-ccBox.minC)/ccBox.w).toFixed(3)}..${+((bbx-ccBox.minC)/ccBox.w).toFixed(3)}`).join('  |  ');
    rows.push(`${y0}  ${tmp}`);
  }
  return rows;
});
for (const r of out) console.log(r);
await browser.close();

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'node:path'; import os from 'node:os';
const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: 'shell', env: {...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH||''}`} });
const page = await browser.newPage();
await page.goto('http://localhost:3000/', { waitUntil:'load', timeout:60000 }).catch(()=>{});
const out = await page.evaluate(async () => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;
  const m = trace.buildLetterMask('J');
  let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
  for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
  const W=maxC-minC, H=maxR-minR, w=W, h=H;
  // ascii
  const COLS=60, ROWS=40;
  let out=`J bbox ${W}x${H}\n`;
  for(let ry=0;ry<ROWS;ry++){
    let line='';
    for(let cx=0;cx<COLS;cx++){
      const c0=minC+Math.floor(cx*w/COLS), c1=minC+Math.floor((cx+1)*w/COLS);
      const r0=minR+Math.floor(ry*h/ROWS), r1=minR+Math.floor((ry+1)*h/ROWS);
      let n=0;
      for(let r=r0;r<r1;r++)for(let c=c0;c<c1;c++)if(m[r*SIZE+c]===1)n++;
      const f=n?n/((c1-c0)*(r1-r0)):0;
      line+=f>0.6?'#':f>0.3?'+':f>0.08?'.':' ';
    }
    out+=line+'\n';
  }
  return out;
});
console.log(out);
await browser.close();

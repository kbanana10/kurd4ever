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
  const W=maxC-minC, H=maxR-minR;
  const rows=[];
  for(let rr=minR;rr<=maxR;rr++){
    const y=+((rr-minR)/H).toFixed(3);
    let runs=[],inRun=false,st=null;
    for(let c=minC;c<=maxC+1;c++){
      const on = c<=maxC && m[rr*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=c;}
      else if(!on&&inRun){inRun=false;runs.push([st,c-1]);}
    }
    if(runs.length) rows.push({y,runs:runs.map(([a,b])=>[+((a-minC)/W).toFixed(3),+((b-minC)/W).toFixed(3)])});
  }
  return rows;
});
for (const r of out) console.log(r.y, r.runs.map(x=>`${x[0]}..${x[1]}`).join(' | '));
await browser.close();

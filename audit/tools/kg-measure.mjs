import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: 'shell', env: {...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH||''}`} });
const page = await browser.newPage();
await page.goto('http://localhost:3000/', { waitUntil:'load', timeout:60000 }).catch(()=>{});
const out = await page.evaluate(async () => {
  const trace = await import(`${location.origin}/src/lib/traceLetters.ts`);
  const SIZE = trace.TRACE_CANVAS;
  const bb=(m)=>{let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}return{minR,maxR,minC,maxC,w:maxC-minC,h:maxR-minR};};

  // K stem x-extent (left 3% of rows)
  const mK = trace.buildLetterMask('K');
  const bK = bb(mK);
  const K = (g)=>{ const m=trace.buildLetterMask(g); const b=bb(m); return {X:c=>+((c-b.minC)/b.w).toFixed(3), Y:r=>+((r-b.minR)/b.h).toFixed(3)}; };
  const k = K('K');
  // stem: leftmost run per row near top rows
  const stemRuns=[];
  for(let rr=bK.minR;rr<=bK.maxR;rr++){
    let l=null,rt=null;
    for(let c=bK.minC;c<=bK.maxC;c++) if(mK[rr*SIZE+c]===1){if(l===null)l=c; rt=c;}
    // stem run = leftmost; if there are two runs (arms) capture both
    if(l!==null) stemRuns.push({y:k.Y(rr), l:k.X(l)});
  }
  // rightmost extent of stem: scan column profile at top (y~0.1) to find stem right edge
  let stemRightCol=null;
  const topRow = bK.minR + Math.round(bK.h*0.1);
  for(let c=bK.minC;c<=bK.maxC;c++){ if(mK[topRow*SIZE+c]===1){ stemRightCol=c; } }
  const stemRight = k.X(stemRightCol);
  // junction: find lowest row where the diagonal arms leave the stem. Look for rows where a second run (arm) appears to the right of stem.
  let junctionY=null;
  for(let rr=bK.minR;rr<=bK.maxR;rr++){
    let inRun=false, runs=[], st=null;
    for(let c=bK.minC;c<=bK.maxC;c++){
      const on=mK[rr*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=c;}
      else if(!on&&inRun){inRun=false; runs.push([st,c-1]);}
    }
    if(inRun)runs.push([st,bK.maxC]);
    if(runs.length>=2){ junctionY=rr; break; }
  }
  // G: nose bar + tongue
  const mG = trace.buildLetterMask('G');
  const bG = bb(mG); const g = K('G');
  // tongue: bottom-middle feature. Find rows in y 0.45..0.62 where a horizontal run exists near center that is separate from ring
  const gRows=[];
  for(let rr=bG.minR; rr<=bG.maxR; rr++){
    const y=g.Y(rr);
    if(y<0.4||y>0.7) continue;
    let inRun=false, runs=[], st=null;
    for(let c=bG.minC;c<=bG.maxC;c++){
      const on=mG[rr*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=c;}
      else if(!on&&inRun){inRun=false; runs.push([st,c-1]);}
    }
    if(inRun)runs.push([st,bG.maxC]);
    gRows.push({y:+y.toFixed(3), runs: runs.map(([a,b])=>`${g.X(a)}..${g.X(b)}`)});
  }
  return { stemRight, junctionY: k.Y(junctionY), gRows: gRows.slice(0, 40) };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();

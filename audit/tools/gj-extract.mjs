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
  const mk=(g)=>{ const m=trace.buildLetterMask(g); let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
    for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
    return {m,minR,maxR,minC,maxC,w:maxC-minC,h:maxR-minR}; };

  // ---- G ring: per-column ink-run mids, EXCLUDING the nose band ----
  const G = mk('G');
  const gcols = [];
  for(let c=G.minC; c<=G.maxC; c++){
    const x=+(((c-G.minC)/G.w)).toFixed(3);
    // runs in this column
    let runs=[], inRun=false, st=null;
    for(let r=G.minR; r<=G.maxR+1; r++){
      const on = r<=G.maxR && G.m[r*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=r;}
      else if(!on&&inRun){inRun=false;runs.push([st,r-1]);}
    }
    if(!runs.length) continue;
    // classify each run: nose = its mid-y is in [0.40,0.66] AND x>0.4 (rough). We keep RING runs.
    const ringRuns = runs.filter(([a,b]) => {
      const ym = ((a+b)/2 - G.minR)/G.h;
      return !(ym > 0.40 && ym < 0.66); // drop nose band
    });
    if(!ringRuns.length) continue;
    // top arm tip detection: if a run's top is near the top (y<0.3) keep its mid as "arm"; otherwise "body"
    for(const [a,b] of ringRuns){
      const ytop= (a-G.minR)/G.h; const ybot=(b-G.minR)/G.h;
      const type = (ybot - ytop) < 0.05 ? 'arm' : 'body'; // short run = arm tip
      const mid = (a+b)/2;
      gcols.push({ x, y: +((mid-G.minR)/G.h).toFixed(3), type });
    }
  }
  // ---- J stem + hook ----
  const J = mk('J');
  const jcols = [];
  for(let c=J.minC; c<=J.maxC; c++){
    const x=+(((c-J.minC)/J.w)).toFixed(3);
    let runs=[], inRun=false, st=null;
    for(let r=J.minR; r<=J.maxR+1; r++){
      const on = r<=J.maxR && J.m[r*SIZE+c]===1;
      if(on&&!inRun){inRun=true;st=r;}
      else if(!on&&inRun){inRun=false;runs.push([st,r-1]);}
    }
    if(!runs.length) continue;
    for(const [a,b] of runs){
      const mid=(a+b)/2;
      jcols.push({ x, y:+((mid-J.minR)/J.h).toFixed(3) });
    }
  }
  return { gcols, jcols };
});
// Print G column mids for x in [0.55, 1] (arm + right side) at coarse step, and all J
console.log('=== G column mids (x, y, type) — arm region ===');
for (const p of out.gcols.filter(p=>p.x>=0.5)) console.log(p.x, p.y, p.type);
console.log('=== G crown/top-left ===');
for (const p of out.gcols.filter(p=>p.y<0.12)) console.log(p.x, p.y, p.type);
await browser.close();

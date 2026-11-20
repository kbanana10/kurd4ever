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
  const armLine=(g, ymin, ym)=>{
    const B=mk(g);
    const pts=[];
    for(let rr=B.minR;rr<=B.maxR;rr++){
      const y=+((rr-B.minR)/B.h).toFixed(3);
      if(y<ymin)continue;
      let runs=[],inRun=false,st=null;
      for(let c=B.minC;c<=B.maxC+1;c++){
        const on = c<=B.maxC && B.m[rr*SIZE+c]===1;
        if(on&&!inRun){inRun=true;st=c;}
        else if(!on&&inRun){inRun=false;runs.push([st,c-1]);}
      }
      if(!runs.length)continue;
      // pick the DIAGONAL arm run: the run whose center is farthest right (not the stem at x<0.28)
      let best=null;
      for(const [a,b] of runs){ const mid=(a+b)/2; if(!best||mid>best.mid) best={mid,a,b}; }
      if(best) pts.push({y, cx:+((best.mid-B.minC)/B.w).toFixed(3), runl:+((best.a-B.minC)/B.w).toFixed(3), runr:+((best.b-B.minC)/B.w).toFixed(3)});
    }
    return pts;
  };
  // R leg: rows 0.62..1 (where leg is separate from bowl)
  const Rleg = armLine('R',0.62,undefined);
  // K lower arm: rows 0.62..1
  const Karm = armLine('K',0.62,undefined);
  return { Rleg, Karm };
});
console.log('=== R leg centerline (y, cx, run) ===');
for (const p of out.Rleg) console.log(p.y, p.cx, `[${p.runl}..${p.runr}]`);
console.log('=== K lower arm centerline ===');
for (const p of out.Karm) console.log(p.y, p.cx, `[${p.runl}..${p.runr}]`);
await browser.close();

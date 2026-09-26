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
  const rowsOf=(B,ymin,ymax)=>{ const rows=[];
    for(let rr=B.minR;rr<=B.maxR;rr++){
      const y=+((rr-B.minR)/B.h).toFixed(3);
      if(y<ymin||y>ymax)continue;
      let runs=[],inRun=false,st=null;
      for(let c=B.minC;c<=B.maxC+1;c++){
        const on = c<=B.maxC && B.m[rr*SIZE+c]===1;
        if(on&&!inRun){inRun=true;st=c;}
        else if(!on&&inRun){inRun=false;runs.push([st,c-1]);}
      }
      if(runs.length) rows.push({y,runs:runs.map(([a,bb])=>[+((a-B.minC)/B.w).toFixed(3), +((bb-B.minC)/B.w).toFixed(3)])});
    }
    return rows; };
  const G = mk('G');
  const J = mk('J');
  return { Gtop: rowsOf(G,0,0.25), Gmouth: rowsOf(G,0.35,0.6), Jtop: rowsOf(J,0,0.2), Jall: rowsOf(J,0,1) };
});
console.log('=== G top rows ===');
for (const r of out.Gtop.slice(0,14)) console.log(r.y, r.runs.map(x=>`${x[0]}..${x[1]}`).join(' | '));
console.log('=== G mouth rows ===');
for (const r of out.Gmouth.slice(0,8)) console.log(r.y, r.runs.map(x=>`${x[0]}..${x[1]}`).join(' | '));
console.log('=== J top (bar) ===');
for (const r of out.Jtop.slice(0,18)) console.log(r.y, r.runs.map(x=>`${x[0]}..${x[1]}`).join(' | '));
console.log('=== J tail ===');
for (const r of out.Jall.slice(-8)) console.log(r.y, r.runs.map(x=>`${x[0]}..${x[1]}`).join(' | '));
await browser.close();

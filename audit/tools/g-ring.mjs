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
  const m = trace.buildLetterMask('G');
  let minR=SIZE,maxR=-1,minC=SIZE,maxC=-1;
  for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE;if(r<minR)minR=r;if(r>maxR)maxR=r;if(c<minC)minC=c;if(c>maxC)maxC=c;}
  const W=maxC-minC, H=maxR-minR;
  // ring center: ring is roughly circular, center near (0.5, 0.55)? compute centroid of mask
  let sx=0, sy=0, n=0;
  for(let i=0;i<m.length;i++)if(m[i]===1){const r=(i/SIZE)|0,c=i%SIZE; sx+=c; sy+=r; n++;}
  const cx=sx/n, cy=sy/n;
  // sample radial median at 48 angles; find most on-glyph ring along each ray (choose the FARTHEST fill, i.e., outer ring wall, then walk inward to midpoint)
  const angles=48;
  const pts=[];
  const px=(c)=>+(((c-minC)/W)).toFixed(3);
  const py=(r)=>+(((r-minR)/H)).toFixed(3);
  for(let k=0;k<angles;k++){
    const ang = (k/angles)*2*Math.PI;
    const dirx=Math.cos(ang), diry=Math.sin(ang);
    // scan outward from center along ray; find inner and outer ring crossings
    let crosses=[];
    let prev=false;
    for(let t=0;t<160;t+=1){
      const X=Math.round(cx+dirx*t), Y=Math.round(cy+diry*t);
      if(X<0||Y<0||X>=SIZE||Y>=SIZE) break;
      const on = m[Y*SIZE+X]===1;
      if(on && !prev) crosses.push(t);
      else if(!on && prev) crosses.push(t);
      prev=on;
    }
    // take the last run (outer ring) midpoint
    if(crosses.length>=2){
      const a=crosses[crosses.length-2], b=crosses[crosses.length-1];
      const mid=(a+b)/2;
      const X=Math.round(cx+dirx*mid), Y=Math.round(cy+diry*mid);
      pts.push({ang:+ang.toFixed(3), x:px(X), y:py(Y), a:+px(Math.round(cx+dirx*a)).toFixed(3), b:+px(Math.round(cx+dirx*b)).toFixed(3)});
    }
  }
  return {W,H,cx:px(Math.round(cx)), cy:py(Math.round(cy)), pts};
});
console.log('bbox', out.W, out.H, 'center', out.cx, out.cy);
for (const p of out.pts) console.log('ang', p.ang, 'x', p.x, 'y', p.y);
await browser.close();

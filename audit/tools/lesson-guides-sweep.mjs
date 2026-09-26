/**
 * lesson-guides-sweep.mjs — assert the trace guide draws a dashed path AND
 * green start / amber end dots for representative letters (curves, loops,
 * diacritics) at 320px. Detects pixels in the guide canvas.
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';
import chromium from '@sparticuz/chromium';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('kurdish_quest_lang', 'en');
  localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA' }));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({ xp: 100, level: 1, gems: 100, streak: 0, reviewDeck: {}, completedLessons: [] }));
});

const LETTERS = ['c','o','q','g','ç','ê','î','ş','û','z','k','w'];
const report = {};
for (const id of LETTERS) {
  await page.goto(`http://localhost:3000/writing/lesson/${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 350));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /Skip to tracing|بدء التتبع مباشرة|Yekser/i.test(x.textContent || ''));
    b?.click();
  });
  await new Promise(r => setTimeout(r, 450));
  report[id] = await page.evaluate(() => {
    const guide = [...document.querySelectorAll('canvas')].find(c => c.getAttribute('aria-hidden') !== null);
    if (!guide) return { error: 'no guide canvas' };
    const ctx = guide.getContext('2d');
    const d = ctx.getImageData(0, 0, guide.width, guide.height).data;
    let dash = 0, green = 0, amber = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
      if (a < 60) continue;
      if (g > 150 && r < 80) green += 1;
      else if (r > 210 && g > 120 && b < 95) amber += 1;
      else dash += 1;
    }
    return { dash, green, amber };
  });
}
console.log(JSON.stringify({ report, errors: errors.slice(0, 4) }, null, 2));
await browser.close();

/**
 * lesson-sweep.mjs — Phase 3 mobile verification: visit the lesson for every
 * one of the 31 letters at 320px, assert zero horizontal overflow, the glyph
 * header renders, the watch stage can advance to trace, and no JS page errors.
 * Run: node audit/tools/lesson-sweep.mjs  (dev server on :3000)
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

const LETTERS = ['a','b','c','ç','d','e','ê','f','g','h','i','î','j','k','l','m','n','o','p','q','r','s','ş','t','u','û','v','w','x','y','z'];
const report = [];
for (const id of LETTERS) {
  await page.goto(`http://localhost:3000/writing/lesson/${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 350));
  const learn = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const glyph = document.querySelector('span[dir="ltr"].font-mono')?.textContent?.trim() ?? null;
    const hasLearn = /Example:|Av|exampleWord|Example word/i.test(document.body.innerText);
    return { overflow, glyph, hasLearn };
  });
  // advance watch → trace and re-check overflow + guide presence
  let trace = { overflow: null, reachable: false };
  try {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /Skip to tracing|بدء التتبع مباشرة|Yekser/i.test(x.textContent || ''));
      b?.click();
    });
    await new Promise(r => setTimeout(r, 300));
    trace = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const reachable = /Trace stroke by stroke|Bişopîne|تتبّع/.test(document.body.innerText);
      const fallback = document.body.innerText.includes('coming soon');
      return { overflow, reachable, fallback };
    });
  } catch { /* keep reporting */ }
  report.push({ id, ...learn, trace });
}
const bad = report.filter(r => r.overflow > 0 || r.trace.overflow > 0 || r.glyph === null || !r.trace.reachable || errors.length);
console.log(JSON.stringify({ letters: report.map(r => r.id), failures: bad, pageErrors: errors.slice(0, 5) }, null, 2));
await browser.close();

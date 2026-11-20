/**
 * lesson-success.mjs — canonical end-to-end probe for the Interactive Letter
 * Writing Lesson (/writing/lesson/:letterId), driven by REAL CDP touch input.
 *
 * Verifies, for letter "a" (A):
 *   1. learn renders, "Skip to tracing" reaches the trace stage.
 *   2. off-path feedback: a deliberately backwards stroke in trace mode yields
 *      "Start from the green start dot." via live-region status.
 *   3. trace: 3 authored A strokes traced via the guide's start/end dots all
 *      succeed and auto-advance to the FREE-WRITE stage.
 *   4. free-write: drawing the A centerlines then "Check" yields a deterministic
 *      score + band + ScoreRing; a ≥60 score flips completed:true and records an
 *      SM-2 reviewDeck entry; XP is awarded EXACTLY once (100 → 108 for the
 *      "Keep practicing" band).
 *   5. retry: a second attempt increments `attempts` WITHOUT re-awarding XP or
 *      re-recording reviewDeck; "Next letter" navigates SPA-style to b.
 *   6. no JS page errors; the page at 320px has zero horizontal overflow.
 *
 * Run: node audit/tools/lesson-success.mjs   (dev server must be on :3000)
 * Seed: kurmanji_user_data_v2 = { xp:100, level:1, gems:100, streak:0,
 *        reviewDeck:{}, completedLessons:[] } — via evaluateOnNewDocument.
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';
import chromium from '@sparticuz/chromium';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
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
await page.goto('http://localhost:3000/writing/lesson/a', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 500));

const out = {};

// ---- 1. reach the trace stage -------------------------------------------------
out.learnShown = await page.evaluate(() => /Learn|A a|Av/i.test(document.body.innerText));
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /Skip to tracing|بدء التتبع مباشرة|Yekser/i.test(x.textContent || ''));
  b?.click();
});
await new Promise(r => setTimeout(r, 400));
out.traceStage = await page.evaluate(() => /Trace stroke by stroke|Trace|stroke/i.test(document.body.innerText));

const session = await page.createCDPSession();
const rect = await page.evaluate(() => {
  const draw = [...document.querySelectorAll('canvas')].find(c => !c.classList.contains('pointer-events-none'));
  const r = draw.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height };
});
const toClient = (px) => ({ x: rect.x + (px.x / 320) * rect.w, y: rect.y + (px.y / 320) * rect.h });

async function readDots() {
  return page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find(c => c.classList.contains('absolute'));
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const green = [], amber = [];
    for (let y = 0; y < cv.height; y += 1) for (let x = 0; x < cv.width; x += 1) {
      const i = (y * cv.width + x) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (a < 200) continue;
      if (g > 150 && r < 80) green.push({ x, y });
      else if (r > 220 && g > 130 && b < 90) amber.push({ x, y });
    }
    const mid = (arr) => arr.length
      ? { x: Math.round(arr.reduce((s, p) => s + p.x, 0) / arr.length), y: Math.round(arr.reduce((s, p) => s + p.y, 0) / arr.length) }
      : null;
    return { green: mid(green), amber: mid(amber) };
  });
}
async function touchPath(pts) {
  if (pts.length < 2) return;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: toClient(pts[0]).x, y: toClient(pts[0]).y }] });
  for (let i = 1; i < pts.length - 1; i += 1) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: toClient(pts[i]).x, y: toClient(pts[i]).y }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function traceDotsSteps(steps = 26) {
  const dots = await readDots();
  if (!dots.green || !dots.amber) return { ok: false, dots };
  const pts = [];
  for (let t = 0; t <= steps; t += 1) {
    pts.push({ x: dots.green.x + (dots.amber.x - dots.green.x) * (t / steps), y: dots.green.y + (dots.amber.y - dots.green.y) * (t / steps) });
  }
  await touchPath(pts);
  await new Promise(r => setTimeout(r, 350));
  return { ok: true, dots };
}

// ---- 2. negative: wrong-start stroke yields gentle "start at green dot" hint --
{
  const dots = await readDots();
  if (dots.green && dots.amber) {
    // Start at the amber END dot and drag toward the green start (backwards).
    const pts = [];
    for (let t = 0; t <= 20; t += 1) {
      pts.push({ x: dots.amber.x + (dots.green.x - dots.amber.x) * (t / 20), y: dots.amber.y + (dots.green.y - dots.amber.y) * (t / 20) });
    }
    await touchPath(pts);
    await new Promise(r => setTimeout(r, 350));
  }
  out.wrongStartFeedback = await page.evaluate(() => document.querySelector('[role="status"]')?.textContent ?? null);
  // The failed stroke is auto-popped, canvas reset for a clean retry.
}

// ---- 3. trace all three strokes → auto-advance to write ----------------------
out.trace = [];
for (let s = 0; s < 3; s += 1) {
  const res = await traceDotsSteps();
  out.trace.push(res);
  if (s === 0) {
    // Real touch ink must be visible on the strokes canvas (proves pointer
    // capture → ink rendering, not just guide pixels).
    out.inkPixelsAfterStroke0 = await page.evaluate(() => {
      // strokes canvas = the non-hidden, pointer-events canvas
      const draw = [...document.querySelectorAll('canvas')].find(c => !c.classList.contains('pointer-events-none'));
      const ctx = draw.getContext('2d');
      const d = ctx.getImageData(0, 0, draw.width, draw.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n += 1;
      return n;
    });
  }
}
out.onWrite = await page.evaluate(() => document.body.innerText.includes('Write it freely'));

// ---- 4. free-write the A centerlines → Check ---------------------------------
const bbox = await page.evaluate(() => {
  const n = 320; const px = Math.max(8, Math.round(320 * 0.82 * 0.88));
  const c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `900 ${px}px "Noto Sans", "Arial", sans-serif`;
  x.fillText('A', n / 2, n / 2);
  const d = x.getImageData(0, 0, n, n).data;
  let minR = n, maxR = -1, minC = n, maxC = -1;
  for (let i = 0; i < n * n; i += 1) {
    if (d[i * 4 + 3] > 0) {
      const r = (i / n) | 0, cc = i % n;
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (cc < minC) minC = cc; if (cc > maxC) maxC = cc;
    }
  }
  return { minC, minR, w: maxC - minC, h: maxR - minR };
});
const authored = [
  [{ x: 0.51, y: 0.03 }, { x: 0.15, y: 0.90 }],
  [{ x: 0.51, y: 0.03 }, { x: 0.87, y: 0.90 }],
  [{ x: 0.28, y: 0.70 }, { x: 0.72, y: 0.70 }],
].map(seg => seg.map(p => ({ x: bbox.minC + p.x * bbox.w, y: bbox.minR + p.y * bbox.h })));
async function drawLetter() {
  for (const seg of authored) {
    const pts = [];
    for (let t = 0; t <= 32; t += 1) {
      pts.push({ x: seg[0].x + (seg[1].x - seg[0].x) * (t / 32), y: seg[0].y + (seg[1].y - seg[0].y) * (t / 32) });
    }
    await touchPath(pts);
  }
  await new Promise(r => setTimeout(r, 250));
}
async function clickCheck() {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /Check|تحقق|Kontrol/i.test(x.textContent || ''));
    b?.click();
  });
  await new Promise(r => setTimeout(r, 900));
}
const snapshot = () => page.evaluate(() => {
  const data = JSON.parse(localStorage.getItem('kurmanji_user_data_v2') || '{}');
  return {
    xp: data.xp,
    reviewDeckA: data.reviewDeck?.a ?? null,
    writingProgressA: data.writingProgress?.A ?? null,
    ring: document.querySelector('[role="img"]')?.getAttribute('aria-label') ?? null,
    url: location.pathname,
  };
});

await drawLetter();
await clickCheck();
out.afterAttempt1 = await snapshot();

// ---- 5. retry (second attempt) then Next letter ------------------------------
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /Try again|Dîsa|copê|حاول مجدداً/i.test(x.textContent || ''));
  b?.click();
});
await new Promise(r => setTimeout(r, 500));
await drawLetter();
await clickCheck();
out.afterAttempt2Retry = await snapshot();

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /Next letter|Tîpa din|الحرف التالي/i.test(x.textContent || ''));
  b?.click();
});
await new Promise(r => setTimeout(r, 900));
out.afterNextLetter = await snapshot();

// ---- 6. 320px overflow --------------------------------------------------------
const wide = await browser.newPage();
await wide.setViewport({ width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await wide.goto('http://localhost:3000/writing/lesson/a', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 600));
out.overflow320 = await wide.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await wide.close();

out.errors = errors.slice(0, 4);
console.log(JSON.stringify(out, null, 2));
await browser.close();

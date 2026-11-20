// writing-health.mjs — C6 render-health probe for writing routes (no 3-col
// contract there: it's a letter grid + tracing canvases). Loads /writing and
// /writing/e in en + ar, counting letter tiles / canvases / audio buttons, and
// screenshots each. Exit 1 if a route fails to render expected structure.
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const OUT = path.resolve('measure-ui-proof');
fs.mkdirSync(OUT, { recursive: true });

const SEED = {
  xp: 480, level: 4, gems: 240, streakFreezes: 1, streak: 6,
  lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
  createdAt: Date.now(), updatedAt: Date.now(), wordsLearned: 42,
  recentSearches: [], favorites: [], completedLessons: ['a1_family'],
  unlockedLevels: ['A1'], badges: [], gameScores: {}, wrongAnswersHistory: [],
  reviewDeck: {}, weakCategories: {}, strongCategories: {}, sessionsCount: 9,
  totalStudyTime: 3600, isOnboarded: true, dailyGoalXp: 50,
};

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 390, height: 844 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});

let failures = 0;

async function check(route, lang, theme, expect) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(({ lang, theme, data }) => {
    try {
      localStorage.setItem('kurdish_quest_theme', theme);
      localStorage.setItem('kurdish_quest_lang', lang);
      localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA' }));
      localStorage.setItem('kurmanji_user_data_v2', JSON.stringify(data));
    } catch {}
  }, { lang, theme, data: SEED });
  await page.goto(`http://localhost:3000${route}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  const r = await page.evaluate(() => ({
    title: (document.querySelector('h1') || document.querySelector('h2'))?.textContent?.trim().slice(0, 60) || '(none)',
    letterTiles: document.querySelectorAll('button').length,
    canvases: document.querySelectorAll('canvas').length,
    audios: document.querySelectorAll('button[aria-label*="audio" i], [data-testid$="-audio"]').length,
    traceGuide: !!document.querySelector('canvas'),
  }));
  const slug = route.split('/').filter(Boolean).pop() || 'writing';
  const shot = path.join(OUT, `writing-${slug}-${lang}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  // assertions
  const pass = expect(r);
  if (!pass) failures += 1;
  console.log(`${route} [${lang}] title="${r.title}" tiles=${r.letterTiles} canvases=${r.canvases} audioBtns=${r.audios} → ${pass ? 'PASS' : 'FAIL'} (${shot})`);
  await page.close();
}

// /writing → letter grid: substantial number of letter tiles, no canvas.
await check('/writing', 'en', 'light', (r) => r.letterTiles >= 20 && r.canvases === 0);
await check('/writing', 'ar', 'light', (r) => r.letterTiles >= 20 && r.canvases === 0);
// /writing/e → tracing page: canvases present (guide + ink + miss).
await check('/writing/e', 'en', 'light', (r) => r.canvases >= 2);
await check('/writing/e', 'ar', 'light', (r) => r.canvases >= 2);

await browser.close();
console.log(failures === 0 ? 'WRITING HEALTH: ALL PASS' : `WRITING HEALTH: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

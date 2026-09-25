// stroke-guide-shots.mjs — C10 Phase 1: frame-by-frame screenshots of the
// stroke-order demo. Wall-clock timed so the frames show the progression:
// the demo runs ~0.7s→~2.3s after `goto` (2s animation + hold). Frames are
// taken at 7 staged timestamps. Output: audit/proof/stroke-guide/<glyph>-fN.png
// (gitignored).
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const OUT = path.resolve('audit/proof/stroke-guide');
fs.mkdirSync(OUT, { recursive: true });

const glyphs = (process.argv[2] || 'E,O,Û').split(',');
const FRAME_MS = [750, 1050, 1350, 1650, 1950, 2150, 2450];

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 390, height: 844 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});

for (const glyph of glyphs) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('kurdish_quest_theme', 'light');
      localStorage.setItem('kurdish_quest_lang', 'en');
      localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA' }));
      localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
        xp: 480, level: 4, gems: 240, streakFreezes: 1, streak: 6,
        lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(), updatedAt: Date.now(), wordsLearned: 42,
        recentSearches: [], favorites: [], completedLessons: ['a1_family'],
        unlockedLevels: ['A1'], badges: [], gameScores: {}, wrongAnswersHistory: [],
        reviewDeck: {}, weakCategories: {}, strongCategories: {}, sessionsCount: 9,
        totalStudyTime: 3600, isOnboarded: true, dailyGoalXp: 50,
      }));
    } catch {}
  });

  const t0 = Date.now();
  await page.goto(`http://localhost:3000/writing/${glyph.toLowerCase()}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  for (let i = 0; i < FRAME_MS.length; i += 1) {
    const target = t0 + FRAME_MS[i];
    const wait = target - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      await page.screenshot({ path: path.join(OUT, `${glyph}-f${i + 1}.png`) });
    } catch (e) {
      console.error(`${glyph} f${i + 1} failed:`, e.message);
    }
  }
  console.log(`${glyph}: 7 frames at ${FRAME_MS.map((m) => m + 'ms').join(', ')}`);
  await page.close();
}
await browser.close();
console.log('done →', OUT);

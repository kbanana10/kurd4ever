// stroke-guide-verify.mjs — C10 Phase 1 objective evidence.
//
// Since screenshots can't be "seen" by the agent, this captures PROGRAMMATIC
// proof of stroke order: at staged timestamps it reads the StrokeGuide overlay
// canvas (the extra canvas inserted between guide and strokes) and reports the
// gold-ink pixel-count + bounding box. For Û this proves the circumflex
// (top band) is inked ONLY in the final time share (order 2,3 = last).
//
// Usage: node audit/tools/stroke-guide-verify.mjs [glyph,...]
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'node:path';
import os from 'node:os';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const glyphs = (process.argv[2] || 'E,O,Û').split(',');

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
  await page.goto(`http://localhost:3000/writing/${glyph.toLowerCase()}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  // The route change remounts TracingCanvas; grant React a beat, then sample.
  await new Promise((r) => setTimeout(r, 900));

  const samples = [];
  for (let k = 0; k < 9; k += 1) {
    await new Promise((r) => setTimeout(r, 250));
    const s = await page.evaluate(() => {
      // Identify the overlay canvas: the canvases are [guide, overlay?, strokes, miss].
      const cs = Array.from(document.querySelectorAll('canvas'));
      // The overlay is the 2nd canvas (index 1) — it has aria-hidden like the
      // guide, but is followed by the strokes canvas (interactive).
      const c = cs[1];
      if (!c) return { err: 'no canvas[1]' };
      const ctx = c.getContext('2d', { willReadFrequently: true });
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let n = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        if (a > 20 && r > 200 && g > 120 && g < 200 && b < 80) {
          n += 1;
          const px = (i / 4) % c.width, py = Math.floor(i / 4 / c.width);
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py < minY) minY = py; if (py > maxY) maxY = py;
        }
      }
      const box = n ? { minX, minY, maxX, maxY } : null;
      return { n, box };
    });
    samples.push({ t: 900 + (k + 1) * 250, ...s });
  }

  console.log(`\n=== ${glyph} (canvas 320x320; gold ~ rgb 245,158,11) ===`);
  for (const s of samples) {
    const box = s.box ? `box x${s.box.minX}-${s.box.maxX} y${s.box.minY}-${s.box.maxY}` : 'box none';
    console.log(`t=${(s.t / 1000).toFixed(2)}s  goldPx=${s.n}  ${box}`);
  }
  await page.close();
}
await browser.close();

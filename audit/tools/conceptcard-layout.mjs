/**
 * conceptcard-layout.mjs — REAL-BROWSER geometry verification for the
 * ConceptCard 3-column layout, plus screenshots.
 *
 * Measures, on the live app (requires `npm run dev` on :3000):
 *   (a) Kurdish text left edge,
 *   (b) audio button x-center,
 *   (c) translation right edge,
 * for the concept title row and every example row, and asserts the audio
 * button center and the translation right edge stay within ±2px across rows.
 *
 * OPTIONAL (SPOT) RUN — screenshots and temp artifacts only:
 *   SCREENSHOT=1 node audit/tools/conceptcard-layout.mjs
 * It will still fail the run when the ±2px contract is violated, exactly like
 * the vitest structural test the CI executes.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.KQ_SHOT_DIR || path.join(os.tmpdir(), 'kq-conceptcard-shots');
const CAPTURE = process.env.SCREENSHOT === '1';

if (CAPTURE) fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const failures = [];
let rowValues = [];
let coverageReport = '';

async function run(viewport, lang, theme = 'dark') {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: lang === 'ar' ? 'ar' : 'en-US',
    reducedMotion: 'reduce',
  });
  await ctx.addInitScript(({ theme, lang }) => {
    try {
      localStorage.setItem('kurdish_quest_theme', theme);
      localStorage.setItem('kurdish_quest_lang', lang);
      localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA Tester' }));
      localStorage.setItem(
        'kurmanji_user_data_v2',
        JSON.stringify({
          xp: 480, level: 4, gems: 240, streakFreezes: 1, streak: 6,
          lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
          createdAt: Date.now(), updatedAt: Date.now(), wordsLearned: 42,
          recentSearches: [], favorites: [], completedLessons: ['a1_family'],
          unlockedLevels: ['A1'], badges: [], gameScores: {},
          wrongAnswersHistory: [], reviewDeck: {}, weakCategories: {},
          strongCategories: {}, sessionsCount: 9, totalStudyTime: 3600,
          isOnboarded: true, dailyGoalXp: 50,
        }),
      );
    } catch {}
  }, { theme, lang });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(`${BASE}/grammar/pronouns`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('[data-testid="concept-title"]', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1400);

  // Collect geometry for the title row + every example row.
  const rows = await page.evaluate(() => {
    const out = [];
    const pick = (row) => {
      const ku = row.querySelector('[data-testid$="-ku"]');
      const audio = row.querySelector('[data-testid$="-audio"]');
      const right = row.querySelector('[data-testid$="-right"]');
      const kRect = ku ? ku.getBoundingClientRect() : null;
      const aRect = audio ? audio.getBoundingClientRect() : null;
      const rRect = right ? right.getBoundingClientRect() : null;
      return {
        ku: ku ? ku.textContent.trim().slice(0, 40) : null,
        kuLeft: kRect ? kRect.left : null,
        audioCenter: aRect ? aRect.left + aRect.width / 2 : null,
        rightEdge: rRect ? rRect.right : null,
      };
    };
    const title = document.querySelector('[data-testid="concept-title"]');
    if (title) out.push({ kind: 'title', ...pick(title) });
    document.querySelectorAll('[data-testid^="example-"]').forEach((row, i) => {
      if (row.getAttribute('data-testid').includes('-ku') || row.getAttribute('data-testid').includes('-audio') || row.getAttribute('data-testid').includes('-right')) return;
      out.push({ kind: `example-${i}`, ...pick(row) });
    });
    return out;
  });

  if (!rows.length) {
    failures.push(`[${viewport.width}x${viewport.height}/${lang}/${theme}] no rows found`);
    await ctx.close();
    return;
  }

  // ±2px assertions on b and c, and first-row diff on a.
  const anchorAudio = rows[0].audioCenter;
  const anchorRight = rows[0].rightEdge;
  const anchorKu = rows[0].kuLeft;
  for (const r of rows) {
    if (Math.abs(r.audioCenter - anchorAudio) > 2) {
      failures.push(`[row ${r.kind}] audio x-center drift ${(r.audioCenter - anchorAudio).toFixed(2)}px (>2px)`);
    }
    if (Math.abs(r.rightEdge - anchorRight) > 2) {
      failures.push(`[row ${r.kind}] translation right-edge drift ${(r.rightEdge - anchorRight).toFixed(2)}px (>2px)`);
    }
    if (Math.abs(r.kuLeft - anchorKu) > 2) {
      failures.push(`[row ${r.kind}] Kurdish left-edge drift ${(r.kuLeft - anchorKu).toFixed(2)}px (>2px)`);
    }
  }
  rowValues = rows;

  if (CAPTURE) {
    const label = `${viewport.width}x${viewport.height}-${lang}-${theme}`;
    await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true });
  }
  coverageReport += `${viewport.width}x${viewport.height}/${lang}/${theme}: ${rows.length} rows measured; audio center span=${(Math.max(...rows.map(r => r.audioCenter)) - Math.min(...rows.map(r => r.audioCenter))).toFixed(2)}px, right-edge span=${(Math.max(...rows.map(r => r.rightEdge)) - Math.min(...rows.map(r => r.rightEdge))).toFixed(2)}px\n`;
  await ctx.close();
}

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
try {
  // Mobile is the primary target; desktop is a wide-viewport control.
  await run(MOBILE, 'en');
  await run(DESKTOP, 'en');
  await run(MOBILE, 'ar'); // RTL shell — must not flip the TriRow columns
} finally {
  await browser.close();
}

console.log('--- measured rows (first viewport) ---');
for (const r of rowValues) console.log(`${r.kind}: kuLeft=${r.kuLeft?.toFixed?.(1)} audioCenter=${r.audioCenter?.toFixed?.(1)} rightEdge=${r.rightEdge?.toFixed?.(1)} ku="${r.ku}"`);
console.log(coverageReport.trimEnd());
if (CAPTURE) console.log(`screenshots → ${OUT}`);

if (failures.length) {
  console.error('LAYOUT CONTRACT VIOLATIONS:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('OK: audio center & translation right edge within ±2px across all rows.');

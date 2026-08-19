/**
 * design-shots.mjs — clean, light-mode, full-page screenshots of all core
 * screens for design review / Figma redesign work.
 *
 * ⚠️ POLICY: DO NOT RUN THIS SCRIPT (or any screenshot capture) unless the
 * user EXPLICITLY requests screenshot captures in their prompt.
 *
 * - Theme is forced to LIGHT for every capture.
 * - State is seeded with a realistic, attractive profile (streak, level,
 *   gems, favorites, completed lesson) — no bot artifacts, no interactions
 *   beyond what is needed to reach a screen (e.g. launching a game).
 * - Mobile 390x844 (primary, @2x for crispness) and desktop 1280x800.
 * - Output: design_screenshots/<NN>_<screen>_<viewport>.png
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const OUT = path.resolve(process.cwd(), 'design_screenshots');
fs.mkdirSync(OUT, { recursive: true });

const SEED = {
  xp: 480, level: 4, gems: 240, streakFreezes: 2, streak: 12,
  lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
  createdAt: Date.now() - 30 * 86400000, updatedAt: Date.now(),
  wordsLearned: 86, recentSearches: ['dayik', 'av', 'roj'],
  favorites: ['f_mom', 'f_dad', 'f_bro'],
  completedLessons: ['a1_family'], unlockedLevels: ['A1'],
  badges: [], gameScores: {}, wrongAnswersHistory: [], reviewDeck: {},
  weakCategories: {}, strongCategories: {}, sessionsCount: 24,
  totalStudyTime: 9 * 3600, isOnboarded: true, dailyGoalXp: 50,
};

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
};

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function makePage(vp, { seed = true, onboarded = true } = {}) {
  const ctx = await browser.newContext({
    ...VIEWPORTS[vp],
    locale: 'en-US',
    reducedMotion: 'reduce', // freeze entrance animations for clean frames
  });
  await ctx.addInitScript(({ seed, onboarded, data }) => {
    try {
      localStorage.setItem('kurdish_quest_theme', 'light'); // STRICTLY LIGHT MODE
      localStorage.setItem('kurdish_quest_lang', 'en');
      if (seed) {
        const d = { ...data, isOnboarded: onboarded };
        localStorage.setItem('kurmanji_user_data_v2', JSON.stringify(d));
        localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'Rojda' }));
        const req = indexedDB.open('kurmanji_quester_db', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('user_data')) db.createObjectStore('user_data');
          if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('telemetry_events')) db.createObjectStore('telemetry_events', { keyPath: 'eventId' });
        };
        req.onsuccess = () => {
          try { req.result.transaction('user_data', 'readwrite').objectStore('user_data').put(d, 'current_user'); } catch {}
        };
      }
    } catch {}
  }, { seed, onboarded, data: SEED });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  return { ctx, page };
}

async function settle(page, route, extra = 1300) {
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#root > *', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(extra);
}

async function shoot(page, name, { fullPage = true } = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: 'png', fullPage });
  console.log('  saved', path.basename(file));
}

const captured = [];
async function simple(nn, slug, route, desc, extra = 1300) {
  for (const vp of ['mobile', 'desktop']) {
    const { ctx, page } = await makePage(vp);
    await settle(page, route, extra);
    await shoot(page, `${nn}_${slug}_${vp}`);
    await ctx.close();
  }
  captured.push([nn, slug, route, desc]);
  console.log(`✔ ${nn}_${slug}`);
}

/* -------- straightforward routes -------- */
await simple('01', 'dashboard', '/', 'Dashboard / Home — hero, level card, word of the day, smart review, library');
await simple('02', 'roadmap', '/roadmap', 'Learning roadmap — scholar summary, world regions, quest-trail nodes');
await simple('03', 'quiz_home', '/quiz/a1_family', 'Quiz landing — Phase 1 Explore & Learn study list with audio toggles');
await simple('04', 'vocabulary_categories', '/vocabulary', 'Vocabulary hub — General/Academic tabs + category grid');
await simple('05', 'vocabulary_list', '/vocabulary/numbers', 'Vocabulary word list — Numbers category with word cards');
await simple('06', 'search', '/search', 'Dictionary search — search field, CEFR + POS filter chips, recent queries');
await simple('07', 'favorites', '/favorites', 'Favorites — saved words (seeded: Dayik, Bav, Bra)');
await simple('09', 'sentences', '/sentences', 'Sentences & dialogues — daily phrases with playback, topic tabs');
await simple('10', 'alphabet', '/alphabet', 'Alphabet — 31 Hawar letters, vowel/consonant tags, letter hero card');

/* -------- games (need a launch click) -------- */
async function game(nn, slug, cardText, desc) {
  for (const vp of ['mobile', 'desktop']) {
    const { ctx, page } = await makePage(vp);
    await settle(page, '/games', 1300);
    if (nn === '11') { await shoot(page, `11_games_hub_${vp}`); await ctx.close(); continue; }
    const card = page.locator('main button, main [role="button"], main div[class*="cursor-pointer"]').filter({ hasText: cardText }).first();
    await card.click();
    await page.waitForTimeout(1600);
    const start = page.locator('button', { hasText: /^(start|play|begin|start game)/i }).first();
    if (await start.isVisible().catch(() => false)) { await start.click().catch(() => {}); await page.waitForTimeout(1400); }
    await shoot(page, `${nn}_${slug}_${vp}`);
    await ctx.close();
  }
  captured.push([nn, slug, '/games', desc]);
  console.log(`✔ ${nn}_${slug}`);
}
await game('11', 'games_hub', '', 'Games menu — Fun Arcade catalog with all game cards');
await game('12', 'game_scramble', 'Word Spelling', 'Scramble game (Word Spelling) — order the letters correctly');
await game('13', 'game_word_connect', 'Word Connect', 'Word Connect — swipe letters to spell Kurdish words');
await game('14', 'game_word_matching', 'Word Matching', 'Word Matching — match word with meaning');
await game('15', 'game_zombie_typing', 'Zombie Typing', 'Zombie Typing — type quickly to survive');

/* -------- leaderboard + profile -------- */
await simple('16', 'leaderboard', '/leaderboard', 'Leaderboard — Kurmanji Leagues, podium top 3, standings');
await simple('17', 'profile_settings', '/profile', 'Profile — stats cards, SRS deck, settings (language + dark-mode switch)');

/* -------- onboarding (fresh user, overlay on dashboard) -------- */
{
  for (const vp of ['mobile', 'desktop']) {
    const { ctx, page } = await makePage(vp, { seed: true, onboarded: false });
    await settle(page, '/', 1800);
    await shoot(page, `18_onboarding_${vp}`);
    await ctx.close();
  }
  captured.push(['18', 'onboarding', '/', 'Onboarding wizard — "Why are you learning Kurdish?" survey overlay']);
  console.log('✔ 18_onboarding');
}

/* -------- login (signed out) -------- */
{
  for (const vp of ['mobile', 'desktop']) {
    const { ctx, page } = await makePage(vp, { seed: false });
    await settle(page, '/login', 1300);
    await shoot(page, `19_login_${vp}`);
    await ctx.close();
  }
  captured.push(['19', 'login', '/login', 'Login / welcome — brand emblem, name entry, Start Playing CTA']);
  console.log('✔ 19_login');
}

await browser.close();

/* -------- catalog -------- */
const rows = captured.map(([nn, slug, route, desc]) =>
  `| ${nn} | \`${route}\` | \`${nn}_${slug}_mobile.png\` · \`${nn}_${slug}_desktop.png\` | ${desc} |`).join('\n');
fs.writeFileSync(path.join(OUT, 'README.md'), `# Kurdish Quest — Clean Design Screenshots

Captured ${new Date().toISOString().slice(0, 10)} · Playwright/Chromium · **Light mode only** · English UI
Seeded profile: “Rojda” — 12-day streak, Level 4, 480 XP, 240 gems, 86 words learned, 3 favorites, lesson *Family & Relatives* completed.

- **Mobile:** 390×844 @2x, full-page scroll capture
- **Desktop:** 1280×800 @2x, full-page scroll capture

| # | Route | Files | Screen |
|---|-------|-------|--------|
${rows}
`);
console.log(`\nDone — ${captured.length} screens × 2 viewports saved to design_screenshots/`);

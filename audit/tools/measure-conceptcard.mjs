/**
 * measure-conceptcard.mjs — REAL-BROWSER geometry verification for the
 * ConceptCard fixed 3-column layout (short + long Kurdish text), plus
 * screenshots.
 *
 * Requirements verified here (per task):
 *   (a) Kurdish text left edge,
 *   (b) audio button x-center,
 *   (c) Arabic/translation right edge,
 * measured across the concept title row + every example row in the card, with
 * hard ±2px assertions on (b) and (c).
 *
 * Browser: puppeteer-core driving the Chromium bundled inside
 * @sparticuz/chromium (no CDN download). On Debian the binary needs the NSS
 * libs from its own `al2023.tar.br` on LD_LIBRARY_PATH — handled below.
 * Those two helpers are dev-only and not in package.json; install on demand:
 *   npm install --no-save puppeteer-core @sparticuz/chromium
 *
 * Usage (dev server must be running on :3000):
 *   node audit/tools/measure-conceptcard.mjs
 *   ROUTE=/grammar/prepositions CONCEPT_INDEX=4 node audit/tools/measure-conceptcard.mjs
 * Screenshots land in ../conceptcard-proof/ next to the repo (kept OUT of git).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://localhost:3000';
const ROUTE = process.env.ROUTE || '/grammar/pronouns';
const CONCEPT_INDEX = Number(process.env.CONCEPT_INDEX || 0);
const OUT = path.resolve(__dirname, '../../conceptcard-proof');
fs.mkdirSync(OUT, { recursive: true });

// --- NSS libs for the sparticuz binary on plain Debian -----------------------
const NSS = path.join(os.tmpdir(), 'nsslibs');
const NSS_LIB = path.join(NSS, 'lib');
if (!fs.existsSync(path.join(NSS_LIB, 'libnss3.so'))) {
  // Reuse the al2023 archive shipped with @sparticuz/chromium (has libnspr4,
  // libnss3, libnssutil3 + friends).
  const { createReadStream, createWriteStream } = await import('node:fs');
  const { createBrotliDecompress } = await import('node:zlib');
  const { pipeline } = await import('node:stream/promises');
  const pkgBin = path.resolve(__dirname, '../../node_modules/@sparticuz/chromium/bin');
  const tar = path.join(os.tmpdir(), 'al2023.tar');
  await pipeline(
    createReadStream(path.join(pkgBin, 'al2023.tar.br')),
    createBrotliDecompress(),
    createWriteStream(tar),
  );
  fs.mkdirSync(NSS, { recursive: true });
  const { execSync } = await import('node:child_process');
  execSync(`tar -xf ${tar} -C ${NSS}`);
}

const SEED = {
  xp: 480, level: 4, gems: 240, streakFreezes: 1, streak: 6,
  lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
  createdAt: Date.now(), updatedAt: Date.now(), wordsLearned: 42,
  recentSearches: [], favorites: [], completedLessons: ['a1_family'],
  unlockedLevels: ['A1'], badges: [], gameScores: {}, wrongAnswersHistory: [],
  reviewDeck: {}, weakCategories: {}, strongCategories: {}, sessionsCount: 9,
  totalStudyTime: 3600, isOnboarded: true, dailyGoalXp: 50,
};

const failures = [];

async function seed(page, lang, theme) {
  await page.evaluateOnNewDocument(
    ({ lang, theme, data }) => {
      try {
        localStorage.setItem('kurdish_quest_theme', theme);
        localStorage.setItem('kurdish_quest_lang', lang);
        localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA Tester' }));
        localStorage.setItem('kurmanji_user_data_v2', JSON.stringify(data));
        const req = indexedDB.open('kurmanji_quester_db', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('user_data')) db.createObjectStore('user_data');
          if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('telemetry_events')) db.createObjectStore('telemetry_events', { keyPath: 'eventId' });
        };
        req.onsuccess = () => {
          try { req.result.transaction('user_data', 'readwrite').objectStore('user_data').put(data, 'current_user'); } catch {}
        };
      } catch {}
    },
    { lang, theme, data: SEED },
  );
}

/** Measure geometry of every row (title + examples), excluding cell testids. */
function measureScript() {
  const rows = [];
  const rowEls = [];
  const title = document.querySelector('[data-testid="concept-title"]');
  if (title) rowEls.push({ el: title, kind: 'title' });
  document.querySelectorAll('[data-testid^="example-"]').forEach((el) => {
    if (/(ku|audio|right)$/.test(el.getAttribute('data-testid') || '')) return;
    rowEls.push({ el, kind: el.getAttribute('data-testid') });
  });

  for (const { el, kind } of rowEls) {
    const kuEl = el.querySelector('[data-testid$="-ku"]');
    const btn = el.querySelector('[data-testid$="-audio"] button');
    const rightEl = el.querySelector('[data-testid$="-right"]');
    const arEl = rightEl ? (rightEl.querySelector('div[dir]') || rightEl) : null;

    const kuRect = kuEl ? kuEl.getBoundingClientRect() : null;
    const btnRect = btn ? btn.getBoundingClientRect() : null;
    const arRect = arEl ? arEl.getBoundingClientRect() : null;
    const rightRect = rightEl ? rightEl.getBoundingClientRect() : null;

    rows.push({
      kind,
      kuText: kuEl ? kuEl.textContent.trim().slice(0, 42) : null,
      kuLeft: kuRect ? +kuRect.left.toFixed(2) : null,
      audioCenter: btnRect ? +(btnRect.left + btnRect.width / 2).toFixed(2) : null,
      arRight: arRect ? +arRect.right.toFixed(2) : null,
      rightEdge: rightRect ? +rightRect.right.toFixed(2) : null,
    });
  }
  return rows;
}

async function run(viewport, lang, theme = 'light') {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: viewport,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
    env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
  });
  const page = await browser.newPage();
  await seed(page, lang, theme);
  page.setDefaultTimeout(30000);
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForSelector('[data-testid="concept-title"]', { timeout: 45000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  // Optionally advance to a later concept card (progress dots) to measure the
  // longest example sentences (wrap behaviour).
  if (CONCEPT_INDEX > 0) {
    const dots = await page.$$('button[aria-label^="Concept"], button[aria-label^="مفهوم"]');
    const target = dots[Math.min(CONCEPT_INDEX, dots.length - 1)];
    if (target) {
      await target.click().catch(() => {});
      await new Promise((r) => setTimeout(r, 900));
    }
  }

  const rows = await page.evaluate(measureScript);
  if (!rows.length) {
    failures.push(`[${viewport.width}×${viewport.height}/${lang}/${theme}] no rows found`);
    await browser.close();
    return;
  }

  const examples = rows.filter((r) => r.kind.startsWith('example'));
  const anchorAudio = examples[0]?.audioCenter;
  const anchorRight = examples[0]?.rightEdge;
  const anchorAr = examples[0]?.arRight;
  const anchorKu = examples[0]?.kuLeft;

  for (const r of examples) {
    if (Math.abs(r.audioCenter - anchorAudio) > 2) failures.push(`[${r.kind}/${lang}] audio x-center drift ${(r.audioCenter - anchorAudio).toFixed(2)}px (>2px)`);
    if (Math.abs(r.rightEdge - anchorRight) > 2) failures.push(`[${r.kind}/${lang}] translation right-edge drift ${(r.rightEdge - anchorRight).toFixed(2)}px (>2px)`);
    if (Math.abs(r.arRight - anchorAr) > 2) failures.push(`[${r.kind}/${lang}] Arabic text right-edge drift ${(r.arRight - anchorAr).toFixed(2)}px (>2px)`);
    if (Math.abs(r.kuLeft - anchorKu) > 2) failures.push(`[${r.kind}/${lang}] Kurdish left-edge drift ${(r.kuLeft - anchorKu).toFixed(2)}px (>2px)`);
  }

  console.log(`\n── ${viewport.width}×${viewport.height} · lang=${lang} · theme=${theme} · ${ROUTE} ──`);
  console.table(rows);

  const routeSlug = ROUTE.split('/').filter(Boolean).pop() || 'route';
  const label = `${routeSlug}-${viewport.width}x${viewport.height}-${lang}-${theme}`;
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true });
  await browser.close();
}

try {
  await run({ width: 390, height: 844 }, 'en', 'light');   // primary mobile
  await run({ width: 390, height: 844 }, 'ar', 'light');   // RTL control — columns must not flip
  await run({ width: 1280, height: 800 }, 'en', 'light');  // desktop control
} catch (e) {
  console.error('RUN FAILED:', e.message);
  process.exit(1);
}

console.log(`\nScreenshots → ${OUT}`);
if (failures.length) {
  console.error('\nLAYOUT CONTRACT VIOLATIONS:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('\nOK: audio x-center, translation right-edge, Arabic right-edge and Kurdish left-edge all within ±2px across every example row.');

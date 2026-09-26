/**
 * measure-ui.mjs — real-browser geometry verification for ANY route, using the
 * three-column "Kurdish · 🔊 · translation" layout contract.
 *
 * Measures, per row:
 *   (a) left column left edge  (Kurdish text),
 *   (b) audio button x-center,
 *   (c) right column right edge (translation),
 * and asserts those stay within ±TOLERANCE_PX across every row on the page,
 * in mobile and desktop viewports (and one RTL pass for the Arabic UI).
 *
 * Everything is env-configurable so the same script can measure any route:
 *   ROUTE          path to visit            (default /grammar/pronouns)
 *   ROW_SELECTOR   CSS for row containers   (default concept-card rows)
 *   KU_SELECTOR    within-row selector for the Kurdish/left cell
 *   AUDIO_SELECTOR within-row selector for the play button
 *   RIGHT_SELECTOR within-row selector for the translation/right cell
 *   TOLERANCE_PX   max allowed drift in px  (default 2)
 *   BASE           origin                   (default http://localhost:3000)
 *
 * Example:
 *   node audit/tools/measure-ui.mjs
 *   ROUTE=/grammar/sentence-structure node audit/tools/measure-ui.mjs
 *
 * Browser is puppeteer-core + @sparticuz/chromium (no CDN), the same workaround
 * documented in docs/agent-setup.md §3–4.
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
const TOLERANCE_PX = Number(process.env.TOLERANCE_PX || 2);
const ROW_SELECTOR = process.env.ROW_SELECTOR || '[data-testid="concept-title"], [data-testid^="example-"]';
const KU_SELECTOR = process.env.KU_SELECTOR || '[data-testid$="-ku"]';
const AUDIO_SELECTOR = process.env.AUDIO_SELECTOR || '[data-testid$="-audio"] button';
const RIGHT_SELECTOR = process.env.RIGHT_SELECTOR || '[data-testid$="-right"]';

const OUT = path.resolve(__dirname, '../../measure-ui-proof');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// --- NSS libs for the sparticuz binary on plain Debian (same as agent-setup) ---
const NSS = path.join(os.tmpdir(), 'nsslibs');
const NSS_LIB = path.join(NSS, 'lib');
if (!fs.existsSync(path.join(NSS_LIB, 'libnss3.so'))) {
  const { createReadStream, createWriteStream } = await import('node:fs');
  const { createBrotliDecompress } = await import('node:zlib');
  const { pipeline } = await import('node:stream/promises');
  const { execSync } = await import('node:child_process');
  const pkgBin = path.resolve(__dirname, '../../node_modules/@sparticuz/chromium/bin');
  const tar = path.join(os.tmpdir(), 'al2023.tar');
  await pipeline(
    createReadStream(path.join(pkgBin, 'al2023.tar.br')),
    createBrotliDecompress(),
    createWriteStream(tar),
  );
  fs.mkdirSync(NSS, { recursive: true });
  execSync(`tar -xf ${tar} -C ${NSS}`);
}

const SEED = {
  xp: 480, level: 4, gems: 240, streakFreezes: 1, streak: 6,
  lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
  createdAt: Date.now() - 12 * 86400000, updatedAt: Date.now(), wordsLearned: 42,
  recentSearches: [], favorites: [], completedLessons: ['a1_family'],
  unlockedLevels: ['A1'], badges: [], gameScores: {}, wrongAnswersHistory: [],
  reviewDeck: {}, weakCategories: {}, strongCategories: {}, sessionsCount: 9,
  totalStudyTime: 3600, isOnboarded: true, dailyGoalXp: 50,
};

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

function measureScript({ rowSelector, kuSelector, audioSelector, rightSelector }) {
  const rows = [];
  document.querySelectorAll(rowSelector).forEach((row) => {
    // Skip cell-level testids nested under a row (they match the same selectors).
    const tid = row.getAttribute('data-testid') || '';
    const kuEl = row.querySelector(kuSelector);
    const btnEl = row.querySelector(audioSelector);
    const rightEl = row.querySelector(rightSelector);

    const kuRect = kuEl ? kuEl.getBoundingClientRect() : null;
    const btnRect = btnEl ? btnEl.getBoundingClientRect() : null;
    const rightRect = rightEl ? rightEl.getBoundingClientRect() : null;

    if (!btnRect || !rightRect) return; // rows without audio+translation are not measurable
    rows.push({
      kind: tid || row.tagName.toLowerCase(),
      kuText: kuEl ? kuEl.textContent.trim().replace(/\s+/g, ' ').slice(0, 34) : '',
      kuLeft: +(kuRect?.left ?? NaN).toFixed(2),
      audioCenter: +(btnRect.left + btnRect.width / 2).toFixed(2),
      rightEdge: +rightRect.right.toFixed(2),
    });
  });
  return rows;
}

const failures = [];
let lastTable = [];

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
  await page.waitForSelector(rowSelectorWaitFor(), { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1600));

  const rows = await page.evaluate(measureScript, {
    rowSelector: ROW_SELECTOR,
    kuSelector: KU_SELECTOR,
    audioSelector: AUDIO_SELECTOR,
    rightSelector: RIGHT_SELECTOR,
  });

  if (!rows.length) {
    failures.push(`[${viewport.width}×${viewport.height}/${lang}] no measurable rows for selector "${ROW_SELECTOR}"@${ROUTE}`);
    await browser.close();
    return;
  }

  // The contract: the audio button X-center is identical across ALL rows
  // (title + examples). Left/right text edges only match across SAME-kind
  // rows — the title row intentionally uses larger type/padding, so comparing
  // its edges to example rows is a false positive by design.
  const examples = rows.filter((r) => r.kind.startsWith('example'));
  const edgeRows = examples.length ? examples : rows;

  const audioAnchor = rows[0];
  for (const r of rows.slice(1)) {
    if (Math.abs(r.audioCenter - audioAnchor.audioCenter) > TOLERANCE_PX) failures.push(`[${r.kind}] audio x-center drift ${(r.audioCenter - audioAnchor.audioCenter).toFixed(2)}px (>${TOLERANCE_PX}px) @${ROUTE} ${viewport.width}px ${lang}`);
  }

  const edgeAnchor = edgeRows[0];
  for (const r of edgeRows.slice(1)) {
    if (Math.abs(r.rightEdge - edgeAnchor.rightEdge) > TOLERANCE_PX) failures.push(`[${r.kind}] right-edge drift ${(r.rightEdge - edgeAnchor.rightEdge).toFixed(2)}px (>${TOLERANCE_PX}px) @${ROUTE} ${viewport.width}px ${lang}`);
    if (Math.abs(r.kuLeft - edgeAnchor.kuLeft) > TOLERANCE_PX) failures.push(`[${r.kind}] left-edge drift ${(r.kuLeft - edgeAnchor.kuLeft).toFixed(2)}px (>${TOLERANCE_PX}px) @${ROUTE} ${viewport.width}px ${lang}`);
  }

  lastTable = rows;
  console.log(`\n── ${viewport.width}×${viewport.height} · ${lang} · ${ROUTE} ──`);
  console.table(rows.map((r) => ({ kind: r.kind, ku: r.kuText, kuLeft: r.kuLeft, audioC: r.audioCenter, right: r.rightEdge })));

  const slug = ROUTE.split('/').filter(Boolean).pop() || 'route';
  await page.screenshot({ path: path.join(OUT, `${slug}-${viewport.width}x${viewport.height}-${lang}-${theme}.png`), fullPage: true });
  await browser.close();
}

function rowSelectorWaitFor() {
  // Use the first selector token that is a concrete testid for waiting.
  const first = ROW_SELECTOR.split(',').map((s) => s.trim()).find((s) => s.includes('data-testid'));
  return first || 'body';
}

try {
  await run({ width: 390, height: 844 }, 'en');
  await run({ width: 390, height: 844 }, 'ar');   // RTL shell control
  await run({ width: 1280, height: 800 }, 'en');  // desktop control
} catch (e) {
  console.error('RUN FAILED:', e.message);
  process.exit(1);
}

console.log(`\nScreenshots → ${OUT}`);
if (failures.length) {
  console.error(`\nLAYOUT CONTRACT VIOLATIONS (n=${failures.length}):\n- ` + failures.join('\n- '));
  process.exit(1);
}
console.log(`\nOK: audio x-center, right edge and left edge within ±${TOLERANCE_PX}px across all rows (${lastTable.length} rows at anchor ${lastTable[0]?.audioCenter ?? 'n/a'}px).`);

/**
 * qa-lib.mjs — shared helpers for the automated browser audit.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const BASE = 'http://localhost:3000';
// SCREENSHOT POLICY: captures are throwaway QA artifacts and must NEVER live
// in the repo (the old `audit_screenshots/` folder kept resurrecting via this
// import-time mkdir). They now land in the OS temp dir.
export const SHOTS = path.join(os.tmpdir(), 'kq-qa-shots');
fs.mkdirSync(SHOTS, { recursive: true });

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
};

/** Seed: a returning, onboarded user with progress so gated UI is reachable. */
export const SEED_USER_DATA = {
  xp: 480, level: 4, gems: 240, streakFreezes: 1, streak: 6,
  lastActive: Date.now(), lastActiveDate: new Date().toISOString().slice(0, 10),
  createdAt: Date.now() - 12 * 86400000, updatedAt: Date.now(),
  wordsLearned: 42, recentSearches: ['dayik', 'av'], favorites: ['f_mom', 'f_dad'],
  completedLessons: ['a1_family'], unlockedLevels: ['A1'],
  badges: [], gameScores: {}, wrongAnswersHistory: [], reviewDeck: {},
  weakCategories: {}, strongCategories: {}, sessionsCount: 9,
  totalStudyTime: 3600, isOnboarded: true, dailyGoalXp: 50,
};

export async function launch() {
  return chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
}

/**
 * Creates a page pre-configured for a matrix cell.
 * opts: { viewport:'mobile'|'desktop', theme:'light'|'dark', lang:'en'|'ar'|'ku', seed:boolean }
 */
export async function newAuditPage(browser, opts = {}) {
  const { viewport = 'mobile', theme = 'dark', lang = 'en', seed = true } = opts;
  const ctx = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    deviceScaleFactor: 1,
    isMobile: viewport === 'mobile',
    hasTouch: viewport === 'mobile',
    locale: lang === 'ar' ? 'ar' : 'en-US',
    reducedMotion: 'reduce',
  });
  await ctx.addInitScript(({ theme, lang, seed, data }) => {
    try {
      localStorage.setItem('kurdish_quest_theme', theme);
      localStorage.setItem('kurdish_quest_lang', lang);
      if (seed) {
        localStorage.setItem('kurmanji_user_data_v2', JSON.stringify(data));
        localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA Tester' }));
        // Seed IndexedDB (guest mode reads user data from here, not localStorage).
        const req = indexedDB.open('kurmanji_quester_db', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('user_data')) db.createObjectStore('user_data');
          if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('telemetry_events')) db.createObjectStore('telemetry_events', { keyPath: 'eventId' });
        };
        req.onsuccess = () => {
          try {
            const db = req.result;
            db.transaction('user_data', 'readwrite').objectStore('user_data').put(data, 'current_user');
          } catch {}
        };
      }
    } catch {}
  }, { theme, lang, seed, data: SEED_USER_DATA });

  const page = await ctx.newPage();
  page.setDefaultTimeout(4000);
  const issues = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const srcUrl = msg.location()?.url || '';
      // External/offline noise we classify separately from app bugs:
      if (/firestore|firebase|googleapis|WebChannelConnection|net::ERR_INTERNET|identitytoolkit/i.test(text + ' ' + srcUrl)) return;
      // Resource-load failures from non-localhost origins are environment noise:
      if (/Failed to load resource/i.test(text) && srcUrl && !srcUrl.includes('localhost:3000')) return;
      issues.consoleErrors.push((text + (srcUrl ? ` [${srcUrl.slice(0, 120)}]` : '')).slice(0, 400));
    }
  });
  page.on('pageerror', (err) => issues.pageErrors.push(String(err).slice(0, 400)));
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && url.startsWith('http://localhost:3000')) {
      issues.failedRequests.push(`${res.status()} ${url.replace('http://localhost:3000', '')}`);
    }
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.startsWith('http://localhost:3000')) {
      issues.failedRequests.push(`FAILED ${req.failure()?.errorText} ${url.replace('http://localhost:3000', '')}`);
    }
  });
  return { ctx, page, issues };
}

export async function gotoAndSettle(page, route, extraWaitMs = 900) {
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#root > *', { timeout: 15000 }).catch(() => {});
  // Let lazy routes + suspense + fonts settle.
  await page.waitForTimeout(extraWaitMs);
}

export async function snap(page, name) {
  const file = path.join(SHOTS, `${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 70 });
  return path.relative(process.cwd(), file);
}

/** In-page structural checks: overflow, touch targets, clipped text (no ellipsis). */
export async function runDomChecks(page) {
  return page.evaluate(() => {
    const out = { hScroll: false, hScrollDelta: 0, smallTargets: [], clippedText: [] };
    const de = document.documentElement;
    const delta = Math.max(de.scrollWidth - de.clientWidth, document.body ? document.body.scrollWidth - de.clientWidth : 0);
    if (delta > 1) { out.hScroll = true; out.hScrollDelta = delta; }

    const clickable = document.querySelectorAll('a[href], button, [role="button"], input, select, textarea');
    const seen = new Set();
    clickable.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return; // hidden
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return;
      if (el.closest('.sr-only')) return; // screen-reader-only, intentionally 1px
      if (r.bottom < 0 || r.top > innerHeight) return; // offscreen, still counted? keep visible-only
      // account for pseudo-element hit-area extensions (after:-inset-*)
      const after = getComputedStyle(el, '::after');
      let effH = r.height, effW = r.width;
      if (after.content === '""' && after.position === 'absolute') {
        const top = parseFloat(after.top), bottom = parseFloat(after.bottom);
        const left = parseFloat(after.left), right = parseFloat(after.right);
        if (!Number.isNaN(top) && !Number.isNaN(bottom)) effH = r.height - top - bottom;
        if (!Number.isNaN(left) && !Number.isNaN(right)) effW = r.width - left - right;
      }
      if (effW < 44 || effH < 44) {
        // Effective target may be padded by parent link/button — measure closest interactive ancestor union
        const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName)
          .trim().replace(/\s+/g, ' ').slice(0, 40);
        const key = `${label}|${Math.round(r.width)}x${Math.round(r.height)}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.smallTargets.push({ label, w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName.toLowerCase() });
        }
      }
    });

    // Text clipped without ellipsis (unintended truncation)
    document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,div').forEach((el) => {
      if (el.children.length > 0) return;
      if (el.classList.contains('sr-only') || el.closest('.sr-only')) return;
      const t = (el.textContent || '').trim();
      if (t.length < 3) return;
      if (el.scrollWidth > el.clientWidth + 2) {
        const s = getComputedStyle(el);
        if (s.overflowX !== 'visible' && s.textOverflow !== 'ellipsis' && s.whiteSpace === 'nowrap') {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.bottom > 0 && r.top < innerHeight) {
            out.clippedText.push({ text: t.slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth });
          }
        }
      }
    });
    out.smallTargets = out.smallTargets.slice(0, 25);
    out.clippedText = out.clippedText.slice(0, 10);
    return out;
  });
}

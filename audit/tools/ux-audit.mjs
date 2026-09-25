// ux-audit.mjs — Cypher 7 UI/UX audit harness (Track A evidence engine).
//
// Visits every app route in en + ar, screenshots each, and MEASURES:
//   - heading outline (h1..h4 count + text)
//   - WCAG AA contrast failures: every visible text/icon run whose effective
//     foreground:background contrast is < 4.5:1 (or < 3:1 for >=24px bold /
//     >=18.66px bold / >=24px regular text — AA large-text rule)
//   - unlabeled interactive controls (button/a/input/select/textarea with no
//     accessible name)
//   - <html dir> vs language (RTL correctness)
//   - empty-state markers (keyword scan)
//   - count of canvas/audio/motion elements (micro-interaction presence)
// Screenshots land in audit/proof/ux-audit/ (gitignored).
//
// Usage: node audit/tools/ux-audit.mjs [route,...]  (default: ALL routes)
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const OUT = path.resolve('audit/proof/ux-audit');
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

const ROUTES = [
  '/', '/login', '/learn', '/alphabet', '/vocabulary', '/vocabulary/colors',
  '/sentences', '/grammar', '/grammar/cînavk', '/writing', '/writing/e',
  '/writing/words', '/writing/sentences', '/favorites', '/quiz/a1_family',
  '/roadmap', '/games', '/search', '/store', '/profile', '/leaderboard',
  '/privacy', '/terms', '/nosuchroute',
];

function parseCSSColor(str) {
  if (!str) return null;
  const s = str.trim();
  if (s.startsWith('rgb(') || s.startsWith('rgba(')) {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((p) => parseFloat(p));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  return null;
}

function luminance({ r, g, b }) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(c1, c2) {
  const l1 = luminance(c1), l2 = luminance(c2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
function comp(a, b) { // composite fg (a) over bg (b)
  const ao = a.a ?? 1;
  const r = a.r * ao + b.r * (1 - ao);
  const g = a.g * ao + b.g * (1 - ao);
  const bl = a.b * ao + b.b * (1 - ao);
  return { r, g, b, a: 1 };
}

const auditScript = (lang) => {
  // (browser-side, self-contained)
  const parseCSSColor = (str) => {
    if (!str) return null;
    const s = str.trim();
    if (s.startsWith('rgb(') || s.startsWith('rgba(')) {
      const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const parts = m[1].split(',').map((p) => parseFloat(p));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    }
    if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const m = s.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
      const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
      const a = h.length === 8 ? parseInt(h.slice(6,8),16)/255 : 1;
      return { r, g, b, a };
    }
    return null;
  };
  const lum = ({ r, g, b }) => { const f = (v) => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const ratio = (c1, c2) => { const a = lum(c1), b = lum(c2); const hi = Math.max(a,b), lo = Math.min(a,b); return (hi+0.05)/(lo+0.05); };
  const comp2 = (a, b) => { const ao = a.a ?? 1; return { r: a.r*ao+b.r*(1-ao), g: a.g*ao+b.g*(1-ao), b: a.b*ao+b.b*(1-ao), a: 1 }; };
  const issues = { aa: [], aaLarge: [], unlabeled: [], aliasH: [] };
  const walk = (el, bgChain) => {
    if (el.nodeType !== 1) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
    const bgCol = parseCSSColor(cs.backgroundColor);
    const chain = bgCol && bgCol.a > 0 ? [bgCol, ...bgChain] : bgChain;
    // text nodes directly in this element (only for short, text-heavy leaves)
    const directText = Array.from(el.childNodes).filter((n) => n.nodeType === 3 && n.textContent.trim());
    const isTextContainer = el.tagName && /^(P|SPAN|A|BUTTON|H1|H2|H3|H4|H5|H6|LI|TD|TH|LABEL|DIV|STRONG|B|SMALL|CAPTION|BLOCKQUOTE)$/.test(el.tagName) && el.children.length <= 3;
    if (isTextContainer && directText.length) {
      const color = parseCSSColor(cs.color);
      if (color) {
        const fg = color;
        let bg = chain[0] || { r: 255, g: 255, b: 255, a: 1 };
        for (const c of chain) bg = comp2(c, bg);
        const eff = comp2(fg, bg);
        const r2 = ratio({ r: eff.r, g: eff.g, b: eff.b }, { r: bg.r, g: bg.g, b: bg.b });
        const fs = parseFloat(cs.fontSize);
        const w = parseInt(cs.fontWeight, 10) || 400;
        const large = (fs >= 24) || (fs >= 18.66 && w >= 700);
        const text = directText[0].textContent.trim().slice(0, 40);
        if (r2 < (large ? 3 : 4.5)) {
          if (text.length) (large ? issues.aaLarge : issues.aa).push(`${el.tagName.toLowerCase()} "${text}" ${r2.toFixed(2)}:1 fg=${cs.color} bg≈${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}`);
        }
      }
    }
    // unlabeled interactive
    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.getBoundingClientRect().width > 0) {
      const name = (el.getAttribute('aria-label') || '').trim() ||
        (el.getAttribute('aria-labelledby') ? document.getElementById(el.getAttribute('aria-labelledby'))?.textContent : '') ||
        (el.textContent || '').trim().slice(0, 30);
      if (!name) issues.unlabeled.push(`<${el.tagName.toLowerCase()}>${el.getAttribute('class') ? '.'+el.getAttribute('class').split(' ').slice(0,2).join('.') : ''}`);
    }
    for (const ch of el.children) walk(ch, chain);
  };
  walk(document.documentElement, [{ r: 255, g: 255, b: 255, a: 1 }]);

  const heads = [];
  document.querySelectorAll('h1,h2,h3,h4').forEach((h) => heads.push(`${h.tagName.toLowerCase()}:${h.textContent.trim().slice(0, 44)}`));
  const emptyKw = Array.from(document.body.innerText.matchAll(/coming soon|تشاهد|قريباً|no words|no results|لا توجد|nothing (here|yet)|empty|ستتوفر|under development|قيد التطوير/gi)).slice(0, 12).map((m) => m[0]);

  return {
    dir: document.documentElement.getAttribute('dir') || 'ltr',
    langAttr: document.documentElement.getAttribute('lang') || '(none)',
    headingCount: heads.length,
    headings: heads,
    aaFailures: issues.aa.length,
    aaSample: issues.aa.slice(0, 12),
    aaLargeFailures: issues.aaLarge.length,
    unlabeled: issues.unlabeled.length,
    unlabeledSample: issues.unlabeled.slice(0, 10),
    emptyMarkers: emptyKw,
    canvases: document.querySelectorAll('canvas').length,
    audios: document.querySelectorAll('button[aria-label*="audio" i], [data-testid$="-audio"]').length,
    motion: document.querySelectorAll('[class*="animate-"], [class*="motion-"]').length,
    buttons: document.querySelectorAll('button').length,
    links: document.querySelectorAll('a').length,
    bodyTextLen: document.body.innerText.length,
  };
};

const allRows = [];
const only = process.argv[2] ? process.argv[2].split(',') : null;
const routes = only || ROUTES;

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 390, height: 844 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});

for (const route of routes) {
  for (const lang of ['en', 'ar']) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(({ lang, data }) => {
      try {
        localStorage.setItem('kurdish_quest_theme', 'light');
        localStorage.setItem('kurdish_quest_lang', lang);
        localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA' }));
        localStorage.setItem('kurmanji_user_data_v2', JSON.stringify(data));
      } catch {}
    }, { lang, data: SEED });
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2200));
    const m = await page.evaluate(auditScript, lang);
    m.route = route; m.lang = lang;
    const slug = (route === '/' ? 'home' : route.slice(1).replace(/\//g, '_'));
    const shot = path.join(OUT, `${slug}-${lang}.png`);
    try { await page.screenshot({ path: shot, fullPage: true }); m.shot = shot.replace(process.cwd() + '/', ''); } catch { m.shot = '(screenshot failed)'; }
    allRows.push(m);
    console.log(JSON.stringify(m));
    await page.close();
  }
}
await browser.close();
console.log('\n=== SUMMARY ===');
console.log('routes audited:', allRows.length);
console.log('AA text failures:', allRows.filter((r) => r.aaFailures > 0).length, 'routes; total:', allRows.reduce((s, r) => s + r.aaFailures, 0));
console.log('unlabeled controls:', allRows.reduce((s, r) => s + r.unlabeled, 0));
console.log('dir mismatches (ar lang, html dir != rtl):', allRows.filter((r) => r.lang === 'ar' && r.dir !== 'rtl').map((r) => r.route));
process.exit(0);

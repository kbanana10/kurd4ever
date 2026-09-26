/**
 * lesson-order-verify.mjs — per-letter PEDAGOGICAL verification of the authored
 * stroke plans, driven through the real UI with real CDP touch input.
 *
 * Why this exists: the 31/31 raster check (letter-strokes-verify.mjs) proves the
 * plans are geometrically consistent with the glyph. It does NOT prove that the
 * sequence a learner is taught is correct handwriting, nor that the app accepts
 * exactly the authored order. This probe closes that gap per letter:
 *
 *   1. The authored plan is read through the app's OWN modules in the browser
 *      (`/src/data/letterStrokes.ts` + `/src/lib/pathValidation.ts`), so the
 *      coordinates under test are the ones the app actually uses — no duplicated
 *      font/bbox math that could silently drift.
 *   2. For every stroke, in authored order, the guide's green start dot and
 *      amber end dot are asserted to sit ON that stroke's authored start/end
 *      (start point, end point, and order are therefore verified visually in the
 *      rendered guide, not just in the data file).
 *   3. The authored centreline is traced with touch. Acceptance is observed
 *      through the UI itself: the green dot must advance to the NEXT authored
 *      stroke's start, and after the final stroke the stage must become
 *      free-write. A stroke drawn in the wrong place cannot advance it.
 *   4. Direction: for a sample spanning line/curve/loop/diagonal/multi-stroke/
 *      diacritic letters, the FIRST stroke is deliberately drawn in reverse and
 *      must be REJECTED with the start-dot hint.
 *
 * Run: node audit/tools/lesson-order-verify.mjs [--letters=a,c,o] (dev server :3000)
 * Proof: audit/proof/lesson-order/<letter>.png (rendered guide after the full
 *        authored sequence was accepted).
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const OUT_DIR = path.resolve('audit/proof/lesson-order');
fs.mkdirSync(OUT_DIR, { recursive: true });

const only = (process.argv.find((a) => a.startsWith('--letters=')) || '').split('=')[1];
const LETTERS = only ? only.split(',') : ['a','b','c','ç','d','e','ê','f','g','h','i','î','j','k','l','m','n','o','p','q','r','s','ş','t','u','û','v','w','x','y','z'];
const DIRECTION_SAMPLE = ['c', 'o', 'g', 'k', 'h', 'ê'];

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('kurdish_quest_lang', 'en');
  localStorage.setItem('kurdish_quest_user', JSON.stringify({ uid: 'local_user', displayName: 'QA' }));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({ xp: 100, level: 1, gems: 100, streak: 0, reviewDeck: {}, completedLessons: [] }));
});
const session = await page.createCDPSession();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read the authored pixel-space strokes through the app's own modules. */
async function loadAuthored() {
  return page.evaluate(async () => {
    const [tl, ls, pv] = await Promise.all([
      import('/src/lib/traceLetters.ts'),
      import('/src/data/letterStrokes.ts'),
      import('/src/lib/pathValidation.ts'),
    ]);
    const plan = ls.getLetterStrokes(tlChar());
    if (!plan) return null;
    const mask = tl.buildLetterMask(plan.glyph);
    const bbox = pv.glyphBBoxFromMask(mask, tl.TRACE_CANVAS);
    if (!bbox) return null;
    return {
      glyph: plan.glyph,
      size: tl.TRACE_CANVAS,
      bbox,
      strokes: ls.letterStrokesToPx(plan, bbox),
      orders: plan.strokes.map((s) => s.order),
    };
    function tlChar() {
      return document.querySelector('span[dir="ltr"].font-mono')?.textContent?.trim() ?? '';
    }
  });
}

/**
 * Guide layer sampling. Dots are verified CLUSTER-BASED (pixel count within a
 * few px of the expected authored start/end) rather than by raw centroid:
 * where two past strokes overlap, two 0.30-alpha gold layers composite to
 * ~0.51 alpha, which passes a naive colour test and would drag a centroid off
 * the dot. A high alpha cutoff (200) excludes those composites, exactly as the
 * canonical lesson-success probe does.
 */
async function readGuide() {
  return page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find((c) => c.getAttribute('aria-hidden') !== null);
    if (!cv) return { error: 'no guide canvas' };
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const green = [], amber = [], other = [];
    for (let y = 0; y < cv.height; y += 1) {
      for (let x = 0; x < cv.width; x += 1) {
        const i = (y * cv.width + x) * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        if (a < 200) continue;                       // ignore dim/overlap compositing
        if (g > 150 && r < 80 && b < 140) green.push({ x, y });
        else if (r > 220 && g > 120 && g < 200 && b < 90) amber.push({ x, y });
        else other.push({ x, y });
      }
    }
    const mid = (arr) => (arr.length
      ? { x: arr.reduce((s, p) => s + p.x, 0) / arr.length, y: arr.reduce((s, p) => s + p.y, 0) / arr.length }
      : null);
    const r1 = (p) => (p ? { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 } : null);
    return {
      green: r1(mid(green)),
      amber: r1(mid(amber)),
      greenPx: green,
      amberPx: amber,
      guidePx: other.length,
    };
  });
}

/** Count guide pixels of a colour class within `radius` of a point. */
function pixelsNear(list, pt, radius = 8) {
  if (!list) return 0;
  let n = 0;
  for (const p of list) if (Math.hypot(p.x - pt.x, p.y - pt.y) <= radius) n += 1;
  return n;
}

async function canvasRect() {
  return page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find((c) => !c.classList.contains('pointer-events-none'));
    const r = cv.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
}

const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const r2 = (p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });

/** Densify a polyline into ~step-px samples with a small perpendicular wobble. */
function densify(points, size, step = 5) {
  const out = [];
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 - 0.5);
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1], b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(len / step));
    const nx = len > 0 ? -(b.y - a.y) / len : 0;
    const ny = len > 0 ? (b.x - a.x) / len : 0;
    for (let k = (i === 1 ? 0 : 1); k <= n; k += 1) {
      const t = k / n;
      // ±1.4 px of human wobble, well inside the app's tolerances.
      const wob = rnd() * 2.8;
      out.push({ x: a.x + (b.x - a.x) * t + nx * wob, y: a.y + (b.y - a.y) * t + ny * wob });
    }
  }
  return out.length >= 2 ? out : points.slice();
}

const inCalibration = (a, b) => {
  // Sanity guard: the wobble must stay inside the app's own analysis space.
  return Math.abs(a.x - b.x) < 12 && Math.abs(a.y - b.y) < 12;
};

async function traceStroke(pointsPx, size, rect) {
  const pts = densify(pointsPx, size);
  const toClient = (p) => ({ x: rect.x + (p.x / size) * rect.w, y: rect.y + (p.y / size) * rect.h });
  const first = toClient(pts[0]);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: first.x, y: first.y }] });
  for (let i = 1; i < pts.length; i += 1) {
    const c = toClient(pts[i]);
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x, y: c.y }] });
  }
  const last = toClient(pts[pts.length - 1]);
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: last.x, y: last.y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(180);
}

async function stageIsWrite() {
  return page.evaluate(() => /Write it freely|Now write it without the guide lines/i.test(document.body.innerText));
}
async function feedback() {
  return page.evaluate(() => document.querySelector('[role="status"]')?.textContent ?? null);
}

const STEP_DIR = path.join(OUT_DIR, 'steps');
fs.mkdirSync(STEP_DIR, { recursive: true });
let shotFailures = 0;
async function shotStep(letter, step, row) {
  try {
    const el = await page.$('div.relative.w-full.rounded-3xl');
    if (!el) return;
    await el.screenshot({ path: path.join(STEP_DIR, `${letter}-${String(step).padStart(2, '0')}.png`) });
  } catch {
    shotFailures += 1;
  }
}

const report = [];
for (const id of LETTERS) {
  const row = { id, strokes: 0, accepted: 0, dotMismatches: [], advanced: false, directionRejected: null, error: null };
  try {
    await page.goto(`http://localhost:3000/writing/lesson/${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(300);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /Skip to tracing|بدء التتبع مباشرة|Yekser/i.test(x.textContent || ''));
      b?.click();
    });
    await sleep(400);

    const authored = await loadAuthored();
    if (!authored || !authored.strokes?.length) {
      row.error = 'no authored strokes resolved';
      report.push(row);
      continue;
    }
    row.strokes = authored.strokes.length;
    row.orders = authored.orders.join(',');
    const rect = await canvasRect();

    // --- direction sample: reverse the first stroke, expect rejection --------
    if (DIRECTION_SAMPLE.includes(id)) {
      const reversed = [...authored.strokes[0]].reverse();
      await traceStroke(reversed, authored.size, rect);
      await sleep(150);
      const fb = await feedback();
      const g = await readGuide();
      const stillStroke0 = g.green && D(g.green, authored.strokes[0][0]) <= 10;
      const wrote = await stageIsWrite();
      row.directionRejected = {
        rejected: !!stillStroke0 && !wrote,
        feedback: fb,
        stillOnFirstStroke: !!stillStroke0,
        reachedWriteStage: wrote,
      };
    }

    // The deliberate reverse attempt leaves its red deviation overlay on the
    // canvas until the next accepted stroke. Reload for a clean forward pass so
    // the construction-sequence renders show only the authored guide + ink.
    if (row.directionRejected) {
      await page.goto(`http://localhost:3000/writing/lesson/${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(300);
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => /Skip to tracing|بدء التتبع مباشرة|Yekser/i.test(x.textContent || ''));
        b?.click();
      });
      await sleep(400);
    }

    // --- trace every authored stroke in order ------------------------------
    const rectAfter = row.directionRejected ? await canvasRect() : rect;
    for (let s = 0; s < authored.strokes.length; s += 1) {
      const target = authored.strokes[s];
      const expectedStart = target[0];
      const expectedEnd = target[target.length - 1];
      const before = await readGuide();
      const startPx = pixelsNear(before.greenPx, expectedStart);
      const endPx = pixelsNear(before.amberPx, expectedEnd);
      if (startPx < 20) {
        row.dotMismatches.push({ stroke: s, what: 'start', nearPx: startPx, want: r2(expectedStart), gotCentroid: before.green });
      }
      if (endPx < 20) {
        row.dotMismatches.push({ stroke: s, what: 'end', nearPx: endPx, want: r2(expectedEnd), gotCentroid: before.amber });
      }

      // Step proof: guide + ink BEFORE this stroke (previous strokes already
      // gold = authored order made visible), so the sequence can be reviewed.
      await shotStep(id, s, row);
      await traceStroke(target, authored.size, rectAfter);
      const after = await readGuide();
      const isLast = s === authored.strokes.length - 1;
      if (isLast) {
        const wrote = await stageIsWrite();
        if (wrote) { row.accepted += 1; row.advanced = true; }
      } else {
        const nextStart = authored.strokes[s + 1][0];
        if (pixelsNear(after.greenPx, nextStart) >= 20) row.accepted += 1;
      }
      if (isLast && row.advanced) break;
    }

    // Final proof: the free-write stage, i.e. the sequence really completed.
    const el = await page.$('div.relative.w-full.rounded-3xl');
    if (el) await el.screenshot({ path: path.join(OUT_DIR, `${id}.png`) });
  } catch (e) {
    row.error = String(e).slice(0, 200);
  }
  report.push(row);
}

await browser.close();

const failed = report.filter((r) => r.error || r.accepted !== r.strokes || r.dotMismatches.length > 0);
const dirFailed = report.filter((r) => r.directionRejected && !r.directionRejected.rejected);
console.log(JSON.stringify({
  letters: report.length,
  fullyAccepted: report.filter((r) => r.accepted === r.strokes && !r.error).length,
  failures: failed,
  directionRejected: report.filter((r) => r.directionRejected).map((r) => ({ id: r.id, ...r.directionRejected })),
  directionFailures: dirFailed.map((r) => r.id),
  pageErrors: pageErrors.slice(0, 5),
  stepShotFailures: shotFailures,
}, null, 2));
process.exit(failed.length || dirFailed.length ? 1 : 0);

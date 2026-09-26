/**
 * lesson-order-strips.mjs — compose per-letter CONSTRUCTION SEQUENCES from the
 * step renders written by lesson-order-verify.mjs
 * (audit/proof/lesson-order/steps/<letter>-<nn>.png).
 *
 * Each step shows the guide with every ALREADY-ACCEPTED stroke in gold and the
 * next stroke dashed with its green start / amber end dot — i.e. the exact order
 * the learner is taught, left to right.
 *
 * Out: audit/proof/lesson-order/<letter>-strip.png  (all 31 letters)
 *      audit/proof/lesson-order-sequence.png       (review sheet, 4 letters)
 * Run: node audit/tools/lesson-order-strips.mjs
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const DIR = path.resolve('audit/proof/lesson-order');
const STEP_DIR = path.join(DIR, 'steps');
const LETTERS = ['a','b','c','ç','d','e','ê','f','g','h','i','î','j','k','l','m','n','o','p','q','r','s','ş','t','u','û','v','w','x','y','z'];

/** Load a letter's ordered step images as data URLs. */
function stepsFor(letter) {
  if (!fs.existsSync(STEP_DIR)) return [];
  return fs.readdirSync(STEP_DIR)
    .filter((f) => f.startsWith(`${letter}-`) && f.endsWith('.png'))
    .sort()
    .map((f) => `data:image/png;base64,${fs.readFileSync(path.join(STEP_DIR, f)).toString('base64')}`);
}

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 1500, height: 1200 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
await page.setContent('<body style="margin:0;background:#fff"></body>');

/** Compose a horizontal strip: <letter> then one cell per authored stroke. */
async function composeStrip(letter, cellSize, headerSize) {
  const imgs = stepsFor(letter);
  return page.evaluate(async (items, L, CELL, HEAD) => {
    const n = items.length;
    const cv = document.createElement('canvas');
    cv.width = 70 + n * (CELL + 8);
    cv.height = CELL + HEAD + 8;
    const x = cv.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#0f172a';
    x.font = `bold ${HEAD}px sans-serif`;
    x.fillText(L.toUpperCase(), 10, CELL / 2 + HEAD / 2);
    for (let i = 0; i < n; i += 1) {
      const img = new Image();
      img.src = items[i];
      await img.decode();
      const ox = 70 + i * (CELL + 8);
      x.fillStyle = '#f1f5f9';
      x.fillRect(ox, 0, CELL, CELL);
      x.drawImage(img, ox, 0, CELL, CELL);
      x.fillStyle = '#475569';
      x.font = `bold ${Math.round(HEAD * 0.62)}px sans-serif`;
      x.fillText(`step ${i + 1}`, ox + 6, CELL + HEAD * 0.7);
    }
    return cv.toDataURL('image/png');
  }, imgs, letter, cellSize, headerSize);
}

/** Write one strip per letter that has step renders. */
const written = [];
for (const l of LETTERS) {
  if (stepsFor(l).length === 0) continue;
  const url = await composeStrip(l, 150, 22);
  fs.writeFileSync(path.join(DIR, `${l}-strip.png`), Buffer.from(url.split(',')[1], 'base64'));
  written.push(l);
}

/** Review sheet: a few representative letters at a readable size. */
const REVIEW = ['a', 'b', 'c', 'g', 'h', 'ê'];
const sheet = await page.evaluate(async (items) => {
  const CELL = 160, HEAD = 26, ROWGAP = 14;
  const strips = [];
  for (const it of items) {
    const img = new Image();
    img.src = it.url;
    await img.decode();
    strips.push({ l: it.letter, img });
  }
  const width = Math.max(...strips.map((s) => s.img.width)) + 20;
  const height = 40 + strips.reduce((s, st) => s + st.img.height + ROWGAP, 0);
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const x = cv.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = '#0f172a';
  x.font = 'bold 20px sans-serif';
  x.fillText('Authored construction sequence (left → right = the order the learner is taught)', 10, 26);
  let y = 40;
  for (const s of strips) {
    x.drawImage(s.img, 10, y);
    y += s.img.height + ROWGAP;
  }
  return cv.toDataURL('image/png');
}, await Promise.all(REVIEW.filter((l) => stepsFor(l).length).map(async (l) => ({ letter: l, url: await composeStrip(l, 200, 30) }))));

fs.writeFileSync(path.resolve('audit/proof/lesson-order-sequence.png'), Buffer.from(sheet.split(',')[1], 'base64'));
console.log('strips:', written.length, '| review sheet: audit/proof/lesson-order-sequence.png');
await browser.close();

/**
 * lesson-order-sheet.mjs — compose the 31 per-letter proof renders
 * (audit/proof/lesson-order/<letter>.png) into ONE contact sheet so the authored
 * constructions can be reviewed visually at a glance: gold = strokes already
 * traced in this run, dashed slate = the active stroke, green dot = start,
 * amber dot = end (captured after the full authored sequence was accepted).
 *
 * Run: node audit/tools/lesson-order-sheet.mjs
 * Out: audit/proof/lesson-order-sheet.png
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';

const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
const DIR = path.resolve('audit/proof/lesson-order');
const LETTERS = ['a','b','c','ç','d','e','ê','f','g','h','i','î','j','k','l','m','n','o','p','q','r','s','ş','t','u','û','v','w','x','y','z'];

const images = LETTERS.filter((l) => fs.existsSync(path.join(DIR, `${l}.png`)))
  .map((l) => ({ l, data: fs.readFileSync(path.join(DIR, `${l}.png`)).toString('base64') }));

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 1400, height: 1000 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
await page.setContent('<body style="margin:0;background:#fff"></body>');

const sheet = await page.evaluate(async (items) => {
  const COLS = 6, CELL = 210, PAD = 10, LABEL = 26;
  const rows = Math.ceil(items.length / COLS);
  const cv = document.createElement('canvas');
  cv.width = COLS * (CELL + PAD) + PAD;
  cv.height = rows * (CELL + PAD + LABEL) + PAD + 34;
  const x = cv.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = '#0f172a';
  x.font = 'bold 17px sans-serif';
  x.fillText('Lesson trace guides — gold = traced in authored order · dashed = active · green = start · amber = end', PAD, 24);

  for (let i = 0; i < items.length; i += 1) {
    const col = i % COLS, row = (i / COLS) | 0;
    const ox = PAD + col * (CELL + PAD);
    const oy = 34 + PAD + row * (CELL + PAD + LABEL);
    const img = new Image();
    img.src = `data:image/png;base64,${items[i].data}`;
    await img.decode();
    x.fillStyle = '#f1f5f9';
    x.fillRect(ox, oy, CELL, CELL);
    x.drawImage(img, ox, oy, CELL, CELL);
    x.fillStyle = '#0f172a';
    x.font = 'bold 18px sans-serif';
    x.fillText(items[i].l.toUpperCase(), ox + 6, oy + CELL + 20);
  }
  document.body.appendChild(cv);
  return cv.toDataURL('image/png');
}, images);

fs.writeFileSync(path.resolve('audit/proof/lesson-order-sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'));
console.log('wrote audit/proof/lesson-order-sheet.png from', images.length, 'letters');
await browser.close();

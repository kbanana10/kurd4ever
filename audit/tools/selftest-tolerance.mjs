// selftest-tolerance.mjs — headless runner for the writing tracing self-test.
//
// The in-app canary (WritingTracingPage) runs runTraceSelfTest in DEV and only
// console.errors when it fails. This tool runs the SAME self-test headlessly,
// in a real browser where the Canvas API exists, and prints the verdict +
// coverage + per-letter minimum zone coverage + miss-pixel count for evidence.
//
// It measures the tolerance CURRENTLY compiled into src/lib/traceLetters.ts
// (COVERAGE_TOLERANCE_PX): change that constant, re-run this (no rebuild
// needed — Vite serves the module on demand), and read the new numbers.
//
// Usage (dev server on :3000):
//   node audit/tools/selftest-tolerance.mjs
//   CHARS=I,E,O,M,W node audit/tools/selftest-tolerance.mjs
//
// Browser: puppeteer-core + @sparticuz/chromium (no CDN); NSS libs auto-extracted.
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const CHARS = (process.env.CHARS || 'I,E,O,M,W').split(',').map((c) => c.trim());
const BASE = process.env.BASE || 'http://localhost:3000';

// NSS libs for the sparticuz binary on plain Debian (see docs/agent-setup.md §4).
const fs = await import('node:fs');
const path = await import('node:path');
const os = await import('node:os');
const NSS_LIB = path.join(os.tmpdir(), 'nsslibs', 'lib');
if (!fs.existsSync(path.join(NSS_LIB, 'libnss3.so'))) {
  const { createReadStream, createWriteStream } = await import('node:fs');
  const { createBrotliDecompress } = await import('node:zlib');
  const { pipeline } = await import('node:stream/promises');
  const { execSync } = await import('node:child_process');
  const pkgBin = path.resolve(process.cwd(), 'node_modules/@sparticuz/chromium/bin');
  const tar = path.join(os.tmpdir(), 'al2023.tar');
  await pipeline(
    createReadStream(path.join(pkgBin, 'al2023.tar.br')),
    createBrotliDecompress(),
    createWriteStream(tar),
  );
  fs.mkdirSync(path.join(os.tmpdir(), 'nsslibs'), { recursive: true });
  execSync(`tar -xf ${tar} -C ${path.join(os.tmpdir(), 'nsslibs')}`);
}

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: { width: 800, height: 800 },
  executablePath: await chromium.executablePath(),
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: `${NSS_LIB}:${process.env.LD_LIBRARY_PATH || ''}` },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`${BASE}/writing/trace`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 3000));

const { tolerance, rows } = await page.evaluate(async (chars) => {
  const mod = await import('/src/lib/traceLetters.ts');
  const results = mod.runTraceSelfTest(chars);
  return {
    tolerance: mod.COVERAGE_TOLERANCE_PX,
    rows: results.map((r) => ({
      char: r.char,
      passed: r.passed,
      coverage: +(r.coverage * 100).toFixed(1),
      minZone: Math.min(...r.zoneCoverage.map((z) => +(z * 100).toFixed(1))),
      missPixels: r.missPixels,
    })),
  };
}, CHARS);

console.log(`COVERAGE_TOLERANCE_PX = ${tolerance}`);
console.log('char  passed  coverage  minZone  missPixels');
let allPassed = true;
for (const r of rows) {
  if (!r.passed) allPassed = false;
  console.log(
    `${r.char.padEnd(5)} ${String(r.passed).padEnd(7)} ${String(r.coverage).padStart(7)}  ${String(r.minZone).padStart(7)}  ${String(r.missPixels).padStart(9)}`,
  );
}
await browser.close();
process.exit(allPassed ? 0 : 1);

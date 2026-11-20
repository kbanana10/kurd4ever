/**
 * matrix-sweep.mjs — full-matrix static capture + automated DOM checks.
 * Matrix: 2 viewports x 2 themes x 3 languages for primary routes.
 */
import fs from 'fs';
import { launch, newAuditPage, gotoAndSettle, snap, runDomChecks } from './qa-lib.mjs';

const FULL_ROUTES = [
  ['home', '/'],
  ['learn', '/learn'],
  ['alphabet', '/alphabet'],
  ['vocabulary', '/vocabulary'],
  ['sentences', '/sentences'],
  ['favorites', '/favorites'],
  ['roadmap', '/roadmap'],
  ['games', '/games'],
  ['search', '/search'],
  ['profile', '/profile'],
  ['leaderboard', '/leaderboard'],
  ['login', '/login'],
];
const LIGHT_ROUTES = [
  ['privacy', '/privacy'],
  ['terms', '/terms'],
  ['notfound', '/definitely-not-a-route'],
];

const results = [];
const browser = await launch();

async function testCell(name, route, viewport, theme, lang) {
  const seed = name !== 'login'; // login gate must be tested signed-out
  const { ctx, page, issues } = await newAuditPage(browser, { viewport, theme, lang, seed });
  const id = `${name}__${viewport}__${theme}__${lang}`;
  try {
    await gotoAndSettle(page, route);
    const checks = await runDomChecks(page);
    const shot = await snap(page, id);
    results.push({ id, route, viewport, theme, lang, shot, checks, issues });
  } catch (e) {
    results.push({ id, route, viewport, theme, lang, error: String(e).slice(0, 300), issues });
  } finally {
    await ctx.close();
  }
  process.stdout.write('.');
}

for (const [name, route] of FULL_ROUTES) {
  for (const viewport of ['mobile', 'desktop'])
    for (const theme of ['light', 'dark'])
      for (const lang of ['en', 'ar', 'ku'])
        await testCell(name, route, viewport, theme, lang);
  console.log(' ' + name);
}
for (const [name, route] of LIGHT_ROUTES) {
  for (const viewport of ['mobile', 'desktop'])
    await testCell(name, route, viewport, 'dark', 'en');
  console.log(' ' + name);
}

await browser.close();
fs.writeFileSync('audit/tools/results-matrix.json', JSON.stringify(results, null, 1));

// Console summary of defects
let defects = 0;
for (const r of results) {
  const c = r.checks || {};
  const errs = [...(r.issues?.consoleErrors || []), ...(r.issues?.pageErrors || [])];
  const fails = r.issues?.failedRequests || [];
  if (r.error || errs.length || fails.length || c.hScroll || (c.smallTargets?.length) || (c.clippedText?.length)) {
    defects++;
    console.log(`\n[${r.id}]`);
    if (r.error) console.log('  NAV ERROR: ' + r.error);
    errs.slice(0, 3).forEach((e) => console.log('  CONSOLE: ' + e.slice(0, 160)));
    fails.slice(0, 5).forEach((f) => console.log('  REQ: ' + f));
    if (c.hScroll) console.log('  H-OVERFLOW: +' + c.hScrollDelta + 'px');
    if (c.smallTargets?.length) console.log('  SMALL TARGETS: ' + c.smallTargets.length + ' e.g. ' + JSON.stringify(c.smallTargets.slice(0, 3)));
    if (c.clippedText?.length) console.log('  CLIPPED: ' + JSON.stringify(c.clippedText.slice(0, 3)));
  }
}
console.log(`\nDone. ${results.length} cells, ${defects} with findings.`);

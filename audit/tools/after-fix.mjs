/**
 * after-fix.mjs — re-capture + re-check the surfaces that received patches.
 */
import fs from 'fs';
import { launch, newAuditPage, gotoAndSettle, snap, runDomChecks } from './qa-lib.mjs';

const CELLS = [
  // [name, route, viewport, theme, lang]  — one per fix
  ['fix_i18n_sentences_ku', '/sentences', 'mobile', 'dark', 'ku'],
  ['fix_i18n_notfound_ku', '/definitely-not-a-route', 'mobile', 'dark', 'ku'],
  ['fix_login_dark_contrast', '/login', 'mobile', 'dark', 'en'],
  ['fix_nav_label_ar', '/', 'mobile', 'dark', 'ar'],
  ['fix_touch_targets_search', '/search', 'mobile', 'light', 'en'],
  ['fix_leaderboard_classes', '/leaderboard', 'mobile', 'dark', 'en'],
  ['fix_roadmap_reset_btn', '/roadmap', 'mobile', 'light', 'en'],
];

const browser = await launch();
const out = [];
for (const [name, route, viewport, theme, lang] of CELLS) {
  const seed = !route.includes('/login');
  const { ctx, page, issues } = await newAuditPage(browser, { viewport, theme, lang, seed });
  await gotoAndSettle(page, route, 1200);
  const checks = await runDomChecks(page);
  const shot = await snap(page, `afterfix_${name}`);
  out.push({ name, route, shot, checks, issues });
  console.log(`\n[${name}] ${route}`);
  console.log('  smallTargets:', checks.smallTargets.length ? JSON.stringify(checks.smallTargets.slice(0, 6)) : 'none');
  console.log('  clipped:', checks.clippedText.length ? JSON.stringify(checks.clippedText.slice(0, 3)) : 'none');
  console.log('  hScroll:', checks.hScroll ? '+' + checks.hScrollDelta + 'px' : 'none');
  console.log('  consoleErrors:', issues.consoleErrors.length, ' pageErrors:', issues.pageErrors.length, ' failedReq:', issues.failedRequests.slice(0, 3));
  await ctx.close();
}
await browser.close();
fs.writeFileSync('audit/tools/results-afterfix.json', JSON.stringify(out, null, 1));
console.log('\nAfter-fix verification complete.');

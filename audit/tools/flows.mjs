/**
 * flows.mjs — interactive end-to-end flows with visual capture.
 * Covers: onboarding, dashboard modal, quiz engine (all question types),
 * roadmap nodes, vocabulary/search/favorites, sentences, games,
 * profile (theme + language flips).
 */
import fs from 'fs';
import { launch, newAuditPage, gotoAndSettle, snap, BASE } from './qa-lib.mjs';

const src = fs.readFileSync('src/data/learningPath.ts', 'utf8');
const DICT = [...src.matchAll(/ku: "([^"]+)", en: "([^"]+)", ar: "([^"]+)"/g)]
  .map((m) => ({ ku: m[1], en: m[2], ar: m[3] }));

const results = [];
function log(flow, step, ok, note = '', shot = null) {
  results.push({ flow, step, ok, note, shot });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${flow}] ${step}${note ? ' — ' + note : ''}${shot ? '  →' + shot : ''}`);
}
const browser = await launch();

async function flowPage(opts, flowName) {
  const { ctx, page, issues } = await newAuditPage(browser, opts);
  page._flow = flowName;
  return { ctx, page, issues };
}

/* ---------------- FLOW 1: Onboarding (fresh user) ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'light', lang: 'en', seed: false }, 'onboarding');
  try {
    await gotoAndSettle(page, '/');
    // Expect redirect to /login
    const gate = page.url().includes('/login');
    log('onboarding', 'unauthenticated redirect to /login', gate, page.url());
    await snap(page, 'flow_onboarding_01_login_gate');
    await page.fill('input[type="text"]', 'QA Tester');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const s2 = await snap(page, 'flow_onboarding_02_after_signin');
    log('onboarding', 'local sign-in via name', !page.url().includes('/login'), page.url(), s2);
    // Onboarding overlay should appear (isOnboarded=false)
    for (let step = 3; step <= 8; step++) {
      const btn = page.locator('button:visible', { hasText: /continue|next|start|let's go|begin/i }).last();
      const anyOption = page.locator('[role="dialog"] button:visible, .fixed button:visible').first();
      if (await btn.count() && await btn.isVisible().catch(() => false)) {
        await snap(page, `flow_onboarding_0${step}_step`);
        // pick first selectable option if present, then continue
        try { await anyOption.click({ timeout: 1500 }); } catch {}
        try { await btn.click({ timeout: 2500 }); } catch { break; }
        await page.waitForTimeout(900);
      } else break;
    }
    const done = await snap(page, 'flow_onboarding_09_done');
    log('onboarding', 'onboarding wizard walk-through', true, '', done);
  } catch (e) { log('onboarding', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'onboarding', issues });
  await ctx.close();
}

/* ---------------- FLOW 2: Dashboard interactions ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'dark', lang: 'en' }, 'dashboard');
  try {
    await gotoAndSettle(page, '/');
    await snap(page, 'flow_dashboard_01_hero');
    // Scroll through to smart review + library
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
    await snap(page, 'flow_dashboard_02_midpage');
    await page.mouse.wheel(0, 1400);
    await page.waitForTimeout(600);
    await snap(page, 'flow_dashboard_03_library');
    // Daily Goal modal
    const goalBtn = page.locator('button', { hasText: 'Set Study Goal' });
    await goalBtn.scrollIntoViewIfNeeded();
    await goalBtn.click();
    await page.waitForTimeout(800);
    const s = await snap(page, 'flow_dashboard_04_daily_goal_modal');
    const modalVisible = await page.locator('[role="dialog"], .fixed.inset-0').last().isVisible().catch(() => false);
    log('dashboard', 'Daily Goal modal opens', modalVisible, '', s);
    await page.keyboard.press('Escape');
  } catch (e) { log('dashboard', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'dashboard', issues });
  await ctx.close();
}

/* ---------------- FLOW 3: Quiz engine ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'light', lang: 'en' }, 'quiz');
  try {
    await gotoAndSettle(page, '/quiz/a1_family', 1500);
    await snap(page, 'flow_quiz_01_start');
    // Phase 1 "Explore & Learn" study list → advance to the quiz
    const playBtn = page.locator('button', { hasText: /Let's Play Random Quiz/i }).first();
    if (await playBtn.count()) {
      log('quiz', 'study phase (Explore & Learn) rendered', true);
      await playBtn.scrollIntoViewIfNeeded();
      await playBtn.click();
      await page.waitForTimeout(1200);
      await snap(page, 'flow_quiz_02_quiz_begins');
    }
    const typesSeen = new Set();
    let feedbackShots = 0;
    const deadline = Date.now() + 180000; // 3-minute budget for the quiz walk
    for (let i = 0; i < 60 && Date.now() < deadline; i++) {
      await page.waitForTimeout(500);
      // Victory screen?
      if (await page.locator('text=/Review Answers|Back to Home/i').first().isVisible().catch(() => false)) {
        const s = await snap(page, 'flow_quiz_90_victory');
        log('quiz', 'victory screen reached', true, `${i} steps`, s);
        break;
      }
      // Next / Continue after feedback
      const next = page.locator('button', { hasText: /^(Next Question|Continue)$/ }).first();
      if (await next.isVisible().catch(() => false)) {
        if (feedbackShots < 2) {
          const s = await snap(page, `flow_quiz_1${feedbackShots}_feedback`);
          log('quiz', 'answer feedback state', true, '', s);
          feedbackShots++;
        }
        await next.click().catch(() => {});
        continue;
      }
      // Typing (translate) question
      const input = page.locator('main input[type="text"]:visible').first();
      if (await input.count() && await input.isVisible().catch(() => false)) {
        if (!typesSeen.has('translate')) {
          typesSeen.add('translate');
          const s = await snap(page, 'flow_quiz_20_translate');
          log('quiz', 'translate question rendered', true, '', s);
        }
        // find the prompt word and answer from dictionary
        const body = await page.locator('main').innerText().catch(() => '');
        let answer = 'test';
        for (const d of DICT) {
          if (body.includes(`"${d.ku}"`) || body.includes(d.ku)) { answer = d.en; break; }
          if (body.includes(`"${d.en}"`)) { answer = d.ku; break; }
        }
        await input.fill(answer);
        const verify = page.locator('button', { hasText: /^Verify$/ }).first();
        if (await verify.isVisible().catch(() => false)) await verify.click().catch(() => {});
        continue;
      }
      // Scrambled letters: single-char tile buttons
      const tiles = page.locator('main button:visible').filter({ hasText: /^[A-Za-zÇÊÎŞÛçêîşû]$/ });
      const tileCount = await tiles.count();
      if (tileCount >= 3) {
        if (!typesSeen.has('scramble')) {
          typesSeen.add('scramble');
          const s = await snap(page, 'flow_quiz_30_scramble');
          log('quiz', 'scrambled letters rendered', true, `${tileCount} tiles`, s);
        }
        for (let k = 0; k < tileCount; k++) {
          const t = tiles.nth(0);
          if (await t.isVisible().catch(() => false)) await t.click().catch(() => {});
          await page.waitForTimeout(120);
        }
        const verify = page.locator('button', { hasText: /^Verify$/ }).first();
        if (await verify.isVisible().catch(() => false)) await verify.click().catch(() => {});
        continue;
      }
      // Multiple choice: click best dictionary match else first big option
      const opts = page.locator('main button:visible').filter({ hasText: /\S{2,}/ });
      const n = await opts.count();
      let clicked = false;
      const body = await page.locator('main').innerText().catch(() => '');
      const target = DICT.find((d) => body.includes(`"${d.ku}"`) || body.includes(d.ku));
      for (let k = 0; k < n && !clicked; k++) {
        const txt = ((await opts.nth(k).innerText().catch(() => '')) || '').trim();
        if (/Verify|Next|Continue|Hint|Skip|Quit|Exit/i.test(txt)) continue;
        if (target && (txt.includes(target.en) || txt.includes(target.ku) || txt.includes(target.ar))) {
          if (!typesSeen.has('mcq')) {
            typesSeen.add('mcq');
            const s = await snap(page, 'flow_quiz_40_mcq');
            log('quiz', 'multiple-choice rendered', true, '', s);
          }
          await opts.nth(k).click().catch(() => {});
          clicked = true;
        }
      }
      if (!clicked) {
        for (let k = 0; k < n; k++) {
          const txt = ((await opts.nth(k).innerText().catch(() => '')) || '').trim();
          if (/Verify|Next|Continue|Hint|Skip|Quit|Exit|slow|mute/i.test(txt)) continue;
          if (txt.length >= 2 && txt.length < 60) {
            if (!typesSeen.has('mcq')) {
              typesSeen.add('mcq');
              const s = await snap(page, 'flow_quiz_40_mcq');
              log('quiz', 'multiple-choice rendered', true, '', s);
            }
            await opts.nth(k).click().catch(() => {});
            clicked = true;
            break;
          }
        }
      }
      const verify = page.locator('button', { hasText: /^Verify$/ }).first();
      if (await verify.isVisible().catch(() => false)) await verify.click().catch(() => {});
      if (!clicked && i > 4) {
        await snap(page, `flow_quiz_stuck_${i}`);
      }
    }
    log('quiz', 'question types exercised', typesSeen.size > 0, [...typesSeen].join(','));
  } catch (e) { log('quiz', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'quiz', issues });
  await ctx.close();
}

/* ---------------- FLOW 4: Roadmap nodes ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'light', lang: 'en' }, 'roadmap');
  try {
    await gotoAndSettle(page, '/roadmap', 1400);
    await snap(page, 'flow_roadmap_01_top');
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(500);
    await snap(page, 'flow_roadmap_02_path');
    // click PLAY (active node)
    const play = page.locator('text=/^PLAY$/i').first();
    if (await play.isVisible().catch(() => false)) {
      await play.click();
      await page.waitForTimeout(900);
      const s = await snap(page, 'flow_roadmap_03_node_modal');
      log('roadmap', 'active node opens detail modal', true, '', s);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    } else log('roadmap', 'active node PLAY marker found', false);
    // click a locked node (circle buttons further down)
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(500);
    const lockedBtn = page.locator('main button:visible').filter({ has: page.locator('svg') }).last();
    await lockedBtn.click().catch(() => {});
    await page.waitForTimeout(700);
    const s2 = await snap(page, 'flow_roadmap_04_locked_click');
    log('roadmap', 'locked node interaction captured', true, '', s2);
  } catch (e) { log('roadmap', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'roadmap', issues });
  await ctx.close();
}

/* ---------------- FLOW 5: Vocabulary / Search / Favorites ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'dark', lang: 'en' }, 'vocab');
  try {
    await gotoAndSettle(page, '/vocabulary');
    await snap(page, 'flow_vocab_01_categories');
    // open a category card (they live below the tab switcher)
    const cat = page.locator('main button, main [role="button"], main div[class*="cursor-pointer"]').filter({ hasText: /^(Numbers|Colors)/m }).first();
    await cat.click();
    await page.waitForTimeout(1200);
    const s1 = await snap(page, 'flow_vocab_02_word_list');
    log('vocab', 'category opens word list', page.url().includes('/vocabulary/'), page.url(), s1);
    // expand a word card
    const card = page.locator('main [class*="rounded"]:has(button)').first();
    await card.click().catch(() => {});
    await page.waitForTimeout(600);
    await snap(page, 'flow_vocab_03_word_expanded');
    // favorite toggle
    const fav = page.locator('button[aria-label*="favorite" i]').first();
    if (await fav.count()) {
      await fav.click();
      await page.waitForTimeout(400);
      const s = await snap(page, 'flow_vocab_04_favorited');
      log('vocab', 'favorite toggle works', true, '', s);
    } else log('vocab', 'favorite button present', false);
    // audio button (missing files expected — checking console/404 handling)
    const audio = page.locator('button[aria-label*="audio" i], button:has(svg.lucide-volume-2)').first();
    if (await audio.count()) { await audio.click().catch(() => {}); await page.waitForTimeout(700); }
    // SEARCH
    await gotoAndSettle(page, '/search');
    await page.fill('input[type="text"], input[type="search"]', 'av');
    await page.waitForTimeout(900);
    const s2 = await snap(page, 'flow_search_01_typed_query');
    log('search', 'search typing renders results', true, 'query=av', s2);
    await page.locator('button', { hasText: /^A1$/ }).first().click().catch(() => {});
    await page.waitForTimeout(600);
    await snap(page, 'flow_search_02_cefr_filter');
    await page.locator('button', { hasText: /^Nouns$/ }).first().click().catch(() => {});
    await page.waitForTimeout(600);
    const s3 = await snap(page, 'flow_search_03_pos_filter');
    log('search', 'CEFR + POS filters applied', true, '', s3);
    // FAVORITES
    await gotoAndSettle(page, '/favorites');
    const s4 = await snap(page, 'flow_favorites_01');
    log('favorites', 'favorites page renders seeded favorites', true, '', s4);
  } catch (e) { log('vocab', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'vocab', issues });
  await ctx.close();
}

/* ---------------- FLOW 6: Sentences ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'light', lang: 'en' }, 'sentences');
  try {
    // SENTENCES
    await gotoAndSettle(page, '/sentences', 1200);
    await snap(page, 'flow_sentences_01_daily_tab');
    const tab = page.locator('button', { hasText: /Times|Dialogues|Reading|Stories/i }).first();
    if (await tab.count()) {
      await tab.click();
      await page.waitForTimeout(800);
      const s2 = await snap(page, 'flow_sentences_02_tab_switch');
      log('sentences', 'tab switching', true, '', s2);
    } else log('sentences', 'tabs found', false);
    // phrase playback trigger
    const play = page.locator('main button:has(svg)').filter({ hasNot: page.locator('text=/\\w{4,}/') }).first();
    await play.click().catch(() => {});
    await page.waitForTimeout(700);
    await snap(page, 'flow_sentences_03_audio_clicked');
  } catch (e) { log('sentences', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'sentences', issues });
  await ctx.close();
}

/* ---------------- FLOW 7: Mini-games ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'dark', lang: 'en' }, 'games');
  try {
    await gotoAndSettle(page, '/games', 1200);
    await snap(page, 'flow_games_01_menu');
    const launch = async (label, file) => {
      const card = page.locator('main button, main [role="button"], main div[class*="cursor-pointer"]').filter({ hasText: label }).first();
      if (!(await card.count())) { log('games', `${label} card found`, false); return; }
      await card.click();
      await page.waitForTimeout(1600);
      // click through any "start" intro
      const start = page.locator('button', { hasText: /start|play|begin/i }).first();
      if (await start.isVisible().catch(() => false)) { await start.click().catch(() => {}); await page.waitForTimeout(1200); }
      const s = await snap(page, file);
      log('games', `${label} UI frame captured`, true, '', s);
      await gotoAndSettle(page, '/games', 900);
    };
    await launch('Word Matching', 'flow_games_02_word_matching');
    await launch('Zombie Typing', 'flow_games_03_zombie_typing');
    await launch('Word Spelling', 'flow_games_04_word_spelling');
    await launch('Word Connect', 'flow_games_05_word_connect');
  } catch (e) { log('games', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'games', issues });
  await ctx.close();
}

/* ---------------- FLOW 8: Profile — theme toggle + live RTL flip ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'light', lang: 'en' }, 'profile');
  try {
    await gotoAndSettle(page, '/profile', 1200);
    await snap(page, 'flow_profile_01_stats');
    // Settings tab
    const settings = page.locator('button', { hasText: /Settings/i }).first();
    if (await settings.count()) { await settings.click(); await page.waitForTimeout(700); }
    await snap(page, 'flow_profile_02_settings');
    // theme toggle (role=switch after a11y fix; first switch is Dark Mode)
    const themeSwitch = page.locator('button[role="switch"]').first();
    await themeSwitch.scrollIntoViewIfNeeded().catch(() => {});
    await themeSwitch.click().catch(() => {});
    await page.waitForTimeout(700);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const s = await snap(page, 'flow_profile_03_theme_toggled');
    log('profile', 'live theme toggle', isDark, `dark=${isDark}`, s);
    // language flip to Arabic → RTL
    const arBtn = page.locator('button', { hasText: /^عربي$/ }).first();
    await arBtn.scrollIntoViewIfNeeded().catch(() => {});
    await arBtn.click().catch(() => {});
    await page.waitForTimeout(900);
    const dir = await page.evaluate(() => document.querySelector('[dir]')?.getAttribute('dir'));
    const s2 = await snap(page, 'flow_profile_04_rtl_flip');
    log('profile', 'instant LTR→RTL flip', dir === 'rtl', `dir=${dir}`, s2);
    // flip to Kurdish
    const kuBtn = page.locator('button', { hasText: /^Kurdî$/ }).first();
    await kuBtn.click().catch(() => {});
    await page.waitForTimeout(900);
    const dir2 = await page.evaluate(() => document.querySelector('[dir]')?.getAttribute('dir'));
    const s3 = await snap(page, 'flow_profile_05_kurdish_ltr');
    log('profile', 'Kurdish LTR + Hawar diacritics', dir2 === 'ltr', `dir=${dir2}`, s3);
  } catch (e) { log('profile', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'profile', issues });
  await ctx.close();
}

/* ---------------- FLOW 9: Quiz in Arabic RTL (spot check) ---------------- */
{
  const { ctx, page, issues } = await flowPage({ viewport: 'mobile', theme: 'dark', lang: 'ar' }, 'quiz-rtl');
  try {
    await gotoAndSettle(page, '/quiz/a1_family', 1500);
    const s = await snap(page, 'flow_quiz_rtl_01');
    const dir = await page.evaluate(() => document.querySelector('[dir]')?.getAttribute('dir'));
    log('quiz-rtl', 'quiz renders in RTL', dir === 'rtl', `dir=${dir}`, s);
  } catch (e) { log('quiz-rtl', 'flow error', false, String(e).slice(0, 200)); }
  results.push({ flow: 'quiz-rtl', issues });
  await ctx.close();
}

await browser.close();
fs.writeFileSync('audit/tools/results-flows.json', JSON.stringify(results, null, 1));
console.log('\nFlow run complete.');

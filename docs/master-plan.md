# kurdish-quest — Comprehensive Development Master Plan

> **Track A deliverable (Cycle 7).** This is a *roadmap*, not a to-do list. It is the
> decision artefact that will drive Cycles 8+. It was produced with maximum depth:
> a 48-route×language browser audit (WCAG AA contrast math, heading outlines,
> unlabeled-control detection, RTL checks, empty-state scans, 48 screenshots),
> exhaustive source reading, and library research with pinned npm versions+licenses.
>
> **Status after this cycle:** *(filled below by the agent at commit time)*
> - Branch: `ai/autonomous`, head `6ad358a` (C1–C6 committed).
> - Tools of Track A: ast-grep rules, puppeteer+chromium measure/audit harness,
>   repomix context packs — all working, all out of `package.json`.
> - Evidence artefacts: `audit/proof/ux-audit/` (48 screenshots),
>   `audit/proof/ux-audit-summary.json` (machine-readable metrics),
>   `measure-ui-proof/` (C6 regression screenshots).

---

## 0. Guiding principles (carried forward into every cycle)

1. **Stay in scope (Rule 17).** Anything discovered that is not in the current
   cycle goes into this plan, not the diff.
2. **Evidence before change (Rule 4).** Full suite (`npm test`, `npx tsc --noEmit`,
   `npm run lint:slop`, `npm run build`) before and after every app change.
3. **Branch discipline (Rule 13).** `git branch --show-current` must equal
   `ai/autonomous` before any commit; re-establish otherwise.
4. **Reset transparency (Rule 14).** Alert + recover + resume on any sandbox reset.
5. **The tracing constants stay named/tunable.** `COVERAGE_TOLERANCE_PX`,
   `BOUNDS_TOLERANCE_PX`, zone thresholds — never replace with magic numbers.
6. **Preserve verified work:** Latin letter grid on `/writing`; the fixed
   3-column grammar rows (TriRow); Warm Heritage design system + dark mode;
   SM-2 writing review path; back-from-trace returns to `/writing`; learning-hub
   sections; bottom-nav labels; lucide icons.

---

## A.1 — UI/UX Audit (deep, honest, measured)

**Method.** `audit/tools/ux-audit.mjs` (puppeteer-core + @sparticuz/chromium)
visited all 24 routes in `en` and `ar`, captured a full-page screenshot each, and
measured per page: heading outline, WCAG AA contrast of every text run (exact
relative-luminance math, large-text rule included), unlabeled interactive
controls, `<html dir>` vs language, empty-state keywords, and interactive-element
counts. Findings were then traced back to exact source lines. Full metric dump:
`audit/proof/ux-audit-summary.json`; screenshots under `audit/proof/ux-audit/`.

Severity scale: **High** (blocks learning / accessibility / first-run),
**Med** (measurably degrades experience), **Low** (polish).

| Route | Issue | Severity | Suggested fix | Evidence |
|---|---|---|---|---|
| ALL | Navigation uses `<button>` + router `navigate()`; there are **zero real `<a>` links** in the app. No long-press/middle-click/open-in-new-tab, no link semantics for screen readers | Med | Introduce an `<AppLink>` (renders `<a href>` + `<Link>`-style nav, matching NavIcon styling); swap in bottom nav + hub cards | grep `src` for `<a `: only lucide `Link` import found; `MainLayout.tsx:440-461` NavIcon = `<button onClick={()=>navigate(path)}>` |
| `/roadmap` | **✅ FIXED C7.5** — 11 unlabeled level-node buttons → 0 (added `aria-label` with level name + status). Remaining: accent-number + WORLD-brand contrast (white-on-gold gradient) failures | **High** | *(unlabeled done)*; recolor `#FF5722`/`#B8860B` small text and WORLD-brand `text-white`→`--kq-gold-on` to AA tokens | `audit/proof/ux-audit/roadmap-en.png`; contrast: `FF5722/white=3.16`, `#432C00`(gold-on)/gold≈6.4–8.3 |\n| `/roadmap` | 14 headings + stat cluster — high visual density for a first-time user | Low | Collapse stats behind one "My XP" tile; introduce the map with the existing Driver.js tour step | `roadmap-en.png`, headings extract |\n| `/profile` | **✅ FIXED C7.5** — amber pill `#B8860B`→`#8A6100` (3.02:1 → 5.15:1, app's `--kq-gold-text` token; 4 sites). Remaining 4 AA = unrelated gem `💎` icon 3.32:1 | **High**→**Low** | *(amber done)*; darken gem icon `#00B0FF`/sky→`sky-700` or add contrast ring | `Profile.tsx:235,326,430,513`; measured 3.02:1 → 5.15:1 |\n| `/leaderboard` | Rank badges + "Your Rank position:" white-on-light ~1:1 in one variant; 1 unlabeled search input (**✅ input fixed C7.5**) | **High**→**Med** | Ensure rank/world text sits on the dark rank-card surface (fix conditional class) | `leaderboard-en.png`; unlabeled 1→0; AA 4→3 |\n| `/grammar/:id` (all lessons) | **✅ FIXED C7.5** — primary/Next buttons `teal-600`→`teal-700/800` + white (3.74:1 → 5.47:1) across `ExerciseChrome`, `GrammarLesson`, `ArrangeSentenceExercise` | Med → done | *(done)*; `/grammar/cînavk` now 0 AA failures in the audit | measured 3.74:1 → 5.47:1; `GrammarLesson.tsx:198` etc. |\n| `/store` | Gem-price icon `#00B0FF` on white = **2.43:1** (decorative, but repeated) | Low | Darken to `#0284C7` (sky-600) or add contrast ring | `store-en.png`, measured 2.43:1 |
| `/search`, `/leaderboard` | Unlabeled text inputs (magnifier only, no `aria-label`) | Med | `aria-label` per language ("Search the dictionary" / "ابحث" / "Lêgerîn") | 1 unlabeled each, audit summary |
| `/games` | Several "Coming Soon" dead-ends (maintainer-gated) — clear lock ribbon exists, good; check no live-but-inert buttons remain | Low | Already fixed once (C3-era); keep as gated; verify ribbon non-interactive | `Games.tsx:584-651`; `games-en.png` |
| `/writing`, `/writing/words`, `/writing/sentences`, `/store` | Deliberate "Coming Soon" placeholder screens (flags) — not a bug, but a dead-end | Low | Flips in A.2/Cycles 10-11; ensure each placeholder offers a clear back path | `WRITING_WORDS_ENABLED=false` etc.; screenshots |
| ALL (RTL) | **RTL is handled well**: `getLayoutDirection` sets `dir`; arrows use `rtl:-scale-x-100`/`rotate-180`; Switch flips; 0 dir-mismatches across 24 routes | — (pass) | Keep the pattern; extend it to any new icon | audit: "dir mismatches: []"; `MainLayout.tsx:225,330`; `OnboardingFlow.tsx:157,242` |
| ALL (loading) | Lazy-route `Suspense→RouteFallback`, auth `loading` pulse, `NetworkStatusBadge` online/offline toasts — feedback coverage is good | — (pass) | No action | `App.tsx:102`, `MainLayout.tsx:229`, `NetworkStatusBadge.tsx` |
| ALL (empty states) | `/favorites` "No results", `/quiz` empty-review success state, NotFound — handled | — (pass) | No action | `Quiz.tsx:233-269`, `/favorites` audit |
| ALL (typography) | Consistent scale (Plus Jakarta + Fraunces display + Noto Kufi Arabic + JetBrains Mono). Kurdish Latin diacritics (ç ê î ş û) render via Noto/mono | — (pass) | No action | `index.css:1` font stack |
| ALL (micro-interactions) | motion layoutId nav spring, `active:scale-95` buttons, confetti, driver.js tours — tactile & smooth | — (pass) | Extend (not replace) when adding the tracing guide (Cycle 9) | `MainLayout.tsx:453+`, `Button.tsx` |

**Note on the "+14px title-vs-example" class of findings:** the grammar
title row intentionally uses larger type than example rows (verified in C3/C6);
that is design, not drift, and the measure tool already treats it correctly.

---

## A.2 — Feature Gap Analysis

Legend — **Value**: 1–5 to a learner. **Effort**: 1–5. **Status**: Missing /
Incomplete / Disabled (flag). Libraries verified via `npm view` (see §A.4).

| # | Feature | Status | Value | Effort | Dependencies | Suggested approach |
|---|---|---|---|---|---|---|
| G1 | **Tracing "pass" rigidity** (perfectly drawn letters still fail on tiny zones) | Incomplete (bug) | 5 | 2 | none | Fix validation (Deliverable B / Cycle 8). Keep coverage tolerance separate — do NOT just lower `ZONE_COVERAGE_MIN` |
| G2 | **Interactive stroke-order guide** (animated "watch how" before tracing) | Missing | 5 | 3 | none | Deliverable C / Cycle 9 — `tegaki` (MIT, 0.22.2) as primary; `letterpaths` (MIT, 1.0.2) as fallback geometry provider |
| G3 | **Word tracing** (whole words, letter-by-letter) | Disabled (`WRITING_WORDS_ENABLED=false`) — code complete | 4 | 1 | G1+G2 de-risk | Flip flag + regression; ship after the single-letter fix so the same validation is trusted |
| G4 | **Sentence tracing** | Disabled (`WRITING_SENTENCES_ENABLED=false`) — code complete | 4 | 1 | G3 | Flip flag + regression |
| G5 | **Quality TTS pronunciation** (hosted audio) | Disabled (`USE_CUSTOM_AUDIO_API=false`; falls back to `speechSynthesis` ku→tr chain) | 3 | 2 | hosting/billing choice | Re-enable hosted API path (`useAudio.ts`) or keep offline TTS and improve fallback voice selection |
| G6 | **Semantic navigation links** (see A.1, row 1) | Incomplete | 3 | 2 | none | `<AppLink>` component; swap in nav + cards |
| G7 | **Accessibility contrast + labels sweep** (A.1 rows 2–6) | Incomplete | 4 | 2 | none | Token fixes + `aria-label`s; verify with the audit harness rerun |
| G8 | **Smart "review due now" surface** (SM-2 deck exists; no proactive queue UI) | Incomplete | 4 | 3 | G1 | Surface `SpacedRepetitionService` due-count on Dashboard/Learning Hub with one-tap "Review" queue |
| G9 | **Adaptive content sequencing** (learning path exists; not adaptive to mistakes) | Missing | 4 | 4 | G8 | Tie wrong answers → targeted grammar/vocab review (uses existing `wrongAnswersHistory`) |
| G10 | **Real cloud sync** (Firebase config is a dev placeholder; SyncEngine exists) | Incomplete | 4 | 3 | Firebase project + rules | Wire `SyncEngine`/`OfflineStorageService` to Firestore auth'd user; keep offline-first as fallback |
| G11 | **Real leaderboard** (currently simulated local bots + optional Firebase) | Incomplete | 3 | 4 | G10 | Publish real entries via `CloudLeaderboard` once auth is real |
| G12 | **Push/study reminders** (ReminderService exists; in-app event only) | Incomplete | 3 | 3 | host/PWA | Web Push + backdrop fetch; PWA already builds (precache 59 entries) |
| G13 | **Store IAP** (gem packs "Coming Soon"; only Streak Freeze functional) | Disabled | 2 | 5 | platform review, payment provider | Defer — lowest value/effort ratio; keep free gem economy |
| G14 | **Adaptive blue-light / typography settings** (dyslexia-friendly font, line-height) | Missing | 2 | 2 | none | Optional settings tab; secondary |
| G15 | **AI tutor / conversation partner** (differentiator) | Missing | 5 | 5 | LLM API budget + privacy review + offline story | Bold option for later (see Cycle 16); must not phone home by default |
| G16 | **Kurdish cultural unlocks** (lore/folk-tale audio rewards per milestone) — *the bold, low-tech differentiator* | Missing | 5 | 3 | content authoring + audio reuse | Cycle 15 — see below |

---

## A.3 — Master Plan (Cycles 7.5–15)

Prioritisation factor = **value × urgency ÷ effort**. Chosen so the two required
fixes (B, C) land first, then the highest value/effort gaps, ending with the
bold differentiator. *(Updated per approval: C10+C12 merged; a11y hotfix pulled
earlier as C7.5; renumbered accordingly.)*

### Cycle 7.5 — Critical a11y hotfix (DONE — commit `bc14208→next`) · value 4 · urgency 5 · effort 1
- **Goal:** clear the three worst, lowest-effort accessibility findings before anything else.
- **Deliverables:** (1) roadmap level-node buttons get `aria-label` (11→0 unlabeled); (2) Profile light-mode amber `#B8860B` → accessible `#8A6100` (3.02:1 → 5.15:1, the app's own `--kq-gold-text` token); (3) Grammar primary/check buttons `teal-600` → `teal-700/800` (3.74:1 → 5.47:1); Leaderboard search input `aria-label`.
- **Verification:** `ux-audit.mjs` (harness itself fixed to parse Tailwind v4 `oklch()` + gradients) — `/grammar/cînavk` 1→0 AA, roadmap unlabeled 11→0, profile 8→4 (remaining 4 = unrelated gem `💎` icon), leaderboard unlabeled 1→0; full gates green (tsc 0 / lint:slop 0 / 218 tests).
- **Risk:** Low. **Token cost:** ~40–80k.

### Cycle 8 — Fix the tracing "pass" bug (Deliverable B) · value 5 · urgency 5 · effort 2 → **first**
- **Goal:** a correct *human-like* trace passes at tolerance 4, while a genuinely incomplete letter (e.g. E without the middle bar) still fails.
- **Deliverables:** precise diagnosis via a realistic-trace harness; chosen zone-validation fix (adaptive tiny-zone threshold / zone merge / weighted-average — evidence decides, likely **Option 1 + Option 3 hybrid**: tiny-zone floor 25% and a zone-total guard); no change to `COVERAGE_TOLERANCE_PX` (4) or `BOUNDS_TOLERANCE_PX`.
- **Verification:** new vitest cases + browser `runTraceSelfTest` green; a simulated incomplete "E" still fails; full suite 218+ green; `selftest-tolerance.mjs` exit 0.
- **Risk:** Medium (touch sensitive validator). **Token cost:** ~60–120k.

### Cycle 9 — Interactive tracing guide (Deliverable C) · value 5 · urgency 4 · effort 3
- **Goal:** on `/writing/:letter`, an on-demand animated stroke-by-stroke demo ("Show me how"), localized + replayable, with zero regression to tracing.
- **Deliverables:** preferred `tegaki` renderer (custom-font bundle matching the tracing font) or `letterpaths`-driven SVG-path animator as fallback; "Watch how" button; current-stroke highlight + dim rest; replay; optional step mode; KU/AR/EN labels; touch-friendly.
- **Verification:** `/writing/e` shows the control; animation plays A–Z incl. ç ê î ş û; replay works; existing trace + gates green; browser proof screenshots.
- **Risk:** Medium (new dependency; bundle size — `tegaki` tarball is 44.6 MB unpacked, use only the needed font bundle). **Token cost:** ~120–200k.

### Cycle 10 — Enable word + sentence tracing (merged G3+G4) · value 4 · effort 1
- **Goal:** turn on both already-code-complete tracing modes now that the validator is trusted and the single-letter guide lands first as a model.
- **Deliverables:** flip `WRITING_WORDS_ENABLED` and `WRITING_SENTENCES_ENABLED`; verify word + sentence canvases and zone logic; regression.
- **Verification:** `/writing/words` grid → word trace passes; `/writing/sentences` → sentence trace passes; full gates green; `measure-ui.mjs` + screenshots.
- **Risk:** Low. **Token cost:** ~40–80k.

### Cycle 11 — Accessibility sweep (remaining A.1 findings) (G6+G7) · value 4 · effort 2
- **Goal:** eliminate the remaining High/Med findings the C7.5 hotfix did not cover.
- **Deliverables:** `<AppLink>` semantic nav (app has zero `<a>` links — a full-screen-reader gap); remaining contrast tokens now that the audit harness is precise (roadmap WORLD-brand/gold-on; `/games` "NEW"/"Coming Soon" badges 2.1–2.8:1; store gem `#00B0FF` 2.43:1; teal/gold text-on-wash accents); any leftover input labels.
- **Verification:** rerun `ux-audit.mjs` — High/Med contrast failures cleared; full suite green.
- **Risk:** Low-Med. **Token cost:** ~60–140k.

### Cycle 12 — TTS quality (G5) · value 3 · effort 2
- **Goal:** improve pronunciation audio quality/consistency across the app.
- **Deliverables:** re-enable hosted TTS path (`USE_CUSTOM_AUDIO_API`) or harden the `speechSynthesis` ku→tr fallback chain + voice prewarm; verify KRD-ish phonemes across browsers.
- **Verification:** audio buttons render + speech fires per browser; gates green.
- **Risk:** Medium (cross-browser speech). **Token cost:** ~40–80k.

### Cycle 13 — "Due now" smart review surface (G8) · value 4 · effort 3
- **Goal:** make SM-2 the heartbeat of the dashboard, not a background mechanic.
- **Deliverables:** due-review count + one-tap queue on Dashboard/Learning Hub, feeding the existing quiz/review path.
- **Verification:** seeded deck shows correct due count and routes into review; unit tests; screenshot.
- **Risk:** Low-Med. **Token cost:** ~60–120k.

### Cycle 14 — Real cloud sync (G10) · value 4 · effort 3
- **Goal:** learner progress survives device changes and resets.
- **Deliverables:** connect `SyncEngine` to Firestore for authed users; offline-first remains the fallback; conflict policy (last-write-wins on `updatedAt`).
- **Verification:** sync round-trip test (browser A → Firestore → browser B); offline still works; gates green.
- **Risk:** Medium (external service). **Token cost:** ~80–140k.

### Cycle 15 — Bold differentiator: Kurdish cultural unlocks (G16) · value 5 · effort 3
- **Goal:** reward milestones with authentic cultural content instead of only badges — differentiated, on-brand with the Warm Heritage design system, and technically low-risk.
- **Deliverables:** a "Çîrok / Folklore" unlock track — short illustrated Kurmanji folk-tale/idiom cards with audio, unlocked by XP/streak/writing milestones; reuse existing `AudioButton` + content pipeline.
- **Verification:** unlock flow end-to-end in browser; content renders RTL-correct for ar; gates green; screenshots.
- **Risk:** Low-Med. **Token cost:** ~100–160k.
- **⚠ Pending (Adjustment 3, acknowledged):** a ~200-word "Kurdish cultural unlocks"
  brief must be posted **before C15 begins** — concretely expanding what a
  "Çîrok unlock track" means (content types, sources, licensing, unlock rules,
  and where it lives in the nav). This is a hard prerequisite, noted here in the
  plan and deferred until the cycle that precedes C15.

### Cycle 16 — AI tutor (G15) — *flagged, NOT in the active 10-cycle sequence*
- **Goal:** (proposal only) an optional, opt-in retrieval/LLM "Ziman helper" for explanations + Socratic practice, with strict offline-by-default and no data leaving the device unless enabled.
- **Deliverables:** (future) privacy-first prompt flow, fallback to rule-based hints when offline.
- **Verification:** TBD at approval time.
- **Risk:** High (cost/privacy). **Token cost:** 150k+.

> **Cycle 7 (this one) is the Master Plan itself; Cycle 7.5 is the a11y hotfix**
> (both committed). C1–C6 (Track A tool setup) are already committed. The
> sequence above is intentionally **hotfix → B → C → unlocks of your own code**
> before any new external dependency, so value lands early and risk stays near
> zero while the sandbox environment remains reset-prone.

---

## A.4 — Library citations (Rule 16), verified via `npm view` (pinned)

| Library | `npm view` output (authoritative) | License | Role |
|---|---|---|---|
| `tegaki` | version **0.22.2**; license **MIT**; repo `github.com/gkurt/tegaki`; unpacked **44.6 MB** | MIT | Deliverable C primary — React `TegakiRenderer` / vanilla `TegakiEngine`; animate any font stroke-by-stroke. README (fetched): `https://raw.githubusercontent.com/gkurt/tegaki/main/README.md` |
| `letterpaths` | version **1.0.2**; license **MIT**; unpacked **2.8 MB** | MIT | Deliverable C fallback/geometry — `buildHandwritingPath()`, print/pre-cursive/cursive, cubic-Bezier strokes + tracing API. Repo: `github.com/RobinL/letterpaths` |
| `hanzi-writer` | version **3.7.3**; license **MIT**; repo `github.com/chanind/hanzi-writer` | MIT | API design reference only (stroke animation + quiz + `leniency`/`showHintAfterMisses` knobs) — not a runtime dep (Chinese char data) |
| `@k1low/kakitori` | version **0.21.0**; license **MIT**; repo `github.com/k1LoW/kakitori` | MIT | Architectural reference only — per-stroke checking + composable blocks + step mode |
| `puppeteer-core` | version 25.12.0; Apache-2.0 (already in harness, `--no-save`) | Apache-2.0 | Brand/scaffold candidates for later cycles |
| `@sparticuz/chromium` | version 153.0.0; MIT (already in harness, `--no-save`) | MIT | Brand/scaffold candidates for later cycles |

**Decision recorded for Cycle 9:** prefer `tegaki` (built exactly for "font →
animated handwriting", zero manual paths); fall back to `letterpaths` if a
Kurdish-diacritic/custom-font edge appears; study `hanzi-writer`+`kakitori` for
the *interaction* model (stroke highlight, step mode, hint-after-misses) but do
not import them (wrong script + heavy data).

---

## A.5 — Repositories & evidence index (paths)

- **Audit tooling:** `audit/tools/ux-audit.mjs` (new, C7), `measure-ui.mjs`,
  `selftest-tolerance.mjs`, `writing-health.mjs`.
- **Audit evidence:** `audit/proof/ux-audit/` (48 screenshots),
  `audit/proof/ux-audit-summary.json` (metrics), `measure-ui-proof/` (C6 shots).
- **Guards:** `audit/ast-grep/` (3 rules, `sg test` green).
- **Context packs:** `repomix-src.md` etc. (gitignored; `repomix-*.md`).
- **Docs:** `docs/agent-setup.md` (re-establish), this file.

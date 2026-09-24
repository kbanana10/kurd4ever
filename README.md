# 🏆 Kurdish Quest — Learn Kurmanji

An enterprise-grade, mobile-first, offline-resilient language-learning app for **Kurmanji Kurdish** (Hawar script). Localized natively in **Kurmanji Kurdish (ku), English (en) and Arabic (ar)** with fluid bidirectional LTR/RTL layout. Kurdish Quest pairs a gamified curriculum with an adaptive quiz engine (SM-2 spaced repetition), a content-hashed pronunciation-audio pipeline, arcade learning games, and offline-first progress sync.

---

## Table of Contents

1. [What this is](#1-what-this-is)
2. [Technology Stack](#2-technology-stack)
3. [Getting Started](#3-getting-started)
4. [Project Layout](#4-project-layout)
5. [Architecture](#5-architecture)
6. [Features in Detail](#6-features-in-detail)
7. [Environment Variables](#7-environment-variables)
8. [Data & Firebase](#8-data--firebase)
9. [Quality Tooling](#9-quality-tooling)
10. [Known Gaps](#10-known-gaps)

---

## 1. What this is

Kurmanji Kurdish is spoken by millions, yet accessible, high-quality interactive learning tools are scarce. Kurdish Quest fills that gap with a gamified platform modeled after leading language apps, built specifically for Kurmanji Kurdish in the Hawar alphabet.

- **Tri-lingual & bi-directional**: English, Arabic and native Kurdish UI with automatic RTL/LTR switching.
- **Hawar mastery**: teaches the 31-letter Hawar alphabet, phonetics and grammar, with native pronunciation audio.
- **Offline-first**: local persistence (IndexedDB/localStorage) with an auto-syncing cloud engine.
- **Cross-platform**: ships as a PWA, a web app, and a native **Android** app via Capacitor.

---

## 2. Technology Stack

| Area | Technology |
| :--- | :--- |
| UI framework | React 19, TypeScript (strict) |
| Build tool | Vite 6 + `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router v7 |
| Animation | `motion` v12 (Framer Motion) |
| State | `zustand` (monetization/ad store) + React Context (`src/store/AuthContext.tsx`) |
| Icons | `lucide-react` |
| Backend / dev server | Express 4 wrapping Vite (`server.ts`) |
| Cloud (optional) | Firebase Auth (Google) + Firestore |
| Native shell | Capacitor 8 |
| PWA | `vite-plugin-pwa` (VitePluginPWA) |
| Testing | Vitest 4 + Testing Library + jsdom |
| Storybook | Storybook 10 (React + Vite) |
| Linting | TypeScript `--noEmit`, ESLint + vendored `anti-slop` rules, `knip` dead-code |

---

## 3. Getting Started

**Prerequisites**: Node.js **>= 20 and < 21** (see the `engines` field in `package.json`). The code is ESM (`"type": "module"`).

```bash
git clone https://github.com/kbanana10/kurd4ever.git
cd kurd4ever

# Install dependencies
npm ci          # clean, lockfile-exact install (recommended)
# or
npm install

# Optional: copy env template (see §7 — the app runs fully offline without it)
cp .env.example .env

# Start the dev server (Express + Vite middleware, hot reload)
npm run dev     # → http://localhost:3000
```

### Useful scripts

| Script | What it does |
| :--- | :--- |
| `npm run dev` / `npm start` | Start the dev server (`tsx server.ts`) |
| `npm run build` | Production build (`vite build` → `dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run lint:slop` | ESLint anti-slop rules, zero-warning gate |
| `npm run lint:knip` | Dead-code / unused export audit |
| `npm test` | Vitest suite (`audit/vitest.config.ts`) |
| `npm run storybook` | Storybook UI dev server (port 6006) |
| `npm run build-storybook` | Static Storybook build |
| `npm run generate-audio` | Batch-generate lesson audio via external TTS |

> **Note**: `node_modules/`, `dist/`, `storybook-static/`, `android/build` and `.env*` are git-ignored.

---

## 4. Project Layout

```text
/ (repo root)
├── .env.example              → Environment template (GitHub-copied; .env is ignored)
├── .nvmrc                    → Node major version (20)
├── capacitor.config.ts       → Capacitor app config (com.kurdishquest.app)
├── firebase-applet-config.json → DEV placeholder Firebase config (real config comes from env)
├── firebase-blueprint.json   → Firestore schema blueprint (users/{userId})
├── firestore.rules           → Firestore security rules
├── index.html                → SPA HTML entry
├── metadata.json             → Applet metadata (name / capabilities)
├── server.ts                 → Express dev/prod server: static audio, SPA serving, security headers
├── vite.config.ts            → Vite + Tailwind + PWA + manual chunk splitting
├── package.json / package-lock.json / bun.lock
│
├── android/                  → Capacitor-generated Android Studio project
├── public/                   → Static assets
│   └── audio/feedback/       → correct / wrong / complete sound effects
├── scripts/                  → generateAudio.ts, replace_wav.ts, ux_agent.py (LLM UX explorer)
├── services/tts/             → TTS provider interface + KurdishTTSProvider
├── app/applet/               → Content-maintenance helpers (emoji/icon indexing)
├── tools/oxlint/anti-slop/   → Vendored anti-slop lint plugin (+ its own tests)
│
├── audit/                    → OH&QA test harness (14 test files, ~170 tests)
│   ├── tools/qa-lib.mjs      → Shared Playwright QA library
│   ├── tools/matrix-sweep.mjs→ Route × viewport × theme × lang screenshot sweep
│   ├── tools/flows.mjs       → End-to-end user-flow checks
│   ├── tools/design-shots.mjs→ Design regression screenshots
│   └── tools/results-*.json  → Checked-in results from past runs
│
└── src/                      → Application source
    ├── main.tsx              → React root + PWA service-worker registration
    ├── App.tsx               → Router + lazy-loaded routes + ErrorBoundaries
    ├── index.css             → Tailwind entry + Warm Heritage design system tokens
    ├── components/           → MainLayout (shell), ErrorBoundary, RouteFallback,
    │   │                       OnboardingFlow, NetworkStatusBadge, games/, ui/ (primitives)
    ├── constants/appConstants.ts → Avatars, regions, XP/level thresholds
    ├── data/                 → Curriculum: kurmanji.ts, academic.ts, learningPath.ts,
    │   │                       normalized/ (dialogues, vocabularyLemmas), schemas/
    ├── features/
    │   ├── audio/            → useAudio hook + AudioButton (TTS player)
    │   ├── monetization/     → Ad simulator + gems store (Zustand)
    │   ├── quiz/             → types, useQuizEngine, questionGenerator, 4 question components
    │   └── tour/             → Driver.js onboarding tour (tours.ts, useAppTour.ts)
    ├── hooks/                → useFavorites (+ legacy re-export of useAudio)
    ├── lib/                  → firebase.ts, navigation.ts, translations re-exports
    ├── localization/translations.ts → en/ku/ar UI strings (the canonical dictionary)
    ├── models/               → user.ts (User, UserData), word.ts
    ├── pages/                → 18 routed views (Dashboard, Roadmap, Alphabet, Quiz, …)
    ├── services/             → Gamification, SRS, SyncEngine, OfflineStorage, Missions,
    │   │                       Leaderboard, CloudLeaderboard, Reminder, Telemetry
    ├── store/AuthContext.tsx → Core session/profile state + theme/language + sync orchestration
    └── utils/cn.ts           → className merger (clsx + tailwind-merge)
```

---

## 5. Architecture

Kurdish Quest is a **mobile-first client-side SPA** with an Express proxy and optional Firebase cloud sync.

```
             ┌─────────────────────────────────────────────┐
             │          React 19 SPA (Vite dev / build)    │
             └───────────────┬──────────────┬──────────────┘
                             │              │
        Local-first state    │              │   Cloud sync (when configured)
           + persistence     │              │
                             ▼              ▼
             ┌────────────────────┐   ┌─────────────────────┐
             │ localStorage /     │   │ Firebase Firestore  │
             │ IndexedDB          │   │ + Google Auth       │
             │ (OfflineStorageService)│ └─────────────────────┘
             └────────────────────┘             ▲
                                                │ SyncEngine merge (additive)
             ┌────────────────────────────────────┐
             │  Express server (server.ts)        │
             │  static /audio · SPA fallback      │
             │  security headers (CSP, X-Frame… ) │
             └────────────────────────────────────┘
```

### State model

`src/store/AuthContext.tsx` is the single source of truth for session + profile. It:

1. Hydrates `user` / `userData` from localStorage immediately (fast first paint).
2. Listens to `onAuthStateChanged`; for signed-in users it pulls Firestore and **additively merges** via `SyncEngine.mergeUserDataAdditive` so no progress is lost to a stale local/cloud side.
3. Persists every write locally first, then writes through to Firestore — queuing mutations (`OfflineStorageService.enqueueMutation`) when offline.
4. Writes progress through a `userDataRef` (not the render closure) so back-to-back updates (quiz XP + lesson completion) **compose** instead of clobbering each other (a previous lost-update bug).

### Gamification (`services/GamificationService.ts`)

- **XP → level** is an exponential curve (`calculateLevelFromXP`); 100 XP ≈ 1 level early on.
- **Streak** is UTC-date aware with streak-freeze shields (`checkAndUpdateStreak`).
- **Gems** are granted only via explicit awards (quiz perfect scores, level-ups, mission claims) — the old "auto-mint gems on every event" behavior was removed.
- **Badges** are computed from thresholds (XP, words learned, streak, quizzes, lessons).

### Spaced repetition (`services/SpacedRepetitionService.ts`)

An SM-2 derivative maintains a `reviewDeck` per user, adjusting each item's ease/interval from answer correctness; quiz flows surface `srs_review` and `review_mistakes` modules.

---

## 6. Features in Detail

| Feature | Location | Notes |
| :--- | :--- | :--- |
| **Hawar Alphabet** | `src/pages/Alphabet.tsx` | 31 letters, phonetic guide, per-letter audio |
| **Vocabulary** | `src/pages/VocabularyCategories.tsx`, `VocabularyList.tsx` | Categorized by theme (numbers, colors, animals, food, family, home, time, …) |
| **Quiz engine** | `src/features/quiz/` | Modes: multiple-choice, emoji-match, listening, write-Kurdish, adaptive, mixed challenge, SRS review, mistakes review |
| **Question types** | `types.ts` | `multiple_choice`, `true_false`, `emoji`, `listen`, `scrambled_letters`, `sentence_reorder`, `fill_blank`, `translate` |
| **Spaced repetition** | `SpacedRepetitionService.ts` | SM-2 derivative review deck |
| **Arcade games** | `src/pages/Games.tsx` + `components/games/` | Scramble, Memory Match, Zombie Typing, Word Connect |
| **Daily goal + missions** | `Dashboard.tsx`, `MissionsService.ts` | UTC-day XP goal modal, daily missions, streaks |
| **Guided tour** | `src/features/tour/` | Driver.js onboarding tour (replayable from Profile) |
| **Search** | `src/pages/Search.tsx` | Multilingual (en/ku/ar) dictionary search |
| **Store + ads** | `src/pages/Store.tsx`, `features/monetization/` | Gem currency, simulated interstitial/rewarded ads |
| **Reminders** | `ReminderService.ts` | In-app practice reminders (Web Notifications API) |
| **Leaderboard** | `pages/LeaderboardPage.tsx`, `CloudLeaderboard.ts`, `LeaderboardService.ts` | Optional Firebase-backed ranking |
| **Offline sync** | `SyncEngine.ts`, `OfflineStorageService.ts` | Merge + queue when offline |

---

## 7. Environment Variables

Copy `.env.example` to `.env` (git-ignored). **Every feature works offline without any env vars** — the variables below enable optional integrations.

| Variable | Purpose |
| :--- | :--- |
| `APP_URL` | Public origin (default `http://localhost:3000`) |
| `GEMINI_API_KEY` | Gemini AI key (injected into the client bundle via `vite.config.ts` — see the warning in `.env.example`) |
| `TTS_PROVIDER` | `google` (default) or `kurdishtts` |
| `KURDISHTTS_API_KEY` / `KURDISHTTS_MODEL_VERSION` / `KURDISHTTS_SPEAKER_ID` | KurdishTTS provider config |
| `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_APP_ID` | Real Firebase project (all four required to enable cloud features) |
| `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_MEASUREMENT_ID` / `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Optional Firebase fields |
| `PORT` | Server port (default 3000) |
| `DISABLE_HMR` | Set `true` to disable Vite HMR (used in some hosted sandboxes) |

### How Firebase activation works

`src/lib/firebase.ts` reads `VITE_FIREBASE_*` at build time. When **all four core values** are set, `isFirebaseConfigured === true` and the app shows Google sign-in and sync affordances. Otherwise the committed dev placeholder (`firebase-applet-config.json`) keeps the SDK bootable but the app treats cloud as **not configured** and hides those features — so users are never offered an auth flow that can't succeed.

Firebase web config values are **not secrets** (they ship in every client bundle by design); data protection is enforced by `firestore.rules`. Keep real project values out of Git by injecting them via deployment env.

---

## 8. Data & Firebase

### Firestore collections

| Path | Schema | Rules |
| :--- | :--- | :--- |
| `users/{userId}` | `UserProfile` (see `firebase-blueprint.json` / `src/models/user.ts`) | owner-only read/write; XP must only increase (`update` rule) |
| `leaderboard/{userId}` | one entry per user (name, avatar, xp) | readable by any signed-in user; writable only by owner; published `xp` must equal the owner's profile `xp` |

### Security rules (`firestore.rules`)

Default-deny, owner-scoped writes, ID validation, profile-shape validation, and an **anti-tamper rule**: a client may never lower its own `xp` and it is bounded to `<= 10,000,000`. Full anti-cheat would require server-authored writes (Cloud Functions) — a documented limitation.

### Content data (`src/data/`)

- `kurmanji.ts` — core vocabulary (with emoji + audio paths) and alphabet letters.
- `academic.ts` — academic vocabulary / dialogues.
- `learningPath.ts` — CEFR roadmap modules/units/lessons (A1 → B2 → Advanced).
- `normalized/` — canonical lemma + dialogue datasets.
- `json/contentManifest.json` — content manifest (locale/version metadata).

---

## 9. Quality Tooling

### Test suite (`npm test`)

The audit harness (`audit/`) runs with **Vitest + jsdom**. Vitest config is `audit/vitest.config.ts`. Test files cover:

- `audio.test.ts`, `srs.test.ts`, `quiz-engine.test.ts`, `quiz-modes.test.tsx`, `quiz-progression.test.tsx` — engine correctness
- `deep.test.tsx`, `interact.test.tsx`, `games-progression.test.tsx` — component/user-interaction rendering
- `regression.test.ts`, `logic.test.ts`, `missions.test.ts`, `perf.test.tsx`, `smoke.test.tsx`, `tour.test.ts`

Tests mock browser-only seams (Firebase SDK, audio) at the module boundary — see `audit/setup.ts` and the per-file `vi.mock` blocks.

### Browser QA tooling (`audit/tools/*.mjs`)

Playwright-based scripts that run against the local dev server and check for horizontal scroll, tiny tap targets, clipped text, console errors and failed requests across a **route × viewport × theme × language matrix**. Checked-in `results-*.json` files record the last run.

- `matrix-sweep.mjs` — screenshot sweep
- `flows.mjs` — onboarding / dashboard end-to-end flows
- `design-shots.mjs` — design regression
- `qa-lib.mjs` — shared help

### Linting

- `npm run lint` — strict `tsc --noEmit`
- `npm run lint:slop` — ESLint with the **vendored anti-slop plugin** (`tools/oxlint/anti-slop/`), a set of anti-"type slop" rules enforced as errors with a few documented, deliberate project divergences
- `npm run lint:knip` — dead-code/unused-export audit (`knip.json`)

CI (`.github/workflows/ci.yml`) runs: install → `npm audit --omit=dev` → type-check/lint → anti-slop → knip → tests → production build → Storybook build, on Node 20.

---

## 10. Known Gaps

Documented as TODOs in code (e.g. `TODO-002`, `TODO-003`) — this section is kept in sync with the code, and any new gap found during reviews should be added here.

- **Cloud is optional by design** (`TODO-002`, `src/lib/firebase.ts`): until a real Firebase project is injected via `VITE_FIREBASE_*`, Google sign-in and cloud sync are hidden. The committed `firebase-applet-config.json` is a scratch-project placeholder.
- **Anti-cheat is client-side** (`TODO-003`, `firestore.rules`): the XP-monotonic rule helps, but authoritative scoring would need Cloud Functions.
- **Pronunciation audio** is generated on demand (`npm run generate-audio`) and most of it is **not committed** — only the three feedback sounds ship. Audio URLs follow `/audio/…` and return JSON 404s when missing.
- **`services/` vs `lib/` naming**: `src/lib/` currently holds thin re-export shims (e.g. `src/lib/AuthContext.ts → src/store/AuthContext`) for backward compatibility; the canonical modules live in `src/store/`, `src/services/` and `src/localization/`.
- **`README` version skew**: this file is the source of truth and is updated as the tree changes; older assumptions (e.g. a `docs/` folder, `grammar` / `Admin` pages) do **not** exist in the current tree.

---

*Developed with ❤️ for Kurdish language preservation and education.*

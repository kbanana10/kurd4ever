# 🏆 Kurdish Quest (Kurmanji Quester)

An enterprise-grade, mobile-first, and offline-resilient language learning application designed to teach **Kurmanji Kurdish** (Hawar script). Localized natively in **Kurmanji Kurdish, English, and Arabic** with fluid bidirectional layout support (LTR & RTL), Kurdish Quest delivers a gamified curriculum complete with interactive lessons, an adaptive quiz engine with SM-2 Spaced Repetition (SRS), a content-hashed pronunciation audio pipeline, arcade learning games, and offline-resilient progress synchronization across devices.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Complete Project Structure](#3-complete-project-structure)
4. [Architecture Explanation](#4-architecture-explanation)
5. [Features Documentation](#5-features-documentation)
6. [Installation & Setup](#6-installation--setup)
7. [Development Guide](#7-development-guide)
8. [Database Documentation](#8-database-documentation)
9. [UI/UX Documentation](#9-uiux-documentation)
10. [Future Improvements](#10-future-improvements)

---

## 1. Project Overview

### Purpose & Vision
Kurmanji Kurdish is spoken by millions across the globe, yet accessible, high-quality, interactive digital learning tools remain scarce. **Kurdish Quest** bridges this gap by providing a modern, gamified learning platform modeled after leading global language platforms, customized specifically for Kurmanji Kurdish in the Hawar alphabet.

### Key Objectives & Problems Solved
- **Bi-Directional Localization**: Fully localized in English and Arabic to serve learners from both Western and Middle Eastern backgrounds, with automatic right-to-left (RTL) and left-to-right (LTR) layout switching.
- **Hawar Script Mastery**: Teaches standard Kurmanji Kurdish orthography (Hawar Latin alphabet), phonetics, and grammar structures.
- **Offline-First Accessibility**: Operates seamlessly in low-connectivity or offline environments using client-side caching and an auto-synchronizing cloud engine.
- **Cross-Platform Native Availability**: Runs as a progressive web application (PWA), a full-stack web application, and a native Android `.apk` app powered by CapacitorJS.

---

## 2. Technology Stack

### Frontend Architecture
| Technology | Version | Role & Purpose |
| :--- | :--- | :--- |
| **React** | `^19.0.1` | Declarative UI framework for building component-driven views. |
| **TypeScript** | `~5.8.2` | Type-safe programming language ensuring strict interface compliance. |
| **Vite** | `^6.2.3` | Next-generation frontend build tool and dev server. |
| **Tailwind CSS** | `^4.1.14` | Utility-first CSS framework for mobile-first responsive styling. |
| **React Router** | `^7.14.2` | Client-side route management and code-split layout rendering. |
| **Framer Motion** | `^12.23.24` | Production-grade motion library for fluid UI animations and micro-interactions. |
| **Zustand** | `^5.0.12` | Lightweight state management for monetization and app state. |
| **Lucide React** | `^0.546.0` | Accessible vector icon library. |
| **React Confetti** | `^6.4.0` | Micro-animation library for celebration effects upon quiz and game completions. |

### Backend & Cloud Services
| Technology | Version | Role & Purpose |
| :--- | :--- | :--- |
| **Express.js** | `^4.21.2` | Node.js web server handling audio asset delivery, rate limiting, and security proxying. |
| **Firebase Firestore** | `^12.13.0` | Cloud NoSQL database storing user profiles, progress, streaks, and game scores. |
| **Firebase Auth** | `^12.13.0` | Google authentication provider for cloud sync across devices. |
| **express-rate-limit** | `^8.5.1` | Rate-limiting middleware for securing backend API endpoints. |

### Mobile Native & Deployment
| Technology | Version | Role & Purpose |
| :--- | :--- | :--- |
| **CapacitorJS** | `^8.3.4` | Native bridge wrapping the web bundle into a native Android runtime. |
| **Vite PWA** | `^1.3.0` | Service worker generator for offline caching and PWA installation. |
| **Vitest** | `latest` | Fast unit, component, performance, and regression test runner. |

---

## 3. Complete Project Structure

```text
/ (Project Root)
├── .env.example                      → Environment configuration template
├── .gitignore                        → Excluded paths for git version control
├── AUDIT_REPORT.md                   → Codebase security, performance, and audit report
├── README.md                         → Main project documentation
├── capacitor.config.ts               → Native mobile configuration for CapacitorJS
├── firebase-applet-config.json       → Client-side Firebase credentials
├── firebase-blueprint.json           → Database schema blueprint definition
├── firestore.rules                   → Production security rules for Firestore
├── index.html                        → SPA HTML entry template
├── metadata.json                     → Applet metadata and permissions
├── package.json                      → Project dependencies and build scripts
├── server.ts                         → Node.js Express server entry point
├── tsconfig.json                     → TypeScript compiler configuration
├── vite.config.ts                    → Vite build, PWA manifest, and bundle splitting config
│
├── android/                          → Native Android Studio Project
│   ├── app/                          → Android app module, manifests, and build configs
│   ├── build.gradle                  → Root Gradle build configuration
│   └── variables.gradle              → Android SDK and plugin version variables
│
├── audit/                            → Automated Quality & Regression Test Suite
│   ├── audio.test.ts                 → Audio engine unit tests
│   ├── deep.test.tsx                 → Deep component rendering tests
│   ├── interact.test.tsx             → User interaction simulation tests
│   ├── logic.test.ts                 → Core business logic tests
│   ├── perf.test.tsx                 → Performance benchmark tests
│   ├── regression.test.ts            → Bug regression test coverage
│   ├── srs.test.ts                   → Spaced repetition algorithm tests
│   ├── vitest.config.ts              → Vitest execution configuration
│   └── setup.ts                      → Test environment setup file
│
├── docs/                             → Developer & Architecture Documentation Hub
│   ├── ANDROID_BUILD.md              → Native Android compilation guide
│   ├── ARCHITECTURE.md               → Architectural design map and system layout
│   ├── AUDIO_SYSTEM.md               → Pronunciation audio engine specifications
│   ├── COMPONENTS.md                 → Reusable component registry & design tokens
│   ├── CONTENT_GUIDE.md              → Curriculum schema & content editing manual
│   ├── FUTURE_ROADMAP.md             → Development expansion roadmap
│   ├── GAMIFICATION.md               → XP formulas, streak rules, and leveling math
│   ├── LOCALIZATION.md               → RTL/LTR and translation dictionary specifications
│   ├── QUIZ_ENGINE.md                → Dynamic question generation mechanics
│   └── UI_UX_SPECIFICATION.md        → Visual design tokens and layout rules
│
├── public/                           → Static Public Assets
│   ├── audio/                        → Generated MP3/WAV pronunciation audio files
│   ├── favicon.png                   → Application favicon
│   ├── pwa-192x192.png               → PWA icon (192px)
│   └── pwa-512x512.png               → PWA icon (512px)
│
├── scripts/                          → Automation & Asset Generation Scripts
│   ├── generateAudio.ts              → Script to synthesize lesson audio assets
│   └── replace_wav.ts                → Utility script for converting WAV to MP3 format
│
└── src/                              → Application Source Code
    ├── App.tsx                       → Main application router and context providers
    ├── main.tsx                      → DOM entry point mounting React root
    ├── index.css                     → Global CSS with Tailwind setup
    ├── vite-env.d.ts                 → TypeScript global Vite environment definitions
    │
    ├── components/                   → Reusable UI Components
    │   ├── AudioButton.tsx           → Audio playback trigger component with loading state
    │   ├── DailyGoalTracker.tsx      → Daily progress modal tracking XP goals
    │   ├── ErrorBoundary.tsx         → React error boundary catching runtime crashes
    │   ├── Leaderboard.tsx           → Embedded top users ranking widget
    │   ├── MainLayout.tsx            → Application navigation shell (Header & Bottom Bar)
    │   ├── NetworkStatusBadge.tsx    → Offline/online connectivity indicator badge
    │   ├── OnboardingFlow.tsx        → First-time user setup modal
    │   ├── RouteFallback.tsx         → Loading spinner fallback for lazy routes
    │   ├── games/                    → Interactive Arcade Game Components
    │   │   ├── WordConnectGame.tsx   → Letter connection spelling puzzle
    │   │   ├── WordMatchingGame.tsx  → Flip card memory matching game
    │   │   └── ZombieTypingGame.tsx  → Speed typing arcade defense game
    │   └── ui/                       → Design System Primitive Components
    │       ├── Badge.tsx             → Custom status badge primitive
    │       ├── Button.tsx            → Standard button primitive
    │       ├── Card.tsx              → Container card primitive
    │       ├── EmptyState.tsx        → Placeholder view for empty collections
    │       ├── Modal.tsx             → Reusable dialog modal primitive
    │       ├── Progress.tsx          → Animated progress bar primitive
    │       ├── StatPill.tsx          → Gamification stat pill primitive
    │       └── index.ts              → UI primitives barrel export
    │
    ├── constants/                    → System-Wide Constants
    │   └── appConstants.ts           → Level thresholds, default XP rewards, and settings
    │
    ├── data/                         → Curriculum Data & Schema Definitions
    │   ├── academic.ts               → CEFR academic lessons and dialogues data
    │   ├── grammar.ts                → Grammar rules, tenses, and structural guides
    │   ├── kurmanji.ts               → Core vocabulary library and alphabet entries
    │   ├── learningPath.ts           → Roadmap modules, units, and lesson milestones
    │   ├── adapters/                 → Content translation and normalization adapters
    │   │   └── contentAdapter.ts     → Data adapter unifying content representations
    │   ├── json/                     → Content manifest JSON catalogs
    │   │   └── contentManifest.json  → Master index of learning content
    │   ├── normalized/               → Structured datasets
    │   │   ├── dialogues.ts          → Conversation dialogues dataset
    │   │   ├── grammarModules.ts     → Normalized grammar dataset
    │   │   └── vocabularyLemmas.ts   → Normalized vocabulary dataset
    │   └── schemas/                  → TypeScript content validators
    │       └── contentSchemas.ts     → Zod/Type content validation schemas
    │
    ├── features/                     → Feature-Driven Modules
    │   ├── audio/                    → Pronunciation Audio Module
    │   │   ├── components/           → Audio player control UI elements
    │   │   └── hooks/                → Audio hooks (`useAudioPlayer`)
    │   ├── monetization/             → Ad Simulation & Store Module
    │   │   ├── components/           → Interstitial and Rewarded Ad modals
    │   │   └── store/                → Zustand store managing gems and ad views
    │   └── quiz/                     → Dynamic Quiz Engine Module
    │       ├── components/           → Question cards and quiz result views
    │       ├── hooks/                → Quiz execution hook (`useQuizEngine`)
    │       ├── types.ts              → Quiz question interface definitions
    │       └── utils/                → Distractor generation algorithms
    │
    ├── hooks/                        → Custom React Hooks
    │   ├── useAudio.ts               → Hook wrapping web audio playback
    │   └── useFavorites.ts           → Hook managing favorited words in localStorage/Firestore
    │
    ├── lib/                          → Third-Party Configurations & Utilities
    │   ├── AuthContext.tsx           → Authentication context and Firestore sync provider
    │   ├── LeaderboardService.ts     → Leaderboard score calculation utility
    │   ├── ReminderService.ts        → Browser notification scheduler
    │   ├── firebase.ts               → Firebase initialization instance
    │   ├── firestoreUtils.ts         → Firestore read/write helper functions
    │   ├── navigation.ts             → Navigation route helpers
    │   ├── translations.ts           → UI translation keys dictionary
    │   └── utils.ts                  → Class merging utility (`cn`)
    │
    ├── localization/                 → Internationalization Layer
    │   └── translations.ts           → Multilingual strings for English and Arabic
    │
    ├── models/                       → Data Models & TypeScript Interfaces
    │   ├── learning.ts               → Vocabulary, Lesson, Quiz, and Category types
    │   └── user.ts                   → User Profile, Stats, and Badge types
    │
    ├── pages/                        → Top-Level Application Views
    │   ├── Admin.tsx                 → Admin portal for content management and TTS status
    │   ├── Alphabet.tsx              → Hawar script alphabet learning page
    │   ├── Dashboard.tsx             → Primary user hub with stats, streaks, and quick launch
    │   ├── Favorites.tsx             → Saved vocabulary terms review page
    │   ├── Games.tsx                 → Arcade game selection portal
    │   ├── GrammarPage.tsx           → Kurmanji grammar rules and structural guide
    │   ├── LeaderboardPage.tsx       → Global community ranking leaderboard
    │   ├── Login.tsx                 → User authentication and guest login page
    │   ├── NotFound.tsx              → 404 route error page
    │   ├── PrivacyPolicy.tsx         → Privacy policy legal documentation
    │   ├── Profile.tsx               → User account settings, badges, and progress summary
    │   ├── Quiz.tsx                  → Interactive quiz execution container
    │   ├── Roadmap.tsx               → Gamified CEFR learning path map
    │   ├── Search.tsx                → Real-time multilingual dictionary search
    │   ├── Sentences.tsx             → Practical sentences and dialogue practice page
    │   ├── TermsOfService.tsx        → Terms of service legal documentation
    │   ├── VocabularyCategories.tsx  → Vocabulary categories overview page
    │   └── VocabularyList.tsx        → Detailed vocabulary items view page
    │
    ├── services/                     → Core Business Logic & Engine Services
    │   ├── GamificationService.ts    → Calculation of XP rewards, levels, and streak logic
    │   ├── LeaderboardService.ts     → Leaderboard fetching and rank calculation
    │   ├── OfflineStorageService.ts  → Fallback IndexedDB / LocalStorage state persistence
    │   ├── ReminderService.ts        → Daily practice reminder notifications
    │   ├── SpacedRepetitionService.ts→ SM-2 algorithm for spaced memory review
    │   ├── SyncEngine.ts             → Auto-sync engine merging offline and cloud data
    │   └── TelemetryService.ts       → User interaction analytics and error logging
    │
    ├── store/                        → Context State Provider
    │   └── AuthContext.tsx           → Core user session and data state context
    │
    └── utils/                        → General Utility Functions
        └── cn.ts                     → ClassName merger helper
```

---

## 4. Architecture Explanation

### Overall System Architecture
Kurdish Quest follows a **Mobile-First Client-Side Architecture** backed by an Express backend proxy and Firebase Cloud Storage:

```text
  ┌──────────────────────────────────────────────────────────┐
  │                 Client Application Layer                 │
  │  (React 19 SPA + React Router v7 + Tailwind + Framer)    │
  └─────────────┬──────────────────────────────┬─────────────┘
                │                              │
    (State & Offline Storage)       (Cloud Synchronization)
                │                              │
                ▼                              ▼
  ┌───────────────────────────┐  ┌───────────────────────────┐
  │ LocalStorage / IndexedDB  │  │  Firebase Firestore &     │
  │ (Offline Data Resilience) │  │  Google Authentication    │
  └───────────────────────────┘  └───────────────────────────┘
                ▲                              ▲
                └──────────────┬───────────────┘
                               │
                       (SyncEngine.ts)
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────┐
  │              Express.js Server Proxy Layer               │
  │    (Static Audio Serving + Admin API + Rate Limiter)     │
  └──────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline
1. **User Action**: The user completes a quiz, reads a lesson, or earns XP.
2. **Immediate Local Update**: `AuthContext.tsx` updates client-side state in memory and persists state instantly to `LocalStorage` for zero latency.
3. **Background Cloud Sync**: `SyncEngine.ts` monitors network connectivity and syncs local profile updates to Firebase Cloud Firestore at `users/{userId}`.
4. **Offline Resilience**: If offline, changes queue locally. Once reconnected, `SyncEngine.ts` merges offline changes with Firestore seamlessly.

---

## 5. Features Documentation

### Feature Matrix

| Feature | Description | File Location | Key Functions / Mechanism |
| :--- | :--- | :--- | :--- |
| **Hawar Alphabet Guide** | Interactive audio guide for all 31 Kurmanji Latin letters with phonetic charts and sample words. | `src/pages/Alphabet.tsx` | Plays native pronunciation clips per letter; filters vowels and consonants. |
| **Categorized Vocabulary** | Browse hundreds of terms categorized into Animals, Colors, Food, Family, Travel, and more. | `src/pages/VocabularyCategories.tsx`, `VocabularyList.tsx` | Integrates with `useFavorites` and audio playback triggers. |
| **Interactive Quiz Engine** | Dynamic test generator supporting Multiple Choice, Listening, Spelling, and Emoji Match questions. | `src/features/quiz/` | `useQuizEngine.ts` dynamically pulls terms, creates randomized distractors, and scores performance. |
| **Spaced Repetition (SRS)** | SM-2 algorithm derivative calculating review intervals for weak vocabulary terms. | `src/services/SpacedRepetitionService.ts` | Adjusts term ease factors based on user answer speed and correctness. |
| **Gamification Engine** | Experience points (XP), streak tracking, level progression, and badge achievements. | `src/services/GamificationService.ts` | Calculates level boundaries based on total XP and updates streak counters upon daily logins. |
| **Arcade Games Suite** | Interactive spelling and memory games (Word Connect, Memory Match, Zombie Typing). | `src/components/games/` | Real-time interactive canvas and card views built with Framer Motion and audio feedback. |
| **Multilingual Search** | Real-time dictionary search across English, Arabic, Kurdish, and phonetic pronunciations. | `src/pages/Search.tsx` | Filters normalized vocabulary lemmas instantly without backend latency. |
| **Offline-First Sync Engine** | Seamless offline state persistence with automatic cloud resolution upon connection. | `src/services/SyncEngine.ts` | Merges offline mutations with Firestore documents securely. |
| **Google Apps Script Proxy** | Safe backend proxy for Google Sheets content synchronization. | `server.ts` | Anti-SSRF allowlisted proxy endpoint `/api/admin/google-sheets/proxy`. |

---

## 6. Installation & Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (or `bun` / `pnpm`)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kbanana10/kurmanjiapp.git
   cd kurmanjiapp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Copy the `.env.example` file to create `.env`:
   ```bash
   cp .env.example .env
   ```

   Configure the variables in `.env`:
   ```env
   # Public origin
   APP_URL="http://localhost:3000"

   # Admin API Security (server.ts)
   ADMIN_API_ENABLED=false
   ADMIN_API_TOKEN="your-secure-bearer-token"

   # Text-to-Speech Engine Provider
   TTS_PROVIDER="google"
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Run Test Suite**:
   ```bash
   npm run test
   ```

---

## 7. Development Guide

### Adding New Vocabulary
To add new vocabulary words to the curriculum:
1. Open `src/data/kurmanji.ts`.
2. Add a new item adhering to the `VocabularyItem` interface:
   ```typescript
   {
     id: "word_unique_id",
     kurdish: "Rojbaş",
     english: "Good morning",
     arabic: "صباح الخير",
     phonetic: "Rohj-bahsh",
     category: "greetings",
     difficulty: "beginner"
   }
   ```
3. Run `npm run lint` to verify type safety.

### Adding New Routes & Pages
1. Create a new page component in `src/pages/MyNewPage.tsx`.
2. Open `src/App.tsx` and import the route using React `lazy`:
   ```typescript
   const MyNewPage = lazy(() => import('./pages/MyNewPage').then(m => ({ default: m.MyNewPage })));
   ```
3. Add the `<Route>` definition inside `<Routes>` in `src/App.tsx`.

### Code Style Conventions
- **TypeScript**: Strict type definitions required; avoid `any`.
- **Styling**: Use Tailwind CSS utility classes exclusively.
- **RTL/LTR Support**: Use logical directional CSS properties (`start`, `end`, `ms-`, `me-`) instead of left/right fixed positions.

---

## 8. Database Documentation

### Firestore Document Schema: `users/{userId}`

| Property | Type | Description |
| :--- | :--- | :--- |
| `xp` | `number` | Total experience points accumulated by user. |
| `level` | `number` | Current player level (calculated from total XP). |
| `streak` | `number` | Consecutive daily login streak count. |
| `wordsLearned` | `number` | Total count of vocabulary terms mastered. |
| `quizzesCompleted` | `number` | Number of completed curriculum quizzes. |
| `completedLessons` | `string[]` | Array of completed lesson IDs. |
| `badges` | `string[]` | Array of earned achievement badge IDs. |
| `favorites` | `string[]` | Array of favorited vocabulary word IDs. |
| `lastActive` | `number` | JavaScript timestamp epoch of last activity. |
| `createdAt` | `number` | User creation timestamp. |

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow get, list, create, update, delete: if isOwner(userId);
    }
  }
}
```

---

## 9. UI/UX Documentation

### Key Screens
- **Dashboard (`/`)**: Main hub displaying user level, XP progress bar, current login streak, motivational quote, daily goal progress, and quick-launch study modules.
- **Learning Path / Roadmap (`/roadmap`)**: Gamified node-based milestone map tracking lesson unlocks from CEFR A1 to B2.
- **Quiz Engine (`/quiz/:moduleId`)**: Full-screen interactive quiz view with progress indicator, haptic feedback, streak boosters, and celebration modals.
- **Games Portal (`/games`)**: Selection of arcade games (Word Connect, Memory Match, Zombie Typing) designed for cognitive vocabulary reinforcement.
- **Multilingual Search (`/search`)**: Fast, real-time dictionary search with language toggle filters.
- **User Profile (`/profile`)**: Showcase for earned badges, detailed learning statistics, dialect settings, and cloud account sync options.

---

## 10. Future Improvements

1. **Native Push Notifications**: Integrate `@capacitor/push-notifications` to send practice reminder alerts directly to mobile devices.
2. **Offline Audio Bundles**: Package high-frequency audio files into a downloadable zip file for 100% offline pronunciation playback.
3. **AI Speech Recognition**: Integrate browser SpeechRecognition API to assess student pronunciation accuracy in real time.
4. **Multiplayer Leaderboard Challenges**: Enable peer-to-peer vocabulary head-to-head quiz battles.

---

*Developed with ❤️ for Kurdish language preservation and education.*

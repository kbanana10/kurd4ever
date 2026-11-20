/**
 * regression.test.ts
 *
 * Locks in every defect found during the production audit so it cannot silently
 * come back. Each `it()` names the original bug; the assertion encodes the
 * FIXED behaviour.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import {
  calculateLevelFromXP,
  getXpRequiredForLevel,
  getLevelProgress,
  checkAndUpdateStreak,
  calculateQuizRewards,
} from '../src/services/GamificationService';
import { syncEngine } from '../src/services/SyncEngine';
import { UserData } from '../src/models/user';

describe('GAMIFICATION', () => {
  it('level curve is an exact inverse of the XP table (was off-by-one from L3 up)', () => {
    for (let lvl = 1; lvl <= 60; lvl++) {
      expect(calculateLevelFromXP(getXpRequiredForLevel(lvl))).toBe(lvl);
    }
  });

  it('one XP below a threshold stays on the previous level', () => {
    for (let lvl = 2; lvl <= 40; lvl++) {
      expect(calculateLevelFromXP(getXpRequiredForLevel(lvl) - 1)).toBe(lvl - 1);
    }
  });

  it('never returns NaN / Infinity for hostile XP (was NaN and 3.7e218)', () => {
    for (const bad of [NaN, Infinity, -Infinity, -100, 1e308, 0.5, undefined as any, null as any]) {
      const r = calculateLevelFromXP(bad);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(1);
    }
  });

  it('progress bar matches the real curve (Dashboard used xp % 100)', () => {
    const p = getLevelProgress(500);
    expect(p.level).toBe(4);
    expect(p.percent).toBeGreaterThan(0);
    expect(p.percent).toBeLessThanOrEqual(100);
    expect(p.xpIntoLevel + p.xpToNextLevel).toBe(p.xpForThisLevel);
  });

  it('missing a day does NOT grow the streak, even with a freeze', () => {
    const base: any = { xp: 0, level: 1, streak: 5, streakFreezes: 1, lastActive: Date.now() };
    const r = checkAndUpdateStreak({ ...base, lastActive: Date.now() - 2 * 86400000 });
    expect(r.updatedStreak).toBe(5);   // preserved, not incremented
    expect(r.freezeUsed).toBe(true);
    expect(r.streakFreezes).toBe(0);
  });

  it('consecutive day still increments', () => {
    const base: any = { xp: 0, level: 1, streak: 5, streakFreezes: 1 };
    const r = checkAndUpdateStreak({ ...base, lastActive: Date.now() - 86400000 });
    expect(r.updatedStreak).toBe(6);
  });

  it('a 0-question quiz pays nothing (was 10 free gems, farmable)', () => {
    const r = calculateQuizRewards(0, 0, 0, 12);
    expect(r.xpGained).toBe(0);
    expect(r.gemsGained).toBe(0);
  });

  it('score is clamped to the question count (999/5 minted 24,985 XP)', () => {
    const r = calculateQuizRewards(999, 5, 0, 25);
    expect(r.xpGained).toBeLessThanOrEqual(5 * 25 + 20);
    expect(r.isPerfect).toBe(true);
  });

  it('rejects a hostile level multiplier', () => {
    const r = calculateQuizRewards(5, 5, 0, 99999);
    expect(r.xpGained).toBeLessThanOrEqual(5 * 50 + 20);
  });
});

describe('AUDIO', () => {
  const src = fs.readFileSync('src/features/audio/hooks/useAudio.ts', 'utf8');

  it('playAudioUrl.onended CALLS the setter (was `currentSetter = null`)', () => {
    const block = src.split('audio.onended')[1].split('};')[0];
    expect(block).toContain('currentSetter(false)');
  });

  it('audio cache is bounded (was unbounded, leaked on the 450-word dictionary)', () => {
    expect(src).toMatch(/MAX_CACHED_AUDIO/);
    expect(src).toMatch(/audioCache\.delete\(/);
  });

  it('AudioButton forwards a spoken lemma so TTS says Kurdish, not the filename', () => {
    const btn = fs.readFileSync('src/features/audio/components/AudioButton.tsx', 'utf8');
    expect(btn).toContain('textToSpeak');
    expect(btn).toContain('useAudio(audioUrl, textToSpeak)');
  });

  it('no AudioButton call site is left without textToSpeak', () => {
    const files = fs.readdirSync('src/pages').filter(f => f.endsWith('.tsx'));
    const offenders: string[] = [];
    for (const f of files) {
      const body = fs.readFileSync(`src/pages/${f}`, 'utf8');
      const blocks = body.split('<AudioButton').slice(1);
      blocks.forEach((b, i) => {
        const head = b.slice(0, b.indexOf('/>') + 2);
        if (!head.includes('textToSpeak')) offenders.push(`${f}#${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe('SECURITY', () => {
  const server = fs.readFileSync('server.ts', 'utf8');

  it('the admin API surface has been removed entirely', () => {
    // The /api/admin/* routes (sheets proxy, tts stats/clear) were deleted
    // along with the Admin page. Nothing may re-register them.
    expect(server).not.toContain('/api/admin');
    expect(server).not.toContain('adminRouter');
    expect(server).not.toContain('requireAdmin');
  });

  it('the arbitrary .env write + process.exit endpoint is gone', () => {
    expect(server).not.toMatch(/app\.post\(\s*["'][^"']*config\/apikey/);
    expect(server).not.toContain('process.exit(0);');
  });

  it('missing audio returns a real 404, not the SPA HTML shell', () => {
    expect(server).toContain('Audio asset not found');
  });
});

describe('ROBUSTNESS', () => {
  it('AuthContext guards JSON.parse of localStorage (was an unhandled rejection)', () => {
    const ctx = fs.readFileSync('src/store/AuthContext.tsx', 'utf8');
    const guest = ctx.split('Guest / Local profile mode')[1].slice(0, 700);
    expect(guest).toContain('try {');
    expect(guest).toContain('catch');
  });

  it('logout resets to a default profile instead of null', () => {
    const ctx = fs.readFileSync('src/store/AuthContext.tsx', 'utf8');
    expect(ctx).not.toMatch(/setUserData\(null\)/);
  });

  it('the router has a catch-all 404 route', () => {
    const app = fs.readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain('path="*"');
    expect(app).toContain('NotFound');
  });

  it('Quiz shows a recoverable error instead of an infinite spinner', () => {
    const quiz = fs.readFileSync('src/pages/Quiz.tsx', 'utf8');
    expect(quiz).toContain('questions.length === 0');
  });

  it('the hint no longer submits a wrong answer', () => {
    const quiz = fs.readFileSync('src/pages/Quiz.tsx', 'utf8');
    expect(quiz).toContain('setEliminatedOptions');
    expect(quiz).not.toMatch(/handleOptionSelect\(autoWrong\)/);
  });
});

describe('PERFORMANCE', () => {
  it('routes are code split (single 2.3 MB chunk before)', () => {
    const app = fs.readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain('lazy(');
    expect(app).toContain('Suspense');
  });

  it('Roadmap no longer namespace-imports all of lucide (was +800 kB)', () => {
    const rm = fs.readFileSync('src/pages/Roadmap.tsx', 'utf8');
    // Ignore the explanatory comment; assert no real namespace import statement.
    expect(rm).not.toMatch(/^import \* as Icons/m);

    // KNIP CLEANUP: the standalone roadmapIcons module turned out to be a
    // dead duplicate (the page kept its own registry) and was deleted. The
    // guarantee under test is unchanged — an explicit icon allow-list lives
    // in the page, never a namespace import.
    expect(rm).toContain('LESSON_ICONS');
  });

  it('the vocabulary catalogue is memoised, not rebuilt per keystroke', () => {
    const ad = fs.readFileSync('src/data/adapters/contentAdapter.ts', 'utf8');
    expect(ad).toContain('_lemmaCache');
  });

  it('Search debounces input and caps rendered rows', () => {
    const se = fs.readFileSync('src/pages/Search.tsx', 'utf8');
    expect(se).toContain('debouncedQuery');
    expect(se).toContain('PAGE_SIZE');
  });

  it('vendor chunks are split in the build config', () => {
    const vc = fs.readFileSync('vite.config.ts', 'utf8');
    expect(vc).toContain('manualChunks');
    expect(vc).toContain('vendor-firebase');
  });
});

describe('ACCESSIBILITY', () => {
  it('an accessible Modal primitive exists with role/aria-modal/focus trap', () => {
    const m = fs.readFileSync('src/components/ui/Modal.tsx', 'utf8');
    expect(m).toContain('role="dialog"');
    expect(m).toContain('aria-modal="true"');
    expect(m).toContain('Escape');
    expect(m).toContain('aria-labelledby');
  });

  it('the exit confirmation uses it', () => {
    const ml = fs.readFileSync('src/components/MainLayout.tsx', 'utf8');
    expect(ml).toContain('<Modal');
  });

  it('the shared Button enforces a 44px touch target and focus ring', () => {
    const b = fs.readFileSync('src/components/ui/Button.tsx', 'utf8');
    expect(b).toContain('min-h-[44px]');
    expect(b).toContain('focus-visible:ring');
  });
});

describe('PWA', () => {
  it('ships real installable icons (manifest pointed at a missing favicon.ico)', () => {
    for (const f of [
      'public/pwa-192x192.png',
      'public/pwa-512x512.png',
      'public/apple-touch-icon.png',
      'public/favicon.png',
    ]) {
      expect(fs.existsSync(f), `${f} missing`).toBe(true);
    }
    const vc = fs.readFileSync('vite.config.ts', 'utf8');
    expect(vc).toContain('pwa-512x512.png');
    expect(vc).not.toContain("src: 'favicon.ico'");
  });
});

describe('SYNC & RECONCILIATION', () => {
  const baseLocal: UserData = {
    xp: 200,
    level: 2,
    streak: 3,
    gems: 50, // User spent 50 gems locally
    streakFreezes: 0, // Consumed freeze locally
    wordsLearned: 20,
    quizzesCompleted: 5,
    sessionsCount: 3,
    completedLessons: ['l1', 'l2'],
    badges: ['first_steps'],
    unlockedLevels: ['A1'],
    favorites: ['w1'],
    recentSearches: ['hello'],
    lastActive: 2000,
    createdAt: 1000,
    updatedAt: 2000
  };

  const baseRemote: UserData = {
    xp: 150,
    level: 2,
    streak: 2,
    gems: 100, // Older balance in remote
    streakFreezes: 1, // Older freeze count
    wordsLearned: 15,
    quizzesCompleted: 4,
    sessionsCount: 2,
    completedLessons: ['l1', 'l3'],
    badges: ['first_steps'],
    unlockedLevels: ['A1'],
    favorites: ['w2'],
    recentSearches: ['kurdish'],
    lastActive: 1500,
    createdAt: 1000,
    updatedAt: 1500
  };

  it('spent gems do NOT revert back to higher pre-spend remote balance', () => {
    const merged = syncEngine.mergeUserDataAdditive(baseLocal, baseRemote);
    expect(merged.gems).toBe(50); // Preserves local spent balance (50 instead of 100)
    expect(merged.streakFreezes).toBe(0); // Preserves consumed freeze (0 instead of 1)
  });

  it('preserves newer remote gems when remote is newer', () => {
    const newerRemote = { ...baseRemote, gems: 250, updatedAt: 3000 };
    const merged = syncEngine.mergeUserDataAdditive(baseLocal, newerRemote);
    expect(merged.gems).toBe(250);
  });

  it('monotonic counters take max across local and remote', () => {
    const merged = syncEngine.mergeUserDataAdditive(baseLocal, baseRemote);
    expect(merged.xp).toBe(200);
    expect(merged.wordsLearned).toBe(20);
    expect(merged.quizzesCompleted).toBe(5);
    expect(merged.sessionsCount).toBe(3);
  });

  it('discrete collections union additively without duplicates', () => {
    const merged = syncEngine.mergeUserDataAdditive(baseLocal, baseRemote);
    expect(merged.completedLessons).toEqual(expect.arrayContaining(['l1', 'l2', 'l3']));
    expect(merged.completedLessons.length).toBe(3);
    expect(merged.favorites).toEqual(expect.arrayContaining(['w1', 'w2']));
    expect(merged.favorites.length).toBe(2);
  });
});


describe('WRITING LESSON — result overlay must not survive "Next letter"', () => {
  // Bug: clicking "Next letter" navigated, but the previous letter's
  // "Keep practicing" modal stayed on screen forever. React Router re-uses the
  // mounted page when only the :letterId param changes, so `showResult`/`score`
  // — and the spent `xpAwardedRef` guard — leaked into the next letter.
  // The behaviour is proven end-to-end in audit/writing-lesson-next.test.tsx;
  // these lock both layers of the fix so neither can be quietly reverted.
  it('the lesson route re-keys per letter so a new letter remounts cleanly', () => {
    const app = fs.readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/function KeyedWritingLesson\(\)[\s\S]*?<WritingLessonPage key=\{letterId\} \/>/);
    expect(app).toContain('<Route path="writing/lesson/:letterId" element={<KeyedWritingLesson />} />');
  });

  it('WritingLessonPage still clears attempt state when only :letterId changes', () => {
    const page = fs.readFileSync('src/pages/WritingLessonPage.tsx', 'utf8');
    expect(page).toMatch(/setShowResult\(false\)[\s\S]{0,200}?\}, \[letter\.id, glyph\]\);/);
  });
});


describe('WRITING LESSON — unified back policy (one level per press)', () => {
  // Bug: with a practice stage active (or the result overlay open) the header
  // arrow / Android hardware back left the whole lesson — skipping the letter's
  // own 'learn' view — and "Next letter" PUSHED an entry, building a trail of
  // visited letters for back to walk through. Behaviour is proven end-to-end in
  // audit/writing-lesson-back.test.tsx; these lock the three wiring points.
  it('MainLayout gives registered screens first refusal before navigating back', () => {
    const layout = fs.readFileSync('src/components/MainLayout.tsx', 'utf8');
    // Header arrow + Capacitor hardware button: a consumed press must not navigate.
    expect(layout.match(/if \(runBackInterceptors\(\)\) \{\s*return;\s*\}/g)).toHaveLength(2);
  });

  it('the interceptor registry is LIFO with an unregister-returning API', () => {
    const nav = fs.readFileSync('src/lib/navigation.ts', 'utf8');
    expect(nav).toContain('export function registerBackInterceptor');
    expect(nav).toContain('export function runBackInterceptors');
    expect(nav).toMatch(/for \(let i = backInterceptors\.length - 1; i >= 0; i--\)/);
  });

  it('the lesson consumes one press per level, and switching letters replaces the entry', () => {
    const page = fs.readFileSync('src/pages/WritingLessonPage.tsx', 'utf8');
    expect(page).toContain('registerBackInterceptor');
    expect(page).toMatch(/navigate\(`\/writing\/lesson\/\$\{next\.id\}`, \{ replace: true \}\)/);
    expect(page).toMatch(/navigate\(`\/writing\/lesson\/\$\{prev\.id\}`, \{ replace: true \}\)/);
    expect(page).toMatch(/navigate\('\/writing', \{ replace: true \}\)/);
  });
});


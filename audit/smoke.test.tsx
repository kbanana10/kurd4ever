import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

// Mock firebase so no network
vi.mock('../src/lib/firebase', () => {
  const noop = () => {};
  return {
    db: {},
    auth: { currentUser: null, onAuthStateChanged: noop },
    googleProvider: {},
    GoogleAuthProvider: class {},
    // TODO-002: tests exercise the guest/unconfigured path by default.
    isFirebaseConfigured: false,
  };
});
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_a: any, cb: any) => { setTimeout(() => cb(null), 0); return () => {}; },
  signInWithPopup: vi.fn(async () => { throw new Error('popup blocked'); }),
  signOut: vi.fn(async () => {}),
  updateProfile: vi.fn(async () => {}),
  getAuth: () => ({ currentUser: null }),
  GoogleAuthProvider: class {},
}));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), getDoc: async () => ({ exists: () => false, data: () => null }),
  setDoc: async () => {}, getDocFromServer: async () => { throw new Error('the client is offline'); },
  getFirestore: () => ({}),
}));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApp: () => ({}), getApps: () => [] }));

import { AuthProvider } from '../src/store/AuthContext';

const errors: string[] = [];
const warns: string[] = [];
beforeEach(() => {
  errors.length = 0; warns.length = 0;
  vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  vi.spyOn(console, 'warn').mockImplementation((...a) => warns.push(a.map(String).join(' ')));
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function seedLoggedIn(extra: any = {}) {
  localStorage.setItem('kurdish_quest_user', JSON.stringify({ displayName: 'Auditor', uid: 'local_user' }));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
    xp: 500, level: 4, gems: 300, streak: 5, streakFreezes: 1,
    lastActive: Date.now(), lastActiveDate: new Date().toISOString().split('T')[0],
    createdAt: Date.now(), updatedAt: Date.now(), wordsLearned: 40,
    recentSearches: [], favorites: [], completedLessons: [], unlockedLevels: ['A1','A2'],
    badges: [], gameScores: {}, wrongAnswersHistory: [], weakCategories: {}, strongCategories: {},
    sessionsCount: 3, totalStudyTime: 20, isOnboarded: true, ...extra,
  }));
}

async function renderRoute(path: string, Comp: React.ComponentType<any>, routePattern?: string) {
  const result = render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePattern || path} element={<Comp />} />
          <Route path="*" element={<div>catchall</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  await act(async () => { await new Promise(r => setTimeout(r, 60)); });
  return result;
}

const PAGES: Array<[string, string, string?]> = [
  ['Dashboard', '/'],
  ['Login', '/login'],
  ['LearningHub', '/learn'],
  ['Alphabet', '/alphabet'],
  ['VocabularyCategories', '/vocabulary'],
  ['VocabularyList', '/vocabulary/family', '/vocabulary/:categoryId'],
  ['Sentences', '/sentences'],
  ['Favorites', '/favorites'],
  ['Roadmap', '/roadmap'],
  ['Games', '/games'],
  ['Search', '/search'],
  ['Profile', '/profile'],
  ['LeaderboardPage', '/leaderboard'],
  ['PrivacyPolicy', '/privacy'],
  ['TermsOfService', '/terms'],
  ['Quiz', '/quiz/a1_family', '/quiz/:moduleId'],
];

describe('Every page mounts', () => {
  for (const [name, path, pattern] of PAGES) {
    it(`mounts ${name} @ ${path}`, async () => {
      seedLoggedIn();
      const mod = await import(`../src/pages/${name}.tsx`);
      const Comp = (mod as any)[name] || (mod as any).default;
      expect(Comp, `component export ${name}`).toBeTruthy();
      const { container } = await renderRoute(path, Comp, pattern);
      // Login legitimately redirects to "/" when a session already exists, so it
      // renders (almost) nothing here. Every other page must paint real content.
      if (name !== 'Login') {
        expect(container.innerHTML.length).toBeGreaterThan(50);
      }
      const realErrors = errors.filter(e => !/not wrapped in act|Warning: /.test(e));
      if (realErrors.length) console.log(`[${name}] CONSOLE ERRORS:\n` + realErrors.join('\n---\n'));
    });
  }
});

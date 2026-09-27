/**
 * writing-lesson-next.test.tsx — regression: "Next letter" left the previous
 * letter's result overlay on screen forever.
 *
 * The user-visible bug: after a scored free-write (e.g. 66 → "Keep practicing
 * 💪" / "+8 XP"), clicking "Next letter" navigated to the next letter but the
 * modal stayed open, because React Router re-uses the mounted page when only
 * the :letterId param changes. The stale `showResult`/`score` kept
 * `<Modal open={showResult && score !== null}>` mounted; the carried-over
 * `xpAwardedRef`/`finalScoreSent` also silently blocked XP on the next letter.
 *
 * The free-write is driven with a stubbed pixel engine so the score is exactly
 * 66 (freeWriteScore(0.66, 0, 2/3)) — the reported score — with no canvas in
 * jsdom. `traceable` is forced false so the trace stage exposes "Go write".
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router';

// --- module seams -----------------------------------------------------------
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_a: any, cb: any) => { setTimeout(() => cb(null), 0); return () => {}; },
  signInWithPopup: vi.fn(async () => { throw new Error('popup blocked'); }),
  signOut: vi.fn(async () => {}), updateProfile: vi.fn(async () => {}),
  getAuth: () => ({ currentUser: null }), GoogleAuthProvider: class {},
}));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), getDoc: async () => ({ exists: () => false, data: () => null }),
  setDoc: async () => {}, getDocFromServer: async () => { throw new Error('the client is offline'); },
  getFirestore: () => ({}),
  setLogLevel: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApp: () => ({}), getApps: () => [] }));

// Deterministic free-write verdict: coverage 0.66 + 2 of 3 zones → score 66.
const { evaluateTraceMock } = vi.hoisted(() => ({
  evaluateTraceMock: vi.fn(() => ({
    coverage: 0.66,
    outOfBounds: 0,
    zones: [{ passed: true }, { passed: true }, { passed: false }],
  })),
}));

vi.mock('../src/lib/traceLetters', () => {
  const mask = () => ({ width: 320, height: 320, data: new Uint8Array(320 * 320) });
  return {
    TRACE_CANVAS: 320,
    buildLetterMask: mask,
    buildStrokesMask: mask,
    evaluateTrace: evaluateTraceMock,
  };
});

// No stroke data → the trace stage exposes the "Go write" escape hatch, which
// is the shortest deterministic path into the scored free-write stage.
vi.mock('../src/data/letterStrokes', () => ({
  getLetterStrokes: () => null,
  getLetterReadiness: () => 'missing',
  letterStrokesToPx: () => [],
}));

// Canvas + decorative seams: jsdom has no 2D context worth scoring.
vi.mock('../src/components/WritingLessonCanvas', async () => {
  const R = await import('react');
  const handle = {
    clear: vi.fn(),
    undo: vi.fn(),
    clearFeedback: vi.fn(),
    showDeviation: vi.fn(),
    canvas: () => null,
  };
  const Stub = R.forwardRef((_props: unknown, ref: unknown) => {
    R.useImperativeHandle(ref as React.ForwardedRef<unknown>, () => handle);
    return R.createElement('div', { 'data-testid': 'lesson-canvas' });
  });
  return { default: Stub };
});
vi.mock('../src/components/LetterDemo', async () => {
  const R = await import('react');
  return { default: () => R.createElement('div', { 'data-testid': 'letter-demo' }) };
});
vi.mock('../src/components/AudioButton', async () => {
  const R = await import('react');
  return { AudioButton: () => R.createElement('button', null, 'Listen') };
});

import { AuthProvider } from '../src/store/AuthContext';
import { WritingLessonPage } from '../src/pages/WritingLessonPage';

/** Mirrors App.tsx's KeyedWritingLesson — the production wiring. */
function KeyedLesson() {
  const { letterId } = useParams();
  return <WritingLessonPage key={letterId} />;
}

/** Deliberately un-keyed (the pre-fix wiring): the page must still recover. */
function PlainLesson() {
  return <WritingLessonPage />;
}

const settle = async (ms = 60) => {
  await act(async () => { await new Promise(r => setTimeout(r, ms)); });
};

const buttons = () => Array.from(document.querySelectorAll('button'));
const bodyText = () => document.body.textContent || '';

/**
 * Modal renders its content inside <AnimatePresence> with a motion fade-out, so
 * a closed dialog can linger in the DOM while its exit animation plays (which
 * jsdom never finishes on its own). Wait for the node to actually leave instead
 * of asserting a synchronous unmount.
 */
async function expectOverlayClosed() {
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), { timeout: 3000 });
  expect(bodyText()).not.toContain('Keep practicing');
  expect(bodyText()).not.toContain('Try again to improve');
  expect(bodyText()).not.toContain('Next letter');
}

async function clickButton(match: RegExp) {
  const btn = buttons().find(b => match.test(b.textContent || ''));
  if (!btn) {
    throw new Error(
      `no button matching ${match}; present: ${buttons().map(b => (b.textContent || '').trim()).join(' | ')}`,
    );
  }
  await act(async () => { fireEvent.click(btn); });
  await settle();
}

/** Learn → trace fallback → free write → Check: opens the result modal. */
async function scoreOneAttempt() {
  await clickButton(/Skip to tracing/i);
  await clickButton(/Go write/i);
  await clickButton(/Check/i);
}

function wrap(element: React.ReactElement, path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/writing/lesson/:letterId" element={element} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.clear();
  localStorage.setItem('kurdish_quest_user', JSON.stringify({ displayName: 'Auditor', uid: 'local_user' }));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
    xp: 500, level: 4, gems: 300, streak: 5, streakFreezes: 1, lastActive: Date.now(),
    lastActiveDate: new Date().toISOString().split('T')[0], createdAt: Date.now(), updatedAt: Date.now(),
    wordsLearned: 40, recentSearches: [], favorites: [], completedLessons: [], unlockedLevels: ['A1', 'A2'],
    badges: [], gameScores: {}, wrongAnswersHistory: [], weakCategories: {}, strongCategories: {},
    sessionsCount: 3, totalStudyTime: 20, isOnboarded: true,
  }));
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Writing lesson — "Next letter" must clear the result overlay', () => {
  it('reproduces the reported state first: score 66 → "Keep practicing" + 8 XP', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();

    expect(evaluateTraceMock).toHaveBeenCalled();
    expect(bodyText()).toContain('Keep practicing');
    expect(bodyText()).toContain('Try again to improve');
    expect(bodyText()).toContain('+8 XP');
  });

  it('production wiring (keyed route): Next letter closes the modal, next letter is armed', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();
    expect(bodyText()).toContain('Keep practicing');

    await clickButton(/Next letter/i);

    // The stale overlay must be gone...
    await expectOverlayClosed();
    // ...and we must be back at the Learn stage of the NEXT letter (b → "Bav").
    expect(bodyText()).toContain('Bav');
    expect(bodyText()).toContain('Skip to tracing');
  });

  it('re-arms the once-per-attempt XP guard on the next letter (no silent 0 XP)', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();
    await clickButton(/Next letter/i);

    await scoreOneAttempt();

    expect(bodyText()).toContain('+8 XP');
    expect(bodyText()).toContain('Keep practicing');
  });

  it('un-keyed fallback: the page resets itself even if the route forgets to re-key', async () => {
    wrap(<PlainLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();
    expect(bodyText()).toContain('Keep practicing');

    await clickButton(/Next letter/i);

    await expectOverlayClosed();
    expect(bodyText()).toContain('Bav');
  });
});


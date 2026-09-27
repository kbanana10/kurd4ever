/**
 * writing-lesson-back.test.tsx — the unified back policy for the letter lesson.
 *
 * The writing flow has three levels: (L1) the /writing grid, (L2) a letter's
 * /writing/lesson/:id 'learn' view and (L3) its active practice stage
 * (watch/trace/write, plus the result overlay). ONE rule must hold: back goes
 * UP exactly one level — never skipping the letter page, never walking a trail
 * of previously viewed letters.
 *
 * Covered here:
 *   - result overlay open → back closes the overlay ONLY (stage untouched);
 *   - trace/write stage   → back collapses to THAT letter's learn view and
 *     clears the canvas; a second press then falls through;
 *   - learn stage         → back is NOT consumed (MainLayout exits to /writing);
 *   - nextLetter / prevLetter / "All letters" replace the history entry, so
 *     the stack stays flat;
 *   - a real browser back (jsdom history traversal → popstate) mid-practice
 *     restores the letter page instead of leaving the lesson, and a deep-link
 *     lesson pushes exactly one non-stacking marker entry.
 *
 * The harness mirrors audit/writing-lesson-next.test.tsx (same firebase /
 * canvas / demo seams).
 */
import React from 'react';
import fs from 'fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import {
  BrowserRouter,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
} from 'react-router';

// --- module seams (identical pattern to writing-lesson-next.test.tsx) -------
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: null) => void) => {
    setTimeout(() => cb(null), 0);
    return () => {};
  },
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
const { evaluateTraceMock, canvasHandle, strokes } = vi.hoisted(() => ({
  evaluateTraceMock: vi.fn(() => ({
    coverage: 0.66,
    outOfBounds: 0,
    zones: [{ passed: true }, { passed: true }, { passed: false }],
  })),
  canvasHandle: {
    clear: vi.fn(),
    undo: vi.fn(),
    clearFeedback: vi.fn(),
    showDeviation: vi.fn(),
    canvas: () => null,
  },
  strokes: { ready: false },
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

// `strokes.ready` is toggled per test: with authored strokes the trace stage
// mounts the canvas; without them it exposes the "Go write" escape hatch.
vi.mock('../src/data/letterStrokes', () => ({
  getLetterStrokes: () => (strokes.ready ? { strokes: [{}] } : null),
  getLetterReadiness: () => (strokes.ready ? 'ready' : 'missing'),
  letterStrokesToPx: () => [],
}));

// Canvas + decorative seams: jsdom has no 2D context worth scoring.
vi.mock('../src/components/WritingLessonCanvas', async () => {
  const R = await import('react');
  const Stub = R.forwardRef((_props: unknown, ref: unknown) => {
    R.useImperativeHandle(ref as React.ForwardedRef<unknown>, () => canvasHandle);
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

import { registerBackInterceptor, runBackInterceptors } from '../src/lib/navigation';
import { AuthProvider } from '../src/store/AuthContext';
import { WritingLessonPage } from '../src/pages/WritingLessonPage';

/** Mirrors App.tsx's KeyedWritingLesson — the production wiring. */
function KeyedLesson() {
  const { letterId } = useParams();
  return <WritingLessonPage key={letterId} />;
}

/** Pathname + last navigation type of the active router, for assertions. */
function RouterProbe() {
  const location = useLocation();
  const navigationType = useNavigationType();
  return (
    <>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="nav-type">{navigationType}</span>
    </>
  );
}

const pathname = () => document.querySelector('[data-testid="pathname"]')?.textContent;
const navType = () => document.querySelector('[data-testid="nav-type"]')?.textContent;

const settle = async (ms = 60) => {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
};

const buttons = () => Array.from(document.querySelectorAll('button'));
const bodyText = () => document.body.textContent || '';

/**
 * Modal renders inside <AnimatePresence> with a motion fade-out, so a closed
 * dialog can linger in the DOM while its exit animation plays (jsdom never
 * finishes it on its own). Wait for the node to actually leave.
 */
async function expectOverlayClosed() {
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), { timeout: 3000 });
  expect(bodyText()).not.toContain('Keep practicing');
  expect(bodyText()).not.toContain('Next letter');
}

async function clickButton(match: RegExp) {
  const btn = buttons().find((b) => match.test(b.textContent || ''));
  if (!btn) {
    throw new Error(
      `no button matching ${match}; present: ${buttons().map((b) => (b.textContent || '').trim()).join(' | ')}`,
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

/** A consuming back press (header arrow / Android hardware button path). */
async function pressBack(): Promise<boolean> {
  let consumed = false;
  await act(async () => { consumed = runBackInterceptors(); });
  await settle();
  return consumed;
}

function wrap(element: React.ReactElement, path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <RouterProbe />
        <Routes>
          <Route path="/writing/lesson/:letterId" element={element} />
          <Route path="/writing" element={<div>WRITING GRID</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  strokes.ready = false;
  evaluateTraceMock.mockClear();
  canvasHandle.clear.mockClear();
  canvasHandle.undo.mockClear();
  canvasHandle.clearFeedback.mockClear();
  canvasHandle.showDeviation.mockClear();
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

describe('back-interceptor registry (src/lib/navigation.ts)', () => {
  it('runs handlers LIFO, stops at the first consumer, and unregisters cleanly', () => {
    const order: string[] = [];
    const offA = registerBackInterceptor(() => { order.push('a'); return false; });
    const offB = registerBackInterceptor(() => { order.push('b'); return true; });

    expect(runBackInterceptors()).toBe(true);
    expect(order).toEqual(['b']); // LIFO: b ran first and consumed — a never ran

    offB();
    order.length = 0;
    expect(runBackInterceptors()).toBe(false);
    expect(order).toEqual(['a']); // the remaining handler now runs

    offA();
    expect(runBackInterceptors()).toBe(false);
  });
});

describe('writing lesson back — header arrow / Android hardware back', () => {
  it('result overlay open: back closes the overlay ONLY (stage and route untouched)', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();
    expect(bodyText()).toContain('Keep practicing');

    expect(await pressBack()).toBe(true);

    await expectOverlayClosed();
    expect(bodyText()).toContain('Write it freely'); // still the write stage
    expect(pathname()).toBe('/writing/lesson/a');
  });

  it('a second back after the overlay closes collapses to the letter learn view', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();

    expect(await pressBack()).toBe(true); // closes the overlay
    await expectOverlayClosed();

    expect(await pressBack()).toBe(true); // write → learn
    expect(bodyText()).toContain('Skip to tracing');
    expect(bodyText()).not.toContain('Write it freely');
    expect(pathname()).toBe('/writing/lesson/a');
  });

  it('write stage: back collapses to learn and clears the canvas', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await clickButton(/Skip to tracing/i);
    await clickButton(/Go write/i);
    expect(bodyText()).toContain('Write it freely');
    const clearCallsBefore = canvasHandle.clear.mock.calls.length;

    expect(await pressBack()).toBe(true);

    expect(canvasHandle.clear.mock.calls.length).toBeGreaterThan(clearCallsBefore);
    expect(bodyText()).toContain('Skip to tracing');
    expect(bodyText()).not.toContain('Write it freely');
    expect(pathname()).toBe('/writing/lesson/a');
  });

  it('trace stage (authored strokes): back collapses to learn and clears the canvas', async () => {
    strokes.ready = true;
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await clickButton(/Skip to tracing/i);
    expect(document.querySelector('[data-testid="lesson-canvas"]')).not.toBeNull();
    const clearCallsBefore = canvasHandle.clear.mock.calls.length;

    expect(await pressBack()).toBe(true);

    expect(canvasHandle.clear.mock.calls.length).toBeGreaterThan(clearCallsBefore);
    expect(bodyText()).toContain('Skip to tracing');
    expect(pathname()).toBe('/writing/lesson/a');
  });

  it('learn stage: back is NOT consumed — the press falls through to the /writing exit', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    expect(bodyText()).toContain('Skip to tracing');

    expect(await pressBack()).toBe(false);
    expect(pathname()).toBe('/writing/lesson/a');
  });

  it('unmounting the lesson unregisters its interceptor (no ghost consumer)', async () => {
    const view = wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await clickButton(/Skip to tracing/i); // an intercepting stage

    view.unmount();

    expect(runBackInterceptors()).toBe(false);
  });
});

describe('letter switching keeps the history stack flat (replace:true)', () => {
  it('"Next letter" replaces the entry — no trail back to the previous letter', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();
    await scoreOneAttempt();

    await clickButton(/Next letter/i);

    await expectOverlayClosed();
    expect(navType()).toBe('REPLACE');
    expect(pathname()).toBe('/writing/lesson/b');
    expect(bodyText()).toContain('Bav');
  });

  it('"All letters" replaces the entry — back from the grid cannot reopen the lesson', async () => {
    wrap(<KeyedLesson />, '/writing/lesson/a');
    await settle();

    await clickButton(/All letters/i);

    expect(navType()).toBe('REPLACE');
    expect(pathname()).toBe('/writing');
    expect(bodyText()).toContain('WRITING GRID');
  });

  it('prevLetter also replaces (no UI trigger yet — locked by source contract)', () => {
    const page = fs.readFileSync('src/pages/WritingLessonPage.tsx', 'utf8');
    expect(page).toMatch(
      /const nextLetter = useCallback[\s\S]{0,400}?navigate\(`\/writing\/lesson\/\$\{next\.id\}`, \{ replace: true \}\)/,
    );
    expect(page).toMatch(
      /const prevLetter = useCallback[\s\S]{0,400}?navigate\(`\/writing\/lesson\/\$\{prev\.id\}`, \{ replace: true \}\)/,
    );
  });
});

describe('browser back (real jsdom history traversal → popstate)', () => {
  function WritingGridStub() {
    const navigate = useNavigate();
    return (
      <div>
        <span>WRITING GRID</span>
        <button type="button" onClick={() => navigate('/writing/lesson/a')}>Open letter A</button>
      </div>
    );
  }

  function renderBrowserApp() {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <RouterProbe />
          <Routes>
            <Route path="/writing" element={<WritingGridStub />} />
            <Route path="/writing/lesson/:letterId" element={<KeyedLesson />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>,
    );
  }

  /** jsdom queues history traversals; give the pop + its listeners time to run. */
  async function browserBack() {
    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
  }

  it('mid-practice back restores the letter page; the next back exits to /writing', async () => {
    window.history.replaceState(null, '', '/writing');
    renderBrowserApp();
    await settle();

    await clickButton(/Open letter A/i);
    expect(pathname()).toBe('/writing/lesson/a');

    await clickButton(/Skip to tracing/i); // practice stage
    expect(bodyText()).not.toContain('Skip to tracing');
    // An in-app entry exists below (idx > 0) → no deep-link marker is pushed.
    expect(window.history.state?.kqLessonBackMarker).toBeUndefined();

    await browserBack();

    expect(pathname()).toBe('/writing/lesson/a');    // URL restored, not left behind
    expect(bodyText()).toContain('Skip to tracing'); // collapsed to the learn view

    await browserBack();

    expect(pathname()).toBe('/writing');
    expect(bodyText()).toContain('WRITING GRID');    // normal exit
  });

  it('deep link (first entry): leaving learn pushes exactly ONE non-stacking marker', async () => {
    window.history.replaceState(null, '', '/writing/lesson/a');
    renderBrowserApp();
    await settle();
    expect(window.history.state?.idx).toBe(0); // deep link: nothing below

    await clickButton(/Skip to tracing/i);
    expect(window.history.state?.kqLessonBackMarker).toBe(true); // one marker pushed
    expect(window.history.state?.idx).toBe(1);

    const markerKey = window.history.state?.key;
    await clickButton(/Go write/i);
    expect(window.history.state?.key).toBe(markerKey); // same entry: never stacked

    await browserBack();

    expect(pathname()).toBe('/writing/lesson/a');    // collapsed, not exited
    expect(bodyText()).toContain('Skip to tracing');
  });
});

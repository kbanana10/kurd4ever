/**
 * THROWAWAY verification harness (task_0003) — DELETE AFTER USE.
 * Adversarial probes for the writing-lesson back policy at HEAD cd89356.
 */
import React from 'react';
import fs from 'fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';

// --- module seams (identical pattern to audit/writing-lesson-back.test.tsx) ---
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: null) => void) => { setTimeout(() => cb(null), 0); return () => {}; },
  signInWithPopup: vi.fn(async () => { throw new Error('popup blocked'); }),
  signOut: vi.fn(async () => {}), updateProfile: vi.fn(async () => {}),
  getAuth: () => ({ currentUser: null }), GoogleAuthProvider: class {},
}));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), getDoc: async () => ({ exists: () => false, data: () => null }),
  setDoc: async () => {}, getDocFromServer: async () => { throw new Error('the client is offline'); },
  getFirestore: () => ({}), setLogLevel: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApp: () => ({}), getApps: () => [] }));

const { evaluateTraceMock, canvasHandle, strokes } = vi.hoisted(() => ({
  evaluateTraceMock: vi.fn(() => ({ coverage: 0.66, outOfBounds: 0, zones: [{ passed: true }, { passed: true }, { passed: false }] })),
  canvasHandle: { clear: vi.fn(), undo: vi.fn(), clearFeedback: vi.fn(), showDeviation: vi.fn(), canvas: () => null },
  strokes: { ready: false },
}));

vi.mock('../src/lib/traceLetters', () => {
  const mask = () => ({ width: 320, height: 320, data: new Uint8Array(320 * 320) });
  return { TRACE_CANVAS: 320, buildLetterMask: mask, buildStrokesMask: mask, evaluateTrace: evaluateTraceMock };
});
vi.mock('../src/data/letterStrokes', () => ({
  getLetterStrokes: () => (strokes.ready ? { strokes: [{}] } : null),
  getLetterReadiness: () => (strokes.ready ? 'ready' : 'missing'),
  letterStrokesToPx: () => [],
}));
vi.mock('../src/components/WritingLessonCanvas', async () => {
  const R = await import('react');
  const Stub = R.forwardRef((_p: unknown, ref: unknown) => {
    R.useImperativeHandle(ref as React.Ref<unknown>, () => canvasHandle);
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

import { registerBackInterceptor, runBackInterceptors, navigateSafelyBack } from '../src/lib/navigation';
import { AuthProvider } from '../src/store/AuthContext';
import { WritingLessonPage } from '../src/pages/WritingLessonPage';
import { alphabet } from '../src/data/kurmanji';

function KeyedLesson() {
  const { letterId } = useParams();
  return <WritingLessonPage key={letterId} />;
}

let navRef: ((to: unknown, opts?: unknown) => void) | null = null;
let pathRef = '/';
function NavBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  navRef = navigate as typeof navRef;
  pathRef = location.pathname;
  return <span data-testid="pathname">{location.pathname}</span>;
}

const pathname = () => document.querySelector('[data-testid="pathname"]')?.textContent ?? '(none)';
const bodyText = () => document.body.textContent ?? '';
const buttons = () => Array.from(document.querySelectorAll('button'));
const settle = async (ms = 70) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };

async function clickButton(match: RegExp) {
  const btn = buttons().find((b) => match.test(b.textContent || ''));
  if (!btn) throw new Error(`no button matching ${match}; present: ${buttons().map((b) => (b.textContent || '').trim()).join(' | ')}`);
  await act(async () => { fireEvent.click(btn); });
  await settle();
}

/** A consuming back press via the registry only (MainLayout's first step). */
async function pressBack(): Promise<boolean> {
  let consumed = false;
  await act(async () => { consumed = runBackInterceptors(); });
  await settle();
  return consumed;
}

/** MainLayout.handleSmartBack composition: registry first, else navigateSafelyBack. */
async function headerBack(): Promise<boolean> {
  let consumed = false;
  await act(async () => {
    consumed = runBackInterceptors();
    if (!consumed) navigateSafelyBack(navRef! as never, pathRef);
    await new Promise((r) => setTimeout(r, 90));
  });
  await settle();
  return consumed;
}

async function browserBack(ms = 110) {
  await act(async () => { window.history.back(); await new Promise((r) => setTimeout(r, ms)); });
}

async function scoreOneAttempt() {
  await clickButton(/Skip to tracing/i);
  await clickButton(/Go write/i);
  await clickButton(/Check/i);
}

async function expectOverlayClosed() {
  await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), { timeout: 3000 });
}

function wrapMemory(element: React.ReactElement, entries: string[]) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={entries}>
        <NavBridge />
        <Routes>
          <Route path="/writing/lesson/:letterId" element={element} />
          <Route path="/writing" element={<div>WRITING GRID</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function WritingGridStub() {
  const navigate = useNavigate();
  return (
    <div>
      <span>WRITING GRID</span>
      <button type="button" onClick={() => navigate('/writing/lesson/a')}>Open letter A</button>
    </div>
  );
}

function wrapBrowser() {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <NavBridge />
        <Routes>
          <Route path="/writing" element={<WritingGridStub />} />
          <Route path="/writing/lesson/:letterId" element={<KeyedLesson />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>,
  );
}

const capturedErrors: string[] = [];
const capturedWarns: string[] = [];
let currentTest = '(setup)';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    capturedErrors.push(`[${currentTest}] ` + a.map((x) => (x instanceof Error ? x.message : String(x))).join(' '));
  });
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    capturedWarns.push(a.map((x) => (x instanceof Error ? x.message : String(x))).join(' '));
  });
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

describe('probe A — header-path one-level rule (MemoryRouter)', () => {
  it('A1: practice → learn on the SAME url, second press falls through to /writing', async () => {
    window.history.replaceState({ idx: 0 }, '', '/'); // force navigateSafelyBack parent map
    wrapMemory(<KeyedLesson />, ['/writing/lesson/a']);
    await settle();
    await clickButton(/Skip to tracing/i);
    await clickButton(/Go write/i);
    expect(bodyText()).toContain('Write it freely');
    const clearsBefore = canvasHandle.clear.mock.calls.length;

    const first = await headerBack();
    expect(first).toBe(true); // consumed
    expect(canvasHandle.clear.mock.calls.length).toBeGreaterThan(clearsBefore);
    expect(bodyText()).toContain('Skip to tracing'); // learn view again
    expect(bodyText()).not.toContain('Write it freely');
    expect(pathname()).toBe('/writing/lesson/a');

    const second = await headerBack();
    expect(second).toBe(false); // falls through (not consumed: AC2)
    // The forced idx-0 state also makes the page push its deep-link marker, so
    // navigateSafelyBack legitimately took the idx>0 branch here. The in-app
    // end-to-end exit is covered by B1; unit-check the parent-map branch:
    const spy = vi.fn();
    window.history.replaceState({ idx: 0 }, '', '/');
    navigateSafelyBack(spy, '/writing/lesson/a');
    expect(spy).toHaveBeenCalledWith('/writing');
  });

  it('A2: watch stage is also consumed and collapses to learn', async () => {
    wrapMemory(<KeyedLesson />, ['/writing/lesson/a']);
    await settle();
    await clickButton(/^Watch$/);
    expect(document.querySelector('[data-testid="letter-demo"]')).not.toBeNull();
    expect(await pressBack()).toBe(true);
    expect(bodyText()).toContain('Skip to tracing');
    expect(document.querySelector('[data-testid="letter-demo"]')).toBeNull();
  });

  it('A3: overlay open → back closes ONLY the overlay (stage/url untouched); next press collapses', async () => {
    wrapMemory(<KeyedLesson />, ['/writing/lesson/a']);
    await settle();
    await scoreOneAttempt();
    expect(bodyText()).toContain('Keep practicing');
    expect(bodyText()).toContain('+8 XP');

    expect(await pressBack()).toBe(true);
    await expectOverlayClosed();
    expect(bodyText()).toContain('Write it freely'); // stage kept
    expect(pathname()).toBe('/writing/lesson/a');

    expect(await pressBack()).toBe(true); // write → learn
    expect(bodyText()).toContain('Skip to tracing');
    expect(await pressBack()).toBe(false);
  });

  it('A4: a later-mounted test interceptor gets precedence over the lesson (LIFO with real mount)', async () => {
    wrapMemory(<KeyedLesson />, ['/writing/lesson/a']);
    await settle();
    await clickButton(/Skip to tracing/i);
    await clickButton(/Go write/i);

    const order: string[] = [];
    const off = registerBackInterceptor(() => { order.push('late'); return true; });
    expect(await pressBack()).toBe(true);
    expect(order).toEqual(['late']);
    expect(bodyText()).toContain('Write it freely'); // lesson untouched: late consumer won
    off();

    expect(await pressBack()).toBe(true); // lesson now consumes
    expect(bodyText()).toContain('Skip to tracing');
  });

  it('A5: prevLetter wrap-around (source contract + arithmetic; no UI trigger exists)', () => {
    const page = fs.readFileSync('src/pages/WritingLessonPage.tsx', 'utf8');
    expect(page).toMatch(/\(idx - 1 \+ alphabet\.length\) % alphabet\.length/);
    expect(page).toMatch(/navigate\(`\/writing\/lesson\/\$\{prev\.id\}`, \{ replace: true \}\)/);
    const idx = 0; // first letter
    const prev = alphabet[(idx - 1 + alphabet.length) % alphabet.length];
    expect(prev.id).toBe(alphabet[alphabet.length - 1].id); // wraps to the last letter
  });
});

describe('probe B — browser back (real jsdom traversal) + adversarial cases', () => {
  it('B1: in-app header path end-to-end — collapse on first press, exit to grid on second (idx>0)', async () => {
    window.history.replaceState({ idx: 0 }, '', '/writing');
    wrapBrowser();
    await settle();
    await clickButton(/Open letter A/i);
    expect(pathname()).toBe('/writing/lesson/a');
    expect(window.history.state?.idx).toBe(1);

    await clickButton(/Skip to tracing/i);
    await clickButton(/Go write/i);
    expect(await headerBack()).toBe(true); // consumed: collapse
    expect(bodyText()).toContain('Skip to tracing');
    expect(pathname()).toBe('/writing/lesson/a');

    expect(await headerBack()).toBe(false); // falls through
    expect(pathname()).toBe('/writing'); // navigateSafelyBack → navigate(-1)
    expect(bodyText()).toContain('WRITING GRID');
  });

  it('B2 RAPID DOUBLE BACK: no crash; never deeper than learn; raw outcome printed', async () => {
    currentTest = 'B2';
    window.history.replaceState({ idx: 0 }, '', '/writing');
    wrapBrowser();
    await settle();
    await clickButton(/Open letter A/i);
    await clickButton(/Skip to tracing/i);
    await clickButton(/Go write/i);
    expect(bodyText()).toContain('Write it freely');

    await act(async () => {
      window.history.back();
      window.history.back();
      await new Promise((r) => setTimeout(r, 250));
    });
    await settle(120);

    const e1 = {
      pathname: pathname(),
      learn: bodyText().includes('Skip to tracing'),
      write: bodyText().includes('Write it freely'),
      grid: bodyText().includes('WRITING GRID'),
      idx: window.history.state?.idx ?? null,
    };
    process.stdout.write(`[PROBE B2 after double back] ${JSON.stringify(e1)}\n`);
    expect(e1.write).toBe(false); // must never stay deeper than learn

    await browserBack(150);
    const e2 = {
      pathname: pathname(),
      learn: bodyText().includes('Skip to tracing'),
      grid: bodyText().includes('WRITING GRID'),
      idx: window.history.state?.idx ?? null,
    };
    process.stdout.write(`[PROBE B2 after third back] ${JSON.stringify(e2)}\n`);
    expect(e2.pathname === '/writing' || e2.pathname === '/writing/lesson/a').toBe(true);
  });

  it('B3: browser back with the result overlay open (XP already awarded) — raw behavior', async () => {
    currentTest = 'B3';
    window.history.replaceState({ idx: 0 }, '', '/writing');
    wrapBrowser();
    await settle();
    await clickButton(/Open letter A/i);
    await scoreOneAttempt();
    expect(bodyText()).toContain('+8 XP');

    await browserBack(150);

    const e = {
      pathname: pathname(),
      learn: bodyText().includes('Skip to tracing'),
      write: bodyText().includes('Write it freely'),
      xp: bodyText().includes('+8 XP'),
      idx: window.history.state?.idx ?? null,
    };
    process.stdout.write(`[PROBE B3 modal-open browser back] ${JSON.stringify(e)}\n`);
    await expectOverlayClosed();
    expect(e.pathname).toBe('/writing/lesson/a'); // never leaves the lesson
  });

  it('B4: deep link (idx 0) → one marker → back collapses; a second back is reported raw', async () => {
    currentTest = 'B4';
    window.history.replaceState({ idx: 0 }, '', '/writing/lesson/a');
    wrapBrowser();
    await settle();
    await clickButton(/Skip to tracing/i);
    expect(window.history.state?.kqLessonBackMarker).toBe(true);
    expect(window.history.state?.idx).toBe(1);

    await browserBack(150);
    expect(bodyText()).toContain('Skip to tracing');
    const afterFirst = {
      pathname: pathname(),
      idx: window.history.state?.idx ?? null,
      marker: window.history.state?.kqLessonBackMarker ?? null,
    };
    process.stdout.write(`[PROBE B4 after 1st back] ${JSON.stringify(afterFirst)}\n`);

    await browserBack(150);
    const afterSecond = {
      pathname: pathname(),
      idx: window.history.state?.idx ?? null,
      marker: window.history.state?.kqLessonBackMarker ?? null,
      grid: bodyText().includes('WRITING GRID'),
    };
    process.stdout.write(`[PROBE B4 after 2nd back] ${JSON.stringify(afterSecond)}\n`);
    expect(afterSecond.pathname).toBe('/writing/lesson/a'); // still inside the lesson
  });

  it('B5: Next ×2 → browser back → header back (no trail through letter b)', async () => {
    currentTest = 'B5';
    window.history.replaceState({ idx: 0 }, '', '/writing');
    wrapBrowser();
    await settle();
    await clickButton(/Open letter A/i);
    await scoreOneAttempt();
    await clickButton(/Next letter/i); // replace
    await expectOverlayClosed();
    expect(pathname()).toBe('/writing/lesson/b');
    const idxAfterFirstNext = window.history.state?.idx ?? null;

    await scoreOneAttempt();
    await clickButton(/Next letter/i); // replace
    await expectOverlayClosed();
    expect(pathname()).toBe('/writing/lesson/c');
    const idxAfterSecondNext = window.history.state?.idx ?? null;
    process.stdout.write(`[PROBE B5 idx after Next x2] ${JSON.stringify({ idxAfterFirstNext, idxAfterSecondNext })}\n`);
    expect(idxAfterSecondNext).toBe(idxAfterFirstNext); // replace: stack did not grow

    await clickButton(/Skip to tracing/i); // practice on c
    await browserBack(150); // collapse to c learn

    const afterCollapse = {
      pathname: pathname(),
      learn: bodyText().includes('Skip to tracing'),
      bVisible: bodyText().includes('Bav'), // letter b's example word
    };
    process.stdout.write(`[PROBE B5 after browser back] ${JSON.stringify(afterCollapse)}\n`);
    expect(afterCollapse.pathname).toBe('/writing/lesson/c');
    expect(afterCollapse.bVisible).toBe(false); // never lands back on letter b

    const headerConsumed = await headerBack();
    const afterHeader = { consumed: headerConsumed, pathname: pathname(), grid: bodyText().includes('WRITING GRID') };
    process.stdout.write(`[PROBE B5 after header back] ${JSON.stringify(afterHeader)}\n`);
    expect(headerConsumed).toBe(false);
    expect(afterHeader.pathname).toBe('/writing'); // exits to the grid
  });

  it('B6: no ghost popstate handler / no interceptor leak (unmount + 3 remount cycles)', async () => {
    window.history.replaceState({ idx: 0 }, '', '/');
    const view = wrapMemory(<KeyedLesson />, ['/writing/lesson/a']);
    await settle();
    await clickButton(/Skip to tracing/i);
    await clickButton(/Go write/i);

    await clickButton(/All letters/i); // leave mid-practice via the page's own control
    expect(pathname()).toBe('/writing');
    expect(runBackInterceptors()).toBe(false); // unregistered on unmount

    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
      await new Promise((r) => setTimeout(r, 60));
    });
    await settle();
    expect(pathname()).toBe('/writing'); // a ghost listener would have navigated back into the lesson

    view.unmount();
    expect(runBackInterceptors()).toBe(false);

    for (let i = 0; i < 3; i++) {
      const v = wrapMemory(<KeyedLesson />, ['/writing/lesson/a']);
      await settle(40);
      await clickButton(/Skip to tracing/i);
      expect(runBackInterceptors()).toBe(true);
      v.unmount();
      expect(runBackInterceptors()).toBe(false);
    }
  });

  it('B7: Arabic/RTL — practice, collapse and fallthrough work in ar', async () => {
    localStorage.setItem('kurdish_quest_lang', 'ar');
    window.history.replaceState({ idx: 0 }, '', '/writing');
    wrapBrowser();
    await settle(120);
    await clickButton(/Open letter A/i);
    expect(bodyText()).toContain('ابدأ التتبع مباشرة'); // Skip to tracing (ar)

    await clickButton(/ابدأ التتبع مباشرة/);
    expect(bodyText()).toContain('انتقل للكتابة'); // Go write (ar)
    await clickButton(/انتقل للكتابة/);
    expect(bodyText()).toContain('اكتب بدون توجيه'); // Write it freely (ar)

    expect(await pressBack()).toBe(true); // collapse
    expect(bodyText()).toContain('ابدأ التتبع مباشرة'); // learn again

    expect(await headerBack()).toBe(false); // falls through
    expect(pathname()).toBe('/writing'); // in-app exit to the grid
  });

  it('B8 CONSOLE PROBE: dump console.error/warn captured across all probes', () => {
    process.stdout.write(`[PROBE console.error x${capturedErrors.length}]\n${capturedErrors.join('\n')}\n`);
    process.stdout.write(`[PROBE console.warn x${capturedWarns.length}]\n${capturedWarns.slice(0, 15).join('\n')}\n`);
    const nonAct = capturedErrors.filter((e) => !e.includes('not wrapped in act'));
    expect(nonAct).toEqual([]); // no product-level console errors, only React test-timing warnings
  });
});




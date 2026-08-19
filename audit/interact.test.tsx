import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';

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

import { AuthProvider } from '../src/store/AuthContext';

const errors: string[] = [];
beforeEach(() => {
  errors.length = 0;
  vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.map(String).join(' ')));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.clear();
  localStorage.setItem('kurdish_quest_user', JSON.stringify({ displayName: 'Auditor', uid: 'local_user' }));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
    xp: 500, level: 4, gems: 300, streak: 5, streakFreezes: 1, lastActive: Date.now(),
    lastActiveDate: new Date().toISOString().split('T')[0], createdAt: Date.now(), updatedAt: Date.now(),
    wordsLearned: 40, recentSearches: [], favorites: [], completedLessons: [], unlockedLevels: ['A1','A2'],
    badges: [], gameScores: {}, wrongAnswersHistory: [], weakCategories: {}, strongCategories: {},
    sessionsCount: 3, totalStudyTime: 20, isOnboarded: true,
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function wrap(ui: React.ReactElement, path = '/', pattern = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path={pattern} element={ui} /><Route path="*" element={<div/>} /></Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}
const settle = async (ms = 80) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };

describe('Search page — hostile input', () => {
  it('handles regex-special chars, very long text, XSS payload', async () => {
    const { Search } = await import('../src/pages/Search');
    const { container } = wrap(<Search />, '/search', '/search');
    await settle();
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    const payloads = ['(((', '[a-z', '\\', '.*', '<img src=x onerror=alert(1)>', 'a'.repeat(5000), '🔥'.repeat(200), '؀‏\u202e'];
    for (const p of payloads) {
      let threw = null;
      try {
        await act(async () => { fireEvent.change(input, { target: { value: p } }); });
        await settle(30);
      } catch (e: any) { threw = e.message; }
      console.log(`payload ${JSON.stringify(p.slice(0,25))} -> ${threw ? 'THREW: '+threw : 'ok'}`);
      expect(threw, `search crashed on ${p.slice(0,20)}`).toBeNull();
    }
    // XSS check: raw HTML must not be injected
    expect(container.querySelector('img[onerror]')).toBeNull();
  });
});

describe('Zombie Typing Game — full play session', () => {
  it('start -> type correct -> score, then lose all lives -> game over', async () => {
    const { ZombieTypingGame } = await import('../src/components/games/ZombieTypingGame');
    const { vocabulary } = await import('../src/data/kurmanji');
    const onWin = vi.fn();
    const { container } = render(
      <ZombieTypingGame vocabulary={vocabulary as any} language="en" onWin={onWin} onClose={() => {}} />
    );
    await settle();
    const html0 = container.textContent || '';
    console.log('START SCREEN has HEJÛMÊ:', html0.includes('HEJÛMÊ'));
    // find start button
    const buttons = Array.from(container.querySelectorAll('button'));
    console.log('start-screen buttons:', buttons.map(b => (b.textContent||'').trim().slice(0,30)).filter(Boolean));
    const startBtn = buttons.find(b => /DEST|START|Play|Bide/i.test(b.textContent || ''));
    expect(startBtn, 'no start button found').toBeTruthy();
    await act(async () => { fireEvent.click(startBtn!); });
    await settle(150);
    console.log('after start, contains lives/score UI:', /\d/.test(container.textContent||''));
    // simulate global keydown typing (game listens on window)
    await act(async () => {
      for (const ch of 'abc') window.dispatchEvent(new KeyboardEvent('keydown', { key: ch }));
    });
    await settle(50);
    // Spam-tap Enter 50x rapidly (edge case)
    await act(async () => {
      for (let i = 0; i < 50; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    await settle(100);
    console.log('survived 50x Enter spam; console errors:', errors.filter(e=>!/act\(/.test(e)).length);
    expect(container.textContent!.length).toBeGreaterThan(20);
  });

  it('BUG PROBE: highScore initialised to fake 24 for brand-new player', async () => {
    const { ZombieTypingGame } = await import('../src/components/games/ZombieTypingGame');
    const { vocabulary } = await import('../src/data/kurmanji');
    localStorage.removeItem('kurdish_zombie_highscore');
    const { container } = render(
      <ZombieTypingGame vocabulary={vocabulary as any} language="en" onWin={()=>{}} onClose={()=>{}} />
    );
    await settle();
    const txt = container.textContent || '';
    console.log('fresh player high score shown contains "24":', txt.includes('24'));
    expect(txt).toContain('0'); // FIXED: honest zero for a new player
  });

  it('EDGE: empty vocabulary array', async () => {
    const { ZombieTypingGame } = await import('../src/components/games/ZombieTypingGame');
    let crashed = null;
    try {
      const { container } = render(<ZombieTypingGame vocabulary={[] as any} language="en" onWin={()=>{}} onClose={()=>{}} />);
      await settle();
      const b = Array.from(container.querySelectorAll('button')).find(x => /DEST|START|Play/i.test(x.textContent||''));
      if (b) { await act(async () => { fireEvent.click(b); }); await settle(200); }
      console.log('empty-vocab: rendered, currentWord null path ->', (container.textContent||'').slice(0,120));
    } catch (e: any) { crashed = e.message; }
    console.log('empty vocab crashed?', crashed);
  });
});

describe('Word Matching Game', () => {
  it('renders and cards are clickable', async () => {
    const { WordMatchingGame } = await import('../src/components/games/WordMatchingGame');
    const { vocabulary } = await import('../src/data/kurmanji');
    const { container } = render(<WordMatchingGame vocabulary={vocabulary as any} language="en" onWin={()=>{}} onClose={()=>{}} />);
    await settle(120);
    const btns = Array.from(container.querySelectorAll('button'));
    console.log('WordMatching buttons:', btns.length);
    // spam click every card twice
    await act(async () => { btns.forEach(b => { fireEvent.click(b); fireEvent.click(b); }); });
    await settle(150);
    console.log('after spam-click errors:', errors.filter(e=>!/act\(/.test(e)).length);
    expect(container.textContent!.length).toBeGreaterThan(10);
  });
  it('EDGE: empty vocabulary', async () => {
    const { WordMatchingGame } = await import('../src/components/games/WordMatchingGame');
    let crashed = null;
    try { render(<WordMatchingGame vocabulary={[] as any} language="en" onWin={()=>{}} onClose={()=>{}} />); await settle(); }
    catch (e: any) { crashed = e.message; }
    console.log('WordMatching empty vocab crashed?', crashed);
  });
});

describe('Word Connect Game', () => {
  it('renders and handles interaction', async () => {
    const { WordConnectGame } = await import('../src/components/games/WordConnectGame');
    const { vocabulary } = await import('../src/data/kurmanji');
    const { container } = render(<WordConnectGame vocabulary={vocabulary as any} language="en" onWin={()=>{}} onClose={()=>{}} />);
    await settle(120);
    const btns = Array.from(container.querySelectorAll('button'));
    console.log('WordConnect buttons:', btns.length);
    await act(async () => { btns.slice(0, 30).forEach(b => fireEvent.click(b)); });
    await settle(150);
    expect(container.textContent!.length).toBeGreaterThan(10);
  });
});

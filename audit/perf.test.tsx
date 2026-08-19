import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_a:any, cb:any) => { setTimeout(()=>cb(null),0); return ()=>{}; },
  signInWithPopup: vi.fn(), signOut: vi.fn(async()=>{}), updateProfile: vi.fn(async()=>{}),
  getAuth: () => ({currentUser:null}), GoogleAuthProvider: class {},
}));
vi.mock('firebase/firestore', () => ({ doc:()=>({}), getDoc:async()=>({exists:()=>false,data:()=>null}),
  setDoc:async()=>{}, getDocFromServer:async()=>{throw new Error('offline')}, getFirestore:()=>({}), setLogLevel: vi.fn() }));
vi.mock('firebase/app', () => ({ initializeApp:()=>({}), getApp:()=>({}), getApps:()=>[] }));

import { AuthProvider } from '../src/store/AuthContext';
const settle = async (ms=80) => { await act(async()=>{ await new Promise(r=>setTimeout(r,ms)); }); };
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console,'warn').mockImplementation(()=>{});
  localStorage.setItem('kurdish_quest_user', JSON.stringify({displayName:'A',uid:'local_user'}));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({xp:500,level:4,gems:300,streak:5,streakFreezes:1,
    lastActive:Date.now(),lastActiveDate:new Date().toISOString().split('T')[0],createdAt:Date.now(),updatedAt:Date.now(),
    wordsLearned:40,recentSearches:[],favorites:[],completedLessons:[],unlockedLevels:['A1'],badges:[],gameScores:{},
    wrongAnswersHistory:[],weakCategories:{},strongCategories:{},sessionsCount:3,totalStudyTime:20,isOnboarded:true}));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function wrap(ui: React.ReactElement, path='/', pattern='/') {
  return render(<AuthProvider><MemoryRouter initialEntries={[path]}>
    <Routes><Route path={pattern} element={ui}/><Route path="*" element={<div/>}/></Routes></MemoryRouter></AuthProvider>);
}

describe('RENDER PERFORMANCE', () => {
  it('measures mount time + DOM node count for each heavy page', async () => {
    const pages: Array<[string,string,string?]> = [
      ['Dashboard','/'],['Search','/search'],['Games','/games'],['Roadmap','/roadmap'],
      ['Sentences','/sentences'],['VocabularyList','/vocabulary/family','/vocabulary/:categoryId'],
      ['Profile','/profile'],['LeaderboardPage','/leaderboard'],['Alphabet','/alphabet'],
    ];
    const rows: string[] = [];
    for (const [name, path, pattern] of pages) {
      const mod: any = await import(`../src/pages/${name}.tsx`);
      const Comp = mod[name] || mod.default;
      const t0 = performance.now();
      const { container, unmount } = wrap(<Comp/>, path, pattern||path);
      await settle(120);
      const t1 = performance.now();
      const nodes = container.querySelectorAll('*').length;
      const btns = container.querySelectorAll('button').length;
      const svgs = container.querySelectorAll('svg').length;
      rows.push(`${name.padEnd(18)} mount=${(t1-t0).toFixed(0).padStart(5)}ms  nodes=${String(nodes).padStart(5)}  buttons=${String(btns).padStart(4)}  svg=${String(svgs).padStart(4)}`);
      unmount();
    }
    console.log('\n=== PAGE RENDER COST (jsdom, relative) ===\n' + rows.join('\n'));
  });

  it('Search: measures cost of typing (re-filter on every keystroke, no debounce)', async () => {
    const { Search } = await import('../src/pages/Search');
    const { container } = wrap(<Search/>, '/search','/search');
    await settle(150);
    const input = container.querySelector('input') as HTMLInputElement;
    const word = 'mother';
    const t0 = performance.now();
    for (const ch of word) {
      await act(async () => { fireEvent.change(input, { target: { value: input.value + ch } }); });
    }
    const t1 = performance.now();
    console.log(`Search typing "${word}" (${word.length} keystrokes) took ${(t1-t0).toFixed(0)}ms => ${((t1-t0)/word.length).toFixed(0)}ms/keystroke in jsdom`);
    const fs = await import('fs');
    const src = fs.readFileSync('src/pages/Search.tsx','utf8');
    console.log('Search uses useMemo:', src.includes('useMemo'), '| uses debounce:', /debounce|useDeferredValue|setTimeout.*search/i.test(src));
  });

  it('Games page: dead inline icon-mapping layer stays removed', async () => {
    // HISTORY: getWordVector() ran 100+ sequential `if (lowerEn...)` string
    // comparisons PER WORD PER RENDER, and this test documented that smell
    // by asserting the chain existed (> 50). The entire 750-line visuals
    // layer turned out to be dead code and was removed in the TODO-012
    // incremental Games refactor - this test now guards the regression in
    // the opposite direction.
    const fs = await import('fs');
    const src = fs.readFileSync('src/pages/Games.tsx','utf8');
    const ifChain = (src.match(/if \(lowerEn/g)||[]).length;
    console.log(`Games.tsx per-render icon string comparisons: ${ifChain}`);
    console.log('Games.tsx lines:', src.split('\n').length);
    expect(ifChain).toBe(0);
    // and the file must not balloon back toward god-file territory
    expect(src.split('\n').length).toBeLessThan(1000);
  });

  it('checks memoization across the codebase', async () => {
    const fs = await import('fs'); const path = await import('path');
    const walk = (d:string):string[] => fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{
      const p = path.join(d,e.name); return e.isDirectory()?walk(p):(/\.tsx?$/.test(e.name)?[p]:[]); });
    const files = walk('src');
    let memo=0, useMemo=0, useCallback=0, lazy=0;
    for (const f of files) { const s = fs.readFileSync(f,'utf8');
      memo += (s.match(/React\.memo|\bmemo\(/g)||[]).length;
      useMemo += (s.match(/useMemo\(/g)||[]).length;
      useCallback += (s.match(/useCallback\(/g)||[]).length;
      lazy += (s.match(/React\.lazy|lazy\(/g)||[]).length; }
    console.log(`MEMOIZATION across ${files.length} files: React.memo=${memo}, useMemo=${useMemo}, useCallback=${useCallback}, React.lazy=${lazy}`);
    expect(lazy).toBeGreaterThan(0); // FIXED: routes are code split
  });
});

describe('MEMORY / LEAKS', () => {
  it('audio cache is unbounded (never evicts)', async () => {
    const fs = await import('fs');
    const s = fs.readFileSync('src/features/audio/hooks/useAudio.ts','utf8');
    console.log('audioCache eviction logic present:', /delete\(|maxSize|LRU|evict/.test(s));
    console.log('audioCache cleared only by:', (s.match(/audioCache\.clear\(\)/g)||[]).length, 'explicit call(s) in clearInMemoryAudioCache()');
    expect(/MAX_CACHED_AUDIO/.test(s)).toBe(true); // FIXED: bounded cache
  });

  it('mount/unmount 25x — detects listener/timer accumulation', async () => {
    const { MainLayout } = await import('../src/components/MainLayout');
    const addSpy = vi.spyOn(window,'addEventListener');
    const remSpy = vi.spyOn(window,'removeEventListener');
    for (let i=0;i<25;i++){ const {unmount}=wrap(<MainLayout/>,'/','/'); await settle(20); unmount(); }
    console.log(`window.addEventListener calls=${addSpy.mock.calls.length}, removeEventListener=${remSpy.mock.calls.length}`);
    const added = addSpy.mock.calls.map(c=>c[0]); const removed = remSpy.mock.calls.map(c=>c[0]);
    const leak: string[] = [];
    new Set(added).forEach(ev => { const a = added.filter(x=>x===ev).length, r = removed.filter(x=>x===ev).length;
      if (a>r) leak.push(`${ev}: +${a}/-${r}`); });
    console.log('POTENTIALLY LEAKED LISTENERS:', leak.length?leak.join(', '):'none');
  });

  it('SyncEngine + TelemetryService register global listeners at import time (never removed)', async () => {
    const fs = await import('fs');
    for (const f of ['src/services/SyncEngine.ts','src/services/TelemetryService.ts']) {
      const s = fs.readFileSync(f,'utf8');
      console.log(`${f}: addEventListener=${(s.match(/addEventListener/g)||[]).length}, removeEventListener=${(s.match(/removeEventListener/g)||[]).length}, module-level singleton=${/^export const \w+ = new /m.test(s)}`);
    }
  });
});

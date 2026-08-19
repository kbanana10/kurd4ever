import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_a: any, cb: any) => { setTimeout(() => cb(null), 0); return () => {}; },
  signInWithPopup: vi.fn(async () => { throw new Error('popup blocked'); }),
  signOut: vi.fn(async () => {}), updateProfile: vi.fn(async () => {}),
  getAuth: () => ({ currentUser: null }), GoogleAuthProvider: class {},
}));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), getDoc: async () => ({ exists: () => false, data: () => null }),
  setDoc: async () => {}, getDocFromServer: async () => { throw new Error('offline'); }, getFirestore: () => ({}),
  setLogLevel: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApp: () => ({}), getApps: () => [] }));

import { AuthProvider } from '../src/store/AuthContext';

const settle = async (ms = 80) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
function seed(extra: any = {}) {
  localStorage.setItem('kurdish_quest_user', JSON.stringify({ displayName: 'Auditor', uid: 'local_user' }));
  localStorage.setItem('kurmanji_user_data_v2', JSON.stringify({
    xp: 500, level: 4, gems: 300, streak: 5, streakFreezes: 1, lastActive: Date.now(),
    lastActiveDate: new Date().toISOString().split('T')[0], createdAt: Date.now(), updatedAt: Date.now(),
    wordsLearned: 40, recentSearches: [], favorites: [], completedLessons: [], unlockedLevels: ['A1','A2'],
    badges: [], gameScores: {}, wrongAnswersHistory: [], weakCategories: {}, strongCategories: {},
    sessionsCount: 3, totalStudyTime: 20, isOnboarded: true, ...extra }));
}
beforeEach(() => { localStorage.clear(); vi.spyOn(console,'warn').mockImplementation(()=>{}); seed(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function wrap(ui: React.ReactElement, path='/', pattern='/') {
  return render(<AuthProvider><MemoryRouter initialEntries={[path]}>
    <Routes><Route path={pattern} element={ui} /><Route path="*" element={<div/>} /></Routes>
  </MemoryRouter></AuthProvider>);
}

describe('DATA INTEGRITY', () => {
  it('audits every audio path, duplicate IDs, missing translations', async () => {
    const fs = await import('fs');
    const { vocabulary, sentences, alphabet } = await import('../src/data/kurmanji');
    const { academicVocabulary } = await import('../src/data/academic');
    const { learningPath } = await import('../src/data/learningPath');

    const all: any[] = [
      ...vocabulary.map((w:any)=>({...w, _src:'vocabulary'})),
      ...academicVocabulary.map((w:any)=>({...w,_src:'academic'})),
      ...sentences.map((s:any)=>({...s,_src:'sentences'})),
      ...alphabet.map((l:any)=>({...l,_src:'alphabet'})),
      ...learningPath.flatMap((lv:any)=>lv.lessons.flatMap((l:any)=>l.words.map((w:any)=>({...w,_src:'learningPath/'+l.id})))),
    ];
    console.log('TOTAL content items:', all.length);
    console.log(' vocabulary:', vocabulary.length, '| academic:', academicVocabulary.length,
                '| sentences:', sentences.length, '| alphabet:', alphabet.length,
                '| lessons:', learningPath.flatMap((l:any)=>l.lessons).length);

    // duplicate ids
    const byId = new Map<string, string[]>();
    all.forEach(i => { if(!i.id) return; byId.set(i.id, [...(byId.get(i.id)||[]), i._src]); });
    const dupes = [...byId.entries()].filter(([,v])=>v.length>1);
    console.log('DUPLICATE IDS:', dupes.length, dupes.slice(0,8).map(([k,v])=>`${k}(${v.join(',')})`).join(' | '));

    // audio existence
    const audioPaths = new Set<string>();
    all.forEach(i => { if (i.audio) audioPaths.add(i.audio); if (i.charAudio) audioPaths.add(i.charAudio); });
    let missing = 0;
    audioPaths.forEach(p => { if (!fs.existsSync('public' + p)) missing++; });
    console.log(`AUDIO: ${audioPaths.size} unique paths referenced, ${missing} MISSING on disk (${Math.round(missing/audioPaths.size*100)}%)`);

    // missing translations
    const noAr = all.filter(i => i.ar !== undefined && (!i.ar || !String(i.ar).trim()));
    const noEn = all.filter(i => i.en !== undefined && (!i.en || !String(i.en).trim()));
    console.log('EMPTY ar:', noAr.length, '| EMPTY en:', noEn.length);

    // lessons with too few words to make a real quiz
    const thin = learningPath.flatMap((lv:any)=>lv.lessons).filter((l:any)=>l.words.length < 6);
    console.log('LESSONS WITH <6 WORDS (quiz will repeat items):', thin.length, thin.map((l:any)=>`${l.id}:${l.words.length}`).join(', '));

    expect(missing).toBeGreaterThan(0); // documents the finding
  });

  it('Kurmanji orthography sanity: non-Hawar characters in ku fields', async () => {
    const { vocabulary } = await import('../src/data/kurmanji');
    const { learningPath } = await import('../src/data/learningPath');
    const HAWAR = /^[A-Za-zÇçÊêÎîŞşÛû\s'’\-\/(),.\d]+$/;
    const bad: string[] = [];
    const check = (id:string, ku:string) => { if (ku && !HAWAR.test(ku)) bad.push(`${id}: "${ku}"`); };
    vocabulary.forEach((w:any)=>check(w.id,w.ku));
    learningPath.forEach((lv:any)=>lv.lessons.forEach((l:any)=>l.words.forEach((w:any)=>check(w.id,w.ku))));
    console.log('NON-HAWAR ku strings:', bad.length, bad.slice(0,10).join(' | '));
  });

  it('BUG: Arabic text leaked into a Kurdish fill-blank template', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync('src/features/quiz/utils/questionGenerator.ts','utf8');
    const line = src.split('\n').find(l => l.includes('fêr dibه'));
    console.log('CORRUPT TEMPLATE LINE:', line?.trim().slice(0,160));
    expect(line).toBeFalsy(); // Arabic heh 'ه' inside Kurdish sentence "fêr dibe" is fixed
  });
});

describe('QUIZ ENGINE behaviour', () => {
  it('generates questions for every lesson; checks distractor quality', async () => {
    const { generateQuestionsForModule } = await import('../src/features/quiz/utils/questionGenerator');
    const { learningPath } = await import('../src/data/learningPath');
    let filler = 0, dupOpts = 0, total = 0, noOpts = 0;
    for (const lv of learningPath as any[]) {
      for (const les of lv.lessons) {
        const qs = generateQuestionsForModule(les.id, 'mixed_challenge', 'en', null as any);
        total += qs.length;
        for (const q of qs) {
          if (q.options?.some((o:string)=>/Other Answer|Unrelated Option|Not matched|إجابة أخرى/.test(o))) filler++;
          if (q.options?.length && new Set(q.options).size !== q.options.length) dupOpts++;
          if (['multiple_choice','emoji','true_false'].includes(q.type) && (!q.options || q.options.length < 2)) noOpts++;
        }
      }
    }
    console.log(`QUIZ: ${total} questions generated. ${filler} contain FILLER distractors ("Other Answer"). ${dupOpts} have DUPLICATE options. ${noOpts} choice-qs missing options.`);
    expect(total).toBeGreaterThan(0);
  });

  it('BUG: question count exceeds word pool -> same word repeats within one quiz', async () => {
    const { generateQuestionsForModule } = await import('../src/features/quiz/utils/questionGenerator');
    const qs = generateQuestionsForModule('a1_family', 'mixed_challenge', 'en', null as any);
    const ids = qs.map(q=>q.id);
    console.log(`a1_family: pool=6 words, generated ${qs.length} questions, unique ids=${new Set(ids).size}`);
    console.log('question types:', qs.map(q=>q.type).join(', '));
  });

  it('BUG: unknown moduleId returns [] -> quiz stuck on infinite "Loading..."', async () => {
    const { generateQuestionsForModule } = await import('../src/features/quiz/utils/questionGenerator');
    const qs = generateQuestionsForModule('this_module_does_not_exist', 'mixed_challenge', 'en', null as any);
    console.log('unknown module question count:', qs.length);
    expect(qs.length).toBe(0);
  });

  it('LIVE: navigating to /quiz/bogus renders permanent loading spinner (no error state)', async () => {
    const { Quiz } = await import('../src/pages/Quiz');
    const { container } = wrap(<Quiz />, '/quiz/bogus_module', '/quiz/:moduleId');
    await settle(400);
    const txt = container.textContent || '';
    console.log('bogus quiz screen text:', JSON.stringify(txt.trim().slice(0, 200)));
    console.log('shows Loading:', /Loading|جاري/i.test(txt));
  });

  it('true_false question can be UNANSWERABLE (asks X==X but marked False)', async () => {
    const { generateQuestionsForModule } = await import('../src/features/quiz/utils/questionGenerator');
    let contradictions = 0, checked = 0;
    for (let i = 0; i < 60; i++) {
      const qs = generateQuestionsForModule('a1_family','mixed_challenge','en', null as any);
      for (const q of qs) {
        if (q.type !== 'true_false') continue;
        checked++;
        const m = q.question.match(/Does "(.+)" translate to "(.+)"\?/);
        if (!m) continue;
        const [,ku,shown] = m;
        const w:any = q.word;
        const actuallyTrue = (w.en === shown);
        const labelledTrue = q.correctAnswer === 'True';
        if (actuallyTrue !== labelledTrue) contradictions++;
      }
    }
    console.log(`TRUE/FALSE: checked ${checked}, logically-contradictory ${contradictions}`);
  });
});

describe('RTL / Arabic', () => {
  it('renders Arabic locale without crashing and sets dir', async () => {
    localStorage.setItem('kurdish_quest_lang','ar');
    const { MainLayout } = await import('../src/components/MainLayout');
    const { container } = wrap(<MainLayout />, '/', '/');
    await settle(150);
    const rtl = container.querySelector('[dir="rtl"]');
    console.log('dir=rtl element found:', !!rtl);
    expect(rtl).toBeTruthy();
  });
});

describe('OFFLINE behaviour', () => {
  it('app functions with navigator.onLine=false', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { Dashboard } = await import('../src/pages/Dashboard');
    const { container } = wrap(<Dashboard />, '/', '/');
    await settle(200);
    console.log('offline dashboard rendered chars:', (container.textContent||'').length);
    expect((container.textContent||'').length).toBeGreaterThan(50);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('BUG: corrupted localStorage payload', async () => {
    localStorage.setItem('kurmanji_user_data_v2', '{ this is not json');
    localStorage.setItem('kurdish_quest_user', 'ALSO NOT JSON');
    let crashed = null;
    try {
      const { Dashboard } = await import('../src/pages/Dashboard');
      wrap(<Dashboard />, '/', '/');
      await settle(150);
    } catch (e:any) { crashed = e.message; }
    console.log('corrupted-localStorage crash:', crashed);
  });

  it('BUG: userData with hostile/NaN values', async () => {
    seed({ xp: NaN, level: -5, streak: 'lots' as any, gems: null, wordsLearned: Infinity, badges: 'nope' });
    const { Profile } = await import('../src/pages/Profile');
    let crashed = null;
    try { const { container } = wrap(<Profile />, '/profile','/profile'); await settle(150);
      console.log('hostile profile text sample:', (container.textContent||'').slice(0,180));
    } catch (e:any) { crashed = e.message; }
    console.log('hostile-userData crash:', crashed);
  });
});

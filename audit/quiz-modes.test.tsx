/**
 * quiz-modes.test.tsx
 *
 * Regression tests for the Quiz Engine overhaul:
 *  - the 4 quiz modes generate distinct, well-formed questions
 *  - adaptive level practice draws from encountered words & prioritizes weak ones
 *  - the pool-cycling duplicate bug stays dead (no back-to-back repeats)
 *  - hearts: 3 per standard quiz, wrong answers cost one, 0 ends the session,
 *    review modes are heart-free
 *  - writing quiz fuzzy tolerance forgives one slip on long words only
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizEngine } from '../src/features/quiz/hooks/useQuizEngine';
import {
  generateQuestionsForModule,
  getAdaptiveLevelId,
  filterReviewableIds,
} from '../src/features/quiz/utils/questionGenerator';
import { isQuizAnswerAccepted } from '../src/features/quiz/utils/answerUtils';
import { UserData } from '../src/models/user';

vi.mock('../src/features/audio/hooks/useAudio', () => ({
  stopAllActiveAudio: vi.fn(),
  playSuccessSound: vi.fn(),
  playFailureSound: vi.fn(),
  playCompleteSound: vi.fn(),
}));

const baseUser = {
  xp: 100, level: 1, gems: 50, streak: 1, wordsLearned: 5,
  completedLessons: [], wrongAnswersHistory: [], lastActive: Date.now(),
  createdAt: Date.now(), updatedAt: Date.now(), recentSearches: [],
  favorites: [], reviewDeck: {}, unlockedLevels: ['A1'],
} as unknown as UserData;

describe('Quiz modes — distinct generation', () => {
  it('word quiz (multiple_choice): prompts with the Kurdish word, 4 unique options include the translation', () => {
    const qs = generateQuestionsForModule('a1_family', 'multiple_choice', 'en', baseUser);
    expect(qs.length).toBeGreaterThan(0);
    qs.forEach(q => {
      expect(q.type).toBe('multiple_choice');
      expect(q.options.length).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
      expect(new Set(q.options).size).toBe(4);
      expect(q.question).toContain(q.word.ku);
    });
  });

  it('listening quiz: listen-type questions with audio and the spoken Kurdish word among 4 options', () => {
    const qs = generateQuestionsForModule('a1_family', 'listening', 'en', baseUser);
    expect(qs.length).toBeGreaterThan(0);
    qs.forEach(q => {
      expect(q.type).toBe('listen');
      expect(q.audio).toBeTruthy();
      expect(q.options.length).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
      expect(q.correctAnswer).toBe(q.word.ku);
    });
  });

  it('writing quiz (write_kurdish): translate-type questions expecting the typed Kurdish word', () => {
    const qs = generateQuestionsForModule('a1_family', 'write_kurdish', 'en', baseUser);
    expect(qs.length).toBeGreaterThan(0);
    qs.forEach(q => {
      expect(q.type).toBe('translate');
      expect(q.correctAnswer).toBe(q.word.ku);
    });
  });

  it('never repeats the same word back-to-back even when the pool is tiny', () => {
    const tinyUser = {
      ...baseUser,
      wrongAnswersHistory: ['f_mom', 'f_dad'],
    } as UserData;
    for (let run = 0; run < 10; run++) {
      const qs = generateQuestionsForModule('review_mistakes', 'mixed_challenge', 'en', tinyUser);
      expect(qs.length).toBeGreaterThan(0);
      // repeats capped: at most two appearances per word
      const counts = new Map<string, number>();
      qs.forEach(q => counts.set(q.wordId!, (counts.get(q.wordId!) || 0) + 1));
      counts.forEach(c => expect(c).toBeLessThanOrEqual(2));
      for (let i = 1; i < qs.length; i++) {
        expect(qs[i].wordId).not.toBe(qs[i - 1].wordId);
      }
    }
  });
});

describe('Quiz modes — strict mode → question-type contract (no cross-mode leakage)', () => {
  // REGRESSION: the alphabet module used to return listen-type questions for
  // EVERY mode, so Word Quiz / Writing Quiz / Level Practice all rendered as
  // a Listening Quiz when launched from the alphabet picker.
  const modules = ['a1_family', 'alphabet'];

  it('Word Quiz always yields text multiple_choice questions', () => {
    for (const moduleId of modules) {
      const qs = generateQuestionsForModule(moduleId, 'multiple_choice', 'en', baseUser);
      expect(qs.length).toBeGreaterThan(0);
      qs.forEach(q => {
        expect(q.type).toBe('multiple_choice');
        expect(q.question.length).toBeGreaterThan(0);
        expect(q.options.length).toBe(4);
      });
    }
  });

  it('Writing Quiz always yields typed translate questions', () => {
    for (const moduleId of modules) {
      const qs = generateQuestionsForModule(moduleId, 'write_kurdish', 'en', baseUser);
      expect(qs.length).toBeGreaterThan(0);
      qs.forEach(q => expect(q.type).toBe('translate'));
    }
  });

  it('Listening Quiz always yields listen questions with audio', () => {
    for (const moduleId of modules) {
      const qs = generateQuestionsForModule(moduleId, 'listening', 'en', baseUser);
      expect(qs.length).toBeGreaterThan(0);
      qs.forEach(q => {
        expect(q.type).toBe('listen');
        expect(q.audio).toBeTruthy();
      });
    }
  });

  it('listen-type questions never leak outside the listening mode', () => {
    for (const moduleId of modules) {
      for (const mode of ['multiple_choice', 'write_kurdish', 'adaptive_practice'] as const) {
        const qs = generateQuestionsForModule(moduleId, mode, 'en', {
          ...baseUser,
          completedLessons: ['a1_family'],
        } as UserData);
        qs.forEach(q => expect(q.type).not.toBe('listen'));
      }
    }
  });

  it('adaptive practice ignores the launching module (alphabet included)', () => {
    const user = { ...baseUser, completedLessons: ['a1_family'] } as UserData;
    const fromAlphabet = generateQuestionsForModule('alphabet', 'adaptive_practice', 'en', user);
    expect(fromAlphabet.length).toBeGreaterThan(0);
    // pool must be vocabulary words, not letters
    fromAlphabet.forEach(q => expect(String(q.wordId).length).toBeGreaterThan(2));
  });
});

describe('Review modes — alphabet letters & badge/quiz consistency', () => {
  // REGRESSION: the alphabet quiz records LETTER ids into the review deck /
  // mistake history. The review pool only matched vocabulary words, so the
  // Roadmap badge said "3 words due today" while opening the review showed
  // "All caught up!" (0 questions generated).
  const now = Date.now();
  const dueLetter = (id: string) => ({
    id, easeFactor: 2.5, intervalDays: 1, repetitions: 1,
    dueAt: now - 1000, lastReviewedAt: now - 86400000, lapses: 1,
  });

  it('srs_review generates listen questions for due alphabet letters', () => {
    const user = {
      ...baseUser,
      reviewDeck: { a: dueLetter('a'), 'ç': dueLetter('ç'), m: dueLetter('m') },
    } as unknown as UserData;
    const qs = generateQuestionsForModule('srs_review', 'srs_review', 'en', user);
    expect(qs.length).toBe(3);
    qs.forEach(q => {
      expect(q.type).toBe('listen');
      expect(q.category).toBe('alphabet');
      expect(q.options).toContain(q.correctAnswer);
    });
  });

  it('review_mistakes covers letter mistakes', () => {
    const user = { ...baseUser, wrongAnswersHistory: ['a', 'ç', 'm'] } as UserData;
    const qs = generateQuestionsForModule('review_mistakes', 'mixed_challenge', 'en', user);
    expect(qs.length).toBeGreaterThan(0);
  });

  it('mixes letter and word reviews in one session', () => {
    const user = {
      ...baseUser,
      reviewDeck: { a: dueLetter('a'), f_mom: dueLetter('f_mom') },
    } as unknown as UserData;
    const qs = generateQuestionsForModule('srs_review', 'srs_review', 'en', user);
    expect(qs.some(q => q.category === 'alphabet')).toBe(true);
    expect(qs.some(q => q.category !== 'alphabet')).toBe(true);
  });

  it('filterReviewableIds keeps badges honest (letters in, stale ids out)', () => {
    expect(filterReviewableIds(['a', 'ç', 'f_mom'])).toEqual(['a', 'ç', 'f_mom']);
    expect(filterReviewableIds(['deleted_word_xyz'])).toEqual([]);
    expect(filterReviewableIds(['deleted_word_xyz', 'a']).length).toBe(1);
  });
});

describe('Adaptive level practice', () => {
  it('derives the playing level from unlockedLevels and XP', () => {
    expect(getAdaptiveLevelId(baseUser)).toBe('A1');
    expect(getAdaptiveLevelId({ ...baseUser, unlockedLevels: ['A1', 'A2'] } as UserData)).toBe('A2');
    expect(getAdaptiveLevelId(null)).toBe('A1');
  });

  it('builds questions only from words the user has encountered', () => {
    const user = {
      ...baseUser,
      completedLessons: ['a1_family'],
      wrongAnswersHistory: [],
    } as UserData;
    const familyIds = ['f_mom', 'f_dad', 'f_bro', 'f_sis', 'f_grandmom', 'f_granddad'];
    const qs = generateQuestionsForModule('adaptive_practice', 'adaptive_practice', 'en', user);
    expect(qs.length).toBeGreaterThan(0);
    qs.forEach(q => expect(familyIds).toContain(q.wordId));
  });

  it('puts struggling words first in the session', () => {
    const user = {
      ...baseUser,
      completedLessons: ['a1_family', 'a1_nature'],
      wrongAnswersHistory: ['f_grandmom'],
    } as UserData;
    const qs = generateQuestionsForModule('adaptive_practice', 'adaptive_practice', 'en', user);
    expect(qs[0].wordId).toBe('f_grandmom');
  });

  it('falls back to opening lessons for a brand-new learner (never empty)', () => {
    const fresh = { ...baseUser, xp: 0, completedLessons: [], reviewDeck: {} } as UserData;
    const qs = generateQuestionsForModule('adaptive_practice', 'adaptive_practice', 'en', fresh);
    expect(qs.length).toBeGreaterThan(0);
  });
});

describe('Hearts / lives', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function setup(moduleId: string, userData: UserData = baseUser) {
    return renderHook(() =>
      useQuizEngine({
        moduleId,
        language: 'en',
        updateUserProgress: vi.fn().mockResolvedValue(undefined),
        updateUserData: vi.fn().mockResolvedValue(undefined),
        userData,
        navigateBack: vi.fn(),
      })
    );
  }

  it('starts with 3 hearts and loses one per wrong answer', async () => {
    const { result } = setup('a1_family');
    expect(result.current.hearts).toBe(3);

    const q = result.current.questions[0];
    const wrong = q.options.find(o => o !== q.correctAnswer)!;
    await act(async () => {
      await result.current.handleOptionSelect(wrong);
    });
    expect(result.current.hearts).toBe(2);
  });

  it('correct answers never cost a heart', async () => {
    const { result } = setup('a1_family');
    const q = result.current.questions[0];
    await act(async () => {
      await result.current.handleOptionSelect(q.correctAnswer);
    });
    expect(result.current.hearts).toBe(3);
  });

  it('running out of hearts ends the quiz early with partial score', async () => {
    const { result } = setup('a1_family');
    for (let i = 0; i < 3; i++) {
      const q = result.current.questions[result.current.currentIndex];
      const wrong = q.options.find(o => o !== q.correctAnswer)!;
      await act(async () => {
        await result.current.handleOptionSelect(wrong);
      });
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
    }
    expect(result.current.hearts).toBe(0);
    expect(result.current.isFinished).toBe(true);
    expect(result.current.score).toBe(0);
  });

  it('review modes are heart-free (mistake practice must not punish mistakes)', () => {
    const user = { ...baseUser, wrongAnswersHistory: ['f_mom', 'f_dad'] } as UserData;
    const { result } = setup('review_mistakes', user);
    expect(result.current.hearts).toBeNull();
  });
});

describe('Writing quiz — fuzzy tolerance', () => {
  it('forgives a single slipped letter on longer words', () => {
    expect(isQuizAnswerAccepted('dayk', 'Dayik')).toBe(true);   // missing letter
    expect(isQuizAnswerAccepted('dayikk', 'Dayik')).toBe(true); // doubled letter
    expect(isQuizAnswerAccepted('daiyk', 'Dayik')).toBe(true);  // transposition
  });

  it('stays strict on short words so lemmas cannot blur together', () => {
    expect(isQuizAnswerAccepted('av', 'nav')).toBe(false);
    expect(isQuizAnswerAccepted('bav', 'baş')).toBe(false);
    expect(isQuizAnswerAccepted('nan', 'nav')).toBe(false);
  });

  it('still rejects genuinely wrong answers', () => {
    expect(isQuizAnswerAccepted('bapir', 'Dapîr')).toBe(false);
    expect(isQuizAnswerAccepted('completely wrong', 'Dayik')).toBe(false);
  });
});

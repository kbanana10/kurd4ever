import { describe, it, expect } from 'vitest';
import { generateQuestionsForModule, getLevelOfModule } from '../src/features/quiz/utils/questionGenerator';
import { isQuizAnswerAccepted } from '../src/features/quiz/utils/answerUtils';
import { calculateQuizRewards } from '../src/services/GamificationService';
import { UserData } from '../src/models/user';
import { createReviewItem } from '../src/services/SpacedRepetitionService';

describe('Quiz Engine - Question Generator', () => {
  const mockUserData: UserData = {
    xp: 250,
    level: 2,
    gems: 100,
    streak: 3,
    wordsLearned: 20,
    completedLessons: ['a1_family'],
    wrongAnswersHistory: ['f_mom', 'f_dad'],
    lastActive: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    recentSearches: [],
    favorites: [],
    reviewDeck: {
      'f_mom': createReviewItem('f_mom', Date.now() - 10000), // Due
      'f_dad': createReviewItem('f_dad', Date.now() - 5000) // Due
    }
  };

  it('generates unique question IDs with wordId attached', () => {
    const questions = generateQuestionsForModule('a1_family', 'mixed_challenge', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(0);

    const ids = questions.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Each question should have wordId defined
    for (const q of questions) {
      expect(q.wordId).toBeDefined();
      expect(typeof q.wordId).toBe('string');
    }
  });

  it('generates questions for alphabet module', () => {
    // MODE-ROUTING FIX: the alphabet module now honours the selected mode.
    // The default drill is the LISTENING mode (sound → letter)…
    const listening = generateQuestionsForModule('alphabet', 'listening', 'en', mockUserData);
    expect(listening.length).toBeGreaterThan(0);
    expect(listening[0].type).toBe('listen');
    expect(listening[0].options?.length).toBe(4);
    expect(listening[0].options).toContain(listening[0].correctAnswer);

    // …while Word Quiz is pure text MC and Writing Quiz is typed recall.
    const word = generateQuestionsForModule('alphabet', 'multiple_choice', 'en', mockUserData);
    expect(word.every(q => q.type === 'multiple_choice')).toBe(true);
    expect(word.every(q => !q.audio)).toBe(true);

    const writing = generateQuestionsForModule('alphabet', 'write_kurdish', 'en', mockUserData);
    expect(writing.every(q => q.type === 'translate')).toBe(true);
  });

  it('generates questions for vocabulary categories', () => {
    const questions = generateQuestionsForModule('family', 'multiple_choice', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.options?.length).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('generates questions for srs_review mode with due cards', () => {
    const questions = generateQuestionsForModule('srs_review', 'srs_review', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(0);
    // Should contain questions for due items 'f_mom' or 'f_dad'
    const wordIds = questions.map(q => q.wordId);
    expect(wordIds.some(id => id === 'f_mom' || id === 'f_dad')).toBe(true);
  });

  it('generates questions for review_mistakes mode', () => {
    const questions = generateQuestionsForModule('review_mistakes', 'mixed_challenge', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(0);
    const wordIds = questions.map(q => q.wordId);
    expect(wordIds.some(id => id === 'f_mom' || id === 'f_dad')).toBe(true);
  });

  it('supports fill_blank mode without crashing or empty blanks', () => {
    const questions = generateQuestionsForModule('a1_family', 'fill_blank', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.type).toBe('fill_blank');
      expect(q.prompt).toContain('_____');
      expect(q.correctAnswer).toBeDefined();
      expect(q.options?.length).toBe(4);
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('supports sentence_reorder mode and generates scramble tokens', () => {
    const questions = generateQuestionsForModule('a1_family', 'sentence_reorder', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.type).toBe('sentence_reorder');
      expect(q.scrambledWords).toBeDefined();
      expect(q.scrambledWords!.length).toBeGreaterThan(1);
    }
  });

  it('randomizes question types in mixed_challenge mode', () => {
    const questions = generateQuestionsForModule('a1_family', 'mixed_challenge', 'en', mockUserData);
    expect(questions.length).toBeGreaterThan(1);
    const types = new Set(questions.map(q => q.type));
    // Should have variety of question types
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  it('maps module to correct CEFR level', () => {
    expect(getLevelOfModule('a1_family')).toBe('A1');
    expect(getLevelOfModule('alphabet')).toBe('A1');
  });
});

describe('Quiz Engine - Answer Validation', () => {
  it('accepts exact matches', () => {
    expect(isQuizAnswerAccepted('Rojbaş', 'Rojbaş')).toBe(true);
    expect(isQuizAnswerAccepted('spas', 'spas')).toBe(true);
  });

  it('handles case insensitivity and extra whitespace', () => {
    expect(isQuizAnswerAccepted('  rojbaş  ', 'Rojbaş')).toBe(true);
    expect(isQuizAnswerAccepted('SPAS', 'spas')).toBe(true);
  });

  it('handles punctuation and diacritics resilience', () => {
    expect(isQuizAnswerAccepted('rojbas', 'rojbaş')).toBe(true);
    expect(isQuizAnswerAccepted('çawa', 'cawa')).toBe(true);
  });

  it('rejects incorrect answers', () => {
    expect(isQuizAnswerAccepted('av', 'nan')).toBe(false);
    expect(isQuizAnswerAccepted('hello', 'goodbye')).toBe(false);
  });
});

describe('Quiz Engine - Gamification Rewards', () => {
  it('calculates XP and gems per the scarce-gem economy', () => {
    // ECONOMY REDESIGN: quizzes pay XP freely but gems only for rare feats
    // (perfect run +5, level-up +15). Daily missions are the gem income.
    const perfectScore = calculateQuizRewards(10, 10, 100, 15);
    expect(perfectScore.xpGained).toBeGreaterThan(50);
    expect(perfectScore.gemsGained).toBeGreaterThanOrEqual(5); // perfect nod

    const halfScore = calculateQuizRewards(5, 10, 100, 15);
    expect(halfScore.xpGained).toBeLessThan(perfectScore.xpGained);
    expect(halfScore.gemsGained).toBeLessThanOrEqual(15); // at most a level-up bonus

    const zeroScore = calculateQuizRewards(0, 10, 100, 15);
    expect(zeroScore.xpGained).toBe(0);
    expect(zeroScore.gemsGained).toBe(0); // no more completion allowance
  });
});

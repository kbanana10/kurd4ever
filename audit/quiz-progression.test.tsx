/**
 * quiz-progression.test.tsx
 *
 * Regression tests for the DOUBLE-ADVANCE bug: clicking "Next" while the
 * MCQ auto-advance timer was pending (or double-clicking Next/Verify)
 * used to advance the quiz by TWO questions instead of one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizEngine } from '../src/features/quiz/hooks/useQuizEngine';
import { UserData } from '../src/models/user';

vi.mock('../src/features/audio/hooks/useAudio', () => ({
  stopAllActiveAudio: vi.fn(),
  playSuccessSound: vi.fn(),
  playFailureSound: vi.fn(),
  playCompleteSound: vi.fn(),
}));

const userData: UserData = {
  xp: 100, level: 1, gems: 50, streak: 1, wordsLearned: 5,
  completedLessons: [], wrongAnswersHistory: [], lastActive: Date.now(),
  createdAt: Date.now(), updatedAt: Date.now(), recentSearches: [],
  favorites: [], reviewDeck: {},
} as unknown as UserData;

function setup() {
  return renderHook(() =>
    useQuizEngine({
      moduleId: 'a1_family',
      language: 'en',
      updateUserProgress: vi.fn().mockResolvedValue(undefined),
      updateUserData: vi.fn().mockResolvedValue(undefined),
      userData,
      navigateBack: vi.fn(),
    })
  );
}

describe('Quiz progression — single-step guarantee', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('auto-advance after an answer moves exactly +1 question', async () => {
    const { result } = setup();
    expect(result.current.questions.length).toBeGreaterThan(1);
    expect(result.current.currentIndex).toBe(0);

    const q = result.current.questions[0];
    await act(async () => {
      await result.current.handleOptionSelect(q.correctAnswer);
    });
    // feedback shown, not yet advanced
    expect(result.current.currentIndex).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(5000); // flush the 1400/2200ms auto-advance
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('manual Next during a pending auto-advance timer advances +1, not +2', async () => {
    const { result } = setup();
    const q = result.current.questions[0];

    await act(async () => {
      await result.current.handleOptionSelect(q.correctAnswer);
    });
    expect(result.current.currentIndex).toBe(0);

    // User clicks "Next Question" BEFORE the auto-advance timer fires
    act(() => {
      result.current.handleNext();
    });
    expect(result.current.currentIndex).toBe(1);

    // The stale auto-advance timer must have been cancelled: flushing all
    // timers must NOT skip to question 3.
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('a rapid double-click on Next advances +1 only', async () => {
    const { result } = setup();
    const q = result.current.questions[0];

    await act(async () => {
      await result.current.handleOptionSelect(q.correctAnswer);
    });

    act(() => {
      // double-click lands in the same tick, before any re-render
      result.current.handleNext();
      result.current.handleNext();
      result.current.handleNext();
    });
    expect(result.current.currentIndex).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('double submission of the same answer scores only once', async () => {
    const { result } = setup();
    const q = result.current.questions[0];

    await act(async () => {
      // two answer submissions racing in the same tick
      const p1 = result.current.handleOptionSelect(q.correctAnswer);
      const p2 = result.current.handleOptionSelect(q.correctAnswer);
      await Promise.all([p1, p2]);
    });
    expect(result.current.score).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    // and the double submission advanced exactly one question
    expect(result.current.currentIndex).toBe(1);
  });

  it('advancing through every question ends the quiz exactly once', async () => {
    const { result } = setup();
    const total = result.current.questions.length;

    for (let i = 0; i < total; i++) {
      const q = result.current.questions[result.current.currentIndex];
      await act(async () => {
        await result.current.handleOptionSelect(q.correctAnswer);
      });
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
    }
    expect(result.current.isFinished).toBe(true);
    expect(result.current.score).toBe(total);
  });
});

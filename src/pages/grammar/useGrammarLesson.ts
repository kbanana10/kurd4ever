/**
 * useGrammarLesson.ts — per-exercise engine for a Grammar lesson.
 *
 * Mirrors the quiz engine's persistence contract: every checked exercise
 * grades into the shared SM-2 `reviewDeck` (key `grammar-<topicId>:<nodeId>`)
 * and, once every exercise is tried at least once, the lesson id is appended
 * to `completedLessons` and XP is awarded through `updateUserProgress`.
 *
 * Deliberately simpler than the quiz engine: no hearts, no timer grades.
 * Correct-first-try is graded 'good'; a wrong answer is graded 'again'.
 */

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import type { GrammarLesson } from '../../data/grammar/types';
import {
  checkExerciseAnswer,
  grammarExerciseNodeKey,
  grammarLessonKey,
  type GrammarAnswer,
} from '../../lib/grammar/grammarScoring';
import {
  gradeFromAnswer,
  recordReview,
  type RecallGrade,
} from '../../services/SpacedRepetitionService';
import {
  playSuccessSound,
  playFailureSound,
  playCompleteSound,
} from '../../features/audio/hooks/useAudio';

export type GrammarPhase = 'practicing' | 'finished';

const NO_LESSON: GrammarLesson = {
  topicId: '',
  xp: 0,
  title: { en: '', ar: '', ku: '' },
  description: { en: '', ar: '', ku: '' },
  concepts: [],
  exercises: [],
};

export function useGrammarLesson(lesson: GrammarLesson | null) {
  const { userData, updateUserData, updateUserProgress } = useAuth();
  const resolved = lesson ?? NO_LESSON;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [phase, setPhase] = useState<GrammarPhase>('practicing');
  const [checked, setChecked] = useState<boolean | null>(null);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  const total = resolved.exercises.length;
  const exercise = resolved.exercises[index] ?? null;

  /** True for every exercise that has been answered at least once this visit. */
  const seenCount = checkCount;
  const allSeen = total > 0 && seenCount >= total;

  const checkedCorrect = checked === true;

  const gradeCurrent = useCallback((): RecallGrade => {
    // Never self-rate: correct = 'good', incorrect = 'again'. No timing data
    // is tracked here, so the slow/fast thresholds of the quiz do not apply.
    return gradeFromAnswer({ correct: checkedCorrect });
  }, [checkedCorrect]);

  const recordDeckReview = useCallback(
    async (ex: NonNullable<typeof exercise>, correct: boolean) => {
      if (!userData || !updateUserData) return;
      const nodeKey = grammarExerciseNodeKey(resolved.topicId, ex.nodeId);
      const grade: RecallGrade = gradeFromAnswer({ correct });
      const updatedDeck = recordReview(userData.reviewDeck ?? {}, nodeKey, grade);
      try {
        await updateUserData({ reviewDeck: updatedDeck });
      } catch {
        // Remaining local-only surface: animations/UI state must never hang on IO.
      }
    },
    [userData, updateUserData, resolved.topicId]
  );

  const completeLesson = useCallback(async () => {
    if (!userData) return;
    const key = grammarLessonKey(resolved.topicId);
    const completed = [...(userData.completedLessons ?? [])];
    if (!completed.includes(key)) completed.push(key);

    const gained = Math.max(1, Math.round(resolved.xp * (score / Math.max(1, total))));
    setEarnedXp(gained);

    try {
      await updateUserData({ completedLessons: completed });
    } catch {
      // Swallow storage failure; the in-memory state still advances below.
    }
    // XP is not words-learned — pass 0 so vocabulary counters stay accurate.
    try {
      await updateUserProgress(gained, 0, false, 0);
    } catch {
      // Profile/gamification storage failure must not block the lesson result.
    }
    playCompleteSound();
  }, [userData, updateUserData, updateUserProgress, resolved, score, total]);

  const checkAnswer = useCallback(
    async (answer: GrammarAnswer) => {
      if (!exercise || checked !== null) return;
      const result = checkExerciseAnswer(exercise, answer);
      const correct = result.correct;
      setChecked(correct);
      setCheckCount((n) => n + 1);
      if (correct) {
        setScore((s) => s + 1);
        playSuccessSound();
      } else {
        playFailureSound();
      }
      await recordDeckReview(exercise, correct);
    },
    [exercise, checked, recordDeckReview]
  );

  const nextExercise = useCallback(() => {
    setChecked(null);
    if (index + 1 < total) {
      setIndex((i) => i + 1);
    } else {
      setPhase('finished');
      void completeLesson();
    }
  }, [index, total, completeLesson]);

  const restart = useCallback(() => {
    setIndex(0);
    setScore(0);
    setCheckCount(0);
    setChecked(null);
    setEarnedXp(null);
    setPhase('practicing');
  }, []);

  /** Progress snapshot for the header bar, in items. */
  const progress = useMemo(() => ({ index, total }), [index, total]);

  return {
    exercise,
    index,
    total,
    score,
    phase,
    checked,
    checkedCorrect,
    allSeen,
    earnedXp,
    progress,
    checkAnswer,
    nextExercise,
    restart,
  };
}

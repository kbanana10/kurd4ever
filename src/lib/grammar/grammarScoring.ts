/**
 * grammarScoring.ts — validation, scoring and progress helpers for the
 * Grammar module.
 *
 * Answer correctness reuses the quiz engine's diacritic-tolerant normaliser
 * (`isQuizAnswerAccepted`) so fill-in and translate inputs behave exactly like
 * the quiz's writing checks. Progress flows through the same SM-2
 * `ReviewDeck` used by the quiz and the RecallButton:
 *
 *   - lesson completion id      -> `grammar-<topicId>` in `completedLessons`
 *   - per-exercise review node  -> `grammar-<topicId>:<nodeId>` in `reviewDeck`
 *
 * "Learned" (for the hub progress bars) means `repetitions > 0`, the same
 * signal used everywhere else in the app.
 */

import { isQuizAnswerAccepted } from '../../features/quiz/utils/answerUtils';
import type { GrammarExercise, GrammarLesson } from '../../data/grammar/types';
import type { ReviewDeck } from '../../services/SpacedRepetitionService';

/** Union of learner submissions, one variant per exercise type. */
export type GrammarAnswer =
  | { kind: 'choice'; value: string | null }
  | { kind: 'text'; value: string }
  | { kind: 'match'; rightIndexes: readonly number[] }
  | { kind: 'reorder'; words: readonly string[] };

export interface GrammarCheckResult {
  correct: boolean;
  /** Normalised text compare value for text answers ('' otherwise). */
  compareValue: string;
}

export function grammarLessonKey(topicId: string): string {
  return `grammar-${topicId}`;
}

export function grammarExerciseNodeKey(topicId: string, nodeId: string): string {
  return `${grammarLessonKey(topicId)}:${nodeId}`;
}

export function isLessonCompleted(
  lesson: GrammarLesson,
  completedLessons: readonly string[] | undefined
): boolean {
  return !!completedLessons && completedLessons.includes(grammarLessonKey(lesson.topicId));
}

/** Fraction (0..1) of a lesson's exercises whose deck nodes are learned. */
export function lessonCompletionRatio(lesson: GrammarLesson, deck: ReviewDeck): number {
  const total = lesson.exercises.length;
  if (total === 0) return 0;
  let learned = 0;
  for (const exercise of lesson.exercises) {
    const item = deck[grammarExerciseNodeKey(lesson.topicId, exercise.nodeId)];
    if (item && item.repetitions > 0) learned += 1;
  }
  return learned / total;
}

/** Full numeric percentage for a lesson (0..100), rounded to the unit. */
export function lessonCompletionPercent(lesson: GrammarLesson, deck: ReviewDeck): number {
  return Math.round(lessonCompletionRatio(lesson, deck) * 100);
}

export function checkChoice(exercise: GrammarExercise, selected: string | null): boolean {
  return selected !== null && selected === exercise.correctAnswer;
}

export function checkText(exercise: GrammarExercise, typed: string): boolean {
  const value = typed.trim();
  if (!value) return false;
  const accepted = [exercise.correctAnswer, ...(exercise.variants ?? [])];
  return accepted.some((answer) => isQuizAnswerAccepted(value, answer));
}

export function checkReorder(exercise: GrammarExercise, words: readonly string[]): boolean {
  const canonical = exercise.sentenceWords ?? [];
  if (canonical.length === 0 || words.length !== canonical.length) return false;
  return words.every((word, i) => word === canonical[i]);
}

export function checkMatch(exercise: GrammarExercise, rightIndexes: readonly number[]): boolean {
  const pairs = exercise.pairs ?? [];
  if (pairs.length === 0 || rightIndexes.length !== pairs.length) return false;
  return pairs.every((_, leftIndex) => rightIndexes[leftIndex] === leftIndex);
}

export function checkExerciseAnswer(
  exercise: GrammarExercise,
  answer: GrammarAnswer
): GrammarCheckResult {
  switch (answer.kind) {
    case 'choice':
      return { correct: checkChoice(exercise, answer.value), compareValue: '' };
    case 'text':
      return { correct: checkText(exercise, answer.value), compareValue: answer.value.trim() };
    case 'reorder':
      return { correct: checkReorder(exercise, answer.words), compareValue: '' };
    case 'match':
      return { correct: checkMatch(exercise, answer.rightIndexes), compareValue: '' };
  }
}

/** Fisher–Yates shuffle returning a new array (pure; used for chip/answer pools). */
export function grammarShuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * index.ts — registry of Grammar lessons.
 *
 * The hub and the lesson route read from this list so the five sub-category
 * cards, their order and their progress stay in one place.
 */

import type { GrammarLesson } from './types';
import { pronounsLesson } from './pronouns';
import { verbsLesson } from './verbs';
import { nounsLesson } from './nouns';
import { sentenceStructureLesson } from './sentenceStructure';
import { prepositionsLesson } from './prepositions';

export { pronounsLesson } from './pronouns';
export { verbsLesson } from './verbs';
export { nounsLesson } from './nouns';
export { sentenceStructureLesson } from './sentenceStructure';
export { prepositionsLesson } from './prepositions';
export * from './types';

/** Ordered exactly as the hub renders the cards. */
export const GRAMMAR_LESSONS: readonly GrammarLesson[] = [
  pronounsLesson,
  verbsLesson,
  nounsLesson,
  sentenceStructureLesson,
  prepositionsLesson,
];

function slugEquals(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/**
 * Resolve a lesson by its route id (`pronouns`) or by any of its localized
 * titles — e.g. shared/typed links like `/grammar/cînavk` open the same lesson
 * as `/grammar/pronouns`. Localized titles may not survive a URL round-trip,
 * so the comparison is purposefully exact and case/diacritic-sensitive.
 */
export function getGrammarLesson(topicId: string | undefined): GrammarLesson | null {
  if (!topicId) return null;
  const raw = (() => {
    try {
      return decodeURIComponent(topicId);
    } catch {
      return topicId;
    }
  })().trim();
  if (!raw) return null;

  return (
    GRAMMAR_LESSONS.find((lesson) => slugEquals(lesson.topicId, raw)) ??
    GRAMMAR_LESSONS.find(
      (lesson) =>
        slugEquals(lesson.title.ku, raw) ||
        slugEquals(lesson.title.ar, raw) ||
        slugEquals(lesson.title.en, raw)
    ) ??
    null
  );
}

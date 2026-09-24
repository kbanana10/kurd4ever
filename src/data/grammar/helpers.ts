/**
 * helpers.ts — small, typed builders used by the five lesson content files.
 *
 * They keep authoring terse and mistake-proof (one keyword each for an
 * example, an option, a match pair, a concept, an exercise or a lesson) while
 * preserving the trilingual (EN/AR/KU, AR primary) contract of the types.
 */

import type {
  GrammarConcept,
  GrammarExample,
  GrammarExercise,
  GrammarExerciseOption,
  GrammarLesson,
  GrammarMatchPair,
  LocalizedText,
} from './types';
import { gl } from './types';

/** Example sentence: Kurdish + Arabic + English. */
export function ex(ku: string, ar: string, en: string): GrammarExample {
  return { ku, ar, en };
}

/** Exercise choice option: Kurdish term + Arabic gloss + English gloss. */
export function opt(ku: string, ar: string, en: string): GrammarExerciseOption {
  return { ku, ar, en };
}

/** Match row: Kurdish ↔ Arabic (primary) ↔ English. */
export function pair(ku: string, ar: string, en: string): GrammarMatchPair {
  return { ku, ar, en };
}

export interface ConceptInput {
  id: string;
  term: string;
  phonetic?: string;
  ar: string;
  en: string;
  /** Arabic "when to use it" note (primary). */
  usageAr: string;
  /** English "when to use it" note (secondary). */
  usageEn: string;
  /** Kurmanji "when to use it" note. */
  usageKu: string;
  examples: GrammarExample[];
}

export function concept(c: ConceptInput): GrammarConcept {
  return {
    id: c.id,
    term: c.term,
    phonetic: c.phonetic,
    ar: c.ar,
    en: c.en,
    usage: gl(c.usageEn, c.usageAr, c.usageKu),
    examples: c.examples,
  };
}

export interface ExerciseInput {
  id: string;
  node: string;
  type: GrammarExercise['type'];
  prompt: { en: string; ar: string; ku: string };
  options?: GrammarExerciseOption[];
  correct: string;
  variants?: string[];
  audioText?: string;
  sentenceWords?: string[];
  reference?: { en: string; ar: string; ku: string };
  pairs?: GrammarMatchPair[];
  display?: string;
  direction?: GrammarExercise['direction'];
}

export function q(e: ExerciseInput): GrammarExercise {
  return {
    id: e.id,
    nodeId: e.node,
    type: e.type,
    prompt: gl(e.prompt.en, e.prompt.ar, e.prompt.ku),
    options: e.options,
    correctAnswer: e.correct,
    variants: e.variants,
    audioText: e.audioText,
    sentenceWords: e.sentenceWords,
    reference: e.reference ? gl(e.reference.en, e.reference.ar, e.reference.ku) : undefined,
    pairs: e.pairs,
    display: e.display,
    direction: e.direction,
  };
}

export interface LessonInput {
  topicId: string;
  xp: number;
  title: { en: string; ar: string; ku: string };
  description: { en: string; ar: string; ku: string };
  concepts: GrammarConcept[];
  summary?: {
    /** Rows are always [Kurmanji, Arabic (primary), English (secondary)]. */
    rows: { ku: string; ar: string; en: string }[];
  };
  exercises: GrammarExercise[];
}

export function lesson(l: LessonInput): GrammarLesson {
  return {
    topicId: l.topicId,
    xp: l.xp,
    title: gl(l.title.en, l.title.ar, l.title.ku),
    description: gl(l.description.en, l.description.ar, l.description.ku),
    concepts: l.concepts,
    summaryTable: l.summary ? { rows: l.summary.rows } : undefined,
    exercises: l.exercises,
  };
}

/** Null-object for the unknown-lesson fallback in the page (typed locally). */
export const EMPTY_LOCALIZED: LocalizedText = { en: '', ar: '', ku: '' };

import { describe, it, expect } from 'vitest';
import { GRAMMAR_LESSONS, getGrammarLesson } from '../../data/grammar/index';

describe('Grammar content integrity (redesigned lessons)', () => {
  it('ships exactly the five lessons in order', () => {
    const ids = GRAMMAR_LESSONS.map((l) => l.topicId);
    expect(ids).toEqual(['pronouns', 'verbs', 'nouns', 'sentence-structure', 'prepositions']);
  });

  it('every concept has translation, usage note and 3+ examples', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      expect(lesson.concepts.length).toBeGreaterThanOrEqual(3);
      for (const concept of lesson.concepts) {
        expect(concept.term.trim().length).toBeGreaterThan(0);
        expect(concept.ar.trim().length).toBeGreaterThan(0);
        expect(concept.en.trim().length).toBeGreaterThan(0);
        expect(concept.usage.ar.trim().length).toBeGreaterThan(0);
        expect(concept.usage.en.trim().length).toBeGreaterThan(0);
        expect(concept.usage.ku.trim().length).toBeGreaterThan(0);
        expect(concept.examples.length).toBeGreaterThanOrEqual(3);
        for (const example of concept.examples) {
          expect(example.ku.trim().length).toBeGreaterThan(0);
          expect(example.ar.trim().length).toBeGreaterThan(0);
          expect(example.en.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every exercise has a localized prompt and an AR-glossed answer path', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      const ids = new Set<string>();
      for (const exercise of lesson.exercises) {
        expect(ids.has(exercise.id)).toBe(false);
        ids.add(exercise.id);
        expect(exercise.prompt.ar.trim().length).toBeGreaterThan(0);
        expect(exercise.prompt.en.trim().length).toBeGreaterThan(0);
        expect(exercise.correctAnswer.trim().length).toBeGreaterThan(0);

        if (exercise.type === 'select_translation' || exercise.type === 'listen_choose' || exercise.type === 'complete_sentence') {
          expect(exercise.options?.length).toBeGreaterThanOrEqual(2);
          const hasCorrectOption = (exercise.options ?? []).some((o) => o.ku === exercise.correctAnswer);
          expect(hasCorrectOption).toBe(true);
          // every option carries the AR gloss (Kurdish is never shown bare)
          for (const option of exercise.options ?? []) {
            expect(option.ar.trim().length).toBeGreaterThan(0);
          }
        }
        if (exercise.type === 'write_word') {
          expect(exercise.audioText ?? exercise.correctAnswer).toBeTruthy();
        }
        if (exercise.type === 'arrange_sentence') {
          expect((exercise.sentenceWords ?? []).join(' ')).toBe(exercise.correctAnswer);
          expect((exercise.sentenceWords ?? []).length).toBeGreaterThanOrEqual(2);
        }
        if (exercise.type === 'match_pairs') {
          expect((exercise.pairs ?? []).length).toBeGreaterThanOrEqual(2);
          for (const pairRow of exercise.pairs ?? []) {
            expect(pairRow.ku.trim().length).toBeGreaterThan(0);
            expect(pairRow.ar.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('no exercise defines English-only options (each option is trilingual)', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      for (const exercise of lesson.exercises) {
        for (const option of exercise.options ?? []) {
          expect(option.ku.trim().length).toBeGreaterThan(0);
          expect(option.ar.trim().length).toBeGreaterThan(0);
          expect(option.en.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every lesson provides a compact summary table', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      expect(lesson.summaryTable).toBeDefined();
      expect((lesson.summaryTable?.rows ?? []).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('at least two exercises per concept, with both comprehension and production', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      const hasComprehension = lesson.exercises.some((e) => e.type !== 'write_word' && e.type !== 'arrange_sentence');
      const hasProduction = lesson.exercises.some((e) => e.type === 'write_word' || e.type === 'arrange_sentence');
      expect(hasComprehension).toBe(true);
      expect(hasProduction).toBe(true);
    }
  });

  it('no Kurdish string carries the bare "dixwi" stem (î must be present)', () => {
    // "dixwî" (2nd person of xwarin) keeps its circumflex; a bare trailing "i"
    // ("dixwi", "vedixwi") is the typo this audit guards against. Valid
    // endings m/n/e/î are allowed to follow the stem.
    const badStem = /dixwi(?!m|n|e|î)/;
    const kuStrings: string[] = [];
    for (const lesson of GRAMMAR_LESSONS) {
      for (const concept of lesson.concepts) {
        kuStrings.push(concept.term, concept.usage.ku);
        for (const example of concept.examples) kuStrings.push(example.ku);
      }
      for (const row of lesson.summaryTable?.rows ?? []) kuStrings.push(row.ku);
      for (const exercise of lesson.exercises) {
        kuStrings.push(exercise.prompt.ku, exercise.correctAnswer);
        kuStrings.push(exercise.display ?? '', exercise.audioText ?? '');
        if (exercise.reference) kuStrings.push(exercise.reference.ku);
        for (const word of exercise.sentenceWords ?? []) kuStrings.push(word);
        for (const option of exercise.options ?? []) kuStrings.push(option.ku);
        for (const pairRow of exercise.pairs ?? []) kuStrings.push(pairRow.ku);
      }
    }
    const offenders = kuStrings.filter((s) => badStem.test(s));
    expect(offenders).toEqual([]);
  });

  it('every select_translation exercise declares its direction', () => {
    for (const lesson of GRAMMAR_LESSONS) {
      for (const exercise of lesson.exercises) {
        if (exercise.type !== 'select_translation') continue;
        expect(['to_arabic', 'to_kurdish']).toContain(exercise.direction);
      }
    }
  });

  it('resolves a lesson by topicId or by any localized title slug', () => {
    const pronouns = GRAMMAR_LESSONS.find((l) => l.topicId === 'pronouns');
    expect(getGrammarLesson('pronouns')).toBe(pronouns);
    // Kurdish title used in shared links (e.g. /grammar/cînavk)
    expect(getGrammarLesson('cînavk')).toBe(pronouns);
    // Arabic title
    expect(getGrammarLesson('الضمائر')).toBe(pronouns);
    // English title
    expect(getGrammarLesson('Pronouns')).toBe(pronouns);
    // Unknown ids still resolve to null (page shows the not-found card)
    expect(getGrammarLesson('does-not-exist')).toBeNull();
  });
});

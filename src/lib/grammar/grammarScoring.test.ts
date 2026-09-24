import { describe, it, expect } from 'vitest';
import {
  checkChoice,
  checkText,
  checkReorder,
  checkMatch,
  checkExerciseAnswer,
  grammarLessonKey,
  grammarExerciseNodeKey,
  isLessonCompleted,
  lessonCompletionPercent,
  grammarShuffle,
  type GrammarAnswer,
} from './grammarScoring';
import { createReviewItem } from '../../services/SpacedRepetitionService';
import type { ReviewDeck } from '../../services/SpacedRepetitionService';
import type { GrammarExercise, GrammarLesson } from '../../data/grammar/types';

function loc(text: string) {
  return { en: text, ar: text, ku: text };
}

let nodeCounter = 0;
function nextNodeId(): string {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

function opt(ku: string, ar: string, en: string) {
  return { ku, ar, en };
}

function makeChoice(): GrammarExercise {
  return {
    id: 'q1',
    nodeId: nextNodeId(),
    type: 'select_translation',
    prompt: loc('Which one means I?'),
    direction: 'to_kurdish',
    options: [opt('Ez', 'أنا', 'I'), opt('Tu', 'أنتَ', 'you'), opt('Em', 'نحن', 'we')],
    correctAnswer: 'Ez',
  };
}

function makeText(correct: string, variants?: string[]): GrammarExercise {
  return {
    id: 'q2',
    nodeId: nextNodeId(),
    type: 'write_word',
    prompt: loc('Write the word'),
    audioText: correct,
    correctAnswer: correct,
    variants,
  };
}

function makeReorder(words: string[]): GrammarExercise {
  return {
    id: 'q3',
    nodeId: nextNodeId(),
    type: 'arrange_sentence',
    prompt: loc('Order the words'),
    sentenceWords: words,
    correctAnswer: words.join(' '),
  };
}

function makeMatch(pairs: { ku: string; ar: string; en: string }[]): GrammarExercise {
  return {
    id: 'q4',
    nodeId: nextNodeId(),
    type: 'match_pairs',
    prompt: loc('Match'),
    correctAnswer: pairs.map((p) => `${p.ku}=${p.ar}`).join(' / '),
    pairs,
  };
}

function makeLesson(exercises: GrammarExercise[]): GrammarLesson {
  return {
    topicId: 'pronouns',
    xp: 60,
    title: loc('Pronouns'),
    description: loc('Personal pronouns'),
    concepts: [],
    exercises,
  };
}

describe('grammar lesson keys', () => {
  it('namespaces lesson and exercise nodes under grammar-', () => {
    expect(grammarLessonKey('pronouns')).toBe('grammar-pronouns');
    expect(grammarExerciseNodeKey('pronouns', 'node-1')).toBe('grammar-pronouns:node-1');
  });

  it('detects completion by the namespaced id', () => {
    const lesson = makeLesson([makeChoice()]);
    expect(isLessonCompleted(lesson, ['grammar-pronouns'])).toBe(true);
    expect(isLessonCompleted(lesson, ['a1_family'])).toBe(false);
    expect(isLessonCompleted(lesson, undefined)).toBe(false);
  });
});

describe('choice checking', () => {
  it('accepts the exact matching option only', () => {
    expect(checkChoice(makeChoice(), 'Ez')).toBe(true);
    expect(checkChoice(makeChoice(), 'Tu')).toBe(false);
    expect(checkChoice(makeChoice(), null)).toBe(false);
  });
});

describe('text checking (write_word, diacritic-tolerant)', () => {
  it('accepts the canonical answer', () => {
    expect(checkText(makeText('naxwim'), 'naxwim')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(checkText(makeText('ez diçim'), 'Ez Diçim')).toBe(true);
  });

  it('tolerates missing diacritics (ê/î/ş/û/ç folding)', () => {
    expect(checkText(makeText('dixwîm'), 'dixwim')).toBe(true);
    expect(checkText(makeText('kitêba'), 'kitêba ')).toBe(true);
  });

  it('rejects an empty or blank input', () => {
    expect(checkText(makeText('nan'), '   ')).toBe(false);
  });

  it('rejects a wrong short answer, including wrong izafe endings', () => {
    expect(checkText(makeText('mala'), 'malê')).toBe(false);
    expect(checkText(makeText('min'), 'te')).toBe(false);
  });

  it('honours extra accepted variants', () => {
    const exercise = makeText('Ez im', ['ez im']);
    expect(checkText(exercise, 'ez im')).toBe(true);
  });
});

describe('reorder checking (arrange_sentence)', () => {
  it('accepts the canonical token order', () => {
    expect(checkReorder(makeReorder(['Ez', 'nan', 'dixwim']), ['Ez', 'nan', 'dixwim'])).toBe(true);
  });

  it('rejects any other order', () => {
    expect(checkReorder(makeReorder(['Ez', 'nan', 'dixwim']), ['nan', 'Ez', 'dixwim'])).toBe(false);
  });

  it('rejects a partial answer', () => {
    expect(checkReorder(makeReorder(['Ez', 'nan', 'dixwim']), ['Ez', 'nan'])).toBe(false);
  });
});

describe('match-pairs checking', () => {
  const pairs = [
    { ku: 'Ez', ar: 'أنا', en: 'I' },
    { ku: 'Tu', ar: 'أنتَ', en: 'you' },
    { ku: 'Em', ar: 'نحن', en: 'we' },
  ];

  it('accepts the identity pairing by canonical index', () => {
    expect(checkMatch(makeMatch(pairs), [0, 1, 2])).toBe(true);
  });

  it('rejects a swapped pairing', () => {
    expect(checkMatch(makeMatch(pairs), [1, 0, 2])).toBe(false);
  });

  it('rejects an incomplete pairing', () => {
    expect(checkMatch(makeMatch(pairs.slice(0, 2)), [0])).toBe(false);
  });
});

describe('checkExerciseAnswer dispatch', () => {
  it('routes each answer kind to the right checker', () => {
    const choice: GrammarAnswer = { kind: 'choice', value: 'Ez' };
    expect(checkExerciseAnswer(makeChoice(), choice).correct).toBe(true);

    const text: GrammarAnswer = { kind: 'text', value: 'min' };
    expect(checkExerciseAnswer(makeText('min'), text).correct).toBe(true);

    const reorder: GrammarAnswer = { kind: 'reorder', words: ['Ez', 'im'] };
    expect(checkExerciseAnswer(makeReorder(['Ez', 'im']), reorder).correct).toBe(true);

    const match: GrammarAnswer = { kind: 'match', rightIndexes: [0, 1] };
    const matchEx = makeMatch([
      { ku: 'Ez', ar: 'أنا', en: 'I' },
      { ku: 'Tu', ar: 'أنتَ', en: 'you' },
    ]);
    expect(checkExerciseAnswer(matchEx, match).correct).toBe(true);
  });
});

describe('lesson progress against the SM-2 deck', () => {
  it('reports 0% for an empty deck', () => {
    const lesson = makeLesson([makeChoice(), makeChoice()]);
    expect(lessonCompletionPercent(lesson, {})).toBe(0);
  });

  it('counts only nodes with repetitions > 0', () => {
    const exercises = [makeChoice(), makeChoice(), makeChoice()];
    const deck: ReviewDeck = {
      [grammarExerciseNodeKey('pronouns', exercises[0].nodeId)]: createReviewItem('x', 0),
    };
    const second = createReviewItem('y', 0);
    second.repetitions = 1;
    deck[grammarExerciseNodeKey('pronouns', exercises[1].nodeId)] = second;
    const third = createReviewItem('z', 0);
    third.repetitions = 1;
    deck[grammarExerciseNodeKey('pronouns', exercises[2].nodeId)] = third;

    expect(lessonCompletionPercent(makeLesson(exercises), deck)).toBe(67);
  });
});

describe('grammarShuffle', () => {
  it('returns a permutation of the input (same multiset)', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const out = grammarShuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort()).toEqual([...input].sort());
  });
});

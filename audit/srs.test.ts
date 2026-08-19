import { describe, it, expect } from 'vitest';
import {
  createReviewItem,
  scheduleNextReview,
  recordReview,
  getDueItems,
  countDue,
  getLeeches,
  gradeFromAnswer,
  getDeckStats,
  type ReviewDeck,
} from '../src/services/SpacedRepetitionService';

const DAY = 86_400_000;
const T0 = 1_700_000_000_000;

describe('SM-2 scheduler', () => {
  it('a new item is immediately due', () => {
    const it0 = createReviewItem('w1', T0);
    expect(it0.dueAt).toBe(T0);
    expect(it0.repetitions).toBe(0);
    expect(it0.easeFactor).toBe(2.5);
  });

  it('expands intervals 1d -> 6d -> ~15d on successive "good" recalls', () => {
    let it0 = createReviewItem('w1', T0);
    it0 = scheduleNextReview(it0, 'good', T0);
    expect(it0.intervalDays).toBe(1);

    it0 = scheduleNextReview(it0, 'good', T0 + DAY);
    expect(it0.intervalDays).toBe(6);

    it0 = scheduleNextReview(it0, 'good', T0 + 7 * DAY);
    expect(it0.intervalDays).toBeGreaterThanOrEqual(13);
    expect(it0.intervalDays).toBeLessThanOrEqual(17);
    console.log('interval growth 1 -> 6 ->', it0.intervalDays, 'days, ease', it0.easeFactor.toFixed(2));
  });

  it('"easy" grows faster than "hard"', () => {
    let easy = createReviewItem('e', T0);
    let hard = createReviewItem('h', T0);
    for (let i = 0; i < 4; i++) {
      easy = scheduleNextReview(easy, 'easy', T0 + i * DAY);
      hard = scheduleNextReview(hard, 'hard', T0 + i * DAY);
    }
    console.log('after 4 reviews  easy:', easy.intervalDays, 'd  hard:', hard.intervalDays, 'd');
    expect(easy.intervalDays).toBeGreaterThan(hard.intervalDays);
    expect(easy.easeFactor).toBeGreaterThan(hard.easeFactor);
  });

  it('a lapse resets repetitions, records the lapse, and re-queues within the session', () => {
    let it0 = createReviewItem('w', T0);
    it0 = scheduleNextReview(it0, 'good', T0);
    it0 = scheduleNextReview(it0, 'good', T0 + DAY);
    expect(it0.repetitions).toBe(2);

    it0 = scheduleNextReview(it0, 'again', T0 + 7 * DAY);
    expect(it0.repetitions).toBe(0);
    expect(it0.lapses).toBe(1);
    // ~10 minutes, not a full day — keeps the session responsive.
    expect(it0.dueAt - (T0 + 7 * DAY)).toBeLessThan(DAY);
    expect(it0.intervalDays).toBeLessThan(1);
  });

  it('ease factor never drops below the 1.3 floor', () => {
    let it0 = createReviewItem('w', T0);
    for (let i = 0; i < 30; i++) it0 = scheduleNextReview(it0, 'again', T0 + i * DAY);
    expect(it0.easeFactor).toBeGreaterThanOrEqual(1.3);
    console.log('ease after 30 failures:', it0.easeFactor);
  });

  it('interval is capped at one year', () => {
    let it0 = createReviewItem('w', T0);
    for (let i = 0; i < 40; i++) it0 = scheduleNextReview(it0, 'easy', T0 + i * DAY);
    expect(it0.intervalDays).toBeLessThanOrEqual(365);
  });

  it('never produces NaN from a corrupted stored item', () => {
    const corrupt: any = { id: 'x', easeFactor: NaN, intervalDays: NaN, repetitions: 0, dueAt: 0, lastReviewedAt: 0, lapses: 0 };
    const out = scheduleNextReview(corrupt, 'good', T0);
    expect(Number.isFinite(out.easeFactor)).toBe(true);
    expect(Number.isFinite(out.dueAt)).toBe(true);
  });
});

describe('Deck queries', () => {
  const deck: ReviewDeck = {
    a: { id: 'a', easeFactor: 2.5, intervalDays: 1, repetitions: 1, dueAt: T0 - 3 * DAY, lastReviewedAt: T0, lapses: 0 },
    b: { id: 'b', easeFactor: 2.5, intervalDays: 30, repetitions: 5, dueAt: T0 + 5 * DAY, lastReviewedAt: T0, lapses: 0 },
    c: { id: 'c', easeFactor: 1.3, intervalDays: 1, repetitions: 0, dueAt: T0 - DAY, lastReviewedAt: T0, lapses: 6 },
  };

  it('returns only due items, most overdue first', () => {
    const due = getDueItems(deck, T0);
    expect(due.map(d => d.id)).toEqual(['a', 'c']);
    expect(countDue(deck, T0)).toBe(2);
  });

  it('caps the session length', () => {
    const big: ReviewDeck = {};
    for (let i = 0; i < 100; i++) big[`w${i}`] = { ...deck.a, id: `w${i}` };
    expect(getDueItems(big, T0, 20)).toHaveLength(20);
  });

  it('identifies leeches', () => {
    expect(getLeeches(deck).map(l => l.id)).toEqual(['c']);
  });

  it('produces honest deck stats', () => {
    const s = getDeckStats(deck, T0);
    console.log('deck stats:', JSON.stringify(s));
    expect(s.total).toBe(3);
    expect(s.due).toBe(2);
    expect(s.mature).toBe(1);   // interval >= 21d
    expect(s.leeches).toBe(1);
  });

  it('recordReview inserts unseen ids without pre-seeding', () => {
    const out = recordReview({}, 'brand_new', 'good', T0);
    expect(out.brand_new.repetitions).toBe(1);
    expect(out.brand_new.intervalDays).toBe(1);
  });
});

describe('Auto-grading from quiz signals (no self-rating)', () => {
  it('wrong -> again', () => {
    expect(gradeFromAnswer({ correct: false })).toBe('again');
  });
  it('correct with hint -> hard', () => {
    expect(gradeFromAnswer({ correct: true, usedHint: true })).toBe('hard');
  });
  it('fast correct -> easy', () => {
    expect(gradeFromAnswer({ correct: true, responseMs: 1200 })).toBe('easy');
  });
  it('slow correct -> hard', () => {
    expect(gradeFromAnswer({ correct: true, responseMs: 12000 })).toBe('hard');
  });
  it('normal correct -> good', () => {
    expect(gradeFromAnswer({ correct: true, responseMs: 4000 })).toBe('good');
  });
});

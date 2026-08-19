/**
 * SpacedRepetitionService.ts
 *
 * AUDIT FIX — the single largest *educational* gap found in the audit.
 *
 * Before this, the app had no review scheduling of any kind. The only
 * "revision" affordance was `review_mistakes`, which simply replayed every item
 * the learner had ever answered incorrectly, forever, in insertion order. An
 * item answered correctly once was removed from the list permanently. That
 * means the app taught recognition-in-the-moment and did nothing to defend
 * against the forgetting curve — the entire reason Duolingo, Anki, Memrise and
 * Babbel schedule reviews.
 *
 * This implements SM-2 (SuperMemo 2), the algorithm behind Anki and the basis
 * of most modern language-app schedulers, adapted for a 4-point grading scale
 * that a quiz UI can produce without asking the learner to self-rate.
 *
 * Storage is intentionally a plain serialisable record so it rides along in the
 * existing `UserData` blob (localStorage -> IndexedDB -> Firestore) with no
 * schema migration and no new network calls.
 */

/** How well the learner recalled an item. Maps onto SM-2's 0..5 quality scale. */
export type RecallGrade =
  | 'again'  // wrong answer                        -> q=1, resets the interval
  | 'hard'   // correct but slow / needed a hint    -> q=3
  | 'good'   // correct at normal speed             -> q=4
  | 'easy';  // correct and fast                    -> q=5

const GRADE_QUALITY = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
} satisfies Record<RecallGrade, number>;

export interface ReviewItem {
  /** Vocabulary/lesson-word id. */
  id: string;
  /** SM-2 ease factor. Starts at 2.5, floors at 1.3 (an item you keep failing). */
  easeFactor: number;
  /** Current inter-repetition interval, in days. */
  intervalDays: number;
  /** Number of consecutive successful recalls. Reset to 0 on a lapse. */
  repetitions: number;
  /** Epoch ms when this item next becomes due. */
  dueAt: number;
  /** Epoch ms of the last review. */
  lastReviewedAt: number;
  /** Total times this item has ever lapsed — used to surface "leeches". */
  lapses: number;
}

/** Named owner contract for the SM-2 deck (anti-slop: no open Record alias). */
export interface ReviewDeck {
  [wordId: string]: ReviewItem;
}

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

/** A brand-new, never-reviewed item. */
export function createReviewItem(id: string, now: number = Date.now()): ReviewItem {
  return {
    id,
    easeFactor: DEFAULT_EASE,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now,
    lastReviewedAt: 0,
    lapses: 0,
  };
}

/**
 * Apply one SM-2 review step.
 *
 * Pure function: returns a new item, never mutates. That keeps it trivially
 * unit-testable and safe to call from a reducer or an optimistic UI update.
 */
export function scheduleNextReview(
  item: ReviewItem,
  grade: RecallGrade,
  now: number = Date.now()
): ReviewItem {
  const q = GRADE_QUALITY[grade];
  const failed = q < 3;

  // Ease factor update (standard SM-2 formula), clamped to a sane floor.
  const rawEase = item.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const easeFactor = Math.max(MIN_EASE, Number.isFinite(rawEase) ? rawEase : DEFAULT_EASE);

  let repetitions: number;
  let intervalDays: number;

  if (failed) {
    // Lapse: the item goes back to the front of the queue (same-session retry
    // in ~10 minutes rather than a full day, which is what Anki does and what
    // keeps a quiz session feeling responsive).
    repetitions = 0;
    intervalDays = 10 / (60 * 24);
  } else {
    repetitions = item.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(item.intervalDays * easeFactor);
    // Never schedule further out than a year.
    intervalDays = Math.min(intervalDays, 365);
  }

  return {
    ...item,
    easeFactor,
    repetitions,
    intervalDays,
    dueAt: now + intervalDays * DAY_MS,
    lastReviewedAt: now,
    lapses: item.lapses + (failed ? 1 : 0),
  };
}

/** Convenience: grade an item that may not exist in the deck yet. */
export function recordReview(
  deck: ReviewDeck,
  id: string,
  grade: RecallGrade,
  now: number = Date.now()
): ReviewDeck {
  const existing = deck[id] ?? createReviewItem(id, now);
  return { ...deck, [id]: scheduleNextReview(existing, grade, now) };
}

/**
 * Items due for review, most-overdue first.
 * `limit` keeps a session short enough to actually be completed (Duolingo and
 * Anki both cap the daily queue for exactly this reason).
 */
export function getDueItems(deck: ReviewDeck, now: number = Date.now(), limit = 20): ReviewItem[] {
  return Object.values(deck)
    .filter(it => it.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit);
}

/** Count without materialising the sorted array — used for the badge on the tab. */
export function countDue(deck: ReviewDeck, now: number = Date.now()): number {
  let n = 0;
  for (const id in deck) if (deck[id].dueAt <= now) n++;
  return n;
}

/**
 * "Leeches": items the learner keeps failing. Surfacing these lets the UI offer
 * a different treatment (show the example sentence, slow audio, or suspend the
 * item) instead of grinding the learner down — a well-documented retention killer.
 */
export function getLeeches(deck: ReviewDeck, threshold = 4): ReviewItem[] {
  return Object.values(deck)
    .filter(it => it.lapses >= threshold)
    .sort((a, b) => b.lapses - a.lapses);
}

/**
 * Derive a grade from what the quiz already knows, so the learner is never
 * asked to self-rate (self-rating is the main reason SRS apps feel like work).
 */
export function gradeFromAnswer(opts: {
  correct: boolean;
  usedHint?: boolean;
  responseMs?: number;
  /** Above this, treat a correct answer as "hard". Default 8s. */
  slowThresholdMs?: number;
  /** Below this, treat a correct answer as "easy". Default 2.5s. */
  fastThresholdMs?: number;
}): RecallGrade {
  const { correct, usedHint = false, responseMs, slowThresholdMs = 8000, fastThresholdMs = 2500 } = opts;
  if (!correct) return 'again';
  if (usedHint) return 'hard';
  if (responseMs !== undefined && Number.isFinite(responseMs)) {
    if (responseMs <= fastThresholdMs) return 'easy';
    if (responseMs >= slowThresholdMs) return 'hard';
  }
  return 'good';
}

/** Snapshot for the profile/stats screen. */
export function getDeckStats(deck: ReviewDeck, now: number = Date.now()) {
  const items = Object.values(deck);
  const mature = items.filter(i => i.intervalDays >= 21).length; // Anki's "mature" cutoff
  const young = items.filter(i => i.intervalDays > 0 && i.intervalDays < 21).length;
  const unseen = items.filter(i => i.repetitions === 0).length;
  return {
    total: items.length,
    due: countDue(deck, now),
    mature,
    young,
    unseen,
    leeches: getLeeches(deck).length,
    /** Rough "known words" figure that is honest, unlike a raw answer counter. */
    retainedWords: mature + young,
  };
}

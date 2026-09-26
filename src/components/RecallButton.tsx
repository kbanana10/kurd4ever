import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, Eye } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { recordReview, type ReviewDeck, type RecallGrade } from '../services/SpacedRepetitionService';
import { cn } from '../utils/cn';

/**
 * RecallButton.tsx — lightweight inline self-check for browse pages.
 *
 * The quiz engine is the app's full facts-checker; this is deliberately NOT a
 * mini-quiz. It is a two-step affordance the learner can tap while browsing
 * (Alphabet, Numbers, Colors, Vocabulary rows):
 *
 *   ✓ "Knew it"   → grades `good` into the existing SM-2 reviewDeck
 *   ↻ "Again"     → grades `again` (reschedules for near-term re-review)
 *
 * Grade persistence mirrors the quiz engine exactly: `recordReview` over the
 * current `userData.reviewDeck`, then `updateUserData({ reviewDeck })`. That
 * means every self-check here feeds the SAME deck the quizzes use, so the
 * Hub's progress bars and the review queues stay honest. No new tracking.
 */
interface RecallButtonProps {
  /** Content id — the same id the quiz engine records into reviewDeck. */
  wordId: string;
  className?: string;
  /** Compact treatment used on word rows. `block` reserves room for a hint. */
  size?: 'sm' | 'block';
}

type RecallStatus = 'knew' | 'again' | null;

export function RecallButton({ wordId, className, size = 'sm' }: RecallButtonProps) {
  const { userData, updateUserData, language } = useAuth();
  const deck: ReviewDeck = userData?.reviewDeck ?? {};
  const item = deck[wordId];
  // CONSISTENCY GUARD: the quiz engine checks the deck object for the id in
  // place; re-read it after every render so a stale capture can't double-apply.
  const [flash, setFlash] = useState<RecallStatus>(null);
  const flashTimerRef = useRef<number | null>(null);

  // Derive the persisted status from the deck; a transient "flash" from the
  // last tap briefly overrides it for immediate feedback before the async
  // profile write lands and the deck-derived state settles.
  // SAFETY: deck values are ReviewItem-shaped; `repetitions` may be missing
  // only for malformed legacy blobs, in which case `> 0` is safely false.
  const persisted: RecallStatus = item ? (item.repetitions > 0 ? 'knew' : 'again') : null;
  const status: RecallStatus = flash ?? persisted;

  useEffect(() => () => {
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
  }, []);

  const handleGrade = (grade: RecallGrade) => {
    const updated = recordReview(deck, wordId, grade);
    // FIRE-AND-FORGET: the recall self-check must never block the UI on the
    // async profile write. updateUserData persists via the app's existing
    // offline/online pipeline.
    void updateUserData({ reviewDeck: updated });
    setFlash(grade === 'good' ? 'knew' : 'again');
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 1600);
  };

  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const knewLabel = isKu ? 'Min zanîbû' : isAr ? 'حفظتها' : 'Knew it';
  const againLabel = isKu ? 'Dîsa' : isAr ? 'أعدها' : 'Again';

  const getsAnEdge = size === 'block';

  return (
    <div
      className={cn('inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 p-0.5', className)}
      role="group"
      aria-label={isKu ? 'Xwe-ceribandinê' : isAr ? 'اختبر حفظك' : 'Self-check'}
    >
      <button
        type="button"
        onClick={() => handleGrade('good')}
        aria-pressed={status === 'knew'}
        aria-label={`${knewLabel}${wordId ? ` — ${wordId}` : ''}`}
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-1.5 min-h-[36px] text-[10px] font-black transition-colors cursor-pointer border-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          status === 'knew'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
        )}
      >
        <Check className={cn('w-3.5 h-3.5', status === 'knew' && 'fill-emerald-500 text-emerald-600 dark:text-emerald-400')} />
        <span>{knewLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => handleGrade('again')}
        aria-pressed={status === 'again'}
        aria-label={`${againLabel}${wordId ? ` — ${wordId}` : ''}`}
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-1.5 min-h-[36px] text-[10px] font-black transition-colors cursor-pointer border-none focus-visible:ring-2 focus-visible:ring-rose-500',
          status === 'again'
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            : 'text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300'
        )}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{againLabel}</span>
      </button>

      {getsAnEdge && status === null && (
        <span className="flex items-center gap-1 ps-1 pe-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          <Eye className="w-3 h-3" />
          {isKu ? 'Xwe-ceribîne' : isAr ? 'جرّب نفسك' : 'Self-check'}
        </span>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import type { GrammarExercise } from '../../data/grammar/types';
import { grammarShuffle } from '../../lib/grammar/grammarScoring';
import { CheckButton, ContinueButton, ResultNote } from './ExerciseChrome';
import { TriRow } from './TriRow';
import { pickLocalized } from '../../lib/grammar/grammarPresentation';

interface MatchPairsExerciseProps {
  exercise: GrammarExercise;
  checked: boolean | null;
  onCheck: (rightIndexes: readonly number[]) => void;
  onNext: () => void;
}

/**
 * "Match pairs" — Kurdish terms (with audio) on the left; the meanings are
 * shown ONLY in the UI language on the right (no Kurdish glosses). Selecting a
 * left and a right assigns the match.
 */
export function MatchPairsExercise({ exercise, checked, onCheck, onNext }: MatchPairsExerciseProps) {
  const { language } = useAuth();
  const isAr = language === 'ar';
  const pairs = exercise.pairs ?? [];

  const shuffledRight = useMemo(
    () => grammarShuffle(pairs.map((p) => pickLocalized(p, language))),
    [pairs, language]
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [assignedRight, setAssignedRight] = useState<Record<number, string>>({});

  const submitted = checked !== null;
  const correct = checked === true;

  const rights = shuffledRight;
  const ownedRight = (gloss: string) => Object.values(assignedRight).includes(gloss);
  const anyLeftMissing = pairs.some((_, li) => !(li in assignedRight));

  const rightIndexForGloss = (gloss: string) =>
    pairs.findIndex((p) => pickLocalized(p, language) === gloss);

  function assignRight(gloss: string) {
    if (selectedLeft === null || submitted) return;
    const next = { ...assignedRight };
    // remove this right from any other left owning it
    for (const key of Object.keys(next)) {
      if (next[Number(key)] === gloss) delete next[Number(key)];
    }
    next[selectedLeft] = gloss;
    setAssignedRight(next);
    setSelectedLeft(null);
  }

  function handleCheck() {
    if (submitted) return;
    const ordered = pairs.map((_, li) => assignedRight[li] ?? '');
    onCheck(ordered.map((gloss) => rightIndexForGloss(gloss)));
  }

  const instruction = isAr
    ? 'اضغط على الكلمة الكردية ثم على معناها'
    : language === 'ku'
      ? 'Li ser peyva kurdî û paşê wateya wê bitikîne'
      : 'Tap a Kurdish word, then its meaning';

  const hintHeading = isAr ? 'التطابق الصحيح:' : language === 'ku' ? 'Cotên rast:' : 'Correct matches:';

  const previewPairs = pairs.map((p) => `${p.ku} → ${pickLocalized(p, language)}`).join(' · ');

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
        {pickLocalized(exercise.prompt, language)}
      </p>
      <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {instruction}
      </p>

      <div className="space-y-2">
        {pairs.map((p, li) => {
          const mine = assignedRight[li];
          const isSelected = selectedLeft === li;
          return (
            <div key={p.ku} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <TriRow
                testId={`mp-row-${li}`}
                audioText={p.ku}
                audioLabel={` of ${p.ku}`}
                kuNode={
                  <button
                    type="button"
                    dir="ltr"
                    disabled={submitted}
                    onClick={() => setSelectedLeft(isSelected ? null : li)}
                    className={`min-w-0 w-full text-left py-2.5 px-3 rounded-xl border-2 font-black text-base min-h-[48px] break-words transition-all ${
                      mine
                        ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200'
                        : isSelected
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40'
                          : 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                    } ${submitted ? 'opacity-80' : 'cursor-pointer hover:border-teal-400'}`}
                  >
                    {p.ku}
                  </button>
                }
                rightNode={
                  mine ? (
                    <div dir="auto" className="min-w-0 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 px-3 py-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-300 break-words">{mine}</span>
                      <button
                        type="button"
                        disabled={submitted}
                        onClick={() => { const next = { ...assignedRight }; delete next[li]; setAssignedRight(next); }}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 underline shrink-0"
                      >
                        {isAr ? 'إعادة' : language === 'ku' ? 'paşve' : 'undo'}
                      </button>
                    </div>
                  ) : null
                }
              />
            </div>
          );
        })}
      </div>

      {/* Right-side word bank (UI-language glosses, one copy each) */}
      <div dir="auto" className="flex flex-wrap gap-1.5 justify-center">
        {rights.map((gloss, i) => {
          if (ownedRight(gloss)) return null;
          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => assignRight(gloss)}
              className="px-3 py-2 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs hover:border-teal-400 active:scale-95 transition-all"
            >
              {gloss}
            </button>
          );
        })}
      </div>

      {submitted && (
        <ResultNote
          correct={correct}
          answerText={previewPairs}
          answerIsKurdish={language === 'ku'}
          headline={correct ? (isAr ? 'صحيح!' : language === 'ku' ? 'Rast!' : 'Correct!') : isAr ? 'خطأ' : language === 'ku' ? 'Şaş' : 'Incorrect'}
          answerLabel={hintHeading}
        />
      )}

      <div className="mt-auto">
        {!submitted ? (
          <CheckButton disabled={anyLeftMissing} onClick={handleCheck} label={isAr ? 'تحقق' : language === 'ku' ? 'Kontrol bike' : 'Check'} />
        ) : (
          <ContinueButton onClick={onNext} label={isAr ? 'متابعة' : language === 'ku' ? 'Bidomîne' : 'Continue'} />
        )}
      </div>
    </div>
  );
}

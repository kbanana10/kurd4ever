import React, { useMemo, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import type { GrammarExercise } from '../../data/grammar/types';
import { grammarShuffle } from '../../lib/grammar/grammarScoring';
import { CheckButton, ContinueButton, ResultNote } from './ExerciseChrome';
import { TriRow } from './TriRow';
import { pickLocalized } from '../../lib/grammar/grammarPresentation';

interface ArrangeSentenceExerciseProps {
  exercise: GrammarExercise;
  checked: boolean | null;
  onCheck: (words: readonly string[]) => void;
  onNext: () => void;
}

/**
 * "Arrange the sentence" — the translation is always shown in the UI language;
 * the learner taps Kurmanji tokens (with audio of the full sentence) into order.
 */
export function ArrangeSentenceExercise({ exercise, checked, onCheck, onNext }: ArrangeSentenceExerciseProps) {
  const { language } = useAuth();
  const isAr = language === 'ar';
  const isKu = language === 'ku';
  const canonical = exercise.sentenceWords ?? [];
  const pool = useMemo(() => grammarShuffle(canonical), [canonical]);
  const [answer, setAnswer] = useState<string[]>([]);
  const submitted = checked !== null;
  const correct = checked === true;
  const fullAudio = exercise.reference?.ku ?? canonical.join(' ');

  function inAnswer(word: string) {
    return answer.includes(word);
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
        {pickLocalized(exercise.prompt, language)}
      </p>

      {exercise.reference && (
        <TriRow
          testId="as-ref"
          ar={pickLocalized(exercise.reference, language)}
          audioText={fullAudio}
          audioLabel=" of the sentence"
          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-1"
          arClassName="text-[12px] font-bold text-muted leading-snug"
        />
      )}

      {/* Answer line */}
      <div
        dir="ltr"
        className={`min-h-[64px] w-full rounded-2xl border-2 border-dashed p-2.5 flex flex-wrap gap-1.5 items-center transition-colors ${
          submitted
            ? correct
              ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
              : 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30'
            : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40'
        }`}
      >
        {answer.length === 0 ? (
          <span dir="auto" className="text-slate-400 text-xs font-semibold px-2">
            {isAr ? 'اضغط الكلمات بالترتيب الصحيح' : isKu ? 'Peyvan bi rêza rast bitikîne' : 'Tap the words in order'}
          </span>
        ) : (
          answer.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              dir="ltr"
              disabled={submitted}
              onClick={() => (submitted ? undefined : setAnswer((prev) => prev.filter((_, j) => j !== i)))}
              className="px-3 py-2 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-xs transition-all active:scale-95"
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Tokens */}
      <div dir="ltr" className="flex flex-wrap gap-1.5 justify-center">
        {pool.map((word, i) =>
          inAnswer(word) ? null : (
            <button
              key={`${word}-${i}`}
              type="button"
              dir="ltr"
              disabled={submitted}
              onClick={() => (submitted ? undefined : setAnswer((prev) => [...prev, word]))}
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm shadow-xs hover:border-teal-400 active:scale-95 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
            >
              {word}
            </button>
          )
        )}
      </div>

      {submitted && (
        <ResultNote
          correct={correct}
          answerText={canonical.join(' ')}
          answerIsKurdish
          headline={correct ? (isAr ? 'صحيح!' : isKu ? 'Rast!' : 'Correct!') : isAr ? 'خطأ' : isKu ? 'Şaş' : 'Incorrect'}
          answerLabel={isAr ? 'الجملة الصحيحة:' : isKu ? 'Hevoka rast:' : 'Correct sentence:'}
        />
      )}

      <div className="mt-auto">
        {!submitted ? (
          <CheckButton
            disabled={answer.length !== canonical.length}
            onClick={() => onCheck(answer)}
            label={isAr ? 'تحقق' : isKu ? 'Kontrol bike' : 'Check'}
          />
        ) : (
          <ContinueButton onClick={onNext} label={isAr ? 'متابعة' : isKu ? 'Bidomîne' : 'Continue'} />
        )}
      </div>
    </div>
  );
}

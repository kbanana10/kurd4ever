import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import type { GrammarExercise } from '../../data/grammar/types';
import { CheckButton, ContinueButton, ResultNote, DiacriticKeys } from './ExerciseChrome';
import { TriRow } from './TriRow';
import { pickLocalized } from '../../lib/grammar/grammarPresentation';

interface WriteWordExerciseProps {
  exercise: GrammarExercise;
  checked: boolean | null;
  onCheck: (value: string) => void;
  onNext: () => void;
}

/**
 * "Write the word" — press play, hear the Kurdish word, type it. The meaning
 * shown as guidance is the UI language ONLY (the Kurdish is what the learner
 * must type, so it is never displayed).
 */
export function WriteWordExercise({ exercise, checked, onCheck, onNext }: WriteWordExerciseProps) {
  const { language } = useAuth();
  const isAr = language === 'ar';
  const [value, setValue] = useState('');
  const submitted = checked !== null;
  const correct = checked === true;
  const audioText = exercise.audioText ?? exercise.correctAnswer;
  const reference = exercise.reference ? pickLocalized(exercise.reference, language) : '';

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
        {pickLocalized(exercise.prompt, language)}
      </p>

      <TriRow
        testId="ww-ref"
        ar={reference}
        audioText={audioText}
        audioLabel=" of the word"
        audioIconClassName="w-7 h-7"
        audioClassName="p-3.5 min-w-[64px] min-h-[64px]"
        arClassName="text-[12px] font-bold text-muted leading-snug"
      />

      <input
        id="grammar-write-input"
        type="text"
        autoFocus
        dir="ltr"
        autoComplete="off"
        autoCapitalize="none"
        disabled={submitted}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (!submitted && value.trim()) onCheck(value);
            else if (submitted) onNext();
          }
        }}
        placeholder="…"
        className={`w-full p-5 rounded-3xl text-lg font-bold border-2 focus:outline-none transition-all duration-300 text-center shadow-xs ${
          submitted
            ? correct
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            : 'bg-white border-slate-200 focus:border-teal-500 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-white'
        }`}
      />

      {!submitted && <DiacriticKeys onInsert={(c) => setValue((prev) => prev + c)} />}

      {submitted && (
        <ResultNote
          correct={correct}
          answerText={exercise.correctAnswer}
          answerIsKurdish
          headline={correct ? (isAr ? 'صحيح!' : 'Correct!') : isAr ? 'خطأ' : 'Incorrect'}
          answerLabel={isAr ? 'الإجابة الصحيحة هي:' : 'Correct answer is:'}
        />
      )}

      <div className="mt-auto">
        {!submitted ? (
          <CheckButton disabled={!value.trim()} onClick={() => onCheck(value)} label={isAr ? 'تحقق' : 'Check'} />
        ) : (
          <ContinueButton onClick={onNext} label={isAr ? 'متابعة' : 'Continue'} />
        )}
      </div>
    </div>
  );
}

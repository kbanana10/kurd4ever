import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import type { GrammarExercise } from '../../data/grammar/types';
import { OptionChip, ContinueButton, ResultNote } from './ExerciseChrome';
import { TriRow } from './TriRow';
import { pickLocalized } from '../../lib/grammar/grammarPresentation';

interface CompleteSentenceExerciseProps {
  exercise: GrammarExercise;
  checked: boolean | null;
  onCheck: (value: string) => void;
  onNext: () => void;
}

/**
 * "Complete the sentence" — a Kurmanji sentence with a ___ blank and a play
 * button; the learner fills the blank by picking the Kurdish target word.
 * The full-sentence meaning is shown in the UI language as guidance.
 */
export function CompleteSentenceExercise({ exercise, checked, onCheck, onNext }: CompleteSentenceExerciseProps) {
  const { language } = useAuth();
  const isAr = language === 'ar';
  const [pending, setPending] = useState<string | null>(null);
  const submitted = checked !== null;
  const correct = checked === true;
  const options = exercise.options ?? [];
  const audioText = exercise.reference?.ku ?? exercise.display ?? exercise.correctAnswer;

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
        {pickLocalized(exercise.prompt, language)}
      </p>

      {exercise.display && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <TriRow
            testId="cs-display"
            ku={exercise.display}
            audioText={audioText}
            audioLabel=" of the sentence"
            ar={exercise.reference ? pickLocalized(exercise.reference, language) : ''}
            kuClassName="text-lg font-black text-ink leading-snug"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option) => (
          <OptionChip
            key={option.ku}
            option={option}
            language={language}
            mode="target"
            selected={pending === option.ku}
            submitted={submitted}
            isCorrectOption={option.ku === exercise.correctAnswer}
            onSelect={(value) => {
              if (submitted) return;
              setPending(value);
              onCheck(value);
            }}
          />
        ))}
      </div>

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
        {submitted && <ContinueButton onClick={onNext} label={isAr ? 'متابعة' : 'Continue'} />}
      </div>
    </div>
  );
}

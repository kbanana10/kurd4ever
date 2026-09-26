import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import type { GrammarExercise } from '../../data/grammar/types';
import { OptionChip, ContinueButton, ResultNote } from './ExerciseChrome';
import { TriRow } from './TriRow';
import { pickLocalized, optionDisplayMode } from '../../lib/grammar/grammarPresentation';

interface SelectTranslationExerciseProps {
  exercise: GrammarExercise;
  checked: boolean | null;
  onCheck: (value: string) => void;
  onNext: () => void;
}

/**
 * "Select the correct translation."
 *  - to_arabic  → a Kurdish sentence is the prompt (with 🔊); options are the
 *                 meaning in the UI language ONLY (no Kurdish, so the answer
 *                 cannot be guessed by visual matching).
 *  - to_kurdish → the prompt asks for the Kurdish; options are pure Kurdish
 *                 targets (the thing being learned, shown bare by design).
 */
export function SelectTranslationExercise({ exercise, checked, onCheck, onNext }: SelectTranslationExerciseProps) {
  const { language } = useAuth();
  const isAr = language === 'ar';
  const [pending, setPending] = useState<string | null>(null);
  const submitted = checked !== null;
  const correct = checked === true;
  const options = exercise.options ?? [];
  const direction = exercise.direction ?? 'to_arabic';
  const mode = optionDisplayMode('select_translation', direction);

  const correctOption = options.find((o) => o.ku === exercise.correctAnswer);
  const showKurdishPrompt = direction === 'to_arabic' && !!exercise.display;

  // What the failed answer looks like: the Kurdish target for to_kurdish,
  // the UI-language gloss for to_arabic.
  const answerText = mode === 'target' ? exercise.correctAnswer : pickLocalized(correctOption ?? { ku: '', ar: '', en: '' }, language);
  const answerIsKurdish = mode === 'target';

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
        {pickLocalized(exercise.prompt, language)}
      </p>

      {showKurdishPrompt && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <TriRow
            testId="st-prompt"
            ku={exercise.display}
            audioText={exercise.display}
            audioLabel=" of the sentence"
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
            mode={mode}
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
          answerText={answerText}
          answerIsKurdish={answerIsKurdish}
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

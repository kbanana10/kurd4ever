import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { AudioButton } from '../../components/AudioButton';
import type { GrammarExercise } from '../../data/grammar/types';
import { OptionChip, ContinueButton, ResultNote } from './ExerciseChrome';
import { pickLocalized } from '../../lib/grammar/grammarPresentation';

interface ListenChooseExerciseProps {
  exercise: GrammarExercise;
  checked: boolean | null;
  onCheck: (value: string) => void;
  onNext: () => void;
}

/**
 * "Listen and choose" — a large play button speaks the Kurdish word; the
 * learner picks the matching Kurdish target (shown bare — it is the answer).
 */
export function ListenChooseExercise({ exercise, checked, onCheck, onNext }: ListenChooseExerciseProps) {
  const { language } = useAuth();
  const isAr = language === 'ar';
  const [pending, setPending] = useState<string | null>(null);
  const submitted = checked !== null;
  const correct = checked === true;
  const options = exercise.options ?? [];
  const audioText = exercise.audioText ?? exercise.correctAnswer;

  const correctOption = options.find((o) => o.ku === exercise.correctAnswer);

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
        {pickLocalized(exercise.prompt, language)}
      </p>

      <div className="flex justify-center py-2">
        <AudioButton
          textToSpeak={audioText}
          label=" of the word"
          iconClassName="w-8 h-8"
          className="p-4 min-w-[72px] min-h-[72px] scale-125"
          showProgress={false}
        />
      </div>

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

      {/* The spoken word's meaning is revealed on wrong answers via the note
          above only; on success nothing extra is needed. */}
      {submitted && correct && correctOption && (
        <p className="text-center text-[12px] font-bold text-muted">
          {pickLocalized(correctOption, language)}
        </p>
      )}

      <div className="mt-auto">
        {submitted && <ContinueButton onClick={onNext} label={isAr ? 'متابعة' : 'Continue'} />}
      </div>
    </div>
  );
}

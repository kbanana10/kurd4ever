import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Question } from '../hooks/useQuizEngine';

interface MultipleChoiceQuestionProps {
  currentQ: Question;
  /** Distractors removed by the 50/50 hint. Rendered disabled, not unmounted,
   *  so the grid does not reflow under the user's finger. */
  eliminatedOptions?: string[];
  selectedOption: string | null;
  hasChecked: boolean;
  isCorrect: boolean | null;
  handleOptionSelect: (opt: string) => void;
}

export function MultipleChoiceQuestion({
  currentQ,
  eliminatedOptions = [],
  selectedOption,
  hasChecked,
  isCorrect,
  handleOptionSelect
}: MultipleChoiceQuestionProps) {
  const options = currentQ?.options || [];
  const isGrid = options.length <= 4;

  return (
    /* `mt-auto` removed: inside the centring wrapper it pinned the options to
       the bottom, opening a huge dead void under the question card. */
    <div className={`mb-2 ${isGrid ? 'grid grid-cols-2 gap-3.5' : 'space-y-3'}`}>
      {options.map((opt, i) => {
        const isSelected = selectedOption === opt;
        const isCorrectAnswer = opt === currentQ.correctAnswer;
        const isEliminated = eliminatedOptions.includes(opt);
        
        let btnClass = "bg-white border-2 border-slate-100 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-xs";
        
        if (isEliminated && !selectedOption && !hasChecked) {
          btnClass = "bg-slate-100 border-2 border-slate-200 text-slate-400 line-through opacity-40 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-600";
        } else if (selectedOption || hasChecked) {
          if (isSelected && isCorrect) {
            btnClass = "bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm";
          } else if (isSelected && !isCorrect) {
            btnClass = "bg-rose-50 border-2 border-rose-500 text-rose-800 font-black dark:bg-rose-950/60 dark:text-rose-300 shadow-sm";
          } else if (!isSelected && isCorrectAnswer) {
            btnClass = "bg-emerald-50/80 border-2 border-emerald-500/80 text-emerald-700 font-bold dark:bg-emerald-950/40 dark:text-emerald-300";
          } else {
            btnClass = "bg-slate-50 border border-slate-200 text-slate-400 opacity-50 dark:bg-slate-900/50 dark:border-slate-800";
          }
        } else {
          btnClass += " hover:bg-indigo-50/60 dark:hover:bg-slate-800 hover:border-indigo-400 active:scale-[0.98] cursor-pointer";
        }

        return (
          <button
            key={i}
            id={`opt-btn-${i}`}
            type="button"
            disabled={!!selectedOption || hasChecked || isEliminated}
            onClick={() => handleOptionSelect(opt)}
            aria-pressed={isSelected}
            aria-label={
              isEliminated
                ? `Option ${i + 1}: ${opt} — eliminated by hint`
                : `Option ${i + 1}: ${opt}`
            }
            className={`w-full ${isGrid ? 'min-h-[72px] p-4 text-center justify-center flex-col' : 'min-h-[52px] p-4 text-center justify-between'} rounded-2xl text-base font-black transition-all duration-200 ${btnClass} flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400`}
          >
            <span className="leading-snug text-center"><bdi>{opt}</bdi></span>
            {selectedOption && isSelected && isCorrect && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
            {selectedOption && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-600 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

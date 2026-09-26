import React from 'react';
import { Check, ArrowRight, X, ShieldCheck } from 'lucide-react';
import type { GrammarExerciseOption } from '../../data/grammar/types';
import { optionLabel, type UILang } from '../../lib/grammar/grammarPresentation';

/**
 * Option chip used by every choice exercise.
 *
 * `mode` decides the single language rendered in the chip:
 *   - 'target'      → the Kurdish word/sentence being taught (always Kurdish).
 *   - 'translation' → the meaning in the user's UI language ONLY (Arabic,
 *                     Kurdish or English). The Kurdish original is never shown,
 *                     so the answer cannot be guessed by visual matching.
 */
interface OptionChipProps {
  option: GrammarExerciseOption;
  language: UILang;
  mode: 'target' | 'translation';
  selected: boolean;
  submitted: boolean;
  isCorrectOption: boolean;
  onSelect: (ku: string) => void;
}

export function OptionChip({
  option,
  language,
  mode,
  selected,
  submitted,
  isCorrectOption,
  onSelect,
}: OptionChipProps) {
  let cls =
    'bg-white border-2 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100';
  if (submitted) {
    if (selected && isCorrectOption) {
      cls = 'bg-emerald-50 border-2 border-emerald-500 dark:bg-emerald-950/60 dark:border-emerald-500';
    } else if (selected && !isCorrectOption) {
      cls = 'bg-rose-50 border-2 border-rose-500 dark:bg-rose-950/60 dark:border-rose-500';
    } else if (!selected && isCorrectOption) {
      cls = 'bg-emerald-50/80 border-2 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-400';
    } else {
      cls = 'bg-slate-50 border border-slate-200 text-slate-400 opacity-50 dark:bg-slate-900/50 dark:border-slate-800';
    }
  } else if (selected) {
    cls = 'bg-slate-100 border-2 border-slate-400 dark:bg-slate-800 dark:border-slate-600';
  }

  const label = optionLabel(option, language, mode);
  const isKurdishTarget = mode === 'target';

  return (
    <button
      type="button"
      disabled={submitted}
      onClick={() => onSelect(option.ku)}
      className={`w-full min-h-[72px] rounded-2xl p-4 flex items-center justify-center gap-2 text-center shadow-xs transition-all active:scale-[0.98] ${
        submitted ? 'cursor-default' : 'cursor-pointer hover:border-teal-400'
      } ${cls}`}
    >
      {isKurdishTarget ? (
        <bdi dir="ltr" className="text-base font-black leading-snug">
          {label}
        </bdi>
      ) : (
        <span dir="auto" className="text-base font-black leading-snug">
          {label}
        </span>
      )}
    </button>
  );
}

interface CheckButtonProps {
  disabled: boolean;
  onClick: () => void;
  label: string;
}

export function CheckButton({ disabled, onClick, label }: CheckButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-4 rounded-3xl font-black text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 border-none ${
        disabled
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          : 'bg-teal-700 hover:bg-teal-800 active:scale-95 text-white cursor-pointer'
      }`}
    >
      <Check className="w-4 h-4" />
      {label}
    </button>
  );
}

interface ContinueButtonProps {
  onClick: () => void;
  label: string;
}

export function ContinueButton({ onClick, label }: ContinueButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-4 rounded-3xl font-black text-sm bg-teal-700 hover:bg-teal-800 active:scale-95 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
    </button>
  );
}

interface ResultNoteProps {
  correct: boolean;
  /** What the learner got wrong — shown only on failure. */
  answerText: string;
  /** True when answerText is Kurdish (render LTR). */
  answerIsKurdish: boolean;
  headline: string;
  answerLabel: string;
}

export function ResultNote({ correct, answerText, answerIsKurdish, headline, answerLabel }: ResultNoteProps) {
  return (
    <div
      className={`p-4 rounded-3xl border flex flex-col gap-2 text-center ${
        correct
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
      }`}
    >
      <div className="flex items-center justify-center gap-2 font-black text-base">
        {correct ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
        <span>{headline}</span>
      </div>
      {!correct && (
        <div className="text-xs font-bold mt-1">
          <span className="opacity-75">{answerLabel}</span>
          {answerIsKurdish ? (
            <bdi dir="ltr" className="text-lg font-black tracking-wide block bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-1 shadow-xs">
              {answerText}
            </bdi>
          ) : (
            <span dir="auto" className="text-lg font-black tracking-wide block bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-1 shadow-xs">
              {answerText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface DiacriticKeysProps {
  onInsert: (character: string) => void;
}

const DIACRITIC_CHARS = ['ç', 'ê', 'î', 'ş', 'û'];

export function DiacriticKeys({ onInsert }: DiacriticKeysProps) {
  return (
    <div className="flex items-center justify-center gap-2 select-none">
      {DIACRITIC_CHARS.map((character) => (
        <button
          key={character}
          type="button"
          dir="ltr"
          onClick={() => onInsert(character)}
          aria-label={`Insert letter ${character}`}
          className="min-w-[44px] min-h-[44px] bg-white border border-slate-200 rounded-xl font-black text-slate-700 hover:bg-teal-50 hover:border-teal-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center text-base shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:text-white"
        >
          {character}
        </button>
      ))}
    </div>
  );
}

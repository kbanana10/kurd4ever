import React from 'react';
import { ShieldCheck, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../hooks/useQuizEngine';
import { t } from '../../../lib/translations';
import { Language } from '../../../models/user';

interface ScrambledLettersQuestionProps {
  currentQ: Question;
  typingAnswer: string;
  setTypingAnswer: (val: string) => void;
  selectedBlockIndices: number[];
  setSelectedBlockIndices: (indices: number[]) => void;
  hasChecked: boolean;
  isCorrect: boolean | null;
  language: Language;
  handleVerify: () => void;
  handleNext: () => void;
}

export function ScrambledLettersQuestion({
  currentQ,
  typingAnswer,
  setTypingAnswer,
  selectedBlockIndices,
  setSelectedBlockIndices,
  hasChecked,
  isCorrect,
  language,
  handleVerify,
  handleNext
}: ScrambledLettersQuestionProps) {
  return (
    <div className="key-scrambled flex-1 flex flex-col justify-between mt-2">
      <div className="space-y-6">
        
        {/* Result Assembly Area */}
        <div className="p-5 min-h-[70px] bg-white border-2 border-dashed border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-800 flex flex-wrap gap-1.5 items-center justify-center shadow-inner">
          {typingAnswer.length === 0 ? (
            <span className="text-slate-400 text-xs font-bold animate-pulse">
              {language !== 'ar' ? 'Click letter blocks below to spell...' : 'اضغط على المكعبات في الأسفل للتهجئة...'}
            </span>
          ) : (
            typingAnswer.split('').map((char, index) => (
              <span 
                key={index} 
                className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-white border border-indigo-200 rounded-xl font-black text-base drop-shadow-xs"
              >
                {char}
              </span>
            ))
          )}
        </div>

        {/* Letter Grid */}
        <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
          {currentQ.scrambledLetters?.map((char, index) => {
            const isSelected = selectedBlockIndices.includes(index);
            return (
              <button
                key={index}
                type="button"
                disabled={isSelected || hasChecked}
                onClick={() => {
                  if (isSelected || hasChecked) return;
                  const newIndices = [...selectedBlockIndices, index];
                  setSelectedBlockIndices(newIndices);
                  const assembled = newIndices.map(idx => currentQ.scrambledLetters![idx]).join('');
                  setTypingAnswer(assembled);
                }}
                aria-label={`Letter ${char}`}
                aria-pressed={isSelected}
                className={`min-w-[44px] min-h-[44px] rounded-xl border-2 font-black text-base flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  isSelected
                    ? "bg-slate-100 border-slate-200 text-slate-300 dark:bg-slate-950 dark:border-slate-800 pointer-events-none opacity-40 shadow-none border-dashed"
                    : "bg-white border-indigo-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                }`}
              >
                {char}
              </button>
            );
          })}
        </div>

        {/* Single clear indicator trigger */}
        {!hasChecked && selectedBlockIndices.length > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSelectedBlockIndices([]);
                setTypingAnswer('');
              }}
              className="min-h-[44px] px-3 py-2 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-transparent border-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg"
            >
              {language !== 'ar' ? 'Reset Spelling ↺' : 'إعادة تعيين الأحرف ↺'}
            </button>
          </div>
        )}

        {/* Verified results block */}
        <AnimatePresence>
          {hasChecked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`p-5 rounded-3xl border flex flex-col gap-2 text-center ${
                isCorrect 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" 
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              <div className="flex items-center gap-2 font-black text-base">
                {isCorrect ? (
                  <>
                    <ShieldCheck className="w-5.5 h-5.5 text-emerald-600 shrink-0" />
                    <span>{t(language, 'correct')}</span>
                  </>
                ) : (
                  <>
                    <X className="w-5.5 h-5.5 text-red-600 shrink-0" />
                    <span>{t(language, 'incorrect')}</span>
                  </>
                )}
              </div>
              
              {!isCorrect && (
                <div className="text-xs font-bold mt-1">
                  <span className="opacity-75 block mb-1">{t(language, 'correct_answer_is')}</span>
                  <bdi className="text-lg font-black tracking-wide text-indigo-700 dark:text-indigo-400 block bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-1 shadow-xs">{currentQ.correctAnswer}</bdi>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verification triggers panel */}
      <div className="mt-8 mb-4">
        {!hasChecked ? (
          <button
            type="button"
            disabled={selectedBlockIndices.length === 0}
            onClick={handleVerify}
            className={`w-full py-4 rounded-3xl font-black text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 border-none ${
              selectedBlockIndices.length > 0
                ? "bg-purple-600 hover:bg-purple-700 active:scale-95 text-white cursor-pointer shadow-purple-600/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            <Check className="w-4 h-4" />
            {t(language, 'check')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-3xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <span>{t(language, 'continue')}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        )}
      </div>
    </div>
  );
}

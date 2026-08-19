import React from 'react';
import { ShieldCheck, X, Check, ArrowRight, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../hooks/useQuizEngine';
import { t } from '../../../lib/translations';
import { Language } from '../../../models/user';

interface TranslateQuestionProps {
  currentQ: Question;
  typingAnswer: string;
  setTypingAnswer: (val: string) => void;
  hasChecked: boolean;
  isCorrect: boolean | null;
  language: Language;
  handleCharClick: (char: string) => void;
  handleVerify: () => void;
  handleNext: () => void;
}

export function TranslateQuestion({
  currentQ,
  typingAnswer,
  setTypingAnswer,
  hasChecked,
  isCorrect,
  language,
  handleCharClick,
  handleVerify,
  handleNext
}: TranslateQuestionProps) {
  return (
    <div className="flex-1 flex flex-col justify-between mt-2">
      <div className="space-y-4">
        
        {currentQ.type === 'fill_blank' && (
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/40 rounded-2xl p-4 text-center">
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 block uppercase tracking-wider mb-1">
              {language !== 'ar' ? 'Translation Hint' : 'تلميح الترجمة'}
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse shrink-0" />
              <span>{language !== 'ar' ? (currentQ.hintEn || currentQ.hintAr) : currentQ.hintAr}</span>
            </p>
          </div>
        )}

        <input
          id="writing-input"
          type="text"
          autoFocus
          disabled={hasChecked}
          value={typingAnswer}
          onChange={(e) => setTypingAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!hasChecked) {
                if (typingAnswer.trim()) handleVerify();
              } else {
                handleNext();
              }
            }
          }}
          className={`w-full p-5 rounded-3xl text-xl font-bold border-2 focus:outline-none transition-all duration-300 text-center shadow-xs ${
            hasChecked
              ? isCorrect 
                ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-50 border-red-500 text-red-800 font-extrabold dark:bg-red-950 dark:text-red-300"
              : "bg-white border-slate-200 focus:border-purple-500 text-slate-800 dark:bg-slate-900 dark:border-slate-800 focus:ring-2 focus:ring-purple-200 dark:text-white"
          }`}
          placeholder={t(language, 'type_placeholder')}
          dir="ltr"
          autoComplete="off"
          autoCapitalize="none"
        />

        {/* Kurdish help alphabet buttons */}
        {!hasChecked && (
          <div className="flex flex-col items-center gap-2 pt-1 select-none">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {language !== 'ar' ? 'Helper letters:' : 'حروف مساعدة للكتابة:'}
            </span>
            <div className="flex gap-2 justify-center">
              {['ç', 'ê', 'î', 'ş', 'û'].map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleCharClick(char)}
                  aria-label={`Insert letter ${char}`}
                  className="min-w-[44px] min-h-[44px] bg-white border border-slate-200 rounded-xl font-black text-slate-700 hover:bg-purple-100 hover:border-purple-300 active:scale-90 transition-all cursor-pointer flex items-center justify-center text-base shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verified results block */}
        <AnimatePresence>
          {hasChecked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`p-5 rounded-3xl border flex flex-col gap-2 text-center ${
                isCorrect 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" 
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300"
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
                  <bdi className="text-lg font-black tracking-wide text-indigo-700 dark:text-indigo-400 block bg-white dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-1 shadow-xs">{currentQ.correctAnswer}</bdi>
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
            id="verify-btn"
            type="button"
            disabled={!typingAnswer.trim()}
            onClick={handleVerify}
            className={`w-full py-4 rounded-3xl font-black text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 border-none ${
              typingAnswer.trim()
                ? "bg-purple-600 hover:bg-purple-700 active:scale-95 text-white cursor-pointer shadow-purple-600/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            <Check className="w-4 h-4" />
            {t(language, 'check')}
          </button>
        ) : (
          <button
            id="next-btn"
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

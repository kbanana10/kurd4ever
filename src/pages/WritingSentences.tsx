import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { WRITING_SENTENCES } from '../data/writingSentences';
import { motion } from 'motion/react';
import { NotebookPen, Sparkles, Check, MessageSquareText } from 'lucide-react';
import type { ReviewDeck } from '../services/SpacedRepetitionService';
import { SUBJECT_ACCENTS } from '../constants/subjectAccents';

const ACCENT = SUBJECT_ACCENTS.writing;

/**
 * WritingSentences — the sentence grid for the writing flow. A sentence is
 * "learned" once it carries a positive repetition count in `userData.reviewDeck`,
 * which is what a fully-passing sentence trace writes. Each tile shows the
 * Kurdish sentence plus a small translation.
 */
export function WritingSentences() {
  const navigate = useNavigate();
  const { language, userData } = useAuth();
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const deck: ReviewDeck = userData?.reviewDeck ?? {};
  const isLearned = (id: string): boolean => {
    const item = deck[id];
    return !!item && item.repetitions > 0;
  };

  const learnedCount = WRITING_SENTENCES.filter(s => isLearned(s.id)).length;

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFB300]/10 dark:bg-[#FFB300]/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 mb-6 relative overflow-hidden shadow-flat border border-line-soft group">
        <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.10] pointer-events-none" aria-hidden="true" />
        <NotebookPen className="absolute right-0 bottom-0 opacity-[0.06] w-40 h-40 transform translate-y-8 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-500" />

        <div className="space-y-2 relative z-10 text-start">
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max ${ACCENT.well} ${ACCENT.icon}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {isKu ? 'HEVOK' : isAr ? 'جُمَل' : 'SENTENCES'}
          </span>
          <h3 className="text-2xl font-black mt-2 leading-tight tracking-tight text-ink">
            {isKu ? 'Hevok' : isAr ? 'جُمَل' : 'Sentences'}
          </h3>
          <p className="text-muted text-[11px] leading-relaxed font-semibold">
            {isKu
              ? 'Hevoka temam bikişîne — her peyv ji bo xwe tê kontrolkirin.'
              : isAr
                ? 'اكتب الجملة كاملة — تُفحص كل كلمة على حدة.'
                : 'Trace the whole sentence — every word is checked on its own.'}
          </p>
        </div>
      </div>

      {/* Progress line */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {isKu ? `${WRITING_SENTENCES.length} Hevok` : isAr ? `${WRITING_SENTENCES.length} جُمل` : `${WRITING_SENTENCES.length} Sentences`}
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">
          {isKu ? `${learnedCount} hîn bûye` : isAr ? `${learnedCount} مكتوبة` : `${learnedCount} learned`}
        </span>
      </div>

      {/* Sentence list — one full row per sentence so longer Kurdish text
          and its translation both fit without truncation. */}
      <div className="pb-4 space-y-2">
        {WRITING_SENTENCES.map((sentence, index) => {
          const done = isLearned(sentence.id);
          return (
            <motion.button
              key={sentence.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              onClick={() => navigate(`/writing/sentences/${sentence.id}`)}
              aria-label={`${sentence.ku} — ${isAr ? sentence.ar : sentence.en}${done ? (isAr ? '، مكتوبة' : ', written') : ''}`}
              className={`w-full flex items-center gap-3 rounded-2xl p-3.5 transition-all relative cursor-pointer select-none text-start min-h-[56px]
                ${done
                  ? 'border-2 border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 hover:border-[#7C3AED]/40 hover:bg-[#EDE9FE]/30 shadow-[0_8px_30px_rgba(0,0,0,0.015)]'}`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ACCENT.well}`} aria-hidden="true">
                <MessageSquareText className={`w-5 h-5 ${ACCENT.icon}`} />
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block font-black text-base leading-snug ${done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`} dir="ltr">
                  {sentence.ku}
                </span>
                <span className={`block text-[11px] font-semibold leading-snug ${done ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-muted'}`}>
                  {isAr ? sentence.ar : sentence.en}
                </span>
              </span>
              {done && (
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow-sm shrink-0" aria-hidden="true">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

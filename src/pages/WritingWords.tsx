import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { WRITING_WORDS, type WritingWordWithLength } from '../data/writingWords';
import { motion } from 'motion/react';
import { MessageSquare, Sparkles, Check } from 'lucide-react';
import type { ReviewDeck } from '../services/SpacedRepetitionService';
import { SUBJECT_ACCENTS } from '../constants/subjectAccents';

const ACCENT = SUBJECT_ACCENTS.writing;

/** Section (difficulty) labels for the grouped word grid. */
function sectionLabel(len: number, isAr: boolean, isKu: boolean): string {
  if (isKu) return len === 5 ? 'Peyvên dijwar' : `${len} tîp`;
  if (isAr) return len === 5 ? 'كلمات تحدي' : `${len} أحرف`;
  return len === 5 ? 'Challenge' : `${len} letters`;
}

/**
 * WritingWords — the word grid for the writing flow. Words are kept
 * shortest-first in the data file; they are grouped here into length sections
 * ("2 letters", "3 letters", …) with a small translation under each tile. Each
 * tile reflects the shared SM-2 learned state: a word is "learned" once it
 * carries a positive repetition count in `userData.reviewDeck`.
 */
export function WritingWords() {
  const navigate = useNavigate();
  const { language, userData } = useAuth();
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const deck: ReviewDeck = userData?.reviewDeck ?? {};
  const isWordLearned = (id: string): boolean => {
    const item = deck[id];
    return !!item && item.repetitions > 0;
  };

  // Group the (already length-sorted) list into 2–5 letter sections.
  const groups: { len: number; words: WritingWordWithLength[] }[] = [];
  for (const word of WRITING_WORDS) {
    const last = groups[groups.length - 1];
    if (last && last.len === word.len) last.words.push(word);
    else groups.push({ len: word.len, words: [word] });
  }

  const learnedCount = WRITING_WORDS.filter(w => isWordLearned(w.id)).length;

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFB300]/10 dark:bg-[#FFB300]/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Hero — compact, mirrors the letter-grid header */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 mb-6 relative overflow-hidden shadow-flat border border-line-soft group">
        <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.10] pointer-events-none" aria-hidden="true" />
        <MessageSquare className="absolute right-0 bottom-0 opacity-[0.06] w-40 h-40 transform translate-y-8 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-500" />

        <div className="space-y-2 relative z-10 text-start">
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max ${ACCENT.well} ${ACCENT.icon}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {isKu ? 'PEYV' : isAr ? 'كلمات' : 'WORDS'}
          </span>
          <h3 className="text-2xl font-black mt-2 leading-tight tracking-tight text-ink">
            {isKu ? 'Peyv' : isAr ? 'كلمات' : 'Words'}
          </h3>
          <p className="text-muted text-[11px] leading-relaxed font-semibold">
            {isKu
              ? 'Hemû tîpên peyvê bikşîne — gava hemû derbas bûn, peyv hîn bûye.'
              : isAr
                ? 'تتبّع كل حروف الكلمة — تكتمل عند اجتيازها كلها.'
                : 'Trace every letter of a word — it counts as learned once each letter passes.'}
          </p>
        </div>
      </div>

      {/* Progress line */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {isKu ? `${WRITING_WORDS.length} Peyv` : isAr ? `${WRITING_WORDS.length} كلمات` : `${WRITING_WORDS.length} Words`}
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">
          {isKu ? `${learnedCount} hîn bûye` : isAr ? `${learnedCount} مكتوبة` : `${learnedCount} learned`}
        </span>
      </div>

      <div className="pb-4 space-y-6">
        {groups.map(group => (
          <section key={group.len} aria-label={sectionLabel(group.len, isAr, isKu)}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB300]" aria-hidden="true" />
              <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {sectionLabel(group.len, isAr, isKu)}
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {group.words.map((word, index) => {
                const isLearned = isWordLearned(word.id);
                return (
                  <motion.button
                    key={word.id}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.015, duration: 0.3 }}
                    onClick={() => navigate(`/writing/words/${word.id}`)}
                    aria-label={`${word.ku} — ${isAr ? word.ar : word.en}${isLearned ? (isAr ? '، مكتوب' : ', written') : ''}`}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black transition-all relative cursor-pointer select-none px-1
                      ${isLearned
                        ? 'border-2 border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#7C3AED]/40 hover:bg-[#EDE9FE]/30 shadow-[0_8px_30px_rgba(0,0,0,0.015)]'}`}
                  >
                    <span className="font-mono text-lg tracking-wider" dir="ltr">{word.ku}</span>
                    <span
                      className={`text-[9px] font-bold mt-1 tracking-wide w-full text-center truncate ${
                        isLearned ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-slate-400'
                      }`}
                      dir="auto"
                    >
                      {isAr ? word.ar : word.en}
                    </span>
                    {isLearned && (
                      <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-500 text-white shadow-sm" aria-hidden="true">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

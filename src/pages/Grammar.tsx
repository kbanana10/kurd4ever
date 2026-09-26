import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { Sparkles, PenTool, ChevronRight, Users, Zap, Tag, ListTree, Link, CheckCircle2 } from 'lucide-react';
import { SUBJECT_ACCENTS } from '../constants/subjectAccents';
import { GRAMMAR_LESSONS } from '../data/grammar';
import { lessonCompletionPercent, grammarLessonKey } from '../lib/grammar/grammarScoring';
import type { ReviewDeck } from '../services/SpacedRepetitionService';

type Language = 'en' | 'ar' | 'ku';

/**
 * Grammar (Rêziman) sub-category hub. Five cards open the numbered lessons
 * under /grammar/:lessonId, and each card shows the learner's real progress —
 * the fraction of the lesson's exercises that are "learned"
 * (repetitions > 0) in the shared SM-2 review deck, plus a checkmark once the
 * lesson id lands in completedLessons.
 */
interface GrammarSubCategory {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** English card title. */
  en: string;
  /** Arabic card title. */
  ar: string;
  /** Kurmanji card title. */
  ku: string;
  /** English support subtitle. */
  enDesc: string;
  /** Arabic support subtitle. */
  arDesc: string;
  /** Kurmanji support subtitle. */
  kuDesc: string;
}

const GRAMMAR_SUB_CATEGORIES: GrammarSubCategory[] = [
  {
    id: 'pronouns',
    Icon: Users,
    en: 'Pronouns',
    ar: 'الضمائر',
    ku: 'Cînavk',
    enDesc: 'Personal & possessive pronouns',
    arDesc: 'الضمائر الشخصية وضمائر الملكية',
    kuDesc: 'Cînavkên kesane û xwedîtiyê',
  },
  {
    id: 'verbs',
    Icon: Zap,
    en: 'Verbs',
    ar: 'الأفعال',
    ku: 'Lêker',
    enDesc: 'Verb tenses & conjugation',
    arDesc: 'أزمنة الأفعال والتصريف',
    kuDesc: 'Dema lêkeran û tewandin',
  },
  {
    id: 'nouns',
    Icon: Tag,
    en: 'Nouns',
    ar: 'الأسماء',
    ku: 'Navdêr',
    enDesc: 'Gender, number & inflection',
    arDesc: 'الجنس والعدد والتصريف',
    kuDesc: 'Zayend, hejmar û tewandin',
  },
  {
    id: 'sentence-structure',
    Icon: ListTree,
    en: 'Sentence Structure',
    ar: 'تركيب الجملة',
    ku: 'Hevoksazî',
    enDesc: 'Building sentences',
    arDesc: 'بناء الجملة',
    kuDesc: 'Avakirina hevokê',
  },
  {
    id: 'prepositions',
    Icon: Link,
    en: 'Prepositions',
    ar: 'حروف الجر',
    ku: 'Daçek',
    enDesc: 'The key prepositions',
    arDesc: 'حروف الجر الأساسية',
    kuDesc: 'Daçekên sereke',
  },
];

const gramCount = GRAMMAR_SUB_CATEGORIES.length;

function subTitle(sub: GrammarSubCategory, lang: Language): string {
  if (lang === 'ar') return sub.ar;
  return lang === 'ku' ? sub.ku : sub.en;
}

function subDescription(sub: GrammarSubCategory, lang: Language): string {
  if (lang === 'ar') return sub.arDesc;
  return lang === 'ku' ? sub.kuDesc : sub.enDesc;
}

const ACCENT = SUBJECT_ACCENTS.grammar;

export function Grammar() {
  const navigate = useNavigate();
  const { language, userData } = useAuth();
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const deck: ReviewDeck = userData?.reviewDeck ?? {};
  const completed = userData?.completedLessons ?? [];
  const anyProgress = GRAMMAR_LESSONS.some((l) => lessonCompletionPercent(l, deck) > 0);

  // One lookup per lesson, resolved before render (no per-card find).
  const progressByTopic = new Map<string, { percent: number; done: boolean }>();
  for (const lesson of GRAMMAR_LESSONS) {
    progressByTopic.set(lesson.topicId, {
      percent: lessonCompletionPercent(lesson, deck),
      done: completed.includes(grammarLessonKey(lesson.topicId)),
    });
  }

  return (
    <div className="p-4 space-y-4 min-h-screen pb-24 relative overflow-hidden">
      {/* Ambient brand glow (mirrors the Learning Hub hero pattern) */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFB300]/10 dark:bg-[#FFB300]/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-5 w-60 h-60 bg-teal-200/15 dark:bg-teal-950/20 rounded-full filter blur-3xl pointer-events-none" />

      {/* Hero */}
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-flat border border-line-soft relative overflow-hidden group">
        <PenTool className="absolute right-0 bottom-0 opacity-[0.06] w-40 h-40 transform translate-y-8 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-500" />

        <div className="space-y-2 relative z-10 text-start">
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max ${ACCENT.well} ${ACCENT.icon}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {isKu ? 'RÊZIMAN' : isAr ? 'قواعد اللغة' : 'GRAMMAR'}
          </span>
          <h3 className="text-2xl font-black mt-2 leading-tight tracking-tight text-ink">
            {isKu ? 'Rêziman' : isAr ? 'النحو' : 'Grammar'}
          </h3>
          <p className="text-muted text-[11px] leading-relaxed font-semibold">
            {isKu
              ? 'Bingehên rêzimanê: cînavk, lêker, navdêr, hevoksazî û daçek.'
              : isAr
                ? 'أساسيات القواعد: الضمائر، الأفعال، الأسماء، تركيب الجملة وحروف الجر.'
                : 'Grammar basics — pronouns, verbs, nouns, sentence structure and prepositions.'}
          </p>
        </div>
      </div>

      {/* Sub-category cards */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {GRAMMAR_SUB_CATEGORIES.map((sub, index) => (
          <motion.button
            key={sub.id}
            type="button"
            aria-label={`${subTitle(sub, language)} — ${subDescription(sub, language)}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/grammar/${sub.id}`)}
            className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 rounded-[26px] p-5 flex flex-col items-center justify-center gap-3 hover:shadow-[0_10px_30px_rgba(30,41,59,0.07)] hover:scale-[1.015] transition-all active:scale-95 cursor-pointer relative overflow-hidden min-h-[150px] shadow-[0_8px_30px_rgba(0,0,0,0.025)]"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${ACCENT.well}`}>
              <sub.Icon className={`w-6 h-6 ${ACCENT.icon}`} />
            </div>

            <div className="text-center w-full">
              <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-snug">
                {subTitle(sub, language)}
              </div>
              <div className="text-[11px] font-semibold mt-1 leading-snug text-muted">
                {subDescription(sub, language)}
              </div>
            </div>

            {/* Progress + completion status from the shared SM-2 deck */}
            {(() => {
              const info = progressByTopic.get(sub.id) ?? { percent: 0, done: false };
              return (
                <div className="w-full">
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" aria-hidden="true">
                    <div className={`h-full rounded-full transition-all duration-500 ${ACCENT.barFill}`} style={{ width: `${info.percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] font-black text-muted uppercase tracking-wider">{info.percent}%</span>
                    {info.done && (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="sr-only">{isKu ? 'Qediya' : isAr ? 'مكتمل' : 'Done'}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <span className="text-[10px] font-black text-[#8A6100] dark:text-[#FFCE6B] flex items-center gap-1 mt-0.5">
              {isKu ? 'Veke' : isAr ? 'افتح' : 'Open'}
              <ChevronRight className="w-3 h-3 rtl:-scale-x-100" />
            </span>
          </motion.button>
        ))}
      </div>

      {/* Footer note — real progress summary now that lessons are live */}
      <p className="max-w-md mx-auto text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1" aria-live="polite">
        {isKu
          ? `${gramCount} mijar — veke û dest bi fêrbûnê bike`
          : isAr
            ? `${gramCount} مواضيع — افتح وابدأ التعلّم`
            : `${gramCount} topics — open one to start learning`}
        {anyProgress && (
          <span className="text-emerald-500 font-black">
            {isKu ? '· pêşketin hatiye tomarkirin' : isAr ? '· تم تسجيل التقدم' : '· progress saved'}
          </span>
        )}
      </p>
    </div>
  );
}

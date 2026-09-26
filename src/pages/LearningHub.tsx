import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { Sparkles, GraduationCap, ChevronRight, BookA, Binary, Palette, BookOpen, MessageSquare, Volume2, PenTool, Pencil, CornerDownRight, Zap } from 'lucide-react';
import { alphabet, vocabulary, sentences } from '../data/kurmanji';
import { academicVocabulary } from '../data/academic';
import {
  SUBJECT_ACCENTS,
  type LearningSubject,
  type SubjectAccent,
} from '../constants/subjectAccents';
import type { ReviewDeck } from '../services/SpacedRepetitionService';

type Language = 'en' | 'ar' | 'ku';

interface HubCard {
  id: LearningSubject;
  Icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  path: string;
}

// ROUTE MAP — keeps every destination in one place:
//   • /alphabet            → preserved Hawar Letters UI (Alphabet.tsx)
//   • /vocabulary/numbers  → existing numbers data + digit rendering (VocabularyList.tsx)
//   • /vocabulary/colors   → existing colors data + swatch rendering (VocabularyList.tsx)
//   • /vocabulary          → existing Vocabulary Hub (VocabularyCategories.tsx)
//   • /sentences           → existing Conversations/Phrases hub (Sentences.tsx)
//   • Pronunciation        → not built yet ("Coming soon")
//   • /grammar             → Grammar (Rêziman) sub-category hub (Grammar.tsx)
const HUB_CARDS: HubCard[] = [
  { id: 'letters',       Icon: BookA,         available: true,  path: '/alphabet' },
  { id: 'numbers',       Icon: Binary,        available: true,  path: '/vocabulary/numbers' },
  { id: 'colors',        Icon: Palette,       available: true,  path: '/vocabulary/colors' },
  { id: 'vocabulary',    Icon: BookOpen,      available: true,  path: '/vocabulary' },
  { id: 'phrases',       Icon: MessageSquare, available: true,  path: '/sentences' },
  { id: 'writing',       Icon: Pencil,        available: true,  path: '/writing' },
  { id: 'grammar',       Icon: PenTool,       available: true,  path: '/grammar' },
  { id: 'pronunciation', Icon: Volume2,       available: false, path: '' },
];

/** Arabic names are canonical per the spec (الأحرف، الأرقام، الألوان…). */
const AR_NAMES = {
  letters: 'الأحرف',
  numbers: 'الأرقام',
  colors: 'الألوان',
  vocabulary: 'المفردات',
  phrases: 'العبارات',
  pronunciation: 'النطق',
  grammar: 'النحو',
  writing: 'الكتابة',
} satisfies Record<LearningSubject, string>;

const EN_KU_NAMES = {
  letters: { en: 'Letters', ku: 'Tîp' },
  numbers: { en: 'Numbers', ku: 'Jimar' },
  colors: { en: 'Colors', ku: 'Reng' },
  vocabulary: { en: 'Vocabulary', ku: 'Peyv' },
  phrases: { en: 'Phrases', ku: 'Hevok' },
  pronunciation: { en: 'Pronunciation', ku: 'Bilêvkirin' },
  grammar: { en: 'Grammar', ku: 'Rêziman' },
  writing: { en: 'Writing', ku: 'Nivîsîn' },
} satisfies Record<LearningSubject, { en: string; ku: string }>;

const EN_KU_DESCS = {
  letters: { en: 'The Hawar alphabet', ku: 'Alfabeya Hawar' },
  numbers: { en: 'Zero to millions', ku: 'Ji sifir heta milyonan' },
  colors: { en: 'Colors of the world', ku: 'Rengên cîhanê' },
  vocabulary: { en: 'Everyday & academic words', ku: 'Peyvên rojane' },
  phrases: { en: 'Phrases & dialogues', ku: 'Hevok û diyalog' },
  pronunciation: { en: 'Speaking practice', ku: 'Piraniya axaftinê' },
  grammar: { en: 'Grammar basics', ku: 'Bingehên rêzimanê' },
  writing: { en: 'Learning to write letters', ku: 'Hînî nivîsîna tîpan' },
} satisfies Record<LearningSubject, { en: string; ku: string }>;

const AR_DESCS = {
  letters: 'الحروف الكردية',
  numbers: 'من صفر حتى الملايين',
  colors: 'ألوان العالم',
  vocabulary: 'كلمات يومية وأكاديمية',
  phrases: 'جمل ومحادثات',
  pronunciation: 'التدرب على النطق',
  grammar: 'أساسيات القواعد',
  writing: 'تعلّم كتابة الحروف',
} satisfies Record<LearningSubject, string>;

function title(id: LearningSubject, lang: Language): string {
  if (lang === 'ar') return AR_NAMES[id];
  return lang === 'ku' ? EN_KU_NAMES[id].ku : EN_KU_NAMES[id].en;
}

function description(id: LearningSubject, lang: Language): string {
  if (lang === 'ar') return AR_DESCS[id];
  return lang === 'ku' ? EN_KU_DESCS[id].ku : EN_KU_DESCS[id].en;
}

/**
 * Progress per subject comes from data the app already tracks — NOT a new
 * system. The SM-2 review deck (`userData.reviewDeck`) is keyed by the same
 * ids as the content datasets (`alphabet`, core + academic `vocabulary`), so
 * "reviewed" = the card has an entry in the deck. Sentences are not yet part
 * of the quiz universe, so Phrases honestly reports 0 until they get quizzed.
 */
const CONTENT_IDS = {
  letters: alphabet.map(l => l.id),
  numbers: vocabulary.filter(w => w.categoryId === 'numbers').map(w => w.id),
  colors: vocabulary.filter(w => w.categoryId === 'colors').map(w => w.id),
  vocabulary: [...vocabulary, ...academicVocabulary].map(w => w.id),
  phrases: sentences.map(s => s.id),
  writing: alphabet.map(l => l.id),
} satisfies Record<Exclude<LearningSubject, 'pronunciation' | 'grammar'>, string[]>;

function computeProgress(reviewDeck: ReviewDeck | undefined) {
  const deck = reviewDeck ?? {};
  return {
    letters: progressFor('letters', deck),
    numbers: progressFor('numbers', deck),
    colors: progressFor('colors', deck),
    vocabulary: progressFor('vocabulary', deck),
    phrases: progressFor('phrases', deck),
    pronunciation: { done: 0, total: 0 },
    grammar: { done: 0, total: 0 },
    writing: progressFor('writing', deck),
  } satisfies Record<LearningSubject, SubjectProgress>;
}

interface SubjectProgress {
  done: number;
  total: number;
}

function progressFor(
  subject: Exclude<LearningSubject, 'pronunciation' | 'grammar'>,
  deck: ReviewDeck,
): SubjectProgress {
  const ids = CONTENT_IDS[subject];
  const done = ids.filter(id => id in deck).length;
  return { done, total: ids.length };
}

/** Total reviewed words across all subjects — for the footer progress note. */
function totalReviewed(progress: Record<LearningSubject, SubjectProgress>): number {
  return SUBJECT_ORDER.reduce((sum, subject) => sum + (progress[subject]?.done ?? 0), 0);
}

const SUBJECT_ORDER: LearningSubject[] = ['letters', 'numbers', 'colors', 'vocabulary', 'phrases', 'writing', 'grammar', 'pronunciation'];

export function LearningHub() {
  const navigate = useNavigate();
  const { language, userData } = useAuth();
  const isAr = language === 'ar';

  const progress = useMemo(() => computeProgress(userData?.reviewDeck), [userData?.reviewDeck]);

  // Continue strip: most-recent reviewed subject + the next subject in order.
  const lastVisitedId = useMemo(() => {
    for (const subject of SUBJECT_ORDER) {
      if (subject === 'pronunciation') continue;
      if (progress[subject].done > 0) return subject;
    }
    return null;
  }, [progress]);
  const suggestedId = useMemo(() => {
    if (!lastVisitedId) return 'letters';
    const idx = SUBJECT_ORDER.indexOf(lastVisitedId);
    return SUBJECT_ORDER[(idx + 1) % SUBJECT_ORDER.length];
  }, [lastVisitedId]);

  const continueCard = lastVisitedId ? HUB_CARDS.find(c => c.id === lastVisitedId) : null;
  const suggestedCard = HUB_CARDS.find(c => c.id === suggestedId);

  // Motivator strip — XP today (existing `userData.xpToday` field only; no new
  // tracking, streak removed per UX pass).
  const todayUtc = new Date().toISOString().slice(0, 10);
  const xpToday = userData?.xpTodayDate === todayUtc ? (userData?.xpToday ?? 0) : 0;
  const dailyGoalTarget = userData?.dailyGoalXp ?? 0;
  const goalPercent = dailyGoalTarget > 0 ? Math.min(100, Math.round((xpToday / dailyGoalTarget) * 100)) : 0;

  return (
    <div className="p-4 space-y-4 min-h-screen pb-24 relative overflow-hidden">
      {/* Ambient brand glow (matches the app's warm-blob hero pattern) */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFB300]/10 dark:bg-[#FFB300]/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-5 w-60 h-60 bg-indigo-200/15 dark:bg-indigo-950/20 rounded-full filter blur-3xl pointer-events-none" />

      {/* 1. Hero — "التعلّم / Learning" */}
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-flat border border-line-soft relative overflow-hidden group">
        <GraduationCap className="absolute right-0 bottom-0 opacity-[0.06] w-40 h-40 transform translate-y-8 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-500" />

        <div className="space-y-2 relative z-10 text-start">
          <span className="text-[9px] bg-[#FFF6E0] dark:bg-[#3A2F14] text-[#8A6100] dark:text-[#FFCE6B] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB300] fill-[#FFB300]/40 animate-pulse" />
            {language === 'ku' ? 'NAVENDA FÊRBÛNÊ' : isAr ? 'مركز التعلّم' : 'LEARNING HUB'}
          </span>
          <h3 className="text-2xl font-black mt-2 leading-tight tracking-tight text-ink">
            {language === 'ku' ? 'Fêrbûn' : isAr ? 'التعلّم' : 'Learning'}
          </h3>
          <p className="text-muted text-[11px] leading-relaxed font-semibold">
            {language === 'ku'
              ? 'Cihê te yê fêrbûnê: tîp, jimar, reng û peyv — hemû di yek derî de.'
              : isAr
                ? 'كل ما تحتاجه للتعلّم في مكان واحد: الأحرف، الأرقام، الألوان والمفردات.'
                : 'Everything you need to learn — letters, numbers, colors and words — in one place.'}
          </p>
        </div>
      </div>

      {/* 2. Motivation strip — XP today, full-width (streak removed per UX pass).
          Single row: icon + label/score on the left, live progress bar filling
          the available width on the right. */}
      <div
        className="max-w-md mx-auto w-full bg-white dark:bg-slate-900 border border-line-soft border-s-4 border-s-[#FFB300] rounded-3xl px-4 py-3.5 shadow-flat"
        role="progressbar"
        aria-label={language === 'ku' ? 'XP îro' : isAr ? 'نقاط الخبرة اليوم' : 'XP today'}
        aria-valuemin={0}
        aria-valuemax={dailyGoalTarget > 0 ? dailyGoalTarget : 100}
        aria-valuenow={xpToday}
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#FFF3D6] dark:bg-[#3A2F14] flex items-center justify-center shrink-0" aria-hidden="true">
            <Zap className="w-4 h-4 text-[#B8860B] dark:text-[#FFCE6B] fill-[#FFB300]/40" />
          </span>
          <div className="min-w-0 lg:min-w-[150px]">
            <div className="text-[9px] font-black uppercase tracking-wider text-muted leading-none">
              {language === 'ku' ? 'XP îro' : isAr ? 'نقاط الخبرة اليوم' : 'XP today'}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-ink leading-none tabular-nums" dir="ltr">{xpToday}</span>
              {dailyGoalTarget > 0 && (
                <span className="text-[10px] font-black text-muted tabular-nums" dir="ltr">/ {dailyGoalTarget}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0" aria-hidden="true">
            {dailyGoalTarget > 0 ? (
              <>
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${goalPercent >= 100 ? 'bg-emerald-500' : 'bg-[#FFB300]'}`}
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <div className="mt-1 text-end text-[9px] font-black text-muted tabular-nums" dir="ltr">
                  {goalPercent}%
                </div>
              </>
            ) : (
              <div className="text-end text-[10px] font-black text-muted">
                {language === 'ku' ? 'Rojane xwe bixebitîne' : isAr ? 'تدرّب يومياً' : 'Keep learning daily'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Continue / next-topic strip */}
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
        {continueCard && suggestedCard && continueCard.id !== 'pronunciation' && (
          <>
            <button
              type="button"
              onClick={() => navigate(continueCard.path)}
              className="bg-white dark:bg-slate-900 border border-line rounded-2xl px-3 py-2.5 flex items-center gap-2 text-start hover:shadow-[0_10px_30px_rgba(30,41,59,0.07)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer min-h-[44px]"
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${SUBJECT_ACCENTS[continueCard.id].well}`} aria-hidden="true">
                <continueCard.Icon className={`w-4 h-4 ${SUBJECT_ACCENTS[continueCard.id].icon}`} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-wider text-muted leading-none">
                  {language === 'ku' ? 'Bidomîne' : isAr ? 'واصل' : 'Continue'}
                </span>
                <span className="block text-xs font-black text-ink truncate mt-0.5">{title(continueCard.id, language)}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate(suggestedCard.path)}
              className="bg-white dark:bg-slate-900 border border-line rounded-2xl px-3 py-2.5 flex items-center gap-2 text-start hover:shadow-[0_10px_30px_rgba(30,41,59,0.07)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer min-h-[44px]"
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${SUBJECT_ACCENTS[suggestedCard.id].well}`} aria-hidden="true">
                <suggestedCard.Icon className={`w-4 h-4 ${SUBJECT_ACCENTS[suggestedCard.id].icon}`} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-wider text-muted leading-none">
                  {language === 'ku' ? 'Ya bê' : isAr ? 'التالي' : 'Next up'}
                </span>
                <span className="block text-xs font-black text-ink truncate mt-0.5">{title(suggestedCard.id, language)}</span>
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 ms-auto text-muted rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </>
        )}
        {!continueCard && suggestedCard && (
          <button
            type="button"
            onClick={() => navigate(suggestedCard.path)}
            className="col-span-2 bg-white dark:bg-slate-900 border border-line rounded-2xl px-3 py-2.5 flex items-center gap-2 text-start hover:shadow-[0_10px_30px_rgba(30,41,59,0.07)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer min-h-[44px]"
          >
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${SUBJECT_ACCENTS[suggestedCard.id].well}`} aria-hidden="true">
              <suggestedCard.Icon className={`w-4 h-4 ${SUBJECT_ACCENTS[suggestedCard.id].icon}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-wider text-muted leading-none">
                {language === 'ku' ? 'Bi dest pê bike' : isAr ? 'ابدأ من هنا' : 'Start here'}
              </span>
              <span className="block text-xs font-black text-ink truncate mt-0.5">{title(suggestedCard.id, language)}</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 ms-auto text-muted rtl:-scale-x-100" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 3. Section cards */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {HUB_CARDS.map((card, index) => {
          const accent: SubjectAccent = SUBJECT_ACCENTS[card.id];
          const prog = progress[card.id];
          const pct = prog.total > 0 ? Math.min(100, Math.round((prog.done / prog.total) * 100)) : 0;
          const isLocked = !card.available;
          const progressSummary = `${totalReviewed(progress)} ${language === 'ku' ? 'peyv hîn bûne' : isAr ? 'كلمة تم تعلّمها' : 'words learned'}`;

          if (isLocked) {
            // PHASE 3 (a11y): the "Coming soon" card is genuinely inert — a
            // non-interactive div marked aria-disabled, drop from the tab order,
            // and self-described to screen readers. Keeping the button for the
            // disabled card put a focusable control with a no-op handler in the
            // tab order (and a "disabled-looking" element that ATs still read
            // as actionable).
            return (
              <motion.div
                key={card.id}
                aria-disabled="true"
                aria-label={`${title(card.id, language)} — ${language === 'ku' ? 'Di nêzîk de' : isAr ? 'قريباً' : 'Coming Soon'}`}
                title={`${title(card.id, language)} — ${language === 'ku' ? 'Di nêzîk de' : isAr ? 'قريباً' : 'Coming Soon'}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
                className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-[26px] p-5 flex flex-col items-center justify-center gap-3 text-center shadow-xs relative overflow-hidden select-none min-h-[150px]"
              >
                <span className="absolute top-2.5 end-2.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-[#8A6100] dark:text-[#FFCE6B] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <span>{language === 'ku' ? 'Di nêzîk de' : isAr ? 'قريباً' : 'Coming Soon'}</span>
                </span>

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 opacity-70" aria-hidden="true">
                  <card.Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>

                <div className="text-center w-full">
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-snug">
                    {title(card.id, language)}
                  </div>
                  <div className="text-[11px] font-semibold mt-1 leading-snug text-slate-500 dark:text-slate-400">
                    {language === 'ku' ? 'Nêzîk e — di pêşketinê de ye' : isAr ? 'قيد التطوير' : 'Under development'}
                  </div>
                </div>

                {/* Screen-reader pointer to the most relevant action instead of
                    a dead control. */}
                <span className="sr-only">
                  {language === 'ku' ? 'Ev beş hîn amade nîne.' : isAr ? 'هذا القسم غير متاح بعد.' : 'This section is not available yet.'}
                </span>
              </motion.div>
            );
          }

          return (
            <motion.button
              key={card.id}
              type="button"
              aria-label={`${title(card.id, language)} — ${progressSummary}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(card.path)}
              className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 rounded-[26px] p-5 flex flex-col items-center justify-center gap-3 hover:shadow-[0_10px_30px_rgba(30,41,59,0.07)] hover:scale-[1.015] transition-all active:scale-95 cursor-pointer relative overflow-hidden min-h-[150px] shadow-[0_8px_30px_rgba(0,0,0,0.025)]"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${accent.well}`}
              >
                <card.Icon className={`w-6 h-6 ${accent.icon}`} />
              </div>

              <div className="text-center w-full">
                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-snug">
                  {title(card.id, language)}
                </div>
                <div className="text-[11px] font-semibold mt-1 leading-snug text-muted">
                  {description(card.id, language)}
                </div>
              </div>

              {/* Lightweight progress — count + accent bar (reviewDeck-backed). */}
              {prog.total > 0 && (
                <div className="w-full">
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" aria-hidden="true">
                    <div className={`h-full rounded-full transition-all duration-500 ${accent.barFill}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5" data-testid={`progress-${card.id}`}>
                    <span className="text-[9px] font-black text-muted uppercase tracking-wider">
                      {prog.done}/{prog.total}
                    </span>
                    <span className="text-[9px] font-black text-muted">{pct}%</span>
                  </div>
                </div>
              )}

              <span className="text-[10px] font-black text-[#8A6100] dark:text-[#FFCE6B] flex items-center gap-1 mt-0.5">
                {language === 'ku' ? 'Veke' : isAr ? 'افتح' : 'Open'}
                <ChevronRight className="w-3 h-3 rtl:-scale-x-100" />
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* After the grid: a calm, honest progress note. Pronunciation stays the
          only section awaiting content, carried by its coming-soon badge. */}
      <p className="max-w-md mx-auto text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1" aria-live="polite">
        <CornerDownRight className="w-3 h-3" />
        {language === 'ku'
          ? `Her mijar gavek e li ser rêya te — ${totalReviewed(progress)} peyv di dest de vekolîne`
          : isAr
            ? `كل موضوع هو خطوة على مسارك — ${totalReviewed(progress)} كلمة تعلّمتها حتى الآن`
            : `Each topic is one step along your path — ${totalReviewed(progress)} words reviewed so far`}
      </p>
    </div>
  );
}

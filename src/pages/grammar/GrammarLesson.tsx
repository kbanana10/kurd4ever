import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, RotateCcw, BookOpen, Table, Languages, Headphones, PenLine, ArrowLeftRight, Keyboard, ListOrdered } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { getGrammarLesson } from '../../data/grammar';
import { SUBJECT_ACCENTS } from '../../constants/subjectAccents';
import { exerciseIconKey } from '../../lib/grammar/grammarPresentation';
import { useGrammarLesson } from './useGrammarLesson';
import { ConceptCard } from './ConceptCard';
import { SelectTranslationExercise } from './SelectTranslationExercise';
import { ListenChooseExercise } from './ListenChooseExercise';
import { CompleteSentenceExercise } from './CompleteSentenceExercise';
import { MatchPairsExercise } from './MatchPairsExercise';
import { WriteWordExercise } from './WriteWordExercise';
import { ArrangeSentenceExercise } from './ArrangeSentenceExercise';

const ACCENT = SUBJECT_ACCENTS.grammar;

type Stage = 'concepts' | 'exercises';

const EXERCISE_LABELS = {
  'select_translation': { en: 'Choose the translation', ar: 'اختر الترجمة', ku: 'Wergerê hilbijêre' },
  'listen_choose': { en: 'Listen & choose', ar: 'اسمع واختر', ku: 'Guhdarî bike û hilbijêre' },
  'complete_sentence': { en: 'Complete the sentence', ar: 'أكمل الجملة', ku: 'Hevokê temam bike' },
  'match_pairs': { en: 'Match pairs', ar: 'طابِق الأزواج', ku: 'Cotan bigihîne' },
  'write_word': { en: 'Write the word', ar: 'اكتب الكلمة', ku: 'Peyvê binivîse' },
  'arrange_sentence': { en: 'Arrange the sentence', ar: 'رتّب الجملة', ku: 'Hevokê sererast bike' },
} as const;

/** Exercise-type badge icon — only listen_choose keeps the headphone icon. */
const EXERCISE_ICONS = {
  languages: Languages,
  headphones: Headphones,
  pen: PenLine,
  'arrow-left-right': ArrowLeftRight,
  keyboard: Keyboard,
  'list-ordered': ListOrdered,
} as const;

export function GrammarLessonPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const { language } = useAuth();
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const lesson = lessonId ? getGrammarLesson(lessonId) : null;
  const engine = useGrammarLesson(lesson);

  const [stage, setStage] = useState<Stage>('concepts');
  const [conceptIndex, setConceptIndex] = useState(0);

  const backLabel = isKu ? 'Vegere' : isAr ? 'رجوع' : 'Back';

  if (!lesson) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center gap-4 p-4 pb-24">
        <button
          type="button"
          onClick={() => navigate('/grammar')}
          className="flex items-center gap-1.5 text-sm font-black text-teal-600 dark:text-teal-400 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
          {isKu ? 'Rêziman' : isAr ? 'النحو' : 'Grammar'}
        </button>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-line-soft rounded-[32px] p-8 shadow-flat text-center space-y-3">
          <h3 className="text-xl font-black tracking-tight text-ink">
            {isKu ? 'Ders nehat dîtin' : isAr ? 'الدرس غير موجود' : 'Lesson not found'}
          </h3>
          <p className="text-muted text-[12px] font-semibold">
            {isKu ? 'Ev mijar tune ye.' : isAr ? 'هذا الموضوع غير متوفر.' : 'That grammar topic does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const concepts = lesson.concepts;
  const concept = concepts[conceptIndex];
  const conceptTotal = concepts.length;
  const exercise = engine.exercise;
  const showResults = stage === 'exercises' && engine.phase === 'finished';

  const exerciseLabel = exercise
    ? (isAr ? EXERCISE_LABELS[exercise.type].ar : isKu ? EXERCISE_LABELS[exercise.type].ku : EXERCISE_LABELS[exercise.type].en)
    : '';
  const ExerciseIcon = exercise ? EXERCISE_ICONS[exerciseIconKey(exercise.type)] : null;

  function renderExerciseBody() {
    if (!exercise) return null;
    const key = exercise.id;
    const checked = engine.checked;
    const onNext = engine.nextExercise;
    switch (exercise.type) {
      case 'select_translation':
        return <SelectTranslationExercise key={key} exercise={exercise} checked={checked} onCheck={(v) => void engine.checkAnswer({ kind: 'choice', value: v })} onNext={onNext} />;
      case 'listen_choose':
        return <ListenChooseExercise key={key} exercise={exercise} checked={checked} onCheck={(v) => void engine.checkAnswer({ kind: 'choice', value: v })} onNext={onNext} />;
      case 'complete_sentence':
        return <CompleteSentenceExercise key={key} exercise={exercise} checked={checked} onCheck={(v) => void engine.checkAnswer({ kind: 'choice', value: v })} onNext={onNext} />;
      case 'match_pairs':
        return <MatchPairsExercise key={key} exercise={exercise} checked={checked} onCheck={(rightIndexes) => void engine.checkAnswer({ kind: 'match', rightIndexes })} onNext={onNext} />;
      case 'write_word':
        return <WriteWordExercise key={key} exercise={exercise} checked={checked} onCheck={(v) => void engine.checkAnswer({ kind: 'text', value: v })} onNext={onNext} />;
      case 'arrange_sentence':
        return <ArrangeSentenceExercise key={key} exercise={exercise} checked={checked} onCheck={(words) => void engine.checkAnswer({ kind: 'reorder', words })} onNext={onNext} />;
      default:
        return null;
    }
  }

  return (
    <div className="p-4 pb-24 min-h-screen relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFB300]/10 dark:bg-[#FFB300]/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-5 w-60 h-60 bg-teal-200/15 dark:bg-teal-950/20 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto flex flex-col gap-4 min-h-[calc(100dvh-7rem)]">
        {/* Header: back + title + stage progress */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/grammar')}
            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-line-soft shadow-xs hover:opacity-80 transition-opacity"
            aria-label={backLabel}
          >
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black tracking-tight text-ink leading-snug truncate">
              {isAr ? lesson.title.ar : isKu ? lesson.title.ku : lesson.title.en}
            </h1>
            {stage === 'concepts' && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full transition-all duration-300 [background:linear-gradient(90deg,#FFB300,#14b8a6)]"
                    style={{ width: `${Math.round((conceptIndex / Math.max(1, conceptTotal)) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-black text-muted">
                  {conceptIndex + 1}/{conceptTotal}
                </span>
              </div>
            )}
            {stage === 'exercises' && !showResults && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full transition-all duration-300 [background:linear-gradient(90deg,#FFB300,#14b8a6)]"
                    style={{ width: `${Math.round((engine.index / Math.max(1, engine.total)) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-black text-muted">
                  {engine.index + 1}/{engine.total}
                </span>
              </div>
            )}
          </div>
        </div>

        {stage === 'concepts' && (
          <>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
              {concepts.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConceptIndex(i)}
                  aria-label={`${isAr ? 'مفهوم' : 'Concept'} ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === conceptIndex ? 'w-6 bg-teal-500' : 'w-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {concept && <ConceptCard key={concept.id} concept={concept} language={language} />}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              {conceptIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setConceptIndex((i) => Math.max(0, i - 1))}
                  className="flex-1 py-3.5 rounded-3xl font-black text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 border-none"
                >
                  <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
                  {isAr ? 'السابق' : isKu ? 'Paş' : 'Back'}
                </button>
              )}
              {conceptIndex < conceptTotal - 1 ? (
                <button
                  type="button"
                  onClick={() => setConceptIndex((i) => Math.min(conceptTotal - 1, i + 1))}
                  className="flex-1 py-3.5 rounded-3xl font-black text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {isAr ? 'التالي' : isKu ? 'Pêş' : 'Next'}
                  <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStage('exercises')}
                  className="flex-1 py-3.5 rounded-3xl font-black text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAr ? 'ابدأ التمارين' : isKu ? 'Dest bi temrînan bike' : 'Start exercises'}
                </button>
              )}
            </div>
          </>
        )}

            {stage === 'exercises' && !showResults && (
          <>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max ${ACCENT.well} ${ACCENT.icon}`}>
                {ExerciseIcon ? <ExerciseIcon className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                {exerciseLabel}
              </span>
              <span className="text-[10px] font-black text-muted">{isAr ? 'النقاط:' : 'Score:'} {engine.score}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-flat border border-line-soft flex flex-col flex-1">
              {renderExerciseBody()}
            </div>
          </>
        )}

        {showResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-flat border border-line-soft flex flex-col items-center text-center gap-4 relative overflow-hidden"
          >
            <div className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${ACCENT.well}`} aria-hidden="true">
              <CheckCircle2 className={`w-9 h-9 ${ACCENT.icon}`} />
            </div>
            <div className="relative z-10 space-y-1">
              <h3 className="text-xl font-black tracking-tight text-ink leading-snug">
                {isKu ? 'Pîroz be!' : isAr ? 'أحسنت!' : 'Lesson complete!'}
              </h3>
              <p className="text-muted text-[12px] font-semibold">
                {isAr ? `أنهيتَ درس ${lesson.title.ar}.` : isKu ? `Te dersa ${lesson.title.ku} qedand.` : `You finished ${lesson.title.en}.`}
              </p>
            </div>

            <div className="relative z-10 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 flex items-center justify-around">
              <div className="text-center">
                <div className="text-2xl font-black text-ink">{engine.score}/{engine.total}</div>
                <div className="text-[10px] font-black text-muted uppercase tracking-wider">{isAr ? 'النقاط' : 'Score'}</div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
              <div className="text-center">
                <div className="text-2xl font-black text-[#D97706] dark:text-[#FFCE6B]">+{engine.earnedXp ?? 0}</div>
                <div className="text-[10px] font-black text-muted uppercase tracking-wider">XP</div>
              </div>
            </div>

            {/* Step 4 — quick reference table */}
            {lesson.summaryTable && (
              <div className="relative z-10 w-full rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-start" dir="auto">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted mb-2">
                  <Table className="w-3.5 h-3.5" />
                  {isAr ? 'جدول مرجعي' : 'Quick reference'}
                </span>
                <div className="space-y-1.5">
                  {lesson.summaryTable.rows.map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-700/70 pb-1.5 last:border-0">
                      <bdi dir="ltr" className="text-[12px] font-black text-ink">{row.ku}</bdi>
                      <span className="text-[11px] font-bold text-muted">{isAr ? row.ar : row.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative z-10 flex flex-col w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  setConceptIndex(0);
                  setStage('concepts');
                }}
                className="w-full py-3.5 rounded-3xl font-black text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <BookOpen className="w-4 h-4" />
                {isAr ? 'مراجعة البطاقات' : isKu ? 'Vegere kartan' : 'Review cards'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/grammar')}
                className="w-full py-3.5 rounded-3xl font-black text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-200 dark:hover:bg-slate-700 border-none"
              >
                {isKu ? 'Vegere Rêzimanê' : isAr ? 'العودة إلى النحو' : 'Back to Grammar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  engine.restart();
                  setStage('exercises');
                }}
                className="w-full py-3 rounded-3xl font-bold text-sm bg-transparent text-teal-600 dark:text-teal-400 flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-70 border-none"
              >
                <RotateCcw className="w-4 h-4" />
                {isKu ? 'Dîsa biceribîne' : isAr ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

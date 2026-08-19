import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../store/AuthContext';
import { X, AlertTriangle, ShieldCheck, Check, Gem, Lightbulb, PartyPopper, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdStore } from '../features/monetization/store/adStore';
import { t } from '../localization/translations';
import { AudioButton } from '../features/audio/components/AudioButton';
import { getMuteState, setMuteState, playAudioUrl, stopAllActiveAudio } from '../features/audio/hooks/useAudio';
import { useQuizEngine } from '../features/quiz/hooks/useQuizEngine';
import { getAdaptiveLevelId } from '../features/quiz/utils/questionGenerator';
import { categories } from '../data/kurmanji';
import { academicCategories } from '../data/academic';
import { learningPath } from '../data/learningPath';
import { MultipleChoiceQuestion } from '../features/quiz/components/MultipleChoiceQuestion';
import { TranslateQuestion } from '../features/quiz/components/TranslateQuestion';
import { ScrambledLettersQuestion } from '../features/quiz/components/ScrambledLettersQuestion';
import { SentenceReorderQuestion } from '../features/quiz/components/SentenceReorderQuestion';
import { QuizStudyPhase } from '../features/quiz/components/QuizStudyPhase';
import { QuizModePicker } from '../features/quiz/components/QuizModePicker';
import { QuizResults } from '../features/quiz/components/QuizResults';
import { cn } from '../utils/cn';
import { Badge, Button, Card, ErrorState, Modal, Progress, Spinner } from '../components/ui';

/**
 * NOTE (TODO-029): the study-phase, mode-picker and results screens were
 * extracted to `src/features/quiz/components/` — this file is now only the
 * orchestrator + the active-question screen. Icon rendering for the study
 * phase delegates to the single registry in `wordIcons` inside
 * QuizStudyPhase.
 */
export function Quiz() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { showInterstitial } = useAdStore();
  const { userData, updateUserData, updateUserProgress, language } = useAuth();
  
  // Audio Speed Throttle State
  const [useSlowPronunciation, setUseSlowPronunciation] = useState(false);

  // Global Audio Muted Feedback State
  const [isMuted, setIsMuted] = useState(getMuteState());

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    setMuteState(nextMute);
  };

  // Study Phase, initialized to true for standard CEFR units
  const [isInStudyPhase, setIsInStudyPhase] = useState(true);

  // Scrambled & word ordering active blocks sequence state
  const [selectedBlockIndices, setSelectedBlockIndices] = useState<number[]>([]);

  // Hint state (see the "Use Hint" audit fix below).
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);

  // Mid-run exit confirmation (full-app audit): the ✕ used to abort the run
  // instantly — hearts and question progress were discarded without warning.
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const {
    selectedQuizMode,
    setSelectedQuizMode,
    questions,
    questionSetReady,
    currentIndex,
    selectedOption,
    typingAnswer,
    setTypingAnswer,
    hasChecked,
    isCorrect,
    score,
    hearts,
    isFinished,
    showConfetti,
    earnedXp,
    earnedGems,
    missedQuestions,
    restartMissedQuestions,
    handleOptionSelect,
    handleVerify,
    handleNext,
    handleCharClick
  } = useQuizEngine({
    moduleId,
    language,
    updateUserProgress,
    updateUserData,
    userData,
    navigateBack: () => navigate(-1)
  });

  // Reset sequence blocks indices whenever index changes
  React.useEffect(() => {
    setSelectedBlockIndices([]);
    setHintUsed(false);
    setEliminatedOptions([]);
  }, [currentIndex]);

  /**
   * LISTENING QUIZ: auto-play the pronunciation the moment a listen-type
   * question appears (respects the global mute switch inside playAudioUrl).
   * A short delay lets the engine's stopAllActiveAudio() on index change win
   * first, so the new clip never races the old one.
   */
  const activeListenQ = !isFinished && questionSetReady ? questions[currentIndex] : undefined;
  React.useEffect(() => {
    if (!activeListenQ || activeListenQ.type !== 'listen' || !activeListenQ.audio) return;
    const timer = window.setTimeout(() => {
      void playAudioUrl(
        activeListenQ.audio,
        activeListenQ.word?.ku || activeListenQ.correctAnswer,
        useSlowPronunciation ? 0.65 : 1.0
      );
    }, 400);
    return () => {
      window.clearTimeout(timer);
      stopAllActiveAudio();
    };
    // (deps intentionally narrowed — see comment above)
  }, [activeListenQ?.id]);

  const getCategoryInfo = () => {
    if (moduleId === 'alphabet') return { name: t(language, 'alphabet'), icon: 'Type' };
    if (moduleId === 'srs_review') return { name: language !== 'ar' ? 'Spaced Repetition Review' : 'مراجعة التكرار المتباعد', icon: 'RotateCcw' };
    if (moduleId === 'review_mistakes') return { name: language !== 'ar' ? 'Review Lessons Mistakes' : 'مراجعة وتكرار الأخطاء والمطبات', icon: 'Brain' };
    
    // Find in CEFR Path lessons
    for (const lvl of learningPath) {
      const les = lvl.lessons.find(l => l.id === moduleId);
      if (les) return { name: language !== 'ar' ? les.titleEn : les.titleAr, icon: les.icon };
    }

    const cat = categories.find(c => c.id === moduleId);
    if (cat) return { name: language !== 'ar' ? cat.name : (cat.ar || cat.name), icon: cat.icon };
    
    const acadCat = academicCategories.find(c => c.id === moduleId);
    if (acadCat) return { name: language !== 'ar' ? acadCat.nameEn : acadCat.nameAr, icon: acadCat.icon };

    return { name: 'Practice Sandbox', icon: 'BookOpen' };
  };

  const catInfo = getCategoryInfo();

  // Current playing level for the Adaptive Practice badge.
  const userLevelId = getAdaptiveLevelId(userData);

  // Fetch matching vocabulary elements for active Study phase
  let matchedLessonWords: any[] = [];
  for (const lvl of learningPath) {
    const matched = lvl.lessons.find(l => l.id === moduleId);
    if (matched) {
      matchedLessonWords = matched.words;
      break;
    }
  }

  // Study phase for mixed challenge
  if (selectedQuizMode === 'mixed_challenge' && isInStudyPhase && matchedLessonWords.length > 0) {
    return (
      <QuizStudyPhase
        language={language}
        catName={catInfo.name}
        catIcon={catInfo.icon}
        words={matchedLessonWords}
        useSlowPronunciation={useSlowPronunciation}
        onToggleSlow={setUseSlowPronunciation}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStart={() => setIsInStudyPhase(false)}
        onExit={() => navigate('/roadmap')}
      />
    );
  }

  if (!selectedQuizMode) {
    return (
      <QuizModePicker
        language={language}
        userLevelId={userLevelId}
        showAdaptive={(userData?.completedLessons?.length ?? 0) > 0}
        onSelectMode={setSelectedQuizMode}
        onBack={() => navigate(-1)}
        onLeaderboard={() => navigate('/leaderboard')}
      />
    );
  }

  if (!questionSetReady) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Spinner size="lg" showLabel label={t(language, 'loading')} />
      </div>
    );
  }

  if (isFinished) {
    return (
      <QuizResults
        language={language}
        score={score}
        total={questions.length}
        earnedXp={earnedXp}
        earnedGems={earnedGems}
        showConfetti={showConfetti}
        hasMissedQuestions={missedQuestions.length > 0}
        onPrimary={() => {
          if (missedQuestions.length > 0) {
            restartMissedQuestions();
          } else {
            showInterstitial(() => {
              navigate('/roadmap');
            });
          }
        }}
        onHome={() => navigate('/')}
      />
    );
  }

  const currentQ = questions[currentIndex];

  /**
   * AUDIT FIX: previously ANY state without a current question rendered an
   * infinite "Loading…" spinner. generateQuestionsForModule() returns [] for an
   * unknown moduleId, so a stale deep link such as /quiz/deleted_lesson trapped
   * the user on a spinner forever with no error and no way out except the OS
   * back gesture. We now distinguish "no content" from "still initialising":
   * the spinner above keys off `questionSetReady` (the engine's own generation
   * flag), so an empty pool after generation reaches this branch instead of
   * being swallowed by a `questions.length === 0` spinner that shadowed it.
   */
  if (questions.length === 0) {
    // Review modes with an empty queue are a SUCCESS state, not an error.
    // (Previously they showed "lesson may have been moved or renamed",
    // which made Spaced Reviews / Fix Mistakes look broken.)
    if (moduleId === 'srs_review' || moduleId === 'review_due' || moduleId === 'review_mistakes') {
      const isSrs = moduleId !== 'review_mistakes';
      return (
        <div className="p-6 flex flex-col items-center justify-center h-full gap-5 text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PartyPopper className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-ink">
              {isSrs
                ? (language === 'ku' ? 'Tu bi tevahî amade yî! 🎉' : language === 'ar' ? 'أنت على اطلاع تام! 🎉' : 'All caught up! 🎉')
                : (language === 'ku' ? 'Tomara te paqij e! ✨' : language === 'ar' ? 'سجلك نظيف! ✨' : 'Clean record! ✨')}
            </h2>
            <p className="text-sm text-muted font-semibold leading-relaxed">
              {isSrs
                ? (language === 'ku' ? 'Niha tu peyvên ji bo dubarekirinê tune ne. Dersan bidomîne — dubarekirin dê li vir xuya bibin.' : language === 'ar' ? 'لا توجد كلمات بحاجة للمراجعة الآن. واصل الدروس وستظهر المراجعات هنا.' : 'No words are due for review right now. Keep learning — new reviews will appear here as you go.')
                : (language === 'ku' ? 'Tu çewtiyên ji bo rastkirinê tune ne. Karê hêja!' : language === 'ar' ? 'لا توجد أخطاء لمعالجتها. عمل رائع!' : 'You have no mistakes to fix. Great work!')}
            </p>
          </div>
          <Button size="lg" fullWidth onClick={() => navigate('/roadmap')}>
            {language === 'ku' ? 'Berdewamî fêrbûnê' : language === 'ar' ? 'واصل التعلم' : 'Keep Learning'}
          </Button>
        </div>
      );
    }
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
        <ErrorState
          icon={<AlertTriangle className="w-8 h-8" aria-hidden="true" />}
          title={language !== 'ar' ? 'This lesson has no questions yet' : 'لا توجد أسئلة في هذا الدرس بعد'}
          description={
            language !== 'ar'
              ? 'The lesson may have been moved or renamed. Pick another lesson from the roadmap.'
              : 'ربما تم نقل الدرس أو إعادة تسميته. اختر درساً آخر من الخارطة.'
          }
          onRetry={() => navigate('/roadmap')}
          retryLabel={language !== 'ar' ? 'Roadmap' : 'الخارطة'}
          className="w-full max-w-sm"
        />
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          {language !== 'ar' ? 'Go back' : 'رجوع'}
        </Button>
      </div>
    );
  }

  if (!currentQ || !currentQ.question) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Spinner size="lg" showLabel label={t(language, 'loading')} />
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const currentSpeed = useSlowPronunciation ? 0.65 : 1.0;

  const getQuizModeTitle = () => {
    // AUDIT FIX (full-app sweep): review flows auto-start in mixed mode, so the
    // header displayed the generic "Unit Challenge" label. Keep their module
    // identity ("Spaced Repetition Review" / "Review Lessons Mistakes") instead.
    if (moduleId === 'srs_review' || moduleId === 'review_mistakes') return getCategoryInfo().name;
    if (selectedQuizMode === 'multiple_choice') return t(language, 'quiz_mode_word_title');
    if (selectedQuizMode === 'emoji_match') return t(language, 'quiz_mode_image_title');
    if (selectedQuizMode === 'listening') return t(language, 'quiz_mode_listening_title');
    if (selectedQuizMode === 'write_kurdish') return t(language, 'quiz_mode_writing_title');
    if (selectedQuizMode === 'adaptive_practice') return t(language, 'quiz_mode_adaptive_title');
    if (selectedQuizMode === 'mixed_challenge') return t(language, 'quiz_mode_mixed_title');
    return language !== 'ar' ? 'Quiz' : 'اختبار';
  };

  /** Option-style questions are graded on tap and use the shared bottom
   *  action row; typed/arranged questions ship their OWN Check/Continue
   *  controls (previously both rendered at once — two competing Verify
   *  buttons on every writing question). */
  const isOptionQuestion =
    currentQ.type === 'multiple_choice' ||
    currentQ.type === 'true_false' ||
    currentQ.type === 'emoji' ||
    currentQ.type === 'listen';

  return (
    <div className="p-4 flex flex-col h-full absolute top-0 start-0 w-full bg-surface-2 text-ink z-50 select-none pb-24 overflow-y-auto">
      
      {/* Quiz Header Bar */}
      <div className="flex items-center justify-between gap-3 py-2 mb-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowExitConfirm(true)}
          aria-label={language !== 'ar' ? 'Exit quiz' : 'إنهاء الاختبار'}
          className="shrink-0 w-11 !px-0 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Exit confirmation — a run in progress carries hearts + answered
            questions; leaving must be an explicit decision, mirroring the
            accessible Modal pattern used by the Android exit dialog. */}
        <Modal
          open={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          title={t(language, 'quiz_exit_title')}
          description={t(language, 'quiz_exit_msg')}
          hideCloseButton
        >
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowExitConfirm(false)}
            >
              {t(language, 'quiz_exit_keep')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                setShowExitConfirm(false);
                setSelectedQuizMode(null);
              }}
            >
              {t(language, 'quiz_exit_leave')}
            </Button>
          </div>
        </Modal>

        <h2 className="text-base font-black text-ink truncate">
          {getQuizModeTitle()}
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          {hearts !== null && (
            <span
              className="flex items-center gap-0.5"
              role="status"
              aria-label={language !== 'ar' ? `${hearts} hearts left` : `${hearts} قلوب متبقية`}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    'w-4 h-4 transition-colors',
                    i < hearts ? 'text-[#FF5722] fill-[#FF5722]' : 'text-line-soft fill-transparent'
                  )}
                />
              ))}
            </span>
          )}
          <Badge tone="primary" className="shrink-0 tracking-normal">
            {currentIndex + 1}/{questions.length}
          </Badge>
        </div>
      </div>

      {/*
        PHASE 1: the progress line was a bare div pair with no ARIA, so the
        quiz reported no progress to assistive tech. Progress exposes
        role="progressbar" with value/valuetext.
      */}
      <Progress
        value={progressPercent}
        size="sm"
        label={language !== 'ar' ? 'Quiz progress' : 'تقدم الاختبار'}
        className="mb-6 max-w-sm mx-auto w-full [&>div:first-child]:sr-only"
      />

      {/* Question Panel */}
      <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full space-y-4">
        
        {/* Question Prompt Card */}
        <Card padding="lg" className="text-center flex flex-col items-center justify-center space-y-3">

          {currentQ.type === 'listen' ? (
            <>
              <h2 className="text-lg font-black text-ink tracking-tight">
                {currentQ.question || ""}
              </h2>
              {/* Hero replay control: listening is the whole exercise, so the
                  audio trigger is the centrepiece, not a side chip. */}
              <AudioButton
                audioUrl={currentQ.audio}
                textToSpeak={currentQ.word?.ku || currentQ.correctAnswer}
                className="w-16 h-16 bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] rounded-full flex items-center justify-center transition-colors cursor-pointer border-none shadow-flat"
                iconClassName="w-7 h-7"
                showProgress={false}
                playbackRate={currentSpeed}
              />
              <span className="text-xs font-bold text-muted">
                {t(language, 'quiz_tap_to_replay')}
              </span>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3 pt-1">
              <h2 className="text-2xl font-black text-ink tracking-tight">
                {currentQ.question || ""}
              </h2>

              {currentQ.audio && (
                <AudioButton 
                  audioUrl={currentQ.audio}
                  textToSpeak={currentQ.word?.ku}
                  className="bg-surface-2 hover:bg-surface-3 p-2.5 text-brand rounded-control transition-colors cursor-pointer border-none"
                  iconClassName="w-5 h-5"
                  showProgress={false}
                  playbackRate={currentSpeed}
                />
              )}
            </div>
          )}
        </Card>

        {/* Choice list / Options — centred in the free space (the old
            justify-end pinned them to the bottom, leaving a dead void) */}
        <div className="flex-1 flex flex-col justify-center">
          {(() => {
            if (
              currentQ.type === 'multiple_choice' || 
              currentQ.type === 'true_false' || 
              currentQ.type === 'emoji' || 
              currentQ.type === 'listen'
            ) {
              return (
                <MultipleChoiceQuestion
                  currentQ={currentQ}
                  eliminatedOptions={eliminatedOptions}
                  selectedOption={selectedOption}
                  hasChecked={hasChecked}
                  isCorrect={isCorrect}
                  handleOptionSelect={handleOptionSelect}
                />
              );
            }

            if (currentQ.type === 'translate' || currentQ.type === 'fill_blank') {
              return (
                <TranslateQuestion
                  currentQ={currentQ}
                  typingAnswer={typingAnswer}
                  setTypingAnswer={setTypingAnswer}
                  hasChecked={hasChecked}
                  isCorrect={isCorrect}
                  language={language}
                  handleCharClick={handleCharClick}
                  handleVerify={handleVerify}
                  handleNext={handleNext}
                />
              );
            }

            if (currentQ.type === 'scrambled_letters') {
              return (
                <ScrambledLettersQuestion
                  currentQ={currentQ}
                  typingAnswer={typingAnswer}
                  setTypingAnswer={setTypingAnswer}
                  selectedBlockIndices={selectedBlockIndices}
                  setSelectedBlockIndices={setSelectedBlockIndices}
                  hasChecked={hasChecked}
                  isCorrect={isCorrect}
                  language={language}
                  handleVerify={handleVerify}
                  handleNext={handleNext}
                />
              );
            }

            if (currentQ.type === 'sentence_reorder') {
              return (
                <SentenceReorderQuestion
                  currentQ={currentQ}
                  selectedBlockIndices={selectedBlockIndices}
                  setSelectedBlockIndices={setSelectedBlockIndices}
                  typingAnswer={typingAnswer}
                  setTypingAnswer={setTypingAnswer}
                  hasChecked={hasChecked}
                  isCorrect={isCorrect}
                  language={language}
                  handleVerify={handleVerify}
                  handleNext={handleNext}
                />
              );
            }

            return null;
          })()}
        </div>

        {/* Bottom Actions Row — only for option-style questions. Typed and
            arranged question components render their own Check/Continue
            controls (the old global Verify duplicated them). */}
        {isOptionQuestion && (
        <div className="space-y-2 pt-2">
          {/* Feedback banner: "Pir baş!" on success, the correct answer on a miss. */}
          <AnimatePresence>
            {hasChecked && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                role="status"
                className={cn(
                  'rounded-card border-2 px-4 py-3 flex items-center gap-2.5 text-start',
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                )}
              >
                {isCorrect ? (
                  <>
                    <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span className="font-black text-sm">{t(language, 'quiz_feedback_correct')}</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 shrink-0 text-rose-600" aria-hidden="true" />
                    <span className="text-sm font-bold min-w-0">
                      <span className="opacity-75">{t(language, 'correct_answer_is')}</span>{' '}
                      <bdi className="font-black">{currentQ.correctAnswer}</bdi>
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {hasChecked && (
            <Button
              size="lg"
              fullWidth
              onClick={(e) => {
                // Contain the event and delegate to the debounced engine
                // advance (cancels any pending auto-advance timer; a single
                // click can only ever move exactly one question forward).
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
            >
              {t(language, 'quiz_next')}
            </Button>
          )}
          {/* NOTE: no "Verify" button here — option questions grade on tap,
              so the old permanently-disabled Verify was a dead grey slab
              that could never activate. */}

          {/*
            AUDIT FIX: the old "Use Hint" handler called handleOptionSelect() with
            a WRONG option. Pressing the hint therefore submitted an incorrect
            answer, lost the point, logged the item as a weakness and played the
            failure sound — while the label promised help for 10 gems. It also
            never actually charged the gems. It now eliminates a distractor
            (classic 50/50) and charges the advertised price, or is hidden when
            the question type has no options to eliminate.
          */}
          {currentQ.options.length > 2 && !hasChecked && (
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => {
              if (selectedOption || hasChecked || hintUsed) return;
              const cost = 10;
              if ((userData?.gems ?? 0) < cost) return;
              const wrongOpts = currentQ.options.filter(o => o !== currentQ.correctAnswer);
              // Remove up to half of the distractors, never the correct answer.
              const toRemove = wrongOpts.slice(0, Math.max(1, Math.floor(wrongOpts.length / 2)));
              setEliminatedOptions(toRemove);
              setHintUsed(true);
              void updateUserData?.({ gems: (userData?.gems ?? 0) - cost });
            }}
            disabled={hasChecked || hintUsed || (userData?.gems ?? 0) < 10}
            leadingIcon={<Lightbulb className="w-3.5 h-3.5 text-warning" />}
          >
            <span>{language !== 'ar' ? 'Use Hint' : 'استخدم تلميح'}</span>
            <Badge tone="warning" className="ms-2 tracking-normal">
              <Gem className="w-3 h-3" aria-hidden="true" />
              10
            </Badge>
          </Button>
          )}
        </div>
        )}

      </div>

    </div>
  );
}

/**
 * useQuizEngine.ts
 * 
 * Evolved quiz engine for managing CEFR lessons, vocabulary lists, a "Review Mistakes" mode,
 * category strengths/weaknesses profiling, and multi-mode quiz structures.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { stopAllActiveAudio, playSuccessSound, playFailureSound, playCompleteSound } from '../../audio/hooks/useAudio';
import { Language, UserData } from '../../../models/user';
import { learningPath } from '../../../data/learningPath';
import { Question, QuizMode } from '../types';
import { generateQuestionsForModule, getLevelOfModule, getAdaptiveLevelId } from '../utils/questionGenerator';
import { isQuizAnswerAccepted } from '../utils/answerUtils';
import { calculateQuizRewards } from '../../../services/GamificationService';
import { gradeFromAnswer, recordReview } from '../../../services/SpacedRepetitionService';

export type { Question, QuizMode } from '../types';

interface UseQuizEngineProps {
  moduleId?: string;
  language: Language;
  updateUserProgress: (xpToAdd: number, wordsToAdd: number, quizCompleted?: boolean, gemsToAdd?: number, opts?: { source?: 'quiz' | 'game'; perfect?: boolean }) => Promise<void>;
  updateUserData?: (data: Partial<UserData>) => Promise<void>;
  userData?: UserData | null;
  navigateBack: () => void;
}

export function useQuizEngine({ 
  moduleId, 
  language, 
  updateUserProgress, 
  updateUserData, 
  userData, 
  navigateBack 
}: UseQuizEngineProps) {
  const [selectedQuizMode, setSelectedQuizMode] = useState<QuizMode | null>(
    // The default alphabet drill is sound→letter recognition, i.e. a genuine
    // listening quiz — it must carry that mode id so the header/title and
    // question rendering match. ('multiple_choice' here previously produced
    // a "Word Quiz" that rendered listen questions.)
    moduleId === 'alphabet'
      ? 'listening'
      : moduleId === 'adaptive_practice'
        ? 'adaptive_practice'
        : 'mixed_challenge'
  );
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSetReady, setQuestionSetReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Selection/Input states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typingAnswer, setTypingAnswer] = useState('');
  const [hasChecked, setHasChecked] = useState(false);
  
  // Game states
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState<Question[]>([]);
  const [earnedXp, setEarnedXp] = useState(0);
  const [earnedGems, setEarnedGems] = useState(0);

  /**
   * HEARTS: standard quizzes give the learner 3 hearts; a wrong answer costs
   * one and running out ends the session early (partial rewards still pay
   * out). Review/practice modules are deliberately heart-free — punishing a
   * mistake-review session for making mistakes would be absurd.
   */
  const HEARTS_PER_QUIZ = 3;
  const heartsEnabled = !(
    moduleId === 'srs_review' || moduleId === 'review_due' || moduleId === 'review_mistakes'
  );
  const [hearts, setHearts] = useState<number | null>(heartsEnabled ? HEARTS_PER_QUIZ : null);
  const heartsRef = useRef<number | null>(heartsEnabled ? HEARTS_PER_QUIZ : null);

  const loseHeart = useCallback(() => {
    if (heartsRef.current === null) return;
    heartsRef.current = Math.max(0, heartsRef.current - 1);
    setHearts(heartsRef.current);
  }, []);


  const initializedRef = useRef<string | null>(null);
  const scoreRef = useRef(0);
  const finishStartedRef = useRef(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  /**
   * DOUBLE-ADVANCE BUG FIX (critical):
   * `handleOptionSelect` used to schedule an anonymous auto-advance
   * setTimeout while the UI simultaneously offered a manual "Next Question"
   * button. Clicking the button before the timer fired advanced the index
   * twice (+2 questions), and rapid double-clicks on "Next" did the same.
   *
   * - `advanceTimerRef` tracks the pending auto-advance so it can be
   *   cancelled the moment the user advances manually.
   * - `advanceLockRef` is a synchronous transition lock: only ONE advance
   *   can occur per question. It is released when `currentIndex` changes.
   * - `answerLockRef` synchronously guards answer submission against
   *   double-taps that land before React state (selectedOption/hasChecked)
   *   has re-rendered.
   */
  const advanceTimerRef = useRef<number | null>(null);
  const advanceLockRef = useRef(false);
  const answerLockRef = useRef(false);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  // Reset timer + release the per-question locks on question index change
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    advanceLockRef.current = false;
    answerLockRef.current = false;
  }, [currentIndex]);

  // Never leave a pending auto-advance timer behind on unmount
  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer]);

  // Load questions pool
  useEffect(() => {
    if (!selectedQuizMode) {
      setQuestions([]);
      setQuestionSetReady(true);
      initializedRef.current = null;
      setCurrentIndex(0);
      scoreRef.current = 0;
      finishStartedRef.current = false;
      return;
    }

    /**
     * DATA-DEPENDENT MODULES FIX: review/adaptive pools are built from
     * userData, which loads asynchronously (IndexedDB in guest mode). If
     * generation ran before it arrived, the pool came back empty and the
     * initKey guard then blocked regeneration forever — SRS review showed
     * "all caught up" even with due words. The key now flips when userData
     * lands, forcing one regeneration.
     */
    const needsUserData =
      moduleId === 'srs_review' ||
      moduleId === 'review_due' ||
      moduleId === 'review_mistakes' ||
      moduleId === 'adaptive_practice' ||
      selectedQuizMode === 'adaptive_practice';

    const initKey = `${moduleId}_${selectedQuizMode}_${language}${needsUserData && !userData ? '_awaiting_user' : ''}`;
    if (initializedRef.current === initKey) {
      return;
    }

    setQuestionSetReady(false);
    const generated = generateQuestionsForModule(
      moduleId || '',
      selectedQuizMode,
      language,
      userData
    );

    setQuestions(generated);
    setQuestionSetReady(true);
    setCurrentIndex(0);
    setIsFinished(false);
    setScore(0);
    scoreRef.current = 0;
    finishStartedRef.current = false;
    setHasChecked(false);
    setSelectedOption(null);
    setTypingAnswer('');
    setIsCorrect(null);
    // STALE-STATE FIX: these never reset when a new question set loaded, so a
    // fresh quiz inherited the previous run's missed questions ("Review
    // Answers" appeared after a perfect round), confetti and reward figures.
    setMissedQuestions([]);
    setShowConfetti(false);
    setEarnedXp(0);
    setEarnedGems(0);
    heartsRef.current = heartsEnabled ? HEARTS_PER_QUIZ : null;
    setHearts(heartsRef.current);
    clearAdvanceTimer();
    advanceLockRef.current = false;
    answerLockRef.current = false;
    questionStartTimeRef.current = Date.now();
    initializedRef.current = initKey;
  }, [moduleId, language, selectedQuizMode, userData, heartsEnabled, clearAdvanceTimer]);

  // Audio lifecycle state tracking: stop playing on transitions (question, mode changes or finish)
  useEffect(() => {
    stopAllActiveAudio();
    return () => {
      stopAllActiveAudio();
    };
  }, [currentIndex, selectedQuizMode, isFinished]);

  /*
   * TIMER SAFETY / DEAD CODE (TODO-028, folds TODO-013): the "speed quiz"
   * subsystem (startSpeedQuiz / timeRemaining / isTimerActive + a 1s
   * countdown interval) was removed — no UI ever rendered a timer or called
   * startSpeedQuiz, yet the interval machinery lived on the app's hottest
   * hook. Re-introduce deliberately if a Speed mode ever ships.
   */

  const finishQuiz = useCallback(async (finalScore: number) => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;

    const safeFinalScore = Math.max(0, Math.min(finalScore, questions.length));
    scoreRef.current = safeFinalScore;
    setScore(safeFinalScore);
    setIsFinished(true);
    setShowConfetti(true);
    playCompleteSound();

    const levelId = (moduleId === 'adaptive_practice' || selectedQuizMode === 'adaptive_practice')
      ? getAdaptiveLevelId(userData)
      : getLevelOfModule(moduleId || '');
    let mult = 12;
    if (levelId === 'A2') mult = 15;
    else if (levelId === 'B1') mult = 18;
    else if (levelId === 'B2') mult = 22;
    else if (levelId === 'Advanced') mult = 25;

    const currentXp = userData?.xp || 0;
    const rewards = calculateQuizRewards(safeFinalScore, questions.length, currentXp, mult);
    
    setEarnedXp(rewards.xpGained);
    setEarnedGems(rewards.gemsGained);

    const wordsGained = safeFinalScore;

    if (updateUserProgress) {
      await updateUserProgress(rewards.xpGained, wordsGained, true, rewards.gemsGained, {
        source: 'quiz',
        perfect: questions.length > 0 && safeFinalScore === questions.length,
      });
    }

    // Save lesson completion key & update strengths/weaknesses profiling in Local storage
    if (userData && updateUserData) {
      const isLessonModule = learningPath.some(lvl => lvl.lessons.some(l => l.id === moduleId));
      const currentCompleted = [...(userData.completedLessons || [])];
      
      if (isLessonModule && moduleId && !currentCompleted.includes(moduleId)) {
        currentCompleted.push(moduleId);
      }

      await updateUserData({
        completedLessons: currentCompleted
      });
    }
  }, [updateUserProgress, updateUserData, userData, moduleId, selectedQuizMode, questions.length]);

  /**
   * The ONLY code path that moves the quiz forward. Guarantees exactly +1
   * step per invocation regardless of how many timers/clicks race it.
   */
  const advanceToNext = useCallback(() => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;
    clearAdvanceTimer();

    setSelectedOption(null);
    setIsCorrect(null);
    setHasChecked(false);
    setTypingAnswer('');

    // Out of hearts → the session ends here with partial rewards.
    if (heartsRef.current !== null && heartsRef.current <= 0) {
      finishQuiz(scoreRef.current);
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      finishQuiz(scoreRef.current);
    }
  }, [currentIndex, questions, finishQuiz, clearAdvanceTimer]);

  // Handle choice submissions
  const handleOptionSelect = useCallback(async (option: string) => {
    if (selectedOption || hasChecked) return;
    if (answerLockRef.current) return; // sync double-tap guard
    answerLockRef.current = true;
    setSelectedOption(option);
    setHasChecked(true);

    const currentQ = questions[currentIndex];
    const correct = option === currentQ.correctAnswer;
    setIsCorrect(correct);

    const responseMs = Date.now() - questionStartTimeRef.current;
    const grade = gradeFromAnswer({ correct, responseMs });

    // AUDIO DESYNC FIX: kill any still-playing word/letter audio before the
    // feedback jingle so the two never overlap.
    stopAllActiveAudio();

    if (correct) {
      playSuccessSound();
      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      setScore(nextScore);
    } else {
      playFailureSound();
      loseHeart();
      if (currentQ) {
        setMissedQuestions(prev => {
          if (prev.some(q => q.id === currentQ.id)) return prev;
          return [...prev, currentQ];
        });
      }
    }

    // STUCK-STATE FIX: the auto-advance timer is scheduled BEFORE the async
    // persistence below. Previously it was scheduled after the awaits, so a
    // slow or throwing storage write meant the quiz never advanced at all.
    clearAdvanceTimer();
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      advanceToNext();
    }, correct ? 1400 : 2200);

    // Profile Category correct vs wrong answers and SM-2 Spaced Repetition deck
    if (userData && updateUserData && currentQ) {
      const cat = currentQ.category || 'general';
      const lemmaId = currentQ.wordId || currentQ.word?.id || currentQ.id.replace(/_q\d+$/, '');
      const correctsMap = { ...(userData.strongCategories || {}) };
      const mistakesMap = { ...(userData.weakCategories || {}) };
      const wrongsHistory = [...(userData.wrongAnswersHistory || [])];
      const updatedDeck = recordReview(userData.reviewDeck || {}, lemmaId, grade);

      try {
        if (correct) {
          correctsMap[cat] = (correctsMap[cat] || 0) + 1;
          const filteredWrongs = wrongsHistory.filter(id => id !== lemmaId && id !== currentQ.id);
          await updateUserData({
            strongCategories: correctsMap,
            wrongAnswersHistory: filteredWrongs,
            reviewDeck: updatedDeck
          });
        } else {
          mistakesMap[cat] = (mistakesMap[cat] || 0) + 1;
          if (!wrongsHistory.includes(lemmaId)) {
            wrongsHistory.push(lemmaId);
          }
          await updateUserData({
            weakCategories: mistakesMap,
            wrongAnswersHistory: wrongsHistory,
            reviewDeck: updatedDeck
          });
        }
      } catch (err) {
        // Persistence failing must never block quiz flow.
        console.warn('Quiz progress persistence failed:', err);
      }
    }
  }, [selectedOption, hasChecked, questions, currentIndex, userData, updateUserData, advanceToNext, clearAdvanceTimer, loseHeart]);

  // Handle spelling/writing checker
  const handleVerify = useCallback(async () => {
    if (!typingAnswer.trim() || hasChecked) return;
    if (answerLockRef.current) return; // sync double-tap guard
    answerLockRef.current = true;
    
    const currentQ = questions[currentIndex];
    const correctAns = currentQ.correctAnswer;
    const isAnsCorrect = isQuizAnswerAccepted(typingAnswer, correctAns);
    
    setIsCorrect(isAnsCorrect);
    setHasChecked(true);

    const responseMs = Date.now() - questionStartTimeRef.current;
    const grade = gradeFromAnswer({ correct: isAnsCorrect, responseMs });

    // AUDIO DESYNC FIX: stop word audio before the feedback jingle.
    stopAllActiveAudio();

    if (isAnsCorrect) {
      playSuccessSound();
      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      setScore(nextScore);
    } else {
      playFailureSound();
      loseHeart();
      if (currentQ) {
        setMissedQuestions(prev => {
          if (prev.some(q => q.id === currentQ.id)) return prev;
          return [...prev, currentQ];
        });
      }
    }

    // Profile strengths / weaknesses and SM-2 Spaced Repetition deck
    if (userData && updateUserData && currentQ) {
      const cat = currentQ.category || 'general';
      const lemmaId = currentQ.wordId || currentQ.word?.id || currentQ.id.replace(/_q\d+$/, '');
      const correctsMap = { ...(userData.strongCategories || {}) };
      const mistakesMap = { ...(userData.weakCategories || {}) };
      const wrongsHistory = [...(userData.wrongAnswersHistory || [])];
      const updatedDeck = recordReview(userData.reviewDeck || {}, lemmaId, grade);

      try {
        if (isAnsCorrect) {
          correctsMap[cat] = (correctsMap[cat] || 0) + 1;
          const filteredWrongs = wrongsHistory.filter(id => id !== lemmaId && id !== currentQ.id);
          await updateUserData({
            strongCategories: correctsMap,
            wrongAnswersHistory: filteredWrongs,
            reviewDeck: updatedDeck
          });
        } else {
          mistakesMap[cat] = (mistakesMap[cat] || 0) + 1;
          if (!wrongsHistory.includes(lemmaId)) {
            wrongsHistory.push(lemmaId);
          }
          await updateUserData({
            weakCategories: mistakesMap,
            wrongAnswersHistory: wrongsHistory,
            reviewDeck: updatedDeck
          });
        }
      } catch (err) {
        // Persistence failing must never block quiz flow.
        console.warn('Quiz progress persistence failed:', err);
      }
    }
  }, [typingAnswer, hasChecked, questions, currentIndex, userData, updateUserData, loseHeart]);

  const handleNext = useCallback(() => {
    // Manual advance: cancels any pending auto-advance timer and is
    // debounced by the transition lock — one click = exactly one step.
    advanceToNext();
  }, [advanceToNext]);

  const handleCharClick = useCallback((char: string) => {
    setTypingAnswer(prev => prev + char);
    // SAFETY: #writing-input is rendered exclusively as an <input> by TranslateQuestion.
    const inputEl = document.getElementById('writing-input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
    }
  }, []);

  const restartMissedQuestions = useCallback(() => {
    if (missedQuestions.length === 0) return;
    clearAdvanceTimer();
    advanceLockRef.current = false;
    answerLockRef.current = false;
    setQuestions([...missedQuestions]);
    setQuestionSetReady(true);
    setMissedQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    finishStartedRef.current = false;
    setIsFinished(false);
    setShowConfetti(false);
    setHasChecked(false);
    setSelectedOption(null);
    setTypingAnswer('');
    setIsCorrect(null);
    heartsRef.current = heartsEnabled ? HEARTS_PER_QUIZ : null;
    setHearts(heartsRef.current);
    questionStartTimeRef.current = Date.now();
  }, [missedQuestions, clearAdvanceTimer, heartsEnabled]);

  return {
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
  };
}

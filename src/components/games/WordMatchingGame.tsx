import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Star, Award, ArrowRight, Heart, Clock, Lightbulb, Coins } from 'lucide-react';
import { Word } from '../../data/kurmanji';
import { Language } from '../../models/user';
import { playSuccessSound, playFailureSound, playCompleteSound } from '../../features/audio/hooks/useAudio';
import { Progress } from '../ui';
import { GameHeader } from './GameHeader';

interface WordMatchingGameProps {
  vocabulary: Word[];
  language: Language;
  onWin: (xp: number) => void;
  onClose: () => void;
}

interface MatchItem {
  id: string;
  text: string;
  wordId: string;
  isMatched: boolean;
  state: 'default' | 'selected' | 'correct' | 'wrong';
}

export function WordMatchingGame({ vocabulary, language, onWin, onClose }: WordMatchingGameProps) {
  const [round, setRound] = useState(1);
  const [pairsCount, setPairsCount] = useState(4); // rows count
  const [lives, setLives] = useState<number | null>(null); // null means infinite (for round 1)
  const [isGameOver, setIsGameOver] = useState(false);
  
  const [kurdishList, setKurdishList] = useState<MatchItem[]>([]);
  const [arabicList, setArabicList] = useState<MatchItem[]>([]);
  const [selectedKu, setSelectedKu] = useState<string | null>(null); // item.id
  const [selectedAr, setSelectedAr] = useState<string | null>(null); // item.id
  const [recentCompleted, setRecentCompleted] = useState(false);
  const [gainedXP, setGainedXP] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const roundRewardedRef = useRef(false);
  /**
   * DOUBLE-STEP FIX: "Next Round" used a bare functional updater — two rapid
   * clicks on the victory overlay advanced the round by +2 (R1 → R3).
   * This lock allows exactly one round advance per overlay; it is released
   * when the new round's board is dealt in `startNewRound`.
   */
  const advanceRoundLockRef = useRef(false);

  // Countdown timer effect
  useEffect(() => {
    if (isGameOver || recentCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          playFailureSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, recentCompleted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize a round of matching
  const startNewRound = (targetRound: number) => {
    roundRewardedRef.current = false;
    // NOTE: advanceRoundLockRef is intentionally NOT released here.
    // The victory overlay is still on screen during its exit animation and
    // its (cloned) button shares this ref — releasing the lock this early
    // let a second click land and skip a round. The lock is released when
    // the NEXT round's victory overlay actually appears (see the round
    // completion effect below).
    setRecentCompleted(false);
    setIsGameOver(false);
    setSelectedKu(null);
    setSelectedAr(null);
    setTimeLeft(Math.max(30, 50 - targetRound * 5)); // 45s, 40s, 35s...

    // 1. Determine words/rows count based on round
    let count = 4;
    if (targetRound === 2) count = 5;
    else if (targetRound === 3) count = 5;
    else if (targetRound === 4) count = 6;
    else if (targetRound >= 5) count = 6;
    setPairsCount(count);

    // 2. Determine lives/attempts limit based on round
    if (targetRound === 1) {
      setLives(null); // Infinite
    } else if (targetRound === 2) {
      setLives(5);
    } else if (targetRound === 3) {
      setLives(4);
    } else {
      setLives(3); // highly intense for Round 4+
    }

    // Shuffle and pick words
    const shuffledVocab = [...vocabulary].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledVocab.slice(0, count);

    // Kurdish items (shuffled)
    const kuItems: MatchItem[] = selectedWords.map((word) => ({
      id: `${word.id}-ku`,
      text: word.ku,
      wordId: word.id,
      isMatched: false,
      state: 'default' as const,
    })).sort(() => 0.5 - Math.random());

    // Arabic meanings (shuffled)
    const arItems: MatchItem[] = selectedWords.map((word) => ({
      id: `${word.id}-ar`,
      text: word.ar,
      wordId: word.id,
      isMatched: false,
      state: 'default' as const,
    })).sort(() => 0.5 - Math.random());

    setKurdishList(kuItems);
    setArabicList(arItems);
  };

  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      startNewRound(round);
    }
  }, [vocabulary, round]);

  const handlePairSelection = (id: string, type: 'ku' | 'ar') => {
    if (recentCompleted || isGameOver) return;

    if (type === 'ku') {
      const item = kurdishList.find(i => i.id === id);
      if (!item || item.isMatched) return;

      if (selectedKu === id) {
        // Deselect
        setSelectedKu(null);
        setKurdishList(prev => prev.map(i => i.id === id ? { ...i, state: 'default' } : i));
      } else {
        setSelectedKu(id);
        setKurdishList(prev => prev.map(i => i.id === id ? { ...i, state: 'selected' } : (i.state === 'selected' ? { ...i, state: 'default' } : i)));
      }
    } else {
      const item = arabicList.find(i => i.id === id);
      if (!item || item.isMatched) return;

      if (selectedAr === id) {
        // Deselect
        setSelectedAr(null);
        setArabicList(prev => prev.map(i => i.id === id ? { ...i, state: 'default' } : i));
      } else {
        setSelectedAr(id);
        setArabicList(prev => prev.map(i => i.id === id ? { ...i, state: 'selected' } : (i.state === 'selected' ? { ...i, state: 'default' } : i)));
      }
    }
  };

  // Evaluate matching pair when both selections are made
  useEffect(() => {
    if (selectedKu && selectedAr) {
      const kuItem = kurdishList.find(i => i.id === selectedKu);
      const arItem = arabicList.find(i => i.id === selectedAr);

      if (kuItem && arItem) {
        if (kuItem.wordId === arItem.wordId) {
          // CORRECT MATCH!
          playSuccessSound();
          setGainedXP(prev => prev + 5);

          // Mark as matched dynamically
          setKurdishList(prev => prev.map(i => i.id === selectedKu ? { ...i, isMatched: true, state: 'correct' } : i));
          setArabicList(prev => prev.map(i => i.id === selectedAr ? { ...i, isMatched: true, state: 'correct' } : i));

          setSelectedKu(null);
          setSelectedAr(null);
        } else {
          // FAILED MATCH
          playFailureSound();
          
          // Reduce attempt / heart if not Round 1
          if (round > 1 && lives !== null) {
            setLives((curr) => {
              if (curr === null) return null;
              const next = curr - 1;
              if (next <= 0) {
                setIsGameOver(true);
              }
              return next;
            });
          }

          // Mark as wrong with visual feedback
          setKurdishList(prev => prev.map(i => i.id === selectedKu ? { ...i, state: 'wrong' } : i));
          setArabicList(prev => prev.map(i => i.id === selectedAr ? { ...i, state: 'wrong' } : i));

          const currentKu = selectedKu;
          const currentAr = selectedAr;

          setSelectedKu(null);
          setSelectedAr(null);

          // Return to default state after delay
          setTimeout(() => {
            setKurdishList(prev => prev.map(i => i.id === currentKu && i.state === 'wrong' ? { ...i, state: 'default' } : i));
            setArabicList(prev => prev.map(i => i.id === currentAr && i.state === 'wrong' ? { ...i, state: 'default' } : i));
          }, 800);
        }
      }
    }
  }, [selectedKu, selectedAr, round, lives]);

  // Check if all items in current round are matched
  useEffect(() => {
    /**
     * DOUBLE-POPUP FIX: when "Next Round" is clicked, `round` changes and
     * this effect re-runs IN THE SAME COMMIT as the board-reset effect
     * above. At that point this closure still holds the OLD fully-matched
     * kurdishList, while startNewRound has just reset `roundRewardedRef` —
     * so victory was declared a second time: the "Brilliant Connection!"
     * overlay popped up again and XP was awarded twice.
     *
     * `!recentCompleted` blocks that stale re-run: in the commit where the
     * round advances, `recentCompleted` (from this render's closure) is
     * still `true` from the round that just ended. A genuinely completed
     * new round always evaluates with `recentCompleted === false`.
     */
    if (
      kurdishList.length > 0 &&
      kurdishList.every(i => i.isMatched) &&
      !recentCompleted &&
      !roundRewardedRef.current
    ) {
      roundRewardedRef.current = true;
      advanceRoundLockRef.current = false; // overlay is (re)appearing — allow exactly one advance
      setRecentCompleted(true);
      
      // XP scales upward by round and is awarded once on victory.
      const xpEarned = 10 + (round - 1) * 5; // e.g., R1 = 10 XP, R2 = 15 XP, R3 = 20 XP...
      setGainedXP(prev => prev + xpEarned);
      onWin(xpEarned);
      playCompleteSound();
    }
  }, [kurdishList, round, onWin, recentCompleted]);

  // Manual reset of game
  const resetAtRef = useRef(0);
  const resetGameHandler = () => {
    // Debounce: a double-tap on Restart/Try Again must deal exactly one board
    const now = Date.now();
    if (now - resetAtRef.current < 500) return;
    resetAtRef.current = now;
    setRound(1);
    setGainedXP(0);
    setIsGameOver(false);
    startNewRound(1);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 p-4 pb-24 max-w-lg mx-auto w-full antialiased relative overflow-y-auto">
      
      {/* Header Bar — unified GameHeader (top-bar harmonization audit):
          time indicator + XP score pill live HERE now, in the same end-side
          position every game uses (the old separate HUD card is gone). */}
      <GameHeader
        title={language !== 'ar' ? 'Word Matching' : 'مطابقة الكلمات'}
        onExit={onClose}
        exitLabel={language !== 'ar' ? 'Exit game' : 'الخروج من اللعبة'}
        indicator={
          <span className="flex items-center gap-1 rounded-full px-2.5 min-h-[36px] bg-white dark:bg-slate-900 border border-line-soft shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-xs font-black tabular-nums text-ink">
            <Clock className="w-3.5 h-3.5 text-[#B45309]" />
            <span dir="ltr">{formatTime(timeLeft)}</span>
          </span>
        }
        stat={{ label: language !== 'ar' ? 'XP' : 'خبرة', value: gainedXP }}
      />

      {/* Instruction Prompt */}
      <div className="text-center mb-4">
        <p className="text-xs font-black text-slate-600 dark:text-slate-300">
          {language !== 'ar' ? 'Connect the word with its correct meaning' : 'صل الكلمة بمعناها الصحيح'}
        </p>
      </div>

      {/* GAME OVER SCREEN */}
      {isGameOver ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-950/20 border border-red-500/20 rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-red-600 dark:text-red-500 uppercase tracking-widest">
              {language !== 'ar' ? 'Attempts Depleted' : 'استنفاد المحاولات!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {language !== 'ar' 
                ? `You made too many wrong connections at Round ${round}.` 
                : `للأسف أخطأت في توصيل الكلمات في الجولة ${round}.`}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl w-full max-w-sm text-xs space-y-2 text-start shadow-xs">
            <p className="text-slate-500 text-center font-bold">
              {language !== 'ar' ? 'Battle History' : 'سجل التوصيل الإجمالي'}
            </p>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 mt-2 font-bold select-none pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span>{language !== 'ar' ? 'Max Round Reached:' : 'أقصى جولة وصلتها:'}</span>
              <span className="text-indigo-600 font-black">{round}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 mt-2 font-bold select-none">
              <span>{language !== 'ar' ? 'XP Points Gained:' : 'النقاط التي جمعتها:'}</span>
              <span className="text-yellow-500 font-black">{gainedXP} XP</span>
            </div>
          </div>

          <div className="flex w-full max-w-sm gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 min-h-[44px] bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 active:scale-95 text-slate-700 dark:text-slate-300 font-bold rounded-full text-xs transition-all border border-slate-200 dark:border-slate-800 cursor-pointer outline-none"
            >
              {language !== 'ar' ? 'Exit to Games' : 'صندوق الألعاب'}
            </button>
            <button
              onClick={resetGameHandler}
              className="flex-1 py-3.5 min-h-[44px] bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] shadow-[0_2px_0_#E69500] active:scale-95 font-extrabold rounded-full text-xs transition-all cursor-pointer outline-none flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language !== 'ar' ? 'Try from Round 1' : 'ابدأ مجدداً كالمحترفين'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress & Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/10 dark:border-slate-800 shadow-xs mb-6 text-center space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span>{language !== 'ar' ? 'Matched Pairs' : 'الأزواج الموصولة'}</span>
              <span>{kurdishList.filter(i => i.isMatched).length} / {pairsCount}</span>
            </div>
            
            <Progress value={kurdishList.filter(i => i.isMatched).length} max={pairsCount} />

            {/* Lives / Attempts Display */}
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span>{language !== 'ar' ? 'Hearts / Attempts' : 'القلوب ومحاولات الخطأ'}</span>
              <span className="flex gap-1 items-center">
                {lives === null ? (
                  <span className="text-emerald-500 text-[11px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                    ∞ {language !== 'ar' ? 'Unlimited (R1)' : 'غير محدودة (ج1)'}
                  </span>
                ) : (
                  <div className="flex gap-0.5">
                    {Array.from({ length: lives }).map((_, i) => (
                      <Heart key={i} className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                    ))}
                  </div>
                )}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {language !== 'ar' 
                ? 'Tap a Kurdish word, then tap its matching Arabic meaning!' 
                : 'اختر الكلمة الكوردية، ثم اضغط على معناها الصحيح بالعربية لتوصيلهما!'}
            </p>
          </div>

          {/* Two columns layout */}
          <div className="grid grid-cols-2 gap-4 items-center py-2 h-auto">
            {/* Left Column: Kurdish Words */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-black text-slate-400 text-center uppercase tracking-widest leading-none mb-1">
                {language !== 'ar' ? 'Kurmanji' : 'كرمانجي'}
              </h3>
              <AnimatePresence mode="popLayout">
                {kurdishList.map((item) => {
                  const isSelected = selectedKu === item.id;
                  const isWrong = item.state === 'wrong';
                  const isCorrect = item.isMatched;

                  return (
                    <motion.button
                      key={item.id}
                      layoutId={item.id}
                      disabled={item.isMatched}
                      onClick={() => handlePairSelection(item.id, 'ku')}
                      className={`w-full py-4.5 px-3 rounded-2xl font-black text-sm border-2 flex items-center justify-center transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-300 scale-95 opacity-50 cursor-not-allowed'
                          : isWrong
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300 animate-[shake_0.4s_ease-in-out]'
                          : isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-700 dark:text-indigo-400 ring-4 ring-indigo-500/10'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-800 hover:bg-slate-50/50 active:scale-[0.98]'
                      } cursor-pointer min-h-[58px] outline-none`}
                    >
                      <span className="tracking-wide text-center">
                        <bdi>{item.text}</bdi>
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right Column: Arabic meanings */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-black text-slate-400 text-center uppercase tracking-widest leading-none mb-1">
                {language !== 'ar' ? 'Arabic' : 'العربية'}
              </h3>
              <AnimatePresence mode="popLayout">
                {arabicList.map((item) => {
                  const isSelected = selectedAr === item.id;
                  const isWrong = item.state === 'wrong';
                  const isCorrect = item.isMatched;

                  return (
                    <motion.button
                      key={item.id}
                      layoutId={item.id}
                      disabled={item.isMatched}
                      onClick={() => handlePairSelection(item.id, 'ar')}
                      className={`w-full py-4.5 px-3 rounded-2xl font-black text-sm border-2 flex items-center justify-center transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-300 scale-95 opacity-50 cursor-not-allowed'
                          : isWrong
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300 animate-[shake_0.4s_ease-in-out]'
                          : isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-700 dark:text-indigo-400 ring-4 ring-indigo-500/10'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-800 hover:bg-slate-50/50 active:scale-[0.98]'
                      } cursor-pointer min-h-[58px] outline-none`}
                    >
                      <span className="tracking-wide text-center">
                        <bdi>{item.text}</bdi>
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between gap-3 mt-6 pt-2">
            <button
              onClick={() => {
                // Auto match 1 pair as hint if available.
                // BUG FIX: this compared the Kurdish item id ("<word>-ku")
                // against Arabic ids ("<word>-ar") — it could never match,
                // so the Hint button silently did nothing. Pair by wordId.
                const unmatchedKu = kurdishList.find(k => !k.isMatched);
                if (unmatchedKu) {
                  const matchingAr = arabicList.find(a => a.wordId === unmatchedKu.wordId);
                  if (matchingAr) {
                    playSuccessSound();
                    setSelectedKu(null);
                    setSelectedAr(null);
                    setKurdishList(prev => prev.map(i => i.id === unmatchedKu.id ? { ...i, isMatched: true, state: 'correct' } : i));
                    setArabicList(prev => prev.map(i => i.id === matchingAr.id ? { ...i, isMatched: true, state: 'correct' } : i));
                  }
                }
              }}
              className="flex-1 py-3 px-4 min-h-[44px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full flex items-center justify-center gap-2 font-black text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
              <div className="flex items-center gap-1">
                <span>10</span>
                <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span>{language !== 'ar' ? 'Hint' : 'تلميح'}</span>
              </div>
            </button>

            <button
              onClick={resetGameHandler}
              className="flex-1 py-3 px-4 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center gap-2 font-black text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>{language !== 'ar' ? 'Restart' : 'إعادة اللعبة'}</span>
            </button>
          </div>
        </>
      )}

      {/* Completion Banner for End of Round - rendered as a viewport-anchored modal overlay */}
      <AnimatePresence>
        {recentCompleted && !isGameOver && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-sm bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl p-6 text-center text-white space-y-4 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 text-7xl opacity-5 select-none pointer-events-none">🏆</div>
              <div className="space-y-1 relative z-10">
                <h3 className="text-xl font-black">
                  {language !== 'ar' ? 'Brilliant Connection!' : 'ترابط عبقري وممتاز!'}
                </h3>
                <p className="text-xs text-indigo-100">
                  {language !== 'ar' 
                    ? 'All words matched perfectly in this round.' 
                    : `أوصلت الكلمات الكوردية مع معانيها ببراعة في الجولة ${round}!`}
                </p>
              </div>

              <div className="inline-flex bg-white/15 rounded-2xl items-center justify-center py-2.5 px-4 gap-2 border border-white/5 font-extrabold text-xs">
                <Award className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                <span>+{10 + (round - 1) * 5} XP {language !== 'ar' ? 'Points Earned' : 'نقطة إضافية مضافة'}</span>
              </div>

              <div className="flex gap-3 relative z-10 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 min-h-[44px] bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-full text-xs transition-all border border-white/10 cursor-pointer outline-none"
                >
                  {language !== 'ar' ? 'Back' : 'الرئيسية'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (advanceRoundLockRef.current) return; // one click = one round
                    advanceRoundLockRef.current = true;
                    setRound(r => r + 1);
                  }}
                  className="flex-1 py-3 min-h-[44px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black rounded-full text-xs hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 outline-none"
                >
                  <span>{language !== 'ar' ? 'Next Round' : 'الجولة التالية'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

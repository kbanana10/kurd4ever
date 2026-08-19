import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/translations';
import { vocabulary } from '../data/kurmanji';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Star, HelpCircle, GraduationCap, Play, ArrowLeft, Gamepad2, Zap, ChevronRight, Puzzle, Skull, CaseSensitive, Brain, Users, Cat, Apple, Palette, MessageSquare, Laptop, Stethoscope, Briefcase, Smile, Compass, BookOpen, Workflow, Lock, Grid } from 'lucide-react';
import Confetti from 'react-confetti';
import { WordMatchingGame } from '../components/games/WordMatchingGame';
import { GameHeader } from '../components/games/GameHeader';

// PERF: memoized aliases — with the stable handlers above, parent re-renders
// (XP submission, celebration timers) can no longer cascade into a live game.
const MemoWordMatchingGame = React.memo(WordMatchingGame);
const MemoZombieTypingGame = React.memo(ZombieTypingGame);
const MemoWordConnectGame = React.memo(WordConnectGame);
import { ZombieTypingGame } from '../components/games/ZombieTypingGame';
import { WordConnectGame } from '../components/games/WordConnectGame';
import { playSuccessSound, playFailureSound, playCompleteSound } from '../features/audio/hooks/useAudio';

/*
 * REFACTOR (TODO-012 / F012): a 750-line word-visuals layer (getWordVector
 * icon registry, getWordImageUrl, WordVisualCard, getEmojiIcon) lived at the
 * top of this file but was DEAD CODE — nothing in the games menu, memory or
 * scramble boards ever rendered it (only getWordIcon below is used, once).
 * Removed during the incremental Games refactor; retrieve from git history
 * if a future feature needs rich word visuals.
 */
const getWordIcon = (category?: string, className = "w-6 h-6 text-indigo-600 dark:text-indigo-400") => {
  const categoryMap = {
    'family': Users,
    'animals': Cat,
    'food': Apple,
    'colors': Palette,
    'emotions': Smile,
    'daily_conversation': MessageSquare,
    'technology': Laptop,
    'university': GraduationCap,
    'medical': Stethoscope,
    'business': Briefcase,
    'travel': Compass
  } satisfies Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = category ? categoryMap[category] : undefined;
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <BookOpen className={className} />;
};


interface MemoryCard {
  id: string; // unique card id (e.g. wordId-type)
  wordId: string;
  type: 'ku' | 'meaning';
  content: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function Games() {
  const { userData, updateUserData, updateUserProgress, language } = useAuth();

  /** New-user gating (maintainer request): "Coming Soon" placeholders are
   *  hidden until the player has genuine progress — a completed roadmap
   *  lesson or at least one game score. */
  const isEstablishedUser =
    (userData?.completedLessons?.length ?? 0) > 0 ||
    Object.keys(userData?.gameScores ?? {}).length > 0;
  const navigate = useNavigate();
  
  const [activeGame, setActiveGame] = useState<'menu' | 'memory' | 'scramble' | 'matching' | 'zombie' | 'connect'>('menu');
  const [celebrate, setCelebrate] = useState(false);

  // Broadcast whether a game screen is active vs. the standard main menu
  useEffect(() => {
    const isGame = activeGame !== 'menu';
    window.dispatchEvent(new CustomEvent('set-game-active', { detail: isGame }));
    return () => {
      window.dispatchEvent(new CustomEvent('set-game-active', { detail: false }));
    };
  }, [activeGame]);

  const [gainedXP, setGainedXP] = useState(0);

  // PERF (mini-games audit): the three standalone games are memoized below,
  // so a mounted game loop never re-renders when this page's state changes.
  // That only works with referentially STABLE props — updateUserProgress
  // changes identity on every profile write, so it is read through a ref
  // (the same pattern as AuthContext's userDataRef lost-update fix).
  const updateProgressRef = useRef(updateUserProgress);
  useEffect(() => {
    updateProgressRef.current = updateUserProgress;
  }, [updateUserProgress]);
  const handleGameWin = useCallback((xp: number) => {
    void updateProgressRef.current(xp, 1, true, 0, { source: 'game' });
  }, []);
  const handleExitToMenu = useCallback(() => setActiveGame('menu'), []);

  // States for Memory Game
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]); // indexes
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [memorizeCountdown, setMemorizeCountdown] = useState(0);

  // Countdown timer for initial cards preview/memorization phase
  useEffect(() => {
    if (memorizeCountdown <= 0) return;
    const timer = setTimeout(() => {
      setMemorizeCountdown((prev) => {
        if (prev <= 1) {
          // Flip all unmatched cards closed after the countdown finishes
          setMemoryCards((prevCards) => 
            prevCards.map((c) => ({ ...c, isFlipped: false }))
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [memorizeCountdown]);

  // States for Scramble Game
  const [scrambleWord, setScrambleWord] = useState<any | null>(null);
  const [scrambleLetters, setScrambleLetters] = useState<{ id: string; char: string; used: boolean }[]>([]);
  const [userLetters, setUserLetters] = useState<{ originalId: string; char: string }[]>([]);
  const [scrambleScore, setScrambleScore] = useState(0);
  const [scrambleAttempts, setScrambleAttempts] = useState(0);
  const [showScrambleHint, setShowScrambleHint] = useState(false);
  const [isScrambleCorrect, setIsScrambleCorrect] = useState<boolean | null>(null);

  // Sound placeholders can be visual/vibrational or CSS animations
  const triggerWinSetup = async (xpValue: number) => {
    setGainedXP(xpValue);
    setCelebrate(true);
    await updateUserProgress(xpValue, 1, true, 0, { source: 'game' });

    if (userData && updateUserData) {
      const currentScores = { ...(userData.gameScores || {}) };
      if (activeGame === 'scramble') {
        const previousHigh = currentScores['scramble'] || 0;
        currentScores['scramble'] = Math.max(previousHigh, scrambleScore + 1);
      } else if (activeGame === 'memory') {
        const previousBest = currentScores['memory'] || 999;
        currentScores['memory'] = Math.min(previousBest, moves);
      }
      await updateUserData({ gameScores: currentScores });
    }

    setTimeout(() => {
      setCelebrate(false);
    }, 5000);
  };

  // ==================== MEMORY MATCH LOGIC ====================
  const initMemoryGame = () => {
    setCelebrate(false);
    setMoves(0);
    setMatchedPairs(0);
    memorySelectionRef.current = [];
    setSelectedCards([]);
    
    // Pick 6 random words (12 cards total) for a delightful memory grid
    const sorted = [...vocabulary].sort(() => 0.5 - Math.random());
    const selectedWords = sorted.slice(0, 6);
    
    const cards: MemoryCard[] = [];
    selectedWords.forEach((word) => {
      // 1. Kurdish Card: Shows ONLY the Kurdish word. No emoji to prevent cheating!
      cards.push({
        id: `${word.id}-ku`,
        wordId: word.id,
        type: 'ku',
        content: word.ku,
        emoji: '', 
        isFlipped: true, // Start opened for preview memorization phase
        isMatched: false
      });
      
      // 2. Clue Card: Randomly choose to display either Arabic word only OR English word + emoji,
      // but never both together and never identical visual cues on the Kurdish card.
      const isArabicClue = Math.random() > 0.5;
      let content = '';
      let emoji = '';
      
      if (isArabicClue) {
        content = word.ar;
        emoji = ''; // purely Arabic text card, no emoji
      } else {
        content = word.en;
        emoji = word.emoji || '💡'; // English word + emoji
      }

      cards.push({
        id: `${word.id}-translation`,
        wordId: word.id,
        type: 'meaning',
        content: content,
        emoji: emoji,
        isFlipped: true, // Start opened for preview memorization phase
        isMatched: false
      });
    });

    // Shuffle cards and start memorization countdown
    setMemoryCards(cards.sort(() => 0.5 - Math.random()));
    setMemorizeCountdown(5); // 5 seconds for visual memorization
  };

  const handleCardClick = (index: number) => {
    // Disable any selection during memorization phase
    if (memorizeCountdown > 0) return;
    const sel = memorySelectionRef.current; // synchronous source of truth
    if (sel.length >= 2 || sel.includes(index) || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    const updated = [...memoryCards];
    updated[index].isFlipped = true;
    setMemoryCards(updated);

    const nextSelection = [...sel, index];
    memorySelectionRef.current = nextSelection;
    setSelectedCards(nextSelection);

    if (nextSelection.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextSelection;
      const card1 = memoryCards[firstIdx];
      const card2 = memoryCards[secondIdx];

      if (card1.wordId === card2.wordId) {
        // Match!
        playSuccessSound();
        setTimeout(() => {
          const matched = [...memoryCards];
          matched[firstIdx].isMatched = true;
          matched[secondIdx].isMatched = true;
          setMemoryCards(matched);
          memorySelectionRef.current = [];
          setSelectedCards([]);
          
          const newMatchedPairs = matched.filter((c) => c.isMatched).length / 2;
          setMatchedPairs(newMatchedPairs);
          if (newMatchedPairs === 6) {
            playCompleteSound();
            triggerWinSetup(15); // win 15 XP
          }
        }, 600);
      } else {
        // Fail Match, flip back
        playFailureSound();
        setTimeout(() => {
          const reset = [...memoryCards];
          reset[firstIdx].isFlipped = false;
          reset[secondIdx].isFlipped = false;
          setMemoryCards(reset);
          memorySelectionRef.current = [];
          setSelectedCards([]);
        }, 1200);
      }
    }
  };

  // ==================== WORD SCRAMBLE LOGIC ====================
  /**
   * SPELLING SCRAMBLER copy (design review fix): labels were en/ar two-way
   * (ku users got English), the en copy had grammar/system-speak problems
   * ("Words Spell", "SPELL THIS WORD: Seventy" for a Kurdish answer, a
   * 3-line strictness disclaimer) and the ar header title had a typo
   * ("الكروف"). Now tri-lingual with humane copy — same pattern as the
   * Zombie Typing fix (audit F015, games-first migration).
   */
  const st = ({
    en: {
      title: 'Spelling Scrambler', menuDesc: 'Order the letters correctly',
      scoreLabel: 'Words Spelled', showHint: 'Show Hint', hideHint: 'Hide Hint',
      prompt: 'Spell it in Kurdish', hintStarts: 'The word starts with:',
      available: 'Available Letters', reset: 'Reset', verify: 'Verify Answer', next: 'Next Word',
      tip: 'Strict spelling — every correct word earns +10 XP.',
      slotEmpty: 'Empty letter slot', removeLetter: 'Remove letter',
    },
    ku: {
      title: 'Tevliheviya Tîpan', menuDesc: 'Tîpan rast rêz bike',
      scoreLabel: 'Peyvên Nivîsandî', showHint: 'Têbînî nîşan bide', hideHint: 'Têbîniyê veşêre',
      prompt: 'Bi Kurdî binivîse', hintStarts: 'Peyv bi vê tîpê dest pê dike:',
      available: 'Tîpên Berdest', reset: 'Ji nû ve', verify: 'Kontrol bike', next: 'Peyva din',
      tip: 'Rastnivîs hişk e — her peyva rast +10 XP dide.',
      slotEmpty: 'Valahiya tîpê', removeLetter: 'Tîpê rake',
    },
    ar: {
      title: 'تركيب الحروف', menuDesc: 'رتب الحروف بشكل صحيح',
      scoreLabel: 'الكلمات المكتملة', showHint: 'إظهار التلميح', hideHint: 'إخفاء التلميح',
      prompt: 'اكتب الكلمة الكوردية', hintStarts: 'تبدأ الكلمة بالحرف:',
      available: 'الحروف المتاحة', reset: 'إعادة تعيين', verify: 'تأكيد الإجابة', next: 'الكلمة التالية',
      tip: 'التدقيق صارم — كل كلمة صحيحة تمنحك +10 نقطة خبرة.',
      slotEmpty: 'خانة فارغة', removeLetter: 'إزالة الحرف',
    },
  } as const)[language === 'ku' ? 'ku' : language === 'ar' ? 'ar' : 'en'];

  /**
   * DOUBLE-STEP FIX (scramble): transition guards.
   * - `scrambleVerifyLockRef` stops a double-tap on "Verify Answer" from
   *   scoring twice / firing duplicate feedback.
   * - `scrambleAdvanceAtRef` debounces "Next Word": two rapid clicks used to
   *   generate two new words (visibly skipping one).
   * - `scrambleResetTimerRef` tracks the wrong-answer cleanup timer so it
   *   can't wipe the letters of a NEXT word after advancing.
   */
  /**
   * MEMORY GAME RACE FIX: two fast taps on different cards landed before
   * React re-rendered, so the second tap read a stale `selectedCards` and
   * overwrote the first selection — stranding a card face-up forever.
   * The ref mirrors the selection synchronously.
   */
  const memorySelectionRef = useRef<number[]>([]);

  const scrambleVerifyLockRef = useRef(false);
  const scrambleAdvanceAtRef = useRef(0);
  const scrambleResetTimerRef = useRef<number | null>(null);

  const initScrambleGame = () => {
    // Debounce: one advance per 400ms window (single click = single word)
    const now = Date.now();
    if (now - scrambleAdvanceAtRef.current < 400) return;
    scrambleAdvanceAtRef.current = now;

    // A pending wrong-answer reset must never clear the next word's board
    if (scrambleResetTimerRef.current !== null) {
      clearTimeout(scrambleResetTimerRef.current);
      scrambleResetTimerRef.current = null;
    }
    scrambleVerifyLockRef.current = false;

    setIsScrambleCorrect(null);
    setUserLetters([]);
    setShowScrambleHint(false);
    
    // Pick a random word
    const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    setScrambleWord(randomWord);

    // Break Kurdish word into letters (e.g. 'Sor' -> 'S', 'o', 'r' but we preserve special letters)
    // To support clean split and spelling, we lowercase everything but keep spelling crisp
    const kWord = randomWord.ku.toLowerCase();
    const lettersArray = kWord.split('').map((char, index) => ({
      id: `${randomWord.id}-char-${index}`,
      char,
      used: false
    }));

    // Shuffle until guaranteed scrambled (different from original if length > 1)
    let scrambled = [...lettersArray].sort(() => 0.5 - Math.random());
    if (scrambled.map(l => l.char).join('') === kWord && lettersArray.length > 2) {
      scrambled = [...lettersArray].sort(() => 0.5 - Math.random());
    }

    setScrambleLetters(scrambled);
  };

  const selectScrambleLetter = (letterId: string, char: string) => {
    if (isScrambleCorrect) return;
    
    // Mark as used in available bin
    setScrambleLetters((prev) =>
      prev.map((l) => (l.id === letterId ? { ...l, used: true } : l))
    );
    // Add to user choices
    setUserLetters((prev) => [...prev, { originalId: letterId, char }]);
  };

  const deselectScrambleLetter = (userLetterIdx: number) => {
    if (isScrambleCorrect) return;

    const removed = userLetters[userLetterIdx];
    setUserLetters((prev) => prev.filter((_, idx) => idx !== userLetterIdx));

    // Restore to available letter block
    setScrambleLetters((prev) =>
      prev.map((l) => (l.id === removed.originalId ? { ...l, used: false } : l))
    );
    setIsScrambleCorrect(null);
  };

  const handleVerifyScramble = () => {
    if (!scrambleWord) return;
    // Transition lock: ignore duplicate clicks while a verification is
    // being shown (prevents double scoring / double XP).
    if (isScrambleCorrect === true || scrambleVerifyLockRef.current) return;
    scrambleVerifyLockRef.current = true;

    const constructedWord = userLetters.map((l) => l.char).join('');
    const targetWord = scrambleWord.ku.toLowerCase();

    if (constructedWord === targetWord) {
      playSuccessSound();
      setIsScrambleCorrect(true);
      setScrambleScore((s) => s + 1);
      triggerWinSetup(10); // +10 XP
      // stays locked until the next word is dealt (initScrambleGame)
    } else {
      playFailureSound();
      setIsScrambleCorrect(false);
      setScrambleAttempts((a) => a + 1);
      // Give shake cue or feedback (tracked so advancing cancels it)
      scrambleResetTimerRef.current = window.setTimeout(() => {
        scrambleResetTimerRef.current = null;
        setIsScrambleCorrect(null);
        // Clear all letters automatic replay
        setUserLetters([]);
        setScrambleLetters((prev) => prev.map((l) => ({ ...l, used: false })));
        scrambleVerifyLockRef.current = false; // allow retry
      }, 2000);
    }
  };

  // Start appropriate games on menu choice
  useEffect(() => {
    if (activeGame === 'memory') {
      initMemoryGame();
    } else if (activeGame === 'scramble') {
      initScrambleGame();
    }
  }, [activeGame]);

  return (
    <div className={`font-sans leading-relaxed transition-colors duration-300 ${
      activeGame === 'menu'
        ? "w-full min-h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-20"
        : activeGame === 'zombie'
        ? "absolute inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden pb-0"
        : "absolute inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto pb-12"
    }`}>
      {celebrate && (
        <Confetti 
          width={window.innerWidth} 
          height={window.innerHeight} 
          recycle={false} 
          numberOfPieces={150} 
        />
      )}

      {/* Header and Quit */}
      {activeGame !== 'menu' && activeGame !== 'matching' && activeGame !== 'zombie' && activeGame !== 'connect' && (
        /* Top-bar harmonization audit: the Scrambler (and legacy memory
           screen) now share the SAME GameHeader primitive as the other
           games — standard back button position, start-aligned title and
           the score pill in the unified end-side slot. */
        <div className="px-4 pt-4 w-full max-w-md mx-auto">
          <GameHeader
            title={activeGame === 'memory'
              ? (language !== 'ar' ? 'Memory Cards Match' : 'تطابق بطاقات الذاكرة')
              : st.title}
            onExit={() => setActiveGame('menu')}
            exitLabel={language !== 'ar' ? 'Exit game' : 'الخروج من اللعبة'}
            stat={activeGame === 'scramble' ? { label: st.scoreLabel, value: scrambleScore } : undefined}
          />
        </div>
      )}

      {/* ----------------- GAME PORTAL MENU ----------------- */}
      {activeGame === 'menu' && (
        <motion.div
          className="p-4 space-y-5 pb-24 max-w-sm mx-auto w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Hero Purple Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-flat border border-line-soft relative overflow-hidden flex items-center justify-between">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#FFB300]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-1 text-center mx-auto">
              <h2 className="text-xl font-black tracking-tight text-ink">
                {language !== 'ar' ? 'Learn with play & fun!' : 'تعلم باللعب ومرح!'}
              </h2>
              <p className="text-xs text-muted font-bold">
                {language !== 'ar' ? 'Play and learn at the same time' : 'العب وتعلّم في نفس الوقت'}
              </p>
            </div>

            <div className="w-14 h-14 bg-[#FFF3D6] dark:bg-[#3A2F14] rounded-2xl flex items-center justify-center shrink-0 border border-[#FFB300]/30">
              <Gamepad2 className="w-8 h-8 text-[#B8860B] dark:text-[#FFCE6B]" />
            </div>
          </div>

          {/* Section Header */}
          <div className="text-center pt-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {language !== 'ar' ? 'Choose your favorite game' : 'اختر لعبتك المفضلة'}
            </h3>
          </div>

          {/* Grid of Game Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* 1. Word Connect (توصيل الكلمات) - FEATURED */}
            <button
              onClick={() => setActiveGame('connect')}
              className="col-span-2 bg-white dark:bg-slate-900 border-2 border-[#FFB300]/60 rounded-3xl p-5 flex items-center justify-between gap-4 text-start shadow-flat hover:border-[#FFB300] hover:shadow-md transition-all group cursor-pointer outline-none min-h-[104px]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFB300] text-[#432C00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-[0_3px_0_#E69500]">
                  <Workflow className="w-7 h-7 text-white" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight group-hover:text-[#B45309] dark:group-hover:text-[#FFCE6B] transition-colors">
                      {language !== 'ar' ? 'Word Connect' : 'توصيل الكلمات'}
                    </h4>
                    <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse">
                      {language !== 'ar' ? 'NEW' : 'جديد'}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-snug">
                    {language !== 'ar' ? 'Swipe letters to connect and spell Kurdish words!' : 'صل الحروف بشكل دائري لتركيب الكلمات الكوردية!'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#FFB300] transition-colors shrink-0 rtl:rotate-180" />
            </button>

            {/* 2. Word Matching (مطابقة الكلمات) */}
            <button
              onClick={() => setActiveGame('matching')}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 text-center shadow-xs hover:border-[#FFB300] hover:shadow-md transition-all group cursor-pointer outline-none h-42"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Puzzle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight group-hover:text-[#B45309] transition-colors">
                  {language !== 'ar' ? 'Word Matching' : 'مطابقة الكلمات'}
                </h4>
                <p className="text-slate-400 text-[11px] font-semibold leading-snug">
                  {language !== 'ar' ? 'Match word with meaning' : 'تطابق الكلمة مع معناها'}
                </p>
              </div>
            </button>

            {/* 3. Zombie Attack (هجوم الزومبي) */}
            <button
              onClick={() => setActiveGame('zombie')}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 text-center shadow-xs hover:border-red-500 hover:shadow-md transition-all group cursor-pointer outline-none h-42"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight group-hover:text-red-600 transition-colors">
                  {language !== 'ar' ? 'Zombie Typing' : 'هجوم الزومبي'}
                </h4>
                <p className="text-slate-400 text-[11px] font-semibold leading-snug">
                  {language !== 'ar' ? 'Type quickly to survive' : 'اكتب الكلمات لحماية قريتك'}
                </p>
              </div>
            </button>

            {/* 4. Word Spelling (تهجئة الكلمة) */}
            <button
              onClick={() => setActiveGame('scramble')}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 text-center shadow-xs hover:border-[#FFB300] hover:shadow-md transition-all group cursor-pointer outline-none h-42"
            >
              <div className="w-12 h-12 rounded-full bg-[#F3E8FF] dark:bg-purple-950/60 text-[#8B5CF6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CaseSensitive className="w-6 h-6 text-[#8B5CF6]" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight group-hover:text-[#B45309] transition-colors">
                  {st.title}
                </h4>
                <p className="text-slate-400 text-[11px] font-semibold leading-snug">
                  {st.menuDesc}
                </p>
              </div>
            </button>

            {/* 5. Memory Game (الذاكرة - قريباً) — hidden for brand-new
                users (maintainer request): "Coming Soon" dead-ends add
                clutter during onboarding; the card appears once the player
                has real progress (a finished lesson or a game score). */}
            {/* VISUAL AUDIT FIX: this "Coming Soon" card was a live <button>
                that launched the unfinished legacy memory game despite the
                lock ribbon. It is now genuinely inert until the game ships. */}
            {isEstablishedUser && (
            <div
              aria-disabled="true"
              className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 text-center shadow-xs h-42 relative overflow-hidden select-none"
            >
              {/* Coming Soon Lock Ribbon */}
              <div className="absolute top-2.5 right-2.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>{language !== 'ar' ? 'Coming Soon' : 'قريباً'}</span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-2">
                <Brain className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight group-hover:text-amber-600 transition-colors">
                  {language !== 'ar' ? 'Memory Game' : 'لعبة الذاكرة'}
                </h4>
                <p className="text-amber-600/90 dark:text-amber-400/90 text-[11px] font-extrabold leading-snug">
                  {language !== 'ar' ? 'Under development - Coming Soon!' : 'قيد التحديث والتطوير - قريباً!'}
                </p>
              </div>
            </div>
            )}

          </div>

          {/* Educational benefit callout */}
          <div className="bg-[#FFF6E0] dark:bg-slate-900/80 border border-[#FFB300]/30 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB300] text-[#432C00] flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h5 className="font-extrabold text-xs text-slate-800 dark:text-white">
                {language !== 'ar' ? 'Gamified Learning Boost' : 'فائدة التكرار التفاعلي بالألعاب'}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                {language !== 'ar' 
                  ? 'Playing games speeds up long-term vocabulary retention by up to 3x!' 
                  : 'أثبتت الأبحاث أن ربط المفردات بالألعاب التفاعلية يزيد سرعة التذكر بنسبة 300%!'}
              </p>
            </div>
          </div>

        </motion.div>
      )}

      {/* ----------------- GAME 1: MEMORY MATCH (COMING SOON / قريباً) ----------------- */}
      {activeGame === 'memory' && (
        <div className="p-6 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center space-y-5 my-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xl relative"
          >
            <Brain className="w-12 h-12 text-amber-500" />
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-2xl shadow-md border-2 border-white dark:border-slate-900">
              <Lock className="w-5 h-5" />
            </div>
          </motion.div>

          <div className="space-y-2 max-w-xs">
            <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block">
              {language !== 'ar' ? 'Coming Soon' : 'ستتوفر قريباً'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {language !== 'ar' ? 'Memory Game Updating' : 'لعبة الذاكرة قيد التحديث'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed">
              {language !== 'ar'
                ? 'We are upgrading the memory game to be lighter and fully text-based. Stay tuned!'
                : 'تم إيقاف هذه الصفحة مؤقتاً. نعمل حالياً على إعادة بناء لعبة الذاكرة لتكون أسرع وبدون أي صور. ستتوفر قريبًا بنسخة جديدة!'}
            </p>
          </div>

          <button
            onClick={() => setActiveGame('menu')}
            className="w-full max-w-xs py-3.5 min-h-[44px] bg-[#FFB300] hover:bg-[#E69500] active:scale-95 text-[#432C00] rounded-full font-black text-sm transition-all shadow-[0_2px_0_#E69500] cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4.5 h-4.5 rtl:rotate-180" />
            <span>{language !== 'ar' ? 'Back to Games Menu' : 'العودة لقائمة الألعاب'}</span>
          </button>
        </div>
      )}

      {/* ----------------- GAME 2: SCRAMBLE ----------------- */}
      {activeGame === 'scramble' && scrambleWord && (
        <div className="p-4 flex-1 flex flex-col justify-between max-w-sm mx-auto w-full">
          <div>
            {/* Hint row — the score pill moved into the unified GameHeader. */}
            <div className="flex justify-end items-center mb-6">
              <button
                onClick={() => setShowScrambleHint(!showScrambleHint)}
                className="px-4 py-2 min-h-[44px] bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-300 dark:border-amber-900 rounded-full font-bold text-xs transition-colors cursor-pointer"
              >
                {showScrambleHint ? st.hideHint : st.showHint}
              </button>
            </div>

            {/* Game Canvas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-center space-y-6 relative overflow-hidden">
              <Puzzle className="absolute right-0 top-0 w-24 h-24 text-indigo-500 opacity-5 -translate-y-4 translate-x-4 select-none" />
              
              {/* Question Goal */}
              <div className="space-y-1 relative z-10">
                <div className="flex justify-center pb-1">
                  {getWordIcon(scrambleWord.category, "w-10 h-10 text-indigo-600 dark:text-indigo-400")}
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {st.prompt}
                </p>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                  <bdi>{language !== 'ar' ? scrambleWord.en : scrambleWord.ar}</bdi>
                </h3>
              </div>

              {/* Word preview hint trigger */}
              {showScrambleHint && (
                <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-2.5 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-bold">
                  {st.hintStarts} <span className="text-base font-black text-indigo-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-300/40 font-mono inline-block ml-1">{scrambleWord.ku[0]}</span>
                </div>
              )}

              {/* Completed Answer Slots */}
              <div className="flex gap-2 justify-center py-4 flex-wrap" dir="ltr">
                {scrambleWord.ku.split('').map((_, idx) => {
                  const letter = userLetters[idx];
                  return (
                    <motion.button
                      key={idx}
                      whileHover={letter ? { scale: 1.05 } : {}}
                      onClick={() => letter && deselectScrambleLetter(idx)}
                      aria-label={letter ? `${st.removeLetter}: ${letter.char}` : st.slotEmpty}
                      className={`w-12 h-12 rounded-xl text-lg font-black border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isScrambleCorrect === true
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : isScrambleCorrect === false
                          ? "bg-red-50 border-red-500 text-red-800 animate-[shake_0.5s_ease-in-out]"
                          : letter
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700/60"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {letter && (
                          <motion.span
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                          >
                            {letter.char}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Scrambled Available Letters Bin */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                  {st.available}
                </p>
                <div className="flex gap-2.5 justify-center flex-wrap" dir="ltr">
                  {scrambleLetters.map((l) => (
                    <button
                      key={l.id}
                      disabled={l.used || isScrambleCorrect !== null}
                      onClick={() => selectScrambleLetter(l.id, l.char)}
                      className={`w-12 h-12 rounded-xl font-black text-lg border cursor-pointer flex items-center justify-center transition-all ${
                        l.used
                          ? "bg-slate-100 border-slate-200 text-slate-300 opacity-30 cursor-not-allowed"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 active:scale-90 shadow-xs"
                      }`}
                    >
                      {l.char}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Word Scramble action buttons block */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setUserLetters([]);
                  setScrambleLetters((l) => l.map((item) => ({ ...item, used: false })));
                  setIsScrambleCorrect(null);
                }}
                className="py-4 px-5 bg-slate-200 hover:bg-slate-300 active:scale-[0.98] text-slate-700 rounded-3xl font-extrabold text-sm transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-200"
              >
                {st.reset}
              </button>
              
              {isScrambleCorrect === true ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    initScrambleGame();
                  }}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-3xl text-sm transition-all shadow-md shadow-emerald-500/15 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{st.next}</span>
                  <Star className="w-4 h-4 fill-current text-yellow-300" />
                </button>
              ) : (
                <button
                  disabled={userLetters.length !== scrambleWord.ku.length}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerifyScramble(); }}
                  className={`flex-1 py-4 font-extrabold rounded-3xl text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                    userLetters.length === scrambleWord.ku.length
                      ? "bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white cursor-pointer shadow-purple-500/15"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  {st.verify}
                </button>
              )}
            </div>
          </div>

          {/* Scramble Safe-zone encouragement tips */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-500 flex gap-2 text-center mt-8 items-center max-w-sm">
            <HelpCircle className="w-5 h-5 text-purple-500 shrink-0" />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {st.tip}
            </p>
          </div>
        </div>
      )}

      {activeGame === 'matching' && (
        <motion.div
          className="flex-1 min-h-0 flex flex-col"
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <MemoWordMatchingGame
            vocabulary={vocabulary}
            language={language}
            onWin={handleGameWin}
            onClose={handleExitToMenu}
          />
        </motion.div>
      )}

      {activeGame === 'zombie' && (
        <motion.div
          className="flex-1 min-h-0 flex flex-col"
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <MemoZombieTypingGame
            vocabulary={vocabulary}
            language={language}
            onWin={handleGameWin}
            onClose={handleExitToMenu}
          />
        </motion.div>
      )}

      {activeGame === 'connect' && (
        <motion.div
          className="flex-1 min-h-0 flex flex-col"
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <MemoWordConnectGame
            vocabulary={vocabulary}
            language={language}
            onWin={handleGameWin}
            onClose={handleExitToMenu}
          />
        </motion.div>
      )}

    </div>
  );
}

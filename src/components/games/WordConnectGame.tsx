import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Star, Award, ArrowRight, Lightbulb, Shuffle } from 'lucide-react';
import { Word } from '../../data/kurmanji';
import { Language } from '../../models/user';
import { playSuccessSound, playFailureSound, playCompleteSound } from '../../features/audio/hooks/useAudio';
import { Progress, StatPill } from '../ui';
import { GameHeader } from './GameHeader';
import { getPrimaryAnswerVariant } from '../../features/quiz/utils/answerUtils';

interface WordConnectGameProps {
  vocabulary: Word[];
  language: Language;
  onWin: (xp: number) => void;
  onClose: () => void;
}

interface ConnectLetter {
  id: string;
  char: string;
  index: number; // original index
  angle: number; // angle in radians for positioning
  x: number; // computed X in px (relative to 280x280 pad)
  y: number; // computed Y in px
}

export function WordConnectGame({ vocabulary, language, onWin, onClose }: WordConnectGameProps) {
  const [level, setLevel] = useState(1);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [letters, setLetters] = useState<ConnectLetter[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]); // indexes in letters array
  const [isWordCorrect, setIsWordCorrect] = useState<boolean | null>(null);
  const [gainedXP, setGainedXP] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLineEnd, setDragLineEnd] = useState<{ x: number; y: number } | null>(null);
  const [isLevelSuccess, setIsLevelSuccess] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [revealedHintCount, setRevealedHintCount] = useState(0);

  const padRef = useRef<HTMLDivElement>(null);
  const touchActiveIndices = useRef<number[]>([]);
  const levelAwardedRef = useRef(false);
  /**
   * DOUBLE-STEP FIX: solving a word scheduled an UNTRACKED 900ms auto-advance
   * timer while the success overlay also offered a manual "Next Level"
   * button doing a bare `setLevel(prev => prev + 1)`. Clicking the button
   * inside that 900ms window fired BOTH advances → the level skipped +2
   * (e.g. 1 → 3). Double-clicks during the overlay's exit animation did the
   * same (AnimatePresence keeps the old button clickable while animating).
   *
   * All level changes now flow through ONE guarded `advanceLevel()`:
   * - `advanceTimerRef` tracks the auto-advance so a manual click cancels it
   * - `advanceLevelLockRef` allows exactly one advance per solved word; it is
   *   released only when the NEXT success overlay appears (not on re-deal,
   *   which happens while the previous overlay is still animating out).
   */
  const advanceTimerRef = useRef<number | null>(null);
  const advanceLevelLockRef = useRef(false);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  // Cancel any pending auto-advance when the game unmounts
  useEffect(() => () => clearAdvanceTimer(), []);

  /** The ONLY path that moves the game forward — exactly +1 per solved word. */
  const advanceLevel = (solvedLevel: number) => {
    if (advanceLevelLockRef.current) return;
    advanceLevelLockRef.current = true;
    clearAdvanceTimer();
    if (solvedLevel >= 5) {
      setIsGameFinished(true);
      playCompleteSound();
    } else {
      setLevel(prev => prev + 1);
    }
  };

  const getConnectTarget = (word: Word) => getPrimaryAnswerVariant(word.ku).toUpperCase();

  // Filter suitable words (length 3 to 7, single fair variant, alphabetical).
  const getGameWords = () => {
    return vocabulary.filter((word) => {
      const target = getConnectTarget(word);
      return /^[A-ZÇÊÎŞÛ]{3,7}$/.test(target);
    });
  };

  // Setup a specific level word
  const loadWordForLevel = (lvl: number) => {
    const pool = getGameWords();
    if (pool.length === 0) return;
    
    // Choose word deterministically or randomly
    const index = (lvl - 1) % pool.length;
    const wordItem = pool[index];
    
    setCurrentWord(wordItem);
    setRevealedHintCount(0);
    setIsLevelSuccess(false);
    setIsWordCorrect(null);
    setSelectedIndices([]);
    setDragLineEnd(null);
    setIsDragging(false);
    touchActiveIndices.current = [];
    levelAwardedRef.current = false;

    // Setup letters in a circle using the primary fair variant.
    const wordLetters = getConnectTarget(wordItem).split('');
    // Shuffle the letters initially
    const shuffledWithOrigIndices = wordLetters
      .map((char, index) => ({ char, index }))
      .sort(() => Math.random() - 0.5);

    setupLettersPositioning(shuffledWithOrigIndices);
  };

  const setupLettersPositioning = (lettersData: { char: string; index: number }[]) => {
    const N = lettersData.length;
    const radius = 95; // Radius of the circle inside the 260x260 pad
    const center = 130; // Center coordinate of the pad

    const newLetters: ConnectLetter[] = lettersData.map((item, i) => {
      const angle = (i * 2 * Math.PI) / N - Math.PI / 2; // Distribute evenly
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return {
        id: `letter-${item.index}-${i}`,
        char: item.char,
        index: i,
        angle,
        x,
        y,
      };
    });

    setLetters(newLetters);
  };

  // Load level on start or when level changes
  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      loadWordForLevel(level);
    }
  }, [vocabulary, level]);

  // Handle letter selection during drag or tap
  const selectLetter = (index: number) => {
    if (isLevelSuccess || isWordCorrect !== null) return;

    if (!selectedIndices.includes(index)) {
      const newIndices = [...selectedIndices, index];
      setSelectedIndices(newIndices);
      
      // Gentle audio click visual/feedback can be triggered here if sound assets exist
      // Highlight selection or vibrate slightly
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    }
  };

  // Shuffle letters position
  const handleShuffle = () => {
    if (isLevelSuccess || isWordCorrect !== null) return;
    
    // Smoothly shuffle currently visible letters
    const currentLettersData = letters.map(l => ({ char: l.char, index: l.index }));
    const shuffled = currentLettersData.sort(() => Math.random() - 0.5);
    setupLettersPositioning(shuffled);
    setSelectedIndices([]);
    setDragLineEnd(null);
  };

  // Get first letter for visual hint
  const handleHint = () => {
    if (!currentWord || isLevelSuccess) return;
    const wordLen = getConnectTarget(currentWord).length;
    if (revealedHintCount < wordLen) {
      setRevealedHintCount(prev => prev + 1);
    }
  };

  // Submit/Verify spelling
  const submitWord = (indices = selectedIndices) => {
    if (!currentWord || indices.length === 0) {
      setSelectedIndices([]);
      setDragLineEnd(null);
      setIsDragging(false);
      return;
    }

    const constructed = indices.map(i => letters[i]?.char ?? '').join('').toLowerCase();
    const target = getConnectTarget(currentWord).toLowerCase();

    // Transition lock: while correct/wrong feedback is on screen the level
    // change is already scheduled — further submissions must not stack.
    if (isWordCorrect !== null || isLevelSuccess) {
      setSelectedIndices([]);
      setDragLineEnd(null);
      setIsDragging(false);
      return;
    }

    if (constructed === target) {
      if (levelAwardedRef.current) return;
      levelAwardedRef.current = true;
      advanceLevelLockRef.current = false; // success overlay appears — allow exactly one advance
      // CORRECT!
      playSuccessSound();
      setIsWordCorrect(true);
      setIsLevelSuccess(true);
      
      const xpEarned = 10;
      setGainedXP(prev => prev + xpEarned);
      onWin(xpEarned);

      // Auto-advance after the celebration — TRACKED so a manual
      // "Next Level" click cancels it instead of stacking with it.
      const solvedLevel = level;
      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        advanceLevel(solvedLevel);
      }, 900);
    } else {
      // WRONG
      playFailureSound();
      setIsWordCorrect(false);
      
      // Let it flash red and reset
      window.setTimeout(() => {
        setIsWordCorrect(null);
        setSelectedIndices([]);
        setDragLineEnd(null);
        setIsDragging(false);
        touchActiveIndices.current = [];
      }, 1000);
    }
  };

  // --- MOUSE DRAG EVENT HANDLERS ---
  const handleMouseDown = (index: number) => {
    if (isLevelSuccess || isWordCorrect !== null) return;
    setIsDragging(true);
    setSelectedIndices([index]);
    setDragLineEnd({ x: letters[index].x, y: letters[index].y });
  };

  const handleMouseEnter = (index: number) => {
    if (!isDragging || isLevelSuccess || isWordCorrect !== null) return;
    
    // If we're hovering back to the second to last element, remove the last one (allow undo)
    if (selectedIndices.length > 1 && selectedIndices[selectedIndices.length - 2] === index) {
      setSelectedIndices(prev => prev.slice(0, -1));
      return;
    }

    selectLetter(index);
  };

  // Mouse move anywhere in container to draw line to cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedIndices.length === 0 || isLevelSuccess || isWordCorrect !== null) return;
    if (!padRef.current) return;

    const rect = padRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragLineEnd({ x, y });
  };

  const handleGlobalMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      submitWord(selectedIndices);
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, selectedIndices, letters, currentWord]);

  // --- TOUCH EVENT HANDLERS FOR MOBILE DEVICES ---
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.preventDefault();
    if (isLevelSuccess || isWordCorrect !== null) return;
    setIsDragging(true);
    setSelectedIndices([index]);
    touchActiveIndices.current = [index];
    setDragLineEnd({ x: letters[index].x, y: letters[index].y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging || isLevelSuccess || isWordCorrect !== null || !padRef.current) return;

    const touch = e.touches[0];
    const rect = padRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setDragLineEnd({ x, y });

    // Find if we are touching over another letter element
    const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!touchedElement) return;

    const dataIndexStr = touchedElement.getAttribute('data-letter-index');
    if (dataIndexStr !== null) {
      const idx = parseInt(dataIndexStr, 10);
      if (!isNaN(idx)) {
        // Handle select or backtrack
        if (touchActiveIndices.current.length > 1 && touchActiveIndices.current[touchActiveIndices.current.length - 2] === idx) {
          // Undo last
          touchActiveIndices.current.pop();
          setSelectedIndices([...touchActiveIndices.current]);
        } else if (!touchActiveIndices.current.includes(idx)) {
          touchActiveIndices.current.push(idx);
          setSelectedIndices([...touchActiveIndices.current]);
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }
      }
    }
  };

  const handleTouchEnd = (e?: React.TouchEvent) => {
    e?.preventDefault();
    if (isDragging) {
      setIsDragging(false);
      submitWord(touchActiveIndices.current);
    }
  };

  // Sequential Tapping fallback (for users who prefer tapping instead of dragging)
  const handleLetterTap = (index: number) => {
    if (isDragging || isLevelSuccess || isWordCorrect !== null) return;

    // If already selected, maybe undo selection if it's the last one, or clear
    if (selectedIndices.includes(index)) {
      if (selectedIndices[selectedIndices.length - 1] === index) {
        setSelectedIndices(prev => prev.slice(0, -1));
      } else {
        setSelectedIndices([]);
      }
      return;
    }

    selectLetter(index);
  };

  // Complete round reset
  const handleRestartFullGame = () => {
    clearAdvanceTimer();
    advanceLevelLockRef.current = false;
    setLevel(1);
    setGainedXP(0);
    setIsGameFinished(false);
    loadWordForLevel(1);
  };

  if (!currentWord) return null;

  const activeTarget = getConnectTarget(currentWord);
  const wordLength = activeTarget.length;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 p-4 pb-24 max-w-lg mx-auto w-full antialiased relative overflow-y-auto">
      
      {/* Header Bar — unified GameHeader (top-bar harmonization audit) */}
      <GameHeader
        title={language !== 'ar' ? 'Word Connect' : 'توصيل الكلمات'}
        onExit={onClose}
        exitLabel={language !== 'ar' ? 'Exit game' : 'الخروج من اللعبة'}
        stat={{ label: language !== 'ar' ? 'Level' : 'المستوى', value: `${level}/5` }}
      />

      {/* HUD Info Row */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs mb-5">
        <div className="text-start font-bold">
          <span className="text-[10px] text-slate-400 block tracking-widest uppercase">
            {language !== 'ar' ? 'TRANSLATION CLUE' : 'معنى الكلمة المستهدفة'}
          </span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
            {language !== 'ar' ? currentWord.en : currentWord.ar}
          </span>
        </div>

        <StatPill icon={<Star className="w-4 h-4 fill-current" />} label={language !== 'ar' ? 'XP' : 'خبرة'} value={gainedXP} />
      </div>

      <div className="mb-4">
        <Progress value={level - 1 + (isLevelSuccess ? 1 : 0)} max={5} label={language !== 'ar' ? 'Challenge Progress' : 'تقدم التحدي'} />
      </div>

      {/* Main Game Screen */}
      {isGameFinished ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-6">
          <div className="w-24 h-24 bg-amber-100 dark:bg-amber-950/20 border-2 border-amber-400 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <Trophy className="w-12 h-12 text-amber-500 fill-amber-300" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">
              {language !== 'ar' ? 'Wonderful Victory!' : 'فوز باهر ومستحق!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {language !== 'ar' 
                ? 'You have connected all word levels and completed the Word Connect challenge!' 
                : 'لقد أتممت توصيل الكلمات وحل جميع الألغاز في جولة التحدي بنجاح تام!'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl w-full max-w-sm text-xs space-y-3 shadow-xs">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-center text-[10px]">
              {language !== 'ar' ? 'Round Performance Summary' : 'ملخص أدائك الكلي'}
            </p>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-bold pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
              <span>{language !== 'ar' ? 'Levels Completed:' : 'المستويات المنجزة:'}</span>
              <span className="text-indigo-600 font-black">5 / 5</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-bold">
              <span>{language !== 'ar' ? 'Total XP Gained:' : 'مجموع النقاط المكتسبة:'}</span>
              <span className="text-yellow-500 font-black">+{gainedXP} XP</span>
            </div>
          </div>

          <div className="flex w-full max-w-sm gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 min-h-[44px] bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 active:scale-95 text-slate-700 dark:text-slate-300 font-bold rounded-full text-xs transition-all border border-slate-200 dark:border-slate-800 cursor-pointer outline-none"
            >
              {language !== 'ar' ? 'Exit' : 'خروج'}
            </button>
            <button
              onClick={handleRestartFullGame}
              className="flex-1 py-3.5 min-h-[44px] bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] shadow-[0_2px_0_#E69500] active:scale-95 font-extrabold rounded-full text-xs transition-all cursor-pointer outline-none flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language !== 'ar' ? 'Play Again' : 'العب مجدداً'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Top: Slots for Word spelling */}
          <div className="flex flex-col items-center justify-center space-y-4 py-3">
            
            {/* Visual Word Category Icon */}
            {currentWord.emoji && (
              <span className="text-2xl filter drop-shadow-xs mb-1 select-none animate-pulse">
                {currentWord.emoji}
              </span>
            )}

            {/* Letter Slots */}
            <div className="flex gap-2 justify-center flex-wrap" dir="ltr">
              {activeTarget.split('').map((char, idx) => {
                const targetChar = char.toUpperCase();
                // Determine if this letter is revealed by current selection OR by hint
                const isRevealedBySelection = selectedIndices.length > idx && isWordCorrect === true;
                const isRevealedByHint = idx < revealedHintCount;
                const isShown = isRevealedBySelection || isRevealedByHint;

                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-11 h-11 rounded-xl font-mono text-lg font-black border-2 flex items-center justify-center transition-all ${
                      isWordCorrect === true
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                        : isWordCorrect === false
                        ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-950/20 dark:text-red-300 animate-[shake_0.4s_ease-in-out]'
                        : isShown
                        ? 'bg-indigo-50/70 border-indigo-400 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-transparent'
                    }`}
                  >
                    {isShown ? targetChar : '_'}
                  </motion.div>
                );
              })}
            </div>

            {/* Current Spelling Text Selection Preview */}
            <div className="h-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {selectedIndices.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`px-4 py-1 rounded-full text-xs font-black tracking-widest font-mono shadow-inner border uppercase ${
                      isWordCorrect === true
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : isWordCorrect === false
                        ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-slate-900 dark:border-slate-800 dark:text-indigo-300'
                    }`}
                  >
                    {selectedIndices.map(i => letters[i].char).join('')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Dynamic Circular Letter Connection Pad */}
          <div className="flex justify-center items-center py-6 relative select-none">
            
            <div 
              ref={padRef}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseMove={handleMouseMove}
              className="relative w-[260px] h-[260px] bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-full shadow-inner flex items-center justify-center touch-none"
            >
              {/* SVG drawing connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* SVG Shadow / Glow filter */}
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Drawn lines between selected letters */}
                {selectedIndices.length > 1 && (
                  <path
                    d={`M ${selectedIndices.map(idx => `${letters[idx].x} ${letters[idx].y}`).join(' L ')}`}
                    fill="none"
                    stroke="var(--color-indigo-500, #6366f1)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                    className="stroke-indigo-500 dark:stroke-indigo-400"
                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.4))' }}
                  />
                )}

                {/* Live drag/swipe line from last letter to pointer position */}
                {isDragging && selectedIndices.length > 0 && dragLineEnd && (
                  <line
                    x1={letters[selectedIndices[selectedIndices.length - 1]].x}
                    y1={letters[selectedIndices[selectedIndices.length - 1]].y}
                    x2={dragLineEnd.x}
                    y2={dragLineEnd.y}
                    stroke="var(--color-indigo-400, #818cf8)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.7"
                    className="stroke-indigo-400 dark:stroke-indigo-500"
                    strokeDasharray="4 4"
                  />
                )}
              </svg>

              {/* Central hint or circle pad indicator */}
              <div className="absolute w-24 h-24 bg-slate-50 dark:bg-slate-950/60 rounded-full border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-2 text-center pointer-events-none select-none z-0 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 leading-tight uppercase block">
                  {language !== 'ar' ? 'CONNECT' : 'وصّل'}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug mt-1">
                  {language !== 'ar' ? 'Swipe / Tap' : 'اسحب أو انقر'}
                </span>
              </div>

              {/* Floating interactive letter buttons */}
              {letters.map((letter, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <button
                    key={letter.id}
                    data-letter-index={idx}
                    className={`connect-letter-btn absolute w-13 h-13 rounded-full font-mono text-xl font-extrabold flex items-center justify-center border-2 shadow-sm transition-all select-none z-20 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white scale-110 ring-4 ring-indigo-500/20 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-400 active:scale-95'
                    } cursor-pointer touch-none`}
                    style={{
                      left: `${letter.x - 26}px`, // Offset half of width (52px / 2 = 26px)
                      top: `${letter.y - 26}px`,
                    }}
                    onMouseDown={() => handleMouseDown(idx)}
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onTouchStart={(e) => handleTouchStart(e, idx)}
                    onClick={() => handleLetterTap(idx)}
                  >
                    {letter.char}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Bottom Controls / Assistance */}
          <div className="flex items-center justify-between gap-4 mt-2">
            {/* Shuffle button */}
            <button
              onClick={handleShuffle}
              className="flex-1 py-3 px-4 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center gap-2 font-black text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-95"
              title={language !== 'ar' ? 'Shuffle Letters' : 'خلط ترتيب الحروف'}
            >
              <Shuffle className="w-4 h-4 text-indigo-500" />
              <span>{language !== 'ar' ? 'Shuffle' : 'إعادة ترتيب'}</span>
            </button>

            {/* Hint button */}
            <button
              onClick={handleHint}
              disabled={revealedHintCount >= wordLength}
              className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95 ${
                revealedHintCount >= wordLength
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{language !== 'ar' ? 'Reveal Hint' : 'كشف حرف'}</span>
            </button>
          </div>

          {/* Level Complete success overlay / modal */}
          <AnimatePresence>
            {isLevelSuccess && !isGameFinished && (
              <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="w-full max-w-sm bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl p-6 text-center text-white space-y-4 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 text-7xl opacity-5 select-none pointer-events-none">🌟</div>
                  
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-xl font-black">
                      {language !== 'ar' ? 'Awesome Match!' : 'توصيل رائع ومتقن!'}
                    </h3>
                    <p className="text-xs text-indigo-100 leading-relaxed font-semibold">
                      {language !== 'ar' 
                        ? `You spelled "${currentWord.ku}" correctly!` 
                        : `تهانينا! لقد ركّبت الكلمة "${currentWord.ku}" بشكل صحيح متقن!`}
                    </p>
                  </div>

                  <div className="inline-flex bg-white/15 rounded-2xl items-center justify-center py-2.5 px-4 gap-2 border border-white/5 font-extrabold text-xs">
                    <Award className="w-4.5 h-4.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                    <span>+10 XP {language !== 'ar' ? 'Earned' : 'نقاط إضافية مضافة'}</span>
                  </div>

                  <div className="flex gap-3 relative z-10 pt-1">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 min-h-[44px] bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-full text-xs transition-all border border-white/10 cursor-pointer outline-none"
                    >
                      {language !== 'ar' ? 'Exit' : 'الرئيسية'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Manual advance: cancels the pending auto-advance
                        // timer; the lock makes +1 the only possible outcome.
                        advanceLevel(level);
                      }}
                      className="flex-1 py-3 min-h-[44px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black rounded-full text-xs hover:from-emerald-400 hover:to-emerald-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 outline-none"
                    >
                      <span>{language !== 'ar' ? 'Next Level' : 'المستوى التالي'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}

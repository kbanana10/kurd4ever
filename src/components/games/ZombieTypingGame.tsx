import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Trophy, 
  Play, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX, 
  Pause, 
  BookOpen, 
  Zap, 
  Home, 
  Lock, 
  Skull,
  X,
  Sparkles
} from 'lucide-react';
import { Word } from '../../data/kurmanji';
import { GameHeader } from './GameHeader';
import { Language } from '../../models/user';
import { 
  playZombieKillSound, 
  playZombieDamageSound, 
  playCompleteSound, 
  startZombieMusic, 
  stopZombieMusic 
} from '../../features/audio/hooks/useAudio';
import { Progress, StatPill } from '../ui';

interface ZombieTypingGameProps {
  vocabulary: Word[];
  language: Language;
  onWin: (xp: number) => void;
  onClose: () => void;
}

const SPECIAL_KURDISH_KEYS = [
  { key: 'Ç', helper: 'C' },
  { key: 'Ê', helper: 'E' },
  { key: 'Î', helper: 'I' },
  { key: 'Ş', helper: 'S' },
  { key: 'Û', helper: 'U' },
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export function ZombieTypingGame({ vocabulary, language, onWin, onClose }: ZombieTypingGameProps) {
  /**
   * DESIGN/I18N FIX: every visible string in this game was hardcoded Kurdish
   * regardless of the UI language (an English/Arabic user couldn't read a
   * single control), the meaning hint preferred Arabic for everyone, and
   * several strings were not valid Kurmanji ("KALIMA", "Wişeyên", "Hiştin"
   * for listening, "Eniya" for wave). All copy now localizes per app
   * language, with the Kurdish reviewed and corrected.
   */
  const zt = ({
    en: {
      kicker: 'ATTACK OF THE', title: 'ZOMBIES', tagline: 'Learn, defend, survive!',
      rules: 'HOW TO PLAY',
      rule1t: 'Type the correct words', rule1d: 'Spell without mistakes',
      rule2t: 'Level up your language', rule2d: 'Reading + listening + writing',
      rule3t: 'Beat every wave', rule3d: 'Push your high score!',
      best: 'YOUR BEST SCORE', start: 'START GAME',
      wave: 'WAVE', score: 'SCORE', time: 'TIME',
      prompt: 'TYPE THIS WORD', canType: 'You can type:', or: 'or',
      placeholder: 'Type your answer…', clear: 'Clear', space: 'Space', submit: 'ENTER',
      lost: 'GAME OVER', lostSub: 'The zombies got you!', lostDesc: 'Shake it off — try again.',
      tryAgain: 'TRY AGAIN', backHome: 'BACK TO GAMES',
      paused: 'GAME PAUSED', pausedSub: 'Take a breather.', resume: 'Resume', mainMenu: 'Main Menu',
      settings: 'Settings', sound: 'Sound Effects', close: 'Close', speak: 'Pronounce word',
    },
    ku: {
      kicker: 'ÊRÎŞA', title: 'ZOMBIYAN', tagline: 'Fêr bibe, biparêze, serkeftî be!',
      rules: 'ÇAWA TÊ LÎSTIN',
      rule1t: 'Peyvên rast binivîse', rule1d: '{zt.rule1d}',
      rule2t: 'Zimanê xwe bi pêş bixe', rule2d: 'Xwendin + Guhdarîkirin + Nivîsandin',
      rule3t: 'Hemû pêlan têk bibe', rule3d: 'Puana xwe bilind bike!',
      best: 'PUANA TE YA HERÎ BILIND', start: 'DEST PÊ BIKE',
      wave: 'PÊL', score: 'PUAN', time: 'DEM',
      prompt: 'VÊ PEYVÊ BINIVÎSE', canType: 'Dikarî binivîsî:', or: 'an',
      placeholder: 'Bersiva xwe binivîse…', clear: 'Paqij bike', space: 'Navber', submit: 'TEMAM',
      lost: 'DAWÎ!', lostSub: 'Zombî bi ser ketin!', lostDesc: '{zt.lostDesc}',
      tryAgain: 'DÎSA BICERIBÎNE', backHome: 'VEGERE LÎSTIKAN',
      paused: 'LÎSTIK RAWESTIYA', pausedSub: 'Bêhna xwe veke.', resume: 'Berdewam bike', mainMenu: 'Menuya Serî',
      settings: 'Mîheng', sound: 'Deng', close: 'Bigire', speak: 'Peyvê bibihîze',
    },
    ar: {
      kicker: 'هجوم', title: 'الزومبي', tagline: 'تعلّم، دافع، انجُ!',
      rules: 'طريقة اللعب',
      rule1t: 'اكتب الكلمات الصحيحة', rule1d: 'اكتب دون أخطاء',
      rule2t: 'طوّر لغتك الكوردية', rule2d: 'قراءة + استماع + كتابة',
      rule3t: 'تغلّب على كل الموجات', rule3d: 'ارفع رقمك القياسي!',
      best: 'أعلى نتيجة لك', start: 'ابدأ اللعب',
      wave: 'الموجة', score: 'النقاط', time: 'الوقت',
      prompt: 'اكتب هذه الكلمة', canType: 'يمكنك كتابة:', or: 'أو',
      placeholder: 'اكتب إجابتك…', clear: 'مسح', space: 'مسافة', submit: 'إدخال',
      lost: 'انتهت اللعبة!', lostSub: 'أمسك بك الزومبي!', lostDesc: 'حاول مرة أخرى.',
      tryAgain: 'حاول مجدداً', backHome: 'العودة للألعاب',
      paused: 'اللعبة متوقفة', pausedSub: 'خذ نفساً.', resume: 'استئناف', mainMenu: 'القائمة الرئيسية',
      settings: 'الإعدادات', sound: 'المؤثرات الصوتية', close: 'إغلاق', speak: 'انطق الكلمة',
    },
  } as const)[language === 'ku' ? 'ku' : language === 'ar' ? 'ar' : 'en'];

  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  // AUDIT FIX: this was seeded to 24, so a brand-new player was shown a
  // "high score" of 24 they had never earned, and their genuine first score
  // could never register as a personal best until it beat the fake number.
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(100); // 100% to 0%
  const [gameTimeSeconds, setGameTimeSeconds] = useState(0);
  const [wordsCleared, setWordsCleared] = useState(0);
  const [shakeInput, setShakeInput] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  /** R-01/R-02: the root is one scroll container across game states. The
   *  start screen's CTA sits at the bottom, so on short/landscape viewports
   *  the player reaches 'playing' with inherited scroll — hiding the HUD.
   *  We snap back to top on state entry. */
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverAwardedRef = useRef(false);
  const isResolvingRef = useRef(false);
  /**
   * DOUBLE-STEP FIX: the countdown scheduled `handleTimeOut` from inside the
   * setTimeLeft state updater with no guard. React dev double-invocation of
   * updaters (StrictMode) — or a timeout racing a user submission — could
   * fire it twice: two lives lost and two words skipped for ONE timeout.
   */
  const timeoutPendingRef = useRef(false);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('kurdish_zombie_highscore');
    if (saved) {
      const parsed = parseInt(saved, 10);
      // Guard against a corrupted / hand-edited localStorage value.
      setHighScore(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
    }
  }, []);

  // Audio music loop
  useEffect(() => {
    if (gameState === 'playing' && soundEnabled) {
      startZombieMusic();
    } else {
      stopZombieMusic();
    }
    return () => {
      stopZombieMusic();
    };
  }, [gameState, soundEnabled]);

  // Pick new random word
  const pickNewWord = (avoidId?: string) => {
    if (!vocabulary || vocabulary.length === 0) return;
    let pool = vocabulary.filter(w => w.ku && w.ku.trim().length > 0);
    if (avoidId && pool.length > 1) {
      pool = pool.filter(w => w.id !== avoidId);
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];
    setCurrentWord(selected);
    setTimeLeft(100);
    setInputValue('');
  };

  // Start game handler
  const startGame = () => {
    gameOverAwardedRef.current = false;
    isResolvingRef.current = false;
    timeoutPendingRef.current = false;
    setScore(0);
    setWave(1);
    setLives(3);
    setGameTimeSeconds(0);
    setWordsCleared(0);
    setGameState('playing');
    pickNewWord();
    window.setTimeout(() => rootRef.current?.scrollTo({ top: 0 }), 0);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  // Speak word audio function
  const speakWord = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.lang = 'tr-TR';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  // Refs to read latest values safely inside timer callbacks without state setter side-effects
  const livesRef = useRef(lives);
  livesRef.current = lives;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;

  const currentWordRef = useRef(currentWord);
  currentWordRef.current = currentWord;

  // Game timer loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
      return;
    }

    // Ticking 100ms timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // Speed multiplier based on wave
        const speed = 0.8 + wave * 0.15;
        const nextTime = prev - speed;
        if (nextTime <= 0) {
          // Defer timeout execution outside of state update callback.
          // Guarded so duplicate updater invocations schedule it only ONCE.
          if (!timeoutPendingRef.current) {
            timeoutPendingRef.current = true;
            setTimeout(() => {
              timeoutPendingRef.current = false;
              handleTimeOut();
            }, 0);
          }
          return 100;
        }
        return nextTime;
      });
    }, 100);

    // Second counter
    secondTimerRef.current = setInterval(() => {
      setGameTimeSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
    };
  }, [gameState, wave]);

  // Time out handler (zombie attacks!)
  const handleTimeOut = () => {
    // Transition lock: never process a timeout while a submission (or a
    // previous timeout) is still resolving — one event, one penalty.
    if (isResolvingRef.current) return;
    // A stray timeout queued right at game-over must not fire post-mortem.
    if (gameOverAwardedRef.current || livesRef.current <= 0) return;
    isResolvingRef.current = true;

    if (soundEnabled) playZombieDamageSound();
    
    const nextLives = livesRef.current - 1;
    setLives(nextLives);

    if (nextLives <= 0) {
      triggerGameOver(scoreRef.current);
    } else if (currentWordRef.current) {
      pickNewWord(currentWordRef.current.id);
      window.setTimeout(() => {
        isResolvingRef.current = false;
        inputRef.current?.focus({ preventScroll: true });
      }, 0);
      return;
    }
    isResolvingRef.current = false;
  };

  // Game Over trigger
  const triggerGameOver = (finalScore: number) => {
    if (gameOverAwardedRef.current) return;
    gameOverAwardedRef.current = true;
    isResolvingRef.current = false;
    setGameState('gameover');
    if (soundEnabled) playCompleteSound();

    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      localStorage.setItem('kurdish_zombie_highscore', finalScore.toString());
    }

    const xp = Math.min(30, Math.max(10, Math.floor(finalScore / 2)));
    if (xp > 0) {
      window.setTimeout(() => {
        onWin(xp);
      }, 0);
    }
  };

  // Helper to normalize Kurdish text (removes special accents for easy typing & diacritic tolerance)
  const normalizeKurdishText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[çÇ]/g, 'c')
      .replace(/[êÊ]/g, 'e')
      .replace(/[îÎ]/g, 'i')
      .replace(/[şŞ]/g, 's')
      .replace(/[ûÛ]/g, 'u')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ');
  };

  // Extract options from target word (e.g. "Dayik / Dê" -> ["Dayik", "Dê"])
  const getWordVariants = (targetKuWord: string): string[] => {
    if (!targetKuWord) return [];
    const parts = targetKuWord.split(/[/,]| or /gi).map((p) => p.trim()).filter(Boolean);
    const full = targetKuWord.trim();
    if (parts.length > 0 && !parts.includes(full)) {
      parts.push(full);
    }
    return parts;
  };

  // Check if user's input matches any variant (exact or normalized)
  const isInputMatchingWord = (typedInput: string, targetKuWord: string): boolean => {
    if (!typedInput || !targetKuWord) return false;

    const rawTyped = typedInput.trim().toLowerCase();
    const normTyped = normalizeKurdishText(typedInput);

    if (!rawTyped) return false;

    const variants = getWordVariants(targetKuWord);

    for (const v of variants) {
      const rawVariant = v.toLowerCase();
      const normVariant = normalizeKurdishText(v);

      if (rawTyped === rawVariant || normTyped === normVariant) {
        return true;
      }
    }

    return false;
  };

  // Handle typing submit
  const handleSubmit = () => {
    if (isResolvingRef.current || gameState !== 'playing') return;
    if (!currentWord || !inputValue.trim()) return;
    isResolvingRef.current = true;

    if (isInputMatchingWord(inputValue, currentWord.ku)) {
      // Correct!
      if (soundEnabled) playZombieKillSound();
      const addedPoints = 15;
      setScore((s) => s + addedPoints);
      
      const nextCleared = wordsCleared + 1;
      setWordsCleared(nextCleared);

      // Increase wave/level every 3 correct words
      if (nextCleared % 3 === 0) {
        setWave((w) => w + 1);
      }

      pickNewWord(currentWord.id);
      window.setTimeout(() => {
        isResolvingRef.current = false;
        inputRef.current?.focus({ preventScroll: true });
      }, 0);
    } else {
      // Mismatch
      setShakeInput(true);
      if (soundEnabled) playZombieDamageSound();
      window.setTimeout(() => {
        setShakeInput(false);
        isResolvingRef.current = false;
        inputRef.current?.focus({ preventScroll: true });
      }, 400);
    }
  };

  // Physical keyboard safety: the focused input owns printable characters.
  // The global listener only submits with Enter when focus is outside the input,
  // preventing doubled letters from input.onChange + window.keydown.
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (document.activeElement === inputRef.current) return;
      handleSubmit();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, inputValue, currentWord]);

  // Virtual key click
  const handleVirtualKey = (key: string) => {
    setInputValue((prev) => prev + key);
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
  };

  // Format seconds as mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isAttacking = timeLeft < 35; // zombie attacks when time < 35%

  return (
    <div ref={rootRef} className={`flex flex-col min-h-0 h-full p-4 max-w-md mx-auto w-full font-sans relative select-none rounded-3xl overflow-x-hidden overflow-y-auto ${gameState === 'start' ? 'bg-[#FBFBFA] text-[#1E293B] border border-[#F1F5F9] shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : 'bg-[#0B0E1D] text-white shadow-2xl border border-slate-800'}`}>

      {/* Top bar — unified GameHeader (top-bar harmonization audit): lives
          indicator + score pill sit in the standard end-side position during
          play; the settings gear rides the shared action slot. */}
      <GameHeader
        tone={gameState === 'start' ? 'light' : 'dark'}
        title={zt.title}
        onExit={onClose}
        exitLabel={zt.mainMenu}
        indicator={(gameState === 'playing' || gameState === 'paused') ? (
          <span className="flex items-center gap-0.5">
            {[1, 2, 3].map((h) => (
              <Heart
                key={h}
                aria-hidden="true"
                className={`w-4 h-4 transition-all ${
                  h <= lives
                    ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'text-slate-800 fill-slate-800'
                }`}
              />
            ))}
          </span>
        ) : undefined}
        stat={(gameState === 'playing' || gameState === 'paused') ? { label: zt.score, value: score } : undefined}
        action={
          <button
            onClick={() => setShowSettings(true)}
            aria-label={zt.settings}
            className={`min-w-[44px] min-h-[44px] shrink-0 rounded-full border flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95 ${gameState === 'start' ? 'bg-white shadow-sm border-[#F1F5F9] text-[#64748B] hover:text-[#1E293B]' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        }
      />

      {/* ======================================================== */}
      {/* 1. START SCREEN ("1. START SCREEN") */}
      {/* ======================================================== */}
      {gameState === 'start' && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
          
          {/* Header Title Section */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFDAD6] border border-[#F1F5F9] text-[#93000A] mb-1 shadow-sm">
              <Skull className="w-6 h-6" />
            </div>
            
            <div className="flex flex-col items-center leading-none">
              <h1 className="text-sm font-bold tracking-widest uppercase text-[#64748B]">
                {zt.kicker}
              </h1>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-[#BA1A1A] uppercase pt-1">
                {zt.title}
              </h1>
            </div>

            <p className="text-xs text-[#64748B] font-semibold pt-1">
              {zt.tagline}
            </p>
          </div>

          {/* Zombie Graphic Banner */}
          <div className="relative w-full h-44 sm:h-48 rounded-3xl overflow-hidden bg-white border border-[#F1F5F9] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-center my-1">
            {/* Background subtle glow */}
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_center,rgba(255,179,0,0.10)_0%,transparent_70%)] pointer-events-none" />

            {/* Zombie Illustration */}
            <svg viewBox="0 0 200 200" className="w-40 h-40 sm:w-44 sm:h-44 z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]">
              {/* Zombie Body */}
              <path d="M70,160 Q100,140 130,160 L140,200 L60,200 Z" fill="#4C1D95" />
              <path d="M80,165 Q100,150 120,165 L125,200 L75,200 Z" fill="#3B0764" />
              
              {/* Zombie Arms / Claws */}
              <path d="M60,160 C40,140 30,120 20,130 C15,135 30,150 50,170 Z" fill="#15803D" />
              <path d="M140,160 C160,140 170,120 180,130 C185,135 170,150 150,170 Z" fill="#15803D" />
              
              {/* Zombie Head */}
              <rect x="70" y="60" width="60" height="70" rx="20" fill="#16A34A" />
              <ellipse cx="100" cy="130" rx="15" ry="8" fill="#15803D" />
              
              {/* Ears */}
              <circle cx="65" cy="95" r="8" fill="#15803D" />
              <circle cx="135" cy="95" r="8" fill="#15803D" />
              
              {/* Eyes Glowing */}
              <circle cx="85" cy="90" r="12" fill="#FEF08A" />
              <circle cx="85" cy="90" r="5" fill="#854D0E" />
              
              <circle cx="115" cy="90" r="12" fill="#FEF08A" />
              <circle cx="115" cy="90" r="5" fill="#854D0E" />

              {/* Mouth & Teeth */}
              <path d="M82,115 Q100,125 118,115 Z" fill="#450A0A" />
              <rect x="88" y="115" width="4" height="4" fill="#FFFFFF" />
              <rect x="108" y="115" width="4" height="4" fill="#FFFFFF" />
            </svg>
          </div>

          {/* RÊZIMAN (Rules Card) */}
          <div className="bg-white border border-[#F1F5F9] rounded-3xl p-4 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-[#64748B]">
              {zt.rules}
            </h3>

            <div className="space-y-3 text-xs">
              {/* Rule 1 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center shrink-0 text-[#8B5CF6]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1E293B] leading-tight">{zt.rule1t}</h4>
                  <p className="text-[10px] text-[#64748B] font-semibold">{zt.rule1d}</p>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFB300]/20 border border-[#FFB300]/30 flex items-center justify-center shrink-0 text-[#B8860B]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1E293B] leading-tight">{zt.rule2t}</h4>
                  <p className="text-[10px] text-[#64748B] font-semibold">{zt.rule2d}</p>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0 text-[#10B981]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1E293B] leading-tight">{zt.rule3t}</h4>
                  <p className="text-[10px] text-[#64748B] font-semibold">{zt.rule3d}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Best Record Card ("{zt.best}") */}
          <div className="bg-white border border-[#F1F5F9] rounded-3xl p-4 text-center space-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] block">
              {zt.best}
            </span>
            <div className="flex items-center justify-center gap-2 text-2xl font-extrabold text-[#FFB300] font-mono">
              <Trophy className="w-6 h-6 text-[#FFB300] fill-[#FFB300]/30" />
              <span>{highScore}</span>
            </div>
          </div>

          {/* Main Orange-Red Start Button ("▶ DEST PÊ BIKE") */}
          <button
            onClick={startGame}
            className="w-full py-4 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:brightness-110 active:scale-[0.98] text-white font-black text-lg tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 outline-none uppercase"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{zt.start}</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2 & 3. GAME START / ZOMBIE ATTACK ("2. GAME START" & "3. ZOMBIE ATTACK") */}
      {/* ======================================================== */}
      {(gameState === 'playing' || gameState === 'paused') && currentWord && (
        <div className="flex-1 min-h-0 flex flex-col justify-between space-y-2">
          
          {/* In-arena HUD: wave context + pause (lives + score live in the
              unified GameHeader above). */}
          <div className="flex items-center justify-between px-1">
            <StatPill label={zt.wave} value={wave} className="bg-slate-900 text-white" />

            {/* Pause Button */}
            <button
              onClick={() => setGameState('paused')}
              aria-label={zt.paused}
              className="min-w-[44px] min-h-[44px] rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-all active:scale-90"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Zombie Scene Container Box */}
          <div className={`relative w-full flex-1 min-h-[96px] max-h-52 rounded-2xl overflow-hidden border transition-all duration-500 flex flex-col justify-between p-3 ${
            isAttacking 
              ? 'bg-gradient-to-b from-red-950 via-rose-950/80 to-[#0B0E1D] border-red-600/60 shadow-[0_0_20px_rgba(225,29,72,0.3)]' 
              : 'bg-gradient-to-b from-slate-950 via-indigo-950/50 to-[#0B0E1D] border-indigo-900/40'
          }`}>
            {/* Graveyard moon & Trees overlay */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2)_0%,transparent_80%)] pointer-events-none" />
            <div className={`absolute top-2 right-6 w-14 h-14 rounded-full border shadow-md transition-colors ${
              isAttacking ? 'bg-red-200/20 border-red-500/30' : 'bg-indigo-100/10 border-white/20'
            }`} />

            {/* Centered Zombie Graphic (Walk vs Attack) */}
            <div className="flex-1 flex items-center justify-center relative z-10">
              <motion.div
                animate={isAttacking ? { scale: [1, 1.08, 1], y: [0, -4, 0] } : { y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: isAttacking ? 0.6 : 1.5 }}
                className="w-36 h-36 sm:w-40 sm:h-40"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                  {/* Body */}
                  <path d="M70,160 Q100,140 130,160 L140,200 L60,200 Z" fill={isAttacking ? "#7F1D1D" : "#4C1D95"} />
                  <path d="M80,165 Q100,150 120,165 L125,200 L75,200 Z" fill={isAttacking ? "#450A0A" : "#3B0764"} />
                  
                  {/* Arms */}
                  <path d={isAttacking ? "M50,150 C30,110 20,90 10,100 C5,105 20,130 40,160 Z" : "M60,160 C40,140 30,120 20,130 C15,135 30,150 50,170 Z"} fill="#16A34A" />
                  <path d={isAttacking ? "M150,150 C170,110 180,90 190,100 C195,105 180,130 160,160 Z" : "M140,160 C160,140 170,120 180,130 C185,135 170,150 150,170 Z"} fill="#16A34A" />
                  
                  {/* Head */}
                  <rect x="70" y="60" width="60" height="70" rx="20" fill="#22C55E" />
                  <ellipse cx="100" cy="130" rx="15" ry="8" fill="#16A34A" />
                  
                  {/* Eyes Glowing */}
                  <circle cx="85" cy="90" r="12" fill={isAttacking ? "#F97316" : "#FEF08A"} />
                  <circle cx="85" cy="90" r="5" fill={isAttacking ? "#7C2D12" : "#854D0E"} />
                  
                  <circle cx="115" cy="90" r="12" fill={isAttacking ? "#F97316" : "#FEF08A"} />
                  <circle cx="115" cy="90" r="5" fill={isAttacking ? "#7C2D12" : "#854D0E"} />

                  {/* Mouth */}
                  <path d="M80,115 Q100,130 120,115 Z" fill="#450A0A" />
                  <rect x="88" y="115" width="4" height="4" fill="#FFFFFF" />
                  <rect x="108" y="115" width="4" height="4" fill="#FFFFFF" />
                </svg>
              </motion.div>
            </div>

            {/* Bottom Progress Bar Timer */}
            <div className="flex items-center gap-2 z-10 bg-black/40 backdrop-blur-xs p-1.5 rounded-full border border-white/10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isAttacking ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-950 text-emerald-400'
              }`}>
                <Skull className="w-4 h-4" />
              </div>

              <Progress value={Math.max(0, timeLeft)} max={100} className="flex-1" />
            </div>
          </div>

          {/* Word Card Display */}
          {(() => {
            const wordVariants = getWordVariants(currentWord.ku);
            // Filter out full string if it contains slashes, to show clean sub-options like "Dayik" or "Dê"
            const cleanSubOptions = wordVariants.filter(v => !v.includes('/') && !v.includes(','));
            const hasMultipleVariants = cleanSubOptions.length > 1;

            return (
              <div className="bg-[#151B2E] border border-slate-800/90 rounded-2xl p-3.5 relative flex flex-col items-center justify-center text-center shadow-md">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                  {zt.prompt}
                </span>

                <div className="space-y-0.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
                    <bdi>{currentWord.ku}</bdi>
                  </h2>
                  <p className="text-sm text-slate-300 font-semibold">
                    <bdi>{language !== 'ar' ? (currentWord.en || currentWord.ar) : (currentWord.ar || currentWord.en)}</bdi>
                  </p>

                  {hasMultipleVariants && (
                    <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#3A2F14] border border-[#FFB300]/40 text-[11px] font-bold text-[#FFCE6B] inline-block shadow-xs">
                      {`${zt.canType} ${cleanSubOptions.join(` ${zt.or} `)}`}
                    </div>
                  )}
                </div>

                {/* Speaker Button on right side */}
                <button
                  onClick={() => speakWord(currentWord.ku)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-90"
                  title={zt.speak}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            );
          })()}

          {/* Input Field Box */}
          <div className="space-y-2">
            <div className={`relative w-full rounded-2xl bg-[#151B2E] border p-1 transition-all ${
              shakeInput ? 'border-red-500 ring-2 ring-red-500/30 animate-bounce' : 'border-slate-800 focus-within:border-[#FFB300]'
            }`}>
              <input
                ref={inputRef}
                type="text"
                /* R-02: the game renders its own on-screen keyboard; without
                   this, focusing the input ALSO summoned the OS keyboard on
                   touch devices (double keyboard over an already-tight
                   layout). Hardware keyboards are unaffected by inputMode. */
                inputMode="none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={zt.placeholder}
                maxLength={36}
                className="w-full bg-transparent px-4 py-2.5 text-center text-lg font-bold font-mono text-white placeholder:text-slate-500 outline-none"
                data-kq-focus="managed"
              />
            </div>

            {/* Kurdish Special Keys Bar */}
            <div className="grid grid-cols-5 gap-1.5" dir="ltr">
              {SPECIAL_KURDISH_KEYS.map(({ key, helper }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleVirtualKey(key)}
                  className="h-10 rounded-xl bg-[#3A2F14] hover:bg-[#4A3C1A] border border-[#FFB300]/40 text-[#FFCE6B] font-black text-base cursor-pointer transition-all active:scale-95 flex items-center justify-center relative shadow-xs"
                >
                  <span>{key}</span>
                  <span className="absolute bottom-1 right-1.5 text-[9px] text-indigo-400 font-extrabold leading-none opacity-80">
                    {helper}
                  </span>
                </button>
              ))}
            </div>

            {/* Virtual QWERTY Keyboard */}
            <div className="space-y-1 pt-1" dir="ltr">
              {KEYBOARD_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1">
                  {row.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleVirtualKey(k)}
                      className="flex-1 min-w-[24px] max-w-[36px] h-9 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-indigo-950 border border-slate-800 text-slate-200 font-extrabold text-xs cursor-pointer transition-all shadow-xs flex items-center justify-center"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              ))}

              {/* Bottom Row Controls */}
              <div className="flex gap-1.5 pt-1" dir="ltr">
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="px-3 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-extrabold text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                >
                  {zt.clear}
                </button>
                <button
                  type="button"
                  onClick={() => setInputValue((prev) => prev + ' ')}
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-extrabold text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                >
                  {zt.space}
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="px-3 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-extrabold text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                >
                  ⌫
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 h-10 rounded-xl bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] font-black text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-[0_2px_0_#E69500] uppercase tracking-wider"
                >
                  {zt.submit}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GAME OVER ("4. GAME OVER") */}
      {/* ======================================================== */}
      {gameState === 'gameover' && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
          
          {/* Top Status Bar HUD (Hearts lost) */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  className={`w-5 h-5 ${
                    h <= lives 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-slate-800 fill-slate-800'
                  }`}
                />
              ))}
            </div>

            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                {zt.wave}
              </span>
              <span className="text-base font-black text-slate-100 font-mono">
                {wave}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                {zt.score}
              </span>
              <span className="text-base font-black text-amber-500 font-mono">
                {score}
              </span>
            </div>

            <div className="w-9 h-9 rounded-2xl bg-slate-900/40 border border-slate-800/40 flex items-center justify-center text-slate-600">
              <Pause className="w-4 h-4 fill-current opacity-40" />
            </div>
          </div>

          {/* LOST Title & Subtitles */}
          <div className="text-center space-y-1">
            <h1 className="text-5xl font-black text-red-500 font-mono tracking-widest drop-shadow-[0_4px_16px_rgba(239,68,68,0.5)]">
              {zt.lost}
            </h1>
            <h3 className="text-base font-black text-slate-100 font-mono tracking-wide uppercase">
              {zt.lostSub}
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              {zt.lostDesc}
            </p>
          </div>

          {/* Tombstone Graphic Area */}
          <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-[#0B0E1D] border border-slate-800 flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)] pointer-events-none" />

            {/* Tombstone Illustration */}
            <svg viewBox="0 0 200 200" className="w-36 h-36 sm:w-40 sm:h-40 z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
              {/* Tombstone Body */}
              <path d="M50,180 L50,80 C50,40 150,40 150,80 L150,180 Z" fill="#334155" stroke="#475569" strokeWidth="3" />
              <path d="M40,180 L160,180 L160,195 L40,195 Z" fill="#1E293B" />
              
              {/* Skull on Tombstone */}
              <circle cx="100" cy="95" r="18" fill="#94A3B8" />
              <rect x="91" y="108" width="18" height="8" rx="2" fill="#94A3B8" />
              <circle cx="93" cy="95" r="5" fill="#1E293B" />
              <circle cx="107" cy="95" r="5" fill="#1E293B" />
              <path d="M98,103 L102,103 L100,100 Z" fill="#1E293B" />

              {/* R.I.P / Details Lines */}
              <line x1="75" y1="130" x2="125" y2="130" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
              <line x1="85" y1="142" x2="115" y2="142" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {/* Stats Card (PUAN, ENIYA, WEXT) */}
          <div className="bg-[#151B2E] border border-slate-800/90 rounded-2xl p-3.5 grid grid-cols-3 text-center divide-x divide-slate-800/80 shadow-md">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                {zt.score}
              </span>
              <span className="text-xl font-black text-red-500 font-mono">
                {score}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                {zt.wave}
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {wave}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                {zt.time}
              </span>
              <span className="text-xl font-black text-slate-100 font-mono">
                {formatTime(gameTimeSeconds)}
              </span>
            </div>
          </div>

          {/* Best Score Card */}
          <div className="bg-[#151B2E] border border-slate-800/90 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              {zt.best}
            </span>
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-amber-400 font-mono">
              <Trophy className="w-6 h-6 text-amber-400 fill-amber-400/30" />
              <span>{highScore}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Top Purple Try Again Button ("🔄 DÎSA BICERIBÎNE") */}
            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-full bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] shadow-[0_2px_0_#E69500] active:scale-[0.98] font-black text-sm tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 outline-none uppercase"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{zt.tryAgain}</span>
            </button>

            {/* Bottom Dark Return Home Button ("🏠 VEGERA SER MAL") */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-[0.98] text-slate-300 hover:text-white font-extrabold text-sm tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 outline-none uppercase"
            >
              <Home className="w-4 h-4" />
              <span>{zt.backHome}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAUSE MODAL OVERLAY */}
      {/* ======================================================== */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#151B2E] border border-slate-800 rounded-3xl p-6 text-center space-y-6 max-w-xs w-full shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white font-mono uppercase tracking-wider">
                {zt.paused}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {zt.pausedSub}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-3.5 rounded-full bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] shadow-[0_2px_0_#E69500] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{zt.resume}</span>
              </button>

              <button
                onClick={() => setGameState('start')}
                className="w-full py-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{zt.mainMenu}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SETTINGS MODAL OVERLAY */}
      {/* ======================================================== */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#151B2E] border border-slate-800 rounded-3xl p-6 space-y-6 max-w-xs w-full shadow-2xl relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                {zt.settings}
              </h3>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-slate-200">{zt.sound}</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    soundEnabled ? 'bg-[#FFB300] text-[#432C00]' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer"
            >
              {zt.close}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

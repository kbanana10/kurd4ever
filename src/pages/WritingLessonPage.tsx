/**
 * WritingLessonPage.tsx — the Interactive Letter Writing Lesson.
 *
 * Learning flow (one letter at a time, data-driven for all 31):
 *   learn → watch it written → trace the dashed guide → write it free →
 *   deterministic 0..100 score → XP (existing system) → next letter.
 *
 * Architecture notes (approved decisions):
 *   - Route `/writing/lesson/:letterId`; the existing `/writing` grid and
 *     `/writing/:letterId` trace page stay untouched.
 *   - Stroke data lives in src/data/letterStrokes.ts (GlyphStrokePlan,
 *     bbox-normalised M/L paths). TRACE mode judges whether the pointer stays
 *     close to the authored stroke (start dot → follow → end dot), with small
 *     deviations tolerated (evaluateLessonStroke). FREE mode runs the existing
 *     pixel coverage engine (evaluateTrace) mapped to 0..100 — a heuristic
 *     reasonable-attempt check, NOT AI/OCR/ML.
 *   - XP is awarded EXACTLY ONCE per completed attempt via updateUserProgress;
 *     best score / attempts / completed persist through updateUserData; the
 *     Writing grid's learned state still reads reviewDeck[letter.id].
 *   - No pointer data is ever persisted or put on Firebase; no React state per
 *     pointer move (the canvas writes via refs).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { registerBackInterceptor } from '../lib/navigation';
import { alphabet } from '../data/kurmanji';
import { AudioButton } from '../components/AudioButton';
import { Button, Modal, Progress } from '../components/ui';
import LetterDemo from '../components/LetterDemo';
import ScoreRing from '../components/ScoreRing';
import WritingLessonCanvas, { type WritingLessonCanvasHandle } from '../components/WritingLessonCanvas';
import {
  getLetterStrokes,
  getLetterReadiness,
  letterStrokesToPx,
} from '../data/letterStrokes';
import {
  evaluateLessonStroke,
  scoreLessonTrace,
  freeWriteScore,
  scoreBand,
  glyphBBoxFromMask,
  type TracePoint,
  type ScoreBand,
} from '../lib/pathValidation';
import {
  buildLetterMask,
  buildStrokesMask,
  evaluateTrace,
  TRACE_CANVAS,
} from '../lib/traceLetters';
import { recordReview, type ReviewDeck } from '../services/SpacedRepetitionService';
import {
  Volume2,
  Eye,
  Pencil,
  Feather,
  Eraser,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trophy,
} from 'lucide-react';
import type { WritingLetterProgress } from '../models/user';

type Stage = 'learn' | 'watch' | 'trace' | 'write' | 'result';

/**
 * The slice of `history.state` this page reads: react-router 7 writes
 * `{ usr, key, idx }` on every entry it owns, and the deep-link marker pushed
 * below adds its own `kqLessonBackMarker` flag. `idx` 0 means the lesson is
 * the FIRST entry of the session (a deep link), with nothing below it.
 */
interface LessonHistoryState {
  idx?: number;
  kqLessonBackMarker?: boolean;
}

/** XP by score band (awarded exactly once per attempt). */
const XP_BY_BAND = {
  excellent: 12,
  good: 10,
  practice: 8,
  retry: 0,
} satisfies Record<ScoreBand, number>;

const bandLabels = (isKu: boolean, isAr: boolean) =>
  ({
    excellent: isKu ? 'Pir baş! 🌟' : isAr ? 'ممتاز! 🌟' : 'Excellent! 🌟',
    good: isKu ? 'Baş e! 👍' : isAr ? 'جيد! 👍' : 'Good! 👍',
    practice: isKu ? 'Berdewam be 💪' : isAr ? 'واصل التدريب 💪' : 'Keep practicing 💪',
    retry: isKu ? 'Dîsa biceribîne 📝' : isAr ? 'حاول مجدداً 📝' : 'Retry 📝',
  }) satisfies Record<ScoreBand, string>;

export function WritingLessonPage() {
  const navigate = useNavigate();
  const { letterId } = useParams();
  const { language, userData, updateUserData, updateUserProgress } = useAuth();

  const letter = alphabet.find((l) => l.id === letterId) || alphabet[0];
  const glyph = letter.char.split(' ')[0].toUpperCase();

  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const canvasRef = useRef<WritingLessonCanvasHandle>(null);
  const [stage, setStage] = useState<Stage>('learn');
  const [activeStroke, setActiveStroke] = useState(0);
  const [traceFeedback, setTraceFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [earnedXp, setEarnedXp] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScoreSent, setFinalScoreSent] = useState(false);

  const plan = useMemo(() => getLetterStrokes(glyph), [glyph]);
  const readiness = getLetterReadiness(glyph);
  const traceable = readiness === 'ready' && !!plan && plan.strokes.length > 0;
  const totalStrokes = plan?.strokes.length ?? 0;

  // XP exactly-once guard: true after the current attempt has awarded XP.
  const xpAwardedRef = useRef(false);

  // The authored plan in pixel space (for guided trace evaluation) is derived
  // by the page from the same mask/bbox the canvas uses.
  const authoredPxRef = useRef<TracePoint[][]>([]);
  useEffect(() => {
    if (!plan) {
      authoredPxRef.current = [];
      return;
    }
    const mask = buildLetterMask(glyph);
    const bbox = glyphBBoxFromMask(mask, TRACE_CANVAS);
    authoredPxRef.current = bbox ? letterStrokesToPx(plan, bbox) : [];
  }, [plan, glyph]);

  // Reset the attempt (trace/write) without leaving the lesson.
  const resetAttempt = useCallback(() => {
    canvasRef.current?.clear();
    setActiveStroke(0);
    setTraceFeedback(null);
    setScore(null);
    setShowResult(false);
    setFinalScoreSent(false);
    xpAwardedRef.current = false;
  }, []);

  const startTrace = useCallback(() => {
    resetAttempt();
    setStage('trace');
  }, [resetAttempt]);

  const startWrite = useCallback(() => {
    resetAttempt();
    setStage('write');
  }, [resetAttempt]);

  // State ownership (same contract as WritingWordTracingPage): when only
  // :letterId changes, React Router keeps this component mounted and would
  // otherwise carry the scored result, the open result overlay and the spent
  // XP guard into the next letter — that stale `showResult`/`score` is exactly
  // what kept the "Keep practicing" modal on screen after "Next letter". The
  // route re-keys this element (App.tsx → KeyedWritingLesson) so a new letter
  // remounts cleanly; this reset is kept belt-and-suspenders and additionally
  // re-arms a same-letter re-entry.
  useEffect(() => {
    canvasRef.current?.clear();
    canvasRef.current?.clearFeedback();
    setStage('learn');
    setActiveStroke(0);
    setTraceFeedback(null);
    setScore(null);
    setEarnedXp(0);
    setShowResult(false);
    setFinalScoreSent(false);
    xpAwardedRef.current = false;
    // Keyed solely by the letter identity: runs exactly once per letter.
  }, [letter.id, glyph]);

  // ── Unified back policy (L1 /writing → L2 letter 'learn' → L3 practice) ──
  // The router only sees the route; the watch/trace/write stages and the
  // result overlay are component state. These refs mirror that state so the
  // registry interceptor and the window-level listener always read the
  // CURRENT values without re-subscribing on every stage change.
  const stageRef = useRef<Stage>('learn');
  const showResultRef = useRef(false);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    showResultRef.current = showResult;
  }, [showResult]);

  // Header arrow / Android hardware back: MainLayout asks the registry FIRST
  // (runBackInterceptors). One press climbs exactly one level of the lesson:
  //   - the result overlay is open → close it (stage untouched);
  //   - watch/trace/write          → back to THIS letter's 'learn' view with
  //                                  the attempt/canvas state reset;
  //   - already at 'learn'         → NOT consumed, so the press falls through
  //                                  and exits to /writing.
  useEffect(() => {
    return registerBackInterceptor(() => {
      if (showResultRef.current) {
        setShowResult(false);
        return true;
      }
      if (stageRef.current !== 'learn') {
        resetAttempt();
        setStage('learn');
        return true;
      }
      return false;
    });
  }, [resetAttempt]);

  // Deep-link guard: when the lesson is the session's FIRST entry (idx 0 — an
  // installed-app shortcut straight to /writing/lesson/:id) there is no in-app
  // entry below it, so a browser back from a practice stage would leave the
  // app before popstate could collapse the stage. Leaving 'learn' therefore
  // pushes ONE lightweight same-URL marker entry for that press to pop. It can
  // never stack: the marker flag is checked first, and every router-driven
  // push writes a fresh (unmarked) entry.
  const pushLessonBackMarkerIfDeepLink = useCallback(() => {
    const w = globalThis.window;
    if (!w) return;
    // `history.state` is the DOM lib's `any` payload; the declared shape
    // mirrors what react-router writes (`idx`, `key`) plus this page's marker
    // flag — and the spread below preserves any other field verbatim.
    const state: LessonHistoryState | null = w.history.state ?? null;
    const idx = Number.isInteger(state?.idx) ? (state?.idx ?? 0) : 0;
    if (idx !== 0) return; // an in-app entry exists below: back already works
    if (state?.kqLessonBackMarker) return; // marker already pushed
    try {
      w.history.pushState(
        { ...state, key: Math.random().toString(36).substring(2, 10), idx: idx + 1, kqLessonBackMarker: true },
        '',
        w.location.href,
      );
    } catch {
      // Best-effort: a blocked pushState only means the back press falls back
      // to the browser's default history behaviour.
    }
  }, []);

  useEffect(() => {
    if (stage === 'learn') return;
    pushLessonBackMarkerIfDeepLink();
  }, [stage, pushLessonBackMarkerIfDeepLink]);

  // Browser/PWA back: popstate is the only signal react-router cannot deliver
  // to this page (MainLayout's smart-back covers the header arrow and the
  // Android hardware button only). A pop that lands while a practice stage is
  // active means "go up one level", not "leave the lesson": collapse to the
  // letter's 'learn' view and push the SAME URL back so the URL and the entry
  // depth are restored — the next press then exits to /writing normally. At
  // 'learn' this handler does nothing and the router's own pop routing wins.
  useEffect(() => {
    const w = globalThis.window;
    if (!w) return;
    const onPopState = () => {
      if (stageRef.current === 'learn') return;
      resetAttempt();
      setStage('learn');
      navigate(`/writing/lesson/${letterId}`);
    };
    w.addEventListener('popstate', onPopState);
    return () => w.removeEventListener('popstate', onPopState);
  }, [navigate, letterId, resetAttempt]);

  // TRACE MODE: one committed stroke at a time, evaluated against its authored
  // target. Small deviations are tolerated; off-path gives gentle feedback and
  // a soft vibrate — never an immediate hard failure.
  const handleTraceStroke = useCallback(
    (ink: TracePoint[], authored: TracePoint[]) => {
      if (authored.length === 0) return;
      const ev = evaluateLessonStroke(authored, ink);
      if (ev.completed) {
        setTraceFeedback(null);
        canvasRef.current?.clearFeedback();
        if (activeStroke + 1 >= totalStrokes) {
          // Every stroke traced correctly → free-writing stage. Reset the
          // canvas so the learner writes the whole letter from scratch.
          canvasRef.current?.clear();
          setActiveStroke(0);
          setStage('write');
        } else {
          setActiveStroke((i) => i + 1);
        }
      } else {
        // Gentle off-path feedback; pop the failed stroke so the learner
        // retries just this stroke.
        canvasRef.current?.undo();
        canvasRef.current?.showDeviation([ink]);
        setTraceFeedback(
          ev.startedOnDot
            ? (isKu
                ? 'Hinekî ji rê derket. Dîsa biceribîne.'
                : isAr
                  ? 'انحرفت قليلاً عن المسار. حاول مجدداً.'
                  : 'A little off the path. Try this stroke again.')
            : (isKu
                ? 'Ji cihê kesk dest pê bike.'
                : isAr
                  ? 'ابدأ من النقطة الخضراء.'
                  : 'Start from the green start dot.'),
        );
        // Optional light haptic on a miss (best-effort, never blocking).
        try {
          navigator.vibrate?.(30);
        } catch {
          /* no-op */
        }
      }
    },
    [activeStroke, totalStrokes, isKu, isAr],
  );

  // FREE MODE: check → deterministic 0..100 via the pixel engine.
  const handleFreeCheck = useCallback(() => {
    const strokes = canvasRef.current?.canvas() ?? null;
    const mask = buildLetterMask(glyph);
    const strokesMask = buildStrokesMask(strokes);
    const traced = evaluateTrace(mask, strokesMask, undefined, glyph);
    const zonePassRate = traced.zones.length
      ? traced.zones.filter((z) => z.passed).length / traced.zones.length
      : 0;
    const s = freeWriteScore(traced.coverage, traced.outOfBounds, zonePassRate);
    setScore(s);
    setShowResult(true);
  }, [glyph]);

  // Persist exactly once per scored attempt: XP (band-gated, once), best
  // score/attempts/completed aggregates, and the SM-2 deck entry that flips
  // the /writing grid tile learned (identical to the existing trace page).
  const completeAttempt = useCallback(
    (finalScore: number) => {
      if (xpAwardedRef.current) return;
      xpAwardedRef.current = true;

      const band = scoreBand(finalScore);
      const xp = XP_BY_BAND[band];

      const prev: WritingLetterProgress = userData?.writingProgress?.[glyph] ?? {
        bestScore: 0,
        attempts: 0,
        completed: false,
      };
      const next: WritingLetterProgress = {
        bestScore: Math.max(prev.bestScore, finalScore),
        attempts: prev.attempts + 1,
        completed: prev.completed || finalScore >= 60,
      };
      const mergedProgress = {
        ...(userData?.writingProgress ?? {}),
        [glyph]: next,
      } satisfies Record<string, WritingLetterProgress>;

      const deck: ReviewDeck = userData?.reviewDeck ?? {};
      const updatedDeck = finalScore >= 60 ? recordReview(deck, letter.id, 'good') : deck;

      // One combined updateUserData write for the aggregates + deck (the store's
      // ref-based composer makes sequential writes safe, but a single write is
      // simpler and avoids the second-write-spread concern entirely).
      void updateUserData({ writingProgress: mergedProgress, reviewDeck: updatedDeck });

      // XP exactly once per completed attempt; the retry band earns 0.
      if (xp > 0) {
        void updateUserProgress(xp, 0, false, 0);
        setEarnedXp(xp);
      } else {
        setEarnedXp(0);
      }
    },
    [glyph, letter.id, userData, updateUserData, updateUserProgress],
  );

  // A scored write attempt finalises once — when the result overlay opens.
  useEffect(() => {
    if (score !== null && showResult && !finalScoreSent) {
      setFinalScoreSent(true);
      completeAttempt(score);
    }
  }, [score, showResult, finalScoreSent, completeAttempt]);

  const nextLetter = useCallback(() => {
    const idx = alphabet.findIndex((l) => l.id === letter.id);
    const next = alphabet[(idx + 1) % alphabet.length];
    // Replace, never push: switching letters must not leave a trail of
    // previously viewed letters for the back press to walk through.
    navigate(`/writing/lesson/${next.id}`, { replace: true });
  }, [navigate, letter.id]);

  const prevLetter = useCallback(() => {
    const idx = alphabet.findIndex((l) => l.id === letter.id);
    const prev = alphabet[(idx - 1 + alphabet.length) % alphabet.length];
    // Same rule as nextLetter (prevLetter has no UI trigger yet).
    navigate(`/writing/lesson/${prev.id}`, { replace: true });
  }, [navigate, letter.id]);

  const bestScore = userData?.writingProgress?.[glyph]?.bestScore ?? null;
  const band = score !== null ? scoreBand(score) : 'retry';

  // ---- localised strings ---------------------------------------------------
  const t = {
    stageLearn: isKu ? 'Fêr bibe' : isAr ? 'تعلّم' : 'Learn',
    stageWatch: isKu ? 'Temaşe bike' : isAr ? 'شاهد' : 'Watch',
    stageTrace: isKu ? 'Bişopîne' : isAr ? 'تتبّع' : 'Trace',
    stageWrite: isKu ? 'Binivîse' : isAr ? 'اكتب' : 'Write',
    back: isKu ? 'Vegere tîpan' : isAr ? 'إلى الحروف' : 'All letters',
    speak: isKu ? 'Bibihîze' : isAr ? 'استمع' : 'Listen',
    watchNext: isKu ? 'Niha binivîse' : isAr ? 'ابدأ التتبع الآن' : 'Now trace it',
    replay: isKu ? 'Dîsa lê binêre' : isAr ? 'إعادة المشاهدة' : 'Replay',
    continue: isKu ? 'Bidomîne' : isAr ? 'متابعة' : 'Continue',
    clear: isKu ? 'Paqij bike' : isAr ? 'مسح' : 'Clear',
    undo: isKu ? 'Vegere' : isAr ? 'تراجع' : 'Undo',
    check: isKu ? 'Kontrol' : isAr ? 'تحقق' : 'Check',
    skipWrite: isKu ? 'Ji bo nivîsînê amade ye' : isAr ? 'انتقل للكتابة' : 'Go write',
    next: isKu ? 'Tîpa din' : isAr ? 'الحرف التالي' : 'Next letter',
    traceTitle: isKu ? 'Bişopîne — xet dixet' : isAr ? 'تتبّع — حركة بحركة' : 'Trace stroke by stroke',
    traceHint: isKu
      ? 'Ji xala kesk dest pê bike û bigihîne xala zêrîn.'
      : isAr
        ? 'ابدأ من النقطة الخضراء وتوقف عند النقطة الذهبية.'
        : 'Start at the green dot and stop at the gold dot.',
    writeTitle: isKu ? 'Bê rêber binivîse' : isAr ? 'اكتب بدون توجيه' : 'Write it freely',
    writeHint: isKu
      ? 'Niha bê xêzên arîkar binivîse.'
      : isAr
        ? 'اكتب الآن بدون الخطوط الإرشادية.'
        : 'Now write it without the guide lines.',
    noGuideNotice: isKu
      ? 'Daneyên vê tîpê hê ne amade ne — em li ser dixebitin.'
      : isAr
        ? 'بيانات هذا الحرف غير جاهزة بعد — نعمل عليها.'
        : 'Stroke data for this letter is still being verified — coming soon.',
    tryAgain: isKu ? 'Dîsa biceribîne' : isAr ? 'حاول مجدداً' : 'Try again',
  };

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={() => navigate('/writing', { replace: true })}
          className="flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider min-h-[44px] px-1 cursor-pointer bg-transparent border-none"
        >
          <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
          {t.back}
        </button>
        <div className="flex items-center gap-2">
          {bestScore !== null && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {isKu ? 'Baştirîn: ' : isAr ? 'الأفضل: ' : 'Best: '}
              <span className="tabular-nums text-ink">{bestScore}</span>
            </span>
          )}
          <span dir="ltr" className="font-mono text-xl font-black text-ink">{glyph}</span>
        </div>
      </div>

      {/* Stage stepper */}
      <ol className="flex items-center justify-center gap-2 mb-4" aria-label="Lesson steps">
        {(
          [
            ['learn', Volume2],
            ['watch', Eye],
            ['trace', Pencil],
            ['write', Feather],
          ] as const
        ).map(([s, Icon], i) => {
          const order: readonly Stage[] = ['learn', 'watch', 'trace', 'write'];
          const idx = order.indexOf(stage);
          const isDone = order.indexOf(s) < idx;
          const isActive = s === stage;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={[
                  'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                  isActive
                    ? 'bg-[#FFB300] text-[#432C00]'
                    : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
              </span>
              {i < 3 && <span className="w-4 h-px bg-slate-200 dark:bg-slate-700" />}
            </li>
          );
        })}
      </ol>

      {/* LEARN */}
      {stage === 'learn' && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center w-full max-w-md shadow-flat border border-line-soft relative overflow-hidden">
            <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.10] pointer-events-none" />
            <div className="absolute top-4 end-4 z-10">
              <AudioButton
                audioUrl={letter.charAudio}
                textToSpeak={glyph}
                label={t.speak}
                className="bg-[#FFF3D6] dark:bg-[#3A2F14] hover:bg-[#FFE7B3] active:scale-90 text-[#B8860B] dark:text-[#FFCE6B] border border-[#FFB300]/30 cursor-pointer shadow-sm"
              />
            </div>
            <h2 className="text-8xl font-black mb-4 mt-2 tracking-tight font-display select-none text-ink" dir="ltr">
              {glyph}
            </h2>
            <div className="bg-[#FFF6E0] dark:bg-[#3A2F14] border border-[#FFB300]/30 p-4 rounded-2xl w-full max-w-xs">
              <p className="text-sm font-black text-ink" dir="ltr">{letter.exampleWord}</p>
              <p className="text-[11px] font-semibold text-muted mt-1">
                {isKu ? 'Mînak:' : isAr ? 'مثال:' : 'Example:'}{' '}
                {isKu ? letter.exampleWord : isAr ? letter.meaningAr : letter.meaningEn}
              </p>
            </div>
            <div className="mt-4 w-full max-w-xs mx-auto">
              <AudioButton
                audioUrl={letter.audio}
                textToSpeak={letter.exampleWord}
                label={t.speak}
              />
            </div>
          </div>

          <div className="w-full max-w-md flex flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={() => setStage('watch')} leadingIcon={<Eye className="w-5 h-5" />}>
              {t.stageWatch}
            </Button>
            <Button variant="outline" size="md" fullWidth onClick={startTrace} leadingIcon={<Pencil className="w-4 h-4" />}>
              {isKu ? 'Yekser bişopîne' : isAr ? 'ابدأ التتبع مباشرة' : 'Skip to tracing'}
            </Button>
          </div>
        </div>
      )}

      {/* WATCH */}
      {stage === 'watch' && (
        <LetterDemo
          glyph={glyph}
          labels={{ watch: t.stageWatch, replay: t.replay, continue: t.watchNext, notice: t.noGuideNotice }}
          onContinue={startTrace}
        />
      )}

      {/* TRACE */}
      {stage === 'trace' && (
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
          <div className="text-center">
            <h3 className="text-sm font-black text-ink">{t.traceTitle}</h3>
            <p className="text-[11px] font-semibold text-muted mt-0.5">{t.traceHint}</p>
            {traceable && (
              <div className="mt-2 max-w-[180px] mx-auto">
                <Progress value={activeStroke} max={totalStrokes} size="sm" />
              </div>
            )}
          </div>

          {/* Graceful fallback: absent/never-verified stroke data. */}
          {!traceable ? (
            <div className="text-center text-sm font-semibold text-muted p-6">
              {t.noGuideNotice}
              <div className="mt-4"><Button variant="primary" size="md" onClick={startWrite}>{t.skipWrite}</Button></div>
            </div>
          ) : (
            <>
              <WritingLessonCanvas
                ref={canvasRef}
                key={`trace-${glyph}`}
                char={glyph}
                mode="trace"
                activeStrokeIndex={activeStroke}
                onStrokeComplete={handleTraceStroke}
              />
              {traceFeedback && (
                <p className="text-[11px] font-bold text-[#EF4444] text-center" role="status" aria-live="polite">
                  {traceFeedback}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="md" onClick={() => canvasRef.current?.clear()} leadingIcon={<Eraser className="w-4 h-4" />} className="text-xs h-12">
                  {t.clear}
                </Button>
                <Button variant="secondary" size="md" onClick={() => canvasRef.current?.undo()} leadingIcon={<RotateCcw className="w-4 h-4" />} className="text-xs h-12">
                  {t.undo}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* WRITE */}
      {stage === 'write' && (
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
          <div className="text-center">
            <h3 className="text-sm font-black text-ink">{t.writeTitle}</h3>
            <p className="text-[11px] font-semibold text-muted mt-0.5">{t.writeHint}</p>
          </div>
          <WritingLessonCanvas
            ref={canvasRef}
            key={`write-${glyph}`}
            char={glyph}
            mode="free"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" onClick={() => canvasRef.current?.clear()} leadingIcon={<Eraser className="w-4 h-4" />} className="text-xs h-12">
              {t.clear}
            </Button>
            <Button variant="secondary" size="md" onClick={() => canvasRef.current?.undo()} leadingIcon={<RotateCcw className="w-4 h-4" />} className="text-xs h-12">
              {t.undo}
            </Button>
            <Button variant="primary" size="md" onClick={handleFreeCheck} leadingIcon={<CheckCircle2 className="w-4 h-4" />} className="text-xs h-12 col-span-2">
              {t.check}
            </Button>
          </div>
        </div>
      )}

      {/* RESULT (modal) */}
      <Modal
        open={showResult && score !== null}
        onClose={() => setShowResult(false)}
        title={bandLabels(isKu, isAr)[band]}
        variant="center"
        hideCloseButton
      >
        {score !== null && (
          <div className="flex flex-col items-center gap-4">
            <ScoreRing score={score} label={isKu ? 'Xal' : isAr ? 'النقاط' : 'Score'} />
            {earnedXp > 0 && (
              <p className="flex items-center gap-1.5 text-sm font-black text-[#D97706] dark:text-[#FFCE6B]">
                <Trophy className="w-4 h-4" />
                +{earnedXp} XP
              </p>
            )}
            <p className="text-[11px] font-semibold text-muted text-center leading-relaxed">
              {band === 'excellent'
                ? (isKu ? 'Karekî hêja! Tu amade yî bo tîpa din.' : isAr ? 'عمل رائع! أنت جاهز للحرف التالي.' : 'Wonderful work! You are ready for the next letter.')
                : band === 'good'
                  ? (isKu ? 'Baş e! Hinekî pratîk û tu dibî hoste.' : isAr ? 'جيد! القليل من التدريب وستتقنه.' : 'Good! A little more practice and you will master it.')
                  : band === 'practice'
                    ? (isKu ? 'Forma baş. Dîsa biceribîne da çêtir bibî.' : isAr ? 'شكل جيد. أعد المحاولة لتتحسن.' : 'Good form. Try again to improve.')
                    : (isKu ? 'Hê zûtir tê. Dîsa biceribîne!' : isAr ? 'ستتقنه قريباً. حاول مجدداً!' : 'You are getting there. Give it another try!')}
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button variant="secondary" size="md" onClick={resetAttempt} leadingIcon={<RotateCcw className="w-4 h-4" />} className="text-xs h-12">
                {t.tryAgain}
              </Button>
              <Button variant="success" size="md" onClick={nextLetter} trailingIcon={<ChevronRight className="w-4 h-4 rtl:-scale-x-100" />} className="text-xs h-12">
                {t.next}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default WritingLessonPage;

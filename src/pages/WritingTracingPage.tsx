import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { alphabet } from '../data/kurmanji';
import { Modal, Button } from '../components/ui';
import TracingCanvas, { type TracingCanvasHandle } from '../components/TracingCanvas';
import {
  buildLetterMask,
  buildStrokesMask,
  evaluateTrace,
  emptyTraceResult,
  runTraceSelfTest,
  OVERALL_COVERAGE_MIN,
  OUT_OF_BOUNDS_MAX,
  ZONE_COVERAGE_MIN,
  COVERAGE_TOLERANCE_PX,
  type TraceResult,
} from '../lib/traceLetters';
import { recordReview, type ReviewDeck } from '../services/SpacedRepetitionService';
import { Eraser, RotateCcw, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

/** Single-glyph tracing target burned into the offscreen mask. */
const TOP_LETTER = (letterApi: { id: string; char: string }) =>
  letterApi.char.split(' ')[0];

/**
 * WritingTracingPage — the tracing surface for one letter plus the checker
 * (overall coverage + out-of-bounds + per-zone coverage). A pass records a
 * `good` review into the shared SM-2 deck, which is what flips the grid tile
 * green back on /writing. On a fail, the still-missing glyph pixels inside the
 * failed zones are painted red so the learner knows exactly what to finish.
 */
export function WritingTracingPage() {
  const navigate = useNavigate();
  const { letterId } = useParams();
  const { language, userData, updateUserData } = useAuth();
  const deck: ReviewDeck = userData?.reviewDeck ?? {};

  const letter = alphabet.find(l => l.id === letterId) || alphabet[0];
  const glyph = useMemo(() => TOP_LETTER(letter), [letter]);

  const maskCacheRef = useRef<{ glyph: string; mask: Uint8ClampedArray } | null>(null);
  const traceRef = useRef<TracingCanvasHandle>(null);
  const [result, setResult] = useState<TraceResult>(emptyTraceResult);
  const [open, setOpen] = useState(false);

  // DEV-ONLY regression canary: after the guide has rendered, validate the
  // tolerance pipeline with a programmatic perfect trace. If correctness ever
  // regresses (thick-guide / thin-stroke mismatch), the console details the
  // coverage, per-zone coverage and miss-mask pixel count for each letter.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const rows = runTraceSelfTest(['I', 'E', 'O', 'M', 'W']);
    const anyFail = rows.some(r => !r.passed);
    if (anyFail) {
      const detail = rows
        .map(
          r =>
            `${r.char} → passed=${r.passed} coverage=${(r.coverage * 100).toFixed(1)}% ` +
            `missPixels=${r.missPixels} zones=[${r.zoneCoverage
              .map(z => `${(z * 100).toFixed(1)}%`)
              .join(', ')}]`,
        )
        .join('\n  ');
      console.error(
        `[writing] tracing self-test FAILED — a perfect trace must pass:\n  ${detail}`,
      );
    }
  }, []);

  // The target-letter pixel mask is built lazily on first Check (canvas APIs
  // exist in this browser-only page) and cached per glyph so repeated checks
  // never re-render the letter and navigating never serves a stale mask.
  const maskFor = useCallback((): Uint8ClampedArray => {
    const cached = maskCacheRef.current;
    if (cached && cached.glyph === glyph) return cached.mask;
    const mask = buildLetterMask(glyph);
    maskCacheRef.current = { glyph, mask };
    return mask;
  }, [glyph]);

  const handleCheck = useCallback(() => {
    const strokes = traceRef.current?.canvas() ?? null;
    const mask = maskFor();
    const strokesMask = buildStrokesMask(strokes);
    const traced = evaluateTrace(mask, strokesMask, undefined, glyph);
    setResult(traced);
    setOpen(true);
    // `traced.miss` is all-zero on a pass and marks the missed glyph pixels of
    // failed zones on a fail, so painting it unconditionally is always right.
    traceRef.current?.showMissHighlight(traced.miss);
  }, [maskFor, glyph]);

  const goToLetter = useCallback(
    (id: string) => {
      setOpen(false);
      // The canvas remounts on every letterId change (see key below), which
      // blanks the surface and the miss highlight together.
      navigate(`/writing/${id}`, { replace: true });
    },
    [navigate],
  );

  // Records the pass into the shared SM-2 review deck (the same deck
  // RecallButton and the quiz engine write to), so the grid tile turns green.
  const handlePassNext = useCallback(() => {
    const updatedDeck = recordReview(deck, letter.id, 'good');
    // FIRE-AND-FORGET: mutate the profile asynchronously via the app's normal
    // persistence pipeline without ever blocking the drawing surface.
    void updateUserData({ reviewDeck: updatedDeck });
    const next = alphabet[(alphabet.findIndex(l => l.id === letter.id) + 1) % alphabet.length];
    goToLetter(next.id);
  }, [deck, updateUserData, goToLetter, letter.id]);

  const handleRetry = useCallback(() => {
    traceRef.current?.clear();
    setOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    const next = alphabet[(alphabet.findIndex(l => l.id === letter.id) + 1) % alphabet.length];
    goToLetter(next.id);
  }, [goToLetter, letter.id]);

  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const clearLabel = isKu ? 'Paqij bike' : isAr ? 'مسح الكل' : 'Clear';
  const undoLabel = isKu ? 'Vegere' : isAr ? 'تراجع' : 'Undo';
  const checkLabel = isKu ? 'Kontrol' : isAr ? 'تحقق' : 'Check';
  const nextLabel = isKu ? 'Ya din' : isAr ? 'التالي' : 'Next';

  const failTitle = isKu ? 'Dîsa biceribîne ❌' : isAr ? 'حاول مرة أخرى ❌' : 'Try again ❌';
  const passTitle = isKu ? 'Baş e! ✅' : isAr ? 'أحسنت! ✅' : 'Well done! ✅';

  const percentText = (fraction: number) => `${Math.round(fraction * 100)}%`;

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24">
      {/* Letter header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-black text-ink leading-none">
            <span dir="ltr" className="font-mono">{glyph}</span>
            <span className="text-sm font-black text-muted ms-2">
              {isKu ? 'Binivîse' : isAr ? 'اكتب الحرف' : 'Write the letter'}
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">
            {isKu ? 'Bi tiliya xwe bikşîne' : isAr ? 'تتبّع بإصبعك' : 'Trace with your finger'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/writing')}
          className="text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 uppercase tracking-wider cursor-pointer bg-transparent border-none min-h-[44px] px-2"
        >
          {isKu ? 'Vegere tomaran' : isAr ? 'إلى الحروف' : 'All letters'}
        </button>
      </div>

      {/* Canvas */}
      <div className="mb-4">
        <TracingCanvas key={letter.id} ref={traceRef} char={glyph} />
      </div>

      {/* Toolbar — 2×2 grid on every screen size (narrow-phone safe) */}
      <div className="grid grid-cols-2 gap-3 max-w-md w-full mx-auto">
        <Button
          variant="secondary"
          size="md"
          onClick={() => traceRef.current?.clear()}
          leadingIcon={<Eraser className="w-4 h-4" />}
          className="text-xs h-12"
        >
          {clearLabel}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => traceRef.current?.undo()}
          leadingIcon={<RotateCcw className="w-4 h-4" />}
          className="text-xs h-12"
        >
          {undoLabel}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleCheck}
          leadingIcon={<CheckCircle2 className="w-4 h-4" />}
          className="text-xs h-12"
        >
          {checkLabel}
        </Button>
        <Button
          variant="success"
          size="md"
          onClick={handleNext}
          leadingIcon={<ChevronRight className="w-4 h-4 rtl:-scale-x-100" />}
          className="text-xs h-12"
        >
          {nextLabel}
        </Button>
      </div>

      {/* Result overlay */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={result.passed ? passTitle : failTitle}
        variant="center"
        hideCloseButton
      >
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-muted space-y-1">
            <div className="flex justify-between">
              <span>{isKu ? 'Dagirtin' : isAr ? 'التغطية' : 'Coverage'}</span>
              <span className="tabular-nums" dir="ltr">{percentText(result.coverage)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isKu ? 'Derveyî rê' : isAr ? 'خارج المسار' : 'Outside'}</span>
              <span className="tabular-nums" dir="ltr">{percentText(result.outOfBounds)}</span>
            </div>
          </div>

          {!result.passed && (
            <p className="text-[11px] font-semibold text-muted leading-relaxed">
              {isKu
                ? `Rêjeya te %${Math.round(result.coverage * 100)} e. Ji kerema xwe temam bike.`
                : isAr
                  ? `نسبتك ${Math.round(result.coverage * 100)}٪. يرجى إكمالها.`
                  : `Your coverage is ${Math.round(result.coverage * 100)}%. Please complete it.`}
            </p>
          )}

          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
            {isKu
              ? `divê dagirtin ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}%, her herêm ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}%, derveyî ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}%`
              : isAr
                ? `التغطية ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}٪، كل منطقة ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}٪، خارج المسار ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}٪ (±${COVERAGE_TOLERANCE_PX} بكسل)`
                : `coverage ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}%, each zone ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}%, outside ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}% (±${COVERAGE_TOLERANCE_PX}px tolerance)`}
          </p>

          {result.passed ? (
            <Button variant="success" fullWidth onClick={handlePassNext} leadingIcon={<CheckCircle2 className="w-4 h-4" />}>
              {nextLabel}
            </Button>
          ) : (
            <Button variant="danger" fullWidth onClick={handleRetry} leadingIcon={<XCircle className="w-4 h-4" />}>
              {isKu ? 'Dîsa biceribîne' : isAr ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}

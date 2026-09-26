import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { WRITING_WORDS } from '../data/writingWords';
import { Modal, Button } from '../components/ui';
import TracingCanvas, { type TracingCanvasHandle } from '../components/TracingCanvas';
import {
  buildGlyphMask,
  buildStrokesMask,
  evaluateTrace,
  drawGlyphInBox,
  MISS_TARGET,
  TRACE_CANVAS,
  OVERALL_COVERAGE_MIN,
  OUT_OF_BOUNDS_MAX,
  ZONE_COVERAGE_MIN,
  type TraceBox,
} from '../lib/traceLetters';
import { recordReview, type ReviewDeck } from '../services/SpacedRepetitionService';
import { Eraser, RotateCcw, CheckCircle2, XCircle, ChevronRight, Check } from 'lucide-react';

/**
 * Word-tracing (whole-word) layout: the full word is shown faintly in the
 * background with a dashed lane around each letter. The learner draws the WHOLE
 * word freely, then a single Check validates every letter at once using the
 * zone-based engine. Failed letters are highlighted in red (only the missing
 * glyph pixels), so the learner keeps drawing and re-Checks. Only when every
 * letter passes is the word recorded as learned in the shared SM-2 deck.
 */
const MARGIN = 0.09; // normalized (0..1) gutter from the canvas edge
const CELL_TOP = 0.2; // normalized top of every letter cell
const CELL_BOTTOM = 0.8; // normalized bottom of every letter cell

function boxForCell(index: number, count: number): TraceBox {
  if (count <= 0) return { left: 0, top: 0, right: 1, bottom: 1 };
  const cellWidth = (1 - 2 * MARGIN) / count;
  const left = MARGIN + index * cellWidth;
  const right = index === count - 1 ? 1 - MARGIN : left + cellWidth;
  return { left, top: CELL_TOP, right, bottom: CELL_BOTTOM };
}

/**
 * Dash the vertical cell boundaries on the guide layer so each letter has a
 * visible "lane". Left edges for every cell, right edge for the last one
 * (interior edges are shared between neighbours).
 */
function drawCellBorders(ctx: CanvasRenderingContext2D, count: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  const top = CELL_TOP * TRACE_CANVAS;
  const bottom = CELL_BOTTOM * TRACE_CANVAS;
  for (let i = 0; i < count; i += 1) {
    const box = boxForCell(i, count);
    ctx.beginPath();
    ctx.moveTo(box.left * TRACE_CANVAS, top);
    ctx.lineTo(box.left * TRACE_CANVAS, bottom);
    ctx.stroke();
    if (i === count - 1) {
      ctx.beginPath();
      ctx.moveTo(box.right * TRACE_CANVAS, top);
      ctx.lineTo(box.right * TRACE_CANVAS, bottom);
      ctx.stroke();
    }
  }
  ctx.restore();
}

const FADED_GUIDE = 'rgba(100, 116, 139, 0.30)';

/**
 * The guide renderer: every letter of the whole word faintly, each inside its
 * own dashed lane (a visual guide, not a checkpoint — drawing is free-order).
 */
function renderWordGuide(ctx: CanvasRenderingContext2D, glyphs: string[]): void {
  const count = glyphs.length;
  for (let i = 0; i < count; i += 1) {
    drawGlyphInBox(ctx, glyphs[i], boxForCell(i, count), FADED_GUIDE);
  }
  drawCellBorders(ctx, count);
}

/** Per-letter outcome of the most recent full-word check. */
interface LetterStatus {
  state: 'pending' | 'pass' | 'fail';
  coverage: number;
}

const PENDING_STATUS = (): LetterStatus => ({ state: 'pending', coverage: 0 });

export function WritingWordTracingPage() {
  const navigate = useNavigate();
  const { wordId } = useParams();
  const { language, userData, updateUserData } = useAuth();
  const deck: ReviewDeck = userData?.reviewDeck ?? {};

  const word = WRITING_WORDS.find(w => w.id === wordId) || WRITING_WORDS[0];
  const glyphs = useMemo(() => word.ku.toUpperCase().split(''), [word.ku]);
  const count = glyphs.length;

  const boxes = useMemo(() => glyphs.map((_, i) => boxForCell(i, count)), [glyphs, count]);

  const traceRef = useRef<TracingCanvasHandle>(null);
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<LetterStatus[]>(() => glyphs.map(PENDING_STATUS));

  // State ownership: when only :wordId changes, React Router keeps this
  // component mounted and would otherwise carry the per-letter statuses, the
  // overlay and the canvas strokes into the next word. Re-keying the router's
  // element remounts for a new word — but this reset is kept too
  // (belt-and-suspenders) and also re-arms a same-word re-entry.
  useEffect(() => {
    setOpen(false);
    setStatuses(glyphs.map(PENDING_STATUS));
    traceRef.current?.clear();
    traceRef.current?.clearMissHighlight();
    // DEV sanity: a fresh word mount must never include a completed letter.
    if (import.meta.env.DEV) {
      if (statuses.some(s => s.state !== 'pending')) {
        console.warn('[writing-words] carried-over letter progress on word mount was reset');
      }
    }
    // NOTE: `statuses` is read only for the dev guard; the effect is keyed
    // solely by the word identity so it runs exactly once per word.
  }, [word.id, glyphs]);

  const allPassed = statuses.every(s => s.state === 'pass');
  const passedCount = statuses.filter(s => s.state === 'pass').length;

  const clearAll = useCallback(() => {
    traceRef.current?.clear();
    traceRef.current?.clearMissHighlight();
    setStatuses(glyphs.map(PENDING_STATUS));
  }, [glyphs]);

  const handleCheck = useCallback(() => {
    const strokes = traceRef.current?.canvas() ?? null;
    const strokesMask = buildStrokesMask(strokes);

    const results = glyphs.map((glyph, i) =>
      evaluateTrace(buildGlyphMask(glyph, boxes[i]), strokesMask, boxes[i], glyph),
    );

    // Combine each letter's failed-zone miss into one highlight layer.
    const combinedMiss = new Uint8ClampedArray(TRACE_CANVAS * TRACE_CANVAS);
    for (const res of results) {
      if (res.passed) continue;
      for (let k = 0; k < res.miss.length; k += 1) {
        if (res.miss[k] === MISS_TARGET) combinedMiss[k] = MISS_TARGET;
      }
    }
    traceRef.current?.showMissHighlight(combinedMiss);

    const nextStatuses: LetterStatus[] = results.map(res => ({
      state: res.passed ? 'pass' : 'fail',
      coverage: res.coverage,
    }));
    setStatuses(nextStatuses);

    // The word counts as learned the moment EVERY letter passes this check —
    // mark it in the shared deck immediately (still only after a real check).
    const everyLetterPassed = results.every(res => res.passed);
    if (everyLetterPassed) {
      const updatedDeck = recordReview(deck, word.id, 'good');
      // FIRE-AND-FORGET: persist through the app's normal profile pipeline.
      void updateUserData({ reviewDeck: updatedDeck });
    }

    setOpen(true);
  }, [glyphs, boxes, deck, updateUserData, word.id]);

  const handleNextWord = useCallback(() => {
    setOpen(false);
    const next = WRITING_WORDS[(WRITING_WORDS.findIndex(w => w.id === word.id) + 1) % WRITING_WORDS.length];
    navigate(`/writing/words/${next.id}`, { replace: true });
  }, [navigate, word.id]);

  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const clearLabel = isKu ? 'Paqij bike' : isAr ? 'مسح الكل' : 'Clear';
  const undoLabel = isKu ? 'Vegere' : isAr ? 'تراجع' : 'Undo';
  const checkLabel = isKu ? 'Kontrol' : isAr ? 'تحقق' : 'Check';
  const nextWordLabel = isKu ? 'Peyva din' : isAr ? 'كلمة تالية' : 'Next word';
  const keepDrawingLabel = isKu ? 'Temam bike' : isAr ? 'أكمل' : 'Keep drawing';

  const failTitle = isKu ? 'Dîsa biceribîne ❌' : isAr ? 'حاول مرة أخرى ❌' : 'Try again ❌';
  const wordPassTitle = isKu ? 'Baş e! Peyv temam ✅' : isAr ? 'أحسنت! اكتملت الكلمة ✅' : 'Well done! Word complete ✅';

  const percentText = (fraction: number) => `${Math.round(fraction * 100)}%`;
  const thresholdText = isKu
    ? `divê dagirtin ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}%, her herêm ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}%, derveyî ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}%`
    : isAr
      ? `التغطية ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}٪، كل منطقة ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}٪، خارج المسار ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}٪`
      : `coverage ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}%, each zone ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}%, outside ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}%`;

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24">
      {/* Word header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h2 className="text-xl font-black text-ink leading-none">
            <span dir="ltr" className="font-mono">{word.ku}</span>
            <span className="text-sm font-black text-muted ms-2">
              {isAr ? word.ar : word.en}
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">
            {isKu
              ? 'Hemû tîpan bikşîne, paşê Kontrol bike'
              : isAr
                ? 'ارسم كل الحروف ثم اضغط تحقق'
                : 'Draw the whole word, then tap Check'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/writing/words')}
          className="text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 uppercase tracking-wider cursor-pointer bg-transparent border-none min-h-[44px] px-2"
        >
          {isKu ? 'Hemû peyv' : isAr ? 'كل الكلمات' : 'All words'}
        </button>
      </div>

      {/* Per-letter status chips — show post-check state (✅ / ❌ / ⏳) */}
      <div className="flex items-center justify-center gap-1.5 mb-3" aria-label={isAr ? 'حالة الحروف' : 'Letter status'}>
        {glyphs.map((g, i) => (
          <span
            key={`${word.id}-${i}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center gap-0.5 text-[12px] font-black border transition-colors
              ${statuses[i].state === 'pass'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : statuses[i].state === 'fail'
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}
          >
            <span dir="ltr">{g}</span>
            {statuses[i].state === 'pass' && <Check className="w-3 h-3" aria-hidden="true" />}
            {statuses[i].state === 'fail' && <XCircle className="w-3 h-3" aria-hidden="true" />}
          </span>
        ))}
      </div>

      {/* Canvas */}
      <div className="mb-4">
        <TracingCanvas
          key={word.id}
          ref={traceRef}
          char={glyphs[0] ?? ' '}
          guideBox={boxes[0] ?? boxForCell(0, 1)}
          renderGuide={ctx => renderWordGuide(ctx, glyphs)}
        />
      </div>

      {/* Toolbar — 2×2 grid on every screen size */}
      <div className="grid grid-cols-2 gap-3 max-w-md w-full mx-auto">
        <Button
          variant="secondary"
          size="md"
          onClick={clearAll}
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
        {/* "Next word" is only actionable after a full-word pass; until then it
            sits disabled in the grid so the layout never reflows. */}
        <Button
          variant={allPassed ? 'success' : 'secondary'}
          size="md"
          disabled={!allPassed}
          onClick={handleNextWord}
          leadingIcon={<ChevronRight className="w-4 h-4 rtl:-scale-x-100" />}
          className="text-xs h-12"
        >
          {nextWordLabel}
        </Button>
      </div>

      {/* Result overlay */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={allPassed ? wordPassTitle : failTitle}
        variant="center"
        hideCloseButton
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 justify-center" aria-label={isAr ? 'نتيجة كل حرف' : 'Per-letter result'}>
            {glyphs.map((g, i) => (
              <span
                key={g + String(i)}
                className={`px-2 py-1 rounded-lg text-[11px] font-black border flex items-center gap-1
                  ${statuses[i].state === 'pass'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300'
                    : statuses[i].state === 'fail'
                      ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300'
                      : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
              >
                <span dir="ltr">{g}</span>
                <span className="tabular-nums" dir="ltr">{percentText(statuses[i].coverage)}</span>
              </span>
            ))}
          </div>

          {!allPassed && (
            <p className="text-[11px] font-semibold text-muted leading-relaxed text-center">
              {isKu
                ? `${count - passedCount} tîp hîn ne temam e. Deverên sor temam bike û dîsa Kontrol bike.`
                : isAr
                  ? `بقي ${count - passedCount} حروف غير مكتملة. أكمل المناطق الحمراء ثم اضغط تحقق مرة أخرى.`
                  : `${count - passedCount} letter${count - passedCount === 1 ? '' : 's'} still need work. Fill the red areas, then Check again.`}
            </p>
          )}

          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">
            {thresholdText}
          </p>

          {allPassed ? (
            <Button variant="success" fullWidth onClick={handleNextWord} leadingIcon={<CheckCircle2 className="w-4 h-4" />}>
              {nextWordLabel}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="primary" fullWidth onClick={() => setOpen(false)}>
                {keepDrawingLabel}
              </Button>
              <Button variant="danger" fullWidth onClick={() => { clearAll(); setOpen(false); }} leadingIcon={<XCircle className="w-4 h-4" />}>
                {clearLabel}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

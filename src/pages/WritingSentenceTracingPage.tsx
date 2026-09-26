import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { WRITING_SENTENCES } from '../data/writingSentences';
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
 * Sentence-tracing layout. The full sentence is shown faintly with a dashed
 * lane around each word (long sentences wrap onto extra rows so the letters
 * stay legible). The learner draws the WHOLE sentence freely across the
 * lanes, then one Check validates every letter of every word with the shared
 * zone-based engine. Failed words are highlighted red (only the missing
 * pixels); the sentence counts as learned only when EVERY word passes.
 */

const MARGIN = 0.06; // normalized gutter from the canvas edge
const SPACE_UNITS = 0.6; // gap between words, measured in letter widths
const ROW_MAX_UNITS = 7.5; // wrap to a new row beyond ~7–8 letter-widths
const CELL_INSET = 0.25; // letters sit in the middle 50% of each row's height

const FADED_GUIDE = 'rgba(100, 116, 139, 0.30)';

interface WordLane {
  /** Position of the word in the sentence (0-based, matches statuses). */
  index: number;
  /** Original Kurdish word (used for chips/labels). */
  text: string;
  /** Uppercase glyphs to trace, one per letter cell. */
  chars: string[];
  /** Normalized rectangle of the word's dashed lane. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** Normalized per-letter cells inside the lane. */
  letterBoxes: TraceBox[];
}

interface SentenceLayout {
  lanes: WordLane[];
  rows: number;
}

/** Greedy row wrap + normalized geometry for every word lane and letter cell. */
function layoutSentence(text: string): SentenceLayout {
  const words = text.trim().split(/\s+/).filter(Boolean);

  // Assign words to rows, wrapping when a row would get too tight.
  const rows: string[][] = [];
  let current: string[] = [];
  let currentUnits = 0;
  for (const word of words) {
    const gap = current.length === 0 ? 0 : SPACE_UNITS;
    if (current.length > 0 && currentUnits + gap + word.length > ROW_MAX_UNITS) {
      rows.push(current);
      current = [];
      currentUnits = 0;
    }
    currentUnits += (current.length === 0 ? 0 : SPACE_UNITS) + word.length;
    current.push(word);
  }
  if (current.length > 0) rows.push(current);

  const rowCount = Math.max(1, rows.length);
  const inner = 1 - 2 * MARGIN;
  const rowHeight = inner / rowCount;

  const lanes: WordLane[] = [];
  for (let r = 0; r < rows.length; r += 1) {
    const rowWords = rows[r];
    const gaps = Math.max(0, rowWords.length - 1);
    const totalUnits =
      rowWords.reduce((sum, word) => sum + word.length, 0) + gaps * SPACE_UNITS;
    const unitWidth = inner / Math.max(1, totalUnits);
    const top = MARGIN + r * rowHeight;
    const bottom = top + rowHeight;

    let cursor = MARGIN;
    for (const text of rowWords) {
      const chars = text.toUpperCase().split('');
      const width = chars.length * unitWidth;
      const left = cursor;
      const right = left + width;
      // Letters live in a centered vertical band (the ruled middle of the row)
      // so the faint word reads like a written line with room above/below.
      const cellTop = top + rowHeight * CELL_INSET;
      const cellBottom = bottom - rowHeight * CELL_INSET;
      const letterBoxes: TraceBox[] = chars.map((_, i) => ({
        left: left + (i * width) / chars.length,
        right: left + ((i + 1) * width) / chars.length,
        top: cellTop,
        bottom: cellBottom,
      }));
      lanes.push({ index: lanes.length, text, chars, left, right, top, bottom, letterBoxes });
      cursor = right + SPACE_UNITS * unitWidth;
    }
  }

  return { lanes, rows: rowCount };
}

/** Dashed lane outline around one word. */
function drawWordLane(ctx: CanvasRenderingContext2D, lane: WordLane): void {
  const pad = 4;
  const x = lane.left * TRACE_CANVAS + pad;
  const y = lane.top * TRACE_CANVAS + pad;
  const w = (lane.right - lane.left) * TRACE_CANVAS - pad * 2;
  const h = (lane.bottom - lane.top) * TRACE_CANVAS - pad * 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** The guide renderer: every word faintly inside its own dashed lane. */
function renderSentenceGuide(ctx: CanvasRenderingContext2D, layout: SentenceLayout): void {
  for (const lane of layout.lanes) {
    drawWordLane(ctx, lane);
    for (let i = 0; i < lane.chars.length; i += 1) {
      drawGlyphInBox(ctx, lane.chars[i], lane.letterBoxes[i], FADED_GUIDE);
    }
  }
}

/** Per-word outcome of the most recent full-sentence check. */
interface WordStatus {
  state: 'pending' | 'pass' | 'fail';
  coverage: number;
}

const PENDING_STATUS = (): WordStatus => ({ state: 'pending', coverage: 0 });

export function WritingSentenceTracingPage() {
  const navigate = useNavigate();
  const { sentenceId } = useParams();
  const { language, userData, updateUserData } = useAuth();
  const deck: ReviewDeck = userData?.reviewDeck ?? {};

  const sentence = WRITING_SENTENCES.find(s => s.id === sentenceId) || WRITING_SENTENCES[0];
  const words = useMemo(() => sentence.ku.trim().split(/\s+/).filter(Boolean), [sentence.ku]);

  const layout = useMemo(() => layoutSentence(sentence.ku), [sentence.ku]);
  const slots = useMemo(
    () =>
      layout.lanes.flatMap(lane =>
        lane.chars.map((char, i) => ({ char, box: lane.letterBoxes[i] })),
      ),
    [layout],
  );

  const traceRef = useRef<TracingCanvasHandle>(null);
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<WordStatus[]>(() => words.map(PENDING_STATUS));

  // State ownership: when only :sentenceId changes, React Router keeps this
  // component mounted and would otherwise carry word statuses, the overlay and
  // the strokes into the next sentence. Re-keying the route remounts for a new
  // sentence; this reset mirrors the word page's belt-and-suspenders guard.
  useEffect(() => {
    setOpen(false);
    setStatuses(words.map(PENDING_STATUS));
    traceRef.current?.clear();
    traceRef.current?.clearMissHighlight();
  }, [sentence.id, words]);

  const allPassed = statuses.every(s => s.state === 'pass');
  const passedCount = statuses.filter(s => s.state === 'pass').length;

  const clearAll = useCallback(() => {
    traceRef.current?.clear();
    traceRef.current?.clearMissHighlight();
    setStatuses(words.map(PENDING_STATUS));
  }, [words]);

  const handleCheck = useCallback(() => {
    const strokesMask = buildStrokesMask(traceRef.current?.canvas() ?? null);

    // Validate every letter of every word, in its own cell region.
    const wordResults = layout.lanes.map(lane =>
      lane.chars.map((char, i) =>
        evaluateTrace(
          buildGlyphMask(char, lane.letterBoxes[i]),
          strokesMask,
          lane.letterBoxes[i],
          char,
        ),
      ),
    );

    // OR every failed letter's red zone into one highlight layer.
    const combinedMiss = new Uint8ClampedArray(TRACE_CANVAS * TRACE_CANVAS);
    for (const results of wordResults) {
      for (const res of results) {
        if (res.passed) continue;
        for (let k = 0; k < res.miss.length; k += 1) {
          if (res.miss[k] === MISS_TARGET) combinedMiss[k] = MISS_TARGET;
        }
      }
    }
    traceRef.current?.showMissHighlight(combinedMiss);

    const nextStatuses: WordStatus[] = wordResults.map(results => ({
      state: results.every(res => res.passed) ? 'pass' : 'fail',
      coverage: Math.min(...results.map(res => res.coverage)),
    }));
    setStatuses(nextStatuses);

    // Learned ⇔ EVERY word passes this check — same shared SM-2 deck as words.
    if (nextStatuses.every(status => status.state === 'pass')) {
      const updatedDeck = recordReview(deck, sentence.id, 'good');
      // FIRE-AND-FORGET: persist through the app's normal profile pipeline.
      void updateUserData({ reviewDeck: updatedDeck });
    }

    setOpen(true);
  }, [layout, deck, updateUserData, sentence.id]);

  const handleNextSentence = useCallback(() => {
    setOpen(false);
    const next =
      WRITING_SENTENCES[
        (WRITING_SENTENCES.findIndex(s => s.id === sentence.id) + 1) % WRITING_SENTENCES.length
      ];
    navigate(`/writing/sentences/${next.id}`, { replace: true });
  }, [navigate, sentence.id]);

  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const clearLabel = isKu ? 'Paqij bike' : isAr ? 'مسح الكل' : 'Clear';
  const undoLabel = isKu ? 'Vegere' : isAr ? 'تراجع' : 'Undo';
  const checkLabel = isKu ? 'Kontrol' : isAr ? 'تحقق' : 'Check';
  const nextLabel = isKu ? 'Ya din' : isAr ? 'جملة تالية' : 'Next sentence';
  const keepDrawingLabel = isKu ? 'Temam bike' : isAr ? 'أكمل' : 'Keep drawing';

  const failTitle = isKu ? 'Dîsa biceribîne ❌' : isAr ? 'حاول مرة أخرى ❌' : 'Try again ❌';
  const passTitle = isKu ? 'Baş e! Hevok temam ✅' : isAr ? 'أحسنت! اكتملت الجملة ✅' : 'Well done! Sentence complete ✅';

  const percentText = (fraction: number) => `${Math.round(fraction * 100)}%`;
  const thresholdText = isKu
    ? `divê dagirtin ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}%, her herêm ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}%, derveyî ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}%`
    : isAr
      ? `التغطية ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}٪، كل منطقة ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}٪، خارج المسار ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}٪`
      : `coverage ≥ ${Math.round(OVERALL_COVERAGE_MIN * 100)}%, each zone ≥ ${Math.round(ZONE_COVERAGE_MIN * 100)}%, outside ≤ ${Math.round(OUT_OF_BOUNDS_MAX * 100)}%`;

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24">
      {/* Sentence header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h2 className="text-xl font-black text-ink leading-none">
            <span dir="ltr" className="font-mono">{sentence.ku}</span>
            <span className="text-sm font-black text-muted ms-2">
              {isAr ? sentence.ar : sentence.en}
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">
            {isKu
              ? 'Hemû hevokê bikşîne, paşê Kontrol bike'
              : isAr
                ? 'ارسم الجملة كلها ثم اضغط تحقق'
                : 'Draw the whole sentence, then tap Check'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/writing/sentences')}
          className="text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 uppercase tracking-wider cursor-pointer bg-transparent border-none min-h-[44px] px-2"
        >
          {isKu ? 'Hemû hevok' : isAr ? 'كل الجُمل' : 'All sentences'}
        </button>
      </div>

      {/* Per-word status chips — show post-check state (✅ / ❌ / ⏳) */}
      <div className="flex items-center justify-center gap-1.5 mb-3" aria-label={isAr ? 'حالة الكلمات' : 'Word status'}>
        {layout.lanes.map((lane, i) => (
          <span
            key={`${sentence.id}-${lane.index}`}
            className={`h-8 px-2.5 rounded-lg flex items-center justify-center gap-1 text-[12px] font-black border transition-colors
              ${statuses[i].state === 'pass'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : statuses[i].state === 'fail'
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}
          >
            <span dir="ltr">{lane.text}</span>
            {statuses[i].state === 'pass' && <Check className="w-3 h-3" aria-hidden="true" />}
            {statuses[i].state === 'fail' && <XCircle className="w-3 h-3" aria-hidden="true" />}
          </span>
        ))}
      </div>

      {/* Canvas */}
      <div className="mb-4">
        <TracingCanvas
          key={sentence.id}
          ref={traceRef}
          char={slots[0]?.char ?? ' '}
          guideBox={slots[0]?.box}
          renderGuide={ctx => renderSentenceGuide(ctx, layout)}
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
        {/* "Next sentence" is only actionable after a full pass. */}
        <Button
          variant={allPassed ? 'success' : 'secondary'}
          size="md"
          disabled={!allPassed}
          onClick={handleNextSentence}
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
        title={allPassed ? passTitle : failTitle}
        variant="center"
        hideCloseButton
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 justify-center" aria-label={isAr ? 'نتيجة كل كلمة' : 'Per-word result'}>
            {layout.lanes.map((lane, i) => (
              <span
                key={lane.text + String(i)}
                className={`px-2 py-1 rounded-lg text-[11px] font-black border flex items-center gap-1
                  ${statuses[i].state === 'pass'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300'
                    : statuses[i].state === 'fail'
                      ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-300'
                      : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
              >
                <span dir="ltr">{lane.text}</span>
                <span className="tabular-nums" dir="ltr">{percentText(statuses[i].coverage)}</span>
              </span>
            ))}
          </div>

          {!allPassed && (
            <p className="text-[11px] font-semibold text-muted leading-relaxed text-center">
              {isKu
                ? `${words.length - passedCount} peyv hîn ne temam e. Deverên sor temam bike û dîsa Kontrol bike.`
                : isAr
                  ? `بقي ${words.length - passedCount} كلمات غير مكتملة. أكمل المناطق الحمراء ثم اضغط تحقق مرة أخرى.`
                  : `${words.length - passedCount} word${words.length - passedCount === 1 ? '' : 's'} still need work. Fill the red areas, then Check again.`}
            </p>
          )}

          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">
            {thresholdText}
          </p>

          {allPassed ? (
            <Button variant="success" fullWidth onClick={handleNextSentence} leadingIcon={<CheckCircle2 className="w-4 h-4" />}>
              {nextLabel}
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

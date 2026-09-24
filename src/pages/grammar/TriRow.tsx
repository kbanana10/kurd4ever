import React from 'react';
import { AudioButton } from '../../components/AudioButton';

/**
 * TriRow — the single fixed-geometry row used everywhere Kurmanji + audio +
 * translation appear together.
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  [Kurdish]         [🔊]                [Arabic]      │
 *   │                                        [English]     │
 *   └──────────────────────────────────────────────────────┘
 *
 * Geometry is provably stable across rows:
 *  - `grid-cols-[1fr_auto_1fr]` gives the left and right text columns equal
 *    `1fr` widths, so the `auto` middle track (the audio button) sits at the
 *    exact horizontal center of the row no matter how long the Kurdish or the
 *    translation text is.
 *  - Long Kurdish/translation text wraps *inside* its column (`break-words` +
 *    `min-w-0`), instead of pushing the audio button off-center.
 *  - An inline `direction: ltr` keeps the column order Kurdish→audio→translation
 *    even when the surrounding page is RTL (Arabic UI). Each text cell then sets
 *    its own bidi direction so Arabic still reads right-to-left.
 *
 * An empty cell renders as a spacer so the row always has exactly three tracks
 * (audio stays centered).
 */
interface TriRowProps {
  /** Kurmanji text (left column) — always rendered LTR. */
  ku?: string;
  /** Optional custom node replacing the Kurdish cell (e.g. a clickable button). */
  kuNode?: React.ReactNode;
  /** Arabic meaning (right column, primary). */
  ar?: string;
  /** English meaning (right column, secondary). */
  en?: string;
  /** Optional custom node replacing the translation stack (the right column). */
  rightNode?: React.ReactNode;
  /** Text spoken by the 🔊 button (defaults to `ku`). */
  audioText?: string;
  /** Accessible suffix for the play button. */
  audioLabel?: string;
  showAudio?: boolean;
  kuClassName?: string;
  arClassName?: string;
  enClassName?: string;
  audioClassName?: string;
  audioIconClassName?: string;
  className?: string;
  /** Optional data-testid prefix: <testId>-ku / -audio / -right. */
  testId?: string;
}

export function TriRow({
  ku = '',
  kuNode,
  ar = '',
  en = '',
  rightNode,
  audioText,
  audioLabel,
  showAudio = true,
  kuClassName = 'text-[13px] font-bold text-ink leading-snug',
  arClassName = 'text-[12px] font-semibold text-slate-700 dark:text-slate-200 leading-snug',
  enClassName = 'text-[11px] font-medium text-muted leading-snug',
  audioClassName = 'p-2 min-w-[36px] min-h-[36px]',
  audioIconClassName = 'w-4 h-4',
  className = '',
  testId,
}: TriRowProps) {
  const kuId = testId ? `${testId}-ku` : undefined;
  const audioId = testId ? `${testId}-audio` : undefined;
  const rightId = testId ? `${testId}-right` : undefined;

  const leftCell: React.ReactNode =
    kuNode ??
    (ku ? (
      <bdi
        dir="ltr"
        data-testid={kuId}
        className={`min-w-0 break-words text-left ${kuClassName}`}
      >
        {ku}
      </bdi>
    ) : (
      <span aria-hidden="true" className="min-w-0" />
    ));

  const audioCell: React.ReactNode = showAudio ? (
    <div
      data-testid={audioId}
      className="justify-self-center shrink-0 flex items-center justify-center"
    >
      <AudioButton
        textToSpeak={audioText ?? ku}
        label={audioLabel ?? ` of ${ku}`}
        iconClassName={audioIconClassName}
        className={audioClassName}
        showProgress={false}
      />
    </div>
  ) : (
    <span aria-hidden="true" className="justify-self-center min-w-[44px]" />
  );

  const translationStack: React.ReactNode =
    rightNode ??
    (ar || en ? (
      <>
        {ar ? (
          // dir="auto" keeps Arabic reading right-to-left (primary case) but
          // also renders UI-language references (en/ku) left-to-right when a
          // caller passes the localized reference as `ar`.
          <div dir="auto" className={`block ${arClassName}`}>
            {ar}
          </div>
        ) : null}
        {en ? (
          <div dir="ltr" className={`block ${enClassName}`}>
            {en}
          </div>
        ) : null}
      </>
    ) : null);

  const rightCell: React.ReactNode = translationStack ? (
    <div data-testid={rightId} className="min-w-0 text-right">
      {translationStack}
    </div>
  ) : (
    <span aria-hidden="true" className="min-w-0" />
  );

  return (
    <div
      data-testid={testId}
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-h-[56px] ${className}`}
      style={{ direction: 'ltr' }}
    >
      {leftCell}
      {audioCell}
      {rightCell}
    </div>
  );
}

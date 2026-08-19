import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface GameHeaderProps {
  title: string;
  onExit: () => void;
  /** Localized aria-label for the exit control. */
  exitLabel: string;
  /** Unified progress/score pill, always pinned to the end side. */
  stat?: { label: string; value: React.ReactNode };
  /** Remaining time / lives indicator, rendered just before the stat pill. */
  indicator?: React.ReactNode;
  /** Optional extra controls (pause, settings), rendered after the stat. */
  action?: React.ReactNode;
  /** `light` = app canvas games; `dark` = the zombie arena. */
  tone?: 'light' | 'dark';
}

/**
 * GameHeader — the single top bar shared by ALL mini-games.
 *
 * Harmonization contract (UI/UX audit):
 *   • back/exit button: top-START, 44×44 hit area, ArrowLeft mirrored in RTL
 *     (`rtl:-scale-x-100`), identical to the app shell's back button.
 *   • title: start-aligned, `dir="auto"` (Arabic titles stay RTL inside LTR
 *     games and vice-versa), truncates instead of wrapping.
 *   • progress/score pill + time/lives indicator: always in the same END
 *     position across every game.
 *   • metrics match MainLayout's header: min-h-[56px], same type scale.
 */
export function GameHeader({
  title,
  onExit,
  exitLabel,
  stat,
  indicator,
  action,
  tone = 'light',
}: GameHeaderProps) {
  const dark = tone === 'dark';
  return (
    <header
      className={cn(
        'w-full max-w-md mx-auto min-h-[56px] px-0.5 py-1.5 mb-2 flex items-center gap-2.5 shrink-0',
        dark ? 'text-white' : 'text-ink'
      )}
    >
      <button
        type="button"
        onClick={onExit}
        aria-label={exitLabel}
        className={cn(
          'min-w-[44px] min-h-[44px] shrink-0 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300]',
          dark
            ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            : 'bg-white dark:bg-slate-900 border-line-soft text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs'
        )}
      >
        <ArrowLeft className="w-5 h-5 rtl:-scale-x-100" />
      </button>

      <h1 dir="auto" className="flex-1 min-w-0 truncate text-lg font-black leading-tight text-start">
        {title}
      </h1>

      {indicator && <div className="shrink-0 flex items-center gap-1">{indicator}</div>}

      {stat && (
        <div
          className={cn(
            'shrink-0 flex items-center gap-1.5 rounded-full px-3 min-h-[36px] border',
            dark
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white dark:bg-slate-900 border-line-soft shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
          )}
        >
          <span className={cn('text-[9px] font-black uppercase tracking-widest', dark ? 'text-slate-500' : 'text-muted')}>
            {stat.label}
          </span>
          <span className="text-sm font-black tabular-nums">{stat.value}</span>
        </div>
      )}

      {action}
    </header>
  );
}

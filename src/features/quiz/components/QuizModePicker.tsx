/**
 * QuizModePicker.tsx — quiz mode selection hub (TODO-029).
 * Extracted verbatim from Quiz.tsx during the incremental quiz refactor;
 * behavior and markup are unchanged (adaptive card, 3 live modes, locked
 * Image Quiz "Coming Soon" state).
 */
import React from 'react';
import { ArrowLeft, Trophy, ChevronRight, Volume2, PenTool, Palette, Lock, BrainCircuit } from 'lucide-react';
import { Language } from '../../../models/user';
import { t } from '../../../localization/translations';
import { cn } from '../../../utils/cn';
import { Badge, Button } from '../../../components/ui';
import { QuizMode } from '../types';

interface QuizModePickerProps {
  language: Language;
  userLevelId: string;
  /** Unlocked after the learner finishes their first level node — the
   *  adaptive pool needs genuinely encountered words (maintainer gating). */
  showAdaptive: boolean;
  onSelectMode: (mode: QuizMode) => void;
  onBack: () => void;
  onLeaderboard: () => void;
}

export function QuizModePicker({ language, userLevelId, showAdaptive, onSelectMode, onBack, onLeaderboard }: QuizModePickerProps) {
  return (
    <div className="p-4 flex flex-col h-full absolute top-0 start-0 w-full bg-surface-2 text-ink z-50 font-sans leading-relaxed overflow-y-auto pb-24">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 py-3 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onBack}
          aria-label={language !== 'ar' ? 'Back' : 'رجوع'}
          className="shrink-0 w-11 !px-0 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 rtl:-scale-x-100" />
        </Button>

        <h1 className="text-xl font-black text-ink truncate">
          {t(language, 'quiz_hub_title')}
        </h1>

        <Button
          variant="secondary"
          size="sm"
          onClick={onLeaderboard}
          aria-label={language !== 'ar' ? 'Leaderboard' : 'قائمة المتصدرين'}
          className="shrink-0 w-11 !px-0 rounded-full text-warning"
        >
          <Trophy className="w-5 h-5" />
        </Button>
      </div>

      {/* Section intro — plain type, no banner box. (The old gold-surface
          banner clipped its own copy and broke the "gold is an accent,
          never a surface" rule.) */}
      <div className="mb-5 max-w-sm mx-auto w-full px-1">
        <h2 className="text-2xl font-black text-ink tracking-tight">
          {t(language, 'quiz_choose_title')}
        </h2>
        <p className="text-sm text-muted font-bold mt-1">
          {t(language, 'quiz_choose_sub')}
        </p>
      </div>

      {/* Quiz mode cards */}
      <div className="space-y-3 flex-1 max-w-sm mx-auto w-full">
        {/* ADAPTIVE LEVEL PRACTICE — personalized mode fed by the learner's
            unlocked levels and encountered words. Hidden until the first
            level node is completed. */}
        {showAdaptive && (
        <button
          type="button"
          onClick={() => onSelectMode('adaptive_practice')}
          aria-label={`${t(language, 'quiz_mode_adaptive_title')}. ${t(language, 'quiz_mode_adaptive_desc')}`}
          className={cn(
            'w-full bg-surface border-2 border-brand/60 rounded-card p-4 shadow-flat',
            'flex items-center justify-between gap-3 text-start cursor-pointer',
            'min-h-[44px] transition-[transform,border-color] hover:-translate-y-0.5 hover:border-brand',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'
          )}
        >
          <span className="flex items-center gap-3.5 min-w-0">
            <span className="w-12 h-12 rounded-control bg-[#FFF6E0] dark:bg-[#3A2F14] text-brand flex items-center justify-center shrink-0" aria-hidden="true">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              {/* flex-wrap: the badge drops to its own line instead of
                  strangling the title into a 3-line wrap on small screens */}
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-black text-ink text-base leading-tight whitespace-nowrap">{t(language, 'quiz_mode_adaptive_title')}</span>
                <Badge tone="primary" className="tracking-normal shrink-0">
                  {userLevelId} · {t(language, 'quiz_personalized_badge')}
                </Badge>
              </span>
              <span className="text-muted text-xs mt-1 font-bold block">{t(language, 'quiz_mode_adaptive_desc')}</span>
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-muted shrink-0 rtl:rotate-180" aria-hidden="true" />
        </button>
        )}

        {/*
          The 4 core quiz modes, rendered from data so they cannot drift.
          Image Quiz ships as a clean "Coming Soon" locked state until real
          photo assets are bundled — emoji placeholders undersold the name.
        */}
        {([
          {
            mode: 'multiple_choice' as const,
            icon: <span className="text-lg font-black">ABC</span>,
            tone: 'text-brand-alt',
            title: t(language, 'quiz_mode_word_title'),
            desc: t(language, 'quiz_mode_word_desc'),
            locked: false,
          },
          {
            mode: 'listening' as const,
            icon: <Volume2 className="w-5 h-5" />,
            tone: 'text-brand',
            title: t(language, 'quiz_mode_listening_title'),
            desc: t(language, 'quiz_mode_listening_desc'),
            locked: false,
          },
          {
            mode: 'write_kurdish' as const,
            icon: <PenTool className="w-5 h-5" />,
            tone: 'text-warning',
            title: t(language, 'quiz_mode_writing_title'),
            desc: t(language, 'quiz_mode_writing_desc'),
            locked: false,
          },
          {
            mode: 'emoji_match' as const,
            icon: <Palette className="w-5 h-5" />,
            tone: 'text-info',
            title: t(language, 'quiz_mode_image_title'),
            desc: t(language, 'quiz_mode_image_desc'),
            locked: true,
          },
        ]).map((opt) => {
          if (opt.locked) {
            return (
              <div
                key={opt.mode}
                role="button"
                aria-disabled="true"
                aria-label={`${opt.title}. ${t(language, 'quiz_coming_soon')}`}
                className={cn(
                  'w-full bg-surface-2 border-2 border-dashed border-line-soft rounded-card p-4',
                  'flex items-center justify-between gap-3 text-start cursor-not-allowed select-none min-h-[44px]'
                )}
              >
                <span className="flex items-center gap-3.5 min-w-0 opacity-60">
                  <span className={cn('w-12 h-12 rounded-control bg-surface flex items-center justify-center shrink-0', opt.tone)} aria-hidden="true">
                    {opt.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="font-black text-ink text-base leading-tight block">{opt.title}</span>
                    <span className="text-muted text-xs mt-1 font-bold block">{opt.desc}</span>
                  </span>
                </span>
                <Badge tone="warning" className="tracking-normal shrink-0 normal-case">
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  {t(language, 'quiz_coming_soon')}
                </Badge>
              </div>
            );
          }

          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => onSelectMode(opt.mode)}
              aria-label={`${opt.title}. ${opt.desc}`}
              className={cn(
                'w-full bg-surface border-2 border-line rounded-card p-4 shadow-flat',
                'flex items-center justify-between gap-3 text-start cursor-pointer',
                'min-h-[44px] transition-[transform,border-color] hover:-translate-y-0.5 hover:border-line-soft',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'
              )}
            >
              <span className="flex items-center gap-3.5 min-w-0">
                <span
                  className={cn('w-12 h-12 rounded-control bg-surface-2 flex items-center justify-center shrink-0', opt.tone)}
                  aria-hidden="true"
                >
                  {opt.icon}
                </span>
                <span className="min-w-0">
                  <span className="font-black text-ink text-base leading-tight block">{opt.title}</span>
                  <span className="text-muted text-xs mt-1 font-bold block">{opt.desc}</span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-muted shrink-0 rtl:rotate-180" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

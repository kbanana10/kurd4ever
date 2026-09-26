/**
 * AudioButton.tsx
 *
 * Interactive UI button trigger for native and web audio streams.
 *
 * Slow playback is a simple toggle ON the audio button itself (child-friendly,
 * no extra controls, no numbers): each press alternates the speed for the NEXT
 * playback —
 *   1st press → normal speed
 *   2nd press → slow speed
 *   3rd press → normal speed
 *   …
 * The turtle icon + "Slow"/"بطيء" label appear while slow audio is active.
 * Right-click / long-press also toggles the same mode for muscle memory.
 */
import React, { useState } from 'react';
import { Volume2, Turtle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useAuth } from '../../../lib/AuthContext';
import { motion } from 'motion/react';

interface AudioButtonProps {
  audioUrl?: string;
  /**
   * AUDIT FIX: the Kurmanji lemma to pronounce. Because ~100% of the referenced
   * /audio/**.mp3 files are absent from the bundle, every press falls back to
   * SpeechSynthesis. Without this prop the fallback spoke the *English*
   * filename ("mother") instead of the Kurdish word ("Dayik").
   */
  textToSpeak?: string;
  className?: string;
  iconClassName?: string;
  showProgress?: boolean;
  playbackRate?: number;
  /** Accessible name; defaults to a generic label when no lemma is supplied. */
  label?: string;
}

/** Localized "Slow" word for the in-button slow-mode label (no numbers). */
function slowLabel(language: 'en' | 'ar' | 'ku'): string {
  if (language === 'ar') return 'بطيء';
  if (language === 'ku') return 'Hêdî';
  return 'Slow';
}

export function AudioButton({ audioUrl, textToSpeak, className = '', iconClassName = 'w-6 h-6', showProgress = true, playbackRate, label }: AudioButtonProps) {
  const { language } = useAuth();
  const { play, stop, isPlaying, progress } = useAudio(audioUrl, textToSpeak);

  const isDisabled = !audioUrl && !textToSpeak;
  const hasExplicitRate = playbackRate !== undefined;
  /** What the NEXT press should use (alternates normal → slow → normal…). */
  const [slowArmed, setSlowArmed] = useState(false);
  /** Whether the audio currently/last played slowly — drives the turtle icon. */
  const [playingSlow, setPlayingSlow] = useState(false);

  const slowText = slowLabel(language);
  // A caller-supplied slow rate (the quiz's listening speed) shows the turtle too.
  const isSlowed = hasExplicitRate ? playbackRate < 1 : playingSlow;

  const handlePress = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDisabled) return;

    const rate = hasExplicitRate ? playbackRate : (slowArmed ? 0.7 : 1.0);

    if (isPlaying) {
      stop();
    }
    play(rate);

    setPlayingSlow(rate < 1);
    // Arm the opposite speed for the following press.
    setSlowArmed(prev => !prev);
  };

  // Right-click (desktop) / long-press still toggles the same two speeds.
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSlowArmed(prev => !prev);
  };

  return (
    <button
      onClick={handlePress}
      onContextMenu={handleContextMenu}
      disabled={isDisabled}
      type="button"
      className={`relative min-w-[44px] min-h-[44px] p-3 rounded-full transition-all outline-none overflow-hidden flex items-center justify-center
        focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-900
        ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600' : isPlaying ? 'bg-indigo-100 dark:bg-indigo-950/80 shadow-inner text-indigo-800 dark:text-indigo-300' : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 text-indigo-600 dark:text-indigo-400'}
        ${className}`}
      title={isSlowed ? `${slowText} (press again for normal)` : 'Play Audio'}
      aria-label={
        isPlaying
          ? `Stop pronunciation${textToSpeak ? ` of ${textToSpeak}` : ''}`
          : `${isSlowed ? `${slowText} — ` : ''}Play pronunciation${
              label ?? (textToSpeak ? ` of ${textToSpeak}` : '')
            }`
      }
      aria-pressed={isPlaying}
    >
      {showProgress && isPlaying && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-indigo-200/50 dark:bg-indigo-700/50 transition-all duration-75 ease-linear pointer-events-none"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          animate={isPlaying ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" }}
        >
          {isSlowed ? (
            <Turtle className={`${iconClassName} text-amber-600 dark:text-amber-400`} />
          ) : (
            <Volume2 className={iconClassName} />
          )}
        </motion.div>
      </div>

      <span className="sr-only" aria-live="polite">
        {isPlaying ? (isSlowed ? "Playing audio slowly" : "Playing audio") : "Audio stopped"}
      </span>
    </button>
  );
}

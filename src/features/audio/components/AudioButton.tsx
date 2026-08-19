/**
 * AudioButton.tsx
 * 
 * Interactive UI button trigger for native and web audio streams.
 * Right-click (desktop) or long-press options enable slow-playback rates (0.7x) for linguistic breakdown.
 */
import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
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

export function AudioButton({ audioUrl, textToSpeak, className = '', iconClassName = 'w-6 h-6', showProgress = true, playbackRate, label }: AudioButtonProps) {
  const { play, stop, isPlaying, progress } = useAudio(audioUrl, textToSpeak);
  const [isSlowMode, setIsSlowMode] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioUrl && !textToSpeak) return;
    
    const rateToPlay = playbackRate !== undefined ? playbackRate : (isSlowMode ? 0.7 : 1.0);
    
    if (isPlaying) {
      stop();
      play(rateToPlay);
    } else {
      play(rateToPlay);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSlowMode(!isSlowMode);
  };

  return (
    <button
      onClick={handlePlay}
      onContextMenu={handleContextMenu}
      disabled={!audioUrl && !textToSpeak}
      type="button"
      className={`relative min-w-[44px] min-h-[44px] p-3 rounded-full transition-all outline-none overflow-hidden group flex items-center justify-center
        focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-900
        ${(!audioUrl && !textToSpeak) ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600' : isPlaying ? 'bg-indigo-100 dark:bg-indigo-950/80 shadow-inner text-indigo-800 dark:text-indigo-300' : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 text-indigo-600 dark:text-indigo-400'}
        ${className}`}
      title={isSlowMode ? "Play (Slow Mode 0.7x)" : "Play Audio (Right-click or long-press for slow mode)"}
      aria-label={
        isPlaying
          ? `Stop pronunciation${textToSpeak ? ` of ${textToSpeak}` : ''}`
          : `${isSlowMode ? 'Play slow (0.7x) pronunciation' : 'Play pronunciation'}${
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
      
      <div className={`relative z-10 flex items-center justify-center`}>
        <motion.div
          animate={isPlaying ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" }}
        >
          <Volume2 className={`${iconClassName} ${isSlowMode ? 'text-amber-500 dark:text-amber-400' : ''}`} />
        </motion.div>
      </div>

      <span className="sr-only" aria-live="polite">
        {isPlaying ? (isSlowMode ? "Playing audio in slow mode" : "Playing audio") : "Audio stopped"}
      </span>
    </button>
  );
}

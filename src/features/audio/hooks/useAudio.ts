/**
 * useAudio.ts
 * 
 * Custom hook to safely manage HTMLAudioElement playback of media assets.
 * Now features SpeechSynthesis fallback when audio files are missing or in 404 states.
 * 
 * Features:
 * - Singleton playback: Prevents multiple audio tracks from overlapping.
 * - In-memory Caching: Prevents the browser from constantly re-fetching or instantiating audio.
 * - Reactive state: Provides `isPlaying` boolean mapped directly to audio events.
 * - SpeechSynthesis fallback: Ensures every word can be spoken even if the audio file fails.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { isAudioPath, deriveAudioPath } from '../utils/audioSlug';
import { USE_CUSTOM_AUDIO_API } from '../../../lib/audioFlags';

const audioCache = new Map<string, HTMLAudioElement>();
let currentlyPlaying: HTMLAudioElement | null = null;
let currentSetter: ((val: boolean) => void) | null = null;

/**
 * AUDIT FIX: the cache was unbounded. Browsing the 400+ item dictionary
 * created one detached HTMLAudioElement per word and never released them,
 * leaking tens of MB on low-end Android devices. Map preserves insertion
 * order, so evicting the first key gives us LRU-ish behaviour.
 */
const MAX_CACHED_AUDIO = 40;

/**
 * Only a tiny subset of /public/audio is bundled in this repository. Most
 * vocabulary/alphabet paths point to optional generated TTS files that are not
 * checked in. Trying to instantiate HTMLAudioElement for those missing files
 * causes noisy server ENOENT logs and browser "no supported source" warnings.
 * Keep a conservative manifest of files we know are present and synthesize the
 * rest directly.
 */
const BUNDLED_AUDIO_ASSETS = new Set([
  '/audio/feedback/correct.wav',
  '/audio/feedback/wrong.wav',
  '/audio/feedback/complete.wav',
]);

function normalizeLocalAudioPath(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, globalThis.window === undefined ? 'http://localhost' : window.location.origin);
    const sameOrigin = globalThis.window === undefined || parsed.origin === window.location.origin;
    if (!sameOrigin) return null;
    return parsed.pathname;
  } catch {
    return url.startsWith('/') ? url.split(/[?#]/, 1)[0] : null;
  }
}

function hasKnownBundledAudioAsset(url?: string): boolean {
  const localPath = normalizeLocalAudioPath(url);
  if (!localPath || !localPath.startsWith('/audio/')) return false;
  return BUNDLED_AUDIO_ASSETS.has(localPath);
}

const audioAvailabilityCache = new Map<string, boolean>();

async function canUseNativeAudio(url?: string): Promise<boolean> {
  if (!url) return false;
  const localPath = normalizeLocalAudioPath(url);
  // Blob/data URLs and remote URLs are assumed to be intentionally supplied by
  // the caller and should still use the native audio path.
  if (!localPath) return true;
  if (!localPath.startsWith('/audio/')) return true;
  if (BUNDLED_AUDIO_ASSETS.has(localPath)) return true;

  const cached = audioAvailabilityCache.get(localPath);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(localPath, { method: 'HEAD', cache: 'force-cache' });
    const contentType = response.headers.get('content-type') || '';
    const isAudio = contentType.toLowerCase().startsWith('audio/');
    const available = response.ok && isAudio;

    if (available) {
      audioAvailabilityCache.set(localPath, true);
    } else if (response.status === 404) {
      // Only cache definitive 404s, not transient server errors
      audioAvailabilityCache.set(localPath, false);
    }
    return available;
  } catch {
    // Transient network error: return false but do not permanently cache
    return false;
  }
}

function estimateSpeechDurationMs(text: string, rate = 1) {
  // A small UI-only estimate for the animated playing state while
  // SpeechSynthesis does not expose reliable progress events across browsers.
  const normalizedRate = Math.max(0.5, rate || 1);
  return Math.min(3500, Math.max(700, (text.trim().length * 85) / normalizedRate));
}

function getCachedAudio(url: string): HTMLAudioElement {
  const existing = audioCache.get(url);
  if (existing) {
    // Refresh recency.
    audioCache.delete(url);
    audioCache.set(url, existing);
    return existing;
  }

  while (audioCache.size >= MAX_CACHED_AUDIO) {
    // SAFETY: audioCache keys are always strings (URL-keyed Map); undefined only when the cache is empty, handled by the caller.
    const oldestKey = audioCache.keys().next().value as string | undefined;
    if (oldestKey === undefined) break;
    const victim = audioCache.get(oldestKey);
    audioCache.delete(oldestKey);
    if (victim && victim !== currentlyPlaying) {
      try {
        victim.pause();
        victim.removeAttribute('src');
        victim.load();
      } catch {
        /* element already detached */
      }
    }
  }

  const created = document.createElement('audio');
  // Prevent eager fetches while rendering lists of hundreds of AudioButtons.
  created.preload = 'none';
  created.src = url;
  audioCache.set(url, created);
  return created;
}

export function getMuteState(): boolean {
  if (globalThis.window === undefined) return false;
  return localStorage.getItem('quiz_audio_muted') === 'true';
}

export function setMuteState(muted: boolean) {
  if (globalThis.window === undefined) return;
  localStorage.setItem('quiz_audio_muted', String(muted));
  if (muted) {
    stopAllActiveAudio();
  }
}

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    // SAFETY: legacy WebKit exposes webkitAudioContext; the || chain guards absence before construction.
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playSynthSound(trigger: (ctx: AudioContext, t: number) => void) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => {
          try {
            trigger(ctx, ctx.currentTime);
          } catch (e) {
            console.warn("Error running custom playSynthSound callback", e);
          }
        })
        .catch(err => {
          console.warn("Could not resume AudioContext inside playSynthSound", err);
        });
    } else {
      trigger(ctx, ctx.currentTime);
    }
  } catch (err) {
    console.warn("Web Audio API is not supported or accessible in this environment", err);
  }
}


// Use Web Audio directly for UI feedback so missing/corrupt media files or
// autoplay policies cannot generate noisy HTMLAudio warnings during gameplay.
export function playSuccessSound() {
  if (getMuteState()) return;
  playSynthSound((ctx, t) => {
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Nice bright ascending scale
    playNote(523.25, t, 0.12); // C5
    playNote(659.25, t + 0.06, 0.12); // E5
    playNote(783.99, t + 0.12, 0.25); // G5
  });
}

export function playFailureSound() {
  if (getMuteState()) return;
  playSynthSound((ctx, t) => {
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq - 70, start + duration);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(220, t, 0.3); // A3 slide down
  });
}

export function playCompleteSound() {
  if (getMuteState()) return;
  playSynthSound((ctx, t) => {
    const playNote = (freq: number, start: number, duration: number, volume = 0.08) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(261.63, t, 0.5, 0.06); // C4
    playNote(329.63, t + 0.06, 0.5, 0.06); // E4
    playNote(392.00, t + 0.12, 0.5, 0.06); // G4
    playNote(523.25, t + 0.18, 0.9, 0.1); // C5
  });
}

// Speech synthesis fallback assistant
//
// iOS Safari loads `getVoices()` asynchronously and the engine can sit in a
// "paused" state until the first user gesture primes it. We register one
// shared `voiceschanged` listener and cache the result so the first tap after
// load always has a voice list, and we resume a paused engine before speaking.
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesWarmed = false;

function warmVoices() {
  if (voicesWarmed) return;
  if (globalThis.window === undefined || !('speechSynthesis' in window)) return;
  voicesWarmed = true;
  const refresh = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      cachedVoices = [];
    }
  };
  refresh();
  try {
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
  } catch {
    /* older engines do not expose addEventListener on speechSynthesis */
  }
}

function pickPreferredVoice() {
  warmVoices();
  const voices = cachedVoices.length ? cachedVoices : (() => {
    try {
      return window.speechSynthesis.getVoices();
    } catch {
      return [];
    }
  })();
  // Kurmanji first (ku / kmr), then Turkish (closest phonetic match), then any
  // English voice, then the browser default.
  const kuVoice = voices.find((v) => {
    const lang = (v.lang || '').toLowerCase();
    return lang === 'ku' || lang.startsWith('ku-') || lang.startsWith('ku_') || lang.startsWith('kmr');
  });
  const trVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('tr'));
  const enVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('en'));
  return kuVoice ?? trVoice ?? enVoice ?? voices[0] ?? null;
}

function speakFallback(text: string, rate: number = 1.0) {
  if (getMuteState()) return;
  if (globalThis.window === undefined || !('speechSynthesis' in window)) return;

  const looksLikePath = isAudioPath(text);
  if (looksLikePath) {
    console.warn(`[useAudio] speakFallback refused path string "${text}". Explicit textToSpeak is required.`);
    return;
  }

  const cleanText = text.trim();
  if (!cleanText) return;

  try {
    // Prime/refresh the voice list inside the user gesture (iOS Safari).
    warmVoices();
    // An engine stuck in 'paused' (common on iOS after rapid cancel/spoke
    // cycles) must be resumed before a new utterance will ever fire.
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
  } catch (e) {
    console.warn(e);
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Try to use a Kurdish or Turkish-friendly speech synthesis voice
  const preferred = pickPreferredVoice();

  if (preferred) {
    const lang = (preferred.lang || '').toLowerCase();
    utterance.voice = preferred;
    if (lang === 'ku' || lang.startsWith('ku') || lang.startsWith('kmr')) {
      utterance.lang = preferred.lang;
    } else if (lang.startsWith('tr')) {
      utterance.lang = 'tr';
    } else if (lang.startsWith('en')) {
      utterance.lang = 'en';
    }
  }

  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}



export function stopAllActiveAudio() {
  if (currentlyPlaying) {
    try {
      currentlyPlaying.pause();
      currentlyPlaying.currentTime = 0;
    } catch (e) {
      console.warn(e);
    }
    currentlyPlaying = null;
  }
  if (currentSetter) {
    currentSetter(false);
    currentSetter = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn(e);
    }
  }
}

export const playAudioUrl = async (url: string, textToSpeak?: string, playbackRate: number = 1.0): Promise<void> => {
  if (getMuteState()) return;

  const fallbackText = textToSpeak || url;

  // Temporary browser-native TTS: while USE_CUSTOM_AUDIO_API is false, the
  // SpeechSynthesis fallback is the PRIMARY source for all spoken Kurdish.
  // The HEAD-check/native-HTMLAudio path below stays gated behind the flag so
  // it can be restored without touching call sites.
  if (!USE_CUSTOM_AUDIO_API) {
    speakFallback(fallbackText, playbackRate);
    await new Promise(resolve => window.setTimeout(resolve, estimateSpeechDurationMs(fallbackText, playbackRate)));
    return;
  }

  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying.currentTime = 0;
    if (currentSetter) currentSetter(false);
  }

  if (!(await canUseNativeAudio(url))) {
    speakFallback(fallbackText, playbackRate);
    await new Promise(resolve => window.setTimeout(resolve, estimateSpeechDurationMs(fallbackText, playbackRate)));
    return;
  }

  return new Promise((resolve) => {
    const audio = getCachedAudio(url);
    
    audio.onended = () => {
      currentlyPlaying = null;
      // AUDIT FIX: this previously read `currentSetter = null` (assignment, not a
      // call), so the owning component's `isPlaying` was never reset to false and
      // the play button stayed stuck in the "playing" state forever.
      if (currentSetter) {
        currentSetter(false);
        currentSetter = null;
      }
      resolve();
    };
    
    audio.onerror = (e) => {
      console.warn("Fast path audio error, speaking via synthesis instead:", e);
      speakFallback(fallbackText, playbackRate);
      currentlyPlaying = null;
      // Resolve instead of reject to keep the application flow serene and fluid
      resolve();
    };
    
    audio.play().then(() => {
      currentlyPlaying = audio!;
    }).catch(err => {
      console.warn("Fast path audio play catch, speaking via synthesis instead:", err);
      speakFallback(fallbackText, playbackRate);
      resolve();
    });
  });
};

export function useAudio(audioUrl?: string, textToSpeak?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);

    if (!audioUrl || !hasKnownBundledAudioAsset(audioUrl)) {
      audioInstanceRef.current = null;
      return;
    }

    const audio = getCachedAudio(audioUrl);
    audioInstanceRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (currentlyPlaying === audio) {
        currentlyPlaying = null;
        currentSetter = null;
      }
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlayState = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlayState);

    // If it's already playing (due to being a singleton), update the singleton tracker
    if (!audio.paused) {
      setIsPlaying(true);
      currentlyPlaying = audio;
      currentSetter = setIsPlaying;
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlayState);

      // Only pause on unmount or URL change if it is currently playing and matches this element
      if (currentlyPlaying === audio) {
        audio.pause();
        audio.currentTime = 0;
        currentlyPlaying = null;
        if (currentSetter) currentSetter(false);
      }
    };
  }, [audioUrl]);

  const play = useCallback(async (playbackRate: number = 1.0) => {
    if (getMuteState()) {
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, 500);
      return;
    }
    if (!audioUrl && !textToSpeak) return;

    // Temporary browser-native TTS primary path (see playAudioUrl above).
    if (!USE_CUSTOM_AUDIO_API) {
      const fallbackText = textToSpeak || audioUrl || '';
      speakFallback(fallbackText, playbackRate);
      setIsPlaying(true);
      window.setTimeout(() => {
        setIsPlaying(false);
      }, estimateSpeechDurationMs(fallbackText, playbackRate));
      return;
    }

    const shouldUseNativeAudio = audioUrl ? await canUseNativeAudio(audioUrl) : false;
    if (!shouldUseNativeAudio) {
      const fallbackText = textToSpeak || audioUrl || '';
      speakFallback(fallbackText, playbackRate);
      setIsPlaying(true);
      window.setTimeout(() => {
        setIsPlaying(false);
      }, estimateSpeechDurationMs(fallbackText, playbackRate));
      return;
    }

    const audio = audioInstanceRef.current || getCachedAudio(audioUrl!);
    audioInstanceRef.current = audio;

    // Stop currently playing if any
    if (currentlyPlaying) {
      try {
        currentlyPlaying.pause();
        currentlyPlaying.currentTime = 0;
      } catch (e) {
        console.warn(e);
      }
      if (currentSetter && currentSetter !== setIsPlaying) {
        currentSetter(false);
      }
    }

    try {
      audio.currentTime = 0;
      audio.playbackRate = playbackRate;
      
      // Set singleton setters before playing so that play starts atomically
      currentlyPlaying = audio;
      currentSetter = setIsPlaying;
      
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Direct HTMLAudio failed, utilizing synthesis fallback:", err);
      speakFallback(textToSpeak || audioUrl, playbackRate);
      setIsPlaying(true);
      currentSetter = setIsPlaying;
      
      // Simulated play duration for feedback
      window.setTimeout(() => {
        setIsPlaying(false);
      }, estimateSpeechDurationMs(textToSpeak || audioUrl, playbackRate));
    }
  }, [audioUrl, textToSpeak]);

  const stop = useCallback(() => {
    if (audioInstanceRef.current) {
      const audio = audioInstanceRef.current;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        console.warn(e);
      }
      setIsPlaying(false);
      setProgress(0);
      if (currentlyPlaying === audio) {
        currentlyPlaying = null;
        currentSetter = null;
      }
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  return { play, stop, isPlaying, progress };
}

let zombieMusInterval: any = null;

export function startZombieMusic() {
  if (getMuteState()) return;
  stopZombieMusic();
  
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    let step = 0;
    // Rhythmic retro drone frequencies: E2, G2, F#2, F2
    const notes = [82.41, 98.00, 92.50, 87.31]; 
    
    zombieMusInterval = setInterval(() => {
      if (getMuteState()) return;
      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(notes[step % notes.length], t);
        
        // Lowpass filter for heavy industrial sub bass feel
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, t);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.05); // low volume background drone
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.4);
        step++;
      } catch (err) {
        console.warn(err);
      }
    }, 450);
  } catch (e) {
    console.warn("Could not activate synthesized zombie music", e);
  }
}

export function stopZombieMusic() {
  if (zombieMusInterval) {
    clearInterval(zombieMusInterval);
    zombieMusInterval = null;
  }
}

export function playZombieKillSound() {
  if (getMuteState()) return;
  playSynthSound((ctx, t) => {
    // Fast laser retro blaster zap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.16);
    
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  });
}

export function playZombieDamageSound() {
  if (getMuteState()) return;
  playSynthSound((ctx, t) => {
    // Deep heavy cinematic low drone impact
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(110, t);
    osc1.frequency.linearRampToValueAtTime(55, t + 0.32);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(107, t);
    osc2.frequency.linearRampToValueAtTime(52, t + 0.32);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  });
}

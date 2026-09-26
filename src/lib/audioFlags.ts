/**
 * audioFlags.ts — pronunciation engine feature flags.
 *
 * USE_CUSTOM_AUDIO_API gates the hosted text-to-speech API. While it is off
 * (to save tokens), every 🔊, button falls back to the browser's native
 * Web Speech API (window.speechSynthesis) with a Kurdish (ku / kmr) →
 * Turkish (tr) → default voice preference chain.
 *
 * When set back to `true`, the original HTMLAudio / hosted-API playback path
 * in `src/features/audio/hooks/useAudio.ts` is used again.
 */
export const USE_CUSTOM_AUDIO_API = false;

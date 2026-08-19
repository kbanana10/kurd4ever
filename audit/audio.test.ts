import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Audio fallback chain', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('BUG: playAudioUrl onended assigns currentSetter=null instead of CALLING it -> isPlaying sticks', async () => {
    const src = await import('fs').then(fs => fs.readFileSync('src/features/audio/hooks/useAudio.ts','utf8'));
    const onendedBlock = src.split('audio.onended')[1].split('};')[0];
    console.log('onended block:', onendedBlock.trim());
    expect(onendedBlock).toContain('currentSetter(false)'); // FIXED
    // The correct code should call currentSetter(false) first.
    expect(onendedBlock.includes('currentSetter(false)')).toBe(true); // FIXED
  });

  it('speakFallback regex mangles the spoken text', async () => {
    // replicate: text.replace(/^.*\/|\.[^.]*$/g,'').replace(/_/g,' ').replace(/ku-/g,'')
    const clean = (text: string) => text.replace(/^.*\//, '').replace(/\.[^.]*$/g, '').replace(/_/g, ' ').replace(/ku-/g, '');
    const realClean = (text: string) => text.replace(/^.*\/|\.[^.]*$/g, '').replace(/_/g, ' ').replace(/ku-/g, '');
    for (const p of ['/audio/family/mother.mp3', '/audio/academic/biology/dna.mp3', '/audio/alphabet/c_cedilla.mp3']) {
      console.log(`${p}  ->  spoken as: "${realClean(p)}"`);
    }
    // It speaks the ENGLISH filename, not the Kurdish word
    expect(realClean('/audio/family/mother.mp3')).toBe('mother');
  });

  it('AudioButton passes no textToSpeak in most call sites', async () => {
    const fs = await import('fs');
    const btn = fs.readFileSync('src/features/audio/components/AudioButton.tsx','utf8');
    console.log('--- AudioButton.tsx ---\n' + btn);
  });
});

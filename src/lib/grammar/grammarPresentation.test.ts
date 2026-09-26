import { describe, it, expect } from 'vitest';
import {
  pickLocalized,
  optionLabel,
  optionDisplayMode,
  exerciseIconKey,
} from './grammarPresentation';

const trilingual = { en: 'house', ar: 'بيت', ku: 'mal' };

describe('pickLocalized (single-language UI resolution)', () => {
  it('returns Arabic for UI "ar"', () => {
    expect(pickLocalized(trilingual, 'ar')).toBe('بيت');
  });

  it('returns Kurdish for UI "ku"', () => {
    expect(pickLocalized(trilingual, 'ku')).toBe('mal');
  });

  it('returns English for UI "en"', () => {
    expect(pickLocalized(trilingual, 'en')).toBe('house');
  });
});

describe('optionLabel (chip label resolution)', () => {
  const option = { ku: 'mal', ar: 'بيت', en: 'house' };

  it('always shows Kurdish in target mode, for every UI language', () => {
    expect(optionLabel(option, 'ar', 'target')).toBe('mal');
    expect(optionLabel(option, 'ku', 'target')).toBe('mal');
    expect(optionLabel(option, 'en', 'target')).toBe('mal');
  });

  it('shows only the UI language in translation mode — never Kurdish', () => {
    expect(optionLabel(option, 'ar', 'translation')).toBe('بيت');
    expect(optionLabel(option, 'en', 'translation')).toBe('house');
    // UI Kurdish + translation mode resolves to Kurdish (the meaning IS Kurdish).
    expect(optionLabel(option, 'ku', 'translation')).toBe('mal');
  });

  it('translation mode never falls back to Kurdish for Arabic/English UI', () => {
    expect(optionLabel(option, 'ar', 'translation')).not.toBe('mal');
    expect(optionLabel(option, 'en', 'translation')).not.toBe('mal');
  });
});

describe('optionDisplayMode (which answer is taught vs translated)', () => {
  it('select_translation → to_arabic answers are the translation', () => {
    expect(optionDisplayMode('select_translation', 'to_arabic')).toBe('translation');
  });

  it('select_translation → to_kurdish answers are the Kurdish target', () => {
    expect(optionDisplayMode('select_translation', 'to_kurdish')).toBe('target');
  });

  it('select_translation without a direction defaults to translation', () => {
    expect(optionDisplayMode('select_translation', undefined)).toBe('translation');
  });

  it('all other exercise types always show the Kurdish target', () => {
    for (const type of ['listen_choose', 'complete_sentence', 'match_pairs', 'write_word', 'arrange_sentence'] as const) {
      expect(optionDisplayMode(type, undefined)).toBe('target');
      expect(optionDisplayMode(type, 'to_arabic')).toBe('target');
    }
  });
});

describe('exerciseIconKey (header icon mapping)', () => {
  it('uses the languages icon for select_translation (never headphones)', () => {
    expect(exerciseIconKey('select_translation')).toBe('languages');
    expect(exerciseIconKey('select_translation')).not.toBe('headphones');
  });

  it('keeps headphones only for listen_choose', () => {
    expect(exerciseIconKey('listen_choose')).toBe('headphones');
    for (const type of ['select_translation', 'complete_sentence', 'match_pairs', 'write_word', 'arrange_sentence'] as const) {
      expect(exerciseIconKey(type)).not.toBe('headphones');
    }
  });

  it('maps every exercise type to a distinct icon key', () => {
    const keys = [
      exerciseIconKey('select_translation'),
      exerciseIconKey('listen_choose'),
      exerciseIconKey('complete_sentence'),
      exerciseIconKey('match_pairs'),
      exerciseIconKey('write_word'),
      exerciseIconKey('arrange_sentence'),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

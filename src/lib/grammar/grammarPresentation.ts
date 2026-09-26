/**
 * grammarPresentation.ts — pure presentation helpers for the Grammar module.
 *
 * The lessons store trilingual data (EN/AR/KU) so the content is authored
 * once. These helpers resolve exactly which single language string to show for
 * a given UI language, implementing the rule:
 *
 *   - UI language = ar → questions, options and translations render in Arabic.
 *   - UI language = ku → Kurdish.
 *   - UI language = en → English.
 *   - EXCEPTION: the Kurdish term being taught (the answer target) is always
 *     shown as Kurdish — it is the thing the learner is learning, not a
 *     translation.
 *
 * Keeping this logic pure (no React) makes it unit-testable.
 */

import type { GrammarExerciseType, GrammarExerciseOption, LocalizedText } from '../../data/grammar/types';

export type UILang = 'ar' | 'ku' | 'en';

/** Pick the single language string for the current UI language. */
export function pickLocalized(text: LocalizedText, language: UILang): string {
  return language === 'ar' ? text.ar : language === 'ku' ? text.ku : text.en;
}

/**
 * The text to render inside an option chip.
 *  - 'target': the Kurdish word/sentence being taught → always Kurdish.
 *  - 'translation': the meaning → always the user's UI language (no Kurdish,
 *    so "choose the translation" answers cannot be guessed by visual matching).
 */
export function optionLabel(
  option: GrammarExerciseOption,
  language: UILang,
  mode: 'target' | 'translation'
): string {
  if (mode === 'target') return option.ku;
  return pickLocalized(option, language);
}

/** Answers the "which option is shown bare vs translated" question per type. */
export function optionDisplayMode(type: GrammarExerciseType, direction: 'to_arabic' | 'to_kurdish' | undefined): 'target' | 'translation' {
  if (type === 'select_translation') {
    // to_kurdish → the Kurdish word/sentence is the answer (shown bare).
    // to_arabic (or an unspecified direction) → show the meaning only, so the
    // Kurdish original can never be guessed by visual matching.
    return direction === 'to_kurdish' ? 'target' : 'translation';
  }
  // listen_choose and complete_sentence options are the Kurdish answers.
  return 'target';
}

/**
 * Icon key for the exercise-type badge. Only listen_choose maps to the
 * headphone icon; select_translation gets the languages icon, etc.
 */
export function exerciseIconKey(type: GrammarExerciseType): string {
  switch (type) {
    case 'select_translation':
      return 'languages';
    case 'listen_choose':
      return 'headphones';
    case 'complete_sentence':
      return 'pen';
    case 'match_pairs':
      return 'arrow-left-right';
    case 'write_word':
      return 'keyboard';
    case 'arrange_sentence':
      return 'list-ordered';
  }
}

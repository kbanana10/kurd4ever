/**
 * types.ts — shared domain types for the Grammar (Rêziman) module.
 *
 * Redesigned for beginners: content is authored as tappable **concept cards**,
 * not reference paragraphs. Every Kurdish string carries its own pronunciation
 * key for the app's AudioButton (SpeechSynthesis) plus AR (primary) and EN
 * (secondary) translations.
 *
 * Content-authoring rules (see VERIFICATION_NEEDED.md):
 *  - Kurmanji strings keep their diacritics (ç ê î ş û).
 *  - Every teachable claim is sourced; uncertain items are excluded or listed
 *    in VERIFICATION_NEEDED.md with a `TODO: verify with native speaker`.
 */

export interface LocalizedText {
  en: string;
  ar: string;
  ku: string;
}

/** Trilingual constructor; AR is the primary UI language, EN secondary. */
export function gl(en: string, ar: string, ku: string): LocalizedText {
  return { en, ar, ku };
}

/** A single Kurmanji example: text + translations + pronunciation key. */
export interface GrammarExample {
  /** Kurmanji sentence (keep diacritics). */
  ku: string;
  /** Optional semantic literal gloss (e.g. "I bread eat") — aids EN readers. */
  literal?: string;
  ar: string;
  en: string;
}

/**
 * One grammar point (e.g. the pronoun "Ez") as a beginner concept card:
 * the Kurdish term, AR/EN translations, 3-5 usage examples, a "when to use it"
 * note (AR primary) and the review/pronunciation keys.
 */
export interface GrammarConcept {
  id: string;
  /** Large Kurdish term shown on the card (with diacritics). */
  term: string;
  /** Pronunciation helper shown under the term (optional transliteration). */
  phonetic?: string;
  ar: string;
  en: string;
  /** AR-first "when to use it" note; EN shown smaller. */
  usage: LocalizedText;
  examples: GrammarExample[];
  /** Optional single-word alternatives / tails (e.g. verb stem info). */
  note?: LocalizedText;
}

export type GrammarExerciseType =
  | 'select_translation'
  | 'listen_choose'
  | 'complete_sentence'
  | 'match_pairs'
  | 'write_word'
  | 'arrange_sentence';

/** A single match row: Kurdish needle ↔ AR/EN gloss. AR is primary. */
export interface GrammarMatchPair {
  /** Kurmanji term (with diacritics). */
  ku: string;
  ar: string;
  en: string;
}

export type GrammarExerciseOption = {
  /** Exact Kurmanji value, used as the answer for listen/choose + chips. */
  ku: string;
  ar: string;
  en: string;
};

export interface GrammarExercise {
  /** Unique instance id within its lesson. */
  id: string;
  /** Stable SM-2 review-node id (deck key `grammar-<topicId>:<nodeId>`). */
  nodeId: string;
  type: GrammarExerciseType;
  /** Question/instruction text — localized, AR primary via the page. */
  prompt: LocalizedText;
  /**
   * Choice exercises: options (each with KU + AR gloss). The correct option is
   * the one whose `ku` matches `correctAnswer`.
   */
  options?: GrammarExerciseOption[];
  /** Canonical Kurmanji answer (choice → option.ku, write → expected text). */
  correctAnswer: string;
  /** Extra accepted spellings for write_word (diacritic-tolerant already). */
  variants?: string[];
  /**
   * Audio that plays for listen_choose / write_word / complete_sentence.
   * The app reads the Kurmanji text aloud; this key is that text.
   */
  audioText?: string;
  /** arrange_sentence: canonical token order (Kurmanji). */
  sentenceWords?: string[];
  /** Reference translation shown with every exercise (AR primary, EN smaller). */
  reference?: LocalizedText;
  /** match_pairs rows. */
  pairs?: GrammarMatchPair[];
  /**
   * complete_sentence / select_translation: Kurmanji sentence shown with the
   * blank as `___` (or the full term to translate).
   */
  display?: string;
  /** select_translation direction: pick the Arabic gloss or pick the Kurdish. */
  direction?: 'to_arabic' | 'to_kurdish';
}

export interface GrammarLesson {
  /** Route id, e.g. 'pronouns' (matches `/grammar/:lessonId`). */
  topicId: string;
  /** XP awarded (scaled by score) on completion. */
  xp: number;
  title: LocalizedText;
  description: LocalizedText;
  /** Concept cards — the Step 1 content, tapped through with progress dots. */
  concepts: GrammarConcept[];
  /**
   * Optional compact revision table (Step 4). Rows are always
   * [Kurmanji, Arabic (primary), English (secondary)]; the page decides the
   * exact column layout per UI language.
   */
  summaryTable?: {
    rows: { ku: string; ar: string; en: string }[];
  };
  exercises: GrammarExercise[];
}

/**
 * subjectAccents.ts
 *
 * Per-subject accent tokens for the Learning flow (Learning Hub → section
 * pages). Each value is a plain Tailwind utility string so every consumer
 * renders the exact same colour story without drifting.
 *
 * Two rules keep these honest against `src/index.css`:
 *   1. Named utilities that the Warm Heritage remap recolours (indigo/violet/
 *      purple text → gold, indigo fills → gold) are AVOIDED. Subject colours
 *      that would collide with the remap are expressed as arbitrary-value
 *      classes (e.g. `text-[#7C3AED]`), which the remap never matches.
 *   2. `sky` and `emerald` are safe named families and stay readable in both
 *      themes, so they are used directly.
 *
 * Mapping (fixed for the Learning Hub):
 *   Letters → gold · Numbers → sky · Colors → emerald
 *   Vocabulary → violet · Phrases → purple · Pronunciation (locked) → gray
 *   Grammar → teal · Writing → violet
 */

export type LearningSubject =
  | 'letters'
  | 'numbers'
  | 'colors'
  | 'vocabulary'
  | 'phrases'
  | 'pronunciation'
  | 'grammar'
  | 'writing';

export interface SubjectAccent {
  /** Icon-well tint (one string carrying light + dark variants). */
  well: string;
  /** Icon / accent text colour (one string carrying light + dark variants). */
  icon: string;
  /** Solid fill for small progress bars and indicator dots. */
  barFill: string;
  /** Start-border accent for a destination page's hero card. */
  heroBorder: string;
}

export const SUBJECT_ACCENTS = {
  letters: {
    well: 'bg-[#FFF3D6] dark:bg-[#3A2F14]',
    icon: 'text-[#D97706] dark:text-[#FFCE6B]',
    barFill: 'bg-[#F59E0B]',
    heroBorder: 'border-s-[#F59E0B] dark:border-s-[#FFBA38]',
  },
  numbers: {
    well: 'bg-sky-100 dark:bg-sky-950/40',
    icon: 'text-sky-600 dark:text-sky-400',
    barFill: 'bg-sky-500',
    heroBorder: 'border-s-sky-500 dark:border-s-sky-400',
  },
  colors: {
    well: 'bg-emerald-100 dark:bg-emerald-950/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    barFill: 'bg-emerald-500',
    heroBorder: 'border-s-emerald-500 dark:border-s-emerald-400',
  },
  vocabulary: {
    well: 'bg-[#EDE9FE] dark:bg-[#2E2447]',
    icon: 'text-[#7C3AED] dark:text-[#C4B5FD]',
    barFill: 'bg-[#7C3AED]',
    heroBorder: 'border-s-[#7C3AED] dark:border-s-[#A78BFA]',
  },
  phrases: {
    well: 'bg-[#F3E8FF] dark:bg-[#3B2560]',
    icon: 'text-[#9333EA] dark:text-[#D8B4FE]',
    barFill: 'bg-[#9333EA]',
    heroBorder: 'border-s-[#9333EA] dark:border-s-[#C084FC]',
  },
  pronunciation: {
    well: 'bg-slate-100 dark:bg-slate-800',
    icon: 'text-slate-400 dark:text-slate-500',
    barFill: 'bg-slate-400',
    heroBorder: 'border-s-slate-300 dark:border-s-slate-700',
  },
  grammar: {
    well: 'bg-teal-100 dark:bg-teal-950/40',
    icon: 'text-teal-600 dark:text-teal-400',
    barFill: 'bg-teal-500',
    heroBorder: 'border-s-teal-500 dark:border-s-teal-400',
  },
  writing: {
    well: 'bg-[#EDE9FE] dark:bg-[#2E2447]',
    icon: 'text-[#7C3AED] dark:text-[#C4B5FD]',
    barFill: 'bg-[#7C3AED]',
    heroBorder: 'border-s-[#7C3AED] dark:border-s-[#A78BFA]',
  },
} satisfies Record<LearningSubject, SubjectAccent>;

/**
 * Vocabulary categoryId → subject accent. Numbers and Colors are deep-linked
 * straight from the Learning Hub into the generic VocabularyList page, so that
 * page needs its hero to adopt the right subject colour for those two units.
 * Any other category keeps its default styling (returns null).
 */
export function categorySubjectAccent(categoryId?: string): SubjectAccent | null {
  if (categoryId === 'numbers') return SUBJECT_ACCENTS.numbers;
  if (categoryId === 'colors') return SUBJECT_ACCENTS.colors;
  return null;
}

/**
 * word.ts — shared learner-facing word contract (TODO-023 / F023).
 *
 * The app draws practice words from three structurally-similar datasets
 * (core vocabulary, academic vocabulary, CEFR lesson words). Before this
 * type existed, every consumer laundered them through `any[]`, which is how
 * shape drift reached runtime. `PracticeWord` is the honest intersection of
 * what consumers actually read; dataset-specific extras stay optional.
 */
export interface PracticeWord {
  id: string;
  ku: string;
  en: string;
  ar: string;
  emoji?: string;
  audio?: string;
  category?: string;
  categoryId?: string;
  subCategoryId?: string;
  level?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  exampleKu?: string;
  exampleEn?: string;
  exampleAr?: string;
}

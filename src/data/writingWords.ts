/**
 * writingWords.ts
 *
 * Word list for the Writing → Words section, organized by difficulty (true
 * Kurdish letter count). 2-letter starters through 5-letter challenge words.
 * Meanings are translations only — they are not audio keys or route ids.
 */

export interface WritingWord {
  id: string;
  en: string;
  ar: string;
  ku: string;
}

/**
 * Words are kept shortest-first (2 → 3 → 4 → 5 letters) so the grid can group
 * them into difficulty sections without re-sorting. `len` is the number of
 * Kurdish letters and doubles as the section key.
 */
export type WritingWordWithLength = WritingWord & { len: number };

/**
 * SECTION COUNTS → 25 words total:
 *   2 letters: Av, Ba, Rê
 *   3 letters: Erd, Roj, Jin, Nan, Sêv, Dar, Gol, Dil, Kur, Keç, Ewr
 *   4 letters: Berf, Dest, Stêr, Çiya, Agir, Heyv
 *   5 letters: Kûçik, Pisîk, Bahar, Hefte, Baran
 */
const WRITING_WORDS: WritingWordWithLength[] = [
  // 2 letters
  { id: 'av', en: 'Water', ar: 'ماء', ku: 'Av', len: 2 },
  { id: 'ba', en: 'Wind', ar: 'ريح', ku: 'Ba', len: 2 },
  { id: 're', en: 'Road', ar: 'طريق', ku: 'Rê', len: 2 },
  // 3 letters
  { id: 'erd', en: 'Earth', ar: 'أرض', ku: 'Erd', len: 3 },
  { id: 'roj', en: 'Day / Sun', ar: 'شمس', ku: 'Roj', len: 3 },
  { id: 'jin', en: 'Woman', ar: 'امرأة', ku: 'Jin', len: 3 },
  { id: 'nan', en: 'Bread', ar: 'خبز', ku: 'Nan', len: 3 },
  { id: 'sev', en: 'Apple', ar: 'تفاحة', ku: 'Sêv', len: 3 },
  { id: 'dar', en: 'Tree', ar: 'شجرة', ku: 'Dar', len: 3 },
  { id: 'gol', en: 'Rose', ar: 'وردة', ku: 'Gol', len: 3 },
  { id: 'dil', en: 'Heart', ar: 'قلب', ku: 'Dil', len: 3 },
  { id: 'kur', en: 'Boy', ar: 'ولد', ku: 'Kur', len: 3 },
  { id: 'kec', en: 'Girl', ar: 'بنت', ku: 'Keç', len: 3 },
  { id: 'ewr', en: 'Cloud', ar: 'غيمة', ku: 'Ewr', len: 3 },
  // 4 letters
  { id: 'berf', en: 'Snow', ar: 'ثلج', ku: 'Berf', len: 4 },
  { id: 'dest', en: 'Hand', ar: 'يد', ku: 'Dest', len: 4 },
  { id: 'ster', en: 'Star', ar: 'نجمة', ku: 'Stêr', len: 4 },
  { id: 'ciya', en: 'Mountain', ar: 'جبل', ku: 'Çiya', len: 4 },
  { id: 'agir', en: 'Fire', ar: 'نار', ku: 'Agir', len: 4 },
  { id: 'heyv', en: 'Moon', ar: 'قمر', ku: 'Heyv', len: 4 },
  // 5 letters (challenge)
  { id: 'kucik', en: 'Dog', ar: 'كلب', ku: 'Kûçik', len: 5 },
  { id: 'pisik', en: 'Cat', ar: 'قطة', ku: 'Pisîk', len: 5 },
  { id: 'bahar', en: 'Spring', ar: 'ربيع', ku: 'Bahar', len: 5 },
  { id: 'hefte', en: 'Week', ar: 'أسبوع', ku: 'Hefte', len: 5 },
  { id: 'baran', en: 'Rain', ar: 'مطر', ku: 'Baran', len: 5 },
];

export { WRITING_WORDS };

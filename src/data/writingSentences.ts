/**
 * writingSentences.ts
 *
 * Starter sentences for the Writing → Sentences section. Each sentence has a
 * Kurdish rendering plus English and Arabic translations for the tile and the
 * tracing-screen header. The tracing screen splits `ku` on spaces into per-word
 * lanes, so every word is validated individually with the same zone-based
 * engine used for letters and words.
 */

export interface WritingSentence {
  id: string;
  en: string;
  ar: string;
  ku: string;
}

const WRITING_SENTENCES: WritingSentence[] = [
  { id: 'roj-bas', en: 'Good day', ar: 'نهارك سعيد', ku: 'Roj baş' },
  { id: 'sev-bas', en: 'Good night', ar: 'ليلة سعيدة', ku: 'Şev baş' },
  { id: 'spas-dikim', en: 'Thank you', ar: 'شكراً لك', ku: 'Spas dikim' },
  { id: 'ez-bas-im', en: "I'm fine", ar: 'أنا بخير', ku: 'Ez baş im' },
  { id: 'tu-cawa-yi', en: 'How are you?', ar: 'كيف حالك؟', ku: 'Tu çawa yî?' },
];

export { WRITING_SENTENCES };

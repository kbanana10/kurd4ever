/**
 * contentAdapter.ts
 * 
 * Unified Data Adapter layer isolating UI components from raw data structures.
 * Combines normalized lemmas with backward-compatible legacy collections
 * and supports multi-facet filtering (CEFR level, Category, Search Query).
 */
import { VocabularyLemma, DialogueScript } from '../schemas/contentSchemas';
import { normalizedVocabularyLemmas } from '../normalized/vocabularyLemmas';
import { normalizedDialogues } from '../normalized/dialogues';

import { vocabulary as legacyVocab, sentences as legacySentences } from '../kurmanji';
import { academicVocabulary as legacyAcademic } from '../academic';
import { learningPath } from '../learningPath';

/**
 * AUDIT FIX: getAllVocabularyLemmas() rebuilt a ~450-entry Map from four source
 * collections on *every* call. Search calls it once per filter pass, i.e. on
 * every keystroke, so typing a 6-letter query re-materialised ~2,700 objects.
 * The catalogue is static for the lifetime of the page, so memoise it.
 */
let _lemmaCache: VocabularyLemma[] | null = null;



/**
 * Get all vocabulary lemmas combined and normalized (memoised)
 */
function getAllVocabularyLemmas(): VocabularyLemma[] {
  if (_lemmaCache) return _lemmaCache;
  const map = new Map<string, VocabularyLemma>();

  // Add primary normalized lemmas first
  normalizedVocabularyLemmas.forEach(lemma => {
    map.set(lemma.id, lemma);
  });

  // Adapter mapping for legacy general vocabulary
  legacyVocab.forEach(v => {
    if (!map.has(v.id)) {
      map.set(v.id, {
        id: v.id,
        lemmaKu: v.ku,
        partOfSpeech: 'noun',
        translations: { en: v.en, ar: v.ar },
        categoryId: v.categoryId,
        subCategoryId: v.subCategoryId,
        cefrLevel: 'A1',
        media: { audioUrl: v.audio, emoji: v.emoji },
        examples: [],
        tags: [v.categoryId, 'a1']
      });
    }
  });

  // Adapter mapping for legacy academic vocabulary
  legacyAcademic.forEach(a => {
    const lemmaId = `acad_${a.id}`;
    if (!map.has(lemmaId)) {
      map.set(lemmaId, {
        id: lemmaId,
        lemmaKu: a.ku,
        partOfSpeech: a.categoryId === 'actions' ? 'verb' : 'noun',
        translations: { en: a.en, ar: a.ar },
        categoryId: a.categoryId,
        cefrLevel: a.level === 'beginner' ? 'A1' : a.level === 'intermediate' ? 'A2' : 'B1',
        media: { audioUrl: a.audio },
        examples: a.exampleKu ? [{
          sentenceKu: a.exampleKu,
          translations: { en: a.exampleEn || a.en, ar: a.exampleAr || a.ar }
        }] : [],
        tags: ['academic', a.categoryId, a.level]
      });
    }
  });

  // Adapter mapping for learning path syllabus words
  learningPath.forEach(pathLevel => {
    // SAFETY: CEFR ids map 1:1 to the fixed learningPath titles; unknown titles fall to the final ternary branch.
    const cefr = (pathLevel.title === 'Beginner A1' ? 'A1' : pathLevel.title === 'Elementary A2' ? 'A2' : pathLevel.title === 'Intermediate B1' ? 'B1' : 'A1') as 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
    
    pathLevel.lessons.forEach(lesson => {
      lesson.words.forEach(w => {
        if (!map.has(w.id)) {
          map.set(w.id, {
            id: w.id,
            lemmaKu: w.ku,
            partOfSpeech: 'noun',
            translations: { en: w.en, ar: w.ar },
            categoryId: w.category || 'general',
            cefrLevel: cefr,
            media: { audioUrl: w.audio, emoji: '📖' },
            examples: [],
            tags: ['syllabus', cefr]
          });
        }
      });
    });
  });

  _lemmaCache = Array.from(map.values());
  return _lemmaCache;
}





/**
 * Search vocabulary with dynamic multi-facet filtering
 */
export interface SearchFilterOptions {
  query?: string;
  cefrLevel?: string; // 'A1' | 'A2' | 'B1' | 'B2' | 'All'
  categoryId?: string; // Category ID or 'all'
  partOfSpeech?: string; // 'noun' | 'verb' | 'adjective' | 'all'
  /** Cap the number of returned rows. Protects the UI from rendering the whole catalogue. */
  limit?: number;
}

export function searchVocabulary(options: SearchFilterOptions): VocabularyLemma[] {
  let list = getAllVocabularyLemmas();

  // CEFR level filter
  if (options.cefrLevel && options.cefrLevel !== 'All' && options.cefrLevel !== 'all') {
    list = list.filter(item => item.cefrLevel.toLowerCase() === options.cefrLevel?.toLowerCase());
  }

  // Category filter
  if (options.categoryId && options.categoryId !== 'All' && options.categoryId !== 'all') {
    list = list.filter(item => item.categoryId === options.categoryId);
  }

  // Part of speech filter
  if (options.partOfSpeech && options.partOfSpeech !== 'All' && options.partOfSpeech !== 'all') {
    list = list.filter(item => item.partOfSpeech === options.partOfSpeech);
  }

  // Text search query matching (Kurdish, English, or Arabic).
  // Diacritic-insensitive so "sev" also matches "Sêv" — Kurmanji learners
  // frequently type without the circumflexes.
  if (options.query && options.query.trim().length > 0) {
    const q = options.query.trim().toLowerCase();
    const qFold = foldKurmanji(q);
    list = list.filter(item => {
      const ku = item.lemmaKu.toLowerCase();
      const en = item.translations.en.toLowerCase();
      const ar = item.translations.ar;
      return (
        ku.includes(q) ||
        en.includes(q) ||
        ar.includes(q) ||
        foldKurmanji(ku).includes(qFold)
      );
    });

    // Rank exact and prefix matches above substring hits.
    list = [...list].sort((a, b) => scoreLemma(b, q) - scoreLemma(a, q));
  }

  if (options.limit && options.limit > 0 && list.length > options.limit) {
    return list.slice(0, options.limit);
  }

  return list;
}

/** Strip Kurmanji diacritics so typing ASCII still finds the lemma. */
function foldKurmanji(input: string): string {
  return input
    .replace(/[çÇ]/g, 'c')
    .replace(/[êÊ]/g, 'e')
    .replace(/[îÎ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ûÛ]/g, 'u');
}

/** Relevance score: exact > prefix > substring, Kurdish weighted above glosses. */
function scoreLemma(item: VocabularyLemma, q: string): number {
  const ku = item.lemmaKu.toLowerCase();
  const en = item.translations.en.toLowerCase();
  if (ku === q) return 100;
  if (en === q) return 90;
  if (ku.startsWith(q)) return 80;
  if (en.startsWith(q)) return 70;
  if (ku.includes(q)) return 40;
  if (en.includes(q)) return 30;
  return 10;
}




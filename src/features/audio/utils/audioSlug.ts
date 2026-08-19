/**
 * audioSlug.ts
 * 
 * Deterministic URL slug generation and audio path resolution for Kurdish words,
 * alphabet characters, sentences, and academic vocabulary.
 */

/**
 * Normalizes Kurdish (Hawar alphabet) string into a URL-safe lowercase filename slug.
 * Example: "Rojbaş" -> "rojbas", "Çawa yî?" -> "cawa_yi", "Êvar baş" -> "evar_bas"
 */
export function slugifyKurdish(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // decompose accents
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/ç/g, 'c')
    .replace(/ê/g, 'e')
    .replace(/î/g, 'i')
    .replace(/ş/g, 's')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'word';
}

/**
 * Derives a standardized, collision-free audio asset path based on content type and Kurdish lemma.
 */
export function deriveAudioPath(
  type: 'alphabet' | 'vocabulary' | 'sentences' | 'academic',
  kurdishText: string,
  categoryOrId?: string
): string {
  const slug = slugifyKurdish(kurdishText);

  switch (type) {
    case 'alphabet': {
      // e.g. /audio/alphabet/a.mp3 or /audio/alphabet/char_c_cedilla.mp3
      return `/audio/alphabet/${slug}.mp3`;
    }
    case 'vocabulary': {
      const cat = categoryOrId ? slugifyKurdish(categoryOrId) : 'general';
      return `/audio/vocabulary/${cat}/${slug}.mp3`;
    }
    case 'academic': {
      const cat = categoryOrId ? slugifyKurdish(categoryOrId) : 'general';
      return `/audio/academic/${cat}/${slug}.mp3`;
    }
    case 'sentences': {
      return `/audio/sentences/${slug}.mp3`;
    }
    default: {
      return `/audio/general/${slug}.mp3`;
    }
  }
}

/**
 * Checks if a text string looks like an audio asset file path rather than a spoken Kurdish lemma.
 */
export function isAudioPath(text: string): boolean {
  if (!text) return false;
  return text.startsWith('/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(text);
}

/**
 * contentSchemas.ts
 * 
 * Canonical schema definitions for normalized Kurmanji Quester content,
 * supporting vocabulary lemmas, interactive dialogues,
 * and roadmap exercise nodes.
 */

interface LocalizedText {
  en: string;
  ar: string;
}

interface VocabularyExample {
  sentenceKu: string;
  translations: LocalizedText;
  audioUrl?: string;
}

export interface VocabularyLemma {
  id: string;
  lemmaKu: string;
  ipa?: string; // Phonetic transcript e.g. "/ɑːv/"
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'phrase' | 'numeral';
  gender?: 'masculine' | 'feminine' | 'neutral';
  translations: LocalizedText;
  categoryId: string;
  subCategoryId?: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  media: {
    audioUrl: string;
    imageUrl?: string;
    emoji?: string;
  };
  examples: VocabularyExample[];
  tags: string[];
}

interface DialogueLine {
  id: string;
  speakerId: string;
  speakerName: LocalizedText;
  ku: string;
  translations: LocalizedText;
  audioUrl: string;
  genderContext?: 'M' | 'F';
}

export interface DialogueScript {
  id: string;
  title: LocalizedText;
  scenarioDescription: LocalizedText;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  lines: DialogueLine[];
}

interface ContentManifest {
  version: string;
  supportedLocales: string[];
  lastUpdated: string;
  totalLemmas: number;
  totalDialogues: number;
}

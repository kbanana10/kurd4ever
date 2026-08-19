import { LessonWord } from '../../data/learningPath';
import { PracticeWord } from '../../models/word';
import { Letter } from '../../data/kurmanji';

export interface Question {
  id: string; // unique question instance ID
  wordId?: string; // original backing lemma/word ID
  /** Backing word: a practice word (vocabulary/academic/lesson) or, for
   *  alphabet questions, the letter itself. Was `LessonWord | any` — the
   *  single widest type-safety hole in the quiz feature (TODO-023).
   *  Letters carry no `ku` lemma; the intersection keeps `.ku` access legal
   *  across the union as `string | undefined`. */
  word?: LessonWord | PracticeWord | (Letter & { ku?: string });
  question: string;
  prompt?: string;
  correctAnswer: string;
  options: string[];
  type: 'listen' | 'translate' | 'multiple_choice' | 'true_false' | 'emoji' | 'scrambled_letters' | 'sentence_reorder' | 'fill_blank';
  audio: string;
  category: string;
  scrambledLetters?: string[];
  sentenceWords?: string[];
  scrambledWords?: string[];
  fullSentence?: string;
  hintAr?: string;
  hintEn?: string;
}

export type QuizMode = 
  | 'multiple_choice' 
  | 'write_kurdish' 
  | 'emoji_match' 
  | 'true_false_challenge' 
  | 'mixed_challenge' 
  | 'listening' 
  | 'fill_blank' 
  | 'sentence_reorder' 
  | 'scrambled_letters' 
  | 'srs_review' 
  | 'review_due'
  /** Level-adaptive personalized practice: pool + difficulty derived from the
   *  user's unlocked CEFR levels and the words they have actually met. */
  | 'adaptive_practice';

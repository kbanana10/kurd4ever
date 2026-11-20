import React from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { Construction } from 'lucide-react';
import { SUBJECT_ACCENTS } from '../constants/subjectAccents';

/**
 * Grammar lesson placeholder. The Grammar hub's sub-category cards land here
 * instead of a real lesson: this screen is intentionally an empty state so the
 * navigation structure can be exercised without pretending content exists.
 */

// Human-readable labels for each planned sub-category, used only to describe
// the pending lesson in the empty state.
interface GrammarTopicName {
  en: string;
  ar: string;
  ku: string;
}

const GRAMMAR_TOPIC_NAME = {
  pronouns: { en: 'Pronouns', ar: 'الضمائر', ku: 'Cînavk' },
  verbs: { en: 'Verbs', ar: 'الأفعال', ku: 'Lêker' },
  nouns: { en: 'Nouns', ar: 'الأسماء', ku: 'Navdêr' },
  'sentence-structure': { en: 'Sentence Structure', ar: 'تركيب الجملة', ku: 'Hevoksazî' },
  prepositions: { en: 'Prepositions', ar: 'حروف الجر', ku: 'Daçek' },
} satisfies Record<string, GrammarTopicName>;

const ACCENT = SUBJECT_ACCENTS.grammar;

export function GrammarLessonPlaceholder() {
  const { language } = useAuth();
  const location = useLocation();
  // SAFETY: the final URL segment is an opaque string that may not match a
  // known topic; unknown values keep the default fallback label below.
  const id = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const topic = GRAMMAR_TOPIC_NAME[id];
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  return (
    <div className="min-h-[70dvh] flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-line-soft border-s-4 border-s-teal-500 dark:border-s-teal-400 rounded-[32px] p-8 shadow-flat flex flex-col items-center text-center gap-4">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${ACCENT.well}`} aria-hidden="true">
          <Construction className={`w-9 h-9 ${ACCENT.icon}`} />
        </div>

        <h3 className="text-xl font-black tracking-tight text-ink leading-snug">
          {isKu
            ? 'Ders di pêşketinê de ye'
            : isAr
              ? 'الدرس قيد التطوير'
              : 'Lesson Coming Soon'}
        </h3>

        <p className="text-muted text-[12px] leading-relaxed font-semibold">
          {topic
            ? isKu
              ? `Beşa "${topic.ku}" di pêşketinê de ye. Di nêzîk de vegere!`
              : isAr
                ? `قسم "${topic.ar}" قيد التطوير. عد قريباً!`
                : `The "${topic.en}" lessons are being prepared. Check back soon!`
            : isKu
              ? 'Ev ders di pêşketinê de ye. Di nêzîk de vegere!'
              : isAr
                ? 'هذا الدرس قيد التطوير. عد قريباً!'
                : 'This lesson is being prepared. Check back soon!'}
        </p>
      </div>
    </div>
  );
}

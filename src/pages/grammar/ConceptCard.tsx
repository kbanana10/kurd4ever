import React from 'react';
import { motion } from 'motion/react';
import { Lightbulb } from 'lucide-react';
import type { GrammarConcept, GrammarExample } from '../../data/grammar/types';
import { TriRow } from './TriRow';

interface ConceptCardProps {
  concept: GrammarConcept;
  language: string;
}

/**
 * Step 1: one tappable concept card.
 *  - The title area follows the same fixed 3-column geometry as the examples:
 *    Kurdish term (left) · audio button (center) · Arabic + English (right).
 *  - Every example row reuses <TriRow/>, so the audio button sits at the exact
 *    same horizontal center and the Arabic/English stack at the same right edge
 *    regardless of how long the Kurdish sentence is.
 *  - A one-line "when to use it" note (Arabic primary, English secondary).
 */
export function ConceptCard({ concept, language }: ConceptCardProps) {
  const isAr = language === 'ar';
  const noteHeading = isAr ? 'متى تُستخدم: ' : language === 'ku' ? 'Kengî tê bikaranîn: ' : 'When to use it: ';

  function exampleRow(example: GrammarExample, index: number) {
    return (
      <TriRow
        key={`${concept.id}-ex-${index}`}
        testId={`example-${index}`}
        ku={example.ku}
        ar={example.ar}
        en={example.en}
        audioText={example.ku}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-flat border border-line-soft relative overflow-hidden"
    >
      {/* Title area — same 3-column grid as the example rows. */}
      <TriRow
        testId="concept-title"
        ku={concept.term}
        ar={concept.ar}
        en={concept.en}
        audioText={concept.term}
        className="min-h-[64px]"
        kuClassName="text-[30px] font-black tracking-tight text-ink leading-none"
        arClassName="text-lg font-black text-ink leading-snug"
        enClassName="text-[13px] font-semibold text-muted leading-snug"
        audioIconClassName="w-5 h-5"
      />

      {concept.phonetic && (
        <div
          dir="ltr"
          className="mt-1.5 inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[12px] font-semibold text-muted"
        >
          {concept.phonetic}
        </div>
      )}

      {/* Examples */}
      <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-1.5">
        <span className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1">
          {isAr ? 'أمثلة' : language === 'ku' ? 'Nimûne' : 'Examples'}
        </span>
        <div className="space-y-1">{concept.examples.map(exampleRow)}</div>
      </div>

      {/* When to use it — Arabic primary */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 p-3.5">
        <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold leading-relaxed text-slate-800 dark:text-slate-100">
            <span className="font-black text-teal-700 dark:text-teal-300">{noteHeading}</span>
            {isAr ? concept.usage.ar : concept.usage.en}
          </p>
          {!isAr && (
            <p className="text-[11px] font-medium leading-relaxed text-muted">{concept.usage.ar}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

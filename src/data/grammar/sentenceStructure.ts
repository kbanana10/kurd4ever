/**
 * sentenceStructure.ts — Grammar Lesson 4: Sentence Structure (Hevoksazî).
 *
 * Concept cards: SOV order, the final verb, negation, "to be" sentences.
 *
 * Verified (>= 2 sources, see VERIFICATION_NEEDED.md):
 *  - SOV word order — Thackston (languagesgulper summary); kuwiki/kurdi101.
 *  - "Ez nan dixwim" and "Ez nan naxwim" — Apertium kmr-eng tests; CeLCAR.
 */

import type { GrammarLesson } from './types';
import { concept, ex, opt, q, lesson } from './helpers';

const sovConcept = concept({
  id: 'sent-sov',
  term: 'Ez nan dixwim',
  ar: 'آكل الخبز (فاعل + مفعول + فعل)',
  en: 'I eat bread (Subject–Object–Verb)',
  usageAr: 'الترتيب الكردي هو: الفاعل ثم المفعول ثم الفعل في النهاية.',
  usageEn: 'Kurdish order is Subject–Object–Verb: the verb comes last.',
  usageKu: 'Rêz: kirde + tebat + lêker (li dawiyê).',
  examples: [
    ex('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
    ex('Tu avê vedixwî', 'أنتَ تشرب الماء', 'You drink water'),
    ex('Ew sêvê dixwe', 'هو يأكل التفاحة', 'He eats the apple'),
    ex('Em kurdî diaxivin', 'نحن نتكلّم الكردية', 'We speak Kurdish'),
    ex('Hûn pirtûkê dixwînin', 'أنتم تقرؤون الكتاب', 'You read the book'),
  ],
});

const verbLastConcept = concept({
  id: 'sent-verb-last',
  term: 'Ez li dibistanê dixwînim',
  ar: 'أدرس في المدرسة',
  en: 'I study at school',
  usageAr: 'شبه الجملة (المكان) تأتي قبل الفعل، ويبقى الفعل في آخر الجملة.',
  usageEn: 'Place phrases come before the verb; the verb stays last.',
  usageKu: 'Komika cihî berî lêkerê ye; lêker li dawiyê ye.',
  examples: [
    ex('Ez li dibistanê dixwînim', 'أنا أدرس في المدرسة', 'I study at school'),
    ex('Ew li malê dixwe', 'هو يأكل في البيت', 'He eats at home'),
    ex('Em li bazarê dikirin', 'نحن نشتري في السوق', 'We shop at the market'),
    ex('Tu li Amedê dijî', 'أنتَ تعيش في آمد', 'You live in Amed'),
  ],
});

const negConcept = concept({
  id: 'sent-negation',
  term: 'Ez nan naxwim',
  ar: 'لا آكل الخبز (النفي)',
  en: "I don't eat bread (negation)",
  usageAr: 'النفي يوضع على الفعل نفسه (na- في أول الفعل): naxwim = لا آكل.',
  usageEn: 'Negation goes on the verb itself (na- prefix): naxwim = don’t eat.',
  usageKu: 'Neyînî li ser lêkerê ye: naxwim.',
  examples: [
    ex('Ez nan naxwim', 'أنا لا آكل الخبز', "I don't eat bread"),
    ex('Tu av venaxwî', 'أنتَ لا تشرب الماء', "You don't drink water"),
    ex('Ew kurdî nizane', 'هو لا يعرف الكردية', "He doesn't know Kurdish"),
    ex('Em naçin dibistanê', 'نحن لا نذهب إلى المدرسة', "We don't go to school"),
  ],
});

const toBeConcept = concept({
  id: 'sent-to-be',
  term: 'Ez mamoste me',
  ar: 'أنا معلّم (جملة الكينونة)',
  en: 'I am a teacher (to be)',
  usageAr: 'مع «يكون» نضع الخبر بعد المبتدأ مباشرة: Ez mamoste me.',
  usageEn: 'With "to be", the description follows the subject directly: Ez mamoste me.',
  usageKu: 'Bi «bûn»ê re nîşane piştî kirdeyê ye: Ez mamoste me.',
  examples: [
    ex('Ez mamoste me', 'أنا معلّم', 'I am a teacher'),
    ex('Tu şagirt î', 'أنتَ طالب', 'You are a student'),
    ex('Ew bijîşk e', 'هو طبيب', 'He is a doctor'),
    ex('Em kurd in', 'نحن أكراد', 'We are Kurds'),
    ex('Ew mal mezin e', 'ذلك البيت كبير', 'That house is big'),
  ],
});

function sentenceExercises(): ReturnType<typeof q>[] {
  return [
    // comprehension
    q({
      id: 's-q1', node: 'cmp-sov', type: 'select_translation', direction: 'to_arabic', display: 'Ez nan dixwim',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
        opt('Nan ez dixwim', 'الخبز أنا آكل', 'Bread I eat'),
        opt('Ez dixwim nan', 'أنا آكل الخبز (ترتيب خاطئ)', 'I eat bread (wrong order)'),
        opt('Dixwim ez nan', '(ترتيب خاطئ)', '(wrong order)'),
      ],
      correct: 'Ez nan dixwim',
    }),
    q({
      id: 's-q2', node: 'cmp-neg', type: 'select_translation', direction: 'to_arabic', display: 'Ez nan naxwim',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ez nan naxwim', 'أنا لا آكل الخبز', "I don't eat bread"),
        opt('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
        opt('Nan ez naxwim', 'الخبز أنا لا آكل', 'Bread I don’t eat'),
        opt('Ez naxwim nan', '(ترتيب خاطئ)', '(wrong order)'),
      ],
      correct: 'Ez nan naxwim',
    }),
    q({
      id: 's-q3', node: 'cmp-verb', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'Where does the verb go in a Kurdish sentence?', ar: 'أين يوضع الفعل في الجملة الكردية؟', ku: 'Lêker li ku ye?' },
      options: [
        opt('di dawiyê de', 'في النهاية', 'at the end'),
        opt('di destpêkê de', 'في البداية', 'at the start'),
        opt('di nîvê de', 'في الوسط', 'in the middle'),
        opt('her cihê', 'في أي مكان', 'anywhere'),
      ],
      correct: 'di dawiyê de',
    }),
    q({
      id: 's-q4', node: 'cmp-av', type: 'select_translation', direction: 'to_arabic', display: 'Tu avê vedixwî',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Tu avê vedixwî', 'أنتَ تشرب الماء', 'You drink water'),
        opt('Ez avê vedixwim', 'أنا أشرب الماء', 'I drink water'),
        opt('Ew avê vedixwe', 'هو يشرب الماء', 'He drinks water'),
        opt('Em avê vedixwin', 'نحن نشرب الماء', 'We drink water'),
      ],
      correct: 'Tu avê vedixwî',
    }),

    // production
    q({
      id: 's-q5', node: 'prd-nan', type: 'arrange_sentence', sentenceWords: ['Ez', 'nan', 'dixwim'],
      prompt: { en: 'Arrange: I eat bread.', ar: 'رتّب: أنا آكل الخبز.', ku: 'Sererast bike: Ez nan dixwim.' },
      reference: { en: 'I eat bread', ar: 'أنا آكل الخبز', ku: 'Ez nan dixwim' },
      correct: 'Ez nan dixwim',
    }),
    q({
      id: 's-q6', node: 'prd-neg', type: 'arrange_sentence', sentenceWords: ['Ez', 'nan', 'naxwim'],
      prompt: { en: 'Arrange: I don’t eat bread.', ar: 'رتّب: أنا لا آكل الخبز.', ku: 'Sererast bike: Ez nan naxwim.' },
      reference: { en: "I don't eat bread", ar: 'أنا لا آكل الخبز', ku: 'Ez nan naxwim' },
      correct: 'Ez nan naxwim',
    }),
    q({
      id: 's-q7', node: 'prd-naxwim', type: 'write_word', audioText: 'Ez nan naxwim',
      prompt: { en: 'Listen and write “I don’t eat bread”.', ar: 'اسمع 🔊 ثم اكتب «أنا لا آكل الخبز».', ku: 'Guhdarî bike û «Ez nan naxwim» binivîse.' },
      reference: { en: "I don't eat bread", ar: 'أنا لا آكل الخبز', ku: 'Ez nan naxwim' },
      correct: 'ez nan naxwim',
    }),
    q({
      id: 's-q8', node: 'prd-mamoste', type: 'complete_sentence', display: 'Ez ___ me',
      prompt: { en: 'Complete with the right word: I am a teacher.', ar: 'أكمل: أنا معلّم.', ku: 'Temam bike: Ez ___ me.' },
      reference: { en: 'I am a teacher', ar: 'أنا معلّم', ku: 'Ez mamoste me' },
      options: [opt('mamoste', 'معلّم', 'teacher'), opt('şagirt', 'طالب', 'student'), opt('bijîşk', 'طبيب', 'doctor'), opt('kurd', 'كردي', 'Kurd')],
      correct: 'mamoste',
    }),
    q({
      id: 's-q9', node: 'prd-av', type: 'write_word', audioText: 'Ez avê vedixwim',
      prompt: { en: 'Listen and write “I drink water”.', ar: 'اسمع 🔊 ثم اكتب «أنا أشرب الماء».', ku: 'Guhdarî bike û «Ez avê vedixwim» binivîse.' },
      reference: { en: 'I drink water', ar: 'أنا أشرب الماء', ku: 'Ez avê vedixwim' },
      correct: 'ez avê vedixwim',
      variants: ['ez ave vedixwim'],
    }),
  ];
}

export const sentenceStructureLesson: GrammarLesson = lesson({
  topicId: 'sentence-structure',
  xp: 60,
  title: { en: 'Sentence Structure', ar: 'تركيب الجملة', ku: 'Hevoksazî' },
  description: {
    en: 'The Subject–Object–Verb order and how negation fits in.',
    ar: 'ترتيب الفاعل–المفعول–الفعل وكيف يدخل النفي.',
    ku: 'Rêza kirde–tebat–lêker û cihê neyîniyê.',
  },
  concepts: [sovConcept, verbLastConcept, negConcept, toBeConcept],
  summary: {
    rows: [
      { ku: 'Ez nan dixwim', ar: 'أنا آكل الخبز', en: 'I eat bread' },
      { ku: 'Ez nan naxwim', ar: 'أنا لا آكل الخبز', en: "I don't eat bread" },
      { ku: 'Tu avê vedixwî', ar: 'أنتَ تشرب الماء', en: 'You drink water' },
      { ku: 'Ez mamoste me', ar: 'أنا معلّم', en: 'I am a teacher' },
    ],
  },
  exercises: sentenceExercises(),
});

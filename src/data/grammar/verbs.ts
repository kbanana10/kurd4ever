/**
 * verbs.ts — Grammar Lesson 2: Verbs (Lêker).
 *
 * Concept cards: infinitive, present (di-), negation (na-), simple past
 * (ergative). Each card has Kurdish + audio + AR (primary) + EN (secondary) +
 * 3–5 examples + an Arabic "when to use" note.
 *
 * Verified (>= 2 sources, see VERIFICATION_NEEDED.md):
 *  - Infinitives in -in: kirin, çûn, xwarin, dîtin — CeLCAR (snippet 30).
 *  - Present = di- + present stem + ending: ez dikim, tu dikî, ew dike… —
 *    kurdishlessons; Thackston §14.
 *  - Negation na-: ez nakim, ez naxwim — kurdishlessons; Apertium
 *    ("Ez … naxwim"); Thackston (stress section: náçim).
 *  - Ergative simple past: min kir, te kir, wî kir, wê kir… — Thackston §18.2.
 *  - "Ez avê vedixwim" (av = feminine → oblique -ê) — glosbe/Wiktionary;
 *    "Ez nan dixwim" (nan = masculine → unchanged) — Thackston §1.2.
 */

import type { GrammarLesson } from './types';
import { concept, ex, opt, pair, q, lesson } from './helpers';

const infConcept = concept({
  id: 'verb-infinitive',
  term: 'kirin',
  phonetic: 'ـين = المصدر',
  ar: 'يفعل (المصدر)',
  en: 'to do / to make',
  usageAr: 'المصدر ينتهي عادة بـ -in، وهو شكل الفعل الذي تجده في القاموس.',
  usageEn: 'The infinitive usually ends in -in; it is the dictionary form you find.',
  usageKu: 'Mesder bi gelemperî bi -in bi dawî dibe.',
  examples: [
    ex('kirin', 'يفعل', 'to do / make'),
    ex('çûn', 'يذهب', 'to go'),
    ex('xwarin', 'يأكل', 'to eat'),
    ex('dîtin', 'يرى', 'to see'),
    ex('axaftin', 'يتكلّم', 'to speak'),
  ],
});

const presentConcept = concept({
  id: 'verb-present',
  term: 'Ez dikim',
  ar: 'أنا أفعل (المضارع)',
  en: 'I do (present)',
  usageAr: 'للمضارع نأخذ جذر المضارع ونضيف di- في أوله ولاحقة الفاعل في آخره.',
  usageEn: 'The present = di- + present stem + personal ending.',
  usageKu: 'Dema niha: di- + stûna niha + paşgira kesane.',
  examples: [
    ex('Ez dikim', 'أنا أفعل', 'I do'),
    ex('Tu dikî', 'أنتَ تفعل', 'You do'),
    ex('Ew dike', 'هو يفعل', 'He does'),
    ex('Em dikin', 'نحن نفعل', 'We do'),
    ex('Hûn dikin', 'أنتم تفعلون', 'You do (pl)'),
  ],
});

const eatConcept = concept({
  id: 'verb-eat',
  term: 'Ez dixwim',
  ar: 'أنا آكل',
  en: 'I eat',
  usageAr: '«xwarin» = يأكل؛ مضارعه «dixwـ»: أقول Ez nan dixwim (أنا آكل الخبز).',
  usageEn: 'xwarin = to eat; present stem -xw- → Ez nan dixwim (I eat bread).',
  usageKu: 'xwarin: stûna niha -xw- → Ez nan dixwim.',
  examples: [
    ex('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
    ex('Tu sêvê dixwî', 'أنتَ تأكل التفاحة', 'You eat the apple'),
    ex('Ew goşt naxwe', 'هو لا يأكل اللحم', "He doesn't eat meat"),
    ex('Em taştê dixwin', 'نحن نأكل الفطور', 'We eat breakfast'),
    ex('Ez avê vedixwim', 'أنا أشرب الماء', 'I drink water'),
  ],
});

const negConcept = concept({
  id: 'verb-negation',
  term: 'Ez nakim',
  ar: 'أنا لا أفعل (النفي)',
  en: "I don't do (negation)",
  usageAr: 'للنفي نستبدل di- بـ na-: Ez nakim، Ez naxwim، Ew nake.',
  usageEn: 'Negation replaces di- with na-: Ez nakim, Ez naxwim, Ew nake.',
  usageKu: 'Neyînî: na- cihê di- digire.',
  examples: [
    ex('Ez nakim', 'أنا لا أفعل', "I don't do"),
    ex('Tu nakî', 'أنتَ لا تفعل', "You don't do"),
    ex('Ew nake', 'هو لا يفعل', "He doesn't do"),
    ex('Ez nan naxwim', 'أنا لا آكل الخبز', "I don't eat bread"),
    ex('Ez av venaxwim', 'أنا لا أشرب الماء', "I don't drink water"),
  ],
});

const pastConcept = concept({
  id: 'verb-past',
  term: 'Min kir',
  ar: 'فعلتُ (الماضي البسيط)',
  en: 'I did (simple past)',
  usageAr: 'في ماضي الفعل المتعدّي نضع الفاعل بصيغة الميل: Min kir (فعلتُ)، Wî kir (فعلَ).',
  usageEn: 'In the transitive past the doer is oblique: Min kir (I did), Wî kir (he did).',
  usageKu: 'Di dema borî ya têper de kirde tewandî ye: Min kir, Wî kir.',
  examples: [
    ex('Min kir', 'فعلتُ', 'I did'),
    ex('Te kir', 'فعلتَ', 'You did'),
    ex('Wî kir', 'فعلَ (هو)', 'He did'),
    ex('Wê kir', 'فعلتْ (هي)', 'She did'),
    ex('Wan kir', 'فعلوا', 'They did'),
  ],
});

function verbExercises(): ReturnType<typeof q>[] {
  return [
    // comprehension
    q({
      id: 'v-q1', node: 'cmp-infinitive', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'Which word means “to do”?', ar: 'أي كلمة تعني «يفعل»؟', ku: 'Kîjan peyv wateya «kirin»ê dide?' },
      options: [opt('kirin', 'يفعل', 'to do'), opt('çûn', 'يذهب', 'to go'), opt('dîtin', 'يرى', 'to see'), opt('xwarin', 'يأكل', 'to eat')],
      correct: 'kirin',
    }),
    q({
      id: 'v-q2', node: 'cmp-present', type: 'select_translation', direction: 'to_arabic', display: 'Ez dikim',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ez dikim', 'أنا أفعل', 'I do'),
        opt('Tu dikî', 'أنتَ تفعل', 'You do'),
        opt('Ew dike', 'هو يفعل', 'He does'),
        opt('Em dikin', 'نحن نفعل', 'We do'),
      ],
      correct: 'Ez dikim',
    }),
    q({
      id: 'v-q3', node: 'cmp-eat', type: 'select_translation', direction: 'to_arabic', display: 'Ew sêvê dixwe',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ew sêvê dixwe', 'هو يأكل التفاحة', 'He eats the apple'),
        opt('Ez sêvê dixwim', 'أنا آكل التفاحة', 'I eat the apple'),
        opt('Tu sêvê dixwî', 'أنتَ تأكل التفاحة', 'You eat the apple'),
        opt('Em sêvê dixwin', 'نحن نأكل التفاحة', 'We eat the apple'),
      ],
      correct: 'Ew sêvê dixwe',
    }),
    q({
      id: 'v-q4', node: 'cmp-neg', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'How do you say “I don’t eat bread”?', ar: 'كيف تقول «أنا لا آكل الخبز»؟', ku: 'Tu çawa dibêjî «Ez nan naxwim»?' },
      options: [
        opt('Ez nan naxwim', 'أنا لا آكل الخبز', "I don't eat bread"),
        opt('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
        opt('Tu nan dixwî', 'أنتَ تأكل الخبز', 'You eat bread'),
        opt('Em nan dixwin', 'نحن نأكل الخبز', 'We eat bread'),
      ],
      correct: 'Ez nan naxwim',
    }),
    q({
      id: 'v-q5', node: 'cmp-past', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'How do you say “I did”?', ar: 'كيف تقول «فعلتُ»؟', ku: 'Tu çawa dibêjî «Min kir»?' },
      options: [
        opt('Min kir', 'فعلتُ', 'I did'),
        opt('Te kir', 'فعلتَ', 'You did'),
        opt('Wî kir', 'فعلَ', 'He did'),
        opt('Wan kir', 'فعلوا', 'They did'),
      ],
      correct: 'Min kir',
    }),

    // production
    q({
      id: 'v-q6', node: 'prd-dikim', type: 'write_word', audioText: 'Ez dikim',
      prompt: { en: 'Listen and write “I do”.', ar: 'اسمع 🔊 ثم اكتب «أنا أفعل».', ku: 'Guhdarî bike û «Ez dikim» binivîse.' },
      reference: { en: 'I do', ar: 'أنا أفعل', ku: 'Ez dikim' },
      correct: 'ez dikim',
    }),
    q({
      id: 'v-q7', node: 'prd-dixwim', type: 'write_word', audioText: 'Ez dixwim',
      prompt: { en: 'Listen and write “I eat”.', ar: 'اسمع 🔊 ثم اكتب «أنا آكل».', ku: 'Guhdarî bike û «Ez dixwim» binivîse.' },
      reference: { en: 'I eat', ar: 'أنا آكل', ku: 'Ez dixwim' },
      correct: 'ez dixwim',
    }),
    q({
      id: 'v-q8', node: 'prd-naxwim', type: 'write_word', audioText: 'Ez naxwim',
      prompt: { en: 'Listen and write “I don’t eat”.', ar: 'اسمع 🔊 ثم اكتب «أنا لا آكل».', ku: 'Guhdarî bike û «Ez naxwim» binivîse.' },
      reference: { en: "I don't eat", ar: 'أنا لا آكل', ku: 'Ez naxwim' },
      correct: 'ez naxwim',
    }),
    q({
      id: 'v-q9', node: 'prd-kir', type: 'write_word', audioText: 'Min kir',
      prompt: { en: 'Listen and write “I did”.', ar: 'اسمع 🔊 ثم اكتب «فعلتُ».', ku: 'Guhdarî bike û «Min kir» binivîse.' },
      reference: { en: 'I did', ar: 'فعلتُ', ku: 'Min kir' },
      correct: 'min kir',
    }),
    q({
      id: 'v-q10', node: 'prd-arrange', type: 'arrange_sentence', sentenceWords: ['Ez', 'nan', 'naxwim'],
      prompt: { en: 'Arrange: I don’t eat bread.', ar: 'رتّب: أنا لا آكل الخبز.', ku: 'Sererast bike: Ez nan naxwim.' },
      reference: { en: "I don't eat bread", ar: 'أنا لا آكل الخبز', ku: 'Ez nan naxwim' },
      correct: 'Ez nan naxwim',
    }),
    q({
      id: 'v-q11', node: 'prd-match', type: 'match_pairs',
      prompt: { en: 'Match the verb forms.', ar: 'طابِق صيَغ الفعل.', ku: 'Formên lêkerê bigihîne.' },
      pairs: [
        pair('kirin', 'يفعل', 'to do'),
        pair('Ez dikim', 'أنا أفعل', 'I do'),
        pair('Ez naxwim', 'أنا لا آكل', "I don't eat"),
        pair('Min kir', 'فعلتُ', 'I did'),
      ],
      correct: 'kirin=يفعل / Ez dikim=أنا أفعل / Ez naxwim=أنا لا آكل / Min kir=فعلتُ',
    }),
    q({
      id: 'v-q12', node: 'cmp-drink', type: 'complete_sentence', display: 'Ez avê ___',
      prompt: { en: 'Complete: I drink water.', ar: 'أكمل: أنا أشرب الماء.', ku: 'Temam bike: Ez avê ___.' },
      reference: { en: 'I drink water', ar: 'أنا أشرب الماء', ku: 'Ez avê vedixwim' },
      options: [opt('vedixwim', 'أشرب', 'I drink'), opt('dixwim', 'آكل', 'I eat'), opt('naxwim', 'لا آكل', "I don't eat"), opt('dikim', 'أفعل', 'I do')],
      correct: 'vedixwim',
    }),
  ];
}

export const verbsLesson: GrammarLesson = lesson({
  topicId: 'verbs',
  xp: 60,
  title: { en: 'Verbs', ar: 'الأفعال', ku: 'Lêker' },
  description: {
    en: 'The infinitive, the present tense, negation and the simple past.',
    ar: 'المصدر والمضارع والنفي والماضي البسيط.',
    ku: 'Mesder, dema niha, neyînî û dema borî.',
  },
  concepts: [infConcept, presentConcept, eatConcept, negConcept, pastConcept],
  summary: {
    rows: [
      { ku: 'kirin · çûn · xwarin', ar: 'يفعل · يذهب · يأكل', en: 'do · go · eat' },
      { ku: 'Ez dikim', ar: 'أنا أفعل', en: 'I do' },
      { ku: 'Ez dixwim', ar: 'أنا آكل', en: 'I eat' },
      { ku: 'Ez nakim', ar: 'أنا لا أفعل', en: "I don't do" },
      { ku: 'Ez naxwim', ar: 'أنا لا آكل', en: "I don't eat" },
      { ku: 'Min kir', ar: 'فعلتُ', en: 'I did' },
    ],
  },
  exercises: verbExercises(),
});

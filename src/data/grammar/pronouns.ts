/**
 * pronouns.ts — Grammar Lesson 1: Pronouns (Cînavk).
 *
 * Redesigned as beginner **concept cards**: each card has a large Kurdish term
 * (with diacritics), an audio lane (SpeechSynthesis via the term text), the
 * Arabic translation (primary), the English translation (secondary), 3–5 real
 * example sentences (each with audio + AR + EN) and a one-line Arabic
 * "when to use it" note.
 *
 * Verified content (>= 2 sources, see VERIFICATION_NEEDED.md):
 *  - Personal pronouns ez/tu/ew/em/hûn + copula im/yî/e/in/in — Thackston §7/§11;
 *    CeLCAR (Indiana) Kurmanji Grammar.
 *  - Possessives min/te/wî/wê/me/we/wan via the construct: navê min, mala min,
 *    hevalên min — Thackston §4/§7; CeLCAR ("Navê wê Eyşan e").
 *  - Oblique after "li"/"ji": li malê, ji Amedê — Thackston §7/§8; kurdishlessons.
 *
 * Scope (beginner): past copula "bû" and wî/wê as direct objects are deferred.
 */

import type { GrammarLesson } from './types';
import { concept, ex, opt, pair, q, lesson } from './helpers';

const ez = concept({
  id: 'pronoun-ez',
  term: 'Ez',
  ar: 'أنا',
  en: 'I',
  usageAr: 'للتحدّث عن نفسك (المتكلّم المفرد).',
  usageEn: 'Use it to talk about yourself (1st person singular).',
  usageKu: 'Ji bo axaftina li ser xwe (kesê yekem ê yekjimar).',
  examples: [
    ex('Ez kurd im', 'أنا كردي', 'I am Kurdish'),
    ex('Ez li malê me', 'أنا في البيت', 'I am at home'),
    ex('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
    ex('Ez ji Amedê me', 'أنا من آمد (ديار بكر)', 'I am from Amed (Diyarbakır)'),
    ex('Ez mamoste me', 'أنا معلّم', 'I am a teacher'),
  ],
});

const tu = concept({
  id: 'pronoun-tu',
  term: 'Tu',
  ar: 'أنتَ / أنتِ',
  en: 'you (singular)',
  usageAr: 'لمخاطبة شخص واحد تعرفه (المخاطَب المفرد).',
  usageEn: 'Use it to address one person you know (2nd person singular).',
  usageKu: 'Ji bo axaftina bi kesekî re (kesê duyem ê yekjimar).',
  examples: [
    ex('Tu kurd î', 'أنتَ كردي', 'You are Kurdish'),
    ex('Tu li malê yî', 'أنتَ في البيت', 'You are at home'),
    ex('Tu nan dixwî', 'أنتَ تأكل الخبز', 'You eat bread'),
    ex('Tu ji ku yî?', 'من أين أنتَ؟', 'Where are you from?'),
    ex('Tu bi xêr hatî', 'مرحباً بك (رجل)', 'Welcome (to a man)'),
  ],
});

const ew = concept({
  id: 'pronoun-ew',
  term: 'Ew',
  ar: 'هو / هي',
  en: 'he / she / it',
  usageAr: 'للغائب المفرد؛ الكلمة نفسها تُستخدم للمذكّر والمؤنّث، والسياق يحدّد.',
  usageEn: 'For the 3rd person singular; the same word is masculine/feminine — context decides.',
  usageKu: 'Ji bo kesê sêyem ê yekjimar; heman peyv ji bo nêr û mê ye.',
  examples: [
    ex('Ew kurd e', 'هو كردي', 'He is Kurdish'),
    ex('Ew nan dixwe', 'هو يأكل الخبز', 'He eats bread'),
    ex('Ew li dibistanê ye', 'هو في المدرسة', 'He is at school'),
    ex('Ew ji Amedê ye', 'هو من آمد', 'He is from Amed'),
    ex('Ew mamoste ye', 'هو معلّم', 'He is a teacher'),
  ],
});

const em = concept({
  id: 'pronoun-em',
  term: 'Em',
  ar: 'نحن',
  en: 'we',
  usageAr: 'للتحدّث عن مجموعة تضمّك أنت (المتكلّم الجمع).',
  usageEn: 'For a group that includes yourself (1st person plural).',
  usageKu: 'Ji bo komekê ku tu tê de yî (kesê yekem ê pirjimar).',
  examples: [
    ex('Em kurd in', 'نحن أكراد', 'We are Kurds'),
    ex('Em li malê ne', 'نحن في البيت', 'We are at home'),
    ex('Em nan dixwin', 'نحن نأكل الخبز', 'We eat bread'),
    ex('Em ji Amedê ne', 'نحن من آمد', 'We are from Amed'),
    ex('Em mamoste ne', 'نحن معلّمون', 'We are teachers'),
  ],
});

const hun = concept({
  id: 'pronoun-hun',
  term: 'Hûn',
  ar: 'أنتم / أنتن',
  en: 'you (plural)',
  usageAr: 'لمخاطبة أكثر من شخص، أو شخص واحد باحترام (صيغة الجمع المهذّبة).',
  usageEn: 'For addressing several people, or one person politely (plural/polite form).',
  usageKu: 'Ji bo axaftina bi çend kesan re, an bi rêz ji bo kesekî.',
  examples: [
    ex('Hûn kurd in', 'أنتم أكراد', 'You are Kurds'),
    ex('Hûn li malê ne', 'أنتم في البيت', 'You are at home'),
    ex('Hûn nan dixwin', 'أنتم تأكلون الخبز', 'You eat bread'),
    ex('Hûn ji ku ne?', 'من أين أنتم؟', 'Where are you from?'),
    ex('Hûn bi xêr hatin', 'مرحباً بكم', 'Welcome (to several people)'),
  ],
});

const bun = concept({
  id: 'copula-bun',
  term: 'bûn',
  phonetic: 'im · yî · e · in · in',
  ar: 'يكون (فعل الكينونة)',
  en: 'to be',
  usageAr: 'يربط المبتدأ بخبره: «أنا كردي» = Ez kurd *im*. يُصرَّف مع كل ضمير.',
  usageEn: 'Links the subject to its description: "I am Kurdish" = Ez kurd *im*. It conjugates with every pronoun.',
  usageKu: 'Kirdeyê bi nîşaneya wê ve girê dide: Ez kurd *im*.',
  examples: [
    ex('Ez kurd im', 'أنا كردي', 'I am Kurdish'),
    ex('Tu kurd î', 'أنتَ كردي', 'You are Kurdish'),
    ex('Ew kurd e', 'هو كردي', 'He is Kurdish'),
    ex('Em kurd in', 'نحن أكراد', 'We are Kurds'),
    ex('Hûn kurd in', 'أنتم أكراد', 'You are Kurds'),
  ],
});

const min = concept({
  id: 'poss-min',
  term: 'Min',
  ar: 'ـي (لي)',
  en: 'my',
  usageAr: 'للملكية: «اسمي» = navê min، «بيتي» = mala min.',
  usageEn: 'For possession: "my name" = navê min, "my house" = mala min.',
  usageKu: 'Ji bo xwedîtiyê: navê min, mala min.',
  examples: [
    ex('Navê min Azad e', 'اسمي آزاد', 'My name is Azad'),
    ex('Mala min li vir e', 'بيتي هنا', 'My house is here'),
    ex('Bavê min mamoste ye', 'أبي معلّم', 'My father is a teacher'),
    ex('Hevalên min kurd in', 'أصدقائي أكراد', 'My friends are Kurds'),
    ex('Ev pirtûka min e', 'هذا كتابي', 'This is my book'),
  ],
});

const te = concept({
  id: 'poss-te',
  term: 'Te',
  ar: 'ـكَ / ـكِ (لك)',
  en: 'your (singular)',
  usageAr: 'للملكية عند مخاطبة شخص واحد: «اسمك» = navê te.',
  usageEn: 'Possession for one person: "your name" = navê te.',
  usageKu: 'Xwedîtiya kesekî: navê te.',
  examples: [
    ex('Navê te çi ye?', 'ما اسمك؟', 'What is your name?'),
    ex('Mala te li ku ye?', 'أين بيتك؟', 'Where is your house?'),
    ex('Diya te li malê ye', 'أمّك في البيت', 'Your mother is at home'),
    ex('Ev pirtûka te ye', 'هذا كتابك', 'This is your book'),
  ],
});

const wi = concept({
  id: 'poss-wi',
  term: 'Wî',
  ar: 'ـهُ (له)',
  en: 'his',
  usageAr: 'للملكية مع المذكّر: «اسمه» = navê wî.',
  usageEn: 'Possession with a masculine owner: "his name" = navê wî.',
  usageKu: 'Xwedîtiya nêr: navê wî.',
  examples: [
    ex('Navê wî Azad e', 'اسمه آزاد', 'His name is Azad'),
    ex('Kurê wî li dibistanê ye', 'ابنه في المدرسة', 'His son is at school'),
    ex('Mala wî mezin e', 'بيته كبير', 'His house is big'),
    ex('Bavê wî kurd e', 'أبوه كردي', 'His father is Kurdish'),
  ],
});

const we = concept({
  id: 'poss-we-fem',
  term: 'Wê',
  ar: 'ـها (لها)',
  en: 'her',
  usageAr: 'للملكية مع المؤنّث: «اسمها» = navê wê.',
  usageEn: 'Possession with a feminine owner: "her name" = navê wê.',
  usageKu: 'Xwedîtiya mê: navê wê.',
  examples: [
    ex('Navê wê Eyşan e', 'اسمها عيشان', 'Her name is Eyşan'),
    ex('Xwişka wê li vir e', 'أختها هنا', 'Her sister is here'),
    ex('Mala wê biçûk e', 'بيتها صغير', 'Her house is small'),
    ex('Pirtûka wê nû ye', 'كتابها جديد', 'Her book is new'),
  ],
});

const me = concept({
  id: 'poss-me',
  term: 'Me',
  ar: 'ـنا (لنا)',
  en: 'our',
  usageAr: 'للملكية الجماعية: «اسمنا» = navê me، «بلدنا» = welatê me.',
  usageEn: 'Group possession: "our name" = navê me, "our country" = welatê me.',
  usageKu: 'Xwedîtiya komekê: navê me, welatê me.',
  examples: [
    ex('Navê me kurd e', 'اسمنا كردي', 'Our name is Kurdish'),
    ex('Welatê me Kurdistan e', 'بلدنا كردستان', 'Our country is Kurdistan'),
    ex('Mala me li Amedê ye', 'بيتنا في آمد', 'Our house is in Amed'),
    ex('Mamosteyê me baş e', 'معلّمنا جيّد', 'Our teacher is good'),
  ],
});

const wePl = concept({
  id: 'poss-we-pl',
  term: 'We',
  ar: 'ـكم / ـكن (لكم)',
  en: 'your (plural)',
  usageAr: 'للملكية عند مخاطبة أكثر من شخص: «اسمكم» = navê we.',
  usageEn: 'Possession addressing several people: "your name" = navê we.',
  usageKu: 'Xwedîtiya çend kesan: navê we.',
  examples: [
    ex('Navê we çi ye?', 'ما اسمكم؟', 'What is your name?'),
    ex('Mala we li ku ye?', 'أين بيتكم؟', 'Where is your house?'),
    ex('Zarokên we li dibistanê ne', 'أطفالكم في المدرسة', 'Your children are at school'),
  ],
});

const wan = concept({
  id: 'poss-wan',
  term: 'Wan',
  ar: 'ـهم / ـهن (لهم)',
  en: 'their',
  usageAr: 'للملكية الجمعية للغائبين: «اسمهم» = navê wan.',
  usageEn: 'Possession of a third-person group: "their name" = navê wan.',
  usageKu: 'Xwedîtiya koma sêyem: navê wan.',
  examples: [
    ex('Navê wan kurd e', 'اسمهم كردي', 'Their name is Kurdish'),
    ex('Mala wan li gund e', 'بيتهم في القرية', 'Their house is in the village'),
    ex('Hevalên wan hatin', 'أصدقاؤهم جاؤوا', 'Their friends came'),
  ],
});

function pronounExercises(): ReturnType<typeof q>[] {
  return [
    // Step 2 — comprehension
    q({
      id: 'p-q1', node: 'cmp-ez', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'How do you say “I” in Kurdish?', ar: 'كيف تقول «أنا» بالكردية؟', ku: 'Tu çawa dibêjî «Ez»?' },
      options: [opt('Ez', 'أنا', 'I'), opt('Tu', 'أنتَ', 'you'), opt('Ew', 'هو', 'he'), opt('Em', 'نحن', 'we')],
      correct: 'Ez',
    }),
    q({
      id: 'p-q2', node: 'cmp-tu', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'How do you say “you” (one person)?', ar: 'كيف تقول «أنتَ» بالكردية؟', ku: 'Tu çawa dibêjî «Tu»?' },
      options: [opt('Hûn', 'أنتم', 'you pl'), opt('Ew', 'هو', 'he'), opt('Tu', 'أنتَ', 'you'), opt('Em', 'نحن', 'we')],
      correct: 'Tu',
    }),
    q({
      id: 'p-q3', node: 'cmp-ew', type: 'select_translation', direction: 'to_arabic',
      display: 'Ew nan dixwe',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ew nan dixwe', 'هو يأكل الخبز', 'He eats bread'),
        opt('Tu nan dixwî', 'أنتَ تأكل الخبز', 'You eat bread'),
        opt('Em nan dixwin', 'نحن نأكل الخبز', 'We eat bread'),
        opt('Ez nan dixwim', 'أنا آكل الخبز', 'I eat bread'),
      ],
      correct: 'Ew nan dixwe',
    }),
    q({
      id: 'p-q4', node: 'cmp-em', type: 'select_translation', direction: 'to_arabic',
      display: 'Em kurd in',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Em kurd in', 'نحن أكراد', 'We are Kurds'),
        opt('Ez kurd im', 'أنا كردي', 'I am Kurdish'),
        opt('Tu kurd î', 'أنتَ كردي', 'You are Kurdish'),
        opt('Ew kurd e', 'هو كردي', 'He is Kurdish'),
      ],
      correct: 'Em kurd in',
    }),
    q({
      id: 'p-q5', node: 'cmp-hun', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'How do you say “you” (plural / polite)?', ar: 'كيف تقول «أنتم» بالكردية؟', ku: 'Tu çawa dibêjî «Hûn»?' },
      options: [opt('Hûn', 'أنتم', 'you pl'), opt('Tu', 'أنتَ', 'you'), opt('Em', 'نحن', 'we'), opt('Ew', 'هم', 'they')],
      correct: 'Hûn',
    }),
    q({
      id: 'p-q6', node: 'cmp-bun', type: 'complete_sentence', display: 'Ez kurd ___',
      prompt: { en: 'Complete: I am Kurdish.', ar: 'أكمل: أنا كردي.', ku: 'Temam bike: Ez kurd ___.' },
      reference: { en: 'I am Kurdish', ar: 'أنا كردي', ku: 'Ez kurd im' },
      options: [opt('im', 'ـم (أنا)', 'am'), opt('yî', 'ـي (أنتَ)', 'are'), opt('e', 'ـه (هو)', 'is'), opt('in', 'ـن (نحن)', 'are')],
      correct: 'im',
    }),
    q({
      id: 'p-q7', node: 'cmp-min', type: 'select_translation', direction: 'to_arabic',
      display: 'Mala min',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Mala min', 'بيتي', 'my house'),
        opt('Mala te', 'بيتك', 'your house'),
        opt('Mala wî', 'بيته', 'his house'),
        opt('Mala wê', 'بيتها', 'her house'),
      ],
      correct: 'Mala min',
    }),

    // Step 3 — production
    q({
      id: 'p-q8', node: 'prd-ez', type: 'write_word', audioText: 'Ez',
      prompt: { en: 'Listen and write the word for “I”.', ar: 'اسمع 🔊 ثم اكتب كلمة «أنا».', ku: 'Guhdarî bike û peyva «Ez» binivîse.' },
      reference: { en: 'I', ar: 'أنا', ku: 'Ez' },
      correct: 'Ez',
    }),
    q({
      id: 'p-q9', node: 'prd-tu', type: 'write_word', audioText: 'Tu',
      prompt: { en: 'Listen and write the word for “you”.', ar: 'اسمع 🔊 ثم اكتب كلمة «أنتَ».', ku: 'Guhdarî bike û peyva «Tu» binivîse.' },
      reference: { en: 'you', ar: 'أنتَ', ku: 'Tu' },
      correct: 'Tu',
    }),
    q({
      id: 'p-q10', node: 'prd-em', type: 'write_word', audioText: 'Em',
      prompt: { en: 'Listen and write the word for “we”.', ar: 'اسمع 🔊 ثم اكتب كلمة «نحن».', ku: 'Guhdarî bike û peyva «Em» binivîse.' },
      reference: { en: 'we', ar: 'نحن', ku: 'Em' },
      correct: 'Em',
    }),
    q({
      id: 'p-q11', node: 'prd-im', type: 'write_word', audioText: 'im',
      prompt: { en: 'Listen and write the ending of “Ez kurd …” (I am).', ar: 'اسمع 🔊 ثم اكتب نهاية «أنا كردي».', ku: 'Guhdarî bike û dawiya «Ez kurd …» binivîse.' },
      reference: { en: '(I) am', ar: 'ـم (أنا)', ku: 'im' },
      correct: 'im',
    }),
    q({
      id: 'p-q12', node: 'prd-min', type: 'write_word', audioText: 'Navê min',
      prompt: { en: 'Listen and write “my name”.', ar: 'اسمع 🔊 ثم اكتب «اسمي».', ku: 'Guhdarî bike û «navê min» binivîse.' },
      reference: { en: 'my name', ar: 'اسمي', ku: 'navê min' },
      correct: 'navê min',
      variants: ['navê min'],
    }),
    q({
      id: 'p-q13', node: 'prd-xwarin', type: 'arrange_sentence', sentenceWords: ['Ez', 'nan', 'dixwim'],
      prompt: { en: 'Arrange: I eat bread.', ar: 'رتّب الكلمات: أنا آكل الخبز.', ku: 'Peyvan sererast bike: Ez nan dixwim.' },
      reference: { en: 'I eat bread', ar: 'أنا آكل الخبز', ku: 'Ez nan dixwim' },
      correct: 'Ez nan dixwim',
    }),
    q({
      id: 'p-q14', node: 'prd-match', type: 'match_pairs',
      prompt: { en: 'Match the pronouns to their meanings.', ar: 'طابِق الضمائر مع معانيها.', ku: 'Cînavkan bi wateyên wan re bigihîne.' },
      pairs: [
        pair('Ez', 'أنا', 'I'),
        pair('Tu', 'أنتَ', 'you'),
        pair('Em', 'نحن', 'we'),
        pair('Hûn', 'أنتم', 'you pl'),
      ],
      correct: 'Ez=أنا / Tu=أنتَ / Em=نحن / Hûn=أنتم',
    }),
  ];
}

export const pronounsLesson: GrammarLesson = lesson({
  topicId: 'pronouns',
  xp: 60,
  title: { en: 'Pronouns', ar: 'الضمائر', ku: 'Cînavk' },
  description: {
    en: 'Say “I, you, he/she, we” and “my, your, his…” with real sentences.',
    ar: 'تعلّم «أنا، أنتَ، هو/هي، نحن» و«ـي، ـكَ، ـهُ…» بجُمل حقيقية.',
    ku: '«Ez, Tu, Ew, Em» û «min, te, wî…» bi hevokên rast bixwîne.',
  },
  concepts: [ez, tu, ew, em, hun, bun, min, te, wi, we, me, wePl, wan],
  summary: {
    rows: [
      { ku: 'Ez / Min', ar: 'أنا / ـي', en: 'I / my' },
      { ku: 'Tu / Te', ar: 'أنتَ / ـكَ', en: 'you / your' },
      { ku: 'Ew / Wî · Wê', ar: 'هو · هي / ـهُ · ـها', en: 'he · she / his · her' },
      { ku: 'Em / Me', ar: 'نحن / ـنا', en: 'we / our' },
      { ku: 'Hûn / We', ar: 'أنتم / ـكم', en: 'you / your (pl)' },
      { ku: 'Ew / Wan', ar: 'هم / ـهم', en: 'they / their' },
      { ku: 'im · yî · e · in · in', ar: 'أنا · أنتَ · هو · نحن · أنتم', en: 'am · are · is · are · are' },
    ],
  },
  exercises: pronounExercises(),
});

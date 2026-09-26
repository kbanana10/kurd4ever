/**
 * nouns.ts — Grammar Lesson 3: Nouns (Navdêr).
 *
 * Concept cards: gender, the izafe link (-ê / -a / -ên), singular/plural.
 *
 * Verified (>= 2 sources, see VERIFICATION_NEEDED.md):
 *  - Gender is unpredictable; learn it per word — Thackston §1.1; CeLCAR.
 *  - Izafe: masc. -ê, fem. -a, plural -ên (navê min, mala min, hevalên min) —
 *    Thackston §4; CeLCAR ("navê wê Eyşan e").
 *  - Direct object of a present verb is oblique: fem. -ê (sêvê), masc.
 *    unchanged (nan) — Thackston §1.2; glosbe ("Ez avê vedixwim").
 */

import type { GrammarLesson } from './types';
import { concept, ex, opt, pair, q, lesson } from './helpers';

const genderConcept = concept({
  id: 'noun-gender',
  term: 'nêr / mê',
  ar: 'مذكّر / مؤنّث',
  en: 'masculine / feminine',
  usageAr: 'كل اسم كردي مذكّر أو مؤنّث، ولا قاعدة سهلة من المعنى — احفظ الجنس مع كل كلمة.',
  usageEn: 'Every noun is masculine or feminine, with no simple meaning rule — learn the gender with each word.',
  usageKu: 'Her navdêr nêr an mê ye; bi her peyvê re zayendê fêr bibe.',
  examples: [
    ex('nan (nêr)', 'خبز (مذكّر)', 'bread (masc.)'),
    ex('mal (mê)', 'بيت (مؤنّث)', 'house (fem.)'),
    ex('kur (nêr)', 'ولد (مذكّر)', 'boy (masc.)'),
    ex('keç (mê)', 'بنت (مؤنّث)', 'girl (fem.)'),
    ex("sêv (mê)", 'تفاحة (مؤنّث)', 'apple (fem.)'),
  ],
});

const izafeMascConcept = concept({
  id: 'noun-izafe-masc',
  term: 'navê min',
  ar: 'اسمي (إضافة المذكّر)',
  en: 'my name (masculine izafe)',
  usageAr: 'لربط اسم مذكّر بمالكه نضيف -ê: nav-ê min، kur-ê te.',
  usageEn: 'A masculine noun links to its possessor with -ê: nav-ê min, kur-ê te.',
  usageKu: 'Navdêra nêr bi -ê ve bi xwedî re girê dibe: nav-ê min.',
  examples: [
    ex('navê min', 'اسمي', 'my name'),
    ex('kurê te', 'ابنك', 'your son'),
    ex('bavê wî', 'أبوه', 'his father'),
    ex('hevalê me', 'صديقنا', 'our friend'),
    ex('mamosteyê wan', 'معلّمهم', 'their teacher'),
  ],
});

const izafeFemConcept = concept({
  id: 'noun-izafe-fem',
  term: 'mala min',
  ar: 'بيتي (إضافة المؤنّث)',
  en: 'my house (feminine izafe)',
  usageAr: 'لربط اسم مؤنّث بمالكه نضيف -a: mal-a min، xwişk-a te.',
  usageEn: 'A feminine noun links to its possessor with -a: mal-a min, xwişk-a te.',
  usageKu: 'Navdêra mê bi -a ve bi xwedî re girê dibe: mal-a min.',
  examples: [
    ex('mala min', 'بيتي', 'my house'),
    ex('xwişka te', 'أختك', 'your sister'),
    ex('diya wî', 'أمّه', 'his mother'),
    ex('pirtûka wê', 'كتابها', 'her book'),
    ex('keça me', 'بنتنا', 'our daughter'),
  ],
});

const izafePluralConcept = concept({
  id: 'noun-izafe-plural',
  term: 'hevalên min',
  ar: 'أصدقائي (إضافة الجمع)',
  en: 'my friends (plural izafe)',
  usageAr: 'الجمع يربط مالكه بـ -ên دائماً (للمذكّر والمؤنّث): heval-ên min.',
  usageEn: 'Plural nouns always link with -ên: heval-ên min.',
  usageKu: 'Pirjimar bi -ên ve girê dibe: heval-ên min.',
  examples: [
    ex('hevalên min', 'أصدقائي', 'my friends'),
    ex('pirtûkên te', 'كتبك', 'your books'),
    ex('zarokên wê', 'أطفالها', 'her children'),
    ex('gundên me', 'قرانا', 'our villages'),
    ex('mamosteyên wan', 'معلّموهم', 'their teachers'),
  ],
});

const objectConcept = concept({
  id: 'noun-object',
  term: 'Ez sêvê dixwim',
  ar: 'آكل التفاحة (المفعول)',
  en: 'I eat the apple (object)',
  usageAr: 'المفعول به في المضارع يكون بصيغة الميل: المؤنّث يضيف -ê (sêvê)، والمذكّر يبقى كما هو (nan).',
  usageEn: 'The present-tense object is oblique: feminine adds -ê (sêvê); masculine is unchanged (nan).',
  usageKu: 'Tebata dema niha tewandî ye: mê -ê (sêvê), nêr wek xwe (nan).',
  examples: [
    ex('Ez sêvê dixwim', 'أنا آكل التفاحة', 'I eat the apple'),
    ex('Ez nan dixwim', 'أنا آكل الخبز', 'I eat the bread'),
    ex('Tu avê vedixwî', 'أنتَ تشرب الماء', 'You drink the water'),
    ex('Ew pirtûkê dixwîne', 'هو يقرأ الكتاب', 'He reads the book'),
  ],
});

function nounExercises(): ReturnType<typeof q>[] {
  return [
    // comprehension
    q({
      id: 'n-q1', node: 'cmp-gender', type: 'match_pairs',
      prompt: { en: 'Match each noun to its gender.', ar: 'طابِق كل اسم مع جنسه.', ku: 'Her navdêrê bi zayenda wê re bigihîne.' },
      pairs: [
        pair('nan', 'خبز (مذكّر)', 'bread (masc.)'),
        pair('mal', 'بيت (مؤنّث)', 'house (fem.)'),
        pair('kur', 'ولد (مذكّر)', 'boy (masc.)'),
        pair('keç', 'بنت (مؤنّث)', 'girl (fem.)'),
      ],
      correct: 'nan=خبز (مذكّر) / mal=بيت (مؤنّث) / kur=ولد (مذكّر) / keç=بنت (مؤنّث)',
    }),
    q({
      id: 'n-q2', node: 'cmp-mala', type: 'select_translation', direction: 'to_arabic', display: 'mala min',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('mala min', 'بيتي', 'my house'),
        opt('mala te', 'بيتك', 'your house'),
        opt('mala wî', 'بيته', 'his house'),
        opt('mala wê', 'بيتها', 'her house'),
      ],
      correct: 'mala min',
    }),
    q({
      id: 'n-q3', node: 'cmp-nave', type: 'select_translation', direction: 'to_arabic', display: 'navê min',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('navê min', 'اسمي', 'my name'),
        opt('nava min', 'داخلي', 'inside me'),
        opt('nav min', '(بلا معنى)', '(no meaning)'),
        opt('navên min', 'أسمائي', 'my names'),
      ],
      correct: 'navê min',
    }),
    q({
      id: 'n-q4', node: 'cmp-hevalen', type: 'select_translation', direction: 'to_arabic', display: 'hevalên min',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('hevalên min', 'أصدقائي', 'my friends'),
        opt('hevalê min', 'صديقي', 'my friend (masc.)'),
        opt('hevala min', 'صديقتي', 'my friend (fem.)'),
        opt('hevalan', 'الأصدقاء (ميل)', 'friends (oblique)'),
      ],
      correct: 'hevalên min',
    }),
    q({
      id: 'n-q5', node: 'cmp-seve', type: 'select_translation', direction: 'to_arabic', display: 'Ez sêvê dixwim',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ez sêvê dixwim', 'أنا آكل التفاحة', 'I eat the apple'),
        opt('Ez nan dixwim', 'أنا آكل الخبز', 'I eat the bread'),
        opt('Tu sêvê dixwî', 'أنتَ تأكل التفاحة', 'You eat the apple'),
        opt('Ew sêvê dixwe', 'هو يأكل التفاحة', 'He eats the apple'),
      ],
      correct: 'Ez sêvê dixwim',
    }),

    // production
    q({
      id: 'n-q6', node: 'prd-mala', type: 'write_word', audioText: 'mala min',
      prompt: { en: 'Listen and write “my house”.', ar: 'اسمع 🔊 ثم اكتب «بيتي».', ku: 'Guhdarî bike û «mala min» binivîse.' },
      reference: { en: 'my house', ar: 'بيتي', ku: 'mala min' },
      correct: 'mala min',
    }),
    q({
      id: 'n-q7', node: 'prd-nave', type: 'write_word', audioText: 'navê min',
      prompt: { en: 'Listen and write “my name”.', ar: 'اسمع 🔊 ثم اكتب «اسمي».', ku: 'Guhdarî bike û «navê min» binivîse.' },
      reference: { en: 'my name', ar: 'اسمي', ku: 'navê min' },
      correct: 'navê min',
    }),
    q({
      id: 'n-q8', node: 'prd-hevalen', type: 'write_word', audioText: 'hevalên min',
      prompt: { en: 'Listen and write “my friends”.', ar: 'اسمع 🔊 ثم اكتب «أصدقائي».', ku: 'Guhdarî bike û «hevalên min» binivîse.' },
      reference: { en: 'my friends', ar: 'أصدقائي', ku: 'hevalên min' },
      correct: 'hevalên min',
    }),
    q({
      id: 'n-q9', node: 'prd-arrange', type: 'arrange_sentence', sentenceWords: ['Ez', 'sêvê', 'dixwim'],
      prompt: { en: 'Arrange: I eat the apple.', ar: 'رتّب: أنا آكل التفاحة.', ku: 'Sererast bike: Ez sêvê dixwim.' },
      reference: { en: 'I eat the apple', ar: 'أنا آكل التفاحة', ku: 'Ez sêvê dixwim' },
      correct: 'Ez sêvê dixwim',
    }),
    q({
      id: 'n-q10', node: 'cmp-match-izafe', type: 'match_pairs',
      prompt: { en: 'Match each form to its meaning.', ar: 'طابِق كل صيغة مع معناها.', ku: 'Her formê bi wateya wê re bigihîne.' },
      pairs: [
        pair('navê min', 'اسمي', 'my name'),
        pair('mala wê', 'بيتها', 'her house'),
        pair('hevalên me', 'أصدقاؤنا', 'our friends'),
        pair('pirtûka te', 'كتابك', 'your book'),
      ],
      correct: 'navê min=اسمي / mala wê=بيتها / hevalên me=أصدقاؤنا / pirtûka te=كتابك',
    }),
  ];
}

export const nounsLesson: GrammarLesson = lesson({
  topicId: 'nouns',
  xp: 60,
  title: { en: 'Nouns', ar: 'الأسماء', ku: 'Navdêr' },
  description: {
    en: 'Gender and the “izafe” link that shows who owns what.',
    ar: 'الجنس ورابط الإضافة الذي يُظهر الملكية.',
    ku: 'Zayend û girêdana îzafeyê.',
  },
  concepts: [genderConcept, izafeMascConcept, izafeFemConcept, izafePluralConcept, objectConcept],
  summary: {
    rows: [
      { ku: 'nav (nêr) → navê min', ar: 'اسم → اسمي', en: 'name → my name' },
      { ku: 'mal (mê) → mala min', ar: 'بيت → بيتي', en: 'house → my house' },
      { ku: 'heval → hevalên min', ar: 'أصدقاء → أصدقائي', en: 'friends → my friends' },
      { ku: 'Ez sêvê dixwim', ar: 'أنا آكل التفاحة', en: 'I eat the apple' },
      { ku: 'Ez nan dixwim', ar: 'أنا آكل الخبز', en: 'I eat the bread' },
    ],
  },
  exercises: nounExercises(),
});

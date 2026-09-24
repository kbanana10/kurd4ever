/**
 * prepositions.ts — Grammar Lesson 5: Prepositions (Daçek).
 *
 * Concept cards: li, ji, bi, di…de, ser, bin, ber, nav.
 *
 * Verified (>= 2 sources, see VERIFICATION_NEEDED.md):
 *  - Set + meanings — Thackston §8 (common prepositions/circumpositions);
 *    kurdi101 ("li" at/in; "ji" from/of; "ser" on; "bin" under; "di…de" in).
 *  - Oblique complement: ji min, li min; "Ez ji Amedê me" — Thackston §7;
 *    CeLCAR ("ji: from — Ez ji Rihayê me").
 *  - di … de static location: "Di odê de masek heye" — CeLCAR (snippet 19).
 */

import type { GrammarLesson } from './types';
import { concept, ex, opt, pair, q, lesson } from './helpers';

const li = concept({
  id: 'prep-li',
  term: 'li',
  ar: 'في / عند / إلى',
  en: 'at / in / to',
  usageAr: '"li" مع مكان: خانه, مدرسة… تُستخدم كثيراً مع "bûn" (يكون) مثل li malê (في البيت).',
  usageEn: '"li" with places: li malê (at home), li dibistanê (at school).',
  usageKu: 'li + cih: li malê, li dibistanê.',
  examples: [
    ex('Ez li malê me', 'أنا في البيت', 'I am at home'),
    ex('Ew li dibistanê ye', 'هو في المدرسة', 'He is at school'),
    ex('Tu li ku yî?', 'أين أنتَ؟', 'Where are you?'),
    ex('Em li Amedê ne', 'نحن في آمد', 'We are in Amed'),
  ],
});

const ji = concept({
  id: 'prep-ji',
  term: 'ji',
  ar: 'من / عن',
  en: 'from / of',
  usageAr: '"ji" تعني المصدر أو الانتماء: ji min (منّي)، Ez ji Dihokê me (أنا من دهوك).',
  usageEn: '"ji" for origin/possession: ji min (from me), Ez ji Dihokê me (I’m from Duhok).',
  usageKu: 'ji + çavkanî: Ez ji Dihokê me.',
  examples: [
    ex('Ez ji Amedê me', 'أنا من آمد', 'I am from Amed'),
    ex('Tu ji Dihokê yî', 'أنتَ من دهوك', 'You are from Duhok'),
    ex('Ew ji gund e', 'هو من القرية', 'He is from the village'),
    ex('Ev ji min re ye', 'هذا لي', 'This is for me'),
  ],
});

const bi = concept({
  id: 'prep-bi',
  term: 'bi',
  ar: 'بـ / بواسطة',
  en: 'with / by means of',
  usageAr: '"bi" للأداة أو الوسيلة: bi pênûsê (بالقلم)، bi gerrokê (بالسيارة).',
  usageEn: '"bi" for instrument: bi pênûsê (with a pen), bi gerrokê (by car).',
  usageKu: 'bi + alav: bi pênûsê, bi gerrokê.',
  examples: [
    ex('Ez bi pênûsê dinivîsim', 'أنا أكتب بالقلم', 'I write with a pen'),
    ex('Ew bi gerrokê diçe', 'هو يذهب بالسيارة', 'He goes by car'),
    ex('Em bi kurdî diaxivin', 'نحن نتكلّم بالكردية', 'We speak in Kurdish'),
    ex('Tu bi hevalê xwe re diçî', 'أنتَ تذهب مع صديقك', 'You go with your friend'),
  ],
});

const diDe = concept({
  id: 'prep-di-de',
  term: 'di … de',
  ar: 'في / داخل (إحاطة)',
  en: 'in / inside (circumposition)',
  usageAr: '"di…de" تحيط بالمكان: di malê de (في البيت)، di odeyê de (في الغرفة).',
  usageEn: '"di…de" wraps the place: di malê de (in the house), di odeyê de (in the room).',
  usageKu: 'di…de cihê dipêçe: di malê de, di odeyê de.',
  examples: [
    ex('Di odeyê de masek heye', 'في الغرفة طاولة', 'There is a table in the room'),
    ex('Ez di malê de me', 'أنا في البيت', 'I am in the house'),
    ex('Pirtûk di çanteyê de ye', 'الكتاب في الحقيبة', 'The book is in the bag'),
    ex('Em di baxçeyê de ne', 'نحن في الحديقة', 'We are in the garden'),
  ],
});

const ser = concept({
  id: 'prep-ser',
  term: 'ser',
  ar: 'فوق / على',
  en: 'on / on top of',
  usageAr: '"ser" تعني فوق شيء: ser maseyê (على الطاولة).',
  usageEn: '"ser" = on (top of): ser maseyê (on the table).',
  usageKu: 'ser = li ser tiştekî: ser maseyê.',
  examples: [
    ex('Pirtûk li ser maseyê ye', 'الكتاب على الطاولة', 'The book is on the table'),
    ex('Sêv li ser sindoqê ye', 'التفاحة على الصندوق', 'The apple is on the box'),
    ex('Ez li ser kursîyê rûniştim', 'أنا جلست على الكرسي', 'I sat on the chair'),
  ],
});

const bin = concept({
  id: 'prep-bin',
  term: 'bin',
  ar: 'تحت',
  en: 'under',
  usageAr: '"bin" تعني تحت شيء: bin maseyê (تحت الطاولة).',
  usageEn: '"bin" = under: bin maseyê (under the table).',
  usageKu: 'bin = di bin tiştekî de: bin maseyê.',
  examples: [
    ex('Pisîk di bin maseyê de ye', 'القطة تحت الطاولة', 'The cat is under the table'),
    ex('Gog di bin kursîyê de ye', 'الكرة تحت الكرسي', 'The ball is under the chair'),
    ex('Ez li bin darê me', 'أنا تحت الشجرة', 'I am under the tree'),
  ],
});

const ber = concept({
  id: 'prep-ber',
  term: 'ber',
  ar: 'أمام',
  en: 'in front of',
  usageAr: '"ber" تعني أمام شيء: ber malê (أمام البيت).',
  usageEn: '"ber" = in front of: ber malê (in front of the house).',
  usageKu: 'ber = li pêş tiştekî: ber malê.',
  examples: [
    ex('Ez li ber malê me', 'أنا أمام البيت', 'I am in front of the house'),
    ex('Gerrok li ber dibistanê ye', 'السيارة أمام المدرسة', 'The car is in front of the school'),
    ex('Ew li ber derî ye', 'هو أمام الباب', 'He is in front of the door'),
  ],
});

const nav = concept({
  id: 'prep-nav',
  term: 'nav',
  ar: 'داخل / بين',
  en: 'inside / among',
  usageAr: '"nav" تعني داخل أو بين: di nav avê de (داخل الماء).',
  usageEn: '"nav" = inside/among: di nav avê de (in the water).',
  usageKu: 'nav = di nav de: di nav avê de.',
  examples: [
    ex('Masî di nav avê de ye', 'السمكة في الماء', 'The fish is in the water'),
    ex('Tu di nav hevalan de yî', 'أنتَ بين الأصدقاء', 'You are among friends'),
    ex('Em di nav baxçeyê de ne', 'نحن داخل الحديقة', 'We are inside the garden'),
  ],
});

function prepExercises(): ReturnType<typeof q>[] {
  return [
    // comprehension
    q({
      id: 'pp-q1', node: 'cmp-li', type: 'match_pairs',
      prompt: { en: 'Match each preposition to its meaning.', ar: 'طابِق كل حرف جر مع معناه.', ku: 'Her daçekê bi wateya wê re bigihîne.' },
      pairs: [
        pair('li', 'في / عند', 'at / in'),
        pair('ji', 'من / عن', 'from / of'),
        pair('ser', 'فوق / على', 'on / on top'),
        pair('bin', 'تحت', 'under'),
      ],
      correct: 'li=في / عند / ji=من / عن / ser=فوق / على / bin=تحت',
    }),
    q({
      id: 'pp-q2', node: 'cmp-ji', type: 'select_translation', direction: 'to_arabic', display: 'Ez ji Amedê me',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Ez ji Amedê me', 'أنا من آمد', 'I am from Amed'),
        opt('Ez li Amedê me', 'أنا في آمد', 'I am in Amed'),
        opt('Ez bi Amedê me', 'أنا مع آمد', 'I am with Amed'),
        opt('Ez di Amedê de me', 'أنا داخل آمد', 'I am inside Amed'),
      ],
      correct: 'Ez ji Amedê me',
    }),
    q({
      id: 'pp-q3', node: 'cmp-ser', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'Which word means “on / on top of”?', ar: 'أي كلمة تعني «فوق / على»؟', ku: 'Kîjan peyv wateya «ser» dide?' },
      options: [
        opt('ser', 'فوق / على', 'on / on top'),
        opt('bin', 'تحت', 'under'),
        opt('ber', 'أمام', 'in front'),
        opt('nav', 'داخل', 'inside'),
      ],
      correct: 'ser',
    }),
    q({
      id: 'pp-q4', node: 'cmp-bin', type: 'select_translation', direction: 'to_kurdish',
      prompt: { en: 'Which word means “under”?', ar: 'أي كلمة تعني «تحت»؟', ku: 'Kîjan peyv wateya «bin» dide?' },
      options: [
        opt('bin', 'تحت', 'under'),
        opt('ser', 'فوق', 'on'),
        opt('ber', 'أمام', 'in front'),
        opt('ji', 'من', 'from'),
      ],
      correct: 'bin',
    }),
    q({
      id: 'pp-q5', node: 'cmp-di', type: 'select_translation', direction: 'to_arabic', display: 'Di odeyê de masek heye',
      prompt: { en: 'Choose the correct translation.', ar: 'اختر الترجمة الصحيحة.', ku: 'Wergera rast hilbijêre.' },
      options: [
        opt('Di odeyê de masek heye', 'في الغرفة طاولة', 'There is a table in the room'),
        opt('Li ser maseyê ye', 'هي على الطاولة', 'It is on the table'),
        opt('Di bin maseyê de ye', 'هي تحت الطاولة', 'It is under the table'),
        opt('Li ber odeyê ye', 'هي أمام الغرفة', 'It is in front of the room'),
      ],
      correct: 'Di odeyê de masek heye',
    }),

    // production
    q({
      id: 'pp-q6', node: 'prd-li', type: 'write_word', audioText: 'li',
      prompt: { en: 'Listen and write the word for “at / in”.', ar: 'اسمع 🔊 ثم اكتب كلمة «في / عند».', ku: 'Guhdarî bike û peyva «li» binivîse.' },
      reference: { en: 'at / in', ar: 'في / عند', ku: 'li' },
      correct: 'li',
    }),
    q({
      id: 'pp-q7', node: 'prd-ji', type: 'write_word', audioText: 'ji',
      prompt: { en: 'Listen and write the word for “from”.', ar: 'اسمع 🔊 ثم اكتب كلمة «من».', ku: 'Guhdarî bike û peyva «ji» binivîse.' },
      reference: { en: 'from', ar: 'من', ku: 'ji' },
      correct: 'ji',
    }),
    q({
      id: 'pp-q8', node: 'prd-ser', type: 'write_word', audioText: 'ser',
      prompt: { en: 'Listen and write the word for “on”.', ar: 'اسمع 🔊 ثم اكتب كلمة «فوق / على».', ku: 'Guhdarî bike û peyva «ser» binivîse.' },
      reference: { en: 'on', ar: 'فوق / على', ku: 'ser' },
      correct: 'ser',
    }),
    q({
      id: 'pp-q9', node: 'prd-bin', type: 'write_word', audioText: 'bin',
      prompt: { en: 'Listen and write the word for “under”.', ar: 'اسمع 🔊 ثم اكتب كلمة «تحت».', ku: 'Guhdarî bike û peyva «bin» binivîse.' },
      reference: { en: 'under', ar: 'تحت', ku: 'bin' },
      correct: 'bin',
    }),
    q({
      id: 'pp-q10', node: 'prd-ji-amede', type: 'write_word', audioText: 'Ez ji Amedê me',
      prompt: { en: 'Listen and write “I am from Amed”.', ar: 'اسمع 🔊 ثم اكتب «أنا من آمد».', ku: 'Guhdarî bike û «Ez ji Amedê me» binivîse.' },
      reference: { en: 'I am from Amed', ar: 'أنا من آمد', ku: 'Ez ji Amedê me' },
      correct: 'ez ji amedê me',
      variants: ['ez ji amede me'],
    }),
    q({
      id: 'pp-q11', node: 'prd-arrange', type: 'arrange_sentence', sentenceWords: ['Pirtûk', 'li', 'ser', 'maseyê', 'ye'],
      prompt: { en: 'Arrange: The book is on the table.', ar: 'رتّب: الكتاب على الطاولة.', ku: 'Sererast bike: Pirtûk li ser maseyê ye.' },
      reference: { en: 'The book is on the table', ar: 'الكتاب على الطاولة', ku: 'Pirtûk li ser maseyê ye' },
      correct: 'Pirtûk li ser maseyê ye',
    }),
    q({
      id: 'pp-q12', node: 'prd-match2', type: 'match_pairs',
      prompt: { en: 'Match each preposition to its meaning.', ar: 'طابِق كل حرف جر مع معناه.', ku: 'Her daçekê bi wateya wê re bigihîne.' },
      pairs: [
        pair('bi', 'بـ / بواسطة', 'with / by means'),
        pair('ber', 'أمام', 'in front'),
        pair('nav', 'داخل / بين', 'inside / among'),
        pair('di…de', 'في / داخل', 'in / inside'),
      ],
      correct: 'bi=بـ / بواسطة / ber=أمام / nav=داخل / بين / di…de=في / داخل',
    }),
  ];
}

export const prepositionsLesson: GrammarLesson = lesson({
  topicId: 'prepositions',
  xp: 60,
  title: { en: 'Prepositions', ar: 'حروف الجر', ku: 'Daçek' },
  description: {
    en: 'The key location words: at, from, with, in, on, under, before, inside.',
    ar: 'كلمات المكان الأساسية: في، من، بـ، داخل، فوق، تحت، أمام، بين.',
    ku: 'Daçekên cihî: li, ji, bi, di, ser, bin, ber, nav.',
  },
  concepts: [li, ji, bi, diDe, ser, bin, ber, nav],
  summary: {
    rows: [
      { ku: 'li', ar: 'في / عند / إلى', en: 'at / in / to' },
      { ku: 'ji', ar: 'من / عن', en: 'from / of' },
      { ku: 'bi', ar: 'بـ / بواسطة', en: 'with / by means' },
      { ku: 'di … de', ar: 'في / داخل', en: 'in / inside' },
      { ku: 'ser', ar: 'فوق / على', en: 'on / on top' },
      { ku: 'bin', ar: 'تحت', en: 'under' },
      { ku: 'ber', ar: 'أمام', en: 'in front of' },
      { ku: 'nav', ar: 'داخل / بين', en: 'inside / among' },
    ],
  },
  exercises: prepExercises(),
});

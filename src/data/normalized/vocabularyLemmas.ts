/**
 * vocabularyLemmas.ts
 * 
 * Normalized atomic database of Kurmanji vocabulary lemmas with IPA phonetics,
 * parts of speech, CEFR level tagging, bilingual translations, and example sentences.
 */
import { VocabularyLemma } from '../schemas/contentSchemas';

export const normalizedVocabularyLemmas: VocabularyLemma[] = [
  // Numbers
  {
    id: 'voc_n0',
    lemmaKu: 'Sifir',
    ipa: '/sɪfɪɾ/',
    partOfSpeech: 'numeral',
    translations: { en: 'Zero', ar: 'صفر' },
    categoryId: 'numbers',
    subCategoryId: 'ones',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/zero.mp3', emoji: '0️⃣' },
    examples: [{ sentenceKu: 'Puanên min sifir in.', translations: { en: 'My points are zero.', ar: 'نقاطي صفر.' } }],
    tags: ['numbers', 'basic', 'a1']
  },
  {
    id: 'voc_n1',
    lemmaKu: 'Yek',
    ipa: '/jɛk/',
    partOfSpeech: 'numeral',
    translations: { en: 'One', ar: 'واحد' },
    categoryId: 'numbers',
    subCategoryId: 'ones',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/one.mp3', emoji: '1️⃣' },
    examples: [{ sentenceKu: 'Min yek pênûs heye.', translations: { en: 'I have one pen.', ar: 'لدي قلم واحد.' } }],
    tags: ['numbers', 'basic', 'a1']
  },
  {
    id: 'voc_n2',
    lemmaKu: 'Du',
    ipa: '/dʊ/',
    partOfSpeech: 'numeral',
    translations: { en: 'Two', ar: 'اثنان' },
    categoryId: 'numbers',
    subCategoryId: 'ones',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/two.mp3', emoji: '2️⃣' },
    examples: [{ sentenceKu: 'Du birayên min hene.', translations: { en: 'I have two brothers.', ar: 'لدي أخوان.' } }],
    tags: ['numbers', 'basic', 'a1']
  },
  {
    id: 'voc_n3',
    lemmaKu: 'Sê',
    ipa: '/seː/',
    partOfSpeech: 'numeral',
    translations: { en: 'Three', ar: 'ثلاثة' },
    categoryId: 'numbers',
    subCategoryId: 'ones',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/three.mp3', emoji: '3️⃣' },
    examples: [{ sentenceKu: 'Sê sêv li ser masê ne.', translations: { en: 'Three apples are on the table.', ar: 'ثلاث تفاحات على الطاولة.' } }],
    tags: ['numbers', 'basic', 'a1']
  },
  {
    id: 'voc_n4',
    lemmaKu: 'Çar',
    ipa: '/tʃɑːɾ/',
    partOfSpeech: 'numeral',
    translations: { en: 'Four', ar: 'أربعة' },
    categoryId: 'numbers',
    subCategoryId: 'ones',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/four.mp3', emoji: '4️⃣' },
    examples: [{ sentenceKu: 'Ode çar pencere hene.', translations: { en: 'The room has four windows.', ar: 'الغرفة فيها أربع نوافذ.' } }],
    tags: ['numbers', 'basic', 'a1']
  },
  {
    id: 'voc_n5',
    lemmaKu: 'Pênc',
    ipa: '/peːntʃ/',
    partOfSpeech: 'numeral',
    translations: { en: 'Five', ar: 'خمسة' },
    categoryId: 'numbers',
    subCategoryId: 'ones',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/five.mp3', emoji: '5️⃣' },
    examples: [{ sentenceKu: 'Ew pênc deqîqan diskinê.', translations: { en: 'Wait five minutes.', ar: 'انتظر خمس دقائق.' } }],
    tags: ['numbers', 'basic', 'a1']
  },
  {
    id: 'voc_n10',
    lemmaKu: 'Deh',
    ipa: '/dɛh/',
    partOfSpeech: 'numeral',
    translations: { en: 'Ten', ar: 'عشرة' },
    categoryId: 'numbers',
    subCategoryId: 'tens',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/numbers/ten.mp3', emoji: '🔟' },
    examples: [{ sentenceKu: 'Deh pirtûkên min hene.', translations: { en: 'I have ten books.', ar: 'لدي عشرة كتب.' } }],
    tags: ['numbers', 'basic', 'a1']
  },

  // Food & Water
  {
    id: 'voc_food_01',
    lemmaKu: 'Av',
    ipa: '/ɑːv/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Water', ar: 'ماء' },
    categoryId: 'food',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/av.mp3', emoji: '💧' },
    examples: [{ sentenceKu: 'Av sar e.', translations: { en: 'The water is cold.', ar: 'الماء بارد.' }, audioUrl: '/audio/sentences/av_sar_e.mp3' }],
    tags: ['basic', 'food', 'drink', 'essential']
  },
  {
    id: 'voc_food_02',
    lemmaKu: 'Nan',
    ipa: '/nɑːn/',
    gender: 'masculine',
    partOfSpeech: 'noun',
    translations: { en: 'Bread', ar: 'خبز' },
    categoryId: 'food',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/nan.mp3', emoji: '🍞' },
    examples: [{ sentenceKu: 'Ez nan dixwim.', translations: { en: 'I eat bread.', ar: 'أنا آكل الخبز.' } }],
    tags: ['basic', 'food', 'essential']
  },
  {
    id: 'voc_food_03',
    lemmaKu: 'Sêv',
    ipa: '/seːv/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Apple', ar: 'تفاحة' },
    categoryId: 'food',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/sev.mp3', emoji: '🍎' },
    examples: [{ sentenceKu: 'Sêveke sor e.', translations: { en: 'It is a red apple.', ar: 'إنها تفاحة حمراء.' } }],
    tags: ['food', 'fruit', 'a1']
  },
  {
    id: 'voc_food_04',
    lemmaKu: 'Şîr',
    ipa: '/ʃiːɾ/',
    gender: 'masculine',
    partOfSpeech: 'noun',
    translations: { en: 'Milk', ar: 'حليب' },
    categoryId: 'food',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/shir.mp3', emoji: '🥛' },
    examples: [{ sentenceKu: 'Ez şîrê germ vedixwim.', translations: { en: 'I drink warm milk.', ar: 'أنا أشرب حليباً دافئاً.' } }],
    tags: ['food', 'drink', 'a1']
  },
  {
    id: 'voc_food_05',
    lemmaKu: 'Çay',
    ipa: '/tʃɑːj/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Tea', ar: 'شاي' },
    categoryId: 'food',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/chay.mp3', emoji: '☕' },
    examples: [{ sentenceKu: 'Çaya kurdî gelek xweş e.', translations: { en: 'Kurdish tea is very delicious.', ar: 'الشاي الكردي لذيذ جداً.' } }],
    tags: ['food', 'drink', 'culture']
  },

  // Family
  {
    id: 'voc_fam_01',
    lemmaKu: 'Bav',
    ipa: '/bɑːv/',
    gender: 'masculine',
    partOfSpeech: 'noun',
    translations: { en: 'Father', ar: 'أب' },
    categoryId: 'family',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/bav.mp3', emoji: '👨' },
    examples: [{ sentenceKu: 'Bavê min mamoste ye.', translations: { en: 'My father is a teacher.', ar: 'أبي معلم.' } }],
    tags: ['family', 'basic', 'a1']
  },
  {
    id: 'voc_fam_02',
    lemmaKu: 'Dayik / Dê',
    ipa: '/dɑːjɪk/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Mother', ar: 'أم' },
    categoryId: 'family',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/dayik.mp3', emoji: '👩' },
    examples: [{ sentenceKu: 'Dayika min dilovan e.', translations: { en: 'My mother is kind.', ar: 'أمي حنونة.' } }],
    tags: ['family', 'basic', 'a1']
  },
  {
    id: 'voc_fam_03',
    lemmaKu: 'Xuşk',
    ipa: '/xʊʃk/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Sister', ar: 'أخت' },
    categoryId: 'family',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/xusk.mp3', emoji: '👧' },
    examples: [{ sentenceKu: 'Xuşka min biçûk e.', translations: { en: 'My sister is small.', ar: 'أختي صغيرة.' } }],
    tags: ['family', 'a1']
  },
  {
    id: 'voc_fam_04',
    lemmaKu: 'Bira',
    ipa: '/bɪɾɑː/',
    gender: 'masculine',
    partOfSpeech: 'noun',
    translations: { en: 'Brother', ar: 'أخ' },
    categoryId: 'family',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/vocabulary/bira.mp3', emoji: '👦' },
    examples: [{ sentenceKu: 'Birayê min li zanîngehê ye.', translations: { en: 'My brother is at university.', ar: 'أخي في الجامعة.' } }],
    tags: ['family', 'a1']
  },

  // Academic & Education
  {
    id: 'voc_acad_01',
    lemmaKu: 'Pirtûk',
    ipa: '/pɪɾtuːk/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Book', ar: 'كتاب' },
    categoryId: 'school_objects',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/academic/book.mp3', emoji: '📚' },
    examples: [{ sentenceKu: 'Ev pirtûk balkêş e.', translations: { en: 'This book is interesting.', ar: 'هذا الكتاب مثير للاهتمام.' } }],
    tags: ['school', 'academic', 'a1']
  },
  {
    id: 'voc_acad_02',
    lemmaKu: 'Zanîngeh',
    ipa: '/zɑːniːnɡɛh/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'University', ar: 'جامعة' },
    categoryId: 'university',
    cefrLevel: 'A2',
    media: { audioUrl: '/audio/academic/university.mp3', emoji: '🏛️' },
    examples: [{ sentenceKu: 'Ez li zanîngehê dixwînim.', translations: { en: 'I study at university.', ar: 'أنا أدرس في الجامعة.' } }],
    tags: ['academic', 'education', 'a2']
  },
  {
    id: 'voc_acad_03',
    lemmaKu: 'Mamoste',
    ipa: '/mɑːmɔstɛ/',
    gender: 'neutral',
    partOfSpeech: 'noun',
    translations: { en: 'Teacher / Professor', ar: 'معلم / أستاذ' },
    categoryId: 'university',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/academic/professor.mp3', emoji: '👨‍🏫' },
    examples: [{ sentenceKu: 'Mamoste dersê baş dide.', translations: { en: 'The teacher teaches well.', ar: 'المعلم يدرس جيداً.' } }],
    tags: ['academic', 'education', 'a1']
  },
  {
    id: 'voc_acad_04',
    lemmaKu: 'Kompîtur',
    ipa: '/kɔmpiːtʊɾ/',
    gender: 'feminine',
    partOfSpeech: 'noun',
    translations: { en: 'Computer', ar: 'حاسوب' },
    categoryId: 'computers',
    cefrLevel: 'B1',
    media: { audioUrl: '/audio/academic/computer.mp3', emoji: '💻' },
    examples: [{ sentenceKu: 'Ez bernameyan li ser kompîturê çêdikim.', translations: { en: 'I write programs on the computer.', ar: 'أصنع البرامج على الحاسوب.' } }],
    tags: ['academic', 'technology', 'b1']
  },

  // Verbs & Actions
  {
    id: 'voc_verb_01',
    lemmaKu: 'Xwarin',
    ipa: '/xwɑːɾɪn/',
    partOfSpeech: 'verb',
    translations: { en: 'To eat', ar: 'أن يأكل' },
    categoryId: 'actions',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/verbs/xwarin.mp3', emoji: '🍽️' },
    examples: [{ sentenceKu: 'Ez fêkiyan dixwim.', translations: { en: 'I eat fruits.', ar: 'أنا آكل الفواكه.' } }],
    tags: ['verbs', 'daily', 'a1']
  },
  {
    id: 'voc_verb_02',
    lemmaKu: 'Xwendin',
    ipa: '/xwɛndɪn/',
    partOfSpeech: 'verb',
    translations: { en: 'To read / study', ar: 'أن يقرأ / يدرس' },
    categoryId: 'actions',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/verbs/xwendin.mp3', emoji: '📖' },
    examples: [{ sentenceKu: 'Ez pirtûkê dixwînim.', translations: { en: 'I am reading a book.', ar: 'أنا أقرأ كتاباً.' } }],
    tags: ['verbs', 'academic', 'a1']
  },
  {
    id: 'voc_verb_03',
    lemmaKu: 'Nivîsîn',
    ipa: '/nɪviːsiːn/',
    partOfSpeech: 'verb',
    translations: { en: 'To write', ar: 'أن يكتب' },
    categoryId: 'actions',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/verbs/nivisin.mp3', emoji: '✍️' },
    examples: [{ sentenceKu: 'Tu nameyê dinivîsî.', translations: { en: 'You are writing a letter.', ar: 'أنت تكتب رسالة.' } }],
    tags: ['verbs', 'academic', 'a1']
  },
  {
    id: 'voc_verb_04',
    lemmaKu: 'Çûn',
    ipa: '/tʃuːn/',
    partOfSpeech: 'verb',
    translations: { en: 'To go', ar: 'أن يذهب' },
    categoryId: 'actions',
    cefrLevel: 'A1',
    media: { audioUrl: '/audio/verbs/chun.mp3', emoji: '🏃' },
    examples: [{ sentenceKu: 'Ez diçim malê.', translations: { en: 'I am going home.', ar: 'أنا أذهب إلى البيت.' } }],
    tags: ['verbs', 'essential', 'a1']
  }
];

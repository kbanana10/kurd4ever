export interface Letter {
  id: string;
  char: string;
  exampleWord: string;
  meaningEn: string;
  meaningAr: string;
  audio: string;
  charAudio: string;
  type: 'vowel' | 'consonant';
}

const defaultAlphabet: Letter[] = [
  { id: 'a', char: 'A a', exampleWord: 'Av', meaningEn: 'Water', meaningAr: 'ماء', audio: '/audio/alphabet/a.mp3', charAudio: '/audio/alphabet/char_a.mp3', type: 'vowel' },
  { id: 'b', char: 'B b', exampleWord: 'Bav', meaningEn: 'Father', meaningAr: 'أب', audio: '/audio/alphabet/b.mp3', charAudio: '/audio/alphabet/char_b.mp3', type: 'consonant' },
  { id: 'c', char: 'C c', exampleWord: 'Cil', meaningEn: 'Clothes', meaningAr: 'ملابس', audio: '/audio/alphabet/c.mp3', charAudio: '/audio/alphabet/char_c.mp3', type: 'consonant' },
  { id: 'ç', char: 'Ç ç', exampleWord: 'Çav', meaningEn: 'Eye', meaningAr: 'عين', audio: '/audio/alphabet/c_cedilla.mp3', charAudio: '/audio/alphabet/char_c_cedilla.mp3', type: 'consonant' },
  { id: 'd', char: 'D d', exampleWord: 'Dar', meaningEn: 'Tree', meaningAr: 'شجرة', audio: '/audio/alphabet/d.mp3', charAudio: '/audio/alphabet/char_d.mp3', type: 'consonant' },
  { id: 'e', char: 'E e', exampleWord: 'Ewr', meaningEn: 'Cloud', meaningAr: 'غيمة', audio: '/audio/alphabet/e.mp3', charAudio: '/audio/alphabet/char_e.mp3', type: 'vowel' },
  { id: 'ê', char: 'Ê ê', exampleWord: 'Êvar', meaningEn: 'Evening', meaningAr: 'مساء', audio: '/audio/alphabet/e_circumflex.mp3', charAudio: '/audio/alphabet/char_e_circumflex.mp3', type: 'vowel' },
  { id: 'f', char: 'F f', exampleWord: 'Firin', meaningEn: 'Oven', meaningAr: 'فرن', audio: '/audio/alphabet/f.mp3', charAudio: '/audio/alphabet/char_f.mp3', type: 'consonant' },
  { id: 'g', char: 'G g', exampleWord: 'Gund', meaningEn: 'Village', meaningAr: 'قرية', audio: '/audio/alphabet/g.mp3', charAudio: '/audio/alphabet/char_g.mp3', type: 'consonant' },
  { id: 'h', char: 'H h', exampleWord: 'Heval', meaningEn: 'Friend', meaningAr: 'صديق', audio: '/audio/alphabet/h.mp3', charAudio: '/audio/alphabet/char_h.mp3', type: 'consonant' },
  { id: 'i', char: 'I i', exampleWord: 'Girtin', meaningEn: 'To close', meaningAr: 'يغلق', audio: '/audio/alphabet/i.mp3', charAudio: '/audio/alphabet/char_i.mp3', type: 'vowel' },
  { id: 'î', char: 'Î î', exampleWord: 'Îro', meaningEn: 'Today', meaningAr: 'اليوم', audio: '/audio/alphabet/i_circumflex.mp3', charAudio: '/audio/alphabet/char_i_circumflex.mp3', type: 'vowel' },
  { id: 'j', char: 'J j', exampleWord: 'Jin', meaningEn: 'Woman', meaningAr: 'امرأة', audio: '/audio/alphabet/j.mp3', charAudio: '/audio/alphabet/char_j.mp3', type: 'consonant' },
  { id: 'k', char: 'K k', exampleWord: 'Kar', meaningEn: 'Work', meaningAr: 'عمل', audio: '/audio/alphabet/k.mp3', charAudio: '/audio/alphabet/char_k.mp3', type: 'consonant' },
  { id: 'l', char: 'L l', exampleWord: 'Lêv', meaningEn: 'Lip', meaningAr: 'شفة', audio: '/audio/alphabet/l.mp3', charAudio: '/audio/alphabet/char_l.mp3', type: 'consonant' },
  { id: 'm', char: 'M m', exampleWord: 'Masî', meaningEn: 'Fish', meaningAr: 'سمكة', audio: '/audio/alphabet/m.mp3', charAudio: '/audio/alphabet/char_m.mp3', type: 'consonant' },
  { id: 'n', char: 'N n', exampleWord: 'Nan', meaningEn: 'Bread', meaningAr: 'خبز', audio: '/audio/alphabet/n.mp3', charAudio: '/audio/alphabet/char_n.mp3', type: 'consonant' },
  { id: 'o', char: 'O o', exampleWord: 'Ode', meaningEn: 'Room', meaningAr: 'غرفة', audio: '/audio/alphabet/o.mp3', charAudio: '/audio/alphabet/char_o.mp3', type: 'vowel' },
  { id: 'p', char: 'P p', exampleWord: 'Por', meaningEn: 'Hair', meaningAr: 'شعر', audio: '/audio/alphabet/p.mp3', charAudio: '/audio/alphabet/char_p.mp3', type: 'consonant' },
  { id: 'q', char: 'Q q', exampleWord: 'Qelem', meaningEn: 'Pen', meaningAr: 'قلم', audio: '/audio/alphabet/q.mp3', charAudio: '/audio/alphabet/char_q.mp3', type: 'consonant' },
  { id: 'r', char: 'R r', exampleWord: 'Roj', meaningEn: 'Day/Sun', meaningAr: 'شمس/يوم', audio: '/audio/alphabet/r.mp3', charAudio: '/audio/alphabet/char_r.mp3', type: 'consonant' },
  { id: 's', char: 'S s', exampleWord: 'Sêv', meaningEn: 'Apple', meaningAr: 'تفاحة', audio: '/audio/alphabet/s.mp3', charAudio: '/audio/alphabet/char_s.mp3', type: 'consonant' },
  { id: 'ş', char: 'Ş ş', exampleWord: 'Şev', meaningEn: 'Night', meaningAr: 'ليل', audio: '/audio/alphabet/s_cedilla.mp3', charAudio: '/audio/alphabet/char_s_cedilla.mp3', type: 'consonant' },
  { id: 't', char: 'T t', exampleWord: 'Tîr', meaningEn: 'Arrow', meaningAr: 'سهم', audio: '/audio/alphabet/t.mp3', charAudio: '/audio/alphabet/char_t.mp3', type: 'consonant' },
  { id: 'u', char: 'U u', exampleWord: 'Guh', meaningEn: 'Ear', meaningAr: 'أذن', audio: '/audio/alphabet/u.mp3', charAudio: '/audio/alphabet/char_u.mp3', type: 'vowel' },
  { id: 'û', char: 'Û û', exampleWord: 'Dûr', meaningEn: 'Far', meaningAr: 'بعيد', audio: '/audio/alphabet/u_circumflex.mp3', charAudio: '/audio/alphabet/char_u_circumflex.mp3', type: 'vowel' },
  { id: 'v', char: 'V v', exampleWord: 'Vala', meaningEn: 'Empty', meaningAr: 'فارغ', audio: '/audio/alphabet/v.mp3', charAudio: '/audio/alphabet/char_v.mp3', type: 'consonant' },
  { id: 'w', char: 'W w', exampleWord: 'Wêne', meaningEn: 'Picture', meaningAr: 'صورة', audio: '/audio/alphabet/w.mp3', charAudio: '/audio/alphabet/char_w.mp3', type: 'consonant' },
  { id: 'x', char: 'X x', exampleWord: 'Xanî', meaningEn: 'House', meaningAr: 'منزل', audio: '/audio/alphabet/x.mp3', charAudio: '/audio/alphabet/char_x.mp3', type: 'consonant' },
  { id: 'y', char: 'Y y', exampleWord: 'Yek', meaningEn: 'One', meaningAr: 'واحد', audio: '/audio/alphabet/y.mp3', charAudio: '/audio/alphabet/char_y.mp3', type: 'consonant' },
  { id: 'z', char: 'Z z', exampleWord: 'Ziman', meaningEn: 'Language/Tongue', meaningAr: 'لغة/لسان', audio: '/audio/alphabet/z.mp3', charAudio: '/audio/alphabet/char_z.mp3', type: 'consonant' }
];

export let alphabet: Letter[] = [...defaultAlphabet];
if (globalThis.window !== undefined) {
  const overrides = localStorage.getItem('kurmanji_alphabet');
  if (overrides) {
    try {
      alphabet = JSON.parse(overrides);
    } catch (e) {
      console.error("Error loading alphabet overrides:", e);
    }
  }
}

export interface Word {
  id: string;
  ku: string;
  en: string;
  ar: string;
  categoryId: string;
  emoji: string;
  audio: string;
  subCategoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  ar?: string;
}

export const categories: Category[] = [
  { id: 'numbers', name: 'Numbers', icon: 'Binary', ar: 'الأرقام' },
  { id: 'colors', name: 'Colors', icon: 'Palette', ar: 'الألوان' },
  { id: 'animals', name: 'Animals & Insects', icon: 'Cat', ar: 'الحيوانات والحشرات' },
  { id: 'food', name: 'Food & Fruits', icon: 'Apple', ar: 'الأطعمة والخضار والفواكه' },
  { id: 'family', name: 'Family', icon: 'Users', ar: 'العائلة والقرابة' },
  { id: 'home', name: 'Home & House', icon: 'Home', ar: 'البيت والأثاث' },
  { id: 'time', name: 'Time & Days', icon: 'Calendar', ar: 'الوقت والأيام' }
];

const defaultVocabulary: Word[] = [
  // Numbers -> Ones 0–9 (الأرقام -> الآحاد ٠–٩)
  { id: 'n0', ku: 'Sifir', en: 'Zero', ar: 'صفر', categoryId: 'numbers', subCategoryId: 'ones', emoji: '0️⃣', audio: '/audio/numbers/zero.mp3' },
  { id: 'n1', ku: 'Yek', en: 'One', ar: 'واحد', categoryId: 'numbers', subCategoryId: 'ones', emoji: '1️⃣', audio: '/audio/numbers/one.mp3' },
  { id: 'n2', ku: 'Du', en: 'Two', ar: 'اثنان', categoryId: 'numbers', subCategoryId: 'ones', emoji: '2️⃣', audio: '/audio/numbers/two.mp3' },
  { id: 'n3', ku: 'Sê', en: 'Three', ar: 'ثلاثة', categoryId: 'numbers', subCategoryId: 'ones', emoji: '3️⃣', audio: '/audio/numbers/three.mp3' },
  { id: 'n4', ku: 'Çar', en: 'Four', ar: 'أربعة', categoryId: 'numbers', subCategoryId: 'ones', emoji: '4️⃣', audio: '/audio/numbers/four.mp3' },
  { id: 'n5', ku: 'Pênc', en: 'Five', ar: 'خمسة', categoryId: 'numbers', subCategoryId: 'ones', emoji: '5️⃣', audio: '/audio/numbers/five.mp3' },
  { id: 'n6', ku: 'Şeş', en: 'Six', ar: 'ستة', categoryId: 'numbers', subCategoryId: 'ones', emoji: '6️⃣', audio: '/audio/numbers/six.mp3' },
  { id: 'n7', ku: 'Heft', en: 'Seven', ar: 'سبعة', categoryId: 'numbers', subCategoryId: 'ones', emoji: '7️⃣', audio: '/audio/numbers/seven.mp3' },
  { id: 'n8', ku: 'Heşt', en: 'Eight', ar: 'ثمانية', categoryId: 'numbers', subCategoryId: 'ones', emoji: '8️⃣', audio: '/audio/numbers/eight.mp3' },
  { id: 'n9', ku: 'Neh', en: 'Nine', ar: 'تسعة', categoryId: 'numbers', subCategoryId: 'ones', emoji: '9️⃣', audio: '/audio/numbers/nine.mp3' },

  // Numbers -> Teens 10–19 (الأرقام -> الأعداد من ١٠ إلى ١٩)
  { id: 'n10', ku: 'Deh', en: 'Ten', ar: 'عشرة', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣0️⃣', audio: '' },
  { id: 'n11', ku: 'Yazdeh', en: 'Eleven', ar: 'أحد عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣1️⃣', audio: '' },
  { id: 'n12', ku: 'Diwazdeh', en: 'Twelve', ar: 'اثنا عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣2️⃣', audio: '' },
  { id: 'n13', ku: 'Sêzdeh', en: 'Thirteen', ar: 'ثلاثة عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣3️⃣', audio: '' },
  { id: 'n14', ku: 'Çardeh', en: 'Fourteen', ar: 'أربعة عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣4️⃣', audio: '' },
  { id: 'n15', ku: 'Panzdeh', en: 'Fifteen', ar: 'خمسة عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣5️⃣', audio: '' },
  { id: 'n16', ku: 'Şanzdeh', en: 'Sixteen', ar: 'ستة عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣6️⃣', audio: '' },
  { id: 'n17', ku: 'Hevdeh', en: 'Seventeen', ar: 'سبعة عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣7️⃣', audio: '' },
  { id: 'n18', ku: 'Hejdeh', en: 'Eighteen', ar: 'ثمانية عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣8️⃣', audio: '' },
  { id: 'n19', ku: 'Nozdeh', en: 'Nineteen', ar: 'تسعة عشر', categoryId: 'numbers', subCategoryId: 'teens', emoji: '1️⃣9️⃣', audio: '' },

  // Numbers -> Twenties 20–29 (الأرقام -> العشرينات ٢٠–٢٩)
  { id: 'n20', ku: 'Bîst', en: 'Twenty', ar: 'عشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣0️⃣', audio: '' },
  { id: 'n21', ku: 'Bîst û yek', en: 'Twenty-one', ar: 'واحد وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣1️⃣', audio: '' },
  { id: 'n22', ku: 'Bîst û du', en: 'Twenty-two', ar: 'اثنان وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣2️⃣', audio: '' },
  { id: 'n23', ku: 'Bîst û sê', en: 'Twenty-three', ar: 'ثلاثة وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣3️⃣', audio: '' },
  { id: 'n24', ku: 'Bîst û çar', en: 'Twenty-four', ar: 'أربعة وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣4️⃣', audio: '' },
  { id: 'n25', ku: 'Bîst û pênc', en: 'Twenty-five', ar: 'خمسة وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣5️⃣', audio: '' },
  { id: 'n26', ku: 'Bîst û şeş', en: 'Twenty-six', ar: 'ستة وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣6️⃣', audio: '' },
  { id: 'n27', ku: 'Bîst û heft', en: 'Twenty-seven', ar: 'سبعة وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣7️⃣', audio: '' },
  { id: 'n28', ku: 'Bîst û heşt', en: 'Twenty-eight', ar: 'ثمانية وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣8️⃣', audio: '' },
  { id: 'n29', ku: 'Bîst û neh', en: 'Twenty-nine', ar: 'تسعة وعشرون', categoryId: 'numbers', subCategoryId: 'twenties', emoji: '2️⃣9️⃣', audio: '' },

  // Numbers -> Thirties 30–39 (الأرقام -> الثلاثينات ٣٠–٣٩)
  { id: 'n30', ku: 'Sî', en: 'Thirty', ar: 'ثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣0️⃣', audio: '' },
  { id: 'n31', ku: 'Sî û yek', en: 'Thirty-one', ar: 'واحد وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣1️⃣', audio: '' },
  { id: 'n32', ku: 'Sî û du', en: 'Thirty-two', ar: 'اثنان وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣2️⃣', audio: '' },
  { id: 'n33', ku: 'Sî û sê', en: 'Thirty-three', ar: 'ثلاثة وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣3️⃣', audio: '' },
  { id: 'n34', ku: 'Sî û çar', en: 'Thirty-four', ar: 'أربعة وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣4️⃣', audio: '' },
  { id: 'n35', ku: 'Sî û pênc', en: 'Thirty-five', ar: 'خمسة وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣5️⃣', audio: '' },
  { id: 'n36', ku: 'Sî û şeş', en: 'Thirty-six', ar: 'ستة وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣6️⃣', audio: '' },
  { id: 'n37', ku: 'Sî û heft', en: 'Thirty-seven', ar: 'سبعة وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣7️⃣', audio: '' },
  { id: 'n38', ku: 'Sî û heşt', en: 'Thirty-eight', ar: 'ثمانية وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣8️⃣', audio: '' },
  { id: 'n39', ku: 'Sî û neh', en: 'Thirty-nine', ar: 'تسعة وثلاثون', categoryId: 'numbers', subCategoryId: 'thirties', emoji: '3️⃣9️⃣', audio: '' },

  // Numbers -> Forties 40–49 (الأرقام -> الأربعينات ٤٠–٤٩)
  { id: 'n40', ku: 'Çil', en: 'Forty', ar: 'أربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣0️⃣', audio: '' },
  { id: 'n41', ku: 'Çil û yek', en: 'Forty-one', ar: 'واحد وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣1️⃣', audio: '' },
  { id: 'n42', ku: 'Çil û du', en: 'Forty-two', ar: 'اثنان وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣2️⃣', audio: '' },
  { id: 'n43', ku: 'Çil û sê', en: 'Forty-three', ar: 'ثلاثة وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣3️⃣', audio: '' },
  { id: 'n44', ku: 'Çil û çar', en: 'Forty-four', ar: 'أربعة وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣4️⃣', audio: '' },
  { id: 'n45', ku: 'Çil û pênc', en: 'Forty-five', ar: 'خمسة وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣5️⃣', audio: '' },
  { id: 'n46', ku: 'Çil û şeş', en: 'Forty-six', ar: 'ستة وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣6️⃣', audio: '' },
  { id: 'n47', ku: 'Çil û heft', en: 'Forty-seven', ar: 'سبعة وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣7️⃣', audio: '' },
  { id: 'n48', ku: 'Çil û heşt', en: 'Forty-eight', ar: 'ثمانية وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣8️⃣', audio: '' },
  { id: 'n49', ku: 'Çil û neh', en: 'Forty-nine', ar: 'تسعة وأربعون', categoryId: 'numbers', subCategoryId: 'forties', emoji: '4️⃣9️⃣', audio: '' },

  // Numbers -> Fifties 50–59 (الأرقام -> الخمسينات ٥٠–٥٩)
  { id: 'n50', ku: 'Pêncî', en: 'Fifty', ar: 'خمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣0️⃣', audio: '' },
  { id: 'n51', ku: 'Pêncî û yek', en: 'Fifty-one', ar: 'واحد وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣1️⃣', audio: '' },
  { id: 'n52', ku: 'Pêncî û du', en: 'Fifty-two', ar: 'اثنان وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣2️⃣', audio: '' },
  { id: 'n53', ku: 'Pêncî û sê', en: 'Fifty-three', ar: 'ثلاثة وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣3️⃣', audio: '' },
  { id: 'n54', ku: 'Pêncî û çar', en: 'Fifty-four', ar: 'أربعة وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣4️⃣', audio: '' },
  { id: 'n55', ku: 'Pêncî û pênc', en: 'Fifty-five', ar: 'خمسة وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣5️⃣', audio: '' },
  { id: 'n56', ku: 'Pêncî û şeş', en: 'Fifty-six', ar: 'ستة وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣6️⃣', audio: '' },
  { id: 'n57', ku: 'Pêncî û heft', en: 'Fifty-seven', ar: 'سبعة وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣7️⃣', audio: '' },
  { id: 'n58', ku: 'Pêncî û heşt', en: 'Fifty-eight', ar: 'ثمانية وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣8️⃣', audio: '' },
  { id: 'n59', ku: 'Pêncî û neh', en: 'Fifty-nine', ar: 'تسعة وخمسون', categoryId: 'numbers', subCategoryId: 'fifties', emoji: '5️⃣9️⃣', audio: '' },

  // Numbers -> Sixties 60–69 (الأرقام -> الستينات ٦٠–٦٩)
  { id: 'n60', ku: 'Şêst', en: 'Sixty', ar: 'ستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣0️⃣', audio: '' },
  { id: 'n61', ku: 'Şêst û yek', en: 'Sixty-one', ar: 'واحد وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣1️⃣', audio: '' },
  { id: 'n62', ku: 'Şêst û du', en: 'Sixty-two', ar: 'اثنان وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣2️⃣', audio: '' },
  { id: 'n63', ku: 'Şêst û sê', en: 'Sixty-three', ar: 'ثلاثة وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣3️⃣', audio: '' },
  { id: 'n64', ku: 'Şêst û çar', en: 'Sixty-four', ar: 'أربعة وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣4️⃣', audio: '' },
  { id: 'n65', ku: 'Şêst û pênc', en: 'Sixty-five', ar: 'خمسة وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣5️⃣', audio: '' },
  { id: 'n66', ku: 'Şêst û şeş', en: 'Sixty-six', ar: 'ستة وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣6️⃣', audio: '' },
  { id: 'n67', ku: 'Şêst û heft', en: 'Sixty-seven', ar: 'سبعة وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣7️⃣', audio: '' },
  { id: 'n68', ku: 'Şêst û heşt', en: 'Sixty-eight', ar: 'ثمانية وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣8️⃣', audio: '' },
  { id: 'n69', ku: 'Şêst û neh', en: 'Sixty-nine', ar: 'تسعة وستون', categoryId: 'numbers', subCategoryId: 'sixties', emoji: '6️⃣9️⃣', audio: '' },

  // Numbers -> Seventies 70–79 (الأرقام -> السبعينات ٧٠–٧٩)
  { id: 'n70', ku: 'Heftê', en: 'Seventy', ar: 'سبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣0️⃣', audio: '' },
  { id: 'n71', ku: 'Heftê û yek', en: 'Seventy-one', ar: 'واحد وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣1️⃣', audio: '' },
  { id: 'n72', ku: 'Heftê û du', en: 'Seventy-two', ar: 'اثنان وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣2️⃣', audio: '' },
  { id: 'n73', ku: 'Heftê û sê', en: 'Seventy-three', ar: 'ثلاثة وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣3️⃣', audio: '' },
  { id: 'n74', ku: 'Heftê û çar', en: 'Seventy-four', ar: 'أربعة وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣4️⃣', audio: '' },
  { id: 'n75', ku: 'Heftê û pênc', en: 'Seventy-five', ar: 'خمسة وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣5️⃣', audio: '' },
  { id: 'n76', ku: 'Heftê û şeş', en: 'Seventy-six', ar: 'ستة وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣6️⃣', audio: '' },
  { id: 'n77', ku: 'Heftê û heft', en: 'Seventy-seven', ar: 'سبعة وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣7️⃣', audio: '' },
  { id: 'n78', ku: 'Heftê û heşt', en: 'Seventy-eight', ar: 'ثمانية وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣8️⃣', audio: '' },
  { id: 'n79', ku: 'Heftê û neh', en: 'Seventy-nine', ar: 'تسعة وسبعون', categoryId: 'numbers', subCategoryId: 'seventies', emoji: '7️⃣9️⃣', audio: '' },

  // Numbers -> Eighties 80–89 (الأرقام -> الثمانينات ٨٠–٨٩)
  { id: 'n80', ku: 'Heştê', en: 'Eighty', ar: 'ثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣0️⃣', audio: '' },
  { id: 'n81', ku: 'Heştê û yek', en: 'Eighty-one', ar: 'واحد وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣1️⃣', audio: '' },
  { id: 'n82', ku: 'Heştê û du', en: 'Eighty-two', ar: 'اثنان وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣2️⃣', audio: '' },
  { id: 'n83', ku: 'Heştê û sê', en: 'Eighty-three', ar: 'ثلاثة وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣3️⃣', audio: '' },
  { id: 'n84', ku: 'Heştê û çar', en: 'Eighty-four', ar: 'أربعة وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣4️⃣', audio: '' },
  { id: 'n85', ku: 'Heştê û pênc', en: 'Eighty-five', ar: 'خمسة وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣5️⃣', audio: '' },
  { id: 'n86', ku: 'Heştê û şeş', en: 'Eighty-six', ar: 'ستة وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣6️⃣', audio: '' },
  { id: 'n87', ku: 'Heştê û heft', en: 'Eighty-seven', ar: 'سبعة وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣7️⃣', audio: '' },
  { id: 'n88', ku: 'Heştê û heşt', en: 'Eighty-eight', ar: 'ثمانية وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣8️⃣', audio: '' },
  { id: 'n89', ku: 'Heştê û neh', en: 'Eighty-nine', ar: 'تسعة وثمانون', categoryId: 'numbers', subCategoryId: 'eighties', emoji: '8️⃣9️⃣', audio: '' },

  // Numbers -> Nineties 90–99 (الأرقام -> التسعينات ٩٠–٩٩)
  { id: 'n90', ku: 'Nod', en: 'Ninety', ar: 'تسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣0️⃣', audio: '' },
  { id: 'n91', ku: 'Nod û yek', en: 'Ninety-one', ar: 'واحد وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣1️⃣', audio: '' },
  { id: 'n92', ku: 'Nod û du', en: 'Ninety-two', ar: 'اثنان وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣2️⃣', audio: '' },
  { id: 'n93', ku: 'Nod û sê', en: 'Ninety-three', ar: 'ثلاثة وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣3️⃣', audio: '' },
  { id: 'n94', ku: 'Nod û çar', en: 'Ninety-four', ar: 'أربعة وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣4️⃣', audio: '' },
  { id: 'n95', ku: 'Nod û pênc', en: 'Ninety-five', ar: 'خمسة وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣5️⃣', audio: '' },
  { id: 'n96', ku: 'Nod û şeş', en: 'Ninety-six', ar: 'ستة وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣6️⃣', audio: '' },
  { id: 'n97', ku: 'Nod û heft', en: 'Ninety-seven', ar: 'سبعة وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣7️⃣', audio: '' },
  { id: 'n98', ku: 'Nod û heşt', en: 'Ninety-eight', ar: 'ثمانية وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣8️⃣', audio: '' },
  { id: 'n99', ku: 'Nod û neh', en: 'Ninety-nine', ar: 'تسعة وتسعون', categoryId: 'numbers', subCategoryId: 'nineties', emoji: '9️⃣9️⃣', audio: '' },

  // Numbers -> One hundred (الأرقام -> المئة ١٠٠)
  { id: 'n100', ku: 'Sed', en: 'One hundred', ar: 'مئة', categoryId: 'numbers', subCategoryId: 'hundred', emoji: '💯', audio: '' },

  // Numbers -> Large Numbers (الأرقام -> الأعداد الكبيرة)
  { id: 'n200', ku: 'Du sed', en: 'Two hundred', ar: 'مئتان', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '🏛️', audio: '' },
  { id: 'n300', ku: 'Sê sed', en: 'Three hundred', ar: 'ثلاث مئة', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '🏢', audio: '' },
  { id: 'n500', ku: 'Pênc sed', en: 'Five hundred', ar: 'خمس مئة', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '🏥', audio: '' },
  { id: 'n1000', ku: 'Hezar', en: 'One thousand', ar: 'ألف', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '💵', audio: '' },
  { id: 'n10000', ku: 'Deh hezar', en: 'Ten thousand', ar: 'عشرة آلاف', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '🪙', audio: '' },
  { id: 'n100000', ku: 'Sed hezar', en: 'One hundred thousand', ar: 'مئة ألف', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '🐑', audio: '' },
  { id: 'n1000000', ku: 'Milyon', en: 'One million', ar: 'مليون', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '💰', audio: '' },
  { id: 'n1000000000', ku: 'Milyar', en: 'One billion', ar: 'مليار', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '💎', audio: '' },
  { id: 'n1000000000000', ku: 'Trîlyon', en: 'One trillion', ar: 'تريليون', categoryId: 'numbers', subCategoryId: 'hundreds', emoji: '👑', audio: '' },
  
  // Colors
  { id: 'c1', ku: 'Sor', en: 'Red', ar: 'أحمر', categoryId: 'colors', emoji: '🟥', audio: '/audio/colors/red.mp3' },
  { id: 'c2', ku: 'Şîn', en: 'Blue', ar: 'أزرق', categoryId: 'colors', emoji: '🟦', audio: '/audio/colors/blue.mp3' },
  { id: 'c3', ku: 'Kesk', en: 'Green', ar: 'أخضر', categoryId: 'colors', emoji: '🟩', audio: '/audio/colors/green.mp3' },
  { id: 'c4', ku: 'Zer', en: 'Yellow', ar: 'أصفر', categoryId: 'colors', emoji: '🟨', audio: '/audio/colors/yellow.mp3' },
  { id: 'c5', ku: 'Reş', en: 'Black', ar: 'أسود', categoryId: 'colors', emoji: '⬛', audio: '/audio/colors/black.mp3' },
  { id: 'c6', ku: 'Spî', en: 'White', ar: 'أبيض', categoryId: 'colors', emoji: '⬜', audio: '/audio/colors/white.mp3' },
  { id: 'c7', ku: 'Gewr', en: 'Grey', ar: 'رمادي', categoryId: 'colors', emoji: '🌫️', audio: '/audio/colors/grey.mp3' },
  { id: 'c8', ku: 'Qehweyî', en: 'Brown', ar: 'بني', categoryId: 'colors', emoji: '🟫', audio: '/audio/colors/brown.mp3' },
  { id: 'c9', ku: 'Pembe', en: 'Pink', ar: 'وردي', categoryId: 'colors', emoji: '🌸', audio: '/audio/colors/pink.mp3' },
  { id: 'c10', ku: 'Mor', en: 'Purple', ar: 'أرجواني', categoryId: 'colors', emoji: '🟪', audio: '/audio/colors/purple.mp3' },
  { id: 'c11', ku: 'Porteqalî', en: 'Orange', ar: 'برتقالي', categoryId: 'colors', emoji: '🟧', audio: '/audio/colors/orange.mp3' },

  // Animals -> Mammals/General (الحيوانات -> الثدييات والعامة)
  { id: 'a1', ku: 'Kûçik', en: 'Dog', ar: 'كلب', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐕', audio: '/audio/animals/dog.mp3' },
  { id: 'a2', ku: 'Pisîk', en: 'Cat', ar: 'قطة', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐈', audio: '/audio/animals/cat.mp3' },
  { id: 'a3', ku: 'Hesp', en: 'Horse', ar: 'حصان', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐎', audio: '/audio/animals/horse.mp3' },
  { id: 'a4', ku: 'Çûk', en: 'Bird', ar: 'عصفور', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐦', audio: '/audio/animals/bird.mp3' },
  { id: 'a5', ku: 'Şêr', en: 'Lion', ar: 'أسد', categoryId: 'animals', subCategoryId: 'animals', emoji: '🦁', audio: '/audio/animals/lion.mp3' },
  { id: 'a6', ku: 'Hirç', en: 'Bear', ar: 'دب', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐻', audio: '/audio/animals/bear.mp3' },
  { id: 'a7', ku: 'Rovî', en: 'Fox', ar: 'ثعلب', categoryId: 'animals', subCategoryId: 'animals', emoji: '🦊', audio: '/audio/animals/fox.mp3' },
  { id: 'a8', ku: 'Masî', en: 'Fish', ar: 'سمكة', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐟', audio: '/audio/animals/fish.mp3' },
  { id: 'a9', ku: 'Mirîşk', en: 'Chicken', ar: 'دجاجة', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐔', audio: '/audio/animals/chicken.mp3' },
  { id: 'a10', ku: 'Çêlek', en: 'Cow', ar: 'بقرة', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐄', audio: '' },
  { id: 'a11', ku: 'Mîh', en: 'Sheep', ar: 'خروف', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐑', audio: '' },
  { id: 'a12', ku: 'Kerguh', en: 'Rabbit', ar: 'أرنب', categoryId: 'animals', subCategoryId: 'animals', emoji: '🐇', audio: '' },

  // Animals -> Insects (الحيوانات -> الحشرات)
  { id: 'ai1', ku: 'Mêşhingiv', en: 'Bee', ar: 'نحلة', categoryId: 'animals', subCategoryId: 'insects', emoji: '🐝', audio: '' },
  { id: 'ai2', ku: 'Mêrî', en: 'Ant', ar: 'نملة', categoryId: 'animals', subCategoryId: 'insects', emoji: '🐜', audio: '' },
  { id: 'ai3', ku: 'Pîrepire', en: 'Butterfly', ar: 'فراشة', categoryId: 'animals', subCategoryId: 'insects', emoji: '🦋', audio: '' },
  { id: 'ai4', ku: 'Mêş', en: 'Fly', ar: 'ذبابة', categoryId: 'animals', subCategoryId: 'insects', emoji: '🪰', audio: '' },
  { id: 'ai5', ku: 'Kinf', en: 'Mosquito', ar: 'بعوضة', categoryId: 'animals', subCategoryId: 'insects', emoji: '🦟', audio: '' },
  { id: 'ai6', ku: 'Gezok', en: 'Spider', ar: 'عنكبوت', categoryId: 'animals', subCategoryId: 'insects', emoji: '🕷️', audio: '' },

  // Food -> Dishes/Meals (الأطعمة -> أطباق ووجبات)
  { id: 'f1', ku: 'Nan', en: 'Bread', ar: 'خبز', categoryId: 'food', subCategoryId: 'food', emoji: '🍞', audio: '/audio/food/bread.mp3' },
  { id: 'f2', ku: 'Av', en: 'Water', ar: 'ماء', categoryId: 'food', subCategoryId: 'food', emoji: '💧', audio: '/audio/food/water.mp3' },
  { id: 'f4', ku: 'Goşt', en: 'Meat', ar: 'لحم', categoryId: 'food', subCategoryId: 'food', emoji: '🥩', audio: '/audio/food/meat.mp3' },
  { id: 'f5', ku: 'Mast', en: 'Yogurt', ar: 'زبادي / لبن', categoryId: 'food', subCategoryId: 'food', emoji: '🥣', audio: '/audio/food/yogurt.mp3' },
  { id: 'f6', ku: 'Penîr', en: 'Cheese', ar: 'جبن', categoryId: 'food', subCategoryId: 'food', emoji: '🧀', audio: '/audio/food/cheese.mp3' },
  { id: 'f7', ku: 'Hêk', en: 'Egg', ar: 'بيضة', categoryId: 'food', subCategoryId: 'food', emoji: '🥚', audio: '/audio/food/egg.mp3' },
  { id: 'f9', ku: 'Şîr', en: 'Milk', ar: 'حليب', categoryId: 'food', subCategoryId: 'food', emoji: '🥛', audio: '/audio/food/milk.mp3' },
  { id: 'f10', ku: 'Qehwe', en: 'Coffee', ar: 'قهوة', categoryId: 'food', subCategoryId: 'food', emoji: '☕', audio: '/audio/food/coffee.mp3' },
  { id: 'f11', ku: 'Çay', en: 'Tea', ar: 'شاي', categoryId: 'food', subCategoryId: 'food', emoji: '🫖', audio: '/audio/food/tea.mp3' },
  { id: 'f12', ku: 'Birinc', en: 'Rice', ar: 'أرز', categoryId: 'food', subCategoryId: 'food', emoji: '🍚', audio: '' },
  { id: 'f13', ku: 'Şorbe', en: 'Soup', ar: 'شوربة', categoryId: 'food', subCategoryId: 'food', emoji: '🥣', audio: '' },
  { id: 'f14', ku: 'Rûn', en: 'Butter / Oil', ar: 'زبدة / زيت', categoryId: 'food', subCategoryId: 'food', emoji: '🧈', audio: '' },

  // Food -> Vegetables (الأطعمة -> خضروات)
  { id: 'fv1', ku: 'Pîvaz', en: 'Onion', ar: 'بصل', categoryId: 'food', subCategoryId: 'vegetables', emoji: '🧅', audio: '' },
  { id: 'fv2', ku: 'Sîr', en: 'Garlic', ar: 'ثوم', categoryId: 'food', subCategoryId: 'vegetables', emoji: '🧄', audio: '' },
  { id: 'fv3', ku: 'Bacan', en: 'Tomato / Eggplant', ar: 'بندورة / باذنجان', categoryId: 'food', subCategoryId: 'vegetables', emoji: '🍅', audio: '' },
  { id: 'fv4', ku: 'Xiyar', en: 'Cucumber', ar: 'خيار', categoryId: 'food', subCategoryId: 'vegetables', emoji: '🥒', audio: '' },
  { id: 'fv5', ku: 'Gêzer', en: 'Carrot', ar: 'جزر', categoryId: 'food', subCategoryId: 'vegetables', emoji: '🥕', audio: '' },
  { id: 'fv6', ku: 'Kartol', en: 'Potato', ar: 'بطاطس', categoryId: 'food', subCategoryId: 'vegetables', emoji: '🥔', audio: '' },

  // Food -> Fruits (الأطعمة -> فواكه)
  { id: 'f3', ku: 'Sêv', en: 'Apple', ar: 'تفاحة', categoryId: 'food', subCategoryId: 'fruits', emoji: '🍎', audio: '/audio/food/apple.mp3' },
  { id: 'f8', ku: 'Mêwe', en: 'Fruit', ar: 'فاكهة', categoryId: 'food', subCategoryId: 'fruits', emoji: '🍇', audio: '/audio/food/fruit.mp3' },
  { id: 'f15', ku: 'Porteqal', en: 'Orange', ar: 'برتقال', categoryId: 'food', subCategoryId: 'fruits', emoji: '🍊', audio: '' },
  { id: 'f16', ku: 'Hejîr', en: 'Fig', ar: 'تين', categoryId: 'food', subCategoryId: 'fruits', emoji: '🫚', audio: '' },
  { id: 'f17', ku: 'Tirî', en: 'Grape', ar: 'عنب', categoryId: 'food', subCategoryId: 'fruits', emoji: '🍇', audio: '' },
  { id: 'f18', ku: 'Hinar', en: 'Pomegranate', ar: 'رمان', categoryId: 'food', subCategoryId: 'fruits', emoji: '🍎', audio: '' },
  { id: 'f19', ku: 'Zerdelî', en: 'Apricot', ar: 'مشمش', categoryId: 'food', subCategoryId: 'fruits', emoji: '🍑', audio: '' },
  { id: 'f20', ku: 'Zeytûn', en: 'Olive', ar: 'زيتون', categoryId: 'food', subCategoryId: 'fruits', emoji: '🫒', audio: '' },

  // Family
  { id: 'fam1', ku: 'Dayik / Dê', en: 'Mother', ar: 'أم', categoryId: 'family', emoji: '👩', audio: '' },
  { id: 'fam2', ku: 'Bav', en: 'Father', ar: 'أب', categoryId: 'family', emoji: '👨', audio: '' },
  { id: 'fam3', ku: 'Bira', en: 'Brother', ar: 'أخ', categoryId: 'family', emoji: '👦', audio: '' },
  { id: 'fam4', ku: 'Xwişk', en: 'Sister', ar: 'أخت', categoryId: 'family', emoji: '👧', audio: '' },
  { id: 'fam5', ku: 'Zarok', en: 'Child / Children', ar: 'طفل', categoryId: 'family', emoji: '👶', audio: '' },
  { id: 'fam6', ku: 'Dapîr', en: 'Grandmother', ar: 'جدة', categoryId: 'family', emoji: '👵', audio: '' },
  { id: 'fam7', ku: 'Bapîr / Kal', en: 'Grandfather', ar: 'جد', categoryId: 'family', emoji: '👴', audio: '' },
  { id: 'fam8', ku: 'Hevjîn', en: 'Spouse / Partner', ar: 'زوج / زوجة', categoryId: 'family', emoji: '👩‍❤️‍👨', audio: '' },

  // House & Home
  { id: 'h1', ku: 'Mal', en: 'Home / House', ar: 'منزل / بيت', categoryId: 'home', emoji: '🏠', audio: '' },
  { id: 'h2', ku: 'Ode', en: 'Room', ar: 'غرفة', categoryId: 'home', emoji: '🚪', audio: '' },
  { id: 'h3', ku: 'Nivîn / Doşek', en: 'Bed', ar: 'سرير', categoryId: 'home', emoji: '🛏️', audio: '' },
  { id: 'h4', ku: 'Qenepe / Sûfî', en: 'Sofa / Couch', ar: 'أريكة', categoryId: 'home', emoji: '🛋️', audio: '' },
  { id: 'h5', ku: 'Metbex / Aşxane', en: 'Kitchen', ar: 'مطبخ', categoryId: 'home', emoji: '🍳', audio: '' },
  { id: 'h6', ku: 'Serşok / Hemam', en: 'Bathroom', ar: 'حمام', categoryId: 'home', emoji: '🚿', audio: '' },
  { id: 'h7', ku: 'Baxçe', en: 'Garden', ar: 'حديقة', categoryId: 'home', emoji: '🏡', audio: '' },
  { id: 'h8', ku: 'Mase', en: 'Table', ar: 'طاولة', categoryId: 'home', emoji: '🪵', audio: '' },

  // Time & Days -> Units of Time (الوقت والتاريخ -> فترات وزمن)
  { id: 't1', ku: 'Roj', en: 'Day', ar: 'يوم', categoryId: 'time', subCategoryId: 'temporal', emoji: '☀️', audio: '' },
  { id: 't2', ku: 'Şev', en: 'Night', ar: 'ليل', categoryId: 'time', subCategoryId: 'temporal', emoji: '🌙', audio: '' },
  { id: 't3', ku: 'Saet', en: 'Hour / Clock', ar: 'ساعة', categoryId: 'time', subCategoryId: 'temporal', emoji: '⏰', audio: '' },
  { id: 't4', ku: 'Sal', en: 'Year', ar: 'سنة', categoryId: 'time', subCategoryId: 'temporal', emoji: '📅', audio: '' },
  { id: 't5', ku: 'Meh', en: 'Month', ar: 'شهر', categoryId: 'time', subCategoryId: 'temporal', emoji: '📆', audio: '' },
  { id: 't6_1', ku: 'Hefte', en: 'Week', ar: 'أسبوع', categoryId: 'time', subCategoryId: 'temporal', emoji: '🗓️', audio: '' },
  { id: 't6_2', ku: 'Sibe', en: 'Morning', ar: 'صباح', categoryId: 'time', subCategoryId: 'temporal', emoji: '🌅', audio: '' },
  { id: 't6_3', ku: 'Êvar', en: 'Evening', ar: 'مساء', categoryId: 'time', subCategoryId: 'temporal', emoji: '🌇', audio: '' },

  // Time & Days -> Days of the week (الوقت والتاريخ -> أيام الأسبوع)
  { id: 't6', ku: 'Duşem', en: 'Monday', ar: 'الاثنين', categoryId: 'time', subCategoryId: 'days', emoji: '🗓️', audio: '' },
  { id: 't7_1', ku: 'Sêşem', en: 'Tuesday', ar: 'الثلاثاء', categoryId: 'time', subCategoryId: 'days', emoji: '📅', audio: '' },
  { id: 't7_2', ku: 'Çarşem', en: 'Wednesday', ar: 'الأربعاء', categoryId: 'time', subCategoryId: 'days', emoji: '📅', audio: '' },
  { id: 't7_3', ku: 'Pêncşem', en: 'Thursday', ar: 'الخميس', categoryId: 'time', subCategoryId: 'days', emoji: '📅', audio: '' },
  { id: 't7', ku: 'În', en: 'Friday', ar: 'الجمعة', categoryId: 'time', subCategoryId: 'days', emoji: '🕌', audio: '' },
  { id: 't7_4', ku: 'Şemî', en: 'Saturday', ar: 'السبت', categoryId: 'time', subCategoryId: 'days', emoji: '📆', audio: '' },
  { id: 't7_5', ku: 'Yekşem', en: 'Sunday', ar: 'الأحد', categoryId: 'time', subCategoryId: 'days', emoji: '📆', audio: '' },
  { id: 't8', ku: 'Dawiya hefteyê', en: 'Weekend', ar: 'عطلة نهاية الأسبوع', categoryId: 'time', subCategoryId: 'days', emoji: '🏖️', audio: '' },
];

export let vocabulary: Word[] = [...defaultVocabulary];
if (globalThis.window !== undefined) {
  const overrides = localStorage.getItem('kurmanji_vocabulary');
  if (overrides) {
    try {
      vocabulary = JSON.parse(overrides);
    } catch (e) {
      console.error("Error loading vocabulary overrides:", e);
    }
  }
}

export interface Sentence {
  id: string;
  ku: string;
  en: string;
  ar: string;
  audio: string;
}

const defaultSentences: Sentence[] = [
  { id: 's1', ku: 'Rojbaş', en: 'Good morning', ar: 'صباح الخير', audio: '/audio/greetings/good_morning.mp3' },
  { id: 's2', ku: 'Navê te çiye?', en: 'What is your name?', ar: 'ما اسمك؟', audio: '/audio/common-sentences/what_is_your_name.mp3' },
  { id: 's3', ku: 'Navê min Azad e.', en: 'My name is Azad.', ar: 'اسمي آزاد.', audio: '/audio/common-sentences/my_name_is_azad.mp3' },
  { id: 's4', ku: 'Tu çawa yî?', en: 'How are you?', ar: 'كيف حالك؟', audio: '/audio/common-sentences/how_are_you.mp3' },
  { id: 's5', ku: 'Ez baş im, spas.', en: 'I am fine, thanks.', ar: 'أنا بخير، شكراً.', audio: '/audio/common-sentences/i_am_fine.mp3' },
  { id: 's6', ku: 'Ev çiye?', en: 'What is this?', ar: 'ما هذا؟', audio: '/audio/common-sentences/what_is_this.mp3' },
  { id: 's7', ku: 'Êvarbaş', en: 'Good evening', ar: 'مساء الخير', audio: '/audio/greetings/good_evening.mp3' },
  { id: 's8', ku: 'Şevbaş', en: 'Good night', ar: 'طاب مساؤك (تصبح على خير)', audio: '/audio/greetings/good_night.mp3' },
  { id: 's9', ku: 'Bi xêr hatî', en: 'Welcome', ar: 'أهلاً بك', audio: '/audio/greetings/welcome.mp3' },
  { id: 's10', ku: 'Tu ji ku yî?', en: 'Where are you from?', ar: 'من أين أنت؟', audio: '/audio/common-sentences/where_are_you_from.mp3' },
  { id: 's11', ku: 'Ez ji Kurdistanê me.', en: 'I am from Kurdistan.', ar: 'أنا من كردستان.', audio: '/audio/common-sentences/i_am_from_kurdistan.mp3' },
  { id: 's12', ku: 'Kêfxweş bûm.', en: 'Nice to meet you.', ar: 'تشرفت بلقائك.', audio: '/audio/common-sentences/nice_to_meet_you.mp3' },
  { id: 's13', ku: 'Ji kerema xwe', en: 'Please', ar: 'من فضلك', audio: '/audio/common-sentences/please.mp3' },
  { id: 's14', ku: 'Bibore', en: 'Sorry / Excuse me', ar: 'عذراً / آسف', audio: '/audio/common-sentences/sorry.mp3' },
  { id: 's15', ku: 'Gelek spas', en: 'Thank you very much', ar: 'شكراً جزيلاً', audio: '/audio/common-sentences/thank_you_very_much.mp3' },
  { id: 's16', ku: 'Bi xatirê te', en: 'Goodbye', ar: 'وداعاً / مع السلامة', audio: '/audio/greetings/goodbye.mp3' },
  { id: 's17', ku: 'Erê', en: 'Yes', ar: 'نعم', audio: '/audio/common-sentences/yes.mp3' },
  { id: 's18', ku: 'Na', en: 'No', ar: 'لا', audio: '/audio/common-sentences/no.mp3' }
];

export let sentences: Sentence[] = [...defaultSentences];
if (globalThis.window !== undefined) {
  const overrides = localStorage.getItem('kurmanji_sentences');
  if (overrides) {
    try {
      sentences = JSON.parse(overrides);
    } catch (e) {
      console.error("Error loading sentences overrides:", e);
    }
  }
}

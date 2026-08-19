/**
 * dialogues.ts
 * 
 * Normalized interactive dialogue scripts with scenario descriptions, audio URLs,
 * character profiles, and bilingual line-by-line scripts.
 */
import { DialogueScript } from '../schemas/contentSchemas';

export const normalizedDialogues: DialogueScript[] = [
  {
    id: 'diag_greetings_01',
    title: { en: 'Daily Greetings', ar: 'التحيات والتعارف اليومي' },
    scenarioDescription: {
      en: 'Azad and Rozha meet near the university park in Duhok and introduce themselves.',
      ar: 'يقابل آزاد روژا بالقرب من حديقة الجامعة في دهوك ويتعارفا.'
    },
    cefrLevel: 'A1',
    lines: [
      {
        id: 'd1_1',
        speakerId: 'azad',
        speakerName: { en: 'Azad', ar: 'آزاد' },
        ku: 'Rojbaş! Navê min Azad e. Navê te çi ye?',
        translations: { en: 'Good day! My name is Azad. What is your name?', ar: 'نهار مبارك! اسمي آزاد. ما اسمك؟' },
        audioUrl: '/audio/dialogues/d1_1.mp3',
        genderContext: 'M'
      },
      {
        id: 'd1_2',
        speakerId: 'rozha',
        speakerName: { en: 'Rozha', ar: 'روژا' },
        ku: 'Rojbaş Azad! Navê min Rozha ye. Tu çawa yî?',
        translations: { en: 'Good day Azad! My name is Rozha. How are you?', ar: 'نهار مبارك آزاد! اسمي روژا. كيف حالك؟' },
        audioUrl: '/audio/dialogues/d1_2.mp3',
        genderContext: 'F'
      },
      {
        id: 'd1_3',
        speakerId: 'azad',
        speakerName: { en: 'Azad', ar: 'آزاد' },
        ku: 'Ez gelek baş im, supas! Tu ji ku derê yî?',
        translations: { en: 'I am very good, thanks! Where are you from?', ar: 'أنا بخير جداً، شكراً! من أين أنتِ؟' },
        audioUrl: '/audio/dialogues/d1_3.mp3',
        genderContext: 'M'
      },
      {
        id: 'd1_4',
        speakerId: 'rozha',
        speakerName: { en: 'Rozha', ar: 'روژا' },
        ku: 'Ez ji Qamişlo me, lê ez li Duhokê dixwînim.',
        translations: { en: 'I am from Qamishli, but I study in Duhok.', ar: 'أنا من قامشلو، لكنني أدرس في دهوك.' },
        audioUrl: '/audio/dialogues/d1_4.mp3',
        genderContext: 'F'
      }
    ]
  },
  {
    id: 'diag_cafe_order',
    title: { en: 'At the Cafe', ar: 'في المقاهي والمطاعم' },
    scenarioDescription: {
      en: 'Ordering tea and traditional Kurdish bread at a local cafe in Erbil.',
      ar: 'طلب الشاي والخبز الكردي التقليدي في مقهى محلي في أربيل.'
    },
    cefrLevel: 'A1',
    lines: [
      {
        id: 'd2_1',
        speakerId: 'waiter',
        speakerName: { en: 'Waiter', ar: 'النادل' },
        ku: 'Ferman bikin! Hûn çi dixwazin?',
        translations: { en: 'At your service! What would you like?', ar: 'تفضلوا! ماذا ترغبون؟' },
        audioUrl: '/audio/dialogues/d2_1.mp3'
      },
      {
        id: 'd2_2',
        speakerId: 'customer',
        speakerName: { en: 'Customer', ar: 'الزبون' },
        ku: 'Ji kerema xwe, du çayên germ û nanê germ.',
        translations: { en: 'Please, two warm teas and warm bread.', ar: 'من فضلك، شايان دافئان وخبز ساخن.' },
        audioUrl: '/audio/dialogues/d2_2.mp3'
      },
      {
        id: 'd2_3',
        speakerId: 'waiter',
        speakerName: { en: 'Waiter', ar: 'النادل' },
        ku: 'Ser çavan! Di deqîqeyekê de amade ye.',
        translations: { en: 'With pleasure! Ready in a minute.', ar: 'على الرحب والسعة! جاهز خلال دقيقة.' },
        audioUrl: '/audio/dialogues/d2_3.mp3'
      }
    ]
  }
];

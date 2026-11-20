/**
 * navigation.ts
 * 
 * Provides safe back-navigation logic and route metadata definitions.
 * Fixes missing navigation import error.
 */

import { Language } from '../models/user';

/**
 * Marker stored as `window.history.state.usr` on every native history entry
 * the Numbers/Colors subject pages push when a number family (or the advanced
 * "large numbers" family) is opened. Read by the header/Capacitor back handlers
 * to decide whether a back press should close the overlay before navigating
 * away. A plain string primitive so it survives `pushState`'s structured clone
 * and compares with `===` after deserialisation.
 */
export const NUMBER_FAMILY_HISTORY_STATE = 'number-family';

export interface RouteMeta {
  isMainTab: boolean;
  hideHeader: boolean;
  hideBottomNav: boolean;
  safeBackTo: string;
  brandLabel: string;
  title: string;
  shellMode?: 'immersive' | 'default';
}

export function getRouteMeta(pathname: string, language: Language): RouteMeta {
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  // 1. Home
  if (pathname === '/') {
    return {
      isMainTab: true,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'KWESTA KURDÎ' : isAr ? 'كويست الكورمانجية' : 'KURMANJI QUEST',
      title: 'Zimanê Kurdî',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 2. Login
  if (pathname === '/login') {
    return {
      isMainTab: true,
      hideHeader: true,
      hideBottomNav: true,
      brandLabel: isKu ? 'BI XÊR HATÎ' : isAr ? 'مرحباً' : 'WELCOME',
      title: isKu ? 'Têketin' : isAr ? 'تسجيل الدخول' : 'Login',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 3. Alphabet
  if (pathname === '/alphabet') {
    return {
      isMainTab: true,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'LÎSTEYA TÎPAN' : isAr ? 'دراسة الأبجدية' : 'ALPHABET STUDY',
      title: isKu ? 'Tîpên Kurdî' : isAr ? 'الحروف الكوردية' : 'Letters',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 4. Vocabulary categories (Main/Sub list)
  if (pathname === '/vocabulary') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'FERHENG Û PEYV' : isAr ? 'القاموس والمفردات' : 'DICTIONARY',
      title: isKu ? 'Kategorî' : isAr ? 'التصنيفات' : 'Categories',
      safeBackTo: isKu ? 'Rêç' : isAr ? 'الخارطة' : 'Roadmap',
    };
  }

  // 5. Vocabulary categories detail / list
  if (pathname.startsWith('/vocabulary/')) {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'PEYV' : isAr ? 'المفردات' : 'VOCABULARY',
      title: isKu ? 'Lîsteya Peyvan' : isAr ? 'قائمة الكلمات' : 'Word List',
      safeBackTo: isKu ? 'Kategorî' : isAr ? 'التصنيفات' : 'Categories',
    };
  }

  // 6. Sentences builder
  if (pathname === '/sentences') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'HEVOK' : isAr ? 'الجمل' : 'PHRASES',
      title: isKu ? 'Hevokên Belav' : isAr ? 'العبارات الشائعة' : 'Common Phrases',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 5a. Writing word tracing page (per word)
  if (pathname.startsWith('/writing/words/')) {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'PEYV' : isAr ? 'كلمات' : 'WORDS',
      title: isKu ? 'Peyv' : isAr ? 'كلمة' : 'Word',
      safeBackTo: isKu ? 'Peyv' : isAr ? 'كلمات' : 'Words',
    };
  }

  // 5b. Writing word grid
  if (pathname === '/writing/words') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'NIVÎSÎN' : isAr ? 'الكتابة' : 'WRITING',
      title: isKu ? 'Peyv' : isAr ? 'كلمات' : 'Words',
      safeBackTo: isKu ? 'Nivîsîn' : isAr ? 'الكتابة' : 'Writing',
    };
  }

  // 5a2. Writing sentence tracing page (per sentence)
  if (pathname.startsWith('/writing/sentences/')) {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'HEVOK' : isAr ? 'جُمَل' : 'SENTENCES',
      title: isKu ? 'Hevok' : isAr ? 'جملة' : 'Sentence',
      safeBackTo: isKu ? 'Hevok' : isAr ? 'جُمَل' : 'Sentences',
    };
  }

  // 5b2. Writing sentence grid
  if (pathname === '/writing/sentences') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'NIVÎSÎN' : isAr ? 'الكتابة' : 'WRITING',
      title: isKu ? 'Hevok' : isAr ? 'جُمَل' : 'Sentences',
      safeBackTo: isKu ? 'Nivîsîn' : isAr ? 'الكتابة' : 'Writing',
    };
  }

  // 5c. Writing tracing page (per letter)
  if (pathname.startsWith('/writing/')) {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'NIVÎSÎN' : isAr ? 'الكتابة' : 'WRITING',
      title: isKu ? 'Şopandin' : isAr ? 'الكتابة' : 'Trace',
      safeBackTo: isKu ? 'Nivîsîn' : isAr ? 'الكتابة' : 'Writing',
    };
  }

  // 5b. Writing grid page (Nivîsîn)
  if (pathname === '/writing') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'NIVÎSÎN' : isAr ? 'الكتابة' : 'WRITING',
      title: isKu ? 'Nivîsîn' : isAr ? 'الكتابة' : 'Writing',
      safeBackTo: isKu ? 'Fêrbûn' : isAr ? 'التعلّم' : 'Learning',
    };
  }

  // 6a. Grammar lesson placeholder (sub-category detail)
  if (pathname.startsWith('/grammar/')) {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'RÊZIMAN' : isAr ? 'قواعد' : 'GRAMMAR',
      title: isKu ? 'Ders' : isAr ? 'الدرس' : 'Lesson',
      safeBackTo: isKu ? 'Rêziman' : isAr ? 'النحو' : 'Grammar',
    };
  }

  // 6b. Grammar sub-category hub
  if (pathname === '/grammar') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'RÊZIMAN' : isAr ? 'قواعد' : 'GRAMMAR',
      title: isKu ? 'Rêziman' : isAr ? 'النحو' : 'Grammar',
      safeBackTo: isKu ? 'Fêrbûn' : isAr ? 'التعلّم' : 'Learning',
    };
  }

  // 7. Favorites
  if (pathname === '/favorites') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'KOMEL' : isAr ? 'مجموعتي' : 'SAVED',
      title: isKu ? 'Bijare' : isAr ? 'المفضلة' : 'Favorites',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 9. Active Quiz
  if (pathname.startsWith('/quiz/')) {
    return {
      isMainTab: false,
      // DESIGN FIX: the quiz screens render their own compact header (exit,
      // mode title, hearts, counter). Stacking the app bar above it produced
      // double chrome — two headers and two back affordances — in a flow
      // that is declared immersive.
      hideHeader: true,
      hideBottomNav: true,
      brandLabel: isKu ? 'PIRS' : isAr ? 'التحدي' : 'QUIZ ZONE',
      title: isKu ? 'Pirs' : isAr ? 'اختبار' : 'Quiz',
      safeBackTo: isKu ? 'Rêç' : isAr ? 'الخارطة' : 'Roadmap',
      shellMode: 'immersive',
    };
  }

  // 10. Roadmap
  if (pathname === '/roadmap') {
    return {
      isMainTab: true,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'PLANA DERSAN' : isAr ? 'المنهج الدراسي' : 'CURRICULUM',
      title: isKu ? 'Rêça Hînbûnê' : isAr ? 'الخارطة التعليمية' : 'Roadmap',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 11. Games
  if (pathname === '/games') {
    return {
      isMainTab: true,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'LÎSTIKÊN ŞAHIYÊ' : isAr ? 'ركن الألعاب' : 'FUN ARCADE',
      title: isKu ? 'Lîstikên Perwerdeyê' : isAr ? 'الألعاب التعليمية' : 'Mini-Games',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // Gem Store
  if (pathname === '/store') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'DIKANA GEWHERAN' : isAr ? 'متجر الجواهر' : 'GEM STORE',
      title: isKu ? 'Dikan' : isAr ? 'المتجر' : 'Store',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 12. Search
  if (pathname === '/search') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'FERHENG' : isAr ? 'المعجم الكوردي' : 'GLOSSARY',
      title: isKu ? 'Lêgerîn' : isAr ? 'البحث' : 'Search',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 14. Profile
  if (pathname === '/profile') {
    return {
      isMainTab: true,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'HESAB' : isAr ? 'الحساب' : 'ACCOUNT',
      title: isKu ? 'Profîl' : isAr ? 'الملف الشخصي' : 'Profile',
      safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
    };
  }

  // 15. Leaderboard
  if (pathname === '/leaderboard') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'RÊZBÛN' : isAr ? 'الترتيب' : 'RANKING',
      title: isKu ? 'Tabloya Pêşengan' : isAr ? 'لوحة الصدارة' : 'Leaderboard',
      safeBackTo: isKu ? 'Profîl' : isAr ? 'الملف الشخصي' : 'Profile',
    };
  }

  // 16. Privacy Policy
  if (pathname === '/privacy') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'PARASTINA DANEYAN' : isAr ? 'الخصوصية' : 'COMPLIANCE',
      title: isKu ? 'Rêbaza Nepeniyê' : isAr ? 'سياسة الخصوصية' : 'Privacy Policy',
      safeBackTo: isKu ? 'Profîl' : isAr ? 'الملف الشخصي' : 'Profile',
    };
  }

  // 17. Terms of Service
  if (pathname === '/terms') {
    return {
      isMainTab: false,
      hideHeader: false,
      hideBottomNav: false,
      brandLabel: isKu ? 'ŞERTÊN BIKARANÎNÊ' : isAr ? 'الشروط' : 'COMPLIANCE',
      title: isKu ? 'Mercên Xizmetê' : isAr ? 'شروط الخدمة' : 'Terms of Service',
      safeBackTo: isKu ? 'Profîl' : isAr ? 'الملف الشخصي' : 'Profile',
    };
  }

  // 18. Default / Fallback
  return {
    isMainTab: false,
    hideHeader: false,
    hideBottomNav: false,
    brandLabel: isKu ? 'KWESTA KURDÎ' : isAr ? 'كويست الكورمانجية' : 'KURMANJI QUEST',
    title: isKu ? 'Hîn Bibe' : isAr ? 'تعلم' : 'Learn',
    safeBackTo: isKu ? 'Mal' : isAr ? 'الرئيسية' : 'Home',
  };
}

export function navigateSafelyBack(navigate: (path: string | number) => void, pathname: string) {
  // Prefer the user's REAL previous screen whenever in-app history exists
  // (react-router tracks its position in history.state.idx). The hardcoded
  // parent map below only serves deep links / fresh sessions, where -1
  // would exit the app or land somewhere unexpected.
  const historyIdx =
    globalThis.window !== undefined && window.history.state && Number.isInteger(window.history.state.idx)
      ? window.history.state.idx
      : 0;
  if (historyIdx > 0) {
    navigate(-1);
    return;
  }

  if (pathname.startsWith('/vocabulary/')) {
    navigate('/learn');
  } else if (pathname === '/vocabulary') {
    navigate('/roadmap');
  } else if (pathname.startsWith('/quiz/')) {
    navigate('/roadmap');
  } else if (pathname === '/leaderboard' || pathname === '/privacy' || pathname === '/terms') {
    navigate('/profile');
  } else if (pathname === '/grammar') {
    navigate('/learn');
  } else if (pathname.startsWith('/grammar/')) {
    navigate('/grammar');
  } else if (pathname === '/writing') {
    navigate('/learn');
  } else if (pathname.startsWith('/writing/words/')) {
    navigate('/writing/words');
  } else if (pathname === '/writing/words') {
    navigate('/writing');
  } else if (pathname.startsWith('/writing/sentences/')) {
    navigate('/writing/sentences');
  } else if (pathname === '/writing/sentences') {
    navigate('/writing');
  } else if (pathname.startsWith('/writing/')) {
    navigate('/writing');
  } else {
    navigate('/');
  }
}

/**
 * Back-press interceptor registry (LIFO).
 *
 * Some screens own a sub-level the router cannot see — the writing lesson's
 * watch/trace/write stages and its result overlay are component state, not
 * routes. A back press on such a screen must climb ONE level INSIDE the screen
 * instead of popping the route. Screens register a handler here; the header
 * arrow and the Capacitor hardware back button run the registry FIRST (before
 * navigateSafelyBack), and the most recently mounted screen gets the first
 * chance to consume the press.
 *
 * The registry is a module-level array with no window access, so it is safe
 * under SSR and jsdom (handlers are simply never invoked there).
 */
export type BackInterceptor = () => boolean;

const backInterceptors: BackInterceptor[] = [];

/** Register an interceptor; returns the unregister function (use as an effect cleanup). */
export function registerBackInterceptor(fn: BackInterceptor): () => void {
  backInterceptors.push(fn);
  return () => {
    const idx = backInterceptors.indexOf(fn);
    if (idx >= 0) backInterceptors.splice(idx, 1);
  };
}

/**
 * Run registered interceptors LIFO (most recently mounted screen first).
 * Returns true when one consumed the back press — the caller must then NOT
 * navigate; false means the press falls through to normal back navigation.
 */
export function runBackInterceptors(): boolean {
  for (let i = backInterceptors.length - 1; i >= 0; i--) {
    if (backInterceptors[i]()) return true;
  }
  return false;
}

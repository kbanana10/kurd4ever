/**
 * navigation.ts
 * 
 * Provides safe back-navigation logic and route metadata definitions.
 * Fixes missing navigation import error.
 */

import { Language } from '../models/user';

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
    navigate('/vocabulary');
  } else if (pathname === '/vocabulary') {
    navigate('/roadmap');
  } else if (pathname.startsWith('/quiz/')) {
    navigate('/roadmap');
  } else if (pathname === '/leaderboard' || pathname === '/privacy' || pathname === '/terms') {
    navigate('/profile');
  } else {
    navigate('/');
  }
}

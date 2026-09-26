/**
 * App.tsx
 *
 * Main routing system mapping out features, dashboards, and pages.
 * Includes global ads simulation portals.
 *
 * AUDIT FIX: every page used to be a static import, producing a single
 * 2,327 kB JS chunk (553 kB gzip) that had to be parsed before first paint.
 * Routes are now lazy-loaded so the initial download only contains the shell,
 * the auth provider and the landing route.
 */
import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router';
import { AuthProvider } from './store/AuthContext';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { WRITING_WORDS_ENABLED, WRITING_SENTENCES_ENABLED } from './lib/writingFlags';
import { InterstitialAdModal, RewardedAdModal } from './features/monetization/components/AdElements';
import { NetworkStatusBadge } from './components/NetworkStatusBadge';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteFallback } from './components/RouteFallback';

// Route-level code splitting. Heavy, rarely-entered screens (games,
// dictionary) are the biggest wins here.
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const LearningHub = lazy(() => import('./pages/LearningHub').then(m => ({ default: m.LearningHub })));
const Alphabet = lazy(() => import('./pages/Alphabet').then(m => ({ default: m.Alphabet })));
const VocabularyCategories = lazy(() => import('./pages/VocabularyCategories').then(m => ({ default: m.VocabularyCategories })));
const VocabularyList = lazy(() => import('./pages/VocabularyList').then(m => ({ default: m.VocabularyList })));
const Sentences = lazy(() => import('./pages/Sentences').then(m => ({ default: m.Sentences })));
const Grammar = lazy(() => import('./pages/Grammar').then(m => ({ default: m.Grammar })));
const GrammarLessonPage = lazy(() => import('./pages/grammar/GrammarLesson').then(m => ({ default: m.GrammarLessonPage })));
const Writing = lazy(() => import('./pages/Writing').then(m => ({ default: m.Writing })));
const WritingTracingPage = lazy(() => import('./pages/WritingTracingPage').then(m => ({ default: m.WritingTracingPage })));
const WritingLessonPage = lazy(() => import('./pages/WritingLessonPage').then(m => ({ default: m.WritingLessonPage })));
const WritingWords = lazy(() => import('./pages/WritingWords').then(m => ({ default: m.WritingWords })));
const WritingWordTracingPage = lazy(() => import('./pages/WritingWordTracingPage').then(m => ({ default: m.WritingWordTracingPage })));
const WritingSentences = lazy(() => import('./pages/WritingSentences').then(m => ({ default: m.WritingSentences })));
const WritingSentenceTracingPage = lazy(() => import('./pages/WritingSentenceTracingPage').then(m => ({ default: m.WritingSentenceTracingPage })));
const WritingComingSoon = lazy(() => import('./pages/WritingComingSoon').then(m => ({ default: m.WritingComingSoon })));
const Favorites = lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const Quiz = lazy(() => import('./pages/Quiz').then(m => ({ default: m.Quiz })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Store = lazy(() => import('./pages/Store').then(m => ({ default: m.Store })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const Roadmap = lazy(() => import('./pages/Roadmap').then(m => ({ default: m.Roadmap })));
const Games = lazy(() => import('./pages/Games').then(m => ({ default: m.Games })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

/** Remounts the word-tracing screen whenever the :wordId param changes. */
function KeyedWritingWordTracing() {
  const { wordId } = useParams();
  return <WritingWordTracingPage key={wordId} />;
}

/** Remounts the sentence-tracing screen whenever the :sentenceId changes. */
function KeyedWritingSentenceTracing() {
  const { sentenceId } = useParams();
  return <WritingSentenceTracingPage key={sentenceId} />;
}

/**
 * Word-tracing gate. While WRITING_WORDS_ENABLED is false the real screens
 * stay lazy-unloaded and the user sees the "Coming Soon" placeholder instead.
 */
function WordsGate() {
  return WRITING_WORDS_ENABLED ? <WritingWords /> : <WritingComingSoon feature="words" />;
}

/**
 * Single-word-tracing gate. While WRITING_WORDS_ENABLED is false the real
 * per-word canvas stays lazy-unloaded behind the placeholder.
 */
function WordTracingGate() {
  return WRITING_WORDS_ENABLED ? <KeyedWritingWordTracing /> : <WritingComingSoon feature="words" />;
}

/**
 * Sentence-list gate. While WRITING_SENTENCES_ENABLED is false the user sees
 * the placeholder instead of the sentences grid.
 */
function SentencesGate() {
  return WRITING_SENTENCES_ENABLED ? <WritingSentences /> : <WritingComingSoon feature="sentences" />;
}

/**
 * Sentence-tracing gate. While WRITING_SENTENCES_ENABLED is false the user
 * sees the placeholder instead of the sentence canvas.
 */
function SentenceTracingGate() {
  return WRITING_SENTENCES_ENABLED ? <KeyedWritingSentenceTracing /> : <WritingComingSoon feature="sentences" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <NetworkStatusBadge />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route
                  index
                  element={
                    <ErrorBoundary
                      fallbackTitleAr="حدث خطأ في الصفحة الرئيسية"
                      fallbackTitleEn="An error occurred on the home page"
                      fallbackDescAr="يمكنك إعادة تحميل الصفحة أو التنقل عبر الشريط السفلي."
                      fallbackDescEn="You can reload the page or navigate using the bottom bar."
                    >
                      <Dashboard />
                    </ErrorBoundary>
                  }
                />
                <Route path="login" element={<Login />} />
                <Route path="learn" element={<LearningHub />} />
                <Route path="alphabet" element={<Alphabet />} />
                <Route path="vocabulary" element={<VocabularyCategories />} />
                <Route path="vocabulary/:categoryId" element={<VocabularyList />} />
                <Route path="sentences" element={<Sentences />} />
                <Route path="grammar" element={<Grammar />} />
                <Route path="grammar/:lessonId" element={<GrammarLessonPage />} />
                <Route path="writing" element={<Writing />} />
                {/* Interactive Letter Writing Lesson (data-driven, all 31).
                    Declared BEFORE writing/:letterId so /writing/lesson/A
                    matches the lesson, not the legacy single-letter trace. */}
                <Route path="writing/lesson/:letterId" element={<WritingLessonPage />} />
                {/* Word + sentence routes stay registered; the gate swaps in the
                    "Coming Soon" placeholder until the flags are re-enabled. */}
                <Route path="writing/words" element={<WordsGate />} />
                <Route path="writing/words/:wordId" element={<WordTracingGate />} />
                <Route path="writing/sentences" element={<SentencesGate />} />
                <Route path="writing/sentences/:sentenceId" element={<SentenceTracingGate />} />
                <Route path="writing/:letterId" element={<WritingTracingPage />} />
                <Route path="favorites" element={<Favorites />} />
                <Route
                  path="quiz/:moduleId"
                  element={
                    <ErrorBoundary
                      fallbackTitleAr="حدث خطأ في محرك الاختبار"
                      fallbackTitleEn="An error occurred in the quiz engine"
                      fallbackDescAr="يمكنك العودة إلى الخارطة وإعادة محاولة الدرس بأمان."
                      fallbackDescEn="You can safely return to the roadmap and retry the lesson."
                    >
                      <Quiz />
                    </ErrorBoundary>
                  }
                />
                <Route path="roadmap" element={<Roadmap />} />
                <Route
                  path="games"
                  element={
                    <ErrorBoundary
                      fallbackTitleAr="حدث خطأ في اللعبة"
                      fallbackTitleEn="An error occurred in the game"
                      fallbackDescAr="تقدمك محفوظ. يمكنك العودة واختيار لعبة أخرى."
                      fallbackDescEn="Your progress is saved. Go back and pick another game."
                    >
                      <Games />
                    </ErrorBoundary>
                  }
                />
                <Route path="search" element={<Search />} />
                <Route path="store" element={<Store />} />
                <Route
                  path="profile"
                  element={
                    <ErrorBoundary
                      fallbackTitleAr="حدث خطأ في صفحة الملف الشخصي"
                      fallbackTitleEn="An error occurred in profile page"
                      fallbackDescAr="بياناتك المحفوظة بخير. اضغط على إعادة التحميل للبدء مجدداً."
                      fallbackDescEn="Your saved data is intact. Click reload to try again."
                    >
                      <Profile />
                    </ErrorBoundary>
                  }
                />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
                {/* AUDIT FIX: previously any unknown URL rendered a blank page. */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>

          {/* Global Ads Simulator Portals */}
          <InterstitialAdModal />
          <RewardedAdModal />
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}

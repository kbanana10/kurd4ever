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
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './store/AuthContext';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { InterstitialAdModal, RewardedAdModal } from './features/monetization/components/AdElements';
import { NetworkStatusBadge } from './components/NetworkStatusBadge';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteFallback } from './components/RouteFallback';

// Route-level code splitting. Heavy, rarely-entered screens (games,
// dictionary) are the biggest wins here.
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Alphabet = lazy(() => import('./pages/Alphabet').then(m => ({ default: m.Alphabet })));
const VocabularyCategories = lazy(() => import('./pages/VocabularyCategories').then(m => ({ default: m.VocabularyCategories })));
const VocabularyList = lazy(() => import('./pages/VocabularyList').then(m => ({ default: m.VocabularyList })));
const Sentences = lazy(() => import('./pages/Sentences').then(m => ({ default: m.Sentences })));
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
                <Route path="alphabet" element={<Alphabet />} />
                <Route path="vocabulary" element={<VocabularyCategories />} />
                <Route path="vocabulary/:categoryId" element={<VocabularyList />} />
                <Route path="sentences" element={<Sentences />} />
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

import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { 
  BookA, Hash, ArrowLeft, Search, User, Bell, X as CloseIcon, 
  Gamepad2, Map, Flame, Smile, GraduationCap, Sparkles, Star, Compass, Award 
, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { t, getLayoutDirection } from '../localization/translations';
import { getRouteMeta, navigateSafelyBack } from '../lib/navigation';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { motion, AnimatePresence } from 'motion/react';
import { checkAndTriggerReminder } from '../lib/ReminderService';
import { Modal, Button } from './ui';
import { AVATARS } from '../constants/appConstants';

const renderHeaderAvatarIcon = (iconName: string) => {
  const iconMap = {
    'user': User,
    'smile': Smile,
    'graduation-cap': GraduationCap,
    'flame': Flame,
    'sparkles': Sparkles,
    'star': Star,
    'compass': Compass,
    'award': Award,
  } satisfies Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = iconMap[iconName] || User;
  return <IconComponent className="w-5 h-5" />;
};

export function MainLayout() {
  const { user, userData, loading, language } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeMeta = getRouteMeta(location.pathname, language);
  const isProfile = location.pathname === '/profile';
  const isHome = location.pathname === '/';
  const selectedHeaderAvatar = AVATARS.find(a => a.id === userData?.avatarId) || AVATARS[0];
  const [showExitModal, setShowExitModal] = useState(false);

  // GLOBAL SCROLL RESET (navigation audit, CRITICAL): the app scrolls inside
  // <main> (flex-1 overflow-y-auto), NOT the window — so switching routes
  // kept the previous page's scroll offset (Profile opened mid-scroll after
  // a long Dashboard). Every pathname change now snaps the container (and
  // window, for safety) back to (0,0) instantly; direct property writes
  // bypass the container's CSS scroll-smooth so there is no visible glide.
  const mainScrollRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
      mainScrollRef.current.scrollLeft = 0;
    }
    if (globalThis.window !== undefined) window.scrollTo(0, 0);
  }, [location.pathname]);
  const [activeNotification, setActiveNotification] = useState<{ title: string; message: string } | null>(null);

  // UX: the toast overlays the header — never let it BLOCK navigation.
  // Auto-dismiss after 8 seconds so an unattended reminder can't trap taps.
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => setActiveNotification(null), 8000);
    return () => clearTimeout(timer);
  }, [activeNotification]);
  const [isGameActive, setIsGameActive] = useState(false);

  // Listener to customize layout when a gaming screen is active.
  // The route guard below ensures an interrupted game cannot leave the shell
  // chrome hidden after navigating away from /games.
  useEffect(() => {
    const handleGameActive = (e: Event) => {
      // SAFETY: 'set-game-active' is dispatched only by Games.tsx with a boolean detail; non-boolean details are rejected by the guard below.
      const customEvent = e as CustomEvent<boolean>;
      if (customEvent && (customEvent.detail === true || customEvent.detail === false)) {
        setIsGameActive(customEvent.detail && location.pathname === '/games');
      }
    };
    window.addEventListener('set-game-active', handleGameActive);
    return () => {
      window.removeEventListener('set-game-active', handleGameActive);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/games' && isGameActive) {
      setIsGameActive(false);
    }
  }, [isGameActive, location.pathname]);

  // Periodic reminder background worker
  useEffect(() => {
    if (loading || !user || !userData) return;

    const checkReminder = () => {
      const result = checkAndTriggerReminder(userData.lastActive, language);
      if (result.triggered) {
        setActiveNotification({
          title: result.title,
          message: result.message,
        });
      }
    };

    // Run check on mount after 3 seconds
    const initialTimeout = setTimeout(checkReminder, 3000);

    // Run check every 60 seconds
    const intervalId = setInterval(checkReminder, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [user, loading, userData, language]);

  // Listen to custom event to show standard in-app notifications instantly (e.g. for testing)
  useEffect(() => {
    const handleInAppTrigger = (e: Event) => {
      // SAFETY: 'trigger-in-app-notification' is dispatched only by ReminderService/Profile with string title+message.
      const customEvent = e as CustomEvent<{ title: string; message: string }>;
      if (customEvent.detail) {
        setActiveNotification(customEvent.detail);
      }
    };
    
    window.addEventListener('trigger-in-app-notification', handleInAppTrigger);
    return () => {
      window.removeEventListener('trigger-in-app-notification', handleInAppTrigger);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [user, loading, location, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      if (showExitModal) {
        setShowExitModal(false);
      } else if (location.pathname === '/' || location.pathname === '/login') {
        setShowExitModal(true);
      } else {
        navigateSafelyBack(navigate, location.pathname);
      }
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [location.pathname, navigate, showExitModal]);

  const isMainTab = routeMeta.isMainTab;
  const isLogin = routeMeta.hideHeader && location.pathname === '/login';
  const shouldHideHeader = routeMeta.hideHeader || isGameActive;
  const shouldHideBottomNav = routeMeta.hideBottomNav || isGameActive || isLogin;

  useEffect(() => {
    if (globalThis.document !== undefined) {
      document.documentElement.lang = language;
      document.documentElement.dir = getLayoutDirection(language);
    }
  }, [language]);

  if (loading) {
    return <div className="h-[100dvh] w-full flex items-center justify-center text-brand-deep dark:text-[#FFCE6B] font-bold text-2xl animate-pulse">{t(language, 'loading')}</div>;
  }

  return (
    <div dir={getLayoutDirection(language)} className={cn(
      "h-[100dvh] w-full flex justify-center text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300",
      isGameActive ? "bg-slate-950" : "bg-surface-2 dark:bg-slate-950"
    )}>
      <div className={cn(
        "w-full max-w-md h-full shadow-2xl relative flex flex-col overflow-hidden transition-colors duration-300",
        isGameActive ? "bg-slate-950" : "bg-slate-50 dark:bg-slate-900"
      )}>
        
        {/*
          AUDIT FIX: this exit confirmation was a bare div with no role="dialog",
          no aria-modal, no focus trap, no Escape handling and no focus
          restoration. On Android TalkBack the dialog was announced as ordinary
          page content and focus stayed behind the scrim. It now uses the shared
          accessible Modal primitive.
        */}
        <Modal
          open={showExitModal}
          onClose={() => setShowExitModal(false)}
          title={t(language, 'exit_confirm_title')}
          description={t(language, 'exit_confirm_msg')}
          hideCloseButton
        >
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowExitModal(false)}
            >
              {t(language, 'exit_confirm_no')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => CapacitorApp.exitApp()}
            >
              {t(language, 'exit_confirm_yes')}
            </Button>
          </div>
        </Modal>

        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 inset-x-4 bg-white dark:bg-slate-900 text-ink rounded-3xl p-4 shadow-[0_18px_44px_rgba(30,41,59,0.18)] z-[60] flex items-start gap-3 border border-line-soft border-s-4 border-s-[#FFB300] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB300]/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
              
              <div className="bg-[#FFF3D6] dark:bg-[#3A2F14] p-2.5 rounded-full shrink-0 mt-0.5 text-[#B8860B] dark:text-[#FFCE6B]">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-bold text-sm tracking-tight leading-snug"><bdi>{activeNotification.title}</bdi></h4>
                <p className="text-xs text-muted mt-1 leading-normal"><bdi>{activeNotification.message}</bdi></p>
                <div className="flex gap-2.5 mt-3">
                  <button 
                    onClick={() => {
                      setActiveNotification(null);
                      navigate('/');
                    }}
                    className="bg-[#FFB300] text-[#432C00] font-extrabold text-xs px-4 py-2 rounded-full hover:bg-[#E69500] active:scale-95 transition-all shadow-[0_2px_0_#E69500] cursor-pointer"
                  >
                    {language !== 'ar' ? 'Practice Now' : 'تمرّن الآن'}
                  </button>
                  <button 
                    onClick={() => setActiveNotification(null)}
                    className="bg-transparent hover:bg-surface-2 text-muted border border-line-soft font-bold text-xs px-3 py-2 rounded-full active:scale-95 transition-all cursor-pointer"
                  >
                    {language !== 'ar' ? 'Snooze' : 'لاحقاً'}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveNotification(null)} 
                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-surface-2 transition-colors shrink-0 -me-1 -mt-1 cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!shouldHideHeader && (
          <header className="px-4 py-3 flex items-center shadow-xs z-10 bg-white dark:bg-slate-900 border-b border-line dark:border-slate-800 min-h-[56px]">
            {(!isMainTab || isProfile) && (
              <button 
                onClick={() => navigateSafelyBack(navigate, location.pathname)} 
                type="button"
                aria-label={language !== 'ar' ? `Back to ${routeMeta.safeBackTo}` : 'رجوع آمن'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors -ms-2 me-2 focus-visible:ring-2 focus-visible:ring-[#FFB300] dark:focus-visible:ring-[#FFBA38]"
              >
                <ArrowLeft className={cn("w-6 h-6 rtl:-scale-x-100", isProfile ? "text-[#FFB300]" : "text-slate-600 dark:text-slate-400")} />
              </button>
            )}

            {/* Avatar leads the header on every main tab (home-style bar) */}
            {isMainTab && !isProfile && (
              <button 
                onClick={() => navigate('/profile')}
                type="button"
                aria-label={language !== 'ar' ? 'Profile' : 'الملف الشخصي'}
                title={language !== 'ar' ? 'Profile' : 'الملف الشخصي'}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer overflow-hidden shadow-2xs border border-line-soft focus-visible:ring-2 focus-visible:ring-[#FFB300] shrink-0 me-3"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user?.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${selectedHeaderAvatar.color}`}>
                    {renderHeaderAvatarIcon(selectedHeaderAvatar.icon)}
                  </div>
                )}
              </button>
            )}

            <div className={cn("flex-1 min-w-0", isProfile ? "text-center" : "text-start")}>
              {!isProfile && (
                <p dir="auto" className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B45309] dark:text-[#FFCE6B] leading-none truncate">
                  {routeMeta.brandLabel}
                </p>
              )}
              {/* R-05: dir="auto" — the home title stays Latin ("Zimanê
                  Kurdî") even under Arabic UI; truncating it inside an RTL
                  block produced a mixed-direction hash ("…anê Kurdî"). With
                  auto direction each line ellipsizes on its own correct side;
                  Arabic titles keep RTL, Kurdish/Latin titles get LTR. */}
              <h1 dir="auto" className="text-lg font-black tracking-tight text-ink truncate leading-tight mt-0.5">
                {routeMeta.title}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 ms-auto">
              {/* Profile: settings gear (mockup) */}
              {isProfile && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('kq:profile-settings'))}
                  aria-label={language !== 'ar' ? 'Settings' : 'الإعدادات'}
                  title={language !== 'ar' ? 'Settings' : 'الإعدادات'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[#FFB300] focus-visible:ring-2 focus-visible:ring-[#FFB300]"
                >
                  <SettingsIcon className="w-6 h-6" />
                </button>
              )}

              {/* One combined streak + gems pill — universal header (home style) */}
              {!isProfile && (
                <div data-tour="stats-pill" className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-line-soft rounded-full px-3.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                  {/* R-03: visual size unchanged; padding + negative margins
                      expand each hit area to ≥44px (was 28×21 / 47×21 via the
                      old `p-0 min-h-0` opt-out). Inner edges expand only 6px
                      each so the two targets stay ~13px apart — no cross-tap. */}
                  <button
                    onClick={() => navigate('/')}
                    type="button"
                    title={language !== 'ar' ? 'Current Streak' : 'سلسلة الأيام'}
                    className="flex items-center gap-1 cursor-pointer bg-transparent border-none min-h-0 py-3 -my-3 ps-3 -ms-3 pe-1.5 -me-1.5"
                  >
                    <Flame className={`w-4 h-4 ${(userData?.streak || 0) > 0 ? 'text-orange-500 fill-orange-500' : 'text-orange-400'}`} />
                    <span className="font-black text-sm text-ink">{userData?.streak || 0}</span>
                  </button>
                  <span className="w-px h-4 bg-line-soft" aria-hidden="true" />
                  <button
                    onClick={() => navigate('/store')}
                    type="button"
                    title={language !== 'ar' ? 'Gems' : 'الجواهر'}
                    className="flex items-center gap-1 cursor-pointer bg-transparent border-none min-h-0 py-3 -my-3 pe-3 -me-3 ps-1.5 -ms-1.5"
                  >
                    <span className="text-sm">💎</span>
                    <span className="font-black text-sm text-ink">{userData?.gems || 0}</span>
                  </button>
                </div>
              )}

            </div>
          </header>
        )}

        <main ref={mainScrollRef} className={cn(
          "flex-1 overflow-y-auto scroll-smooth",
          shouldHideBottomNav ? "pb-0" : "pb-20",
          (isGameActive || routeMeta.shellMode === 'immersive') && "relative overflow-hidden h-full flex flex-col"
        )}>
          <Outlet />
        </main>
        
        {!shouldHideBottomNav && (
          <nav 
            aria-label="Main Navigation"
            className="absolute bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800 flex justify-around items-center px-1 pb-safe pt-1 h-16 z-20 shadow-[0_-10px_35px_rgba(0,0,0,0.035)]"
          >
            <NavIcon path="/" icon={<Hash className="w-5 h-5" />} label={t(language, 'home')} current={location.pathname} />
            <NavIcon path="/alphabet" icon={<BookA className="w-5 h-5" />} label={t(language, 'alphabet')} current={location.pathname} />
            <NavIcon path="/roadmap" icon={<Map className="w-5 h-5" />} label={t(language, 'roadmap_tab')} current={location.pathname} tourId="nav-roadmap" />
            <NavIcon path="/games" icon={<Gamepad2 className="w-5 h-5" />} label={t(language, 'games_tab')} current={location.pathname} />
            <NavIcon path="/profile" icon={<User className="w-5 h-5" />} label={t(language, 'profile_tab')} current={location.pathname} />
          </nav>
        )}
      </div>
    </div>
  );
}

function NavIcon({ path, icon, label, current, tourId }: { path: string, icon: React.ReactNode, label: string, current: string, tourId?: string }) {
  const navigate = useNavigate();
  const isActive = current === path || (path !== '/' && current.startsWith(path));
  
  return (
    <button 
      onClick={() => navigate(path)} 
      type="button"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      data-tour={tourId}
      className={cn(
        "flex flex-col items-center justify-center flex-1 min-w-[44px] h-full relative transition-all duration-300 outline-none select-none cursor-pointer whitespace-nowrap rounded-xl focus-visible:ring-2 focus-visible:ring-[#FFB300] dark:focus-visible:ring-[#FFBA38] px-0.5",
        isActive ? "text-[#432C00] font-extrabold" : "text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      )}
    >
      <div className="relative flex flex-col items-center justify-center w-full">
        {isActive && (
          <motion.div 
            layoutId="activeNavTab"
            className="absolute -inset-x-1.5 -inset-y-1 bg-[#FFB300] rounded-2xl -z-10 shadow-[0_3px_0_#E69500]"
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
          />
        )}
        <div className={cn("transition-transform duration-300", isActive ? "scale-105 -translate-y-0.5" : "")}>
          {icon}
        </div>
        <span className={cn("text-[10px] font-bold uppercase mt-1 tracking-tighter block transition-all whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-0.5", isActive ? "opacity-100 scale-100" : "opacity-80 scale-95")}>{label}</span>
      </div>
    </button>
  );
}

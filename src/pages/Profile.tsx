import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { 
  User as UserIcon, LogOut, Award, Flame, BookOpen, Star, 
  MapPin, Globe, Edit2, Check, X, Sun, Moon, Bell, Clock, 
  Sparkles, Brain, ShieldCheck, ChevronRight, BarChart2, MessageCircle, Trophy, Library,
  Smile, GraduationCap, Compass, Search
} from 'lucide-react';
import { telemetryService } from '../services/TelemetryService';
import { UserData } from '../models/user';
import { t } from '../lib/translations';
import { motion, AnimatePresence } from 'motion/react';
import { useAdStore } from '../features/monetization/store/adStore';
import { 
  getReminderSettings, saveReminderSettings, isNotificationPermissionGranted, 
  requestNotificationPermission, supportsNotifications, getReminderContent
} from '../lib/ReminderService';
import { AVATARS, KURDISH_REGIONS } from '../constants/appConstants';
import { getMissionStatuses, claimMission } from '../services/MissionsService';
import { Switch } from '../components/ui';
import { resetToursForReplay } from '../features/tour/tours';

const renderProfileAvatarIcon = (iconName: string, className = "w-12 h-12") => {
  const iconMap = {
    'user': UserIcon,
    'smile': Smile,
    'graduation-cap': GraduationCap,
    'flame': Flame,
    'sparkles': Sparkles,
    'star': Star,
    'compass': Compass,
    'award': Award,
  } satisfies Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = iconMap[iconName] || UserIcon;
  return <IconComponent className={className} />;
};

interface BadgeItem {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleKu?: string;
  titleAr: string;
  descEn: string;
  descKu?: string;
  descAr: string;
  color: string;
}

const BADGES_DB: BadgeItem[] = [
  { id: 'first_steps', icon: <UserIcon className="w-6 h-6" />, titleEn: 'First Steps', titleKu: 'Gavên Yekem', titleAr: 'الخطوة الأولى', descEn: 'Earn 50 XP to begin your path', descKu: '50 XP qezenc bike ji bo destpêkirinê', descAr: 'اجمع أول 50 نقطة لبدء المسار', color: 'from-blue-400 to-indigo-500' },
  { id: 'dedicated_learner', icon: <Flame className="w-6 h-6" />, titleEn: 'Dedicated Learner', titleKu: 'Fêrxwazê Xebatkar', titleAr: 'المتعلم المكرّس', descEn: 'Accumulate 500 XP total', descKu: 'Tevahiya 500 XP berhev bike', descAr: 'احصد 500 نقطة خبرة إجمالية', color: 'from-orange-400 to-red-500' },
  { id: 'academic_achiever', icon: <BookOpen className="w-6 h-6" />, titleEn: 'Academic Scholar', titleKu: 'Zanayê Akademîk', titleAr: 'العالم الأكاديمي', descEn: 'Accumulate 1500 XP total', descKu: 'Tevahiya 1500 XP berhev bike', descAr: 'احصد 1500 نقطة خبرة إجمالية', color: 'from-yellow-400 to-amber-500' },
  { id: 'vocabulary_enthusiast', icon: <BookOpen className="w-6 h-6" />, titleEn: 'Vocab Hobbyist', titleKu: 'Hezkiriyê Peyvan', titleAr: 'هاوي المفردات', descEn: 'Learn at least 10 words', descKu: 'Kêmzêde 10 peyvan fêr bibe', descAr: 'أتقن ما لا يقل عن 10 كلمات كوردية', color: 'from-emerald-400 to-green-500' },
  { id: 'vocabulary_master', icon: <Star className="w-6 h-6" />, titleEn: 'Lexicon King', titleKu: 'Mîrê Ferhengê', titleAr: 'ملك القاموس', descEn: 'Learn at least 50 words', descKu: 'Kêmzêde 50 peyvan fêr bibe', descAr: 'أتقن ما لا يقل عن 50 كلمة كوردية', color: 'from-teal-400 to-emerald-600' },
  { id: 'polyglot', icon: <MessageCircle className="w-6 h-6" />, titleEn: 'Speech Polyglot', titleKu: 'Zimanzanê Kurmancî', titleAr: 'متحدث فصيح', descEn: 'Learn at least 150 words', descKu: 'Kêmzêde 150 peyvan fêr bibe', descAr: 'أتقن ما لا يقل عن 150 كلمة كوردية', color: 'from-cyan-400 to-blue-600' },
  { id: 'streak_3', icon: <Sparkles className="w-6 h-6" />, titleEn: 'Streak Starter', titleKu: 'Destpêka Rêzê', titleAr: 'مشعل الحماس', descEn: 'Maintain a 3-day streak', descKu: '3 rojan li pey hev bidomîne', descAr: 'حافظ على حماسك لثلاثة أيام متتالية', color: 'from-purple-400 to-pink-500' },
  { id: 'streak_7', icon: <Award className="w-6 h-6" />, titleEn: 'Streak Majesty', titleKu: 'Pehlewaniya Rêzê', titleAr: 'سيادة الانضباط', descEn: 'Maintain a 7-day streak', descKu: '7 rojan li pey hev bidomîne', descAr: 'حافظ على حماسك لسبعة أيام متتالية', color: 'from-rose-400 to-red-600' },
  { id: 'quiz_conqueror', icon: <Trophy className="w-6 h-6" />, titleEn: 'Arena Conqueror', titleKu: 'Serkeftiyê Ezmûnan', titleAr: 'قاهر الاختبارات', descEn: 'Complete 5 syllabus quizzes', descKu: '5 pirsyariyan biqedîne', descAr: 'امض بثقة واجتاز 5 اختبارات تدريبية', color: 'from-amber-400 to-yellow-600' },
  { id: 'quiz_master', icon: <Award className="w-6 h-6" />, titleEn: 'Great Master', titleKu: 'Hostayê Mezin', titleAr: 'سيد الحكمة والامتحانات', descEn: 'Complete 20 syllabus quizzes', descKu: '20 pirsyariyan biqedîne', descAr: 'امض بثقة واجتاز 20 اختباراً منهاجياً كلياً', color: 'from-indigo-400 to-violet-600' },
  { id: 'lesson_scholar', icon: <Library className="w-6 h-6" />, titleEn: 'Lesson Scholar', titleKu: 'Zanayê Dersan', titleAr: 'الباحث العظيم', descEn: 'Master 5 complete lessons', descKu: '5 dersan bi temamî hîn bibe', descAr: 'أتقن المادة الكلية لخمس وحدات درسية', color: 'from-fuchsia-400 to-purple-600' }
];

export function Profile() {
  const navigate = useNavigate();
  const { user, userData, language, setLanguage, theme, toggleTheme, logout, updateUserData, updateProfileName, loading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab ] = useState<'progress' | 'settings'>('progress');
  const [showAllBadges, setShowAllBadges] = useState(false);

  // The header gear (MainLayout) opens the Settings tab via a window event.
  useEffect(() => {
    const openSettings = () => setActiveTab('settings');
    window.addEventListener('kq:profile-settings', openSettings);
    return () => window.removeEventListener('kq:profile-settings', openSettings);
  }, []);
  
  // Settings reminders & analytics states
  const [reminderEnabled, setReminderEnabled] = useState(() => getReminderSettings().enabled);
  const [reminderHour, setReminderHour] = useState(() => getReminderSettings().hour);
  const [analyticsEnabled, setAnalyticsEnabledState] = useState(() => telemetryService.isAnalyticsEnabled());
  const [hasWebNotificationSupport] = useState(() => supportsNotifications());
  const [browserPermissionGranted, setBrowserPermissionGranted] = useState(() => isNotificationPermissionGranted());
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  const handleToggleAnalytics = () => {
    const next = !analyticsEnabled;
    setAnalyticsEnabledState(next);
    telemetryService.setAnalyticsEnabled(next);
  };

  const handleToggleReminder = () => {
    const nextEnabled = !reminderEnabled;
    setReminderEnabled(nextEnabled);
    saveReminderSettings({ enabled: nextEnabled, hour: reminderHour });
  };

  const handleHourChange = (hour: number) => {
    setReminderHour(hour);
    saveReminderSettings({ enabled: reminderEnabled, hour });
  };

  // TIMER SAFETY (TODO-028): feedback timers are tracked and cleared on
  // unmount / re-trigger, so a quick navigation can no longer leave a ghost
  // setState firing on an unmounted Profile, and rapid triggers can't race.
  const feedbackTimerRef = React.useRef<number | null>(null);
  const scheduleFeedbackClear = React.useCallback((ms: number) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null;
      setTestNotificationFeedback(null);
    }, ms);
  }, []);
  React.useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPermissionGranted(granted);
    if (granted) {
      setTestNotificationFeedback(language !== 'ar' ? 'System notifications allowed!' : 'تم تفعيل إشعارات النظام!');
      scheduleFeedbackClear(3500);
    } else {
      setTestNotificationFeedback(language !== 'ar' ? 'Notifications blocked or denied by browser' : 'الإشعارات محجوبة أو مرفوضة من المتصفح');
      scheduleFeedbackClear(4000);
    }
  };

  /** Missions: validate + award via MissionsService (single composed write). */
  const handleClaimMission = async (missionId: string) => {
    if (!userData) return;
    const update = claimMission(userData, missionId);
    if (!update) return; // not complete / already claimed — no-op
    await updateUserData(update);
  };

  const handleTestReminder = () => {
    const content = getReminderContent(language !== 'ar' ? 'en' : 'ar');
    const event = new CustomEvent('trigger-in-app-notification', { detail: { title: content.title, message: content.body } });
    window.dispatchEvent(event);
    if (hasWebNotificationSupport && browserPermissionGranted) {
      try { new Notification(content.title, { body: content.body, tag: 'streak-reminder-test' }); } catch (e) { }
    }
    setTestNotificationFeedback(language !== 'ar' ? 'Test reminder sent! Check the top of your screen.' : 'تم إرسال تذكير تجريبي! تحقق من أعلى الشاشة.');
    scheduleFeedbackClear(5000);
  };
  
  // Edit forms
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editAvatar, setEditAvatar] = useState(userData?.avatarId || '');
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async () => {
    if (editName.trim() !== user?.displayName) await updateProfileName(editName.trim() || 'Learner');
    await updateUserData({ avatarId: editAvatar });
    setIsEditing(false);
  };

  if (loading && !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-9 h-9 border-3 border-[#FFB300] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black tracking-wide">
          {language !== 'ar' ? 'Loading profile...' : 'جاري تحميل الملف الشخصي...'}
        </p>
      </div>
    );
  }

  // Fully-typed fallback (was `as any`, which silently disabled type
  // checking for every profile field access below — TODO-023).
  const emptyProfile: UserData = {
    xp: 0, level: 1, streak: 0, gems: 0, streakFreezes: 0, avatarId: 'av-1',
    lastActive: 0, createdAt: 0, updatedAt: 0, wordsLearned: 0,
    recentSearches: [], favorites: [],
  };
  const safeUserData: UserData = userData ?? emptyProfile;
  const userUnlockedBadges = safeUserData.badges || [];
  const selectedAvatar = AVATARS.find(a => a.id === (isEditing ? editAvatar : safeUserData.avatarId)) || AVATARS[0];

  const StatBox = ({ icon, label, value, colorClass, highlight }: any) => (
    <div className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 flex flex-col items-center text-center shadow-xs ${highlight ? 'border-[#FFB300]/60' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className={`text-3xl mb-2 ${colorClass}`}>{icon}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-black text-slate-800 dark:text-white font-mono mt-1">{value}</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-28">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 mb-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#FFE7B3] to-transparent dark:from-[#3A2F14] pointer-events-none"></div>
        
        {!isEditing && (
          <button onClick={() => { setEditName(user?.displayName || ''); setEditAvatar(safeUserData.avatarId || ''); setIsEditing(true); }} aria-label={language !== 'ar' ? 'Edit profile' : 'تعديل الملف الشخصي'} title={language !== 'ar' ? 'Edit profile' : 'تعديل الملف الشخصي'} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto w-11 h-11 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer z-20">
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 relative z-10 shadow-lg ring-4 ring-white dark:ring-slate-900 ${selectedAvatar.color}`}>
          {renderProfileAvatarIcon(selectedAvatar.icon, "w-14 h-14")}
        </div>
        
        {isEditing ? (
          <div className="w-full max-w-sm space-y-5 relative z-10">
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-black text-center text-slate-800 dark:text-white focus:ring-4 focus:ring-[#FFB300]/25 outline-none transition-all" placeholder="Your name" />
            
            <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">{language !== 'ar' ? 'Select Avatar' : 'اختر صورتك'}</label>
              <div className="grid grid-cols-4 gap-2.5">
                {AVATARS.map(avatar => (
                  <button key={avatar.id} onClick={() => setEditAvatar(avatar.id)} className={`aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer ${editAvatar === avatar.id ? 'ring-4 ring-[#FFB300] scale-105 shadow-md' : 'opacity-60 hover:opacity-100'} ${avatar.color}`}>
                    {renderProfileAvatarIcon(avatar.icon, "w-8 h-8")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-sm cursor-pointer transition-colors">{language !== 'ar' ? 'Cancel' : 'إلغاء'}</button>
              <button onClick={handleSave} className="flex-1 py-4 min-h-[44px] bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] rounded-full font-black text-sm shadow-[0_2px_0_#E69500] cursor-pointer transition-colors">{language !== 'ar' ? 'Save' : 'حفظ'}</button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white"><bdi>{user?.displayName || 'Learner'}</bdi></h2>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF6E0] dark:bg-[#3A2F14] text-[#8A6100] dark:text-[#FFCE6B] rounded-full text-xs font-extrabold border border-[#FFB300]/40 shadow-xs">
              <Star className="w-3.5 h-3.5 fill-[#FFB300] text-[#FFB300]" />
              {language !== 'ar' ? 'Quest Learner' : 'متعلم كويست'}
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <>
          {/* Tabs */}
          <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-2xl mb-6 w-full max-w-sm mx-auto shadow-inner">
            <button onClick={() => setActiveTab('progress')} className={`flex-1 py-3 min-h-[44px] text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'progress' ? 'bg-white dark:bg-slate-900 text-[#B45309] dark:text-[#FFCE6B] shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {language !== 'ar' ? 'Progress' : 'التقدم'}
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 min-h-[44px] text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-white dark:bg-slate-900 text-[#B45309] dark:text-[#FFCE6B] shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {language !== 'ar' ? 'Settings' : 'الإعدادات'}
            </button>
          </div>

          {/* Tab Content: Progress */}
          {activeTab === 'progress' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Quick Links */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <button
                  onClick={() => navigate('/search')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col items-center gap-2 shadow-xs hover:border-[#FFB300]/60 dark:hover:border-[#FFB300]/40 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 dark:bg-sky-950/40 rounded-full flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language !== 'ar' ? 'Dictionary' : 'القاموس'}</h4>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white mt-0.5">{language !== 'ar' ? 'Search' : 'البحث'}</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/favorites')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col items-center gap-2 shadow-xs hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-rose-500/20" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language !== 'ar' ? 'Saved' : 'المحفوظات'}</h4>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white mt-0.5">{language !== 'ar' ? 'Favorites' : 'المفضلة'}</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/leaderboard')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col items-center gap-2 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer group text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFF3D6] dark:bg-amber-950/40 rounded-full flex items-center justify-center text-[#F59E0B] group-hover:scale-110 transition-transform animate-bounce-slow">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500/20" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language !== 'ar' ? 'Rank' : 'التصنيف'}</h4>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white mt-0.5">{language !== 'ar' ? 'Leaderboard' : 'المتصدرون'}</div>
                  </div>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatBox icon={<Sun className="w-8 h-8 text-[#FFB300] fill-[#FFB300]/30" />} label={language !== 'ar' ? 'Total XP' : 'نقاط الخبرة'} value={safeUserData.xp || 0} colorClass="text-amber-500" highlight />
                <StatBox icon={<Flame className="w-8 h-8 text-[#FF5722] fill-[#FF5722]/20" />} label={language !== 'ar' ? 'Day Streak' : 'أيام متتالية'} value={safeUserData.streak || 0} colorClass="text-orange-500" />
                <StatBox icon={<Award className="w-8 h-8 text-sky-500" />} label={language !== 'ar' ? 'Gems' : 'الجواهر'} value={safeUserData.gems ?? 100} colorClass="text-sky-500" />
                <StatBox icon={<ShieldCheck className="w-8 h-8 text-blue-500" />} label={language !== 'ar' ? 'Freezes' : 'التجميد'} value={safeUserData.streakFreezes ?? 1} colorClass="text-blue-500" />
              </div>

              {/* This Week streak tracker (mockup) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
                <h3 className="font-black text-base text-slate-800 dark:text-white mb-4">
                  {language === 'ku' ? 'Ev Hefte' : language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
                </h3>
                <div className="flex justify-between items-center" dir="ltr">
                  {(() => {
                    const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                    const todayIdx = new Date().getDay(); // 0 = Sunday
                    const streak = safeUserData.streak || 0;
                    const activeToday = safeUserData.lastActiveDate === new Date().toISOString().slice(0, 10);
                    return dayLetters.map((letter, i) => {
                      const isToday = i === todayIdx;
                      const daysAgo = todayIdx - i;
                      const isDone = !isToday && daysAgo > 0 && daysAgo <= (activeToday ? streak - 1 : streak);
                      return (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase ${isDone || isToday ? 'text-[#8A6100] dark:text-[#FFCE6B]' : 'text-slate-400'}`}>
                            {letter}
                          </span>
                          {isDone ? (
                            <span className="w-9 h-9 rounded-full bg-[#FFB300] flex items-center justify-center shadow-[0_2px_0_#E69500]">
                              <Check className="w-4 h-4 text-white stroke-[3.5]" />
                            </span>
                          ) : isToday ? (
                            <span className="w-9 h-9 rounded-full border-2 border-[#FFB300] flex items-center justify-center bg-white dark:bg-slate-900">
                              {activeToday
                                ? <Check className="w-4 h-4 text-[#FFB300] stroke-[3.5]" />
                                : <span className="w-2.5 h-2.5 rounded-full bg-[#FFB300]" />}
                            </span>
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800" />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Daily Missions — the deliberate way to earn gems
                  (economy redesign: gameplay no longer drips gems). */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1 px-1">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white">
                    {t(language, 'missions_title')}
                  </h3>
                  <span className="text-base" aria-hidden="true">💎</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1 mb-3 leading-snug">
                  {t(language, 'missions_sub')}
                </p>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {getMissionStatuses(userData).map(({ def, progress, complete, claimed }) => (
                    <li
                      key={def.id}
                      className={`rounded-2xl border p-3 flex items-center gap-3 ${
                        claimed
                          ? 'bg-emerald-50/60 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                          : 'bg-slate-50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800'
                      }`}
                    >
                      <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-lg shrink-0 select-none" aria-hidden="true">
                        {def.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-black text-slate-800 dark:text-slate-100 truncate">
                            {t(language, def.titleKey)}
                          </h4>
                          <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 shrink-0">💎 {def.reward}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate">
                          {t(language, def.descKey)}
                        </p>
                        <div
                          className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                          dir="ltr"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={def.target}
                          aria-valuenow={progress}
                          aria-label={t(language, def.titleKey)}
                        >
                          <div
                            className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-[#FFB300]'}`}
                            style={{ width: `${Math.round((progress / def.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                      {claimed ? (
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {t(language, 'mission_claimed')}
                        </span>
                      ) : complete ? (
                        <button
                          type="button"
                          onClick={() => handleClaimMission(def.id)}
                          className="shrink-0 min-h-[44px] px-4 rounded-full bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] text-xs font-black cursor-pointer transition-colors active:scale-95"
                        >
                          {t(language, 'mission_claim')}
                        </button>
                      ) : (
                        <span className="shrink-0 text-[11px] font-black text-slate-400 font-mono">
                          {progress}/{def.target}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Badges Section */}
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white">
                    {language !== 'ar' ? 'Achievements' : 'الإنجازات'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAllBadges(v => !v)}
                    className="text-sm font-extrabold text-[#8A6100] dark:text-[#FFCE6B] bg-transparent border-none cursor-pointer min-h-[44px] px-2"
                  >
                    {showAllBadges
                      ? (language !== 'ar' ? 'Show Less' : 'عرض أقل')
                      : (language !== 'ar' ? 'View All' : 'عرض الكل')}
                  </button>
                </div>

                {!showAllBadges ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                    {BADGES_DB.map((badge) => {
                      const isUnlocked = userUnlockedBadges.includes(badge.id);
                      const title = language === 'ku' ? (badge.titleKu || badge.titleEn) : language === 'ar' ? badge.titleAr : badge.titleEn;
                      return (
                        <div key={badge.id} className={`min-w-[118px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center gap-2.5 text-center shadow-xs shrink-0 ${isUnlocked ? '' : 'opacity-60'}`}>
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${isUnlocked ? `bg-gradient-to-br ${badge.color} text-white shadow-sm` : 'bg-slate-100 dark:bg-slate-800 text-slate-400 grayscale'}`}>
                            {badge.icon}
                          </div>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 leading-tight">
                            {title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
                  {BADGES_DB.map((badge) => {
                    const isUnlocked = userUnlockedBadges.includes(badge.id);
                    const title = language === 'ku' ? (badge.titleKu || badge.titleEn) : language === 'ar' ? badge.titleAr : badge.titleEn;
                    const desc = language === 'ku' ? (badge.descKu || badge.descEn) : language === 'ar' ? badge.descAr : badge.descEn;
                    return (
                      <div key={badge.id} className={`p-4 rounded-[1.5rem] border flex items-center gap-4 transition-all ${isUnlocked ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/50 opacity-60'}`}>
                        <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-3xl shrink-0 shadow-sm ${isUnlocked ? `bg-gradient-to-br ${badge.color} text-white` : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                          {badge.icon}
                        </div>
                        <div className="flex-1 text-start">
                          <h5 className="font-black text-sm text-slate-800 dark:text-slate-100 leading-tight">{title}</h5>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
                        </div>
                        {isUnlocked && (
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-emerald-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab Content: Settings */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 text-start">
              
              {/* Preferences */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
                <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  {language === 'ku' ? 'Vebijêrk' : language === 'ar' ? 'التفضيلات' : 'Preferences'}
                </h3>
                
                {/* Language Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-800 dark:text-white mb-0.5">{language === 'ku' ? 'Zimanê Sepanê' : language === 'ar' ? 'لغة التطبيق' : 'App Language'}</div>
                    <div className="text-[11px] font-medium text-slate-500">{language === 'ku' ? 'Zimanê navrûyê biguhere' : language === 'ar' ? 'تغيير لغة واجهة المستخدم' : 'Change interface language'}</div>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                    <button onClick={() => setLanguage('en')} className={`px-3 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#B45309] dark:text-[#FFCE6B]' : 'text-slate-500'}`}>EN</button>
                    <button onClick={() => setLanguage('ku')} className={`px-3 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${language === 'ku' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#B45309] dark:text-[#FFCE6B]' : 'text-slate-500'}`}>Kurdî</button>
                    <button onClick={() => setLanguage('ar')} className={`px-3 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${language === 'ar' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#B45309] dark:text-[#FFCE6B]' : 'text-slate-500'}`}>عربي</button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF3D6] dark:bg-[#3A2F14] flex items-center justify-center text-[#8A6100] dark:text-[#FFCE6B]">
                      {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-white mb-0.5">{language !== 'ar' ? 'Dark Mode' : 'الوضع الليلي'}</div>
                      <div className="text-[11px] font-medium text-slate-500">{language !== 'ar' ? 'Toggle dark appearance' : 'تفعيل المظهر الداكن'}</div>
                    </div>
                  </div>
                  
                  {/* Fixed Toggle Switch for RTL/LTR */}
                  {/* DS AUDIT: hand-rolled toggle → shared Switch primitive (gold ON
                      state, RTL-aware knob, expanded touch target). */}
                  <Switch checked={theme === 'dark'} onCheckedChange={() => toggleTheme()} label={language !== 'ar' ? 'Dark Mode' : 'الوضع الليلي'} />
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                {/* Guided Tour replay — re-arms the Driver.js walkthrough chain
                    and returns home. The one-time gem bonus is NOT reset. */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-800 dark:text-white mb-0.5">{t(language, 'tour_replay_title')}</div>
                      <div className="text-[11px] font-medium text-slate-500">{t(language, 'tour_replay_desc')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void updateUserData(resetToursForReplay(userData));
                      navigate('/');
                    }}
                    className="shrink-0 min-h-[44px] px-4 rounded-full bg-[#FFF6E0] dark:bg-[#3A2F14] text-[#8A6100] dark:text-[#FFCE6B] border border-[#FFB300]/40 font-black text-xs cursor-pointer hover:bg-[#FFE7B3] transition-colors"
                  >
                    {t(language, 'tour_replay_btn')}
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
                <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {language !== 'ar' ? 'Notifications' : 'الإشعارات'}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-white mb-0.5">{language !== 'ar' ? 'Daily Reminders' : 'التذكير اليومي'}</div>
                      <div className="text-[11px] font-medium text-slate-500">{language !== 'ar' ? 'Get notified to practice' : 'احصل على إشعارات للتمرين'}</div>
                    </div>
                  </div>
                  
                  <Switch checked={reminderEnabled} onCheckedChange={() => handleToggleReminder()} label={language !== 'ar' ? 'Daily reminder' : 'التذكير اليومي'} />
                </div>
              </div>

              {/* Legal & Privacy */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-1">
                <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                  {t(language, 'legal_section')}
                </h3>

                {[
                  { path: '/privacy', title: t(language, 'privacy_policy'), desc: t(language, 'privacy_policy_desc'), icon: <ShieldCheck className="w-5 h-5" />, tone: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
                  { path: '/terms', title: t(language, 'terms_of_service'), desc: t(language, 'terms_of_service_desc'), icon: <BookOpen className="w-5 h-5" />, tone: 'bg-sky-100 dark:bg-sky-950/40 text-sky-500' },
                ].map(row => (
                  <button
                    key={row.path}
                    type="button"
                    onClick={() => navigate(row.path)}
                    className="w-full min-h-[56px] flex items-center gap-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-start px-2 -mx-2"
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${row.tone}`} aria-hidden="true">
                      {row.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-black text-slate-800 dark:text-white leading-snug">{row.title}</span>
                      <span className="block text-[11px] font-medium text-slate-500 mt-0.5">{row.desc}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 rtl:-scale-x-100 shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>

              {/* About Us */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4" />
                  {t(language, 'about_us')}
                </h3>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FFC541] to-[#FFA000] rounded-2xl shadow-md shadow-[#FFB300]/25 flex items-center justify-center border border-[#FFDE8A] shrink-0" aria-hidden="true">
                    <span className="text-[#432C00] font-black text-2xl select-none">K</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-800 dark:text-white">Kurdish Quest</div>
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5">{t(language, 'app_version')} 1.0.0</div>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                  {t(language, 'about_app_desc')}
                </p>
                <p className="text-[11px] font-bold text-[#B45309] dark:text-[#FFCE6B] mt-3">
                  {t(language, 'made_with')}
                </p>
              </div>

              {/* Logout */}
              <button onClick={handleLogout} className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-5 rounded-3xl flex items-center justify-center gap-2 font-black text-sm transition-colors cursor-pointer shadow-sm">
                <LogOut className="w-5 h-5" />
                {language !== 'ar' ? 'Sign Out' : 'تسجيل الخروج'}
              </button>
              
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

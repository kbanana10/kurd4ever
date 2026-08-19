import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router';
import { t } from '../lib/translations';
import { Trophy, Medal, Flame, Sparkles, Zap, ChevronLeft, ArrowLeft, Users, Landmark, Search, User as UserIcon, Smile, GraduationCap, Star, Compass, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getMergedLeaderboard, 
  simulateCompetitorsProgress, 
  LeaderboardEntry 
} from '../lib/LeaderboardService';
import { fetchCloudLeaderboard, publishOwnEntry, isRealLeaderboardUser } from '../services/CloudLeaderboard';

const renderAvatarIcon = (avatarId: string, sizeClass = "w-6 h-6") => {
  const iconMap = {
    'av-1': UserIcon,
    'av-2': Smile,
    'av-3': GraduationCap,
    'av-4': Flame,
    'av-5': Sparkles,
    'av-6': Star,
    'av-7': Compass,
    'av-8': Award,
  } satisfies Record<string, React.ComponentType<{ className?: string }>>;
  
  const colorMap = {
    'av-1': 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    'av-2': 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    'av-3': 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    'av-4': 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    'av-5': 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    'av-6': 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400',
    'av-7': 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400',
    'av-8': 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400',
  } satisfies Record<string, string>;

  const IconComponent = iconMap[avatarId] || UserIcon;
  const colors = colorMap[avatarId] || 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400';

  return (
    <div className={`rounded-xl flex items-center justify-center p-1.5 shadow-xs ${colors}`}>
      <IconComponent className={sizeClass} />
    </div>
  );
};

export function LeaderboardPage() {
  const { userData, user, language, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'weekly' | 'alltime'>('weekly');
  const [boardData, setBoardData] = useState<LeaderboardEntry[]>([]);
  const [simulationPulse, setSimulationPulse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cloud-backed board for real signed-in users; labeled practice league otherwise.
  const isRealBoard = isRealLeaderboardUser(user);

  // All-time legacy high scores
  const ALL_TIME_LEGENDS: LeaderboardEntry[] = [
    { uid: 'legend-1', name: 'Zinar - Amude', xp: 12450, avatar: 'av-1' },
    { uid: 'legend-2', name: 'Salar - Erbil', xp: 9540, avatar: 'av-2' },
    { uid: 'legend-3', name: 'Nisrin - Diyarbakir', xp: 8220, avatar: 'av-3' },
    { uid: 'legend-4', name: 'Shergo - Qamishlo', xp: 7650, avatar: 'av-4' },
    { uid: 'legend-5', name: 'Kovan - Duhok', xp: 6710, avatar: 'av-5' },
    { uid: 'legend-6', name: 'Jamil - Afrin', xp: 5980, avatar: 'av-6' },
    { uid: 'legend-7', name: 'Rojda - Kobane', xp: 5410, avatar: 'av-7' },
  ];

  useEffect(() => {
    if (!userData) return;
    const currentUserName = user?.displayName || (language !== 'ar' ? 'Learner' : 'متعلم');

    /**
     * REAL LEADERBOARD (TODO-003): signed-in users on a configured Firebase
     * project publish their own entry (rules force it to mirror their
     * profile XP) and read the live board from Firestore. The simulated
     * practice league below only ever renders for guests / unconfigured
     * builds — and is explicitly labeled as such in the UI.
     */
    if (isRealLeaderboardUser(user)) {
      let cancelled = false;
      (async () => {
        await publishOwnEntry(user!.uid, currentUserName, userData.xp, userData.avatarId || 'av-1');
        try {
          const entries = await fetchCloudLeaderboard(user!.uid);
          if (!cancelled) setBoardData(entries);
        } catch (err) {
          console.warn('[Leaderboard] cloud fetch failed:', err);
          if (!cancelled) setBoardData([]);
        }
      })();
      return () => { cancelled = true; };
    }

    if (activeTab === 'weekly') {
      const records = getMergedLeaderboard(currentUserName, userData.xp, userData.avatarId);
      setBoardData(records);
    } else {
      // For all time, inject current user dynamically at their rank!
      const userAvatar = userData.avatarId || 'av-1';
      const currentUserEntry: LeaderboardEntry = {
        uid: 'current-user-uid',
        name: currentUserName,
        xp: userData.xp,
        avatar: userAvatar,
        isCurrentUser: true,
      };
      
      const merged = [...ALL_TIME_LEGENDS, currentUserEntry].sort((a, b) => b.xp - a.xp);
      setBoardData(merged);
    }
  }, [userData, user, language, activeTab]);

  if (loading && !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black tracking-wide">
          {language !== 'ar' ? 'Loading leaderboard...' : 'جاري تحميل لوحة الصدارة...'}
        </p>
      </div>
    );
  }

  const safeUserData = userData || {
    xp: 0,
    level: 1,
    avatarId: 'av-1',
  };

  // Handles organic rival activity boost to simulate competition live!
  const runRivalSimulation = () => {
    if (isRealBoard || activeTab !== 'weekly') return;
    setSimulationPulse(true);
    simulateCompetitorsProgress();
    
    const currentUserName = user?.displayName || (language !== 'ar' ? 'Learner' : 'متعلم');
    const records = getMergedLeaderboard(currentUserName, safeUserData.xp, safeUserData.avatarId);
    setBoardData(records);
    
    setTimeout(() => setSimulationPulse(false), 800);
  };

  // Find user rank
  const userRankIdx = boardData.findIndex(item => item.isCurrentUser);
  const userRank = userRankIdx !== -1 ? userRankIdx + 1 : 0;

  // Filtered by search query if any
  const filteredBoard = boardData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Localization
  const dict = {
    en: {
      title: "Kurmanji Leagues",
      subtitle: "View community standings & compete live!",
      weeklyTab: "Weekly Sprint",
      allTimeTab: "All-Time Legends",
      rank: "Rank",
      xp: "XP Points",
      searchPlaceholder: "Search competitors...",
      simulateBtn: "Test Rival Active Progress",
      weeklyDesc: "Refreshes every Sunday. Study daily to lock in your rank!",
      allTimeDesc: "The hall of fame containing top learners worldwide.",
      positionInfo: "Your Rank position: ",
      behindMsg: " XP behind the lead!",
      firstMsg: "Outstanding! You are currently leading this League!",
      searchNoResults: "No competitors found with that name",
      backBtn: "Dashboard",
      realDesc: "Live global standings — real learners, updated from the cloud.",
      practiceNote: "Practice League — these rivals are training bots, not real players. Sign in with Google to join the live global board."
    },
    ku: {
      title: "Lîga Kurmancî",
      subtitle: "Rêzbûna civakê bibîne û bikeve pêşbaziyê!",
      weeklyTab: "Pêşbaziya Heftane",
      allTimeTab: "Hostayên Hemû Deman",
      rank: "Rêz",
      xp: "Puanên XP",
      searchPlaceholder: "Li hevalan bigere...",
      simulateBtn: "Nûkirina Çalakiya Hevalan",
      weeklyDesc: "Her roja Yekşemê tê nûkirin. Rojane bixwîne da ku pêşeng bimînî!",
      allTimeDesc: "Tabloya rûmetê ya fêrxwazên herî serkeftî yên cîhanê.",
      positionInfo: "Cihê te yê rêzbûnê: ",
      behindMsg: " XP ma ji bo serkeftinê!",
      firstMsg: "Aferîn! Tu niha li serê vê lîgê yî!",
      searchNoResults: "Tu kes bi vî navî nehate dîtin",
      backBtn: "Destpêk",
      realDesc: "Rêzbûna cîhanî ya zindî — fêrxwazên rastîn, ji ewrê tê nûkirin.",
      practiceNote: "Lîga Pratîkê — ev hevrik botên perwerdeyê ne, ne lîstikvanên rastîn in. Bi Google têkeve da ku beşdarî tabloya cîhanî ya zindî bibî."
    },
    ar: {
      title: "دوري الكرمانجية",
      subtitle: "شاهد ترتيب المجتمع والتنافس المباشر!",
      weeklyTab: "التحدي الأسبوعي",
      allTimeTab: "أساطير منصة كويستر",
      rank: "الترتيب",
      xp: "نقطة خبرة",
      searchPlaceholder: "البحث عن المنافسين...",
      simulateBtn: "تحديث نشاط المنافسين",
      weeklyDesc: "يتجدد الترتيب كل أحد. ادرس يومياً للحفاظ على صدارتك!",
      allTimeDesc: "لوحة الشرف التي تضم كبار المتعلمين من جميع أرجاء العالم.",
      positionInfo: "ترتيبك الحالي: ",
      behindMsg: " نقطة تفصلك عن المتصدر!",
      firstMsg: "مذهل! أنت تتصدر هذا الدوري حالياً!",
      searchNoResults: "لا يوجد منافس بهذا الاسم",
      backBtn: "الرئيسية",
      realDesc: "الترتيب العالمي المباشر — متعلمون حقيقيون، يتم التحديث من السحابة.",
      practiceNote: "دوري التدريب — هؤلاء المنافسون روبوتات تدريبية وليسوا لاعبين حقيقيين. سجّل الدخول عبر Google للانضمام إلى اللوحة العالمية المباشرة."
    }
  }[language === 'ku' ? 'ku' : language === 'ar' ? 'ar' : 'en'];

  const top3 = filteredBoard.slice(0, 3);
  const remaingList = filteredBoard.slice(3);

  return (
    <div className="p-4 space-y-6 relative max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      
      {/* Back Button and Header */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {dict.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
            {dict.subtitle}
          </p>
        </div>
      </div>

      {/* Tabs list — only for the simulated practice league. The real cloud
          board has a single live ranking (weekly aggregation would need
          server-side jobs; not pretended). */}
      {!isRealBoard && (
      <div className="flex bg-slate-100 dark:bg-slate-900 rounded-3xl p-1 border border-slate-200/50 dark:border-slate-800/80">
        <button
          onClick={() => {
            setActiveTab('weekly');
            setSearchQuery('');
          }}
          className={`flex-1 py-3 min-h-[44px] text-center font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'weekly'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.weeklyTab}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('alltime');
            setSearchQuery('');
          }}
          className={`flex-1 py-3 min-h-[44px] text-center font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'alltime'
              ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>{dict.allTimeTab}</span>
        </button>
      </div>
      )}

      {/* Info descriptive bar */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/40 p-3 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-2 select-none">
        <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 fill-amber-500/10" />
        <span>{isRealBoard ? dict.realDesc : (activeTab === 'weekly' ? dict.weeklyDesc : dict.allTimeDesc)}</span>
      </div>

      {/* PRACTICE-LEAGUE DISCLOSURE (TODO-003/F003): the simulated board must
          never pass as real competition. Visible, localized, always on. */}
      {!isRealBoard && (
        <div
          role="note"
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 p-3 rounded-2xl text-[11px] font-bold text-amber-800 dark:text-amber-300 leading-normal flex items-start gap-2 select-none"
        >
          <Users className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{dict.practiceNote}</span>
        </div>
      )}

      {/* Podium Layout for Top 3 Learners */}
      {filteredBoard.length >= 3 && searchQuery === '' && (
        <div className="grid grid-cols-3 gap-2.5 items-end justify-center py-6 px-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
          
          {/* Subtle podium background circle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          {/* 2nd Place Podium */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="relative flex flex-col items-center mb-1">
                {renderAvatarIcon(top3[1].avatar, "w-8 h-8")}
                <div className="absolute -bottom-1 -right-1 bg-slate-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] uppercase font-black font-mono border border-white">2</div>
              </div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[90px] mt-1.5"><bdi>{top3[1].name}</bdi></span>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500">{top3[1].xp} xp</span>
              {/* Podium block */}
              <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-t-2xl mt-2 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700">
                <Medal className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}

          {/* 1st Place Podium */}
          {top3[0] && (
            <div className="flex flex-col items-center z-10 scale-105">
              <div className="relative flex flex-col items-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], y: [0, -1, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  >
                    <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-300 animate-pulse" />
                  </motion.div>
                </div>
                <div className="mb-1">
                  {renderAvatarIcon(top3[0].avatar, "w-10 h-10")}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-[11px] uppercase font-black font-mono border border-white max-w-[24px]">1</div>
              </div>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 truncate max-w-[100px] mt-1.5"><bdi>{top3[0].name}</bdi></span>
              <span className="text-[11px] font-black font-mono text-amber-500">{top3[0].xp} xp</span>
              {/* Podium block */}
              <div className="h-24 w-full bg-linear-to-b from-amber-100 to-amber-200 dark:from-amber-950/60 dark:to-amber-900/30 rounded-t-2xl mt-2 flex items-center justify-center shadow-lg border-2 border-amber-300 dark:border-amber-800/80">
                <Trophy className="w-7 h-7 text-amber-500 fill-amber-300/20 animate-bounce" />
              </div>
            </div>
          )}

          {/* 3rd Place Podium */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="relative flex flex-col items-center mb-1">
                {renderAvatarIcon(top3[2].avatar, "w-8 h-8")}
                <div className="absolute -bottom-1 -right-1 bg-amber-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] uppercase font-black font-mono border border-white">3</div>
              </div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[90px] mt-1.5"><bdi>{top3[2].name}</bdi></span>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500">{top3[2].xp} xp</span>
              {/* Podium block */}
              <div className="h-12 w-full bg-amber-50 dark:bg-slate-800 rounded-t-2xl mt-2 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700">
                <Medal className="w-5 h-5 text-amber-700" />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Dynamic Scoreboard Search Bar */}
      <div className="relative">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-10 font-medium text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-600 shadow-xs"
        />
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* Live simulation control — dev/testing builds only, practice league only */}
      {import.meta.env.DEV && !isRealBoard && activeTab === 'weekly' && searchQuery === '' && (
        <button
          onClick={runRivalSimulation}
          disabled={simulationPulse}
          className="w-full py-2.5 min-h-[44px] px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs uppercase tracking-wider"
        >
          <Users className={`w-3.5 h-3.5 text-indigo-500 ${simulationPulse ? 'animate-spin' : ''}`} />
          <span>{dict.simulateBtn}</span>
        </button>
      )}

      {/* Core Scoreboard Scroll Area */}
      <div className="space-y-2 mt-4 select-none">
        <AnimatePresence mode="popLayout">
          {filteredBoard.length === 0 ? (
            <div className="text-center py-10 font-bold text-slate-400 text-xs">
              {dict.searchNoResults}
            </div>
          ) : (
            // If we are showing top 3 on the pedestal and there is no search filter, we skip rendering top 3 in the regular list to make it dynamic and compact!
            (searchQuery !== '' ? filteredBoard : remaingList).map((item, localIdx) => {
              // Calculate correct real ranking rank
              const rank = searchQuery !== '' 
                ? boardData.findIndex(orig => orig.uid === item.uid) + 1 
                : localIdx + 4;
              
              const isUser = item.isCurrentUser;

              return (
                <motion.div
                  key={item.uid}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`py-3 px-4 rounded-2xl flex items-center justify-between border transition-all duration-300 ${
                    isUser 
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/25 border-indigo-200 dark:border-indigo-800/80 ring-2 ring-indigo-500/10' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle Badge */}
                    <div className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold font-mono ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950'
                    }`}>
                      {rank}
                    </div>

                    {/* Avatar and Name */}
                    <div className="flex items-center gap-2">
                      {renderAvatarIcon(item.avatar, "w-4 h-4")}
                      <span className={`text-sm font-bold tracking-tight truncate max-w-[150px] ${
                        isUser 
                          ? 'text-indigo-800 dark:text-indigo-300 font-extrabold' 
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        <bdi>{item.name}</bdi>
                      </span>
                      {isUser && (
                        <span className="bg-indigo-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider">
                          {language !== 'ar' ? 'YOU' : 'أنت'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 font-mono">
                    <span className={`text-sm font-black ${
                      isUser 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.xp}
                    </span>
                    <span className="text-[10px] text-slate-400 lowercase font-medium">
                      xp
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Floating Status Advice and Tips */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl flex items-center gap-3 shadow-xl shadow-slate-900/10 z-10 select-none">
        <Zap className="w-5 h-5 text-orange-400 fill-orange-400/15 shrink-0" />
        <div className="text-xs leading-normal font-medium flex-1 min-w-0">
          {userRank === 1 ? (
            <span className="font-extrabold text-emerald-400">{dict.firstMsg}</span>
          ) : (
            <p className="truncate">
              {dict.positionInfo} <strong className="text-indigo-300 font-extrabold">#{userRank}</strong>. {language !== 'ar' ? 'You are ' : 'تبعد '}
              <span className="text-orange-400 font-black">{boardData[0] ? boardData[0].xp - safeUserData.xp : 0}</span>
              {dict.behindMsg}
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

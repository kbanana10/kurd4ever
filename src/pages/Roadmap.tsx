import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { getDueItems } from '../services/SpacedRepetitionService';
import { cn } from '../utils/cn';
import { learningPath, CEFRLevel, Lesson } from '../data/learningPath';
import { t } from '../localization/translations';
import { getAdaptiveLevelId, filterReviewableIds } from '../features/quiz/utils/questionGenerator';
import { useAppTour } from '../features/tour/useAppTour';
import {
  ROADMAP_TOUR_ID,
  TOUR_CHAIN_STORAGE_KEY,
  TOUR_REWARD_GEMS,
  buildRoadmapTourSteps,
  getFirstActionableLessonId,
  isTourCompleted,
} from '../features/tour/tours';
import { motion, AnimatePresence } from 'motion/react';
import { AudioButton } from '../components/AudioButton';
import {
  Lock,
  CheckCircle2,
  ChevronRight,
  Play,
  Star,
  RotateCcw,
  Sparkles,
  X,
  Circle,
  Compass,
  Compass as CompassIcon,
  Flame,
  Trophy,
  BookOpen,
  Globe,
  // Icons referenced by lesson `icon` string fields.
  Briefcase,
  Car,
  Cat,
  Heart,
  Landmark,
  Laptop,
  MessageCircle,
  Plane,
  Stethoscope,
  TreePine,
  Users,
  Utensils,
  Clock,
  Link,
  Scale,
  type LucideIcon, Brain
} from 'lucide-react';


/**
 * AUDIT FIX: this file used `import * as Icons from 'lucide-react'` plus a
 * dynamic `Icons[iconName]` lookup. A namespace import with a computed key is
 * un-tree-shakeable, so the *entire* lucide library was pulled into the bundle
 * — the Roadmap chunk alone was 808 kB (153 kB gzip) for what is effectively
 * 16 glyphs. An explicit registry restores tree shaking.
 */
const LESSON_ICONS = {
  Briefcase, Car, Cat, Heart, Landmark, Laptop, MessageCircle,
  Plane, Stethoscope, TreePine, Users, Utensils,
  Clock, Link, Scale, BookOpen, Globe, Compass, Flame, Trophy,
} satisfies Record<string, LucideIcon>;

const renderIcon = (iconName: string) => {
  const IconComponent = LESSON_ICONS[iconName] ?? Circle;
  return <IconComponent className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />;
};

export function Roadmap() {
  const { user, userData, updateUserData, language, loading } = useAuth();
  const navigate = useNavigate();
  
  // Dynamic state for the selected roadmap node
  const [selectedNode, setSelectedNode] = useState<{
    type: 'vocabulary';
    id: string;
    titleEn: string;
    titleAr: string;
    icon: string;
    xpReward: number;
    lesson?: Lesson; 
    level: CEFRLevel;
  } | null>(null);

  // GUIDED TOUR (Driver.js): second leg of the welcome chain. It only runs
  // when the Dashboard leg armed the session flag (i.e. the learner tapped
  // the highlighted Roadmap tab), and finishes on an interactive checkpoint:
  // tapping the first playable lesson node. Completing it pays the one-time
  // gem bonus (guarded inside useAppTour).
  const { startTour } = useAppTour();
  const tourAttemptedRef = useRef(false);
  useEffect(() => {
    if (loading && !userData) return;
    if (tourAttemptedRef.current) return;
    let chain: string | null = null;
    try {
      chain = sessionStorage.getItem(TOUR_CHAIN_STORAGE_KEY);
    } catch {
      chain = null;
    }
    if (chain !== 'roadmap') return;
    // Debounced start (same pattern as the Dashboard leg): profile writes
    // re-run this effect, so the flag/ref are only committed when the timer
    // actually fires after the map has settled.
    const timer = window.setTimeout(() => {
      if (tourAttemptedRef.current) return;
      tourAttemptedRef.current = true;
      try { sessionStorage.removeItem(TOUR_CHAIN_STORAGE_KEY); } catch { /* best effort */ }
      if (isTourCompleted(ROADMAP_TOUR_ID, userData)) return;
      const lessonId = getFirstActionableLessonId(userData);
      if (!lessonId) return;
      startTour({
        tourId: ROADMAP_TOUR_ID,
        steps: buildRoadmapTourSteps(language, `roadmap-node-${lessonId}`),
        rewardGems: TOUR_REWARD_GEMS,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [loading, userData, language, startTour]);

  if (loading && !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black tracking-wide">
          {language !== 'ar' ? 'Loading roadmap...' : 'جاري تحميل الخارطة...'}
        </p>
      </div>
    );
  }

  const safeUserData = userData || {
    xp: 0,
    level: 1,
    gems: 100,
    streak: 0,
    completedLessons: [],
    unlockedLevels: ['A1']
  };

  const userLevel = safeUserData.level || 1;
  const userXp = safeUserData.xp || 0;
  const completedLessons = safeUserData.completedLessons || [];

  /**
   * Constructs the list of vocabulary nodes for an adventure island
   */
  const getLevelNodes = (lvl: CEFRLevel) => {
    const list: Array<{
      type: 'vocabulary';
      id: string;
      titleEn: string;
      titleAr: string;
      icon: string;
      xpReward: number;
      lesson?: Lesson;
    }> = [];

    lvl.lessons.forEach(l => {
      list.push({
        type: 'vocabulary',
        id: l.id,
        titleEn: l.titleEn,
        titleAr: l.titleAr,
        icon: l.icon,
        xpReward: l.xpReward,
        lesson: l
      });
    });

    // (Grammar milestones were removed with the Grammar feature.)
    return list;
  };

  // Compute a single sequentially flattened track of all game nodes
  const allFlatNodes = learningPath.flatMap(lvl => 
    getLevelNodes(lvl).map(node => ({ ...node, level: lvl }))
  );

  const getNodeStatus = (nodeId: string, level: CEFRLevel) => {
    const isLevelUnlocked = userXp >= level.requiredXp;
    if (!isLevelUnlocked) return 'locked';
    
    const flatIndex = allFlatNodes.findIndex(n => n.id === nodeId);
    if (flatIndex === 0) {
      return completedLessons.includes(nodeId) ? 'completed' : 'active';
    }
    
    if (completedLessons.includes(nodeId)) {
      return 'completed';
    }
    
    const prevNode = allFlatNodes[flatIndex - 1];
    const isPrevCompleted = completedLessons.includes(prevNode.id);
    
    return isPrevCompleted ? 'active' : 'locked';
  };

  /**
   * BADGE↔QUIZ CONSISTENCY FIX: both counts run through
   * `filterReviewableIds`, the same universe the review-quiz generator
   * draws from. Previously the badges counted RAW deck/history entries, so
   * ids with no backing content (or, before the generator fix, alphabet
   * letters) produced "3 words due today" cards that opened into
   * "All caught up!" empty states.
   */
  const dueReviewsCount = filterReviewableIds(getDueItems(userData?.reviewDeck || {}).map(d => d.id)).length;
  const mistakesCount = filterReviewableIds(userData?.wrongAnswersHistory || []).length;

  /**
   * NEW-USER GATING (maintainer request): the Smart Review hub is only
   * meaningful once the learner has actually practiced — before that,
   * "All reviews completed" / "No mistake backlog" were empty noise on a
   * fresh account. It appears after any roadmap or practice-game activity.
   * "My Level Practice" additionally waits for the FIRST finished level
   * node (completed lesson), because its adaptive pool is built from words
   * the learner has genuinely encountered; its level badge keeps updating
   * automatically as they progress.
   */
  const hasPracticeActivity =
    completedLessons.length > 0 ||
    mistakesCount > 0 ||
    Object.keys(userData?.reviewDeck || {}).length > 0 ||
    Object.keys(userData?.gameScores || {}).length > 0;
  const showLevelPractice = completedLessons.length > 0;

  const handleNodeLaunch = (node: typeof selectedNode) => {
    if (!node) return;
    setSelectedNode(null);
    navigate(`/quiz/${node.id}`);
  };

  const handleResetProgress = async () => {
    if (window.confirm(language !== 'ar' 
      ? 'Are you sure you want to reset all your learning path completions? Your XP will remain safe.' 
      : 'هل أنت متأكد من أنك تود تصفير محصلة تقدم الدروس المكتملة؟ نقاط خبرتك الإجمالية ستبقى آمنة.')) {
      await updateUserData({ completedLessons: [] });
    }
  };

  const handleNodeClick = (node: any, level: CEFRLevel) => {
    const status = getNodeStatus(node.id, level);
    if (status === 'locked') {
      alert(language !== 'ar' 
        ? 'Path Locked! Please complete the preceding milestone nodes first to unlock this track.' 
        : 'المسار مغلق حالياً! يرجى إتمام الأهداف السابقة أولاً لفتح هذا الجزء.');
      return;
    }
    setSelectedNode({ ...node, level });
  };

  // Recommends the absolute next actionable lesson
  const getNextPracticableLesson = (): { lesson: Lesson; level: CEFRLevel } | null => {
    for (const lvl of learningPath) {
      if (userXp >= lvl.requiredXp) {
        for (const les of lvl.lessons) {
          if (!completedLessons.includes(les.id)) {
            return { lesson: les, level: lvl };
          }
        }
      }
    }
    if (learningPath.length > 0 && learningPath[0].lessons.length > 0) {
      return { lesson: learningPath[0].lessons[0], level: learningPath[0] };
    }
    return null;
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-4 pb-24 text-slate-800 dark:text-slate-100 font-sans leading-relaxed selection:bg-indigo-100">
      
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between py-3 mb-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none font-display">
              {language !== 'ar' ? 'Quest Trail' : 'خريطة التعلم التفاعلية'}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
              <CompassIcon className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
              {language !== 'ar' ? 'Complete vocabulary lessons & milestones' : 'أنهِ الدروس والوحدات التفاعلية كالمحترفين'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleResetProgress}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer border-none bg-transparent"
          title={language !== 'ar' ? 'Reset Progress' : 'إعادة تعيين التقدم'}
          aria-label={language !== 'ar' ? 'Reset Progress' : 'إعادة تعيين التقدم'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Professional Academic Progress Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-flat mb-6 border border-line-soft relative overflow-hidden group max-w-md mx-auto">
        <CompassIcon className="absolute right-[-40px] bottom-[-40px] w-48 h-48 opacity-[0.06] text-slate-500 transform rotate-12 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <span className="text-[9px] bg-[#FFF6E0] dark:bg-[#3A2F14] text-[#8A6100] dark:text-[#FFCE6B] font-black px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap inline-block">
              {language !== 'ar' ? 'Kurdish Quest Scholar' : 'أكاديمية اللغة الكوردية'}
            </span>
            <h3 className="text-2xl font-black mt-1.5 leading-tight tracking-tight text-ink">
              {/* UX AUDIT FIX: this rendered the raw internal avatar id
                  ("Learner av-1") to every user with a chosen avatar. Show
                  the learner's actual name, falling back to the earned title. */}
              {user?.displayName || (userXp > 305 ? 'Academic Scholar' : 'Kurdish Learner')}
            </h3>
          </div>
          <div className="flex gap-1.5 text-xs font-extrabold items-center bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/50 px-3 py-1.5 rounded-full shrink-0">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{userData.streak || 0} {language !== 'ar' ? 'Day Streak' : 'أيام متتالية'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-line relative z-10">
          <div className="bg-surface-2 p-2.5 rounded-2xl text-center">
            <span className="text-[9px] text-muted uppercase font-black block">{language !== 'ar' ? 'Rank XP' : 'نقاط الخبرة'}</span>
            <span className="text-sm font-black text-[#B8860B] dark:text-[#FFCE6B] flex items-center justify-center gap-1 font-mono pt-0.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              {userXp}
            </span>
          </div>
          <div className="bg-surface-2 p-2.5 rounded-2xl text-center">
            <span className="text-[9px] text-muted uppercase font-black block">{language !== 'ar' ? 'Completed' : 'أنهيت'}</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 font-mono pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedLessons.length}
            </span>
          </div>
          <div className="bg-surface-2 p-2.5 rounded-2xl text-center">
            <span className="text-[9px] text-muted uppercase font-black block">{language !== 'ar' ? 'Level' : 'المستوى'}</span>
            <span className="text-sm font-black text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 font-mono pt-0.5">
              <Trophy className="w-3.5 h-3.5" />
              {userLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Smart Review hub — relocated from the Dashboard (its natural home:
          the practice page). SRS queue + mistake backlog. Hidden for brand-new
          accounts until there is real activity to review. */}
      {hasPracticeActivity && (
      <div className="space-y-2.5 mb-6 max-w-md mx-auto">
        <h3 className="text-sm font-black text-ink px-1 uppercase tracking-wider">
          {language !== 'ar' ? 'Smart Review' : 'المراجعة الذكية'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* SRS Due Review Card */}
          <motion.div
            onClick={() => navigate('/quiz/srs_review')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "border-2 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all relative overflow-hidden",
              dueReviewsCount > 0 
                ? "bg-surface-2 border-brand/50 hover:border-brand" 
                : "bg-surface border-line hover:border-line-soft"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2",
                dueReviewsCount > 0 
                  ? "bg-brand/10 text-brand border-brand/30" 
                  : "bg-surface-2 text-muted border-line"
              )}>
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-ink truncate">
                    {language !== 'ar' ? 'Spaced Reviews' : 'المراجعة المتباعدة'}
                  </h4>
                  {dueReviewsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-brand text-on-brand rounded-full">
                      {dueReviewsCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-medium truncate mt-0.5">
                  {dueReviewsCount > 0 
                    ? (language !== 'ar' ? `${dueReviewsCount} ${dueReviewsCount === 1 ? 'word' : 'words'} due today` : `${dueReviewsCount} كلمة بحاجة للمراجعة`)
                    : (language !== 'ar' ? 'All reviews completed' : 'تمت جميع مراجعات اليوم')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted shrink-0 rtl:-scale-x-100" />
          </motion.div>

          {/* Mistakes Practice Card */}
          <motion.div
            onClick={() => navigate('/quiz/review_mistakes')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "border-2 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all relative overflow-hidden",
              mistakesCount > 0 
                ? "bg-surface-2 border-warning/50 hover:border-warning" 
                : "bg-surface border-line hover:border-line-soft"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2",
                mistakesCount > 0 
                  ? "bg-warning/10 text-warning border-warning/30" 
                  : "bg-surface-2 text-muted border-line"
              )}>
                <Brain className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-ink truncate">
                    {language !== 'ar' ? 'Fix Mistakes' : 'معالجة الأخطاء'}
                  </h4>
                  {mistakesCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-warning text-black rounded-full">
                      {mistakesCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-medium truncate mt-0.5">
                  {mistakesCount > 0 
                    ? (language !== 'ar' ? `${mistakesCount} weak ${mistakesCount === 1 ? 'point' : 'points'} logged` : `${mistakesCount} نقاط تحتاج للتركيز`)
                    : (language !== 'ar' ? 'No mistake backlog' : 'سجل أخطائك نظيف')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted shrink-0 rtl:-scale-x-100" />
          </motion.div>

          {/* Adaptive Level Practice — personalized quiz built from the
              user's unlocked levels and the words they have met so far.
              Unlocks after the FIRST finished level node; badge updates
              with the learner's live level. */}
          {showLevelPractice && (
          <motion.div
            onClick={() => navigate('/quiz/adaptive_practice')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="sm:col-span-2 border-2 border-brand/50 hover:border-brand bg-surface-2 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 bg-brand/10 text-brand border-brand/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-ink truncate">
                    {t(language, 'quiz_mode_adaptive_title')}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-brand text-on-brand rounded-full">
                    {getAdaptiveLevelId(userData)}
                  </span>
                </div>
                <p className="text-xs text-muted font-medium truncate mt-0.5">
                  {t(language, 'quiz_mode_adaptive_desc')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted shrink-0 rtl:-scale-x-100" />
          </motion.div>
          )}
        </div>
      </div>
      )}

      {/* 3. Winding Game Map Valley Landscape (Continuous Worlds layout) */}
      <div className="space-y-12 max-w-md mx-auto pt-2">
        {learningPath.map((lvl, lvlIdx) => {
          const isLvlUnlocked = userXp >= lvl.requiredXp;
          const levelNodes = getLevelNodes(lvl);
          const mapHeight = levelNodes.length * 110;

          return (
            <div 
              key={lvl.id}
              className="relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/80 rounded-[36px] shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* World/Section Title Header plaque */}
              <div className={`p-4 rounded-[24px] bg-gradient-to-r ${lvl.color} text-white relative overflow-hidden group mb-4 shadow-sm`}>
                <Globe className="absolute right-[-10px] bottom-[-10px] w-20 h-20 opacity-10 text-white select-none pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-white/20 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {language !== 'ar' ? `WORLD 0${lvlIdx + 1}` : `العالم 0${lvlIdx + 1}`}
                  </span>
                  {isLvlUnlocked && (
                    <span className="text-[9px] text-amber-300 font-black tracking-wide bg-black/15 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {language !== 'ar' ? 'ACTIVE REGION' : 'إقليم نشط'}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black mt-2 leading-tight tracking-tight">
                  {lvl.title}
                </h3>
                <p className="text-[11px] text-white/80 mt-1 leading-snug font-semibold">
                  {language !== 'ar' ? lvl.descEn : lvl.descAr}
                </p>
              </div>

              {/* Responsive Game Winding Trail Grid block */}
              <div 
                className="relative max-w-[400px] w-full mx-auto select-none mt-4 transition-all"
                style={{ height: `${mapHeight}px` }}
              >
                {/* A. Background SVG spline road tracking connector */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  viewBox={`0 0 400 ${mapHeight}`}
                  preserveAspectRatio="none"
                >
                  {levelNodes.map((node, idx) => {
                    if (idx === 0) return null;

                    const prevOffset = Math.sin((idx - 1) * 1.55) * 110;
                    const prevX = 200 + prevOffset;
                    const prevY = (idx - 1) * 110 + 55;

                    const currOffset = Math.sin(idx * 1.55) * 110;
                    const currX = 200 + currOffset;
                    const currY = idx * 110 + 55;

                    // Determine segment color dynamically
                    const currentStatus = getNodeStatus(node.id, lvl);
                    let strokeColor = 'stroke-slate-200 dark:stroke-slate-800';
                    let strokeDash = '6,6';
                    let strokeWidth = 5;

                    if (currentStatus === 'completed') {
                      strokeColor = 'stroke-emerald-400 dark:stroke-emerald-500';
                      strokeDash = '0'; // solid lines
                      strokeWidth = 6;
                    } else if (currentStatus === 'active') {
                      strokeColor = 'stroke-indigo-400 dark:stroke-indigo-500';
                      strokeDash = '4,4';
                      strokeWidth = 5;
                    }

                    return (
                      <path
                        key={`line-${node.id}`}
                        d={`M ${prevX} ${prevY} C ${prevX} ${prevY + 55}, ${currX} ${currY - 55}, ${currX} ${currY}`}
                        fill="none"
                        className={`${strokeColor} transition-all duration-300`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                {/* B. Absolute Interactive Stepping Nodes */}
                {levelNodes.map((node, idx) => {
                  const status = getNodeStatus(node.id, lvl);
                  const isCompleted = status === 'completed';
                  const isActive = status === 'active';
                  const isLocked = status === 'locked';

                  const offset = Math.sin(idx * 1.55) * 110;
                  const leftOffset = `calc(50% + ${offset}px)`;
                  const topOffset = `${idx * 110 + 23}px`;

                  return (
                    <div 
                      key={node.id}
                      className="absolute transform -translate-x-1/2 z-10"
                      style={{ left: leftOffset, top: topOffset }}
                    >
                      <motion.button
                        id={`roadmap-node-${node.id}`}
                        whileHover={{ scale: !isLocked ? 1.08 : 1 }}
                        whileTap={{ scale: !isLocked ? 0.95 : 1 }}
                        onClick={() => handleNodeClick(node, lvl)}
                        className={`w-16 h-16 flex items-center justify-center relative transition-all focus:outline-none cursor-pointer rounded-full border-4 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 border-white dark:border-slate-800 text-white shadow-emerald-500/10'
                            : isActive
                            ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 border-white dark:border-slate-800 text-white ring-4 ring-indigo-500/15 shadow-indigo-600/20'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-default grayscale'
                        } shadow-lg`}
                      >
                        {/* Interactive glow pulses for active nodes */}
                        {isActive && (
                          <>
                            <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping -z-10 scale-[1.35]" />
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse -z-10 scale-[1.15]" />
                            <div className="absolute inset-x-0 -bottom-5 text-center flex justify-center rotate-0">
                              <span className="text-[9px] font-black bg-indigo-600 text-white rounded-full px-2 py-0.5 border border-white dark:border-indigo-400 uppercase tracking-widest leading-none shadow-md animate-bounce transform rotate-0 block select-none">
                                {language !== 'ar' ? 'PLAY' : 'ابدأ'}
                              </span>
                            </div>
                          </>
                        )}

                        <span className={`${isLocked ? 'opacity-40' : 'opacity-100'} flex justify-center items-center select-none`}>
                          {renderIcon(node.icon)}
                        </span>

                        {/* Top corner status badges */}
                        {isCompleted && (
                          <div className={`absolute -top-1 -end-1 rounded-full p-0.5 border-2 border-white dark:border-slate-900 shadow-md bg-emerald-500 text-white`}>
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-3" />
                          </div>
                        )}

                        {isLocked && (
                          <div className={`absolute -top-1 -end-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full p-1 border-2 border-slate-300 dark:border-slate-700 shadow-sm`}>
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>

              {/* Physical Overlay Lock over locked level worlds */}
              {!isLvlUnlocked && (
                <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20 rounded-[34px]">
                  <div className="w-14 h-14 bg-slate-950/90 text-slate-400 rounded-3xl flex items-center justify-center border border-slate-800 shadow-lg mb-3">
                    <Lock className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="font-black text-white text-base tracking-tight select-none">
                    {language !== 'ar' ? `${lvl.id} Island Locked` : `${lvl.id} عالم مغلق`}
                  </h4>
                  <p className="text-slate-300 text-[11px] mt-1 font-semibold max-w-[240px] select-none leading-relaxed">
                    {language !== 'ar' 
                      ? `Amass ${lvl.requiredXp} XP in primary lesson paths to unlock this adventure island!`
                      : `جمّع ${lvl.requiredXp} نقطة خبرة لرفع مرتبتك وصياغة هذا العالم!`}
                  </p>
                  <div className="mt-4 px-4 py-2 bg-white/20 text-yellow-300 font-extrabold uppercase tracking-widest font-mono text-[9px] select-none rounded-xl border border-white/5">
                    {language !== 'ar' ? `LOCK LIMIT: ${lvl.requiredXp} XP` : `المطلوب: ${lvl.requiredXp} خبرة`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Interactive floating popover drawer of selected node (vocabulary node details) */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            {/* Modal transparent background backdrop closer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="absolute inset-0"
            />

            {/* Premium Drawer Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-slate-950 w-full max-w-md rounded-t-[36px] sm:rounded-[36px] overflow-hidden shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh]"
            >
              {/* Top graphic colored cover themed to the world level */}
              <div className={`p-8 bg-gradient-to-br ${selectedNode.level.color} text-white text-center relative flex flex-col items-center justify-center border-b border-white/10 shrink-0`}>
                
                {/* Close absolute button */}
                <button
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-4 end-4 p-2.5 bg-black/15 hover:bg-black/25 text-white rounded-full transition-all cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className={`w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center flex justify-center items-center shadow-md border border-white/10 animate-bounce`}>
                  <span>
                    {renderIcon(selectedNode.icon)}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] bg-white/20 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedNode.level.title}
                  </span>
                  <h3 className="text-xl font-black mt-2 leading-none tracking-tight">
                    {language !== 'ar' ? selectedNode.titleEn : selectedNode.titleAr}
                  </h3>
                </div>
              </div>

              {/* Node details scrollable zone */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div>
                  <h4 className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
                    {language !== 'ar' ? 'Adventure Syllabus' : 'منهاج التدريب'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-300 text-xs font-semibold leading-relaxed mt-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
                    {language !== 'ar' ? selectedNode.lesson?.descEn : selectedNode.lesson?.descAr}
                  </p>
                </div>

                {/* Star Reward and Progressive Difficulty info indicator */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                      {language !== 'ar' ? 'Base Rewards' : 'النقاط الأساسية'}
                    </span>
                    <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      +{selectedNode.xpReward} XP
                    </span>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                      {language !== 'ar' ? 'Questions Pool' : 'عدد الأسئلة والجهد'}
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-[11px] truncate">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      {(() => {
                        const levelId = selectedNode.level?.id || 'A1';
                        if (levelId === 'A1') return language !== 'ar' ? '5 Qs (A1 Easy)' : '5 أسئلة (A1 سهل)';
                        if (levelId === 'A2') return language !== 'ar' ? '7 Qs (A2 Casual)' : '7 أسئلة (A2 متوسط)';
                        if (levelId === 'B1') return language !== 'ar' ? '8 Qs (B1 Medium)' : '8 أسئلة (B1 مهارة)';
                        if (levelId === 'B2') return language !== 'ar' ? '10 Qs (B2 Hard)' : '10 أسئلة (B2 متقدم)';
                        if (levelId === 'Advanced') return language !== 'ar' ? '12 Qs (C1 Expert)' : '12 سؤال متمكن (C1)';
                        return language !== 'ar' ? '7 Qs (Normal)' : '7 أسئلة';
                      })()}
                    </span>
                  </div>
                </div>

                {/* Vocabulary checklist preview */}
                {(
                  // Targeted Vocabulary Checklist preview
                  // Targeted Vocabulary Checklist preview
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
                      {language !== 'ar' ? 'Preview Lexicon Words' : 'المفردات التأسيسية المدرجة'}
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedNode.lesson?.words.map((w) => (
                        <div 
                          key={w.id}
                          className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl select-none">{w.emoji}</span>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                <bdi>{w.ku}</bdi>
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 leading-none">
                                {language !== 'ar' ? w.en : w.ar}
                              </div>
                            </div>
                          </div>
                          
                          <AudioButton 
                            audioUrl={w.audio}
                            textToSpeak={w.ku}
                            className="bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-slate-800 p-2 text-indigo-600 hover:text-indigo-700"
                            iconClassName="w-4 h-4"
                            showProgress={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action main launching footer launcher */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleNodeLaunch(selectedNode)}
                  className="w-full py-4.5 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all border-none bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:shadow-indigo-600/20 shadow-indigo-600/10"
                >
                  <Play className="w-4 h-4 fill-current text-indigo-100" />
                  <span>{language !== 'ar' ? 'Start Active Quiz!' : 'ابدأ تدريب الوحدة التفاعلية!'}</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

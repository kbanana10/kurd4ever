/**
 * OnboardingFlow.tsx — 4-step personalization wizard (post-auth overlay).
 *
 *   1. Learning motivation   → userData.onboardingReason
 *   2. Starting proficiency  → userData.onboardingLevel (+ preferredStartingPath)
 *   3. Daily commitment      → userData.dailyGoalXp (20 / 50 / 100)
 *   4. Persona & avatar      → userData.avatarId
 *
 * All copy lives in translations.ts (en / ku / ar) and the layout is fully
 * RTL-aware. Answers are persisted in one updateUserData call on finish.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Plane, BookOpen, Briefcase, Sprout, MessageCircle, Rocket,
  Coffee, CalendarCheck, Flame as FlameIcon, ChevronRight, Check,
  User as UserIcon, Smile, GraduationCap, Flame, Sparkles, Star, Compass, Award,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/translations';
import { AVATARS } from '../constants/appConstants';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const AVATAR_ICONS = {
  'user': UserIcon, 'smile': Smile, 'graduation-cap': GraduationCap, 'flame': Flame,
  'sparkles': Sparkles, 'star': Star, 'compass': Compass, 'award': Award,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

const TOTAL_STEPS = 4;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { language, updateUserData } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [reason, setReason] = useState('');
  const [level, setLevel] = useState('');
  const [goalXp, setGoalXp] = useState<number | null>(null);
  const [avatarId, setAvatarId] = useState('');

  const REASONS = [
    { id: 'family', icon: <Users className="w-5 h-5" />, tone: 'bg-rose-100 dark:bg-rose-950/40 text-rose-500', title: t(language, 'onb_reason_family'), desc: t(language, 'onb_reason_family_desc') },
    { id: 'travel', icon: <Plane className="w-5 h-5" />, tone: 'bg-sky-100 dark:bg-sky-950/40 text-sky-500', title: t(language, 'onb_reason_travel'), desc: t(language, 'onb_reason_travel_desc') },
    { id: 'culture', icon: <BookOpen className="w-5 h-5" />, tone: 'bg-[#FFF3D6] dark:bg-[#3A2F14] text-[#D97706] dark:text-[#FFCE6B]', title: t(language, 'onb_reason_culture'), desc: t(language, 'onb_reason_culture_desc') },
    { id: 'career', icon: <Briefcase className="w-5 h-5" />, tone: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600', title: t(language, 'onb_reason_career'), desc: t(language, 'onb_reason_career_desc') },
  ];

  const LEVELS = [
    { id: 'beginner', icon: <Sprout className="w-5 h-5" />, tone: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600', title: t(language, 'onb_level_beginner'), desc: t(language, 'onb_level_beginner_desc') },
    { id: 'elementary', icon: <MessageCircle className="w-5 h-5" />, tone: 'bg-sky-100 dark:bg-sky-950/40 text-sky-500', title: t(language, 'onb_level_basics'), desc: t(language, 'onb_level_basics_desc') },
    { id: 'conversational', icon: <Rocket className="w-5 h-5" />, tone: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600', title: t(language, 'onb_level_intermediate'), desc: t(language, 'onb_level_intermediate_desc') },
  ];

  const GOALS = [
    { xp: 20, icon: <Coffee className="w-5 h-5" />, tone: 'bg-sky-100 dark:bg-sky-950/40 text-sky-500', title: t(language, 'onb_goal_casual'), desc: t(language, 'onb_goal_casual_desc') },
    { xp: 50, icon: <CalendarCheck className="w-5 h-5" />, tone: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600', title: t(language, 'onb_goal_regular'), desc: t(language, 'onb_goal_regular_desc') },
    { xp: 100, icon: <FlameIcon className="w-5 h-5" />, tone: 'bg-orange-100 dark:bg-orange-950/40 text-orange-500', title: t(language, 'onb_goal_serious'), desc: t(language, 'onb_goal_serious_desc') },
  ];

  const stepReady =
    step === 0 ? reason !== '' :
    step === 1 ? level !== '' :
    step === 2 ? goalXp !== null :
    avatarId !== '';

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Keep the Daily Goal tracker in sync (it reads minutes from storage):
      // 20 XP → 5 min, 50 XP → 10 min, 100 XP → 15 min.
      const mins = goalXp === 20 ? 5 : goalXp === 100 ? 15 : 10;
      try { localStorage.setItem('kurdish_quest_daily_goal_mins', String(mins)); } catch {}

      await updateUserData({
        isOnboarded: true,
        onboardingReason: reason || 'culture',
        onboardingLevel: level || 'beginner',
        dailyGoalXp: goalXp ?? 50,
        avatarId: avatarId || AVATARS[0].id,
        preferredStartingPath: level === 'conversational' ? 'A2' : 'A1',
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!stepReady || saving) return;
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else void finish();
  };

  const titles = [
    [t(language, 'onb_reason_title'), t(language, 'onb_reason_subtitle')],
    [t(language, 'onb_level_title'), t(language, 'onb_level_subtitle')],
    [t(language, 'onb_goal_title'), t(language, 'onb_goal_subtitle')],
    [t(language, 'onb_avatar_title'), t(language, 'onb_avatar_subtitle')],
  ][step];

  const OptionRow = ({ active, onClick, icon, tone, title, desc }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-3xl border-2 flex items-center gap-3.5 transition-all cursor-pointer text-start bg-white dark:bg-slate-900 ${
        active
          ? 'border-[#FFB300] bg-[#FFF6E0] dark:bg-[#3A2F14] shadow-[0_4px_20px_rgba(255,179,0,0.15)]'
          : 'border-line-soft hover:border-[#FFB300]/50 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
      }`}
    >
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-black text-sm text-ink leading-snug">{title}</span>
        <span className="block text-xs text-muted font-semibold mt-0.5 leading-relaxed">{desc}</span>
      </span>
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
          active ? 'bg-[#FFB300] text-[#432C00]' : 'bg-slate-100 dark:bg-slate-800 text-transparent'
        }`}
        aria-hidden="true"
      >
        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
      </span>
    </button>
  );

  // Portalled to <body>: rendered inside the page's scroll container the
  // fixed overlay was trapped in a lower stacking context and the bottom
  // nav bled through underneath the wizard.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#FBFBFA] dark:bg-[#141414] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={titles[0]}
    >
      <div className="max-w-md mx-auto min-h-full flex flex-col p-5 pb-8">

        {/* Progress header */}
        <div className="flex items-center gap-3 pt-2 pb-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              aria-label={t(language, 'ftux_back')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-line-soft text-muted hover:text-ink shadow-xs cursor-pointer shrink-0"
            >
              <ChevronRight className="w-5 h-5 rotate-180 rtl:-rotate-0" />
            </button>
          ) : <span className="w-11 shrink-0" />}

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5 text-[11px] font-extrabold text-muted uppercase tracking-widest">
              <span>{t(language, 'onb_step')} {step + 1} / {TOTAL_STEPS}</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" dir="ltr">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#FFC541] to-[#FFA000]"
                animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ type: 'spring', stiffness: 160, damping: 24 }}
              />
            </div>
          </div>
          <span className="w-11 shrink-0" />
        </div>

        {/* Step title */}
        <div className="text-center space-y-1.5 pb-5">
          <h2 className="text-[22px] font-black text-ink tracking-tight leading-snug text-balance">{titles[0]}</h2>
          <p className="text-sm text-muted font-semibold leading-relaxed">{titles[1]}</p>
        </div>

        {/* Step body */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {step === 0 && REASONS.map(o => (
                <OptionRow key={o.id} active={reason === o.id} onClick={() => setReason(o.id)} {...o} />
              ))}

              {step === 1 && LEVELS.map(o => (
                <OptionRow key={o.id} active={level === o.id} onClick={() => setLevel(o.id)} {...o} />
              ))}

              {step === 2 && GOALS.map(o => (
                <OptionRow key={o.xp} active={goalXp === o.xp} onClick={() => setGoalXp(o.xp)} {...o} />
              ))}

              {step === 3 && (
                <div className="grid grid-cols-4 gap-3 pt-2">
                  {AVATARS.map(av => {
                    const Icon = AVATAR_ICONS[av.icon] || UserIcon;
                    const active = avatarId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarId(av.id)}
                        aria-label={av.id}
                        aria-pressed={active}
                        className={`aspect-square rounded-3xl flex items-center justify-center transition-all cursor-pointer border-2 ${av.color} ${
                          active
                            ? 'border-[#FFB300] scale-105 shadow-[0_6px_18px_rgba(255,179,0,0.3)]'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="pt-6">
          <button
            type="button"
            onClick={next}
            disabled={!stepReady || saving}
            className="w-full bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] py-4 rounded-full font-black text-base shadow-[0_3px_0_#E69500,0_10px_20px_rgba(255,179,0,0.22)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            {step === TOTAL_STEPS - 1 ? t(language, 'onb_finish') : t(language, 'continue')}
            <ChevronRight className="w-5 h-5 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

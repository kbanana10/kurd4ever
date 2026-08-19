/**
 * AdElements.tsx
 * 
 * Production-ready simulated Google AdMob Banner, Interstitial and Rewarded ads
 * equipped with high-fidelity visuals, mock countdown triggers, and dynamic close controls.
 */
import React, { useState, useEffect } from 'react';
import { useAdStore } from '../store/adStore';
import { Play, X, ShieldAlert, Award, AlertCircle, Sparkles, Trophy, Megaphone, Map, Globe, Compass, Gift, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../lib/AuthContext';

// Safe Ad Banner placement
export function AdBanner() {
  const { bannersEnabled } = useAdStore();
  const { language } = useAuth();
  const [closed, setClosed] = useState(false);

  if (!bannersEnabled || closed) return null;

  const labels = {
    en: {
      sponsored: "Sponsored Advertisement",
      upgrade: "Ad-free Experience",
      text: "Upgrade to Quest Premium to disable all ads and unlock advanced Kurdish vocabulary lessons!",
      button: "Go Ad-Free"
    },
    ar: {
      sponsored: "إعلان مدعوم",
      upgrade: "تجربة خالية من الإعلانات",
      text: "اشترك في كويست بريميوم لإزالة كافة الإعلانات وبدء تحديات قواعد اللغة المتقدمة!",
      button: "ترقية الحساب"
    }
  }[language !== 'ar' ? 'en' : 'ar'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 relative overflow-hidden select-none shadow-xs mt-3 text-center flex flex-col items-center gap-3 sm:max-w-md mx-auto"
    >
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none">
        <span className="flex items-center gap-1">
          <Megaphone className="w-3 h-3 text-[#B45309] dark:text-[#FFCE6B]" />
          {labels.sponsored}
        </span>
        <button 
          onClick={() => setClosed(true)}
          aria-label={labels.sponsored ? `Dismiss ${labels.sponsored}` : 'Dismiss ad'}
          className="min-w-[44px] min-h-[44px] -my-2.5 -me-2 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-3 mt-1">
        <div className="bg-indigo-600 text-white rounded-xl w-12 h-12 flex items-center justify-center shrink-0 font-black text-sm shadow-xs">
          Quest
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
            {labels.upgrade}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-1.5 font-medium line-clamp-2 px-2">
            {labels.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Full Interstitial Ad Modal Player
export function InterstitialAdModal() {
  const { interstitialActive, closeInterstitial } = useAdStore();
  const { language } = useAuth();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!interstitialActive) {
      setCountdown(4);
      return;
    }

    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [interstitialActive, countdown]);

  if (!interstitialActive) return null;

  const labels = {
    en: {
      advertisement: "ADVERTISEMENT",
      title: "Journey to Kurdistan!",
      info: "Discover historical castles, epic lakes and centuries-old culture with Kurdistan Tourism board.",
      closing: "Closing in",
      sec: "s",
      skip: "Skip Ad"
    },
    ar: {
      advertisement: "إعلان تجاري للتطبيق",
      title: "رحلتك إلى كردستان!",
      info: "اكتشف القلاع التاريخية والبحيرات الرائعة والثقافة القديمة مع هيئة السياحة في كردستان.",
      closing: "إغلاق في خلال",
      sec: "ثوانٍ",
      skip: "تخطي الإعلان"
    }
  }[language !== 'ar' ? 'en' : 'ar'];

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-99 flex flex-col items-center justify-between p-6 overflow-hidden text-center text-white select-none">
      <div className="w-full flex justify-between items-center max-w-sm mt-3">
        <span className="bg-white/10 px-2.5 py-1 text-[9px] font-black tracking-widest rounded-full text-slate-300">
          {labels.advertisement}
        </span>
        
        {countdown > 0 ? (
          <span className="text-xs font-black text-slate-400 bg-white/10 px-3 py-1 rounded-full font-mono">
            {labels.closing} {countdown}{labels.sec}
          </span>
        ) : (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={closeInterstitial}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all border-none shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <span>{labels.skip}</span>
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="max-w-sm flex flex-col items-center gap-6 my-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl" />
          <motion.div 
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl relative text-white"
          >
            <Globe className="w-12 h-12" />
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight leading-tight bg-gradient-to-r from-amber-200 to-indigo-300 bg-clip-text text-transparent">
            {labels.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            {labels.info}
          </p>
        </div>

        <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 mb-1"><Map className="w-6 h-6" /></span>
            <span className="text-[10px] text-slate-400 font-extrabold">Amadiya</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="text-amber-400 mb-1"><Compass className="w-6 h-6 animate-spin-slow" /></span>
            <span className="text-[10px] text-slate-400 font-extrabold">Zend Cave</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="text-emerald-400 mb-1"><Globe className="w-6 h-6" /></span>
            <span className="text-[10px] text-slate-400 font-extrabold">Rawanduz</span>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-medium pb-2 select-none">
        Ads help fund our servers and free academic content. Thank you for learning Kurmanji!
      </div>
    </div>
  );
}

// Rewarded Video/Play Ad Modal Player
export function RewardedAdModal() {
  const { rewardedActive, closeRewarded } = useAdStore();
  const { language } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!rewardedActive) {
      setCountdown(5);
      setIsFinished(false);
      return;
    }

    if (countdown <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rewardedActive, countdown]);

  if (!rewardedActive) return null;

  const labels = {
    en: {
      heading: "WATCHING SPONSORED REWARD",
      rewarding: "REWARD UNLOCKED",
      sub: "Watch this video helper to claim +50 XP bonus instantly!",
      bonusUnlocked: "Congratulations! +50 XP Bonus credited to your account profile.",
      sec: "s",
      claimButton: "Claim Reward +50 XP",
      watchingAd: "Watching ad content...",
      quit: "Quit (Lose Bonus)"
    },
    ar: {
      heading: "جاري عرض إعلان المكافأة",
      rewarding: "تم تفعيل المكافأة",
      sub: "شاهد هذا المقطع القصير للحصول على +50 نقطة خبرة إضافية فوراً!",
      bonusUnlocked: "تهانينا! تم إضافة مكافأة بقيمة +50 نقطة خبرة لإحصائيات حسابك.",
      sec: "ثوانٍ",
      claimButton: "الحصول على +50 نقطة خبرة",
      watchingAd: "جاري تحميل الإعلان التجاري...",
      quit: "الخروج (خسارة المكافأة)"
    }
  }[language !== 'ar' ? 'en' : 'ar'];

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-lg z-99 flex flex-col items-center justify-between p-6 text-center text-white select-none">
      <div className="w-full flex justify-between items-center max-w-sm mt-3">
        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/20 px-2.5 py-1 text-[9px] font-black tracking-widest rounded-full">
          {labels.heading}
        </span>
        
        {isFinished ? (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[9px] font-bold tracking-wider rounded-full uppercase">
            {labels.rewarding}
          </span>
        ) : (
          <button
            onClick={() => closeRewarded(false)}
            className="p-1 px-3 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl cursor-copy border-none"
          >
            {labels.quit}
          </button>
        )}
      </div>

      <div className="max-w-sm flex flex-col items-center gap-7 my-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-400/25 rounded-full blur-3xl" />
          <motion.div
            animate={{ 
              scale: isFinished ? [1, 1.12, 1] : 1,
              rotate: isFinished ? [0, 10, -10, 360] : 0
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`w-28 h-28 ${isFinished ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white' : 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white'} rounded-full flex items-center justify-center shadow-2xl relative border-2 border-white/20`}
          >
            {isFinished ? (
              <Gift className="w-12 h-12 text-white" />
            ) : (
              <Zap className="w-12 h-12 text-white fill-amber-300" />
            )}
          </motion.div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight leading-tight max-w-[280px]">
            {isFinished ? labels.rewarding : labels.watchingAd}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mx-auto font-medium">
            {isFinished ? labels.bonusUnlocked : labels.sub}
          </p>
        </div>

        {/* Action button inside dialog */}
        <div className="w-full">
          {!isFinished ? (
            <div className="space-y-2.5">
              <div className="w-full bg-slate-900 border border-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-black text-amber-400 font-mono">
                {countdown} {labels.sec} remaining
              </span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => closeRewarded(true)}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-2xl font-black text-sm cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 border-none"
            >
              {labels.claimButton}
            </motion.button>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-medium pb-2 select-none">
        Reward partners make educational access entirely free. Claim your points and power up!
      </div>
    </div>
  );
}

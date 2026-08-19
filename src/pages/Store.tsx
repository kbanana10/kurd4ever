/**
 * Store.tsx — Gems & Rewards Store (/store)
 *
 * Reached from the 💎 badge in the universal header (previously a dead link
 * to the 404 page). Gem packs are IAP previews ("Coming Soon"); the Streak
 * Freeze power-up is genuinely purchasable with earned gems.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Snowflake, Zap, Megaphone, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/translations';

const GEM_PACKS = [
  { id: 'small', gems: 100, emoji: '💰', price: '$1.99', best: false },
  { id: 'medium', gems: 500, emoji: '🎁', price: '$6.99', best: true },
  { id: 'large', gems: 1200, emoji: '🏆', price: '$12.99', best: false },
];

const FREEZE_COST = 200;

export function Store() {
  const { userData, updateUserData, language } = useAuth();
  const gems = userData?.gems ?? 0;
  const freezes = userData?.streakFreezes ?? 0;
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // TIMER SAFETY (TODO-028): one tracked toast timer. Previously each
  // purchase attempt armed an independent anonymous setTimeout — a stale
  // timer from an earlier toast could wipe a newer toast mid-display, and
  // unmounting mid-toast left a ghost setState.
  const toastTimerRef = React.useRef<number | null>(null);
  const showToast = React.useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToast(null);
    }, 2500);
  }, []);
  React.useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  const packName = (id: string) =>
    id === 'small' ? t(language, 'store_pack_small')
    : id === 'medium' ? t(language, 'store_pack_medium')
    : t(language, 'store_pack_large');

  const buyFreeze = async () => {
    if (busy) return;
    if (gems < FREEZE_COST) {
      showToast(t(language, 'store_not_enough'));
      return;
    }
    setBusy(true);
    try {
      await updateUserData({ gems: gems - FREEZE_COST, streakFreezes: freezes + 1 });
      showToast(t(language, 'store_freeze_bought'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 pb-28 max-w-md mx-auto space-y-5">

      {/* Balance hero */}
      <div className="bg-white dark:bg-slate-900 border border-line-soft rounded-3xl p-5 shadow-flat relative overflow-hidden flex items-center justify-between">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_80%_30%,#00B0FF_0%,transparent_55%)] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10">
          <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest">{t(language, 'store_balance')}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-3xl select-none" aria-hidden="true">💎</span>
            <span className="text-3xl font-black text-ink">{gems}</span>
          </div>
        </div>
        <div className="relative z-10 text-end">
          <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest">{t(language, 'store_freeze_title')}</div>
          <div className="flex items-center justify-end gap-1.5 mt-1.5">
            <Snowflake className="w-5 h-5 text-sky-500" aria-hidden="true" />
            <span className="text-xl font-black text-ink">{freezes}</span>
          </div>
        </div>
      </div>

      {/* Preview-mode banner */}
      <div className="bg-[#FFF6E0] dark:bg-[#3A2F14] border border-[#FFB300]/40 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-[#FFB300]/20 flex items-center justify-center shrink-0 text-[#B8860B] dark:text-[#FFCE6B]" aria-hidden="true">
          <Megaphone className="w-4 h-4" />
        </span>
        <p className="text-xs font-extrabold text-[#8A6100] dark:text-[#FFCE6B] leading-relaxed">
          {t(language, 'store_preview_banner')}
        </p>
      </div>

      {/* Gem packs */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-ink px-1 uppercase tracking-wider">{t(language, 'store_gem_packs')}</h3>
        <div className="grid grid-cols-3 gap-3">
          {GEM_PACKS.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-4 pt-5 flex flex-col items-center text-center gap-1.5 shadow-flat relative ${
                pack.best ? 'border-2 border-[#FFB300]' : 'border border-line-soft'
              }`}
            >
              {pack.best && (
                <span className="absolute -top-2.5 inset-x-0 mx-auto w-max bg-[#FFB300] text-[#432C00] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  {t(language, 'store_best_value')}
                </span>
              )}
              <span className="text-3xl select-none" aria-hidden="true">{pack.emoji}</span>
              <span className="text-xs font-black text-ink leading-tight">{packName(pack.id)}</span>
              <span className="text-sm font-black text-[#00B0FF]">💎 {pack.gems}</span>
              <span className="text-[10px] font-bold text-subtle line-through">{pack.price}</span>
              <span className="w-full mt-1 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wide">
                {t(language, 'store_coming_soon')}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Power-ups */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-ink px-1 uppercase tracking-wider">{t(language, 'store_powerups')}</h3>

        {/* Streak Freeze — functional (buy with gems) */}
        <div className="bg-white dark:bg-slate-900 border border-line-soft rounded-3xl p-4 shadow-flat flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shrink-0" aria-hidden="true">
            <Snowflake className="w-6 h-6" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-ink flex items-center gap-2">
              {t(language, 'store_freeze_title')} ❄️
              {freezes > 0 && (
                <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  {freezes} {t(language, 'store_owned')}
                </span>
              )}
            </div>
            <p className="text-xs text-muted font-semibold mt-0.5 leading-relaxed">{t(language, 'store_freeze_desc')}</p>
          </div>
          <button
            type="button"
            onClick={buyFreeze}
            disabled={busy}
            className={`shrink-0 min-h-[44px] px-4 rounded-full font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              gems >= FREEZE_COST
                ? 'bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] shadow-[0_3px_0_#E69500]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            {t(language, 'store_buy')} · 💎{FREEZE_COST}
          </button>
        </div>

        {/* Double XP — preview */}
        <div className="bg-white dark:bg-slate-900 border border-line-soft rounded-3xl p-4 shadow-flat flex items-center gap-4 opacity-80">
          <span className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0" aria-hidden="true">
            <Zap className="w-6 h-6" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-ink">{t(language, 'store_boost_title')} ⚡</div>
            <p className="text-xs text-muted font-semibold mt-0.5 leading-relaxed">{t(language, 'store_boost_desc')}</p>
          </div>
          <span className="shrink-0 px-3.5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wide">
            {t(language, 'store_coming_soon')}
          </span>
        </div>
      </div>

      {/* Purchase feedback toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 inset-x-4 max-w-md mx-auto bg-white dark:bg-slate-900 border border-line-soft border-s-4 border-s-[#FFB300] rounded-2xl px-4 py-3 shadow-[0_18px_44px_rgba(30,41,59,0.18)] flex items-center gap-2.5 z-50"
          role="status"
        >
          <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
          <span className="text-xs font-extrabold text-ink">{toast}</span>
        </motion.div>
      )}
    </div>
  );
}

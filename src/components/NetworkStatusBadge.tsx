/**
 * NetworkStatusBadge.tsx
 * 
 * Non-intrusive indicator banner showing connectivity status (Online / Offline Mode)
 * and pending offline sync queue metrics.
 */
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { syncEngine, SyncEngineStatus } from '../services/SyncEngine';
import { isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export function NetworkStatusBadge() {
  const { language } = useAuth();
  const [status, setStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  // TIMER SAFETY (TODO-028): tracked + cleaned; the subscribe callback used
  // to arm an untracked timeout that could setState after unmount.
  const onlineToastTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      if (!status.isOnline && newStatus.isOnline) {
        setShowOnlineToast(true);
        if (onlineToastTimerRef.current !== null) window.clearTimeout(onlineToastTimerRef.current);
        onlineToastTimerRef.current = window.setTimeout(() => {
          onlineToastTimerRef.current = null;
          setShowOnlineToast(false);
        }, 4000);
      }
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
      if (onlineToastTimerRef.current !== null) window.clearTimeout(onlineToastTimerRef.current);
    };
  }, [status.isOnline]);

  // Cloud sync affordances only make sense with a real Firebase project.
  // Unconfigured (guest-only) builds show nothing — there is no queue that
  // could ever flush, so "pending sync" badges would be noise (TODO-002).
  if (!isFirebaseConfigured) {
    return null;
  }

  // Don't clutter the UI if online and nothing is pending
  if (status.isOnline && status.pendingCount === 0 && !status.isSyncing && !showOnlineToast) {
    return null;
  }

  return (
    <div className="fixed top-2 end-2 z-50 pointer-events-none select-none">
      <AnimatePresence>
        {/* Offline Mode Indicator */}
        {!status.isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto bg-amber-500 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-amber-300"
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {language !== 'ar' ? 'Offline Mode' : 'وضع بدون إنترنت'}
            </span>
            {status.pendingCount > 0 && (
              <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.2 rounded-md text-[10px]">
                {status.pendingCount}
              </span>
            )}
          </motion.div>
        )}

        {/* Syncing in progress */}
        {status.isOnline && (status.isSyncing || status.pendingCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto bg-indigo-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-indigo-400"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>
              {language !== 'ar'
                ? `Syncing (${status.pendingCount})...`
                : `جاري المزامنة (${status.pendingCount})...`}
            </span>
          </motion.div>
        )}

        {/* Reconnected Toast */}
        {status.isOnline && showOnlineToast && !status.isSyncing && status.pendingCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-emerald-400"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>
              {language !== 'ar' ? 'Back Online! Progress Synced' : 'تم استعادة الاتصال بالمزامنة!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

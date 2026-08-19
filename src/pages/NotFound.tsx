/**
 * NotFound.tsx
 *
 * AUDIT FIX: the router had no catch-all route, so any unknown or stale deep
 * link (e.g. a bookmarked /vocabulary/deleted-category, or a typo) rendered a
 * completely blank screen inside the layout with no way to recover other than
 * the browser back button.
 */
import { useNavigate } from 'react-router';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function NotFound() {
  const navigate = useNavigate();
  const { language } = useAuth();
  const isEn = language !== 'ar';

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-5 min-h-[60vh]">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          {isEn ? 'This page does not exist' : 'هذه الصفحة غير موجودة'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          {isEn
            ? 'The link may be outdated, or the lesson was moved. Your progress is safe.'
            : 'قد يكون الرابط قديماً أو تم نقل الدرس. تقدمك محفوظ بأمان.'}
        </p>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {isEn ? 'Go back' : 'رجوع'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          {isEn ? 'Home' : 'الرئيسية'}
        </button>
      </div>
    </div>
  );
}

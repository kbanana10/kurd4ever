import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { NotebookPen, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';

/**
 * WritingComingSoon — the placeholder that gates the Word and Sentence tracing
 * features. The routes stay registered (we re-enable later), but this empty
 * state is what actually renders for now: a clear "Di nêzîk de / Coming Soon"
 * message plus a back button to the Writing hub, so a deep link or browser
 * back never surfaces the (temporarily hidden) tracing canvases.
 */

export type WritingComingSoonFeature = 'words' | 'sentences';

interface FeatureCopy {
  titleEn: string;
  titleKu: string;
  titleAr: string;
}

const FEATURE_COPY = {
  words: { titleEn: 'Word Writing', titleKu: 'Nivîsîna Peyvan', titleAr: 'كتابة الكلمات' },
  sentences: { titleEn: 'Sentence Writing', titleKu: 'Nivîsîna Hevokan', titleAr: 'كتابة الجُمل' },
} satisfies Record<WritingComingSoonFeature, FeatureCopy>;

export function WritingComingSoon({ feature }: { feature: WritingComingSoonFeature }) {
  const navigate = useNavigate();
  const { language } = useAuth();
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const copy = FEATURE_COPY[feature];
  const title = isKu ? copy.titleKu : isAr ? copy.titleAr : copy.titleEn;
  const Icon = feature === 'words' ? MessageSquare : NotebookPen;

  const badge = isKu ? 'Di nêzîk de' : isAr ? 'قريباً' : 'Coming Soon';
  const body = isKu
    ? 'Ev beş di pêşketinê de ye. Di nêzîk de vegere!'
    : isAr
      ? 'هذا القسم قيد التطوير. عد قريباً!'
      : 'This section is being prepared. Check back soon!';
  const backLabel = isKu ? 'Vegere Nivîsînê' : isAr ? 'العودة إلى الكتابة' : 'Back to Writing';

  return (
    <div className="min-h-[70dvh] flex items-center justify-center p-4 pb-24 relative overflow-hidden">
      {/* Ambient brand glow, matching the Writing hub hero. */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFB300]/10 dark:bg-[#FFB300]/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-line-soft rounded-[32px] p-8 shadow-flat flex flex-col items-center text-center gap-4 relative overflow-hidden">
        <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.08] pointer-events-none" aria-hidden="true" />

        <span className="relative z-10 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-[#8A6100] dark:text-[#FFCE6B] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          {badge}
        </span>

        <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 opacity-70" aria-hidden="true">
          <Icon className="w-9 h-9 text-slate-400 dark:text-slate-500" />
        </div>

        <h3 className="relative z-10 text-xl font-black tracking-tight text-ink leading-snug">{title}</h3>
        <p className="relative z-10 text-muted text-[12px] leading-relaxed font-semibold"> {body}</p>

        <button
          type="button"
          onClick={() => navigate('/writing')}
          aria-label={backLabel}
          className="relative z-10 inline-flex items-center justify-center gap-2 min-h-[50px] px-5 py-3 text-sm font-black tracking-tight rounded-full bg-[#FFB300] hover:bg-[#E69500] text-[#432C00] border border-transparent shadow-[0_3px_0_#E69500,0_10px_20px_rgba(255,179,0,0.22)] transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300] focus-visible:ring-offset-2 dark:focus-visible:ring-[#FFBA38] dark:focus-visible:ring-offset-slate-900"
        >
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          {backLabel}
        </button>
      </div>
    </div>
  );
}

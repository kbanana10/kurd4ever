/**
 * QuizResults.tsx — quiz completion screen (TODO-029).
 * Extracted verbatim from Quiz.tsx during the incremental quiz refactor;
 * behavior and markup are unchanged.
 */
import React from 'react';
import Confetti from 'react-confetti';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { Language } from '../../../models/user';
import { t } from '../../../localization/translations';
import { Badge, Button, Card } from '../../../components/ui';

interface QuizResultsProps {
  language: Language;
  score: number;
  total: number;
  earnedXp: number;
  earnedGems: number;
  showConfetti: boolean;
  hasMissedQuestions: boolean;
  /** "Review Answers" when there are missed questions, otherwise Continue. */
  onPrimary: () => void;
  onHome: () => void;
}

export function QuizResults({
  language,
  score,
  total,
  earnedXp,
  earnedGems,
  showConfetti,
  hasMissedQuestions,
  onPrimary,
  onHome,
}: QuizResultsProps) {
  const accuracyPercent = Math.round((score / (total || 1)) * 100);
  const missedCount = total - score;

  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-5 text-center absolute top-0 start-0 bg-surface-2 z-50 overflow-y-auto pb-20 select-none">
      {showConfetti && <Confetti width={globalThis.window !== undefined ? window.innerWidth : 400} height={globalThis.window !== undefined ? window.innerHeight : 800} recycle={false} numberOfPieces={300} />}

      {/* Top Header */}
      <div className="w-full max-w-sm py-2 text-center border-b-2 border-line pb-3">
        <h1 className="text-xl font-black text-ink">
          {language !== 'ar' ? 'Quiz Results' : 'نتائج الاختبار'}
        </h1>
      </div>

      {/* Celebration Trophy with Score Ring */}
      <div className="my-auto py-4 flex flex-col items-center space-y-4 max-w-sm w-full">

        <div className="relative flex items-center justify-center my-2">
          {/* Outer Circular Ring */}
          <div className="w-36 h-36 rounded-full border-8 border-line flex items-center justify-center relative bg-surface">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-brand transition-all duration-1000"
                strokeDasharray={`${accuracyPercent * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center justify-center z-10">
              <Trophy className="w-10 h-10 text-warning drop-shadow-sm mb-1 animate-bounce" />
              <span className="text-xl font-black text-ink">{score}/{total}</span>
              <span className="text-[11px] font-bold text-muted">{accuracyPercent}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-ink font-display">
            {accuracyPercent >= 80 ? (language !== 'ar' ? 'Serkeftin! Well done!' : 'سەركەفتن! أحسنت!') : (language !== 'ar' ? 'Good effort — keep going!' : 'جهد طيب — واصل!')}
          </h2>
          <p className="text-muted font-bold text-xs">
            {language !== 'ar' ? 'You completed the quiz successfully' : 'لقد أكملت الاختبار بنجاح'}
          </p>
        </div>

        {/* 3 Metrics Cards Row */}
        <div className="grid grid-cols-3 gap-2.5 w-full pt-2">
          <Card padding="sm" elevation="flat" className="flex flex-col items-center">
            <span className="text-lg font-black text-ink">{total}</span>
            <span className="text-[10px] font-bold text-muted mt-0.5">{language !== 'ar' ? 'Total' : 'عدد الأسئلة'}</span>
          </Card>

          <Card padding="sm" elevation="flat" className="flex flex-col items-center">
            <span className="text-lg font-black text-success">{score}</span>
            <span className="text-[10px] font-bold text-muted mt-0.5">{language !== 'ar' ? 'Correct' : 'إجابات صحيحة'}</span>
          </Card>

          <Card padding="sm" elevation="flat" className="flex flex-col items-center">
            <span className="text-lg font-black text-danger">{missedCount}</span>
            <span className="text-[10px] font-bold text-muted mt-0.5">{language !== 'ar' ? 'Errors' : 'أخطاء'}</span>
          </Card>
        </div>

        {/* Reward Badges Row */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <Badge tone="success" className="text-xs px-3.5 py-1.5 normal-case tracking-normal">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            +{earnedXp || score * 12} XP
          </Badge>

          {/* Gems only when actually earned (perfect run / level-up) — the
              old `|| 5` fallback displayed phantom gems. Real gem income is
              the daily missions in Profile. */}
          {earnedGems > 0 && (
            <Badge tone="warning" className="text-xs px-3.5 py-1.5 normal-case tracking-normal">
              <span aria-hidden="true">💎</span> +{earnedGems}
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-2.5 pt-4">
        <Button
          size="lg"
          fullWidth
          onClick={onPrimary}
          trailingIcon={<ArrowRight className="w-5 h-5 rtl:rotate-180" />}
        >
          {hasMissedQuestions
            ? (language !== 'ar' ? 'Review Answers' : 'مراجعة الإجابات')
            : t(language, 'continue')}
        </Button>

        <Button variant="secondary" fullWidth onClick={onHome}>
          {language !== 'ar' ? 'Back to Home' : 'العودة للرئيسية'}
        </Button>
      </div>
    </div>
  );
}

/**
 * QuizStudyPhase.tsx — "Phase 1: Explore & Learn" screen (TODO-029).
 * Extracted verbatim from Quiz.tsx during the incremental quiz refactor;
 * behavior and markup are unchanged.
 */
import React from 'react';
import { X, ChevronRight, Rabbit, Turtle, Volume2, VolumeX } from 'lucide-react';
import { Language } from '../../../models/user';
import { LessonWord } from '../../../data/learningPath';
import { AudioButton } from '../../audio/components/AudioButton';
import { Button, Card, Switch } from '../../../components/ui';
import { getIconByName } from '../../../components/vocabulary/wordIcons';

interface QuizStudyPhaseProps {
  language: Language;
  catName: string;
  catIcon: string;
  words: LessonWord[];
  useSlowPronunciation: boolean;
  onToggleSlow: (v: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
  onExit: () => void;
}

export function QuizStudyPhase({
  language,
  catName,
  catIcon,
  words,
  useSlowPronunciation,
  onToggleSlow,
  isMuted,
  onToggleMute,
  onStart,
  onExit,
}: QuizStudyPhaseProps) {
  return (
    <div className="p-4 flex flex-col h-full absolute top-0 start-0 w-full bg-surface-2 text-ink z-50 font-sans leading-relaxed overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onExit}
          aria-label={language !== 'ar' ? 'Exit lesson' : 'إنهاء الدرس'}
          className="shrink-0 !px-0 w-11 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-black flex-1 text-center text-ink truncate">
          {language !== 'ar' ? 'Phase 1: Explore & Learn' : 'المرحلة الأولى: دراسة مفردات الوحدة'}
        </h1>
        {/* Spacer keeps the title optically centred without a fixed `me-10`. */}
        <span className="w-11 shrink-0" aria-hidden="true" />
      </div>

      {/* Category overview */}
      <Card padding="lg" className="flex items-center gap-4 mb-6 max-w-sm mx-auto w-full">
        <div className="w-14 h-14 bg-surface-2 border-2 border-line flex items-center justify-center rounded-control shrink-0">
          {getIconByName(catIcon, 'w-8 h-8 text-brand')}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-black text-brand uppercase tracking-wider block mb-0.5">
            {language !== 'ar' ? "LET'S ENRICH SENSES" : 'ادرس وانطق الكلمات لتثبيتها'}
          </span>
          <h2 className="text-lg font-black text-ink truncate">{catName}</h2>
        </div>
      </Card>

      {/* Speed / mute switches (labelled Switch primitives for AT users) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-sm mx-auto w-full">
        <Card padding="sm" elevation="flat" className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-ink flex items-center gap-1.5 min-w-0">
            {useSlowPronunciation ? (
              <Turtle className="w-4 h-4 text-brand shrink-0" />
            ) : (
              <Rabbit className="w-4 h-4 text-brand shrink-0" />
            )}
            <span className="truncate">{language !== 'ar' ? 'Slow Speaker' : 'تحدث بطيء'}</span>
          </span>
          <Switch
            checked={useSlowPronunciation}
            onChange={onToggleSlow}
            label={language !== 'ar' ? 'Slow pronunciation' : 'النطق البطيء'}
          />
        </Card>

        <Card padding="sm" elevation="flat" className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-ink flex items-center gap-1.5 min-w-0">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-danger shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-success shrink-0" />
            )}
            <span className="truncate">{language !== 'ar' ? 'Mute' : 'كتم الصوت'}</span>
          </span>
          <Switch
            checked={isMuted}
            onChange={onToggleMute}
            tone="warning"
            label={language !== 'ar' ? 'Mute audio' : 'كتم الصوت'}
          />
        </Card>
      </div>

      {/* Word cards grid block list */}
      <ul className="space-y-3 flex-1 max-w-sm mx-auto w-full mb-6 list-none p-0">
        {words.map((word) => (
          <Card
            as="li"
            key={word.id}
            elevation="flat"
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-surface-2 rounded-control flex items-center justify-center text-3xl select-none shrink-0">
                {word.emoji}
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-ink text-base leading-tight truncate">
                  <bdi>{word.ku}</bdi>
                </h4>
                <p className="text-muted text-xs font-bold mt-1 truncate">
                  {language !== 'ar' ? word.en : word.ar}
                </p>
              </div>
            </div>
            <AudioButton
              audioUrl={word.audio}
              textToSpeak={word.ku}
              className="bg-surface-2 hover:bg-surface-3 p-2.5 text-brand rounded-control shrink-0"
              iconClassName="w-4 h-4"
              showProgress={false}
              playbackRate={useSlowPronunciation ? 0.65 : 1.0}
            />
          </Card>
        ))}
      </ul>

      {/* Dynamic CTA trigger footer */}
      <div className="max-w-sm mx-auto w-full mt-auto">
        <Button
          variant="success"
          size="lg"
          fullWidth
          onClick={onStart}
          trailingIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
        >
          {language !== 'ar' ? "Let's Play Random Quiz!" : 'الآن اختبر مهاراتي في التحدي!'}
        </Button>
      </div>
    </div>
  );
}

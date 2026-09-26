import React, { useState } from 'react';
import { alphabet } from '../data/kurmanji';
import { playAudioUrl } from '../hooks/useAudio';
import { Volume2, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/translations';
import { AudioButton } from '../components/AudioButton';
import { RecallButton } from '../components/RecallButton';
import { motion, AnimatePresence } from 'motion/react';

export function Alphabet() {
  const [selectedLetter, setSelectedLetter] = useState(alphabet[0].id);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { language } = useAuth();

  const letterData = alphabet.find(l => l.id === selectedLetter)!;

  const handlePlayAudio = async (id: string, url: string) => {
    setPlayingId(id);
    await playAudioUrl(url);
    setPlayingId(current => current === id ? null : current);
  };

  return (
    <div className="p-4 flex flex-col min-h-screen pb-24">
      
      {/* Viewport for selected letter */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center mb-6 relative overflow-hidden shadow-flat flex-shrink-0 border border-line-soft group">
        <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.10] pointer-events-none" />
        <div className="absolute top-4 end-4 z-10">
           <AudioButton 
             audioUrl={letterData.audio}
             textToSpeak={letterData.exampleWord}
             
             className="bg-[#FFF3D6] dark:bg-[#3A2F14] hover:bg-[#FFE7B3] active:scale-90 text-[#B8860B] dark:text-[#FFCE6B] border border-[#FFB300]/30 cursor-pointer shadow-sm"
           />
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={letterData.id}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-8xl font-black mb-6 mt-4 tracking-tight font-display select-none text-ink">
              {letterData.char.split(' ')[0]}
              <span className="text-3xl font-bold text-[#FFB300] mx-2">{letterData.char.split(' ')[1]}</span>
            </h2>
            
            <div className="bg-[#FFF6E0] dark:bg-[#3A2F14] border border-[#FFB300]/30 p-5 rounded-2xl w-full max-w-xs transition-colors duration-300">
              <p className="text-2xl font-black text-ink mb-1"><bdi>{letterData.exampleWord}</bdi></p>
              <p className="text-xs font-bold text-muted tracking-wider uppercase"><bdi>{language === 'ar' ? letterData.meaningAr : letterData.meaningEn}</bdi></p>
            </div>

            {/* PHASE 2: lightweight inline self-check for the focused letter.
                Feeds the existing SM-2 reviewDeck — the same deck the alphabet
                quiz records into — so Hub progress stays honest. */}
            <RecallButton wordId={letterData.id} size="block" className="mt-4" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Grid of all letters */}
      <div className="flex items-center justify-between mb-3 px-1 mt-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t(language, 'alphabet')}</h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">{alphabet.length} Chars</span>
      </div>

      <div className="pb-4">
        <div className="grid grid-cols-4 gap-2">
          {alphabet.map((letter, index) => {
            const isSelected = selectedLetter === letter.id;
            const isPlaying = playingId === letter.id;
            return (
              <motion.button
                key={letter.id}
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.015, duration: 0.3 }}
                onClick={() => {
                  setSelectedLetter(letter.id);
                  handlePlayAudio(letter.id, letter.charAudio);
                }}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-xl transition-all relative cursor-pointer select-none
                  ${isSelected ? 'bg-[#FFF6E0] dark:bg-[#3A2F14] border-2 border-[#FFB300] text-[#8A6100] dark:text-[#FFCE6B] shadow-md scale-105' : 'bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#FFB300]/50 hover:bg-[#FFF6E0]/40 shadow-[0_8px_30px_rgba(0,0,0,0.015)]'}
                  ${isPlaying ? 'animate-pulse bg-[#FFB300] text-[#432C00] shadow-lg border-transparent' : ''}
                `}
              >
                {isPlaying && (
                   <span className="absolute top-1.5 end-1.5">
                     <Volume2 className="w-3.5 h-3.5 opacity-90 text-[#432C00]" />
                   </span>
                )}
                <span className="font-mono">{letter.char.split(' ')[0]}</span>
                <span className={`text-[9px] font-bold mt-1 tracking-wider uppercase scale-90 ${isPlaying ? 'text-[#432C00]/80' : isSelected ? 'text-[#B8860B] dark:text-[#FFCE6B]' : 'text-slate-400'}`}>
                  {letter.type === 'vowel' ? t(language, 'vowel') : t(language, 'consonant')}
                </span>
              </motion.button>
            );
          })}
        </div>
        
        <div className="py-6 flex justify-center">
          <motion.button 
             whileTap={{ scale: 0.98 }}
             onClick={() => navigate('/quiz/alphabet')}
             className="bg-indigo-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-md hover:shadow-lg hover:bg-indigo-700 transition-all text-base w-full justify-center flex items-center gap-3 cursor-pointer"
          >
            <span>{t(language, 'practice')}</span>
            <Play className="w-4 h-4 fill-current rtl:-scale-x-100" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

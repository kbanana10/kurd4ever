import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { academicVocabulary, AcademicLevel } from '../data/academic';
import { vocabulary } from '../data/kurmanji';
import { AudioButton } from '../components/AudioButton';
import { Heart, Search } from 'lucide-react';
import { t, tLevel } from '../lib/translations';

export function Favorites() {
  const navigate = useNavigate();
  const { language } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [search, setSearch] = useState('');

  // Combine words and academic terms that are favorited
  const allWords = [
    ...academicVocabulary.filter(Boolean).map(w => ({ ...w, type: 'academic' as const })),
    // SAFETY: core vocabulary is beginner material by definition; 'beginner' is a member of AcademicLevel.
    ...vocabulary.filter(Boolean).map(w => ({ ...w, type: 'vocab' as const, level: 'beginner' as AcademicLevel }))
  ];

  const favWords = allWords.filter(w => w && w.id && isFavorite(w.id));

  const words = favWords.filter(w => {
    const ku = w?.ku || '';
    const en = w?.en || '';
    const ar = w?.ar || '';
    const matchesSearch = 
      ku.toLowerCase().includes(search.toLowerCase()) || 
      en.toLowerCase().includes(search.toLowerCase()) || 
      ar.includes(search);
    return matchesSearch;
  });

  return (
    <div className="p-4 space-y-4 flex flex-col">
      <div className="bg-rose-50 dark:bg-rose-950/20 rounded-3xl p-6 shadow-sm border border-rose-100 dark:border-rose-900/40 flex items-center gap-4 mb-4">
        <span className="text-4xl text-rose-500"><Heart className="w-10 h-10 fill-current" /></span>
        <div>
          <h2 className="text-2xl font-bold text-rose-900 dark:text-rose-200">{t(language, 'favorites')}</h2>
          <p className="text-rose-700 dark:text-rose-400 font-medium">{favWords.length} {t(language, 'words')}</p>
        </div>
      </div>

      {favWords.length > 0 && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)] focus:border-rose-300 focus:outline-none transition-colors ps-10 pe-4 text-slate-800 dark:text-slate-100 text-xs font-semibold"
              placeholder={t(language, 'search_terms')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {words.map((word) => (
          <div key={word.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.025)] border border-slate-200 border-s-4 border-s-rose-500 dark:border-slate-800 flex flex-col gap-3 group relative">
             
             <div className="flex items-center justify-between gap-4">
               <div className="flex-1 text-start">
                 <div className="flex justify-between items-start">
                   <h3 className="text-left font-black text-slate-900 dark:text-white text-base" dir="ltr">{word.ku}</h3>
                   <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg uppercase tracking-wider ms-4">
                     {tLevel(language, word.level)}
                   </span>
                 </div>
                 <div className="flex gap-2 text-xs font-semibold mt-1">
                   <span className={`${language === 'en' || language === 'ku' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}><bdi>{word?.en || ''}</bdi></span>
                   <span className="text-slate-300 dark:text-slate-700">•</span>
                   <span className={`${language === 'ar' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}><bdi>{word?.ar || ''}</bdi></span>
                 </div>
               </div>
             </div>

             {('exampleKu' in word) && word.exampleKu && (
               <div className="bg-slate-50/75 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-start">
                 <p className="text-left font-extrabold text-slate-800 dark:text-slate-200 mb-1" dir="ltr">"{word.exampleKu}"</p>
                 <p className="text-slate-500 dark:text-slate-400 font-medium"><bdi>{language === 'ar' ? word.exampleAr : word.exampleEn}</bdi></p>
               </div>
             )}

             <div className="flex items-center justify-between mt-1">
               <button 
                 onPointerDown={(e) => {
                   e.preventDefault();
                   toggleFavorite(word.id);
                 }}
                 className={`p-2 rounded-full transition-colors cursor-pointer ${isFavorite(word.id) ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 hover:bg-slate-100'}`}
               >
                 <Heart className={`w-5 h-5 ${isFavorite(word.id) ? 'fill-current' : ''}`} />
               </button>
               <AudioButton audioUrl={word.audio} textToSpeak={word.ku} className="bg-rose-50 dark:bg-rose-950/45 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border-none" />
             </div>

          </div>
        ))}

        {favWords.length === 0 && (
          <div className="bg-white border-2 border-dashed border-rose-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 mt-8">
            <Heart className="w-16 h-16 text-rose-300 dark:text-rose-900/40" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t(language, 'no_results')}</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {language === 'ku'
                  ? 'Kategoriyên peyvan bigere û peyvên akademîk yan giştî li bijareyên xwe zêde bike!'
                  : language === 'ar'
                  ? 'تصفح تصنيفات المفردات وأضف المصطلحات إلى مفضلتك الشخصية!'
                  : 'Go explore vocabulary categories and add standard or academic items to your favorites!'}
              </p>
            </div>
            <button
               onClick={() => navigate('/vocabulary')}
               className="mt-4 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold px-6 py-3 rounded-2xl hover:bg-rose-200 transition-colors border-none cursor-pointer"
            >
              {language === 'ku' ? 'Peyvan Bibîne' : language === 'ar' ? 'استعراض المفردات' : 'Browse Vocabulary'}
            </button>
          </div>
        )}

        {words.length === 0 && favWords.length > 0 && (
          <div className="text-center p-8 text-slate-500 font-medium">
            {t(language, 'no_results')}
          </div>
        )}
      </div>
    </div>
  );
}

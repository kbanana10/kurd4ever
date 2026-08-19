import React, { useState } from 'react';
import { categories } from '../data/kurmanji';
import { academicCategories } from '../data/academic';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/translations';
import { motion } from 'motion/react';
import { 
  ArrowLeft, BookOpen, Sparkles,
  Binary, Palette, Cat, Apple, Users, Home, Calendar, 
  Backpack, Building2, School, Ruler, Laptop, Atom, 
  FlaskConical, Microscope, FileSpreadsheet, PenTool
} from 'lucide-react';

// Cycled functional tints — the grid reads as a colourful collectible set
const CATEGORY_TINTS = [
  { well: 'bg-[#FFF3D6] dark:bg-[#3A2F14]', icon: 'text-[#D97706]' },
  { well: 'bg-sky-100 dark:bg-sky-950/40', icon: 'text-sky-500' },
  { well: 'bg-emerald-100 dark:bg-emerald-950/40', icon: 'text-emerald-600' },
  { well: 'bg-rose-100 dark:bg-rose-950/40', icon: 'text-rose-500' },
  { well: 'bg-purple-100 dark:bg-purple-950/40', icon: 'text-purple-600' },
  { well: 'bg-orange-100 dark:bg-orange-950/40', icon: 'text-orange-500' },
];

const renderIcon = (iconName: string, colorClass?: string) => {
  const iconMap = {
    Binary, Palette, Cat, Apple, Users, Home, Calendar, 
    Backpack, Building2, School, Ruler, Laptop, Atom, 
    FlaskConical, Microscope, FileSpreadsheet, PenTool
  } satisfies Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return <IconComponent className={`w-7 h-7 ${colorClass || 'text-indigo-600 dark:text-indigo-400'}`} />;
  }
  return <span className="text-2xl">{iconName}</span>;
};

export function VocabularyCategories() {
  const navigate = useNavigate();
  const { language } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'academic'>('general');

  const currentCategories = activeTab === 'general' ? categories : academicCategories;

  return (
    <div className="p-4 space-y-6 min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 selection:bg-indigo-100">
      
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-200/20 dark:bg-indigo-950/20 rounded-full filter blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-5 w-60 h-60 bg-purple-200/15 dark:bg-purple-950/20 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* 1. Navigation & Header Bar */}
      <div className="flex items-center gap-3 py-2 max-w-md mx-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">
            {language !== 'ar' ? 'Vocabulary Hub' : 'القاموس والمفردات'}
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            {language !== 'ar' ? 'Word collections' : 'استعراض الحزم اللغوية'}
          </p>
        </div>
      </div>

      {/* 2. Elevated Brand Hero Card */}
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-flat border border-line-soft relative overflow-hidden group">
        <BookOpen className="absolute right-0 bottom-0 opacity-[0.06] w-40 h-40 transform translate-y-8 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-500" />
        
        <div className="space-y-2 relative z-10">
          <span className="text-[9px] bg-[#FFF6E0] dark:bg-[#3A2F14] text-[#8A6100] dark:text-[#FFCE6B] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB300] fill-[#FFB300]/40 animate-pulse" />
            {language !== 'ar' ? 'YOUR WORD TREASURY' : 'كنز كلماتك'}
          </span>
          <h3 className="text-xl font-black mt-2 leading-tight tracking-tight text-ink">
            {language !== 'ar' ? 'Expand Your Vocabulary' : 'ضاعف ثروتك اللغوية'}
          </h3>
          <p className="text-muted text-[11px] leading-relaxed font-semibold">
            {language !== 'ar' 
              ? 'Discover essential everyday words, core academic phrasing, and curated definitions designed for direct retention.' 
              : 'اكتشف الكلمات الكوردية الأساسية، والتصنيفات الدراسية والعبارات والمصطلحات الأكاديمية المصممة للحفظ السريع.'}
          </p>
        </div>
      </div>

      {/* 3. High fidelity Tabs Switcher */}
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-1 rounded-2xl flex gap-1 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 text-center py-2.5 min-h-[44px] rounded-xl text-xs font-black transition-all cursor-pointer relative border-none ${
            activeTab === 'general'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
          }`}
        >
          {language !== 'ar' ? 'General Words' : 'المفردات العامة'}
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`flex-1 text-center py-2.5 min-h-[44px] rounded-xl text-xs font-black transition-all cursor-pointer relative border-none ${
            activeTab === 'academic'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-600/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
          }`}
        >
          {language !== 'ar' ? 'Academic Terms' : 'المصطلحات الأكاديمية'}
        </button>
      </div>

      {/* 4. Elegant categories grid */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pb-6">
        {currentCategories.map((cat, index) => {
          // Resolve standard category naming format
          const nameLabel = 'name' in cat ? cat.name : cat.nameEn;
          const nameArLabel = 'ar' in cat ? cat.ar : cat.nameAr;
          const displayTitle = language !== 'ar' ? nameLabel : (nameArLabel || nameLabel);
          
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
              onClick={() => navigate(`/vocabulary/${cat.id}`)}
              className="bg-white dark:bg-slate-900 border text-start border-slate-200/85 dark:border-slate-800/80 rounded-[28px] p-5 flex flex-col items-center justify-center gap-3 hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-md hover:scale-[1.015] transition-all active:scale-95 group cursor-pointer relative overflow-hidden min-h-[145px] shadow-[0_8px_30px_rgba(0,0,0,0.025)]"
            >
              {/* Dynamic decorative absolute line */}
              <div className={`absolute top-0 inset-x-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r ${
                activeTab === 'general' ? 'from-indigo-500 to-indigo-600' : 'from-purple-500 to-purple-600'
              }`} />

              <div className={`w-14 h-14 ${CATEGORY_TINTS[index % CATEGORY_TINTS.length].well} flex items-center justify-center rounded-full group-hover:scale-105 transition-all relative`}>
                <span className="group-hover:scale-105 transition-transform">{renderIcon(cat.icon, CATEGORY_TINTS[index % CATEGORY_TINTS.length].icon)}</span>
              </div>
              <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs text-center leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors px-1 w-full">
                {displayTitle}
              </div>
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}

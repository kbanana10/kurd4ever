import React, { useState, useMemo, useEffect } from 'react';

/** Rows rendered per page in the dictionary list. */
const PAGE_SIZE = 25;
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { searchVocabulary } from '../data/adapters/contentAdapter';
import { VocabularyLemma } from '../data/schemas/contentSchemas';
import { AudioButton } from '../components/AudioButton';
import { 
  Search as SearchIcon, Heart, Clock, X, Briefcase, Zap, Compass, Apple, Flame, Users, BookOpen, GraduationCap, 
  Laptop, Palette, Lightbulb, Trophy, Sparkles, Star, Settings, Key, Globe, Network, HardDrive, Cpu, Database, Binary, 
  Info, CircleDot, RefreshCw, Layers, ShieldCheck, Microscope, FlaskConical, Atom, Scissors, Trash2, Volume2, UserCheck, 
  Clipboard, Calendar, Smile, HelpCircle, Eye, Bug, Dna, Eraser, Ruler, ClipboardList, PenTool, Lock, Folder, Printer, 
  Terminal, Mail, ShieldAlert, Keyboard, MousePointer, Workflow, Sun, Presentation, CheckSquare, Check, ArrowDown, 
  Activity, Wind, Droplet, Box, Grid, Scale, TrendingUp, Armchair, Plus, Minus, LucideIcon, Percent, User, Table, Coffee, 
  Dog, Cat, Bird, Fish, Home, Bell, Backpack, Calculator, Library, Award, FileText, Layout, Code, Brain, Map as MapIcon
} from 'lucide-react';


const getWordIcon = (item: any, className = "w-5 h-5 text-indigo-600 dark:text-indigo-400") => {
  if (!item) return React.createElement(Sparkles, { className });

  const lowerEn = (item.translations?.en || item.en || '').toLowerCase().trim();
  const id = item.id || '';
  const emoji = item.media?.emoji || item.emoji || '';

  // 1. Numbers (Render beautiful numeric digits)
  const isNumberCategory = id.startsWith('n') || (item.categoryId === 'numbers');
  if (isNumberCategory) {
    let numStr = "";
    if (id === 'n0' || lowerEn === 'zero') numStr = "0";
    else if (id === 'n1' || lowerEn === 'one') numStr = "1";
    else if (id === 'n2' || lowerEn === 'two') numStr = "2";
    else if (id === 'n3' || lowerEn === 'three') numStr = "3";
    else if (id === 'n4' || lowerEn === 'four') numStr = "4";
    else if (id === 'n5' || lowerEn === 'five') numStr = "5";
    else if (id === 'n6' || lowerEn === 'six') numStr = "6";
    else if (id === 'n7' || lowerEn === 'seven') numStr = "7";
    else if (id === 'n8' || lowerEn === 'eight') numStr = "8";
    else if (id === 'n9' || lowerEn === 'nine') numStr = "9";
    else if (id === 'n10' || lowerEn === 'ten') numStr = "10";
    else if (id === 'n20' || lowerEn === 'twenty') numStr = "20";
    else if (id === 'n30' || lowerEn === 'thirty') numStr = "30";
    else if (id === 'n40' || lowerEn === 'forty') numStr = "40";
    else if (id === 'n50' || lowerEn === 'fifty') numStr = "50";
    else if (id === 'n60' || lowerEn === 'sixty') numStr = "60";
    else if (id === 'n70' || lowerEn === 'seventy') numStr = "70";
    else if (id === 'n80' || lowerEn === 'eighty') numStr = "80";
    else if (id === 'n90' || lowerEn === 'ninety') numStr = "90";
    else if (id === 'n100' || lowerEn === 'one hundred' || lowerEn === 'hundred') numStr = "100";
    else if (id === 'n200') numStr = "200";
    else if (id === 'n300') numStr = "300";
    else if (id === 'n500') numStr = "500";
    else if (id === 'n1000' || lowerEn === 'thousand') numStr = "1K";
    else if (id === 'n1000000' || lowerEn === 'million') numStr = "1M";
    else if (id === 'n1000000000' || lowerEn === 'billion') numStr = "1B";
    else {
      const match = lowerEn.match(/\d+/);
      numStr = match ? match[0] : "#";
    }

    return (
      <span className="text-xs font-black tracking-tighter text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
        {numStr}
      </span>
    );
  }

  // 2. Colors (Render color swatches)
  const isColorCategory = id.startsWith('c') && !id.startsWith('co') && !id.startsWith('cl') && !id.startsWith('ch');
  if (isColorCategory) {
    const colorClasses = {
      'red': 'bg-red-500 border-red-600',
      'blue': 'bg-blue-500 border-blue-600',
      'green': 'bg-emerald-500 border-emerald-600',
      'yellow': 'bg-amber-400 border-amber-500',
      'black': 'bg-slate-950 border-slate-900',
      'white': 'bg-white border-slate-300 dark:border-slate-700',
      'grey': 'bg-slate-400 border-slate-500',
      'gray': 'bg-slate-400 border-slate-500',
      'brown': 'bg-amber-800 border-amber-900',
      'pink': 'bg-pink-400 border-pink-500',
      'purple': 'bg-purple-600 border-purple-700',
      'orange': 'bg-orange-500 border-orange-600'
    } satisfies Record<string, string>;
    const swatchClass = colorClasses[lowerEn] || 'bg-gradient-to-br from-indigo-500 to-purple-500';
    return (
      <span className={`w-5 h-5 rounded-full border shadow-sm shrink-0 ${swatchClass}`} />
    );
  }

  // Helper mapping function to return React components
  const getIconComp = () => {
    // 3. Animals
    if (lowerEn === 'dog') return Dog;
    if (lowerEn === 'cat') return Cat;
    if (lowerEn === 'bird') return Bird;
    if (lowerEn === 'fish') return Fish;
    if (lowerEn.includes('bee') || lowerEn.includes('ant') || lowerEn.includes('butterfly') || lowerEn.includes('fly') || lowerEn.includes('mosquito') || lowerEn.includes('spider')) return Bug;

    // 4. Food & Drinks
    if (lowerEn === 'coffee' || lowerEn === 'tea' || lowerEn === 'milk' || lowerEn === 'water') return Coffee;

    // 5. Family & People
    if (lowerEn.includes('family') || lowerEn.includes('mother') || lowerEn.includes('father') || lowerEn.includes('brother') || lowerEn.includes('sister') || lowerEn.includes('son') || lowerEn.includes('daughter')) return Users;

    // 6. Home & Furniture
    if (lowerEn.includes('house') || lowerEn.includes('home') || lowerEn.includes('room')) return Home;

    // 7. Time & Calendar
    if (lowerEn.includes('time') || lowerEn.includes('clock') || lowerEn.includes('day') || lowerEn.includes('year') || lowerEn.includes('month') || lowerEn.includes('week')) return Clock;

    // 8. Academic
    if (lowerEn === 'book' || lowerEn === 'textbook' || lowerEn === 'dictionary' || lowerEn.includes('pirtûk')) return BookOpen;
    if (lowerEn === 'pen' || lowerEn === 'pencil' || lowerEn === 'marker pen' || lowerEn === 'marker') return PenTool;
    if (lowerEn === 'notebook' || lowerEn === 'syllabus' || lowerEn === 'curriculum') return ClipboardList;
    if (lowerEn === 'school bag' || lowerEn === 'bag') return Backpack;
    if (lowerEn === 'eraser' || lowerEn === 'board eraser' || lowerEn === 'duster') return Eraser;
    if (lowerEn === 'ruler') return Ruler;
    if (lowerEn === 'scissors') return Scissors;
    if (lowerEn === 'calculator') return Calculator;
    if (lowerEn === 'library') return Library;
    if (lowerEn === 'compass' || lowerEn === 'compass (drawing)') return Compass;
    if (lowerEn === 'key') return Key;

    // Academic: University Terms
    if (lowerEn === 'university' || lowerEn === 'college' || lowerEn === 'faculty' || lowerEn.includes('degree') || lowerEn.includes('doctorate') || lowerEn.includes('phd') || lowerEn.includes('bachelor') || lowerEn.includes('master')) return GraduationCap;
    if (lowerEn.includes('professor') || lowerEn.includes('teacher') || lowerEn.includes('instructor')) return UserCheck;
    if (lowerEn.includes('student') || lowerEn.includes('learner') || lowerEn.includes('group study')) return Users;
    if (lowerEn.includes('regulation') || lowerEn.includes('rule') || lowerEn.includes('plagiarism')) return ShieldCheck;
    if (lowerEn.includes('scholarship') || lowerEn.includes('award') || lowerEn.includes('grade') || lowerEn.includes('score')) return Award;
    if (lowerEn === 'internship' || lowerEn === 'job' || lowerEn === 'work' || lowerEn === 'department') return Briefcase;
    if (lowerEn.includes('research') || lowerEn.includes('study')) return SearchIcon;
    if (lowerEn.includes('thesis') || lowerEn.includes('dissertation') || lowerEn.includes('essay') || lowerEn.includes('article') || lowerEn.includes('file') || lowerEn.includes('document')) return FileText;

    // Classroom
    if (lowerEn === 'bell') return Bell;
    if (lowerEn === 'whiteboard' || lowerEn === 'board') return Presentation;
    if (lowerEn === 'desk' || lowerEn === 'table') return Table;
    if (lowerEn === 'chair') return Armchair;
    if (lowerEn === 'window' || lowerEn === 'door') return Layout;
    if (lowerEn === 'map') return MapIcon;
    if (lowerEn === 'light' || lowerEn === 'lamp') return Lightbulb;
    if (lowerEn.includes('computer') || lowerEn === 'monitor' || lowerEn === 'screen' || lowerEn === 'projector') return Laptop;

    // Mathematics
    if (lowerEn === 'mathematics' || lowerEn === 'math' || lowerEn === 'algebra' || lowerEn === 'calculus' || lowerEn === 'statistics' || lowerEn === 'number') return Calculator;
    if (lowerEn === 'addition') return Plus;
    if (lowerEn === 'subtraction') return Minus;
    if (lowerEn === 'multiplication') return X;
    if (lowerEn === 'division' || lowerEn === 'percentage') return Percent;
    if (lowerEn === 'circle' || lowerEn === 'square' || lowerEn === 'triangle' || lowerEn === 'line' || lowerEn === 'angle') return Ruler;
    if (lowerEn.includes('power') || lowerEn.includes('exponent')) return Zap;
    if (lowerEn === 'equation' || lowerEn === 'function' || lowerEn === 'integral' || lowerEn === 'root') return Activity;

    // Computer Science
    if (lowerEn === 'software' || lowerEn === 'code' || lowerEn === 'program' || lowerEn === 'application' || lowerEn === 'website') return Code;
    if (lowerEn === 'hardware' || lowerEn === 'cpu' || lowerEn.includes('operating system') || lowerEn === 'system') return Cpu;
    if (lowerEn === 'network' || lowerEn === 'internet') return Network;
    if (lowerEn === 'data' || lowerEn === 'database') return Database;
    if (lowerEn === 'password') return Lock;
    if (lowerEn === 'folder') return Folder;
    if (lowerEn === 'print') return Printer;
    if (lowerEn === 'developer') return Terminal;
    if (lowerEn === 'email') return Mail;
    if (lowerEn === 'virus') return ShieldAlert;
    if (lowerEn === 'keyboard') return Keyboard;
    if (lowerEn === 'mouse') return MousePointer;
    if (lowerEn === 'algorithm') return Workflow;

    // Physics
    if (lowerEn === 'physics' || lowerEn === 'atom' || lowerEn === 'molecule') return Atom;
    if (lowerEn === 'force' || lowerEn === 'energy' || lowerEn === 'electricity' || lowerEn === 'electric power') return Zap;
    if (lowerEn === 'mass' || lowerEn === 'weight') return Scale;
    if (lowerEn === 'speed' || lowerEn === 'velocity' || lowerEn === 'rotation' || lowerEn === 'friction' || lowerEn.includes('force')) return TrendingUp;
    if (lowerEn === 'light' || lowerEn === 'temperature' || lowerEn === 'thermometer' || lowerEn === 'chemical thermometer') return Lightbulb;
    if (lowerEn === 'sound' || lowerEn === 'wave') return Volume2;
    if (lowerEn === 'magnet') return Compass;
    if (lowerEn === 'gravity') return ArrowDown;
    if (lowerEn === 'air resistance') return Wind;
    if (lowerEn === 'barometer' || lowerEn === 'voltmeter' || lowerEn === 'ammeter' || lowerEn.includes('meter')) return Activity;

    // Chemistry
    if (lowerEn === 'chemistry' || lowerEn === 'chemist' || lowerEn === 'laboratory' || lowerEn.includes('test tube') || lowerEn === 'beaker' || lowerEn === 'tube') return FlaskConical;
    if (lowerEn === 'gas') return Wind;
    if (lowerEn === 'liquid' || lowerEn === 'dissolution') return Droplet;
    if (lowerEn === 'solid') return Box;
    if (lowerEn === 'element' || lowerEn === 'periodic table') return Grid;
    if (lowerEn === 'compound' || lowerEn === 'reaction' || lowerEn === 'acid' || lowerEn === 'base' || lowerEn === 'alkali' || lowerEn === 'catalyst' || lowerEn === 'chemical bond' || lowerEn === 'bond') return Flame;
    if (lowerEn === 'electron' || lowerEn === 'proton' || lowerEn === 'neutron' || lowerEn === 'nucleus') return Atom;

    // Biology
    if (lowerEn === 'biology' || lowerEn === 'biologist' || lowerEn === 'microscope') return Microscope;
    if (lowerEn === 'organism' || lowerEn === 'bacteria' || lowerEn === 'virus (biological)' || lowerEn === 'microbe' || lowerEn.includes('microorganism')) return Bug;
    if (lowerEn === 'cell' || lowerEn === 'dna' || lowerEn === 'gene' || lowerEn === 'genetics') return Dna;
    if (lowerEn === 'medicine' || lowerEn === 'drug' || lowerEn === 'vaccine' || lowerEn === 'health' || lowerEn === 'disease') return Heart;
    if (lowerEn === 'blood' || lowerEn === 'heart' || lowerEn === 'organ' || lowerEn.includes('system') || lowerEn === 'nutrients') return Heart;
    if (lowerEn === 'brain' || lowerEn.includes('nervous')) return Brain;
    if (lowerEn === 'body' || lowerEn === 'skin' || lowerEn === 'muscle' || lowerEn === 'bone') return User;
    if (lowerEn === 'eye') return Eye;
    if (lowerEn === 'ear' || lowerEn === 'mouth' || lowerEn === 'tooth' || lowerEn === 'tongue') return Smile;
    if (lowerEn === 'sun' || lowerEn === 'photosynthesis') return Sun;
    if (lowerEn === 'ecosystem') return Globe;

    // Exams
    if (lowerEn === 'exam' || lowerEn === 'homework' || lowerEn === 'syllabus') return ClipboardList;
    if (lowerEn === 'question') return HelpCircle;
    if (lowerEn === 'answer') return CheckSquare;
    if (lowerEn.includes('admission') || lowerEn.includes('acceptance')) return UserCheck;

    // Actions
    if (lowerEn.startsWith('to read') || lowerEn.startsWith('to study')) return BookOpen;
    if (lowerEn.startsWith('to write') || lowerEn.startsWith('to draw')) return PenTool;
    if (lowerEn.startsWith('to learn')) return GraduationCap;
    if (lowerEn.startsWith('to speak') || lowerEn.startsWith('to listen') || lowerEn.startsWith('to talk')) return Volume2;
    if (lowerEn.startsWith('to understand') || lowerEn.startsWith('to memorize')) return Brain;
    if (lowerEn.startsWith('to ask')) return HelpCircle;
    if (lowerEn.startsWith('to answer')) return CheckSquare;
    if (lowerEn.startsWith('to see') || lowerEn.startsWith('to watch')) return Eye;
    if (lowerEn.startsWith('to choose') || lowerEn.startsWith('to solve') || lowerEn.startsWith('to correct')) return Check;
    if (lowerEn.startsWith('to analyze') || lowerEn.startsWith('to research')) return SearchIcon;
    if (lowerEn.startsWith('to collect') || lowerEn.startsWith('to organize')) return Folder;
    if (lowerEn.startsWith('to show') || lowerEn.startsWith('to present')) return Presentation;
    if (lowerEn.startsWith('to update') || lowerEn.startsWith('to compare')) return RefreshCw;

    // Fallbacks from emoji string
    const emojiMap = {
      '📄': Briefcase,
      '🔧': Briefcase,
      '🔟': Zap,
      '💧': Compass,
      '🍞': Apple,
      '🍎': Apple,
      '🥛': Apple,
      '☕': Flame,
      '👨': Users,
      '👩': Users,
      '👧': Users,
      '👦': Users,
      '📚': BookOpen,
      '🏛️': GraduationCap,
      '👨‍🏫': GraduationCap,
      '💻': Laptop,
      '🍽️': Apple,
      '📖': BookOpen,
      '✍️': Palette,
      '🏃': Flame,
      '💡': Lightbulb,
      '🏆': Trophy,
    } satisfies Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = emojiMap[emoji];
    return IconComponent || Sparkles;
  };

  const ResolvedIcon = getIconComp();
  return React.createElement(ResolvedIcon, { className });
};

export function Search() {
  const navigate = useNavigate();
  const { language, userData, updateUserData } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeCefr, setActiveCefr] = useState<string>('All');
  const [activePartOfSpeech, setActivePartOfSpeech] = useState<string>('All');

  useEffect(() => {
    if (userData?.recentSearches) {
      setRecentSearches(userData.recentSearches.slice(0, 5));
    }
  }, [userData?.recentSearches]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    if (updateUserData) {
      updateUserData({ recentSearches: newRecent });
    }
  };

  /**
   * AUDIT FIX: previously this rendered the *entire* 450-item catalogue on
   * mount — 11,500 DOM nodes, 807 buttons and 1,179 inline SVGs, ~10x heavier
   * than any other screen and the worst jank in the app on mid-range Android.
   * We now (a) debounce the query, (b) hard-cap the rendered page, and
   * (c) show a "load more" affordance instead of dumping everything.
   */
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(id);
  }, [query]);

  // Reset paging whenever the active filter set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, activeCefr, activePartOfSpeech]);

  const allResults: VocabularyLemma[] = useMemo(() => {
    return searchVocabulary({
      query: debouncedQuery,
      cefrLevel: activeCefr,
      partOfSpeech: activePartOfSpeech
    });
  }, [debouncedQuery, activeCefr, activePartOfSpeech]);

  const results = useMemo(
    () => allResults.slice(0, visibleCount),
    [allResults, visibleCount]
  );
  const hasMore = allResults.length > results.length;

  return (
    <div className="p-4 space-y-4 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 font-sans leading-relaxed">
      
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            {language !== 'ar' ? 'Ferheng — the Dictionary' : 'فەرهەنگ — القاموس'}
          </h2>
          <p className="text-xs text-slate-400">
            {language !== 'ar' ? 'Every Kurmanji word — with sound, level and examples' : 'كل كلمة كورمانجية — بالنطق والمستوى والأمثلة'}
          </p>
        </div>
      </div>

      {/* Sticky Search Panel Input */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3.5">
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-50 border-2 border-slate-100 dark:bg-slate-950 dark:border-slate-800 rounded-2xl py-3.5 shadow-sm focus:border-indigo-400 focus:outline-none focus:bg-white transition-all ps-11 pe-11 font-bold text-slate-800 dark:text-white"
            placeholder={language !== 'ar' ? 'Try “av”, “water” or “ماء”…' : 'جرّب «av» أو «ماء»…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRecentSearch(query);
            }}
          />
          {query && (
            <button 
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="space-y-2 pt-1">
          {/* CEFR Level filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none" dir="ltr">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 me-1">CEFR:</span>
            {['All', 'A1', 'A2', 'B1', 'B2'].map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveCefr(lvl)}
                className={`relative after:absolute after:-inset-y-2 after:-inset-x-1.5 after:content-[''] px-3 py-2 rounded-xl text-[11px] font-black cursor-pointer transition-all border-none ${
                  activeCefr === lvl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Part of Speech filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none" dir="ltr">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 me-1">POS:</span>
            {[
              { id: 'All', name: 'All' },
              { id: 'noun', name: 'Nouns' },
              { id: 'verb', name: 'Verbs' },
              { id: 'numeral', name: 'Numbers' },
              { id: 'adjective', name: 'Adjectives' }
            ].map(pos => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setActivePartOfSpeech(pos.id)}
                className={`relative after:absolute after:-inset-y-2 after:-inset-x-1.5 after:content-[''] px-2.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all border-none ${
                  activePartOfSpeech === pos.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {pos.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Results area */}
      <div className="flex-1 space-y-4">
        
        {/* Recent Searches & Landing instructions when query is empty */}
        {!query.trim() && activeCefr === 'All' && activePartOfSpeech === 'All' && (
          <div className="space-y-6 pt-2">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5 px-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {language === 'ku' ? 'Lêgerînên Dawî' : language !== 'ar' ? 'Recent Queries' : 'عمليات البحث الأخيرة'}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="relative after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 animate-pulse">
                <SearchIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                {language === 'ku' ? 'Li ferhengê bigere' : language !== 'ar' ? 'Search the ferheng' : 'ابحث في القاموس'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {language === 'ku'
                  ? 'Ji bo dîtina peyvan, her peyvek bi Kurmancî, Îngilîzî yan Erebî binivîse.'
                  : language !== 'ar'
                  ? 'Type a word in Kurmanji, English or Arabic — its sound, level and examples appear here.'
                  : 'اكتب أي كلمة بالكورمانجية أو معناها بالعربية والإنجليزية للبحث في كافة القاموس.'}
              </p>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3">
          {results.map((item) => {
            const isFav = isFavorite(item.id);
            return (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  {/* R-04: min-w-0 chain + wrapping chips — the fixed-width
                      lemma row used to push the favorite button past the
                      card edge at <=360px (17px clipped at 320). */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-800/80 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                      {getWordIcon(item)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white font-mono" dir="ltr">
                          {item.lemmaKu}
                        </h4>
                        {item.ipa && (
                          <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/60">
                            {item.ipa}
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.cefrLevel}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                        <bdi>{language !== 'ar' ? item.translations.en : item.translations.ar}</bdi>
                        {item.translations.en !== item.translations.ar && (
                          <span className="text-slate-400 ms-2 font-normal">
                            {/* BiDi AUDIT FIX: the secondary gloss is opposite-script
                                (Arabic inside LTR UIs, English inside the RTL UI).
                                Without isolation the parentheses flipped sides and the
                                run reordered around them. <bdi> keeps the whole
                                "(gloss)" group a sealed directional island. */}
                            <bdi>({language !== 'ar' ? item.translations.ar : item.translations.en})</bdi>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.media.audioUrl && (
                      <AudioButton audioUrl={item.media.audioUrl} textToSpeak={item.lemmaKu} />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.id)}
                      aria-label={language !== 'ar' ? (isFav ? 'Remove from favorites' : 'Add to favorites') : (isFav ? 'إزالة من المفضلة' : 'أضف إلى المفضلة')}
                      aria-pressed={isFav}
                      className={`p-3 rounded-xl border-none cursor-pointer transition-all ${
                        isFav 
                          ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40' 
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Example sentence if present */}
                {item.examples.length > 0 && (
                  <div className="mt-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5" dir="ltr">
                      "{item.examples[0].sentenceKu}"
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language !== 'ar' ? item.examples[0].translations.en : item.examples[0].translations.ar}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm hover:border-indigo-300 active:scale-[0.99] transition-all cursor-pointer"
            >
              {language !== 'ar'
                ? `Show more (${allResults.length - results.length} remaining)`
                : `عرض المزيد (${allResults.length - results.length} متبقية)`}
            </button>
          )}

          {results.length === 0 && (query.trim() || activeCefr !== 'All' || activePartOfSpeech !== 'All') && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {language !== 'ar' ? 'No words match your search — try a shorter spelling.' : 'لا توجد كلمات مطابقة — جرّب كتابة أقصر.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

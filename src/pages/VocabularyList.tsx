import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { vocabulary, categories } from '../data/kurmanji';
import { PracticeWord } from '../models/word';
import { academicVocabulary, academicCategories, AcademicLevel } from '../data/academic';
import { 
  Play, Heart, Search, ArrowLeft, BookOpen, Sparkles, Filter, Briefcase, Zap, Compass, Apple, Flame, Users, GraduationCap, 
  Laptop, Palette, Lightbulb, Trophy, Star, Settings, Key, Globe, Network, HardDrive, Cpu, Database, Binary, Info, CircleDot, 
  RefreshCw, Layers, ShieldCheck, Microscope, FlaskConical, Atom, Scissors, Trash2, Volume2, UserCheck, Clipboard, Calendar, 
  Clock, Smile, HelpCircle, Eye, Bug, Dna, Eraser, Ruler, ClipboardList, PenTool, Lock, Folder, Printer, Terminal, Mail, 
  ShieldAlert, Keyboard, MousePointer, Workflow, Sun, Presentation, CheckSquare, Check, ArrowDown, Activity, Wind, Droplet, 
  Box, Grid, Scale, TrendingUp, Armchair, Plus, Minus, X, Percent, User, Table, Coffee, Dog, Cat, Bird, Fish, Home, Bell,
  Backpack, Calculator, Library, Award, FileText, Layout, Code, Brain, Map as MapIcon,
  Building2, School, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t, tLevel } from '../lib/translations';
import { AudioButton } from '../components/AudioButton';
import { useFavorites } from '../hooks/useFavorites';
import { AdBanner } from '../features/monetization/components/AdElements';
import { motion, AnimatePresence } from 'motion/react';

const getWordIcon = (word: any, className = "w-6 h-6 text-indigo-600 dark:text-indigo-400") => {
  if (!word) return <Sparkles className={className} />;
  
  const lowerEn = (word.en || '').toLowerCase().trim();
  const id = word.id || '';
  const emoji = word.emoji || '';

  // 1. Numbers Category (Render beautiful numeric digits)
  if (word.categoryId === 'numbers' || id.startsWith('n')) {
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

  // 2. Colors Category (Render beautiful circular color swatches)
  if (word.categoryId === 'colors') {
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

  // 3. Animals & Insects
  if (lowerEn === 'dog') return <Dog className={className} />;
  if (lowerEn === 'cat') return <Cat className={className} />;
  if (lowerEn === 'bird') return <Bird className={className} />;
  if (lowerEn === 'fish') return <Fish className={className} />;
  if (lowerEn.includes('bee') || lowerEn.includes('ant') || lowerEn.includes('butterfly') || lowerEn.includes('fly') || lowerEn.includes('mosquito') || lowerEn.includes('spider') || word.categoryId === 'animals' && word.subCategoryId === 'insects') {
    return <Bug className={className} />;
  }
  if (word.categoryId === 'animals') {
    return <Sparkles className={className} />;
  }

  // 4. Food & Drinks & Fruits
  if (lowerEn === 'coffee' || lowerEn === 'tea' || lowerEn === 'milk' || lowerEn === 'water') return <Coffee className={className} />;
  if (word.categoryId === 'food') return <Apple className={className} />;

  // 5. Family
  if (word.categoryId === 'family') return <Users className={className} />;

  // 6. Home & Furniture
  if (word.categoryId === 'home') return <Home className={className} />;

  // 7. Time & Days
  if (word.categoryId === 'time') return <Clock className={className} />;

  // 8. Academic: School Objects
  if (lowerEn === 'book' || lowerEn === 'textbook' || lowerEn === 'dictionary' || lowerEn.includes('pirtûk')) return <BookOpen className={className} />;
  if (lowerEn === 'pen' || lowerEn === 'pencil' || lowerEn === 'marker pen' || lowerEn === 'marker') return <PenTool className={className} />;
  if (lowerEn === 'notebook' || lowerEn === 'syllabus' || lowerEn === 'curriculum') return <ClipboardList className={className} />;
  if (lowerEn === 'school bag' || lowerEn === 'bag') return <Backpack className={className} />;
  if (lowerEn === 'eraser' || lowerEn === 'board eraser' || lowerEn === 'duster') return <Eraser className={className} />;
  if (lowerEn === 'ruler') return <Ruler className={className} />;
  if (lowerEn === 'scissors') return <Scissors className={className} />;
  if (lowerEn === 'calculator') return <Calculator className={className} />;
  if (lowerEn === 'library') return <Library className={className} />;
  if (lowerEn === 'compass' || lowerEn === 'compass (drawing)') return <Compass className={className} />;
  if (lowerEn === 'key') return <Key className={className} />;

  // 9. Academic: University Terms
  if (lowerEn === 'university' || lowerEn === 'college' || lowerEn === 'faculty' || lowerEn.includes('degree') || lowerEn.includes('doctorate') || lowerEn.includes('phd') || lowerEn.includes('bachelor') || lowerEn.includes('master')) return <GraduationCap className={className} />;
  if (lowerEn.includes('professor') || lowerEn.includes('teacher') || lowerEn.includes('instructor')) return <UserCheck className={className} />;
  if (lowerEn.includes('student') || lowerEn.includes('learner') || lowerEn.includes('group study')) return <Users className={className} />;
  if (lowerEn.includes('regulation') || lowerEn.includes('rule') || lowerEn.includes('plagiarism')) return <ShieldCheck className={className} />;
  if (lowerEn.includes('scholarship') || lowerEn.includes('award') || lowerEn.includes('grade') || lowerEn.includes('score')) return <Award className={className} />;
  if (lowerEn === 'internship' || lowerEn === 'job' || lowerEn === 'work' || lowerEn === 'department') return <Briefcase className={className} />;
  if (lowerEn.includes('research') || lowerEn.includes('study')) return <Search className={className} />;
  if (lowerEn.includes('thesis') || lowerEn.includes('dissertation') || lowerEn.includes('essay') || lowerEn.includes('article') || lowerEn.includes('file') || lowerEn.includes('document')) return <FileText className={className} />;

  // 10. Academic: Classroom
  if (lowerEn === 'bell') return <Bell className={className} />;
  if (lowerEn === 'whiteboard' || lowerEn === 'board') return <Presentation className={className} />;
  if (lowerEn === 'desk' || lowerEn === 'table') return <Table className={className} />;
  if (lowerEn === 'chair') return <Armchair className={className} />;
  if (lowerEn === 'window' || lowerEn === 'door') return <Layout className={className} />;
  if (lowerEn === 'clock' || lowerEn === 'hour' || lowerEn === 'time' || lowerEn.includes('semester') || lowerEn.includes('credit')) return <Clock className={className} />;
  if (lowerEn === 'map') return <MapIcon className={className} />;
  if (lowerEn === 'light' || lowerEn === 'lamp') return <Lightbulb className={className} />;
  if (lowerEn.includes('computer') || lowerEn === 'monitor' || lowerEn === 'screen' || lowerEn === 'projector') return <Laptop className={className} />;

  // 11. Academic: Mathematics
  if (lowerEn === 'mathematics' || lowerEn === 'math' || lowerEn === 'algebra' || lowerEn === 'calculus' || lowerEn === 'statistics' || lowerEn === 'number') return <Calculator className={className} />;
  if (lowerEn === 'addition') return <Plus className={className} />;
  if (lowerEn === 'subtraction') return <Minus className={className} />;
  if (lowerEn === 'multiplication') return <X className={className} />;
  if (lowerEn === 'division' || lowerEn === 'percentage') return <Percent className={className} />;
  if (lowerEn === 'circle' || lowerEn === 'square' || lowerEn === 'triangle' || lowerEn === 'line' || lowerEn === 'angle') return <Ruler className={className} />;
  if (lowerEn.includes('power') || lowerEn.includes('exponent')) return <Zap className={className} />;
  if (lowerEn === 'equation' || lowerEn === 'function' || lowerEn === 'integral' || lowerEn === 'root') return <Activity className={className} />;

  // 12. Academic: Computer Science
  if (lowerEn === 'software' || lowerEn === 'code' || lowerEn === 'program' || lowerEn === 'application' || lowerEn === 'website') return <Code className={className} />;
  if (lowerEn === 'hardware' || lowerEn === 'cpu' || lowerEn.includes('operating system') || lowerEn === 'system') return <Cpu className={className} />;
  if (lowerEn === 'network' || lowerEn === 'internet') return <Network className={className} />;
  if (lowerEn === 'data' || lowerEn === 'database') return <Database className={className} />;
  if (lowerEn === 'password') return <Lock className={className} />;
  if (lowerEn === 'folder') return <Folder className={className} />;
  if (lowerEn === 'print') return <Printer className={className} />;
  if (lowerEn === 'developer') return <Terminal className={className} />;
  if (lowerEn === 'email') return <Mail className={className} />;
  if (lowerEn === 'virus') return <ShieldAlert className={className} />;
  if (lowerEn === 'keyboard') return <Keyboard className={className} />;
  if (lowerEn === 'mouse') return <MousePointer className={className} />;
  if (lowerEn === 'algorithm') return <Workflow className={className} />;

  // 13. Academic: Physics
  if (lowerEn === 'physics' || lowerEn === 'atom' || lowerEn === 'molecule') return <Atom className={className} />;
  if (lowerEn === 'force' || lowerEn === 'energy' || lowerEn === 'electricity' || lowerEn === 'electric power') return <Zap className={className} />;
  if (lowerEn === 'mass' || lowerEn === 'weight') return <Scale className={className} />;
  if (lowerEn === 'speed' || lowerEn === 'velocity' || lowerEn === 'rotation' || lowerEn === 'friction' || lowerEn.includes('force')) return <TrendingUp className={className} />;
  if (lowerEn === 'light' || lowerEn === 'temperature' || lowerEn === 'thermometer' || lowerEn === 'chemical thermometer') return <Lightbulb className={className} />;
  if (lowerEn === 'sound' || lowerEn === 'wave') return <Volume2 className={className} />;
  if (lowerEn === 'magnet') return <Compass className={className} />;
  if (lowerEn === 'gravity') return <ArrowDown className={className} />;
  if (lowerEn === 'air resistance') return <Wind className={className} />;
  if (lowerEn === 'barometer' || lowerEn === 'voltmeter' || lowerEn === 'ammeter' || lowerEn.includes('meter')) return <Activity className={className} />;

  // 14. Academic: Chemistry
  if (lowerEn === 'chemistry' || lowerEn === 'chemist' || lowerEn === 'laboratory' || lowerEn.includes('test tube') || lowerEn === 'beaker' || lowerEn === 'tube') return <FlaskConical className={className} />;
  if (lowerEn === 'gas') return <Wind className={className} />;
  if (lowerEn === 'liquid' || lowerEn === 'dissolution') return <Droplet className={className} />;
  if (lowerEn === 'solid') return <Box className={className} />;
  if (lowerEn === 'element' || lowerEn === 'periodic table') return <Grid className={className} />;
  if (lowerEn === 'compound' || lowerEn === 'reaction' || lowerEn === 'acid' || lowerEn === 'base' || lowerEn === 'alkali' || lowerEn === 'catalyst' || lowerEn === 'chemical bond' || lowerEn === 'bond') return <Flame className={className} />;
  if (lowerEn === 'electron' || lowerEn === 'proton' || lowerEn === 'neutron' || lowerEn === 'nucleus') return <Atom className={className} />;

  // 15. Academic: Biology
  if (lowerEn === 'biology' || lowerEn === 'biologist' || lowerEn === 'microscope') return <Microscope className={className} />;
  if (lowerEn === 'organism' || lowerEn === 'bacteria' || lowerEn === 'virus (biological)' || lowerEn === 'microbe' || lowerEn.includes('microorganism')) return <Bug className={className} />;
  if (lowerEn === 'cell' || lowerEn === 'dna' || lowerEn === 'gene' || lowerEn === 'genetics') return <Dna className={className} />;
  if (lowerEn === 'medicine' || lowerEn === 'drug' || lowerEn === 'vaccine' || lowerEn === 'health' || lowerEn === 'disease') return <Heart className={className} />;
  if (lowerEn === 'blood' || lowerEn === 'heart' || lowerEn === 'organ' || lowerEn.includes('system') || lowerEn === 'nutrients') return <Heart className={className} />;
  if (lowerEn === 'brain' || lowerEn.includes('nervous')) return <Brain className={className} />;
  if (lowerEn === 'body' || lowerEn === 'skin' || lowerEn === 'muscle' || lowerEn === 'bone') return <User className={className} />;
  if (lowerEn === 'eye') return <Eye className={className} />;
  if (lowerEn === 'ear' || lowerEn === 'mouth' || lowerEn === 'tooth' || lowerEn === 'tongue') return <Smile className={className} />;
  if (lowerEn === 'sun' || lowerEn === 'photosynthesis') return <Sun className={className} />;
  if (lowerEn === 'ecosystem') return <Globe className={className} />;

  // 16. Academic: Exams
  if (lowerEn === 'exam' || lowerEn === 'homework' || lowerEn === 'syllabus') return <ClipboardList className={className} />;
  if (lowerEn === 'question') return <HelpCircle className={className} />;
  if (lowerEn === 'answer') return <CheckSquare className={className} />;
  if (lowerEn.includes('admission') || lowerEn.includes('acceptance')) return <UserCheck className={className} />;

  // 17. Academic: Actions
  if (lowerEn.startsWith('to read') || lowerEn.startsWith('to study')) return <BookOpen className={className} />;
  if (lowerEn.startsWith('to write') || lowerEn.startsWith('to draw')) return <PenTool className={className} />;
  if (lowerEn.startsWith('to learn')) return <GraduationCap className={className} />;
  if (lowerEn.startsWith('to speak') || lowerEn.startsWith('to listen') || lowerEn.startsWith('to talk')) return <Volume2 className={className} />;
  if (lowerEn.startsWith('to understand') || lowerEn.startsWith('to memorize')) return <Brain className={className} />;
  if (lowerEn.startsWith('to ask')) return <HelpCircle className={className} />;
  if (lowerEn.startsWith('to answer')) return <CheckSquare className={className} />;
  if (lowerEn.startsWith('to see') || lowerEn.startsWith('to watch')) return <Eye className={className} />;
  if (lowerEn.startsWith('to choose') || lowerEn.startsWith('to solve') || lowerEn.startsWith('to correct')) return <Check className={className} />;
  if (lowerEn.startsWith('to analyze') || lowerEn.startsWith('to research')) return <Search className={className} />;
  if (lowerEn.startsWith('to collect') || lowerEn.startsWith('to organize')) return <Folder className={className} />;
  if (lowerEn.startsWith('to show') || lowerEn.startsWith('to present')) return <Presentation className={className} />;
  if (lowerEn.startsWith('to update') || lowerEn.startsWith('to compare')) return <RefreshCw className={className} />;

  // Fallback map for emoji unicode matchers
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
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  return <Sparkles className={className} />;
};

/** Category hero icons: every `categories[].icon` / `academicCategories[].icon`
 *  value is a lucide icon NAME. This registry resolves them to components for
 *  the header plaque (emoji-style values fall through as plain text). */
const CATEGORY_HERO_ICONS = {
  Binary, Palette, Cat, Apple, Users, Home, Calendar,
  Backpack, Building2, School, Ruler, Laptop, Atom, FlaskConical, Microscope, FileSpreadsheet, PenTool,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

const renderCategoryHeroIcon = (iconName: string) => {
  const IconComponent = CATEGORY_HERO_ICONS[iconName];
  if (IconComponent) return <IconComponent className="w-8 h-8" />;
  return <span className="text-4xl leading-none">{iconName}</span>;
};

export function VocabularyList() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { language } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<AcademicLevel | 'all'>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  
  const isAcademic = academicCategories.some(c => c.id === categoryId);
  const category = isAcademic 
    ? academicCategories.find(c => c.id === categoryId)
    : categories.find(c => c.id === categoryId);

  const baseWords = isAcademic
    ? academicVocabulary.filter(w => w.categoryId === categoryId)
    : vocabulary.filter(w => w.categoryId === categoryId);

  const subCategoriesConfig = {
    numbers: [
      { id: 'all', en: 'All Numbers', ar: 'كل الأرقام' },
      { id: 'ones', en: 'Ones', ar: 'أحاد' },
      { id: 'tens', en: 'Tens', ar: 'عشرات' },
      { id: 'hundreds', en: 'Hundreds', ar: 'مئات' },
      { id: 'millions', en: 'Thousands & Millions', ar: 'آلاف وملايين' }
    ],
    animals: [
      { id: 'all', en: 'All', ar: 'الكل' },
      { id: 'animals', en: 'Animals', ar: 'الحيوانات' },
      { id: 'insects', en: 'Insects', ar: 'الحشرات' }
    ],
    food: [
      { id: 'all', en: 'All', ar: 'الكل' },
      { id: 'food', en: 'Food & Meals', ar: 'الأطعمة والوجبات' },
      { id: 'vegetables', en: 'Vegetables', ar: 'الخضروات' },
      { id: 'fruits', en: 'Fruits', ar: 'الفواكه' }
    ],
    time: [
      { id: 'all', en: 'All', ar: 'الكل' },
      { id: 'temporal', en: 'Time Units', ar: 'الوحدات الزمنية والفترات' },
      { id: 'days', en: 'Days of the Week', ar: 'أيام الأسبوع' }
    ]
  } satisfies Record<string, { id: string; en: string; ar: string }[]>;

  // Filter words based on search & academic level / sub-category flags
  // SAFETY: both dataset branches (academic + core vocabulary) carry the
  // PracticeWord field contract (id/ku/en/ar + optional metadata).
  const practiceWords = baseWords as PracticeWord[];
  const words = isAcademic
    ? practiceWords.filter(w => {
        if (!w) return false;
        const ku = w.ku || '';
        const en = w.en || '';
        const ar = w.ar || '';
        const matchesSearch = 
          ku.toLowerCase().includes(search.toLowerCase()) || 
          en.toLowerCase().includes(search.toLowerCase()) || 
          ar.includes(search);
        const matchesLevel = levelFilter === 'all' || w.level === levelFilter;
        return matchesSearch && matchesLevel;
      })
    : practiceWords.filter(w => {
        if (!w) return false;
        const ku = w.ku || '';
        const en = w.en || '';
        const ar = w.ar || '';
        const matchesSearch = 
          ku.toLowerCase().includes(search.toLowerCase()) || 
          en.toLowerCase().includes(search.toLowerCase()) || 
          ar.includes(search);
        
        const matchesSubCategory = activeSubCategory === 'all' || w.subCategoryId === activeSubCategory;
        return matchesSearch && matchesSubCategory;
      });

  if (!category) return <div className="p-8 text-center text-slate-500 font-black">{language !== 'ar' ? 'Category not found' : 'لم يتم العثور على التصنيف المحدد'}</div>;

  // SAFETY: Category | AcademicCategory union — the view names exactly the
  // label fields each member may define; every read below has a fallback.
  const categoryView = category as { nameEn?: string; nameAr?: string; name?: string; ar?: string };
  const categoryName = isAcademic
    ? (language !== 'ar' ? categoryView.nameEn : categoryView.nameAr)
    : (language !== 'ar' ? categoryView.name : (categoryView.ar || categoryView.name));

  return (
    <div className="p-4 space-y-6 min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-indigo-100">
      
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-200/15 dark:bg-indigo-950/20 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* 1. Navigation Header Bar */}
      <div className="flex items-center gap-3 py-2 max-w-md mx-auto">
        <div>
          <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
            {isAcademic ? (language !== 'ar' ? 'ACADEMIC PATH' : 'المسار الأكاديمي') : (language !== 'ar' ? 'VOCABULARY UNIT' : 'وحدة الكلمات')}
          </span>
          <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">
            {categoryName}
          </h2>
        </div>
      </div>

      {/* 2. Stunning Curated Header Plaque Card */}
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.025)] relative overflow-hidden group">
        {/* AUDIT FIX (full-app sweep): `category.icon` holds a lucide icon NAME
            ("Binary", "Backpack", …) — it was rendered as literal text-6xl copy,
            so every category page opened with a giant "Binary"/"Cat" headline.
            Resolve it through a name→component registry (same pattern as the
            categories grid); non-registry values (emoji) still pass through. */}
        <span className="mb-3 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF3D6] dark:bg-[#3A2F14] text-[#D97706] dark:text-[#FFCE6B] drop-shadow-md group-hover:scale-110 transition-transform duration-500 animate-bounce" style={{ animationDuration: '4s' }} aria-hidden="true">
          {renderCategoryHeroIcon(category.icon)}
        </span>
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{categoryName}</h3>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          {baseWords.length} {t(language, 'words')}
        </p>
      </div>

      {/* 3. Filtering and Searching tools */}
      <div className="max-w-md mx-auto flex gap-2 relative z-10">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <Search className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)] focus:border-indigo-300 focus:outline-none transition-colors ps-10 pe-4 text-xs font-bold text-slate-800 dark:text-slate-200"
            placeholder={t(language, 'search_terms')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isAcademic && (
          <div className="relative">
            <select
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)] focus:border-purple-300 focus:outline-none transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 outline-none appearance-none cursor-pointer pr-8"
              value={levelFilter}
              // SAFETY: the select options are generated from AcademicLevel members plus 'all'.
              onChange={(e) => setLevelFilter(e.target.value as AcademicLevel | 'all')}
            >
              <option value="all">{t(language, 'all_levels')}</option>
              <option value="beginner">{t(language, 'level_beginner')}</option>
              <option value="intermediate">{t(language, 'level_intermediate')}</option>
              <option value="advanced">{t(language, 'level_advanced')}</option>
              <option value="professional">{t(language, 'level_professional')}</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* 3.5. Horizontal subcategories tab pills */}
      {!isAcademic && subCategoriesConfig[categoryId!] && (
        <div className="max-w-md mx-auto flex gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 relative z-10 scroll-smooth">
          {subCategoriesConfig[categoryId!].map((sub) => {
            const isActive = activeSubCategory === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSubCategory(sub.id)}
                aria-pressed={isActive}
                className={`min-h-[44px] py-2 px-4 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border-none flex items-center justify-center gap-1 shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span>{language !== 'ar' ? sub.en : sub.ar}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Smoothly animated words cards list rendering */}
      <div className="space-y-3 pb-6 max-w-md mx-auto">
        <AnimatePresence mode="popLayout">
          {words.map((word, index) => (
            <motion.div 
              key={word.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(index * 0.03, 0.3), type: 'spring', stiffness: 280, damping: 25 }}
              className={`bg-white dark:bg-slate-900 border border-slate-200 ${
                isAcademic 
                  ? 'border-s-4 border-s-purple-600 dark:border-s-purple-500' 
                  : 'border-s-4 border-s-indigo-600 dark:border-s-indigo-500'
              } dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.025)] relative overflow-hidden text-start group hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-md transition-all`}
            >
               <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-3.5 flex-1">
                   {true && (
                     // General word beautiful emoji bubble
                     <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100/50 dark:border-slate-800/80 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                       {getWordIcon(word)}
                     </div>
                   )}
                   
                   <div className="flex-1">
                     <div className="flex justify-between items-start flex-wrap gap-2">
                       <h3 className="text-left text-base font-black text-slate-900 dark:text-white leading-tight" dir="ltr">
                         <bdi>{word.ku}</bdi>
                       </h3>
                       {isAcademic && 'level' in word && (
                         <span className="text-[9px] font-black px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 rounded-md uppercase tracking-wider">
                           {tLevel(language, word.level || '')}
                         </span>
                       )}
                     </div>
                     
                     <div className="flex items-center gap-2 mt-1 flex-wrap text-start">
                       {language !== 'ar' ? (
                         <span className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-normal"><bdi>{word.en}</bdi></span>
                       ) : (
                         <span className="text-slate-500 dark:text-slate-400 text-xs font-bold font-arabic leading-normal"><bdi>{word.ar}</bdi></span>
                       )}
                       
                       {/* Show secondary language translations subtitle in high-fidelity items */}
                       {isAcademic && (
                         <>
                           <span className="text-slate-400 dark:text-slate-600 font-bold">•</span>
                           <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold">
                             <bdi>{language !== 'ar' ? word.ar : word.en}</bdi>
                           </span>
                         </>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Premium Interaction Buttons */}
                 <div className="flex items-center gap-1.5 shrink-0 ms-2">
                   <button 
                     type="button"
                     onClick={(e) => {
                       e.preventDefault();
                       toggleFavorite(word.id);
                     }}
                     aria-label={isFavorite(word.id) ? (language !== 'ar' ? 'Remove from favorites' : 'إزالة من المفضلة') : (language !== 'ar' ? 'Add to favorites' : 'إضافة للمفضلة')}
                     className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full transition-all border-none cursor-pointer hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                       isFavorite(word.id) 
                         ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500' 
                         : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50/50'
                     }`}
                     title={language !== 'ar' ? 'Favorite word' : 'إضافة للمفضلة'}
                   >
                     <Heart className={`w-4 h-4 ${isFavorite(word.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                   </button>
                   
                   <AudioButton 
                     audioUrl={word.audio}
                     textToSpeak={word.ku}
                     className={`p-2 rounded-full transition-colors ${
                       isAcademic 
                         ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 hover:bg-purple-100 border-none" 
                         : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-100 border-none"
                     }`}
                     iconClassName="w-4 h-4"
                     showProgress={false}
                   />
                 </div>
               </div>

               {/* Custom Academic / General Phrase Example block usage */}
               {word.exampleKu && (
                 <div className="bg-slate-50/80 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/80 text-[11px] font-medium leading-relaxed mt-1 animate-fade-in">
                   <p className="text-left font-extrabold text-slate-800 dark:text-slate-200 mb-0.5" dir="ltr">
                     "<bdi lang="ku">{word.exampleKu}</bdi>"
                   </p>
                   <p className="text-slate-500 dark:text-slate-400">
                     <bdi>{language !== 'ar' ? word.exampleEn : word.exampleAr}</bdi>
                   </p>
                 </div>
               )}
            </motion.div>
          ))}
        </AnimatePresence>

        {words.length === 0 && (
          <div className="text-center p-12 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-500 font-bold text-xs">
            {t(language, 'no_results')}
          </div>
        )}

        {words.length > 0 && (
          <div className="pt-6">
            <button 
              type="button"
              onClick={() => navigate(`/quiz/${categoryId}`)}
              className={`text-white font-black px-6 py-4.5 min-h-[48px] rounded-[20px] cursor-pointer shadow-lg flex items-center gap-2.5 active:scale-97 transition-all text-sm w-full justify-center border-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                isAcademic 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-purple-600/10 hover:shadow-purple-700/20' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-indigo-600/10 hover:shadow-indigo-700/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current rtl:-scale-x-100" />
              <span>{t(language, 'practice')} {categoryName}</span>
            </button>
          </div>
        )}

        <AdBanner />
      </div>
      
    </div>
  );
}

import React, { useState, useEffect } from 'react';
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
  Backpack, Calculator, Library, Award, FileText, Layout, Code, Brain, Map as MapIcon, ChevronDown, ChevronUp,
  ChevronRight, Building2, School, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t, tLevel } from '../lib/translations';
import { AudioButton } from '../components/AudioButton';
import { RecallButton } from '../components/RecallButton';
import { useFavorites } from '../hooks/useFavorites';
import { categorySubjectAccent } from '../constants/subjectAccents';
import { cn } from '../utils/cn';
import { NUMBER_FAMILY_HISTORY_STATE } from '../lib/navigation';
import { motion, AnimatePresence } from 'motion/react';

/** PHASE 8: DOM hook for the family list — the in-hero family button smooth-
 *  scrolls down to this anchor after the list mounts. */
const NUMBER_FAMILY_HOOK = 'number-family';

/** PHASE 10 (smart back): push a full react-router-shaped history entry so a
 *  hardware/on-screen back press can first "close" the opened family. The
 *  shape (`usr`, `key`, `idx`) mirrors what `createBrowserHistory` writes, so
 *  the router treats the trailing entry as its own location. */
function pushFamilyHistoryEntry(): void {
  // SAFETY: navigates the browser history; history.state is the DOM lib's
  // `any` payload, read verbatim and re-written in the router's own shape.
  const h: History = globalThis.window?.history;
  if (!h) return;
  const prev: any = h.state;
  const idx = (Number.isInteger(prev && prev.idx) ? prev.idx : 0) + 1;
  const key = Math.random().toString(36).substring(2, 10);
  const state = { usr: NUMBER_FAMILY_HISTORY_STATE, key, idx };
  try {
    h.pushState(state, '', globalThis.window ? globalThis.window.location.href : '');
  } catch {
    h.pushState(null, '', globalThis.window ? globalThis.window.location.href : '');
  }
}

/** PHASE 5 (Alphabet-parity focus card): render the digit for a number word
 *  (used by both the hero focus card and the grid tiles). */
function renderNumberDigit(word: any): string {
  const id = word?.id || '';
  const lowerEn = (word?.en || '').toLowerCase().trim();
  if (id === 'n0' || lowerEn === 'zero') return '0';
  if (id === 'n1' || lowerEn === 'one') return '1';
  if (id === 'n2' || lowerEn === 'two') return '2';
  if (id === 'n3' || lowerEn === 'three') return '3';
  if (id === 'n4' || lowerEn === 'four') return '4';
  if (id === 'n5' || lowerEn === 'five') return '5';
  if (id === 'n6' || lowerEn === 'six') return '6';
  if (id === 'n7' || lowerEn === 'seven') return '7';
  if (id === 'n8' || lowerEn === 'eight') return '8';
  if (id === 'n9' || lowerEn === 'nine') return '9';
  if (id === 'n10' || lowerEn === 'ten') return '10';
  if (id === 'n20' || lowerEn === 'twenty') return '20';
  if (id === 'n30' || lowerEn === 'thirty') return '30';
  if (id === 'n40' || lowerEn === 'forty') return '40';
  if (id === 'n50' || lowerEn === 'fifty') return '50';
  if (id === 'n60' || lowerEn === 'sixty') return '60';
  if (id === 'n70' || lowerEn === 'seventy') return '70';
  if (id === 'n80' || lowerEn === 'eighty') return '80';
  if (id === 'n90' || lowerEn === 'ninety') return '90';
  if (id === 'n100' || lowerEn === 'one hundred' || lowerEn === 'hundred') return '100';
  if (id === 'n1000' || lowerEn === 'thousand' || lowerEn === 'one thousand') return '1,000';
  if (id === 'n10000' || lowerEn === 'ten thousand') return '10,000';
  if (id === 'n100000' || lowerEn === 'hundred thousand' || lowerEn === 'one hundred thousand') return '100,000';
  if (id === 'n1000000' || lowerEn === 'million' || lowerEn === 'one million') return '1M';
  if (id === 'n1000000000' || lowerEn === 'billion' || lowerEn === 'one billion') return '1B';
  if (id === 'n1000000000000' || lowerEn === 'trillion' || lowerEn === 'one trillion') return '1T';
  // PHASE 7: compounds (n11–n99, e.g. n21 → "21") are derived from the id.
  const idMatch = /^n(\d+)$/.exec(id);
  if (idMatch) return idMatch[1];
  const textMatch = lowerEn.match(/\d+/);
  return textMatch ? textMatch[0] : '#';
}

/** PHASE 10: compact tile glyph for the advanced large-number tiles — the hero
 *  shows the full "1,000" etc., the grid uses "1K" so tiles stay readable. */
function renderCompactNumberDigit(word: any): string {
  const dig = renderNumberDigit(word);
  if (dig === '1,000') return '1K';
  if (dig === '10,000') return '10K';
  if (dig === '100,000') return '100K';
  return dig;
}

/** PHASE 5: circular color swatch class for a color word (light + dark safe). */
function colorSwatchClass(word: any): string {
  const lowerEn = (word?.en || '').toLowerCase().trim();
  const colorClasses = {
    'red': 'bg-red-500 border-red-600',
    'blue': 'bg-blue-500 border-blue-600',
    'green': 'bg-emerald-500 border-emerald-600',
    'yellow': 'bg-amber-400 border-amber-500',
    'black': 'bg-slate-950 border-slate-900',
    // PHASE 3 (contrast): a white swatch disappears on the white card in
    // light mode — give it a clearly visible neutral outline (`border-slate-400`,
    // NOT the soft `border-slate-300` remapped to the near-invisible `--kq-border`).
    'white': 'bg-white border-slate-400 dark:border-slate-500',
    'grey': 'bg-slate-400 border-slate-500',
    'gray': 'bg-slate-400 border-slate-500',
    'brown': 'bg-amber-800 border-amber-900',
    'pink': 'bg-pink-400 border-pink-500',
    'purple': 'bg-purple-600 border-purple-700',
    'orange': 'bg-orange-500 border-orange-600'
  } satisfies Record<string, string>;
  return colorClasses[lowerEn] || 'bg-gradient-to-br from-indigo-500 to-purple-500';
}

const getWordIcon = (word: any, className = "w-6 h-6 text-indigo-600 dark:text-indigo-400") => {
  if (!word) return <Sparkles className={className} />;

  const lowerEn = (word.en || '').toLowerCase().trim();
  const id = word.id || '';
  const emoji = word.emoji || '';

  // 1. Numbers Category (Render beautiful numeric digits)
  if (word.categoryId === 'numbers' || id.startsWith('n')) {
    return (
      <span className="text-xs font-black tracking-tighter text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
        {renderNumberDigit(word)}
      </span>
    );
  }

  // 2. Colors Category (Render beautiful circular color swatches)
  if (word.categoryId === 'colors') {
    return (
      <span className={`w-5 h-5 rounded-full border shadow-sm shrink-0 ${colorSwatchClass(word)}`} />
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
  const { language, userData } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<AcademicLevel | 'all'>('all');
  // PHASE 2/4: Numbers default to the beginner-friendly "Ones" group instead of
  // dumping every number at once. Every other category keeps "All". On Numbers
  // the group is driven by the guided step navigator (below), not free pills.
  const [activeSubCategory, setActiveSubCategory] = useState<string>(categoryId === 'numbers' ? 'ones' : 'all');
  // PHASE 5 (Alphabet-parity): tapping a grid tile focuses it in the hero.
  // Null = "show the first item", and a stale id (after a Numbers step change)
  // gracefully falls back to the first item of the new grid.
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // PHASE 8 (family view): the number whose family (10–19, 20–29, …) is
  // expanded under the hero. null = main Numbers view.
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
  // PHASE 10 (advanced numbers): an optional "large numbers" family (1,000 →
  // Trillion) that behaves like a decade family. Numbers only.
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  // PHASE 10 (smart back): set while this component itself pops its own
  // history sentinel (the "✕" chip path), so its OWN popstate listener can
  // ignore that self-inflicted pop instead of re-closing.
  const suppressNextPopRef = React.useRef(false);

  const isAcademic = academicCategories.some(c => c.id === categoryId);
  const category = isAcademic 
    ? academicCategories.find(c => c.id === categoryId)
    : categories.find(c => c.id === categoryId);
  const isNumbers = categoryId === 'numbers';
  const isColors = categoryId === 'colors';
  const isSubjectLayout = isNumbers || isColors;

  const baseWords = isAcademic
    ? academicVocabulary.filter(w => w.categoryId === categoryId)
    : vocabulary.filter(w => w.categoryId === categoryId);

  // PHASE (visual feedback): a number/color is "learned" once it carries a
  // positive SM-2 repetition count in the shared review deck — the exact state
  // RecallButton writes to. Re-derives every render, so the grid reflects the
  // latest "Knew it" tap immediately (even before the async profile settles).
  const reviewDeck = userData?.reviewDeck ?? {};
  const isWordLearned = (id: string): boolean => {
    const item = reviewDeck[id];
    return !!item && item.repetitions > 0;
  };

  const subCategoriesConfig = {
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
        
        // PHASE 8: Numbers are rendered by the subject layout (master grid +
        // families), not by a group filter — let every number through here.
        // Other categories fall back to their pill selection / "all".
        const effectiveGroup = categoryId === 'numbers' ? 'all' : activeSubCategory;
        const matchesSubCategory = effectiveGroup === 'all' || w.subCategoryId === effectiveGroup;
        return matchesSearch && matchesSubCategory;
      });

  if (!category) return <div className="p-8 text-center text-slate-500 font-black">{language !== 'ar' ? 'Category not found' : 'لم يتم العثور على التصنيف المحدد'}</div>;

  // Subject accent for the Learning-Hub deep-links (Numbers / Colors): the hero
  // adopts the same colour as its Learning Hub tile so the two screens visibly
  // belong to one another. Every other category keeps its default gold plaque.
  const subjectAccent = categorySubjectAccent(categoryId);

  const headerBadge = isAcademic
    ? (language !== 'ar' ? 'ACADEMIC PATH' : 'المسار الأكاديمي')
    : isNumbers
      ? (language !== 'ar' ? 'NUMBERS' : 'الأرقام')
      : isColors
        ? (language !== 'ar' ? 'COLORS' : 'الألوان')
        : (language !== 'ar' ? 'VOCABULARY UNIT' : 'وحدة الكلمات');

  // SAFETY: Category | AcademicCategory union — the view names exactly the
  // label fields each member may define; every read below has a fallback.
  const categoryView = category as { nameEn?: string; nameAr?: string; name?: string; ar?: string };
  const categoryName = isAcademic
    ? (language !== 'ar' ? categoryView.nameEn : categoryView.nameAr)
    : (language !== 'ar' ? categoryView.name : (categoryView.ar || categoryView.name));

  // PHASE 8 (family model): the master Numbers grid anchors the naturals on
  // the key digits — ones 0–9, round tens 10…90, and 100. Each round ten opens
  // its own family (10–19, 20–29 … 90–99) from the hero; the learner stays on
  // the main view and scrolls freely. Round-tenths own the tidy sub-groups
  // (`teens`, `twenties`, …) and sit immediately before their compounds in
  // `defaultVocabulary`, so every family drops straight out of the data — no
  // duplicated hard-coded lists needed.
  const ROUND_TEN_SUBGROUPS = [
    { id: 'teens', value: '10' },
    { id: 'twenties', value: '20' },
    { id: 'thirties', value: '30' },
    { id: 'forties', value: '40' },
    { id: 'fifties', value: '50' },
    { id: 'sixties', value: '60' },
    { id: 'seventies', value: '70' },
    { id: 'eighties', value: '80' },
    { id: 'nineties', value: '90' },
  ] as const;
  // The word (if any) whose family is currently expanded.
  const openFamilyItem = expandedFamilyId
    ? (words.find(w => w.id === expandedFamilyId) ?? null)
    : null;
  // Simple display digit for an entry (used for the family label, e.g. "20").
  const digitOf = (w?: PracticeWord | null): string => (w ? renderNumberDigit(w) : '');
  // Which family bucket a word sits in: compounds keep the pabucket (teens,
  // twenties, …); ones 0–9 and 100 keep their own. Non-number/no group → ''.
  const familyAnchorGroup = (w?: PracticeWord | null): string => {
    if (!w) return '';
    const sub = w.subCategoryId ?? '';
    if (sub === 'ones' || sub === 'hundred') return sub;
    const group = ROUND_TEN_SUBGROUPS.find(g => g.id === sub);
    return group ? group.id : '';
  };
  // A family ROOT is a standalone round ten (10, 20 … 90) that can open a
  // family — its compounds share the same sub-group, so the digit (not just
  // the group) must prove it is the "×10" itself.
  const familyRootWord = isNumbers
    ? (w?: PracticeWord | null): PracticeWord | null => {
        if (!w) return null;
        if (!ROUND_TEN_SUBGROUPS.some(g => g.id === (w.subCategoryId ?? ''))) return null;
        const digit = Number(digitOf(w));
        if (!Number.isFinite(digit) || digit < 10 || digit > 90 || digit % 10 !== 0) return null;
        return w;
      }
    : () => null;
  // The number a family view was opened from — only round tens qualify.
  const openFamilyRoot = isNumbers ? familyRootWord(openFamilyItem) : null;
  const expandedGroup = isNumbers ? familyAnchorGroup(openFamilyRoot) : '';

  // The advanced/large numbers — an optional "extras" family (thousands up to
  // trillion) the learner opts into, kept out of the core 0→100 path.
  const LARGE_NUMBER_SUBGROUP = 'hundreds';
  const largeNumbers: PracticeWord[] = isNumbers
    ? words.filter(w => (w.subCategoryId ?? '') === LARGE_NUMBER_SUBGROUP)
    : [];

  // The clean master grid: ones 0–9, round tens 10…90, and 100.
  const masterNumbers: PracticeWord[] = isNumbers
    ? words.filter(w => w.subCategoryId === 'ones' || w.subCategoryId === 'hundred' || familyRootWord(w) !== null)
    : [];
  // The members of the opened family (round ten + its nine compounds).
  const familyWords: PracticeWord[] = isNumbers && openFamilyRoot
    ? words.filter(w => (w.subCategoryId ?? '') === expandedGroup)
    : [];

  // Which overlays is open right now (mutually exclusive by construction).
  const isFamilyExpanded = isNumbers && familyRootWord(openFamilyItem) !== null;
  const isAdvancedExpanded = isNumbers && isAdvancedOpen;

  // The main grid a learner sees: the master numbers (ones + round tens + 100),
  // or the full palette for Colors. (Non-subject pages never render this.)
  const subjectGridWords: PracticeWord[] = !isSubjectLayout
    ? []
    : isNumbers
      ? masterNumbers
      : words;

  // PHASE 5 (Alphabet-parity): the word the big hero card shows. It must find
  // the tapped word in the FULL category list (not just the visible grid), so
  // focusing a round ten / a compound always works; the fallback is the first
  // tile of the on-screen grid (the opened family, when one is open).
  const focusedWord = isSubjectLayout
    ? (words.find(w => w.id === focusedId)
       ?? (openFamilyRoot ? familyWords[0] : isAdvancedOpen ? (largeNumbers[0] ?? null) : subjectGridWords[0])
       ?? null)
    : null;
  // A round ten currently focused but not yet expanded shows the opener button.
  const focusCanOpenFamily = isNumbers && !isAdvancedOpen && familyRootWord(focusedWord) !== null;
  // False whenever an overlay is open — used to keep the home/Advanced-view
  // CTA straightforward.
  const overlayOpen = isFamilyExpanded || isAdvancedExpanded;

  // PHASE 8: when a family opens under the hero, bring its label into view so
  // the decade is obvious without scroll hunting. Defers one frame so the
  // freshly-mounted `#number-family` node exists before `scrollIntoView`.
  useEffect(() => {
    if (!isNumbers || !expandedFamilyId) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(NUMBER_FAMILY_HOOK)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  }, [isNumbers, expandedFamilyId]);

  // PHASE 10 (smart back): popstate is the only event that fires for BOTH the
  // Android hardware back button and the browser/on-screen back. When an
  // overlay (family grid or advanced numbers) is open, the pop closes it and
  // re-pushes a sentinel so the NEXT back press navigates away; when only the
  // base grid is visible, we let the router's own history handling route the
  // pop normally.
  useEffect(() => {
    if (!isNumbers) return;
    const onPop = () => {
      // PHASE 10 (smart back): a back/forward press while an overlay is open
      // consumes the sentinel entry we pushed on open and just closes the
      // overlay in place — the router is left at its original location, so the
      // NEXT back press navigates away normally. If the UI "✕" chip already
      // consumed the sentinel via an explicit history.back(), this self-inflicted
      // pop is ignored.
      requestAnimationFrame(() => {
        if (suppressNextPopRef.current) {
          suppressNextPopRef.current = false;
          return;
        }
        if (expandedFamilyId || isAdvancedOpen) {
          setExpandedFamilyId(null);
          setIsAdvancedOpen(false);
          setFocusedId(null);
        }
      });
    };
    globalThis.window?.addEventListener('popstate', onPop);
    return () => globalThis.window?.removeEventListener('popstate', onPop);
  }, [isNumbers, expandedFamilyId, isAdvancedOpen]);
  // PHASE 8 (clean Alphabet-parity): Numbers & Colors render a page that is
  // structurally identical to the Alphabet page — one clean focus hero, a
  // section label + count chip, the tappable grid below, and a single practice
  // button right after the content. Numbers keep their decade "families":
  // focus a round ten → tap the in-hero "Family" button → the family opens
  // directly under the hero. No step card / dots / carousel at all.
  // ──────────────────────────────────────────────────────────────────────────
  if (isSubjectLayout) {
    const accent = subjectAccent ?? {
      well: 'bg-indigo-100 dark:bg-indigo-950/50',
      icon: 'text-indigo-600 dark:text-indigo-400',
      barFill: 'bg-indigo-500',
      heroBorder: 'border-s-indigo-500 dark:border-s-indigo-400',
    };
    const solidCta = isNumbers
      ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
    const focusTone = isNumbers ? 'text-sky-700 dark:text-sky-300' : 'text-emerald-700 dark:text-emerald-300';
    // Selected tile uses a full, visible subject-colored border (Alphabet uses
    // a full gold border on the selected letter, not just the start edge).
    const focusBorder = isNumbers
      ? 'border-sky-500 dark:border-sky-400'
      : 'border-emerald-500 dark:border-emerald-400';
    const plaqueTone = isNumbers
      ? 'bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/50'
      : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50';
    const sectionLabel = isNumbers
      ? (language === 'ar' ? 'الأرقام' : language === 'ku' ? 'Jimar' : 'Numbers')
      : (language === 'ar' ? 'الألوان' : language === 'ku' ? 'Reng' : 'Colors');
    // PHASE 8 family copy — the opener word ("Family of" / "Malbata" / "عائلة")
    // is rendered next to the digit as a separate element with an explicit
    // gap, so the two can never collapse into "Malbata90".
    // (isFamilyExpanded / isAdvancedExpanded are derived at the top of the
    // component alongside the family/advanced word lists.)
    const familyCtaWord = language === 'ar' ? 'عائلة' : language === 'ku' ? 'Malbata' : 'Family of';
    const familyAnchor = digitOf(openFamilyRoot);
    const familyLabel = isNumbers && openFamilyRoot ? `${familyCtaWord} ${familyAnchor}` : '';
    const backToAllLabel = isNumbers
      ? (language === 'ar' ? 'عرض كل الأرقام' : language === 'ku' ? 'Hemû jimar' : 'All numbers')
      : '';
    // PHASE 10 (advanced numbers) copy — a clearly-labelled optional extras
    // entry (thousands → trillion), separate from the core 0→100 path.
    const advancedOpen = isNumbers && isAdvancedOpen;
    const advancedLabel = (language === 'ar'
      ? 'أعداد كبيرة'
      : language === 'ku' ? 'Jimarên Mezin' : 'Large numbers');
    const advancedCtaWord = language === 'ar'
      ? 'تعلّم المزيد'
      : language === 'ku' ? 'Bêtir Fêr Bibe' : 'Learn more';

    const openFamily = (id: string) => {
      setFocusedId(id);
      setIsAdvancedOpen(false);
      setExpandedFamilyId(id);
      pushFamilyHistoryEntry();
    };
    const openAdvanced = () => {
      setExpandedFamilyId(null);
      setIsAdvancedOpen(true);
      setFocusedId(largeNumbers[0]?.id ?? null);
      pushFamilyHistoryEntry();
    };
    const closeFamily = () => {
      // Close in place AND consume the sentinel history entry so the back
      // stack stays in sync: set the suppress flag right before popping, then
      // let our own listener see the pop and skip re-closing.
      setExpandedFamilyId(null);
      setIsAdvancedOpen(false);
      setFocusedId(null);
      if (expandedFamilyId || isAdvancedOpen) {
        suppressNextPopRef.current = true;
        if (globalThis.window?.history && globalThis.window.history.length > 1) {
          globalThis.window.history.back();
        }
      }
    };

    return (
      <div className="p-4 flex flex-col pb-24">
        {/* Focus viewport — mirrors the Alphabet letter hero exactly (neutral
            card + radial glow; subject color lives in the content, not chrome). */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center mb-6 relative overflow-hidden shadow-flat flex-shrink-0 border border-line-soft group">
          <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.10] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-4 end-4 z-10">
            <AudioButton
              audioUrl={focusedWord?.audio}
              textToSpeak={focusedWord?.ku}
              className={`${accent.well} ${accent.icon} border border-line-soft hover:opacity-90 cursor-pointer shadow-sm`}
              iconClassName="w-5 h-5"
              showProgress={false}
            />
          </div>

              {focusedWord && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={focusedWord.id}
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    {isNumbers ? (
                      <span className={`${focusTone} font-black text-8xl transition-all duration-300 tracking-tight font-display select-none leading-none tabular-nums ${overlayOpen ? 'text-5xl mt-2 mb-3' : 'mb-6 mt-4'}`} dir="ltr">
                        {renderNumberDigit(focusedWord)}
                      </span>
                    ) : (
                      <span className={`w-20 h-20 rounded-full border-4 border-white dark:border-slate-700 shadow-lg my-6 ${colorSwatchClass(focusedWord)}`} aria-hidden="true" />
                    )}

                    <div className={`${plaqueTone} p-5 rounded-2xl w-full max-w-xs transition-colors duration-300 ${overlayOpen ? 'p-3.5' : ''}`} dir="ltr">
                      <p className={`text-ink font-black mb-1 ${overlayOpen ? 'text-lg' : 'text-2xl'}`}>
                        <bdi>{focusedWord.ku}</bdi>
                      </p>
                      <p className="text-xs font-bold text-muted tracking-wider uppercase">
                        <bdi>{language === 'ar' ? focusedWord.ar : focusedWord.en}</bdi>
                      </p>
                    </div>

                    {/* PHASE 8/10: a standalone round ten shows a big, obvious
                        "Family of N" button right in the hero — the one nav
                        gesture that opens its decade family. Focusing 100 opens
                        the optional "Learn more" (large numbers) extras instead.
                        When an overlay is already open the hero collapses and
                        the strip below carries the "close" control, so the hero
                        never says a number three different ways. */}
                    {!overlayOpen && isNumbers && focusCanOpenFamily && (
                      <motion.button
                        key={`family-${focusedWord.id}`}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => openFamily(focusedWord.id)}
                        className="w-full max-w-xs mt-4 rounded-2xl px-4 py-3 text-sm font-black text-sky-700 dark:text-sky-200 border-2 border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="flex items-baseline gap-2">
                          <span>{familyCtaWord}</span>
                          <span className="tabular-nums" dir="ltr">{digitOf(focusedWord)}</span>
                        </span>
                      </motion.button>
                    )}

                    {/* PHASE 10: focusing 100 exposes the optional
                        "Learn more → large numbers" gate in the hero. */}
                    {!overlayOpen && isNumbers && focusedWord?.subCategoryId === 'hundred' && (
                      <motion.button
                        key="advanced-numbers"
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={openAdvanced}
                        className="w-full max-w-xs mt-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-200 border-2 border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                        <span className="flex items-baseline gap-2">
                          <span>{advancedCtaWord}</span>
                          <span dir="ltr">{advancedLabel}</span>
                        </span>
                      </motion.button>
                    )}

                  </motion.div>
                </AnimatePresence>
              )}
        </div>

        {/* Section label row — Alphabet-style "label + count chip". In an
            overlay the label swaps to its name (family / large numbers) and the
            chip shows the overlay size, so a number never appears twice. */}
        <div className="flex items-center justify-between mb-3 px-1 mt-2">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest" dir="ltr">
            {advancedOpen ? advancedLabel : isFamilyExpanded ? familyLabel : sectionLabel}
          </h3>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase">
            {advancedOpen ? largeNumbers.length : isFamilyExpanded ? familyWords.length : subjectGridWords.length}
          </span>
        </div>
        {/* PHASE 10: an explicit "Learn more → large numbers" gate that sits
            directly below the main grid — the optional extras section. It is
            offered, never forced. */}
        {isNumbers && !overlayOpen && largeNumbers.length > 0 && (
          <button
            type="button"
            onClick={openAdvanced}
            className="w-full mb-3 flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-sky-200/70 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{advancedCtaWord}</span>
            </span>
            <span className="flex items-center gap-2 text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              <span dir="ltr">{advancedLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </span>
          </button>
        )}
        {/* PHASE 8/10 (conditional view): family open → family grid; advanced
            open → large-number grid; otherwise the main grid. Exactly one of
            them renders — never stacked. */}
        {isFamilyExpanded && openFamilyRoot ? (
          <div
            id={NUMBER_FAMILY_HOOK}
            role="region"
            aria-label={familyLabel}
            className="mb-4 rounded-2xl border border-sky-200/70 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/30 p-3"
          >
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h4 className="text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-widest" dir="ltr">
                {familyLabel}
              </h4>
              <button
                type="button"
                onClick={closeFamily}
                aria-label={backToAllLabel}
                className="flex items-center gap-1 min-h-[32px] px-2.5 rounded-full text-[10px] font-black text-sky-600 dark:text-sky-400 bg-white/70 dark:bg-slate-900/70 border border-sky-200/70 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{backToAllLabel}</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {familyWords.map((word, index) => {
                const isFocused = focusedWord?.id === word.id;
                const isLearned = isWordLearned(word.id);
                return (
                  <motion.button
                    key={word.id}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.3 }}
                    onClick={() => setFocusedId(word.id)}
                    aria-pressed={isFocused}
                    aria-label={`${word.ku} — ${language === 'ar' ? word.ar : word.en}${isLearned ? (language === 'ar' ? '، محفوظ' : ', learned') : ''}`}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-xl transition-all relative cursor-pointer select-none
                      ${isFocused
                        ? `${accent.well} border-2 ${focusBorder} ${accent.icon} shadow-md scale-105`
                        : isLearned
                          ? 'border-2 border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-[0_8px_30px_rgba(0,0,0,0.015)]'}`}
                  >
                    <span className="font-mono text-xl font-black tabular-nums" dir="ltr">{renderNumberDigit(word)}</span>
                    {isLearned && (
                      <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-500 text-white shadow-sm" aria-hidden="true">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : advancedOpen ? (
          <div
            id={NUMBER_FAMILY_HOOK}
            role="region"
            aria-label={advancedLabel}
            className="mb-4 rounded-2xl border border-sky-200/70 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/30 p-3"
          >
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h4 className="text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-widest" dir="ltr">
                {advancedLabel}
              </h4>
              <button
                type="button"
                onClick={closeFamily}
                aria-label={backToAllLabel}
                className="flex items-center gap-1 min-h-[32px] px-2.5 rounded-full text-[10px] font-black text-sky-600 dark:text-sky-400 bg-white/70 dark:bg-slate-900/70 border border-sky-200/70 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{backToAllLabel}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {largeNumbers.map((word, index) => {
                const isFocused = focusedWord?.id === word.id;
                const isLearned = isWordLearned(word.id);
                return (
                  <motion.button
                    key={word.id}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.3 }}
                    onClick={() => setFocusedId(word.id)}
                    aria-pressed={isFocused}
                    aria-label={`${word.ku} — ${language === 'ar' ? word.ar : word.en}${isLearned ? (language === 'ar' ? '، محفوظ' : ', learned') : ''}`}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 font-black text-base transition-all relative cursor-pointer select-none
                      ${isFocused
                        ? `${accent.well} border-2 ${focusBorder} ${accent.icon} shadow-md scale-105`
                        : isLearned
                          ? 'border-2 border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-[0_8px_30px_rgba(0,0,0,0.015)]'}`}
                  >
                    <span className="font-mono font-black tabular-nums" dir="ltr">{renderCompactNumberDigit(word)}</span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-none" dir="ltr">{word.ku}</span>
                    {isLearned && (
                      <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-500 text-white shadow-sm" aria-hidden="true">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pb-4">
            <div className={`grid ${isNumbers ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
              <AnimatePresence mode="popLayout">
                {subjectGridWords.map((word, index) => {
                  const isFocused = focusedWord?.id === word.id;
                  const isLearned = isWordLearned(word.id);
                  return (
                    <motion.button
                      key={word.id}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.3 }}
                      onClick={() => setFocusedId(word.id)}
                      aria-pressed={isFocused}
                      aria-label={`${word.ku} — ${language === 'ar' ? word.ar : word.en}${isLearned ? (language === 'ar' ? '، محفوظ' : ', learned') : ''}`}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-xl transition-all relative cursor-pointer select-none
                        ${isFocused
                          ? `${accent.well} border-2 ${focusBorder} ${accent.icon} shadow-md scale-105`
                          : isLearned
                            ? 'border-2 border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-[0_8px_30px_rgba(0,0,0,0.015)]'}`}
                    >
                      {isColors && (
                        <span className={`w-8 h-8 rounded-full border-2 shadow-sm ${colorSwatchClass(word)}`} aria-hidden="true" />
                      )}
                      {isNumbers && (
                        <span className="font-mono text-xl font-black tabular-nums" dir="ltr">{renderNumberDigit(word)}</span>
                      )}
                      {isLearned && (
                        <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-500 text-white shadow-sm" aria-hidden="true">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* PHASE 10: compact advanced-numbers chip right under the main
                grid — the same family the hero's "Learn more" button opens, so
                the extras stay one tap away even when another number is
                focused. */}
            {isNumbers && largeNumbers.length > 0 && (
              <button
                type="button"
                onClick={openAdvanced}
                className="mt-2 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-sky-200/70 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-[10px] font-black text-sky-700 dark:text-sky-300 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{advancedCtaWord}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  <span dir="ltr">{advancedLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
                </span>
              </button>
            )}
          </div>
        )}

        {/* PHASE 9: the self-check always sits under the active grid (main or
            family) and always targets the focused number — selecting 91 from
            the 90–99 family updates the hero to 91 and this marks 91, never 90.
            It lives beside the Pratîk CTA so it can never be hidden. */}
        {focusedWord && (
          <div className="flex flex-col items-center gap-2 pt-1 pb-2">
            <RecallButton wordId={focusedWord.id} size="block" />
          </div>
        )}

        {/* PHASE 3/6: the single practice CTA sits snug under the active grid
            (never pinned to a far empty bottom). A touch more breathing room in
            family view so it's still easy to reach, but always visible. */}
        <div className="flex justify-center pt-1 pb-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/quiz/${categoryId}`)}
            className={`${solidCta} text-white font-extrabold px-8 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all text-base w-full justify-center flex items-center gap-3 cursor-pointer border-none focus-visible:ring-2 focus-visible:ring-indigo-600`}
          >
            <span>{t(language, 'practice')}</span>
            <Play className="w-4 h-4 fill-current rtl:-scale-x-100" />
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-indigo-100">
      
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-200/15 dark:bg-indigo-950/20 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* 1. Slim header strap — subject identity + a Learning Hub shortcut,
             NOT a replicated title. */}
      <div className="flex items-center justify-between gap-3 py-1 max-w-md mx-auto">
        <span className={cn(
          'text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide',
          subjectAccent ? subjectAccent.well : 'bg-indigo-100 dark:bg-indigo-950/50',
          subjectAccent ? subjectAccent.icon : 'text-indigo-700 dark:text-indigo-400'
        )}>
          {headerBadge}
        </span>
        {subjectAccent && (
          <button
            type="button"
            onClick={() => navigate('/learn')}
            className="flex items-center gap-1 text-[10px] font-black text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none min-h-[36px] px-1 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
            <span>{t(language, 'learning')} Hub</span>
          </button>
        )}
      </div>

      {/* 2. ONE hero — the single source of the page title. PHASE 4 (unify):
          restyled to match the Alphabet page reference — calm rounded-[2rem]
          card, soft radial gold glow, restrained icon (no bounce). */}
      <div className={`max-w-md mx-auto bg-white dark:bg-slate-900 border-s-4 ${subjectAccent ? subjectAccent.heroBorder : 'border-s-[#FFCF54] dark:border-s-[#FFBA38]'} border border-line-soft dark:border-slate-800 rounded-[2rem] p-6 text-center shadow-flat relative overflow-hidden group`}>
        <div className="absolute inset-x-0 -top-16 h-48 bg-[radial-gradient(circle_at_50%_0%,#FFB300_0%,transparent_65%)] opacity-[0.10] pointer-events-none" aria-hidden="true" />
        {/* AUDIT FIX (full-app sweep): `category.icon` holds a lucide icon NAME
            ("Binary", "Backpack", …) — it was rendered as literal text-6xl copy,
            so every category page opened with a giant "Binary"/"Cat" headline.
            Resolve it through a name→component registry (same pattern as the
            categories grid); non-registry values (emoji) still pass through. */}
        <span className={`mb-3 mx-auto inline-flex items-center justify-center w-16 h-16 rounded-2xl ${subjectAccent ? subjectAccent.well : 'bg-[#FFF3D6] dark:bg-[#3A2F14]'} ${subjectAccent ? subjectAccent.icon : 'text-[#D97706] dark:text-[#FFCE6B]'} drop-shadow-md transition-transform duration-500`} aria-hidden="true">
          {renderCategoryHeroIcon(category.icon)}
        </span>
        {subjectAccent && (
          <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${subjectAccent.well} ${subjectAccent.icon}`}>
            {isNumbers ? (language !== 'ar' ? 'Numbers' : 'الأرقام') : (language !== 'ar' ? 'Colors' : 'الألوان')}
          </span>
        )}
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{categoryName}</h3>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          {baseWords.length} {t(language, 'words')}
        </p>
      </div>

      {/* 3. Controls — progressively disclosed on the Learning deep-links. */}
      {subjectAccent && (
        <button
          type="button"
          onClick={() => setControlsExpanded(e => !e)}
          aria-expanded={controlsExpanded}
          className="max-w-md mx-auto flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer bg-transparent border-none min-h-[36px]"
        >
          {controlsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>
            {controlsExpanded
              ? (language !== 'ar' ? 'Hide filters & search' : 'إخفاء التصفية والبحث')
              : (language !== 'ar' ? 'Show filters & search' : 'إظهار التصفية والبحث')}
          </span>
        </button>
      )}

      {controlsExpanded && (
        <>
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

          {/* 3.5. Horizontal subcategories tab pills.
              PHASE 4 (UX): Numbers are the guided deep-link — their step
              walk-through lives in section 3 above, so the generic pill row is
              hidden there (search stays available inside the disclosure). Every
              other subject keeps its tab pills. */}
          {!isAcademic && categoryId !== 'numbers' && subCategoriesConfig[categoryId!] && (
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
        </>
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

               {/* PHASE 2: lightweight inline recall — feeds the existing SM-2
                   reviewDeck through the exact same path the quiz uses. */}
               <RecallButton wordId={word.id} size="sm" className="self-start mt-1" />
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

        {/* PHASE 3 (clutter): the full promotional AdBanner is demoted to a
            compact "go ad-free" hint on this focused study screen, so learning
            isn't interrupted. Monetization stays reachable (one tap → /store). */}
        <button
          type="button"
          onClick={() => navigate('/store')}
          className="w-full flex items-center justify-center gap-1.5 min-h-[36px] text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none"
        >
          <Sparkles className="w-3 h-3" />
          <span>{language !== 'ar' ? 'Studying ad-free · Go Premium' : 'تتعلّم بدون إعلانات · اشترك بريميوم'}</span>
        </button>
      </div>
      
    </div>
  );
}

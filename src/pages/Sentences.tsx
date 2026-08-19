import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/translations';
import { AudioButton } from '../components/AudioButton';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  Play, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  Sun, 
  Moon, 
  PartyPopper, 
  Compass, 
  User, 
  Heart, 
  Menu,
  Flame, 
  Coffee, 
  Handshake, 
  Utensils, 
  ChefHat, 
  Stethoscope, 
  Briefcase, 
  Smile
} from 'lucide-react';
import { useNavigate } from 'react-router';

const renderSentencesIcon = (iconName: string, className = "w-6 h-6 text-purple-600") => {
  const iconMap = {
    'Flame': Flame,
    'Coffee': Coffee,
    'Handshake': Handshake,
    'Utensils': Utensils,
    'Briefcase': Briefcase,
    'Stethoscope': Stethoscope,
    'ChefHat': ChefHat,
    'User': User,
    'BookOpen': BookOpen,
    'Smile': Smile,
    'MessageSquare': MessageSquare,
    'Compass': Compass,
    'Clock': Clock,
    'Sun': Sun,
    'Moon': Moon,
    'PartyPopper': PartyPopper,
    'Sparkles': Sparkles,
    'Heart': Heart,
  } satisfies Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <Smile className={className} />;
};

// Define static rich data for new features

interface EverydayPhrase {
  id: string;
  ku: string;
  en: string;
  ar: string;
  emoji: string;
  audio: string;
}

interface TemporalPhrase extends EverydayPhrase {
  timeTag: 'morning' | 'evening' | 'occasions';
}

interface ReadingPassage {
  id: string;
  titleKu: string;
  titleEn: string;
  titleAr: string;
  icon: string;
  fullKu: string;
  fullEn: string;
  fullAr: string;
  sentences: {
    ku: string;
    en: string;
    ar: string;
  }[];
  vocabulary: { ku: string; tr: string }[];
}

interface DialogueTurn {
  speaker: string;
  avatar: string;
  gender: 'male' | 'female';
  align: 'left' | 'right';
  ku: string;
  en: string;
  ar: string;
  audio?: string;
}

interface DialogueScenario {
  id: string;
  titleKu: string;
  titleEn: string;
  titleAr: string;
  descriptionKu: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  turns: DialogueTurn[];
}

const everydayPhrases: EverydayPhrase[] = [
  { id: 'ev1', ku: 'Ez fêrî Kurmancî dibim.', en: 'I am learning Kurmanji.', ar: 'أنا أتعلم الكورمانجية.', emoji: 'BookOpen', audio: '' },
  { id: 'ev2', ku: 'Kerem bike, rûnişte.', en: 'Please, take a seat.', ar: 'تفضل بالجلوس.', emoji: 'Smile', audio: '' },
  { id: 'ev3', ku: 'Spas ji bo alîkariya te.', en: 'Thank you for your help.', ar: 'شكراً لك على مساعدتك.', emoji: 'Handshake', audio: '' },
  { id: 'ev4', ku: 'Ez te fêm nakim.', en: 'I do not understand you.', ar: 'أنا لا أفهمك.', emoji: 'Smile', audio: '' },
  { id: 'ev5', ku: 'Tu dikarî hêdî biaxivî?', en: 'Can you speak slowly?', ar: 'هل يمكنك التحدث ببطء؟', emoji: 'MessageSquare', audio: '' },
  { id: 'ev6', ku: 'Bi xêr hatî bo mala me.', en: 'Welcome to our home.', ar: 'أهلاً بك في منزلنا.', emoji: 'Compass', audio: '' },
  { id: 'ev7', ku: 'Ez birçî me, xwarin heye?', en: 'I am hungry, is there food?', ar: 'أنا جائع، هل هناك طعام؟', emoji: 'Utensils', audio: '' },
  { id: 'ev8', ku: 'Ez tî me, ava sar dixwazim.', en: 'I am thirsty, I want cold water.', ar: 'أنا عطشان، أريد ماء بارداً.', emoji: 'Coffee', audio: '' },
  { id: 'ev9', ku: 'Navnîşan kûderê ye?', en: 'Where is the address?', ar: 'أين يقع العنوان؟', emoji: 'Compass', audio: '' },
  { id: 'ev10', ku: 'Kengî em ê biçin?', en: 'When will we go?', ar: 'متى سنذهب؟', emoji: 'Clock', audio: '' },
];

const temporalPhrases: TemporalPhrase[] = [
  // Morning (فترة الصباح والتحيات الصباحية)
  { id: 'tm1', ku: 'Rojbaş! Sibeha te bi xêr be.', en: 'Good morning! Have a blessed morning.', ar: 'صباح الخير! يسعد صباحك.', emoji: 'Sun', audio: '', timeTag: 'morning' },
  { id: 'tm2', ku: 'Hema niha ez şiyar bûm.', en: 'I just woke up right now.', ar: 'لقد استيقظت للتو الآن.', emoji: 'Smile', audio: '', timeTag: 'morning' },
  { id: 'tm3', ku: 'Ez ê taştê bixwim.', en: 'I will eat breakfast.', ar: 'سوف أتناول الفطور.', emoji: 'Utensils', audio: '', timeTag: 'morning' },
  { id: 'tm4', ku: 'Saet çend e di sibehan de?', en: 'What time is it in the morning?', ar: 'كم الساعة في الصباح؟', emoji: 'Clock', audio: '', timeTag: 'morning' },

  // Afternoon/Evening (المساء، العصر والظهيرة)
  { id: 'te1', ku: 'Êvarbaş! Demên we xweş bin.', en: 'Good evening! Have a good time.', ar: 'مساء الخير! طابت أوقاتكم.', emoji: 'Sun', audio: '', timeTag: 'evening' },
  { id: 'te2', ku: 'Şevbaş! Xewnên xweş.', en: 'Good night! Sweet dreams.', ar: 'تصبح على خير! أحلاماً سعيدة.', emoji: 'Moon', audio: '', timeTag: 'evening' },
  { id: 'te3', ku: 'Paş nîvroya te bi xêr be.', en: 'Have a great afternoon.', ar: 'طابت بعد ظهيرتك.', emoji: 'Sun', audio: '', timeTag: 'evening' },
  { id: 'te4', ku: 'Em ê li serê êvarê bên bal te.', en: 'We will visit you in the evening.', ar: 'سنأتي لزيارتك في وقت المساء.', emoji: 'Coffee', audio: '', timeTag: 'evening' },

  // Occasions (المناسبات والأعياد)
  { id: 'to1', ku: 'Cejna te pîroz be!', en: 'Happy Feast / Eid!', ar: 'عيدك مبارك! / كل عام وأنت بخير.', emoji: 'PartyPopper', audio: '', timeTag: 'occasions' },
  { id: 'to2', ku: 'Rojbûna te pîroz be!', en: 'Happy birthday!', ar: 'عيد ميلاد سعيد!', emoji: 'Smile', audio: '', timeTag: 'occasions' },
  { id: 'to3', ku: 'Sersala we pîroz be!', en: 'Happy new year!', ar: 'سنة جديدة سعيدة! / كل عام وأنتم بخير.', emoji: 'PartyPopper', audio: '', timeTag: 'occasions' },
  { id: 'to4', ku: 'Serkeftinê ji bo we dixwazim.', en: 'I wish you success.', ar: 'أتمنى لكم التوفيق والنجاح.', emoji: 'Sparkles', audio: '', timeTag: 'occasions' },
];

const readingPassages: ReadingPassage[] = [
  {
    id: 'rp1',
    titleKu: 'Newroz û Hatinên Biharê',
    titleEn: 'Newroz and the Arrival of Spring',
    titleAr: 'نوروز وقدوم فصل الربيع',
    icon: 'Flame',
    fullKu: 'Bihar hat û xwezaye şîn bû. Newroz roja nû ye û cejna gelê Kurd e. Di vê rojê de em agir dadidin, govendê digirin û cilan nû li xwe dikin.',
    fullEn: 'Spring has arrived and nature has turned green. Newroz is a new day and the festival of the Kurdish people. On this day we light fire, dance traditional dances, and wear new clothes.',
    fullAr: 'لقد جاء الربيع واكتست الطبيعة بالاخضرار. عيد نوروز هو اليوم الجديد وهو العيد الوطني للشعب الكردي. في هذا اليوم نوقد نيران نوروز، ونعقد الدبكات ونرتدي ملابسنا الجديدة الفلكلورية.',
    sentences: [
      { ku: 'Bihar hat û xwezaye şîn bû.', en: 'Spring has arrived and nature has turned green.', ar: 'لقد جاء الربيع واكتست الطبيعة بالخضار والجمال.' },
      { ku: 'Newroz roja nû ye û cejna gelê Kurd e.', en: 'Newroz is a new day and the festival of the Kurdish people.', ar: 'عيد نوروز هو اليوم الجديد وهو عيد الشعب الكردي.' },
      { ku: 'Di vê rojê de em agir dadidin û govendê digirin.', en: 'On this day we light fire and dance traditional dances.', ar: 'في هذا اليوم نوقد الشعلة ونعقد الدبكات والرقصات الشعبية.' },
      { ku: 'Em cilên nû û rengîn li xwe dikin.', en: 'We wear new and colorful clothes.', ar: 'ونرتدي الملابس الجديدة الملونة والجميلة.' }
    ],
    vocabulary: [
      { ku: 'Bihar', tr: 'Spring / الربيع' },
      { ku: 'Roja nû', tr: 'New day / اليوم الجديد' },
      { ku: 'Agir', tr: 'Fire / النار' },
      { ku: 'Govend', tr: 'Traditional Dance / الدبكة' }
    ]
  },
  {
    id: 'rp2',
    titleKu: 'Mêvanperweriya Kurdan',
    titleEn: 'Kurdish Hospitality',
    titleAr: 'عادات الضيافة الكردية الاصيلة',
    icon: 'Coffee',
    fullKu: 'Kurd gelek mêvanperwer in. Çay li her malê heye û ji bo mêvanan her tim xwarinên xweş amade dikin. Deriyê malê wan her tim vekirî ye.',
    fullEn: 'Kurdish people are very hospitable. Tea is available in every house, and they always prepare delicious food for guests. The doors of their homes are always open.',
    fullAr: 'يتميز الكرد بكرم الضيافة وحسن الاستقبال الشديدين. الشاي الساخن متواجد في كل بيت ودائماً ما يحضرون ألذ الأطعمة لضيوفهم. باب منازلهم مفتوح دائمًا لكل قاصد.',
    sentences: [
      { ku: 'Kurd gelek mêvanperwer in.', en: 'Kurdish people are very hospitable.', ar: 'يتميز الشعب الكردي بكرم الضيافة الشديد.' },
      { ku: 'Çay li her malê heye û her tim amade ye.', en: 'Tea is in every house and always ready.', ar: 'الشاي متوفر دائماً وبشكل أساسي في كل منزل.' },
      { ku: 'Ji bo mêvanan xwarinên pir xweş amade dikin.', en: 'They prepare delicious food for the guests.', ar: 'يقومون بإعداد وتجهيز الوجبات اللذيذة والشهية إكراماً للضيوف.' },
      { ku: 'Deriyê malê wan her tim vekirî ye.', en: 'The doors of their homes are always open.', ar: 'أبواب بيوتهم ومضافاتهم مفتوحة دائماً للقادمين.' }
    ],
    vocabulary: [
      { ku: 'Mêvanperwer', tr: 'Hospitable / كريم ومحب للضيوف' },
      { ku: 'Malê', tr: 'House / البيت' },
      { ku: 'Xwarin', tr: 'Food / الطعام' },
      { ku: 'Vekirî', tr: 'Open / مفتوح' }
    ]
  }
];

const dialogueScenarios: DialogueScenario[] = [
  {
    id: 'ds1',
    titleKu: 'Hevdîtin û Nasîn',
    titleEn: 'Meeting & Acquaintance',
    titleAr: 'اللقاء الأول والتعارف في العمل والمعهد',
    descriptionKu: 'Mutedeka Azad û Jiyan dema yekem car li zanîngehê li hev rast tên.',
    descriptionEn: 'The dialogue between Azad and Jiyan meeting for the first time at university.',
    descriptionAr: 'حوار تعريفي ملهم بين آزاد وجيان عند لقائهما لأول مرة في الحرم الجامعي.',
    icon: 'Handshake',
    turns: [
      { speaker: 'Azad', avatar: 'Briefcase', gender: 'male', align: 'left', ku: 'Rojbaş! Ez Azad im. Navê te çiye?', en: 'Good morning! I am Azad. What is your name?', ar: 'صباح الخير! أنا آزاد. ما اسمك؟' },
      { speaker: 'Jiyan', avatar: 'Stethoscope', gender: 'female', align: 'right', ku: 'Rojbaş Azad! Navê min Jiyan e. Tu çawa yî?', en: 'Good morning Azad! My name is Jiyan. How are you?', ar: 'صباح الخير آزاد! اسمي جيان. كيف حالك؟' },
      { speaker: 'Azad', avatar: 'Briefcase', gender: 'male', align: 'left', ku: 'Ez baş im, spas. Tu ji ku yî, Jiyan?', en: 'I am doing well, thank you. Where are you from, Jiyan?', ar: 'أنا بخير، شكراً. من أين أنت يا جيان؟' },
      { speaker: 'Jiyan', avatar: 'Stethoscope', gender: 'female', align: 'right', ku: 'Ez ji Qamişloyê me, lê ez li Amedê fêrî bîkolojiyê dibim. Tu?', en: 'I am from Qamishli, but I study biology in Diyarbakir. How about you?', ar: 'أنا من قامشلي، ولكني أدرس علم الأحياء في ديار بكر. وأنت؟' },
      { speaker: 'Azad', avatar: 'Briefcase', gender: 'male', align: 'left', ku: 'Ez ji Helebceyê me. Ez gelek kêfxweş bûm bi nasîna te, Jiyan.', en: 'I am from Halabja. I am very delighted to meet you, Jiyan.', ar: 'أنا من حلبجة. لقد سعدت جداً بلقائك ومعرفتك يا جيان.' },
      { speaker: 'Jiyan', avatar: 'Stethoscope', gender: 'female', align: 'right', ku: 'Spas Azad, ez jî her weha. Serkeftin bo te!', en: 'Thank you Azad, me too. Good luck to you!', ar: 'شكراً آزاد، وأنا كذلك بالتأكيد. التوفيق والنجاح لك!' }
    ]
  },
  {
    id: 'ds2',
    titleKu: 'Di Xwaringehê de',
    titleEn: 'At the Traditional Restaurant',
    titleAr: 'طلب الطعام في مطعم شعبي كوردستاني كلاسيكي',
    descriptionKu: 'Muxabereya Hêriş û Garsonê xwaringeha kurdî ya meşhûr.',
    descriptionEn: 'The dialog between Hêriş and the Waiter at a famous Kurdish food joint.',
    descriptionAr: 'محادثة شيقة وواقعية لطلب المأكولات والمشروبات الشعبية مع النادل.',
    icon: 'Utensils',
    turns: [
      { speaker: 'Garson', avatar: 'ChefHat', gender: 'male', align: 'left', ku: 'Bi xêr hatin! Hûn çi xwarin dixwazin birêz?', en: 'Welcome! What kind of food would you like, sir?', ar: 'أهلاً وسهلاً بكم! أي طعام ترغبون به سيدي؟' },
      { speaker: 'Hêriş', avatar: 'User', gender: 'male', align: 'right', ku: 'Spas be. Ez şorbe, birinc û goştê berxê dixwazim. Gelo selete heye?', en: 'Thank you. I want soup, rice, and lamb meat. Is there any salad?', ar: 'شكراً لك. أريد شوربة، أرزاً، ولحم غنم. هل توجد سلطة خضراء؟' },
      { speaker: 'Garson', avatar: 'ChefHat', gender: 'male', align: 'left', ku: 'Erê, em ê niha amade bikin. Ji bo vexwarinê çi dixwazin?', en: 'Yes, we will prepare it now. What would you like to drink?', ar: 'نعم متوفرة، سنحضرها حالاً. ماذا تطلبون للشرب؟' },
      { speaker: 'Hêriş', avatar: 'User', gender: 'male', align: 'right', ku: 'Avek sar bînin. Û her weha piştî xwarinê çayeke germ bînin.', en: 'Bring cold water. And also, bring hot tea after the meal.', ar: 'أحضر ماءً بارداً. وأيضاً أحضر كوباً من الشاي الساخن بعد الوجبة.' },
      { speaker: 'Garson', avatar: 'ChefHat', gender: 'male', align: 'left', ku: 'Li ser seran û ser çavan! Niha amade dibe.', en: 'On my head and my eyes! It will be ready shortly.', ar: 'على راسي وعيني! سيكون طلباً جاهزاً خلال دقائق.' }
    ]
  }
];

export function Sentences() {
  const { language } = useAuth();
  const navigate = useNavigate();

  // Primary Tab selection
  const [activeTab, setActiveTab] = useState<'everyday' | 'temporal' | 'reading' | 'dialogues'>('everyday');

  // Interactive details hooks
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<DialogueScenario | null>(null);

  // Filter inside temporal sections
  const [temporalFilter, setTemporalFilter] = useState<'morning' | 'evening' | 'occasions'>('morning');

  return (
    <div className="p-4 space-y-6 min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-indigo-100">
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-200/20 dark:bg-indigo-950/25 rounded-full filter blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-3/4 right-5 w-72 h-72 bg-purple-200/15 dark:bg-purple-950/20 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* 1. Page Header navigation — the inline back appears only inside
          nested passage/scenario views; the app header handles the top level */}
      <div className="flex items-center gap-3 py-2 max-w-xl mx-auto">
        {(selectedPassage || selectedScenario) && (
        <button 
          onClick={() => {
            if (selectedPassage) {
              setSelectedPassage(null);
            } else if (selectedScenario) {
              setSelectedScenario(null);
            } else {
              navigate('/');
            }
          }} 
          aria-label={language !== 'ar' ? 'Back' : 'رجوع'} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
          title={language !== 'ar' ? 'Back' : 'رجوع'}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 rtl:-scale-x-100" />
        </button>
        )}
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">
            {language !== 'ar' ? 'Conversational Phrases' : 'جمل ومحادثات ومقالات'}
          </h2>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider mt-1.5 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            {language !== 'ar' ? 'Speak like a local' : 'تحدث كأهل اللغة'}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedPassage && !selectedScenario && (
          <motion.div
            key="hub-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* 2. Brand Card Header Description */}
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-flat border border-line-soft relative overflow-hidden group">
              <MessageSquare className="absolute right-0 bottom-0 opacity-[0.06] w-40 h-40 transform translate-y-8 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-500" />
              <div className="space-y-2 relative z-10 text-start">
                <span className="text-[9px] bg-[#FFF6E0] dark:bg-[#3A2F14] text-[#8A6100] dark:text-[#FFCE6B] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB300] fill-[#FFB300]/40 animate-pulse" />
                  {language !== 'ar' ? 'PHRASEOLOGY PLAYGROUND' : 'منصة تركيب الجمل والمحادثات'}
                </span>
                <h3 className="text-xl font-black mt-2 leading-tight tracking-tight text-ink">
                  {language !== 'ar' ? 'Natural Kurmanji Dialogues' : 'تحدث الكورمانجية بطلاقة تامة'}
                </h3>
                <p className="text-muted text-[11px] leading-relaxed font-semibold">
                  {language !== 'ar' 
                    ? 'Embark on everyday conversational chunks, filter routines, practice paragraph reading, or model immersive characters in dialogue scenarios.' 
                    : 'استعرض جمل الاستخدام اليومي الهامة، التحيات الصباحية والمسائية، مقالات تعليمية للقراءة بفقرات قابلة للتحليل، ومحاكاة محادثات حية واقعية.'}
                </p>
              </div>
            </div>

            {/* 3. Tab Grid choices */}
            <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
              <button
                onClick={() => setActiveTab('everyday')}
                className={`text-center py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all cursor-pointer border-none flex flex-col items-center gap-1 ${
                  activeTab === 'everyday'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{language !== 'ar' ? 'Everyday' : 'يومي'}</span>
              </button>

              <button
                onClick={() => setActiveTab('temporal')}
                className={`text-center py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all cursor-pointer border-none flex flex-col items-center gap-1 ${
                  activeTab === 'temporal'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{language !== 'ar' ? 'Timings' : 'أوقات'}</span>
              </button>

              <button
                onClick={() => setActiveTab('reading')}
                className={`text-center py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all cursor-pointer border-none flex flex-col items-center gap-1 ${
                  activeTab === 'reading'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-600/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>{language !== 'ar' ? 'Reading' : 'قصص وقراءة'}</span>
              </button>

              <button
                onClick={() => setActiveTab('dialogues')}
                className={`text-center py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all cursor-pointer border-none flex flex-col items-center gap-1 ${
                  activeTab === 'dialogues'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-600/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{language !== 'ar' ? 'Dialogues' : 'محادثات'}</span>
              </button>
            </div>

            {/* TAB CONTENT SECTIONS */}

            {/* 3a. Everyday Tab content List */}
            {activeTab === 'everyday' && (
              <div className="space-y-3.5 max-w-xl mx-auto text-start">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {language !== 'ar' ? 'CORE DAILY PHRASES' : 'جمل الاستخدام الضرورية طوال اليوم'}
                  </h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                    {everydayPhrases.length} {language !== 'ar' ? 'Phrases' : 'جملة'}
                  </span>
                </div>

                <div className="space-y-3">
                  {everydayPhrases.map((phrase, idx) => {
                    const isCurrent = expandedId === phrase.id;
                    return (
                      <motion.div
                        key={phrase.id}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, type: 'spring' }}
                        onClick={() => setExpandedId(isCurrent ? null : phrase.id)}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 border-s-4 border-s-indigo-600 dark:border-s-indigo-500 dark:border-slate-800 rounded-2xl flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.025)] hover:border-indigo-300 dark:hover:border-slate-800 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0">
                              {renderSentencesIcon(phrase.emoji, "w-5 h-5 text-indigo-600 dark:text-indigo-400")}
                            </div>
                            <div>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                <bdi>{phrase.ku}</bdi>
                              </h5>
                              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                <bdi>{language !== 'ar' ? phrase.en : phrase.ar}</bdi>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <AudioButton 
                              audioUrl={phrase.audio}
                              textToSpeak={phrase.ku}
                              className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 border-none hover:bg-indigo-100" 
                              iconClassName="w-4 h-4"
                              showProgress={false}
                            />
                          </div>
                        </div>

                        {isCurrent && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 px-1 bg-slate-50/50 dark:bg-slate-950/10 p-2.5 rounded-xl border border-dashed text-[10px] font-medium leading-relaxed"
                          >
                            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black block">Detailed equivalents:</span>
                            <div className="space-y-0.5">
                              <p className="text-slate-600 dark:text-slate-400"><strong className="text-indigo-600">English:</strong> {phrase.en}</p>
                              <p className="text-slate-600 dark:text-slate-400"><strong className="text-indigo-600 font-arabic">العربية:</strong> {phrase.ar}</p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3b. Temporal/Greetings Tab content (Divided morning, evening, occasions with pill filters) */}
            {activeTab === 'temporal' && (
              <div className="space-y-4 max-w-xl mx-auto text-start">
                
                {/* Micro timing filter header switcher pills */}
                <div className="flex p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl gap-0.5 border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setTemporalFilter('morning')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-none flex items-center justify-center gap-1 ${
                      temporalFilter === 'morning'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language !== 'ar' ? 'Morning' : 'تحيات الصباح'}</span>
                  </button>

                  <button
                    onClick={() => setTemporalFilter('evening')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-none flex items-center justify-center gap-1 ${
                      temporalFilter === 'evening'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language !== 'ar' ? 'Evening' : 'المساء والليل'}</span>
                  </button>

                  <button
                    onClick={() => setTemporalFilter('occasions')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border-none flex items-center justify-center gap-1 ${
                      temporalFilter === 'occasions'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <PartyPopper className="w-3.5 h-3.5 text-purple-500" />
                    <span>{language !== 'ar' ? 'Occasions' : 'المناسبات بالأعياد'}</span>
                  </button>
                </div>

                {/* Interactive listing content */}
                <div className="space-y-3">
                  {temporalPhrases
                    .filter(p => p.timeTag === temporalFilter)
                    .map((item, idx) => {
                      const isCurrent = expandedId === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.98, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => setExpandedId(isCurrent ? null : item.id)}
                          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 border-s-4 border-s-indigo-600 dark:border-s-indigo-500 dark:border-slate-800 rounded-2xl flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.025)] hover:border-indigo-300 dark:hover:border-slate-800 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                {renderSentencesIcon(item.emoji, "w-5 h-5 text-indigo-600 dark:text-indigo-400")}
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">
                                  <bdi>{item.ku}</bdi>
                                </h5>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                  <bdi>{language !== 'ar' ? item.en : item.ar}</bdi>
                                </p>
                              </div>
                            </div>

                            <AudioButton 
                              audioUrl={item.audio}
                              textToSpeak={item.ku}
                              className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 border-none hover:bg-indigo-100" 
                              iconClassName="w-4 h-4"
                              showProgress={false}
                            />
                          </div>

                          {isCurrent && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-2.5 rounded-lg text-[10px] text-slate-500 font-semibold space-y-1">
                              <p><strong className="text-indigo-600">Kurdish:</strong> {item.ku}</p>
                              <p><strong className="text-indigo-600">English:</strong> {item.en}</p>
                              <p className="font-arabic"><strong className="text-indigo-600">العربية:</strong> {item.ar}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 3c. Reading Practice Topics (Clicking opens fully expanded reader) */}
            {activeTab === 'reading' && (
              <div className="space-y-4 max-w-xl mx-auto text-start animate-fade-in">
                <div className="flex items-center gap-1.5 px-1">
                  <Compass className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                    {language !== 'ar' ? 'READING PRACTICE PASSAGES' : 'نصوص وقصص كاملة للتدريب على القراءة'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {readingPassages.map((passage, index) => (
                    <motion.div
                      key={passage.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedPassage(passage)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.025)] relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-950/60"
                    >
                      {/* Interactive indicator bar */}
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
                      
                      <div className="flex items-start justify-between gap-4 mt-1">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                            {renderSentencesIcon(passage.icon, "w-6 h-6 text-purple-600 dark:text-purple-400")}
                          </div>
                          <div>
                            <span className="text-[9px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                              {language !== 'ar' ? 'PASSAGE READER' : 'نص قراءة وتفسير'}
                            </span>
                            <h5 className="text-base font-black text-slate-900 dark:text-white mt-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {language !== 'ar' ? passage.titleEn : passage.titleAr}
                            </h5>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic mt-0.5">
                              "{passage.titleKu}"
                            </p>
                          </div>
                        </div>

                        <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full group-hover:bg-purple-50 transition-colors">
                          <ChevronRight className="w-5 h-5 text-purple-500" />
                        </div>
                      </div>

                      <div className="mt-4 bg-slate-50/80 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/40 border-dashed">
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed italic">
                          "{passage.fullKu}"
                        </p>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between text-[11px] font-extrabold text-purple-600">
                        <span>{passage.sentences.length} {language !== 'ar' ? 'interactive chunks' : 'جمل تدريب تفاعلية'}</span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          {language !== 'ar' ? 'Start Reading' : 'ابدأ ممارسة القراءة'} &rarr;
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 3d. Interactive Dialogues tab */}
            {activeTab === 'dialogues' && (
              <div className="space-y-4 max-w-xl mx-auto text-start">
                <div className="flex items-center gap-1.5 px-1">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                    {language !== 'ar' ? 'IMMERSED CHARACTER CONVERSATIONS' : 'المحادثات التفاعلية والسيناريوهات الحلقية'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {dialogueScenarios.map((scenario, index) => (
                    <motion.div
                      key={scenario.id}
                      initial={{ opacity: 0, scale: 0.98, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedScenario(scenario)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.025)] relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-950/60"
                    >
                      {/* Ambient Accent slide bar */}
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />

                      <div className="flex items-start justify-between gap-4 mt-1">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/45 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                            {renderSentencesIcon(scenario.icon, "w-6 h-6 text-purple-600 dark:text-purple-400")}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                {language !== 'ar' ? 'MULTI-CHARACTER' : 'تعدد شخصيات'}
                              </span>
                            </div>
                            <h5 className="text-base font-black text-slate-900 dark:text-white mt-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {language !== 'ar' ? scenario.titleEn : scenario.titleAr}
                            </h5>
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                              "{scenario.titleKu}"
                            </p>
                          </div>
                        </div>

                        <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full group-hover:bg-purple-50 transition-colors">
                          <ChevronRight className="w-5 h-5 text-purple-500" />
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {language !== 'ar' ? scenario.descriptionEn : scenario.descriptionAr}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] font-black">
                        <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                          {scenario.turns.slice(0, 3).map((turn, tIdx) => (
                            <div key={tIdx} className="w-6 h-6 rounded-full border border-white dark:border-slate-800 bg-slate-200 flex items-center justify-center shadow-2xs">
                              {renderSentencesIcon(turn.avatar, "w-3.5 h-3.5 text-slate-500 dark:text-slate-400")}
                            </div>
                          ))}
                        </div>
                        <span className="text-purple-600 hover:underline">
                          {language !== 'ar' ? 'Open Dialogue Scenario' : 'ابدأ تشغيل المحادثة'} &rarr;
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 4. EXPANDED PASAGE READING COMPONENT VIEW */}
        {selectedPassage && (
          <motion.div
            key="selected-passage-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-xl mx-auto space-y-6 text-start"
          >
            {/* Passage Hero Boarder Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center gap-4">
                <span className="text-5xl shrink-0 drop-shadow-md">{selectedPassage.icon}</span>
                <div>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {language !== 'ar' ? 'PRACTICE MODULE' : 'دراسة وتدريب لغوي'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {language !== 'ar' ? selectedPassage.titleEn : selectedPassage.titleAr}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic">
                    "{selectedPassage.titleKu}"
                  </p>
                </div>
              </div>

              {/* Full Original Kurdish Text reading display */}
              <div className="mt-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-950/60 dark:to-slate-950/40 border border-indigo-100/50 dark:border-slate-800/80 p-5 rounded-[22px] leading-relaxed relative">
                <h4 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">Original Text • النص الأصلي للفقرة</h4>
                <p className="text-base font-black text-slate-900 dark:text-white leading-loose tracking-wide">
                  <bdi>{selectedPassage.fullKu}</bdi>
                </p>
                <div className="mt-3.5 pt-3 border-t border-indigo-100/60 dark:border-indigo-950/40 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <strong>Arabic:</strong> {selectedPassage.fullAr}
                </div>
              </div>
            </div>

            {/* Line-by-line detailed practice analysis */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider px-1">
                {language !== 'ar' ? 'LINE-BY-LINE ANALYSIS' : 'تحليل النص وتقسيمه جملة بعد جملة ورقة مفردات'}
              </h4>

              <div className="space-y-3">
                {selectedPassage.sentences.map((sentence, sIdx) => (
                  <motion.div
                    key={sIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sIdx * 0.04 }}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2 shadow-2xs group hover:border-indigo-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400 px-2 py-0.5 rounded">
                          0{sIdx + 1}
                        </span>
                        <h5 className="text-base font-black text-slate-900 dark:text-white">
                          <bdi>{sentence.ku}</bdi>
                        </h5>
                      </div>
                      {/* AUDIT FIX: this button previously had audioUrl="" and was
                          permanently disabled — dead UI. It now pronounces the
                          sentence via the SpeechSynthesis fallback. */}
                      <AudioButton
                        textToSpeak={sentence.ku}
                        className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 border-none hover:bg-indigo-100"
                        iconClassName="w-4 h-4"
                        showProgress={false}
                      />
                    </div>
                    
                    <div className="mt-1 pt-2.5 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-1 text-[11px] text-slate-500">
                      <p><strong className="text-indigo-600 font-extrabold">English:</strong> {sentence.en}</p>
                      <p className="font-arabic"><strong className="text-indigo-600 font-extrabold">العربية:</strong> {sentence.ar}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Key Vocabulary board */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3.5">
              <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {language !== 'ar' ? 'CURATED VOCABULARY IN PASSAGE' : 'مفردات هامة مستخرجة من النص'}
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                {selectedPassage.vocabulary.map((vocab, vIdx) => (
                  <div key={vIdx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">{vocab.ku}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 block">{vocab.tr}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Back actions button */}
            <button
              onClick={() => setSelectedPassage(null)}
              className="py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-sm rounded-[20px] w-full shadow-lg shadow-indigo-600/10 hover:shadow-indigo-700/20 active:scale-98 transition-all border-none"
            >
              {language !== 'ar' ? 'Keep Learning • Back to Chapters' : 'إتمام القراءة والرجوع للأقسام'}
            </button>
          </motion.div>
        )}

        {/* 5. INTERACTIVE COMPREHENSIVE DIALOGUE SCREEN */}
        {selectedScenario && (
          <motion.div
            key="selected-dialogue-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-xl mx-auto space-y-6 text-start"
          >
            {/* Scenario Header information plack */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-5 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  {selectedScenario.icon}
                </div>
                <div>
                  <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                    DIALOGUE SCENARIO
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {language !== 'ar' ? selectedScenario.titleEn : selectedScenario.titleAr}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[240px] md:max-w-xs">
                    "{selectedScenario.titleKu}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedScenario(null)}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black rounded-xl text-xs border-none cursor-pointer"
              >
                {language !== 'ar' ? 'Close' : 'إغلاق'}
              </button>
            </div>

            {/* Simulated live chat message log transcript bubbles */}
            <div className="bg-slate-100/50 dark:bg-slate-900/40 p-5 rounded-[32px] border border-slate-200/40 dark:border-slate-800/80 space-y-5 relative">
              
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-black text-slate-400 shadow-3xs pointer-events-none">
                Interactive Transcript
              </div>

              <div className="pt-4 space-y-6">
                {selectedScenario.turns.map((turn, tIdx) => {
                  const isLeftAlign = turn.align === 'left';
                  return (
                    <motion.div
                      key={tIdx}
                      initial={{ opacity: 0, x: isLeftAlign ? -15 : 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: tIdx * 0.08, type: 'spring' }}
                      className={`flex gap-3 items-end max-w-[85%] ${
                        isLeftAlign ? 'me-auto flex-row' : 'ms-auto flex-row-reverse'
                      }`}
                    >
                      {/* Avatar Bubble */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-xs hover:scale-105 transition-transform">
                          {renderSentencesIcon(turn.avatar, "w-5 h-5 text-indigo-600 dark:text-indigo-400")}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 mt-1 dark:text-slate-500">
                          {turn.speaker}
                        </span>
                      </div>

                      {/* Speech box bubble */}
                      <div className="flex flex-col gap-1 flex-1">
                        <div className={`p-4 rounded-[22px] shadow-3xs group relative ${
                          isLeftAlign
                            ? 'bg-white dark:bg-slate-800 rounded-bl-none text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800'
                            : 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-br-none'
                        }`}>
                          <h5 className="text-sm font-black leading-relaxed">
                            <bdi>{turn.ku}</bdi>
                          </h5>
                          
                          {/* Inner simple translations display */}
                          <div className={`mt-2 pt-2 border-t text-[11px] leading-relaxed select-text font-medium ${
                            isLeftAlign 
                              ? 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400' 
                              : 'border-white/10 text-indigo-100'
                          }`}>
                            <p className="flex items-center gap-1.5"><strong className="opacity-75">EN:</strong> {turn.en}</p>
                            <p className="font-arabic flex items-center gap-1.5 mt-0.5"><strong className="opacity-75">AR:</strong> {turn.ar}</p>
                          </div>

                          {/* Quick audio player node */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <AudioButton 
                              audioUrl={turn.audio}
                              textToSpeak={turn.ku}
                              className={`p-1.5 border-none shadow-none ${
                                isLeftAlign ? 'bg-indigo-50 text-indigo-600' : 'bg-white/20 text-white'
                              }`}
                              iconClassName="w-3.5 h-3.5"
                              showProgress={false}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Dialogue study takeaways */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {language !== 'ar' ? 'CONVERSATION METHODOLOGY KEYS' : 'مفاتيح التفاعل والطلاقة اللغوية'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {language !== 'ar' 
                  ? 'Tap the audio button inside each dialogue turn to capture accents, model tone matching, and study the context of Kurdish honorifics like "ser seran û ser çavan" (with great honor).' 
                  : 'اضغط على رمز الصوت داخل أي فقرة حوارية للتعرف على اللحن الصوتي ومخارج الكلمات، كرر العبارات مع تغيير الضمائر لزيادة ثقتك بالتحدث مباشرة.'}
              </p>
            </div>

            {/* Back action */}
            <button
              onClick={() => setSelectedScenario(null)}
              className="py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black text-sm rounded-[20px] w-full shadow-lg shadow-purple-600/10 hover:shadow-purple-700/20 active:scale-97 transition-all border-none"
            >
              {language !== 'ar' ? 'Finish Conversation Study' : 'إنهاء دراسة المحادثة والعودة'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

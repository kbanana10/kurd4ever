export interface LessonWord {
  id: string;
  ku: string;
  en: string;
  ar: string;
  emoji: string;
  audio: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Lesson {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: string;
  xpReward: number;
  words: LessonWord[];
}

export interface CEFRLevel {
  id: string; // 'A1', 'A2', 'B1', 'B2', 'Advanced'
  title: string;
  descEn: string;
  descAr: string;
  requiredXp: number;
  color: string;
  lessons: Lesson[];
}

export const learningPath: CEFRLevel[] = [
  {
    id: "A1",
    title: "Beginner A1",
    descEn: "Basic foundations, family greetings, and natural domains.",
    descAr: "الأساسيات والمبادئ الأولية، مفردات العائلة والترحيب وعناصر الطبيعة.",
    requiredXp: 0,
    color: "from-emerald-500 to-green-600",
    lessons: [
      {
        id: "a1_family",
        titleEn: "Family & Relatives",
        titleAr: "العائلة والقرابة",
        descEn: "Learn to address primary household names under familial terms.",
        descAr: "تعلم نطق وكتابة أفراد العائلة والأقارب بلغة كوردية صحيحة.",
        icon: "Users",
        xpReward: 30,
        words: [
          { id: "f_mom", ku: "Dayik", en: "Mother", ar: "أُم", emoji: "👩", audio: "/audio/family/mother.mp3", category: "family", difficulty: "easy" },
          { id: "f_dad", ku: "Bav", en: "Father", ar: "أب", emoji: "👨", audio: "/audio/family/father.mp3", category: "family", difficulty: "easy" },
          { id: "f_bro", ku: "Bra", en: "Brother", ar: "شقيق / أخ", emoji: "👦", audio: "/audio/family/brother.mp3", category: "family", difficulty: "easy" },
          { id: "f_sis", ku: "Xwişk", en: "Sister", ar: "شقيقة / أخت", emoji: "👧", audio: "/audio/family/sister.mp3", category: "family", difficulty: "easy" },
          { id: "f_grandmom", ku: "Dapîr", en: "Grandmother", ar: "جدة", emoji: "👵", audio: "/audio/family/grandmom.mp3", category: "family", difficulty: "medium" },
          { id: "f_granddad", ku: "Bapîr", en: "Grandfather", ar: "جد", emoji: "👴", audio: "/audio/family/granddad.mp3", category: "family", difficulty: "medium" }
        ]
      },
      {
        id: "a1_nature",
        titleEn: "Nature & Wilderness",
        titleAr: "الطبيعة والبيئة",
        descEn: "Describe mountains, trees, water, and outdoor elements.",
        descAr: "تعلم أسماء معالم الطبيعة كالجبال والوديان والماء باللغة الكرمانجية.",
        icon: "TreePine",
        xpReward: 30,
        words: [
          { id: "nat_water", ku: "Av", en: "Water", ar: "ماء", emoji: "💧", audio: "/audio/nature/water.mp3", category: "nature", difficulty: "easy" },
          { id: "nat_tree", ku: "Dar", en: "Tree", ar: "شجرة", emoji: "🌳", audio: "/audio/nature/tree.mp3", category: "nature", difficulty: "easy" },
          { id: "nat_mtn", ku: "Çiya", en: "Mountain", ar: "جبل", emoji: "🏔️", audio: "/audio/nature/mountain.mp3", category: "nature", difficulty: "medium" },
          { id: "nat_river", ku: "Rûbar", en: "River", ar: "نهر", emoji: "🏞️", audio: "/audio/nature/river.mp3", category: "nature", difficulty: "medium" },
          { id: "nat_sun", ku: "Roj", en: "Sun", ar: "شمس", emoji: "☀️", audio: "/audio/nature/sun.mp3", category: "nature", difficulty: "easy" },
          { id: "nat_flower", ku: "Kulîlk", en: "Flower", ar: "زهرة / وردة", emoji: "🌸", audio: "/audio/nature/flower.mp3", category: "nature", difficulty: "hard" }
        ]
      }
    ]
  },
  {
    id: "A2",
    title: "Beginner A2",
    descEn: "Interactive objects, animals, food, and basic navigation transportation.",
    descAr: "الأمور التفاعلية، الحيوانات اليومية، أصناف الأطعمة، ووسائل النقل والتحرك السريع.",
    requiredXp: 150,
    color: "from-sky-500 to-blue-600",
    lessons: [
      {
        id: "a2_animals",
        titleEn: "Animal Kingdom",
        titleAr: "مملكة الحيوان",
        descEn: "Master names of wild and domestic birds, dogs, cats, and mammals.",
        descAr: "تعلم الكلمات الخاصة بأسماء الحيوانات الأليفة والبرية وأصواتها.",
        icon: "Cat",
        xpReward: 35,
        words: [
          { id: "ani_cat", ku: "Pisîk", en: "Cat", ar: "قطة", emoji: "🐱", audio: "/audio/animals/cat.mp3", category: "animals", difficulty: "easy" },
          { id: "ani_dog", ku: "Se / Kûçik", en: "Dog", ar: "كلب", emoji: "🐶", audio: "/audio/animals/dog.mp3", category: "animals", difficulty: "easy" },
          { id: "ani_bird", ku: "Çûk / Teyr", en: "Bird", ar: "طائر", emoji: "🐦", audio: "/audio/animals/bird.mp3", category: "animals", difficulty: "easy" },
          { id: "ani_horse", ku: "Hesp", en: "Horse", ar: "حصان", emoji: "🐴", audio: "/audio/animals/horse.mp3", category: "animals", difficulty: "medium" },
          { id: "ani_wolf", ku: "Gur", en: "Wolf", ar: "ذئب", emoji: "🐺", audio: "/audio/animals/wolf.mp3", category: "animals", difficulty: "medium" },
          { id: "ani_fish", ku: "Masî", en: "Fish", ar: "سمكة", emoji: "🐟", audio: "/audio/animals/fish.mp3", category: "animals", difficulty: "easy" }
        ]
      },
      {
        id: "a2_food",
        titleEn: "Food & Meals",
        titleAr: "الطعام والتغذية",
        descEn: "Name basic commodities like bread, honey, tea, and dining items.",
        descAr: "مسميات العناصر الغذائية الأساسية كالخبز والعسل والشاي والجبن.",
        icon: "Utensils",
        xpReward: 35,
        words: [
          { id: "fd_bread", ku: "Nan", en: "Bread", ar: "خبز", emoji: "🍞", audio: "/audio/food/bread.mp3", category: "food", difficulty: "easy" },
          { id: "fd_milk", ku: "Şîr", en: "Milk", ar: "حليب", emoji: "🥛", audio: "/audio/food/milk.mp3", category: "food", difficulty: "easy" },
          { id: "fd_cheese", ku: "Penîr", en: "Cheese", ar: "جبن", emoji: "🧀", audio: "/audio/food/cheese.mp3", category: "food", difficulty: "medium" },
          { id: "fd_sugar", ku: "Şekir", en: "Sugar", ar: "سكر", emoji: "🍬", audio: "/audio/food/sugar.mp3", category: "food", difficulty: "easy" },
          { id: "fd_honey", ku: "Hingiv", en: "Honey", ar: "عسل", emoji: "🍯", audio: "/audio/food/honey.mp3", category: "food", difficulty: "medium" },
          { id: "fd_apple", ku: "Sêv", en: "Apple", ar: "تفاحة", emoji: "🍎", audio: "/audio/food/apple.mp3", category: "food", difficulty: "easy" }
        ]
      },
      {
        id: "a2_transport",
        titleEn: "Transportation",
        titleAr: "وسائل المواصلات والنقل",
        descEn: "Understand essential terms for cars, trains, airplanes, and streets.",
        descAr: "مفردات السيارات، الطائرات، القطارات والشوارع بالكوردية.",
        icon: "Car",
        xpReward: 35,
        words: [
          { id: "tr_car", ku: "Erebe / Otomobîl", en: "Car", ar: "سيارة", emoji: "🚗", audio: "/audio/transportation/car.mp3", category: "transportation", difficulty: "easy" },
          { id: "tr_bus", ku: "Otobus", en: "Bus", ar: "حافلة", emoji: "🚌", audio: "/audio/transportation/bus.mp3", category: "transportation", difficulty: "easy" },
          { id: "tr_train", ku: "Trên", en: "Train", ar: "قطار", emoji: " train", audio: "/audio/transportation/train.mp3", category: "transportation", difficulty: "medium" },
          { id: "tr_plane", ku: "Balafir", en: "Airplane", ar: "طائرة", emoji: "✈️", audio: "/audio/transportation/plane.mp3", category: "transportation", difficulty: "hard" },
          { id: "tr_ship", ku: "Keştî", en: "Ship", ar: "سفينة", emoji: "🚢", audio: "/audio/transportation/ship.mp3", category: "transportation", difficulty: "hard" },
          { id: "tr_cycle", ku: "Bisîklet", en: "Bicycle", ar: "دراجة هوائية", emoji: "🚲", audio: "/audio/transportation/bicycle.mp3", category: "transportation", difficulty: "medium" }
        ]
      }
    ]
  },
  {
    id: "B1",
    title: "Intermediate B1",
    descEn: "Expressing travel directives, emotions, and local situations.",
    descAr: "التوجيهات والمسارات عند السفر، التعبير عن المشاعر، والمحادثات الحيوية البسيطة.",
    requiredXp: 450,
    color: "from-indigo-500 to-purple-600",
    lessons: [
      {
        id: "b1_travel",
        titleEn: "Travel & Hospitality",
        titleAr: "السفر والضيافة",
        descEn: "Navigate hotels, passport controls, airports, and ask directions.",
        descAr: "عبارات الفنادق والمطارات، حقيبة اليد، والمستندات الرسمية وإعطاء التوجيهات.",
        icon: "Plane",
        xpReward: 40,
        words: [
          { id: "tv_passport", ku: "Pasaport", en: "Passport", ar: "جواز سفر", emoji: "🛂", audio: "/audio/travel/passport.mp3", category: "travel", difficulty: "easy" },
          { id: "tv_hotel", ku: "Otel", en: "Hotel", ar: "فندق", emoji: "🏨", audio: "/audio/travel/hotel.mp3", category: "travel", difficulty: "easy" },
          { id: "tv_bag", ku: "Çente / Sandoq", en: "Suitcase", ar: "حقيبة سفر", emoji: "🧳", audio: "/audio/travel/suitcase.mp3", category: "travel", difficulty: "medium" },
          { id: "tv_map", ku: "Nexşe", en: "Map", ar: "خريطة", emoji: "🗺️", audio: "/audio/travel/map.mp3", category: "travel", difficulty: "medium" },
          { id: "tv_ticket", ku: "Bîlet", en: "Ticket", ar: "تذكرة", emoji: "🎫", audio: "/audio/travel/ticket.mp3", category: "travel", difficulty: "easy" },
          { id: "tv_road", ku: "Rê", en: "Way / Road", ar: "طريق", emoji: "🛣️", audio: "/audio/travel/road.mp3", category: "travel", difficulty: "medium" }
        ]
      },
      {
        id: "b1_emotions",
        titleEn: "Emotions & Feelings",
        titleAr: "المشاعر والعواطف",
        descEn: "Describe happiness, anger, sadness, fear, and fatigue.",
        descAr: "تعلم نطق مشاعر السعادة، الحزن، الخوف، الغضب، والتعب بالكوردية.",
        icon: "Heart",
        xpReward: 40,
        words: [
          { id: "em_happy", ku: "Dilşad / Keyfxweş", en: "Happy", ar: "سعيد", emoji: "😊", audio: "/audio/emotions/happy.mp3", category: "emotions", difficulty: "easy" },
          { id: "em_sad", ku: "Xemgîn", en: "Sad", ar: "حزين", emoji: "😢", audio: "/audio/emotions/sad.mp3", category: "emotions", difficulty: "easy" },
          { id: "em_angry", ku: "Hêrsbûyî", en: "Angry", ar: "غاضب", emoji: "😠", audio: "/audio/emotions/angry.mp3", category: "emotions", difficulty: "medium" },
          { id: "em_tired", ku: "Westyayî", en: "Tired", ar: "تعبان / مرهق", emoji: "😫", audio: "/audio/emotions/tired.mp3", category: "emotions", difficulty: "medium" },
          { id: "em_afraid", ku: "Tirsiyayî", en: "Scared", ar: "خائف", emoji: "😨", audio: "/audio/emotions/scared.mp3", category: "emotions", difficulty: "hard" },
          { id: "em_excited", ku: "Bicoş", en: "Excited", ar: "متحمس", emoji: "🤩", audio: "/audio/emotions/excited.mp3", category: "emotions", difficulty: "hard" }
        ]
      },
      {
        id: "b1_conversation",
        titleEn: "Daily Conversation",
        titleAr: "جمل المحادثة اليومية",
        descEn: "Engage in friendly chat, ask about health, and state replies.",
        descAr: "خوض غمار الترحيب اللطيف، والسؤال عن الحال وتقديم عبارات الشكر والامتنان.",
        icon: "MessageCircle",
        xpReward: 40,
        words: [
          { id: "conv_hello", ku: "Slav", en: "Hello", ar: "مرحباً", emoji: "👋", audio: "/audio/conversation/hello.mp3", category: "daily_conversation", difficulty: "easy" },
          { id: "conv_thanks", ku: "Spas", en: "Thank you", ar: "شكراً", emoji: "🙏", audio: "/audio/conversation/thanks.mp3", category: "daily_conversation", difficulty: "easy" },
          { id: "conv_how", ku: "Çon î?", en: "How are you?", ar: "كيف حالك؟", emoji: "❓", audio: "/audio/conversation/how_are_you.mp3", category: "daily_conversation", difficulty: "medium" },
          { id: "conv_good", ku: "Ez baş im", en: "I am fine", ar: "أنا بخير", emoji: "👍", audio: "/audio/conversation/fine.mp3", category: "daily_conversation", difficulty: "easy" },
          { id: "conv_bye", ku: "Bi xatire te", en: "Goodbye", ar: "مع السلامة", emoji: "👋", audio: "/audio/conversation/goodbye.mp3", category: "daily_conversation", difficulty: "medium" },
          { id: "conv_welcome", ku: "Bi xêr hatî", en: "Welcome", ar: "أهلاً وسهلاً بك", emoji: "🤝", audio: "/audio/conversation/welcome.mp3", category: "daily_conversation", difficulty: "medium" }
        ]
      }
    ]
  },
  {
    id: "B2",
    title: "Intermediate B2",
    descEn: "Advanced domains of technology, university lectures, physics, and medical checkups.",
    descAr: "العوالم المتقدمة لتقنيات الحاسوب والإنترنت والفيزياء، والمواقع الطبية والمصطلحات الجامعية.",
    requiredXp: 800,
    color: "from-purple-500 to-pink-600",
    lessons: [
      {
        id: "b2_technology",
        titleEn: "Technology & Computing",
        titleAr: "التكنولوجيا والاتصالات",
        descEn: "Learn computer names, internet software, and communication media icons.",
        descAr: "أدوات التكنولوجيا المتقدمة، شاشات الحواسيب، البرمجيات وشبكة المعلومات.",
        icon: "Laptop",
        xpReward: 45,
        words: [
          { id: "tech_computer", ku: "Kompûter / Kompîter", en: "Computer", ar: "حاسوب", emoji: "💻", audio: "/audio/tech/computer.mp3", category: "technology", difficulty: "easy" },
          { id: "tech_net", ku: "Înternet", en: "Internet", ar: "الإنترنت", emoji: "🌐", audio: "/audio/tech/internet.mp3", category: "technology", difficulty: "easy" },
          { id: "tech_phone", ku: "Telefon / Mobayl", en: "Phone", ar: "هاتف", emoji: "📱", audio: "/audio/tech/phone.mp3", category: "technology", difficulty: "easy" },
          { id: "tech_site", ku: "Malper", en: "Website", ar: "موقع إلكتروني", emoji: "📄", audio: "/audio/tech/website.mp3", category: "technology", difficulty: "hard" },
          { id: "tech_prog", ku: "Bername", en: "Software / Program", ar: "برنامج", emoji: "💾", audio: "/audio/tech/program.mp3", category: "technology", difficulty: "medium" },
          { id: "tech_code", ku: "Kod / Pîlot", en: "Code / Cipher", ar: "شفرة برمجة", emoji: "🧮", audio: "/audio/tech/code.mp3", category: "technology", difficulty: "hard" }
        ]
      },
      {
        id: "b2_university",
        titleEn: "University & Research",
        titleAr: "التعليم الجامعي والبحث العلمي",
        descEn: "Express exams, lecture theaters, research criteria, and academic ranks.",
        descAr: "مصطلحات الامتحانات، المدرج الدراسي، مراتب العلوم، وبحوث التخرج والدرجات.",
        icon: "Landmark",
        xpReward: 45,
        words: [
          { id: "uni_prof", ku: "Profesor", en: "Professor", ar: "أستاذ جامعي", emoji: "👨‍🏫", audio: "/audio/academic/professor.mp3", category: "university", difficulty: "easy" },
          { id: "uni_exam", ku: "Ezmûn / Îmtîhan", en: "Exam", ar: "امتحان", emoji: "📄", audio: "/audio/academic/exam.mp3", category: "university", difficulty: "easy" },
          { id: "uni_deg", ku: "Bawername", en: "Degree / Certificate", ar: "شهادة جامعية", emoji: "🎓", audio: "/audio/academic/degree.mp3", category: "university", difficulty: "hard" },
          { id: "uni_research", ku: "Lêkolîn", en: "Research", ar: "بحث علمي", emoji: "🔬", audio: "/audio/academic/research.mp3", category: "university", difficulty: "hard" },
          { id: "uni_lesson", ku: "Wane", en: "Lecture / Lesson", ar: "محاضرة / درس", emoji: "📖", audio: "/audio/academic/lecture.mp3", category: "university", difficulty: "medium" },
          { id: "uni_std", ku: "Xwendekar", en: "Student", ar: "طالب علم", emoji: "🧑‍🎓", audio: "/audio/academic/student.mp3", category: "university", difficulty: "medium" }
        ]
      },
      {
        id: "b2_medical",
        titleEn: "Medical & Health",
        titleAr: "المصطلحات الطبية والصحة",
        descEn: "Describe clinic items, prescription drugs, fever, doctors and nurse tasks.",
        descAr: "العيادات الطبية، الأدوية، تخصص الأطباء وطاقم التمريض والصحة العامة.",
        icon: "Stethoscope",
        xpReward: 45,
        words: [
          { id: "med_doc", ku: "Bijîşk / Doktor", en: "Doctor", ar: "طبيب", emoji: "👨‍⚕️", audio: "/audio/medical/doctor.mp3", category: "medical", difficulty: "easy" },
          { id: "med_nurse", ku: "Perîstar", en: "Nurse", ar: "ممرض / ممرضة", emoji: "👩‍⚕️", audio: "/audio/medical/nurse.mp3", category: "medical", difficulty: "hard" },
          { id: "med_pils", ku: "Derman", en: "Medicine", ar: "دواء", emoji: "💊", audio: "/audio/medical/medicine.mp3", category: "medical", difficulty: "medium" },
          { id: "med_hosp", ku: "Nexweşxane", en: "Hospital", ar: "مستشفى", emoji: "🏥", audio: "/audio/medical/hospital.mp3", category: "medical", difficulty: "hard" },
          { id: "med_fever", ku: "Tay", en: "Fever / Heat", ar: "حمى / حرارة", emoji: "🤒", audio: "/audio/medical/fever.mp3", category: "medical", difficulty: "easy" },
          { id: "med_pain", ku: "Êş / Jan", en: "Pain", ar: "ألم / وجع", emoji: "🤕", audio: "/audio/medical/pain.mp3", category: "medical", difficulty: "medium" }
        ]
      }
    ]
  },
  {
    id: "Advanced",
    title: "Advanced C1",
    descEn: "Professional operations, business transactions, corporate roles, and advanced idioms.",
    descAr: "المعاملات المهنية والتجارية المتقدمة، وظائف الشركات والمؤسسات، والتعبيرات الاصطلاحية العميقة.",
    requiredXp: 1300,
    color: "from-amber-500 to-rose-600",
    lessons: [
      {
        id: "c1_business",
        titleEn: "Business & Corporate",
        titleAr: "الأعمال والشركات",
        descEn: "Master corporate dialogue, office spaces, salaries, and executive hierarchy.",
        descAr: "مفردات بيئة العمل، الرواتب والعملات، وعقد الاجتماعات والقيادة بالكوردية.",
        icon: "Briefcase",
        xpReward: 50,
        words: [
          { id: "biz_office", ku: "Ofîs / Buroyî", en: "Office", ar: "مكتب عمل", emoji: "🏢", audio: "/audio/business/office.mp3", category: "business", difficulty: "easy" },
          { id: "biz_boss", ku: "Serok / Rêveber", en: "Manager / Boss", ar: "مدير / رئيس", emoji: "🧳", audio: "/audio/business/manager.mp3", category: "business", difficulty: "medium" },
          { id: "biz_wage", ku: "Meaş", en: "Salary", ar: "راتب شهر", emoji: "💵", audio: "/audio/business/salary.mp3", category: "business", difficulty: "medium" },
          { id: "biz_meeting", ku: "Civîn", en: "Meeting", ar: "اجتماع", emoji: "🤝", audio: "/audio/business/meeting.mp3", category: "business", difficulty: "hard" },
          { id: "biz_contract", ku: "Peyman", en: "Contract / Treaty", ar: "عقد اتفاق", emoji: "📄", audio: "/audio/business/contract.mp3", category: "business", difficulty: "hard" },
          { id: "biz_work", ku: "Kar / Şixul", en: "Work / Job", ar: "عمل / وظيفة", emoji: "🔧", audio: "/audio/business/work.mp3", category: "business", difficulty: "easy" }
        ]
      }
    ]
  }
];

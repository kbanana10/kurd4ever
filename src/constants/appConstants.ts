/**
 * appConstants.ts
 * 
 * Central constants registry for gamification thresholds, avatar profile cards, 
 * and localization settings. Makes system parameters easy to tune and synchronize.
 */

 // 100 XP represents 1 global level progression


export const AVATARS = [
  { id: 'av-1', icon: 'user', color: 'bg-blue-100 text-blue-600' },
  { id: 'av-2', icon: 'smile', color: 'bg-rose-100 text-rose-600' },
  { id: 'av-3', icon: 'graduation-cap', color: 'bg-amber-100 text-amber-600' },
  { id: 'av-4', icon: 'flame', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'av-5', icon: 'sparkles', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'av-6', icon: 'star', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { id: 'av-7', icon: 'compass', color: 'bg-slate-100 text-slate-600' },
  { id: 'av-8', icon: 'award', color: 'bg-yellow-100 text-yellow-600' }
];

export const KURDISH_REGIONS = [
  { id: '', labelEn: 'Prefer not to say', labelAr: 'أفضل عدم القول' },
  { id: 'rojava', labelEn: 'Rojava', labelAr: 'روج آفا' },
  { id: 'bashur', labelEn: 'Başûr', labelAr: 'باشور' },
  { id: 'bakur', labelEn: 'Bakur', labelAr: 'باكور' },
  { id: 'rojhilat', labelEn: 'Rojhilat', labelAr: 'روجهلات' },
  { id: 'diaspora', labelEn: 'Diaspora', labelAr: 'المهجر' },
  { id: 'other', labelEn: 'Other', labelAr: 'أخرى' }
];


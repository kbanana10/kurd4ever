/**
 * ReminderService.ts
 * 
 * Scheduled daily notifications and local alerts engine.
 * Protects users streak by reminding them to study when daily goals have not been fully met.
 * Portable and ready for integration with Native Android Notification Managers.
 */

import { Language } from '../models/user';

export interface ReminderSettings {
  enabled: boolean;
  hour: number; // 0-23
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  hour: 18, // Default to 6:00 PM (18:00)
};

export function getReminderSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem('kurdish_quest_reminder_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse reminder settings', e);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

export function saveReminderSettings(settings: ReminderSettings): void {
  localStorage.setItem('kurdish_quest_reminder_settings', JSON.stringify(settings));
}

export function supportsNotifications(): boolean {
  return globalThis.window !== undefined && 'Notification' in window;
}

export function isNotificationPermissionGranted(): boolean {
  if (!supportsNotifications()) return false;
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!supportsNotifications()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Error requesting notification permission', e);
    return false;
  }
}

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasUserStudiedToday(lastActiveTime: number | undefined | null): boolean {
  if (!lastActiveTime) return false;
  
  const lastActiveDate = new Date(lastActiveTime).toDateString();
  const todayDate = new Date().toDateString();
  
  return lastActiveDate === todayDate;
}

export interface ReminderCheckResult {
  triggered: boolean;
  message: string;
  title: string;
}

export interface ReminderContent {
  title: string;
  body: string;
}

export function checkAndTriggerReminder(
  lastActiveTime: number | undefined | null,
  lang: Language
): ReminderCheckResult {
  const result: ReminderCheckResult = { triggered: false, message: '', title: '' };
  const settings = getReminderSettings();
  
  if (!settings.enabled) return result;
  
  if (hasUserStudiedToday(lastActiveTime)) {
    return result;
  }
  
  const currentHour = new Date().getHours();
  if (currentHour < settings.hour) {
    return result;
  }
  
  const todayStr = getTodayDateString();
  const notifiedDatesStr = localStorage.getItem('kurdish_quest_notified_dates') || '';
  const notifiedDates = notifiedDatesStr.split(',').filter(Boolean);
  
  if (notifiedDates.includes(todayStr)) {
    return result;
  }
  
  const details = getReminderContent(lang);
  notifiedDates.push(todayStr);
  if (notifiedDates.length > 7) {
    notifiedDates.shift();
  }
  localStorage.setItem('kurdish_quest_notified_dates', notifiedDates.join(','));
  
  triggerNativeNotification(details.title, details.body);
  
  return {
    triggered: true,
    title: details.title,
    message: details.body,
  };
}

function triggerNativeNotification(title: string, body: string): boolean {
  if (supportsNotifications() && isNotificationPermissionGranted()) {
    try {
      new Notification(title, {
        body: body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.png',
        tag: 'streak-reminder',
      });
      return true;
    } catch (e) {
      console.error('Failed to trigger native notification', e);
    }
  }
  return false;
}

export function getReminderContent(lang: Language): ReminderContent {
  if (lang === 'ku') {
    return {
      title: 'Kwesta Kurdî: Rêza Xwe Biparêze!',
      body: 'Asta nû li benda te ye! Îro 1 deqeyê veqetîne ji bo pratîka Kurdî û domandina rêza hînbûna xwe.',
    };
  }
  if (lang === 'ar') {
    return {
      title: 'تحدي الكردية: حافظ على حماسك!',
      body: 'المستوى القادم بانتظارك! خصص دقيقة واحدة الآن للتدرب على الكلمات الكردية والحفاظ على أيامك المتتالية.',
    };
  }
  return {
    title: 'Kurdish Quest: Keep Your Streak!',
    body: 'The next level is waiting! Take 1 minute today to practice Kurdish and keep your learning streak burning.',
  };
}

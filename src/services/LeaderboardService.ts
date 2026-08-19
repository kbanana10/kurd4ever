/**
 * LeaderboardService.ts
 * 
 * Simulated competitive progress service.
 * Merges local user profile XP with virtual competitors to drive high-engagement gamification mechanics.
 * Portable and easy to replace with backend firestore/real-time database sync logic (Clean Architecture).
 */

export interface LeaderboardEntry {
  uid: string;
  name: string;
  xp: number;
  avatar: string; // Avatar ID (av-1, av-2, etc.)
  isCurrentUser?: boolean;
}

const DEFAULT_COMPETITORS: LeaderboardEntry[] = [
  { uid: 'comp-1', name: 'Ronahi', xp: 1850, avatar: 'av-2' },
  { uid: 'comp-2', name: 'Dilshad', xp: 1540, avatar: 'av-5' },
  { uid: 'comp-3', name: 'Berivan', xp: 1220, avatar: 'av-3' },
  { uid: 'comp-4', name: 'Shivan', xp: 950, avatar: 'av-1' },
  { uid: 'comp-5', name: 'Zozan', xp: 750, avatar: 'av-4' },
  { uid: 'comp-6', name: 'Rawend', xp: 480, avatar: 'av-6' },
  { uid: 'comp-7', name: 'Alan', xp: 260, avatar: 'av-7' },
  { uid: 'comp-8', name: 'Avan', xp: 120, avatar: 'av-8' },
];

function getCompetitors(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem('kurdish_quest_competitors');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse competitors', e);
  }
  
  localStorage.setItem('kurdish_quest_competitors', JSON.stringify(DEFAULT_COMPETITORS));
  return DEFAULT_COMPETITORS;
}

function saveCompetitors(competitors: LeaderboardEntry[]): void {
  localStorage.setItem('kurdish_quest_competitors', JSON.stringify(competitors));
}

export function getMergedLeaderboard(
  currentUserName: string | null | undefined,
  currentUserXp: number,
  currentUserAvatarId?: string
): LeaderboardEntry[] {
  const competitors = getCompetitors();
  
  const userAvatar = currentUserAvatarId || 'av-1';

  const currentUserEntry: LeaderboardEntry = {
    uid: 'current-user-uid',
    name: currentUserName || 'You',
    xp: currentUserXp,
    avatar: userAvatar,
    isCurrentUser: true,
  };

  const merged = [...competitors, currentUserEntry];
  return merged.sort((a, b) => b.xp - a.xp);
}

export function simulateCompetitorsProgress(): LeaderboardEntry[] {
  const competitors = getCompetitors();
  let updated = false;

  const currentDay = new Date().toDateString();
  const lastSimulatedDay = localStorage.getItem('kurdish_quest_last_sim');

  if (lastSimulatedDay !== currentDay) {
    const newCompetitors = competitors.map(comp => {
      if (Math.random() > 0.4) {
        updated = true;
        const xpGain = Math.floor(Math.random() * 3 + 1) * 10; // 10, 20, 30 XP
        return {
          ...comp,
          xp: comp.xp + xpGain
        };
      }
      return comp;
    });

    if (updated) {
      saveCompetitors(newCompetitors);
      localStorage.setItem('kurdish_quest_last_sim', currentDay);
      return newCompetitors;
    }
  }

  return competitors;
}

/**
 * MissionsService.ts — daily missions: the deliberate way to earn gems.
 *
 * ECONOMY REDESIGN (maintainer request): gems used to drip from every XP
 * event (≥5 per game/quiz automatically), which made the currency
 * meaningless. Now gameplay pays almost no gems directly — players earn
 * them by completing DAILY MISSIONS and claiming the reward in Profile.
 *
 * Missions reset at the UTC day boundary (same clock as streaks/daily
 * goal). Progress is derived from counters AuthContext maintains in
 * `userData.missionsState` plus the existing `xpToday` tally.
 */
import { UserData } from '../models/user';
import { TranslationKey } from '../localization/translations';
import { getUtcDateString } from './GamificationService';

export interface MissionDef {
  id: string;
  /** Emoji chip shown in the Profile list. */
  icon: string;
  target: number;
  /** Gems paid on claim. */
  reward: number;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

export const DAILY_MISSIONS: MissionDef[] = [
  { id: 'daily_xp_50', icon: '⚡', target: 50, reward: 15, titleKey: 'mission_xp_title', descKey: 'mission_xp_desc' },
  { id: 'daily_quizzes_3', icon: '🎓', target: 3, reward: 20, titleKey: 'mission_quiz_title', descKey: 'mission_quiz_desc' },
  { id: 'daily_games_2', icon: '🎮', target: 2, reward: 10, titleKey: 'mission_games_title', descKey: 'mission_games_desc' },
  { id: 'daily_perfect_1', icon: '🏆', target: 1, reward: 25, titleKey: 'mission_perfect_title', descKey: 'mission_perfect_desc' },
];

/** Max gems available per day through missions (keeps the store meaningful). */
export const DAILY_MISSION_GEM_CAP = DAILY_MISSIONS.reduce((s, m) => s + m.reward, 0);

export interface MissionStatus {
  def: MissionDef;
  progress: number;
  complete: boolean;
  claimed: boolean;
}

const EMPTY_COUNTERS = { quizzes: 0, games: 0, perfect: 0 };

type MissionsState = NonNullable<UserData['missionsState']>;

function emptyState(today: string): MissionsState {
  return { date: today, counters: { ...EMPTY_COUNTERS }, claimed: [] };
}

export function getMissionStatuses(userData: UserData | null | undefined, now: Date = new Date()): MissionStatus[] {
  const today = getUtcDateString(now);
  const state = userData?.missionsState?.date === today
    ? userData.missionsState
    : emptyState(today);
  const xpToday = userData?.xpTodayDate === today ? (userData?.xpToday || 0) : 0;

  const progressFor = (id: string): number => {
    switch (id) {
      case 'daily_xp_50': return xpToday;
      case 'daily_quizzes_3': return state.counters.quizzes;
      case 'daily_games_2': return state.counters.games;
      case 'daily_perfect_1': return state.counters.perfect;
      default: return 0;
    }
  };

  return DAILY_MISSIONS.map((def) => {
    const progress = Math.min(progressFor(def.id), def.target);
    return {
      def,
      progress,
      complete: progress >= def.target,
      claimed: state.claimed.includes(def.id),
    };
  });
}

/**
 * Validates and builds the user-data update for claiming one mission.
 * Returns null when the mission is not claimable (incomplete / already
 * claimed) — callers must treat that as a no-op.
 */
export function claimMission(
  userData: UserData,
  missionId: string,
  now: Date = new Date()
): Partial<UserData> | null {
  const statuses = getMissionStatuses(userData, now);
  const status = statuses.find(s => s.def.id === missionId);
  if (!status || !status.complete || status.claimed) return null;

  const today = getUtcDateString(now);
  const state = userData.missionsState?.date === today
    ? userData.missionsState
    : emptyState(today);

  return {
    gems: (userData.gems ?? 0) + status.def.reward,
    missionsState: {
      date: today,
      counters: { ...state.counters },
      claimed: [...state.claimed, missionId],
    },
  };
}

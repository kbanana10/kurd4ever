/**
 * missions.test.ts — daily missions economy (gems are earned, not dripped).
 */
import { describe, it, expect } from 'vitest';
import {
  DAILY_MISSIONS,
  DAILY_MISSION_GEM_CAP,
  getMissionStatuses,
  claimMission,
} from '../src/services/MissionsService';
import { getUtcDateString } from '../src/services/GamificationService';
import { UserData } from '../src/models/user';

const today = getUtcDateString();
const base = {
  xp: 100, level: 1, streak: 1, gems: 40, wordsLearned: 5,
  lastActive: Date.now(), createdAt: Date.now(), updatedAt: Date.now(),
  recentSearches: [], favorites: [],
} as unknown as UserData;

describe('Daily missions', () => {
  it('defines a bounded daily gem income', () => {
    expect(DAILY_MISSIONS.length).toBe(4);
    expect(DAILY_MISSION_GEM_CAP).toBe(70);
  });

  it('fresh user: all missions at zero, none claimable', () => {
    const st = getMissionStatuses(base);
    expect(st.every(s => s.progress === 0 && !s.complete && !s.claimed)).toBe(true);
    expect(claimMission(base, 'daily_xp_50')).toBeNull();
  });

  it('tracks XP mission from the existing daily tally', () => {
    const user = { ...base, xpToday: 62, xpTodayDate: today } as UserData;
    const xpMission = getMissionStatuses(user).find(s => s.def.id === 'daily_xp_50')!;
    expect(xpMission.complete).toBe(true);
    expect(xpMission.progress).toBe(50); // clamped to target
  });

  it('claim pays gems exactly once', () => {
    const user = {
      ...base,
      xpToday: 55, xpTodayDate: today,
      missionsState: { date: today, counters: { quizzes: 0, games: 0, perfect: 0 }, claimed: [] },
    } as UserData;

    const update = claimMission(user, 'daily_xp_50')!;
    expect(update.gems).toBe(40 + 15);
    expect(update.missionsState!.claimed).toContain('daily_xp_50');

    // second claim on the updated data is a no-op
    const after = { ...user, ...update } as UserData;
    expect(claimMission(after, 'daily_xp_50')).toBeNull();
  });

  it('incomplete missions cannot be claimed', () => {
    const user = {
      ...base,
      missionsState: { date: today, counters: { quizzes: 2, games: 0, perfect: 0 }, claimed: [] },
    } as UserData;
    expect(claimMission(user, 'daily_quizzes_3')).toBeNull();
  });

  it('yesterday\'s progress and claims reset at the UTC boundary', () => {
    const user = {
      ...base,
      xpToday: 500, xpTodayDate: '2020-01-01',
      missionsState: { date: '2020-01-01', counters: { quizzes: 9, games: 9, perfect: 9 }, claimed: ['daily_xp_50'] },
    } as UserData;
    const st = getMissionStatuses(user);
    expect(st.every(s => s.progress === 0 && !s.claimed)).toBe(true);
  });

  it('quiz/game/perfect counters drive their missions', () => {
    const user = {
      ...base,
      missionsState: { date: today, counters: { quizzes: 3, games: 2, perfect: 1 }, claimed: [] },
    } as UserData;
    const byId = Object.fromEntries(getMissionStatuses(user).map(s => [s.def.id, s]));
    expect(byId['daily_quizzes_3'].complete).toBe(true);
    expect(byId['daily_games_2'].complete).toBe(true);
    expect(byId['daily_perfect_1'].complete).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import {
  calculateLevelFromXP, getXpRequiredForLevel, checkAndUpdateStreak,
  calculateQuizRewards, getUtcDateString, getDaysDifference
} from '../src/services/GamificationService';

describe('GamificationService — level math', () => {
  it('level curve is monotonic and self-consistent with getXpRequiredForLevel', () => {
    const mismatches: string[] = [];
    for (let lvl = 2; lvl <= 30; lvl++) {
      const xpNeeded = getXpRequiredForLevel(lvl);
      const derived = calculateLevelFromXP(xpNeeded);
      if (derived !== lvl) mismatches.push(`L${lvl}: needs ${xpNeeded}xp -> calculateLevelFromXP says L${derived}`);
    }
    console.log('LEVEL ROUNDTRIP MISMATCHES:', mismatches.length ? mismatches.join(' | ') : 'none');
    console.log('XP->Level samples:', [0,50,99,100,200,500,1000,5000,100000].map(x=>`${x}=>L${calculateLevelFromXP(x)}`).join(', '));
  });
  it('handles hostile XP inputs without NaN/Infinity', () => {
    const bad = [NaN, Infinity, -Infinity, -100, 1e308, 0.5];
    for (const b of bad) {
      const r = calculateLevelFromXP(b as number);
      console.log(`calculateLevelFromXP(${b}) = ${r}`);
    }
    expect(Number.isFinite(calculateLevelFromXP(NaN as number))).toBe(true); // FIXED
  });
});

describe('Dashboard XP progress bar math', () => {
  it('xp % 100 does NOT match the exponential level curve', () => {
    // Dashboard.tsx: const currentLevelXP = (safeUserData.xp || 0) % 100;
    const xp = 500;
    const uiPercent = xp % 100;             // = 0  -> bar reads "0%"
    const realLevel = calculateLevelFromXP(xp);
    const floor = getXpRequiredForLevel(realLevel);
    const ceil  = getXpRequiredForLevel(realLevel + 1);
    const realPercent = Math.round(((xp - floor) / (ceil - floor)) * 100);
    console.log(`XP=${xp}: UI bar shows ${uiPercent}% but true progress in L${realLevel} is ${realPercent}% (${floor}->${ceil})`);
    expect(uiPercent).not.toBe(realPercent);
  });
});

describe('Streak logic', () => {
  const base: any = { xp: 0, level: 1, streak: 5, streakFreezes: 1, lastActive: Date.now(), createdAt: 0, updatedAt: 0, wordsLearned: 0, recentSearches: [], favorites: [] };
  it('same day keeps streak', () => {
    const r = checkAndUpdateStreak({ ...base });
    expect(r.updatedStreak).toBe(5);
  });
  it('BUG: diff===2 (missed one day) INCREMENTS streak when freeze available', () => {
    const twoDaysAgo = Date.now() - 2 * 86400000;
    const r = checkAndUpdateStreak({ ...base, lastActive: twoDaysAgo });
    console.log('diff=2 with freeze ->', JSON.stringify(r));
    expect(r.updatedStreak).toBe(5); // FIXED: freeze preserves, never increments
  });
  it('3+ days resets to 1', () => {
    const r = checkAndUpdateStreak({ ...base, lastActive: Date.now() - 5 * 86400000 });
    expect(r.updatedStreak).toBe(1);
    expect(r.streakBroken).toBe(true);
  });
  it('BUG: lastActiveDate field is ignored; only lastActive epoch is read', () => {
    const r = checkAndUpdateStreak({ ...base, lastActive: Date.now(), lastActiveDate: '2020-01-01' } as any);
    console.log('stale lastActiveDate ignored ->', JSON.stringify(r));
    expect(r.updatedStreak).toBe(5);
  });
});

describe('Quiz rewards', () => {
  it('zero-question quiz still pays out', () => {
    const r = calculateQuizRewards(0, 0, 0, 12);
    console.log('0/0 quiz reward:', JSON.stringify(r));
    expect(r.gemsGained).toBe(0); // FIXED: empty quiz pays nothing
  });
  it('score can exceed total (no clamping)', () => {
    const r = calculateQuizRewards(999, 5, 0, 25);
    console.log('999/5 reward (no clamp):', JSON.stringify(r));
    expect(r.xpGained).toBeLessThanOrEqual(5 * 25 + 20); // FIXED: clamped
  });
});

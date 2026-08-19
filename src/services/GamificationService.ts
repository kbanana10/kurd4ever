/**
 * GamificationService.ts
 * 
 * Central business logic for XP formulas, exponential Level calculations,
 * Quester Gems economy, and UTC timezone-safe Streak Protection & Freeze mechanics.
 */
import { UserData } from '../models/user';

/**
 * UTC Date helper YYYY-MM-DD
 */
export function getUtcDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculates days difference between two UTC YYYY-MM-DD dates
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00Z').getTime();
  const d2 = new Date(dateStr2 + 'T00:00:00Z').getTime();
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/** Tunable shape of the XP curve. Level N requires CURVE_BASE * (N-1)^CURVE_EXP total XP. */
const CURVE_BASE = 100;
const CURVE_EXP = 1.4;
const MAX_LEVEL = 200;

/**
 * Total cumulative XP required to *reach* `level`.
 * This is the single source of truth for the curve.
 */
export function getXpRequiredForLevel(level: number): number {
  if (!Number.isFinite(level) || level <= 1) return 0;
  const capped = Math.min(Math.floor(level), MAX_LEVEL);
  return Math.floor(CURVE_BASE * Math.pow(capped - 1, CURVE_EXP));
}

/**
 * Exact inverse of getXpRequiredForLevel.
 *
 * AUDIT FIX: the previous implementation was `floor((xp/100)^(1/1.4)) + 1`,
 * which is NOT the inverse of `100*(level-1)^1.4`. Every level from 3 upward
 * was off by one, so a player holding exactly the advertised XP for level N
 * was still shown as level N-1. It also returned NaN/Infinity for hostile
 * input, which then persisted into Firestore and corrupted the profile.
 */
export function calculateLevelFromXP(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  const safeXp = Math.min(xp, Number.MAX_SAFE_INTEGER);
  // getXpRequiredForLevel() floors its result, so the analytic inverse lands
  // just below the integer boundary (263 XP -> 1.99511, not 2.0). Compute the
  // approximate level, then correct by comparing against the *same* floored
  // thresholds the rest of the app uses. This guarantees the two functions are
  // exact inverses, which the level-up toast and Roadmap gating depend on.
  const approx = Math.floor(Math.pow(safeXp / CURVE_BASE, 1 / CURVE_EXP)) + 1;
  let level = Math.max(1, Math.min(approx, MAX_LEVEL));

  while (level < MAX_LEVEL && safeXp >= getXpRequiredForLevel(level + 1)) level++;
  while (level > 1 && safeXp < getXpRequiredForLevel(level)) level--;

  return level;
}

/**
 * Progress within the current level, for progress bars.
 * Replaces the incorrect `xp % 100` used on the Dashboard, which showed 0%
 * for a level-4 player sitting at 500 XP.
 */
export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  xpForThisLevel: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  percent: number;
}

export interface StreakUpdateResult {
  updatedStreak: number;
  streakFreezes: number;
  lastActiveDate: string;
  freezeUsed: boolean;
  streakBroken: boolean;
}

export function getLevelProgress(xp: number): LevelProgress {
  const safeXp = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  const level = calculateLevelFromXP(safeXp);
  const floorXp = getXpRequiredForLevel(level);
  const ceilXp = getXpRequiredForLevel(level + 1);
  const span = Math.max(1, ceilXp - floorXp);
  const into = Math.max(0, safeXp - floorXp);
  return {
    level,
    currentLevelXp: floorXp,
    xpForThisLevel: span,
    xpIntoLevel: into,
    xpToNextLevel: Math.max(0, ceilXp - safeXp),
    percent: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
  };
}

/**
 * Streak & Streak Freeze Manager
 * Checks and updates streak safety with UTC timezone protection and freeze tokens.
 */
export function checkAndUpdateStreak(userData: UserData): StreakUpdateResult {
  const todayStr = getUtcDateString(new Date());
  const lastActiveStr = userData.lastActive ? getUtcDateString(new Date(userData.lastActive)) : todayStr;
  
  let currentStreak = userData.streak || 0;
  let freezes = userData.streakFreezes ?? 1; // Default 1 freeze token available
  let freezeUsed = false;
  let streakBroken = false;

  const diff = getDaysDifference(lastActiveStr, todayStr);

  if (diff === 0) {
    // Already logged active today
    return {
      updatedStreak: currentStreak === 0 ? 1 : currentStreak,
      streakFreezes: freezes,
      lastActiveDate: todayStr,
      freezeUsed: false,
      streakBroken: false
    };
  } else if (diff === 1) {
    // Consecutive day activity!
    currentStreak += 1;
  } else if (diff === 2) {
    // Missed exactly one day — a freeze shield can rescue the run.
    if (freezes > 0) {
      freezes -= 1;
      freezeUsed = true;
      // AUDIT FIX: this used to do `currentStreak += 1`, so *skipping* a day
      // actually grew the streak. A freeze preserves the count, it does not
      // reward the missed day.
      currentStreak = Math.max(1, currentStreak);
    } else {
      currentStreak = 1;
      streakBroken = true;
    }
  } else {
    // Missed > 1 day
    currentStreak = 1;
    streakBroken = true;
  }

  return {
    updatedStreak: currentStreak,
    streakFreezes: freezes,
    lastActiveDate: todayStr,
    freezeUsed,
    streakBroken
  };
}

/**
 * Reward Calculation matrix for quiz/lesson completion
 */
export interface QuizRewardResult {
  xpGained: number;
  gemsGained: number;
  isPerfect: boolean;
  levelUp: boolean;
  newLevel: number;
}

export function calculateQuizRewards(
  score: number,
  totalQuestions: number,
  currentXp: number,
  levelMultiplier: number = 12
): QuizRewardResult {
  // AUDIT FIX: inputs were unvalidated, so a replayed/!tampered call such as
  // calculateQuizRewards(999, 5, ...) minted 24,985 XP and 1,058 gems.
  const total = Number.isFinite(totalQuestions) ? Math.max(0, Math.floor(totalQuestions)) : 0;
  const rawScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const safeScore = Math.min(rawScore, total);
  const mult = Number.isFinite(levelMultiplier) ? Math.max(1, Math.min(levelMultiplier, 50)) : 12;

  score = safeScore;
  totalQuestions = total;
  levelMultiplier = mult;

  const isPerfect = totalQuestions > 0 && score === totalQuestions;
  const accuracy = totalQuestions > 0 ? score / totalQuestions : 0;

  // Base XP
  let xpGained = score * levelMultiplier;
  
  // Perfection bonus (+20 XP for 100% accuracy)
  if (isPerfect) {
    xpGained += 20;
  } else if (accuracy >= 0.8) {
    xpGained += 10;
  }

  // Quester Gems calculation
  // ECONOMY REDESIGN (maintainer request): gems are deliberately scarce.
  // Quizzes no longer pay a completion allowance (was 10 + accuracy bonuses
  // up to 25/run — the currency was meaningless). Direct gameplay gems now
  // exist only as small celebrations for rare feats; the real gem income is
  // DAILY MISSIONS (see MissionsService, claimed in Profile).
  let gemsGained = 0;
  if (isPerfect) {
    gemsGained += 5; // flawless run — small nod, missions pay the rest
  }

  const safeCurrentXp = Number.isFinite(currentXp) && currentXp > 0 ? currentXp : 0;
  const oldLevel = calculateLevelFromXP(safeCurrentXp);
  const newXp = safeCurrentXp + xpGained;
  const newLevel = calculateLevelFromXP(newXp);
  const levelUp = newLevel > oldLevel;

  if (levelUp) {
    // Level-up milestone (rare): flat celebration bonus, no longer scales
    // with level (previously newLevel * 20 minted hundreds of gems).
    gemsGained += 15;
  }

  return {
    xpGained,
    gemsGained,
    isPerfect,
    levelUp,
    newLevel
  };
}

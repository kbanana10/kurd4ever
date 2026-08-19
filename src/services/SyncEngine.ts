/**
 * SyncEngine.ts
 * 
 * Background Sync and Conflict Resolution engine.
 * Processes pending mutations queued while offline and applies additive reconciliation.
 */
import { offlineStorage, PendingSyncMutation } from './OfflineStorageService';
import { UserData } from '../models/user';
import { ReviewDeck } from './SpacedRepetitionService';
import { GameScoreMap } from '../models/user';
import { calculateLevelFromXP } from './GamificationService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
}

type StatusListener = (status: SyncEngineStatus) => void;

class SyncEngine {
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private listeners: Set<StatusListener> = new Set();

  constructor() {
    if (globalThis.window !== undefined) {
      window.addEventListener('online', () => {
        this.notifyListeners();
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.notifyListeners();
      });
    }
  }

  public subscribe(listener: StatusListener) {
    this.listeners.add(listener);
    this.notifyStatus(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): SyncEngineStatus {
    return {
      isOnline: globalThis.navigator !== undefined ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: 0, // updated asynchronously
      lastSyncedAt: this.lastSyncedAt
    };
  }

  private async notifyListeners() {
    const pending = await offlineStorage.getPendingMutations();
    const status: SyncEngineStatus = {
      isOnline: globalThis.navigator !== undefined ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: pending.length,
      lastSyncedAt: this.lastSyncedAt
    };

    this.listeners.forEach(fn => fn(status));
  }

  private async notifyStatus(listener: StatusListener) {
    const pending = await offlineStorage.getPendingMutations();
    listener({
      isOnline: globalThis.navigator !== undefined ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: pending.length,
      lastSyncedAt: this.lastSyncedAt
    });
  }

  /**
   * Reconciles local and remote user state using a strict taxonomy:
   * 1. Monotonic Cumulative Counters (xp, wordsLearned, quizzesCompleted, sessionsCount, totalStudyTime) -> Math.max
   * 2. Additive Sets (completedLessons, badges, unlockedLevels, favorites, wrongAnswersHistory) -> Set union
   * 3. High Scores (gameScores) -> Key-wise Math.max
   * 4. Spendable Balances & Consumable Inventory (gems, streakFreezes) -> Last-Write-Wins based on timestamp
   * 5. Date-dependent State (lastStreakFreezeUsed, lastDailyRewardClaimed, lastActiveDate, streak) -> LWW with date logic
   * 6. Profile Preferences & Customizations -> Last-Write-Wins
   */
  public mergeUserDataAdditive(local: UserData, remote: UserData): UserData {
    const localTime = Math.max(local.updatedAt || 0, local.lastActive || 0);
    const remoteTime = Math.max(remote.updatedAt || 0, remote.lastActive || 0);
    const isLocalNewer = localTime >= remoteTime;

    // 1. Monotonic cumulative counters (safe to take max)
    const mergedXp = Math.max(local.xp || 0, remote.xp || 0);
    const mergedWords = Math.max(local.wordsLearned || 0, remote.wordsLearned || 0);
    const mergedQuizzes = Math.max(local.quizzesCompleted || 0, remote.quizzesCompleted || 0);
    const mergedSessions = Math.max(local.sessionsCount || 0, remote.sessionsCount || 0);
    const mergedTotalStudyTime = Math.max(local.totalStudyTime || 0, remote.totalStudyTime || 0);
    const mergedLevel = calculateLevelFromXP(mergedXp);

    // 2. Additive Collections (Set union)
    const mergedLessons = Array.from(new Set([...(local.completedLessons || []), ...(remote.completedLessons || [])]));
    const mergedBadges = Array.from(new Set([...(local.badges || []), ...(remote.badges || [])]));
    const mergedUnlocked = Array.from(new Set([...(local.unlockedLevels || ['A1']), ...(remote.unlockedLevels || ['A1'])]));
    const mergedFavorites = Array.from(new Set([...(local.favorites || []), ...(remote.favorites || [])]));
    const mergedWrongAnswers = Array.from(new Set([...(local.wrongAnswersHistory || []), ...(remote.wrongAnswersHistory || [])]));
    
    // Recent searches: deduplicate while preserving recent ordering
    const rawSearches = isLocalNewer
      ? [...(local.recentSearches || []), ...(remote.recentSearches || [])]
      : [...(remote.recentSearches || []), ...(local.recentSearches || [])];
    const mergedRecentSearches = Array.from(new Set(rawSearches)).slice(0, 20);

    // 3. Keyed High Scores (Key-wise max)
    const mergedGameScores: GameScoreMap = { ...(remote.gameScores || {}) };
    for (const [key, val] of Object.entries(local.gameScores || {})) {
      mergedGameScores[key] = Math.max(mergedGameScores[key] || 0, val || 0);
    }

    // 4. Spaced Repetition Review Deck (Per-card recency merge)
    const mergedReviewDeck: ReviewDeck = { ...(remote.reviewDeck || {}) };
    for (const [id, localCard] of Object.entries(local.reviewDeck || {})) {
      const remoteCard = mergedReviewDeck[id];
      if (!remoteCard) {
        mergedReviewDeck[id] = localCard;
      } else {
        const localReviewed = localCard.lastReviewedAt || 0;
        const remoteReviewed = remoteCard.lastReviewedAt || 0;
        if (localReviewed > remoteReviewed) {
          mergedReviewDeck[id] = localCard;
        } else if (remoteReviewed > localReviewed) {
          mergedReviewDeck[id] = remoteCard;
        } else {
          mergedReviewDeck[id] = (localCard.repetitions || 0) >= (remoteCard.repetitions || 0) ? localCard : remoteCard;
        }
      }
    }

    // 4. Spendable Balances & Consumable Inventory (Last-Write-Wins)
    // Spending gems or using freezes decreases the balance; Math.max would resurrect spent currency.
    const mergedGems = isLocalNewer
      ? (local.gems ?? remote.gems ?? 100)
      : (remote.gems ?? local.gems ?? 100);

    const mergedFreezes = isLocalNewer
      ? (local.streakFreezes ?? remote.streakFreezes ?? 1)
      : (remote.streakFreezes ?? local.streakFreezes ?? 1);

    const mergedLastFreezeUsed = isLocalNewer
      ? (local.lastStreakFreezeUsed ?? remote.lastStreakFreezeUsed)
      : (remote.lastStreakFreezeUsed ?? local.lastStreakFreezeUsed);

    const mergedLastDailyReward = isLocalNewer
      ? (local.lastDailyRewardClaimed ?? remote.lastDailyRewardClaimed)
      : (remote.lastDailyRewardClaimed ?? local.lastDailyRewardClaimed);

    // 5. Streak & Activity Date Reconciliation
    let mergedStreak = Math.max(local.streak || 0, remote.streak || 0);
    let mergedLastActiveDate = local.lastActiveDate || remote.lastActiveDate;
    if (local.lastActiveDate && remote.lastActiveDate) {
      if (local.lastActiveDate === remote.lastActiveDate) {
        mergedStreak = Math.max(local.streak || 0, remote.streak || 0);
        mergedLastActiveDate = local.lastActiveDate;
      } else if (local.lastActiveDate > remote.lastActiveDate) {
        mergedStreak = local.streak || 0;
        mergedLastActiveDate = local.lastActiveDate;
      } else {
        mergedStreak = remote.streak || 0;
        mergedLastActiveDate = remote.lastActiveDate;
      }
    } else if (local.lastActiveDate) {
      mergedStreak = local.streak || 0;
      mergedLastActiveDate = local.lastActiveDate;
    } else if (remote.lastActiveDate) {
      mergedStreak = remote.streak || 0;
      mergedLastActiveDate = remote.lastActiveDate;
    }

    // 6. Base metadata (Preferences & Profile info via LWW)
    const baseMetadata = isLocalNewer
      ? { ...remote, ...local }
      : { ...local, ...remote };

    return {
      ...baseMetadata,
      xp: mergedXp,
      level: mergedLevel,
      gems: mergedGems,
      wordsLearned: mergedWords,
      quizzesCompleted: mergedQuizzes,
      sessionsCount: mergedSessions,
      totalStudyTime: mergedTotalStudyTime,
      completedLessons: mergedLessons,
      badges: mergedBadges,
      unlockedLevels: mergedUnlocked,
      favorites: mergedFavorites,
      recentSearches: mergedRecentSearches,
      gameScores: mergedGameScores,
      wrongAnswersHistory: mergedWrongAnswers,
      reviewDeck: mergedReviewDeck,
      streak: mergedStreak,
      streakFreezes: mergedFreezes,
      lastStreakFreezeUsed: mergedLastFreezeUsed,
      lastDailyRewardClaimed: mergedLastDailyReward,
      lastActiveDate: mergedLastActiveDate,
      lastActive: Math.max(local.lastActive || 0, remote.lastActive || 0),
      createdAt: Math.min(local.createdAt || Date.now(), remote.createdAt || Date.now()),
      updatedAt: Math.max(localTime, remoteTime, Date.now())
    };
  }

  /**
   * Main Queue Processor: Flushes pending mutations to Firestore when online
   * Reconciles with remote state first to avoid clobbering progress from other devices.
   */
  public async processQueue(userId?: string): Promise<boolean> {
    if (this.isSyncing) return false;
    if (globalThis.navigator !== undefined && !navigator.onLine) return false;

    const targetUserId = userId || auth.currentUser?.uid;
    if (!targetUserId || targetUserId === 'local_user') {
      return false;
    }

    const pending = await offlineStorage.getPendingMutations();
    if (pending.length === 0) {
      this.notifyListeners();
      return true;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const currentLocal = await offlineStorage.getUserData();
      if (currentLocal && db) {
        const userRef = doc(db, 'users', targetUserId);
        
        // Fetch remote document to ensure we merge changes rather than blindly clobbering
        let targetData = currentLocal;
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            // SAFETY: users/{uid} docs are only ever written from UserData snapshots under owner-only firestore.rules.
            const remoteData = docSnap.data() as UserData;
            targetData = this.mergeUserDataAdditive(currentLocal, remoteData);
          }
        } catch (fetchErr) {
          console.warn('SyncEngine remote fetch failed, proceeding with local merge:', fetchErr);
        }

        // Save reconciled data locally and push to Firestore
        await offlineStorage.saveUserData(targetData);
        await setDoc(userRef, targetData, { merge: true });
        
        // Remove processed mutations
        for (const mut of pending) {
          await offlineStorage.removeMutation(mut.id);
        }

        this.lastSyncedAt = Date.now();
      }
    } catch (err) {
      console.warn('SyncEngine processQueue error:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return true;
  }
}

export const syncEngine = new SyncEngine();

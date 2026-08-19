/**
 * AuthContext.tsx
 * 
 * Global state provider managing user profile, gamification points, theme preferences, and locale language preferences.
 * Integrates Google Sign-In with Firestore synchronization, fallback client-side storage, and connection testing.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, UserData, Language } from '../models/user';
import { 
  db, 
  auth, 
  googleProvider 
} from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer 
} from 'firebase/firestore';

import { 
  calculateLevelFromXP, 
  checkAndUpdateStreak, 
  getUtcDateString 
} from '../services/GamificationService';
import { offlineStorage } from '../services/OfflineStorageService';
import { syncEngine } from '../services/SyncEngine';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  /** Non-null when the initial profile load failed; pages can surface ErrorState. */
  profileError: string | null;
  /** Re-runs the auth/profile load after a failure. */
  retryProfileLoad: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  signInWithName: (name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProgress: (xpToAdd: number, wordsToAdd: number, quizCompleted?: boolean, gemsToAdd?: number, opts?: { source?: 'quiz' | 'game'; perfect?: boolean }) => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  profileError: null,
  retryProfileLoad: () => {},
  language: 'en',
  setLanguage: () => {},
  theme: 'light',
  toggleTheme: () => {},
  signInWithName: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateUserProgress: async () => {},
  updateUserData: async () => {},
  updateProfileName: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function getDefaultUserData(): UserData {
  return {
    xp: 0,
    level: 1,
    gems: 100, // Starter Quester Gems
    streakFreezes: 1, // Starter 1 Streak Freeze Shield
    streak: 0,
    lastActive: Date.now(),
    lastActiveDate: getUtcDateString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wordsLearned: 0,
    recentSearches: [],
    favorites: [],
    completedLessons: [],
    unlockedLevels: ['A1'],
    badges: [],
    gameScores: {},
    wrongAnswersHistory: [],
    reviewDeck: {},
    weakCategories: {},
    strongCategories: {},
    sessionsCount: 0,
    totalStudyTime: 0,
    isOnboarded: false
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('kurdish_quest_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [userData, setUserData] = useState<UserData>(() => {
    try {
      const stored = localStorage.getItem('kurmanji_user_data_v2') || localStorage.getItem('kurdish_quest_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return getDefaultUserData();
  });

  /**
   * XP-LOSS FIX (lost-update bug): `updateUserProgress` and `updateUserData`
   * used to read `userData` from their render closure. Flows that call them
   * back-to-back (quiz finish: award XP → save completedLessons; games:
   * award XP → save high score) made the SECOND write spread the PRE-XP
   * snapshot back over the first — every quiz/game XP award was silently
   * reverted on persist. This ref always holds the latest committed value:
   * writers read from it and commit to it synchronously, so sequential
   * writes compose instead of clobbering each other.
   */
  const userDataRef = useRef<UserData>(userData);
  useEffect(() => { userDataRef.current = userData; }, [userData]);

  const [loading, setLoading] = useState(true);
  /**
   * AUDIT FIX (P0): the auth callback below awaits IndexedDB and Firestore
   * without a guard. If `offlineStorage.getUserData()` rejects — private
   * browsing, quota, a corrupt object store — the rejection escaped the async
   * callback, `setLoading(false)` never ran, and `{!loading && children}`
   * rendered a permanently blank app with no message and no recovery.
   * `profileError` turns that silent hang into a retryable ErrorState.
   */
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // CRITICAL CONSTRAINT: Test Firestore connection at startup
  useEffect(() => {
    async function testConnection() {
      try {
        await getDoc(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach Cloud Firestore backend') || error.message.includes('backend'))) {
          console.warn("Firestore operating in offline or delayed fallback mode:", error.message);
        } else {
          console.warn("Firestore connection check note:", error);
        }
      }
    }
    testConnection();
  }, []);

  // Sync / Listen to language and theme stored locally
  useEffect(() => {
    // SAFETY: this key is written only by setLanguage with Language members; the || fallback absorbs invalid values.
    const storedLanguage = localStorage.getItem('kurdish_quest_lang') as Language;
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ar' || storedLanguage === 'ku')) {
      setLanguageState(storedLanguage);
    }
    
    // SAFETY: theme key is written only with 'light' | 'dark'; null is handled below.
    const storedTheme = localStorage.getItem('kurdish_quest_theme') as 'light' | 'dark' | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Listen to Firebase Auth state with IndexedDB & additive merge integration
  useEffect(() => {
    /** Body of the auth callback, extracted so the caller owns error handling. */
    const loadProfile = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const simplifiedUser: User = {
          displayName: firebaseUser.displayName || firebaseUser.email || "Learner",
          uid: firebaseUser.uid
        };
        setUser(simplifiedUser);
        localStorage.setItem('kurdish_quest_user', JSON.stringify(simplifiedUser));

        // Attempt reading user progress from Firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        let cloudData: UserData | null = null;
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // SAFETY: cloud profile docs originate from UserData writes under owner-only firestore.rules.
            cloudData = docSnap.data() as UserData;
          }
        } catch (e) {
          console.warn("Firestore data pull skipped or failed (potentially offline/cold start):", e);
        }

        const localDataObj = await offlineStorage.getUserData();

        if (cloudData && localDataObj) {
          // Additive merge rule to prevent progress loss
          const merged = syncEngine.mergeUserDataAdditive(localDataObj, cloudData);
          setUserData(merged);
          await offlineStorage.saveUserData(merged);
          
          if (navigator.onLine) {
            try {
              await setDoc(docRef, merged, { merge: true });
            } catch (err) {
              console.warn("Failing syncing merged profile changes back to cloud: ", err);
            }
          }
        } else if (cloudData) {
          setUserData(cloudData);
          await offlineStorage.saveUserData(cloudData);
        } else {
          // No cloud document existed, deploy local state or fresh start configuration
          const finalProfile = localDataObj || getDefaultUserData();
          setUserData(finalProfile);
          await offlineStorage.saveUserData(finalProfile);
          if (navigator.onLine) {
            try {
              await setDoc(docRef, finalProfile);
            } catch (err) {
              console.warn("Failed creating user document in cloud on initial sign-in: ", err);
            }
          }
        }

        // Trigger background sync queue if online
        if (navigator.onLine) {
          syncEngine.processQueue(firebaseUser.uid);
        }
      } else {
        // Guest / Local profile mode
        // AUDIT FIX: this JSON.parse was unguarded. A corrupt or truncated
        // localStorage value threw inside an async auth callback, producing an
        // unhandled rejection and a permanently blank screen (loading never
        // cleared). Now it fails safe to signed-out.
        const storedUser = localStorage.getItem('kurdish_quest_user');
        let parsed: User | null = null;
        if (storedUser) {
          try {
            // SAFETY: kurdish_quest_user is serialized by this module from a User shape; parse errors are caught by the surrounding try.
            parsed = JSON.parse(storedUser) as User;
          } catch {
            console.warn('Corrupt kurdish_quest_user in localStorage — clearing.');
            localStorage.removeItem('kurdish_quest_user');
          }
        }
        setUser(parsed && parsed.uid === 'local_user' ? parsed : null);

        const localDataObj = await offlineStorage.getUserData();
        if (localDataObj) {
          setUserData(localDataObj);
        } else {
          const defaultData = getDefaultUserData();
          setUserData(defaultData);
          await offlineStorage.saveUserData(defaultData);
        }
      }
      setProfileError(null);
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadProfile(firebaseUser)
        .catch((err) => {
          // Without this the rejection escaped the async callback, setLoading
          // never ran, and `{!loading && children}` rendered a blank app.
          console.error('Profile load failed:', err);
          setProfileError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [reloadNonce]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    localStorage.setItem('kurdish_quest_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const signInWithName = useCallback(async (name: string) => {
    const newUser = { displayName: name, uid: 'local_user' };
    setUser(newUser);
    localStorage.setItem('kurdish_quest_user', JSON.stringify(newUser));
    
    const localDataObj = await offlineStorage.getUserData();
    if (localDataObj) {
      setUserData(localDataObj);
    } else {
      const fresh = getDefaultUserData();
      setUserData(fresh);
      await offlineStorage.saveUserData(fresh);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Popup login error:", e);
      throw e;
    }
  }, []);

  const updateProfileName = useCallback(async (name: string) => {
    if (!user) return;
    const updated = { ...user, displayName: name };
    setUser(updated);
    localStorage.setItem('kurdish_quest_user', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name });
      } catch (err) {
        console.warn("Could not save display name update on Firebase auth account", err);
      }
    }
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
    // AUDIT FIX: this passed `null` into a non-nullable UserData state, which
    // crashed under `strict` and produced `userData.xp` reads on null in
    // Roadmap/Profile. Reset to a clean default profile instead.
    setUserData(getDefaultUserData());
    localStorage.removeItem('kurdish_quest_user');
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out err:", e);
    }
  }, []);

  const checkAndUnlockBadges = (data: UserData): string[] => {
    const currentBadges = [...(data.badges || [])];
    const addBadge = (id: string) => {
      if (!currentBadges.includes(id)) {
        currentBadges.push(id);
      }
    };

    if (data.xp >= 50) addBadge('first_steps');
    if (data.xp >= 500) addBadge('dedicated_learner');
    if (data.xp >= 1500) addBadge('academic_achiever');
    if ((data.wordsLearned || 0) >= 10) addBadge('vocabulary_enthusiast');
    if ((data.wordsLearned || 0) >= 50) addBadge('vocabulary_master');
    if ((data.wordsLearned || 0) >= 150) addBadge('polyglot');
    if (data.streak >= 3) addBadge('streak_3');
    if (data.streak >= 7) addBadge('streak_7');
    if ((data.quizzesCompleted || 0) >= 5) addBadge('quiz_conqueror');
    if ((data.quizzesCompleted || 0) >= 20) addBadge('quiz_master');
    if ((data.completedLessons || []).length >= 5) addBadge('lesson_scholar');

    return currentBadges;
  };

  const updateUserProgress = useCallback(async (
    xpToAdd: number, 
    wordsToAdd: number, 
    quizCompleted: boolean = false, 
    gemsToAdd: number = 0,
    opts?: { source?: 'quiz' | 'game'; perfect?: boolean }
  ) => {
    // Read from the ref, not the render closure (see XP-LOSS FIX above).
    const currentData = userDataRef.current || userData || getDefaultUserData();
    const newXp = currentData.xp + xpToAdd;
    
    // Exponential curve level calculation
    const newLevel = calculateLevelFromXP(newXp);
    
    // ECONOMY REDESIGN: gems are granted ONLY when explicitly awarded
    // (quiz perfect/level-up bonuses, mission claims). The old fallback
    // minted Math.max(5, xp/5) gems on EVERY progress event — playing one
    // game paid ~25 gems and the currency meant nothing.
    const calculatedGems = (currentData.gems ?? 100) + Math.max(0, gemsToAdd);
    
    const newWords = (currentData.wordsLearned || 0) + wordsToAdd;
    const newQuizzes = quizCompleted ? (currentData.quizzesCompleted || 0) + 1 : currentData.quizzesCompleted || 0;
    const nextSessions = (currentData.sessionsCount || 0) + 1;
    const updatedTotalTime = (currentData.totalStudyTime || 0) + 2;

    // Daily-goal tally: XP earned today, resetting at the UTC day boundary.
    const todayStr = getUtcDateString();
    const nextXpToday = (currentData.xpTodayDate === todayStr ? (currentData.xpToday || 0) : 0) + xpToAdd;

    // DAILY MISSIONS: activity counters on the same UTC clock. Sessions
    // report their source ('quiz' covers quizzes/practice, 'game' covers
    // arcade wins) and whether the run was perfect.
    const prevMissions = currentData.missionsState;
    const missionCounters = prevMissions && prevMissions.date === todayStr
      ? { ...prevMissions.counters }
      : { quizzes: 0, games: 0, perfect: 0 };
    if (quizCompleted) {
      if ((opts?.source ?? 'quiz') === 'game') missionCounters.games += 1;
      else missionCounters.quizzes += 1;
    }
    if (opts?.perfect) missionCounters.perfect += 1;
    const nextMissionsState = {
      date: todayStr,
      counters: missionCounters,
      claimed: prevMissions && prevMissions.date === todayStr ? prevMissions.claimed : [],
    };

    // Check and update streak with UTC date safety and freeze shields
    const streakResult = checkAndUpdateStreak(currentData);

    const nextLevelUnlocks = ['A1'];
    if (newXp >= 150) nextLevelUnlocks.push('A2');
    if (newXp >= 450) nextLevelUnlocks.push('B1');
    if (newXp >= 800) nextLevelUnlocks.push('B2');
    if (newXp >= 1300) nextLevelUnlocks.push('Advanced');

    let updatedData: UserData = {
      ...currentData,
      xp: newXp,
      xpToday: nextXpToday,
      xpTodayDate: todayStr,
      missionsState: nextMissionsState,
      level: newLevel,
      gems: calculatedGems,
      streak: streakResult.updatedStreak,
      streakFreezes: streakResult.streakFreezes,
      wordsLearned: newWords,
      quizzesCompleted: newQuizzes,
      sessionsCount: nextSessions,
      totalStudyTime: updatedTotalTime,
      unlockedLevels: nextLevelUnlocks,
      lastActive: Date.now(),
      lastActiveDate: streakResult.lastActiveDate,
      updatedAt: Date.now(),
    };

    const newBadges = checkAndUnlockBadges(updatedData);
    updatedData.badges = newBadges;
    
    // Commit synchronously to the ref FIRST so an immediately-following
    // updateUserData composes on top of this write instead of reverting it.
    userDataRef.current = updatedData;
    // Optimistic UI & Tier 1/2 Local Updates
    setUserData(updatedData);
    await offlineStorage.saveUserData(updatedData);

    // Network & Queue Handling
    if (user && user.uid !== 'local_user') {
      if (navigator.onLine) {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, updatedData, { merge: true });
        } catch (err) {
          // Queue mutation on network error
          await offlineStorage.enqueueMutation({
            userId: user.uid,
            type: 'UPDATE_PROGRESS',
            payload: { xpToAdd, wordsToAdd, quizCompleted, gemsToAdd }
          });
        }
      } else {
        // Queue mutation when offline
        await offlineStorage.enqueueMutation({
          userId: user.uid,
          type: 'UPDATE_PROGRESS',
          payload: { xpToAdd, wordsToAdd, quizCompleted, gemsToAdd }
        });
      }
    }
  }, [user, userData]);

  const updateUserData = useCallback(async (data: Partial<UserData>) => {
    // Read from the ref, not the render closure (see XP-LOSS FIX above).
    const currentData = userDataRef.current || userData || getDefaultUserData();
    const updatedData: UserData = {
      ...currentData,
      ...data,
      updatedAt: Date.now(),
    };
    
    // Commit synchronously (compose with any write earlier in this tick).
    userDataRef.current = updatedData;
    // Optimistic UI & Local updates
    setUserData(updatedData);
    await offlineStorage.saveUserData(updatedData);

    if (user && user.uid !== 'local_user') {
      if (navigator.onLine) {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, updatedData, { merge: true });
        } catch (err) {
          await offlineStorage.enqueueMutation({
            userId: user.uid,
            type: 'UPDATE_PROGRESS',
            payload: { data }
          });
        }
      } else {
        await offlineStorage.enqueueMutation({
          userId: user.uid,
          type: 'UPDATE_PROGRESS',
          payload: { data }
        });
      }
    }
  }, [user, userData]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kurdish_quest_lang', lang);
  }, []);

  const retryProfileLoad = useCallback(() => {
    setProfileError(null);
    setLoading(true);
    setReloadNonce(n => n + 1);
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    userData,
    loading,
    profileError,
    retryProfileLoad,
    language,
    setLanguage,
    theme,
    toggleTheme,
    signInWithName,
    loginWithGoogle,
    logout,
    updateUserProgress,
    updateUserData,
    updateProfileName
  }), [
    user,
    userData,
    loading,
    profileError,
    retryProfileLoad,
    language,
    setLanguage,
    theme,
    toggleTheme,
    signInWithName,
    loginWithGoogle,
    logout,
    updateUserProgress,
    updateUserData,
    updateProfileName
  ]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


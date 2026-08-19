/**
 * CloudLeaderboard.ts
 *
 * REAL leaderboard backend (TODO-003 / F003).
 *
 * Source of truth: Firestore collection `leaderboard/{uid}` — one public
 * entry per signed-in (non-guest) user, written ONLY by its owner. Reads are
 * ordered by XP server-side.
 *
 * Anti-tamper design (enforced in firestore.rules):
 *  - only the owner may write their entry;
 *  - the entry's `xp` must exactly mirror the user's own `users/{uid}.xp`
 *    profile document, so there is no second place to invent a score;
 *  - profile XP itself is validated monotonic (never decreases) with a sane
 *    upper bound.
 * LIMITATION (documented, accepted): without server-side Cloud Functions the
 * client ultimately reports its own XP; the rules stop casual tampering
 * (arbitrary jumps to other users' docs, score resets, absurd values) but a
 * determined attacker can still inflate their own progress. True anti-cheat
 * requires server-authored score writes — out of scope for this phase.
 *
 * This module is only ever called when `isFirebaseConfigured` is true AND the
 * current user is a real Firebase user (never for the local guest).
 */
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { LeaderboardEntry } from './LeaderboardService';

const COLLECTION = 'leaderboard';
const GUEST_UID = 'local_user';

export function isRealLeaderboardUser(user: { uid?: string } | null | undefined): boolean {
  return isFirebaseConfigured && !!user?.uid && user.uid !== GUEST_UID;
}

/** Fetch the top N real entries, ordered by XP (server-side). */
export async function fetchCloudLeaderboard(
  currentUid: string,
  limitN = 50
): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, COLLECTION), orderBy('xp', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    // SAFETY: Firestore DocumentData is untrusted; every field is coerced (String/Number) immediately below.
    const data = d.data() as { name?: string; xp?: number; avatar?: string };
    return {
      uid: d.id,
      // Boundary coercion of untrusted server fields (no typeof narrowing):
      name: String(data.name ?? 'Learner'),
      xp: Number(data.xp) || 0,
      avatar: String(data.avatar ?? 'av-1'),
      isCurrentUser: d.id === currentUid,
    };
  });
}

/**
 * Publish/refresh the caller's own entry. Fire-and-forget safe: failures are
 * swallowed after a console.warn — the board then simply shows the last
 * successfully published state.
 */
export async function publishOwnEntry(
  uid: string,
  name: string,
  xp: number,
  avatar: string
): Promise<void> {
  try {
    await setDoc(
      doc(db, COLLECTION, uid),
      {
        name: name.slice(0, 50),
        xp: Math.max(0, Math.floor(xp)),
        avatar,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[CloudLeaderboard] publish failed (board will show last known entry):', err);
  }
}

/**
 * tours.ts — Guided-tour definitions, gating and persistence (Driver.js).
 *
 * Two chained journeys replace the "random tapping" first session:
 *
 *   1. WELCOME (Dashboard)  — concept overview → streak/gems → daily goal →
 *      recommended lesson → ACTION: tap the Roadmap tab.
 *   2. ROADMAP (Roadmap)    — path overview → ACTION: tap the first playable
 *      lesson node (opens the lesson sheet → quiz).
 *
 * Steps flagged `requiresAction` are interactive checkpoints: the popover has
 * no "Next" button and the tour only advances when the learner actually taps
 * the highlighted control. Finishing the full chain pays a one-time gem
 * bonus (TOUR_REWARD_GEMS), guarded by TOUR_REWARD_CLAIMED_ID so replays via
 * Profile → Settings can never mint gems twice.
 *
 * Completion state is persisted twice: in `userData.completedTours` (synced
 * profile) and mirrored in localStorage so a slow profile load can't re-nag.
 */
import { t } from '../../localization/translations';
import type { Language, UserData } from '../../models/user';
import { learningPath } from '../../data/learningPath';

export const WELCOME_TOUR_ID = 'tour_home_v1';
export const ROADMAP_TOUR_ID = 'tour_roadmap_v1';
/** Permanent flag: the chain-completion gem bonus was already paid out. */
export const TOUR_REWARD_CLAIMED_ID = 'tour_reward_claimed_v1';
/** One-time gem bonus for finishing the guided chain (paid on the roadmap leg). */
export const TOUR_REWARD_GEMS = 20;
/** sessionStorage key used to hand the tour over across route changes. */
export const TOUR_CHAIN_STORAGE_KEY = 'kurdish_quest_tour_chain';

const TOURS_DONE_STORAGE_KEY = 'kurdish_quest_tours_done_v1';

export interface TourStepDef {
  /** CSS selector of the highlight target; omitted = centered modal step. */
  element?: string;
  title: string;
  description: string;
  /** Interactive checkpoint: learner must click the highlighted element. */
  requiresAction?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

/* ------------------------------------------------------------------ */
/* Local persistence (mirror of userData.completedTours)              */
/* ------------------------------------------------------------------ */

function readLocalCompletions(): string[] {
  try {
    const raw = localStorage.getItem(TOURS_DONE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [];
  }
}

export function markTourCompletedLocally(tourId: string): void {
  try {
    const merged = Array.from(new Set([...readLocalCompletions(), tourId]));
    localStorage.setItem(TOURS_DONE_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Storage unavailable (private mode) — userData persistence still applies.
  }
}

export function isTourCompleted(tourId: string, userData: UserData | null | undefined): boolean {
  if ((userData?.completedTours ?? []).includes(tourId)) return true;
  return readLocalCompletions().includes(tourId);
}

export function isTourRewardClaimed(userData: UserData | null | undefined): boolean {
  return isTourCompleted(TOUR_REWARD_CLAIMED_ID, userData);
}

/**
 * Profile → Settings "Replay tour": forget both tour completions (but NEVER
 * the reward flag — replays are free, gems are not) and arm the chain so the
 * Dashboard restarts the walkthrough on arrival. Returns the userData patch
 * the caller should persist via updateUserData.
 */
export function resetToursForReplay(userData: UserData | null | undefined): Partial<UserData> {
  try {
    const keptLocal = readLocalCompletions().filter((id) => id === TOUR_REWARD_CLAIMED_ID);
    localStorage.setItem(TOURS_DONE_STORAGE_KEY, JSON.stringify(keptLocal));
  } catch {
    // Best effort; the userData patch below is the source of truth.
  }
  try {
    sessionStorage.setItem(TOUR_CHAIN_STORAGE_KEY, 'welcome');
  } catch {
    // Without sessionStorage the Dashboard simply won't force-start; harmless.
  }
  return {
    completedTours: (userData?.completedTours ?? []).filter((id) => id === TOUR_REWARD_CLAIMED_ID),
  };
}

/* ------------------------------------------------------------------ */
/* Gating                                                              */
/* ------------------------------------------------------------------ */

/**
 * Auto-start the welcome tour only for genuinely fresh accounts: onboarding
 * wizard finished, no lessons completed, no game history, tour never seen.
 */
export function shouldAutoStartWelcomeTour(userData: UserData | null | undefined): boolean {
  if (!userData) return false;
  if (userData.isOnboarded === false) return false; // wizard still on screen
  if ((userData.completedLessons ?? []).length > 0) return false;
  if (Object.keys(userData.gameScores ?? {}).length > 0) return false;
  return !isTourCompleted(WELCOME_TOUR_ID, userData);
}

/**
 * The first lesson node the learner can actually play — same rule the
 * Roadmap uses for its "PLAY" badge (first non-completed lesson within an
 * unlocked world, falling back to the very first lesson).
 */
export function getFirstActionableLessonId(userData: UserData | null | undefined): string | null {
  const completed = userData?.completedLessons ?? [];
  const xp = userData?.xp ?? 0;
  for (const lvl of learningPath) {
    if (xp >= lvl.requiredXp) {
      for (const lesson of lvl.lessons) {
        if (!completed.includes(lesson.id)) return lesson.id;
      }
    }
  }
  if (learningPath.length > 0 && learningPath[0].lessons.length > 0) {
    return learningPath[0].lessons[0].id;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Step definitions                                                    */
/* ------------------------------------------------------------------ */

export function buildWelcomeTourSteps(language: Language): TourStepDef[] {
  return [
    {
      title: t(language, 'tour_welcome_title'),
      description: t(language, 'tour_welcome_desc'),
    },
    {
      element: '[data-tour="stats-pill"]',
      title: t(language, 'tour_stats_title'),
      description: t(language, 'tour_stats_desc'),
      side: 'bottom',
      align: 'end',
    },
    {
      element: '[data-tour="daily-goal"]',
      title: t(language, 'tour_goal_title'),
      description: t(language, 'tour_goal_desc'),
      side: 'bottom',
    },
    {
      element: '[data-tour="next-lesson"]',
      title: t(language, 'tour_lesson_title'),
      description: t(language, 'tour_lesson_desc'),
      side: 'bottom',
    },
    {
      element: '[data-tour="nav-roadmap"]',
      title: t(language, 'tour_nav_roadmap_title'),
      description: t(language, 'tour_nav_roadmap_desc'),
      requiresAction: true,
      side: 'top',
    },
  ];
}

export function buildRoadmapTourSteps(language: Language, firstLessonNodeId: string): TourStepDef[] {
  return [
    {
      title: t(language, 'tour_map_title'),
      description: t(language, 'tour_map_desc'),
    },
    {
      element: `#${firstLessonNodeId}`,
      title: t(language, 'tour_first_lesson_title'),
      description: t(language, 'tour_first_lesson_desc'),
      requiresAction: true,
      side: 'bottom',
    },
  ];
}

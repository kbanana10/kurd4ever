/**
 * tour.test.ts — guided-tour (Driver.js) definitions, gating & persistence.
 *
 * Covers the pure layer in src/features/tour/tours.ts:
 *   • step shape for both tour legs (welcome chain → roadmap chain)
 *   • interactive checkpoints: exactly one action step per leg, always last
 *   • tri-lingual copy (en/ku/ar) with the project i18n rule: non-Arabic UIs
 *     must never contain Arabic-script fallbacks
 *   • auto-start gating (fresh accounts only) and completion persistence
 *   • replay reset keeps the one-time gem-reward flag (no gem farming)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  WELCOME_TOUR_ID,
  ROADMAP_TOUR_ID,
  TOUR_REWARD_CLAIMED_ID,
  TOUR_CHAIN_STORAGE_KEY,
  buildWelcomeTourSteps,
  buildRoadmapTourSteps,
  shouldAutoStartWelcomeTour,
  getFirstActionableLessonId,
  isTourCompleted,
  isTourRewardClaimed,
  markTourCompletedLocally,
  resetToursForReplay,
} from '../src/features/tour/tours';
import type { UserData } from '../src/models/user';
import { learningPath } from '../src/data/learningPath';

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

function makeUserData(overrides: Partial<UserData> = {}): UserData {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActive: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wordsLearned: 0,
    recentSearches: [],
    favorites: [],
    isOnboarded: true,
    completedLessons: [],
    gameScores: {},
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('guided tour — step definitions', () => {
  it('welcome tour has 5 steps and ends on a single interactive checkpoint (roadmap tab)', () => {
    for (const lang of ['en', 'ku', 'ar'] as const) {
      const steps = buildWelcomeTourSteps(lang);
      expect(steps).toHaveLength(5);
      const actionSteps = steps.filter(s => s.requiresAction === true);
      expect(actionSteps).toHaveLength(1);
      expect(steps[steps.length - 1].requiresAction).toBe(true);
      expect(steps[steps.length - 1].element).toBe('[data-tour="nav-roadmap"]');
      // Every step must carry real copy.
      for (const step of steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('welcome tour highlights the dashboard anchors in flow order', () => {
    const steps = buildWelcomeTourSteps('en');
    expect(steps[0].element).toBeUndefined(); // centered concept overview
    expect(steps[1].element).toBe('[data-tour="stats-pill"]');
    expect(steps[2].element).toBe('[data-tour="daily-goal"]');
    expect(steps[3].element).toBe('[data-tour="next-lesson"]');
  });

  it('roadmap tour has an intro plus an interactive first-lesson checkpoint', () => {
    for (const lang of ['en', 'ku', 'ar'] as const) {
      const steps = buildRoadmapTourSteps(lang, 'roadmap-node-a1_family');
      expect(steps).toHaveLength(2);
      expect(steps[0].requiresAction).toBeUndefined();
      expect(steps[1].requiresAction).toBe(true);
      expect(steps[1].element).toBe('#roadmap-node-a1_family');
    }
  });

  it('i18n: en/ku copy never falls back to Arabic script; ar copy is Arabic', () => {
    for (const lang of ['en', 'ku'] as const) {
      for (const step of [...buildWelcomeTourSteps(lang), ...buildRoadmapTourSteps(lang, 'x')]) {
        expect(ARABIC_SCRIPT.test(step.title)).toBe(false);
        expect(ARABIC_SCRIPT.test(step.description)).toBe(false);
      }
    }
    const arSteps = buildWelcomeTourSteps('ar');
    expect(arSteps.some(s => ARABIC_SCRIPT.test(s.description))).toBe(true);
    // en and ku copy must actually differ (real translations, not clones).
    expect(buildWelcomeTourSteps('en')[0].description)
      .not.toBe(buildWelcomeTourSteps('ku')[0].description);
  });
});

describe('guided tour — auto-start gating', () => {
  it('starts for a genuinely fresh, onboarded account', () => {
    expect(shouldAutoStartWelcomeTour(makeUserData())).toBe(true);
  });

  it('never starts over the onboarding wizard or without a profile', () => {
    expect(shouldAutoStartWelcomeTour(null)).toBe(false);
    expect(shouldAutoStartWelcomeTour(makeUserData({ isOnboarded: false }))).toBe(false);
  });

  it('never starts for established users (lessons or game history)', () => {
    expect(shouldAutoStartWelcomeTour(makeUserData({ completedLessons: ['a1_family'] }))).toBe(false);
    expect(shouldAutoStartWelcomeTour(makeUserData({ gameScores: { zombie: 12 } }))).toBe(false);
  });

  it('never starts twice: honours both userData and the localStorage mirror', () => {
    expect(shouldAutoStartWelcomeTour(makeUserData({ completedTours: [WELCOME_TOUR_ID] }))).toBe(false);
    markTourCompletedLocally(WELCOME_TOUR_ID);
    expect(shouldAutoStartWelcomeTour(makeUserData())).toBe(false);
  });
});

describe('guided tour — persistence & replay', () => {
  it('markTourCompletedLocally round-trips through isTourCompleted', () => {
    expect(isTourCompleted(ROADMAP_TOUR_ID, null)).toBe(false);
    markTourCompletedLocally(ROADMAP_TOUR_ID);
    expect(isTourCompleted(ROADMAP_TOUR_ID, null)).toBe(true);
  });

  it('replay reset clears tour completions but PRESERVES the gem-reward flag', () => {
    markTourCompletedLocally(WELCOME_TOUR_ID);
    markTourCompletedLocally(ROADMAP_TOUR_ID);
    markTourCompletedLocally(TOUR_REWARD_CLAIMED_ID);
    const userData = makeUserData({
      completedTours: [WELCOME_TOUR_ID, ROADMAP_TOUR_ID, TOUR_REWARD_CLAIMED_ID],
    });

    const patch = resetToursForReplay(userData);

    expect(patch.completedTours).toEqual([TOUR_REWARD_CLAIMED_ID]);
    expect(isTourCompleted(WELCOME_TOUR_ID, null)).toBe(false);
    expect(isTourCompleted(ROADMAP_TOUR_ID, null)).toBe(false);
    expect(isTourRewardClaimed(null)).toBe(true); // reward can never be farmed
    expect(sessionStorage.getItem(TOUR_CHAIN_STORAGE_KEY)).toBe('welcome'); // chain armed
  });

  it('corrupt localStorage payloads are treated as "no completions"', () => {
    localStorage.setItem('kurdish_quest_tours_done_v1', '{not json');
    expect(isTourCompleted(WELCOME_TOUR_ID, null)).toBe(false);
    localStorage.setItem('kurdish_quest_tours_done_v1', '"a-string"');
    expect(isTourCompleted(WELCOME_TOUR_ID, null)).toBe(false);
  });
});

describe('guided tour — first actionable lesson resolution', () => {
  it('fresh account points at the very first lesson of the path', () => {
    expect(getFirstActionableLessonId(makeUserData())).toBe(learningPath[0].lessons[0].id);
  });

  it('skips completed lessons within unlocked worlds', () => {
    const first = learningPath[0].lessons[0].id;
    const second = learningPath[0].lessons[1].id;
    expect(getFirstActionableLessonId(makeUserData({ completedLessons: [first] }))).toBe(second);
  });

  it('falls back to the first lesson when everything is completed', () => {
    const allIds = learningPath.flatMap(lvl => lvl.lessons.map(l => l.id));
    expect(getFirstActionableLessonId(makeUserData({ xp: 999999, completedLessons: allIds })))
      .toBe(learningPath[0].lessons[0].id);
  });
});

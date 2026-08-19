/**
 * useAppTour — reusable Driver.js wrapper for Kurdish Quest guided tours.
 *
 * Responsibilities:
 *   • Turns declarative TourStepDef[] (see tours.ts) into a configured
 *     Driver.js session skinned to the app design system (tour.css).
 *   • Locks down stray input during a session: overlay clicks are swallowed,
 *     keyboard shortcuts are off, and non-action steps keep the highlighted
 *     element inert (disableActiveInteraction). Only "requiresAction" steps
 *     let the learner tap the real control — and that tap is what advances.
 *   • Persists completion (localStorage mirror + userData.completedTours)
 *     no matter how the session ends, so the tour never nags twice.
 *   • Pays the one-time chain reward (gems + in-app toast) when the final
 *     action step is genuinely performed, guarded by TOUR_REWARD_CLAIMED_ID.
 */
import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import type { Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { useAuth } from '../../store/AuthContext';
import { t, getLayoutDirection } from '../../localization/translations';
import type { UserData } from '../../models/user';
import {
  TOUR_REWARD_CLAIMED_ID,
  isTourRewardClaimed,
  markTourCompletedLocally,
} from './tours';
import type { TourStepDef } from './tours';

interface AppTourRunOptions {
  tourId: string;
  steps: TourStepDef[];
  /** Gems granted the first time a tour chain is finished via its action step. */
  rewardGems?: number;
  /** Fires when the final action step's element was actually clicked. */
  onFinishedAction?: () => void;
}

interface UseAppTourApi {
  /** Start a tour session (no-op if one is already running). */
  startTour: (options: AppTourRunOptions) => void;
}

// One session at a time, shared across every hook consumer (the overlay is
// document-global, so two concurrent drivers would fight over the stage).
let activeDriver: Driver | null = null;

export function useAppTour(): UseAppTourApi {
  const { language, userData, updateUserData } = useAuth();

  // Snapshot ref: completion writes must read the freshest profile, not the
  // render closure that existed when the tour started minutes earlier.
  const userDataRef = useRef<UserData | null>(userData);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const startedHereRef = useRef(false);

  const finalizeTour = useCallback(async (tourId: string, finishedByAction: boolean, rewardGems: number) => {
    markTourCompletedLocally(tourId);
    const current = userDataRef.current;
    const previous = current?.completedTours ?? [];
    const grantReward = finishedByAction && rewardGems > 0 && !isTourRewardClaimed(current);
    const nextCompleted = Array.from(new Set(
      grantReward ? [...previous, tourId, TOUR_REWARD_CLAIMED_ID] : [...previous, tourId],
    ));
    if (grantReward) markTourCompletedLocally(TOUR_REWARD_CLAIMED_ID);

    const patch: Partial<UserData> = { completedTours: nextCompleted };
    if (grantReward) {
      patch.gems = (current?.gems ?? 100) + rewardGems;
    }
    await updateUserData(patch);

    if (grantReward) {
      window.dispatchEvent(new CustomEvent('trigger-in-app-notification', {
        detail: {
          title: t(language, 'tour_reward_title'),
          message: t(language, 'tour_reward_msg'),
        },
      }));
    }
  }, [language, updateUserData]);

  const startTour = useCallback((options: AppTourRunOptions) => {
    if (globalThis.document === undefined) return;
    if (activeDriver !== null && activeDriver.isActive()) return;

    const direction = getLayoutDirection(language);
    let finishedByAction = false;

    const steps: DriveStep[] = options.steps.map((def, index) => {
      const isAction = def.requiresAction === true;
      const isLast = index === options.steps.length - 1;
      const step: DriveStep = {
        element: def.element,
        // Info steps: the live control stays inert (no accidental taps).
        // Action steps: the control is the ONLY thing the learner can tap.
        disableActiveInteraction: !isAction,
        popover: {
          title: def.title,
          description: def.description,
          side: def.side,
          align: def.align,
          showButtons: isAction
            ? ['close']
            : index === 0
              ? ['next', 'close']
              : ['next', 'previous', 'close'],
        },
      };
      if (isAction) {
        step.onHighlighted = (element) => {
          if (!element) return;
          element.addEventListener('click', () => {
            if (finishedByAction) return;
            if (isLast) {
              finishedByAction = true;
              activeDriver?.destroy();
            } else {
              activeDriver?.moveNext();
            }
          }, { once: true, capture: true });
        };
      }
      return step;
    });

    const instance = driver({
      steps,
      animate: true,
      smoothScroll: true,
      // Guided session = no random exits: overlay taps and Esc do nothing,
      // arrow keys can't skip an interactive checkpoint. The ✕ button is the
      // single, explicit way out.
      allowClose: false,
      overlayClickBehavior: () => undefined,
      allowKeyboardControl: false,
      overlayColor: '#1E293B',
      overlayOpacity: 0.72,
      stagePadding: 6,
      stageRadius: 18,
      popoverClass: 'kq-tour',
      showProgress: options.steps.length > 1,
      progressText: '{{current}} / {{total}}',
      nextBtnText: t(language, 'tour_next'),
      prevBtnText: t(language, 'tour_back'),
      doneBtnText: t(language, 'tour_done'),
      disableActiveInteraction: true,
      skipMissingElement: true,
      onPopoverRender: (popover) => {
        popover.wrapper.setAttribute('dir', direction);
        // Driver auto-focuses the first focusable control, which is the ✕
        // (skip). Move focus to the primary Next/Done button instead so the
        // app's gold focus ring highlights the intended action and Enter
        // advances the tour. Action steps render no Next button, so focus
        // stays where driver put it.
        window.setTimeout(() => {
          if (popover.nextButton.style.display !== 'none') popover.nextButton.focus();
        }, 0);
      },
      onCloseClick: () => {
        instance.destroy();
      },
      onDestroyed: () => {
        activeDriver = null;
        startedHereRef.current = false;
        void finalizeTour(options.tourId, finishedByAction, options.rewardGems ?? 0);
        if (finishedByAction) options.onFinishedAction?.();
      },
    });

    activeDriver = instance;
    startedHereRef.current = true;
    instance.drive();
  }, [language, finalizeTour]);

  // If the page that launched the tour unmounts mid-session (back button,
  // deep link, …) tear the overlay down — a stage pinned to a dead DOM node
  // would otherwise cover the next screen.
  useEffect(() => () => {
    if (startedHereRef.current && activeDriver !== null && activeDriver.isActive()) {
      activeDriver.destroy();
    }
  }, []);

  return { startTour };
}

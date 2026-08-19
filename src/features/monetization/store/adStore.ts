/**
 * adStore.ts
 * 
 * Zustand store to manage full coordination of AdMob Banner, Interstitial and Rewarded ads.
 */
import { create } from 'zustand';

interface AdState {
  // Banner state
  bannersEnabled: boolean;
  
  // Interstitial state
  interstitialActive: boolean;
  interstitialLoading: boolean;
  interstitialOnClose: (() => void) | null;
  
  // Rewarded state
  rewardedActive: boolean;
  rewardedLoading: boolean;
  rewardedOnSuccess: (() => void) | null;
  rewardedOnClose: (() => void) | null;

  // Actions
  setBannersEnabled: (enabled: boolean) => void;
  showInterstitial: (onClose: () => void) => void;
  closeInterstitial: () => void;
  showRewarded: (onSuccess: () => void, onClose?: () => void) => void;
  closeRewarded: (successFullyCompleted: boolean) => void;
}

export const useAdStore = create<AdState>((set, get) => ({
  bannersEnabled: true,
  
  interstitialActive: false,
  interstitialLoading: false,
  interstitialOnClose: null,
  
  rewardedActive: false,
  rewardedLoading: false,
  rewardedOnSuccess: null,
  rewardedOnClose: null,

  setBannersEnabled: (bannersEnabled) => set({ bannersEnabled }),
  
  showInterstitial: (onClose) => {
    // Standard AdMob interstitial trigger simulating loader
    set({ interstitialLoading: true });
    
    // Auto-open ad after a micro-second loading state to mimic SDK handshake
    setTimeout(() => {
      set({ 
        interstitialActive: true, 
        interstitialLoading: false,
        interstitialOnClose: onClose 
      });
    }, 400);
  },
  
  closeInterstitial: () => {
    const { interstitialOnClose } = get();
    set({ interstitialActive: false, interstitialOnClose: null });
    if (interstitialOnClose) {
      interstitialOnClose();
    }
  },
  
  showRewarded: (onSuccess, onClose) => {
    set({ rewardedLoading: true });
    
    setTimeout(() => {
      set({
        rewardedActive: true,
        rewardedLoading: false,
        rewardedOnSuccess: onSuccess,
        rewardedOnClose: onClose || null
      });
    }, 500);
  },
  
  closeRewarded: (successFullyCompleted) => {
    const { rewardedOnSuccess, rewardedOnClose } = get();
    set({ rewardedActive: false, rewardedOnSuccess: null, rewardedOnClose: null });
    
    if (successFullyCompleted && rewardedOnSuccess) {
      rewardedOnSuccess();
    } else if (rewardedOnClose) {
      rewardedOnClose();
    }
  }
}));

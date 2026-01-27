
import { usePremium } from '@/contexts/PremiumContext';

// Web version - no ads on web platform
export function useInterstitialAd() {
  const { isPremium } = usePremium();

  console.log('InterstitialAdManager (Web): Ads not supported on web platform');

  const showInterstitialAd = async () => {
    console.log('InterstitialAdManager (Web): No-op - ads not supported on web');
  };

  return { showInterstitialAd };
}

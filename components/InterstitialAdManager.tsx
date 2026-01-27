
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { usePremium } from '@/contexts/PremiumContext';

// Replace with your actual AdMob ad unit IDs from Google AdMob console
const AD_UNIT_ID = __DEV__ 
  ? TestIds.INTERSTITIAL 
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
      default: TestIds.INTERSTITIAL
    });

let interstitialAd: InterstitialAd | null = null;
let isAdLoaded = false;
let gameCompletionCount = 0;
const GAMES_BEFORE_AD = 3; // Show ad every 3 games

export function useInterstitialAd() {
  const { isPremium } = usePremium();
  const adRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    if (isPremium) {
      console.log('InterstitialAdManager: User is premium, not loading ads');
      return;
    }

    console.log('InterstitialAdManager: Initializing interstitial ad');
    
    // Create and load the interstitial ad
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Set up event listeners
    const loadedListener = ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log('InterstitialAdManager: Ad loaded successfully');
      isAdLoaded = true;
    });

    const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('InterstitialAdManager: Ad failed to load', error);
      isAdLoaded = false;
    });

    const closedListener = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('InterstitialAdManager: Ad closed, loading next ad');
      isAdLoaded = false;
      // Load the next ad
      ad.load();
    });

    // Load the ad
    ad.load();
    
    interstitialAd = ad;
    adRef.current = ad;

    // Cleanup
    return () => {
      console.log('InterstitialAdManager: Cleaning up ad listeners');
      loadedListener();
      errorListener();
      closedListener();
    };
  }, [isPremium]);

  const showInterstitialAd = async () => {
    if (isPremium) {
      console.log('InterstitialAdManager: User is premium, not showing ad');
      return;
    }

    gameCompletionCount++;
    console.log('InterstitialAdManager: Game completion count:', gameCompletionCount);

    if (gameCompletionCount % GAMES_BEFORE_AD !== 0) {
      console.log('InterstitialAdManager: Not time to show ad yet');
      return;
    }

    if (!interstitialAd || !isAdLoaded) {
      console.log('InterstitialAdManager: Ad not ready to show');
      return;
    }

    try {
      console.log('InterstitialAdManager: Showing interstitial ad');
      await interstitialAd.show();
    } catch (error) {
      console.error('InterstitialAdManager: Error showing ad', error);
    }
  };

  return { showInterstitialAd };
}

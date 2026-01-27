
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePremium } from '@/contexts/PremiumContext';
import Constants from 'expo-constants';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// AdMob ad unit IDs from Google AdMob console
const getAdUnitId = () => {
  return __DEV__ 
    ? TestIds.INTERSTITIAL 
    : Platform.select({
        ios: 'ca-app-pub-5783177820090411/2802142638',
        android: 'ca-app-pub-5783177820090411/8643127250',
        default: TestIds.INTERSTITIAL
      });
};

let interstitialAd: any = null;
let isAdLoaded = false;
let gameCompletionCount = 0;
const GAMES_BEFORE_AD = 3; // Show ad every 3 games

export function useInterstitialAd() {
  const { isPremium } = usePremium();
  const adRef = useRef<any>(null);

  useEffect(() => {
    if (isPremium || isExpoGo) {
      console.log('InterstitialAdManager: Not loading ads - isPremium:', isPremium, 'isExpoGo:', isExpoGo);
      return;
    }

    console.log('InterstitialAdManager: Initializing interstitial ad');
    
    const AD_UNIT_ID = getAdUnitId();
    
    // Create and load the interstitial ad
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Set up event listeners
    const loadedListener = ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log('InterstitialAdManager: Ad loaded successfully');
      isAdLoaded = true;
    });

    const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
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
    if (isPremium || isExpoGo) {
      console.log('InterstitialAdManager: Not showing ad - isPremium:', isPremium, 'isExpoGo:', isExpoGo);
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

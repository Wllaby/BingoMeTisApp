
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePremium } from '@/contexts/PremiumContext';

// AdMob ad unit IDs from Google AdMob console
const AD_UNIT_ID = __DEV__ 
  ? TestIds.ADAPTIVE_BANNER 
  : Platform.select({
      ios: 'ca-app-pub-5783177820090411/5553929484',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
      default: TestIds.ADAPTIVE_BANNER
    });

interface AdBannerProps {
  position?: 'top' | 'bottom';
}

export function AdBanner({ position = 'bottom' }: AdBannerProps) {
  const { isPremium, isLoading } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    console.log('AdBanner: Component mounted, isPremium:', isPremium);
  }, [isPremium]);

  // Don't show ads if user is premium or still loading
  if (isPremium || isLoading) {
    console.log('AdBanner: Not showing ad - isPremium:', isPremium, 'isLoading:', isLoading);
    return null;
  }

  const containerStyle = position === 'top' ? styles.topContainer : styles.bottomContainer;

  return (
    <View style={[styles.container, containerStyle]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('AdBanner: Ad loaded successfully');
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error) => {
          console.error('AdBanner: Failed to load ad', error);
          setAdLoaded(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  }
});

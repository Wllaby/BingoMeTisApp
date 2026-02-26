import mobileAds from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function initializeGoogleMobileAds(): Promise<void> {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo || Platform.OS === 'web') {
    console.log('Skipping Google Mobile Ads initialization (Expo Go or Web)');
    return;
  }

  try {
    await mobileAds().initialize();
    console.log('Google Mobile Ads initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Mobile Ads:', error);
    throw error;
  }
}

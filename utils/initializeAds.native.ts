import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import Google Mobile Ads only if NOT in Expo Go
let mobileAds: any = null;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    mobileAds = require('react-native-google-mobile-ads').default;
    console.log('initializeAds: Google Mobile Ads module loaded successfully');
  } catch (error) {
    console.error('initializeAds: Failed to load Google Mobile Ads module:', error);
  }
}

export async function initializeGoogleMobileAds(): Promise<void> {
  if (isExpoGo || Platform.OS === 'web') {
    console.log('Skipping Google Mobile Ads initialization (Expo Go or Web)');
    return;
  }

  if (!mobileAds) {
    console.log('Google Mobile Ads module not available, skipping initialization');
    return;
  }

  try {
    await mobileAds().initialize();
    console.log('Google Mobile Ads initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Mobile Ads:', error);
    // Don't throw - just log the error and continue
    console.log('Continuing without Google Mobile Ads');
  }
}

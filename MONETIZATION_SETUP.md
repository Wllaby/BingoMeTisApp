
# Monetization Setup Guide

This app uses **Superwall** for premium subscriptions and **Google AdMob** for ads (free users only).

## 🚨 Important: Expo Go Limitations

**Native modules like `expo-superwall` and `react-native-google-mobile-ads` DO NOT work in Expo Go.**

### Why?
Expo Go is a sandbox app that only includes a predefined set of native modules. Custom native modules (like Superwall and AdMob) require a custom development build.

### What happens in Expo Go?
- ✅ The app runs normally with **mock implementations**
- ✅ Premium features are simulated (always shows as free user)
- ✅ Ads are hidden (console logs show "not supported on web/Expo Go")
- ❌ You **cannot test** actual payments or ads in Expo Go

## 🛠️ How to Test Payments & Ads

To test Superwall payments and AdMob ads, you need to create a **development build**:

### iOS Development Build
```bash
npx expo run:ios
```

### Android Development Build
```bash
npx expo run:android
```

This will:
1. Install native dependencies (Superwall, AdMob)
2. Build a custom development client
3. Install it on your device/simulator
4. Connect to Metro bundler for fast refresh

## 📱 Superwall Configuration

### API Key
The Superwall API key is configured in `contexts/PremiumContext.native.tsx`:
```typescript
const SUPERWALL_API_KEY = 'pk_QrtKh8s4cybt_M4lx7gg1';
```

### Deep Linking
The app is configured to handle Superwall deep links via the `bingometis://` scheme:
- iOS: Configured in `app.json` → `ios.infoPlist`
- Android: Configured in `app.json` → `android.intentFilters`

### Paywall Placement
The paywall is triggered with the placement ID `premium_upgrade`:
```typescript
await registerPlacement({
  placement: 'premium_upgrade',
  feature: () => {
    console.log('User has premium access');
  }
});
```

## 📊 AdMob Configuration

### Ad Unit IDs
Configured in `app.json`:
```json
{
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-5783177820090411~6455947613",
        "iosAppId": "ca-app-pub-5783177820090411~8022679724"
      }
    ]
  ]
}
```

### Banner Ads
- Component: `components/AdBanner.tsx`
- Shown on: Home screen (free users only)
- Platform-specific implementations:
  - `AdBanner.native.tsx` - iOS/Android (uses AdMob)
  - `AdBanner.web.tsx` - Web (mock implementation)

### Interstitial Ads
- Component: `components/InterstitialAdManager.tsx`
- Shown: After completing a bingo game (free users only)
- Platform-specific implementations:
  - `InterstitialAdManager.native.tsx` - iOS/Android (uses AdMob)
  - `InterstitialAdManager.web.tsx` - Web (mock implementation)

## 🔄 Platform-Specific Code

The app uses platform-specific files to handle native modules:

### Premium Context
- `contexts/PremiumContext.tsx` - Base/Web (mock implementation)
- `contexts/PremiumContext.native.tsx` - iOS/Android (real Superwall)

### Ad Components
- `components/AdBanner.tsx` - Base
- `components/AdBanner.native.tsx` - iOS/Android (real AdMob)
- `components/AdBanner.web.tsx` - Web (mock)

### How it works
React Native automatically picks the correct file:
- On iOS/Android: Uses `.native.tsx` files
- On Web: Uses `.web.tsx` files
- Fallback: Uses base `.tsx` file

## 🧪 Testing Checklist

### In Expo Go (Development)
- [x] App runs without crashes
- [x] Premium features show as "free user"
- [x] No ads displayed
- [x] Premium screen shows "Running in Expo Go" notice
- [x] Console logs show "mock mode" messages

### In Development Build (iOS/Android)
- [ ] Superwall paywall displays correctly
- [ ] Can purchase subscription (test mode)
- [ ] Premium status updates after purchase
- [ ] Banner ads display on home screen (free users)
- [ ] Interstitial ads show after bingo completion (free users)
- [ ] Ads hidden for premium users
- [ ] Deep links work for Superwall

### Production Build
- [ ] Superwall configured with production API key
- [ ] AdMob configured with production ad units
- [ ] App Store/Play Store in-app purchase products configured
- [ ] Subscription status syncs correctly
- [ ] Ads display correctly for free users
- [ ] Premium users see no ads

## 📝 Notes

1. **Expo Go is for rapid development only** - Native modules require custom builds
2. **Mock implementations prevent crashes** - The app gracefully handles missing native modules
3. **Platform-specific files are automatic** - React Native picks the right file based on platform
4. **Console logs are your friend** - Check logs to see which mode is active

## 🔗 Resources

- [Superwall Documentation](https://docs.superwall.com/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Google AdMob with Expo](https://docs.expo.dev/versions/latest/sdk/admob/)
- [React Native Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code)

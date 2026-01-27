
# Monetization Setup Guide

This app now includes **ads** and **premium features** to monetize your bingo game app!

## 🎯 What's Included

### 1. **Ads (Google AdMob)**
- **Banner Ads**: Displayed at the bottom of the home screen for free users
- **Interstitial Ads**: Full-screen ads shown every 3 completed games for free users
- Ads are automatically hidden for premium users

### 2. **Premium Features (Superwall)**
- **No Ads**: Premium users don't see any advertisements
- **Unlimited Custom Themes**: Free users limited to 5 custom themes, premium users get unlimited
- **Priority Support**: Faster response to feedback
- **Early Access**: First to try new features

## 📋 Setup Instructions

### Step 1: Google AdMob Setup

1. **Create an AdMob Account**
   - Go to [https://admob.google.com](https://admob.google.com)
   - Sign in with your Google account
   - Create a new app for your bingo game

2. **Get Your Ad Unit IDs**
   - Create a **Banner Ad Unit** (for bottom banner)
   - Create an **Interstitial Ad Unit** (for full-screen ads)
   - Copy the Ad Unit IDs (format: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`)

3. **Update the Code**
   
   **In `components/AdBanner.tsx`**, replace the placeholder:
   ```typescript
   const AD_UNIT_ID = __DEV__ 
     ? TestIds.ADAPTIVE_BANNER 
     : Platform.select({
         ios: 'ca-app-pub-YOUR_IOS_BANNER_ID',
         android: 'ca-app-pub-YOUR_ANDROID_BANNER_ID',
       });
   ```

   **In `components/InterstitialAdManager.tsx`**, replace the placeholder:
   ```typescript
   const AD_UNIT_ID = __DEV__ 
     ? TestIds.INTERSTITIAL 
     : Platform.select({
         ios: 'ca-app-pub-YOUR_IOS_INTERSTITIAL_ID',
         android: 'ca-app-pub-YOUR_ANDROID_INTERSTITIAL_ID',
       });
   ```

4. **Update `app.json`**
   
   Replace the placeholder App IDs with your actual AdMob App IDs:
   ```json
   {
     "ios": {
       "infoPlist": {
         "GADApplicationIdentifier": "ca-app-pub-YOUR_IOS_APP_ID"
       }
     },
     "plugins": [
       [
         "react-native-google-mobile-ads",
         {
           "androidAppId": "ca-app-pub-YOUR_ANDROID_APP_ID",
           "iosAppId": "ca-app-pub-YOUR_IOS_APP_ID"
         }
       ]
     ]
   }
   ```

### Step 2: Superwall Setup

1. **Create a Superwall Account**
   - Go to [https://superwall.com](https://superwall.com)
   - Sign up for an account
   - Create a new app

2. **Configure Your Paywall**
   - In the Superwall dashboard, create a paywall design
   - Set up your subscription products (e.g., $4.99/month, $29.99/year)
   - Create a placement called `premium_upgrade`

3. **Get Your API Keys**
   - Go to Settings → API Keys in Superwall dashboard
   - Copy your iOS and Android API keys

4. **Update the Code**
   
   **In `contexts/PremiumContext.tsx`**, replace the placeholder:
   ```typescript
   const SUPERWALL_API_KEYS = {
     ios: 'YOUR_IOS_SUPERWALL_API_KEY',
     android: 'YOUR_ANDROID_SUPERWALL_API_KEY'
   };
   ```

5. **Configure App Store Connect / Google Play Console**
   - Set up in-app purchases in App Store Connect (iOS)
   - Set up in-app products in Google Play Console (Android)
   - Link these products to your Superwall account

### Step 3: Testing

1. **Test Ads in Development**
   - The app uses test ad units in development mode (`__DEV__`)
   - You'll see test ads with "Test Ad" labels
   - These don't require any setup

2. **Test Premium Features**
   - Use Superwall's test mode to simulate purchases
   - Check that ads disappear when premium is active
   - Verify unlimited custom themes work

3. **Test on Real Devices**
   - Build the app with `expo prebuild`
   - Test on iOS and Android devices
   - Verify ads load correctly
   - Test the purchase flow

## 🎨 How It Works

### For Free Users:
1. See banner ads at the bottom of the home screen
2. See interstitial ads every 3 completed games
3. Limited to 5 custom themes
4. "Go Premium" button in top-right corner

### For Premium Users:
1. No ads anywhere in the app
2. Unlimited custom themes
3. Premium badge (optional - can be added)
4. Access to all features

## 📊 Monetization Strategy

### Ad Revenue (Free Users)
- **Banner Ads**: Continuous revenue from engaged users
- **Interstitial Ads**: Higher CPM, shown at natural break points (game completion)
- **Frequency Cap**: Every 3 games to avoid annoying users

### Subscription Revenue (Premium Users)
- **Monthly**: $4.99/month (recommended)
- **Yearly**: $29.99/year (save 50%)
- **Lifetime**: $49.99 one-time (optional)

### Conversion Funnel
1. User plays free with ads
2. After 5 custom themes, prompted to upgrade
3. "Go Premium" button always visible
4. Premium screen shows all benefits
5. Superwall handles the purchase flow

## 🚀 Next Steps

1. **Set up AdMob account** and get your ad unit IDs
2. **Set up Superwall account** and configure your paywall
3. **Update the code** with your actual IDs and keys
4. **Test thoroughly** on both iOS and Android
5. **Submit to app stores** with in-app purchases configured
6. **Monitor performance** in AdMob and Superwall dashboards

## 💡 Tips for Success

- **Don't show too many ads**: Current setup (banner + interstitial every 3 games) is balanced
- **Make premium valuable**: Unlimited themes is a strong incentive
- **Test your paywall**: Use A/B testing in Superwall to optimize conversion
- **Monitor metrics**: Track ad revenue, premium conversion rate, and user retention
- **Iterate**: Adjust pricing and features based on user feedback

## 📝 Important Notes

- **Test Mode**: The app uses test ads in development (`__DEV__` mode)
- **Production**: Replace all placeholder IDs before releasing
- **Privacy**: AdMob and Superwall handle GDPR/CCPA compliance
- **Revenue Share**: AdMob takes ~32% of ad revenue, Superwall takes ~5% of subscription revenue

## 🆘 Troubleshooting

### Ads Not Showing
- Check that you've replaced placeholder IDs
- Verify AdMob account is approved
- Check device has internet connection
- Look for errors in console logs

### Premium Not Working
- Verify Superwall API keys are correct
- Check that placement name matches (`premium_upgrade`)
- Ensure in-app purchases are configured in app stores
- Test with Superwall's test mode first

### Build Errors
- Run `npx expo prebuild --clean` to regenerate native code
- Ensure all dependencies are installed
- Check that app.json configuration is correct

## 📞 Support

- **AdMob**: [https://support.google.com/admob](https://support.google.com/admob)
- **Superwall**: [https://docs.superwall.com](https://docs.superwall.com)
- **Expo**: [https://docs.expo.dev](https://docs.expo.dev)

---

**Ready to monetize!** 🎉 Follow the setup steps above and start earning revenue from your bingo app!

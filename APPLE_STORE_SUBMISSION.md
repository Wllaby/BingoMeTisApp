# Apple App Store Submission Guide

## Prerequisites

Before submitting to the Apple App Store, ensure you have:

1. **Apple Developer Account** ($99/year)
   - Enroll at https://developer.apple.com/programs/

2. **App Store Connect Access**
   - Sign in at https://appstoreconnect.apple.com/

3. **EAS CLI Installed**
   ```bash
   npm install -g eas-cli
   ```

## Step 1: Configure Apple Developer Credentials

### Find Your Team ID
1. Go to https://developer.apple.com/account
2. Click on "Membership" in the sidebar
3. Your Team ID will be displayed

### Update eas.json
Replace the placeholder values in `eas.json`:
```json
"appleId": "your-email@example.com",  // Your Apple ID email
"ascAppId": "123456789",              // From App Store Connect (see Step 2)
"appleTeamId": "ABC123XYZ"            // Your Team ID
```

## Step 2: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click "My Apps" → "+" → "New App"
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: Bingo MeTis
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.bingometisapp.bingometis`
   - **SKU**: bingo-metis (or any unique identifier)
4. After creating, note the **App ID** (numeric) from the URL

## Step 3: Prepare App Metadata

In App Store Connect, you'll need to provide:

### Required Information
- **App Name**: Bingo MeTis
- **Subtitle**: (Max 30 characters, e.g., "Fun Bingo Games for All")
- **Description**: Detailed description of your app (4000 characters max)
- **Keywords**: Comma-separated (Max 100 characters)
- **Support URL**: Your support website
- **Marketing URL**: (Optional) Your marketing website
- **Privacy Policy URL**: Required

### App Preview and Screenshots
Required sizes for iPhone:
- 6.7" Display (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796 pixels
- 6.5" Display (iPhone 11 Pro Max, XS Max): 1242 x 2688 pixels

Required sizes for iPad (if supporting tablets):
- 12.9" Display (iPad Pro): 2048 x 2732 pixels

You need at least 1 screenshot, maximum 10 per size.

### App Icon
- **Size**: 1024 x 1024 pixels
- **Format**: PNG or JPG (no alpha channel)
- Already configured: `./assets/images/natively-dark.png`

### Content Rating
Complete the Age Rating questionnaire in App Store Connect.

### App Privacy
Fill out the Privacy section describing:
- What data you collect
- How you use the data
- Data linked to the user

## Step 4: Build for Production

### Login to EAS
```bash
eas login
```

### Configure the project
```bash
eas build:configure
```

### Create Production Build
```bash
eas build --platform ios --profile production
```

This will:
- Build your app for App Store distribution
- Sign it with your distribution certificate
- Upload to EAS servers

## Step 5: Submit to App Store

### Option A: Automatic Submission (Recommended)
```bash
eas submit --platform ios --profile production
```

This will:
- Download the latest build
- Upload to App Store Connect
- Submit for review

### Option B: Manual Submission
1. Download the `.ipa` file from EAS dashboard
2. Use Transporter app (Mac App Store) to upload
3. Go to App Store Connect
4. Select your build under "Build" section
5. Complete all metadata
6. Submit for review

## Step 6: App Review Information

In App Store Connect, provide:
- **Contact Information**: Your email and phone
- **Demo Account**: If your app requires login, provide test credentials
- **Notes**: Any special instructions for reviewers

## Step 7: Submit for Review

1. Click "Add for Review"
2. Select manual or automatic release
3. Click "Submit"

Review typically takes 24-48 hours.

## Important Configuration Details

### Current App Configuration
- **Bundle Identifier**: `com.bingometisapp.bingometis`
- **Version**: 1.0.0
- **Build Number**: 2
- **Orientation**: Portrait only
- **Tablet Support**: Yes
- **Uses Encryption**: No

### Privacy Descriptions Already Added
- Photo Library: Save and share bingo cards
- Camera: Capture photos for bingo cards
- Location: Location-based features

### AdMob Integration
- iOS App ID: `ca-app-pub-5783177820090411~8022679724`
- Already configured in `app.json`

## Troubleshooting

### Common Issues

**"Missing Compliance"**
- Already handled with `ITSAppUsesNonExemptEncryption: false`

**"Invalid Bundle"**
- Ensure bundle ID matches in both code and App Store Connect
- Build number must be unique for each submission

**"Missing Icon"**
- Verify icon is 1024x1024 PNG without alpha channel
- Use `expo-splash-screen` to generate proper assets

**"Rejected for 4.3 (Spam)"**
- Ensure your app offers unique functionality
- Provide detailed explanation of features

## Post-Approval

After approval:
1. App will be live on the App Store
2. Monitor crash reports in App Store Connect
3. Respond to user reviews
4. Plan updates (increment version/build numbers)

## Updating the App

For future updates:
1. Increment version in `app.json`: `"version": "1.0.1"`
2. Increment build number: `"buildNumber": "3"`
3. Run `eas build --platform ios --profile production`
4. Submit new build through `eas submit` or manually

## Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

## Support

If you encounter issues:
- EAS Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/
- Apple Developer Support: https://developer.apple.com/support/

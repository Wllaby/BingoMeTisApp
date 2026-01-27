
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ImageSourcePropType,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { usePremium } from '@/contexts/PremiumContext';
import * as Haptics from 'expo-haptics';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, showPaywall } = usePremium();
  const backgroundImage = resolveImageSource(require('@/assets/images/870c87ab-379a-4f2d-baa7-d28d11e105ff.webp'));

  const handleUpgrade = async () => {
    console.log('PremiumScreen: Upgrade button pressed');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await showPaywall();
  };

  const handleBackPress = () => {
    console.log('PremiumScreen: Back button pressed');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    router.back();
  };

  const premiumStatusText = isPremium ? 'Premium Active' : 'Free Version';
  const headerTitle = isPremium ? '✨ You\'re Premium!' : '✨ Upgrade to Premium';
  const descriptionText = isPremium 
    ? 'Thank you for supporting the app! Enjoy all premium features.'
    : 'Remove ads and unlock exclusive features';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="arrow-back"
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        <Text style={styles.bannerText}>{premiumStatusText}</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundSection}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{descriptionText}</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="block"
                  size={32} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.featureTitle}>No Ads</Text>
              <Text style={styles.featureDescription}>
                Enjoy uninterrupted gameplay without any advertisements
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconSymbol 
                  ios_icon_name="infinity.circle.fill" 
                  android_material_icon_name="all-inclusive"
                  size={32} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.featureTitle}>Unlimited Custom Themes</Text>
              <Text style={styles.featureDescription}>
                Create as many custom bingo themes as you want (free users limited to 5)
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconSymbol 
                  ios_icon_name="star.circle.fill" 
                  android_material_icon_name="star"
                  size={32} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.featureTitle}>Priority Support</Text>
              <Text style={styles.featureDescription}>
                Get faster responses to your feedback and feature requests
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconSymbol 
                  ios_icon_name="sparkles" 
                  android_material_icon_name="auto-awesome"
                  size={32} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.featureTitle}>Early Access</Text>
              <Text style={styles.featureDescription}>
                Be the first to try new themes and features before everyone else
              </Text>
            </View>
          </View>

          {!isPremium && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="crown.fill" 
                android_material_icon_name="workspace-premium"
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}

          {isPremium && (
            <View style={styles.thankYouCard}>
              <IconSymbol 
                ios_icon_name="heart.fill" 
                android_material_icon_name="favorite"
                size={48} 
                color={colors.accent} 
              />
              <Text style={styles.thankYouText}>Thank you for your support!</Text>
              <Text style={styles.thankYouSubtext}>
                Your subscription helps us continue improving the app
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Subscriptions are managed through your App Store or Google Play account
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  topBanner: {
    backgroundColor: '#4A4A4A',
    paddingVertical: 8,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonSpacer: {
    width: 40,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  backgroundSection: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  thankYouCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  thankYouText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  thankYouSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

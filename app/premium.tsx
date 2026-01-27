
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
import { usePremium } from '@/contexts/PremiumContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const isExpoGo = Constants.appOwnership === 'expo';

export default function PremiumScreen() {
  const { isPremium, showPaywall } = usePremium();
  const router = useRouter();

  const handleUpgrade = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isExpoGo) {
      console.log('Premium: Cannot show paywall in Expo Go');
      return;
    }
    
    await showPaywall();
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const backgroundImage = resolveImageSource('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80');

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <ImageBackground 
        source={backgroundImage}
        style={styles.container}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="arrow-back"
              size={28} 
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <IconSymbol 
              ios_icon_name="crown.fill" 
              android_material_icon_name="star"
              size={80} 
              color="#FFD700"
            />
          </View>

          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>Unlock unlimited bingo fun</Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle"
                size={24} 
                color="#4CAF50"
              />
              <Text style={styles.featureText}>Unlimited active games</Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle"
                size={24} 
                color="#4CAF50"
              />
              <Text style={styles.featureText}>Create up to 30 custom themes</Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle"
                size={24} 
                color="#4CAF50"
              />
              <Text style={styles.featureText}>No ads</Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle"
                size={24} 
                color="#4CAF50"
              />
              <Text style={styles.featureText}>Priority support</Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle"
                size={24} 
                color="#4CAF50"
              />
              <Text style={styles.featureText}>Early access to new features</Text>
            </View>
          </View>

          {isExpoGo && (
            <View style={styles.expoGoNotice}>
              <IconSymbol 
                ios_icon_name="info.circle.fill" 
                android_material_icon_name="info"
                size={24} 
                color="#FF9800"
              />
              <View style={styles.expoGoTextContainer}>
                <Text style={styles.expoGoTitle}>Running in Expo Go</Text>
                <Text style={styles.expoGoText}>
                  Payments are not available in Expo Go. To test premium features, create a development build:
                </Text>
                <Text style={styles.expoGoCommand}>npx expo run:ios</Text>
                <Text style={styles.expoGoCommand}>npx expo run:android</Text>
              </View>
            </View>
          )}

          {!isExpoGo && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>
                {isPremium ? 'Manage Subscription' : 'Upgrade Now'}
              </Text>
            </TouchableOpacity>
          )}

          {isPremium && (
            <View style={styles.premiumBadge}>
              <IconSymbol 
                ios_icon_name="crown.fill" 
                android_material_icon_name="star"
                size={20} 
                color="#FFD700"
              />
              <Text style={styles.premiumBadgeText}>You're Premium!</Text>
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    opacity: 0.9,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 18,
    color: colors.text,
    marginLeft: 15,
    flex: 1,
  },
  expoGoNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  expoGoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  expoGoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  expoGoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  expoGoCommand: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.text,
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
});

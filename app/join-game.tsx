
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ImageBackground,
  ImageSourcePropType,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;
const MAX_CUSTOM_THEMES = 5;

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function JoinGameScreen() {
  console.log('JoinGameScreen: Component mounted');
  
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [customThemeCount, setCustomThemeCount] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(true);

  const backgroundImage = resolveImageSource(require('@/assets/images/6f6e38ff-0de3-4f6d-8445-d6b679cf5b72.webp'));

  useEffect(() => {
    console.log('JoinGameScreen: Checking custom theme count');
    checkCustomThemeCount();
  }, []);

  const checkCustomThemeCount = async () => {
    try {
      if (!BACKEND_URL) {
        console.error('JoinGameScreen: BACKEND_URL is not configured');
        setCheckingLimit(false);
        return;
      }

      console.log('JoinGameScreen: Fetching templates to count custom themes');
      const response = await fetch(`${BACKEND_URL}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const templatesArray = Array.isArray(data) ? data : (data.templates || []);
      
      const customCount = templatesArray.filter((t: any) => t.isCustom || t.is_custom).length;
      console.log('JoinGameScreen: Current custom theme count:', customCount);
      
      setCustomThemeCount(customCount);
      setCheckingLimit(false);
    } catch (error) {
      console.error('JoinGameScreen: Error checking custom theme count', error);
      setCheckingLimit(false);
    }
  };

  const handleJoinGame = async () => {
    console.log('JoinGameScreen: Add theme tapped with code:', gameCode);
    
    Keyboard.dismiss();
    
    if (!gameCode.trim()) {
      Alert.alert('Error', 'Please enter a theme code');
      return;
    }

    if (customThemeCount >= MAX_CUSTOM_THEMES) {
      console.log('JoinGameScreen: Cannot add theme - maximum custom themes reached');
      Alert.alert(
        'Maximum Custom Themes Reached',
        `You can only have ${MAX_CUSTOM_THEMES} custom themes at the same time. Please delete one of your existing custom themes to add a new one.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      console.log('JoinGameScreen: Fetching template with code:', gameCode);
      console.log('JoinGameScreen: Backend URL:', BACKEND_URL);
      
      if (!BACKEND_URL) {
        console.error('JoinGameScreen: BACKEND_URL is not configured');
        Alert.alert('Error', 'Backend URL is not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/templates/code/${gameCode.trim().toUpperCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Theme code not found. Please check the code and try again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const template = await response.json();
      console.log('JoinGameScreen: Template fetched successfully:', template.name);
      
      Alert.alert(
        'Success!',
        `You've added the "${template.name}" theme! The template has been added to your list.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('JoinGameScreen: Navigating back to home');
              router.back();
            },
          },
        ]
      );
      
      setLoading(false);
    } catch (error) {
      console.error('JoinGameScreen: Error adding theme', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add theme. Please check the code and try again.';
      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    console.log('JoinGameScreen: Back button pressed');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const codeUppercase = gameCode.toUpperCase();
  const isAtLimit = customThemeCount >= MAX_CUSTOM_THEMES;

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="arrow-back"
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Add Theme</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="link.circle.fill" 
                  android_material_icon_name="link"
                  size={80} 
                  color="#FFFFFF" 
                />
              </View>

              <Text style={styles.title}>Add a theme</Text>
              <Text style={styles.subtitle}>Enter the theme code shared with you</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter theme code"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={gameCode}
                  onChangeText={setGameCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handleJoinGame}
                />
              </View>

              {gameCode.length > 0 && (
                <View style={styles.codePreview}>
                  <Text style={styles.codePreviewLabel}>Code:</Text>
                  <Text style={styles.codePreviewText}>{codeUppercase}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.joinButton, (loading || isAtLimit) && styles.joinButtonDisabled]}
                onPress={handleJoinGame}
                disabled={loading || isAtLimit}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle"
                  size={24} 
                  color={colors.card} 
                />
                <Text style={styles.joinButtonText}>
                  {loading ? 'Adding...' : 'Add Theme'}
                </Text>
              </TouchableOpacity>

              {isAtLimit && (
                <View style={styles.warningBox}>
                  <IconSymbol 
                    ios_icon_name="exclamationmark.triangle.fill" 
                    android_material_icon_name="warning"
                    size={20} 
                    color="#FF9800" 
                  />
                  <Text style={styles.warningText}>
                    You have reached the maximum of {MAX_CUSTOM_THEMES} custom themes. Delete one to add a new theme.
                  </Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <IconSymbol 
                  ios_icon_name="info.circle.fill" 
                  android_material_icon_name="info"
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.infoText}>
                  Theme codes are unique identifiers for custom created themes that can be shared with others.
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 48,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  codePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  codePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  codePreviewText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

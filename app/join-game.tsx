
import React, { useState } from 'react';
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

// Get backend URL from app.json configuration
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

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

  const backgroundImage = resolveImageSource(require('@/assets/images/736a52ec-5262-49f0-8717-ef943252fae5.jpeg'));

  const handleJoinGame = async () => {
    console.log('JoinGameScreen: Join game tapped with code:', gameCode);
    
    // Dismiss keyboard before processing
    Keyboard.dismiss();
    
    if (!gameCode.trim()) {
      Alert.alert('Error', 'Please enter a game code');
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

      // Fetch template by code using GET /templates/code/{code}
      const response = await fetch(`${BACKEND_URL}/templates/code/${gameCode.trim().toUpperCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Game code not found. Please check the code and try again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const template = await response.json();
      console.log('JoinGameScreen: Template fetched successfully:', template.name);
      
      // Show success message and navigate back to home
      Alert.alert(
        'Success!',
        `You've joined the "${template.name}" theme! The template has been added to your list.`,
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
      console.error('JoinGameScreen: Error joining game', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game. Please check the code and try again.';
      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  const codeUppercase = gameCode.toUpperCase();

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Join Game',
          headerBackTitle: 'Back',
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
        }} 
      />
      
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

              <Text style={styles.title}>Join a Game</Text>
              <Text style={styles.subtitle}>Enter the game code shared by your friend</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter game code"
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
                style={[styles.joinButton, loading && styles.joinButtonDisabled]}
                onPress={handleJoinGame}
                disabled={loading}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle"
                  size={24} 
                  color={colors.card} 
                />
                <Text style={styles.joinButtonText}>
                  {loading ? 'Joining...' : 'Join Game'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <IconSymbol 
                  ios_icon_name="info.circle.fill" 
                  android_material_icon_name="info"
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.infoText}>
                  Game codes are shared when someone creates a custom theme and wants to play with friends.
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
    marginBottom: 40,
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
    marginBottom: 30,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
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

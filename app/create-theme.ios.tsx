
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ImageBackground,
  ImageSourcePropType,
  KeyboardAvoidingView,
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

export default function CreateThemeScreen() {
  console.log('CreateThemeScreen: Component mounted');
  
  const router = useRouter();
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState('');
  const [saving, setSaving] = useState(false);
  const [customThemeCount, setCustomThemeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const backgroundImage = resolveImageSource(require('@/assets/images/6f6e38ff-0de3-4f6d-8445-d6b679cf5b72.webp'));

  useEffect(() => {
    console.log('CreateThemeScreen: Checking custom theme count');
    checkCustomThemeCount();
  }, []);

  const checkCustomThemeCount = async () => {
    try {
      if (!BACKEND_URL) {
        console.error('CreateThemeScreen: BACKEND_URL is not configured');
        setLoading(false);
        return;
      }

      console.log('CreateThemeScreen: Fetching templates to count custom themes');
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
      console.log('CreateThemeScreen: Current custom theme count:', customCount);
      
      setCustomThemeCount(customCount);
      setLoading(false);

      if (customCount >= MAX_CUSTOM_THEMES) {
        console.log('CreateThemeScreen: User has reached maximum custom themes');
        Alert.alert(
          'Maximum Custom Themes Reached',
          `You can only have ${MAX_CUSTOM_THEMES} custom themes at the same time. Please delete one of your existing custom themes to create a new one.`,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('CreateThemeScreen: Navigating back due to limit');
                router.back();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('CreateThemeScreen: Error checking custom theme count', error);
      setLoading(false);
    }
  };

  const addOption = () => {
    console.log('CreateThemeScreen: Adding option:', currentOption);
    const trimmedOption = currentOption.trim();
    
    if (!trimmedOption) {
      Alert.alert('Error', 'Please enter an option');
      return;
    }

    if (options.includes(trimmedOption)) {
      Alert.alert('Error', 'This option already exists');
      return;
    }

    if (options.length >= 100) {
      Alert.alert('Error', 'Maximum 100 options allowed');
      return;
    }

    setOptions([...options, trimmedOption]);
    setCurrentOption('');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('CreateThemeScreen: Option added. Total options:', options.length + 1);
  };

  const removeOption = (index: number) => {
    console.log('CreateThemeScreen: Removing option at index:', index);
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('CreateThemeScreen: Option removed. Total options:', newOptions.length);
  };

  const saveTheme = async () => {
    console.log('CreateThemeScreen: Save button tapped');
    console.log('CreateThemeScreen: Theme name:', themeName);
    console.log('CreateThemeScreen: Total options:', options.length);
    
    if (customThemeCount >= MAX_CUSTOM_THEMES) {
      console.log('CreateThemeScreen: Cannot save - maximum custom themes reached');
      Alert.alert(
        'Maximum Custom Themes Reached',
        `You can only have ${MAX_CUSTOM_THEMES} custom themes at the same time. Please delete one of your existing custom themes to create a new one.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    const trimmedName = themeName.trim();
    
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a theme name');
      return;
    }

    if (options.length < 25) {
      const remaining = 25 - options.length;
      const remainingText = remaining.toString();
      Alert.alert('Not Enough Options', `You need at least 25 options. Add ${remainingText} more.`);
      return;
    }

    if (options.length > 100) {
      Alert.alert('Too Many Options', 'Maximum 100 options allowed');
      return;
    }

    setSaving(true);
    console.log('CreateThemeScreen: Saving theme to backend');

    try {
      if (!BACKEND_URL) {
        console.error('CreateThemeScreen: BACKEND_URL is not configured');
        Alert.alert('Error', 'Backend URL is not configured');
        setSaving(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: themeDescription.trim() || undefined,
          items: options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('CreateThemeScreen: Failed to save theme:', errorData);
        throw new Error(errorData.error || 'Failed to save theme');
      }

      const savedTheme = await response.json();
      console.log('CreateThemeScreen: Theme saved successfully:', savedTheme.id);
      console.log('CreateThemeScreen: Share code:', savedTheme.code);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const shareCode = savedTheme.code || 'N/A';
      
      Alert.alert(
        '🎉 Theme Created!',
        `Your theme "${trimmedName}" has been created!\n\nShare Code: ${shareCode}\n\nShare this code with others so they can add your theme to their app.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('CreateThemeScreen: Navigating back to home');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('CreateThemeScreen: Error saving theme:', error);
      Alert.alert('Error', 'Failed to save theme. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackPress = () => {
    console.log('CreateThemeScreen: Back button pressed');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (loading) {
    const loadingText = 'Loading...';
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
            title: 'Create Your Own Theme',
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <IconSymbol 
                  ios_icon_name="chevron.left" 
                  android_material_icon_name="arrow-back"
                  size={28} 
                  color={colors.card} 
                />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.card,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </ImageBackground>
    );
  }

  if (customThemeCount >= MAX_CUSTOM_THEMES) {
    return null;
  }

  const optionsCountText = options.length.toString();
  const minText = '25';
  const maxText = '100';
  const remainingText = options.length < 25 ? (25 - options.length).toString() : '0';

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
          title: 'Create Your Own Theme',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow-back"
                size={28} 
                color={colors.card} 
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.card,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.label}>Theme Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Movie Night Bingo"
              placeholderTextColor={colors.textSecondary}
              value={themeName}
              onChangeText={setThemeName}
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Classic movie moments and quotes"
              placeholderTextColor={colors.textSecondary}
              value={themeDescription}
              onChangeText={setThemeDescription}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.optionsHeader}>
              <Text style={styles.label}>Options</Text>
              <Text style={styles.optionsCount}>{optionsCountText}</Text>
              <Text style={styles.optionsCountSeparator}>/</Text>
              <Text style={styles.optionsCountMin}>{minText}</Text>
              <Text style={styles.optionsCountSeparator}>-</Text>
              <Text style={styles.optionsCountMax}>{maxText}</Text>
            </View>
            
            {options.length < 25 && (
              <Text style={styles.helperText}>Add at least {remainingText} more options</Text>
            )}

            <View style={styles.addOptionContainer}>
              <TextInput
                style={styles.optionInput}
                placeholder="Enter an option"
                placeholderTextColor={colors.textSecondary}
                value={currentOption}
                onChangeText={setCurrentOption}
                onSubmitEditing={addOption}
                returnKeyType="done"
                maxLength={100}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addOption}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add-circle"
                  size={32} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              {options.map((option, index) => {
                const optionKey = index;
                const optionNumber = (index + 1).toString();
                
                return (
                  <View key={optionKey} style={styles.optionItem}>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionNumber}>{optionNumber}</Text>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeOption(index)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        ios_icon_name="xmark.circle.fill" 
                        android_material_icon_name="cancel"
                        size={24} 
                        color={colors.error} 
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, (saving || options.length < 25) && styles.saveButtonDisabled]}
            onPress={saveTheme}
            disabled={saving || options.length < 25}
            activeOpacity={0.7}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <React.Fragment>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle"
                  size={24} 
                  color={colors.card} 
                />
                <Text style={styles.saveButtonText}>Save Theme</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  optionsCountSeparator: {
    fontSize: 16,
    color: '#FFFFFF',
    marginHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  optionsCountMin: {
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  optionsCountMax: {
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  helperText: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  addOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  optionInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButton: {
    padding: 4,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 30,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
});

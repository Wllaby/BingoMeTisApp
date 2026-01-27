
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
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { usePremium } from '@/contexts/PremiumContext';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;
const MAX_CUSTOM_THEMES_FREE = 5;
const MAX_CUSTOM_THEMES_PREMIUM = 30;

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface BingoTemplate {
  id: string;
  name: string;
  description?: string;
  items: string[];
  is_custom: boolean;
  created_at: string;
}

export default function CreateThemeScreen() {
  console.log('CreateThemeScreen: Component mounted');
  
  const router = useRouter();
  const { isPremium } = usePremium();
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState('');
  const [saving, setSaving] = useState(false);
  const [customThemeCount, setCustomThemeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<BingoTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const backgroundImage = resolveImageSource(require('@/assets/images/6f6e38ff-0de3-4f6d-8445-d6b679cf5b72.webp'));

  const maxCustomThemes = isPremium ? MAX_CUSTOM_THEMES_PREMIUM : MAX_CUSTOM_THEMES_FREE;

  useEffect(() => {
    console.log('CreateThemeScreen: Checking custom theme count');
    checkCustomThemeCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (customCount >= maxCustomThemes) {
        console.log('CreateThemeScreen: User has reached maximum custom themes');
        const limitText = maxCustomThemes.toString();
        Alert.alert(
          'Maximum Custom Themes Reached',
          `You can only have ${limitText} custom themes at the same time. Please delete one of your existing custom themes to create a new one.`,
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

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      
      if (!BACKEND_URL) {
        console.error('CreateThemeScreen: BACKEND_URL is not configured');
        setLoadingTemplates(false);
        return;
      }

      console.log('CreateThemeScreen: Fetching templates for template selection');
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
      
      const transformedTemplates: BingoTemplate[] = templatesArray.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        items: template.items,
        is_custom: template.isCustom || template.is_custom,
        created_at: template.createdAt || template.created_at,
      }));
      
      setTemplates(transformedTemplates);
      setLoadingTemplates(false);
    } catch (error) {
      console.error('CreateThemeScreen: Error loading templates', error);
      setLoadingTemplates(false);
      Alert.alert('Error', 'Failed to load templates. Please try again.');
    }
  };

  const handleUseTemplate = () => {
    console.log('CreateThemeScreen: Use template button tapped');
    
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Using existing themes as templates is a Premium feature. Upgrade to Premium to unlock this feature!',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Upgrade',
            onPress: () => {
              router.push('/premium');
            }
          }
        ]
      );
      return;
    }
    
    loadTemplates();
    setShowTemplateModal(true);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const selectTemplate = (template: BingoTemplate) => {
    console.log('CreateThemeScreen: Template selected:', template.name);
    
    // Copy the template items to the options
    setOptions([...template.items]);
    setShowTemplateModal(false);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const itemsCount = template.items.length.toString();
    Alert.alert(
      'Template Loaded',
      `${itemsCount} items from "${template.name}" have been loaded. You can now edit, add, or remove items as needed.`,
      [{ text: 'OK' }]
    );
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

  const startEditingOption = (index: number) => {
    console.log('CreateThemeScreen: Starting to edit option at index:', index);
    setEditingIndex(index);
    setEditingText(options[index]);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const saveEditedOption = (index: number) => {
    console.log('CreateThemeScreen: Saving edited option at index:', index);
    const trimmedText = editingText.trim();
    
    if (!trimmedText) {
      Alert.alert('Error', 'Option cannot be empty');
      return;
    }

    const isDuplicate = options.some((opt, i) => i !== index && opt === trimmedText);
    if (isDuplicate) {
      Alert.alert('Error', 'This option already exists');
      return;
    }

    const newOptions = [...options];
    newOptions[index] = trimmedText;
    setOptions(newOptions);
    setEditingIndex(null);
    setEditingText('');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    console.log('CreateThemeScreen: Option edited successfully');
  };

  const cancelEditingOption = () => {
    console.log('CreateThemeScreen: Canceling edit');
    setEditingIndex(null);
    setEditingText('');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const saveTheme = async () => {
    console.log('CreateThemeScreen: Save button tapped');
    console.log('CreateThemeScreen: Theme name:', themeName);
    console.log('CreateThemeScreen: Total options:', options.length);
    
    if (customThemeCount >= maxCustomThemes) {
      console.log('CreateThemeScreen: Cannot save - maximum custom themes reached');
      const limitText = maxCustomThemes.toString();
      Alert.alert(
        'Maximum Custom Themes Reached',
        `You can only have ${limitText} custom themes at the same time. Please delete one of your existing custom themes to create a new one.`,
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
            <Text style={styles.headerTitle}>Create Your Own Theme</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </ImageBackground>
    );
  }

  if (customThemeCount >= maxCustomThemes) {
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
          <Text style={styles.headerTitle}>Create Your Own Theme</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      
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

            <TouchableOpacity
              style={styles.templateButton}
              onPress={handleUseTemplate}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="doc.on.doc.fill" 
                android_material_icon_name="content-copy"
                size={20} 
                color={isPremium ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.templateButtonText, !isPremium && styles.templateButtonTextDisabled]}>
                Use Existing Theme as Template
              </Text>
              {!isPremium && (
                <View style={styles.premiumBadge}>
                  <IconSymbol 
                    ios_icon_name="crown.fill" 
                    android_material_icon_name="workspace-premium"
                    size={16} 
                    color="#FFD700" 
                  />
                </View>
              )}
            </TouchableOpacity>

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
                const isEditing = editingIndex === index;
                
                return (
                  <View key={optionKey} style={styles.optionItem}>
                    {isEditing ? (
                      <React.Fragment>
                        <View style={styles.editingContainer}>
                          <Text style={styles.optionNumber}>{optionNumber}</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editingText}
                            onChangeText={setEditingText}
                            autoFocus
                            maxLength={100}
                            onSubmitEditing={() => saveEditedOption(index)}
                          />
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            onPress={() => saveEditedOption(index)}
                            style={styles.editActionButton}
                            activeOpacity={0.7}
                          >
                            <IconSymbol 
                              ios_icon_name="checkmark.circle.fill" 
                              android_material_icon_name="check-circle"
                              size={24} 
                              color={colors.success} 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={cancelEditingOption}
                            style={styles.editActionButton}
                            activeOpacity={0.7}
                          >
                            <IconSymbol 
                              ios_icon_name="xmark.circle.fill" 
                              android_material_icon_name="cancel"
                              size={24} 
                              color={colors.textSecondary} 
                            />
                          </TouchableOpacity>
                        </View>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <View style={styles.optionContent}>
                          <Text style={styles.optionNumber}>{optionNumber}</Text>
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                        <View style={styles.optionActions}>
                          <TouchableOpacity
                            onPress={() => startEditingOption(index)}
                            style={styles.actionButton}
                            activeOpacity={0.7}
                          >
                            <IconSymbol 
                              ios_icon_name="pencil.circle.fill" 
                              android_material_icon_name="edit"
                              size={24} 
                              color={colors.primary} 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeOption(index)}
                            style={styles.actionButton}
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
                      </React.Fragment>
                    )}
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

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.templateModalContent}>
            <View style={styles.templateModalHeader}>
              <Text style={styles.templateModalTitle}>Select a Template</Text>
              <TouchableOpacity
                onPress={() => setShowTemplateModal(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel"
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {loadingTemplates ? (
              <View style={styles.templateLoadingContainer}>
                <Text style={styles.templateLoadingText}>Loading templates...</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.templateList}
                contentContainerStyle={styles.templateListContent}
                showsVerticalScrollIndicator={false}
              >
                {templates.map((template) => {
                  const templateKey = template.id;
                  const itemsCountText = template.items.length.toString();
                  
                  return (
                    <TouchableOpacity
                      key={templateKey}
                      style={styles.templateItem}
                      onPress={() => selectTemplate(template)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.templateItemContent}>
                        <Text style={styles.templateItemName}>{template.name}</Text>
                        {template.is_custom && (
                          <View style={styles.customTemplateBadge}>
                            <Text style={styles.customTemplateBadgeText}>Custom</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.templateItemCount}>{itemsCountText} items</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  templateButtonTextDisabled: {
    color: colors.textSecondary,
  },
  premiumBadge: {
    marginLeft: 4,
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
  optionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  editingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editActionButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  templateModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  templateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  templateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  templateLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  templateLoadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  templateList: {
    flex: 1,
  },
  templateListContent: {
    padding: 20,
  },
  templateItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  templateItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  customTemplateBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customTemplateBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateItemCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

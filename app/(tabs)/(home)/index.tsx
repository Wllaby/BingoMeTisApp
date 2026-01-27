
import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Dimensions,
  Platform,
  ImageBackground,
  ImageSourcePropType,
  Modal,
  Share,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Linking
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import { usePremium } from '@/contexts/PremiumContext';
import { useInterstitialAd } from '@/components/InterstitialAdManager';
import { AdBanner } from '@/components/AdBanner';
import { apiPost } from '@/utils/api';

const { width, height } = Dimensions.get('window');
const CELL_SIZE = (width - 40) / 5;

// Get backend URL from app.json configuration
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

// Maximum custom themes and active games based on premium status
const MAX_CUSTOM_THEMES_FREE = 5;
const MAX_CUSTOM_THEMES_PREMIUM = 30;
const MAX_ACTIVE_GAMES_FREE = 5;
const MAX_ACTIVE_GAMES_PREMIUM = 30;

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
  code?: string;
}

interface BingoGame {
  id: string;
  template_id: string;
  template_name: string;
  marked_cells: number[];
  completed: boolean;
  items?: string[];
  bingo_count: number;
  target_bingo_count: number;
  is_custom_theme?: boolean;
}

interface SwipeableCustomThemeProps {
  template: BingoTemplate;
  onPress: () => void;
  onDelete: () => void;
  onCopyCode: () => void;
}

interface SwipeableActiveGameProps {
  game: BingoGame;
  onPress: () => void;
  onDelete: () => void;
}

// Define the desired order of standard themes
const THEME_ORDER = [
  'Office',
  'Customer Service',
  'Dating',
  'Spouses & Hearts',
  'Spouses & Headaches',
  'Kids',
  'Teenangsters',
  'Family Gatherings',
  'Self-care'
];

// Old theme names that should be filtered out (they were renamed)
const OLD_THEME_NAMES = [
  'Spouses Sighs',
  'Spouses Hearts',
  'Family gatherings'
];

function SwipeableCustomTheme({ template, onPress, onDelete, onCopyCode }: SwipeableCustomThemeProps) {
  const translateX = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Limit swipe distance
      if (event.translationX < -150) {
        translateX.value = -150;
      } else if (event.translationX > 150) {
        translateX.value = 150;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const threshold = 80;
      
      if (event.translationX < -threshold) {
        // Swipe left - reveal delete
        translateX.value = withSpring(-150);
        runOnJS(setIsRevealed)('left');
      } else if (event.translationX > threshold) {
        // Swipe right - reveal share code
        translateX.value = withSpring(150);
        runOnJS(setIsRevealed)('right');
      } else {
        // Return to center
        translateX.value = withSpring(0);
        runOnJS(setIsRevealed)(null);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const resetPosition = () => {
    translateX.value = withSpring(0);
    setIsRevealed(null);
  };

  const handlePress = () => {
    if (isRevealed) {
      resetPosition();
    } else {
      onPress();
    }
  };

  const handleDelete = () => {
    resetPosition();
    onDelete();
  };

  const handleCopyCode = () => {
    resetPosition();
    onCopyCode();
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Left action - Delete */}
      {isRevealed === 'left' && (
        <View style={styles.leftAction}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="trash.fill" 
              android_material_icon_name="delete"
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Right action - Share Code */}
      {isRevealed === 'right' && (
        <View style={styles.rightAction}>
          <TouchableOpacity 
            style={styles.shareCodeButton}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="doc.on.doc.fill" 
              android_material_icon_name="content-copy"
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.actionText}>Copy Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle]}>
          <TouchableOpacity
            style={styles.templateCard}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View style={styles.templateContent}>
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{template.name}</Text>
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              </View>
              {template.description && (
                <Text style={styles.templateDescription}>{template.description}</Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function SwipeableActiveGame({ game, onPress, onDelete }: SwipeableActiveGameProps) {
  const translateX = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < -150) {
        translateX.value = -150;
      } else if (event.translationX > 0) {
        translateX.value = 0;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const threshold = 80;
      
      if (event.translationX < -threshold) {
        translateX.value = withSpring(-150);
        runOnJS(setIsRevealed)(true);
      } else {
        translateX.value = withSpring(0);
        runOnJS(setIsRevealed)(false);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const resetPosition = () => {
    translateX.value = withSpring(0);
    setIsRevealed(false);
  };

  const handlePress = () => {
    if (isRevealed) {
      resetPosition();
    } else {
      onPress();
    }
  };

  const handleDelete = () => {
    resetPosition();
    onDelete();
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Left action - Delete */}
      {isRevealed && (
        <View style={styles.leftAction}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="trash.fill" 
              android_material_icon_name="delete"
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle]}>
          <TouchableOpacity
            style={styles.activeGameCard}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View style={styles.activeGameContent}>
              <View style={styles.activeGameHeader}>
                <Text style={styles.activeGameName}>{game.template_name}</Text>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="chevron-right"
                  size={20} 
                  color={colors.primary} 
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function HomeScreen() {
  console.log('HomeScreen: Component mounted');
  
  const router = useRouter();
  const { isPremium, showPaywall } = usePremium();
  const { showInterstitialAd } = useInterstitialAd();
  const confettiRef = useRef<any>(null);
  const bingoCardRef = useRef<View>(null);
  const shareableCardRef = useRef<View>(null);
  const [templates, setTemplates] = useState<BingoTemplate[]>([]);
  const [activeGames, setActiveGames] = useState<BingoGame[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BingoTemplate | null>(null);
  const [currentGame, setCurrentGame] = useState<BingoGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateList, setShowTemplateList] = useState(true);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showFullCardModal, setShowFullCardModal] = useState(false);
  const [nextTarget, setNextTarget] = useState<'3-bingos' | 'full-card' | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [customThemesExpanded, setCustomThemesExpanded] = useState(false);
  const [activeGamesExpanded, setActiveGamesExpanded] = useState(false);

  const defaultBackgroundImage = resolveImageSource(require('@/assets/images/870c87ab-379a-4f2d-baa7-d28d11e105ff.webp'));
  const customThemeBackgroundImage = resolveImageSource(require('@/assets/images/6f6e38ff-0de3-4f6d-8445-d6b679cf5b72.webp'));
  const kidsBackgroundImage = resolveImageSource(require('@/assets/images/97350fb6-a346-4936-b922-f17f9290a4b1.webp'));
  const thingsKidsDoBackgroundImage = resolveImageSource(require('@/assets/images/7007edc2-3eba-483b-a36f-b7d6ed4e8a9a.jpeg'));
  const officeBackgroundImage = resolveImageSource(require('@/assets/images/dc9f2533-409a-47aa-a3fc-63b6e289409c.webp'));
  const customerServiceBackgroundImage = resolveImageSource(require('@/assets/images/f8a27c83-eb51-4e25-932e-e1787213c1a8.webp'));
  const spousesSighsBackgroundImage = resolveImageSource(require('@/assets/images/dd425792-1c11-465d-94a6-2bd8d928c196.webp'));
  const spousesHeartsBackgroundImage = resolveImageSource(require('@/assets/images/061906c1-46e2-4364-82f3-73e57037d6ae.webp'));
  const datingBackgroundImage = resolveImageSource(require('@/assets/images/278203ca-b0a0-45bc-9a82-12a4e9b06403.webp'));
  const familyGatheringsBackgroundImage = resolveImageSource(require('@/assets/images/0a42377e-c3da-4554-b3eb-e990538d74b1.webp'));
  const selfCareBackgroundImage = resolveImageSource(require('@/assets/images/d43faca0-bba5-4a76-8fed-12d40c226140.webp'));
  const teenangstersBackgroundImage = resolveImageSource(require('@/assets/images/defcdfaa-babd-4a93-9b92-4eda2ac624d6.webp'));
  
  // Fixed background image for sharing
  const shareBackgroundImage = resolveImageSource(require('@/assets/images/4444f386-e9bd-4350-ad73-914cee2f2d3e.webp'));
  
  // Free space image
  const freeSpaceImage = resolveImageSource(require('@/assets/images/15c652d7-c181-4c0b-bc5a-bd94926d5aec.webp'));
  
  // Determine background based on current game's theme name and custom status
  const isCustomTheme = selectedTemplate?.is_custom === true;
  const themeName = selectedTemplate?.name || '';
  const isKidsTheme = themeName === 'Kids';
  const isThingsKidsDoTheme = themeName === 'Things kids do';
  const isOfficeTheme = themeName === 'Office';
  const isCustomerServiceTheme = themeName === 'Customer Service';
  const isSpousesSighsTheme = themeName === 'Spouses & Headaches';
  const isSpousesHeartsTheme = themeName === 'Spouses & Hearts';
  const isDatingTheme = themeName === 'Dating';
  const isFamilyGatheringsTheme = themeName === 'Family Gatherings';
  const isSelfCareTheme = themeName === 'Self-care';
  const isTeenAngstersTheme = themeName === 'Teenangsters';
  
  const backgroundImage = isCustomTheme 
    ? customThemeBackgroundImage 
    : isKidsTheme 
    ? kidsBackgroundImage 
    : isThingsKidsDoTheme 
    ? thingsKidsDoBackgroundImage 
    : isOfficeTheme 
    ? officeBackgroundImage 
    : isCustomerServiceTheme 
    ? customerServiceBackgroundImage 
    : isSpousesSighsTheme 
    ? spousesSighsBackgroundImage 
    : isSpousesHeartsTheme 
    ? spousesHeartsBackgroundImage 
    : isDatingTheme 
    ? datingBackgroundImage 
    : isFamilyGatheringsTheme 
    ? familyGatheringsBackgroundImage 
    : isSelfCareTheme 
    ? selfCareBackgroundImage 
    : isTeenAngstersTheme 
    ? teenangstersBackgroundImage 
    : defaultBackgroundImage;

  // Calculate limits based on premium status
  const maxCustomThemes = isPremium ? MAX_CUSTOM_THEMES_PREMIUM : MAX_CUSTOM_THEMES_FREE;
  const maxActiveGames = isPremium ? MAX_ACTIVE_GAMES_PREMIUM : MAX_ACTIVE_GAMES_FREE;

  // Load templates and active games on mount
  useEffect(() => {
    console.log('HomeScreen: Initial load on mount');
    loadTemplates();
    loadActiveGames();
  }, []);

  // Reload templates and active games when screen comes into focus (but not on initial mount)
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen: Screen focused, reloading templates and active games');
      if (showTemplateList) {
        loadTemplates();
        loadActiveGames();
      }
    }, [showTemplateList])
  );

  const loadTemplates = async () => {
    try {
      console.log('HomeScreen: Fetching templates from API');
      console.log('HomeScreen: Backend URL:', BACKEND_URL);
      
      if (!BACKEND_URL) {
        console.error('HomeScreen: BACKEND_URL is not configured');
        Alert.alert('Error', 'Backend URL is not configured');
        setLoading(false);
        return;
      }

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
      console.log('HomeScreen: Templates response:', data);
      
      // Handle both array and object responses
      const templatesArray = Array.isArray(data) ? data : (data.templates || []);
      console.log('HomeScreen: Templates loaded from API', templatesArray.length);
      
      // Transform backend data to match frontend interface
      const transformedTemplates: BingoTemplate[] = templatesArray.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        items: template.items,
        is_custom: template.isCustom || template.is_custom,
        created_at: template.createdAt || template.created_at,
      }));
      
      setTemplates(transformedTemplates);
      setLoading(false);
    } catch (error) {
      console.error('HomeScreen: Error loading templates', error);
      Alert.alert('Error', 'Failed to load templates. Please try again.');
      setLoading(false);
    }
  };

  const loadActiveGames = async () => {
    try {
      console.log('HomeScreen: Fetching active games from API');
      
      if (!BACKEND_URL) {
        console.error('HomeScreen: BACKEND_URL is not configured');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/games/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('HomeScreen: Active games response:', data);
      
      const gamesArray = Array.isArray(data) ? data : (data.games || []);
      console.log('HomeScreen: Active games loaded from API', gamesArray.length);
      
      const transformedGames: BingoGame[] = gamesArray.map((game: any) => ({
        id: game.id,
        template_id: game.templateId || game.template_id,
        template_name: game.templateName || game.template_name,
        marked_cells: game.markedCells || game.marked_cells || [],
        completed: game.completed,
        items: game.items,
        bingo_count: game.bingoCount || game.bingo_count || 0,
        target_bingo_count: 1,
        is_custom_theme: game.isCustomTheme || game.is_custom_theme || false,
      }));
      
      setActiveGames(transformedGames);
    } catch (error) {
      console.error('HomeScreen: Error loading active games', error);
    }
  };

  const shuffleArray = (array: string[]) => {
    console.log('HomeScreen: Shuffling array of', array.length, 'items using Fisher-Yates algorithm');
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    console.log('HomeScreen: Shuffle complete - first 3 items:', newArray.slice(0, 3));
    return newArray;
  };

  const generatePreviewCard = (template: BingoTemplate) => {
    console.log('HomeScreen: Generating preview card for template', template.name);
    const shuffledItems = shuffleArray([...template.items]);
    const selectedItems = shuffledItems.slice(0, 24);
    
    const gameItems = [
      ...selectedItems.slice(0, 12),
      "FREE SPACE",
      ...selectedItems.slice(12, 24)
    ];
    
    console.log('HomeScreen: Preview card generated with FREE SPACE at center (index 12)');
    return gameItems;
  };

  const handleThemePress = (template: BingoTemplate) => {
    console.log('HomeScreen: Theme pressed', template.name);
    console.log('HomeScreen: Showing preview card - game not started yet');
    
    const previewCard = generatePreviewCard(template);
    setPreviewItems(previewCard);
    setSelectedTemplate(template);
    setGameStarted(false);
    setCurrentGame(null);
    setShowTemplateList(false);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const startGame = async () => {
    console.log('HomeScreen: Start Game button pressed');
    
    if (!selectedTemplate) {
      console.error('HomeScreen: No template selected');
      return;
    }
    
    // Check if user has reached the limit for active games
    if (activeGames.length >= maxActiveGames) {
      const limitText = maxActiveGames.toString();
      Alert.alert(
        'Maximum Active Games',
        `You can only have ${limitText} games active at the same time. ${!isPremium ? 'Upgrade to Premium for up to 30 active games, or ' : ''}Please complete or delete one of the current ones first.`,
        [
          {
            text: 'OK'
          },
          ...(!isPremium ? [{
            text: 'Upgrade',
            onPress: async () => {
              await showPaywall();
            }
          }] : [])
        ]
      );
      return;
    }
    
    try {
      if (!BACKEND_URL) {
        console.error('HomeScreen: BACKEND_URL is not configured');
        Alert.alert('Error', 'Backend URL is not configured');
        return;
      }

      // Create game in backend
      console.log('HomeScreen: Creating game in backend with template ID:', selectedTemplate.id);
      const response = await fetch(`${BACKEND_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendGame = await response.json();
      console.log('HomeScreen: Game created in backend with ID:', backendGame.id);
      
      const newGame: BingoGame = {
        id: backendGame.id,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        marked_cells: [12],
        completed: false,
        items: previewItems,
        bingo_count: 0,
        target_bingo_count: 1,
        is_custom_theme: selectedTemplate.is_custom,
      };
      
      setCurrentGame(newGame);
      setGameStarted(true);
      
      // Reload active games to show the new game in the list
      await loadActiveGames();
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log('HomeScreen: Game started and added to active games list');
    } catch (error) {
      console.error('HomeScreen: Error starting game', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  };

  const resumeGame = (game: BingoGame) => {
    console.log('HomeScreen: Resuming game', game.id, game.template_name);
    console.log('HomeScreen: Game is_custom_theme:', game.is_custom_theme);
    
    const template = templates.find(t => t.id === game.template_id);
    if (template) {
      console.log('HomeScreen: Found template for game, is_custom:', template.is_custom);
      setSelectedTemplate(template);
    } else {
      console.log('HomeScreen: Template not found for game, using game data for background');
      setSelectedTemplate(null);
    }
    
    setCurrentGame(game);
    setGameStarted(true);
    setPreviewItems(game.items || []);
    setShowTemplateList(false);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const countBingos = (markedCells: number[]): number => {
    let bingoCount = 0;
    
    for (let row = 0; row < 5; row++) {
      const rowCells = [row * 5, row * 5 + 1, row * 5 + 2, row * 5 + 3, row * 5 + 4];
      if (rowCells.every(cell => markedCells.includes(cell))) {
        bingoCount++;
      }
    }
    
    for (let col = 0; col < 5; col++) {
      const colCells = [col, col + 5, col + 10, col + 15, col + 20];
      if (colCells.every(cell => markedCells.includes(cell))) {
        bingoCount++;
      }
    }
    
    const diagonal1 = [0, 6, 12, 18, 24];
    const diagonal2 = [4, 8, 12, 16, 20];
    if (diagonal1.every(cell => markedCells.includes(cell))) {
      bingoCount++;
    }
    if (diagonal2.every(cell => markedCells.includes(cell))) {
      bingoCount++;
    }
    
    return bingoCount;
  };

  const saveGameToHistory = async (game: BingoGame, bingoCount: number) => {
    console.log('HomeScreen: Saving game to history');
    
    try {
      if (!BACKEND_URL) {
        console.error('HomeScreen: BACKEND_URL is not configured');
        return;
      }

      console.log('HomeScreen: Saving game to backend - Game ID:', game.id);
      
      // Use PUT /games/:id to mark game as completed
      const response = await fetch(`${BACKEND_URL}/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markedCells: game.marked_cells,
          completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedGame = await response.json();
      console.log('HomeScreen: Game saved to history successfully', savedGame.id);
      console.log('HomeScreen: Game completed with', bingoCount, 'bingos');
      
      // Show interstitial ad for free users
      if (!isPremium) {
        console.log('HomeScreen: User is free, showing interstitial ad');
        await showInterstitialAd();
      }
    } catch (error) {
      console.error('HomeScreen: Error saving game to history', error);
      // Don't show error to user, just log it
    }
  };

  const handleContinueResponse = async (continueGame: boolean) => {
    console.log('HomeScreen: User chose to continue:', continueGame);
    setShowContinueModal(false);
    
    if (!currentGame) return;
    
    if (!continueGame) {
      const bingoCount = countBingos(currentGame.marked_cells);
      await saveGameToHistory(currentGame, bingoCount);
      
      Alert.alert(
        '🎉 Game Saved!',
        'Your game has been saved to history.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('HomeScreen: Returning to template list');
              resetGame();
            }
          }
        ]
      );
    } else {
      if (nextTarget === '3-bingos') {
        console.log('HomeScreen: Continuing to 3 bingos');
        setCurrentGame({
          ...currentGame,
          target_bingo_count: 3
        });
      } else if (nextTarget === 'full-card') {
        console.log('HomeScreen: Continuing to full card');
        setCurrentGame({
          ...currentGame,
          target_bingo_count: 25
        });
      }
      setNextTarget(null);
    }
  };

  const handleShareFromModal = async () => {
    console.log('HomeScreen: Share from modal tapped');
    await handleShareBingoCard();
  };

  const handleFullCardFinish = async () => {
    console.log('HomeScreen: Full card finish button tapped');
    setShowFullCardModal(false);
    setShowConfetti(false);
    resetGame();
  };

  const toggleCell = async (index: number) => {
    if (!gameStarted) {
      console.log('HomeScreen: Cannot toggle cell - game not started yet');
      return;
    }
    
    if (!currentGame) return;
    
    if (index === 12) {
      console.log('HomeScreen: Cannot toggle FREE SPACE');
      return;
    }
    
    console.log('HomeScreen: Toggling cell', index);
    const newMarkedCells = currentGame.marked_cells.includes(index)
      ? currentGame.marked_cells.filter(i => i !== index)
      : [...currentGame.marked_cells, index];
    
    const updatedGame = {
      ...currentGame,
      marked_cells: newMarkedCells
    };
    
    setCurrentGame(updatedGame);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const bingoCount = countBingos(newMarkedCells);
    console.log('HomeScreen: Current bingo count:', bingoCount);
    
    // Prepare update data - use camelCase for backend
    const updateData: any = {
      markedCells: newMarkedCells,
    };
    
    // Check for pit stops
    if (currentGame.target_bingo_count === 1 && bingoCount >= 1 && currentGame.bingo_count < 1) {
      console.log('HomeScreen: First BINGO achieved!');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCurrentGame({
        ...updatedGame,
        bingo_count: bingoCount,
      });
      
      setNextTarget('3-bingos');
      setShowContinueModal(true);
    } else if (currentGame.target_bingo_count === 3 && bingoCount >= 3 && currentGame.bingo_count < 3) {
      console.log('HomeScreen: 3 BINGOs achieved!');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCurrentGame({
        ...updatedGame,
        bingo_count: bingoCount,
      });
      
      setNextTarget('full-card');
      setShowContinueModal(true);
    } else if (currentGame.target_bingo_count === 25 && newMarkedCells.length === 25 && currentGame.bingo_count < 25) {
      console.log('HomeScreen: Full card completed!');
      updateData.completed = true;
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowConfetti(true);
      if (confettiRef.current) {
        confettiRef.current.start();
      }
      
      await saveGameToHistory(updatedGame, 25);
      
      setShowFullCardModal(true);
    }
    
    // Save game progress to backend
    try {
      if (BACKEND_URL && currentGame.id) {
        console.log('HomeScreen: Saving game progress to backend');
        const saveResponse = await fetch(`${BACKEND_URL}/games/${currentGame.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (!saveResponse.ok) {
          console.error('HomeScreen: Failed to save game progress, status:', saveResponse.status);
        } else {
          console.log('HomeScreen: Game progress saved successfully');
        }
      }
    } catch (error) {
      console.error('HomeScreen: Error saving game progress', error);
      // Don't show error to user, just log it
    }
  };

  const generateNewCard = () => {
    console.log('HomeScreen: Generate new card button pressed');
    
    if (!selectedTemplate) {
      console.error('HomeScreen: No template selected');
      return;
    }
    
    const newPreviewCard = generatePreviewCard(selectedTemplate);
    setPreviewItems(newPreviewCard);
    
    // If game was already started, update the current game with new items
    if (gameStarted && currentGame) {
      const updatedGame = {
        ...currentGame,
        items: newPreviewCard,
        marked_cells: [12], // Reset to only FREE SPACE marked
      };
      setCurrentGame(updatedGame);
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('HomeScreen: New card generated');
  };

  const resetGame = () => {
    console.log('HomeScreen: Resetting game');
    setCurrentGame(null);
    setSelectedTemplate(null);
    setShowTemplateList(true);
    setShowContinueModal(false);
    setShowFullCardModal(false);
    setNextTarget(null);
    setGameStarted(false);
    setPreviewItems([]);
    setShowConfetti(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const deleteCustomTemplate = async (templateId: string, templateName: string) => {
    console.log('HomeScreen: Deleting custom template', templateId, templateName);
    
    Alert.alert(
      'Delete Theme',
      `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('HomeScreen: Delete cancelled');
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!BACKEND_URL) {
                console.error('HomeScreen: BACKEND_URL is not configured');
                Alert.alert('Error', 'Backend URL is not configured');
                return;
              }

              console.log('HomeScreen: Sending delete request to backend');
              const response = await fetch(`${BACKEND_URL}/templates/${templateId}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.error || errorMessage;
                } catch (e) {
                  console.log('HomeScreen: Could not parse error response');
                }
                throw new Error(errorMessage);
              }

              console.log('HomeScreen: Template deleted successfully');
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              // Reload templates to reflect the deletion
              await loadTemplates();
              
              Alert.alert('Success', 'Theme deleted successfully');
            } catch (error) {
              console.error('HomeScreen: Error deleting template', error);
              Alert.alert('Error', 'Failed to delete theme. Please try again.');
            }
          }
        }
      ]
    );
  };

  const deleteActiveGame = async (gameId: string, gameName: string) => {
    console.log('HomeScreen: Deleting active game', gameId, gameName);
    
    Alert.alert(
      'Delete Active Game',
      `Are you sure you want to delete "${gameName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('HomeScreen: Delete cancelled');
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!BACKEND_URL) {
                console.error('HomeScreen: BACKEND_URL is not configured');
                Alert.alert('Error', 'Backend URL is not configured');
                return;
              }

              console.log('HomeScreen: Sending delete request to backend for game', gameId);
              const response = await fetch(`${BACKEND_URL}/games/${gameId}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.error || errorMessage;
                } catch (e) {
                  console.log('HomeScreen: Could not parse error response');
                }
                throw new Error(errorMessage);
              }

              console.log('HomeScreen: Active game deleted successfully from backend');
              
              // Immediately update the UI by removing the game from the list
              setActiveGames(prevGames => {
                const updatedGames = prevGames.filter(game => game.id !== gameId);
                console.log('HomeScreen: Updated active games list, removed game', gameId);
                return updatedGames;
              });
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              Alert.alert('Success', 'Active game deleted successfully');
            } catch (error) {
              console.error('HomeScreen: Error deleting active game', error);
              Alert.alert('Error', 'Failed to delete active game. Please try again.');
            }
          }
        }
      ]
    );
  };

  const copyShareCode = async (templateId: string, templateName: string) => {
    console.log('HomeScreen: Copying share code for template', templateId, templateName);
    
    try {
      if (!BACKEND_URL) {
        console.error('HomeScreen: BACKEND_URL is not configured');
        Alert.alert('Error', 'Backend URL is not configured');
        return;
      }

      // Find the template to get its code
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        console.error('HomeScreen: Template not found');
        Alert.alert('Error', 'Template not found');
        return;
      }

      // Get or generate share code
      let shareCode = (template as any).code;
      
      if (!shareCode) {
        console.log('HomeScreen: Generating share code for template');
        const response = await fetch(`${BACKEND_URL}/templates/${templateId}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        shareCode = data.code;
        console.log('HomeScreen: Share code generated:', shareCode);
      }

      // Copy to clipboard
      await Clipboard.setStringAsync(shareCode);
      console.log('HomeScreen: Share code copied to clipboard:', shareCode);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Code Copied!',
        `Share code "${shareCode}" has been copied to your clipboard. Share it with others so they can add this theme to their app!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('HomeScreen: Error copying share code', error);
      Alert.alert('Error', 'Failed to copy share code. Please try again.');
    }
  };

  const handleShareBingoCard = async () => {
    console.log('HomeScreen: Share button tapped - capturing bingo card with branded background');
    
    if (!shareableCardRef.current) {
      console.error('HomeScreen: Shareable card ref not available');
      Alert.alert('Error', 'Unable to share at this moment. Please try again.');
      return;
    }

    try {
      setIsSharing(true);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      console.log('HomeScreen: Capturing screenshot of bingo card with branded background');
      
      // Add a small delay to ensure the view is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const uri = await captureRef(shareableCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      console.log('HomeScreen: Screenshot captured successfully, URI:', uri);

      const markedCells = gameStarted && currentGame ? currentGame.marked_cells : [12];
      const bingoCount = countBingos(markedCells);
      const progressText = bingoCount === 0 
        ? 'just started' 
        : bingoCount === 1 
        ? 'got 1 BINGO' 
        : `got ${bingoCount} BINGOs`;
      
      const themeName = selectedTemplate?.name || 'Bingo';
      const shareMessage = `Check out my ${themeName} Bingo card! I ${progressText}! 🎉 #BingoMeTis`;

      console.log('HomeScreen: Opening share dialog with message:', shareMessage);

      const result = await Share.share(
        {
          message: shareMessage,
          url: uri,
        },
        {
          dialogTitle: 'Share your Bingo card',
        }
      );

      if (result.action === Share.sharedAction) {
        console.log('HomeScreen: User shared the bingo card successfully');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('HomeScreen: User dismissed the share dialog');
      }

      setIsSharing(false);
    } catch (error: any) {
      console.error('HomeScreen: Error sharing bingo card', error);
      console.error('HomeScreen: Error details:', error.message, error.stack);
      setIsSharing(false);
      Alert.alert('Error', 'Failed to share bingo card. Please try again.');
    }
  };

  const handleInfoPress = () => {
    console.log('HomeScreen: Info button pressed');
    setShowInfoModal(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSendFeedback = () => {
    console.log('HomeScreen: Send feedback option selected');
    setShowInfoModal(false);
    setShowFeedbackModal(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRateApp = async () => {
    console.log('HomeScreen: Rate app option selected');
    setShowInfoModal(false);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const appStoreUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id6739162085',
      android: 'https://play.google.com/store/apps/details?id=com.bingometis.app',
      default: 'https://bingometis.com/'
    });

    try {
      const supported = await Linking.canOpenURL(appStoreUrl);
      if (supported) {
        await Linking.openURL(appStoreUrl);
        console.log('HomeScreen: Opened app store URL');
      } else {
        console.error('HomeScreen: Cannot open app store URL');
        Alert.alert('Error', 'Unable to open app store');
      }
    } catch (error) {
      console.error('HomeScreen: Error opening app store', error);
      Alert.alert('Error', 'Failed to open app store');
    }
  };

  const handleMoreInfo = async () => {
    console.log('HomeScreen: More information option selected');
    setShowInfoModal(false);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const websiteUrl = 'https://bingometis.com/';

    try {
      const supported = await Linking.canOpenURL(websiteUrl);
      if (supported) {
        await Linking.openURL(websiteUrl);
        console.log('HomeScreen: Opened website URL');
      } else {
        console.error('HomeScreen: Cannot open website URL');
        Alert.alert('Error', 'Unable to open website');
      }
    } catch (error) {
      console.error('HomeScreen: Error opening website', error);
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const handleSubmitFeedback = async () => {
    console.log('HomeScreen: Submit feedback button pressed');
    
    const trimmedMessage = feedbackMessage.trim();
    if (!trimmedMessage) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    try {
      setSendingFeedback(true);

      console.log('HomeScreen: Sending feedback to backend');
      const data = await apiPost('/feedback', {
        message: trimmedMessage,
        email: feedbackEmail.trim() || undefined,
      });

      console.log('HomeScreen: Feedback sent successfully', data);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setFeedbackEmail('');
      setSendingFeedback(false);

      Alert.alert('Thank You!', 'Your feedback has been sent successfully.');
    } catch (error) {
      console.error('HomeScreen: Error sending feedback', error);
      setSendingFeedback(false);
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    }
  };

  const handleCancelFeedback = () => {
    console.log('HomeScreen: Cancel feedback button pressed');
    setShowFeedbackModal(false);
    setFeedbackMessage('');
    setFeedbackEmail('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCreateTheme = () => {
    console.log('HomeScreen: Create your own theme tapped');
    
    // Check if user has reached the limit
    const customTemplates = templates.filter(t => t.is_custom);
    if (customTemplates.length >= maxCustomThemes) {
      const limitText = maxCustomThemes.toString();
      Alert.alert(
        'Maximum Custom Themes',
        `${isPremium ? 'You have reached the maximum of' : 'Free users can create up to'} ${limitText} custom themes. ${!isPremium ? 'Upgrade to Premium for up to 30 custom themes!' : 'Please delete one of your existing custom themes to create a new one.'}`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          ...(!isPremium ? [{
            text: 'Upgrade',
            onPress: async () => {
              await showPaywall();
            }
          }] : [])
        ]
      );
      return;
    }
    
    router.push('/create-theme');
  };

  const handleGoPremium = async () => {
    console.log('HomeScreen: Go Premium button tapped - showing Superwall paywall');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Show the Superwall paywall directly
    await showPaywall();
  };

  const toggleCustomThemesExpanded = () => {
    console.log('HomeScreen: Toggling custom themes expanded');
    setCustomThemesExpanded(!customThemesExpanded);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleActiveGamesExpanded = () => {
    console.log('HomeScreen: Toggling active games expanded');
    setActiveGamesExpanded(!activeGamesExpanded);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (loading) {
    const loadingText = "Loading...";
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Top Banner */}
        <View style={styles.topBanner}>
        </View>
        
        <ImageBackground 
          source={defaultBackgroundImage} 
          style={styles.backgroundSection}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (showTemplateList) {
    const customTemplates = templates.filter(t => t.is_custom);
    const hasCustomTemplates = customTemplates.length > 0;
    const hasActiveGames = activeGames.length > 0;
    
    // Determine which custom themes to show
    const displayedCustomThemes = customThemesExpanded || customTemplates.length <= 5 
      ? customTemplates 
      : customTemplates.slice(0, 5);
    
    // Determine which active games to show
    const displayedActiveGames = activeGamesExpanded || activeGames.length <= 5 
      ? activeGames 
      : activeGames.slice(0, 5);
    
    // Get standard templates and filter out old theme names
    const standardTemplates = templates.filter(t => !t.is_custom);
    
    // Filter out old theme names that were renamed
    const filteredStandardTemplates = standardTemplates.filter(template => {
      const isOldTheme = OLD_THEME_NAMES.includes(template.name);
      if (isOldTheme) {
        console.log('HomeScreen: Filtering out old theme name:', template.name);
      }
      return !isOldTheme;
    });
    
    // Deduplicate by name - keep only the first occurrence of each theme name
    const uniqueStandardTemplates = filteredStandardTemplates.reduce((acc: BingoTemplate[], template) => {
      const isDuplicate = acc.some(t => t.name === template.name);
      if (!isDuplicate) {
        acc.push(template);
      } else {
        console.log('HomeScreen: Removing duplicate theme:', template.name);
      }
      return acc;
    }, []);
    
    // Sort according to THEME_ORDER
    const sortedStandardTemplates = uniqueStandardTemplates.sort((a, b) => {
      const indexA = THEME_ORDER.indexOf(a.name);
      const indexB = THEME_ORDER.indexOf(b.name);
      
      // If both are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only a is in the order array, it comes first
      if (indexA !== -1) return -1;
      // If only b is in the order array, it comes first
      if (indexB !== -1) return 1;
      // If neither is in the order array, maintain original order
      return 0;
    });
    
    console.log('HomeScreen: Displaying', sortedStandardTemplates.length, 'unique standard themes');
    
    const customThemesCountText = customTemplates.length.toString();
    const maxCustomThemesText = maxCustomThemes.toString();
    const activeGamesCountText = activeGames.length.toString();
    const maxActiveGamesText = maxActiveGames.toString();
    
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Top Banner */}
        <View style={styles.topBanner}>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={handleInfoPress}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info"
              size={28} 
              color="rgba(255, 255, 255, 0.75)" 
            />
          </TouchableOpacity>
          
          {!isPremium && (
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={handleGoPremium}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="crown.fill" 
                android_material_icon_name="workspace-premium"
                size={24} 
                color="#FFD700" 
              />
              <Text style={styles.premiumButtonText}>Go Premium</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <ImageBackground 
          source={defaultBackgroundImage} 
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
              <Text style={styles.headerSubtitle}>Choose a theme to start playing</Text>
            </View>

            {sortedStandardTemplates.map((template) => {
              const templateKey = template.id;
              return (
                <TouchableOpacity
                  key={templateKey}
                  style={styles.templateCard}
                  onPress={() => handleThemePress(template)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateContent}>
                    <View style={styles.templateHeader}>
                      <Text style={styles.templateName}>{template.name}</Text>
                    </View>
                    {template.description && (
                      <Text style={styles.templateDescription}>{template.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {hasCustomTemplates && (
              <React.Fragment>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Custom themes</Text>
                  <Text style={styles.sectionCount}>{customThemesCountText}</Text>
                  <Text style={styles.sectionCountSeparator}>/</Text>
                  <Text style={styles.sectionCountMax}>{maxCustomThemesText}</Text>
                </View>

                {displayedCustomThemes.map((template) => {
                  const templateKey = template.id;
                  return (
                    <SwipeableCustomTheme
                      key={templateKey}
                      template={template}
                      onPress={() => handleThemePress(template)}
                      onDelete={() => deleteCustomTemplate(template.id, template.name)}
                      onCopyCode={() => copyShareCode(template.id, template.name)}
                    />
                  );
                })}

                {customTemplates.length > 5 && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={toggleCustomThemesExpanded}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandButtonText}>
                      {customThemesExpanded ? 'Show Less' : `Show All (${customThemesCountText})`}
                    </Text>
                    <IconSymbol 
                      ios_icon_name={customThemesExpanded ? "chevron.up" : "chevron.down"}
                      android_material_icon_name={customThemesExpanded ? "expand-less" : "expand-more"}
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                )}
              </React.Fragment>
            )}

            {hasActiveGames && (
              <React.Fragment>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active games</Text>
                  <Text style={styles.sectionCount}>{activeGamesCountText}</Text>
                  <Text style={styles.sectionCountSeparator}>/</Text>
                  <Text style={styles.sectionCountMax}>{maxActiveGamesText}</Text>
                </View>

                {displayedActiveGames.map((game) => {
                  const gameKey = game.id;
                  
                  return (
                    <SwipeableActiveGame
                      key={gameKey}
                      game={game}
                      onPress={() => resumeGame(game)}
                      onDelete={() => deleteActiveGame(game.id, game.template_name)}
                    />
                  );
                })}

                {activeGames.length > 5 && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={toggleActiveGamesExpanded}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandButtonText}>
                      {activeGamesExpanded ? 'Show Less' : `Show All (${activeGamesCountText})`}
                    </Text>
                    <IconSymbol 
                      ios_icon_name={activeGamesExpanded ? "chevron.up" : "chevron.down"}
                      android_material_icon_name={activeGamesExpanded ? "expand-less" : "expand-more"}
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                )}
              </React.Fragment>
            )}

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateTheme}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="plus.circle.fill" 
                android_material_icon_name="add-circle"
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.createButtonText}>Create your own theme</Text>
              {customTemplates.length > 0 && (
                <Text style={styles.createButtonSubtext}>
                  {customThemesCountText}/{maxCustomThemesText} themes used
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => {
                console.log('HomeScreen: Add a theme with a code tapped');
                router.push('/join-game');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="link.circle.fill" 
                android_material_icon_name="link"
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.joinButtonText}>Add a theme with a code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => {
                console.log('HomeScreen: Game History button tapped');
                router.push('/history');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="history"
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.historyButtonText}>Game History</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>

        {/* Ad Banner at bottom for free users */}
        <AdBanner position="bottom" />

        {/* Info Modal */}
        <Modal
          visible={showInfoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Information</Text>
              
              <TouchableOpacity
                style={styles.infoOptionButton}
                onPress={handleSendFeedback}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="envelope.fill" 
                  android_material_icon_name="email"
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.infoOptionText}>Send feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoOptionButton}
                onPress={handleRateApp}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="star.fill" 
                  android_material_icon_name="star"
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.infoOptionText}>Rate this app</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoOptionButton}
                onPress={handleMoreInfo}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="safari.fill" 
                  android_material_icon_name="language"
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.infoOptionText}>More information</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoOptionButton}
                onPress={() => {
                  console.log('HomeScreen: View feedback option selected');
                  setShowInfoModal(false);
                  router.push('/admin-feedback');
                }}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="tray.fill" 
                  android_material_icon_name="inbox"
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.infoOptionText}>View all feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowInfoModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextSecondary}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          visible={showFeedbackModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.feedbackModalContent}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <Text style={styles.feedbackDescription}>
                We&apos;d love to hear from you! Your feedback is anonymous unless you choose to provide your email.
              </Text>
              
              <TextInput
                style={styles.feedbackInput}
                placeholder="Your feedback (required)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                textAlignVertical="top"
              />

              <TextInput
                style={styles.emailInput}
                placeholder="Your email (optional)"
                placeholderTextColor={colors.textSecondary}
                value={feedbackEmail}
                onChangeText={setFeedbackEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.feedbackButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, styles.feedbackCancelButton]}
                  onPress={handleCancelFeedback}
                  activeOpacity={0.7}
                  disabled={sendingFeedback}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, styles.feedbackSubmitButton, sendingFeedback && styles.feedbackSubmitButtonDisabled]}
                  onPress={handleSubmitFeedback}
                  activeOpacity={0.7}
                  disabled={sendingFeedback}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    {sendingFeedback ? 'Sending...' : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  const targetText = currentGame?.target_bingo_count === 1 
    ? 'First Bingo' 
    : currentGame?.target_bingo_count === 3 
    ? '3 Bingos' 
    : 'Full Card';
  
  const continueModalTitle = nextTarget === '3-bingos' 
    ? '🎉 BINGO!' 
    : '🎊 3 BINGOS!';
  
  const continueModalMessage = nextTarget === '3-bingos'
    ? 'Congratulations! Would you like to continue to 3 bingos?'
    : 'Amazing! Would you like to continue to fill the entire card?';
  
  const bannerText = selectedTemplate?.name || '';
  const bannerSubtext = gameStarted ? targetText : 'Preview';
  
  const finishGameButtonText = 'No, Finish Game';
  const shareWithOthersButtonText = 'Share with others';
  const fullCardShareButtonText = 'Share with others';
  const fullCardFinishButtonText = 'Finish Game';
  
  const displayItems = previewItems;
  const displayMarkedCells = gameStarted && currentGame ? currentGame.marked_cells : [12];
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.bannerText}>{bannerText}</Text>
        <Text style={styles.bannerSubtext}>{bannerSubtext}</Text>
      </View>
      
      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundSection}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{x: width / 2, y: 0}}
            autoStart={false}
            ref={confettiRef}
            fadeOut={true}
          />
        )}
        
        <View style={styles.gameContainer}>
          <View style={styles.gameHeader}>
            <TouchableOpacity onPress={resetGame} style={styles.backButton}>
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow-back"
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
            <View style={styles.gameHeaderSpacer} />
            <TouchableOpacity 
              onPress={handleShareBingoCard}
              style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
              disabled={isSharing}
            >
              <IconSymbol 
                ios_icon_name="square.and.arrow.up" 
                android_material_icon_name="share"
                size={24} 
                color={isSharing ? colors.textSecondary : colors.text} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.cardCenterContainer} ref={bingoCardRef} collapsable={false}>
            <View style={styles.bingoGrid}>
              {displayItems.slice(0, 25).map((item, index) => {
                const isMarked = displayMarkedCells.includes(index);
                const isFreeSpace = index === 12;
                const cellKey = index;
                
                // Calculate dynamic font size based on text length - smaller sizes
                const textLength = item.length;
                let calculatedFontSize = 12;
                
                if (textLength <= 8) {
                  calculatedFontSize = 12;
                } else if (textLength <= 15) {
                  calculatedFontSize = 10;
                } else if (textLength <= 25) {
                  calculatedFontSize = 9;
                } else if (textLength <= 35) {
                  calculatedFontSize = 8;
                } else if (textLength <= 50) {
                  calculatedFontSize = 7;
                } else {
                  calculatedFontSize = 6;
                }
                
                return (
                  <TouchableOpacity
                    key={cellKey}
                    style={[
                      styles.bingoCell,
                      isMarked && styles.bingoCellMarked,
                      isFreeSpace && styles.bingoCellFree,
                      !gameStarted && styles.bingoCellDisabled
                    ]}
                    onPress={() => toggleCell(index)}
                    activeOpacity={gameStarted ? 0.7 : 1}
                    disabled={!gameStarted}
                  >
                    {isFreeSpace ? (
                      <Image 
                        source={freeSpaceImage} 
                        style={styles.freeSpaceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text 
                        style={[
                          styles.cellText,
                          { fontSize: calculatedFontSize },
                          isMarked && styles.cellTextMarked
                        ]}
                        numberOfLines={0}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.5}
                      >
                        {item}
                      </Text>
                    )}
                    {isMarked && !isFreeSpace && (
                      <View style={styles.checkMark}>
                        <IconSymbol 
                          ios_icon_name="checkmark.circle.fill" 
                          android_material_icon_name="check-circle"
                          size={24} 
                          color={colors.card} 
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {!gameStarted && (
              <TouchableOpacity
                style={styles.startGameButton}
                onPress={startGame}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="play.circle.fill" 
                  android_material_icon_name="play-circle-filled"
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.startGameButtonText}>Start Game</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.newGameButton}
              onPress={generateNewCard}
              activeOpacity={0.7}
            >
              <IconSymbol 
                ios_icon_name="arrow.clockwise" 
                android_material_icon_name="refresh"
                size={20} 
                color={colors.card} 
              />
              <Text style={styles.newGameButtonText}>Create a New Card</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hidden shareable card with branded background - positioned off-screen */}
        <View style={styles.hiddenShareableCard}>
          <View ref={shareableCardRef} collapsable={false} style={styles.shareableCardContainer}>
            <ImageBackground 
              source={shareBackgroundImage} 
              style={styles.shareableBackground}
              resizeMode="cover"
            >
              <View style={styles.shareableContent}>
                <View style={styles.bingoGrid}>
                  {displayItems.slice(0, 25).map((item, index) => {
                    const isMarked = displayMarkedCells.includes(index);
                    const isFreeSpace = index === 12;
                    const cellKey = `share-${index}`;
                    
                    // Calculate dynamic font size based on text length - smaller sizes
                    const textLength = item.length;
                    let calculatedFontSize = 12;
                    
                    if (textLength <= 8) {
                      calculatedFontSize = 12;
                    } else if (textLength <= 15) {
                      calculatedFontSize = 10;
                    } else if (textLength <= 25) {
                      calculatedFontSize = 9;
                    } else if (textLength <= 35) {
                      calculatedFontSize = 8;
                    } else if (textLength <= 50) {
                      calculatedFontSize = 7;
                    } else {
                      calculatedFontSize = 6;
                    }
                    
                    return (
                      <View
                        key={cellKey}
                        style={[
                          styles.shareableBingoCell,
                          isMarked && styles.shareableBingoCellMarked,
                          isFreeSpace && styles.shareableBingoCellFree
                        ]}
                      >
                        {isFreeSpace ? (
                          <Image 
                            source={freeSpaceImage} 
                            style={styles.freeSpaceImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text 
                            style={[
                              styles.cellText,
                              { fontSize: calculatedFontSize },
                              isMarked && styles.cellTextMarked
                            ]}
                            numberOfLines={0}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.5}
                          >
                            {item}
                          </Text>
                        )}
                        {isMarked && !isFreeSpace && (
                          <View style={styles.checkMark}>
                            <IconSymbol 
                              ios_icon_name="checkmark.circle.fill" 
                              android_material_icon_name="check-circle"
                              size={24} 
                              color={colors.card} 
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Modal for first bingo and 3 bingos */}
        <Modal
          visible={showContinueModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowContinueModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{continueModalTitle}</Text>
              <Text style={styles.modalMessage}>{continueModalMessage}</Text>
              
              <View style={styles.modalButtonsThreeButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => handleContinueResponse(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextSecondary}>{finishGameButtonText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonShare]}
                  onPress={handleShareFromModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextShare}>{shareWithOthersButtonText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => handleContinueResponse(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextPrimary}>Yes, Continue!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal for full card completion */}
        <Modal
          visible={showFullCardModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullCardModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🎊 CONGRATULATIONS! 🎊</Text>
              <Text style={styles.modalMessage}>You completed the entire card! Your game has been saved to history.</Text>
              
              <View style={styles.modalButtonsTwoButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonShare]}
                  onPress={handleShareFromModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextShare}>{fullCardShareButtonText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleFullCardFinish}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextPrimary}>{fullCardFinishButtonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 8,
    padding: 8,
    zIndex: 10,
  },
  premiumButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 60 : 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 10,
  },
  premiumButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  bannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bannerSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  backgroundSection: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Extra padding for ad banner
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  cardCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 100,
  },
  headerSubtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  sectionCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sectionCountSeparator: {
    fontSize: 18,
    color: '#FFFFFF',
    marginHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sectionCountMax: {
    fontSize: 18,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  templateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  templateContent: {
    width: '100%',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  customBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  expandButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  createButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  createButtonSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  gameHeaderSpacer: {
    flex: 1,
  },
  shareButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  bingoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 40,
    maxWidth: 500,
    aspectRatio: 1,
  },
  bingoCell: {
    width: (width - 40) / 5,
    height: (width - 40) / 5,
    maxWidth: 100,
    maxHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  bingoCellMarked: {
    backgroundColor: colors.marked,
    borderColor: colors.marked,
  },
  bingoCellFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: colors.cardBorder,
  },
  bingoCellDisabled: {
    opacity: 0.8,
  },
  shareableBingoCell: {
    width: (width - 40) / 5,
    height: (width - 40) / 5,
    maxWidth: 100,
    maxHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  shareableBingoCellMarked: {
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
    borderColor: 'rgba(76, 175, 80, 0.8)',
  },
  shareableBingoCellFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  cellText: {
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    width: '100%',
    lineHeight: undefined,
  },
  cellTextMarked: {
    color: colors.card,
  },
  freeSpaceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  checkMark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 20,
    gap: 12,
  },
  startGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  startGameButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  newGameButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtonsThreeButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  modalButtonsTwoButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  modalButtonShare: {
    backgroundColor: colors.accent,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.card,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalButtonTextShare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  swipeableContainer: {
    position: 'relative',
    marginBottom: 16,
    height: 'auto',
  },
  leftAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 150,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    zIndex: 1,
  },
  rightAction: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 150,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    zIndex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  shareCodeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  activeGameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activeGameContent: {
    width: '100%',
  },
  activeGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeGameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  activeGameProgress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  hiddenShareableCard: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: width - 40,
    maxWidth: 500,
  },
  shareableCardContainer: {
    width: width - 40,
    maxWidth: 500,
    aspectRatio: 1,
  },
  shareableBackground: {
    width: '100%',
    height: '100%',
  },
  shareableContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  infoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  feedbackModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  feedbackDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  feedbackInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emailInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  feedbackButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackCancelButton: {
    flex: 1,
  },
  feedbackSubmitButton: {
    flex: 1,
  },
  feedbackSubmitButtonDisabled: {
    opacity: 0.5,
  },
});

export default HomeScreen;

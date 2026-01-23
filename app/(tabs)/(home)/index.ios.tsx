
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
  Modal
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

const { width, height } = Dimensions.get('window');
const CELL_SIZE = (width - 80) / 5;

// Get backend URL from app.json configuration
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

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

      {/* Right action - Share Code */}
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

export default function HomeScreen() {
  console.log('HomeScreen: Component mounted');
  
  const router = useRouter();
  const confettiRef = useRef<any>(null);
  const [templates, setTemplates] = useState<BingoTemplate[]>([]);
  const [activeGames, setActiveGames] = useState<BingoGame[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BingoTemplate | null>(null);
  const [currentGame, setCurrentGame] = useState<BingoGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateList, setShowTemplateList] = useState(true);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [nextTarget, setNextTarget] = useState<'3-bingos' | 'full-card' | null>(null);

  const defaultBackgroundImage = resolveImageSource(require('@/assets/images/870c87ab-379a-4f2d-baa7-d28d11e105ff.webp'));
  const kidsBackgroundImage = resolveImageSource(require('@/assets/images/97350fb6-a346-4936-b922-f17f9290a4b1.webp'));
  const thingsKidsDoBackgroundImage = resolveImageSource(require('@/assets/images/7007edc2-3eba-483b-a36f-b7d6ed4e8a9a.jpeg'));
  const officeBackgroundImage = resolveImageSource(require('@/assets/images/dc9f2533-409a-47aa-a3fc-63b6e289409c.webp'));
  const customerServiceBackgroundImage = resolveImageSource(require('@/assets/images/f8a27c83-eb51-4e25-932e-e1787213c1a8.webp'));
  const spousesSighsBackgroundImage = resolveImageSource(require('@/assets/images/dd425792-1c11-465d-94a6-2bd8d928c196.webp'));
  const spousesHeartsBackgroundImage = resolveImageSource(require('@/assets/images/061906c1-46e2-4364-82f3-73e57037d6ae.webp'));
  const datingBackgroundImage = resolveImageSource(require('@/assets/images/278203ca-b0a0-45bc-9a82-12a4e9b06403.webp'));
  const familyGatheringsBackgroundImage = resolveImageSource(require('@/assets/images/0a42377e-c3da-4554-b3eb-e990538d74b1.webp'));
  const selfCareBackgroundImage = resolveImageSource(require('@/assets/images/d43faca0-bba5-4a76-8fed-12d40c226140.webp'));
  
  const isKidsTheme = selectedTemplate?.name === 'Kids';
  const isThingsKidsDoTheme = selectedTemplate?.name === 'Things kids do';
  const isOfficeTheme = selectedTemplate?.name === 'Office';
  const isCustomerServiceTheme = selectedTemplate?.name === 'Customer Service';
  const isSpousesSighsTheme = selectedTemplate?.name === 'Spouses Sighs';
  const isSpousesHeartsTheme = selectedTemplate?.name === 'Spouses Hearts';
  const isDatingTheme = selectedTemplate?.name === 'Dating';
  const isFamilyGatheringsTheme = selectedTemplate?.name === 'Family gatherings';
  const isSelfCareTheme = selectedTemplate?.name === 'Self-care';
  const backgroundImage = isKidsTheme ? kidsBackgroundImage : isThingsKidsDoTheme ? thingsKidsDoBackgroundImage : isOfficeTheme ? officeBackgroundImage : isCustomerServiceTheme ? customerServiceBackgroundImage : isSpousesSighsTheme ? spousesSighsBackgroundImage : isSpousesHeartsTheme ? spousesHeartsBackgroundImage : isDatingTheme ? datingBackgroundImage : isFamilyGatheringsTheme ? familyGatheringsBackgroundImage : isSelfCareTheme ? selfCareBackgroundImage : defaultBackgroundImage;

  // Reload templates and active games when screen comes into focus
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

  const createNewCard = async (template: BingoTemplate) => {
    console.log('HomeScreen: Creating new card with template', template.name);
    console.log('HomeScreen: Template has', template.items.length, 'total options available');
    
    // Check if user already has 5 active games
    if (activeGames.length >= 5) {
      Alert.alert(
        'Maximum Active Games',
        'You can only have 5 games active at the same time. Please complete or delete one of the current ones first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      if (!BACKEND_URL) {
        console.error('HomeScreen: BACKEND_URL is not configured');
        Alert.alert('Error', 'Backend URL is not configured');
        return;
      }

      const shuffledItems = shuffleArray([...template.items]);
      const selectedItems = shuffledItems.slice(0, 24);
      console.log('HomeScreen: Selected 24 random items from shuffled list');
      
      const gameItems = [
        ...selectedItems.slice(0, 12),
        "FREE SPACE",
        ...selectedItems.slice(12, 24)
      ];
      
      console.log('HomeScreen: Bingo card created with FREE SPACE at center (index 12)');
      
      // Create game in backend
      console.log('HomeScreen: Creating game in backend with template ID:', template.id);
      const response = await fetch(`${BACKEND_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendGame = await response.json();
      console.log('HomeScreen: Game created in backend with ID:', backendGame.id);
      
      const newGame: BingoGame = {
        id: backendGame.id,
        template_id: template.id,
        template_name: template.name,
        marked_cells: [12],
        completed: false,
        items: gameItems,
        bingo_count: 0,
        target_bingo_count: 1,
      };
      
      setCurrentGame(newGame);
      setSelectedTemplate(template);
      setShowTemplateList(false);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      console.log('HomeScreen: Game card created and ready to play');
    } catch (error) {
      console.error('HomeScreen: Error creating game', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    }
  };

  const handleThemePress = (template: BingoTemplate) => {
    console.log('HomeScreen: Theme pressed', template.name);
    console.log('HomeScreen: Creating new card directly');
    createNewCard(template);
  };

  const resumeGame = (game: BingoGame) => {
    console.log('HomeScreen: Resuming game', game.id, game.template_name);
    
    const template = templates.find(t => t.id === game.template_id);
    if (template) {
      setSelectedTemplate(template);
    }
    
    setCurrentGame(game);
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

  const toggleCell = async (index: number) => {
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
      
      if (confettiRef.current) {
        confettiRef.current.start();
      }
      
      await saveGameToHistory(updatedGame, 25);
      
      Alert.alert(
        '🎊 CONGRATULATIONS! 🎊',
        'You completed the entire card! Your game has been saved to history.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('HomeScreen: Full card celebration complete');
              resetGame();
            }
          }
        ]
      );
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

  const resetGame = () => {
    console.log('HomeScreen: Resetting game');
    setCurrentGame(null);
    setSelectedTemplate(null);
    setShowTemplateList(true);
    setShowContinueModal(false);
    setNextTarget(null);
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

  if (loading) {
    const loadingText = "Loading...";
    return (
      <ImageBackground 
        source={selfCareBackgroundImage} 
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </ImageBackground>
    );
  }

  if (showTemplateList) {
    const customTemplates = templates.filter(t => t.is_custom);
    const hasCustomTemplates = customTemplates.length > 0;
    const hasActiveGames = activeGames.length > 0;
    
    return (
      <ImageBackground 
        source={defaultBackgroundImage} 
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>Choose a theme to start playing</Text>
          </View>

          {templates.filter(t => !t.is_custom).map((template) => {
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
                <Text style={styles.sectionTitle}>Custom themes and games</Text>
              </View>

              {customTemplates.map((template) => {
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
            </React.Fragment>
          )}

          {hasActiveGames && (
            <React.Fragment>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active games</Text>
              </View>

              {activeGames.map((game) => {
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
            </React.Fragment>
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              console.log('HomeScreen: Create your own theme tapped');
              router.push('/create-theme');
            }}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="plus.circle.fill" 
              android_material_icon_name="add-circle"
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.createButtonText}>Create your own theme</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => {
              console.log('HomeScreen: Add/Join a game with a code tapped');
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
            <Text style={styles.joinButtonText}>Add/Join a game with a code</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
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
  
  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <ConfettiCannon
        count={200}
        origin={{x: width / 2, y: 0}}
        autoStart={false}
        ref={confettiRef}
        fadeOut={true}
      />
      
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
          <View style={styles.gameHeaderText}>
            <Text style={styles.gameTitle}>{currentGame?.template_name}</Text>
            <Text style={styles.gameSubtitle}>{targetText}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              console.log('HomeScreen: Share button tapped');
              Alert.alert('Coming Soon', 'Share functionality will be available soon!');
            }}
            style={styles.shareButton}
          >
            <IconSymbol 
              ios_icon_name="square.and.arrow.up" 
              android_material_icon_name="share"
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardCenterContainer}>
          <View style={styles.bingoGrid}>
            {currentGame?.items?.slice(0, 25).map((item, index) => {
              const isMarked = currentGame.marked_cells.includes(index);
              const isFreeSpace = index === 12;
              const cellKey = index;
              
              return (
                <TouchableOpacity
                  key={cellKey}
                  style={[
                    styles.bingoCell,
                    isMarked && styles.bingoCellMarked,
                    isFreeSpace && styles.bingoCellFree
                  ]}
                  onPress={() => toggleCell(index)}
                  activeOpacity={0.7}
                >
                  {isFreeSpace ? (
                    <View style={styles.freeSpaceContent}>
                      <Text style={styles.freeSpaceText}>FREE</Text>
                    </View>
                  ) : (
                    <Text 
                      style={[
                        styles.cellText,
                        isMarked && styles.cellTextMarked
                      ]}
                      numberOfLines={3}
                      adjustsFontSizeToFit
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
          <TouchableOpacity
            style={styles.newGameButton}
            onPress={() => {
              console.log('HomeScreen: Create new card button tapped - generating new random card');
              if (selectedTemplate) {
                createNewCard(selectedTemplate);
              }
            }}
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
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => handleContinueResponse(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextSecondary}>No, Save Game</Text>
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
    paddingBottom: 100,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
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
    marginTop: 80,
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
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
    color: colors.text,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  gameHeaderText: {
    flex: 1,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  gameSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  bingoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 40,
    maxWidth: 500,
    aspectRatio: 1,
    gap: 4,
  },
  bingoCell: {
    width: (width - 60) / 5,
    height: (width - 60) / 5,
    maxWidth: 96,
    maxHeight: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  bingoCellMarked: {
    backgroundColor: colors.marked,
    borderColor: colors.marked,
  },
  bingoCellFree: {
    backgroundColor: colors.highlight,
    borderColor: colors.highlight,
  },
  cellText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  cellTextMarked: {
    color: colors.card,
  },
  freeSpaceContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeSpaceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
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
});


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
import { Stack, useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import ConfettiCannon from 'react-native-confetti-cannon';

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
}

interface BingoGame {
  id: string;
  template_id: string;
  template_name: string;
  marked_cells: number[];
  completed: boolean;
  items?: string[];
  started_at?: string;
  bingo_count: number;
  target_bingo_count: number;
}

export default function HomeScreen() {
  console.log('HomeScreen: Component mounted');
  
  const router = useRouter();
  const confettiRef = useRef<any>(null);
  const [templates, setTemplates] = useState<BingoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BingoTemplate | null>(null);
  const [currentGame, setCurrentGame] = useState<BingoGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateList, setShowTemplateList] = useState(true);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [nextTarget, setNextTarget] = useState<'3-bingos' | 'full-card' | null>(null);

  const defaultBackgroundImage = resolveImageSource(require('@/assets/images/736a52ec-5262-49f0-8717-ef943252fae5.jpeg'));
  const kidsBackgroundImage = resolveImageSource(require('@/assets/images/5811b5ff-ad72-4560-b1da-ab416d35c209.jpeg'));
  const thingsKidsDoBackgroundImage = resolveImageSource(require('@/assets/images/7007edc2-3eba-483b-a36f-b7d6ed4e8a9a.jpeg'));
  
  const isKidsTheme = selectedTemplate?.name === 'Kids';
  const isThingsKidsDoTheme = selectedTemplate?.name === 'Things kids do';
  const backgroundImage = isKidsTheme ? kidsBackgroundImage : isThingsKidsDoTheme ? thingsKidsDoBackgroundImage : defaultBackgroundImage;

  useEffect(() => {
    console.log('HomeScreen: Loading templates');
    loadTemplates();
  }, []);

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

  const startNewGame = async (template: BingoTemplate) => {
    console.log('HomeScreen: Starting new game with template', template.name);
    console.log('HomeScreen: Template has', template.items.length, 'total options available');
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
        started_at: new Date().toISOString(),
        bingo_count: 0,
        target_bingo_count: 1
      };
      
      setCurrentGame(newGame);
      setSelectedTemplate(template);
      setShowTemplateList(false);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      console.log('HomeScreen: Game started at', newGame.started_at);
    } catch (error) {
      console.error('HomeScreen: Error starting game', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
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
    const startTime = new Date(game.started_at || new Date()).getTime();
    const endTime = new Date().getTime();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    
    console.log('HomeScreen: Game duration:', durationSeconds, 'seconds');
    
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
          marked_cells: game.marked_cells,
          completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedGame = await response.json();
      console.log('HomeScreen: Game saved to history successfully', savedGame.id);
      console.log('HomeScreen: Game completed with', bingoCount, 'bingos in', durationSeconds, 'seconds');
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
    
    // Save game progress to backend
    try {
      if (BACKEND_URL && currentGame.id) {
        console.log('HomeScreen: Saving game progress to backend');
        await fetch(`${BACKEND_URL}/games/${currentGame.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marked_cells: newMarkedCells,
          }),
        });
      }
    } catch (error) {
      console.error('HomeScreen: Error saving game progress', error);
      // Don't show error to user, just log it
    }
    
    const bingoCount = countBingos(newMarkedCells);
    console.log('HomeScreen: Current bingo count:', bingoCount);
    
    if (currentGame.target_bingo_count === 1 && bingoCount >= 1 && currentGame.bingo_count < 1) {
      console.log('HomeScreen: First BINGO achieved!');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCurrentGame({
        ...updatedGame,
        bingo_count: bingoCount
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
        bingo_count: bingoCount
      });
      
      setNextTarget('full-card');
      setShowContinueModal(true);
    } else if (currentGame.target_bingo_count === 25 && newMarkedCells.length === 25 && currentGame.bingo_count < 25) {
      console.log('HomeScreen: Full card completed!');
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

  if (loading) {
    const loadingText = "Loading...";
    return (
      <ImageBackground 
        source={thingsKidsDoBackgroundImage} 
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

          {templates.map((template) => {
            const templateKey = template.id;
            return (
              <TouchableOpacity
                key={templateKey}
                style={styles.templateCard}
                onPress={() => startNewGame(template)}
                activeOpacity={0.7}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  {template.is_custom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </View>
                {template.description && (
                  <Text style={styles.templateDescription}>{template.description}</Text>
                )}
                <View style={styles.templateFooter}>
                  <IconSymbol 
                    ios_icon_name="play.circle.fill" 
                    android_material_icon_name="play-arrow"
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={styles.playText}>Play</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              console.log('HomeScreen: Create custom template tapped');
              Alert.alert('Coming Soon', 'Custom template creation will be available soon!');
            }}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="plus.circle.fill" 
              android_material_icon_name="add-circle"
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.createButtonText}>Create Custom Template</Text>
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

        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => {
            console.log('HomeScreen: New Card button tapped - generating new random card');
            if (selectedTemplate) {
              startNewGame(selectedTemplate);
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
          <Text style={styles.newGameButtonText}>New Card</Text>
        </TouchableOpacity>
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
  templateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    marginBottom: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
  },
  createButtonText: {
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
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
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
});

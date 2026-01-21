
import React, { useState, useEffect } from "react";
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
  ImageSourcePropType
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { KidsOptions } from "@/data/KidsOptions";

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 80) / 5; // 5x5 grid with padding

// Helper to resolve image sources (handles both local require() and remote URLs)
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
}

export default function HomeScreen() {
  console.log('HomeScreen: Component mounted');
  
  const router = useRouter();
  const [templates, setTemplates] = useState<BingoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BingoTemplate | null>(null);
  const [currentGame, setCurrentGame] = useState<BingoGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateList, setShowTemplateList] = useState(true);

  const backgroundImage = resolveImageSource(require('@/assets/images/736a52ec-5262-49f0-8717-ef943252fae5.jpeg'));

  useEffect(() => {
    console.log('HomeScreen: Loading templates');
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('HomeScreen: Fetching templates from API');
      // TODO: Backend Integration - GET /api/bingo/templates
      // Temporary mock data
      const mockTemplates: BingoTemplate[] = [
        {
          id: '1',
          name: 'Office Jargon',
          description: 'Corporate buzzword bingo',
          items: ["Synergy", "Circle Back", "Low-Hanging Fruit", "Think Outside the Box", "Touch Base", "Paradigm Shift", "Leverage", "Bandwidth", "Deep Dive", "Move the Needle", "Best Practice", "Core Competency", "Value Add", "Win-Win", "Game Changer", "Take it Offline", "Drill Down", "Run it Up the Flagpole", "Boil the Ocean", "Drink the Kool-Aid", "Peel the Onion", "Parking Lot", "Ballpark Figure", "Rubber Meets the Road", "Push the Envelope"],
          is_custom: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Kids',
          description: 'Fun things kids love',
          items: KidsOptions,
          is_custom: false,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Customer Service',
          description: 'Classic customer complaints',
          items: ["Can I speak to a manager?", "I want a refund", "This is unacceptable", "I've been waiting forever", "Your website is broken", "I didn't receive my order", "The product is defective", "I was promised...", "I'll take my business elsewhere", "I'm a loyal customer", "This is ridiculous", "I demand compensation", "I'll leave a bad review", "I know the owner", "I'm never shopping here again", "Can you make an exception?", "I need this today", "Why is this so expensive?", "I saw it cheaper elsewhere", "The ad said...", "I lost my receipt", "Can you price match?", "I changed my mind", "This doesn't fit", "I want to speak to corporate"],
          is_custom: false,
          created_at: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
      setLoading(false);
      console.log('HomeScreen: Templates loaded', mockTemplates.length);
    } catch (error) {
      console.error('HomeScreen: Error loading templates', error);
      setLoading(false);
    }
  };

  const startNewGame = async (template: BingoTemplate) => {
    console.log('HomeScreen: Starting new game with template', template.name);
    try {
      // TODO: Backend Integration - POST /api/bingo/games with { template_id: template.id }
      // For now, create a local game
      const newGame: BingoGame = {
        id: Date.now().toString(),
        template_id: template.id,
        template_name: template.name,
        marked_cells: [],
        completed: false,
        items: shuffleArray([...template.items])
      };
      
      setCurrentGame(newGame);
      setSelectedTemplate(template);
      setShowTemplateList(false);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      console.log('HomeScreen: Game started', newGame.id);
    } catch (error) {
      console.error('HomeScreen: Error starting game', error);
      Alert.alert('Error', 'Failed to start game');
    }
  };

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const toggleCell = async (index: number) => {
    if (!currentGame) return;
    
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
    
    // Check for bingo
    if (checkBingo(newMarkedCells)) {
      console.log('HomeScreen: BINGO!');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('🎉 BINGO!', 'Congratulations! You got a bingo!', [
        { text: 'OK', onPress: () => console.log('HomeScreen: Bingo alert dismissed') }
      ]);
      // TODO: Backend Integration - PUT /api/bingo/games/:id with { marked_cells, completed: true }
    }
  };

  const checkBingo = (markedCells: number[]): boolean => {
    // Check rows
    for (let row = 0; row < 5; row++) {
      const rowCells = [row * 5, row * 5 + 1, row * 5 + 2, row * 5 + 3, row * 5 + 4];
      if (rowCells.every(cell => markedCells.includes(cell))) return true;
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      const colCells = [col, col + 5, col + 10, col + 15, col + 20];
      if (colCells.every(cell => markedCells.includes(cell))) return true;
    }
    
    // Check diagonals
    const diagonal1 = [0, 6, 12, 18, 24];
    const diagonal2 = [4, 8, 12, 16, 20];
    if (diagonal1.every(cell => markedCells.includes(cell))) return true;
    if (diagonal2.every(cell => markedCells.includes(cell))) return true;
    
    return false;
  };

  const resetGame = () => {
    console.log('HomeScreen: Resetting game');
    setCurrentGame(null);
    setSelectedTemplate(null);
    setShowTemplateList(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  if (loading) {
    return (
      <ImageBackground 
        source={backgroundImage} 
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </ImageBackground>
    );
  }

  if (showTemplateList) {
    return (
      <ImageBackground 
        source={backgroundImage} 
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
            <Text style={styles.headerTitle}>🎯 Bingo MeTis</Text>
            <Text style={styles.headerSubtitle}>Choose a theme to start playing</Text>
          </View>

          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
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
          ))}

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

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => {
              console.log('HomeScreen: Upload Excel button tapped');
              router.push('/admin-upload');
            }}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="arrow.up.doc.fill" 
              android_material_icon_name="upload"
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.uploadButtonText}>Upload Kids Options (Excel)</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    );
  }

  // Game view
  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.gameScrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.gameSubtitle}>
              {currentGame?.marked_cells.length || 0}
            </Text>
            <Text style={styles.gameSubtitle}> / 25 marked</Text>
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

        <View style={styles.bingoGrid}>
          {currentGame?.items?.map((item, index) => {
            const isMarked = currentGame.marked_cells.includes(index);
            const isFreeSpace = index === 12; // Center cell
            
            return (
              <TouchableOpacity
                key={index}
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

        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => {
            console.log('HomeScreen: New game button tapped');
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
          <Text style={styles.newGameButtonText}>New Game (Same Theme)</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  gameScrollContent: {
    padding: 20,
    paddingBottom: 100,
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
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  uploadButtonText: {
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
  },
  newGameButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.card,
  },
});

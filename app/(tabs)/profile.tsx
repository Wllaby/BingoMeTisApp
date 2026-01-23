
import React, { useState, useEffect } from "react";
import { 
  SafeAreaView 
} from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ImageSourcePropType
} from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

// Get backend URL from app.json configuration
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface GameHistory {
  id: string;
  template_name: string;
  marked_cells: number[];
  completed: boolean;
  completed_at?: string;
  created_at: string;
  bingo_count?: number;
}

export default function HistoryScreen() {
  console.log('HistoryScreen: Component mounted');
  
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultBackgroundImage = resolveImageSource(requireNow I can see the structure. The main page (index.tsx/index.ios.tsx) uses `defaultBackgroundImage` when showing the template list. I need to update the Game History page (profile.tsx/profile.ios.tsx) to use the same background image with an ImageBackground component.

Let me update both profile files to use the same background image as the main page:

<write file="app/(tabs)/profile.tsx">
import React, { useState, useEffect } from "react";
import { 
  SafeAreaView 
} from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ImageSourcePropType
} from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

// Get backend URL from app.json configuration
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface GameHistory {
  id: string;
  template_name: string;
  marked_cells: number[];
  completed: boolean;
  completed_at?: string;
  created_at: string;
  bingo_count?: number;
}

export default function HistoryScreen() {
  console.log('HistoryScreen: Component mounted');
  
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultBackgroundImage = resolveImageSource(require('@/assets/images/870c87ab-379a-4f2d-baa7-d28d11e105ff.webp'));

  useEffect(() => {
    console.log('HistoryScreen: Loading game history');
    loadGameHistory();
  }, []);

  const loadGameHistory = async () => {
    try {
      console.log('HistoryScreen: Fetching game history from API');
      console.log('HistoryScreen: Backend URL:', BACKEND_URL);
      
      if (!BACKEND_URL) {
        console.error('HistoryScreen: BACKEND_URL is not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/games`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('HistoryScreen: Game history loaded from API', data.length);
      
      // Transform backend data to match frontend interface
      const transformedGames: GameHistory[] = data.map((game: any) => ({
        id: game.id,
        template_name: game.templateName || game.template_name,
        marked_cells: game.markedCells || game.marked_cells || [],
        completed: game.completed,
        completed_at: game.completedAt || game.completed_at,
        created_at: game.createdAt || game.created_at,
        bingo_count: game.bingoCount || game.bingo_count,
      }));
      
      // Filter to only show completed games
      const completedGames = transformedGames.filter(game => game.completed);
      console.log('HistoryScreen: Completed games:', completedGames.length);
      
      setGames(completedGames);
      setLoading(false);
    } catch (error) {
      console.error('HistoryScreen: Error loading game history', error);
      Alert.alert('Error', 'Failed to load game history. Please try again.');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBingoCompletionText = (game: GameHistory) => {
    const markedCount = game.marked_cells.length;
    
    // Full card (all 25 cells marked)
    if (markedCount === 25) {
      return 'Full Bingo';
    }
    
    // Use bingo_count if available
    if (game.bingo_count !== undefined && game.bingo_count !== null) {
      if (game.bingo_count >= 3) {
        return '3 Bingo';
      } else if (game.bingo_count >= 1) {
        return '1 Bingo';
      }
    }
    
    // Fallback: calculate bingos from marked_cells
    const bingoCount = countBingos(game.marked_cells);
    if (bingoCount >= 3) {
      return '3 Bingo';
    } else if (bingoCount >= 1) {
      return '1 Bingo';
    }
    
    return '1 Bingo';
  };

  const countBingos = (markedCells: number[]): number => {
    let bingoCount = 0;
    
    // Check rows
    for (let row = 0; row < 5; row++) {
      const rowCells = [row * 5, row * 5 + 1, row * 5 + 2, row * 5 + 3, row * 5 + 4];
      if (rowCells.every(cell => markedCells.includes(cell))) {
        bingoCount++;
      }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      const colCells = [col, col + 5, col + 10, col + 15, col + 20];
      if (colCells.every(cell => markedCells.includes(cell))) {
        bingoCount++;
      }
    }
    
    // Check diagonals
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

  return (
    <ImageBackground 
      source={defaultBackgroundImage} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Game History</Text>
          <Text style={styles.headerSubtitle}>Your past bingo games</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : games.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol 
                ios_icon_name="tray" 
                android_material_icon_name="inbox"
                size={64} 
                color="#FFFFFF" 
              />
              <Text style={styles.emptyText}>No games yet</Text>
              <Text style={styles.emptySubtext}>
                Start playing to see your game history here
              </Text>
            </View>
          ) : (
            <>
              {games.map((game) => {
                const completionText = getBingoCompletionText(game);
                
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={styles.gameCard}
                    onPress={() => {
                      console.log('HistoryScreen: Game card tapped', game.id);
                      Alert.alert('Coming Soon', 'View game details will be available soon!');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.gameCardHeader}>
                      <View style={styles.gameCardTitle}>
                        <Text style={styles.gameCardName}>{game.template_name}</Text>
                        {game.completed && (
                          <View style={styles.completedBadge}>
                            <IconSymbol 
                              ios_icon_name="checkmark.circle.fill" 
                              android_material_icon_name="check-circle"
                              size={16} 
                              color={colors.card} 
                            />
                            <Text style={styles.completedText}>BINGO!</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.gameCardDate}>
                        {formatDate(game.created_at)}
                      </Text>
                    </View>
                    
                    <View style={styles.gameCardStats}>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{completionText}</Text>
                        <Text style={styles.statLabel}>Completion</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  gameCard: {
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
  gameCardHeader: {
    marginBottom: 16,
  },
  gameCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  gameCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bingo,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.card,
  },
  gameCardDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  gameCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

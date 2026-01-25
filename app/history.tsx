
import React, { useState, useEffect } from "react";
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
import { Stack, useRouter } from "expo-router";
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
  
  const router = useRouter();
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
      
      // Sort by completion date (most recent first) and limit to last 10
      const sortedGames = completedGames.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at).getTime();
        const dateB = new Date(b.completed_at || b.created_at).getTime();
        return dateB - dateA;
      });
      
      // Limit to last 10 games
      const last10Games = sortedGames.slice(0, 10);
      console.log('HistoryScreen: Showing last 10 completed games:', last10Games.length);
      
      setGames(last10Games);
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ImageBackground 
        source={defaultBackgroundImage} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="arrow-back"
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Game History</Text>
            <Text style={styles.headerSubtitle}>Your last 10 bingo games</Text>
          </View>
          <View style={styles.headerSpacer} />
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
                  <View
                    key={game.id}
                    style={styles.gameCard}
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
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerSpacer: {
    width: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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

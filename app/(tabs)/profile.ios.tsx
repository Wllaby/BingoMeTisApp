
import React, { useState, useEffect } from "react";
import { 
  SafeAreaView 
} from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

interface GameHistory {
  id: string;
  template_name: string;
  marked_cells: number[];
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export default function HistoryScreen() {
  console.log('HistoryScreen (iOS): Component mounted');
  
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('HistoryScreen (iOS): Loading game history');
    loadGameHistory();
  }, []);

  const loadGameHistory = async () => {
    try {
      console.log('HistoryScreen (iOS): Fetching game history from API');
      // TODO: Backend Integration - GET /api/bingo/games
      const mockGames: GameHistory[] = [];
      setGames(mockGames);
      setLoading(false);
      console.log('HistoryScreen (iOS): Game history loaded', mockGames.length);
    } catch (error) {
      console.error('HistoryScreen (iOS): Error loading game history', error);
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

  return (
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
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No games yet</Text>
            <Text style={styles.emptySubtext}>
              Start playing to see your game history here
            </Text>
          </View>
        ) : (
          <>
            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => {
                  console.log('HistoryScreen (iOS): Game card tapped', game.id);
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
                    <Text style={styles.statValue}>{game.marked_cells.length}</Text>
                    <Text style={styles.statLabel}>Marked</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>
                      {Math.round((game.marked_cells.length / 25) * 100)}%
                    </Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  gameCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    justifyContent: 'space-around',
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.cardBorder,
  },
});

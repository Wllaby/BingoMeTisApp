
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet } from '@/utils/api';

interface Feedback {
  id: string;
  message: string;
  email: string | null;
  createdAt: string;
}

export default function AdminFeedbackScreen() {
  console.log('AdminFeedbackScreen: Component mounted');
  
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      console.log('AdminFeedbackScreen: Loading feedback from API');
      
      const response = await apiGet<any>('/feedback');
      
      // Handle both array and object responses
      const feedbackArray = Array.isArray(response) ? response : (response.feedback || []);
      
      // Transform backend data to match frontend interface
      const transformedFeedback: Feedback[] = feedbackArray.map((item: any) => ({
        id: item.id,
        message: item.message,
        email: item.email,
        createdAt: item.createdAt || item.created_at,
      }));
      
      console.log('AdminFeedbackScreen: Feedback loaded', transformedFeedback.length, 'entries');
      setFeedbackList(transformedFeedback);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('AdminFeedbackScreen: Error loading feedback', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('AdminFeedbackScreen: Refreshing feedback');
    setRefreshing(true);
    loadFeedback();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const headerTitle = 'All Feedback';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading feedback...</Text>
          </View>
        ) : feedbackList.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="tray"
              android_material_icon_name="inbox"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No feedback yet</Text>
            <Text style={styles.emptySubtext}>
              Feedback submitted by users will appear here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Feedback Entries</Text>
              <Text style={styles.headerSubtitle}>
                {feedbackList.length} {feedbackList.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>

            {feedbackList.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.feedbackHeaderLeft}>
                    <IconSymbol
                      ios_icon_name="envelope.fill"
                      android_material_icon_name="email"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.feedbackDate}>
                      {formatDate(feedback.createdAt)}
                    </Text>
                  </View>
                  {feedback.email && (
                    <View style={styles.emailBadge}>
                      <Text style={styles.emailBadgeText}>Has Email</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.feedbackMessage}>{feedback.message}</Text>

                {feedback.email && (
                  <View style={styles.emailContainer}>
                    <IconSymbol
                      ios_icon_name="person.fill"
                      android_material_icon_name="person"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.feedbackEmail}>{feedback.email}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  feedbackCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  feedbackDate: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emailBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emailBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.card,
  },
  feedbackMessage: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  feedbackEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

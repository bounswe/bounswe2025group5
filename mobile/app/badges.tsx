import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { AuthContext } from './_layout';
import { ThemedText } from '@/components/ThemedText';
import { apiUrl } from './apiConfig';
import { useTranslation } from 'react-i18next';

// Badge interface
interface Badge {
  username: string;
  badgeName: string;
}

type ErrorState = { key: string | null; message: string | null };

export default function BadgesScreen() {
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { t } = useTranslation();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ key: null, message: null });

  // Background colors based on theme
  const backgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';

  useEffect(() => {
    const fetchBadges = async () => {
      if (!username) {
        setBadges([]);
        setLoading(false);
        setError({ key: null, message: null });
        return;
      }

      try {
        setLoading(true);
        setError({ key: null, message: null });

        const response = await fetch(apiUrl(`/api/profile/badges?username=${username}`));

        if (!response.ok) {
          // server responded but not OK → show a translated, generic failure with status
          const text = await response.text().catch(() => '');
          throw new Error(`Server error: ${response.status} ${text}`);
        }

        const data = await response.json();
        setBadges(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching badges:', err);
        // network errors often surface as "TypeError: Failed to fetch"
        // follow your earlier pattern: prefer a key when possible
        if (err instanceof Error) {
          if (err.message.startsWith('Server error:')) {
            setError({ key: 'errorBadgesFetchFailed', message: err.message });
          } else {
            // likely network or parsing issue
            setError({ key: 'errorBadgesFetchGeneric', message: null });
          }
        } else {
          setError({ key: 'errorBadgesFetchGeneric', message: null });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [username]);

  // Render each badge item
  const renderBadgeItem = ({ item }: { item: Badge }) => {
    // Array of lively colors for badges
    const badgeColors = [
      '#FF6B6B', // Coral Red
      '#4ECDC4', // Turquoise
      '#FFD166', // Yellow
      '#6A0572', // Purple
      '#1A936F', // Green
      '#3D5A80', // Navy Blue
      '#E76F51', // Orange
      '#8338EC', // Violet
      '#06D6A0', // Mint
      '#EF476F', // Pink
    ];

    // Get color based on badge name to keep it consistent
    const colorIndex = item.badgeName.length % badgeColors.length;
    const badgeColor = badgeColors[colorIndex];

    return (
      <View style={[styles.badgeCard, { backgroundColor: badgeColor }]}>
        <ThemedText style={styles.badgeName}>{item.badgeName}</ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  if (error.key || error.message) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={[styles.errorText, { color: isDarkMode ? '#FF9DA3' : 'red' }]}>
          {t('error')}: {error.key ? t(error.key) : error.message}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {badges.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: textColor }]}>
            {t('noBadgesYet')}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={badges}
          renderItem={renderBadgeItem}
          keyExtractor={(item, index) => `${item.badgeName}-${index}`}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  listContainer: { paddingBottom: 20 },
  row: { flex: 1, justifyContent: 'space-between', marginBottom: 12 },
  badgeCard: {
    padding: 16,
    borderRadius: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontStyle: 'italic' },
  errorText: { textAlign: 'center', marginTop: 20 },
});

import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from 'react-native';
import { AuthContext } from './_layout';
import { ThemedText } from '@/components/ThemedText';
import { apiUrl } from './apiConfig';

// Badge interface
interface Badge {
  username: string;
  badgeName: string;
}


export default function BadgesScreen() {
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Background colors based on theme
  const backgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#2D2D2D' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl(`/api/profile/badges?username=${username}`));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch badges: ${response.status}`);
        }
        
        const data = await response.json();
        setBadges(data);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch badges');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [username]);

  // Render each badge item
  const renderBadgeItem = ({ item, index }: { item: Badge, index: number }) => {
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

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      
      {badges.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>You don't have any badges yet.</ThemedText>
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
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

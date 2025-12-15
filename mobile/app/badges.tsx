import React, { useContext, useState, useEffect, useLayoutEffect} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Image,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from './_layout';
import AccessibleText from '@/components/AccessibleText';

import { useTranslation } from 'react-i18next';
import { apiRequest } from './services/apiClient';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getBadgeImageSource,
  normalizeBadgeTranslationKey,
} from '@/utils/badgeUtils';


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

  const navigation = useNavigation<any>(); 
  const route = useRoute<any>();
  const routeUsername = (route.params?.username as string | undefined) ?? null;
  const targetUsername = routeUsername || username || null;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('myBadges'),
    });
  }, [navigation, t]);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ key: null, message: null });

  // Background colors based on theme
  const backgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';

  useEffect(() => {
    const fetchBadges = async () => {
      if (!targetUsername) {
        setBadges([]);
        setLoading(false);
        setError({ key: null, message: null });
        return;
      }

      try {
        setLoading(true);

        setError({ key: null, message: null });
        const encodedUsername = encodeURIComponent(targetUsername);
        const response = await apiRequest(
          `/api/users/${encodedUsername}/badges?username=${encodedUsername}`
        );
        
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
  }, [targetUsername]);

  // Render each badge item
  const renderBadgeItem = ({ item }: { item: Badge }) => {
    const badgeImage = getBadgeImageSource(item.badgeName);
    const translationKey = normalizeBadgeTranslationKey(item.badgeName);
    const displayName = translationKey ? t(translationKey) : item.badgeName;

    return (
      <View
        style={[
          styles.badgeCard,
          { backgroundColor: isDarkMode ? '#1F2933' : '#FFFFFF' },
        ]}
      >
        <View
          style={[
            styles.badgeImageWrapper,
            { backgroundColor: isDarkMode ? '#111827' : '#F6F8FB' },
          ]}
        >
          {badgeImage ? (
            <Image
              source={badgeImage}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name="medal"
              size={48}
              color={isDarkMode ? '#FBBF24' : '#FB8C00'}
              accessibilityLabel={item.badgeName}
            />
          )}
        </View>
        <AccessibleText
          backgroundColor={isDarkMode ? '#1F2933' : '#FFFFFF'}
          style={[styles.badgeName, { color: textColor }]}
        >
          {displayName}
        </AccessibleText>
        <AccessibleText
          backgroundColor={isDarkMode ? '#1F2933' : '#FFFFFF'}
          style={[styles.badgeDesc, { color: isDarkMode ? '#CBD5E1' : '#4B5563' }]}
          numberOfLines={3}
        >
          {translationKey ? t(`${translationKey}Desc`) : ''}
        </AccessibleText>
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
        <AccessibleText backgroundColor={backgroundColor} style={[styles.errorText, { color: isDarkMode ? '#FF9DA3' : 'red' }]}>
          {t('error')}: {error.key ? t(error.key) : error.message}
        </AccessibleText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {badges.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AccessibleText backgroundColor={backgroundColor} style={[styles.emptyText, { color: textColor }]}> 
            {t('noBadgesYet')}
          </AccessibleText>
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
    padding: 12,
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  badgeImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeImage: {
    width: '80%',
    height: '80%',
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontStyle: 'italic' },
  errorText: { textAlign: 'center', marginTop: 20 },
});
